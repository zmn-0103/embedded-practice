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

@@ -4,10 +4,11 @@
      "library",
      "practicePlans",
      "history",
      "learning",
      "settings",
+     "themes",
      "backup",
      "dataLocations",
      "practice",
    ],
    "process": "undefined",
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
  65  |         'backup',
  66  |         'dataLocations',
  67  |         'practice',
  68  |       ],
  69  |     })
  70  |     expect(
  71  |       await page.evaluate(() =>
  72  |         Object.keys(
  73  |           (globalThis as unknown as { desktop: DesktopApi }).desktop.practicePlans,
  74  |         ).sort(),
  75  |       ),
  76  |     ).toEqual(['change', 'list'])
  77  |     expect(
  78  |       await page.evaluate(() =>
  79  |         Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.library).sort(),
  80  |       ),
  81  |     ).toEqual([
  82  |       'cancelImport',
  83  |       'commitImport',
  84  |       'copyCode',
  85  |       'discardImport',
  86  |       'exportTemplate',
  87  |       'getAnswer',
  88  |       'getQuestion',
  89  |       'listQuestions',
  90  |       'openReference',
  91  |       'previewImport',
  92  |       'setFavorite',
  93  |       'updateCategory',
  94  |     ])
  95  |     expect(
  96  |       await page.evaluate(() =>
  97  |         Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.history).sort(),
  98  |       ),
  99  |     ).toEqual(['getEntry', 'list'])
  100 |     expect(
  101 |       await page.evaluate(() =>
  102 |         Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.learning).sort(),
  103 |       ),
  104 |     ).toEqual(['read'])
  105 |     expect(
  106 |       await page.evaluate(() =>
  107 |         Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.settings).sort(),
  108 |       ),
  109 |     ).toEqual(['read', 'save'])
  110 |     expect(
  111 |       await page.evaluate(() =>
  112 |         Object.keys(
  113 |           (globalThis as unknown as { desktop: DesktopApi }).desktop.dataLocations,
  114 |         ).sort(),
  115 |       ),
  116 |     ).toEqual(['open', 'read'])
  117 |     expect(
  118 |       await page.evaluate(() =>
  119 |         Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.practice).sort(),
  120 |       ),
  121 |     ).toEqual([
  122 |       'end',
  123 |       'finishClose',
  124 |       'navigate',
  125 |       'onBeforeClose',
  126 |       'onCloseCancelled',
  127 |       'rateAndAdvance',
  128 |       'read',
  129 |       'ready',
  130 |       'reveal',
  131 |       'saveDraft',
  132 |       'start',
  133 |     ])
  134 | 
  135 |     const policy = await page
  136 |       .locator('meta[http-equiv="Content-Security-Policy"]')
  137 |       .getAttribute('content')
  138 |     expect(policy).toContain("connect-src 'none'")
  139 |     expect(policy).toContain("img-src 'self' practice-image:")
  140 |     expect(policy).not.toContain('unsafe-inline')
  141 |     expect(policy).not.toContain('unsafe-eval')
  142 |   } finally {
  143 |     await application.close()
  144 |   }
  145 | })
  146 | 
```