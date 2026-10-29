import { useEffect, useState } from 'react'
import type { QuestionIdentity } from '../../../shared/contracts/library-desktop'
import {
  MAX_QUESTION_SET_ITEMS,
  questionIdentityKey,
} from '../../../shared/contracts/question-sets'
import type { ReviewListRequest, ReviewPage } from '../../../shared/contracts/review-todos'
import { useNoteSaves } from '../note-saves'
import { ReviewTodoEditor } from './ReviewTodoEditor'

export function ReviewTodos({
  refresh,
  disabled,
  onPractice,
}: {
  refresh: number
  disabled: boolean
  onPractice: ((items: QuestionIdentity[], sourceName: string) => void) | undefined
}) {
  const saves = useNoteSaves()
  const [open, setOpen] = useState(false)
  const [request, setRequest] = useState<ReviewListRequest>({
    state: 'pending',
    due: 'all',
    page: 1,
  })
  const [data, setData] = useState<ReviewPage>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pickError, setPickError] = useState('')
  const [picked, setPicked] = useState<QuestionIdentity[]>([])
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!open) return
    let current = true
    setLoading(true)
    setError('')
    void (async () => {
      if (!(await saves.flush())) {
        if (current) setError('请先处理笔记或复习安排的保存问题，原列表和输入保持。')
        return
      }
      if (!current) return
      const result = await window.desktop.reviewTodos.list(request)
      if (!current) return
      if (result.ok) setData(result.value)
      else setError(result.error.message)
    })()
      .catch(() => {
        if (current) setError('无法读取复习待办，请刷新重试。')
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [open, refresh, request, attempt, saves.flush])
  function change(work: () => void) {
    void saves.flush().then((saved) => {
      if (saved) work()
      else setError('保存尚未确认，请先处理当前输入。')
    })
  }
  function pick(identity: QuestionIdentity, checked: boolean) {
    const key = questionIdentityKey(identity)
    const next = checked
      ? [...picked, identity]
      : picked.filter((item) => questionIdentityKey(item) !== key)
    if (next.length > MAX_QUESTION_SET_ITEMS) {
      setPickError(`最多勾选${MAX_QUESTION_SET_ITEMS}题，请分批练习；原勾选保持。`)
      return
    }
    setPickError('')
    setPicked(next)
  }
  const locked = disabled || loading || saves.flushing
  return (
    <details
      className="review-todos-panel"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>复习待办</summary>
      <p className="muted">
        完成需要明确点击。日期可以不设，查看/揭晓或练完不会自动完成；跨日可刷新到期列表。
      </p>
      <fieldset disabled={locked}>
        <legend>查找复习待办</legend>
        <label>
          待办状态
          <select
            aria-label="待办状态"
            value={request.state}
            onChange={(event) => {
              const state = event.currentTarget.value as ReviewListRequest['state']
              change(() => setRequest({ ...request, state, page: 1 }))
            }}
          >
            <option value="pending">待复习</option>
            <option value="done">已完成</option>
            <option value="all">全部状态</option>
          </select>
        </label>
        <label>
          计划日期
          <select
            aria-label="待办日期范围"
            value={request.due}
            onChange={(event) => {
              const due = event.currentTarget.value as ReviewListRequest['due']
              change(() => setRequest({ ...request, due, page: 1 }))
            }}
          >
            <option value="all">全部日期</option>
            <option value="due">到期及逾期</option>
            <option value="undated">未设日期</option>
          </select>
        </label>
        <div className="button-row">
          <button type="button" onClick={() => change(() => setAttempt((value) => value + 1))}>
            刷新复习待办
          </button>
          <button
            type="button"
            disabled={!picked.length || !onPractice}
            onClick={() => change(() => onPractice?.(structuredClone(picked), '复习待办'))}
          >
            确认勾选的待办并练习…
          </button>
          <button
            type="button"
            disabled={!picked.length}
            onClick={() => {
              setPicked([])
              setPickError('')
            }}
          >
            清空待办勾选
          </button>
        </div>
      </fieldset>
      <p>已勾选 {picked.length} 题，包含其他页、筛选和状态中的勾选；只练明确选择的题目。</p>
      {loading && <p role="status">正在读取复习待办…</p>}
      {error && <p role="alert">{error}</p>}
      {pickError && <p role="alert">{pickError}</p>}
      {data && (
        <>
          <p>本次匹配 {data.total} 条复习待办。</p>
          {!data.items.length && (
            <p className="muted">当前没有匹配的待办，可在题目详情或揭晓后的“复习安排”中添加。</p>
          )}
          <ol className="review-todo-list">
            {data.items.map((item) => (
              <li key={questionIdentityKey(item)}>
                <label>
                  <input
                    type="checkbox"
                    aria-label={`勾选待办：${item.topicId} / ${item.questionId}`}
                    disabled={locked}
                    checked={picked.some(
                      (value) => questionIdentityKey(value) === questionIdentityKey(item),
                    )}
                    onChange={(event) =>
                      pick(
                        { topicId: item.topicId, questionId: item.questionId },
                        event.currentTarget.checked,
                      )
                    }
                  />
                  {item.title}
                </label>
                <p className="muted">
                  {item.topicTitle} · {item.state === 'done' ? '已完成' : '待复习'} ·{' '}
                  {item.dueDate ? `计划日期：${item.dueDate}` : '未设日期'}
                  {item.archived ? ' · 已归档，练习前需处理' : ''}
                </p>
                <p className="review-reason">{item.reason || '未填写原因'}</p>
                <ReviewTodoEditor
                  identity={{ topicId: item.topicId, questionId: item.questionId }}
                  readOnly={loading}
                  onChanged={() => setAttempt((value) => value + 1)}
                />
              </li>
            ))}
          </ol>
          <nav className="pagination" aria-label="复习待办分页">
            <button
              type="button"
              disabled={locked || data.page <= 1}
              onClick={() => change(() => setRequest({ ...request, page: data.page - 1 }))}
            >
              上一页
            </button>
            <span>
              {data.page} / {Math.max(1, Math.ceil(data.total / data.pageSize))}
            </span>
            <button
              type="button"
              disabled={locked || data.page * data.pageSize >= data.total}
              onClick={() => change(() => setRequest({ ...request, page: data.page + 1 }))}
            >
              下一页
            </button>
          </nav>
        </>
      )}
    </details>
  )
}
