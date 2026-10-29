import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  createPracticeController,
  DRAFT_SAVE_DELAY_MS,
  type PracticeController,
} from '../../src/renderer/src/practice-controller'
import {
  practiceViewSchema,
  type PracticeAck,
  type PracticeView,
} from '../../src/shared/contracts/practice'
import type {
  PracticeDesktopApi,
  PracticeDesktopResult,
} from '../../src/shared/contracts/practice-desktop'

const sessionId = randomUUID()
function view(position = 0, revealed = false): PracticeView {
  const body = { markdown: '题干', definitions: [], imageBindings: [] }
  return practiceViewSchema.parse({
    session: {
      sessionId,
      status: 'active',
      mode: 'sequential',
      topicId: null,
      filters: null,
      category: { kind: 'all' },
      position,
      revision: position,
      total: 3,
      createdAt: '2026-10-20T00:00:00.000Z',
      endedAt: null,
      counts: {
        revealed: 0,
        rated: 0,
        unrated: 0,
        skipped: 0,
        ratings: { 不会: 0, 不熟: 0, 掌握: 0 },
      },
    },
    item: {
      position,
      topicId: 'topic',
      questionId: `q-${position}`,
      versionId: 1,
      title: '标题',
      topicTitle: '专题',
      tags: [],
      difficulty: '基础',
      body,
      draft: { revision: 0, text: '' },
      rating: null,
      skippedAt: null,
      revealed,
      revealedAt: revealed ? '2026-10-20T00:00:00.000Z' : null,
      ...(revealed ? { answer: { ...body, markdown: '保密答案' } } : {}),
    },
  })
}
function ack(position = 0): PracticeAck {
  return { sessionId, status: 'active', position, revision: position + 1, total: 3 }
}
function ok<T>(value: T): PracticeDesktopResult<T> {
  return { ok: true, value }
}
const controllers: PracticeController[] = []
function setup(initial = view()) {
  const api: PracticeDesktopApi = {
    outline: vi.fn(async () => {
      throw new Error('本控制器测试不主动读取清单')
    }),
    read: vi.fn(async () => ok(view(1))),
    start: vi.fn(async () => ok(ack())),
    saveDraft: vi.fn(async (input) =>
      ok({
        sessionId: input.sessionId,
        position: input.position,
        draftRevision: input.draft.revision,
      }),
    ),
    reveal: vi.fn(async () => ok(ack())),
    rateAndAdvance: vi.fn(async () => ok(ack(1))),
    navigate: vi.fn(async () => ok(ack(1))),
    end: vi.fn(async () => ok(ack())),
    ready: vi.fn(async () => ok(null)),
    finishClose: vi.fn(async () => ok(null)),
    onBeforeClose: vi.fn(() => () => {}),
    onCloseCancelled: vi.fn(() => () => {}),
    onTimerPause: vi.fn(() => () => {}),
  }
  const controller = createPracticeController(api)
  controller.open(initial)
  controllers.push(controller)
  return { controller, api }
}
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  controllers.splice(0).forEach((controller) => controller.dispose())
  vi.useRealTimers()
})

