import { useEffect, useState } from 'react'
import type {
  HistoryEntry,
  HistoryEntryRequest,
  HistoryPage,
  HistorySummary,
} from '../../../shared/contracts/history'
import { MarkdownContent } from './MarkdownContent'

interface HistoryProps {
  topicId: string
  questionId: string
  excludeSessionId?: string
}
function date(value: string) {
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}
function status(entry: HistorySummary) {
  if (entry.rating) return `已揭晓 · 自评：${entry.rating}`
  if (entry.revealedAt) return '已揭晓，未自评'
  return entry.skippedAt ? '已跳过，未揭晓' : '已保存草稿，未揭晓'
}

function SavedEntry(request: HistoryEntryRequest) {
  const [entry, setEntry] = useState<HistoryEntry>()
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const { topicId, questionId, sessionId, position } = request
  useEffect(() => {
    let active = true
    setEntry(undefined)
    setError('')
    void window.desktop.history
      .getEntry({ topicId, questionId, sessionId, position })
      .then((result) => {
        if (!active) return
        if (result.ok) setEntry(result.value)
        else setError(result.error.message)
      })
      .catch(() => {
        if (active) setError('无法读取本次记录，请重试。')
      })
    return () => {
      active = false
    }
  }, [topicId, questionId, sessionId, position, attempt])
  if (error)
    return (
      <div role="alert" className="error-message">
        <p>{error}</p>
        <button type="button" onClick={() => setAttempt((value) => value + 1)}>
          重试读取本次记录
        </button>
      </div>
    )
  if (!entry) return <p aria-live="polite">正在读取本次记录…</p>
  return (
    <div className="history-entry" aria-label="历史记录详情">
      <section aria-label="历史作答">
        <h5>当时保存的作答</h5>
        {entry.draft.text ? (
          <pre className="history-draft">{entry.draft.text}</pre>
        ) : (
          <p>本次未填写答案。</p>
        )}
      </section>
      <section aria-label="历史题干">
        <h5>当时的题目</h5>
        <MarkdownContent body={entry.body} versionId={entry.versionId} />
      </section>
      {entry.answer ? (
        <section aria-label="历史参考答案">
          <h5>当时已揭晓的参考答案</h5>
          <MarkdownContent body={entry.answer} versionId={entry.versionId} />
        </section>
      ) : (
        <p className="muted">本次尚未揭晓参考答案。</p>
      )}
    </div>
  )
}

function HistoryRecords({ topicId, questionId, excludeSessionId }: HistoryProps) {
  const [data, setData] = useState<HistoryPage>()
  const [page, setPage] = useState(1)
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<string>()
  useEffect(() => {
    let active = true
    setData(undefined)
    setSelected(undefined)
    setError('')
    void window.desktop.history
      .list({
        topicId,
        questionId,
        page,
        ...(excludeSessionId ? { excludeSessionId } : {}),
      })
      .then((result) => {
        if (!active) return
        if (result.ok) setData(result.value)
        else setError(result.error.message)
      })
      .catch(() => {
        if (active) setError('无法读取本题历史，请重试。')
      })
    return () => {
      active = false
    }
  }, [topicId, questionId, excludeSessionId, page, attempt])
  function turn(next: number) {
    setData(undefined)
    setSelected(undefined)
    setPage(next)
  }
  return (
    <section aria-label="本题历史" className="history-records">
      {excludeSessionId && <p className="muted">本轮记录不在此处重复展示。</p>}
      {error ? (
        <div role="alert" className="error-message">
          <p>{error}</p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>
            重试读取历史
          </button>
        </div>
      ) : !data ? (
        <p aria-live="polite">正在读取历史…</p>
      ) : (
        <>
          <p className="muted">共 {data.total} 条历史记录</p>
          {data.total === 0 && <p>尚无历史记录。</p>}
          <ol className="history-list">
            {data.entries.map((item) => {
              const key = `${item.sessionId}/${item.position}`
              const expanded = selected === key
              return (
                <li key={key}>
                  <h5>{item.title}</h5>
                  <p className="muted">
                    {item.topicTitle} · 内容版本 {item.versionSequence} ·{' '}
                    {item.isCurrentVersion ? '当前版本' : '旧版本'}
                  </p>
                  <p>
                    {item.mode === 'random' ? '随机练习' : '顺序练习'} ·{' '}
                    {item.sessionStatus === 'active'
                      ? '本轮进行中'
                      : item.sessionStatus === 'finished'
                        ? '本轮已完成'
                        : '本轮已结束'}
                  </p>
                  <p>{status(item)}</p>
                  <dl className="history-times">
                    <div>
                      <dt>本轮开始</dt>
                      <dd>{date(item.createdAt)}</dd>
                    </div>
                    {item.endedAt && (
                      <div>
                        <dt>本轮结束</dt>
                        <dd>{date(item.endedAt)}</dd>
                      </div>
                    )}
                    {item.revealedAt && (
                      <div>
                        <dt>首次揭晓</dt>
                        <dd>{date(item.revealedAt)}</dd>
                      </div>
                    )}
                    {item.ratedAt && (
                      <div>
                        <dt>自评保存</dt>
                        <dd>{date(item.ratedAt)}</dd>
                      </div>
                    )}
                    {item.skippedAt && (
                      <div>
                        <dt>曾跳过</dt>
                        <dd>{date(item.skippedAt)}</dd>
                      </div>
                    )}
                  </dl>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setSelected(expanded ? undefined : key)}
                  >
                    {expanded ? '收起本次记录' : '展开本次记录'}
                  </button>
                  {expanded && (
                    <SavedEntry
                      key={key}
                      topicId={topicId}
                      questionId={questionId}
                      sessionId={item.sessionId}
                      position={item.position}
                    />
                  )}
                </li>
              )
            })}
          </ol>
          <nav className="pagination" aria-label="历史分页">
            <button type="button" disabled={data.page <= 1} onClick={() => turn(data.page - 1)}>
              上一页
            </button>
            <span>
              {data.page} / {Math.max(1, Math.ceil(data.total / data.pageSize))}
            </span>
            <button
              type="button"
              disabled={data.page * data.pageSize >= data.total}
              onClick={() => turn(data.page + 1)}
            >
              下一页
            </button>
          </nav>
        </>
      )}
    </section>
  )
}

function HistoryToggle(props: HistoryProps) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="question-history">
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
        {expanded ? '收起本题历史' : '查看本题历史'}
      </button>
      {expanded && <HistoryRecords {...props} />}
    </div>
  )
}

export function QuestionHistory(props: HistoryProps) {
  // 题目或排除轮变化时同步重置，旧响应与旧作答不会短暂展示到另一题。
  return (
    <HistoryToggle
      key={`${props.topicId}/${props.questionId}/${props.excludeSessionId ?? ''}`}
      {...props}
    />
  )
}
