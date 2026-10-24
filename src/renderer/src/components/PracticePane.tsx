import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import type {
  PracticeAction,
  PracticeController,
  PracticeEditorState,
} from '../practice-controller'
import { MarkdownContent } from './MarkdownContent'
import { QuestionHistory } from './QuestionHistory'
import { DifficultyBadge } from './DifficultyBadge'

const ACTION_REPEAT_GUARD_MS = 500

export function PracticePane({
  state,
  controller,
  homeBusy,
  onHome,
}: {
  state: PracticeEditorState
  controller: PracticeController
  homeBusy: boolean
  onHome: () => void
}) {
  const title = useRef<HTMLHeadingElement>(null)
  const actions = useRef<HTMLDivElement>(null)
  const repeatTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [repeatBlocked, setRepeatBlocked] = useState(false)
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
  const view = state.view
  if (!view) return null
  const { session, item } = view
  const modeLabel = session.mode === 'random' ? '随机练习' : '顺序练习'
  const blocked = state.busy || state.closing || state.pending || homeBusy
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
    <section className="practice-workspace" aria-label={modeLabel}>
      <div className="practice-heading">
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
      <div
        className="practice-reading"
        key={`${session.sessionId}-${item.position}-${item.versionId}`}
      >
        <section aria-label="练习题干">
          <MarkdownContent body={item.body} versionId={item.versionId} />
        </section>
        <details className="practice-input" open>
          <summary>我的答案</summary>
          <label htmlFor="practice-answer" className="muted">
            我的答案
          </label>
          <textarea
            id="practice-answer"
            rows={8}
            value={state.draft.text}
            readOnly={blocked}
            placeholder="可以输入文字或代码，也可以先思考，再查看参考答案。"
            onFocus={(event) => {
              if (!actions.current) return
              const input = event.currentTarget
              const box = input.getBoundingClientRect()
              const style = window.getComputedStyle(input)
              const firstLineBottom =
                box.top +
                Number.parseFloat(style.borderTopWidth) +
                Number.parseFloat(style.paddingTop) +
                Number.parseFloat(style.lineHeight)
              // 浏览器的聚焦滚动不考虑底部悬浮区，输入行被遮挡时再定位。
              if (box.top >= 0 && firstLineBottom > actions.current.getBoundingClientRect().top)
                input.scrollIntoView({ block: 'start' })
            }}
            onChange={(event) => controller.edit(event.currentTarget.value)}
          />
        </details>
        {item.revealed && (
          <section aria-label="练习参考答案" className="reference-answer">
            <h3>参考答案</h3>
            <MarkdownContent body={item.answer} versionId={item.versionId} />
            {item.rating && (
              <p className="muted">本轮自评：{item.rating}，再次自评会更新本轮记录。</p>
            )}
          </section>
        )}
        <QuestionHistory
          topicId={item.topicId}
          questionId={item.questionId}
          excludeSessionId={session.sessionId}
        />
      </div>
      <div
        ref={actions}
        className="practice-actions"
        onKeyDown={(event) => {
          // 长按产生的重复键即使跨过保护期，也不能成为下一题的新操作。
          if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault()
        }}
      >
        <div className="practice-save" aria-live="polite">
          {state.closing ? '正在准备关闭…' : labels[state.saveStatus]}
        </div>
        {state.error && (
          <div role="alert" className="error-message">
            <p>{state.error}</p>
            {(state.pending || state.saveStatus === 'failed') && (
              <button
                type="button"
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
        <div className="button-row">
          <button
            type="button"
            disabled={actionsBlocked || session.position === 0}
            onClick={(event) => perform(event, { kind: 'navigate', direction: 'previous' })}
          >
            上一题
          </button>
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
                  disabled={actionsBlocked}
                  onClick={(event) => perform(event, { kind: 'rate', rating })}
                >
                  {rating}
                </button>
              ))}
              <button
                type="button"
                disabled={actionsBlocked}
                onClick={(event) => perform(event, { kind: 'rate', rating: null })}
              >
                暂不评价，下一题
              </button>
            </>
          )}
          <button type="button" disabled={actionsBlocked} onClick={onHome}>
            返回首页
          </button>
          <button
            type="button"
            disabled={actionsBlocked}
            onClick={(event) => perform(event, { kind: 'end' })}
          >
            结束本轮
          </button>
        </div>
      </div>
    </section>
  )
}
