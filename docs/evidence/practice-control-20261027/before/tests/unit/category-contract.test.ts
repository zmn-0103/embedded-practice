import { describe, expect, it } from 'vitest'
import {
  categoryChangeSchema,
  categoryScopeSchema,
  categorySnapshotSchema,
  libraryNavigationSchema,
  matchesCategory,
} from '../../src/shared/contracts/categories'

describe('分类命令与范围契约', () => {
  it('创建/改名规范化名称，归属是明确目标，可移回未分类', () => {
    expect(categoryChangeSchema.parse({ kind: 'create', title: '  STM32  ' })).toEqual({
      kind: 'create',
      title: 'STM32',
    })
    expect(
      categoryChangeSchema.parse({ kind: 'rename', categoryId: 'group-a', title: ' UART ' }),
    ).toEqual({
      kind: 'rename',
      categoryId: 'group-a',
      title: 'UART',
    })
    for (const categoryId of ['group-a', null])
      expect(
        categoryChangeSchema.parse({ kind: 'assign', topicId: 'topic-a', categoryId }),
      ).toEqual({
        kind: 'assign',
        topicId: 'topic-a',
        categoryId,
      })
    expect(categoryChangeSchema.parse({ kind: 'delete', categoryId: 'group-a' })).toEqual({
      kind: 'delete',
      categoryId: 'group-a',
    })
  })
  it.each([
    { kind: 'create', title: '' },
    { kind: 'create', title: '   ' },
    { kind: 'create', title: 'a'.repeat(61) },
    { kind: 'create', title: 'a\nb' },
    { kind: 'create', title: 'a\0b' },
    { kind: 'create', title: '未分类' },
    { kind: 'create', title: '全部分类' },
    { kind: 'create', title: 1 },
    { kind: 'create', title: 'A', categoryId: 'attacker' },
    { kind: 'rename', title: 'A' },
    { kind: 'rename', title: 'A', categoryId: '../x' },
    { kind: 'rename', title: 'A', categoryId: 'a'.repeat(101) },
    { kind: 'delete', categoryId: null },
    { kind: 'delete', categoryId: 'group-a', deleteQuestions: true },
    { kind: 'assign', topicId: 'topic-a' },
    { kind: 'assign', topicId: 'topic-a', categoryId: '../x' },
    { kind: 'assign', topicId: '../../private', categoryId: null },
    { kind: 'assign', topicId: 'topic-a', categoryId: null, sql: 'DELETE' },
    { kind: 'move-all', categoryId: 'group-a' },
  ])('拒绝无效或越权分类命令 %j', (value) => {
    expect(categoryChangeSchema.safeParse(value).success).toBe(false)
  })
  it('所有/未分类/指定分类语义独立，严格拒绝混入名称或额外条件', () => {
    for (const value of [
      { kind: 'all' },
      { kind: 'uncategorized' },
      { kind: 'category', categoryId: 'a' },
    ])
      expect(categoryScopeSchema.parse(value)).toEqual(value)
    for (const value of [
      null,
      {},
      { kind: 'all', categoryId: 'a' },
      { kind: 'category' },
      { kind: 'category', categoryId: 'a', title: '旧名' },
    ])
      expect(categoryScopeSchema.safeParse(value).success).toBe(false)
    expect(matchesCategory('a', { kind: 'all' })).toBe(true)
    expect(matchesCategory(null, { kind: 'all' })).toBe(true)
    expect(matchesCategory(null, { kind: 'uncategorized' })).toBe(true)
    expect(matchesCategory('a', { kind: 'uncategorized' })).toBe(false)
    expect(matchesCategory('a', { kind: 'category', categoryId: 'a' })).toBe(true)
    expect(matchesCategory('b', { kind: 'category', categoryId: 'a' })).toBe(false)
    expect(matchesCategory(null, { kind: 'category', categoryId: 'a' })).toBe(false)
  })
  it('旧轮的分类名称与ID独立保留，不能以缺失名称伪造有效快照', () => {
    const old = { kind: 'category', categoryId: 'removed-id', title: '创建时名称' }
    expect(categorySnapshotSchema.parse(old)).toEqual(old)
    for (const value of [
      { kind: 'category', categoryId: 'a' },
      { ...old, title: '' },
      { ...old, title: ' a ' },
      { kind: 'all', title: 'A' },
    ])
      expect(categorySnapshotSchema.safeParse(value).success).toBe(false)
  })
  it('导航只返回分类/专题归属及非负计数，不承载答案或任意路径', () => {
    const navigation = {
      categories: [{ categoryId: 'a', title: 'A' }],
      topics: [{ topicId: 't', title: 'T', categoryId: 'a', activeCount: 1, archivedCount: 0 }],
    }
    expect(libraryNavigationSchema.parse(navigation)).toEqual(navigation)
    expect(libraryNavigationSchema.safeParse({ ...navigation, answer: '隐私' }).success).toBe(false)
    expect(
      libraryNavigationSchema.safeParse({
        ...navigation,
        topics: [{ ...navigation.topics[0], categoryId: 1 }],
      }).success,
    ).toBe(false)
    expect(
      libraryNavigationSchema.safeParse({
        ...navigation,
        topics: [{ ...navigation.topics[0], activeCount: -1 }],
      }).success,
    ).toBe(false)
  })
})
