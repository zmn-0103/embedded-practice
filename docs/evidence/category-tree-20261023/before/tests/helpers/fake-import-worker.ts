import { EventEmitter } from 'node:events'
import { vi } from 'vitest'
import type { ImportWorker } from '../../src/main/workers/import-task-runner'

export class FakeImportWorker extends EventEmitter implements ImportWorker {
  threadId = 7
  readonly unref = vi.fn()
  readonly terminate = vi.fn(async () => {
    this.threadId = -1
    return 0
  })
}
