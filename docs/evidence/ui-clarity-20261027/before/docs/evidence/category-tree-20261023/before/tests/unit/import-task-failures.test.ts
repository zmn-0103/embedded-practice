import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { workerFailure } from '../../src/main/workers/import-protocol'
import { createImportTaskRunner } from '../../src/main/workers/import-task-runner'
import { FakeImportWorker } from '../helpers/fake-import-worker'

const paths = [resolve('测试题库.md')]
const reply = {
  version: 1,
  threadId: 7,
  result: workerFailure('INVALID_QUESTION', '业务校验结果。'),
}

describe('工作线程异常路径（受控替身）', () => {
  it.each([
    null,
    {},
    { ...reply, version: 2 },
    { ...reply, threadId: 99 },
    { ...reply, result: { ok: true } },
  ])('拒绝非法回复 %# 并停止线程', async (message) => {
    const worker = new FakeImportWorker()
    const service = createImportTaskRunner(
      () => worker,
      () => {},
    )
    const pending = service.prepare(paths)
    worker.emit('message', message)
    expect(await pending).toMatchObject({ ok: false, issues: [{ code: 'WORKER_FAILED' }] })
    expect(worker.terminate).toHaveBeenCalledOnce()
    expect(worker.eventNames()).toEqual([])
  })

  it.each([0, 1])('退出码 %s 但没有结果，不能视为成功', async (exitCode) => {
    const worker = new FakeImportWorker()
    const service = createImportTaskRunner(
      () => worker,
      () => {},
    )
    const pending = service.prepare(paths)
    worker.emit('exit', exitCode)
    expect(await pending).toMatchObject({ ok: false, issues: [{ code: 'WORKER_FAILED' }] })
    expect(worker.eventNames()).toEqual([])
  })

  it('构造失败会记录内部异常，随后仍可重试', async () => {
    const worker = new FakeImportWorker()
    const failure = new Error('模拟线程构造失败')
    const spawn = vi
      .fn(() => worker)
      .mockImplementationOnce(() => {
        throw failure
      })
    const errors: unknown[] = []
    const service = createImportTaskRunner(spawn, (error) => errors.push(error))
    expect(await service.prepare(paths)).toMatchObject({
      ok: false,
      issues: [{ code: 'WORKER_FAILED' }],
    })
    expect(errors).toEqual([failure])
    const pending = service.prepare(paths)
    worker.emit('message', reply)
    expect(await pending).toEqual(reply.result)
    expect(spawn).toHaveBeenCalledTimes(2)
  })

  it('运行异常只把中文业务错误返回调用方，堆栈留给诊断回调', async () => {
    const worker = new FakeImportWorker()
    const failure = new Error('模拟运行失败')
    const errors: unknown[] = []
    const service = createImportTaskRunner(
      () => worker,
      (error) => errors.push(error),
    )
    const pending = service.prepare(paths)
    worker.emit('error', failure)
    const result = await pending
    expect(result).toMatchObject({ ok: false, issues: [{ code: 'WORKER_FAILED' }] })
    expect(errors).toEqual([failure])
    expect(JSON.stringify(result)).not.toContain('stack')
    expect(JSON.stringify(result)).not.toContain(failure.message)
    expect(worker.eventNames()).toEqual([])
  })

  it('诊断回调失败不能阻止结算和线程停止', async () => {
    const worker = new FakeImportWorker()
    const service = createImportTaskRunner(
      () => worker,
      () => {
        throw new Error('诊断失败')
      },
    )
    const pending = service.prepare(paths)
    worker.emit('error', new Error('线程失败'))
    expect(await pending).toMatchObject({ ok: false, issues: [{ code: 'WORKER_FAILED' }] })
    expect(worker.terminate).toHaveBeenCalledOnce()
  })

  it('校验器异常由任务失败兜底，不逃逸到事件循环', async () => {
    const worker = new FakeImportWorker()
    const errors: unknown[] = []
    const failure = new Error('模拟校验器异常')
    const message = Object.defineProperty({}, 'version', {
      get() {
        throw failure
      },
    })
    const service = createImportTaskRunner(
      () => worker,
      (error) => errors.push(error),
    )
    const pending = service.prepare(paths)
    expect(() => worker.emit('message', message)).not.toThrow()
    expect(await pending).toMatchObject({ ok: false, issues: [{ code: 'WORKER_FAILED' }] })
    expect(errors).toEqual([failure])
  })

  it('停止失败封闭服务；unref 也失败时仍只返回一个失败结果', async () => {
    const worker = new FakeImportWorker()
    const stopFailure = new Error('无法停止')
    const unrefFailure = new Error('无法取消引用')
    worker.terminate.mockRejectedValueOnce(stopFailure)
    worker.unref.mockImplementationOnce(() => {
      throw unrefFailure
    })
    const spawn = vi.fn(() => worker)
    const errors: unknown[] = []
    const service = createImportTaskRunner(spawn, (error) => errors.push(error))
    const pending = service.prepare(paths)
    worker.emit('message', reply)
    expect(await pending).toMatchObject({
      ok: false,
      issues: [{ code: 'WORKER_FAILED', message: '后台任务未能安全停止，请重新启动应用。' }],
    })
    expect(errors).toEqual([stopFailure, unrefFailure])
    expect(await service.prepare(paths)).toMatchObject({
      ok: false,
      issues: [{ code: 'WORKER_CANCELLED' }],
    })
    expect(spawn).toHaveBeenCalledOnce()
    expect(() => worker.emit('error', new Error('尚未停止的线程再次报错'))).not.toThrow()
    await service.close()
  })

  it.each([0, -1, 1.5, NaN, Infinity, 2_147_483_648])(
    '拒绝无效期限 %s，防止计时器溢出变成 1ms',
    (timeout) => {
      expect(() =>
        createImportTaskRunner(
          () => new FakeImportWorker(),
          () => {},
          timeout,
        ),
      ).toThrow('整毫秒')
    },
  )
})
