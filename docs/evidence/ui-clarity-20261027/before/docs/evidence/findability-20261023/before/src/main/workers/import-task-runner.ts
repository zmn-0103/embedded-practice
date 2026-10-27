import type { EventEmitter } from 'node:events'
import type { Worker } from 'node:worker_threads'
import type { PrepareImportResult } from '../../shared/contracts/import-snapshot'
import {
  importWorkerReplySchema,
  importWorkerRequestSchema,
  workerFailure,
} from './import-protocol'

export type ImportWorker = Pick<EventEmitter, 'on' | 'once' | 'removeListener'> &
  Pick<Worker, 'threadId' | 'terminate' | 'unref'>
type SpawnWorker = (filePaths: string[]) => ImportWorker
type ReportError = (error: unknown) => void

interface ImportTask {
  readonly completion: Promise<PrepareImportResult>
  readonly stopFailed: boolean
  cancel(): void
}

function startTask(
  filePaths: string[],
  spawn: SpawnWorker,
  reportError: ReportError,
  timeoutMs: number,
  signal: AbortSignal | undefined,
): ImportTask {
  let resolveResult!: (result: PrepareImportResult) => void
  const completion = new Promise<PrepareImportResult>((resolve) => {
    resolveResult = resolve
  })
  let worker: ImportWorker | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let finishing = false
  let stopFailed = false

  function report(error: unknown): void {
    try {
      reportError(error)
    } catch {
      /* 诊断失败不能阻止线程清理。 */
    }
  }

  async function finish(result: PrepareImportResult): Promise<void> {
    if (finishing) return
    finishing = true
    clearTimeout(timer)
    signal?.removeEventListener('abort', cancel)
    try {
      if (worker) await worker.terminate()
    } catch (error) {
      stopFailed = true
      report(error)
      result = workerFailure('WORKER_FAILED', '后台任务未能安全停止，请重新启动应用。')
      try {
        worker?.unref()
      } catch (unrefError) {
        report(unrefError)
      }
    } finally {
      worker?.removeListener('message', onMessage)
      worker?.removeListener('exit', onExit)
      if (!stopFailed) worker?.removeListener('error', onError)
      resolveResult(result)
    }
  }

  function cancel(): void {
    void finish(workerFailure('WORKER_CANCELLED', '已取消本次文件准备。'))
  }
  function onError(error: unknown): void {
    if (finishing) return
    report(error)
    void finish(workerFailure('WORKER_FAILED', '后台文件准备失败，请重试或检查本地诊断日志。'))
  }
  function onExit(): void {
    void finish(workerFailure('WORKER_FAILED', '后台任务提前退出，未返回完整结果，请重试。'))
  }
  let expectedThreadId = -1
  function onMessage(message: unknown): void {
    if (finishing) return
    try {
      const reply = importWorkerReplySchema.safeParse(message)
      if (!reply.success || reply.data.threadId !== expectedThreadId) {
        void finish(workerFailure('WORKER_FAILED', '后台任务返回了无效结果，请重试。'))
        return
      }
      void finish(reply.data.result)
    } catch (error) {
      onError(error)
    }
  }

  if (signal?.aborted) cancel()
  else {
    try {
      worker = spawn(filePaths)
      expectedThreadId = worker.threadId
      worker.once('message', onMessage)
      worker.on('error', onError)
      worker.once('exit', onExit)
      timer = setTimeout(() => {
        void finish(workerFailure('WORKER_TIMEOUT', '后台文件准备超时，请减少本批文件后重试。'))
      }, timeoutMs)
      signal?.addEventListener('abort', cancel, { once: true })
      if (signal?.aborted) cancel()
    } catch (error) {
      onError(error)
    }
  }
  return {
    completion,
    cancel,
    get stopFailed() {
      return stopFailed
    },
  }
}

export function createImportTaskRunner(
  spawn: SpawnWorker,
  reportError: ReportError,
  timeoutMs = 120_000,
) {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2_147_483_647)
    throw new Error('任务期限必须为 1～2147483647 的整毫秒。')
  let closed = false
  let active: ImportTask | undefined

  return {
    async prepare(
      filePaths: readonly string[],
      signal?: AbortSignal,
    ): Promise<PrepareImportResult> {
      if (closed) return workerFailure('WORKER_CANCELLED', '文件准备服务已关闭。')
      if (active) return workerFailure('IMPORT_BUSY', '已有文件准备任务，请等待完成或先取消。')
      const request = importWorkerRequestSchema.safeParse({ version: 1, filePaths })
      if (!request.success)
        return workerFailure('FILE_UNREADABLE', '请选择有效的 Markdown 绝对路径。')
      const task = startTask(request.data.filePaths, spawn, reportError, timeoutMs, signal)
      active = task
      try {
        return await task.completion
      } finally {
        if (task.stopFailed) closed = true
        if (active === task) active = undefined
      }
    },
    async close(): Promise<void> {
      closed = true
      const task = active
      task?.cancel()
      await task?.completion
    },
  }
}
