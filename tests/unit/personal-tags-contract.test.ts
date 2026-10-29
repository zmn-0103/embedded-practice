import { randomUUID } from 'node:crypto'
import { expect, test } from 'vitest'
import { personalTagChangeSchema } from '../../src/shared/contracts/personal-tags'
import {
  questionFiltersSchema,
  EMPTY_QUESTION_FILTERS,
} from '../../src/shared/contracts/question-filters'
import { practicePlanChangeSchema } from '../../src/shared/contracts/practice-plans'
import { questionSetChangeSchema } from '../../src/shared/contracts/question-sets'
import { startPracticeSchema } from '../../src/shared/contracts/practice'

const tagId = randomUUID()
test('个人标签名称规范化，批量操作仅接受非空唯一明确身份', () => {
  expect(personalTagChangeSchema.parse({ kind: 'save', tagId, name: '  面试前必看  ' })).toEqual({
    kind: 'save',
    tagId,
    name: '面试前必看',
  })
  const command = {
    kind: 'assign',
    tagId,
    present: true,
    items: [{ topicId: 'uart', questionId: 'dma' }],
  }
  expect(personalTagChangeSchema.parse(command)).toEqual(command)
  for (const items of [
    [],
    [...command.items, ...command.items],
    Array.from({ length: 501 }, (_, index) => ({ topicId: 'uart', questionId: `q-${index}` })),
  ])
    expect(personalTagChangeSchema.safeParse({ ...command, items }).success).toBe(false)
})
test.each(['', ' ', 'a\nline', '中'.repeat(61)])('拒绝无效标签名称 %j', (name) => {
  expect(personalTagChangeSchema.safeParse({ kind: 'save', tagId, name }).success).toBe(false)
})
test('个人标签筛选兼容旧条件，失效UUID保留，拒绝路径和额外字段', () => {
  expect(questionFiltersSchema.parse(EMPTY_QUESTION_FILTERS)).toEqual(EMPTY_QUESTION_FILTERS)
  expect(
    questionFiltersSchema.parse({ ...EMPTY_QUESTION_FILTERS, personalTagId: tagId }).personalTagId,
  ).toBe(tagId)
  expect(
    questionFiltersSchema.safeParse({ ...EMPTY_QUESTION_FILTERS, personalTagId: '../db' }).success,
  ).toBe(false)
  expect(
    personalTagChangeSchema.safeParse({
      kind: 'assign',
      tagId,
      present: true,
      query: '全部',
      items: [],
    }).success,
  ).toBe(false)
})
test('置顶是明确目标的独立命令，不能混入条件、成员或最近时间', () => {
  expect(practicePlanChangeSchema.parse({ kind: 'pin', planId: tagId, pinned: true })).toEqual({
    kind: 'pin',
    planId: tagId,
    pinned: true,
  })
  expect(questionSetChangeSchema.parse({ kind: 'pin', setId: tagId, pinned: false })).toEqual({
    kind: 'pin',
    setId: tagId,
    pinned: false,
  })
  expect(
    practicePlanChangeSchema.safeParse({
      kind: 'pin',
      planId: tagId,
      pinned: true,
      lastUsedAt: '2026-10-28T00:00:00.000Z',
    }).success,
  ).toBe(false)
})
test('再练和明确题目组卷拒绝个人标签筛选及动态方案来源', () => {
  const base = {
    requestId: randomUUID(),
    topicId: null,
    count: 'all',
    replace: null,
    repeat: { sessionId: randomUUID(), selection: 'all' },
  }
  expect(startPracticeSchema.safeParse(base).success).toBe(true)
  expect(startPracticeSchema.safeParse({ ...base, sourcePlanId: randomUUID() }).success).toBe(false)
  expect(
    startPracticeSchema.safeParse({
      ...base,
      filters: { ...EMPTY_QUESTION_FILTERS, personalTagId: tagId },
    }).success,
  ).toBe(false)
})
