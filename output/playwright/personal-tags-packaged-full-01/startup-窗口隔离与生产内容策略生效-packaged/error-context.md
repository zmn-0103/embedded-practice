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

@@ -1,7 +1,8 @@
  Object {
    "api": Array [
+     "personalTags",
      "getAppStatus",
      "library",
      "contentUpdates",
      "practicePlans",
      "questionSets",
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
  61  |         'contentUpdates',
  62  |         'practicePlans',
  63  |         'questionSets',
  64  |         'study',
  65  |         'history',
  66  |         'learning',
  67  |         'settings',
  68  |         'themes',
  69  |         'backup',
  70  |         'dataLocations',
  71  |         'practice',
  72  |       ],
  73  |     })
  74  |     expect(
  75  |       await page.evaluate(() =>
  76  |         Object.keys(
  77  |           (globalThis as unknown as { desktop: DesktopApi }).desktop.contentUpdates,
  78  |         ).sort(),
  79  |       ),
  80  |     ).toEqual(['compare', 'versions'])
  81  |     expect(
  82  |       await page.evaluate(() =>
  83  |         Object.keys(
  84  |           (globalThis as unknown as { desktop: DesktopApi }).desktop.practicePlans,
  85  |         ).sort(),
  86  |       ),
  87  |     ).toEqual(['change', 'list'])
  88  |     expect(
  89  |       await page.evaluate(() =>
  90  |         Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.questionSets).sort(),
  91  |       ),
  92  |     ).toEqual(['change', 'list', 'preview'])
  93  |     expect(
  94  |       await page.evaluate(() =>
  95  |         Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.study).sort(),
  96  |       ),
  97  |     ).toEqual(['exportMaterial', 'listRounds', 'readEntry', 'readNote', 'readRound', 'saveNote'])
  98  |     expect(
  99  |       await page.evaluate(() =>
  100 |         Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.library).sort(),
  101 |       ),
  102 |     ).toEqual([
  103 |       'cancelImport',
  104 |       'commitImport',
  105 |       'copyCode',
  106 |       'discardImport',
  107 |       'exportTemplate',
  108 |       'getAnswer',
  109 |       'getQuestion',
  110 |       'listQuestions',
  111 |       'openReference',
  112 |       'previewImport',
  113 |       'setFavorite',
  114 |       'updateCategory',
  115 |     ])
  116 |     expect(
  117 |       await page.evaluate(() =>
  118 |         Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.history).sort(),
  119 |       ),
  120 |     ).toEqual(['getEntry', 'list'])
  121 |     expect(
  122 |       await page.evaluate(() =>
  123 |         Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.learning).sort(),
  124 |       ),
  125 |     ).toEqual(['read'])
  126 |     expect(
  127 |       await page.evaluate(() =>
  128 |         Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.settings).sort(),
  129 |       ),
  130 |     ).toEqual(['read', 'save'])
  131 |     expect(
  132 |       await page.evaluate(() =>
  133 |         Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.themes).sort(),
  134 |       ),
  135 |     ).toEqual(['install', 'list', 'preview', 'uninstall'])
  136 |     expect(
  137 |       await page.evaluate(() =>
  138 |         Object.keys(
  139 |           (globalThis as unknown as { desktop: DesktopApi }).desktop.dataLocations,
  140 |         ).sort(),
  141 |       ),
  142 |     ).toEqual(['open', 'read'])
  143 |     expect(
  144 |       await page.evaluate(() =>
  145 |         Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.practice).sort(),
  146 |       ),
  147 |     ).toEqual([
  148 |       'end',
  149 |       'finishClose',
  150 |       'navigate',
  151 |       'onBeforeClose',
  152 |       'onCloseCancelled',
  153 |       'outline',
  154 |       'rateAndAdvance',
  155 |       'read',
```