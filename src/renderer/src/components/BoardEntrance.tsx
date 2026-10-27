import { useEffect, useState } from 'react'
import type { CategoryScope, LibraryNavigation } from '../../../shared/contracts/categories'
import { createBoardCards, filterBoardCards } from '../board-catalog'

export function BoardEntrance({
  refresh,
  disabled,
  onBrowse,
  onPractice,
}: {
  refresh: number
  disabled: boolean
  onBrowse: (category: CategoryScope, archived: boolean) => void
  onPractice: () => void
}) {
  const [navigation, setNavigation] = useState<LibraryNavigation>()
  const [query, setQuery] = useState('')
  const [extensions, setExtensions] = useState(false)
  const [availableOnly, setAvailableOnly] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let current = true
    setLoading(true)
    setError('')
    void window.desktop.library
      .listQuestions({ topicId: null, archived: false, page: 1 })
      .then((result) => {
        if (!current) return
        if (result.ok) setNavigation(result.value)
        else setError(result.error.message)
      })
      .catch(() => {
        if (current) setError('无法读取板块题数，请重试。')
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [refresh, attempt])
  const allCards = navigation ? createBoardCards(navigation) : []
  const cards = filterBoardCards(allCards, query, extensions).filter(
    (card) => !availableOnly || card.activeCount > 0,
  )
  const blocked = disabled || loading || Boolean(error)
  return (
    <section className="board-entrance" aria-labelledby="board-heading" aria-busy={loading}>
      <div className="board-heading">
        <div className="board-title">
          <h2 id="board-heading">题库板块</h2>
          {!loading && !error && navigation && (
            <span className="muted">
              本机 {allCards.find((card) => card.key === 'all')?.activeCount} 题
            </span>
          )}
        </div>
        <div className="button-row">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onBrowse({ kind: 'all' }, false)}
          >
            导入与管理分类
          </button>
          <button type="button" disabled={disabled} onClick={onPractice}>
            按条件开始练习
          </button>
        </div>
      </div>
      {!loading && !error && navigation && (
        <div className="board-shortcuts" aria-label="题库快捷入口">
          {allCards
            .filter((card) => card.tier === 'overview')
            .map((card) => (
              <article key={card.key} className="board-shortcut" aria-label={`板块：${card.title}`}>
                <button
                  type="button"
                  disabled={blocked || card.activeCount === 0}
                  aria-label={`进入板块：${card.title}`}
                  onClick={() => card.scope && onBrowse(card.scope, false)}
                >
                  {card.title} · {card.activeCount} 题
                </button>
                {card.archivedCount > 0 && (
                  <button
                    type="button"
                    aria-label={`查看归档：${card.title}`}
                    disabled={blocked}
                    onClick={() => card.scope && onBrowse(card.scope, true)}
                  >
                    归档 {card.archivedCount} 题
                  </button>
                )}
              </article>
            ))}
        </div>
      )}
      <div className="board-controls">
        <label>
          搜索板块
          <input
            type="search"
            aria-label="搜索板块"
            placeholder="板块或专题名称，如 C语言、UART"
            maxLength={120}
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={extensions}
            onChange={(event) => setExtensions(event.currentTarget.checked)}
          />
          显示拓展方向
        </label>
        <label>
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(event) => setAvailableOnly(event.currentTarget.checked)}
          />
          仅显示有题板块
        </label>
        <details className="board-help">
          <summary>题数与分类说明</summary>
          <p className="muted">
            题数来自本机当前分类中的活动题目。同名分类合并展示；新专题默认未分类，可在管理分类中安排归属。
            搜索覆盖全部规划与本机专题，已有题的拓展板块始终显示。有题筛选只改变展示，不调整专题归属。
          </p>
        </details>
      </div>
      {loading && <p aria-live="polite">正在读取板块与实际题数…</p>}
      {error && (
        <div className="error-message" role="alert">
          <p>{error}</p>
          <button
            type="button"
            disabled={disabled || loading}
            onClick={() => setAttempt((n) => n + 1)}
          >
            重新读取板块
          </button>
        </div>
      )}
      {!loading && !error && navigation && (
        <>
          <p className="board-result muted" aria-live="polite" aria-label="板块搜索结果">
            显示 {cards.filter((card) => card.tier !== 'overview').length} 个知识板块
          </p>
          {cards.filter((card) => card.tier !== 'overview').length === 0 && (
            <div className="reader-placeholder">
              <p>没有匹配板块，请调整搜索或有题筛选。</p>
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setExtensions(false)
                  setAvailableOnly(false)
                }}
              >
                清空板块筛选
              </button>
            </div>
          )}
          {(
            [
              ['foundation', '基础方向'],
              ['extension', '拓展方向'],
              ['personal', '本机自定义分类'],
            ] as const
          ).map(([tier, title]) => {
            const group = cards.filter((card) => card.tier === tier)
            return (
              group.length > 0 && (
                <section className="board-section" key={tier} aria-label={title}>
                  <h3>
                    {title} <span className="muted">· {group.length}</span>
                  </h3>
                  <div className="board-grid">
                    {group.map((card) => {
                      const availability =
                        card.activeCount > 0
                          ? 'available'
                          : card.archivedCount > 0
                            ? 'archived'
                            : card.plannedTopics.length > 0
                              ? 'planned'
                              : 'empty'
                      const statusLabel = {
                        available: '可练习',
                        archived: '仅有归档',
                        planned: '规划中',
                        empty: '暂无内容',
                      }[availability]
                      return (
                        <article
                          key={card.key}
                          className="board-card"
                          data-availability={availability}
                          aria-label={`板块：${card.title}`}
                        >
                          <span className="board-icon" aria-hidden="true">
                            <svg
                              viewBox="0 0 24 24"
                              width="22"
                              height="22"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <rect x="5" y="5" width="14" height="14" rx="3" />
                              <path
                                d={
                                  tier === 'foundation'
                                    ? 'M8 10h8M8 14h5'
                                    : tier === 'extension'
                                      ? 'm9 8 6 4-6 4V8Z'
                                      : 'M12 8v8M8 12h8'
                                }
                              />
                            </svg>
                          </span>

                          <div className="board-card-title">
                            <h3>{card.title}</h3>
                            <span className="board-status">{statusLabel}</span>
                          </div>
                          <p className="board-summary muted">
                            {card.summary.split(/[，。；]/u)[0]}
                          </p>
                          <p className="board-count">
                            <strong>{card.activeCount}</strong> 题
                            {card.activeCount === 0 && <span className="muted"> · 待补题</span>}
                          </p>
                          <button
                            type="button"
                            disabled={blocked || !card.scope || card.activeCount === 0}
                            aria-label={`进入板块：${card.title}`}
                            onClick={() => card.scope && onBrowse(card.scope, false)}
                          >
                            {availability === 'available'
                              ? '查看题库'
                              : availability === 'archived'
                                ? '无有效题目'
                                : '暂无题目'}
                          </button>
                          {card.archivedCount > 0 && (
                            <button
                              type="button"
                              disabled={blocked || !card.scope}
                              aria-label={`查看归档：${card.title}`}
                              onClick={() => card.scope && onBrowse(card.scope, true)}
                            >
                              另有 {card.archivedCount} 题已归档
                            </button>
                          )}
                          <details>
                            <summary>
                              {availability === 'planned' ? '查看建设规划' : '查看专题与范围'}
                            </summary>
                            <p className="muted">{card.summary}</p>
                            {card.topics.length > 0 ? (
                              <>
                                <p className="muted">本机已导入 {card.topics.length} 个专题</p>
                                <ul>
                                  {card.topics.map((topic) => (
                                    <li key={topic.topicId}>
                                      {topic.title}（{topic.activeCount} 题）
                                    </li>
                                  ))}
                                </ul>
                              </>
                            ) : (
                              <p className="muted">
                                暂无已导入专题。可先浏览下方规划，后续再补题。
                              </p>
                            )}
                            {card.plannedTopics.length > 0 && (
                              <>
                                <p className="muted">建设规划，尚不代表已导入</p>
                                <ul>
                                  {card.plannedTopics.map((topic) => (
                                    <li key={topic}>{topic}</li>
                                  ))}
                                </ul>
                                <p className="muted">{card.boundary}</p>
                              </>
                            )}
                          </details>
                        </article>
                      )
                    })}
                  </div>
                </section>
              )
            )
          })}
        </>
      )}
    </section>
  )
}
