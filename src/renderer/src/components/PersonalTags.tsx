import { useEffect, useRef, useState } from 'react'
import type { QuestionIdentity } from '../../../shared/contracts/library-desktop'
import type { PersonalTag, PersonalTagChange } from '../../../shared/contracts/personal-tags'
import { useNoteSaves } from '../note-saves'

export function PersonalTags({
  items,
  refresh,
  disabled,
  onChanged,
  onBlocked,
  onOperation,
}: {
  items: QuestionIdentity[]
  refresh: number
  disabled: boolean
  onChanged: () => void
  onBlocked: (value: boolean) => void
  onOperation: (work: Promise<boolean>) => void
}) {
  const notes = useNoteSaves()
  const [tags, setTags] = useState<PersonalTag[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [name, setName] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [readError, setReadError] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState<PersonalTagChange>()
  const [deleting, setDeleting] = useState<PersonalTag>()
  const mounted = useRef(false)
  const running = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  useEffect(() => {
    let current = true
    setLoading(true)
    setReadError('')
    void window.desktop.personalTags
      .list()
      .then((result) => {
        if (!current) return
        if (result.ok) setTags(result.value)
        else setReadError(result.error.message)
      })
      .catch(() => {
        if (current) setReadError('无法读取个人标签，请重试。')
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [refresh, attempt])
  function release() {
    setPending(undefined)
    onBlocked(false)
  }
  function perform(input: PersonalTagChange) {
    if (running.current) return
    const command = pending ?? structuredClone(input)
    running.current = true
    setBusy(true)
    setPending(command)
    setError('')
    setMessage('')
    onBlocked(true)
    const job = (async () => {
      try {
        if (!(await notes.flush())) {
          setError('笔记尚未保存，个人标签未作更改。请先处理笔记保存。')
          release()
          return false
        }
        const result = await window.desktop.personalTags.change(command)
        if (!mounted.current) return false
        if (!result.ok) {
          setError(result.error.message)
          if (result.error.code !== 'DATABASE_UNAVAILABLE') release()
          return false
        }
        if (command.kind === 'save') {
          // 创建成功后清空输入；否则再次点击会以新 UUID 重复创建同名标签。
          // 不在此处选中新标签：列表尚未刷新时会被误显示为“标签已删除”。
          setName('')
        }
        setMessage(
          command.kind === 'assign'
            ? `已为明确勾选的${command.items.length}题${command.present ? '添加' : '移除'}个人标签。`
            : command.kind === 'delete'
              ? '个人标签已删除，题目和笔记保留；引用该标签的方案需重新选条件。'
              : '个人标签已保存。',
        )
        onChanged()
        release()
        setAttempt((value) => value + 1)
        return true
      } catch {
        if (mounted.current) setError('个人标签操作结果尚未确认，请重试原操作或停止重试后核对。')
        return false
      } finally {
        running.current = false
        if (mounted.current) setBusy(false)
      }
    })()
    onOperation(job)
  }
  const selected = tags.find((tag) => tag.tagId === selectedId)
  const locked = disabled || busy || loading || Boolean(readError) || Boolean(pending)
  return (
    <details className="personal-tags-panel">
      <summary>个人标签（{tags.length}）</summary>
      <p className="muted">个人标签独立保存，重新导入不会覆盖。先在题库勾选，再批量添加或移除。</p>
      <fieldset disabled={locked || Boolean(deleting)}>
        <legend>创建和整理个人标签</legend>
        <label>
          个人标签名称
          <input
            aria-label="个人标签名称"
            maxLength={60}
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
          />
        </label>
        <div className="button-row">
          <button
            type="button"
            disabled={!name.trim()}
            onClick={() => perform({ kind: 'save', tagId: crypto.randomUUID(), name: name.trim() })}
          >
            创建个人标签
          </button>
          <button
            type="button"
            disabled={!selected || !name.trim()}
            onClick={() =>
              selected &&
              perform({
                kind: 'rename',
                tagId: selected.tagId,
                name: name.trim(),
                expectedName: selected.name,
              })
            }
          >
            重命名个人标签
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={() => selected && setDeleting(structuredClone(selected))}
          >
            删除个人标签…
          </button>
        </div>
        <label>
          操作的个人标签
          <select
            aria-label="操作的个人标签"
            value={selectedId}
            onChange={(event) => {
              setSelectedId(event.currentTarget.value)
              setName(tags.find((tag) => tag.tagId === event.currentTarget.value)?.name ?? '')
            }}
          >
            <option value="">请选择个人标签</option>
            {selectedId && !selected && (
              <option value={selectedId} disabled>
                标签已删除
              </option>
            )}
            {tags.map((tag) => (
              <option key={tag.tagId} value={tag.tagId}>
                {tag.name}
              </option>
            ))}
          </select>
        </label>
        <p>
          本次作用于全部明确勾选的 {items.length}{' '}
          题，包含其他专题、筛选和页的勾选；不会修改未勾选题目。
        </p>
        <div className="button-row">
          <button
            type="button"
            disabled={!selected || !items.length}
            onClick={() =>
              selected &&
              perform({
                kind: 'assign',
                tagId: selected.tagId,
                present: true,
                items: structuredClone(items),
              })
            }
          >
            为勾选题目添加个人标签
          </button>
          <button
            type="button"
            disabled={!selected || !items.length}
            onClick={() =>
              selected &&
              perform({
                kind: 'assign',
                tagId: selected.tagId,
                present: false,
                items: structuredClone(items),
              })
            }
          >
            从勾选题目移除个人标签
          </button>
        </div>
      </fieldset>
      {deleting && (
        <div role="alertdialog" aria-label="确认删除个人标签">
          <p>
            删除“{deleting.name}
            ”及其全部题目关联。题目、笔记和历史保留；引用它的方案将显示标签失效。
          </p>
          <button type="button" disabled={locked} onClick={() => setDeleting(undefined)}>
            取消删除个人标签
          </button>
          <button
            type="button"
            disabled={locked}
            onClick={() => {
              perform({ kind: 'delete', tagId: deleting.tagId, expectedName: deleting.name })
              setDeleting(undefined)
            }}
          >
            确认删除个人标签
          </button>
        </div>
      )}
      {loading && <p role="status">正在读取个人标签…</p>}
      {readError && (
        <div role="alert">
          {readError}
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => setAttempt((value) => value + 1)}
          >
            重新读取个人标签
          </button>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      {pending && !busy && (
        <div>
          <button type="button" disabled={disabled} onClick={() => perform(pending)}>
            重试原标签操作
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              release()
              setError('')
              setMessage('已停止重试，请核对标签与题目实际状态。')
              onChanged()
              setAttempt((value) => value + 1)
            }}
          >
            停止标签重试并核对
          </button>
        </div>
      )}
      {message && <p role="status">{message}</p>}
    </details>
  )
}