describe('输入停止与串行草稿保存', () => {
  test('停止输入 500ms 后保存，保留纯文本和修订', async () => {
    const { controller, api } = setup()
    controller.edit('中文\r\n  int a = 1;')
    await vi.advanceTimersByTimeAsync(DRAFT_SAVE_DELAY_MS - 1)
    expect(api.saveDraft).not.toHaveBeenCalled()
    expect(controller.getState().saveStatus).toBe('dirty')
    await vi.advanceTimersByTimeAsync(1)
    expect(api.saveDraft).toHaveBeenCalledExactlyOnceWith({
      sessionId,
      position: 0,
      draft: { revision: 1, text: '中文\r\n  int a = 1;' },
    })
    expect(controller.getState()).toMatchObject({ savedRevision: 1, saveStatus: 'saved' })
  })
  test('连续输入重设计时，不保存早期值', async () => {
    const { controller, api } = setup()
    controller.edit('一')
    await vi.advanceTimersByTimeAsync(300)
    controller.edit('二')
    await vi.advanceTimersByTimeAsync(300)
    controller.edit('最后')
    await vi.advanceTimersByTimeAsync(499)
    expect(api.saveDraft).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(api.saveDraft).toHaveBeenCalledTimes(1)
    expect(vi.mocked(api.saveDraft).mock.calls[0]?.[0].draft).toEqual({ revision: 3, text: '最后' })
  })
  test('旧保存响应不替换在途新输入，下一次安静期才保存新值', async () => {
    const { controller, api } = setup()
    const pending = deferred<Awaited<ReturnType<PracticeDesktopApi['saveDraft']>>>()
    vi.mocked(api.saveDraft).mockReturnValueOnce(pending.promise)
    controller.edit('第一份')
    await vi.advanceTimersByTimeAsync(500)
    controller.edit('更新内容')
    pending.resolve(ok({ sessionId, position: 0, draftRevision: 1 }))
    await vi.advanceTimersByTimeAsync(0)
    expect(controller.getState()).toMatchObject({
      draft: { text: '更新内容', revision: 2 },
      savedRevision: 1,
      saveStatus: 'dirty',
    })
    await vi.advanceTimersByTimeAsync(499)
    expect(api.saveDraft).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(api.saveDraft).toHaveBeenCalledTimes(2)
    expect(controller.getState()).toMatchObject({ savedRevision: 2, saveStatus: 'saved' })
  })
  test('离开立即保存并取消旧计时器', async () => {
    const { controller, api } = setup()
    controller.edit('未等到 500ms 的输入')
    expect(await controller.flushForLeave()).toBe(true)
    expect(api.saveDraft).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1000)
    expect(api.saveDraft).toHaveBeenCalledTimes(1)
  })
  test('在途保存和立即离开串行完成，不产生重复最新保存', async () => {
    const { controller, api } = setup()
    const pending = deferred<Awaited<ReturnType<PracticeDesktopApi['saveDraft']>>>()
    vi.mocked(api.saveDraft).mockReturnValueOnce(pending.promise)
    controller.edit('旧')
    await vi.advanceTimersByTimeAsync(500)
    controller.edit('新')
    const leave = controller.flushForLeave()
    const repeated = controller.flushForLeave()
    pending.resolve(ok({ sessionId, position: 0, draftRevision: 1 }))
    expect(await leave).toBe(true)
    expect(await repeated).toBe(true)
    expect(api.saveDraft).toHaveBeenCalledTimes(2)
    expect(controller.getState().savedRevision).toBe(2)
  })
  test('失败保持输入和位置，阻止揭晓，重试原修订', async () => {
    const { controller, api } = setup()
    vi.mocked(api.saveDraft).mockResolvedValueOnce({
      ok: false,
      error: { code: 'WRITE_FAILED', message: '磁盘写入失败' },
    })
    controller.edit('不能丢的输入')
    expect(await controller.perform({ kind: 'reveal' })).toBe(false)
    expect(api.reveal).not.toHaveBeenCalled()
    expect(controller.getState()).toMatchObject({
      saveStatus: 'failed',
      draft: { text: '不能丢的输入', revision: 1 },
      view: { session: { position: 0 } },
    })
    expect(await controller.retry()).toBe(true)
    expect(vi.mocked(api.saveDraft).mock.calls[1]?.[0]).toEqual(
      vi.mocked(api.saveDraft).mock.calls[0]?.[0],
    )
    expect(controller.getState().saveStatus).toBe('saved')
  })
  test('传输异常或错误确认不能显示已保存', async () => {
    const { controller, api } = setup()
    vi.mocked(api.saveDraft).mockRejectedValueOnce(new Error('响应中断'))
    controller.edit('原内容')
    expect(await controller.flushForLeave()).toBe(false)
    vi.mocked(api.saveDraft).mockResolvedValueOnce(
      ok({ sessionId: randomUUID(), position: 0, draftRevision: 1 }),
    )
    expect(await controller.retry()).toBe(false)
    expect(controller.getState().saveStatus).toBe('failed')
    expect(await controller.retry()).toBe(true)
  })
  test('草稿未确认时拒绝用其他题目覆盖，释放后不再计时保存', async () => {
    const { controller, api } = setup()
    controller.edit('保留')
    expect(controller.open(view(1))).toBe(false)
    controller.dispose()
    await vi.advanceTimersByTimeAsync(1000)
    expect(api.saveDraft).not.toHaveBeenCalled()
  })
})

