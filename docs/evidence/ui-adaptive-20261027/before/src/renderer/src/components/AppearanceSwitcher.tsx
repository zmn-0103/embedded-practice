import { useEffect, useState } from 'react'
import type { AppearanceSettings } from '../../../shared/contracts/settings'
import type { ThemeCatalog } from '../../../shared/contracts/themes'

export function AppearanceSwitcher({
  value,
  catalog,
  disabled,
  onSave,
}: {
  value: AppearanceSettings
  catalog: ThemeCatalog
  disabled: boolean
  onSave: (settings: AppearanceSettings) => Promise<boolean>
}) {
  const [themeId, setThemeId] = useState(value.themeId)
  useEffect(() => setThemeId(value.themeId), [value.themeId])
  return (
    <details className="quick-appearance">
      <summary>外观</summary>
      <div className="quick-appearance-panel">
        <label>
          切换主题
          <select
            aria-label="快捷主题选择"
            value={themeId}
            disabled={disabled}
            onChange={(event) => setThemeId(event.currentTarget.value)}
          >
            {!catalog.entries.some((entry) => entry.definition.id === themeId) && (
              <option value={themeId}>原主题不可用</option>
            )}
            {catalog.entries.map(({ definition }) => (
              <option value={definition.id} key={definition.id}>
                {definition.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={disabled || !catalog.entries.some((entry) => entry.definition.id === themeId)}
          onClick={() => void onSave({ ...value, themeId })}
        >
          应用所选主题
        </button>
        <p className="muted">明暗、字号和主题安装请在设置中调整。练习与输入保留。</p>
      </div>
    </details>
  )
}
