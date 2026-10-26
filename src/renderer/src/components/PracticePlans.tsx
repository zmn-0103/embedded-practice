import { useId, useState } from 'react'
import { matchesCategory, type LibraryNavigation } from '../../../shared/contracts/categories'
import type { PracticePlan, PracticePlanOptions } from '../../../shared/contracts/practice-plans'
import { usePracticePlans } from '../usePracticePlans'
import { difficultyLabel } from './DifficultyBadge'

interface Props extends LibraryNavigation {
  refresh: number
  options: PracticePlanOptions
  disabled: boolean
  onApply: (options: PracticePlanOptions) => void
  onBlocked: (blocked: boolean) => void
  onOperation: (work: Promise<boolean>) => void
}

export function PracticePlans({
  refresh,
  options,
  disabled,
  topics,
  categories,
  onApply,
  onBlocked,
  onOperation,
}: Props) {
  const model = usePracticePlans(refresh, onBlocked, onOperation)
  const [name, setName] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [deleting, setDeleting] = useState<PracticePlan>()
  const dialogId = useId()
  const selected = model.plans.find((plan) => plan.planId === selectedId)
  const config = selected?.options
  const scope = config?.category
  const selectedTopic = topics.find((topic) => topic.topicId === config?.topicId)
  const categoryTitle =
    scope?.kind === 'category'
      ? categories.find((category) => category.categoryId === scope.categoryId)?.title
      : scope?.kind === 'uncategorized'
        ? '未分类'
        : '全部分类'
  const invalid =
    config &&
    (!categoryTitle ||
      (config.topicId !== null &&
        (!selectedTopic || !matchesCategory(selectedTopic.categoryId, config.category))))
  const locked =
    disabled || model.busy || model.loading || Boolean(model.readError) || Boolean(model.pending)
  return (
    <details className="practice-plans" open>
      <summary>保存的练习方案（{model.plans.length}）</summary>
      <p className="muted">方案只填入条件，点击开始才建新轮。同名方案不会覆盖。</p>
      <fieldset disabled={locked || Boolean(deleting)}>
        <legend>保存当前条件</legend>
        <form
          className="library-filters"
          onSubmit={(event) => {
            event.preventDefault()
            if (locked || deleting) return
            model.perform({
              kind: 'save',
              planId: globalThis.crypto.randomUUID(),
              name,
              options: structuredClone(options),
            })
          }}
        >
          <label>
            方案名称
            <input
              type="text"
              aria-label="方案名称"
              maxLength={60}
              required
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
            />
          </label>
          <button
            type="submit"
            disabled={!name.trim() || model.plans.some((plan) => plan.name === name.trim())}
          >
            保存当前条件为方案
          </button>
        </form>
        {model.plans.length === 0 && <p className="muted">尚无方案。填写名称可保存当前条件。</p>}
        {model.plans.length > 0 && (
          <label>
            选用方案
            <select
              aria-label="选用练习方案"
              value={selectedId}
              onChange={(event) => setSelectedId(event.currentTarget.value)}
            >
              <option value="">请选择方案</option>
              {selectedId && !selected && (
                <option value={selectedId} disabled>
                  方案已删除
                </option>
              )}
              {model.plans.map((plan) => (
                <option key={plan.planId} value={plan.planId}>
                  {plan.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {selected && (
          <p className="muted">
            {selected.name}：{categoryTitle ?? '分类已移除'} /{' '}
            {config?.topicId === null ? '全部专题' : (selectedTopic?.title ?? '专题已失效')} /{' '}
            {config?.mode === 'random' ? '随机' : '顺序'} /{' '}
            {config?.count === 'all' ? '全部' : config?.count}题
          </p>
        )}
        {config && (
          <p className="muted">
            搜索：{config.filters.query || '不限'}；标签：{config.filters.tag ?? '不限'}； 难度：
            {config.filters.difficulty ? difficultyLabel(config.filters.difficulty) : '不限'}；
            自评：
            {config.filters.mastery === 'all'
              ? '不限'
              : config.filters.mastery === 'unpracticed'
                ? '未练习'
                : config.filters.mastery}
            ； 收藏：{config.filters.favoritesOnly ? '只看收藏' : '不限'}。
          </p>
        )}
        {invalid && (
          <p className="error-message">
            方案的分类或专题已不在当前活动范围，请重新选择条件后另存；原条件保持。
          </p>
        )}
        {selected && (
          <div className="action-row">
            <button
              type="button"
              disabled={!selected || Boolean(invalid)}
              onClick={() => selected && onApply(selected.options)}
            >
              填入条件
            </button>
            <button type="button" disabled={!selected} onClick={() => setDeleting(selected)}>
              删除所选方案…
            </button>
          </div>
        )}
      </fieldset>
      {deleting && (
        <div role="alertdialog" aria-labelledby={dialogId} className="practice-plan-confirmation">
          <p id={dialogId}>删除方案“{deleting.name}”？题目、当前练习和记录都会保留。</p>
          <button type="button" autoFocus onClick={() => setDeleting(undefined)}>
            取消删除方案
          </button>
          <button
            type="button"
            disabled={disabled || model.busy}
            onClick={() => {
              model.perform({ kind: 'delete', planId: deleting.planId })
              setDeleting(undefined)
            }}
          >
            确认删除方案
          </button>
        </div>
      )}
      {model.loading && <p className="muted">正在读取练习方案…</p>}
      {model.readError && (
        <div role="alert">
          <p>{model.readError}</p>
          <button
            type="button"
            disabled={disabled || model.busy || model.loading}
            onClick={() => void model.reload()}
          >
            重试读取练习方案
          </button>
        </div>
      )}
      {model.error && (
        <p role="alert" className="error-message">
          {model.error}
        </p>
      )}
      {model.pending && !model.busy && (
        <div>
          <p>
            待确认：{model.pending.kind === 'save' ? `保存“${model.pending.name}”` : '删除原方案'}
            。重试保持原条件和目标。
          </p>
          <button
            type="button"
            disabled={disabled}
            onClick={() => model.pending && model.perform(model.pending)}
          >
            重试原方案操作
          </button>
          <button type="button" disabled={disabled} onClick={model.abandon}>
            停止重试并核对
          </button>
        </div>
      )}
      {model.message && <p role="status">{model.message}</p>}
    </details>
  )
}
