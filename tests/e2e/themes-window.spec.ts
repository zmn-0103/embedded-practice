import { copyFile, unlink, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { ElectronApplication } from '@playwright/test'
import { expect, launchApplication, openPage, test } from './helpers'
import { beginHistoryPractice, prepareHistory, stop, withHistoryDatabase } from './history-helpers'
import {
  chooseTheme,
  closeNormally,
  exampleTheme,
  installThemeFile,
  previewThemeFile,
  readAppearance,
  readThemes,
  themeBusinessSnapshot,
  verifyThemeTarget,
} from './theme-helpers'

test('两个外部主题独立预览/安装/应用，源文件删除后重开、版本更新与卸载均保留学习记录', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  let reopened: ElectronApplication | undefined
  try {
    await verifyThemeTarget(application, page, testDataDirectory, info.project.name)
    await page.emulateMedia({ colorScheme: 'light' })
    const before = themeBusinessSnapshot(testDataDirectory)
    const paper = join(testDataDirectory, '纸页.ep-theme.json'),
      blue = join(testDataDirectory, '夜航.ep-theme.json')
    await copyFile(resolve('themes/examples/paper-ink.ep-theme.json'), paper)
    await copyFile(resolve('themes/examples/circuit-blue.ep-theme.json'), blue)
    await previewThemeFile(application, page, paper)
    await expect(page.getByLabel('待安装主题局部预览', { exact: true })).toHaveCSS(
      'background-color',
      'rgb(245, 241, 232)',
    )
    await expect(page.locator('html')).toHaveAttribute('data-theme-id', 'builtin.forest')
    expect((await readThemes(page)).entries).toHaveLength(5)
    await page.getByRole('button', { name: '取消安装预览', exact: true }).click()
    await installThemeFile(application, page, paper)
    await installThemeFile(application, page, blue)
    expect((await readThemes(page)).entries.filter((entry) => !entry.builtIn)).toHaveLength(2)
    await expect(page.locator('html')).toHaveAttribute('data-theme-id', 'builtin.forest')
    await chooseTheme(page, '电路夜航', 'light', 15)
    await expect(page.locator('html')).toHaveAttribute('data-layout', 'study')
    await chooseTheme(page, '纸页墨色', 'dark', 22)
    await unlink(paper)
    await unlink(blue)
    expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
    await closeNormally(application)
    const next = await launchApplication(testDataDirectory, info.project.name)
    reopened = next.application
    await verifyThemeTarget(next.application, next.page, testDataDirectory, info.project.name)
    await expect(next.page.locator('html')).toHaveAttribute('data-theme-id', 'local.paper-ink')
    await expect(next.page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(next.page.locator('html')).toHaveAttribute('data-font-size', '22')
    const updated = { ...(await exampleTheme()), version: '1.1.0' }
    updated.dark = { ...updated.dark, background: '#26221c' }
    await writeFile(paper, JSON.stringify(updated))
    await installThemeFile(next.application, next.page, paper, '确认更新主题')
    await expect(next.page.locator('html')).toHaveCSS('background-color', 'rgb(33, 31, 27)')
    await chooseTheme(next.page, '纸页墨色', 'dark', 22)
    await expect(next.page.locator('html')).toHaveCSS('background-color', 'rgb(38, 34, 28)')
    await installThemeFile(next.application, next.page, paper, '核对已安装主题')
    for (const definition of [
      { ...updated, name: '同版不同内容' },
      { ...updated, version: '0.9.0' },
      { ...updated, id: 'builtin.forest' },
    ]) {
      await writeFile(paper, JSON.stringify(definition))
      await next.page.getByRole('button', { name: '安装本地主题…', exact: true }).click()
      await expect(next.page.getByRole('alert')).toContainText(/不同|降级|保留标识/)
      expect(
        (await readThemes(next.page)).entries.find((entry) => entry.definition.id === updated.id)
          ?.definition,
      ).toEqual(updated)
    }
    await next.page.getByRole('button', { name: '卸载 纸页墨色', exact: true }).click()
    await expect(
      next.page.getByText('这是当前主题，卸载后将切换到内置松间绿。', { exact: false }),
    ).toBeVisible()
    await next.page.getByRole('button', { name: '取消卸载', exact: true }).click()
    expect((await readAppearance(next.page)).themeId).toBe('local.paper-ink')
    await next.page.getByRole('button', { name: '卸载 纸页墨色', exact: true }).click()
    await next.page.getByRole('button', { name: '确认卸载主题', exact: true }).click()
    await expect(next.page.locator('html')).toHaveAttribute('data-theme-id', 'builtin.forest')
    expect((await readAppearance(next.page)).themeId).toBe('builtin.forest')
    expect((await readThemes(next.page)).entries.filter((entry) => !entry.builtIn)).toHaveLength(1)
    expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
  } finally {
    await stop(application)
    if (reopened) await stop(reopened)
  }
})

test('练习中跨布局切换、导航折叠与辅助隐藏保持同一输入/队列/答案边界，正常退出重开保留偏好和最后草稿', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  let reopened: ElectronApplication | undefined
  try {
    await verifyThemeTarget(application, page, testDataDirectory, info.project.name)
    await beginHistoryPractice(page)
    const editor = page.getByRole('textbox', { name: '我的答案', exact: true })
    const draft = '主题切换保持同一练习\n    uint8_t retained = 1;'
    await editor.fill(draft)
    await expect(page.locator('.practice-save')).toHaveText('已保存')
    await editor.evaluate((element) => Reflect.set(element, 'themeIdentityProbe', 'same-editor'))
    const before = themeBusinessSnapshot(testDataDirectory)
    await page.locator('.quick-appearance summary').click()
    for (const id of ['builtin.claude', 'builtin.ocean', 'builtin.claude']) {
      await page.getByLabel('快捷主题选择', { exact: true }).selectOption(id)
      const apply = page.getByRole('button', { name: '应用所选主题', exact: true })
      await apply.click()
      await expect(page.locator('html')).toHaveAttribute('data-theme-id', id)
      await expect(apply).toBeFocused()
      await expect(editor).toHaveValue(draft)
      expect(await editor.evaluate((element) => Reflect.get(element, 'themeIdentityProbe'))).toBe(
        'same-editor',
      )
      await expect(page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
      expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
    }
    const libraryLink = page
      .getByRole('navigation', { name: '主要页面', exact: true })
      .getByRole('link', { name: '题库', exact: true })
    await expect(libraryLink).toHaveAttribute('aria-disabled', 'true')
    await libraryLink.dispatchEvent('click')
    await expect(editor).toBeVisible()
    await page.getByRole('button', { name: '收起导航', exact: true }).click()
    await expect(page.getByRole('button', { name: '展开导航', exact: true })).toBeFocused()
    await expect(page.locator('html')).toHaveAttribute('data-navigation-collapsed', 'true')
    await page.getByRole('button', { name: '隐藏辅助面板', exact: true }).click()
    await expect(page.getByLabel('练习辅助面板', { exact: true })).toBeHidden()
    expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
    await expect(editor).toHaveValue(draft)
    const finalDraft = draft + '\n关闭前最后输入'
    await editor.fill(finalDraft)
    await closeNormally(application)
    const next = await launchApplication(testDataDirectory, info.project.name)
    reopened = next.application
    await expect(next.page.locator('html')).toHaveAttribute('data-theme-id', 'builtin.claude')
    expect(await readAppearance(next.page)).toMatchObject({
      navigationCollapsed: true,
      auxiliaryHidden: true,
    })
    await next.page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(next.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      finalDraft,
    )
    await expect(next.page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
  } finally {
    await stop(application)
    if (reopened) await stop(reopened)
  }
})

test('安装写入失败与提交后响应丢失均保留请求，原操作重试安全且外观不提前应用', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  try {
    const before = themeBusinessSnapshot(testDataDirectory)
    await previewThemeFile(application, page, resolve('themes/examples/paper-ink.ep-theme.json'))
    withHistoryDatabase(
      testDataDirectory,
      (database) =>
        database.exec(
          "CREATE TRIGGER fail_theme_install BEFORE INSERT ON installed_themes BEGIN SELECT RAISE(ABORT,'injected'); END",
        ),
      false,
    )
    await page.getByRole('button', { name: '确认安装主题', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('题库服务暂不可用')
    expect((await readThemes(page)).entries).toHaveLength(5)
    withHistoryDatabase(
      testDataDirectory,
      (database) => database.exec('DROP TRIGGER fail_theme_install'),
      false,
    )
    await application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('themes:install')
      let lost = false
      ipcMain.removeHandler('themes:install')
      ipcMain.handle('themes:install', async (...args) => {
        const result = await original(...args)
        if (!lost && result.ok) {
          lost = true
          return undefined
        }
        return result
      })
    })
    await page.getByRole('button', { name: '重试原主题操作', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('主题操作结果尚未确认')
    expect((await readThemes(page)).entries.filter((entry) => !entry.builtIn)).toHaveLength(1)
    await expect(page.locator('html')).toHaveAttribute('data-theme-id', 'builtin.forest')
    await page.getByRole('button', { name: '重试原主题操作', exact: true }).click()
    await expect(
      page.getByText('主题已安装并核对。请选择主题后保存并应用；安装不会自动改变当前外观。', {
        exact: true,
      }),
    ).toBeVisible()
    expect((await readThemes(page)).entries.filter((entry) => !entry.builtIn)).toHaveLength(1)
    expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
  } finally {
    await stop(application)
  }
})

test('当前外部配置损坏临时回退并保留原选择，恢复默认仅改变显示设置', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  let reopened: ElectronApplication | undefined
  try {
    await installThemeFile(application, page, resolve('themes/examples/paper-ink.ep-theme.json'))
    await chooseTheme(page, '纸页墨色')
    const before = themeBusinessSnapshot(testDataDirectory)
    await closeNormally(application)
    withHistoryDatabase(
      testDataDirectory,
      (database) =>
        database.exec(
          "UPDATE installed_themes SET config_json='{' WHERE theme_id='local.paper-ink'",
        ),
      false,
    )
    const next = await launchApplication(testDataDirectory, info.project.name)
    reopened = next.application
    await expect(next.page.getByRole('alert')).toContainText('当前临时使用松间绿')
    await expect(next.page.locator('html')).toHaveAttribute('data-theme-id', 'builtin.forest')
    expect((await readAppearance(next.page)).themeId).toBe('local.paper-ink')
    expect((await readThemes(next.page)).issues).toEqual([
      { id: 'local.paper-ink', message: '主题配置损坏，已暂时停用。请卸载后重新安装。' },
    ])
    await openPage(next.page, '设置与数据')
    await next.page.getByRole('button', { name: '恢复默认外观', exact: true }).click()
    expect(await readAppearance(next.page)).toEqual({
      themeId: 'builtin.forest',
      palette: 'forest',
      theme: 'system',
      fontSize: 17,
      navigationCollapsed: false,
      auxiliaryHidden: false,
    })
    expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
  } finally {
    await stop(application)
    if (reopened) await stop(reopened)
  }
})

test('主题数据库读取失败明确报错，不伪造空目录或默认成功，修复后可重新读取', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  try {
    await chooseTheme(page, '晴空蓝', 'dark', 22)
    const before = themeBusinessSnapshot(testDataDirectory)
    const ddl = withHistoryDatabase(
      testDataDirectory,
      (database) => {
        const row = database
          .prepare("SELECT sql FROM sqlite_schema WHERE name='installed_themes'")
          .get() as { sql: string }
        database.exec('DROP TABLE installed_themes')
        return row.sql
      },
      false,
    )
    await page.reload()
    await expect(page.getByRole('alert')).toContainText('题库服务暂不可用')
    await openPage(page, '设置与数据')
    await expect(page.getByRole('radio')).toHaveCount(0)
    await expect(page.getByRole('button', { name: '保存并应用', exact: true })).toHaveCount(0)
    withHistoryDatabase(testDataDirectory, (database) => database.exec(ddl), false)
    await page.getByRole('button', { name: '重试读取显示设置', exact: true }).click()
    await expect(page.getByRole('radio', { name: '晴空蓝', exact: true })).toBeChecked()
    await expect(page.locator('html')).toHaveAttribute('data-theme-id', 'builtin.ocean')
    expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
  } finally {
    await stop(application)
  }
})
