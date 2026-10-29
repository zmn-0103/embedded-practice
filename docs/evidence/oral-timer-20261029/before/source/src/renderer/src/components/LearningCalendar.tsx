import { useEffect, useState } from 'react'
import {
  ACTIVITY_LABELS,
  localDay,
  monthSchema,
  type PlanningMonth,
  type PlanningDay,
} from '../../../shared/contracts/planning'
import { useNoteSaves } from '../note-saves'
import { RoundDetail } from './RoundDetail'

export function LearningCalendar({
  refresh,
  disabled,
  onResume,
  onBusy,
  onOperation,
}: {
  refresh: number
  disabled: boolean
  onResume: () => void
  onBusy: (busy: boolean) => void
  onOperation: (work: Promise<boolean>) => void
}) {
  const saves = useNoteSaves(),
    [open, setOpen] = useState(false),
    [month, setMonth] = useState(localDay().slice(0, 7)),
    [day, setDay] = useState(localDay()),
    [eventPage, setEventPage] = useState(1),
    [roundPage, setRoundPage] = useState(1),
    [attempt, setAttempt] = useState(0)
  const [calendar, setCalendar] = useState<PlanningMonth>(),
    [detail, setDetail] = useState<PlanningDay>(),
    [error, setError] = useState(''),
    [monthError, setMonthError] = useState(''),
    [loading, setLoading] = useState(false),
    [round, setRound] = useState<string>()
  useEffect(() => {
    if (!open) return
    let current = true
    setCalendar(undefined)
    setMonthError('')
    void window.desktop.planning
      .month({ month })
      .then((result) => {
        if (current) {
          if (result.ok) setCalendar(result.value)
          else setMonthError(result.error.message)
        }
      })
      .catch(() => {
        if (current) setMonthError('无法读取学习日历。')
      })
    return () => {
      current = false
    }
  }, [open, month, refresh, attempt])
  useEffect(() => {
    if (!open) return
    let current = true
    setDetail(undefined)
    setError('')
    setLoading(true)
    void window.desktop.planning
      .day({ day, eventPage, roundPage })
      .then((result) => {
        if (current) {
          if (result.ok) setDetail(result.value)
          else setError(result.error.message)
        }
      })
      .catch(() => {
        if (current) setError('无法读取当日学习记录。')
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [open, day, eventPage, roundPage, refresh, attempt])
  const date = new Date(`${month}-01T12:00:00`),
    offset = (date.getDay() + 6) % 7,
    last = new Date(date)
  last.setMonth(last.getMonth() + 1, 0)
  const days = Array.from(
    { length: last.getDate() },
    (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`,
  )
  function change(work: () => void) {
    void saves.flush().then((ok) => {
      if (ok) work()
    })
  }
  return (
    <details
      className="learning-calendar"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>学习日历与当日记录</summary>
      <p className="muted">
        活动次数从本版开始记录；原有轮次可按已保存的开始、结束、揭晓和自评时间回看。浏览题库不计自评目标。
      </p>
      <div className="button-row">
        <label>
          查看月份
          <input
            aria-label="日历月份"
            type="month"
            disabled={disabled || loading}
            value={month}
            onChange={(event) => {
              const value = event.currentTarget.value
              if (monthSchema.safeParse(value).success)
                change(() => {
                  setMonth(value)
                  setDay(`${value}-01`)
                  setEventPage(1)
                  setRoundPage(1)
                  setRound(undefined)
                })
            }}
          />
        </label>
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => change(() => setAttempt((v) => v + 1))}
        >
          刷新日历记录
        </button>
      </div>
      {monthError && <p role="alert">{monthError}</p>}
      <div className="calendar-grid" aria-label={`${month} 学习日历`}>
        {['一', '二', '三', '四', '五', '六', '日'].map((name) => (
          <span key={name} className="calendar-weekday">
            周{name}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={`blank${i}`} aria-hidden="true" />
        ))}
        {days.map((value) => {
          const item = calendar?.days.find((item) => item.day === value)
          return (
            <button
              type="button"
              key={value}
              aria-label={`查看 ${value} 的学习记录`}
              aria-pressed={value === day}
              disabled={disabled || loading}
              onClick={() =>
                change(() => {
                  setDay(value)
                  setEventPage(1)
                  setRoundPage(1)
                  setRound(undefined)
                })
              }
            >
              <strong>{Number(value.slice(-2))}</strong>
              <span>{item ? `${item.activities}次 · ${item.rounds}轮` : '—'}</span>
            </button>
          )
        })}
      </div>
      {loading && <p role="status">正在读取当天记录…</p>}
      {error && <p role="alert">{error}</p>}
      {detail && (
        <section aria-label="当日学习记录">
          <h4>{day} 的记录</h4>
          <p>
            活动 {detail.eventTotal} 条 · 关联轮次 {detail.roundTotal} 轮
          </p>
          {detail.events.length === 0 ? (
            <p>这一天没有本版记录的学习活动。</p>
          ) : (
            <ul className="calendar-events">
              {detail.events.map((item) => (
                <li key={item.activityId}>
                  <time>{new Date(item.occurredAt).toLocaleTimeString()}</time> ·{' '}
                  {ACTIVITY_LABELS[item.kind]} · {item.topicTitle} / {item.title}
                </li>
              ))}
            </ul>
          )}
          <div className="button-row">
            <button
              type="button"
              disabled={disabled || loading || detail.eventPage <= 1}
              onClick={() => change(() => setEventPage(detail.eventPage - 1))}
            >
              上一页活动
            </button>
            <span>
              活动第 {detail.eventPage} / {Math.max(1, Math.ceil(detail.eventTotal / 20))} 页
            </span>
            <button
              type="button"
              disabled={disabled || loading || detail.eventPage * 20 >= detail.eventTotal}
              onClick={() => change(() => setEventPage(detail.eventPage + 1))}
            >
              下一页活动
            </button>
          </div>
          {detail.rounds.length === 0 ? (
            <p>这一天没有已保存时间可关联的轮次。</p>
          ) : (
            <ul className="calendar-rounds">
              {detail.rounds.map((item) => (
                <li key={item.sessionId}>
                  <span>
                    {item.title} · {item.total}题 ·{' '}
                    {item.status === 'active'
                      ? '进行中'
                      : item.status === 'finished'
                        ? '已完成'
                        : '已结束'}
                  </span>
                  <button
                    type="button"
                    disabled={disabled || loading}
                    onClick={() =>
                      change(() => {
                        if (item.status === 'active') onResume()
                        else setRound(item.sessionId)
                      })
                    }
                  >
                    {item.status === 'active' ? '继续此轮' : '回看此轮'}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="button-row">
            <button
              type="button"
              disabled={disabled || loading || detail.roundPage <= 1}
              onClick={() =>
                change(() => {
                  setRound(undefined)
                  setRoundPage(detail.roundPage - 1)
                })
              }
            >
              上一页当日轮次
            </button>
            <span>
              轮次第 {detail.roundPage} / {Math.max(1, Math.ceil(detail.roundTotal / 20))} 页
            </span>
            <button
              type="button"
              disabled={disabled || loading || detail.roundPage * 20 >= detail.roundTotal}
              onClick={() =>
                change(() => {
                  setRound(undefined)
                  setRoundPage(detail.roundPage + 1)
                })
              }
            >
              下一页当日轮次
            </button>
          </div>
        </section>
      )}
      {round && (
        <div className="calendar-round-detail">
          <button
            type="button"
            disabled={disabled}
            onClick={() => change(() => setRound(undefined))}
          >
            收起当日轮次复盘
          </button>
          <RoundDetail key={round} sessionId={round} onBusy={onBusy} onOperation={onOperation} />
        </div>
      )}
    </details>
  )
}
