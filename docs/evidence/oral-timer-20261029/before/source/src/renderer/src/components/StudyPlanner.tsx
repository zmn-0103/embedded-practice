import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { localDay, type PlanningHome, type PlanningScope } from '../../../shared/contracts/planning'
import { createPlanningController } from '../planning-controller'
import { useNoteSaves } from '../note-saves'
import { StudyGoals } from './StudyGoals'
import { LearningCalendar } from './LearningCalendar'

export function StudyPlanner({
  refresh,
  disabled,
  onPractice,
  onResume,
  onBusy,
  onOperation,
}: {
  refresh: number
  disabled: boolean
  onPractice: (scope: PlanningScope) => void
  onResume: () => void
  onBusy: (busy: boolean) => void
  onOperation: (work: Promise<boolean>) => void
}) {
  const saves = useNoteSaves(),
    [controller] = useState(() => createPlanningController(window.desktop.planning))
  const state = useSyncExternalStore(controller.subscribe, controller.getState),
    lifecycle = useRef(0)
  const [data, setData] = useState<PlanningHome>(),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false),
    [attempt, setAttempt] = useState(0),
    [message, setMessage] = useState(''),
    [discard, setDiscard] = useState(false)
  const today = localDay()
  useEffect(() => {
    const epoch = ++lifecycle.current,
      unregister = saves.registerGuard(controller)
    return () => {
      unregister()
      queueMicrotask(() => {
        if (epoch === lifecycle.current) controller.dispose()
      })
    }
  }, [controller, saves.registerGuard])
  useEffect(() => {
    let current = true
    setLoading(true)
    setError('')
    void window.desktop.planning
      .home({ day: today })
      .then((result) => {
        if (current) {
          if (result.ok) setData(result.value)
          else setError(result.error.message)
        }
      })
      .catch(() => {
        if (current) setError('无法读取学习目标，请刷新。')
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [today, refresh, attempt, state.confirmed])
  const own = controller.hasPending(),
    busy = state.saving || saves.flushing || (disabled && !own),
    locked = busy || own || loading
  const draft = state.draft?.kind === 'daily' ? state.draft : undefined
  function begin(copy: boolean) {
    if (!data) return
    const value = copy ? data.previous : data.daily
    setMessage('')
    controller.begin({
      kind: 'daily',
      day: today,
      ratingTarget: value?.ratingTarget ?? 10,
      reviewTarget: value?.reviewTarget ?? 3,
      expectedRevision: data.daily?.revision ?? 0,
    })
  }
  return (
    <section className="study-planner" aria-label="学习目标与日历" aria-busy={loading}>
      <div className="section-heading">
        <h3>今天要完成什么</h3>
        <button type="button" disabled={locked} onClick={() => setAttempt((v) => v + 1)}>
          刷新目标进度
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {data && (
        <>
          <div className="daily-goal-summary">
            <p>
              今日自评不同题：<strong>{data.counts.ratingQuestions}</strong>
              {data.daily?.ratingTarget ? ` / ${data.daily.ratingTarget} 题` : ' 题 · 未设目标'}
            </p>
            <p>
              今日完成不同复习待办：<strong>{data.counts.reviewQuestions}</strong>
              {data.daily?.reviewTarget ? ` / ${data.daily.reviewTarget} 条` : ' 条 · 未设目标'}
            </p>
          </div>
          <p className="muted">
            {today} · 成功自评 {data.counts.ratingAttempts} 次 · 明确完成待办{' '}
            {data.counts.reviewAttempts} 次 · 练习揭晓 {data.counts.reveals} 次 · 保存笔记{' '}
            {data.counts.noteSaves} 次
          </p>
          <p className="muted">
            同题同日只计一次目标进度；练习首次揭晓、笔记保存单独计次，浏览题库不计目标。从本版开始记录活动，旧日期可能不完整。
          </p>
          {!own && (
            <div className="button-row">
              <button type="button" disabled={locked} onClick={() => begin(false)}>
                {data.daily ? '编辑今日目标' : '设置今日目标'}
              </button>
              {data.previous && (
                <button type="button" disabled={locked} onClick={() => begin(true)}>
                  沿用 {data.previous.day} 的目标
                </button>
              )}
            </div>
          )}
          {draft && (
            <form
              aria-label="今日目标设置"
              onSubmit={(event) => {
                event.preventDefault()
                void controller.save().then((ok) => {
                  if (ok) setMessage('今日目标已保存。')
                })
              }}
            >
              <fieldset disabled={busy || Boolean(state.pending) || state.conflict}>
                <legend>{draft.day} 的目标（0表示不设置）</legend>
                <label>
                  自评不同题数
                  <input
                    aria-label="目标自评不同题数"
                    type="number"
                    min={0}
                    max={500}
                    step={1}
                    required
                    value={draft.ratingTarget}
                    onChange={(event) =>
                      controller.edit({ ...draft, ratingTarget: event.currentTarget.valueAsNumber })
                    }
                  />
                </label>
                <label>
                  完成不同复习待办数
                  <input
                    aria-label="目标完成不同待办数"
                    type="number"
                    min={0}
                    max={500}
                    step={1}
                    required
                    value={draft.reviewTarget}
                    onChange={(event) =>
                      controller.edit({ ...draft, reviewTarget: event.currentTarget.valueAsNumber })
                    }
                  />
                </label>
              </fieldset>
              <div className="button-row">
                <button type="submit" disabled={busy || state.conflict}>
                  {state.pending ? '重试原目标保存' : '保存今日目标'}
                </button>
                <button type="button" disabled={state.saving} onClick={() => setDiscard(true)}>
                  放弃目标编辑
                </button>
              </div>
              {discard && (
                <div className="inline-confirm">
                  <p>确认放弃尚未确认的本地目标设置？</p>
                  <button
                    type="button"
                    disabled={state.saving}
                    onClick={() => {
                      controller.discard()
                      setDiscard(false)
                    }}
                  >
                    确认放弃目标设置
                  </button>
                  <button type="button" onClick={() => setDiscard(false)}>
                    保留目标输入
                  </button>
                </div>
              )}
            </form>
          )}
        </>
      )}
      {state.error && <p role="alert">{state.error}</p>}
      {message && <p role="status">{message}</p>}
      {data && (
        <StudyGoals
          data={data}
          disabled={disabled || loading}
          onPractice={onPractice}
          onChanged={() => setAttempt((v) => v + 1)}
        />
      )}
      <LearningCalendar
        refresh={refresh + attempt + state.confirmed}
        disabled={disabled || own}
        onResume={onResume}
        onBusy={onBusy}
        onOperation={onOperation}
      />
    </section>
  )
}
