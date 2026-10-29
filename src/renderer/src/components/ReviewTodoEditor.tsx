import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { QuestionIdentity } from '../../../shared/contracts/library-desktop'
import { reviewPresetDate } from '../../../shared/contracts/review-todos'
import { questionIdentityKey } from '../../../shared/contracts/question-sets'
import { createReviewController } from '../review-controller'
import { useNoteSaves } from '../note-saves'

function Editor({
  identity,
  readOnly,
  onChanged,
}: {
  identity: QuestionIdentity
  readOnly: boolean
  onChanged?: (() => void) | undefined
}) {
  const [controller] = useState(() => createReviewController(window.desktop.reviewTodos, identity))
  const state = useSyncExternalStore(controller.subscribe, controller.getState)
  const saves = useNoteSaves()
  const [open, setOpen] = useState(false)
  const [discard, setDiscard] = useState(false)
  const lifecycle = useRef(0)
  const changed = useRef(onChanged)
  changed.current = onChanged
  useEffect(() => {
    const epoch = ++lifecycle.current
    const unregister = saves.registerGuard(controller)
    return () => {
      unregister()
      queueMicrotask(() => {
        if (lifecycle.current === epoch) controller.dispose()
      })
    }
  }, [controller, saves.registerGuard])
  useEffect(() => {
    if (open) void controller.load()
  }, [open, controller])
  useEffect(() => {
    if (state.confirmations > 0) changed.current?.()
  }, [state.confirmations])
  const dirty = controller.hasPending()
  const busy = readOnly || state.loading || state.saving || saves.flushing
  const locked = busy || state.pending || state.conflict || state.todo === undefined
  const status = state.saving
    ? '保存中'
    : state.error && dirty
      ? '保存待处理'
      : dirty
        ? '待保存'
        : state.todo
          ? state.todo.state === 'done'
            ? '已完成'
            : '待复习'
          : '主动打开后安排'
  return (
    <details
      className="review-editor"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>复习安排 · {status}</summary>
      <p className="muted">
        填写日期或原因会加入待复习，停止编辑500ms自动保存。是否完成由你明确决定，查看答案不会自动完成。
      </p>
      {readOnly && <p role="status">正在保存其他更改，复习安排暂时只读。</p>}
      {state.loading && <p role="status">正在读取复习安排…</p>}
      {state.todo !== undefined && (
        <>
          <label>
            复习日期（可不设）
            <input
              type="date"
              aria-label="复习日期"
              value={state.draft.dueDate ?? ''}
              disabled={locked}
              onChange={(event) => controller.edit({ dueDate: event.currentTarget.value || null })}
            />
          </label>
          <div className="button-row">
            <button
              type="button"
              disabled={locked}
              onClick={() => controller.edit({ dueDate: reviewPresetDate('tomorrow') })}
            >
              明天复习
            </button>
            <button
              type="button"
              disabled={locked}
              onClick={() => controller.edit({ dueDate: reviewPresetDate('weekend') })}
            >
              本周末复习
            </button>
            <button
              type="button"
              disabled={locked}
              onClick={() => controller.edit({ dueDate: null })}
            >
              不设复习日期
            </button>
          </div>
          <label>
            复习原因
            <textarea
              aria-label="复习原因"
              rows={3}
              maxLength={500}
              value={state.draft.reason}
              readOnly={locked}
              onChange={(event) => controller.edit({ reason: event.currentTarget.value })}
            />
          </label>
          <div className="button-row">
            {!state.todo && (
              <button
                type="button"
                disabled={locked}
                onClick={() => {
                  controller.edit({})
                  void controller.flush()
                }}
              >
                加入待复习
              </button>
            )}
            {state.todo && (
              <button
                type="button"
                disabled={locked}
                onClick={() => {
                  controller.edit({ state: state.todo?.state === 'done' ? 'pending' : 'done' })
                  void controller.flush()
                }}
              >
                {state.todo.state === 'done' ? '重新加入待复习' : '完成这条待办'}
              </button>
            )}
            <button
              type="button"
              disabled={busy || !dirty || state.conflict}
              onClick={() => void controller.flush()}
            >
              {state.pending ? '重试原待办保存' : '立即保存复习安排'}
            </button>
          </div>
          {state.todo && state.confirmations > 0 && !dirty && !busy && (
            <p role="status">{state.todo.state === 'done' ? '待办已完成。' : '复习安排已保存。'}</p>
          )}
        </>
      )}
      {state.error && <p role="alert">{state.error}</p>}
      {state.conflict && <p>较新的安排不会被覆盖。请先保留需要的文字，再确认重新读取。</p>}
      <button
        type="button"
        disabled={busy}
        onClick={() => (dirty ? setDiscard(true) : void controller.load())}
      >
        重新读取复习安排
      </button>
      {discard && (
        <div role="alertdialog" aria-label="确认重新读取复习安排">
          <p>将放弃尚未确认的本地日期/原因并核对实际保存的安排；不会删除已保存待办。</p>
          <button type="button" autoFocus disabled={busy} onClick={() => setDiscard(false)}>
            保留当前安排
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setDiscard(false)
              void controller.load(true)
            }}
          >
            放弃本地修改并读取安排
          </button>
        </div>
      )}
      {state.todo?.completedAt && (
        <p className="muted">
          明确完成：{new Date(state.todo.completedAt).toLocaleString('zh-CN')}
        </p>
      )}
    </details>
  )
}
export function ReviewTodoEditor({
  identity,
  readOnly = false,
  onChanged,
}: {
  identity: QuestionIdentity
  readOnly?: boolean
  onChanged?: (() => void) | undefined
}) {
  return (
    <Editor
      key={questionIdentityKey(identity)}
      identity={identity}
      readOnly={readOnly}
      onChanged={onChanged}
    />
  )
}
