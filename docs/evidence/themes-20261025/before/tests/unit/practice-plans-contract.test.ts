import { randomUUID } from 'node:crypto'
import { expect, test } from 'vitest'
import {
  practicePlanChangeSchema,
  practicePlanSchema,
  practicePlansResultSchema,
} from '../../src/shared/contracts/practice-plans'
import { EMPTY_QUESTION_FILTERS } from '../../src/shared/contracts/question-filters'

const options = {
  category: { kind: 'all' },
  topicId: null,
  mode: 'random',
  count: 20,
  filters: { ...EMPTY_QUESTION_FILTERS },
}
const plan = { planId: randomUUID(), name: 'STM32不熟20题', options }
test('方案保存完整规范化条件，只有明确保存/删除命令，无队列或作答', () => {
  expect(practicePlanChangeSchema.parse({ ...plan, name: '  中文方案  ', kind: 'save' })).toEqual({
    ...plan,
    name: '中文方案',
    kind: 'save',
  })
  expect(practicePlanChangeSchema.parse({ kind: 'delete', planId: plan.planId })).toEqual({
    kind: 'delete',
    planId: plan.planId,
  })
  expect(
    practicePlanSchema.parse({
      ...plan,
      options: { ...options, category: { kind: 'category', categoryId: 'removed-category' } },
    }).options.category.kind,
  ).toBe('category')
})
test.each([
  { ...plan, name: '   ' },
  { ...plan, name: '中'.repeat(61) },
  { ...plan, name: '换\n行' },
  { ...plan, planId: '../file' },
  { ...plan, options: { ...options, count: 0 } },
  { ...plan, options: { ...options, mode: 'execute' } },
  { ...plan, options: { ...options, filters: {} } },
  { ...plan, options: { ...options, category: { kind: 'all', categoryId: 'unexpected' } } },
  { ...plan, options: { ...options, topicId: 1 } },
  { ...plan, queue: ['q-1'] },
  { ...plan, answer: '不可混入' },
])('方案拒绝缺失/非法条件及额外能力 %#', (input) => {
  expect(practicePlanChangeSchema.safeParse({ ...input, kind: 'save' }).success).toBe(false)
})
test('方案回包不能伪造成功、泄漏正文或超过100份，合法空列表保持明确', () => {
  expect(practicePlansResultSchema.parse({ ok: true, value: [] })).toEqual({ ok: true, value: [] })
  for (const value of [Array.from({ length: 101 }, () => plan), [{ ...plan, sql: 'SELECT' }], [{}]])
    expect(practicePlansResultSchema.safeParse({ ok: true, value }).success).toBe(false)
  expect(practicePlansResultSchema.safeParse({ ok: true }).success).toBe(false)
  expect(
    practicePlansResultSchema.safeParse({
      ok: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: '失败', stack: 'private' },
    }).success,
  ).toBe(false)
})
