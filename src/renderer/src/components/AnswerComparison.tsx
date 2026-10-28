import { useEffect, useState } from 'react'
import type { HistoryEntry, HistoryEntryRequest } from '../../../shared/contracts/history'
import { MarkdownContent } from './MarkdownContent'

export function AnswerComparison({
  requests,
}: {
  requests: [HistoryEntryRequest, HistoryEntryRequest]
}) {
  const [data, setData] = useState<HistoryEntry[]>()
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const key = JSON.stringify(requests)
  useEffect(() => {
    let current = true
    setData(undefined)
    setError('')
    const inputs = JSON.parse(key) as typeof requests
    void Promise.all(inputs.map((input) => window.desktop.history.getEntry(input)))
      .then((results) => {
        if (!current) return
        const entries = results.map((result) => {
          if (!result.ok) throw new Error(result.error.message)
          return result.value
        })
        setData(entries)
      })
      .catch(() => {
        if (current) setError('无法完整读取这两次记录，请保留选择并重试。')
      })
    return () => {
      current = false
    }
  }, [key, attempt])
  return (
    <section className="answer-comparison" aria-label="两次作答对照">
      <h4>两次作答对照</h4>
      <p className="muted">
        这里只展示实际保存内容与自评变化，自评不代表系统正确率或客观能力评分。
      </p>
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setAttempt(attempt + 1)}>
            重试作答对照
          </button>
        </div>
      ) : !data ? (
        <p role="status">正在读取两次作答…</p>
      ) : (
        <>
          {data[0]?.versionId !== data[1]?.versionId && (
            <p role="alert">
              两次记录的题目版本不同，请结合各自题干看待作答变化，不能直接当作能力变化。
            </p>
          )}
          <div className="answer-comparison-columns">
            {data.map((entry, index) => (
              <section
                key={`${entry.sessionId}/${entry.position}`}
                aria-label={`对照记录${index + 1}`}
              >
                <h5>
                  记录 {index + 1} · {new Date(entry.createdAt).toLocaleString('zh-CN')}
                </h5>
                <p>
                  {entry.title} · 内容版本 {entry.versionSequence} ·{' '}
                  {entry.rating
                    ? `自评：${entry.rating}`
                    : entry.revealedAt
                      ? '已揭晓、未自评'
                      : '未揭晓'}
                </p>
                <h5>当时保存的作答</h5>
                {entry.draft.text ? (
                  <pre className="history-draft">{entry.draft.text}</pre>
                ) : (
                  <p>本次未填写答案。</p>
                )}
                <details>
                  <summary>查看这次记录的题干</summary>
                  <MarkdownContent body={entry.body} versionId={entry.versionId} />
                </details>
              </section>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
