import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { QuestionIdentity } from '../../../shared/contracts/library-desktop'
import { questionIdentityKey } from '../../../shared/contracts/question-sets'
import { createNoteController } from '../note-controller'
import { useNoteSaves } from '../note-saves'

function NoteEditor({ identity, readOnly }: { identity: QuestionIdentity; readOnly: boolean }) {
  const [controller] = useState(() => createNoteController(window.desktop.study, identity))
  const state = useSyncExternalStore(controller.subscribe, controller.getState)
  const saves = useNoteSaves()
  const [open, setOpen] = useState(false)
  const [discard, setDiscard] = useState(false)
  const lifecycle = useRef(0)
  const dirty = controller.hasPending()
  useEffect(() => {
    const epoch = ++lifecycle.current
    const unregister = saves.register(controller)
    return () => {
      unregister()
      queueMicrotask(() => {
        if (lifecycle.current === epoch) controller.dispose()
      })
    }
  }, [saves.register, controller])
  useEffect(() => {
    if (open) void controller.load()
  }, [open, controller])
  const status = state.saving
    ? '保存中…'
    : state.conflict
      ? '笔记有冲突，展开核对'
      : state.error && dirty
        ? '保存失败，展开处理'
        : dirty
          ? '待保存'
          : state.note
            ? '已保存'
            : '主动打开后读取'
  return (
    <details
      className="personal-note"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>个人笔记 · {status}</summary>
      <p className="muted">
        记录理解、遗漏和易混点，跨轮保留，与本轮独立作答分开。停止输入500ms自动保存，最多1MiB；可随题单或已结束轮次导出。
      </p>
      {readOnly && <p role="status">正在保存收藏并更新列表，笔记暂时只读。</p>}
      {state.loading && <p role="status">正在读取个人笔记…</p>}
      {state.note && (
        <label>
          我的复习笔记
          <textarea
            aria-label="我的复习笔记"
            value={state.text}
            rows={6}
            maxLength={1_048_576}
            disabled={state.loading}
            readOnly={readOnly || state.pending || saves.flushing}
            onChange={(event) => controller.edit(event.currentTarget.value)}
          />
        </label>
      )}
      {state.error && (
        <p role="alert" className="error-message">
          {state.error}
        </p>
      )}
      {state.conflict && (
        <p>保留了当前输入。请先复制需要保留的文字，再确认重新读取；不会覆盖较新的已保存笔记。</p>
      )}
      <div className="button-row">
        <button
          type="button"
          disabled={
            readOnly || !dirty || state.loading || state.saving || state.conflict || saves.flushing
          }
          onClick={() => void controller.flush()}
        >
          {state.pending ? '重试原笔记保存' : '立即保存笔记'}
        </button>
        <button
          type="button"
          disabled={readOnly || state.loading || state.saving || saves.flushing}
          onClick={() => (dirty ? setDiscard(true) : void controller.load())}
        >
          重新读取个人笔记
        </button>
      </div>
      {discard && (
        <div role="alertdialog" aria-label="确认重新读取笔记">
          <p>将放弃当前未确认的本地修改并读取实际已保存笔记；已保存笔记不会被删除。</p>
          <button type="button" autoFocus onClick={() => setDiscard(false)}>
            保留当前输入
          </button>
          <button
            type="button"
            disabled={readOnly || state.loading || state.saving}
            onClick={() => {
              setDiscard(false)
              void controller.load(true)
            }}
          >
            放弃本地修改并重新读取
          </button>
        </div>
      )}
      {state.note?.updatedAt && (
        <p className="muted">最近保存：{new Date(state.note.updatedAt).toLocaleString('zh-CN')}</p>
      )}
    </details>
  )
}
export function PersonalNote({
  identity,
  readOnly = false,
}: {
  identity: QuestionIdentity
  readOnly?: boolean
}) {
  return <NoteEditor key={questionIdentityKey(identity)} identity={identity} readOnly={readOnly} />
}
