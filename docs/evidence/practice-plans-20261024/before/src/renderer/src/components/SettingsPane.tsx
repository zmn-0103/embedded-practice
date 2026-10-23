import { useEffect, useState } from 'react'
import type { AppearanceSettings } from '../../../shared/contracts/settings'
import { BackupPanel } from './BackupPanel'
import { DataLocationsPanel } from './DataLocationsPanel'

const palettes = [
  { id: 'forest', name: '松间绿', description: '自然清爽，沉静专注' },
  { id: 'ocean', name: '晴空蓝', description: '清晰冷静，轻盈通透' },
  { id: 'sand', name: '暖沙金', description: '温暖柔和，纸页质感' },
  { id: 'lilac', name: '暮山紫', description: '低饱和紫，柔和舒展' },
] as const

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
  const [palette, setPalette] = useState<AppearanceSettings['palette']>('forest')
  const [fontSize, setFontSize] = useState(17)
  const [notice, setNotice] = useState('')
  useEffect(() => {
    if (value) {
      setTheme(value.theme)
      setPalette(value.palette)
      setFontSize(value.fontSize)
    }
  }, [value])
  return (
    <section className="settings-pane" aria-label="设置与数据">
      <h2>设置与数据</h2>
      <p className="page-description">选一套喜欢的配色，让每一次阅读都舒服一些。</p>
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
          className="appearance-form"
          data-preview-mode={theme}
          onSubmit={(event) => {
            event.preventDefault()
            if (busy || dataBusy) return
            setNotice('')
            void onSave({ theme, palette, fontSize }).then((saved) => {
              if (saved) setNotice('显示设置已保存。')
            })
          }}
        >
          <fieldset className="appearance-controls" disabled={busy || dataBusy}>
            <legend>显示设置</legend>
            <div className="appearance-layout">
              <div className="appearance-options">
                <fieldset className="palette-options">
                  <legend>配色主题</legend>
                  <div className="theme-grid">
                    {palettes.map((choice) => (
                      <label
                        className="theme-choice"
                        data-selected={palette === choice.id}
                        key={choice.id}
                      >
                        <input
                          type="radio"
                          name="appearance-palette"
                          value={choice.id}
                          aria-label={choice.name}
                          checked={palette === choice.id}
                          onChange={() => {
                            setPalette(choice.id)
                            setNotice('')
                          }}
                        />
                        <span className="theme-swatch" data-palette={choice.id} aria-hidden="true">
                          <span className="swatch-sidebar" />
                          <span className="swatch-content">
                            <span />
                            <span />
                            <span />
                          </span>
                        </span>
                        <span className="theme-name">{choice.name}</span>
                        <span className="theme-description">{choice.description}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="appearance-fields">
                  <label>
                    明暗模式
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
                </div>
              </div>
              <aside
                className="appearance-preview"
                data-palette={palette}
                data-theme={theme}
                aria-label="显示设置局部预览"
                style={{ fontSize: `${fontSize}px` }}
              >
                <span className="preview-label">阅读预览</span>
                <h3>把思考留在题目旁</h3>
                <p>先回忆原理，再对照参考答案。清晰的文字与留白，让注意力回到内容。</p>
                <pre>
                  <code>{'uint8_t received = 0;\n// 记录你的理解'}</code>
                </pre>
                <span className="preview-action" aria-hidden="true">
                  查看参考答案
                </span>
              </aside>
            </div>
            <div className="appearance-save-row">
              <p className="muted">预览仅在此处显示，保存后应用到所有页面，重开后保留。</p>
              <button type="submit" className="primary">
                {busy ? '正在保存显示设置…' : error ? '重试保存显示设置' : '保存显示设置'}
              </button>
            </div>
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
