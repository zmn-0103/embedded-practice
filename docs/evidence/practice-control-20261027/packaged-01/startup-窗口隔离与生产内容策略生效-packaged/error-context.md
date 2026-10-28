# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: startup.spec.ts >> 窗口隔离与生产内容策略生效
- Location: tests\e2e\startup.spec.ts:38:5

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 0
+ Received  + 1

@@ -1,10 +1,11 @@
  Object {
    "api": Array [
      "getAppStatus",
      "library",
      "practicePlans",
+     "questionSets",
      "history",
      "learning",
      "settings",
      "themes",
      "backup",
```

# Test source

```ts
  1   | import { stat } from 'node:fs/promises'
  2   | import { join } from 'node:path'
  3   | import type { DesktopApi } from '../../src/shared/contracts/application'
  4   | import { expect, launchApplication, readAppStatus, test } from './helpers'
  5   | 
  6   | test('关闭重开后读回 SQLite 记录', async ({ testDataDirectory }, testInfo) => {
  7   |   for (const launchCount of [1, 2]) {
  8   |     const { application, page } = await launchApplication(testDataDirectory, testInfo.project.name)
  9   |     try {
  10  |       await expect(page.getByRole('status')).toHaveText('本地数据已就绪')
  11  |       const status = await readAppStatus(page)
  12  |       if (!status.ok) throw new Error(status.error.message)
  13  |       expect(status.value.launchCount).toBe(launchCount)
  14  |       expect(await readAppStatus(page)).toEqual(status)
  15  |       expect(await application.evaluate(({ app }) => app.getPath('userData'))).toBe(
  16  |         testDataDirectory,
  17  |       )
  18  |       expect(await application.evaluate(({ app }) => app.isPackaged)).toBe(
  19  |         testInfo.project.name === 'packaged',
  20  |       )
  21  | 
  22  |       await page.context().setOffline(true)
  23  |       await page.reload()
  24  |       await expect(page.getByRole('status')).toHaveText('本地数据已就绪')
  25  |       if (launchCount === 2) {
  26  |         for (const colorScheme of ['light', 'dark'] as const) {
  27  |           await page.emulateMedia({ colorScheme })
  28  |           await page.screenshot({ path: testInfo.outputPath(`startup-${colorScheme}.png`) })
  29  |         }
  30  |       }
  31  |     } finally {
  32  |       await application.close()
  33  |     }
  34  |   }
  35  |   expect((await stat(join(testDataDirectory, 'practice.sqlite3'))).size).toBeGreaterThan(0)
  36  | })
  37  | 
  38  | test('窗口隔离与生产内容策略生效', async ({ testDataDirectory }, testInfo) => {
  39  |   const { application, page } = await launchApplication(testDataDirectory, testInfo.project.name)
  40  |   try {
  41  |     await expect(page.getByRole('status')).toHaveText('本地数据已就绪')
  42  |     const sandboxed = await application.evaluate(({ app, BrowserWindow }) => {
  43  |       const window = BrowserWindow.getAllWindows()[0]
  44  |       if (!window) throw new Error('测试窗口不存在。')
  45  |       const pid = window.webContents.getOSProcessId()
  46  |       return app.getAppMetrics().find((metric) => metric.pid === pid)?.sandboxed
  47  |     })
  48  |     expect(sandboxed).toBe(true)
  49  |     expect(
  50  |       await page.evaluate(() => ({
  51  |         process: typeof globalThis.process,
  52  |         require: typeof globalThis.require,
  53  |         api: Object.keys((globalThis as unknown as { desktop: object }).desktop),
  54  |       })),
> 55  |     ).toEqual({
      |       ^ Error: expect(received).toEqual(expected) // deep equality
  56  |       process: 'undefined',
  57  |       require: 'undefined',
  58  |       api: [
  59  |         'getAppStatus',
  60  |         'library',
  61  |         'practicePlans',
  62  |         'history',
  63  |         'learning',
  64  |         'settings',
  65  |         'themes',
  66  |         'backup',
  67  |         'dataLocations',
  68  |         'practice',
  69  |       ],
  70  |     })
  71  |     expect(
  72  |       await page.evaluate(() =>
  73  |         Object.keys(
  74  |           (globalThis as unknown as { desktop: DesktopApi }).desktop.practicePlans,
  75  |         ).sort(),
  76  |       ),
  77  |     ).toEqual(['change', 'list'])
  78  |     expect(
  79  |       await page.evaluate(() =>
  80  |         Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.library).sort(),
  81  |       ),
  82  |     ).toEqual([
  83  |       'cancelImport',
  84  |       'commitImport',
  85  |       'copyCode',
  86  |       'discardImport',
  87  |       'exportTemplate',
  88  |       'getAnswer',
  89  |       'getQuestion',
  90  |       'listQuestions',
  91  |       'openReference',
  92  |       'previewImport',
  93  |       'setFavorite',
  94  |       'updateCategory',
  95  |     ])
  96  |     expect(
  97  |       await page.evaluate(() =>
  98  |         Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.history).sort(),
  99  |       ),
  100 |     ).toEqual(['getEntry', 'list'])
  101 |     expect(
  102 |       await page.evaluate(() =>
  103 |         Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.learning).sort(),
  104 |       ),
  105 |     ).toEqual(['read'])
  106 |     expect(
  107 |       await page.evaluate(() =>
  108 |         Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.settings).sort(),
  109 |       ),
  110 |     ).toEqual(['read', 'save'])
  111 |     expect(
  112 |       await page.evaluate(() =>
  113 |         Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.themes).sort(),
  114 |       ),
  115 |     ).toEqual(['install', 'list', 'preview', 'uninstall'])
  116 |     expect(
  117 |       await page.evaluate(() =>
  118 |         Object.keys(
  119 |           (globalThis as unknown as { desktop: DesktopApi }).desktop.dataLocations,
  120 |         ).sort(),
  121 |       ),
  122 |     ).toEqual(['open', 'read'])
  123 |     expect(
  124 |       await page.evaluate(() =>
  125 |         Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.practice).sort(),
  126 |       ),
  127 |     ).toEqual([
  128 |       'end',
  129 |       'finishClose',
  130 |       'navigate',
  131 |       'onBeforeClose',
  132 |       'onCloseCancelled',
  133 |       'rateAndAdvance',
  134 |       'read',
  135 |       'ready',
  136 |       'reveal',
  137 |       'saveDraft',
  138 |       'start',
  139 |     ])
  140 | 
  141 |     const policy = await page
  142 |       .locator('meta[http-equiv="Content-Security-Policy"]')
  143 |       .getAttribute('content')
  144 |     expect(policy).toContain("connect-src 'none'")
  145 |     expect(policy).toContain("img-src 'self' practice-image:")
  146 |     expect(policy).not.toContain('unsafe-inline')
  147 |     expect(policy).not.toContain('unsafe-eval')
  148 |   } finally {
  149 |     await application.close()
  150 |   }
  151 | })
  152 | 
```