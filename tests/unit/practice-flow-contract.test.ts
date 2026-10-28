import { randomUUID } from 'node:crypto'
import { expect, test } from 'vitest'
import { startPracticeSchema } from '../../src/shared/contracts/practice'
import { practicePlanChangeSchema } from '../../src/shared/contracts/practice-plans'
import {
  EMPTY_QUESTION_FILTERS,
  questionFiltersSchema,
} from '../../src/shared/contracts/question-filters'

const start = { requestId: randomUUID(), topicId: null, count: 'all', replace: null }
const repeat = { sessionId: randomUUID(), selection: 'weak' }

test.each(['unknown', 'weak', 'skipped', 'unrated', 'all'])(
  '再练范围%s只接受明确来源',
  (selection) => {
    const input = { ...start, repeat: { ...repeat, selection }, mode: 'random' }
    expect(startPracticeSchema.parse(input)).toEqual(input)
  },
)

test.each([
  { topicId: 'other-topic' },
  { count: 10 },
  { category: { kind: 'uncategorized' } },
  { filters: { ...EMPTY_QUESTION_FILTERS, mastery: '不会＋不熟' } },
  { repeat: { ...repeat, selection: 'unseen' } },
  { repeat: { ...repeat, sessionId: '../invalid' } },
  { repeat: { ...repeat, questionIds: ['q-1'] } },
])('再练拒绝来源外筛选或含糊范围%j', (changed) => {
  expect(startPracticeSchema.safeParse({ ...start, repeat, ...changed }).success).toBe(false)
})

test('联合自评是明确状态，旧单状态和空条件保持', () => {
  expect(
    questionFiltersSchema.parse({ ...EMPTY_QUESTION_FILTERS, mastery: '不会＋不熟' }).mastery,
  ).toBe('不会＋不熟')
  expect(questionFiltersSchema.parse(EMPTY_QUESTION_FILTERS)).toEqual(EMPTY_QUESTION_FILTERS)
  expect(
    questionFiltersSchema.safeParse({ ...EMPTY_QUESTION_FILTERS, mastery: ['不会', '不熟'] })
      .success,
  ).toBe(false)
})

test('编辑方案必须提供原名称和完整原条件，不接受盲覆盖或额外执行能力', () => {
  const options = {
    category: { kind: 'all' },
    topicId: null,
    mode: 'random',
    count: 10,
    filters: { ...EMPTY_QUESTION_FILTERS, mastery: '不会＋不熟' },
  }
  const command = {
    kind: 'update',
    planId: randomUUID(),
    name: '  复习方案  ',
    options,
    expected: { name: '原方案', options },
  }
  expect(practicePlanChangeSchema.parse(command)).toEqual({ ...command, name: '复习方案' })
  for (const changed of [
    { expected: undefined },
    { expected: { name: '原方案' } },
    { name: '换\n行' },
    { queue: ['q-1'] },
    { start: true },
  ])
    expect(practicePlanChangeSchema.safeParse({ ...command, ...changed }).success).toBe(false)
})
