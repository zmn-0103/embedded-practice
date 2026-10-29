import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { QuestionIdentity } from '../../../shared/contracts/library-desktop'
import type { KnowledgeSearch, KnowledgePage } from '../../../shared/contracts/knowledge'
import { QuestionView } from './LibraryBrowser'
import { useNoteSaves } from '../note-saves'

const labels = { question: '题目', note: '个人笔记', tag: '个人标签', relation: '关联说明' }
const initial: KnowledgeSearch = {
  query: '',
  kind: 'note',
  archive: 'active',
  hasNotes: false,
  sort: 'notes',
  page: 1,
}
export function KnowledgeExplorer({
  refresh,
  disabled,
  onPractice,
}: {
  refresh: number
  disabled: boolean
  onPractice: (items: QuestionIdentity[], name: string) => void
}) {
  const saves = useNoteSaves(),
    [filters, setFilters] = useState(initial),
    [request, setRequest] = useState({ input: initial, remember: false, serial: 0 })
  const [data, setData] = useState<KnowledgePage>(),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('')
  const [recent, setRecent] = useState<{ query: string; searchedAt: string }[]>([]),
    [historyAttempt, setHistoryAttempt] = useState(0),
    [historyError, setHistoryError] = useState('')
  const [selected, setSelected] = useState<QuestionIdentity>(),
    scroll = useRef(0)
  const remembered = useRef<number | undefined>(undefined)
  useEffect(() => {
    let current = true
    setLoading(true)
    setError('')
    setNotice('')
    void (async () => {
      const result = await window.desktop.knowledge.search(request.input)
      if (!current) return
      if (!result.ok) {
        setError(result.error.message)
        return
      }
      setData(result.value)
      if (request.remember && request.input.query.trim() && remembered.current !== request.serial) {
        remembered.current = request.serial
        try {
          const saved = await window.desktop.knowledge.changeRecent({
            kind: 'remember',
            query: request.input.query,
          })
          if (current) {
            if (saved.ok) setHistoryAttempt((value) => value + 1)
            else setNotice('检索完成，但最近搜索记录尚未确认；可继续使用当前结果。')
          }
        } catch {
          if (current) setNotice('检索完成，但最近搜索记录尚未确认；可继续使用当前结果。')
        }
      }
    })()
      .catch(() => {
        if (current) setError('无法检索我的积累，请刷新重试。')
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [request, refresh])
  useEffect(() => {
    let current = true
    setHistoryError('')
    void window.desktop.knowledge
      .recent()
      .then((result) => {
        if (!current) return
        if (result.ok) setRecent(result.value)
        else setHistoryError(result.error.message)
      })
      .catch(() => {
        if (current) setHistoryError('无法读取最近搜索，可重试。')
      })
    return () => {
      current = false
    }
  }, [historyAttempt, refresh])
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => window.scrollTo(0, selected ? 0 : scroll.current))
    return () => cancelAnimationFrame(frame)
  }, [selected])
  function change(work: () => void) {
    void saves.flush().then((saved) => {
      if (saved) work()
    })
  }
  function search(input: KnowledgeSearch, remember = false) {
    change(() => setRequest((previous) => ({ input, remember, serial: previous.serial + 1 })))
  }
  function shortcut(input: Partial<KnowledgeSearch>) {
    const next = { ...initial, ...input }
    setFilters(next)
    search(next)
  }
  const locked = disabled || loading || saves.flushing,
    pending =
      JSON.stringify({ ...filters, page: 1 }) !== JSON.stringify({ ...request.input, page: 1 })
  return (
    <section className="knowledge-explorer" aria-label="我的积累检索">
      <div hidden={Boolean(selected)}>
        <p>搜索已保存的个人笔记、题目、个人标签和关联说明，找回以前的理解。</p>
        <div className="button-row">
          <button type="button" disabled={locked} onClick={() => shortcut({})}>
            有笔记的题目
          </button>
          <button
            type="button"
            disabled={locked}
            onClick={() => shortcut({ sort: 'notes', archive: 'all' })}
          >
            最近修改的笔记
          </button>
          <button type="button" disabled={locked} onClick={() => shortcut({ archive: 'archived' })}>
            归档题目的笔记
          </button>
        </div>
        <fieldset disabled={locked}>
          <legend>查找我的积累</legend>
          <label>
            积累关键词
            <input
              type="search"
              aria-label="积累关键词"
              maxLength={128}
              value={filters.query}
              onChange={(event) =>
                setFilters({ ...filters, query: event.currentTarget.value, page: 1 })
              }
            />
          </label>
          <label>
            命中来源
            <select
              aria-label="积累命中来源"
              value={filters.kind}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  kind: event.currentTarget.value as KnowledgeSearch['kind'],
                  page: 1,
                })
              }
            >
              <option value="all">全部内容</option>
              {Object.entries(labels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            题目状态
            <select
              aria-label="积累题目状态"
              value={filters.archive}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  archive: event.currentTarget.value as KnowledgeSearch['archive'],
                  page: 1,
                })
              }
            >
              <option value="active">有效题目</option>
              <option value="archived">归档题目</option>
              <option value="all">全部题目</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={filters.hasNotes}
              onChange={(event) =>
                setFilters({ ...filters, hasNotes: event.currentTarget.checked, page: 1 })
              }
            />
            仅有个人笔记
          </label>
          <label>
            积累排序
            <select
              aria-label="积累排序"
              value={filters.sort}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  sort: event.currentTarget.value as KnowledgeSearch['sort'],
                  page: 1,
                })
              }
            >
              <option value="default">题库顺序</option>
              <option value="notes">笔记最近修改优先</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              const next = { ...filters, query: filters.query.trim(), page: 1 }
              setFilters(next)
              search(next, true)
            }}
          >
            检索我的积累
          </button>
          <button type="button" onClick={() => search(request.input)}>
            刷新当前检索
          </button>
        </fieldset>
        {pending && <p className="muted">条件尚未应用，点击“检索我的积累”更新结果。</p>}
        <details className="knowledge-recent">
          <summary>最近搜索（仅关键词）</summary>
          {!recent.length && <p>尚无最近搜索。</p>}
          {recent.map((item) => (
            <button
              type="button"
              key={item.query}
              disabled={locked}
              onClick={() => {
                const next = { ...filters, query: item.query, page: 1 }
                setFilters(next)
                search(next, true)
              }}
            >
              {item.query}
            </button>
          ))}
          <button
            type="button"
            disabled={locked || !recent.length}
            onClick={() =>
              change(() => {
                void window.desktop.knowledge
                  .changeRecent({ kind: 'clear' })
                  .then((result) => {
                    if (result.ok) setHistoryAttempt((value) => value + 1)
                    else setHistoryError(result.error.message)
                  })
                  .catch(() => setHistoryError('清空结果尚未确认，请重新读取最近搜索。'))
              })
            }
          >
            清空最近搜索
          </button>
          <button
            type="button"
            disabled={locked}
            onClick={() => setHistoryAttempt((value) => value + 1)}
          >
            重新读取最近搜索
          </button>
          {historyError && <p role="alert">{historyError}</p>}
        </details>
        {loading && <p role="status">正在检索我的积累…</p>}
        {error && <p role="alert">{error}</p>}
        {notice && <p role="status">{notice}</p>}
        {data && !loading && !error && (
          <>
            <p>
              匹配 {data.total} 道题 · 本次关键词：{request.input.query || '未限定'}
              。同一道题的多处命中合并展示。
            </p>
            <p className="muted">
              下方为本次检索结果；整理笔记或关联后可明确刷新。参考答案和历史作答不参与检索。
            </p>
            {!data.items.length && (
              <p>没有匹配的积累，可以修改关键词/命中来源，或在题目详情写下个人笔记。</p>
            )}
            <ol className="knowledge-results">
              {data.items.map((item) => (
                <li key={JSON.stringify([item.topicId, item.questionId])}>
                  <button
                    type="button"
                    onClick={() =>
                      change(() => {
                        scroll.current = window.scrollY
                        setSelected({ topicId: item.topicId, questionId: item.questionId })
                      })
                    }
                  >
                    {item.title} · {item.topicId} / {item.questionId}
                  </button>
                  <p className="muted">
                    {item.topicTitle}
                    {item.archived ? ' · 已归档' : ''}
                    {item.noteUpdatedAt
                      ? ` · 笔记修改：${new Date(item.noteUpdatedAt).toLocaleString('zh-CN')}`
                      : ''}
                  </p>
                  {item.hits.map((hit) => (
                    <div key={hit.kind}>
                      <strong>命中{labels[hit.kind]}</strong>
                      <p className="knowledge-excerpt">{hit.excerpt}</p>
                    </div>
                  ))}
                </li>
              ))}
            </ol>
            <nav className="pagination" aria-label="积累检索分页">
              <button
                type="button"
                disabled={locked || data.page <= 1}
                onClick={() => search({ ...request.input, page: data.page - 1 })}
              >
                上一页
              </button>
              <span>
                {data.page} / {Math.max(1, Math.ceil(data.total / data.pageSize))}
              </span>
              <button
                type="button"
                disabled={locked || data.page * data.pageSize >= data.total}
                onClick={() => search({ ...request.input, page: data.page + 1 })}
              >
                下一页
              </button>
            </nav>
          </>
        )}
      </div>
      {selected && (
        <div className="knowledge-detail">
          <button
            type="button"
            disabled={saves.flushing}
            onClick={() => change(() => setSelected(undefined))}
          >
            返回原检索结果
          </button>
          <QuestionView
            identity={selected}
            current={undefined}
            favoritesOnly={false}
            onFavoriteSaved={() => {}}
            editingLocked={false}
            showPracticeTime={false}
            onPractice={onPractice}
          />
        </div>
      )}
    </section>
  )
}
