import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import {
  createReviewController,
  REVIEW_SAVE_DELAY_MS,
} from '../../src/renderer/src/review-controller'
import type { ReviewDesktopApi, ReviewTodo } from '../../src/shared/contracts/review-todos'

const identity = { topicId: 'uart', questionId: 'dma' }
const timestamp = '2026-10-29T00:00:00.000Z'
const todo = (change: Partial<ReviewTodo> = {}): ReviewTodo => ({
  ...identity,
  revision: 1,
  state: 'pending',
  dueDate: null,
  reason: '',
  updatedAt: timestamp,
  completedAt: null,
  ...change,
})
const controllers: ReturnType<typeof createReviewController>[] = []
function setup(existing: ReviewTodo | null = null) {
  const api: Pick<ReviewDesktopApi, 'read' | 'save'> = {
    read: vi.fn(async () => ({ ok: true as const, value: existing })),
    save: vi.fn(async (input) => ({
      ok: true as const,
      value: todo({
        ...input,
        revision: input.expectedRevision + 1,
        completedAt: input.state === 'done' ? timestamp : null,
      }),
    })),
  }
  const controller = createReviewController(api, identity)
  controllers.push(controller)
  return { api, controller }
}
beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  controllers.splice(0).forEach((value) => value.dispose())
  vi.useRealTimers()
})

test('构造和只读展开不会创建待办；编辑后500ms保存日期、中文原因', async () => {
  const { api, controller } = setup()
  controller.edit({ reason: '未读取前不能写' })
  expect(await controller.flush()).toBe(true)
  expect(api.read).not.toHaveBeenCalled()
  expect(api.save).not.toHaveBeenCalled()
  await controller.load()
  await vi.advanceTimersByTimeAsync(1000)
  expect(api.save).not.toHaveBeenCalled()
  controller.edit({ dueDate: '2026-10-30', reason: '再口述TC与DMA完成的区别' })
  expect(controller.hasPending()).toBe(true)
  await vi.advanceTimersByTimeAsync(REVIEW_SAVE_DELAY_MS - 1)
  expect(api.save).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(1)
  expect(api.save).toHaveBeenCalledExactlyOnceWith({
    ...identity,
    expectedRevision: 0,
    state: 'pending',
    dueDate: '2026-10-30',
    reason: '再口述TC与DMA完成的区别',
  })
  expect(controller.hasPending()).toBe(false)
  expect(controller.getState().confirmations).toBe(1)
})

test('明确加入允许无日期无原因，未安排不能直接完成；完成和重开均需显式编辑', async () => {
  const { api, controller } = setup()
  await controller.load()
  controller.edit({ state: 'done' })
  expect(controller.hasPending()).toBe(false)
  expect(api.save).not.toHaveBeenCalled()
  controller.edit({})
  expect(await controller.flush()).toBe(true)
  controller.edit({ state: 'done' })
  expect(await controller.flush()).toBe(true)
  expect(controller.getState().todo).toMatchObject({
    state: 'done',
    revision: 2,
    completedAt: timestamp,
  })
  controller.edit({ state: 'pending', dueDate: null })
  expect(await controller.flush()).toBe(true)
  expect(controller.getState().todo).toMatchObject({
    state: 'pending',
    revision: 3,
    completedAt: null,
  })
  await vi.advanceTimersByTimeAsync(1000)
  expect(api.save).toHaveBeenCalledTimes(3)
})

