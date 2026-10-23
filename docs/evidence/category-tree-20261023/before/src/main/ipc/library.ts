import { writeFile } from 'node:fs/promises'
import { isAbsolute } from 'node:path'
import {
  clipboard,
  dialog,
  ipcMain,
  shell,
  type BrowserWindow,
  type IpcMainInvokeEvent,
} from 'electron'
import { z } from 'zod'
import template from '../../../question-banks/templates/专题模板.md?raw'
import {
  answerResultSchema,
  commitImportResultSchema,
  emptyResultSchema,
  favoriteRequestSchema,
  favoriteResultSchema,
  identitySchema,
  LIBRARY_CHANNELS,
  listRequestSchema,
  listResultSchema,
  previewImportResultSchema,
  questionResultSchema,
  versionIdentitySchema,
  type DesktopError,
} from '../../shared/contracts/library-desktop'
import { externalHttpUrl } from '../../shared/contracts/content-urls'
import { previewTokenSchema } from '../../shared/contracts/library-import'
import {
  HISTORY_CHANNELS,
  historyEntryRequestSchema,
  historyEntryResultSchema,
  historyListRequestSchema,
  historyListResultSchema,
} from '../../shared/contracts/history'
import type { LibraryImportService } from '../services/library/library-import'
import {
  LEARNING_CHANNEL,
  learningScopeSchema,
  learningResultSchema,
} from '../../shared/contracts/learning'
import { isTrustedRequest } from './trusted-sender'
import {
  SETTINGS_CHANNELS,
  appearanceSchema,
  settingsResultSchema,
} from '../../shared/contracts/settings'

