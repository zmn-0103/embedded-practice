import { useEffect, useMemo, useState } from 'react'
import type {
  ContentComparison,
  ContentComparisonRequest,
} from '../../../shared/contracts/content-updates'
import { compareContentText } from '../content-diff'
import { MarkdownContent } from './MarkdownContent'

export function ContentComparisonView({ request }: { request: ContentComparisonRequest }) {
  const [loaded, setData] = useState<ContentComparison>()
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const { topicId, questionId, versionId, previousVersionId, part } = request
  const data =
    loaded?.topicId === topicId &&
    loaded.questionId === questionId &&
    loaded.part === part &&
    loaded.current.versionId === versionId &&
    loaded.previous.versionId === previousVersionId
      ? loaded
      : undefined
  useEffect(() => {
    let current = true
    setData(undefined)
    setError('')
    void window.desktop.contentUpdates
      .compare({ topicId, questionId, versionId, previousVersionId, part })
      .then((result) => {
        if (!current) return
        if (!result.ok) {
          setError(result.error.message)
          return
        }
        const value = result.value
        if (
          value.topicId !== topicId ||
          value.questionId !== questionId ||
          value.part !== part ||
          value.current.versionId !== versionId ||
          value.previous.versionId !== previousVersionId
        )
          throw new Error('差异内容与请求不符')
        setData(value)
      })
      .catch(() => {
        if (current) setError('无法读取这两版内容，请保留选择并重试。')
      })
    return () => {
      current = false
    }
  }, [topicId, questionId, versionId, previousVersionId, part, attempt])
  const diff = useMemo(
    () =>
      data
        ? compareContentText(data.previous.body.markdown, data.current.body.markdown)
        : undefined,
    [data],
  )
  const label = part === 'question' ? '题干内容差异' : '参考答案内容差异'
  return (
    <section className="content-comparison" aria-label={label}>
      <h4>{label}</h4>
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setAttempt(attempt + 1)}>
            重试读取{part === 'question' ? '题干' : '参考答案'}差异
          </button>
        </div>
      ) : !data || !diff ? (
        <p role="status">正在读取{part === 'question' ? '题干' : '参考答案'}差异…</p>
      ) : (
        <>
          <p>
            版本{data.previous.sequence}（
            {new Date(data.previous.createdAt).toLocaleString('zh-CN')}） → 版本
            {data.current.sequence}（{new Date(data.current.createdAt).toLocaleString('zh-CN')}）
          </p>
          {diff.coarse && (
            <p>文字较长，采用完整原片段与新片段对照，中间可能包含未变行；未截断内容。</p>
          )}
          {!diff.chunks.some((chunk) => chunk.kind !== 'same') && (
            <p>
              这部分的Markdown文字相同；图片、引用或另一分区仍可能有变化，请结合两份内容预览确认。
            </p>
          )}
          <div className="content-diff-chunks">
            {diff.chunks.map((chunk, index) =>
              chunk.kind === 'same' ? (
                <details key={index} className="diff-unchanged">
                  <summary>未变文字（{chunk.lines.length}行）</summary>
                  <pre className="history-draft">{chunk.lines.join('\n')}</pre>
                </details>
              ) : (
                <section key={index} data-change-kind={chunk.kind}>
                  <h5>
                    {chunk.kind === 'removed'
                      ? diff.coarse
                        ? '− 原片段'
                        : '− 删除文字'
                      : diff.coarse
                        ? '＋ 新片段'
                        : '＋ 新增文字'}
                  </h5>
                  <pre className="history-draft">{chunk.lines.join('\n')}</pre>
                </section>
              ),
            )}
          </div>
          <details
            className="content-version-previews"
            open={!diff.chunks.some((chunk) => chunk.kind !== 'same')}
          >
            <summary>查看两版内容预览（含图片）</summary>
            <div className="content-preview-columns">
              <section aria-label={`${label}旧版预览`}>
                <h5>原版本{data.previous.sequence}</h5>
                <MarkdownContent body={data.previous.body} versionId={data.previous.versionId} />
              </section>
              <section aria-label={`${label}新版预览`}>
                <h5>目标版本{data.current.sequence}</h5>
                <MarkdownContent body={data.current.body} versionId={data.current.versionId} />
              </section>
            </div>
          </details>
        </>
      )}
    </section>
  )
}
