import { writeFile } from 'node:fs/promises'
import { expect, openPage, test } from './helpers'
import { stop, withHistoryDatabase } from './history-helpers'
import { chooseTheme, themeBusinessSnapshot } from './theme-helpers'
import { noWorkbenchOverflow, prepareWorkbench, settleWorkbench } from './workbench-helpers'

const standardLayouts = [
  { width: 1440, font: 17, zoom: 2 },
  { width: 1440, font: 22, zoom: 2 },
  { width: 900, font: 17, zoom: 2 },
  { width: 900, font: 22, zoom: 2 },
  { width: 900, font: 22, zoom: 1.5 },
  { width: 900, font: 22, zoom: 1 },
]
const layouts = [
  ...standardLayouts.map((layout) => ({ ...layout, theme: '松间绿', mode: 'light' })),
  { width: 900, font: 22, zoom: 2, theme: '暖沙金', mode: 'dark' },
  { width: 1440, font: 22, zoom: 2, theme: 'Claude 风格', mode: 'dark' },
]

for (const layout of layouts) {
  test(`第二批缩放：${layout.theme}/${layout.mode}/${layout.width}px/${layout.font}px/${layout.zoom * 100}%`, async ({
    testDataDirectory,
  }, info) => {
    const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
    try {
      const runtime = await application.evaluate(({ app }) => ({
        exe: app.getPath('exe'),
        userData: app.getPath('userData'),
        packaged: app.isPackaged,
        version: app.getVersion(),
      }))
      await chooseTheme(page, layout.theme, layout.mode, layout.font)
      await application.evaluate(({ BrowserWindow }, layout) => {
        const window = BrowserWindow.getAllWindows()[0]!
        window.setContentSize(layout.width, 900)
        window.webContents.setZoomFactor(layout.zoom)
      }, layout)
      await openPage(page, '开始练习')
      await page.getByRole('button', { name: '开始练习', exact: true }).click()
      const input = page.getByRole('textbox', { name: '我的答案', exact: true })
      const draft = Array.from({ length: 40 }, (_, index) => `独立缩放草稿 ${index}`).join('\n')
      await input.fill(draft)
      await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
      await expect(page.getByRole('button', { name: '掌握', exact: true })).toBeEnabled()
      await input.focus()
      await settleWorkbench(page)
      const metrics = await page.locator('.practice-actions').evaluate((bar) => {
        const browser = globalThis as unknown as { innerHeight: number; innerWidth: number }
        const box = bar.getBoundingClientRect()
        const editor = bar.ownerDocument.querySelector('#practice-answer')!.getBoundingClientRect()
        return {
          viewport: { width: browser.innerWidth, height: browser.innerHeight },
          actions: { top: box.top, height: box.height, ratio: box.height / browser.innerHeight },
          input: {
            top: editor.top,
            height: editor.height,
            visible: Math.max(
              0,
              Math.min(editor.bottom, box.top, browser.innerHeight) - Math.max(0, editor.top),
            ),
          },
        }
      })
      await expect(input).toHaveValue(draft)
      expect(metrics.actions.ratio).toBeLessThanOrEqual(0.3)
      expect(metrics.input.height).toBe(200)
      expect(metrics.input.visible).toBeGreaterThanOrEqual(180)
      for (const button of await page.locator('.practice-actions button').all())
        await expect(button).toBeInViewport({ ratio: 1 })
      await noWorkbenchOverflow(page)
      const encoded = await application.evaluate(async ({ BrowserWindow }) =>
        (await BrowserWindow.getAllWindows()[0]!.webContents.capturePage())
          .toPNG()
          .toString('base64'),
      )
      const screenshot = info.outputPath('zoom.png')
      await writeFile(screenshot, Buffer.from(encoded, 'base64'))
      await info.attach('zoom.png', { path: screenshot, contentType: 'image/png' })
      await info.attach('layout.json', {
        body: JSON.stringify({ runtime, layout, metrics }, null, 2),
        contentType: 'application/json',
      })
      const before = themeBusinessSnapshot(testDataDirectory)
      await input.evaluate((element) => Reflect.set(globalThis, '__adaptiveInput', element))
      await application.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0]!.webContents.setZoomFactor(1),
      )
      await settleWorkbench(page)
      await application.evaluate(
        ({ BrowserWindow }, zoom) =>
          BrowserWindow.getAllWindows()[0]!.webContents.setZoomFactor(zoom),
        layout.zoom,
      )
      await settleWorkbench(page)
      expect(
        await input.evaluate((element) => element === Reflect.get(globalThis, '__adaptiveInput')),
      ).toBe(true)
      await expect(input).toHaveValue(draft)
      expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
    } finally {
      await stop(application)
    }
  })
}

test('第二批缩放：200%保存失败时输入保留、重试可见且返回被保护，恢复后仍为原题', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  let fault = false
  try {
    await chooseTheme(page, '暖沙金', 'dark', 22)
    await application.evaluate(({ BrowserWindow }) => {
      const window = BrowserWindow.getAllWindows()[0]!
      window.setContentSize(900, 900)
      window.webContents.setZoomFactor(2)
    })
    await openPage(page, '开始练习')
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER adaptive_draft_fault BEFORE UPDATE OF draft ON practice_items BEGIN SELECT RAISE(ABORT, '独立缩放保存失败'); END",
        ),
      false,
    )
    fault = true
    const input = page.getByRole('textbox', { name: '我的答案', exact: true })
    await input.fill('200%缩放保存失败必须保留的草稿\n    preserve_original_session();')
    await expect(page.locator('.practice-save')).toHaveText('保存失败')
    const retry = page.getByRole('button', { name: '重试保存', exact: true })
    await expect(retry).toBeInViewport({ ratio: 1 })
    await page.getByRole('button', { name: '保存后返回', exact: true }).click()
    await expect(input).toHaveValue(
      '200%缩放保存失败必须保留的草稿\n    preserve_original_session();',
    )
    await expect(page.getByLabel('练习进度', { exact: true })).toContainText('第 1 / 20 题')
    withHistoryDatabase(
      testDataDirectory,
      (db) => db.exec('DROP TRIGGER adaptive_draft_fault'),
      false,
    )
    fault = false
    await retry.click()
    await expect(page.locator('.practice-save')).toHaveText('已保存')
    await expect(input).toHaveValue(
      '200%缩放保存失败必须保留的草稿\n    preserve_original_session();',
    )
    await expect(page.getByRole('button', { name: '查看参考答案', exact: true })).toBeInViewport({
      ratio: 1,
    })
    await noWorkbenchOverflow(page)
  } finally {
    if (fault)
      withHistoryDatabase(
        testDataDirectory,
        (db) => db.exec('DROP TRIGGER adaptive_draft_fault'),
        false,
      )
    await stop(application)
  }
})
