import type Database from 'better-sqlite3'
import { appearanceSchema, type AppearanceSettings } from '../../../shared/contracts/settings'

export function createSettingsRepository(database: Database.Database) {
  const read = database.prepare(
    'SELECT theme, palette, font_size AS fontSize FROM appearance_settings WHERE id = 1',
  )
  const update = database.prepare(`UPDATE appearance_settings
    SET theme = @theme, palette = @palette, font_size = @fontSize
    WHERE id = 1 RETURNING theme, palette, font_size AS fontSize`)
  const save = database.transaction((settings: AppearanceSettings) =>
    appearanceSchema.parse(update.get(settings)),
  )
  return {
    readSettings: () => appearanceSchema.parse(read.get()),
    saveSettings: (settings: AppearanceSettings) =>
      save.immediate(appearanceSchema.parse(settings)),
  }
}
