import { describe, expect, it } from 'vitest'
import {
  learningResultSchema,
  learningScopeSchema,
  learningSummarySchema,
} from '../../src/shared/contracts/learning'

const empty = {
  topicId: null,
  archived: false,
  topics: [],
  total: 0,
  revealed: 0,
  rated: 0,
  favorites: 0,
  contentUpdated: 0,
  ratings: { 不会: 0, 不熟: 0, 掌握: 0 },
}

describe('学习记录的范围、摘要与失败边界', () => {
  it('接受全部或单专题的活动/归档范围，不注入其他默认值', () => {
    for (const topicId of [null, 'stm32-gpio'])
      for (const archived of [false, true])
        expect(learningScopeSchema.parse({ topicId, archived })).toEqual({ topicId, archived })
  })
  it.each([
    {},
    { topicId: null, archived: 'false' },
    { topicId: '../private', archived: false },
    { topicId: '', archived: false },
    { topicId: null, archived: false, page: 1 },
    { topicId: null, archived: false, sql: 'SELECT *' },
    { topicId: null, archived: false, filters: {} },
  ])('拒绝缺失、非法范围或额外能力 %j', (value) => {
    expect(learningScopeSchema.safeParse(value).success).toBe(false)
  })
  it('空库是真实零摘要，旧数据只有有效自评时不强制补造揭晓', () => {
    expect(learningSummarySchema.parse(empty)).toEqual(empty)
    expect(
      learningSummarySchema.parse({
        ...empty,
        total: 1,
        rated: 1,
        ratings: { 不会: 0, 不熟: 1, 掌握: 0 },
      }).revealed,
    ).toBe(0)
  })
  it.each([
    { total: -1 },
    { revealed: 0.5 },
    { total: 1, rated: 2, ratings: { 不会: 2, 不熟: 0, 掌握: 0 } },
    { total: 1, revealed: 2 },
    { total: 1, favorites: 2 },
    { total: 1, contentUpdated: 2 },
    { total: 1, rated: 1 },
    { total: 1, ratings: { 不会: 0, 不熟: 0, 掌握: 1 } },
    { answer: '不得出现在摘要' },
    { draft: '不得出现在摘要' },
  ])('拒绝非法计数、分布或正文 %j', (change) => {
    expect(learningSummarySchema.safeParse({ ...empty, ...change }).success).toBe(false)
  })
  it('错误与成功不能混用，不返回数据库路径或未定义错误码', () => {
    expect(
      learningResultSchema.parse({
        ok: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: '读取失败，请重试。' },
      }).ok,
    ).toBe(false)
    expect(learningResultSchema.safeParse({ ok: false, value: empty }).success).toBe(false)
    expect(
      learningResultSchema.safeParse({
        ok: false,
        error: { code: 'SQL_ERROR', message: '失败', path: 'private' },
      }).success,
    ).toBe(false)
  })
})
