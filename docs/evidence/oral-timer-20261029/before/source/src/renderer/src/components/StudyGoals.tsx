import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  type GoalProgress,
  type PlanningHome,
  type PlanningScope,
} from '../../../shared/contracts/planning'
import { createPlanningController } from '../planning-controller'
import { useNoteSaves } from '../note-saves'

export function StudyGoals({
  data,
  disabled,
  onPractice,
  onChanged,
}: {
  data: PlanningHome
  disabled: boolean
  onPractice: (scope: PlanningScope) => void
  onChanged: () => void
}) {
  const saves = useNoteSaves(),
    [controller] = useState(() => createPlanningController(window.desktop.planning))
  const state = useSyncExternalStore(controller.subscribe, controller.getState),
    lifecycle = useRef(0),
    mounted = useRef(false)
  const [selected, setSelected] = useState(''),
    [progress, setProgress] = useState<GoalProgress>(),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false),
    [attempt, setAttempt] = useState(0),
    [discard, setDiscard] = useState(false),
    [message, setMessage] = useState('')
  useEffect(() => {
    mounted.current = true
    const epoch = ++lifecycle.current,
      unregister = saves.registerGuard(controller)
    return () => {
      mounted.current = false
      unregister()
      queueMicrotask(() => {
        if (epoch === lifecycle.current) controller.dispose()
      })
    }
  }, [controller, saves.registerGuard])
  useEffect(() => {
    if (!selected) return
    let current = true
    setProgress(undefined)
    setLoading(true)
    setError('')
    void window.desktop.planning
      .progress({ goalId: selected })
      .then((result) => {
        if (current) {
          if (result.ok) setProgress(result.value)
          else setError(result.error.message)
        }
      })
      .catch(() => {
        if (current) setError('无法读取目标进度。')
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [selected, attempt, data])
  const own = controller.hasPending(),
    busy = state.saving || saves.flushing || (disabled && !own),
    locked = busy || own || loading
  const draft = state.draft?.kind === 'exam' ? state.draft : undefined,
    removing = state.draft?.kind === 'exam-delete' ? state.draft : undefined
  const current = data.goals.find((goal) => goal.goalId === selected)
  async function choose(setId?: string) {
    if (!current || locked || !(await saves.flush()) || !mounted.current) return
    setLoading(true)
    setError('')
    try {
      const result = await window.desktop.planning.scope({
        goalId: current.goalId,
        ...(setId ? { setId } : {}),
      })
      if (!mounted.current) return
      if (result.ok) onPractice(result.value)
      else setError(result.error.message)
    } catch {
      if (mounted.current) setError('无法准备目标题目，请重试。')
    } finally {
      if (mounted.current) setLoading(false)
    }
  }
  function save() {
    if (draft) controller.edit({ ...draft, name: draft.name.trim() })
    void controller.save().then((ok) => {
      if (ok && mounted.current) {
        setMessage(removing ? '备考目标已删除。' : '备考目标已保存。')
        if (removing) {
          setSelected('')
          setProgress(undefined)
          setError('')
        }
        onChanged()
        setAttempt((v) => v + 1)
      }
    })
  }
  return (
    <details className="study-goals">
      <summary>备考目标 · {data.goals.length} / 20</summary>
      <p className="muted">
        关联固定题单的当前成员；题单编辑后范围随之变化。练习覆盖和自评掌握分开显示，不自动承诺已掌握。
      </p>
      <div className="button-row">
        <label>
          查看备考目标
          <select
            aria-label="查看备考目标"
            disabled={locked}
            value={selected}
            onChange={(event) => setSelected(event.currentTarget.value)}
          >
            <option value="">选择目标</option>
            {data.goals.map((goal) => (
              <option key={goal.goalId} value={goal.goalId}>
                {goal.name}
                {goal.deadline ? ` · 截止 ${goal.deadline}` : ''}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={locked || data.goals.length >= 20 || data.sets.length === 0}
          onClick={() => {
            setMessage('')
            controller.begin({
              kind: 'exam',
              goalId: crypto.randomUUID(),
              name: '',
              deadline: null,
              setIds: [],
              expectedRevision: 0,
            })
          }}
        >
          新建备考目标
        </button>
        {current && (
          <>
            <button
              type="button"
              disabled={locked}
              onClick={() =>
                controller.begin({
                  kind: 'exam',
                  goalId: current.goalId,
                  name: current.name,
                  deadline: current.deadline,
                  setIds: current.setIds,
                  expectedRevision: current.revision,
                })
              }
            >
              编辑备考目标
            </button>
            <button
              type="button"
              disabled={locked}
              onClick={() => controller.begin({ kind: 'exam-delete', expected: current })}
            >
              删除备考目标
            </button>
            <button type="button" disabled={locked} onClick={() => setAttempt((v) => v + 1)}>
              刷新备考进度
            </button>
          </>
        )}
      </div>
      {data.sets.length === 0 && <p>先从题库保存固定题单，再把题单关联到备考目标。</p>}
      {current && progress && (
        <section aria-label="备考目标进度">
          <h4>
            {current.name}
            {current.deadline ? ` · 截止 ${current.deadline}` : ''}
          </h4>
          <p>
            已知范围去重 {progress.total} 题 · 可练 {progress.active} 题 · 归档 {progress.archived}{' '}
            题 · 失效 {progress.missing} 题
          </p>
          {progress.sets.some((set) => set.name === null) ? (
            <p role="status">包含失效题单，范围不完整；以下仅为仍存在题单的已知进度。</p>
          ) : null}
          <p>
            当前版本练习覆盖 {progress.practiced} / {progress.active} · 已自评 {progress.rated} /{' '}
            {progress.active} · 自评掌握 {progress.mastered} / {progress.active}
          </p>
          <button
            type="button"
            disabled={
              locked ||
              progress.total === 0 ||
              progress.total > 500 ||
              progress.sets.some((set) => set.name === null)
            }
            onClick={() => void choose()}
          >
            核对整个目标的题目
          </button>
          {progress.total > 500 && <p>范围超过单轮500题，请分题单练习。</p>}
          <ul>
            {progress.sets.map((set) => (
              <li key={set.setId}>
                {set.name ?? `失效题单 ${set.setId}`}{' '}
                {set.count === null ? '' : ` · ${set.count}题`}
                <button
                  type="button"
                  disabled={locked || set.name === null || set.count === 0}
                  onClick={() => void choose(set.setId)}
                >
                  核对此题单
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {loading && <p role="status">正在读取备考范围…</p>}
      {draft && (
        <form
          aria-label="备考目标设置"
          onSubmit={(event) => {
            event.preventDefault()
            if (draft.setIds.length === 0) {
              setError('请至少选择一份题单。')
              return
            }
            save()
          }}
        >
          <fieldset disabled={busy || Boolean(state.pending) || state.conflict}>
            <legend>编辑目标定义</legend>
            <label>
              目标名称
              <input
                aria-label="备考目标名称"
                required
                maxLength={60}
                value={draft.name}
                onChange={(event) => controller.edit({ ...draft, name: event.currentTarget.value })}
              />
            </label>
            <label>
              截止日期（可不设）
              <input
                aria-label="备考截止日期"
                type="date"
                value={draft.deadline ?? ''}
                onChange={(event) =>
                  controller.edit({ ...draft, deadline: event.currentTarget.value || null })
                }
              />
            </label>
            <div className="goal-set-options">
              {[
                ...data.sets,
                ...draft.setIds
                  .filter((id) => !data.sets.some((set) => set.setId === id))
                  .map((setId) => ({ setId, name: `失效题单 ${setId}`, count: 0 })),
              ].map((set) => (
                <label key={set.setId}>
                  <input
                    type="checkbox"
                    checked={draft.setIds.includes(set.setId)}
                    onChange={(event) =>
                      controller.edit({
                        ...draft,
                        setIds: event.currentTarget.checked
                          ? [...draft.setIds, set.setId]
                          : draft.setIds.filter((id) => id !== set.setId),
                      })
                    }
                  />
                  {set.name} · {set.count}题
                </label>
              ))}
            </div>
          </fieldset>
          <div className="button-row">
            <button type="submit" disabled={busy || state.conflict}>
              {state.pending ? '重试原备考保存' : '保存备考目标'}
            </button>
            <button type="button" disabled={state.saving} onClick={() => setDiscard(true)}>
              放弃备考编辑
            </button>
          </div>
        </form>
      )}
      {removing && (
        <div className="inline-confirm">
          <p>确认删除“{removing.expected.name}”的目标定义？学习记录保留。</p>
          <button type="button" disabled={busy || state.conflict} onClick={save}>
            {state.pending ? '重试原目标删除' : '确认删除备考目标'}
          </button>
          <button type="button" disabled={state.saving} onClick={() => setDiscard(true)}>
            取消删除
          </button>
        </div>
      )}
      {discard && (
        <div className="inline-confirm">
          <p>确认放弃尚未确认的本地操作？</p>
          <button
            type="button"
            disabled={state.saving}
            onClick={() => {
              controller.discard()
              setDiscard(false)
              onChanged()
            }}
          >
            确认放弃备考设置
          </button>
          <button type="button" onClick={() => setDiscard(false)}>
            保留备考输入
          </button>
        </div>
      )}
      {(error || state.error) && <p role="alert">{state.error || error}</p>}
      {message && <p role="status">{message}</p>}
    </details>
  )
}
