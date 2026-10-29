import { useEffect, useState } from 'react'
import type { QuestionIdentity } from '../../../shared/contracts/library-desktop'
import {
  questionIdentityKey,
  type QuestionSetPreview,
  type SelectedPractice as Selection,
} from '../../../shared/contracts/question-sets'

export interface SelectedPracticeIntent {
  sourceSetId?: string
  id: number
  sourceName: string
  items: QuestionIdentity[]
  contentUpdatedOnly?: boolean
}
export function SelectedPractice({
  intent,
  refresh,
  busy,
  pending,
  error,
  replacing,
  onStart,
  onCancel,
}: {
  intent: SelectedPracticeIntent
  refresh: number
  busy: boolean
  pending: boolean
  error: string
  replacing: boolean
  onStart: (selection?: Selection, mode?: 'sequential' | 'random') => void
  onCancel: () => void
}) {
  const [items, setItems] = useState(() => structuredClone(intent.items))
  const [preview, setPreview] = useState<QuestionSetPreview>()
  const [readError, setReadError] = useState('')
  const [loading, setLoading] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [mode, setMode] = useState<'sequential' | 'random'>('sequential')
  useEffect(() => {
    let current = true
    setLoading(true)
    setReadError('')
    setPreview(undefined)
    void window.desktop.questionSets
      .preview({ items, ...(intent.contentUpdatedOnly ? { contentUpdatedOnly: true } : {}) })
      .then((result) => {
        if (!current) return
        if (!result.ok) {
          setReadError(result.error.message)
          return
        }
        if (
          JSON.stringify(result.value.items.map(questionIdentityKey)) !==
          JSON.stringify(items.map(questionIdentityKey))
        )
          throw new Error('组卷预览与勾选身份不一致')
        setPreview(result.value)
      })
      .catch(() => {
        if (current) setReadError('无法确认组卷内容，请重新读取。')
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [items, refresh, attempt, intent.contentUpdatedOnly])
  const unavailable = preview?.items.filter((item) => item.status !== 'available') ?? []
  const ready =
    preview && preview.items.length > 0 && unavailable.length === 0 && !loading && !readError
  return (
    <section className="selected-practice practice-configuration" aria-label="确认勾选组卷">
      <h2>{intent.sourceName}</h2>
      <p>本轮按明确题目组卷，共 {items.length} 题，不叠加下方条件方案或补入其他题目。</p>
      <p className="muted">
        采用此次预览的当前有效内容。确认开始时再次核对版本和归档状态；新轮保存固定队列，重新隐藏答案。
      </p>
      {intent.contentUpdatedOnly && (
        <p>
          本次仅复习仍标记“内容更新待复习”的题，开始前再次核对状态；查看差异不算已复习，轮内揭晓后也不会移出固定队列。
        </p>
      )}
      <div className="library-filters">
        <label>
          组卷顺序
          <select
            aria-label="组卷顺序"
            value={mode}
            disabled={busy || pending}
            onChange={(event) =>
              setMode(event.currentTarget.value === 'random' ? 'random' : 'sequential')
            }
          >
            <option value="sequential">按勾选顺序</option>
            <option value="random">仅这些题重新随机</option>
          </select>
        </label>
        <button
          type="button"
          disabled={busy || pending || loading}
          onClick={() => setAttempt(attempt + 1)}
        >
          重新读取组卷
        </button>
      </div>
      {loading && <p role="status">正在确认组卷题目…</p>}
      {readError && (
        <p role="alert" className="error-message">
          {readError}
        </p>
      )}
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      {preview && (
        <ol className="selected-question-list">
          {preview.items.map((item) => (
            <li key={questionIdentityKey(item)}>
              <span>{item.title ?? `${item.topicId} / ${item.questionId}`}</span>
              <span className="muted">
                {item.topicTitle ?? '原专题已失效'} ·{' '}
                {item.status === 'available'
                  ? intent.contentUpdatedOnly
                    ? '更新待复习'
                    : '可练习'
                  : item.status === 'archived'
                    ? '已归档'
                    : item.status === 'not-pending'
                      ? '不属于更新待复习'
                      : '已失效'}
              </span>
            </li>
          ))}
        </ol>
      )}
      {unavailable.length > 0 && (
        <div role="alert">
          <p>
            有 {unavailable.length} 项不可用，未自动补题。可以明确移出本轮组卷，保存的题单保持。
          </p>
          <button
            type="button"
            disabled={busy || pending || loading}
            onClick={() =>
              setItems(
                preview!.items
                  .filter((item) => item.status === 'available')
                  .map(({ topicId, questionId }) => ({ topicId, questionId })),
              )
            }
          >
            从本轮移除不可用项
          </button>
        </div>
      )}
      <div className="button-row">
        <button type="button" disabled={busy || pending} onClick={onCancel}>
          返回条件选题
        </button>
        <button
          type="button"
          className="primary"
          disabled={busy || (!pending && !ready)}
          onClick={() => {
            if (pending) {
              onStart()
              return
            }
            if (!ready) return
            const versions = preview.items.flatMap((item) =>
              item.status === 'available'
                ? [
                    {
                      topicId: item.topicId,
                      questionId: item.questionId,
                      versionId: item.versionId,
                    },
                  ]
                : [],
            )
            onStart(
              {
                sourceName: intent.sourceName,
                ...(intent.sourceSetId && JSON.stringify(items) === JSON.stringify(intent.items)
                  ? { sourceSetId: intent.sourceSetId }
                  : {}),
                items: versions,
                ...(intent.contentUpdatedOnly ? { contentUpdatedOnly: true } : {}),
              },
              mode,
            )
          }}
        >
          {pending
            ? intent.contentUpdatedOnly
              ? '重试开始更新题复习'
              : '重试开始组卷'
            : replacing
              ? `结束原轮并开始${intent.contentUpdatedOnly ? '更新题复习' : '组卷'}（${items.length}题）`
              : `确认开始${intent.contentUpdatedOnly ? '更新题复习' : '组卷'}（${items.length}题）`}
        </button>
      </div>
    </section>
  )
}
