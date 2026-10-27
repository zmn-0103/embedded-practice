import { useEffect, useState } from 'react'
import type { LearningScope, LearningSummary } from '../../../shared/contracts/learning'
import { LibraryBrowser } from './LibraryBrowser'
import { ALL_CATEGORIES, matchesCategory } from '../../../shared/contracts/categories'
import { TopicNavigator } from './TopicNavigator'

export function LearningRecords({
  refresh,
  onFavoriteSaved,
}: {
  refresh: number
  onFavoriteSaved: () => void
}) {
  const [scope, setScope] = useState<LearningScope>({
    topicId: null,
    archived: false,
    category: ALL_CATEGORIES,
  })
  const [topics, setTopics] = useState<LearningSummary['topics']>([])
  const [categories, setCategories] = useState<LearningSummary['categories']>([])
  const [data, setData] = useState<LearningSummary>()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const { topicId, archived } = scope
  const category = scope.category ?? ALL_CATEGORIES
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    void window.desktop.learning
      .read({ topicId, archived, category })
      .then((result) => {
        if (!active) return
        if (result.ok) {
          setData(result.value)
          setTopics(result.value.topics)
          setCategories(result.value.categories)
        } else setError(result.error.message)
      })
      .catch(() => {
        if (active) setError('无法读取学习记录，请重试。')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [topicId, archived, category, refresh, attempt])
  const summary =
    !loading &&
    !error &&
    data?.topicId === topicId &&
    data.archived === archived &&
    data.category.kind === category.kind &&
    (category.kind !== 'category' ||
      (data.category.kind === 'category' && data.category.categoryId === category.categoryId))
      ? data
      : undefined
  return (
    <section className="learning-records" aria-label="学习记录">
      <h2>学习记录</h2>
      <div className="records-scope">
        <details className="topic-navigation-panel">
          <summary>
            按分类查看学习记录 ·{' '}
            {category.kind === 'all'
              ? '全部分类'
              : category.kind === 'uncategorized'
                ? '未分类'
                : (categories.find((item) => item.categoryId === category.categoryId)?.title ??
                  '分类已移除')}
          </summary>
          <TopicNavigator
            prefix="学习记录"
            categories={categories}
            topics={topics}
            category={category}
            topicId={topicId}
            archived={archived}
            onChange={(next, topic) => setScope({ ...scope, category: next, topicId: topic })}
          />
        </details>
        <div className="library-filters">
          <label>
            学习记录专题
            <select
              aria-label="学习记录专题"
              value={topicId ?? ''}
              onChange={(event) =>
                setScope({ ...scope, topicId: event.currentTarget.value || null })
              }
            >
              <option value="">全部专题</option>
              {topicId &&
                !topics.some(
                  (topic) =>
                    topic.topicId === topicId && matchesCategory(topic.categoryId, category),
                ) && (
                  <option value={topicId} disabled>
                    已移出当前分类的专题
                  </option>
                )}
              {topics
                .filter((topic) => matchesCategory(topic.categoryId, category))
                .map((topic) => (
                  <option value={topic.topicId} key={topic.topicId}>
                    {topic.title}
                  </option>
                ))}
            </select>
          </label>
          <label>
            学习记录范围
            <select
              aria-label="学习记录范围"
              value={archived ? 'archived' : 'active'}
              onChange={(event) =>
                setScope({ ...scope, archived: event.currentTarget.value === 'archived' })
              }
            >
              <option value="active">活动题目</option>
              <option value="archived">归档题目</option>
            </select>
          </label>
        </div>
      </div>
      {error ? (
        <div role="alert" className="error-message">
          <p>{error}</p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>
            重试读取学习记录
          </button>
        </div>
      ) : !summary ? (
        <p aria-live="polite">正在读取学习记录…</p>
      ) : (
        <>
          <dl className="count-grid learning-counts" aria-label="当前版本学习总览">
            {[
              ['范围内题数', summary.total],
              ['已揭晓题数', summary.revealed],
              ['已自评题数', summary.rated],
              ['收藏题数', summary.favorites],
              ['内容更新待复习题数', summary.contentUpdated],
            ].map(([label, count]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{count}</dd>
              </div>
            ))}
          </dl>
          <dl className="count-grid learning-ratings" aria-label="当前版本自评分布">
            {(['不会', '不熟', '掌握'] as const).map((rating) => (
              <div key={rating} data-rating={rating}>
                <dt>{rating}</dt>
                <dd>{summary.ratings[rating]}</dd>
              </div>
            ))}
          </dl>
          <p className="records-denominator muted">
            自评分布分母：已自评 {summary.rated} 题；范围内未自评 {summary.total - summary.rated}{' '}
            题（含未揭晓）。
          </p>
          {summary.total === 0 && <p>此范围暂无题目，可切换范围或返回题库导入。</p>}
        </>
      )}
      <details className="records-help">
        <summary>统计口径与历史说明</summary>
        <p>按题去重，仅统计所选范围的当前内容版本；多轮练习不会重复累计题数。</p>
        <p className="muted">
          揭晓只计算真实练习记录；仅保存草稿、跳过或查看题库答案不计入。旧数据若只有自评而无作答记录，只计入自评，不补造揭晓或历史。自评是个人判断。
        </p>
      </details>
      <h3>题目与单题历史</h3>
      <p className="muted">
        默认只看收藏；无收藏时取消勾选即可查看本范围其他题目。下方筛选不改变上方统计，历史需主动展开。
      </p>
      <LibraryBrowser
        key={`${category.kind}/${category.kind === 'category' ? category.categoryId : ''}/${topicId ?? ''}/${archived}`}
        scope={scope}
        refresh={refresh}
        onFavoriteSaved={() => {
          setAttempt((value) => value + 1)
          onFavoriteSaved()
        }}
      />
    </section>
  )
}
