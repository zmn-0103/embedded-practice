import { isMainThread, parentPort, threadId, workerData } from 'node:worker_threads'
import { prepareImport } from '../services/library/prepare-import'
import { importWorkerRequestSchema, workerFailure, type ImportWorkerReply } from './import-protocol'

if (isMainThread || parentPort === null) {
  throw new Error('导入工作入口只能在后台工作线程中运行。')
}
const port = parentPort

async function prepare(): Promise<void> {
  try {
    const request = importWorkerRequestSchema.safeParse(workerData as unknown)
    const result = request.success
      ? await prepareImport(request.data.filePaths)
      : workerFailure('WORKER_FAILED', '后台任务请求无效，请重新选择文件。')
    const reply: ImportWorkerReply = { version: 1, threadId, result }
    const buffers = new Set<ArrayBuffer>()
    if (result.ok) {
      for (const resource of result.value.resources) {
        const buffer = resource.bytes.buffer
        if (!(buffer instanceof ArrayBuffer)) throw new Error('图片必须使用可转移的自有缓冲区。')
        buffers.add(buffer)
      }
    }
    // 来源读取使用 Buffer.alloc，自有缓冲区不会转移 Node 的共享缓冲池。
    port.postMessage(reply, [...buffers])
  } finally {
    port.close()
  }
}

void prepare().catch((error: unknown) => {
  // 交给 Worker error 事件，主进程记录本地诊断，业务结果不携带堆栈。
  process.nextTick(() => {
    throw error
  })
})
