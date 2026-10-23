import { isAbsolute } from 'node:path'
import { dialog, ipcMain, type BrowserWindow } from 'electron'
import { z } from 'zod'
import {
  BACKUP_CHANNELS,
  backupResultSchema,
  backupPreviewResultSchema,
  restoreRequestSchema,
  restoreResultSchema,
  type BackupError,
  type BackupPreview,
  type BackupPreviewResult,
  type BackupResult,
  type RestoreResult,
} from '../../shared/contracts/backup'
import type { BackupService } from '../services/backup/backup'
import { BackupFault } from '../services/backup/validate-backup'
import { isTrustedRequest } from './trusted-sender'

export function registerBackupIpc(
  window: BrowserWindow,
  rendererUrl: string,
  service: BackupService | undefined,
  reportError: (error: unknown) => void,
  restore?: (token: string) => Promise<{ protectionPath: string }>,
) {
  const contents = window.webContents
  const noArguments = z.tuple([])
  let closed = false
  let pending: Promise<BackupResult | BackupPreviewResult | RestoreResult> | undefined
  let lastPreview: BackupPreview | undefined
  let generation = 0
  let selection: AbortController | undefined
  let closing: Promise<void> | undefined
  const fail = (code: BackupError['code'], message: string) => ({
    ok: false as const,
    error: { code, message },
  })
  const cancelled = () => fail('CANCELLED', '已取消本次备份操作。')
  async function choose<T>(work: () => Promise<T>, fallback: T): Promise<T> {
    const controller = new AbortController()
    selection = controller
    let abort!: () => void
    const stopped = new Promise<T>((resolve) => {
      abort = () => resolve(fallback)
    })
    controller.signal.addEventListener('abort', abort, { once: true })
    try {
      return await Promise.race([work(), stopped])
    } finally {
      controller.signal.removeEventListener('abort', abort)
      if (selection === controller) selection = undefined
    }
  }
  for (const operation of ['export', 'preview', 'restore'] as const) {
    ipcMain.handle(BACKUP_CHANNELS[operation], (event, ...args: unknown[]) => {
      if (!isTrustedRequest(event, window, rendererUrl))
        return fail('FORBIDDEN', '请求来源不受信任。')
      if (closed) return fail('SERVICE_CLOSED', '备份服务已关闭。')
      const request =
        operation === 'restore' ? z.tuple([restoreRequestSchema]).safeParse(args) : undefined
      if (operation === 'restore' ? !request?.success : !noArguments.safeParse(args).success)
        return fail('INVALID_REQUEST', '备份操作不接受路径或其他参数，请从窗口选择文件。')
      if (!service) return fail('DATABASE_UNAVAILABLE', '本地数据不可用，无法执行备份操作。')
      if (pending) return fail('BACKUP_BUSY', '已有备份操作，请等待完成或取消文件选择。')
      const epoch = generation
      const job = (async (): Promise<BackupResult | BackupPreviewResult | RestoreResult> => {
        try {
          if (operation === 'restore') {
            const token = request?.success ? request.data[0].token : ''
            if (!restore || !lastPreview || token !== lastPreview.token)
              return fail('PREVIEW_EXPIRED', '恢复预览已失效，请重新选择备份并校验。')
            const selected = lastPreview
            const choice = await choose(
              () =>
                dialog.showMessageBox(window, {
                  type: 'warning',
                  title: '确认恢复完整备份',
                  message: '恢复将替换当前题库、学习记录、练习进度和显示设置，并重启应用。',
                  detail: `备份：${selected.filePath}\n题目：${selected.summary.questions}，图片：${selected.summary.images}\n备份时间：${selected.summary.createdAt ?? '未知（旧备份）'}\n程序将先保存待保存内容并创建当前数据的保护性备份。保护失败时停止恢复。`,
                  buttons: ['取消', '创建保护备份并恢复'],
                  defaultId: 0,
                  cancelId: 0,
                  noLink: true,
                }),
              { response: 0, checkboxChecked: false },
            )
            if (
              choice.response !== 1 ||
              closed ||
              epoch !== generation ||
              !isTrustedRequest(event, window, rendererUrl)
            )
              return cancelled()
            const value = await restore(token)
            lastPreview = undefined
            return restoreResultSchema.parse({ ok: true, value })
          }
          lastPreview = undefined
          await service.discardPreview()
          if (closed || epoch !== generation || !isTrustedRequest(event, window, rendererUrl))
            return cancelled()
          let path: string | undefined
          if (operation === 'export') {
            const chosen = await choose(
              () =>
                dialog.showSaveDialog(window, {
                  title: '导出完整备份',
                  defaultPath: `嵌入式刷题本-备份-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite3`,
                  filters: [{ name: '完整数据备份', extensions: ['sqlite3'] }],
                }),
              { canceled: true, filePath: '' },
            )
            if (chosen.canceled) return cancelled()
            path = chosen.filePath
          } else {
            const chosen = await choose(
              () =>
                dialog.showOpenDialog(window, {
                  title: '选择备份并预览',
                  filters: [{ name: '数据备份', extensions: ['sqlite3', 'sqlite', 'db'] }],
                  properties: ['openFile'],
                }),
              { canceled: true, filePaths: [] },
            )
            if (chosen.canceled || chosen.filePaths.length !== 1) return cancelled()
            path = chosen.filePaths[0]
          }
          if (closed || !isTrustedRequest(event, window, rendererUrl)) return cancelled()
          if (!path || !isAbsolute(path)) return fail('FILE_ERROR', '请选择有效的备份文件位置。')
          const value = await service[operation](path)
          if (operation === 'preview') {
            if (closed || epoch !== generation || !isTrustedRequest(event, window, rendererUrl)) {
              await service.discardPreview()
              return cancelled()
            }
            const result = backupPreviewResultSchema.parse({ ok: true, value })
            if (result.ok) lastPreview = result.value
            return result
          }
          return backupResultSchema.parse({ ok: true, value })
        } catch (error) {
          if (error instanceof BackupFault) return fail(error.code, error.message)
          // 非法备份可能含任意内容，不把校验对象或原文写入日志。
          try {
            reportError(new Error(`备份操作 ${operation} 失败。`))
          } catch {
            /* 诊断失败不覆盖用户反馈。 */
          }
          if (operation === 'restore')
            return fail('RESTORE_FAILED', '恢复未完成，原数据保留。请重新预览并检查保护性备份。')
          return operation === 'export'
            ? fail(
                'EXPORT_FAILED',
                '备份导出失败。请检查目标目录权限和磁盘空间后重试，原数据及已有备份保留。',
              )
            : fail(
                'INVALID_BACKUP',
                '无法读取完整备份。请检查文件权限、文件完整性及结构兼容性后重新选择。',
              )
        }
      })()
      pending = job
      return job.finally(() => {
        if (pending === job) pending = undefined
      })
    })
  }
  function invalidate() {
    generation++
    lastPreview = undefined
    selection?.abort()
    void service?.discardPreview().catch(() => {})
  }
  function onNavigation(_event: unknown, _url: string, _inPlace: boolean, isMainFrame: boolean) {
    if (isMainFrame) invalidate()
  }
  contents.on('did-start-navigation', onNavigation)
  contents.on('render-process-gone', invalidate)
  contents.once('destroyed', invalidate)
  return {
    close(): Promise<void> {
      closed = true
      invalidate()
      closing ??= (async () => {
        for (const channel of Object.values(BACKUP_CHANNELS)) ipcMain.removeHandler(channel)
        contents.removeListener('did-start-navigation', onNavigation)
        contents.removeListener('render-process-gone', invalidate)
        contents.removeListener('destroyed', invalidate)
        await pending
      })()
      return closing
    },
  }
}
