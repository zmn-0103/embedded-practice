import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { LibraryPage } from '../../../shared/contracts/library-desktop'
import type {
  PracticeAck,
  PracticeView,
  RepeatPractice,
  StartPractice,
} from '../../../shared/contracts/practice'
import {
  EMPTY_QUESTION_FILTERS,
  type QuestionFilters,
} from '../../../shared/contracts/question-filters'
import { createPracticeController } from '../practice-controller'
import { PracticePane } from './PracticePane'
import { QuestionFilterFields, questionFilterSummary } from './QuestionFilterFields'
import {
  ALL_CATEGORIES,
  categorySnapshotLabel,
  matchesCategory,
  type CategoryScope,
} from '../../../shared/contracts/categories'
import { TopicNavigator } from './TopicNavigator'
import { PracticePlans } from './PracticePlans'
import { difficultyLabel } from './DifficultyBadge'

const shortcuts: { label: string; filters: QuestionFilters }[] = [
  { label: '全部题目', filters: { ...EMPTY_QUESTION_FILTERS } },
  { label: '练不会', filters: { ...EMPTY_QUESTION_FILTERS, mastery: '不会' } },
  { label: '练不熟', filters: { ...EMPTY_QUESTION_FILTERS, mastery: '不熟' } },
  { label: '练不会＋不熟', filters: { ...EMPTY_QUESTION_FILTERS, mastery: '不会＋不熟' } },
  { label: '练收藏', filters: { ...EMPTY_QUESTION_FILTERS, favoritesOnly: true } },
]

