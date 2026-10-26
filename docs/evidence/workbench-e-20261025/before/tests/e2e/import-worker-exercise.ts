import type { Worker, WorkerOptions } from 'node:worker_threads'
import type { ImportPreparationService } from '../../src/main/services/library/import-preparation'
import type { PrepareImportResult } from '../../src/shared/contracts/import-snapshot'

interface ExerciseInput {
  mode: 'snapshot' | 'controls' | 'shutdown'
  directory: string
  filePaths: string[]
}

// 整个函数由 Playwright 在 Electron 主进程执行，不能捕获测试进程的值。
export async function exerciseImportWorker(
  { app }: Pick<typeof import('electron'), 'app'>,
  input: ExerciseInput,
) {
  const path = process.getBuiltinModule('node:path')
  const fs = process.getBuiltinModule('node:fs')
  const files = process.getBuiltinModule('node:fs/promises')
  const crypto = process.getBuiltinModule('node:crypto')
  const threads: { Worker: typeof Worker; threadId: number } =
    process.getBuiltinModule('node:worker_threads')
  const loadModule = process
    .getBuiltinModule('node:module')
    .createRequire(path.join(app.getAppPath(), 'worker-test.cjs'))
  const candidates = [
    path.join(app.getAppPath(), 'out/main/import-preparation.js'),
    path.join(app.getAppPath(), 'import-preparation.js'),
  ]
  const modulePath = candidates.find((candidate) => fs.existsSync(candidate))
  if (!modulePath) throw new Error('未找到已构建的导入服务模块。')
  const built = loadModule(modulePath) as {
    createImportPreparationService(
      report: (error: unknown) => void,
      timeoutMs?: number,
    ): ImportPreparationService
  }
  const originalWorker = threads.Worker
  const createdThreadIds: number[] = []
  const exitedThreadIds: number[] = []
  const errors: string[] = []
  const services: ImportPreparationService[] = []
  threads.Worker = class extends originalWorker {
    constructor(filename: string | URL, options?: WorkerOptions) {
      super(filename, options)
      const id = this.threadId
      createdThreadIds.push(id)
      this.once('exit', () => exitedThreadIds.push(id))
    }
  }
  function service(timeoutMs?: number): ImportPreparationService {
    const instance = built.createImportPreparationService(
      (error) => errors.push(error instanceof Error ? error.message : String(error)),
      timeoutMs,
    )
    services.push(instance)
    return instance
  }
  function code(result: PrepareImportResult): string {
    return result.ok ? 'OK' : (result.issues[0]?.code ?? 'NO_ERROR')
  }
  let details: Record<string, unknown> = {}
  try {
    if (input.mode === 'snapshot') {
      const runner = service()
      let pulses = 0
      const timer = setInterval(() => {
        pulses++
      }, 1)
      let result: PrepareImportResult
      try {
        result = await runner.prepare(input.filePaths)
      } finally {
        clearInterval(timer)
      }
      if (!result.ok) throw new Error(JSON.stringify(result.issues))
      const root = path.resolve(input.directory)
      const temporaryRoot = path.resolve(process.getBuiltinModule('node:os').tmpdir())
      const source = path.resolve(root, 'sources')
      const destination = path.resolve(root, 'sources-moved')
      if (
        !path.isAbsolute(input.directory) ||
        path.dirname(root) !== temporaryRoot ||
        !path.basename(root).startsWith('embedded-practice-') ||
        path.dirname(source) !== root ||
        path.dirname(destination) !== root
      ) {
        throw new Error('拒绝移动非测试来源目录。')
      }
      await files.rename(source, destination)
      details = {
        questionCount: result.value.questionCount,
        topicCount: result.value.topics.length,
        mainThreadPulses: pulses,
        resources: result.value.resources.map((image) => ({
          hash: image.hash,
          actualHash: crypto.createHash('sha256').update(image.bytes).digest('hex'),
          format: image.format,
          width: image.width,
          height: image.height,
          byteLength: image.bytes.byteLength,
          isUint8Array: image.bytes instanceof Uint8Array,
        })),
      }
    } else if (input.mode === 'controls') {
      const runner = service()
      const missing = runner.prepare([path.join(input.directory, '不存在.md')])
      const busy = await runner.prepare(input.filePaths)
      const failed = await missing
      const recovered = await runner.prepare(input.filePaths)
      const controller = new AbortController()
      const cancel = runner.prepare(input.filePaths, controller.signal)
      controller.abort()
      const timed = await service(1).prepare(input.filePaths)
      details = {
        busy: code(busy),
        missing: code(failed),
        recoveredQuestions: recovered.ok ? recovered.value.questionCount : code(recovered),
        cancelled: code(await cancel),
        timedOut: code(timed),
      }
    } else {
      const runner = service()
      const pending = runner.prepare(input.filePaths)
      await runner.close()
      details = {
        cancelled: code(await pending),
        afterClose: code(await runner.prepare(input.filePaths)),
      }
    }
  } finally {
    try {
      await Promise.all(services.map((runner) => runner.close()))
    } finally {
      threads.Worker = originalWorker
    }
  }
  return { ...details, createdThreadIds, exitedThreadIds, mainThreadId: threads.threadId, errors }
}
