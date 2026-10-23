import type { QuestionFilters } from '../../../shared/contracts/question-filters'

export function QuestionFilterFields({
  prefix,
  filters,
  disabled = false,
  onChange,
}: {
  prefix: '题库' | '练习'
  filters: QuestionFilters
  disabled?: boolean
  onChange: (filters: QuestionFilters) => void
}) {
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
      <label>
        标签
        <input
          type="text"
          aria-label={`${prefix}标签`}
          placeholder="填写题目中的完整标签"
          value={filters.tag ?? ''}
          disabled={disabled}
          onChange={(event) => onChange({ ...filters, tag: event.currentTarget.value || null })}
        />
      </label>
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
              {difficulty}
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
    </div>
  )
}
