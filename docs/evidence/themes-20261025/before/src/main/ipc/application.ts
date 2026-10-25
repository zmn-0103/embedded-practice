import { ipcMain, type BrowserWindow } from 'electron'
import { z } from 'zod'
import {
  APP_STATUS_CHANNEL,
  appStatusResultSchema,
  type AppStatusResult,
} from '../../shared/contracts/application'
import { isTrustedRequest } from './trusted-sender'

const noArgumentsSchema = z.tuple([])

export function registerApplicationIpc(
  window: BrowserWindow,
  rendererUrl: string,
  readStatus: () => AppStatusResult,
  reportError: (error: unknown) => void,
): () => void {
  ipcMain.handle(APP_STATUS_CHANNEL, (event, ...args: unknown[]): AppStatusResult => {
    if (!isTrustedRequest(event, window, rendererUrl)) {
      return { ok: false, error: { code: 'FORBIDDEN', message: '请求来源不受信任。' } }
    }

    if (!noArgumentsSchema.safeParse(args).success) {
      return { ok: false, error: { code: 'INVALID_REQUEST', message: '此请求不接受参数。' } }
    }

    try {
      return appStatusResultSchema.parse(readStatus())
    } catch (error) {
      reportError(error)
      return {
        ok: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: '无法读取本地数据，请检查数据目录权限或诊断日志后重新启动。',
        },
      }
    }
  })

  return () => ipcMain.removeHandler(APP_STATUS_CHANNEL)
}
