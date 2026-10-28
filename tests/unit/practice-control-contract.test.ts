import { randomUUID } from 'node:crypto'
import { expect, test } from 'vitest'
import {
  navigatePracticeSchema,
  practiceOutlineSchema,
  startPracticeSchema,
} from '../../src/shared/contracts/practice'
import {
  questionIdentitiesSchema,
  questionSetChangeSchema,
  questionSetPreviewSchema,
  selectedPracticeSchema,
} from '../../src/shared/contracts/question-sets'
import { EMPTY_QUESTION_FILTERS } from '../../src/shared/contracts/question-filters'

const identity = { topicId: 'control-topic', questionId: 'q-1' }
const selected = { sourceName: '题单：面试准备', items: [{ ...identity, versionId: 1 }] }
const start = { requestId: randomUUID(), topicId: null, count: 'all', replace: null, selected }
const definition = { setId: randomUUID(), name: '原题单', items: [identity] }

test('临时勾选可为空，保存题单和建轮必须非空；500题边界不静默截断', () => {
  expect(questionIdentitiesSchema.parse([])).toEqual([])
  expect(selectedPracticeSchema.safeParse({ ...selected, items: [] }).success).toBe(false)
  expect(
    questionSetChangeSchema.safeParse({ kind: 'save', ...definition, items: [] }).success,
  ).toBe(false)
  const items = Array.from({ length: 500 }, (_, n) => ({ ...identity, questionId: `q-${n}` }))
  expect(questionIdentitiesSchema.parse(items)).toEqual(items)
  expect(
    questionIdentitiesSchema.safeParse([...items, { ...identity, questionId: 'q-500' }]).success,
  ).toBe(false)
})

test('同一身份禁止重复；不同专题可使用相同题号', () => {
  expect(questionIdentitiesSchema.safeParse([identity, identity]).success).toBe(false)
  expect(
    selectedPracticeSchema.safeParse({
      ...selected,
      items: [selected.items[0], { ...selected.items[0], versionId: 2 }],
    }).success,
  ).toBe(false)
  expect(
    questionIdentitiesSchema.parse([identity, { ...identity, topicId: 'another' }]),
  ).toHaveLength(2)
})

test('题单改名保存需完整原定义，拒绝控制符、版本或执行能力', () => {
  const command = {
    ...definition,
    kind: 'update',
    name: '  新名称  ',
    expected: { name: definition.name, items: definition.items },
  }
  expect(questionSetChangeSchema.parse(command)).toEqual({ ...command, name: '新名称' })
  for (const changed of [
    { expected: undefined },
    { expected: { name: '原题单' } },
    { name: '换\n行' },
    { items: [{ ...identity, versionId: 1 }] },
    { start: true },
  ])
    expect(questionSetChangeSchema.safeParse({ ...command, ...changed }).success).toBe(false)
})

test.each([
  { topicId: 'other' },
  { count: 10 },
  { category: { kind: 'uncategorized' } },
  { filters: { ...EMPTY_QUESTION_FILTERS, mastery: '不会＋不熟' } },
  { repeat: { sessionId: randomUUID(), selection: 'all' } },
  { selected: { ...selected, items: [identity] } },
])('明确组卷拒绝混入筛选、再练或缺失版本 %j', (changed) => {
  expect(startPracticeSchema.safeParse({ ...start, ...changed }).success).toBe(false)
})

test('明确组卷可选随机，但不会改成条件选题', () => {
  expect(startPracticeSchema.parse({ ...start, mode: 'random' })).toEqual({
    ...start,
    mode: 'random',
  })
})

const jump = {
  requestId: randomUUID(),
  cursor: { sessionId: randomUUID(), position: 0, revision: 1 },
  draft: { revision: 0, text: '' },
  direction: 'jump',
  targetPosition: 5,
}
test('跳题要求明确非负目标；原导航不得夹带目标', () => {
  expect(navigatePracticeSchema.parse(jump)).toEqual(jump)
  for (const changed of [
    { targetPosition: undefined },
    { targetPosition: -1 },
    { targetPosition: 1.5 },
    { direction: 'next' },
  ])
    expect(navigatePracticeSchema.safeParse({ ...jump, ...changed }).success).toBe(false)
})

const item = {
  ...identity,
  position: 0,
  title: '标题',
  topicTitle: '专题',
  revealed: false,
  rating: null,
  skipped: true,
}
const outline = {
  sessionId: randomUUID(),
  status: 'active',
  position: 0,
  revision: 0,
  total: 1,
  page: 1,
  items: [item],
}
test('本轮清单仅传元数据，未揭晓和曾跳过独立于自评', () => {
  expect(practiceOutlineSchema.parse(outline)).toEqual(outline)
  for (const changed of [
    { body: '题干' },
    { answer: '答案' },
    { draft: '旧作答' },
    { rating: '不会' },
  ])
    expect(
      practiceOutlineSchema.safeParse({ ...outline, items: [{ ...item, ...changed }] }).success,
    ).toBe(false)
})

test('清单分页必须完整连续，拒绝页外或截断结果', () => {
  const items = Array.from({ length: 50 }, (_, position) => ({ ...item, position }))
  expect(practiceOutlineSchema.parse({ ...outline, total: 51, items }).items).toHaveLength(50)
  expect(
    practiceOutlineSchema.safeParse({ ...outline, total: 51, items: items.slice(1) }).success,
  ).toBe(false)
  expect(practiceOutlineSchema.safeParse({ ...outline, page: 2 }).success).toBe(false)
  expect(
    practiceOutlineSchema.parse({
      ...outline,
      total: 51,
      page: 2,
      items: [{ ...item, position: 50 }],
    }).items[0]?.position,
  ).toBe(50)
})

test('题单预览不附带答案或草稿，失效身份仍保留', () => {
  const missing = { ...identity, status: 'missing', versionId: null, title: null, topicTitle: null }
  expect(questionSetPreviewSchema.parse({ definition, items: [missing] }).items).toEqual([missing])
  expect(
    questionSetPreviewSchema.safeParse({ definition, items: [{ ...missing, answer: '泄露' }] })
      .success,
  ).toBe(false)
})
