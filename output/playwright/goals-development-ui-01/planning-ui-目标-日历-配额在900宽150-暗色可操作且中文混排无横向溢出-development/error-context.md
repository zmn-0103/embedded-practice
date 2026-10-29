# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: planning-ui.spec.ts >> 目标/日历/配额在900宽150%暗色可操作且中文混排无横向溢出
- Location: tests\e2e\planning-ui.spec.ts:264:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.check: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('radio', { name: '暖白与石墨', exact: true })

```

# Test source

```ts
  1   | import { readFile } from 'node:fs/promises'
  2   | import { resolve } from 'node:path'
  3   | import type { ElectronApplication, Page } from '@playwright/test'
  4   | import type { DesktopApi } from '../../src/shared/contracts/application'
  5   | import { themeDefinitionSchema } from '../../src/shared/contracts/themes'
  6   | import { expect, openPage } from './helpers'
  7   | import { historySnapshot, withHistoryDatabase } from './history-helpers'
  8   | 
  9   | export async function exampleTheme(name = 'paper-ink') {
  10  |   return themeDefinitionSchema.parse(
  11  |     JSON.parse(await readFile(`themes/examples/${name}.ep-theme.json`, 'utf8')),
  12  |   )
  13  | }
  14  | export async function verifyThemeTarget(
  15  |   application: ElectronApplication,
  16  |   page: Page,
  17  |   directory: string,
  18  |   project: string,
  19  | ) {
  20  |   const actual = await application.evaluate(({ app }) => ({
  21  |     exe: app.getPath('exe'),
  22  |     userData: app.getPath('userData'),
  23  |     packaged: app.isPackaged,
  24  |     version: app.getVersion(),
  25  |   }))
  26  |   expect(actual.userData).toBe(directory)
  27  |   expect(actual.packaged).toBe(project === 'packaged')
  28  |   expect(actual.version).toBe(project === 'packaged' ? '0.0.2' : '42.11.15')
  29  |   if (project === 'packaged') {
  30  |     const target = process.env['EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE']
  31  |     if (!target) throw new Error('必须显式指定本轮新EXE')
  32  |     expect(actual.exe.toLowerCase()).toBe(resolve(target).toLowerCase())
  33  |   }
  34  |   await expect(page.locator('footer')).toContainText('20261029.3-study-goals')
  35  |   expect(
  36  |     withHistoryDatabase(directory, (database) => database.prepare('PRAGMA user_version').get()),
  37  |   ).toEqual({ user_version: 17 })
  38  |   return actual
  39  | }
  40  | export function themeBusinessSnapshot(directory: string) {
  41  |   return {
  42  |     ...historySnapshot(directory),
  43  |     ...withHistoryDatabase(directory, (database) =>
  44  |       Object.fromEntries(
  45  |         ['topics', 'categories', 'practice_plans', 'import_receipts', 'library_meta'].map(
  46  |           (table) => [table, database.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()],
  47  |         ),
  48  |       ),
  49  |     ),
  50  |   }
  51  | }
  52  | export async function previewThemeFile(application: ElectronApplication, page: Page, file: string) {
  53  |   await openPage(page, '设置与数据')
  54  |   await application.evaluate(({ dialog }, file) => {
  55  |     dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [file] })
  56  |   }, file)
  57  |   await page.getByRole('button', { name: '安装本地主题…', exact: true }).click()
  58  |   await expect(page.getByLabel('主题安装预览', { exact: true })).toBeVisible()
  59  | }
  60  | export async function installThemeFile(
  61  |   application: ElectronApplication,
  62  |   page: Page,
  63  |   file: string,
  64  |   action = '确认安装主题',
  65  | ) {
  66  |   await previewThemeFile(application, page, file)
  67  |   await page.getByRole('button', { name: action, exact: true }).click()
  68  |   await expect(
  69  |     page.getByText('主题已安装并核对。请选择主题后保存并应用；安装不会自动改变当前外观。', {
  70  |       exact: true,
  71  |     }),
  72  |   ).toBeVisible()
  73  | }
  74  | export async function chooseTheme(page: Page, name: string, mode = 'light', fontSize = 17) {
  75  |   await openPage(page, '设置与数据')
> 76  |   await page.getByRole('radio', { name, exact: true }).check()
      |                                                        ^ TimeoutError: locator.check: Timeout 30000ms exceeded.
  77  |   await page.getByLabel('显示主题', { exact: true }).selectOption(mode)
  78  |   await page.getByLabel('正文字号', { exact: true }).selectOption(String(fontSize))
  79  |   await page.getByRole('button', { name: '保存并应用', exact: true }).click()
  80  |   await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
  81  | }
  82  | export async function readThemes(page: Page) {
  83  |   const result = await page.evaluate(() =>
  84  |     (globalThis as unknown as { desktop: DesktopApi }).desktop.themes.list(),
  85  |   )
  86  |   if (!result.ok) throw new Error(result.error.message)
  87  |   return result.value
  88  | }
  89  | export async function readAppearance(page: Page) {
  90  |   const result = await page.evaluate(() =>
  91  |     (globalThis as unknown as { desktop: DesktopApi }).desktop.settings.read(),
  92  |   )
  93  |   if (!result.ok) throw new Error(result.error.message)
  94  |   return result.value
  95  | }
  96  | export async function closeNormally(application: ElectronApplication) {
  97  |   const closed = application.waitForEvent('close')
  98  |   await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.close())
  99  |   await closed
  100 | }
  101 | 
```