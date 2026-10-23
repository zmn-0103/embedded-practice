import { useEffect, useState } from 'react'
import type { AppearanceSettings } from '../../../shared/contracts/settings'
import { BackupPanel } from './BackupPanel'
import { DataLocationsPanel } from './DataLocationsPanel'

export function SettingsPane({
  value,
  busy,
  error,
  onSave,
  onReload,
  dataBusy,
  onDataBusyChange,
}: {
  value: AppearanceSettings | undefined
  busy: boolean
  error: string
  onSave: (settings: AppearanceSettings) => Promise<boolean>
  onReload: () => void
  dataBusy: boolean
  onDataBusyChange: (busy: boolean) => void
}) {
  const [theme, setTheme] = useState<AppearanceSettings['theme']>('system')
  const [fontSize, setFontSize] = useState(17)
  const [notice, setNotice] = useState('')
  useEffect(() => {
    if (value) {
      setTheme(value.theme)
      setFontSize(value.fontSize)
    }
  }, [value])
  return (
    <section className="settings-pane" aria-label="设置与数据">
      <h2>设置与数据</h2>
      <p>调整阅读显示，保存后应用到所有页面，重新打开程序后保留。</p>
      {error && (
        <div role="alert" className="error-message">
          <p>{error}</p>
          {!value && (
            <button type="button" disabled={busy} onClick={onReload}>
              重试读取显示设置
            </button>
          )}
        </div>
      )}
      {!value ? (
        <p>{busy ? '正在读取显示设置…' : '尚未读取到已保存的显示设置。'}</p>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (busy || dataBusy) return
            setNotice('')
            void onSave({ theme, fontSize }).then((saved) => {
              if (saved) setNotice('显示设置已保存。')
            })
          }}
        >
          <fieldset disabled={busy || dataBusy}>
            <legend>显示设置</legend>
            <label>
              主题
              <select
                aria-label="显示主题"
                value={theme}
                onChange={(event) => {
                  setTheme(event.currentTarget.value as AppearanceSettings['theme'])
                  setNotice('')
                }}
              >
                <option value="system">跟随系统</option>
                <option value="light">明色</option>
                <option value="dark">暗色</option>
              </select>
            </label>
            <label>
              正文字号
              <select
                aria-label="正文字号"
                value={fontSize}
                onChange={(event) => {
                  setFontSize(Number(event.currentTarget.value))
                  setNotice('')
                }}
              >
                {[15, 16, 17, 18, 19, 20, 21, 22].map((size) => (
                  <option key={size} value={size}>
                    {size}px
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="primary">
              {busy ? '正在保存显示设置…' : error ? '重试保存显示设置' : '保存显示设置'}
            </button>
          </fieldset>
          {notice && (
            <p className="operation-message" aria-live="polite">
              {notice}
            </p>
          )}
        </form>
      )}
      <DataLocationsPanel disabled={busy || dataBusy} onBusyChange={onDataBusyChange} />
      <BackupPanel disabled={busy || dataBusy} onBusyChange={onDataBusyChange} />
    </section>
  )
}
