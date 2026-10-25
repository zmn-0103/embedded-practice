import type Database from 'better-sqlite3'
import { appearanceSchema, type AppearanceSettings } from '../../../shared/contracts/settings'
import { builtinTheme } from '../../../shared/themes'
import { createThemeRepository } from './theme-repository'

export function createSettingsRepository(database: Database.Database) {
  const read = database.prepare(
    `SELECT theme, palette, font_size AS fontSize, theme_id AS themeId,
      navigation_collapsed AS navigationCollapsed, auxiliary_hidden AS auxiliaryHidden
      FROM appearance_settings WHERE id = 1`,
  )
  const themes = createThemeRepository(database)
  const update = database.prepare(`UPDATE appearance_settings
    SET theme = @theme, palette = @palette, font_size = @fontSize, theme_id = @themeId,
      navigation_collapsed = @navigationCollapsed, auxiliary_hidden = @auxiliaryHidden
    WHERE id = 1`)
  function readSettings(): AppearanceSettings {
    const row = read.get() as Record<string, unknown> | undefined
    if (
      !row ||
      ![0, 1].includes(row['navigationCollapsed'] as number) ||
      ![0, 1].includes(row['auxiliaryHidden'] as number)
    )
      throw new Error('显示设置或布局偏好损坏。')
    return appearanceSchema.parse({
      ...row,
      navigationCollapsed: row['navigationCollapsed'] === 1,
      auxiliaryHidden: row['auxiliaryHidden'] === 1,
    })
  }
  const save = database.transaction((settings: AppearanceSettings) => {
    if (
      !builtinTheme(settings.themeId) &&
      !themes.listThemes().entries.some((entry) => entry.definition.id === settings.themeId)
    )
      throw new Error('所选主题缺失或损坏，请重新选择已安装主题。')
    const legacy = settings.themeId.startsWith('builtin.')
      ? settings.themeId.slice('builtin.'.length)
      : ''
    update.run({
      ...settings,
      palette: ['forest', 'ocean', 'sand', 'lilac'].includes(legacy)
        ? legacy
        : readSettings().palette,
      navigationCollapsed: Number(settings.navigationCollapsed),
      auxiliaryHidden: Number(settings.auxiliaryHidden),
    })
    return readSettings()
  })
  return {
    readSettings,
    saveSettings: (settings: AppearanceSettings) =>
      save.immediate(appearanceSchema.parse(settings)),
  }
}
