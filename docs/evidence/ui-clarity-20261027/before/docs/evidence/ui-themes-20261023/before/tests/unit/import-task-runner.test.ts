import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { workerFailure } from '../../src/main/workers/import-protocol'
import { createImportTaskRunner } from '../../src/main/workers/import-task-runner'
import { FakeImportWorker } from '../helpers/fake-import-worker'

const paths = [resolve('测试题库.md')]
const result = workerFailure('INVALID_QUESTION', '测试用的业务校验结果。')
const reply = { version: 1, threadId: 7, result }

function setup(timeoutMs = 1000) {
  const worker = new FakeImportWorker()
  const spawn = vi.fn(() => worker)
  const errors: unknown[] = []
  const service = createImportTaskRunner(spawn, (error) => errors.push(error), timeoutMs)
  return { worker, spawn, service, errors }
}

afterEach(() => vi.useRealTimers())

describe('工作线程任务生命周期（受控替身）', () => {
  it('正常传递业务校验结果，停止后清理监听、计时器与取消信号', async () => {
    vi.useFakeTimers()
    const { worker, service } = setup()
    const controller = new AbortController()
    const removed = vi.spyOn(controller.signal, 'removeEventListener')
    const pending = service.prepare(paths, controller.signal)
    worker.emit('message', reply)
    expect(await pending).toEqual(result)
    expect(worker.terminate).toHaveBeenCalledOnce()
    expect(worker.eventNames()).toEqual([])
    expect(removed).toHaveBeenCalledWith('abort', expect.any(Function))
    expect(vi.getTimerCount()).toBe(0)
  })

  it('必须等停止确认后才完成请求，停止期间仍返回忙碌', async () => {
    const { worker, service, spawn } = setup()
    let stop!: (code: number) => void
    worker.terminate.mockImplementationOnce(
      () =>
        new Promise<number>((resolve) => {
          stop = resolve
        }),
    )
    const completed = vi.fn()
    const pending = service.prepare(paths)
    void pending.then(completed)
    worker.emit('message', reply)
    try {
      await Promise.resolve()
      expect(completed).not.toHaveBeenCalled()
      expect(await service.prepare(paths)).toMatchObject({
        ok: false,
        issues: [{ code: 'IMPORT_BUSY' }],
      })
      expect(spawn).toHaveBeenCalledOnce()
    } finally {
      stop(0)
    }
    expect(await pending).toEqual(result)
  })

  it('并发准备只创建一个工作线程', async () => {
    const { worker, spawn, service } = setup()
    const pending = service.prepare(paths)
    expect(await service.prepare(paths)).toMatchObject({
      ok: false,
      issues: [{ code: 'IMPORT_BUSY' }],
    })
    expect(spawn).toHaveBeenCalledOnce()
    worker.emit('message', reply)
    await pending
  })

  it('预先取消的请求不创建线程', async () => {
    const { service, spawn } = setup()
    const controller = new AbortController()
    controller.abort()
    expect(await service.prepare(paths, controller.signal)).toMatchObject({
      ok: false,
      issues: [{ code: 'WORKER_CANCELLED' }],
    })
    expect(spawn).not.toHaveBeenCalled()
  })

  it('运行中取消会停止线程并清理事件', async () => {
    const { worker, service } = setup()
    const controller = new AbortController()
    const pending = service.prepare(paths, controller.signal)
    controller.abort()
    expect(await pending).toMatchObject({ ok: false, issues: [{ code: 'WORKER_CANCELLED' }] })
    expect(worker.terminate).toHaveBeenCalledOnce()
    expect(worker.eventNames()).toEqual([])
  })

  it('期限到达返回超时，线程停止后释放计时器', async () => {
    vi.useFakeTimers()
    const { worker, service } = setup(20)
    const pending = service.prepare(paths)
    await vi.advanceTimersByTimeAsync(20)
    expect(await pending).toMatchObject({ ok: false, issues: [{ code: 'WORKER_TIMEOUT' }] })
    expect(worker.terminate).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('关闭服务等待活动任务停止，之后拒绝新任务且允许重复关闭', async () => {
    const { service, spawn, worker } = setup()
    const pending = service.prepare(paths)
    await service.close()
    expect(await pending).toMatchObject({ ok: false, issues: [{ code: 'WORKER_CANCELLED' }] })
    expect(await service.prepare(paths)).toMatchObject({
      ok: false,
      issues: [{ code: 'WORKER_CANCELLED' }],
    })
    await service.close()
    expect(spawn).toHaveBeenCalledOnce()
    expect(worker.terminate).toHaveBeenCalledOnce()
  })

  it('结果、错误和退出紧接到达时只结算一次', async () => {
    const { worker, service, errors } = setup()
    const pending = service.prepare(paths)
    worker.emit('message', reply)
    worker.emit('error', new Error('结果后的错误事件'))
    worker.emit('exit', 1)
    expect(await pending).toEqual(result)
    expect(worker.terminate).toHaveBeenCalledOnce()
    expect(errors).toEqual([])
  })

  it('非法路径不创建线程，正常任务完成后可准备新一轮', async () => {
    const { worker, service, spawn } = setup()
    expect((await service.prepare(['relative.md'])).ok).toBe(false)
    expect(spawn).not.toHaveBeenCalled()
    const first = service.prepare(paths)
    worker.emit('message', reply)
    await first
    const next = new FakeImportWorker()
    spawn.mockReturnValueOnce(next)
    const second = service.prepare(paths)
    next.emit('message', reply)
    expect(await second).toEqual(result)
    expect(spawn).toHaveBeenCalledTimes(2)
  })
})
