import { describe, expect, it } from 'vitest'
import { listRequestSchema } from '../../src/shared/contracts/library-desktop'
import {
  EMPTY_QUESTION_FILTERS,
  questionFiltersSchema,
} from '../../src/shared/contracts/question-filters'

describe('学习工作台的内容更新浏览范围', () => {
  const previous = { topicId: null, archived: false, page: 1 }
  it('旧列表请求保持原形，新范围只接受明确布尔值', () => {
    expect(listRequestSchema.parse(previous)).toEqual(previous)
    expect(listRequestSchema.parse({ ...previous, contentUpdatedOnly: true })).toEqual({
      ...previous,
      contentUpdatedOnly: true,
    })
    for (const value of ['true', 1, null, {}]) {
      expect(listRequestSchema.safeParse({ ...previous, contentUpdatedOnly: value }).success).toBe(
        false,
      )
    }
  })
  it('仍拒绝未知能力，浏览范围不混入旧练习和方案的筛选快照', () => {
    expect(listRequestSchema.safeParse({ ...previous, execute: true }).success).toBe(false)
    expect(
      questionFiltersSchema.safeParse({ ...EMPTY_QUESTION_FILTERS, contentUpdatedOnly: true })
        .success,
    ).toBe(false)
    expect(questionFiltersSchema.parse(EMPTY_QUESTION_FILTERS)).toEqual(EMPTY_QUESTION_FILTERS)
  })
})
