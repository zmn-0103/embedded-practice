import { expect, openPage, test } from './helpers'
import { stop } from './history-helpers'
import { themeBusinessSnapshot } from './theme-helpers'
import { noWorkbenchOverflow, prepareWorkbench, settleWorkbench } from './workbench-helpers'

test('工作台窄窗：详情返回重读失败仍显示错误和重试，隐藏旧结果，原条件与学习数据保持', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  try {
    await page.locator('.question-list button').first().click()
    await expect(page.getByRole('article', { name: '题目内容', exact: true })).toBeVisible()
    await application.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]!.setContentSize(900, 1000),
    )
    await settleWorkbench(page)
    await expect(page.getByRole('button', { name: '返回题目列表', exact: true })).toBeVisible()
    const before = themeBusinessSnapshot(testDataDirectory)
    await openPage(page, '设置与数据')
    await application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:list-questions')
      let failed = false
      ipcMain.removeHandler('library:list-questions')
      ipcMain.handle('library:list-questions', async (event, request) => {
        if (!failed) {
          failed = true
          return {
            ok: false,
            error: { code: 'DATABASE_UNAVAILABLE', message: '工作台窄窗读取失败注入' },
          }
        }
        return original(event, request)
      })
    })
    await openPage(page, '题库')
    await expect(page.getByRole('alert')).toContainText('工作台窄窗读取失败注入')
    await expect(page.getByText('共 25 题', { exact: true })).not.toBeVisible()
    await expect(page.getByText('结果尚未确认', { exact: true })).toBeVisible()
    await expect(page.getByRole('searchbox', { name: '题库搜索', exact: true })).toHaveValue('')
    await expect(page.getByRole('article', { name: '题目内容', exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: '重新读取题库', exact: true }).click()
    await expect(page.getByText('共 25 题', { exact: true })).toBeVisible()
    await expect(page.getByLabel('题目分页', { exact: true })).toContainText('1 / 2')
    await expect(page.getByRole('alert')).toHaveCount(0)
    expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
    await noWorkbenchOverflow(page)
  } finally {
    await stop(application)
  }
})
