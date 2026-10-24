import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
  favoriteRequestSchema,
  listRequestSchema,
} from '../../src/shared/contracts/library-desktop'
import { startPracticeSchema } from '../../src/shared/contracts/practice'
import {
  EMPTY_QUESTION_FILTERS,
  questionFiltersSchema,
} from '../../src/shared/contracts/question-filters'

describe('筛选与收藏输入边界', () => {
  it('旧请求解析不补筛选字段，保持已有幂等哈希输入', () => {
    const start = { requestId: randomUUID(), topicId: null, count: 20, replace: null }
    expect(JSON.stringify(startPracticeSchema.parse(start))).toBe(JSON.stringify(start))
    const list = { topicId: null, archived: false, page: 1 }
    expect(listRequestSchema.parse(list)).toEqual(list)
    expect(Object.hasOwn(startPracticeSchema.parse(start), 'filters')).toBe(false)
  })
  it('空白规范化只去两端，字面搜索和标签内部空格保留', () => {
    const query = "%_' OR 1=1 --\\中文 GPIO"
    expect(
      questionFiltersSchema.parse({
        ...EMPTY_QUESTION_FILTERS,
        query: `  ${query}  `,
        tag: '  ARM Cortex  ',
      }),
    ).toEqual({ ...EMPTY_QUESTION_FILTERS, query, tag: 'ARM Cortex' })
    expect(questionFiltersSchema.parse({ ...EMPTY_QUESTION_FILTERS, tag: ' \t ' }).tag).toBeNull()
    expect(
      questionFiltersSchema.parse({ ...EMPTY_QUESTION_FILTERS, query: 'x'.repeat(256) }).query,
    ).toHaveLength(256)
  })
  it.each([
    { query: 'x'.repeat(257) },
    { query: null },
    { tag: ['GPIO'] },
    { difficulty: '困难' },
    { mastery: 'correct' },
    { favoritesOnly: 1 },
    { favoritesOnly: 'false' },
    { includeAnswer: true },
  ])('拒绝越界或含糊筛选 %j', (fields) => {
    expect(questionFiltersSchema.safeParse({ ...EMPTY_QUESTION_FILTERS, ...fields }).success).toBe(
      false,
    )
  })
  it('收藏只接受明确目标，不使用版本或切换语义', () => {
    const setting = { topicId: 'gpio', questionId: 'q-1', favorite: false }
    expect(favoriteRequestSchema.parse(setting)).toEqual(setting)
    for (const invalid of [
      { ...setting, favorite: undefined },
      { ...setting, favorite: 'toggle' },
      { ...setting, versionId: 1 },
      { ...setting, topicId: '../gpio' },
      { ...setting, questionId: '' },
    ]) {
      expect(favoriteRequestSchema.safeParse(invalid).success).toBe(false)
    }
  })
})
