import { randomUUID } from 'node:crypto'
import { afterEach, expect, test, vi } from 'vitest'
import {
  localDateString,
  reviewListRequestSchema,
  reviewPresetDate,
  reviewTodoSchema,
  saveReviewSchema,
} from '../../src/shared/contracts/review-todos'
import {
  EMPTY_QUESTION_FILTERS,
  questionFiltersSchema,
} from '../../src/shared/contracts/question-filters'
import { startPracticeSchema } from '../../src/shared/contracts/practice'
import { questionSelectionParameters } from '../../src/main/database/repositories/question-selection'

const input = {
  topicId: 'uart',
  questionId: 'dma',
  expectedRevision: 0,
  state: 'pending',
  dueDate: null,
  reason: '再口述TC与DMA完成的区别',
}
afterEach(() => vi.useRealTimers())
test('复习安排接受纯文本原因和真实日历日期，严格限制字段及修订', () => {
  expect(saveReviewSchema.parse(input)).toEqual(input)
  expect(saveReviewSchema.safeParse({ ...input, dueDate: '2028-02-29' }).success).toBe(true)
  for (const change of [
    { dueDate: '2026-02-29' },
    { dueDate: '2026-11-31' },
    { dueDate: '2026-10-29T00:00:00Z' },
    { reason: '中'.repeat(501) },
    { reason: '\uD800' },
    { reason: '\uDC00' },
    { expectedRevision: -1 },
    { expectedRevision: Number.MAX_SAFE_INTEGER },
    { state: 'automatic' },
    { completedAt: '2026-10-29T00:00:00Z' },
    { questionId: '../data' },
  ])
    expect(saveReviewSchema.safeParse({ ...input, ...change }).success).toBe(false)
  expect(saveReviewSchema.safeParse({ ...input, reason: '🧠'.repeat(250) }).success).toBe(true)
  const { expectedRevision: _unused, ...draft } = input
  const stored = { ...draft, revision: 1, updatedAt: '2026-10-29T00:00:00.000Z', completedAt: null }
  expect(reviewTodoSchema.safeParse(stored).success).toBe(true)
  expect(reviewTodoSchema.safeParse({ ...stored, state: 'done' }).success).toBe(false)
  expect(
    reviewTodoSchema.safeParse({ ...stored, state: 'done', completedAt: stored.updatedAt }).success,
  ).toBe(true)
  expect(reviewTodoSchema.safeParse({ ...stored, completedAt: stored.updatedAt }).success).toBe(
    false,
  )
  expect(reviewListRequestSchema.safeParse({ state: 'all', due: 'due', page: 0 }).success).toBe(
    false,
  )
})
test('快捷日期使用本地日历，跨月跨年正确；周末当天仍为本周末', () => {
  const date = (text: string) => new Date(`${text}T23:50:00`)
  expect(localDateString(date('2026-10-29'))).toBe('2026-10-29')
  expect(reviewPresetDate('tomorrow', date('2026-12-31'))).toBe('2027-01-01')
  expect(reviewPresetDate('tomorrow', date('2028-02-28'))).toBe('2028-02-29')
  expect(reviewPresetDate('weekend', date('2026-10-29'))).toBe('2026-10-31')
  expect(reviewPresetDate('weekend', date('2026-10-31'))).toBe('2026-10-31')
  expect(reviewPresetDate('weekend', date('2026-11-01'))).toBe('2026-11-01')
})
test('旧筛选保持原形，最近时间窗以一次请求时刻计算，明确选题/再练不混用动态优先', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-29T00:10:00.000Z'))
  expect(questionFiltersSchema.parse(EMPTY_QUESTION_FILTERS)).toEqual(EMPTY_QUESTION_FILTERS)
  expect(questionSelectionParameters({ topicId: null })).toMatchObject({
    practiceRecency: 'all',
    practiceOrder: 'default',
    practicedBefore: null,
  })
  for (const [practiceRecency, practicedBefore] of [
    ['7d', '2026-10-22T00:10:00.000Z'],
    ['30d', '2026-09-29T00:10:00.000Z'],
  ] as const)
    expect(
      questionSelectionParameters({
        topicId: null,
        filters: { ...EMPTY_QUESTION_FILTERS, practiceRecency, practiceOrder: 'oldest' },
      }),
    ).toMatchObject({ practiceRecency, practiceOrder: 'oldest', practicedBefore })
  const base = {
    requestId: randomUUID(),
    topicId: null,
    count: 'all',
    replace: null,
    repeat: { sessionId: randomUUID(), selection: 'all' },
  }
  expect(startPracticeSchema.safeParse(base).success).toBe(true)
  for (const change of [
    { practiceRecency: '7d' },
    { practiceRecency: 'never' },
    { practiceOrder: 'oldest' },
  ])
    expect(
      startPracticeSchema.safeParse({ ...base, filters: { ...EMPTY_QUESTION_FILTERS, ...change } })
        .success,
    ).toBe(false)
  expect(
    questionFiltersSchema.safeParse({ ...EMPTY_QUESTION_FILTERS, practiceRecency: '90d' }).success,
  ).toBe(false)
})
