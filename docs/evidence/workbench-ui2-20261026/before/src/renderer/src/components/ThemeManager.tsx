import { useRef, useState } from 'react'
import type { AppearanceSettings } from '../../../shared/contracts/settings'
import type { ThemeCatalog, ThemePreview as Preview } from '../../../shared/contracts/themes'
import { ThemePreview } from './ThemePreview'

type Mutation = { kind: 'install'; token: string } | { kind: 'uninstall'; themeId: string }

export function ThemeManager({
  catalog,
  disabled,
  currentThemeId,
  mode,
  fontSize,
  onChanged,
  onBusyChange,
  onOperation,
}: {
  catalog: ThemeCatalog
  disabled: boolean
  currentThemeId: string
  mode: AppearanceSettings['theme']
  fontSize: number
  onChanged: (catalog: ThemeCatalog) => Promise<boolean>
  onBusyChange: (busy: boolean) => void
  onOperation: (operation: Promise<boolean>) => void
}) {
  const running = useRef(false)
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<Preview>()
  const [removing, setRemoving] = useState<string>()
  const [pending, setPending] = useState<Mutation>()
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  function begin() {
    running.current = true
    setBusy(true)
    onBusyChange(true)
    setMessage('')
    setFailed(false)
  }
  function finish() {
    running.current = false
    setBusy(false)
    onBusyChange(false)
  }
  async function selectFile() {
    if (disabled || running.current || pending) return
    begin()
    setPreview(undefined)
    setRemoving(undefined)
    try {
      const result = await window.desktop.themes.preview()
      if (result.ok) setPreview(result.value)
      else {
        setMessage(result.error.message)
        setFailed(result.error.code !== 'CANCELLED')
      }
    } catch {
      setMessage('主题预检失败，请重新选择文件。')
      setFailed(true)
    } finally {
      finish()
    }
  }
  function mutate(command: Mutation) {
    if (disabled || running.current) return
    begin()
    setPending(command)
    const job = (async (): Promise<boolean> => {
      try {
        const result =
          command.kind === 'install'
            ? await window.desktop.themes.install({ token: command.token })
            : await window.desktop.themes.uninstall({ themeId: command.themeId })
        if (!result.ok) {
          setMessage(result.error.message)
          setFailed(true)
          // 过期凭据不能重试，必须重新读取文件。
          if (result.error.code === 'PREVIEW_EXPIRED') {
            setPreview(undefined)
            setPending(undefined)
          }
          return false
        }
        if (!(await onChanged(result.value))) throw new Error('显示核对失败')
        setPending(undefined)
        setPreview(undefined)
        setRemoving(undefined)
        setMessage(
          command.kind === 'install'
            ? '主题已安装并核对。请选择主题后保存并应用；安装不会自动改变当前外观。'
            : '主题已卸载并核对。当前主题被卸载时已切换到松间绿。',
        )
        return true
      } catch {
        setMessage('主题操作结果尚未确认。保留了本次请求，请重试原操作以核对结果。')
        setFailed(true)
        return false
      } finally {
        finish()
      }
    })()
    onOperation(job)
  }
  const locked = disabled || busy
  return (
    <section className="theme-manager" aria-label="本地主题管理">
      <div className="theme-manager-heading">
        <div>
          <h3>安装更多主题</h3>
          <p className="muted">
            离线导入 .ep-theme.json，每包最多 256 KiB，最多保留 100 个外部主题。
          </p>
        </div>
        <button type="button" disabled={locked || !!pending} onClick={() => void selectFile()}>
          安装本地主题…
        </button>
      </div>
      {message && (
        <p
          role={failed ? 'alert' : 'status'}
          className={failed ? 'error-message' : 'operation-message'}
        >
          {message}
        </p>
      )}
      {pending && failed && (
        <button type="button" disabled={locked} onClick={() => mutate(pending)}>
          重试原主题操作
        </button>
      )}
      {preview && (
        <div className="theme-import-preview" aria-label="主题安装预览">
          <h4>{preview.definition.name}</h4>
          <p className="muted">
            {preview.definition.author} · {preview.definition.version} ·{' '}
            {preview.definition.license}
          </p>
          <p>{preview.definition.description}</p>
          <p>
            {preview.action === 'update'
              ? `更新版本：${preview.previousVersion} → ${preview.definition.version}`
              : preview.action === 'installed'
                ? '同一版本与内容已经安装。'
                : '此主题尚未安装。'}
          </p>
          <ThemePreview
            definition={preview.definition}
            mode={mode}
            fontSize={fontSize}
            label="待安装主题局部预览"
          />
          <div className="button-row">
            <button
              type="button"
              className="primary"
              disabled={locked || !!pending}
              onClick={() => mutate({ kind: 'install', token: preview.token })}
            >
              {preview.action === 'update'
                ? '确认更新主题'
                : preview.action === 'installed'
                  ? '核对已安装主题'
                  : '确认安装主题'}
            </button>
            <button
              type="button"
              disabled={locked || !!pending}
              onClick={() => setPreview(undefined)}
            >
              取消安装预览
            </button>
          </div>
        </div>
      )}
      <ul className="installed-theme-actions">
        {catalog.entries
          .filter((entry) => !entry.builtIn)
          .map(({ definition }) => (
            <li key={definition.id}>
              <span>
                {definition.name} · {definition.version}
              </span>
              <button
                type="button"
                disabled={locked || !!pending}
                onClick={() => setRemoving(definition.id)}
              >
                卸载 {definition.name}
              </button>
            </li>
          ))}
        {catalog.issues.map((issue) => (
          <li key={issue.id}>
            <span role="alert">
              {issue.id}：{issue.message}
            </span>
            <button
              type="button"
              disabled={locked || !!pending}
              onClick={() => setRemoving(issue.id)}
            >
              卸载损坏主题 {issue.id}
            </button>
          </li>
        ))}
      </ul>
      {removing && (
        <div className="theme-remove-confirm" role="alert">
          <p>
            确认卸载此主题？
            {removing === currentThemeId
              ? '这是当前主题，卸载后将切换到内置松间绿。'
              : '已保存的当前外观保持。'}
          </p>
          <div className="button-row">
            <button
              type="button"
              disabled={locked || !!pending}
              onClick={() => mutate({ kind: 'uninstall', themeId: removing })}
            >
              确认卸载主题
            </button>
            <button
              type="button"
              disabled={locked || !!pending}
              onClick={() => setRemoving(undefined)}
            >
              取消卸载
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
