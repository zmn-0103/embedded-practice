import { useEffect, useId, useRef, useState } from 'react'
import type { CategoryChange, LibraryNavigation } from '../../../shared/contracts/categories'

interface Props extends LibraryNavigation {
  disabled?: boolean
  onChanged: () => void
  onBusyChange?: ((busy: boolean) => void) | undefined
  onOperation?: ((work: Promise<boolean>) => void) | undefined
}

export function CategoryManager({
  categories,
  topics,
  disabled = false,
  onChanged,
  onBusyChange,
  onOperation,
}: Props) {
  const [newTitle, setNewTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [title, setTitle] = useState('')
  const [topicId, setTopicId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<LibraryNavigation['categories'][number]>()
  const [operation, setOperation] = useState<'create' | 'rename' | 'assign'>()
  const running = useRef(false)
  const mounted = useRef(false)
  const panel = useRef<HTMLDetailsElement>(null)
  const dialogTitle = useId()
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  function perform(change: CategoryChange) {
    if (disabled || running.current) return
    running.current = true
    setBusy(true)
    setError('')
    setMessage('')
    onBusyChange?.(true)
    const job = (async () => {
      try {
        const result = await window.desktop.library.updateCategory(change)
        if (!result.ok) {
          if (mounted.current) setError(result.error.message)
          return false
        }
        if (mounted.current) {
          if (change.kind === 'create') setNewTitle('')
          if (change.kind === 'rename') setTitle(change.title.trim())
          if (change.kind === 'delete') setCategoryId('')
          setMessage(change.kind === 'delete' ? '分类已移除，专题保留为未分类。' : '分类已保存。')
        }
        return true
      } catch {
        if (mounted.current) setError('本次分类变更尚未确认，请重新读取后核对，或按相同目标重试。')
        return false
      } finally {
        running.current = false
        if (mounted.current) setBusy(false)
        // 只发送失效信号；即使响应丢失，也按当前范围重新读取实际归属。
        onChanged()
        onBusyChange?.(false)
      }
    })()
    onOperation?.(job)
  }
  const selected = categories.find((item) => item.categoryId === categoryId)
  const currentTopic = topics.find((item) => item.topicId === topicId)
  const currentTitle = categories.find(
    (item) => item.categoryId === currentTopic?.categoryId,
  )?.title
  const missingTarget = targetId !== '' && !categories.some((item) => item.categoryId === targetId)
  return (
    <details
      ref={panel}
      className="category-manager"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !busy && !deleting) {
          event.preventDefault()
          event.currentTarget.open = false
          event.currentTarget.querySelector('summary')?.focus({ preventScroll: true })
        }
      }}
    >
      <summary>管理分类</summary>
      <button
        className="category-close"
        type="button"
        disabled={busy || Boolean(deleting)}
        onClick={() => {
          if (panel.current) {
            panel.current.open = false
            panel.current.querySelector('summary')?.focus({ preventScroll: true })
          }
        }}
      >
        关闭分类管理
      </button>
      <p className="muted">移动专题或移除分类会保留题目和已有练习；归属不随题库重导入清空。</p>
      <div className="category-overview" aria-label="现有分类与专题归属">
        {[...categories, { categoryId: '', title: '未分类' }].map((category) => {
          const members = topics.filter((topic) => (topic.categoryId ?? '') === category.categoryId)
          return (
            <details key={category.categoryId}>
              <summary>
                {category.title} · {members.length} 个专题
              </summary>
              {members.length ? (
                <ul>
                  {members.map((topic) => (
                    <li key={topic.topicId}>
                      {topic.title} · {topic.activeCount} 题
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">暂无专题</p>
              )}
            </details>
          )
        })}
      </div>
      <div className="button-row" aria-label="分类管理操作">
        {(
          [
            ['create', '新增分类'],
            ['rename', '修改或移除分类'],
            ['assign', '调整专题归属'],
          ] as const
        ).map(([kind, label]) => (
          <button
            type="button"
            key={kind}
            disabled={disabled || busy || Boolean(deleting)}
            aria-expanded={operation === kind}
            onClick={() => setOperation(operation === kind ? undefined : kind)}
          >
            {label}
          </button>
        ))}
      </div>
      <fieldset hidden={operation !== 'create'} disabled={disabled || busy || Boolean(deleting)}>
        <legend>添加分类</legend>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            perform({ kind: 'create', title: newTitle })
          }}
        >
          <label>
            新分类名称
            <input
              aria-label="新分类名称"
              value={newTitle}
              maxLength={60}
              required
              onChange={(event) => setNewTitle(event.currentTarget.value)}
            />
          </label>
          <button type="submit" disabled={!newTitle.trim()}>
            添加分类
          </button>
        </form>
        <p className="muted">名称最长60字符；“未分类”和“全部分类”用于系统范围。</p>
      </fieldset>
      <fieldset hidden={operation !== 'rename'} disabled={disabled || busy || Boolean(deleting)}>
        <legend>修改分类</legend>
        <label>
          要修改的分类
          <select
            aria-label="要修改的分类"
            value={categoryId}
            onChange={(event) => {
              const id = event.currentTarget.value
              setCategoryId(id)
              setTitle(categories.find((item) => item.categoryId === id)?.title ?? '')
            }}
          >
            <option value="">请选择分类</option>
            {categoryId && !selected && (
              <option value={categoryId} disabled>
                已移除的分类
              </option>
            )}
            {categories.map((item) => (
              <option key={item.categoryId} value={item.categoryId}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (selected) perform({ kind: 'rename', categoryId, title })
          }}
        >
          <label>
            分类新名称
            <input
              aria-label="分类新名称"
              value={title}
              required
              maxLength={60}
              onChange={(event) => setTitle(event.currentTarget.value)}
            />
          </label>
          <button type="submit" disabled={!selected || !title.trim()}>
            保存分类名称
          </button>
        </form>
        <button type="button" disabled={!selected} onClick={() => setDeleting(selected)}>
          移除分类
        </button>
      </fieldset>
      <fieldset hidden={operation !== 'assign'} disabled={disabled || busy || Boolean(deleting)}>
        <legend>专题归属</legend>
        <label>
          调整归属的专题
          <select
            aria-label="调整归属的专题"
            value={topicId}
            onChange={(event) => {
              const id = event.currentTarget.value
              setTopicId(id)
              setTargetId(topics.find((item) => item.topicId === id)?.categoryId ?? '')
            }}
          >
            <option value="">请选择专题</option>
            {topics.map((item) => (
              <option key={item.topicId} value={item.topicId}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        {currentTopic && (
          <p className="muted">
            当前归属：{currentTitle ?? '未分类'} → 将调整为：
            {categories.find((category) => category.categoryId === targetId)?.title ??
              (missingTarget ? '已移除的分类' : '未分类')}
          </p>
        )}
        <label>
          归入分类
          <select
            aria-label="归入分类"
            value={targetId}
            onChange={(event) => setTargetId(event.currentTarget.value)}
          >
            <option value="">未分类</option>
            {missingTarget && (
              <option value={targetId} disabled>
                已移除的分类
              </option>
            )}
            {categories.map((item) => (
              <option key={item.categoryId} value={item.categoryId}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={!currentTopic || missingTarget}
          onClick={() => perform({ kind: 'assign', topicId, categoryId: targetId || null })}
        >
          保存专题归属
        </button>
      </fieldset>
      {deleting && (
        <div className="category-confirmation" role="alertdialog" aria-labelledby={dialogTitle}>
          <h3 id={dialogTitle}>移除“{deleting.title}”？</h3>
          <p>其中专题会保留并移到未分类，题目和已有练习记录不会删除。</p>
          <div className="button-row">
            <button type="button" autoFocus onClick={() => setDeleting(undefined)}>
              取消移除
            </button>
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => {
                const target = deleting
                setDeleting(undefined)
                perform({ kind: 'delete', categoryId: target.categoryId })
              }}
            >
              确认移除分类
            </button>
          </div>
        </div>
      )}
      {busy && <p aria-live="polite">正在保存分类…</p>}
      {message && <p aria-live="polite">{message}</p>}
      {error && (
        <div role="alert" className="error-message">
          <p>{error}</p>
          <button type="button" disabled={busy || disabled} onClick={onChanged}>
            重新读取分类
          </button>
        </div>
      )}
    </details>
  )
}
