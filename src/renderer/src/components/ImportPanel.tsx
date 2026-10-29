import { useEffect, useRef, useState } from 'react'
import type { DesktopError } from '../../../shared/contracts/library-desktop'
import type { ImportCounts, ImportPreview } from '../../../shared/contracts/library-import'

const labels = [
  ['added', '新增'],
  ['updated', '内容更新'],
  ['metadata', '仅信息变更'],
  ['unchanged', '不变'],
  ['archived', '将归档'],
  ['restored', '恢复'],
] as const satisfies readonly (readonly [keyof ImportCounts, string])[]

export function ImportPanel({
  enabled,
  onCommitted,
  action,
}: {
  enabled: boolean
  onCommitted: () => void
  action?: { id: number; kind: 'import' | 'template' } | undefined
}) {
  const [mode, setMode] = useState('idle')
  const lock = useRef(false)
  const [preview, setPreview] = useState<ImportPreview>()
  const [error, setError] = useState<DesktopError>()
  const [notice, setNotice] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [open, setOpen] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const appliedAction = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.show()
    if (!open && dialog.current?.open) dialog.current.close()
  }, [open])
  useEffect(() => {
    if (!action || !enabled || appliedAction.current === action.id) return
    appliedAction.current = action.id
    if (action.kind === 'import') prepare()
    else exportTemplate()
  }, [action, enabled])
  async function run(nextMode: string, work: () => Promise<void>) {
    if (lock.current) return
    lock.current = true
    setMode(nextMode)
    setError(undefined)
    setNotice('')
    try {
      await work()
    } catch {
      setError({
        code: 'DATABASE_UNAVAILABLE',
        message:
          nextMode === 'committing'
            ? '提交结果尚未确认，请重试确认；服务会核对原提交结果。'
            : '无法连接本地服务，请重试或重新启动程序。',
      })
    } finally {
      lock.current = false
      setMode('idle')
      setCancelling(false)
    }
  }
  function prepare() {
    setOpen(true)
    void run('preparing', async () => {
      setPreview(undefined)
      const result = await window.desktop.library.previewImport()
      if (result.ok) setPreview(result.value)
      else if (result.error.code === 'IMPORT_CANCELLED') setNotice('已取消本次导入。')
      else setError(result.error)
    })
  }
  function exportTemplate() {
    setOpen(true)
    void run('exporting', async () => {
      const result = await window.desktop.library.exportTemplate()
      if (result.ok) setNotice('题库模板已导出，请在程序外填写后导入。')
      else if (result.error.code === 'IMPORT_CANCELLED') setNotice('已取消模板导出。')
      else setError(result.error)
    })
  }
  function closeWorkspace() {
    if (lock.current) return
    if (!preview) {
      setOpen(false)
      return
    }
    void run('discarding', async () => {
      const result = await window.desktop.library.discardImport(preview.token)
      if (!result.ok && result.error.code !== 'PREVIEW_EXPIRED') {
        setError(result.error)
        return
      }
      setPreview(undefined)
      setOpen(false)
    })
  }
  function commit() {
    if (!preview) return
    void run('committing', async () => {
      const result = await window.desktop.library.commitImport(preview.token)
      if (result.ok) {
        const counts = result.value.summary.counts
        setPreview(undefined)
        setNotice(
          `导入完成：新增 ${counts.added}，内容更新 ${counts.updated}，信息变更 ${counts.metadata}，不变 ${counts.unchanged}，归档 ${counts.archived}，恢复 ${counts.restored}。`,
        )
        onCommitted()
      } else {
        setError(result.error)
        if (result.error.code !== 'DATABASE_UNAVAILABLE' && result.error.code !== 'IMPORT_BUSY')
          setPreview(undefined)
      }
    })
  }
  const busy = mode !== 'idle'
  return (
    <section className="import-panel" aria-label="题库导入">
      <div className="library-toolbar">
        <strong>题库工具</strong>
        <div className="button-row">
          <button type="button" className="primary" disabled={!enabled || busy} onClick={prepare}>
            导入题库
          </button>
          <button type="button" disabled={busy} onClick={exportTemplate}>
            导出题库模板
          </button>
        </div>
      </div>
      <dialog
        ref={dialog}
        className="import-workspace"
        aria-labelledby="import-workspace-title"
        onCancel={(event) => {
          event.preventDefault()
          closeWorkspace()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            closeWorkspace()
          }
        }}
      >
        <div className="section-heading">
          <h2 id="import-workspace-title">导入与模板</h2>
          <button type="button" disabled={busy} onClick={closeWorkspace}>
            关闭导入工作区
          </button>
        </div>
        <ol className="import-steps" aria-label="导入步骤">
          {['选择文件', '检查预览', '确认导入'].map((label, index) => (
            <li
              key={label}
              aria-current={
                (mode === 'committing' || notice.startsWith('导入完成：') ? 2 : preview ? 1 : 0) ===
                index
                  ? 'step'
                  : undefined
              }
            >
              {index + 1}. {label}
            </li>
          ))}
        </ol>
        <p className="import-snapshot-warning">
          每个专题文件是完整快照；遗漏的现有题目将归档，题目及学习记录保留。未参与导入的专题不受影响。请持续核对本次将归档数量。
        </p>
        {mode === 'preparing' && (
          <div className="operation-message" aria-live="polite">
            <p>正在选择并检查题库文件与图片…</p>
            <button
              type="button"
              disabled={cancelling}
              onClick={() => {
                setCancelling(true)
                void window.desktop.library
                  .cancelImport()
                  .then((result) => {
                    if (!result.ok) setError(result.error)
                  })
                  .catch(() =>
                    setError({
                      code: 'DATABASE_UNAVAILABLE',
                      message: '取消请求失败，请等待准备结束或重启。',
                    }),
                  )
              }}
            >
              {cancelling ? '正在取消…' : '取消准备'}
            </button>
          </div>
        )}
        {mode === 'committing' && <p aria-live="polite">正在保存整批题库，请稍候…</p>}
        {mode === 'exporting' && <p aria-live="polite">请选择模板保存位置…</p>}
        {preview && (
          <section className="import-preview" aria-labelledby="preview-title">
            <h3 id="preview-title">导入预览</h3>
            <p>
              本次共 {preview.summary.topics.length}{' '}
              个专题。每个文件会更新对应专题的完整题目列表，请核对将归档的数量。
            </p>
            <dl className="count-grid">
              {labels.map(([key, label]) => (
                <div key={key} data-changed={preview.summary.counts[key] > 0} data-change={key}>
                  <dt>{label}</dt>
                  <dd>{preview.summary.counts[key]}</dd>
                </div>
              ))}
            </dl>
            <div className="table-scroll">
              <table aria-label="分专题变更摘要">
                <thead>
                  <tr>
                    <th>专题</th>
                    {labels.map(([key, label]) => (
                      <th key={key}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.summary.topics.map((topic) => (
                    <tr key={topic.topicId}>
                      <th scope="row">
                        {topic.topicTitle}
                        {topic.metadataChanged && <small>专题信息将更新</small>}
                      </th>
                      {labels.map(([key]) => (
                        <td key={key}>{topic.counts[key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted">
              预览将于 {new Date(preview.expiresAt).toLocaleTimeString()}{' '}
              到期。确认后保存本次已检查的内容。
            </p>
            <div className="button-row import-confirm-actions">
              <button type="button" className="primary" disabled={busy} onClick={commit}>
                {error?.code === 'DATABASE_UNAVAILABLE' ? '重试确认' : '确认导入'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void run('discarding', async () => {
                    const result = await window.desktop.library.discardImport(preview.token)
                    // 服务端预览未释放时保留本地预览，避免界面同时报错又宣称已关闭。
                    if (!result.ok && result.error.code !== 'PREVIEW_EXPIRED') {
                      setError(result.error)
                      return
                    }
                    setPreview(undefined)
                    setNotice('已关闭本次预览，可重新选择文件检查当前题库。')
                  })
                }
              >
                放弃预览
              </button>
            </div>
          </section>
        )}
        {error && (
          <div role="alert" className="error-message">
            <p>{error.message}</p>
            {error.issues && (
              <>
                <ul>
                  {error.issues.slice(0, 50).map((issue, index) => (
                    <li key={index}>
                      {issue.fileName} · 第 {issue.line} 行，第 {issue.column} 列：{issue.message}
                    </li>
                  ))}
                </ul>
                {error.issues.length > 50 && (
                  <p>共 {error.issues.length} 条错误，当前展示前 50 条。修正后请重新导入。</p>
                )}
              </>
            )}
          </div>
        )}
        {notice && (
          <p className="operation-message" aria-live="polite">
            {notice}
          </p>
        )}
      </dialog>
    </section>
  )
}
