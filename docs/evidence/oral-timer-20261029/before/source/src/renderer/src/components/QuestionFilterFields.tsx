import { useEffect, useState, type ReactNode } from 'react'
import type { PersonalTag } from '../../../shared/contracts/personal-tags'
import { RECENCY_LABELS, type QuestionFilters } from '../../../shared/contracts/question-filters'
import { TagPicker } from './TagPicker'
import { difficultyLabel } from './DifficultyBadge'

export function questionFilterSummary(filters: QuestionFilters) {
  return (
    [
      filters.query && `搜索：${filters.query}`,
      filters.tag && `标签：${filters.tag}`,
      filters.personalTagId && '已限定个人标签',
      filters.practiceRecency &&
        filters.practiceRecency !== 'all' &&
        RECENCY_LABELS[filters.practiceRecency],
      filters.practiceOrder === 'oldest' && '最久未练优先',
      filters.difficulty && `难度：${difficultyLabel(filters.difficulty)}`,
      filters.mastery !== 'all' &&
        `自评：${filters.mastery === 'unpracticed' ? '未练习' : filters.mastery}`,
      filters.favoritesOnly && '只看收藏',
    ]
      .filter(Boolean)
      .join(' · ') || '全部题目，未限定其他条件'
  )
}

export function QuestionFilterFields({
  prefix,
  filters,
  tagOptions,
  disabled = false,
  onChange,
  compact = false,
  advancedContent,
  refresh = 0,
}: {
  prefix: '题库' | '练习'
  filters: QuestionFilters
  tagOptions: string[]
  disabled?: boolean
  onChange: (filters: QuestionFilters) => void
  compact?: boolean
  advancedContent?: ReactNode
  refresh?: number
}) {
  const [personalTags, setPersonalTags] = useState<PersonalTag[]>([])
  const [tagError, setTagError] = useState('')
  const [tagAttempt, setTagAttempt] = useState(0)
  useEffect(() => {
    let current = true
    setTagError('')
    void window.desktop.personalTags
      .list()
      .then((result) => {
        if (!current) return
        if (result.ok) setPersonalTags(result.value)
        else setTagError(result.error.message)
      })
      .catch(() => {
        if (current) setTagError('无法读取个人标签，请重试。')
      })
    return () => {
      current = false
    }
  }, [refresh, tagAttempt])
  const advanced = (
    <>
      <details className="recent-practice-filters">
        <summary>最近练习与排序</summary>
        <label>
          当前版本最近练习
          <select
            aria-label={`${prefix}最近练习`}
            value={filters.practiceRecency ?? 'all'}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                ...filters,
                practiceRecency: event.currentTarget.value as NonNullable<
                  QuestionFilters['practiceRecency']
                >,
              })
            }
          >
            {Object.entries(RECENCY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          选题优先级
          <select
            aria-label={`${prefix}选题优先级`}
            value={filters.practiceOrder ?? 'default'}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                ...filters,
                practiceOrder: event.currentTarget.value as NonNullable<
                  QuestionFilters['practiceOrder']
                >,
              })
            }
          >
            <option value="default">默认顺序</option>
            <option value="oldest">最久未练优先</option>
          </select>
        </label>
        <p className="muted">
          按当前版本最近揭晓计算。最久优先先选本轮数量；随机模式只打乱选出的这批题。只有自评而未记录时间的旧题不猜日期。
        </p>
      </details>
      <label>
        个人标签
        <select
          aria-label={`${prefix}个人标签`}
          value={filters.personalTagId ?? ''}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...filters, personalTagId: event.currentTarget.value || null })
          }
        >
          <option value="">全部个人标签</option>
          {filters.personalTagId &&
            !personalTags.some((tag) => tag.tagId === filters.personalTagId) && (
              <option value={filters.personalTagId} disabled>
                {tagError ? '个人标签未读取' : '个人标签已删除或正在读取'}
              </option>
            )}
          {personalTags.map((tag) => (
            <option key={tag.tagId} value={tag.tagId}>
              {tag.name}
            </option>
          ))}
        </select>
      </label>
      {tagError && (
        <div role="alert">
          {tagError}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setTagAttempt((value) => value + 1)}
          >
            重试读取个人标签
          </button>
        </div>
      )}
      <TagPicker
        label={`${prefix}标签`}
        value={filters.tag}
        options={tagOptions}
        disabled={disabled}
        onChange={(tag) => onChange({ ...filters, tag })}
      />
      <label>
        难度
        <select
          aria-label={`${prefix}难度`}
          value={filters.difficulty ?? ''}
          disabled={disabled}
          onChange={(event) =>
            onChange({
              ...filters,
              difficulty: (event.currentTarget.value || null) as QuestionFilters['difficulty'],
            })
          }
        >
          <option value="">全部难度</option>
          {(['未分级', '基础', '进阶', '综合'] as const).map((difficulty) => (
            <option key={difficulty} value={difficulty}>
              {difficultyLabel(difficulty)}
            </option>
          ))}
        </select>
      </label>
      <label>
        自评状态
        <select
          aria-label={`${prefix}自评状态`}
          value={filters.mastery}
          disabled={disabled}
          onChange={(event) =>
            onChange({
              ...filters,
              mastery: event.currentTarget.value as QuestionFilters['mastery'],
            })
          }
        >
          <option value="all">全部状态</option>
          <option value="unpracticed">未练习</option>
          <option value="不会＋不熟">不会＋不熟</option>
          {(['不会', '不熟', '掌握'] as const).map((rating) => (
            <option key={rating} value={rating}>
              {rating}
            </option>
          ))}
        </select>
      </label>
    </>
  )
  return (
    <div className="library-filters question-filter-fields">
      <label>
        {prefix}搜索
        <input
          type="search"
          aria-label={`${prefix}搜索`}
          placeholder="标题、题干或标签"
          maxLength={256}
          value={filters.query}
          disabled={disabled}
          onChange={(event) => onChange({ ...filters, query: event.currentTarget.value })}
        />
      </label>
      {!compact && advanced}
      <label>
        <input
          type="checkbox"
          aria-label={`${prefix}只看收藏`}
          checked={filters.favoritesOnly}
          disabled={disabled}
          onChange={(event) => onChange({ ...filters, favoritesOnly: event.currentTarget.checked })}
        />
        只看收藏
      </label>
      {compact && (
        <details className="advanced-question-filters">
          <summary>高级筛选</summary>
          <div className="library-filters">
            {advanced}
            {advancedContent}
          </div>
        </details>
      )}
      <p className="filter-summary" aria-label={`${prefix}已选条件`}>
        {questionFilterSummary(filters)}
      </p>
    </div>
  )
}
