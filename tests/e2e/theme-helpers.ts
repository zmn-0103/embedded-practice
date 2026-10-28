import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { ElectronApplication, Page } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { themeDefinitionSchema } from '../../src/shared/contracts/themes'
import { expect, openPage } from './helpers'
import { historySnapshot, withHistoryDatabase } from './history-helpers'

export async function exampleTheme(name = 'paper-ink') {
  return themeDefinitionSchema.parse(
    JSON.parse(await readFile(`themes/examples/${name}.ep-theme.json`, 'utf8')),
  )
}
export async function verifyThemeTarget(
  application: ElectronApplication,
  page: Page,
  directory: string,
  project: string,
) {
  const actual = await application.evaluate(({ app }) => ({
    exe: app.getPath('exe'),
    userData: app.getPath('userData'),
    packaged: app.isPackaged,
    version: app.getVersion(),
  }))
  expect(actual.userData).toBe(directory)
  expect(actual.packaged).toBe(project === 'packaged')
  expect(actual.version).toBe(project === 'packaged' ? '0.0.2' : '42.11.15')
  if (project === 'packaged') {
    const target = process.env['EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE']
    if (!target) throw new Error('必须显式指定本轮新EXE')
    expect(actual.exe.toLowerCase()).toBe(resolve(target).toLowerCase())
  }
  await expect(page.locator('footer')).toContainText('20261028.2-note-favorite-fix')
  expect(
    withHistoryDatabase(directory, (database) => database.prepare('PRAGMA user_version').get()),
  ).toEqual({ user_version: 13 })
  return actual
}
export function themeBusinessSnapshot(directory: string) {
  return {
    ...historySnapshot(directory),
    ...withHistoryDatabase(directory, (database) =>
      Object.fromEntries(
        ['topics', 'categories', 'practice_plans', 'import_receipts', 'library_meta'].map(
          (table) => [table, database.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()],
        ),
      ),
    ),
  }
}
export async function previewThemeFile(application: ElectronApplication, page: Page, file: string) {
  await openPage(page, '设置与数据')
  await application.evaluate(({ dialog }, file) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [file] })
  }, file)
  await page.getByRole('button', { name: '安装本地主题…', exact: true }).click()
  await expect(page.getByLabel('主题安装预览', { exact: true })).toBeVisible()
}
export async function installThemeFile(
  application: ElectronApplication,
  page: Page,
  file: string,
  action = '确认安装主题',
) {
  await previewThemeFile(application, page, file)
  await page.getByRole('button', { name: action, exact: true }).click()
  await expect(
    page.getByText('主题已安装并核对。请选择主题后保存并应用；安装不会自动改变当前外观。', {
      exact: true,
    }),
  ).toBeVisible()
}
export async function chooseTheme(page: Page, name: string, mode = 'light', fontSize = 17) {
  await openPage(page, '设置与数据')
  await page.getByRole('radio', { name, exact: true }).check()
  await page.getByLabel('显示主题', { exact: true }).selectOption(mode)
  await page.getByLabel('正文字号', { exact: true }).selectOption(String(fontSize))
  await page.getByRole('button', { name: '保存并应用', exact: true }).click()
  await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
}
export async function readThemes(page: Page) {
  const result = await page.evaluate(() =>
    (globalThis as unknown as { desktop: DesktopApi }).desktop.themes.list(),
  )
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}
export async function readAppearance(page: Page) {
  const result = await page.evaluate(() =>
    (globalThis as unknown as { desktop: DesktopApi }).desktop.settings.read(),
  )
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}
export async function closeNormally(application: ElectronApplication) {
  const closed = application.waitForEvent('close')
  await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.close())
  await closed
}
