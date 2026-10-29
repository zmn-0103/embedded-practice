import { useId, useRef, useState } from 'react'
import { matchesCategory, type LibraryNavigation } from '../../../shared/contracts/categories'
import type { PracticePlan, PracticePlanOptions } from '../../../shared/contracts/practice-plans'
import { usePracticePlans } from '../usePracticePlans'
import { difficultyLabel } from './DifficultyBadge'
import { questionFilterSummary } from './QuestionFilterFields'
import { RECENCY_LABELS } from '../../../shared/contracts/question-filters'

// 与 practice_plans 的 name COLLATE NOCASE 一致：只折叠 ASCII，避免预检比数据库更严。
const foldName = (value: string) => value.replace(/[A-Z]/g, (letter) => letter.toLowerCase())

interface Props extends LibraryNavigation {
  refresh: number
  options: PracticePlanOptions
  disabled: boolean
  onApply: (options: PracticePlanOptions, planId: string) => void
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
  const [editing, setEditing] = useState<{
    original: PracticePlan
    options: PracticePlanOptions
    name: string
    conditions: boolean
  }>()
  const nameInput = useRef<HTMLInputElement>(null)
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
    (selected?.personalTagMissing ||
      !categoryTitle ||
      (config.topicId !== null &&
        (!selectedTopic || !matchesCategory(selectedTopic.categoryId, config.category))))
  const locked =
    disabled || model.busy || model.loading || Boolean(model.readError) || Boolean(model.pending)
  return (
    <details className="practice-plans" open>
      <summary>保存的练习方案（{model.plans.length}）</summary>
      <p className="muted">方案只填入条件，点击开始才建新轮。修改方案不会改变当前练习。</p>
      <p className="muted">置顶优先，同组按最近成功开始练习排序；查看、编辑和填入条件不计使用。</p>
      <fieldset disabled={locked || Boolean(deleting) || Boolean(editing)}>
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
              ref={nameInput}
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
            disabled={
              !name.trim() ||
              model.plans.some((plan) => foldName(plan.name) === foldName(name.trim()))
            }
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
                  {plan.pinned ? '置顶 · ' : ''}
                  {plan.name}（匹配{plan.matchingCount ?? '待读取'}题）
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
        {selected && (
          <p className="muted">
            当前匹配{selected.matchingCount ?? '待读取'}题；
            {selected.lastUsedAt
              ? `最近开始：${new Date(selected.lastUsedAt).toLocaleString('zh-CN')}`
              : '尚未成功开始练习'}
            。{config?.filters.personalTagId ? '已限定个人标签。' : ''}
            {config?.filters.practiceRecency &&
              config.filters.practiceRecency !== 'all' &&
              `最近条件：${RECENCY_LABELS[config.filters.practiceRecency]}。`}
            {config?.filters.practiceOrder === 'oldest' && '最久未练优先；随机时先选数量再打乱。'}
          </p>
        )}
        {invalid && (
          <p className="error-message">
            方案的分类、专题或个人标签已失效，请重新选择条件后更新或另存；原条件保持。
          </p>
        )}
        {selected && (
          <div className="action-row">
            <button
              type="button"
              disabled={!selected || Boolean(invalid)}
              onClick={() => selected && onApply(selected.options, selected.planId)}
            >
              填入条件
            </button>
            <button
              type="button"
              onClick={() =>
                model.perform({ kind: 'pin', planId: selected.planId, pinned: !selected.pinned })
              }
            >
              {selected.pinned ? '取消置顶方案' : '置顶方案'}
            </button>
            <button type="button" disabled={!selected} onClick={() => setDeleting(selected)}>
              删除所选方案…
            </button>
            <button
              type="button"
              onClick={() =>
                setEditing({
                  original: structuredClone(selected),
                  options: structuredClone(selected.options),
                  name: selected.name,
                  conditions: false,
                })
              }
            >
              重命名方案…
            </button>
            <button
              type="button"
              onClick={() =>
                setEditing({
                  original: structuredClone(selected),
                  options: structuredClone(options),
                  name: selected.name,
                  conditions: true,
                })
              }
            >
              用当前条件更新方案…
            </button>
            <button
              type="button"
              onClick={() => {
                setName(`${selected.name.slice(0, 57)} 副本`)
                nameInput.current?.focus()
              }}
            >
              另存当前条件…
            </button>
          </div>
        )}
      </fieldset>
      {editing && (
        <form
          className="practice-plan-confirmation"
          aria-label="编辑练习方案"
          onSubmit={(event) => {
            event.preventDefault()
            if (locked) return
            model.perform({
              kind: 'update',
              planId: editing.original.planId,
              name: editing.name,
              options: editing.options,
              expected: { name: editing.original.name, options: editing.original.options },
            })
            setEditing(undefined)
          }}
        >
          <p>
            {editing.conditions
              ? `将用当前条件更新“${editing.original.name}”。`
              : `重命名“${editing.original.name}”，选题条件保持。`}
          </p>
          {editing.conditions && (
            <p className="muted">
              {questionFilterSummary(editing.options.filters)} ·{' '}
              {editing.options.mode === 'random' ? '随机' : '顺序'} ·{' '}
              {editing.options.count === 'all' ? '全部' : editing.options.count}题
              。分类和专题使用打开此表单时的当前范围。
            </p>
          )}
          <label>
            新方案名称
            <input
              autoFocus
              type="text"
              required
              maxLength={60}
              value={editing.name}
              disabled={locked}
              onChange={(event) => setEditing({ ...editing, name: event.currentTarget.value })}
            />
          </label>
          <div className="button-row">
            <button type="button" disabled={locked} onClick={() => setEditing(undefined)}>
              取消编辑方案
            </button>
            <button
              type="submit"
              className="primary"
              disabled={
                locked ||
                !editing.name.trim() ||
                model.plans.some(
                  (plan) =>
                    plan.planId !== editing.original.planId &&
                    foldName(plan.name) === foldName(editing.name.trim()),
                )
              }
            >
              确认更新方案
            </button>
          </div>
        </form>
      )}
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
            待确认：
            {model.pending.kind === 'delete'
              ? '删除原方案'
              : model.pending.kind === 'pin'
                ? '更新原方案置顶状态'
                : `保存“${model.pending.name}”`}
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
