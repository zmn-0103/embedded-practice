/// <reference types="vite/client" />
import { z } from 'zod'
import catalogSource from '../../../question-banks/catalog/板块规划.json?raw'
import {
  matchesCategory,
  type CategoryScope,
  type LibraryNavigation,
} from '../../shared/contracts/categories'

// 只读取展示规划；已有专题的归属与题数始终以本机导航快照为准。
const catalog = z
  .object({
    schemaVersion: z.literal(1),
    boards: z.array(
      z.object({
        key: z.string().min(1),
        title: z.string().min(1),
        tier: z.enum(['foundation', 'extension']),
        order: z.number().int().positive(),
        summary: z.string(),
        plannedTopics: z.array(z.string().min(1)),
        boundary: z.string(),
      }),
    ),
  })
  .parse(JSON.parse(catalogSource))

export interface BoardCard {
  key: string
  title: string
  tier: 'foundation' | 'extension' | 'personal' | 'overview'
  summary: string
  plannedTopics: string[]
  boundary: string
  scope: CategoryScope | null
  topics: LibraryNavigation['topics']
  activeCount: number
  archivedCount: number
}

export function createBoardCards(navigation: LibraryNavigation): BoardCard[] {
  const merged = new Set<string>()
  function card(
    definition: Omit<BoardCard, 'topics' | 'activeCount' | 'archivedCount'>,
  ): BoardCard {
    const scope = definition.scope
    const topics = navigation.topics.filter(
      (topic) => scope && matchesCategory(topic.categoryId, scope),
    )
    return {
      ...definition,
      topics,
      activeCount: topics.reduce((sum, topic) => sum + topic.activeCount, 0),
      archivedCount: topics.reduce((sum, topic) => sum + topic.archivedCount, 0),
    }
  }
  const planned = [...catalog.boards]
    .sort((a, b) => a.order - b.order)
    .map((plan) => {
      // 与分类名称既有的ASCII大小写语义一致，不以规划key代替本机ID。
      const category = navigation.categories.find(
        (item) => item.title.toLowerCase() === plan.title.toLowerCase(),
      )
      if (category) merged.add(category.categoryId)
      return card({
        key: `planned:${plan.key}`,
        title: plan.title,
        tier: plan.tier,
        summary: plan.summary,
        plannedTopics: plan.plannedTopics,
        boundary: plan.boundary,
        scope: category ? { kind: 'category', categoryId: category.categoryId } : null,
      })
    })
  const personal = navigation.categories
    .filter((category) => !merged.has(category.categoryId))
    .map((category) =>
      card({
        key: `local:${category.categoryId}`,
        title: category.title,
        tier: 'personal',
        summary: '本机自定义分类，沿用原有专题归属。',
        plannedTopics: [],
        boundary: '',
        scope: { kind: 'category', categoryId: category.categoryId },
      }),
    )
  const overview = [
    { key: 'all', title: '全部题库', scope: { kind: 'all' } as const },
    { key: 'uncategorized', title: '未分类', scope: { kind: 'uncategorized' } as const },
  ].map((item) =>
    card({
      ...item,
      tier: 'overview',
      summary: item.key === 'all' ? '浏览本机已导入的全部题目。' : '新导入且尚未安排归属的专题。',
      plannedTopics: [],
      boundary: '',
    }),
  )
  return [...overview, ...planned, ...personal]
}

export function filterBoardCards(cards: BoardCard[], query: string, extensions: boolean) {
  const text = query.trim().toLocaleLowerCase()
  return cards.filter(
    (card) =>
      (!text ? extensions || card.tier !== 'extension' || card.activeCount > 0 : true) &&
      (!text ||
        [
          card.title,
          card.summary,
          ...card.plannedTopics,
          ...card.topics.map((topic) => topic.title),
        ]
          .join('\n')
          .toLocaleLowerCase()
          .includes(text)),
  )
}
