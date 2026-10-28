import { useEffect, useState } from 'react'
import type { RoundList } from '../../../shared/contracts/study'
import { RoundDetail } from './RoundDetail'
import { useNoteSaves } from '../note-saves'

export function RoundReview({
  refresh,
  topics,
  onBusy,
  onOperation,
}: {
  refresh: number
  topics: { topicId: string; title: string }[]
  onBusy: (busy: boolean) => void
  onOperation: (work: Promise<boolean>) => void
}) {
  const saves = useNoteSaves()
  const [topicId, setTopicId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string>()
  const [data, setData] = useState<RoundList>()
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [exportBusy, setExportBusy] = useState(false)
  useEffect(() => {
    let current = true
    setData(undefined)
    setError('')
    void window.desktop.study
      .listRounds({ topicId, page })
      .then((result) => {
        if (!current) return
        if (result.ok) setData(result.value)
        else setError(result.error.message)
      })
      .catch(() => {
        if (current) setError('无法读取练习轮次，请重试。')
      })
    return () => {
      current = false
    }
  }, [refresh, topicId, page, attempt])
  const change = (work: () => void) => {
    void saves.flush().then((saved) => {
      if (saved) work()
    })
  }
  const locked = exportBusy || saves.flushing
  return (
    <section className="round-review" aria-label="按练习轮次复盘">
      <h3>已结束的练习轮次</h3>
      <p className="muted">
        按包含的题目专题查找，保留原轮范围、题目版本和作答。进行中的轮次请先继续或结束；查看复盘不会更改任何自评或复习状态。
      </p>
      <label>
        轮次包含专题
        <select
          aria-label="轮次包含专题"
          value={topicId ?? ''}
          disabled={locked}
          onChange={(event) => {
            const value = event.currentTarget.value
            change(() => {
              setTopicId(value || null)
              setPage(1)
              setSelected(undefined)
            })
          }}
        >
          <option value="">全部专题</option>
          {topicId && !topics.some((topic) => topic.topicId === topicId) && (
            <option value={topicId}>原专题已失效</option>
          )}
          {topics.map((topic) => (
            <option key={topic.topicId} value={topic.topicId}>
              {topic.title}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={locked}
        onClick={() =>
          change(() => {
            setSelected(undefined)
            setAttempt(attempt + 1)
          })
        }
      >
        重新读取轮次
      </button>
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <button type="button" disabled={locked} onClick={() => setAttempt(attempt + 1)}>
            重试读取轮次
          </button>
        </div>
      ) : !data ? (
        <p role="status">正在读取已结束轮次…</p>
      ) : (
        <>
          <p>共 {data.total} 轮</p>
          {!data.total && <p>尚无符合范围的已结束轮次。</p>}
          <ol className="round-list">
            {data.rounds.map((session) => (
              <li key={session.sessionId} data-session-id={session.sessionId}>
                <strong>
                  {session.selectionName ??
                    (session.topicId
                      ? (topics.find((topic) => topic.topicId === session.topicId)?.title ??
                        '原专题练习')
                      : '全部/混合专题练习')}
                </strong>
                <p>
                  {new Date(session.createdAt).toLocaleString('zh-CN')} ·{' '}
                  {session.status === 'finished' ? '已完成' : '已结束'} ·{' '}
                  {session.mode === 'random' ? '随机' : '顺序'} · {session.total}题
                </p>
                <button
                  type="button"
                  disabled={locked}
                  aria-expanded={selected === session.sessionId}
                  onClick={() =>
                    change(() =>
                      setSelected(selected === session.sessionId ? undefined : session.sessionId),
                    )
                  }
                >
                  {selected === session.sessionId ? '收起这一轮' : '查看这一轮'}
                </button>
              </li>
            ))}
          </ol>
          <nav className="pagination" aria-label="练习轮次分页">
            <button
              type="button"
              disabled={data.page <= 1 || locked}
              onClick={() =>
                change(() => {
                  setSelected(undefined)
                  setPage(data.page - 1)
                })
              }
            >
              上一页
            </button>
            <span>
              {data.page} / {Math.max(1, Math.ceil(data.total / data.pageSize))}
            </span>
            <button
              type="button"
              disabled={data.page * data.pageSize >= data.total || locked}
              onClick={() =>
                change(() => {
                  setSelected(undefined)
                  setPage(data.page + 1)
                })
              }
            >
              下一页
            </button>
          </nav>
        </>
      )}
      {selected && (
        <RoundDetail
          key={selected}
          sessionId={selected}
          onBusy={(value) => {
            setExportBusy(value)
            onBusy(value)
          }}
          onOperation={onOperation}
        />
      )}
    </section>
  )
}
