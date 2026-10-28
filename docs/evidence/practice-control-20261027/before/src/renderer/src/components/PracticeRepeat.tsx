import { useState } from 'react'
import type {
  PracticeView,
  RepeatPractice,
  StartPractice,
} from '../../../shared/contracts/practice'

export interface PracticeRepeatActions {
  busy: boolean
  pending: boolean
  error: string
  start: (repeat?: RepeatPractice, mode?: StartPractice['mode']) => void
}

export function PracticeRepeat({
  session,
  actions,
}: {
  session: PracticeView['session']
  actions: PracticeRepeatActions
}) {
  const [selection, setSelection] = useState<RepeatPractice['selection']>('weak')
  const [mode, setMode] = useState<'sequential' | 'random'>('sequential')
  const choices: { value: RepeatPractice['selection']; label: string; count: number }[] = [
    { value: 'unknown', label: '本轮不会', count: session.counts.ratings.不会 },
    {
      value: 'weak',
      label: '本轮不会＋不熟',
      count: session.counts.ratings.不会 + session.counts.ratings.不熟,
    },
    { value: 'skipped', label: '本轮仍未揭晓的跳过题', count: session.counts.skipped },
    { value: 'unrated', label: '本轮已揭晓、未自评', count: session.counts.unrated },
    { value: 'all', label: '全部原题', count: session.total },
  ]
  const selected = choices.find((choice) => choice.value === selection)!
  return (
    <form
      className="practice-configuration"
      aria-label="本轮题目再练"
      onSubmit={(event) => {
        event.preventDefault()
        if (actions.busy || (!actions.pending && selected.count === 0)) return
        if (actions.pending) actions.start()
        else actions.start({ sessionId: session.sessionId, selection }, mode)
      }}
    >
      <h3>接着复习这一轮</h3>
      <fieldset disabled={actions.busy || actions.pending}>
        <legend>选择再练范围与顺序</legend>
        <div className="library-filters">
          <label>
            再练范围
            <select
              aria-label="再练范围"
              value={selection}
              onChange={(event) =>
                setSelection(event.currentTarget.value as RepeatPractice['selection'])
              }
            >
              {choices.map((choice) => (
                <option key={choice.value} value={choice.value}>
                  {choice.label}（{choice.count}题）
                </option>
              ))}
            </select>
          </label>
          <label>
            再练顺序
            <select
              aria-label="再练顺序"
              value={mode}
              onChange={(event) =>
                setMode(event.currentTarget.value === 'random' ? 'random' : 'sequential')
              }
            >
              <option value="sequential">沿用原顺序</option>
              <option value="random">重新随机</option>
            </select>
          </label>
        </div>
      </fieldset>
      <p aria-live="polite">
        仅从刚结束的这一轮选择“{selected.label}”，共 {selected.count} 题。
      </p>
      <p className="muted">
        再练沿用这一轮保存的题目和参考答案版本；其后更新或归档也不替换内容。
        将新建一轮，原作答保留，新轮重新隐藏答案。跳过与已揭晓未自评分开选择。
      </p>
      {selected.count === 0 && !actions.pending && (
        <p className="muted">该范围没有题目，请选择其他范围。</p>
      )}
      {actions.error && (
        <p role="alert" className="error-message">
          {actions.error}
        </p>
      )}
      <button
        type="submit"
        className="primary"
        disabled={actions.busy || (!actions.pending && selected.count === 0)}
      >
        {actions.pending ? '重试开始再练' : `确认再练 ${selected.count} 题`}
      </button>
    </form>
  )
}
