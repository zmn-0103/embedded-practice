import { writeFile } from 'node:fs/promises'
import { isAbsolute } from 'node:path'
import { randomUUID } from 'node:crypto'
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
import { CATEGORY_CHANNEL, categoryChangeSchema } from '../../shared/contracts/categories'
import { CategoryFault } from '../database/repositories/category-repository'
import {
  PRACTICE_PLAN_CHANNELS,
  practicePlanChangeSchema,
  practicePlanChangeResultSchema,
  practicePlansResultSchema,
} from '../../shared/contracts/practice-plans'
import { PracticePlanFault } from '../database/repositories/practice-plan-repository'
import {
  QUESTION_SET_CHANNELS,
  questionSetChangeSchema,
  questionSetChangeResultSchema,
  questionSetPreviewRequestSchema,
  questionSetPreviewResultSchema,
  questionSetListResultSchema,
} from '../../shared/contracts/question-sets'
import { QuestionSetFault } from '../database/repositories/question-set-repository'
import {
  STUDY_CHANNELS,
  saveNoteSchema,
  readNoteResultSchema,
  saveNoteResultSchema,
  roundListRequestSchema,
  roundListResultSchema,
  roundRequestSchema,
  roundPageResultSchema,
  roundEntryRequestSchema,
  roundEntryResultSchema,
  materialRequestSchema,
  exportMaterialResultSchema,
  type StudyError,
} from '../../shared/contracts/study'
import { StudyFault } from '../database/repositories/study-fault'
import {
  CONTENT_UPDATE_CHANNELS,
  contentVersionsRequestSchema,
  contentComparisonRequestSchema,
  contentVersionsResultSchema,
  contentComparisonResultSchema,
} from '../../shared/contracts/content-updates'
import {
  SETTINGS_CHANNELS,
  appearanceSchema,
  settingsResultSchema,
} from '../../shared/contracts/settings'
import {
  THEME_CHANNELS,
  MAX_THEME_BYTES,
  themeDefinitionSchema,
  themeCatalogResultSchema,
  themePreviewResultSchema,
  themeTokenSchema,
  themeRemoveSchema,
  type ThemePreview,
  type ThemeError,
} from '../../shared/contracts/themes'
import { ThemeFault } from '../database/repositories/theme-repository'
import { readFileSnapshot, SourceFileError } from '../services/resources/read-file-snapshot'

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
  let themePreview: ThemePreview | undefined
  let operation: { controller: AbortController; completion: Promise<unknown> } | undefined
  let closing: Promise<void> | undefined
  const channels = [
    ...Object.values(CONTENT_UPDATE_CHANNELS),
    ...Object.values(STUDY_CHANNELS),
    ...Object.values(QUESTION_SET_CHANNELS),
    ...Object.values(LIBRARY_CHANNELS),
    ...Object.values(HISTORY_CHANNELS),
    LEARNING_CHANNEL,
    ...Object.values(SETTINGS_CHANNELS),
    CATEGORY_CHANNEL,
    ...Object.values(PRACTICE_PLAN_CHANNELS),
    ...Object.values(THEME_CHANNELS),
  ]
  const noArguments = z.tuple([])
  function fail(
    code: DesktopError['code'] | ThemeError['code'] | StudyError['code'],
    message: string,
  ) {
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
    themePreview = undefined
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
        if (error instanceof ThemeFault || error instanceof StudyFault)
          return fail(error.code, error.message)
        report(error)
        return failureMessage ? fail('DATABASE_UNAVAILABLE', failureMessage) : unavailable()
      }
    })
  }
  const settingsUnavailable = '显示设置暂不可用，请重试或检查本地诊断日志。'
  handle(
    CONTENT_UPDATE_CHANNELS.versions,
    z.tuple([contentVersionsRequestSchema]),
    contentVersionsResultSchema,
    ([input]) =>
      service ? { ok: true, value: service.listContentVersions(input) } : unavailable(),
  )
  handle(
    CONTENT_UPDATE_CHANNELS.compare,
    z.tuple([contentComparisonRequestSchema]),
    contentComparisonResultSchema,
    ([input]) =>
      service ? { ok: true, value: service.compareContentVersions(input) } : unavailable(),
  )
  handle(STUDY_CHANNELS.readNote, z.tuple([identitySchema]), readNoteResultSchema, ([input]) =>
    service ? { ok: true, value: service.readNote(input) } : unavailable(),
  )
  handle(STUDY_CHANNELS.saveNote, z.tuple([saveNoteSchema]), saveNoteResultSchema, ([input]) =>
    service ? { ok: true, value: service.saveNote(input) } : unavailable(),
  )
  handle(
    STUDY_CHANNELS.listRounds,
    z.tuple([roundListRequestSchema]),
    roundListResultSchema,
    ([input]) => (service ? { ok: true, value: service.listRounds(input) } : unavailable()),
  )
  handle(
    STUDY_CHANNELS.readRound,
    z.tuple([roundRequestSchema]),
    roundPageResultSchema,
    ([input]) => (service ? { ok: true, value: service.readRound(input) } : unavailable()),
  )
  handle(
    STUDY_CHANNELS.readEntry,
    z.tuple([roundEntryRequestSchema]),
    roundEntryResultSchema,
    ([input]) => (service ? { ok: true, value: service.readRoundEntry(input) } : unavailable()),
  )
  handle(
    STUDY_CHANNELS.exportMaterial,
    z.tuple([materialRequestSchema]),
    exportMaterialResultSchema,
    ([input]) => {
      if (!service) return unavailable()
      if (operation) return fail('BUSY', '已有文件选择或准备任务，请等待完成。')
      const bundle = service.prepareMaterial(input)
      return runOperation(async (signal) => {
        const selected = await abortableDialog(
          () =>
            dialog.showSaveDialog(window, {
              title: '导出复习材料',
              defaultPath: '复习材料.md',
              filters: [{ name: 'Markdown', extensions: ['md'] }],
            }),
          signal,
          { canceled: true, filePath: '' },
        )
        if (signal.aborted || selected.canceled) return fail('CANCELLED', '已取消材料导出。')
        if (!selected.filePath) return fail('INVALID_REQUEST', '请选择材料保存位置。')
        return {
          ok: true,
          value: await service.writeMaterialBundle(bundle, selected.filePath, signal),
        }
      })
    },
  )
  handle(THEME_CHANNELS.list, noArguments, themeCatalogResultSchema, () =>
    service ? { ok: true, value: service.listThemes() } : unavailable(),
  )
  handle(THEME_CHANNELS.preview, noArguments, themePreviewResultSchema, () => {
    if (!service) return unavailable()
    if (operation) return fail('THEME_BUSY', '已有文件选择或准备任务，请等待完成。')
    themePreview = undefined
    return runOperation(async (signal) => {
      const selected = await abortableDialog(
        () =>
          dialog.showOpenDialog(window, {
            title: '安装或更新本地主题',
            filters: [{ name: '刷题本主题包', extensions: ['ep-theme.json'] }],
            properties: ['openFile'],
          }),
        signal,
        { canceled: true, filePaths: [] },
      )
      if (signal.aborted || selected.canceled || !selected.filePaths[0])
        return fail('CANCELLED', '已取消主题导入。')
      const filePath = selected.filePaths[0]
      if (!/\.ep-theme\.json$/i.test(filePath))
        return fail('INVALID_THEME', '请选择扩展名为 .ep-theme.json 的主题包。')
      let definition
      try {
        const bytes = await readFileSnapshot(filePath, MAX_THEME_BYTES)
        definition = themeDefinitionSchema.parse(
          JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)),
        )
      } catch (error) {
        if (error instanceof SourceFileError)
          return fail(
            'FILE_ERROR',
            error.code === 'LIMIT_EXCEEDED'
              ? '主题文件超过 256 KiB 上限。'
              : '无法稳定读取主题文件，请检查文件后重新选择。',
          )
        return fail(
          'INVALID_THEME',
          '主题包不是受支持的 UTF-8 JSON 配置，或包含未知字段、格式版本、非法颜色或布局参数。',
        )
      }
      if (signal.aborted) return fail('CANCELLED', '主题导入已取消。')
      themePreview = {
        token: randomUUID(),
        expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
        definition,
        ...service.inspectTheme(definition),
      }
      return { ok: true, value: themePreview }
    })
  })
  handle(
    THEME_CHANNELS.install,
    z.tuple([themeTokenSchema]),
    themeCatalogResultSchema,
    ([{ token }]) => {
      if (!service) return unavailable()
      if (operation) return fail('THEME_BUSY', '请等待文件准备完成。')
      if (
        !themePreview ||
        token !== themePreview.token ||
        Date.parse(themePreview.expiresAt) <= Date.now()
      )
        return fail('PREVIEW_EXPIRED', '主题预览已失效，请重新选择文件。')
      // 保留凭据供提交后响应丢失时核对/重试；使用预检快照，不再次读取来源文件。
      return { ok: true, value: service.installTheme(themePreview.definition) }
    },
  )
  handle(
    THEME_CHANNELS.uninstall,
    z.tuple([themeRemoveSchema]),
    themeCatalogResultSchema,
    ([{ themeId }]) => {
      if (!service) return unavailable()
      if (operation) return fail('THEME_BUSY', '请等待文件准备完成。')
      return { ok: true, value: service.removeTheme(themeId) }
    },
  )
  handle(PRACTICE_PLAN_CHANNELS.list, noArguments, practicePlansResultSchema, () =>
    service ? { ok: true, value: service.listPracticePlans() } : unavailable(),
  )
  handle(QUESTION_SET_CHANNELS.list, noArguments, questionSetListResultSchema, () =>
    service ? { ok: true, value: service.listQuestionSets() } : unavailable(),
  )
  handle(
    QUESTION_SET_CHANNELS.preview,
    z.tuple([questionSetPreviewRequestSchema]),
    questionSetPreviewResultSchema,
    ([input]) => {
      if (!service) return unavailable()
      try {
        return { ok: true, value: service.previewQuestionSet(input) }
      } catch (error) {
        if (error instanceof QuestionSetFault) return fail(error.code, error.message)
        throw error
      }
    },
  )
  handle(
    QUESTION_SET_CHANNELS.change,
    z.tuple([questionSetChangeSchema]),
    questionSetChangeResultSchema,
    ([input]) => {
      if (!service) return unavailable()
      try {
        service.changeQuestionSet(input)
        return { ok: true, value: null }
      } catch (error) {
        if (error instanceof QuestionSetFault) return fail(error.code, error.message)
        throw error
      }
    },
  )
  handle(
    PRACTICE_PLAN_CHANNELS.change,
    z.tuple([practicePlanChangeSchema]),
    practicePlanChangeResultSchema,
    ([change]) => {
      if (!service) return unavailable()
      try {
        service.changePracticePlan(change)
        return { ok: true, value: null }
      } catch (error) {
        if (error instanceof PracticePlanFault) return fail(error.code, error.message)
        throw error
      }
    },
  )
  handle(CATEGORY_CHANNEL, z.tuple([categoryChangeSchema]), emptyResultSchema, ([change]) => {
    if (!service) return unavailable()
    try {
      service.updateCategory(change)
      return { ok: true, value: null }
    } catch (error) {
      if (error instanceof CategoryFault) return fail(error.code, error.message)
      throw error
    }
  })
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
