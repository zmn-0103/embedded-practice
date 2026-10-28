import { createHash } from 'node:crypto'
import type Database from 'better-sqlite3'
import {
  DEFAULT_THEME_ID,
  MAX_INSTALLED_THEMES,
  MAX_THEME_BYTES,
  compareThemeVersions,
  themeCatalogSchema,
  themeDefinitionSchema,
  themeIdSchema,
  type ThemeDefinition,
  type ThemeError,
  type ThemePreview,
} from '../../../shared/contracts/themes'
import { BUILTIN_THEMES } from '../../../shared/themes'

export class ThemeFault extends Error {
  constructor(
    readonly code: ThemeError['code'],
    message: string,
  ) {
    super(message)
    this.name = 'ThemeFault'
  }
}
interface ThemeRow {
  theme_id: string
  version: string
  config_json: string
  content_hash: string
}
const hash = (content: string) => createHash('sha256').update(content).digest('hex')

export function decodeThemeRow(row: ThemeRow): ThemeDefinition {
  if (
    Buffer.byteLength(row.config_json, 'utf8') > MAX_THEME_BYTES ||
    hash(row.config_json) !== row.content_hash
  )
    throw new Error('主题配置大小或哈希无效。')
  const definition = themeDefinitionSchema.parse(JSON.parse(row.config_json))
  if (
    definition.id !== row.theme_id ||
    definition.version !== row.version ||
    definition.id.startsWith('builtin.')
  )
    throw new Error('主题配置与索引不一致。')
  return definition
}

export function createThemeRepository(database: Database.Database) {
  const find = database.prepare(
    'SELECT theme_id, version, config_json, content_hash FROM installed_themes WHERE theme_id = ?',
  )
  function listThemes() {
    const rows = database
      .prepare(
        `SELECT theme_id, version, config_json, content_hash FROM installed_themes ORDER BY theme_id LIMIT ${MAX_INSTALLED_THEMES + 1}`,
      )
      .all() as ThemeRow[]
    if (rows.length > MAX_INSTALLED_THEMES) throw new Error('主题数量超过支持上限。')
    if (new Set(rows.map((row) => row.theme_id)).size !== rows.length)
      throw new Error('主题标识重复，数据库结构或备份无效。')
    const entries = BUILTIN_THEMES.map((definition) => ({ definition, builtIn: true }))
    const issues: { id: string; message: string }[] = []
    for (const row of rows) {
      // 无法读取表或非法标识属于数据错误，不伪装成正常的空主题列表。
      themeIdSchema.parse(row.theme_id)
      try {
        entries.push({ definition: decodeThemeRow(row), builtIn: false })
      } catch {
        issues.push({ id: row.theme_id, message: '主题配置损坏，已暂时停用。请卸载后重新安装。' })
      }
    }
    return themeCatalogSchema.parse({ entries, issues })
  }
  function inspectTheme(input: ThemeDefinition): Pick<ThemePreview, 'action' | 'previousVersion'> {
    const definition = themeDefinitionSchema.parse(input)
    if (definition.id.startsWith('builtin.'))
      throw new ThemeFault('THEME_CONFLICT', '内置主题 ID 为保留标识，外部包不能覆盖。')
    const row = find.get(definition.id) as ThemeRow | undefined
    if (!row) {
      const count = database
        .prepare('SELECT count(*) FROM installed_themes')
        .pluck()
        .get() as number
      if (count >= MAX_INSTALLED_THEMES)
        throw new ThemeFault('THEME_LIMIT', '最多安装 100 个外部主题，请先卸载一个主题。')
      return { action: 'install', previousVersion: null }
    }
    let current: ThemeDefinition
    try {
      current = decodeThemeRow(row)
    } catch {
      throw new ThemeFault('THEME_CONFLICT', '同 ID 的已安装主题损坏，请先卸载后重新安装。')
    }
    const order = compareThemeVersions(definition.version, current.version)
    if (order < 0) throw new ThemeFault('THEME_CONFLICT', '不支持降级安装，请选择更高版本。')
    if (order === 0) {
      if (JSON.stringify(definition) !== row.config_json)
        throw new ThemeFault(
          'THEME_CONFLICT',
          '同一主题 ID 和版本的内容不同，已拒绝覆盖。请提升主题版本。',
        )
      return { action: 'installed', previousVersion: current.version }
    }
    return { action: 'update', previousVersion: current.version }
  }
  const install = database.transaction((input: ThemeDefinition) => {
    const definition = themeDefinitionSchema.parse(input)
    const inspection = inspectTheme(definition)
    if (inspection.action !== 'installed') {
      const content = JSON.stringify(definition)
      database
        .prepare(
          `INSERT INTO installed_themes(theme_id,version,config_json,content_hash) VALUES(?,?,?,?)
        ON CONFLICT(theme_id) DO UPDATE SET version=excluded.version,config_json=excluded.config_json,content_hash=excluded.content_hash`,
        )
        .run(definition.id, definition.version, content, hash(content))
    }
    return listThemes()
  })
  const remove = database.transaction((themeId: string) => {
    themeIdSchema.parse(themeId)
    if (themeId.startsWith('builtin.')) throw new ThemeFault('THEME_CONFLICT', '内置主题不能卸载。')
    database
      .prepare(
        "UPDATE appearance_settings SET theme_id = ?, palette = 'forest' WHERE id = 1 AND theme_id = ?",
      )
      .run(DEFAULT_THEME_ID, themeId)
    database.prepare('DELETE FROM installed_themes WHERE theme_id = ?').run(themeId)
    return listThemes()
  })
  return {
    listThemes,
    inspectTheme,
    installTheme: (definition: ThemeDefinition) => install.immediate(definition),
    removeTheme: (themeId: string) => remove.immediate(themeId),
  }
}
