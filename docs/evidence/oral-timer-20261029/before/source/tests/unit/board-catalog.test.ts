import { describe, expect, it } from 'vitest'
import { createBoardCards, filterBoardCards } from '../../src/renderer/src/board-catalog'
import type { LibraryNavigation } from '../../src/shared/contracts/categories'

function navigation(): LibraryNavigation {
  return {
    categories: [
      { categoryId: 'local-c', title: 'c语言' },
      { categoryId: 'my-notes', title: '我的面试题' },
      { categoryId: 'wireless', title: '无线与物联网' },
      { categoryId: 'c-language', title: '规划键不等于分类' },
    ],
    topics: [
      {
        topicId: 'first',
        title: '指针自测',
        categoryId: 'local-c',
        activeCount: 23,
        archivedCount: 2,
      },
      {
        topicId: 'second',
        title: '字符串',
        categoryId: 'local-c',
        activeCount: 4,
        archivedCount: 1,
      },
      {
        topicId: 'mine',
        title: '项目复盘',
        categoryId: 'my-notes',
        activeCount: 2,
        archivedCount: 0,
      },
      {
        topicId: 'general-uart',
        title: 'UART样题',
        categoryId: null,
        activeCount: 6,
        archivedCount: 0,
      },
      { topicId: 'ble', title: 'BLE', categoryId: 'wireless', activeCount: 1, archivedCount: 0 },
    ],
  }
}

describe('板块入口的真实分类范围', () => {
  it('空库保留22份规划和全部/未分类入口，题数为0，不使用候选估数或生成本机ID', () => {
    const cards = createBoardCards({ categories: [], topics: [] })
    expect(cards).toHaveLength(24)
    expect(new Set(cards.map((card) => card.key)).size).toBe(24)
    expect(cards.filter((card) => card.tier === 'foundation')).toHaveLength(15)
    expect(cards.filter((card) => card.tier === 'extension')).toHaveLength(7)
    const planned = cards.filter((card) => card.tier !== 'overview')
    expect(planned.reduce((sum, card) => sum + card.plannedTopics.length, 0)).toBe(127)
    expect(planned.every((card) => card.scope === null && card.activeCount === 0)).toBe(true)
  })

  it('同名分类只显示一次，使用本机ID和活动题数，归档数单列，自定义和未分类不丢失', () => {
    const input = navigation()
    const before = structuredClone(input)
    const cards = createBoardCards(input)
    const c = cards.find((card) => card.title === 'C语言')!
    expect(c).toMatchObject({
      scope: { kind: 'category', categoryId: 'local-c' },
      activeCount: 27,
      archivedCount: 3,
    })
    expect(
      cards.filter(
        (card) => card.scope?.kind === 'category' && card.scope.categoryId === 'local-c',
      ),
    ).toHaveLength(1)
    expect(cards.find((card) => card.title === '全部题库')).toMatchObject({
      activeCount: 36,
      archivedCount: 3,
    })
    expect(cards.find((card) => card.title === '未分类')).toMatchObject({
      activeCount: 6,
      archivedCount: 0,
    })
    expect(cards.find((card) => card.title === '我的面试题')).toMatchObject({
      tier: 'personal',
      activeCount: 2,
    })
    expect(cards.find((card) => card.title === '规划键不等于分类')).toMatchObject({
      tier: 'personal',
      scope: { kind: 'category', categoryId: 'c-language' },
    })
    // general-uart即使在推荐清单中，也不会自动从未分类搬到通信协议。
    expect(cards.find((card) => card.title === '通信协议')).toMatchObject({
      activeCount: 0,
      scope: null,
    })
    expect(input).toEqual(before)
  })

  it('归属/改名后的卡片跟随新快照，旧分类ID不被规划名重建', () => {
    const input = navigation()
    input.categories[0]!.title = '我的C复习'
    input.topics[0]!.categoryId = null
    const cards = createBoardCards(input)
    expect(cards.find((card) => card.title === 'C语言')).toMatchObject({
      scope: null,
      activeCount: 0,
    })
    expect(cards.find((card) => card.title === '我的C复习')).toMatchObject({
      scope: { kind: 'category', categoryId: 'local-c' },
      activeCount: 4,
    })
    expect(cards.find((card) => card.title === '未分类')?.activeCount).toBe(29)
  })

  it('搜索涵盖未展开的规划专题、实际专题和自定义分类，已有题的拓展方向始终可见', () => {
    const cards = createBoardCards(navigation())
    expect(filterBoardCards(cards, '', false).some((card) => card.title === '无线与物联网')).toBe(
      true,
    )
    expect(filterBoardCards(cards, '', false).some((card) => card.title === 'FPGA与数字设计')).toBe(
      false,
    )
    expect(filterBoardCards(cards, '  verilog  ', false).map((card) => card.title)).toEqual([
      'FPGA与数字设计',
    ])
    expect(filterBoardCards(cards, '我的面试', false).map((card) => card.title)).toEqual([
      '我的面试题',
    ])
    expect(filterBoardCards(cards, '指针自测', false).map((card) => card.title)).toEqual([
      '全部题库',
      'C语言',
    ])
    expect(filterBoardCards(cards, '不匹配任一板块', true)).toEqual([])
    expect(filterBoardCards(cards, '', true)).toHaveLength(cards.length)
  })
})
