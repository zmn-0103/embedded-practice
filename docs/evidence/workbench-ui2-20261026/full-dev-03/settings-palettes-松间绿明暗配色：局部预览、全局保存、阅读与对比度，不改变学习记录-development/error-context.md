# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: settings-palettes.spec.ts >> 松间绿明暗配色：局部预览、全局保存、阅读与对比度，不改变学习记录
- Location: tests\e2e\settings-palettes.spec.ts:83:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.evaluate: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('.page-description')

```

# Test source

```ts
  1   | import type { ElectronApplication, Page } from '@playwright/test'
  2   | import type { DesktopApi } from '../../src/shared/contracts/application'
  3   | import type { AppearanceSettings } from '../../src/shared/contracts/settings'
  4   | import { expect, launchApplication, openPage, test } from './helpers'
  5   | import {
  6   |   beginHistoryPractice,
  7   |   captureHistory,
  8   |   historySnapshot,
  9   |   prepareHistory,
  10  |   selectHistoryQuestion,
  11  |   stop,
  12  |   withHistoryDatabase,
  13  | } from './history-helpers'
  14  | 
  15  | const palettes = [
  16  |   { id: 'forest', name: '松间绿', light: 'rgb(245, 246, 244)', dark: 'rgb(20, 27, 24)' },
  17  |   { id: 'ocean', name: '晴空蓝', light: 'rgb(243, 245, 248)', dark: 'rgb(20, 27, 41)' },
  18  |   { id: 'sand', name: '暖沙金', light: 'rgb(247, 244, 238)', dark: 'rgb(36, 30, 22)' },
  19  |   { id: 'lilac', name: '暮山紫', light: 'rgb(245, 243, 248)', dark: 'rgb(33, 27, 41)' },
  20  | ] as const
  21  | 
  22  | function stored(directory: string) {
  23  |   return withHistoryDatabase(directory, (database) =>
  24  |     database
  25  |       .prepare('SELECT theme,palette,font_size AS fontSize FROM appearance_settings WHERE id=1')
  26  |       .get(),
  27  |   )
  28  | }
  29  | async function choose(
  30  |   page: Page,
  31  |   name: string,
  32  |   theme: AppearanceSettings['theme'],
  33  |   fontSize: number,
  34  | ) {
  35  |   await openPage(page, '设置与数据')
  36  |   await page.getByRole('radio', { name, exact: true }).check()
  37  |   await page.getByLabel('显示主题', { exact: true }).selectOption(theme)
  38  |   await page.getByLabel('正文字号', { exact: true }).selectOption(String(fontSize))
  39  | }
  40  | async function save(page: Page) {
  41  |   await page.getByRole('button', { name: '保存并应用', exact: true }).click()
  42  |   await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
  43  | }
  44  | async function closeNormally(application: ElectronApplication) {
  45  |   const closed = application.waitForEvent('close')
  46  |   await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.close())
  47  |   await closed
  48  | }
  49  | async function contrast(page: Page) {
  50  |   return page.evaluate(() => {
  51  |     const browser = globalThis as unknown as {
  52  |       document: { querySelector: (selector: string) => unknown }
  53  |       getComputedStyle: (element: unknown) => { color: string; backgroundColor: string }
  54  |     }
  55  |     const style = (selector: string) =>
  56  |       browser.getComputedStyle(browser.document.querySelector(selector))
  57  |     const luminance = (rgb: string) =>
  58  |       rgb
  59  |         .match(/[\d.]+/g)!
  60  |         .slice(0, 3)
  61  |         .map(Number)
  62  |         .map((value) => {
  63  |           const channel = value / 255
  64  |           return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  65  |         })
  66  |         .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index]!, 0)
  67  |     const ratio = (a: string, b: string) => {
  68  |       const values = [luminance(a), luminance(b)].sort((left, right) => right - left)
  69  |       return (values[0]! + 0.05) / (values[1]! + 0.05)
  70  |     }
  71  |     const panel = style('.settings-pane'),
  72  |       description = style('.appearance-save-row .muted'),
  73  |       primary = style('.appearance-save-row button')
  74  |     return {
  75  |       body: ratio(panel.color, panel.backgroundColor),
  76  |       secondary: ratio(description.color, panel.backgroundColor),
  77  |       primary: ratio(primary.color, primary.backgroundColor),
  78  |     }
  79  |   })
  80  | }
  81  | 
  82  | for (const palette of palettes) {
  83  |   test(`${palette.name}明暗配色：局部预览、全局保存、阅读与对比度，不改变学习记录`, async ({
  84  |     testDataDirectory,
  85  |   }, info) => {
  86  |     const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  87  |     try {
  88  |       const before = historySnapshot(testDataDirectory)
  89  |       const measurements = []
  90  |       for (const theme of ['light', 'dark'] as const) {
  91  |         const oldPalette = await page.locator('html').getAttribute('data-palette')
  92  |         const oldTheme = await page.locator('html').getAttribute('data-theme')
  93  |         const size = theme === 'light' ? 15 : 22
  94  |         await choose(page, palette.name, theme, size)
  95  |         await expect(page.locator('html')).toHaveAttribute('data-palette', oldPalette!)
  96  |         await expect(page.locator('html')).toHaveAttribute('data-theme', oldTheme!)
  97  |         await expect(page.getByLabel('显示设置局部预览', { exact: true })).toHaveCSS(
  98  |           'background-color',
  99  |           palette[theme],
  100 |         )
> 101 |         const pageDescription = await page.locator('.page-description').evaluate(
      |                                                                         ^ TimeoutError: locator.evaluate: Timeout 30000ms exceeded.
  102 |           (element) =>
  103 |             (
  104 |               globalThis as unknown as {
  105 |                 getComputedStyle: (element: unknown) => { color: string }
  106 |               }
  107 |             ).getComputedStyle(element).color,
  108 |         )
  109 |         await expect(page.locator('.appearance-save-row .muted')).toHaveCSS(
  110 |           'color',
  111 |           pageDescription,
  112 |         )
  113 |         await save(page)
  114 |         await expect(page.locator('html')).toHaveAttribute('data-palette', palette.id)
  115 |         await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
  116 |         await expect(page.locator('html')).toHaveCSS('background-color', palette[theme])
  117 |         expect(stored(testDataDirectory)).toEqual({ theme, palette: palette.id, fontSize: size })
  118 |         const ratios = await contrast(page)
  119 |         for (const value of Object.values(ratios)) expect(value).toBeGreaterThanOrEqual(4.5)
  120 |         measurements.push({ theme, ratios })
  121 |         await page.getByRole('radio', { name: palette.name, exact: true }).scrollIntoViewIfNeeded()
  122 |         await captureHistory(application, page, info, `palette-${palette.id}-${theme}.png`)
  123 |         await selectHistoryQuestion(page)
  124 |         await page.getByRole('button', { name: '展开参考答案', exact: true }).click()
  125 |         await expect(page.locator('.question-reader pre code')).toHaveText('int value = 1;\n')
  126 |         await expect(page.locator('.question-reader pre code')).toHaveCSS('font-size', `${size}px`)
  127 |         await expect(page.locator('.question-reader img')).toHaveCSS('filter', 'none')
  128 |         await openPage(page, '学习记录')
  129 |         await expect(page.getByLabel('当前版本学习总览', { exact: true })).toBeVisible()
  130 |         await openPage(page, '开始练习')
  131 |         await expect(page.locator('html')).toHaveAttribute('data-palette', palette.id)
  132 |         expect(historySnapshot(testDataDirectory)).toEqual(before)
  133 |       }
  134 |       await info.attach(`palette-${palette.id}-contrast.json`, {
  135 |         body: JSON.stringify(measurements),
  136 |         contentType: 'application/json',
  137 |       })
  138 |     } finally {
  139 |       await stop(application)
  140 |     }
  141 |   })
  142 | }
  143 | 
  144 | test('配色真实写失败/丢响应保留选择，键盘切换后正常重开保留草稿', async ({
  145 |   testDataDirectory,
  146 | }, info) => {
  147 |   const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  148 |   let reopened: ElectronApplication | undefined
  149 |   try {
  150 |     await beginHistoryPractice(page)
  151 |     await page
  152 |       .getByRole('textbox', { name: '我的答案', exact: true })
  153 |       .fill('主题切换不能改变草稿\n    int kept = 7;')
  154 |     await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
  155 |     const before = historySnapshot(testDataDirectory)
  156 |     withHistoryDatabase(
  157 |       testDataDirectory,
  158 |       (database) =>
  159 |         database.exec(
  160 |           "CREATE TRIGGER fail_palette BEFORE UPDATE ON appearance_settings BEGIN SELECT RAISE(ABORT,'配色写入失败'); END",
  161 |         ),
  162 |       false,
  163 |     )
  164 |     await choose(page, '晴空蓝', 'dark', 22)
  165 |     await page.getByRole('button', { name: '保存并应用', exact: true }).click()
  166 |     await expect(page.getByRole('alert')).toContainText('显示设置暂不可用')
  167 |     await expect(page.getByRole('radio', { name: '晴空蓝', exact: true })).toBeChecked()
  168 |     await expect(page.locator('html')).toHaveAttribute('data-palette', 'forest')
  169 |     expect(stored(testDataDirectory)).toEqual({ theme: 'system', palette: 'forest', fontSize: 17 })
  170 |     withHistoryDatabase(
  171 |       testDataDirectory,
  172 |       (database) => database.exec('DROP TRIGGER fail_palette'),
  173 |       false,
  174 |     )
  175 |     await application.evaluate(({ ipcMain }) => {
  176 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('settings:save')
  177 |       let lost = false
  178 |       ipcMain.removeHandler('settings:save')
  179 |       ipcMain.handle('settings:save', async (...args) => {
  180 |         const result = await original(...args)
  181 |         if (!lost && result.ok) {
  182 |           lost = true
  183 |           return undefined
  184 |         }
  185 |         return result
  186 |       })
  187 |     })
  188 |     await page.getByRole('button', { name: '重试保存并应用', exact: true }).click()
  189 |     await expect(page.getByRole('alert')).toContainText('显示设置保存结果尚未确认')
  190 |     expect(stored(testDataDirectory)).toEqual({ theme: 'dark', palette: 'ocean', fontSize: 22 })
  191 |     await expect(page.locator('html')).toHaveAttribute('data-palette', 'forest')
  192 |     await page.getByRole('button', { name: '重试保存并应用', exact: true }).click()
  193 |     await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
  194 |     const ocean = page.getByRole('radio', { name: '晴空蓝', exact: true })
  195 |     await ocean.focus()
  196 |     await ocean.press('ArrowRight')
  197 |     await expect(page.getByRole('radio', { name: '暖沙金', exact: true })).toBeChecked()
  198 |     await expect(page.locator('html')).toHaveAttribute('data-palette', 'ocean')
  199 |     await save(page)
  200 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  201 |     await closeNormally(application)
```