test.each(['throw', 'database', 'wrong-identity', 'wrong-revision', 'wrong-content'] as const)(
  '结果未知%s时保留输入和原命令，锁编辑；重试原修订可确认',
  async (kind) => {
    const { api, controller } = setup(todo())
    await controller.load()
    if (kind === 'throw') vi.mocked(api.save).mockRejectedValueOnce(new Error('响应丢失'))
    else if (kind === 'database')
      vi.mocked(api.save).mockResolvedValueOnce({
        ok: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: '写入尚未确认' },
      })
    else
      vi.mocked(api.save).mockResolvedValueOnce({
        ok: true,
        value: todo({
          revision: kind === 'wrong-revision' ? 5 : 2,
          questionId: kind === 'wrong-identity' ? 'another' : identity.questionId,
          reason: kind === 'wrong-content' ? '另一内容' : '保留输入',
        }),
      })
    controller.edit({ reason: '保留输入' })
    expect(await controller.flush()).toBe(false)
    controller.edit({ reason: '不可覆盖未知操作' })
    expect(controller.getState()).toMatchObject({ draft: { reason: '保留输入' }, pending: true })
    expect(await controller.load()).toBe(false)
    expect(await controller.flush()).toBe(true)
    const calls = vi.mocked(api.save).mock.calls
    expect(calls).toHaveLength(2)
    expect(calls[1]![0]).toEqual(calls[0]![0])
    expect(controller.getState().todo).toMatchObject({ revision: 2, reason: '保留输入' })
    expect(controller.hasPending()).toBe(false)
  },
)

test('冲突保留本地内容且不盲重试，仅明确放弃重读才能解除', async () => {
  const { api, controller } = setup(todo())
  await controller.load()
  vi.mocked(api.save).mockResolvedValueOnce({
    ok: false,
    error: { code: 'CONFLICT', message: '已有其他修改' },
  })
  controller.edit({ reason: '我的修改' })
  expect(await controller.flush()).toBe(false)
  expect(await controller.flush()).toBe(false)
  expect(await controller.load()).toBe(false)
  expect(api.save).toHaveBeenCalledTimes(1)
  expect(controller.getState()).toMatchObject({ conflict: true, draft: { reason: '我的修改' } })
  vi.mocked(api.read).mockResolvedValueOnce({
    ok: true,
    value: todo({ revision: 2, reason: '外部修改' }),
  })
  expect(await controller.load(true)).toBe(true)
  expect(controller.getState()).toMatchObject({ conflict: false, draft: { reason: '外部修改' } })
  expect(controller.hasPending()).toBe(false)
})

test('并发flush共享写请求，保存中不接收新编辑；显式失败后可以修正再试', async () => {
  const { api, controller } = setup(todo())
  await controller.load()
  let release!: (value: Awaited<ReturnType<typeof api.save>>) => void
  vi.mocked(api.save).mockReturnValueOnce(
    new Promise((resolve) => {
      release = resolve
    }),
  )
  controller.edit({ reason: '在途保存' })
  const first = controller.flush()
  const second = controller.flush()
  controller.edit({ reason: '保存中不改写' })
  release({ ok: false, error: { code: 'INVALID_REQUEST', message: '请修正输入' } })
  expect(await first).toBe(false)
  expect(await second).toBe(false)
  expect(api.save).toHaveBeenCalledTimes(1)
  expect(controller.getState()).toMatchObject({ pending: false, draft: { reason: '在途保存' } })
  controller.edit({ reason: '修正输入' })
  expect(await controller.flush()).toBe(true)
  expect(controller.getState().todo?.reason).toBe('修正输入')
})

test('读取失败可重试，释放只取消计时不盲写，释放后不通知组件', async () => {
  const { api, controller } = setup()
  vi.mocked(api.read).mockRejectedValueOnce(new Error('读取失败'))
  expect(await controller.load()).toBe(false)
  expect(controller.getState().error).toContain('无法读取')
  expect(await controller.load()).toBe(true)
  controller.edit({ reason: '离开应先由守卫flush' })
  const listener = vi.fn()
  controller.subscribe(listener)
  controller.dispose()
  await vi.advanceTimersByTimeAsync(1000)
  expect(api.save).not.toHaveBeenCalled()
  expect(await controller.load()).toBe(false)
  expect(listener).not.toHaveBeenCalled()
})
