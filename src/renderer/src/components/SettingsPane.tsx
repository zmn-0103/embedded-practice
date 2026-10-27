import { useEffect, useRef, useState } from 'react'
import type { AppearanceSettings } from '../../../shared/contracts/settings'
import { BackupPanel } from './BackupPanel'
import { DataLocationsPanel } from './DataLocationsPanel'
import { DEFAULT_THEME_ID, type ThemeCatalog } from '../../../shared/contracts/themes'
import { ThemeManager } from './ThemeManager'
import { ThemePreview, themePreviewStyle } from './ThemePreview'

export function SettingsPane({
  value,
  busy,
  error,
  onSave,
  onReload,
  dataBusy,
  onDataBusyChange,
  catalog,
  onThemesChanged,
  onDataOperation,
}: {
  value: AppearanceSettings | undefined
  busy: boolean
  error: string
  onSave: (settings: AppearanceSettings) => Promise<boolean>
  onReload: () => void
  dataBusy: boolean
  onDataBusyChange: (busy: boolean) => void
  catalog: ThemeCatalog | undefined
  onThemesChanged: (catalog: ThemeCatalog) => Promise<boolean>
  onDataOperation: (operation: Promise<boolean>) => void
}) {
  const [theme, setTheme] = useState<AppearanceSettings['theme']>('system')
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID)
  const [fontSize, setFontSize] = useState(17)
  const [notice, setNotice] = useState('')
  const [section, setSection] = useState('appearance-section')
  const navigation = useRef<HTMLElement>(null)
  useEffect(() => {
    if (value) {
      setTheme(value.theme)
      setThemeId(value.themeId)
      setFontSize(value.fontSize)
    }
  }, [value?.theme, value?.themeId, value?.fontSize])
  const selected = catalog?.entries.find((entry) => entry.definition.id === themeId)?.definition
  const unapplied = Boolean(
    value && (theme !== value.theme || themeId !== value.themeId || fontSize !== value.fontSize),
  )
  return (
    <section className="settings-pane" aria-label="设置与数据">
      <h2>设置与数据</h2>
      <nav ref={navigation} className="settings-sections" aria-label="设置分区">
        <div
          role="tablist"
          aria-label="设置分区"
          onKeyDown={(event) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
            event.preventDefault()
            const tabs = [
              ...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
            ]
            const index = tabs.indexOf(document.activeElement as HTMLButtonElement)
            const next =
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? tabs.length - 1
                  : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
            tabs[next]?.click()
            tabs[next]?.focus({ preventScroll: true })
          }}
        >
          {(
            [
              ['appearance-section', '外观主题'],
              ['backup-section', '备份恢复'],
              ['data-location-section', '数据位置'],
            ] as const
          ).map(([id, label]) => (
            <button
              type="button"
              key={id}
              id={`${id}-tab`}
              role="tab"
              aria-selected={section === id}
              aria-controls={`${id}-panel`}
              tabIndex={section === id ? 0 : -1}
              disabled={busy || dataBusy}
              onClick={() => {
                setSection(id)
                navigation.current?.scrollIntoView({ block: 'start' })
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>
      <section
        id="appearance-section-panel"
        role="tabpanel"
        aria-labelledby="appearance-section-tab"
        hidden={section !== 'appearance-section'}
      >
        {error && (
          <div role="alert" className="error-message">
            <p>{error}</p>
            {(!value || !catalog) && (
              <button type="button" disabled={busy} onClick={onReload}>
                重试读取显示设置
              </button>
            )}
          </div>
        )}
        {!value || !catalog ? (
          <p>{busy ? '正在读取显示设置…' : '尚未读取到已保存的显示设置。'}</p>
        ) : (
          <form
            className="appearance-form"
            data-preview-mode={theme}
            onSubmit={(event) => {
              event.preventDefault()
              if (busy || dataBusy) return
              setNotice('')
              if (!selected) return
              void onSave({ ...value, theme, themeId, fontSize }).then((saved) => {
                if (saved) setNotice('显示设置已保存。')
              })
            }}
          >
            <p className="appearance-apply-status" role="status" data-pending={unapplied}>
              {busy
                ? '正在处理外观设置，请稍候…'
                : !selected
                  ? '所选主题不可用，请重新选择后保存并应用。'
                  : error
                    ? '外观应用未确认，请重试保存并应用。'
                    : unapplied
                      ? '外观选择尚未应用，点击“保存并应用”后生效。'
                      : '当前外观已应用；修改选择后需保存并应用。'}
            </p>
            <fieldset className="appearance-controls" disabled={busy || dataBusy}>
              <legend className="visually-hidden">外观与显示</legend>
              <div className="appearance-layout">
                <div className="appearance-options">
                  <fieldset className="palette-options">
                    <legend>选择主题</legend>
                    <div className="theme-grid">
                      {catalog.entries.map(({ definition: choice, builtIn }) => (
                        <label
                          className="theme-choice"
                          data-selected={themeId === choice.id}
                          key={choice.id}
                        >
                          <input
                            type="radio"
                            name="appearance-palette"
                            value={choice.id}
                            aria-label={choice.name}
                            checked={themeId === choice.id}
                            onChange={() => {
                              setThemeId(choice.id)
                              setNotice('')
                            }}
                          />
                          <span
                            className="theme-swatch"
                            data-theme={theme}
                            style={themePreviewStyle(choice)}
                            aria-hidden="true"
                          >
                            <span className="swatch-sidebar" />
                            <span className="swatch-content">
                              <span />
                              <span />
                              <span />
                            </span>
                          </span>
                          <span className="theme-name">{choice.name}</span>
                          <span className="theme-description">
                            {builtIn ? '内置' : '已安装'} · {choice.author} · {choice.version}
                            {value.themeId === choice.id ? ' · 当前使用' : ''}
                          </span>
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
                {selected ? (
                  <ThemePreview definition={selected} mode={theme} fontSize={fontSize} />
                ) : (
                  <p role="alert">已选择的主题缺失或损坏，请重新选择主题。</p>
                )}
              </div>
              <div className="appearance-save-row">
                <p className="muted">
                  保存并应用会使用当前预览；恢复默认外观会立即应用默认设置。学习数据保留。
                </p>
                <button type="submit" className="primary" disabled={!selected}>
                  {busy ? '正在保存显示设置…' : error ? '重试保存并应用' : '保存并应用'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const defaults = {
                      ...value,
                      themeId: DEFAULT_THEME_ID,
                      palette: 'forest' as const,
                      theme: 'system' as const,
                      fontSize: 17,
                      navigationCollapsed: false,
                      auxiliaryHidden: false,
                    }
                    setThemeId(defaults.themeId)
                    setTheme(defaults.theme)
                    setFontSize(defaults.fontSize)
                    setNotice('')
                    void onSave(defaults).then((saved) => {
                      if (saved) setNotice('已恢复默认显示设置，学习数据保持。')
                    })
                  }}
                >
                  恢复默认外观
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
        {value && catalog && (
          <ThemeManager
            catalog={catalog}
            currentThemeId={value.themeId}
            mode={theme}
            fontSize={fontSize}
            disabled={busy || dataBusy}
            onChanged={onThemesChanged}
            onBusyChange={onDataBusyChange}
            onOperation={onDataOperation}
          />
        )}
      </section>
      <div
        id="backup-section-panel"
        role="tabpanel"
        aria-labelledby="backup-section-tab"
        hidden={section !== 'backup-section'}
      >
        <BackupPanel disabled={busy || dataBusy} onBusyChange={onDataBusyChange} />
      </div>
      <div
        id="data-location-section-panel"
        role="tabpanel"
        aria-labelledby="data-location-section-tab"
        hidden={section !== 'data-location-section'}
      >
        <DataLocationsPanel disabled={busy || dataBusy} onBusyChange={onDataBusyChange} />
      </div>
    </section>
  )
}
