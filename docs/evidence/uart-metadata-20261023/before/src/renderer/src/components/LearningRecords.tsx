import { useEffect, useState } from 'react'
import type { LearningScope, LearningSummary } from '../../../shared/contracts/learning'
import { LibraryBrowser } from './LibraryBrowser'

export function LearningRecords({
  refresh,
  onFavoriteSaved,
}: {
  refresh: number
  onFavoriteSaved: () => void
}) {
  const [scope, setScope] = useState<LearningScope>({ topicId: null, archived: false })
  const [topics, setTopics] = useState<LearningSummary['topics']>([])
  const [data, setData] = useState<LearningSummary>()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const { topicId, archived } = scope
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    void window.desktop.learning
      .read({ topicId, archived })
      .then((result) => {
        if (!active) return
        if (result.ok) {
          setData(result.value)
          setTopics(result.value.topics)
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
  }, [topicId, archived, refresh, attempt])
  const summary =
    !loading && !error && data?.topicId === topicId && data.archived === archived ? data : undefined
  return (
    <section className="learning-records" aria-label="学习记录">
      <h2>学习记录</h2>
      <p>按题去重，仅统计所选范围的当前内容版本；多轮练习不会重复累计题数。</p>
      <div className="library-filters">
        <label>
          学习记录专题
          <select
            aria-label="学习记录专题"
            value={topicId ?? ''}
            onChange={(event) => setScope({ ...scope, topicId: event.currentTarget.value || null })}
          >
            <option value="">全部专题</option>
            {topics.map((topic) => (
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
              <div key={rating}>
                <dt>{rating}</dt>
                <dd>{summary.ratings[rating]}</dd>
              </div>
            ))}
          </dl>
          {summary.total === 0 && <p>此范围暂无题目，可切换范围或返回题库导入。</p>}
        </>
      )}
      <p className="muted">
        揭晓只计算真实练习记录；仅保存草稿、跳过或查看题库答案不计入。旧数据若只有自评而无作答记录，只计入自评，不补造揭晓或历史。自评是个人判断。
      </p>
      <h3>题目与单题历史</h3>
      <p className="muted">
        下方默认只看收藏，可取消或调整筛选后查看本范围其他题目。下方筛选不改变上方范围总览，历史需主动展开。
      </p>
      <LibraryBrowser
        key={`${topicId ?? ''}/${archived}`}
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
