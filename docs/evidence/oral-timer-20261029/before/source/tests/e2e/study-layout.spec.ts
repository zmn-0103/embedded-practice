import { expect, openPage, test } from './helpers'
import { captureHistory, stop } from './history-helpers'
import { a, createStudyRound, openLibraryNote, prepareStudy } from './study-helpers'
import { chooseTheme } from './theme-helpers'
import { noWorkbenchOverflow } from './workbench-helpers'

for (const layout of [
  { width: 1440, zoom: 1, mode: 'light', theme: '松间绿' },
  { width: 900, zoom: 1.25, mode: 'dark', theme: '暖沙金' },
  { width: 1200, zoom: 1.5, mode: 'dark', theme: 'Claude 风格' },
]) {
  test(`笔记/作答对照/轮次与导出在${layout.width}px/${layout.zoom * 100}%/22px/${layout.theme}可读可操作`, async ({
    testDataDirectory,
  }, info) => {
    const { application, page } = await prepareStudy(testDataDirectory, info)
    try {
      await createStudyRound(page, '第一次作答：数据搬运完成\n' + '说明'.repeat(90), [a(1)])
      await createStudyRound(page, '第二次作答：区分传输完成与发送完成\n' + '补充'.repeat(90), [
        a(1),
      ])
      await chooseTheme(page, layout.theme, layout.mode, 22)
      await application.evaluate(({ BrowserWindow }, layout) => {
        const window = BrowserWindow.getAllWindows()[0]!
        window.setContentSize(layout.width, 900)
        window.webContents.setZoomFactor(layout.zoom)
      }, layout)
      await openPage(page, '题库')
      const note = await openLibraryNote(page)
      const input = note.getByRole('textbox', { name: '我的复习笔记', exact: true })
      await input.fill('区分数据到达的位置。\n```c\n' + 'dma_complete();'.repeat(35) + '\n```')
      await note.getByRole('button', { name: '立即保存笔记', exact: true }).click()
      await expect(note.locator('summary')).toContainText('已保存')
      await expect(input).toBeEditable()
      await noWorkbenchOverflow(page)
      await input.scrollIntoViewIfNeeded()
      await expect(input).toBeInViewport()
      await captureHistory(application, page, info, 'study-note.png')
      await page.getByRole('button', { name: '查看本题历史', exact: true }).click()
      const history = page.getByRole('region', { name: '本题历史', exact: true })
      const choices = history.getByRole('checkbox', { name: /^选入作答对照/ })
      await choices.nth(0).check()
      await choices.nth(1).check()
      await history.getByRole('button', { name: '对照这两次作答', exact: true }).click()
      const comparison = history.getByLabel('两次作答对照', { exact: true })
      await expect(comparison).toContainText('第二次作答')
      await expect(comparison).toContainText('第一次作答')
      const columns = comparison.locator('.answer-comparison-columns')
      const container = await columns.boundingBox()
      const first = await columns.locator(':scope > section').nth(0).boundingBox()
      const second = await columns.locator(':scope > section').nth(1).boundingBox()
      expect(container).not.toBeNull()
      expect(first).not.toBeNull()
      expect(second).not.toBeNull()
      if (container!.width < 600) expect(second!.y).toBeGreaterThan(first!.y)
      await noWorkbenchOverflow(page)
      await comparison.scrollIntoViewIfNeeded()
      await captureHistory(application, page, info, 'study-comparison.png')
      await openPage(page, '学习记录')
      await page.getByRole('tab', { name: '按轮次复盘', exact: true }).click()
      await page.getByRole('button', { name: '查看这一轮', exact: true }).first().click()
      const detail = page.getByLabel('按轮次复盘详情', { exact: true })
      const exporter = detail.locator('.material-export')
      await exporter.locator('summary').click()
      await exporter.getByLabel('复习材料包含内容').selectOption('personal')
      const exportButton = exporter.getByRole('button', {
        name: '确认范围与内容并选择保存位置…',
        exact: true,
      })
      await expect(exportButton).toBeEnabled()
      await noWorkbenchOverflow(page)
      await exportButton.scrollIntoViewIfNeeded()
      await expect(exportButton).toBeInViewport()
      await captureHistory(application, page, info, 'study-round-export.png')
    } finally {
      await stop(application)
    }
  })
}
