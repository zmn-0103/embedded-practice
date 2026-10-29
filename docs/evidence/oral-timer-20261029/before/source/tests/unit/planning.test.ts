import { describe, expect, it, vi } from 'vitest'
import {
  dailyDraftSchema,
  examDraftSchema,
  quotaRowsSchema,
  daySchema,
  monthSchema,
  localDay,
  planningChangeResultSchema,
  type PlanningChange,
  type PlanningDesktopApi,
} from '../../src/shared/contracts/planning'
import { createPlanningController } from '../../src/renderer/src/planning-controller'
const goalId = '529b7f5d-82c9-44e2-a20b-7623bf530036',
  setId = 'fea8bb64-ff39-4b01-ae24-b42a36fba9f2'
const daily: PlanningChange = {
  kind: 'daily',
  day: '2026-10-29',
  ratingTarget: 10,
  reviewTarget: 3,
  expectedRevision: 0,
}
function ack(revision = 1) {
  return {
    ok: true as const,
    value: {
      type: 'daily' as const,
      day: '2026-10-29',
      ratingTarget: 10,
      reviewTarget: 3,
      revision,
      updatedAt: '2026-10-29T03:00:00.000Z',
    },
  }
}
describe('学习目标边界', () => {
  it('真实日期和月份，目标0可取消但不能负数/小数/超量', () => {
    for (const value of ['2025-02-29', '2026-13-01', '2026-10-29T00:00:00Z'])
      expect(daySchema.safeParse(value).success).toBe(false)
    expect(daySchema.parse('2028-02-29')).toBe('2028-02-29')
    expect(monthSchema.safeParse('2026-00').success).toBe(false)
    expect(localDay(new Date(2026, 9, 29, 23, 59))).toBe('2026-10-29')
    expect(
      dailyDraftSchema.safeParse({ day: '2026-10-29', ratingTarget: 0, reviewTarget: 500 }).success,
    ).toBe(true)
    for (const value of [-1, 1.5, 501, NaN])
      expect(
        dailyDraftSchema.safeParse({ day: '2026-10-29', ratingTarget: value, reviewTarget: 0 })
          .success,
      ).toBe(false)
  })
  it('配额唯一专题，非空且合计最多500，每行明确优先方式', () => {
    const row = { topicId: 'c-language', count: 250, priority: 'oldest' }
    expect(quotaRowsSchema.safeParse([row, { ...row, topicId: 'rtos' }]).success).toBe(true)
    for (const rows of [
      [],
      [row, row],
      [row, { ...row, topicId: 'rtos', count: 251 }],
      [{ ...row, count: 0 }],
      [{ ...row, priority: 'ai' }],
    ])
      expect(quotaRowsSchema.safeParse(rows).success).toBe(false)
  })
  it('目标题单唯一，名称无控制符/坏Unicode，返回不能含正文或额外能力', () => {
    const value = { goalId, name: '嵌入式备考', deadline: null, setIds: [setId] }
    expect(examDraftSchema.safeParse(value).success).toBe(true)
    for (const change of [
      { setIds: [] },
      { setIds: [setId, setId] },
      { name: '备考\n' },
      { name: '\uD800' },
      { deadline: '2026-02-30' },
    ])
      expect(examDraftSchema.safeParse({ ...value, ...change }).success).toBe(false)
    expect(planningChangeResultSchema.safeParse({ ...ack(), answer: '泄露' }).success).toBe(false)
  })
})
describe('目标保存原命令与离开保护', () => {
  it('有编辑不自动保存，明确保存后才允许离开', async () => {
    const change = vi.fn<PlanningDesktopApi['change']>(async () => ack()),
      controller = createPlanningController({ change })
    expect(controller.begin(daily)).toBe(true)
    expect(await controller.flush()).toBe(false)
    expect(change).not.toHaveBeenCalled()
    expect(await controller.save()).toBe(true)
    expect(await controller.flush()).toBe(true)
    expect(controller.hasPending()).toBe(false)
  })
  it('未知结果冻结原输入，重试同一命令且并发保存只发一次', async () => {
    let release!: (value: Awaited<ReturnType<PlanningDesktopApi['change']>>) => void
    const change = vi
      .fn<PlanningDesktopApi['change']>()
      .mockRejectedValueOnce(Error('lost'))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            release = resolve
          }),
      )
    const controller = createPlanningController({ change })
    controller.begin(daily)
    expect(await controller.save()).toBe(false)
    controller.edit({ ...daily, ratingTarget: 99 })
    const retry = controller.save(),
      leave = controller.flush()
    expect(change).toHaveBeenCalledTimes(2)
    expect(change.mock.calls[1]?.[0]).toEqual(daily)
    release(ack())
    expect(await retry).toBe(true)
    expect(await leave).toBe(true)
  })
  it('错误类型/身份/范围/修订的成功包不能解除原命令', async () => {
    for (const value of [
      null,
      { ...ack().value, day: '2026-10-30' },
      { ...ack().value, ratingTarget: 11 },
      { ...ack().value, revision: 8 },
    ]) {
      const change = vi.fn<PlanningDesktopApi['change']>(async () => ({ ok: true, value })),
        controller = createPlanningController({ change })
      controller.begin(daily)
      expect(await controller.save()).toBe(false)
      expect(controller.getState().pending).toEqual(daily)
      expect(await controller.flush()).toBe(false)
    }
  })
  it('冲突保留草稿，明确放弃后才能重新编辑', async () => {
    const change = vi.fn<PlanningDesktopApi['change']>(async () => ({
        ok: false,
        error: { code: 'CONFLICT', message: '已变化' },
      })),
      controller = createPlanningController({ change })
    controller.begin(daily)
    expect(await controller.save()).toBe(false)
    expect(controller.getState().draft).toEqual(daily)
    controller.edit({ ...daily, ratingTarget: 99 })
    expect(controller.getState().draft).toEqual(daily)
    expect(await controller.save()).toBe(false)
    expect(change).toHaveBeenCalledTimes(1)
    controller.discard()
    expect(controller.begin({ ...daily, expectedRevision: 2 })).toBe(true)
  })
  it('删除仅接受空确认，卸载后不改变编辑状态', async () => {
    const change = vi.fn<PlanningDesktopApi['change']>(async () => ({ ok: true, value: null })),
      controller = createPlanningController({ change })
    controller.begin({
      kind: 'exam-delete',
      expected: {
        type: 'exam',
        goalId,
        name: '备考',
        deadline: null,
        setIds: [setId],
        revision: 1,
        updatedAt: '2026-10-29T00:00:00.000Z',
      },
    })
    expect(await controller.save()).toBe(true)
    controller.dispose()
    expect(controller.begin(daily)).toBe(false)
    expect(await controller.flush()).toBe(false)
  })
})
