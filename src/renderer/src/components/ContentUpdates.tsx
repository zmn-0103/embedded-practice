import { useEffect, useState } from 'react'
import type { ContentVersion, ContentVersions } from '../../../shared/contracts/content-updates'
import type { VersionIdentity } from '../../../shared/contracts/library-desktop'
import { ContentComparisonView } from './ContentComparison'

function VersionComparison({ identity }: { identity: VersionIdentity }) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<ContentVersions>()
  const [selected, setSelected] = useState<ContentVersion>()
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const { topicId, questionId, versionId } = identity
  useEffect(() => {
    if (!open) return
    let current = true
    setLoading(true)
    setError('')
    setData(undefined)
    void window.desktop.contentUpdates
      .versions({ topicId, questionId, versionId, page })
      .then((result) => {
        if (!current) return
        if (!result.ok) {
          setError(result.error.message)
          return
        }
        if (
          result.value.topicId !== topicId ||
          result.value.questionId !== questionId ||
          result.value.target.versionId !== versionId
        )
          throw new Error('版本列表与当前题目不符')
        setData(result.value)
        setSelected((previous) => previous ?? result.value.versions[0])
      })
      .catch(() => {
        if (current) setError('无法读取本题内容版本，请重试。')
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [topicId, questionId, versionId, open, page, attempt])
  const pairKey = `${versionId}/${selected?.versionId}`
  return (
    <details
      className="content-updates"
      open={open}
      onToggle={(event) => {
        const next = event.currentTarget.open
        setOpen(next)
        if (!next) {
          setData(undefined)
          setSelected(undefined)
          setShowAnswer(false)
          setPage(1)
        }
      }}
    >
      <summary>查看内容版本与差异</summary>
      {open && (
        <>
          <p className="muted">
            默认对照上一个内容版本的题干，也可选择更早版本。查看差异不会标记已复习；参考答案需另行明确查看。
          </p>
          {error ? (
            <div role="alert">
              <p>{error}</p>
              <button type="button" onClick={() => setAttempt(attempt + 1)}>
                重试读取内容版本
              </button>
            </div>
          ) : loading || !data ? (
            <p role="status">正在读取内容版本…</p>
          ) : (
            <>
              <p>
                目标版本{data.target.sequence} ·{' '}
                {new Date(data.target.createdAt).toLocaleString('zh-CN')}；共有{data.total}
                个更早内容版本。
              </p>
              {data.total === 0 ? (
                <p>没有更早内容版本可对照。</p>
              ) : (
                <>
                  <fieldset className="content-version-choices">
                    <legend>选择要对照的旧版本</legend>
                    {data.versions.map((version) => (
                      <label key={version.versionId}>
                        <input
                          type="radio"
                          name={`content-old-${topicId}-${questionId}-${versionId}`}
                          checked={selected?.versionId === version.versionId}
                          onChange={() => {
                            setShowAnswer(false)
                            setSelected(version)
                          }}
                          aria-label={`对照内容版本${version.sequence}`}
                        />
                        版本{version.sequence} ·{' '}
                        {new Date(version.createdAt).toLocaleString('zh-CN')}
                      </label>
                    ))}
                  </fieldset>
                  <nav className="pagination" aria-label="内容版本分页">
                    <button
                      type="button"
                      disabled={data.page <= 1}
                      onClick={() => setPage(data.page - 1)}
                    >
                      上一页
                    </button>
                    <span>
                      {data.page} / {Math.ceil(data.total / data.pageSize)}
                    </span>
                    <button
                      type="button"
                      disabled={data.page * data.pageSize >= data.total}
                      onClick={() => setPage(data.page + 1)}
                    >
                      下一页
                    </button>
                  </nav>
                  {selected && (
                    <div className="content-selected-comparison">
                      <p>
                        已选：旧版本{selected.sequence} → 目标版本{data.target.sequence}
                        。这只是内容对照，不是能力评分。
                      </p>
                      <ContentComparisonView
                        key={`question/${pairKey}`}
                        request={{
                          ...identity,
                          previousVersionId: selected.versionId,
                          part: 'question',
                        }}
                      />
                      <button
                        type="button"
                        aria-expanded={showAnswer}
                        onClick={() => setShowAnswer(!showAnswer)}
                      >
                        {showAnswer ? '收起参考答案变化' : '查看参考答案变化'}
                      </button>
                      {showAnswer && (
                        <ContentComparisonView
                          key={`answer/${pairKey}`}
                          request={{
                            ...identity,
                            previousVersionId: selected.versionId,
                            part: 'answer',
                          }}
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </details>
  )
}
export function ContentUpdates({ identity }: { identity: VersionIdentity }) {
  return (
    <VersionComparison
      key={JSON.stringify([identity.topicId, identity.questionId, identity.versionId])}
      identity={identity}
    />
  )
}
