import { useEffect, useRef, useState } from 'react'
import type {
  ContentBody,
  LibraryPage,
  ListRequest,
  QuestionDetail,
  QuestionIdentity,
} from '../../../shared/contracts/library-desktop'
import {
  EMPTY_QUESTION_FILTERS,
  type QuestionFilters,
} from '../../../shared/contracts/question-filters'
import { MarkdownContent } from './MarkdownContent'
import { QuestionFilterFields } from './QuestionFilterFields'
import { QuestionHistory } from './QuestionHistory'
import type { LearningScope } from '../../../shared/contracts/learning'

function QuestionView({
  identity,
  onFavoriteSaved,
}: {
  identity: QuestionIdentity
  onFavoriteSaved: () => void
}) {
  const [detail, setDetail] = useState<QuestionDetail>()
  const [answer, setAnswer] = useState<ContentBody>()
  const [error, setError] = useState('')
  const [loadingAnswer, setLoadingAnswer] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [favoriteBusy, setFavoriteBusy] = useState(false)
  const favoritePending = useRef(false)
  const pending = useRef(false)
  const generation = useRef(0)
  useEffect(() => {
    let active = true
    generation.current++
    pending.current = false
    favoritePending.current = false
    setFavoriteBusy(false)
    setDetail(undefined)
    setAnswer(undefined)
    setError('')
    setLoadingAnswer(false)
    void window.desktop.library
      .getQuestion(identity)
      .then((result) => {
        if (!active) return
        if (result.ok) setDetail(result.value)
        else setError(result.error.message)
      })
      .catch(() => {
        if (active) setError('无法读取题目，请重试。')
      })
    return () => {
      active = false
      generation.current++
    }
  }, [identity, attempt])
  async function saveFavorite() {
    if (!detail || favoritePending.current) return
    favoritePending.current = true
    setFavoriteBusy(true)
    setError('')
    const epoch = generation.current
    try {
      const result = await window.desktop.library.setFavorite({
        topicId: detail.topicId,
        questionId: detail.questionId,
        favorite: !detail.favorite,
      })
      // 已切走的详情只通知重新读取，不把旧响应值写进父级列表。
      if (result.ok) onFavoriteSaved()
      if (epoch !== generation.current) return
      if (result.ok) {
        setDetail((previous) => previous && { ...previous, favorite: result.value.favorite })
      } else setError(`收藏保存尚未确认：${result.error.message} 可重试相同设置。`)
    } catch {
      if (epoch === generation.current) setError('收藏保存尚未确认，请重试相同设置。')
    } finally {
      if (epoch === generation.current) {
        favoritePending.current = false
        setFavoriteBusy(false)
      }
    }
  }
  async function reveal() {
    if (!detail || loadingAnswer || pending.current) return
    pending.current = true
    const expectedGeneration = generation.current
    setLoadingAnswer(true)
    setError('')
    try {
      const result = await window.desktop.library.getAnswer({
        topicId: detail.topicId,
        questionId: detail.questionId,
        versionId: detail.versionId,
      })
      if (generation.current !== expectedGeneration) return
      if (result.ok) setAnswer(result.value)
      else setError(result.error.message)
    } catch {
      if (generation.current === expectedGeneration) setError('无法读取参考答案，请重试。')
    } finally {
      if (generation.current === expectedGeneration) {
        pending.current = false
        setLoadingAnswer(false)
      }
    }
  }
  if (!detail)
    return (
      <div className="reader-placeholder">
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button type="button" onClick={() => setAttempt((value) => value + 1)}>
              重试读取
            </button>
          </>
        ) : (
          '正在读取题目…'
        )}
      </div>
    )
  return (
    <article className="question-reader" aria-label="题目内容">
      <header>
        <p className="eyebrow">
          {detail.topicTitle} · {detail.questionId}
          {detail.archived ? ' · 已归档' : ''}
        </p>
        <h3>{detail.title}</h3>
        <p className="question-tags">
          {detail.difficulty}
          {detail.tags.length > 0 ? ` · ${detail.tags.join(' / ')}` : ''}
        </p>
        <p className="muted">
          {detail.currentRating
            ? `当前自评：${detail.currentRating}`
            : detail.practiced
              ? '已揭晓，未自评'
              : '当前内容尚未练习'}
        </p>
        {detail.contentUpdated && <p className="content-update">内容更新待复习</p>}
        <button
          type="button"
          aria-pressed={detail.favorite}
          disabled={favoriteBusy}
          onKeyDown={(event) => {
            if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault()
          }}
          onClick={(event) => {
            if (event.detail <= 1) void saveFavorite()
          }}
        >
          {favoriteBusy ? '正在保存收藏…' : detail.favorite ? '取消收藏' : '收藏本题'}
        </button>
      </header>
      <h4>题目</h4>
      <MarkdownContent
        key={`q-${detail.versionId}`}
        body={detail.body}
        versionId={detail.versionId}
      />
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      <div className="answer-control">
        <button
          type="button"
          disabled={loadingAnswer}
          onClick={() => {
            if (answer) setAnswer(undefined)
            else void reveal()
          }}
        >
          {answer ? '收起参考答案' : loadingAnswer ? '正在读取答案…' : '展开参考答案'}
        </button>
      </div>
      {answer && (
        <section className="reference-answer" aria-label="参考答案">
          <h4>参考答案</h4>
          <MarkdownContent
            key={`a-${detail.versionId}`}
            body={answer}
            versionId={detail.versionId}
          />
        </section>
      )}
      <QuestionHistory topicId={detail.topicId} questionId={detail.questionId} />
    </article>
  )
}

