import { useEffect, useState } from 'react'
import {
  PRACTICE_OUTLINE_PAGE_SIZE,
  type PracticeOutline as Outline,
  type PracticeView,
} from '../../../shared/contracts/practice'

export function PracticeOutline({
  session,
  disabled,
  onJump,
}: {
  session: PracticeView['session']
  disabled: boolean
  onJump: (position: number) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(
    () => Math.floor(session.position / PRACTICE_OUTLINE_PAGE_SIZE) + 1,
  )
  const [data, setData] = useState<Outline>()
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!open) return
    let current = true
    setLoading(true)
    setError('')
    setData(undefined)
    void window.desktop.practice
      .outline({ sessionId: session.sessionId, page })
      .then((result) => {
        if (!current) return
        if (result.ok) setData(result.value)
        else setError(result.error.message)
      })
      .catch(() => {
        if (current) setError('无法读取本轮题目清单，请重试。')
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [open, session.sessionId, session.revision, page, attempt])
  return (
    <details
      className="practice-outline"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>本轮题目清单（{session.total}题）</summary>
      <p className="muted">
        查看清单不会揭晓答案。跳转前先保存当前输入；“曾跳过”与当前自评分开显示。
      </p>
      <div className="button-row">
        <button type="button" disabled={loading || page === 1} onClick={() => setPage(page - 1)}>
          清单上一页
        </button>
        <span>
          第 {page} / {Math.ceil(session.total / PRACTICE_OUTLINE_PAGE_SIZE)} 页
        </span>
        <button
          type="button"
          disabled={loading || page * PRACTICE_OUTLINE_PAGE_SIZE >= session.total}
          onClick={() => setPage(page + 1)}
        >
          清单下一页
        </button>
        <button
          type="button"
          onClick={() => {
            setPage(Math.floor(session.position / PRACTICE_OUTLINE_PAGE_SIZE) + 1)
            setAttempt(attempt + 1)
          }}
        >
          定位当前题
        </button>
      </div>
      {loading && <p role="status">正在读取本轮清单…</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setAttempt(attempt + 1)}>
            重试读取本轮清单
          </button>
        </div>
      )}
      {data && (
        <ol className="practice-outline-list" start={(page - 1) * PRACTICE_OUTLINE_PAGE_SIZE + 1}>
          {data.items.map((item) => (
            <li key={item.position}>
              <button
                type="button"
                aria-current={item.position === session.position ? 'step' : undefined}
                disabled={disabled || item.position === session.position}
                onClick={() => {
                  void onJump(item.position).then((saved) => {
                    if (saved) setOpen(false)
                  })
                }}
              >
                <span>
                  {item.position + 1}. {item.title}
                </span>
                <span className="muted">
                  {item.topicTitle} ·{' '}
                  {item.revealed ? (item.rating ?? '已揭晓、未自评') : '尚未揭晓'}
                  {item.skipped ? ' · 曾跳过' : ''}
                  {item.position === session.position ? ' · 当前位置' : ''}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </details>
  )
}