export function registerLibraryIpc(
  window: BrowserWindow,
  rendererUrl: string,
  service: LibraryImportService | undefined,
  reportError: (error: unknown) => void,
) {
  const contents = window.webContents
  let closed = false
  let paused = false
  let lastToken: string | undefined
  let operation: { controller: AbortController; completion: Promise<unknown> } | undefined
  let closing: Promise<void> | undefined
  const channels = [
    ...Object.values(LIBRARY_CHANNELS),
    ...Object.values(HISTORY_CHANNELS),
    LEARNING_CHANNEL,
    ...Object.values(SETTINGS_CHANNELS),
  ]
  const noArguments = z.tuple([])
  function fail(code: DesktopError['code'], message: string) {
    return { ok: false as const, error: { code, message } }
  }
  const unavailable = () =>
    fail('DATABASE_UNAVAILABLE', '题库服务暂不可用，请检查本地诊断日志后重启。')
  const cancelled = () => fail('IMPORT_CANCELLED', '已取消本次操作。')
  function report(error: unknown) {
    try {
      reportError(error instanceof z.ZodError ? new Error('题库接口数据校验失败。') : error)
    } catch {
      /* 诊断不能覆盖结果。 */
    }
  }
  function forgetPreview() {
    if (lastToken) service?.discard(lastToken)
    lastToken = undefined
  }
  function invalidate() {
    operation?.controller.abort()
    forgetPreview()
  }
  async function abortableDialog<T>(
    open: () => Promise<T>,
    signal: AbortSignal,
    fallback: T,
  ): Promise<T> {
    let onAbort!: () => void
    const aborted = new Promise<T>((resolve) => {
      onAbort = () => resolve(fallback)
    })
    signal.addEventListener('abort', onAbort, { once: true })
    try {
      if (signal.aborted) return fallback
      return await Promise.race([open(), aborted])
    } finally {
      signal.removeEventListener('abort', onAbort)
    }
  }
  async function runOperation(work: (signal: AbortSignal) => Promise<unknown>): Promise<unknown> {
    if (operation) return fail('IMPORT_BUSY', '已有文件选择或准备任务，请等待或取消。')
    const job = { controller: new AbortController(), completion: Promise.resolve<unknown>(null) }
    operation = job
    job.completion = work(job.controller.signal)
    try {
      return await job.completion
    } finally {
      if (operation === job) operation = undefined
    }
  }
  function handle<T extends z.ZodType>(
    channel: string,
    input: T,
    output: z.ZodType,
    action: (args: z.output<T>, event: IpcMainInvokeEvent) => unknown,
    failureMessage?: string,
  ) {
    ipcMain.handle(channel, async (event, ...args: unknown[]) => {
      if (!isTrustedRequest(event, window, rendererUrl))
        return fail('FORBIDDEN', '请求来源不受信任。')
      if (closed) return fail('SERVICE_CLOSED', '题库服务已关闭。')
      if (paused) return fail('SERVICE_CLOSED', '正在准备恢复数据，请等待完成。')
      const parsed = input.safeParse(args)
      if (!parsed.success) return fail('INVALID_REQUEST', '请求参数无效，请刷新页面后重试。')
      try {
        return output.parse(await action(parsed.data, event))
      } catch (error) {
        report(error)
        return failureMessage ? fail('DATABASE_UNAVAILABLE', failureMessage) : unavailable()
      }
    })
  }
  const settingsUnavailable = '显示设置暂不可用，请重试或检查本地诊断日志。'
  handle(
    SETTINGS_CHANNELS.read,
    noArguments,
    settingsResultSchema,
    () =>
      service
        ? { ok: true, value: service.readSettings() }
        : fail('DATABASE_UNAVAILABLE', settingsUnavailable),
    settingsUnavailable,
  )
  handle(
    SETTINGS_CHANNELS.save,
    z.tuple([appearanceSchema]),
    settingsResultSchema,
    ([settings]) =>
      service
        ? { ok: true, value: service.saveSettings(settings) }
        : fail('DATABASE_UNAVAILABLE', settingsUnavailable),
    settingsUnavailable,
  )
  handle(LIBRARY_CHANNELS.previewImport, noArguments, previewImportResultSchema, (_args, event) => {
    if (!service) return unavailable()
    if (operation) return fail('IMPORT_BUSY', '已有文件选择或准备任务。')
    forgetPreview()
    return runOperation(async (signal) => {
      const selected = await abortableDialog(
        () =>
          dialog.showOpenDialog(window, {
            title: '选择题库 Markdown',
            filters: [{ name: 'Markdown 题库', extensions: ['md'] }],
            properties: ['openFile', 'multiSelections'],
          }),
        signal,
        { canceled: true, filePaths: [] },
      )
      if (signal.aborted || selected.canceled || !isTrustedRequest(event, window, rendererUrl))
        return cancelled()
      const result = await service.preview(selected.filePaths, signal)
      if (signal.aborted || !isTrustedRequest(event, window, rendererUrl)) {
        if (result.ok) service.discard(result.value.token)
        return cancelled()
      }
      if (result.ok) lastToken = result.value.token
      return result
    })
  })
  handle(LIBRARY_CHANNELS.cancelImport, noArguments, emptyResultSchema, () => {
    invalidate()
    return { ok: true, value: null }
  })
  handle(
    LIBRARY_CHANNELS.commitImport,
    z.tuple([previewTokenSchema]),
    commitImportResultSchema,
    ([token]) => {
      if (!service) return unavailable()
      if (operation) return fail('IMPORT_BUSY', '请等待文件准备完成。')
      if (token !== lastToken) return fail('INVALID_TOKEN', '预览已失效，请重新预览。')
      return service.commit(token)
    },
  )
  handle(
    LIBRARY_CHANNELS.discardImport,
    z.tuple([previewTokenSchema]),
    emptyResultSchema,
    ([token]) => {
      if (!service) return unavailable()
      if (token !== lastToken) return fail('INVALID_TOKEN', '预览已失效。')
      const result = service.discard(token)
      lastToken = undefined
      return result
    },
  )
  handle(
    LIBRARY_CHANNELS.listQuestions,
    z.tuple([listRequestSchema]),
    listResultSchema,
    ([request]) => (service ? { ok: true, value: service.listQuestions(request) } : unavailable()),
  )
  handle(LEARNING_CHANNEL, z.tuple([learningScopeSchema]), learningResultSchema, ([scope]) =>
    service ? { ok: true, value: service.readLearningSummary(scope) } : unavailable(),
  )
  handle(
    HISTORY_CHANNELS.list,
    z.tuple([historyListRequestSchema]),
    historyListResultSchema,
    ([request]) => {
      if (!service) return unavailable()
      const value = service.listHistory(request)
      return value ? { ok: true, value } : fail('NOT_FOUND', '题目不存在，无法读取历史。')
    },
  )
  handle(
    HISTORY_CHANNELS.getEntry,
    z.tuple([historyEntryRequestSchema]),
    historyEntryResultSchema,
    ([request]) => {
      if (!service) return unavailable()
      const value = service.getHistoryEntry(request)
      return value ? { ok: true, value } : fail('NOT_FOUND', '历史记录不存在，请重新读取。')
    },
  )
  handle(
    LIBRARY_CHANNELS.setFavorite,
    z.tuple([favoriteRequestSchema]),
    favoriteResultSchema,
    ([setting]) => {
      if (!service) return unavailable()
      const value = service.setFavorite(setting)
      return value ? { ok: true, value } : fail('NOT_FOUND', '题目不存在，请刷新题库。')
    },
  )
  handle(
    LIBRARY_CHANNELS.getQuestion,
    z.tuple([identitySchema]),
    questionResultSchema,
    ([identity]) => {
      if (!service) return unavailable()
      const value = service.getQuestion(identity)
      return value ? { ok: true, value } : fail('NOT_FOUND', '题目不存在，请刷新题库。')
    },
  )
  handle(
    LIBRARY_CHANNELS.getAnswer,
    z.tuple([versionIdentitySchema]),
    answerResultSchema,
    ([identity]) => {
      if (!service) return unavailable()
      const value = service.getAnswer(identity)
      return value ? { ok: true, value } : fail('NOT_FOUND', '题目版本不存在，请重新选择题目。')
    },
  )
  handle(LIBRARY_CHANNELS.exportTemplate, noArguments, emptyResultSchema, () =>
    runOperation(async (signal) => {
      const selected = await abortableDialog(
        () =>
          dialog.showSaveDialog(window, {
            title: '导出题库模板',
            defaultPath: '专题模板.md',
            filters: [{ name: 'Markdown', extensions: ['md'] }],
          }),
        signal,
        { canceled: true, filePath: '' },
      )
      if (signal.aborted || selected.canceled) return cancelled()
      if (!selected.filePath || !isAbsolute(selected.filePath))
        return fail('FILE_ERROR', '请选择有效的模板保存位置。')
      try {
        await writeFile(selected.filePath, template, 'utf8')
        return { ok: true, value: null }
      } catch (error) {
        report(error)
        return fail('FILE_ERROR', '模板保存失败，请检查目标目录权限后重试。')
      }
    }),
  )
  handle(
    LIBRARY_CHANNELS.openReference,
    z.tuple([z.string().max(4096)]),
    emptyResultSchema,
    async ([input]) => {
      const url = externalHttpUrl(input)
      if (!url) return fail('INVALID_REQUEST', '仅支持无登录凭据的 HTTP/HTTPS 参考链接。')
      await shell.openExternal(url)
      return { ok: true, value: null }
    },
  )
  handle(
    LIBRARY_CHANNELS.copyCode,
    z.tuple([z.string().max(1_048_576)]),
    emptyResultSchema,
    ([text]) => {
      try {
        clipboard.writeText(text)
        return { ok: true, value: null }
      } catch (error) {
        report(error)
        return fail('FILE_ERROR', '代码复制失败，请重新选择文字后复制。')
      }
    },
  )
  function onNavigation(_event: unknown, _url: string, _inPlace: boolean, isMainFrame: boolean) {
    if (isMainFrame) invalidate()
  }
  contents.on('did-start-navigation', onNavigation)
  contents.on('render-process-gone', invalidate)
  contents.once('destroyed', invalidate)
  return {
    async pause(): Promise<void> {
      paused = true
      invalidate()
      await operation?.completion
    },
    resume() {
      if (!closed) paused = false
    },
    close(): Promise<void> {
      if (closing) return closing
      closed = true
      invalidate()
      for (const channel of channels) ipcMain.removeHandler(channel)
      contents.removeListener('did-start-navigation', onNavigation)
      contents.removeListener('render-process-gone', invalidate)
      contents.removeListener('destroyed', invalidate)
      closing = Promise.resolve(operation?.completion).then(() => {}, report)
      return closing
    },
  }
}
