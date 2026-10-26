import { useEffect, useState } from 'react'
import type { LearningSummary } from '../../../shared/contracts/learning'
import type { PracticeView } from '../../../shared/contracts/practice'
import { ALL_CATEGORIES, type CategoryScope } from '../../../shared/contracts/categories'
import {
  EMPTY_QUESTION_FILTERS,
  type QuestionFilters,
} from '../../../shared/contracts/question-filters'

export function LearningOverview({
  refresh,
  practice,
  disabled,
  onConfigure,
  onBoards,
  onBrowse,
}: {
  refresh: number
  practice: { active: PracticeView | null; ready: boolean; busy: boolean; resume: () => void }
  disabled: boolean
  onConfigure: () => void
  onBoards: () => void
  onBrowse: (
    filters: QuestionFilters,
    category?: CategoryScope,
    contentUpdatedOnly?: boolean,
  ) => void
}) {
  const [summary, setSummary] = useState<LearningSummary>()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let current = true
    setLoading(true)
    setError('')
    void window.desktop.learning
      .read({ topicId: null, archived: false, category: ALL_CATEGORIES })
      .then((result) => {
        if (!current) return
        if (result.ok) setSummary(result.value)
        else setError(result.error.message)
      })
      .catch(() => {
        if (current) setError('无法读取学习总览，请重试。')
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [refresh, attempt])
  const active = practice.ready ? practice.active : null
  const blocked = disabled || practice.busy || !practice.ready
  return (
    <div className="learning-overview" aria-label="学习总览" aria-busy={loading || !practice.ready}>
      <section className="overview-welcome">
        <p className="eyebrow">从上次停下的地方继续</p>
        <h2>继续你的嵌入式学习</h2>
        <p>先独立思考，再对照答案。每一轮积累都保存在本机。</p>
      </section>
      <section className="overview-resume" aria-label="当前练习概况">
        {!practice.ready ? (
          <p role="status">正在读取当前练习…</p>
        ) : active ? (
          <>
            <div>
              <p className="eyebrow">继续原固定队列</p>
              <h3>{active.item?.topicTitle ?? '上次练习'}</h3>
              <p>
                当前位置 {active.session.position + 1} / {active.session.total} 题
              </p>
              <progress
                aria-label="本轮当前位置"
                value={active.session.position + 1}
                max={active.session.total}
              />
              <p className="muted">
                {active.session.mode === 'random' ? '随机练习' : '顺序练习'} · 已揭晓{' '}
                {active.session.counts.revealed} 题 · 已自评 {active.session.counts.rated} 题
              </p>
            </div>
            <div className="overview-resume-actions">
              <button
                type="button"
                className="primary"
                disabled={blocked}
                onClick={practice.resume}
              >
                继续本轮
              </button>
              <button type="button" disabled={blocked} onClick={onConfigure}>
                配置新练习
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h3>开始新练习</h3>
              <p className="muted">选择范围、顺序和题数；确认开始后才创建本轮。</p>
            </div>
            <button type="button" className="primary" disabled={blocked} onClick={onConfigure}>
              配置一轮练习
            </button>
          </>
        )}
      </section>
      {error ? (
        <div role="alert" className="error-message">
          <p>{error}</p>
          <button
            type="button"
            disabled={disabled || loading}
            onClick={() => setAttempt((value) => value + 1)}
          >
            重试读取总览
          </button>
        </div>
      ) : loading || !summary ? (
        <p role="status">正在读取本机学习统计…</p>
      ) : (
        <>
          <dl className="count-grid overview-counts" aria-label="有效题目当前版本统计">
            {(
              [
                ['有效题目', summary.total],
                ['已揭晓', summary.revealed],
                ['已自评', summary.rated],
                ['收藏', summary.favorites],
              ] as const
            ).map(([label, count]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{count}</dd>
              </div>
            ))}
          </dl>
          <p className="muted">全部有效题目，按题目身份和当前内容版本去重。自评是个人判断。</p>
          {summary.total === 0 && (
            <div className="overview-empty">
              <h3>从导入你的题库开始</h3>
              <p>在题库页选择 Markdown 文件，或导出模板在程序外填写。</p>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onBrowse({ ...EMPTY_QUESTION_FILTERS })}
              >
                导入题库或导出模板
              </button>
            </div>
          )}
          <div className="overview-lower">
            <section className="overview-section" aria-label="本机知识板块">
              <div className="section-heading">
                <h3>知识板块</h3>
                <button type="button" disabled={disabled} onClick={onBoards}>
                  查看全部板块
                </button>
              </div>
              <div className="overview-board-grid">
                {summary.categories.slice(0, 6).map((category) => {
                  const count = summary.topics
                    .filter((topic) => topic.categoryId === category.categoryId)
                    .reduce((total, topic) => total + topic.activeCount, 0)
                  return (
                    <button
                      type="button"
                      key={category.categoryId}
                      disabled={disabled}
                      onClick={() =>
                        onBrowse(
                          { ...EMPTY_QUESTION_FILTERS },
                          { kind: 'category', categoryId: category.categoryId },
                        )
                      }
                    >
                      <strong>{category.title}</strong>
                      <span>{count} 道有效题目</span>
                    </button>
                  )
                })}
                {summary.categories.length === 0 && (
                  <p className="muted">本机尚未创建分类。可先查看规划板块或导入专题。</p>
                )}
              </div>
            </section>
            <section className="overview-section" aria-label="复习筛选入口">
              <h3>复习入口</h3>
              <div className="overview-shortcuts">
                {(['不会', '不熟'] as const).map((mastery) => (
                  <button
                    type="button"
                    key={mastery}
                    data-rating={mastery}
                    disabled={disabled}
                    onClick={() => onBrowse({ ...EMPTY_QUESTION_FILTERS, mastery })}
                  >
                    <strong>{mastery}</strong>
                    <span>{summary.ratings[mastery]} 题 · 去筛选</span>
                  </button>
                ))}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onBrowse({ ...EMPTY_QUESTION_FILTERS }, ALL_CATEGORIES, true)}
                >
                  <strong>内容更新待复习</strong>
                  <span>{summary.contentUpdated} 题 · 去筛选</span>
                </button>
              </div>
              <p className="muted">只填入题库筛选条件，不会自动开始或替换练习。</p>
            </section>
          </div>
        </>
      )}
    </div>
  )
}
