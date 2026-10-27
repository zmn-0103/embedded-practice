import { MAX_INSTALLED_THEMES } from '../../src/shared/contracts/themes'
import { exerciseThemes } from '../integration/theme-exercise'
import { expect, test } from './helpers'
import { prepareHistory, stop } from './history-helpers'
import { exampleTheme, themeBusinessSnapshot, verifyThemeTarget } from './theme-helpers'

for (const mode of ['transactions', 'capacity'] as const) {
  test(`主题数据库/${mode}：真实版本/容量/故障回滚与原学习数据保护`, async ({
    testDataDirectory,
  }, info) => {
    const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
    try {
      const identity = await verifyThemeTarget(
        application,
        page,
        testDataDirectory,
        info.project.name,
      )
      const before = themeBusinessSnapshot(testDataDirectory)
      const report = await application.evaluate(exerciseThemes, {
        directory: testDataDirectory,
        mode,
        maximum: MAX_INSTALLED_THEMES,
        definitions: [await exampleTheme(), await exampleTheme('circuit-blue')],
      })
      expect(report['integrity']).toEqual([{ integrity_check: 'ok' }])
      expect(report['foreignKeys']).toEqual([])
      expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
      if (mode === 'capacity') {
        expect(report).toMatchObject({
          count: 100,
          finalCount: 100,
          overLimit: 'THEME_LIMIT',
          updateAtLimit: 'ok',
          repeatAtLimit: 'ok',
          builtinInstall: 'THEME_CONFLICT',
          builtinRemove: 'THEME_CONFLICT',
        })
      } else {
        expect(report).toMatchObject({
          repeated: 'ok',
          sameVersionChanged: 'THEME_CONFLICT',
          downgrade: 'THEME_CONFLICT',
          failedDelete: 'SQLITE_CONSTRAINT_TRIGGER',
          failedInsert: 'SQLITE_CONSTRAINT_TRIGGER',
          countAfterFailedDelete: 2,
          repeatDelete: 'ok',
          rejectCorruptApply: 'Error',
        })
        expect(report['selected']).toEqual(report['settingsAfterFailedDelete'])
        expect(report['rowsBeforeFailedInsert']).toEqual(report['rowsAfterFailedInsert'])
        expect(report['afterDelete']).toMatchObject({
          themeId: 'builtin.forest',
          palette: 'forest',
          theme: 'dark',
          fontSize: 22,
          navigationCollapsed: true,
          auxiliaryHidden: true,
        })
        expect(report['retainedCorruptSelection']).toMatchObject({ themeId: 'local.circuit-blue' })
        expect(report['corruptCatalog']).toMatchObject({ issues: [{ id: 'local.circuit-blue' }] })
      }
      await info.attach('theme-database.json', {
        body: JSON.stringify({ identity, report }, null, 2),
        contentType: 'application/json',
      })
    } finally {
      await stop(application)
    }
  })
}
