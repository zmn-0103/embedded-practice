import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import type {
  PracticeAction,
  PracticeController,
  PracticeEditorState,
} from '../practice-controller'
import { MarkdownContent } from './MarkdownContent'
import { QuestionHistory } from './QuestionHistory'
import { DifficultyBadge } from './DifficultyBadge'
import { PracticeFavorite } from './PracticeFavorite'

const ACTION_REPEAT_GUARD_MS = 500

function keepAnswerVisible(input: HTMLTextAreaElement, actions: HTMLDivElement) {
  if (!input.isConnected || document.activeElement !== input) return
  const box = input.getBoundingClientRect()
  const style = window.getComputedStyle(input)
  const firstLineHeight =
    Number.parseFloat(style.borderTopWidth) +
    Number.parseFloat(style.paddingTop) +
    Number.parseFloat(style.lineHeight)
  const visibleBottom = Math.min(actions.getBoundingClientRect().top, window.innerHeight)
  const desiredVisibleHeight = Math.min(
    box.height,
    Math.max(firstLineHeight, visibleBottom - Number.parseFloat(style.scrollMarginTop)),
  )
  if (box.top < 0 || box.top + desiredVisibleHeight > visibleBottom)
    input.scrollIntoView({ block: 'start' })
}

export function PracticePane({
  state,
  controller,
  homeBusy,
  onHome,
  onDataBusy,
  onDataOperation,
}: {
  state: PracticeEditorState
  controller: PracticeController
  homeBusy: boolean
  onHome: () => void
  onDataBusy: (busy: boolean) => void
  onDataOperation: (work: Promise<boolean>) => void
}) {
  const title = useRef<HTMLHeadingElement>(null)
  const actions = useRef<HTMLDivElement>(null)
  const reading = useRef<HTMLDivElement>(null)
  const workspace = useRef<HTMLElement>(null)
  const actionReserve = useRef<HTMLDivElement>(null)
  const repeatTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [repeatBlocked, setRepeatBlocked] = useState(false)
  const [favoriteBusy, setFavoriteBusy] = useState(false)
  useEffect(
    () => () => {
      clearTimeout(repeatTimer.current)
    },
    [],
  )
  useLayoutEffect(() => {
    if (!title.current) return
    // 只在换题或显示结果时定位；同题保存、揭晓不能抢走阅读位置和输入焦点。
    window.scrollTo(0, 0)
    title.current.focus({ preventScroll: true })
  }, [state.view?.session.sessionId, state.view?.session.position, state.view?.session.status])
  useEffect(() => {
    const element = reading.current
    if (!element) return
    // 懒加载图片会在聚焦后改变阅读区高度；按真实布局变化复核，避免固定延时或重复滚动。
    const observer = new ResizeObserver(() => {
      const input = document.activeElement
      if (input instanceof HTMLTextAreaElement && element.contains(input) && actions.current)
        keepAnswerVisible(input, actions.current)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [state.view?.session.sessionId, state.view?.session.position, state.view?.item?.versionId])
  useLayoutEffect(() => {
    const bar = actions.current
    const reserve = actionReserve.current
    if (!bar || !reserve) return
    const update = () => {
      const height = Math.ceil(bar.getBoundingClientRect().height) + 24
      reserve.style.height = `${height}px`
      workspace.current?.style.setProperty('--practice-actions-height', `${height}px`)
      const input = document.activeElement
      if (input instanceof HTMLTextAreaElement && reading.current?.contains(input))
        keepAnswerVisible(input, bar)
    }
    const observer = new ResizeObserver(update)
    observer.observe(bar)
    update()
    return () => observer.disconnect()
  }, [Boolean(state.view?.item)])
  useLayoutEffect(() => {
    if (state.error) actions.current?.scrollTo(0, 0)
  }, [state.error])
  const view = state.view
  if (!view) return null
  const { session, item } = view
  const modeLabel = session.mode === 'random' ? '随机练习' : '顺序练习'
  const blocked = state.busy || state.closing || state.pending || homeBusy || favoriteBusy
  const actionsBlocked = blocked || repeatBlocked
  function perform(event: MouseEvent<HTMLButtonElement>, action: PracticeAction) {
    if (blocked || repeatTimer.current !== undefined || event.detail > 1) return
    // 请求很快完成时仍保留短暂保护，避免第二次激活落到新题目。
    setRepeatBlocked(true)
    repeatTimer.current = setTimeout(() => {
      repeatTimer.current = undefined
      setRepeatBlocked(false)
    }, ACTION_REPEAT_GUARD_MS)
    void controller.perform(action)
  }
  if (!item)
    return (
      <section className="practice-workspace" aria-label="练习结果">
        <p className="eyebrow">这一轮的积累已保存在本机</p>
        <p className="muted">{modeLabel}</p>
        <h2 ref={title} tabIndex={-1}>
          {session.status === 'finished' ? '本轮已完成' : '本轮已结束'}
        </h2>
        <dl className="count-grid">
          {(
            [
              ['本轮题数', session.total],
              ['已揭晓', session.counts.revealed],
              ['已自评', session.counts.rated],
              ['不会', session.counts.ratings.不会],
              ['不熟', session.counts.ratings.不熟],
              ['掌握', session.counts.ratings.掌握],
            ] as const
          ).map(([label, count]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{count}</dd>
            </div>
          ))}
        </dl>
        <p>
          揭晓未评价 {session.counts.unrated} 题，仍未揭晓的跳过题 {session.counts.skipped} 题。
        </p>
        <button type="button" disabled={actionsBlocked} onClick={onHome}>
          返回首页
        </button>
      </section>
    )
  const labels = {
    saved: '已保存',
    dirty: '待保存',
    saving: '保存中…',
    failed: '保存失败',
  } as const
  return (
    <section ref={workspace} className="practice-workspace" aria-label={modeLabel}>
      <div className="practice-heading">
        <div className="practice-heading-actions">
          <button type="button" disabled={actionsBlocked} onClick={onHome}>
            保存并返回
          </button>
          <PracticeFavorite
            key={`${item.topicId}/${item.questionId}`}
            identity={{ topicId: item.topicId, questionId: item.questionId }}
            disabled={blocked}
            onBusyChange={(value) => {
              setFavoriteBusy(value)
              onDataBusy(value)
            }}
            onOperation={onDataOperation}
          />
        </div>
        <p aria-label="练习进度">
          第 {session.position + 1} / {session.total} 题 · {modeLabel}
        </p>
        <p className="muted">
          {item.topicTitle} · <DifficultyBadge difficulty={item.difficulty} />
          {item.tags.length > 0 ? ` · ${item.tags.join('、')}` : ''}
        </p>
        <h2 ref={title} tabIndex={-1}>
          {item.title}
        </h2>
      </div>
      <aside id="practice-context" className="practice-context" aria-label="练习辅助面板">
        <dl>
          <dt>已揭晓</dt>
          <dd>{session.counts.revealed} 题</dd>
          <dt>已自评</dt>
          <dd>{session.counts.rated} 题</dd>
        </dl>
      </aside>
      <div
        ref={reading}
        className="practice-reading"
        key={`${session.sessionId}-${item.position}-${item.versionId}`}
      >
        <div className="practice-question-column">
          <section aria-label="练习题干">
            <h3>题干</h3>
            <MarkdownContent body={item.body} versionId={item.versionId} />
          </section>
          <details className="practice-input" open>
            <summary id="practice-answer-label">我的答案</summary>
            <textarea
              id="practice-answer"
              aria-labelledby="practice-answer-label"
              rows={6}
              value={state.draft.text}
              readOnly={blocked}
              placeholder="写下思路或代码，也可以先思考再揭晓。"
              onFocus={(event) => {
                const input = event.currentTarget
                // 等浏览器完成聚焦滚动后再测量，避免随后默认滚动把首行移回操作栏下方。
                requestAnimationFrame(() => {
                  if (actions.current) keepAnswerVisible(input, actions.current)
                })
              }}
              onChange={(event) => controller.edit(event.currentTarget.value)}
            />
            <p className="practice-input-save" aria-live="polite">
              {labels[state.saveStatus]}
            </p>
          </details>
        </div>
        <div className="practice-reference-column">
          {item.revealed ? (
            <>
              <section aria-label="练习参考答案" className="reference-answer">
                <h3>参考答案</h3>
                <MarkdownContent body={item.answer} versionId={item.versionId} />
                {item.rating && (
                  <p className="muted">本轮自评：{item.rating}，再次自评会更新本轮记录。</p>
                )}
              </section>
              <QuestionHistory
                topicId={item.topicId}
                questionId={item.questionId}
                excludeSessionId={session.sessionId}
              />
            </>
          ) : (
            <section className="answer-placeholder" aria-label="参考答案未揭晓">
              <h3>参考答案</h3>
              <div>
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <rect x="5" y="10" width="14" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <p>先尝试回忆，再查看参考答案</p>
                <p className="muted">允许空输入，揭晓后自行评价。</p>
              </div>
            </section>
          )}
        </div>
      </div>
      <div ref={actionReserve} className="practice-action-reserve">
        <div
          ref={actions}
          className="practice-actions"
          data-save-status={state.saveStatus}
          onKeyDown={(event) => {
            // 长按产生的重复键即使跨过保护期，也不能成为下一题的新操作。
            if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault()
          }}
        >
          <div className="practice-action-status">
            <p className="practice-stage" aria-live="polite">
              <strong>{item.revealed ? '保存并继续' : '思考与作答'}</strong>
              <span>
                {item.revealed
                  ? session.position + 1 === session.total
                    ? '选择自评后保存并完成本轮'
                    : '选择自评后保存并进入下一题'
                  : '查看参考答案后，再自行评价'}
              </span>
            </p>
            <div className="practice-save" aria-live="polite">
              {state.closing ? '正在准备关闭…' : labels[state.saveStatus]}
            </div>
          </div>
          {state.error && (
            <div role="alert" className="error-message">
              <p>{state.error}</p>
              {(state.pending || state.saveStatus === 'failed') && (
                <button
                  type="button"
                  className="primary"
                  disabled={state.busy || state.closing || homeBusy || repeatBlocked}
                  onClick={() => {
                    void controller.retry()
                  }}
                >
                  {state.pending ? '重试原操作' : '重试保存'}
                </button>
              )}
            </div>
          )}
          <div className="practice-evaluation" aria-label="自评与推进">
            {!item.revealed ? (
              <>
                <button
                  type="button"
                  className="primary"
                  disabled={actionsBlocked}
                  onClick={(event) => perform(event, { kind: 'reveal' })}
                >
                  查看参考答案
                </button>
                <button
                  type="button"
                  className="quiet-action"
                  disabled={actionsBlocked}
                  onClick={(event) => perform(event, { kind: 'navigate', direction: 'skip' })}
                >
                  跳过本题
                </button>
              </>
            ) : (
              <>
                {(['不会', '不熟', '掌握'] as const).map((rating) => (
                  <button
                    type="button"
                    key={rating}
                    data-rating={rating}
                    disabled={actionsBlocked}
                    onClick={(event) => perform(event, { kind: 'rate', rating })}
                  >
                    {rating}
                  </button>
                ))}
                <button
                  type="button"
                  className="quiet-action"
                  disabled={actionsBlocked}
                  onClick={(event) => perform(event, { kind: 'rate', rating: null })}
                >
                  暂不评价，下一题
                </button>
              </>
            )}
          </div>
          <div className="practice-navigation" aria-label="本轮导航">
            <button type="button" disabled={actionsBlocked} onClick={onHome}>
              保存后返回
            </button>
            <button
              type="button"
              disabled={actionsBlocked || session.position === 0}
              onClick={(event) => perform(event, { kind: 'navigate', direction: 'previous' })}
            >
              上一题
            </button>
            <button
              type="button"
              className="quiet-action"
              disabled={actionsBlocked}
              onClick={(event) => perform(event, { kind: 'end' })}
            >
              结束本轮
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
