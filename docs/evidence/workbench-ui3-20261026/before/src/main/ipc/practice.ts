import { randomUUID } from 'node:crypto'
import { ipcMain, type BrowserWindow } from 'electron'
import { z } from 'zod'
import {
  endPracticeSchema,
  navigatePracticeSchema,
  ratePracticeSchema,
  readPracticeSchema,
  revealPracticeSchema,
  saveDraftSchema,
  startPracticeSchema,
} from '../../shared/contracts/practice'
import {
  closeResponseSchema,
  PRACTICE_CHANNELS,
  practiceCommandResultSchema,
  practiceDraftResultSchema,
  practiceEmptyResultSchema,
  practiceReadResultSchema,
} from '../../shared/contracts/practice-desktop'
import type { PracticeService } from '../services/practice/practice'
import { isTrustedRequest } from './trusted-sender'

export function registerPracticeIpc(
  window: BrowserWindow,
  rendererUrl: string,
  service: PracticeService | undefined,
  reportError: (error: unknown) => void,
  closeTimeoutMs = 10_000,
) {
  const contents = window.webContents
  let closed = false
  let ready = false
  let paused = false
  let pending:
    | {
        requestId: string
        promise: Promise<boolean>
        resolve: (saved: boolean) => void
        timer: ReturnType<typeof setTimeout>
      }
    | undefined
  const handled: string[] = []
  const fail = (
    code: 'FORBIDDEN' | 'INVALID_REQUEST' | 'SERVICE_CLOSED' | 'DATABASE_UNAVAILABLE',
    message: string,
  ) => ({ ok: false as const, error: { code, message } })
  function report(error: unknown) {
    try {
      reportError(error instanceof z.ZodError ? new Error('练习桌面接口校验失败。') : error)
    } catch {
      /* 诊断不影响响应或关闭回执。 */
    }
  }
  function settle(saved: boolean) {
    if (!pending) return
    const job = pending
    pending = undefined
    clearTimeout(job.timer)
    job.resolve(saved)
  }
  function handle<T extends z.ZodType>(
    channel: string,
    input: T,
    output: z.ZodType,
    work: (args: z.output<T>) => unknown,
  ) {
    ipcMain.handle(channel, async (event, ...args: unknown[]) => {
      if (!isTrustedRequest(event, window, rendererUrl))
        return fail('FORBIDDEN', '请求来源不受信任。')
      if (closed) return fail('SERVICE_CLOSED', '练习服务已关闭。')
      const parsed = input.safeParse(args)
      if (!parsed.success)
        return fail('INVALID_REQUEST', '练习请求参数无效，请保留输入并重新读取。')
      try {
        return output.parse(await work(parsed.data))
      } catch (error) {
        report(error)
        return fail('DATABASE_UNAVAILABLE', '无法确认练习请求结果，请保留输入并重试原操作。')
      }
    })
    handled.push(channel)
  }
  function business(
    channel: string,
    input: z.ZodType,
    output: z.ZodType,
    work: ((input: unknown) => unknown) | undefined,
  ) {
    handle(channel, z.tuple([input]), output, ([request]) =>
      paused
        ? fail('SERVICE_CLOSED', '正在准备恢复数据，请等待完成。')
        : work
          ? work(request)
          : fail('DATABASE_UNAVAILABLE', '练习服务暂不可用，请检查诊断日志后重启。'),
    )
  }
  business(PRACTICE_CHANNELS.read, readPracticeSchema, practiceReadResultSchema, service?.read)
  business(
    PRACTICE_CHANNELS.start,
    startPracticeSchema,
    practiceCommandResultSchema,
    service?.start,
  )
  business(
    PRACTICE_CHANNELS.saveDraft,
    saveDraftSchema,
    practiceDraftResultSchema,
    service?.saveDraft,
  )
  business(
    PRACTICE_CHANNELS.reveal,
    revealPracticeSchema,
    practiceCommandResultSchema,
    service?.reveal,
  )
  business(
    PRACTICE_CHANNELS.rateAndAdvance,
    ratePracticeSchema,
    practiceCommandResultSchema,
    service?.rateAndAdvance,
  )
  business(
    PRACTICE_CHANNELS.navigate,
    navigatePracticeSchema,
    practiceCommandResultSchema,
    service?.navigate,
  )
  business(PRACTICE_CHANNELS.end, endPracticeSchema, practiceCommandResultSchema, service?.end)
  handle(PRACTICE_CHANNELS.ready, z.tuple([]), practiceEmptyResultSchema, () => {
    ready = true
    return { ok: true, value: null }
  })
  handle(
    PRACTICE_CHANNELS.finishClose,
    z.tuple([closeResponseSchema]),
    practiceEmptyResultSchema,
    ([response]) => {
      if (!pending || response.requestId !== pending.requestId)
        return fail('INVALID_REQUEST', '关闭保存请求已失效。')
      settle(response.saved)
      return { ok: true, value: null }
    },
  )
  function invalidate() {
    ready = false
    settle(false)
  }
  function onNavigation(_event: unknown, _url: string, _inPlace: boolean, isMainFrame: boolean) {
    if (isMainFrame) invalidate()
  }
  contents.on('did-start-navigation', onNavigation)
  contents.on('render-process-gone', invalidate)
  contents.once('destroyed', invalidate)
  return {
    pause() {
      paused = true
    },
    resume() {
      paused = false
      if (!closed && !contents.isDestroyed()) contents.send(PRACTICE_CHANNELS.closeCancelled)
    },
    requestClose(): Promise<boolean> {
      if (pending) return pending.promise
      if (closed) return Promise.resolve(false)
      // 尚无页面输入或页面已被强制销毁；不能据此承诺恢复未提交内容。
      if (!ready || contents.isDestroyed()) return Promise.resolve(true)
      let resolve!: (saved: boolean) => void
      const promise = new Promise<boolean>((done) => {
        resolve = done
      })
      const requestId = randomUUID()
      pending = {
        requestId,
        promise,
        resolve,
        timer: setTimeout(() => settle(false), closeTimeoutMs),
      }
      try {
        contents.send(PRACTICE_CHANNELS.beforeClose, { requestId })
      } catch (error) {
        report(error)
        settle(false)
      }
      return promise
    },
    close() {
      if (closed) return
      closed = true
      settle(false)
      for (const channel of handled) ipcMain.removeHandler(channel)
      contents.removeListener('did-start-navigation', onNavigation)
      contents.removeListener('render-process-gone', invalidate)
      contents.removeListener('destroyed', invalidate)
    },
  }
}
