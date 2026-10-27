import { copyFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { ElectronApplication } from '@playwright/test'
import { expect, launchApplication, openPage, test } from './helpers'
import { beginHistoryPractice, prepareHistory, stop, withHistoryDatabase } from './history-helpers'
import {
  chooseTheme,
  closeNormally,
  installThemeFile,
  readAppearance,
  themeBusinessSnapshot,
  verifyThemeTarget,
} from './theme-helpers'

function themeRows(database: DatabaseSync) {
  return database.prepare('SELECT * FROM installed_themes ORDER BY theme_id').all()
}

test('完整备份将两个主题/当前外观/布局偏好/旧队列恢复到独立空目录，坏主题备份不覆盖数据', async ({
  testDataDirectory,
}, info) => {
  const initial = await prepareHistory(testDataDirectory, info.project.name)
  const opened: ElectronApplication[] = [initial.application]
  const restoredDirectory = await mkdtemp(join(tmpdir(), 'embedded-practice-theme-restore-'))
  let completed = false
  try {
    await verifyThemeTarget(initial.application, initial.page, testDataDirectory, info.project.name)
    await installThemeFile(
      initial.application,
      initial.page,
      resolve('themes/examples/paper-ink.ep-theme.json'),
    )
    await installThemeFile(
      initial.application,
      initial.page,
      resolve('themes/examples/circuit-blue.ep-theme.json'),
    )
    await chooseTheme(initial.page, '电路夜航', 'dark', 22)
    await beginHistoryPractice(initial.page)
    const draft = '恢复主题与本轮队列\n    keep_backup_theme();'
    await initial.page.getByRole('textbox', { name: '我的答案', exact: true }).fill(draft)
    await initial.page.getByRole('button', { name: '隐藏辅助面板', exact: true }).click()
    await initial.page.getByRole('button', { name: '收起导航', exact: true }).click()
    await initial.page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
    const business = themeBusinessSnapshot(testDataDirectory)
    const themes = withHistoryDatabase(testDataDirectory, themeRows)
    const appearance = await readAppearance(initial.page)
    expect(appearance).toMatchObject({
      themeId: 'local.circuit-blue',
      auxiliaryHidden: true,
      navigationCollapsed: true,
    })
    await openPage(initial.page, '备份恢复')
    const backupPath = info.outputPath('含多主题完整备份.sqlite3')
    await initial.application.evaluate(({ dialog }, path) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: path })
    }, backupPath)
    await initial.page.getByRole('button', { name: '导出完整备份', exact: true }).click()
    await expect(initial.page.getByText('完整备份已导出并校验。', { exact: true })).toBeVisible()
    const backup = new DatabaseSync(backupPath, { readOnly: true })
    try {
      expect(themeRows(backup)).toEqual(themes)
      expect(backup.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }])
    } finally {
      backup.close()
    }
    const badPath = info.outputPath('损坏主题备份.sqlite3')
    await copyFile(backupPath, badPath)
    const damaged = new DatabaseSync(badPath)
    try {
      damaged.exec("UPDATE installed_themes SET config_json='{' WHERE theme_id='local.paper-ink'")
    } finally {
      damaged.close()
    }
    await initial.application.evaluate(({ dialog }, path) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
    }, badPath)
    await initial.page.getByRole('button', { name: '选择备份并预览', exact: true }).click()
    await expect(initial.page.getByRole('alert')).toContainText('主题配置损坏')
    expect(themeBusinessSnapshot(testDataDirectory)).toEqual(business)
    expect(withHistoryDatabase(testDataDirectory, themeRows)).toEqual(themes)
    await closeNormally(initial.application)
    const empty = await launchApplication(restoredDirectory, info.project.name, '备份恢复')
    opened.push(empty.application)
    await verifyThemeTarget(empty.application, empty.page, restoredDirectory, info.project.name)
    expect(themeBusinessSnapshot(restoredDirectory).questions).toEqual([])
    await empty.application.evaluate(({ app, dialog }, path) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
      dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false })
      // 数据替换真实执行；自动relaunch由既有完整恢复回归另验，本专项手动连接新进程核对。
      app.relaunch = () => {}
    }, backupPath)
    await empty.page.getByRole('button', { name: '选择备份并预览', exact: true }).click()
    const summary = empty.page.getByLabel('恢复预览摘要', { exact: true })
    await expect(summary).toContainText('local.circuit-blue')
    await expect(summary.locator('.count-grid div').filter({ hasText: '已安装主题' })).toHaveText(
      '已安装主题2',
    )
    const exited = empty.application.waitForEvent('close')
    await empty.page.getByRole('button', { name: '恢复此备份…', exact: true }).click()
    await exited
    const next = await launchApplication(restoredDirectory, info.project.name)
    opened.push(next.application)
    await verifyThemeTarget(next.application, next.page, restoredDirectory, info.project.name)
    expect(await readAppearance(next.page)).toEqual(appearance)
    expect(withHistoryDatabase(restoredDirectory, themeRows)).toEqual(themes)
    expect(themeBusinessSnapshot(restoredDirectory)).toEqual(business)
    await expect(next.page.locator('html')).toHaveAttribute('data-theme-id', 'local.circuit-blue')
    await next.page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(next.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      draft,
    )
    await expect(next.page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
    await info.attach('theme-restore.json', {
      body: JSON.stringify({
        source: testDataDirectory,
        restored: restoredDirectory,
        appearance,
        themes,
        business,
      }),
      contentType: 'application/json',
    })
    completed = true
  } finally {
    for (const application of opened) await stop(application)
    if (
      dirname(resolve(restoredDirectory)) !== resolve(tmpdir()) ||
      !basename(restoredDirectory).startsWith('embedded-practice-theme-restore-')
    )
      throw new Error('拒绝清理非本次恢复目录')
    if (completed)
      await rm(restoredDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
    else
      await info.attach('theme-restore-failed-directory.txt', {
        body: restoredDirectory,
        contentType: 'text/plain',
      })
  }
})
