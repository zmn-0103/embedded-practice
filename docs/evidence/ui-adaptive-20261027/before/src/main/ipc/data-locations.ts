import { lstat, mkdir, realpath } from 'node:fs/promises'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { ipcMain, shell, type BrowserWindow, type IpcMainInvokeEvent } from 'electron'
import { z } from 'zod'
import {
  DATA_LOCATION_CHANNELS,
  dataLocationsResultSchema,
  directoryTargetSchema,
  type DataLocationError,
  type DirectoryOpenResult,
} from '../../shared/contracts/data-locations'
import { isTrustedRequest } from './trusted-sender'

export function registerDataLocationsIpc(
  window: BrowserWindow,
  rendererUrl: string,
  dataDirectory: string,
  reportError: (error: unknown) => void,
) {
  if (!isAbsolute(dataDirectory)) throw new Error('数据位置需要绝对目录。')
  const directory = resolve(dataDirectory)
  const contents = window.webContents
  const locations = {
    dataDirectory: directory,
    backupDirectory: join(directory, 'backups'),
    logDirectory: join(directory, 'logs'),
    logFile: join(directory, 'logs', 'application.log'),
  }
  let closed = false
  let paused = false
  let generation = 0
  let pending: Promise<DirectoryOpenResult> | undefined
  let closing: Promise<void> | undefined
  const fail = (code: DataLocationError['code'], message: string) => ({
    ok: false as const,
    error: { code, message },
  })
  const unavailable = () =>
    fail('SERVICE_CLOSED', '数据位置操作已停止，请等待恢复完成或重新打开页面。')
  function report() {
    try {
      reportError(new Error('本地数据位置操作失败。'))
    } catch {
      /* 诊断不覆盖窗口反馈，也不记录系统返回的任意内容。 */
    }
  }
  function allowed(event: IpcMainInvokeEvent, epoch: number) {
    return (
      !closed && !paused && generation === epoch && isTrustedRequest(event, window, rendererUrl)
    )
  }
  ipcMain.handle(DATA_LOCATION_CHANNELS.read, (event, ...args: unknown[]) => {
    if (!isTrustedRequest(event, window, rendererUrl))
      return fail('FORBIDDEN', '请求来源不受信任。')
    if (closed || paused) return unavailable()
    if (!z.tuple([]).safeParse(args).success)
      return fail('INVALID_REQUEST', '读取数据位置不接受参数。')
    try {
      // 只返回本进程实际配置，不访问数据库，也不为一次读取建立目录。
      return dataLocationsResultSchema.parse({ ok: true, value: locations })
    } catch {
      report()
      return fail('FILE_ERROR', '无法读取数据位置，请重试或检查本地诊断日志。')
    }
  })
  ipcMain.handle(DATA_LOCATION_CHANNELS.open, (event, ...args: unknown[]) => {
    if (!isTrustedRequest(event, window, rendererUrl))
      return fail('FORBIDDEN', '请求来源不受信任。')
    if (closed || paused) return unavailable()
    const input = z.tuple([directoryTargetSchema]).safeParse(args)
    if (!input.success) return fail('INVALID_REQUEST', '只能打开固定的数据、备份或日志文件夹。')
    if (pending) return fail('LOCATION_BUSY', '正在打开文件夹，请等待完成。')
    const epoch = generation
    const target = input.data[0]
    const job = (async (): Promise<DirectoryOpenResult> => {
      try {
        const root = await realpath(directory)
        if (!allowed(event, epoch)) return unavailable()
        const folder = target === 'data' ? root : join(root, target)
        if (target !== 'data') {
          // 只建立固定子目录；父数据目录丢失时停止，不递归重建数据位置。
          await mkdir(folder).catch((error: unknown) => {
            if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) throw error
          })
          if (!allowed(event, epoch)) return unavailable()
        }
        const entry = await lstat(folder)
        if (!allowed(event, epoch)) return unavailable()
        if (!entry.isDirectory() || entry.isSymbolicLink()) throw new Error('目标不是独立文件夹。')
        const actual = await realpath(folder)
        if (relative(folder, actual) !== '') throw new Error('文件夹位置发生变化。')
        if (!allowed(event, epoch)) return unavailable()
        const error = await shell.openPath(actual)
        if (!allowed(event, epoch)) return unavailable()
        if (error !== '') throw new Error('系统未能打开文件夹。')
        return { ok: true, value: null }
      } catch {
        if (!allowed(event, epoch)) return unavailable()
        report()
        return fail('FILE_ERROR', '无法打开文件夹，请检查目录是否可用及访问权限后重试。')
      }
    })()
    pending = job
    return job.finally(() => {
      if (pending === job) pending = undefined
    })
  })
  function invalidate() {
    generation++
  }
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
      await pending
    },
    resume() {
      if (!closed) paused = false
    },
    close(): Promise<void> {
      closed = true
      invalidate()
      closing ??= (async () => {
        for (const channel of Object.values(DATA_LOCATION_CHANNELS)) ipcMain.removeHandler(channel)
        contents.removeListener('did-start-navigation', onNavigation)
        contents.removeListener('render-process-gone', invalidate)
        contents.removeListener('destroyed', invalidate)
        await pending
      })()
      return closing
    },
  }
}
