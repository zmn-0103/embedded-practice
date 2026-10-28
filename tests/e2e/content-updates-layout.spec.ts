import { writeFile } from 'node:fs/promises'
import { expect, test } from './helpers'
import { captureHistory, importHistoryFiles, stop } from './history-helpers'
import { prepareUpdates, selectUpdateQuestion, updatesBank } from './content-updates-helpers'
import { chooseTheme } from './theme-helpers'
import { noWorkbenchOverflow } from './workbench-helpers'

for (const layout of [
  { width: 1440, zoom: 1, mode: 'light', theme: '松间绿' },
  { width: 900, zoom: 1.25, mode: 'dark', theme: '暖沙金' },
  { width: 1200, zoom: 1.5, mode: 'dark', theme: 'Claude 风格' },
]) {
  test(`内容差异和更新选题在${layout.width}px/${layout.zoom * 100}%/22px/${layout.theme}可读可操作`, async ({
    testDataDirectory,
  }, info) => {
    const { application, page, file } = await prepareUpdates(testDataDirectory, info)
    try {
      await writeFile(
        file,
        updatesBank(3).replace(
          'int step = 3;',
          'int step = 3; // ' + 'dma_transfer_complete();'.repeat(50),
        ),
      )
      await importHistoryFiles(application, page, [file])
      await chooseTheme(page, layout.theme, layout.mode, 22)
      await application.evaluate(({ BrowserWindow }, layout) => {
        const window = BrowserWindow.getAllWindows()[0]!
        window.setContentSize(layout.width, 900)
        window.webContents.setZoomFactor(layout.zoom)
      }, layout)
      const panel = await selectUpdateQuestion(page)
      await panel.locator('summary').first().click()
      await expect(panel.getByRole('radio', { name: '对照内容版本2', exact: true })).toBeChecked()
      const question = panel.getByLabel('题干内容差异', { exact: true })
      await expect(question).toContainText('UPDATES-BODY-3-1')
      await question
        .getByRole('heading', { name: '题干内容差异', exact: true })
        .scrollIntoViewIfNeeded()
      await captureHistory(application, page, info, 'content-updates-layout-question.png')
      await question.locator('.content-version-previews > summary').click()
      const columns = question.locator('.content-preview-columns')
      const box = await columns.boundingBox()
      const old = await columns.locator(':scope > section').nth(0).boundingBox()
      const target = await columns.locator(':scope > section').nth(1).boundingBox()
      expect(box).not.toBeNull()
      expect(old).not.toBeNull()
      expect(target).not.toBeNull()
      if (box!.width < 640) expect(target!.y).toBeGreaterThan(old!.y)
      await noWorkbenchOverflow(page)
      const answer = panel.getByRole('button', { name: '查看参考答案变化', exact: true })
      await answer.scrollIntoViewIfNeeded()
      await expect(answer).toBeInViewport()
      await answer.click()
      await expect(panel.getByLabel('参考答案内容差异', { exact: true })).toContainText(
        'UPDATES-ANSWER-3-1',
      )
      await panel.getByRole('radio', { name: '对照内容版本1', exact: true }).check()
      await expect(panel.getByLabel('参考答案内容差异', { exact: true })).toHaveCount(0)
      const back = page.getByRole('button', { name: '返回题目列表', exact: true })
      if (await back.isVisible()) await back.click()
      await page.getByRole('checkbox', { name: /^勾选题目：control-a \/ q-1 / }).check()
      await page.locator('.question-selection-panel > summary').click()
      await page.getByRole('button', { name: '复习勾选中的更新题…', exact: true }).click()
      const start = page.getByRole('button', { name: '确认开始更新题复习（1题）', exact: true })
      await expect(start).toBeEnabled()
      await start.scrollIntoViewIfNeeded()
      await expect(start).toBeInViewport()
      await noWorkbenchOverflow(page)
      await captureHistory(application, page, info, 'content-updates-layout-selection.png')
    } finally {
      await stop(application)
    }
  })
}
