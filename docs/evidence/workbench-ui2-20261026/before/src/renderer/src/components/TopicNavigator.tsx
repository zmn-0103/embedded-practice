import { useState } from 'react'
import {
  ALL_CATEGORIES,
  matchesCategory,
  type CategoryScope,
  type LibraryNavigation,
} from '../../../shared/contracts/categories'

interface Props extends LibraryNavigation {
  prefix: string
  category: CategoryScope
  topicId: string | null
  archived?: boolean
  disabled?: boolean
  onChange: (category: CategoryScope, topicId: string | null) => void
}

export function TopicNavigator({
  prefix,
  categories,
  topics,
  category,
  topicId,
  archived = false,
  disabled = false,
  onChange,
}: Props) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['uncategorized']))
  const text = query.trim().toLocaleLowerCase()
  const count = (items: typeof topics) =>
    items.reduce((sum, topic) => sum + (archived ? topic.archivedCount : topic.activeCount), 0)
  const grouped = new Map<string | null, typeof topics>()
  for (const topic of topics) {
    const bucket = grouped.get(topic.categoryId)
    if (bucket) bucket.push(topic)
    else grouped.set(topic.categoryId, [topic])
  }
  const groups = [
    { key: 'uncategorized', title: '未分类', scope: { kind: 'uncategorized' } as CategoryScope },
    ...categories.map((item) => ({
      key: `category:${item.categoryId}`,
      title: item.title,
      scope: { kind: 'category', categoryId: item.categoryId } as CategoryScope,
    })),
  ]
  const currentTopic = topics.find((topic) => topic.topicId === topicId)
  const missingCategory =
    category.kind === 'category' &&
    !categories.some((item) => item.categoryId === category.categoryId)
  const movedTopic = currentTopic && !matchesCategory(currentTopic.categoryId, category)
  const visible = groups.flatMap((group) => {
    const children =
      grouped.get(group.scope.kind === 'category' ? group.scope.categoryId : null) ?? []
    const matching = group.title.toLocaleLowerCase().includes(text)
      ? children
      : children.filter((topic) => topic.title.toLocaleLowerCase().includes(text))
    return text && matching.length === 0 && !group.title.toLocaleLowerCase().includes(text)
      ? []
      : [{ ...group, children, matching }]
  })
  return (
    <nav className="topic-navigation" aria-label={`${prefix}分类导航`}>
      <label>
        查找专题
        <input
          type="search"
          aria-label={`${prefix}专题检索`}
          placeholder="搜索分类或专题名称"
          value={query}
          disabled={disabled}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
      </label>
      <p className="muted">检索只收窄导航，选择分类或专题后应用范围。</p>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={category.kind === 'all' && topicId === null}
        onClick={() => onChange(ALL_CATEGORIES, null)}
      >
        全部分类（{count(topics)}题）
      </button>
      {(missingCategory || movedTopic) && (
        <p className="error-message" aria-live="polite">
          {missingCategory
            ? '所选分类已移除，请重新选择分类。'
            : '专题已移出所选分类，请重新选择范围。'}
        </p>
      )}
      <ul className="category-tree">
        {visible.map((group) => {
          const open = text !== '' || expanded.has(group.key)
          const selected =
            category.kind === group.scope.kind &&
            (category.kind !== 'category' ||
              (group.scope.kind === 'category' && category.categoryId === group.scope.categoryId))
          return (
            <li key={group.key}>
              <div className="category-tree-row">
                <button
                  type="button"
                  className="category-toggle"
                  aria-label={`${open ? '收起' : '展开'}${group.title}`}
                  aria-expanded={open}
                  disabled={disabled || text !== ''}
                  onClick={() =>
                    setExpanded((previous) => {
                      const next = new Set(previous)
                      if (next.has(group.key)) next.delete(group.key)
                      else next.add(group.key)
                      return next
                    })
                  }
                >
                  <span aria-hidden="true">{open ? '▾' : '▸'}</span>
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`${prefix}分类：${group.title}`}
                  aria-pressed={selected && topicId === null}
                  onClick={() => onChange(group.scope, null)}
                >
                  {group.title}（{count(group.children)}题）
                </button>
              </div>
              {open && (
                <ul>
                  {group.matching.map((topic) => (
                    <li key={topic.topicId}>
                      <button
                        type="button"
                        disabled={disabled}
                        aria-label={`${prefix}专题：${topic.title}`}
                        aria-pressed={selected && topicId === topic.topicId}
                        onClick={() => onChange(group.scope, topic.topicId)}
                      >
                        {topic.title}（{archived ? topic.archivedCount : topic.activeCount}题）
                      </button>
                    </li>
                  ))}
                  {group.matching.length === 0 && <li className="muted">暂无专题</li>}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
      {visible.length === 0 && <p>没有匹配的专题，可清空检索查看全部导航。</p>}
    </nav>
  )
}