describe('操作回执、重试和关闭输入锁', () => {
  test('清单跳题先保存输入，保存失败留在原题且不提交目标', async () => {
    const { controller, api } = setup()
    controller.edit('跳题前必须保留')
    vi.mocked(api.saveDraft).mockResolvedValueOnce({
      ok: false,
      error: { code: 'WRITE_FAILED', message: '保存失败' },
    })
    expect(await controller.perform({ kind: 'jump', position: 2 })).toBe(false)
    expect(api.navigate).not.toHaveBeenCalled()
    expect(controller.getState()).toMatchObject({
      draft: { text: '跳题前必须保留' },
      view: { session: { position: 0 } },
    })
    vi.mocked(api.read).mockResolvedValueOnce(ok(view(2)))
    vi.mocked(api.navigate).mockResolvedValueOnce(ok(ack(2)))
    expect(await controller.perform({ kind: 'jump', position: 2 })).toBe(true)
    expect(vi.mocked(api.navigate).mock.calls[0]?.[0]).toMatchObject({
      direction: 'jump',
      targetPosition: 2,
      cursor: { position: 0, revision: 0 },
      draft: { revision: 1, text: '跳题前必须保留' },
    })
    expect(api.reveal).not.toHaveBeenCalled()
    expect(controller.getState().view?.session.position).toBe(2)
  })
  test('跳题响应未知保留原目标和回执身份，拒绝另一目标并阻止关闭', async () => {
    const { controller, api } = setup()
    vi.mocked(api.navigate).mockRejectedValueOnce(new Error('提交后响应丢失'))
    expect(await controller.perform({ kind: 'jump', position: 2 })).toBe(false)
    expect(await controller.perform({ kind: 'jump', position: 1 })).toBe(false)
    expect(await controller.prepareClose()).toBe(false)
    vi.mocked(api.read).mockResolvedValueOnce(ok(view(2)))
    vi.mocked(api.navigate).mockResolvedValueOnce(ok(ack(2)))
    expect(await controller.retry()).toBe(true)
    const calls = vi.mocked(api.navigate).mock.calls
    expect(calls).toHaveLength(2)
    expect(calls[1]?.[0]).toEqual(calls[0]?.[0])
    expect(calls[1]?.[0].targetPosition).toBe(2)
    expect(controller.getState().view?.item?.revealed).toBe(false)
  })
  test('重复操作只发送一次，空输入允许揭晓', async () => {
    const { controller, api } = setup()
    const pending = deferred<PracticeDesktopResult<PracticeAck>>()
    vi.mocked(api.reveal).mockReturnValueOnce(pending.promise)
    const first = controller.perform({ kind: 'reveal' })
    const repeated = controller.perform({ kind: 'reveal' })
    await vi.advanceTimersByTimeAsync(0)
    expect(api.reveal).toHaveBeenCalledTimes(1)
    expect(vi.mocked(api.reveal).mock.calls[0]?.[0].draft).toEqual({ revision: 0, text: '' })
    pending.resolve(ok(ack()))
    expect(await first).toBe(true)
    expect(await repeated).toBe(false)
  })
  test('操作响应不明保留原 UUID 和请求内容，禁止再次编辑后重试', async () => {
    const { controller, api } = setup(view(0, true))
    controller.edit('作答')
    vi.mocked(api.rateAndAdvance).mockRejectedValueOnce(new Error('已提交后响应丢失'))
    expect(await controller.perform({ kind: 'rate', rating: '掌握' })).toBe(false)
    expect(controller.getState().pending).toBe(true)
    controller.edit('不应覆盖')
    expect(controller.getState().draft.text).toBe('作答')
    expect(await controller.retry()).toBe(true)
    const calls = vi.mocked(api.rateAndAdvance).mock.calls
    expect(calls).toHaveLength(2)
    expect(calls[1]?.[0]).toEqual(calls[0]?.[0])
    expect(controller.getState().view?.session.position).toBe(1)
  })
  test('提交已确认但读取失败，只重读不重复提交', async () => {
    const { controller, api } = setup(view(0, true))
    vi.mocked(api.read).mockRejectedValueOnce(new Error('读取失败'))
    expect(await controller.perform({ kind: 'rate', rating: null })).toBe(false)
    expect(controller.getState()).toMatchObject({
      pending: true,
      view: { session: { position: 0 } },
    })
    expect(await controller.retry()).toBe(true)
    expect(api.rateAndAdvance).toHaveBeenCalledTimes(1)
    expect(api.read).toHaveBeenCalledTimes(2)
  })
  test('关闭确认后持续锁输入，只有明确取消关闭才能再编辑', async () => {
    const { controller, api } = setup()
    controller.edit('关闭前保存')
    expect(await controller.prepareClose()).toBe(true)
    expect(controller.getState().closing).toBe(true)
    controller.edit('不应丢在确认之后')
    expect(controller.getState().draft.text).toBe('关闭前保存')
    expect(await controller.perform({ kind: 'reveal' })).toBe(false)
    expect(api.reveal).not.toHaveBeenCalled()
    controller.cancelClose()
    controller.edit('取消后继续')
    expect(controller.getState().draft.text).toBe('取消后继续')
  })
  test('关闭保存失败恢复输入，重试后可重新关闭', async () => {
    const { controller, api } = setup()
    vi.mocked(api.saveDraft).mockResolvedValueOnce({
      ok: false,
      error: { code: 'WRITE_FAILED', message: '失败' },
    })
    controller.edit('保留')
    expect(await controller.prepareClose()).toBe(false)
    expect(controller.getState()).toMatchObject({
      closing: false,
      saveStatus: 'failed',
      draft: { text: '保留' },
    })
    controller.edit('继续修改')
    expect(await controller.prepareClose()).toBe(true)
    expect(vi.mocked(api.saveDraft).mock.calls[1]?.[0].draft.text).toBe('继续修改')
  })
  test('关闭等待正在执行的推进，不覆盖新位置', async () => {
    const { controller, api } = setup(view(0, true))
    const pending = deferred<PracticeDesktopResult<PracticeAck>>()
    vi.mocked(api.rateAndAdvance).mockReturnValueOnce(pending.promise)
    const action = controller.perform({ kind: 'rate', rating: '不会' })
    await vi.advanceTimersByTimeAsync(0)
    const closing = controller.prepareClose()
    controller.edit('禁止输入')
    pending.resolve(ok(ack(1)))
    expect(await action).toBe(true)
    expect(await closing).toBe(true)
    expect(controller.getState()).toMatchObject({
      closing: true,
      view: { session: { position: 1 } },
      draft: { text: '' },
    })
  })
  test('原操作仍无法确认时拒绝正常离开', async () => {
    const { controller, api } = setup()
    vi.mocked(api.reveal).mockResolvedValueOnce({
      ok: false,
      error: { code: 'OUTCOME_UNKNOWN', message: '结果不明' },
    })
    expect(await controller.perform({ kind: 'reveal' })).toBe(false)
    expect(await controller.flushForLeave()).toBe(false)
    expect(await controller.prepareClose()).toBe(false)
    expect(controller.getState().pending).toBe(true)
  })
})