export function LibraryBrowser({
  refresh,
  onFavoriteSaved,
  scope,
}: {
  refresh: number
  onFavoriteSaved: () => void
  scope?: LearningScope
}) {
  // 学习记录父级按范围建立 key；范围在本次挂载中固定，其他筛选仍可独立调整。
  const [request, setRequest] = useState<ListRequest>(() => ({
    topicId: scope?.topicId ?? null,
    archived: scope?.archived ?? false,
    page: 1,
    ...(scope ? { filters: { ...EMPTY_QUESTION_FILTERS, favoritesOnly: true } } : {}),
  }))
  const [data, setData] = useState<LibraryPage>()
  const [selected, setSelected] = useState<QuestionIdentity>()
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [favoriteRefresh, setFavoriteRefresh] = useState(0)
  const [filters, setFilters] = useState<QuestionFilters>(() => ({
    ...EMPTY_QUESTION_FILTERS,
    favoritesOnly: Boolean(scope),
  }))
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setSelected(undefined)
  }, [request, refresh, attempt])
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    void window.desktop.library
      .listQuestions(request)
      .then((result) => {
        if (!active) return
        if (result.ok) {
          setData(result.value)
          setSelected((previous) =>
            previous &&
            result.value.questions.some(
              (question) =>
                question.topicId === previous.topicId &&
                question.questionId === previous.questionId,
            )
              ? previous
              : undefined,
          )
        } else setError(result.error.message)
      })
      .catch(() => {
        if (active) setError('无法读取题库，请重试。')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [request, refresh, attempt, favoriteRefresh])
  if (error && !data)
    return (
      <section className="library-empty">
        <p role="alert" className="error-message">
          {error}
        </p>
        <button type="button" onClick={() => setAttempt((value) => value + 1)}>
          重新读取题库
        </button>
      </section>
    )
  if (!data) return <p className="reader-placeholder">正在读取题库…</p>
  if (data.topics.length === 0)
    return (
      <section className="library-empty" aria-labelledby="empty-title">
        <div className="empty-symbol" aria-hidden="true">
          ▤
        </div>
        <h2 id="empty-title">题库尚未导入</h2>
        <p>选择一个或多个 Markdown 文件，先核对变更，再确认保存。</p>
        <p>也可以导出模板，在程序外填写自己的专题。</p>
      </section>
    )
  return (
    <section className="library-workspace" aria-label="题库浏览">
      <QuestionFilterFields
        prefix="题库"
        filters={filters}
        onChange={setFilters}
        disabled={loading}
      />
      <div className="button-row">
        <button
          type="button"
          disabled={loading}
          onClick={() => setRequest({ ...request, page: 1, filters: { ...filters } })}
        >
          筛选题库
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setFilters({ ...EMPTY_QUESTION_FILTERS })
            setRequest({
              topicId: scope?.topicId ?? null,
              archived: scope?.archived ?? false,
              page: 1,
            })
          }}
        >
          清空题库筛选
        </button>
      </div>
      {loading && <p aria-live="polite">正在筛选题库…</p>}
      {error && (
        <div role="alert" className="error-message">
          <p>{error}</p>
          <button type="button" disabled={loading} onClick={() => setAttempt((value) => value + 1)}>
            重新读取题库
          </button>
        </div>
      )}
      <div className="library-filters">
        {!scope && (
          <label>
            专题
            <select
              aria-label="专题"
              value={request.topicId ?? ''}
              disabled={loading}
              onChange={(event) =>
                setRequest({ ...request, topicId: event.target.value || null, page: 1 })
              }
            >
              <option value="">全部专题</option>
              {data.topics.map((topic) => (
                <option value={topic.topicId} key={topic.topicId}>
                  {topic.title}（{request.archived ? topic.archivedCount : topic.activeCount}）
                </option>
              ))}
            </select>
          </label>
        )}
        {!scope && (
          <label>
            <input
              type="checkbox"
              checked={request.archived}
              disabled={loading}
              onChange={(event) =>
                setRequest({ ...request, archived: event.target.checked, page: 1 })
              }
            />
            查看归档题目
          </label>
        )}
        <span className="muted">共 {data.total} 题</span>
      </div>
      <div className="library-columns">
        <aside className="question-list" aria-label="题目列表">
          <ul>
            {data.questions.map((question) => (
              <li key={`${question.topicId}/${question.questionId}`}>
                <button
                  type="button"
                  disabled={loading || Boolean(error)}
                  aria-current={
                    selected?.topicId === question.topicId &&
                    selected.questionId === question.questionId
                      ? 'true'
                      : undefined
                  }
                  onClick={() =>
                    setSelected({ topicId: question.topicId, questionId: question.questionId })
                  }
                >
                  <small>
                    {question.topicTitle} · {question.questionId}
                  </small>
                  <span>{question.title}</span>
                  {question.favorite && <small>已收藏</small>}
                  {question.contentUpdated && (
                    <small className="content-update">内容更新待复习</small>
                  )}
                </button>
              </li>
            ))}
          </ul>
          {data.total === 0 && <p className="reader-placeholder">当前筛选没有匹配题目。</p>}
          <nav className="pagination" aria-label="题目分页">
            <button
              type="button"
              disabled={loading || Boolean(error) || data.page <= 1}
              onClick={() => setRequest({ ...request, page: data.page - 1 })}
            >
              上一页
            </button>
            <span>
              {data.page} / {Math.max(1, Math.ceil(data.total / data.pageSize))}
            </span>
            <button
              type="button"
              disabled={loading || Boolean(error) || data.page * data.pageSize >= data.total}
              onClick={() => setRequest({ ...request, page: data.page + 1 })}
            >
              下一页
            </button>
          </nav>
        </aside>
        {selected ? (
          <QuestionView
            key={`${refresh}/${attempt}/${selected.topicId}/${selected.questionId}`}
            identity={selected}
            onFavoriteSaved={() => {
              onFavoriteSaved()
              setFavoriteRefresh((value) => value + 1)
            }}
          />
        ) : (
          <div className="reader-placeholder">
            {scope ? (
              '选择一道题查看内容，再主动展开单题历史。'
            ) : (
              <>
                选择一道题，检查导入后的内容。<p>在上方选择专题和题数，即可开始练习与作答。</p>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
