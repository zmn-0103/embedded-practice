import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
import { QuestionFilterFields, questionFilterSummary } from './QuestionFilterFields'
import { QuestionHistory } from './QuestionHistory'
import type { LearningScope } from '../../../shared/contracts/learning'
import {
  ALL_CATEGORIES,
  matchesCategory,
  type CategoryScope,
} from '../../../shared/contracts/categories'
import { TopicNavigator } from './TopicNavigator'
import { CategoryManager } from './CategoryManager'
import { DifficultyBadge } from './DifficultyBadge'
import { QuestionSets } from './QuestionSets'
import { PersonalNote } from './PersonalNote'
import { ContentUpdates } from './ContentUpdates'
import { useNoteSaves } from '../note-saves'
import {
  MAX_QUESTION_SET_ITEMS,
  questionIdentityKey,
} from '../../../shared/contracts/question-sets'

function QuestionView({
  identity,
  current,
  favoritesOnly,
  onFavoriteSaved,
}: {
  identity: QuestionIdentity
  current: LibraryPage['questions'][number] | undefined
  favoritesOnly: boolean
  onFavoriteSaved: () => void
}) {
  const noteSaves = useNoteSaves()
  const [detail, setDetail] = useState<QuestionDetail>()
  const [answer, setAnswer] = useState<ContentBody>()
  const [error, setError] = useState('')
  const [loadingAnswer, setLoadingAnswer] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [favoriteBusy, setFavoriteBusy] = useState(false)
  const favoritePending = useRef(false)
  const pending = useRef(false)
  const generation = useRef(0)
  const title = useRef<HTMLHeadingElement>(null)
  useLayoutEffect(() => {
    if (!detail || !title.current) return
    title.current.closest('.library-reader-pane')?.scrollTo(0, 0)
    title.current.focus({ preventScroll: true })
  }, [detail?.versionId])
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
  useEffect(() => {
    if (!current) return
    setDetail((previous) =>
      previous?.versionId === current.versionId
        ? {
            ...previous,
            favorite: current.favorite,
            practiced: current.practiced,
            currentRating: current.currentRating,
            contentUpdated: current.contentUpdated,
          }
        : previous,
    )
  }, [current])
  async function saveFavorite() {
    if (!detail || favoritePending.current) return
    favoritePending.current = true
    setFavoriteBusy(true)
    setError('')
    const epoch = generation.current
    let awaitingRemoval = false
    try {
      if (!(await noteSaves.flush()) || epoch !== generation.current) return
      const result = await window.desktop.library.setFavorite({
        topicId: detail.topicId,
        questionId: detail.questionId,
        favorite: !detail.favorite,
      })
      // 已切走的详情只通知重新读取，不把旧响应值写进父级列表。
      if (result.ok) {
        // 收藏筛选中的详情在列表响应到达后才卸载，期间不能重新放开笔记编辑。
        awaitingRemoval = favoritesOnly && !result.value.favorite
        onFavoriteSaved()
      }
      if (epoch !== generation.current) return
      if (result.ok) {
        setDetail((previous) => previous && { ...previous, favorite: result.value.favorite })
      } else setError(`收藏保存尚未确认：${result.error.message} 可重试相同设置。`)
    } catch {
      if (epoch === generation.current) setError('收藏保存尚未确认，请重试相同设置。')
    } finally {
      if (epoch === generation.current && !awaitingRemoval) {
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
        <h3 ref={title} tabIndex={-1}>
          {detail.title}
        </h3>
        <p className="question-tags">
          <DifficultyBadge difficulty={detail.difficulty} />
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
      <ContentUpdates
        identity={{
          topicId: detail.topicId,
          questionId: detail.questionId,
          versionId: detail.versionId,
        }}
      />
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
      <PersonalNote identity={identity} readOnly={favoriteBusy} />
    </article>
  )
}

export interface LibraryEntry {
  id: number
  category: CategoryScope
  archived: boolean
  filters?: QuestionFilters
  contentUpdatedOnly?: boolean
}

interface LibraryBrowserProps {
  refresh: number
  onFavoriteSaved: () => void
  scope?: LearningScope
  visible?: boolean
  invalidation?: number
  categoryDisabled?: boolean
  onCategoryChanged?: () => void
  onCategoryBusy?: (busy: boolean) => void
  onCategoryOperation?: (work: Promise<boolean>) => void
  entry?: LibraryEntry | undefined
  onPracticeQuestions?: (
    items: QuestionIdentity[],
    sourceName: string,
    contentUpdatedOnly?: boolean,
  ) => void
  onResumeReady?: () => void
}

export function LibraryBrowser(props: LibraryBrowserProps) {
  const host = useRef<HTMLDivElement>(null)
  const [content] = useState(() => document.createElement('div'))
  const positions = useRef<{ element: Element; top: number; left: number }[]>([])
  useLayoutEffect(() => {
    if (props.visible === false) return
    host.current?.appendChild(content)
    for (const position of positions.current) position.element.scrollTo(position.left, position.top)
    positions.current = []
    return () => {
      positions.current = [...content.querySelectorAll('*')]
        .filter((element) => element.scrollTop !== 0 || element.scrollLeft !== 0)
        .map((element) => ({ element, top: element.scrollTop, left: element.scrollLeft }))
      content.remove()
    }
  }, [content, props.visible])
  // 保留组件/阅读状态；离页时移出文档，旧答案与历史不留在新一轮的正文中。
  return <div ref={host}>{createPortal(<LibraryContent {...props} />, content)}</div>
}

function LibraryContent({
  refresh,
  onFavoriteSaved,
  scope,
  visible = true,
  invalidation = 0,
  categoryDisabled = false,
  onCategoryChanged,
  onCategoryBusy,
  onCategoryOperation,
  entry,
  onPracticeQuestions,
  onResumeReady,
}: LibraryBrowserProps) {
  const [picked, setPicked] = useState<QuestionIdentity[]>([])
  const [pickError, setPickError] = useState('')
  const [setsBlocked, setSetsBlocked] = useState(false)
  const [categoryBusy, setCategoryBusy] = useState(false)
  const localBusy = useRef({ sets: false, category: false })
  function reportBusy(kind: 'sets' | 'category', value: boolean) {
    localBusy.current[kind] = value
    if (kind === 'sets') setSetsBlocked(value)
    else setCategoryBusy(value)
    onCategoryBusy?.(localBusy.current.sets || localBusy.current.category)
  }
  function changePicked(next: QuestionIdentity[]) {
    if (next.length > MAX_QUESTION_SET_ITEMS) {
      setPickError(`最多勾选${MAX_QUESTION_SET_ITEMS}题，本次没有截断或改变原勾选。请分批练习。`)
      return
    }
    setPickError('')
    setPicked(next)
  }
  // 学习记录父级按范围建立 key；范围在本次挂载中固定，其他筛选仍可独立调整。
  const clearHelpId = useId()
  const noteSaves = useNoteSaves()
  const [request, setRequestState] = useState<ListRequest>(() => ({
    topicId: scope?.topicId ?? null,
    category: scope?.category ?? entry?.category ?? ALL_CATEGORIES,
    archived: scope?.archived ?? entry?.archived ?? false,
    page: 1,
    filters: entry?.filters,
    contentUpdatedOnly: entry?.contentUpdatedOnly,
    ...(scope ? { filters: { ...EMPTY_QUESTION_FILTERS, favoritesOnly: true } } : {}),
  }))
  function setRequest(next: ListRequest) {
    if (!noteSaves.hasPending()) {
      setRequestState(next)
      return
    }
    void noteSaves.flush().then((saved) => {
      if (saved) setRequestState(next)
    })
  }
  const [data, setData] = useState<LibraryPage>()
  const [selected, setSelected] = useState<QuestionIdentity>()
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [favoriteRefresh, setFavoriteRefresh] = useState(0)
  const [filters, setFilters] = useState<QuestionFilters>(() => ({
    ...EMPTY_QUESTION_FILTERS,
    ...entry?.filters,
    ...(scope ? { favoritesOnly: true } : {}),
  }))
  const [loading, setLoading] = useState(true)
  const [contentUpdatedOnly, setContentUpdatedOnly] = useState(entry?.contentUpdatedOnly ?? false)
  const [detailOpen, setDetailOpen] = useState(false)
  const resolvedRequest = useRef<ListRequest | undefined>(undefined)
  const wasVisible = useRef(visible)
  const resumeRequest = useRef<ListRequest | undefined>(undefined)
  const heading = useRef<HTMLElement>(null)
  const readerPane = useRef<HTMLDivElement>(null)
  const listPosition = useRef({ window: 0, top: 0 })
  const appliedEntry = useRef(entry?.id)
  const focusEntry = useRef(Boolean(entry))
  useEffect(() => {
    if (!entry || scope || appliedEntry.current === entry.id) return
    appliedEntry.current = entry.id
    focusEntry.current = true
    setLoading(true)
    setFilters({ ...EMPTY_QUESTION_FILTERS, ...entry.filters })
    setContentUpdatedOnly(entry.contentUpdatedOnly ?? false)
    setRequest({
      topicId: null,
      category: entry.category,
      archived: entry.archived,
      filters: entry.filters,
      contentUpdatedOnly: entry.contentUpdatedOnly,
      page: 1,
    })
  }, [entry, scope])
  useLayoutEffect(() => {
    if (visible && !loading && !error && focusEntry.current && heading.current) {
      focusEntry.current = false
      heading.current.focus({ preventScroll: true })
      window.scrollTo(0, 0)
    }
  }, [visible, loading, error, data])
  useEffect(() => {
    setSelected(undefined)
    setDetailOpen(false)
    heading.current?.querySelector('.question-list-scroll')?.scrollTo(0, 0)
  }, [request, refresh, attempt])
  useEffect(() => {
    if (!visible) {
      wasVisible.current = false
      return
    }
    if (!wasVisible.current) {
      wasVisible.current = true
      resumeRequest.current = request
    }
    let active = true
    setLoading(true)
    setError('')
    void window.desktop.library
      .listQuestions(request)
      .then((result) => {
        if (!active) return
        if (result.ok) {
          resolvedRequest.current = request
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
  }, [request, refresh, attempt, favoriteRefresh, visible, invalidation])
  useLayoutEffect(() => {
    if (!visible || loading || error || !resumeRequest.current) return
    const previous = resumeRequest.current
    resumeRequest.current = undefined
    // 返回后的刷新会暂时收起长正文，等待实际内容恢复后再还原窗口位置。
    if (previous === request && resolvedRequest.current === request) onResumeReady?.()
  }, [visible, loading, error, data, request, onResumeReady])
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
  const resultsReady = !loading && !error && resolvedRequest.current === request
  const category = request.category ?? ALL_CATEGORIES
  const categoryTitle =
    category.kind === 'all'
      ? '全部分类'
      : category.kind === 'uncategorized'
        ? '未分类'
        : (data.categories.find((item) => item.categoryId === category.categoryId)?.title ??
          '已失效的分类')
  const topicTitle = request.topicId
    ? (data.topics.find((item) => item.topicId === request.topicId)?.title ?? '已失效的专题')
    : '全部专题'
  const updatedFilter = (
    <label className="content-updated-filter">
      <input
        type="checkbox"
        aria-label="题库只看内容更新待复习"
        checked={contentUpdatedOnly}
        disabled={loading}
        onChange={(event) => setContentUpdatedOnly(event.currentTarget.checked)}
      />
      只看内容更新待复习
    </label>
  )
  const navigation = !scope && (
    <>
      <details className="topic-navigation-panel" open>
        <summary>分类与专题</summary>
        <TopicNavigator
          prefix="题库"
          categories={data.categories}
          topics={data.topics}
          category={request.category ?? ALL_CATEGORIES}
          topicId={request.topicId}
          archived={request.archived}
          disabled={loading || categoryDisabled}
          onChange={(category, topicId) => setRequest({ ...request, category, topicId, page: 1 })}
        />
      </details>
    </>
  )
  const management = !scope && (
    <CategoryManager
      categories={data.categories}
      topics={data.topics}
      disabled={loading || categoryDisabled}
      onChanged={() => {
        setFavoriteRefresh((value) => value + 1)
        onCategoryChanged?.()
      }}
      onBusyChange={(value) => reportBusy('category', value)}
      onOperation={onCategoryOperation}
    />
  )
  const selectionPanel = !scope && onPracticeQuestions && (
    <details className="question-selection-panel">
      <summary>勾选组卷与题单（{picked.length}题）</summary>
      <QuestionSets
        items={picked}
        refresh={refresh}
        disabled={loading || categoryBusy || (categoryDisabled && !setsBlocked)}
        onChange={changePicked}
        onPractice={onPracticeQuestions}
        onBlocked={(value) => reportBusy('sets', value)}
        onOperation={(work) => onCategoryOperation?.(work)}
      />
    </details>
  )
  const resultDescription = (
    <>
      {resultsReady && (
        <div className="library-applied-filters">
          <p aria-label="题库结果范围">
            {categoryTitle} · {topicTitle} · {request.archived ? '归档题目' : '有效题目'}
            {request.contentUpdatedOnly ? ' · 仅内容更新待复习' : ''}
          </p>
          <p aria-label="题库生效条件">
            {questionFilterSummary(request.filters ?? EMPTY_QUESTION_FILTERS)}
          </p>
        </div>
      )}
      <p id={clearHelpId} className="muted">
        {scope
          ? '清空仅重置下方列表的附加条件，保留上方学习记录的范围。'
          : '清空将恢复全部分类、全部专题和有效题目，并移除所有附加条件。'}
      </p>
    </>
  )
  if (data.topics.length === 0)
    return (
      <section ref={heading} tabIndex={-1} className="library-empty" aria-labelledby="empty-title">
        {error && (
          <>
            <p role="alert" className="error-message">
              {error}
            </p>
            <button type="button" onClick={() => setAttempt((value) => value + 1)}>
              重新读取题库
            </button>
          </>
        )}
        <div className="empty-symbol" aria-hidden="true">
          ▤
        </div>
        <h2 id="empty-title">题库尚未导入</h2>
        <p>选择一个或多个 Markdown 文件，先核对变更，再确认保存。</p>
        <p>也可以导出模板，在程序外填写自己的专题。</p>
        {navigation}
        {selectionPanel}
        {management}
      </section>
    )
  return (
    <section
      ref={heading}
      tabIndex={-1}
      className="library-workspace"
      data-records={Boolean(scope)}
      aria-label="题库浏览"
      aria-busy={!resultsReady}
      data-reading={detailOpen && Boolean(selected) && resultsReady}
    >
      <div className="library-management-tools">
        {selectionPanel}
        {management}
      </div>
      <div className="library-controls">
        <div
          className="library-scope-controls"
          role="group"
          aria-label="选择题库范围"
          hidden={Boolean(scope)}
        >
          <h3>1 · 选择范围</h3>
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
                {request.topicId &&
                  !data.topics.some(
                    (topic) =>
                      topic.topicId === request.topicId &&
                      matchesCategory(topic.categoryId, request.category ?? ALL_CATEGORIES),
                  ) && (
                    <option value={request.topicId} disabled>
                      已移出当前分类的专题
                    </option>
                  )}
                {data.topics
                  .filter((topic) =>
                    matchesCategory(topic.categoryId, request.category ?? ALL_CATEGORIES),
                  )
                  .map((topic) => (
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
          <p className="muted">
            {scope
              ? '范围沿用上方学习记录；下方条件只筛选题目列表。'
              : '分类在“分类与专题”导航中选择；范围更改后立即更新结果。'}
          </p>
        </div>
        <div className="library-condition-controls" role="group" aria-label="设置题库条件">
          <h3 hidden={Boolean(scope)}>2 · 设置条件</h3>
          <QuestionFilterFields
            compact={Boolean(scope)}
            advancedContent={scope ? updatedFilter : undefined}
            prefix="题库"
            filters={filters}
            tagOptions={data.tagOptions}
            onChange={setFilters}
            disabled={loading}
          />
          <div className="library-apply-controls">
            {!scope && updatedFilter}
            <button
              type="button"
              className="primary"
              disabled={loading}
              onClick={() =>
                setRequest({ ...request, page: 1, filters: { ...filters }, contentUpdatedOnly })
              }
            >
              筛选题库
            </button>
            {(JSON.stringify(filters) !==
              JSON.stringify(request.filters ?? EMPTY_QUESTION_FILTERS) ||
              contentUpdatedOnly !== Boolean(request.contentUpdatedOnly)) && (
              <p className="filter-pending" role="status">
                条件已调整，点击“筛选题库”后应用到列表。
              </p>
            )}
          </div>
        </div>
        <div className="library-result-summary" role="group" aria-label="题库生效筛选与结果">
          <div className="library-result-heading">
            <h3 hidden={Boolean(scope)}>3 · 查看结果</h3>
            <strong aria-live="polite">
              {resultsReady ? `共 ${data.total} 题` : '结果尚未确认'}
            </strong>
            <button
              type="button"
              aria-describedby={clearHelpId}
              disabled={loading}
              onClick={() => {
                setFilters({ ...EMPTY_QUESTION_FILTERS })
                setContentUpdatedOnly(false)
                setRequest({
                  topicId: scope?.topicId ?? null,
                  category: scope?.category ?? ALL_CATEGORIES,
                  archived: scope?.archived ?? false,
                  page: 1,
                })
              }}
            >
              清空题库筛选
            </button>
          </div>
          {scope ? (
            <details className="library-result-details">
              <summary>生效条件与清空范围</summary>
              {resultDescription}
            </details>
          ) : (
            resultDescription
          )}
          {!scope && !onPracticeQuestions && (
            <p className="muted">准备作答时，进入“开始练习”设置本轮条件。</p>
          )}
          {!scope && onPracticeQuestions && (
            <div className="button-row library-pick-tools">
              <span aria-live="polite">已勾选 {picked.length} 题</span>
              <button
                type="button"
                disabled={
                  loading ||
                  categoryDisabled ||
                  !resultsReady ||
                  !data.questions.some((q) => !q.archived)
                }
                onClick={() => {
                  const known = new Set(picked.map(questionIdentityKey))
                  changePicked([
                    ...picked,
                    ...data.questions
                      .filter((q) => !q.archived && !known.has(questionIdentityKey(q)))
                      .map(({ topicId, questionId }) => ({ topicId, questionId })),
                  ])
                }}
              >
                勾选本页有效题
              </button>
              {pickError && <p role="alert">{pickError}</p>}
            </div>
          )}
        </div>
        {loading && <p aria-live="polite">正在筛选题库…</p>}
        {error && (
          <div role="alert" className="error-message">
            <p>{error}</p>
            <button
              type="button"
              disabled={loading}
              onClick={() => setAttempt((value) => value + 1)}
            >
              重新读取题库
            </button>
          </div>
        )}
      </div>
      <div className="library-layout">
        {!scope && (
          <aside className="library-navigation" aria-label="题库分类与专题导航">
            {navigation}
          </aside>
        )}
        <div className="library-results">
          <aside className="question-list" aria-label="题目列表">
            <div className="question-list-scroll" hidden={!resultsReady}>
              <ul>
                {data.questions.map((question) => (
                  <li
                    key={`${question.topicId}/${question.questionId}`}
                    className={!scope && onPracticeQuestions ? 'question-selection-row' : undefined}
                  >
                    {!scope && onPracticeQuestions && (
                      <input
                        type="checkbox"
                        aria-label={`勾选题目：${question.topicId} / ${question.questionId} ${question.title}`}
                        checked={picked.some(
                          (item) => questionIdentityKey(item) === questionIdentityKey(question),
                        )}
                        disabled={
                          loading ||
                          categoryDisabled ||
                          Boolean(error) ||
                          (question.archived &&
                            !picked.some(
                              (item) => questionIdentityKey(item) === questionIdentityKey(question),
                            ))
                        }
                        onChange={(event) =>
                          changePicked(
                            event.currentTarget.checked
                              ? [
                                  ...picked,
                                  { topicId: question.topicId, questionId: question.questionId },
                                ]
                              : picked.filter(
                                  (item) =>
                                    questionIdentityKey(item) !== questionIdentityKey(question),
                                ),
                          )
                        }
                      />
                    )}
                    <button
                      className="question-row"
                      type="button"
                      disabled={loading || Boolean(error)}
                      aria-current={
                        selected?.topicId === question.topicId &&
                        selected.questionId === question.questionId
                          ? 'true'
                          : undefined
                      }
                      onClick={() => {
                        const select = () => {
                          listPosition.current = {
                            window: window.scrollY,
                            top:
                              heading.current?.querySelector('.question-list-scroll')?.scrollTop ??
                              0,
                          }
                          setSelected((previous) =>
                            previous?.topicId === question.topicId &&
                            previous.questionId === question.questionId
                              ? previous
                              : { topicId: question.topicId, questionId: question.questionId },
                          )
                          setDetailOpen(true)
                          readerPane.current?.scrollTo(0, 0)
                          if (window.matchMedia('(max-width: 1439px)').matches)
                            requestAnimationFrame(() =>
                              heading.current?.scrollIntoView({ block: 'start' }),
                            )
                        }
                        if (noteSaves.hasPending())
                          void noteSaves.flush().then((saved) => {
                            if (saved) select()
                          })
                        else select()
                      }}
                    >
                      <span className="question-row-title">{question.title}</span>
                      <span className="question-row-meta">
                        <span
                          className={
                            request.topicId
                              ? 'question-row-topic visually-hidden'
                              : 'question-row-topic'
                          }
                        >
                          {question.topicTitle} ·{' '}
                        </span>
                        <span>{question.questionId} · </span>
                        <DifficultyBadge difficulty={question.difficulty} />
                        <span
                          className="question-row-state"
                          data-rating={question.currentRating ?? ''}
                        >
                          {question.currentRating
                            ? `自评：${question.currentRating}`
                            : question.practiced
                              ? '已揭晓，未自评'
                              : '尚未练习'}
                          {question.favorite && ' · 已收藏'}
                          {question.contentUpdated && (
                            <span className="content-update"> · 内容更新待复习</span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {data.total === 0 && <p className="reader-placeholder">当前筛选没有匹配题目。</p>}
            </div>
            <nav className="pagination" aria-label="题目分页">
              <button
                type="button"
                disabled={loading || Boolean(error) || data.page <= 1}
                onClick={() => setRequest({ ...request, page: data.page - 1 })}
              >
                上一页
              </button>
              <span>
                {!resultsReady ? '上次确认：' : ''}
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
        </div>
        <div
          ref={readerPane}
          className="library-reader-pane"
          hidden={!resultsReady}
          tabIndex={0}
          aria-label="题目详情阅读区"
        >
          {selected && (
            <button
              type="button"
              className="return-to-list"
              onClick={() => {
                setDetailOpen(false)
                requestAnimationFrame(() => {
                  heading.current
                    ?.querySelector('.question-list-scroll')
                    ?.scrollTo(0, listPosition.current.top)
                  window.scrollTo(0, listPosition.current.window)
                  heading.current
                    ?.querySelector<HTMLButtonElement>('.question-row[aria-current="true"]')
                    ?.focus({ preventScroll: true })
                })
              }}
            >
              返回题目列表
            </button>
          )}
          {selected ? (
            <QuestionView
              key={`${refresh}/${attempt}/${selected.topicId}/${selected.questionId}`}
              identity={selected}
              favoritesOnly={request.filters?.favoritesOnly === true}
              current={data.questions.find(
                (question) =>
                  question.topicId === selected.topicId &&
                  question.questionId === selected.questionId,
              )}
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
                  选择一道题，检查导入后的内容。<p>需要作答时，切换到“开始练习”选择条件。</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