export function PracticeWorkspace({
  refresh,
  onActiveChange,
  beforeClose,
  onDataBusy,
  onDataOperation,
  homeContent,
  homeLabel = '板块与继续练习',
  showResume = true,
}: {
  refresh: number
  onActiveChange: (active: boolean) => void
  beforeClose?: () => Promise<boolean>
  onDataBusy: (busy: boolean) => void
  onDataOperation: (work: Promise<boolean>) => void
  homeContent?:
    | ReactNode
    | ((practice: {
        active: PracticeView | null
        ready: boolean
        busy: boolean
        resume: () => void
      }) => ReactNode)
  homeLabel?: string
  showResume?: boolean
}) {
  const api = window.desktop.practice
  const [controller] = useState(() => createPracticeController(api))
  const state = useSyncExternalStore(controller.subscribe, controller.getState)
  const [page, setPage] = useState<'home' | 'practice'>('home')
  const [topics, setTopics] = useState<LibraryPage['topics']>([])
  const [categories, setCategories] = useState<LibraryPage['categories']>([])
  const [category, setCategory] = useState<CategoryScope>(ALL_CATEGORIES)
  const [tagOptions, setTagOptions] = useState<string[]>([])
  const [active, setActive] = useState<PracticeView | null>(null)
  const [topicId, setTopicId] = useState<string | null>(null)
  const [count, setCount] = useState<StartPractice['count']>(20)
  const [mode, setMode] = useState<NonNullable<StartPractice['mode']>>('sequential')
  const [filters, setFilters] = useState<QuestionFilters>({ ...EMPTY_QUESTION_FILTERS })
  const [matchingCount, setMatchingCount] = useState<number>()
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const mounted = useRef(false)
  const generation = useRef(0)
  const lifecycle = useRef(0)
  const busyRef = useRef(false)
  const planBlocked = useRef(false)
  const [plansBusy, setPlansBusy] = useState(false)
  const work = useRef<Promise<void> | undefined>(undefined)
  const pendingStart = useRef<{ input: StartPractice; ack?: PracticeAck } | undefined>(undefined)

  async function loadHome() {
    const epoch = ++generation.current
    setReady(false)
    setMatchingCount(undefined)
    try {
      const [session, library, guard] = await Promise.all([
        api.read({ sessionId: null }),
        window.desktop.library.listQuestions({ topicId: null, archived: false, page: 1 }),
        api.ready(),
      ])
      if (!mounted.current || epoch !== generation.current) return
      if (!session.ok) throw new Error(session.error.message)
      if (!library.ok) throw new Error(library.error.message)
      if (!guard.ok) throw new Error(guard.error.message)
      const available = library.value.topics.filter((topic) => topic.activeCount > 0)
      setTopics(available)
      setCategories(library.value.categories)
      setActive(session.value)
      setReady(true)
    } catch (failure) {
      if (mounted.current && epoch === generation.current)
        setError(failure instanceof Error ? failure.message : '无法读取练习，请重试。')
    }
  }
  function run(task: () => Promise<void>) {
    if (busyRef.current || state.closing || planBlocked.current) return
    busyRef.current = true
    setBusy(true)
    setError('')
    const job = task()
      .catch(() => {
        if (mounted.current) setError('本次操作尚未确认，请保留当前内容并重试。')
      })
      .finally(() => {
        busyRef.current = false
        if (work.current === job) work.current = undefined
        if (mounted.current) setBusy(false)
      })
    work.current = job
  }
  function enter(view: PracticeView) {
    if (!controller.open(view)) throw new Error('当前输入尚未确认，不能替换练习。')
    generation.current++
    onActiveChange(true)
    setPage('practice')
    window.scrollTo(0, 0)
  }
  function start(repeat?: RepeatPractice, repeatMode: StartPractice['mode'] = 'sequential') {
    run(async () => {
      const job = pendingStart.current ?? {
        input: repeat
          ? {
              requestId: globalThis.crypto.randomUUID(),
              topicId: null,
              count: 'all' as const,
              replace: null,
              mode: repeatMode,
              repeat,
            }
          : {
              requestId: globalThis.crypto.randomUUID(),
              topicId,
              category: { ...category },
              count,
              mode,
              filters: { ...filters },
              replace: active
                ? {
                    sessionId: active.session.sessionId,
                    position: active.session.position,
                    revision: active.session.revision,
                  }
                : null,
            },
      }
      pendingStart.current = job
      if (!job.ack) {
        const result = await api.start(job.input)
        if (!mounted.current) return
        if (!result.ok) {
          setError(result.error.message)
          if (
            !['DATABASE_UNAVAILABLE', 'OUTCOME_UNKNOWN', 'WRITE_FAILED'].includes(result.error.code)
          ) {
            pendingStart.current = undefined
            await loadHome()
          }
          return
        }
        job.ack = result.value
      }
      const result = await api.read({ sessionId: job.ack.sessionId })
      if (!mounted.current) return
      if (!result.ok || !result.value || result.value.session.sessionId !== job.ack.sessionId) {
        setError('本轮已建立，读取失败，请重试开始本轮。')
        return
      }
      enter(result.value)
      pendingStart.current = undefined
    })
  }
  function resume() {
    run(async () => {
      const result = await api.read({ sessionId: null })
      if (!mounted.current) return
      if (!result.ok) {
        setError(result.error.message)
        return
      }
      if (!result.value) {
        setError('当前没有可继续的练习。')
        await loadHome()
        return
      }
      enter(result.value)
    })
  }
  function home() {
    run(async () => {
      if (!(await controller.flushForLeave()) || !mounted.current) return
      setReady(false)
      setPage('home')
      onActiveChange(false)
      window.scrollTo(0, 0)
    })
  }
  useEffect(() => {
    mounted.current = true
    lifecycle.current++
    const unsubscribeCancellation = api.onCloseCancelled(() => controller.cancelClose())
    const unsubscribe = api.onBeforeClose((request) => {
      void (async () => {
        if (work.current) await work.current
        const saved =
          !pendingStart.current &&
          (await controller.prepareClose()) &&
          ((await beforeClose?.()) ?? true) &&
          !planBlocked.current
        const result = await api.finishClose({ requestId: request.requestId, saved })
        if (!saved || !result.ok) controller.cancelClose()
      })().catch(() => {
        controller.cancelClose()
        void api.finishClose({ requestId: request.requestId, saved: false }).catch(() => {})
      })
    })
    return () => {
      mounted.current = false
      generation.current++
      unsubscribe()
      unsubscribeCancellation()
      const epoch = ++lifecycle.current
      // StrictMode 的立即重新挂载复用控制器，真正离开后才释放计时器。
      queueMicrotask(() => {
        if (lifecycle.current === epoch) controller.dispose()
      })
    }
  }, [api, controller, beforeClose])
  useEffect(() => {
    if (page === 'home') void loadHome()
  }, [refresh, page])
  useEffect(() => {
    if (page !== 'home' || !ready) return
    let current = true
    setMatchingCount(undefined)
    void window.desktop.library
      .listQuestions({ topicId, category, archived: false, page: 1, filters })
      .then((result) => {
        if (!current) return
        if (result.ok) {
          setMatchingCount(result.value.total)
          setTagOptions(result.value.tagOptions)
        } else setError(result.error.message)
      })
      .catch(() => {
        if (current) setError('无法确认匹配题目，请重试读取练习。')
      })
    return () => {
      current = false
    }
  }, [page, ready, refresh, topicId, category, filters])

  if (page === 'practice')
    return (
      <PracticePane
        state={state}
        controller={controller}
        homeBusy={busy}
        onHome={home}
        onDataBusy={onDataBusy}
        onDataOperation={onDataOperation}
        repeat={{
          busy: busy || state.busy || state.closing || Boolean(state.pending),
          pending: Boolean(pendingStart.current),
          error,
          start,
        }}
      />
    )
  const hasQuestions = matchingCount !== undefined && matchingCount > 0
  const blocked = busy || state.closing || !ready || plansBusy
  return (
    <section
      className="practice-workspace practice-start"
      aria-label={homeContent ? homeLabel : '开始练习'}
    >
      {active && showResume && (
        <section className="resume-practice" aria-label="继续上次练习">
          <div>
            <p className="eyebrow">接着上次的位置</p>
            <h2>{active.item?.topicTitle ?? '上次练习'}</h2>
            <p>
              上轮为{active.session.mode === 'random' ? '随机练习' : '顺序练习'}，停在第{' '}
              {active.session.position + 1} / {active.session.total} 题，可继续原队列。
            </p>
            {active.item && <p className="muted">{active.item.title}</p>}
          </div>
          <button
            type="button"
            className="primary"
            disabled={blocked || Boolean(pendingStart.current)}
            onClick={resume}
          >
            继续练习
          </button>
          <details aria-label="本轮创建条件">
            <summary>本轮创建条件</summary>
            {active.session.repeat && (
              <p>本轮为再练，沿用来源轮保存的内容；以下为来源轮的创建条件。</p>
            )}
            <p>创建时的条件仅供回看，继续练习使用原固定队列。</p>
            <p>分类：{categorySnapshotLabel(active.session.category)}</p>
            {active.session.filters === null ? (
              <p>此旧会话未保存筛选条件，原条件未知。</p>
            ) : (
              <dl>
                <dt>专题</dt>
                <dd>{active.session.topicId ?? '全部专题'}</dd>
                <dt>搜索</dt>
                <dd>{active.session.filters.query || '不限'}</dd>
                <dt>标签</dt>
                <dd>{active.session.filters.tag ?? '不限'}</dd>
                <dt>难度</dt>
                <dd>
                  {active.session.filters.difficulty
                    ? difficultyLabel(active.session.filters.difficulty)
                    : '不限'}
                </dd>
                <dt>自评状态</dt>
                <dd>
                  {active.session.filters.mastery === 'all'
                    ? '不限'
                    : active.session.filters.mastery === 'unpracticed'
                      ? '未练习'
                      : active.session.filters.mastery}
                </dd>
                <dt>只看收藏</dt>
                <dd>{active.session.filters.favoritesOnly ? '是' : '否'}</dd>
              </dl>
            )}
          </details>
        </section>
      )}
      {typeof homeContent === 'function'
        ? homeContent({ active, ready, busy: blocked || Boolean(pendingStart.current), resume })
        : homeContent}
      <div className="practice-options" hidden={Boolean(homeContent)}>
        <p className="eyebrow">{active ? '也可以重新选择题目' : '按自己的节奏，认真完成一轮'}</p>
        <h2>{active ? '开始新一轮' : '开始一轮练习'}</h2>
        <div className="practice-configuration">
          <h3>1. 选题范围</h3>
          <details className="topic-navigation-panel">
            <summary>按分类选择专题</summary>
            <TopicNavigator
              prefix="练习"
              topics={topics}
              categories={categories}
              category={category}
              topicId={topicId}
              disabled={blocked || Boolean(pendingStart.current)}
              onChange={(next, topic) => {
                setError('')
                setCategory(next)
                setTopicId(topic)
              }}
            />
          </details>
          <div className="library-filters">
            {' '}
            <label>
              练习专题
              <select
                aria-label="练习专题"
                value={topicId ?? ''}
                disabled={blocked || Boolean(pendingStart.current)}
                onChange={(event) => {
                  setError('')
                  setTopicId(event.currentTarget.value || null)
                }}
              >
                <option value="">全部专题</option>
                {topicId &&
                  !topics.some(
                    (topic) =>
                      topic.topicId === topicId && matchesCategory(topic.categoryId, category),
                  ) && (
                    <option value={topicId} disabled>
                      已不在当前活动范围的专题
                    </option>
                  )}
                {topics
                  .filter((topic) => matchesCategory(topic.categoryId, category))
                  .map((topic) => (
                    <option key={topic.topicId} value={topic.topicId}>
                      {topic.title}（{topic.activeCount} 题）
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <h3>2. 筛选条件</h3>

          <div className="shortcut-row" role="group" aria-label="常用练习条件">
            {shortcuts.map((shortcut) => (
              <button
                type="button"
                key={shortcut.label}
                aria-pressed={JSON.stringify(filters) === JSON.stringify(shortcut.filters)}
                disabled={blocked || Boolean(pendingStart.current)}
                onClick={() => {
                  setError('')
                  setFilters({ ...shortcut.filters })
                }}
              >
                {shortcut.label}
              </button>
            ))}
          </div>
          <p className="muted">
            快捷入口会替换其他筛选，保留分类、专题、模式和题数；点击开始后才创建新轮。
          </p>
          <details className="practice-filter-options">
            <summary>筛选练习题目</summary>
            <QuestionFilterFields
              prefix="练习"
              filters={filters}
              tagOptions={tagOptions}
              disabled={blocked || Boolean(pendingStart.current)}
              onChange={(next) => {
                setError('')
                setFilters(next)
              }}
            />
          </details>
          <p className="filter-summary" aria-label="当前练习筛选摘要">
            {questionFilterSummary(filters)}
          </p>
          <h3>3. 练习方式与题数</h3>
          <div className="library-filters">
            <label>
              练习模式
              <select
                aria-label="练习模式"
                value={mode}
                disabled={blocked || Boolean(pendingStart.current)}
                onChange={(event) =>
                  setMode(event.currentTarget.value === 'random' ? 'random' : 'sequential')
                }
              >
                <option value="sequential">顺序练习</option>
                <option value="random">随机练习</option>
              </select>
            </label>

            <label>
              本轮题数
              <select
                aria-label="本轮题数"
                value={count}
                disabled={blocked || Boolean(pendingStart.current)}
                onChange={(event) =>
                  setCount(
                    event.currentTarget.value === 'all'
                      ? 'all'
                      : (Number(event.currentTarget.value) as 10 | 20 | 50),
                  )
                }
              >
                <option value={10}>10 题</option>
                <option value={20}>20 题</option>
                <option value={50}>50 题</option>
                <option value="all">全部</option>
              </select>
            </label>
          </div>
          {ready && (
            <p className="muted" aria-live="polite">
              {matchingCount === undefined ? (
                '正在查找匹配题目…'
              ) : (
                <>
                  <span>匹配 {matchingCount} 题</span>
                  <strong className="practice-round-count">
                    本轮 {count === 'all' ? matchingCount : Math.min(count, matchingCount)} 题
                  </strong>
                </>
              )}
            </p>
          )}
          {mode === 'random' && (
            <p className="muted">开始时随机选题并保存顺序，继续或重新打开程序会保留本轮队列。</p>
          )}
          {ready && topics.length === 0 && <p className="muted">先导入题库，再开始练习。</p>}
          {ready && topics.length > 0 && matchingCount === 0 && (
            <p className="muted">当前筛选没有匹配题目，请调整条件。</p>
          )}
          <div className="button-row">
            <button
              type="button"
              className={active ? undefined : 'primary'}
              disabled={blocked || (!pendingStart.current && !hasQuestions)}
              onClick={() => start()}
            >
              {pendingStart.current ? '重试开始本轮' : active ? '结束本轮并开始新练习' : '开始练习'}
            </button>
          </div>
        </div>
        <PracticePlans
          refresh={refresh}
          options={{ category, topicId, mode, count, filters }}
          topics={topics}
          categories={categories}
          disabled={busy || state.closing || !ready}
          onBlocked={(value) => {
            planBlocked.current = value
            setPlansBusy(value)
            onDataBusy(value)
          }}
          onOperation={onDataOperation}
          onApply={(options) => {
            if (planBlocked.current || busyRef.current || state.closing) return
            setCategory({ ...options.category })
            setTopicId(options.topicId)
            setMode(options.mode)
            setCount(options.count)
            setFilters({ ...options.filters })
            setMatchingCount(undefined)
            setError('')
          }}
        />
      </div>
      {error && (
        <div role="alert" className="error-message">
          <p>{error}</p>
          {!pendingStart.current && (
            <button
              type="button"
              disabled={busy || state.closing}
              onClick={() => {
                setError('')
                void loadHome()
              }}
            >
              重试读取练习
            </button>
          )}
        </div>
      )}
    </section>
  )
}
