import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { QuestionIdentity, QuestionDetail } from '../../../shared/contracts/library-desktop'
import { MarkdownContent } from './MarkdownContent'
import { PersonalNote } from './PersonalNote'

export function QuestionComparison({
  source,
  target,
}: {
  source: QuestionIdentity
  target: QuestionIdentity
}) {
  const panel = useRef<HTMLElement>(null)
  const [data, setData] = useState<QuestionDetail[]>(),
    [error, setError] = useState(''),
    [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let current = true
    setData(undefined)
    setError('')
    void Promise.all(
      [source, target].map((identity) => window.desktop.library.getQuestion(identity)),
    )
      .then((results) => {
        if (!current) return
        const details = results.map((result) => {
          if (!result.ok) throw new Error(result.error.message)
          return result.value
        })
        setData(details)
      })
      .catch(() => {
        if (current) setError('无法读取关联题对照，请重新读取。')
      })
    return () => {
      current = false
    }
  }, [source, target, attempt])
  useLayoutEffect(() => {
    if (!data || !panel.current) return
    panel.current.scrollIntoView({ block: 'start' })
    panel.current.focus({ preventScroll: true })
  }, [data])
  if (error)
    return (
      <div role="alert">
        <p>{error}</p>
        <button type="button" onClick={() => setAttempt((value) => value + 1)}>
          重新读取关联题对照
        </button>
      </div>
    )
  if (!data) return <p role="status">正在读取关联题对照…</p>
  return (
    <section ref={panel} tabIndex={-1} className="question-comparison" aria-label="关联题对照">
      <p className="muted">下方是两题当前题干和当前个人笔记，旧轮内容保持；对照不会计为练习。</p>
      <div className="question-comparison-columns">
        {data.map((item, index) => (
          <article
            key={JSON.stringify([item.topicId, item.questionId])}
            aria-label={index === 0 ? '关联来源题' : '关联目标题'}
          >
            <h4>{item.title}</h4>
            <p className="muted">
              {item.topicTitle} · {item.questionId} · 当前内容版本 {item.versionId}
              {item.archived ? ' · 已归档' : ''}
            </p>
            <MarkdownContent body={item.body} versionId={item.versionId} />
            <PersonalNote identity={{ topicId: item.topicId, questionId: item.questionId }} />
          </article>
        ))}
      </div>
    </section>
  )
}
