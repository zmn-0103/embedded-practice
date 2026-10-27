import type { ReactNode } from 'react'
import type { QuestionFilters } from '../../../shared/contracts/question-filters'
import { TagPicker } from './TagPicker'
import { difficultyLabel } from './DifficultyBadge'

export function questionFilterSummary(filters: QuestionFilters) {
  return (
    [
      filters.query && `搜索：${filters.query}`,
      filters.tag && `标签：${filters.tag}`,
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
}: {
  prefix: '题库' | '练习'
  filters: QuestionFilters
  tagOptions: string[]
  disabled?: boolean
  onChange: (filters: QuestionFilters) => void
  compact?: boolean
  advancedContent?: ReactNode
}) {
  const advanced = (
    <>
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
