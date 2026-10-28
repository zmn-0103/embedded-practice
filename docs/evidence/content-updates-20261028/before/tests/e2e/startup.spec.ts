import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, launchApplication, readAppStatus, test } from './helpers'

test('关闭重开后读回 SQLite 记录', async ({ testDataDirectory }, testInfo) => {
  for (const launchCount of [1, 2]) {
    const { application, page } = await launchApplication(testDataDirectory, testInfo.project.name)
    try {
      await expect(page.getByRole('status')).toHaveText('本地数据已就绪')
      const status = await readAppStatus(page)
      if (!status.ok) throw new Error(status.error.message)
      expect(status.value.launchCount).toBe(launchCount)
      expect(await readAppStatus(page)).toEqual(status)
      expect(await application.evaluate(({ app }) => app.getPath('userData'))).toBe(
        testDataDirectory,
      )
      expect(await application.evaluate(({ app }) => app.isPackaged)).toBe(
        testInfo.project.name === 'packaged',
      )

      await page.context().setOffline(true)
      await page.reload()
      await expect(page.getByRole('status')).toHaveText('本地数据已就绪')
      if (launchCount === 2) {
        for (const colorScheme of ['light', 'dark'] as const) {
          await page.emulateMedia({ colorScheme })
          await page.screenshot({ path: testInfo.outputPath(`startup-${colorScheme}.png`) })
        }
      }
    } finally {
      await application.close()
    }
  }
  expect((await stat(join(testDataDirectory, 'practice.sqlite3'))).size).toBeGreaterThan(0)
})

test('窗口隔离与生产内容策略生效', async ({ testDataDirectory }, testInfo) => {
  const { application, page } = await launchApplication(testDataDirectory, testInfo.project.name)
  try {
    await expect(page.getByRole('status')).toHaveText('本地数据已就绪')
    const sandboxed = await application.evaluate(({ app, BrowserWindow }) => {
      const window = BrowserWindow.getAllWindows()[0]
      if (!window) throw new Error('测试窗口不存在。')
      const pid = window.webContents.getOSProcessId()
      return app.getAppMetrics().find((metric) => metric.pid === pid)?.sandboxed
    })
    expect(sandboxed).toBe(true)
    expect(
      await page.evaluate(() => ({
        process: typeof globalThis.process,
        require: typeof globalThis.require,
        api: Object.keys((globalThis as unknown as { desktop: object }).desktop),
      })),
    ).toEqual({
      process: 'undefined',
      require: 'undefined',
      api: [
        'getAppStatus',
        'library',
        'practicePlans',
        'questionSets',
        'study',
        'history',
        'learning',
        'settings',
        'themes',
        'backup',
        'dataLocations',
        'practice',
      ],
    })
    expect(
      await page.evaluate(() =>
        Object.keys(
          (globalThis as unknown as { desktop: DesktopApi }).desktop.practicePlans,
        ).sort(),
      ),
    ).toEqual(['change', 'list'])
    expect(
      await page.evaluate(() =>
        Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.questionSets).sort(),
      ),
    ).toEqual(['change', 'list', 'preview'])
    expect(
      await page.evaluate(() =>
        Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.study).sort(),
      ),
    ).toEqual(['exportMaterial', 'listRounds', 'readEntry', 'readNote', 'readRound', 'saveNote'])
    expect(
      await page.evaluate(() =>
        Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.library).sort(),
      ),
    ).toEqual([
      'cancelImport',
      'commitImport',
      'copyCode',
      'discardImport',
      'exportTemplate',
      'getAnswer',
      'getQuestion',
      'listQuestions',
      'openReference',
      'previewImport',
      'setFavorite',
      'updateCategory',
    ])
    expect(
      await page.evaluate(() =>
        Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.history).sort(),
      ),
    ).toEqual(['getEntry', 'list'])
    expect(
      await page.evaluate(() =>
        Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.learning).sort(),
      ),
    ).toEqual(['read'])
    expect(
      await page.evaluate(() =>
        Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.settings).sort(),
      ),
    ).toEqual(['read', 'save'])
    expect(
      await page.evaluate(() =>
        Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.themes).sort(),
      ),
    ).toEqual(['install', 'list', 'preview', 'uninstall'])
    expect(
      await page.evaluate(() =>
        Object.keys(
          (globalThis as unknown as { desktop: DesktopApi }).desktop.dataLocations,
        ).sort(),
      ),
    ).toEqual(['open', 'read'])
    expect(
      await page.evaluate(() =>
        Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.practice).sort(),
      ),
    ).toEqual([
      'end',
      'finishClose',
      'navigate',
      'onBeforeClose',
      'onCloseCancelled',
      'outline',
      'rateAndAdvance',
      'read',
      'ready',
      'reveal',
      'saveDraft',
      'start',
    ])

    const policy = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content')
    expect(policy).toContain("connect-src 'none'")
    expect(policy).toContain("img-src 'self' practice-image:")
    expect(policy).not.toContain('unsafe-inline')
    expect(policy).not.toContain('unsafe-eval')
  } finally {
    await application.close()
  }
})
