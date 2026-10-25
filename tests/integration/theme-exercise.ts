import type { ThemeDefinition } from '../../src/shared/contracts/themes'

// 在真实Electron主进程中测试SQLite事务，只能访问本场景显式创建的独立目录。
export async function exerciseThemes(
  { app }: Pick<typeof import('electron'), 'app'>,
  input: {
    directory: string
    mode: 'transactions' | 'capacity'
    definitions: ThemeDefinition[]
    maximum: number
  },
) {
  const path = process.getBuiltinModule('node:path')
  const root = path.resolve(input.directory)
  if (
    path.dirname(root) !== path.resolve(process.getBuiltinModule('node:os').tmpdir()) ||
    !path.basename(root).startsWith('embedded-practice-') ||
    root !== app.getPath('userData')
  )
    throw new Error('拒绝操作非本次测试目录')
  const load = process
    .getBuiltinModule('node:module')
    .createRequire(path.join(app.getAppPath(), 'theme-exercise.cjs'))
  const fs = process.getBuiltinModule('node:fs')
  const entry = [
    path.join(app.getAppPath(), 'out/main/library-import.js'),
    path.join(app.getAppPath(), 'library-import.js'),
  ].find((file) => fs.existsSync(file))
  if (!entry) throw new Error('缺少实际构建的内部服务')
  const built = load(entry) as typeof import('../../src/main/services/library/library-import')
  const Database = load('better-sqlite3') as typeof import('better-sqlite3')
  const service = await built.openLibraryImportService(
    path.join(root, 'practice.sqlite3'),
    () => {},
  )
  try {
    const database = new Database(path.join(root, 'practice.sqlite3'))
    try {
      const report: Record<string, unknown> = {}
      const a = input.definitions[0]!,
        b = input.definitions[1]!
      const externalCount = () =>
        service.listThemes().entries.filter((entry) => !entry.builtIn).length
      const rows = () => database.prepare('SELECT * FROM installed_themes ORDER BY theme_id').all()
      function outcome(work: () => unknown) {
        try {
          work()
          return 'ok'
        } catch (error) {
          return error && typeof error === 'object'
            ? String(Reflect.get(error, 'code') ?? Reflect.get(error, 'name'))
            : 'unknown'
        }
      }
      if (input.mode === 'capacity') {
        for (let i = 0; i < input.maximum; i++)
          service.installTheme({ ...a, id: `local.capacity-${i}` })
        report['count'] = externalCount()
        report['overLimit'] = outcome(() =>
          service.installTheme({ ...b, id: 'local.capacity-over' }),
        )
        const update = { ...a, id: 'local.capacity-0', version: '2.0.0' }
        report['updateAtLimit'] = outcome(() => service.installTheme(update))
        report['repeatAtLimit'] = outcome(() => service.installTheme(update))
        report['builtinInstall'] = outcome(() =>
          service.installTheme({ ...a, id: 'builtin.forest' }),
        )
        report['builtinRemove'] = outcome(() => service.removeTheme('builtin.forest'))
        report['finalCount'] = externalCount()
      } else {
        service.installTheme(a)
        service.installTheme(b)
        report['repeated'] = outcome(() => service.installTheme(a))
        report['sameVersionChanged'] = outcome(() =>
          service.installTheme({ ...a, description: '同版本不同内容' }),
        )
        report['downgrade'] = outcome(() => service.installTheme({ ...a, version: '0.9.0' }))
        service.installTheme({ ...a, version: '1.1.0' })
        const selected = service.saveSettings({
          ...service.readSettings(),
          themeId: a.id,
          theme: 'dark',
          fontSize: 22,
          navigationCollapsed: true,
          auxiliaryHidden: true,
        })
        report['selected'] = selected
        database.exec(
          "CREATE TRIGGER fail_theme_delete BEFORE DELETE ON installed_themes BEGIN SELECT RAISE(ABORT,'injected delete'); END",
        )
        report['failedDelete'] = outcome(() => service.removeTheme(a.id))
        report['settingsAfterFailedDelete'] = service.readSettings()
        report['countAfterFailedDelete'] = externalCount()
        database.exec('DROP TRIGGER fail_theme_delete')
        service.removeTheme(a.id)
        report['afterDelete'] = service.readSettings()
        report['repeatDelete'] = outcome(() => service.removeTheme(a.id))
        const before = rows()
        database.exec(
          "CREATE TRIGGER fail_theme_insert BEFORE INSERT ON installed_themes BEGIN SELECT RAISE(ABORT,'injected insert'); END",
        )
        report['failedInsert'] = outcome(() => service.installTheme(a))
        report['rowsBeforeFailedInsert'] = before
        report['rowsAfterFailedInsert'] = rows()
        database.exec('DROP TRIGGER fail_theme_insert')
        database.prepare("UPDATE installed_themes SET config_json='{' WHERE theme_id=?").run(b.id)
        database.prepare('UPDATE appearance_settings SET theme_id=? WHERE id=1').run(b.id)
        report['corruptCatalog'] = service.listThemes()
        report['retainedCorruptSelection'] = service.readSettings()
        report['rejectCorruptApply'] = outcome(() =>
          service.saveSettings({ ...selected, themeId: b.id }),
        )
      }
      report['integrity'] = database.pragma('integrity_check')
      report['foreignKeys'] = database.pragma('foreign_key_check')
      return report
    } finally {
      database.close()
    }
  } finally {
    await service.close()
  }
}
