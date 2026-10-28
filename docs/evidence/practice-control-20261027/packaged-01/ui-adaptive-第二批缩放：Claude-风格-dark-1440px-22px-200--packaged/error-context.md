# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-adaptive.spec.ts >> 第二批缩放：Claude 风格/dark/1440px/22px/200%
- Location: tests\e2e\ui-adaptive.spec.ts:22:7

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 2
+ Received  + 2

@@ -53,12 +53,12 @@
  独立缩放草稿 34
  独立缩放草稿 35
  独立缩放草稿 36
  独立缩放草稿 37
  独立缩放草稿 38
- 独立缩放草稿 39",
-       "draft_revision": 1,
+ 独立缩放草稿 39tong",
+       "draft_revision": 5,
        "position": 0,
        "question_id": 1,
        "rated_at": null,
        "rating": null,
        "revealed_at": "2026-10-27T11:10:19.770Z",
```

# Test source

```ts
  1   | import { writeFile } from 'node:fs/promises'
  2   | import { expect, openPage, test } from './helpers'
  3   | import { stop, withHistoryDatabase } from './history-helpers'
  4   | import { chooseTheme, themeBusinessSnapshot } from './theme-helpers'
  5   | import { noWorkbenchOverflow, prepareWorkbench, settleWorkbench } from './workbench-helpers'
  6   | 
  7   | const standardLayouts = [
  8   |   { width: 1440, font: 17, zoom: 2 },
  9   |   { width: 1440, font: 22, zoom: 2 },
  10  |   { width: 900, font: 17, zoom: 2 },
  11  |   { width: 900, font: 22, zoom: 2 },
  12  |   { width: 900, font: 22, zoom: 1.5 },
  13  |   { width: 900, font: 22, zoom: 1 },
  14  | ]
  15  | const layouts = [
  16  |   ...standardLayouts.map((layout) => ({ ...layout, theme: '松间绿', mode: 'light' })),
  17  |   { width: 900, font: 22, zoom: 2, theme: '暖沙金', mode: 'dark' },
  18  |   { width: 1440, font: 22, zoom: 2, theme: 'Claude 风格', mode: 'dark' },
  19  | ]
  20  | 
  21  | for (const layout of layouts) {
  22  |   test(`第二批缩放：${layout.theme}/${layout.mode}/${layout.width}px/${layout.font}px/${layout.zoom * 100}%`, async ({
  23  |     testDataDirectory,
  24  |   }, info) => {
  25  |     const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  26  |     try {
  27  |       const runtime = await application.evaluate(({ app }) => ({
  28  |         exe: app.getPath('exe'),
  29  |         userData: app.getPath('userData'),
  30  |         packaged: app.isPackaged,
  31  |         version: app.getVersion(),
  32  |       }))
  33  |       await chooseTheme(page, layout.theme, layout.mode, layout.font)
  34  |       await application.evaluate(({ BrowserWindow }, layout) => {
  35  |         const window = BrowserWindow.getAllWindows()[0]!
  36  |         window.setContentSize(layout.width, 900)
  37  |         window.webContents.setZoomFactor(layout.zoom)
  38  |       }, layout)
  39  |       await openPage(page, '开始练习')
  40  |       await page.getByRole('button', { name: '开始练习', exact: true }).click()
  41  |       const input = page.getByRole('textbox', { name: '我的答案', exact: true })
  42  |       const draft = Array.from({ length: 40 }, (_, index) => `独立缩放草稿 ${index}`).join('\n')
  43  |       await input.fill(draft)
  44  |       await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  45  |       await expect(page.getByRole('button', { name: '掌握', exact: true })).toBeEnabled()
  46  |       await input.focus()
  47  |       await settleWorkbench(page)
  48  |       const metrics = await page.locator('.practice-actions').evaluate((bar) => {
  49  |         const browser = globalThis as unknown as { innerHeight: number; innerWidth: number }
  50  |         const box = bar.getBoundingClientRect()
  51  |         const editor = bar.ownerDocument.querySelector('#practice-answer')!.getBoundingClientRect()
  52  |         return {
  53  |           viewport: { width: browser.innerWidth, height: browser.innerHeight },
  54  |           actions: { top: box.top, height: box.height, ratio: box.height / browser.innerHeight },
  55  |           input: {
  56  |             top: editor.top,
  57  |             height: editor.height,
  58  |             visible: Math.max(
  59  |               0,
  60  |               Math.min(editor.bottom, box.top, browser.innerHeight) - Math.max(0, editor.top),
  61  |             ),
  62  |           },
  63  |         }
  64  |       })
  65  |       await expect(input).toHaveValue(draft)
  66  |       expect(metrics.actions.ratio).toBeLessThanOrEqual(0.3)
  67  |       expect(metrics.input.height).toBe(200)
  68  |       expect(metrics.input.visible).toBeGreaterThanOrEqual(180)
  69  |       for (const button of await page.locator('.practice-actions button').all())
  70  |         await expect(button).toBeInViewport({ ratio: 1 })
  71  |       await noWorkbenchOverflow(page)
  72  |       const encoded = await application.evaluate(async ({ BrowserWindow }) =>
  73  |         (await BrowserWindow.getAllWindows()[0]!.webContents.capturePage())
  74  |           .toPNG()
  75  |           .toString('base64'),
  76  |       )
  77  |       const screenshot = info.outputPath('zoom.png')
  78  |       await writeFile(screenshot, Buffer.from(encoded, 'base64'))
  79  |       await info.attach('zoom.png', { path: screenshot, contentType: 'image/png' })
  80  |       await info.attach('layout.json', {
  81  |         body: JSON.stringify({ runtime, layout, metrics }, null, 2),
  82  |         contentType: 'application/json',
  83  |       })
  84  |       const before = themeBusinessSnapshot(testDataDirectory)
  85  |       await input.evaluate((element) => Reflect.set(globalThis, '__adaptiveInput', element))
  86  |       await application.evaluate(({ BrowserWindow }) =>
  87  |         BrowserWindow.getAllWindows()[0]!.webContents.setZoomFactor(1),
  88  |       )
  89  |       await settleWorkbench(page)
  90  |       await application.evaluate(
  91  |         ({ BrowserWindow }, zoom) =>
  92  |           BrowserWindow.getAllWindows()[0]!.webContents.setZoomFactor(zoom),
  93  |         layout.zoom,
  94  |       )
  95  |       await settleWorkbench(page)
  96  |       expect(
  97  |         await input.evaluate((element) => element === Reflect.get(globalThis, '__adaptiveInput')),
  98  |       ).toBe(true)
  99  |       await expect(input).toHaveValue(draft)
> 100 |       expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
      |                                                        ^ Error: expect(received).toEqual(expected) // deep equality
  101 |     } finally {
  102 |       await stop(application)
  103 |     }
  104 |   })
  105 | }
  106 | 
  107 | test('第二批缩放：200%保存失败时输入保留、重试可见且返回被保护，恢复后仍为原题', async ({
  108 |   testDataDirectory,
  109 | }, info) => {
  110 |   const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  111 |   let fault = false
  112 |   try {
  113 |     await chooseTheme(page, '暖沙金', 'dark', 22)
  114 |     await application.evaluate(({ BrowserWindow }) => {
  115 |       const window = BrowserWindow.getAllWindows()[0]!
  116 |       window.setContentSize(900, 900)
  117 |       window.webContents.setZoomFactor(2)
  118 |     })
  119 |     await openPage(page, '开始练习')
  120 |     await page.getByRole('button', { name: '开始练习', exact: true }).click()
  121 |     withHistoryDatabase(
  122 |       testDataDirectory,
  123 |       (db) =>
  124 |         db.exec(
  125 |           "CREATE TRIGGER adaptive_draft_fault BEFORE UPDATE OF draft ON practice_items BEGIN SELECT RAISE(ABORT, '独立缩放保存失败'); END",
  126 |         ),
  127 |       false,
  128 |     )
  129 |     fault = true
  130 |     const input = page.getByRole('textbox', { name: '我的答案', exact: true })
  131 |     await input.fill('200%缩放保存失败必须保留的草稿\n    preserve_original_session();')
  132 |     await expect(page.locator('.practice-save')).toHaveText('保存失败')
  133 |     const retry = page.getByRole('button', { name: '重试保存', exact: true })
  134 |     await expect(retry).toBeInViewport({ ratio: 1 })
  135 |     await page.getByRole('button', { name: '保存后返回', exact: true }).click()
  136 |     await expect(input).toHaveValue(
  137 |       '200%缩放保存失败必须保留的草稿\n    preserve_original_session();',
  138 |     )
  139 |     await expect(page.getByLabel('练习进度', { exact: true })).toContainText('第 1 / 20 题')
  140 |     withHistoryDatabase(
  141 |       testDataDirectory,
  142 |       (db) => db.exec('DROP TRIGGER adaptive_draft_fault'),
  143 |       false,
  144 |     )
  145 |     fault = false
  146 |     await retry.click()
  147 |     await expect(page.locator('.practice-save')).toHaveText('已保存')
  148 |     await expect(input).toHaveValue(
  149 |       '200%缩放保存失败必须保留的草稿\n    preserve_original_session();',
  150 |     )
  151 |     await expect(page.getByRole('button', { name: '查看参考答案', exact: true })).toBeInViewport({
  152 |       ratio: 1,
  153 |     })
  154 |     await noWorkbenchOverflow(page)
  155 |   } finally {
  156 |     if (fault)
  157 |       withHistoryDatabase(
  158 |         testDataDirectory,
  159 |         (db) => db.exec('DROP TRIGGER adaptive_draft_fault'),
  160 |         false,
  161 |       )
  162 |     await stop(application)
  163 |   }
  164 | })
  165 | 
```