import { resolve } from 'node:path'
import { expect, launchApplication, openPage, test } from '../../tests/e2e/helpers'
import { installThemeFile, previewThemeFile } from '../../tests/e2e/theme-helpers'
import { openPlans, readPlans, savePlan } from '../../tests/e2e/practice-plan-helpers'

test('新增修改：主题确定性拒绝后仍可取消和卸载', async ({ testDataDirectory }) => {
  const { application, page } = await launchApplication(testDataDirectory, 'development')
  try {
    await installThemeFile(application, page, resolve('themes/examples/paper-ink.ep-theme.json'))
    await previewThemeFile(application, page, resolve('themes/examples/circuit-blue.ep-theme.json'))
    await application.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('themes:install')
      ipcMain.handle('themes:install', () => ({ ok: false, error: { code: 'THEME_LIMIT', message: '审核注入：请先卸载一个主题' } }))
    })
    await page.getByRole('button', { name: '确认安装主题', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('审核注入')
    await expect(page.getByRole('button', { name: '重试原主题操作', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: '安装本地主题…', exact: true })).toBeEnabled()
    await page.getByRole('button', { name: '取消安装预览', exact: true }).click()
    await page.getByRole('button', { name: '卸载 纸页墨色', exact: true }).click()
    await page.getByRole('button', { name: '确认卸载主题', exact: true }).click()
    await expect(page.getByText('主题已卸载并核对。当前主题被卸载时已切换到松间绿。', { exact: true })).toBeVisible()
  } finally { await application.close() }
})

test('新增修改：方案ASCII重名预检且非ASCII名称保持独立', async ({ testDataDirectory }) => {
  const { application, page } = await launchApplication(testDataDirectory, 'development')
  try {
    await savePlan(page, 'PlanA')
    const panel = await openPlans(page)
    await panel.getByLabel('方案名称', { exact: true }).fill(' pLANA ')
    await expect(panel.getByRole('button', { name: '保存当前条件为方案', exact: true })).toBeDisabled()
    await savePlan(page, 'Ä')
    await panel.getByLabel('方案名称', { exact: true }).fill('ä')
    await expect(panel.getByRole('button', { name: '保存当前条件为方案', exact: true })).toBeEnabled()
    await savePlan(page, 'ä')
    expect((await readPlans(page)).map((plan) => plan.name).sort()).toEqual(['PlanA', 'Ä', 'ä'].sort())
  } finally { await application.close() }
})

test('新增修改：已读空库后失败可见且能够重试', async ({ testDataDirectory }) => {
  const { application, page } = await launchApplication(testDataDirectory, 'development', '题库')
  try {
    await expect(page.getByRole('heading', { name: '题库尚未导入', exact: true })).toBeVisible()
    await application.evaluate(({ ipcMain }) => {
      const channel = 'library:list-questions'
      const original = Reflect.get(ipcMain, '_invokeHandlers').get(channel)
      if (!original) throw new Error('未找到题库读取入口')
      ipcMain.removeHandler(channel)
      ipcMain.handle(channel, (...args) => {
        ipcMain.removeHandler(channel)
        ipcMain.handle(channel, original)
        return { ok: false, error: { code: 'DATABASE_UNAVAILABLE', message: '审核注入空库读取失败' } }
      })
    })
    await openPage(page, '学习总览')
    await openPage(page, '题库')
    await expect(page.getByRole('alert')).toContainText('审核注入空库读取失败')
    await page.getByRole('button', { name: '重新读取题库', exact: true }).click()
    await expect(page.getByRole('alert')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: '题库尚未导入', exact: true })).toBeVisible()
  } finally { await application.close() }
})

test('新增修改：恢复发布与回退错误均记录且原文件可恢复', async ({ testDataDirectory }, info) => {
  const { application } = await launchApplication(testDataDirectory, 'development')
  try {
    const result = await application.evaluate(async ({ app }) => {
      const fs = process.getBuiltinModule('node:fs/promises')
      const path = process.getBuiltinModule('node:path')
      const load = process.getBuiltinModule('node:module').createRequire(path.join(app.getAppPath(), 'review.cjs'))
      const practice = load(path.join(app.getAppPath(), 'practice.js'))
      const restore = load(path.join(app.getAppPath(), 'restore-files.js'))
      const root = path.join(app.getPath('userData'), 'isolated-replacement')
      await fs.mkdir(root)
      const target = path.join(root, 'practice.sqlite3'), candidate = path.join(root, 'source.sqlite3')
      const database = await practice.openPracticeDatabase(target)
      await database.backup(candidate)
      database.close()
      const before = await restore.hashBackupFile(target)
      const logs: string[] = []
      const original = fs.rename
      let code: string | undefined
      fs.rename = (async (...args: any[]) => {
        if (String(args[0]).endsWith('candidate.sqlite3')) throw Object.assign(new Error('审核发布失败'), { code: 'EPERM' })
        if (String(args[0]).endsWith('original.sqlite3')) throw Object.assign(new Error('审核回退失败'), { code: 'EACCES' })
        return (original as any)(...args)
      }) as any
      try {
        await restore.replaceDatabase(target, candidate, await restore.hashBackupFile(candidate), (error: Error) => logs.push(error.message))
      } catch (error) { code = (error as any).code }
      finally { fs.rename = original }
      const files = await fs.readdir(path.join(root, 'restore-transaction'))
      const recovered = await restore.recoverDatabaseReplacement(target)
      return { code, logs, files, recovered, originalRetained: before === await restore.hashBackupFile(target) }
    })
    expect(result.code).toBe('RECOVERY_FAILED')
    expect(result.logs).toEqual(['恢复替换失败：审核发布失败（系统码 EPERM）', '恢复回退失败：审核回退失败（系统码 EACCES）'])
    expect(result.files).toContain('original.sqlite3')
    expect(result.recovered).toBe('rolled-back')
    expect(result.originalRetained).toBe(true)
    await info.attach('replacement-diagnostics.json', { body: JSON.stringify(result), contentType: 'application/json' })
  } finally { await application.close() }
})
