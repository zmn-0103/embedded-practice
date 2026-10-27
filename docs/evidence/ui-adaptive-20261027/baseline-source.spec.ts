import { writeFile } from 'node:fs/promises'
import { expect, openPage, test } from './helpers'
import { stop } from './history-helpers'
import { chooseTheme } from './theme-helpers'
import { noWorkbenchOverflow, prepareWorkbench, settleWorkbench } from './workbench-helpers'

const layouts = [
  { width: 1440, font: 17, zoom: 2 },
  { width: 1440, font: 22, zoom: 2 },
  { width: 900, font: 17, zoom: 2 },
  { width: 900, font: 22, zoom: 2 },
  { width: 900, font: 22, zoom: 1.5 },
  { width: 900, font: 22, zoom: 1 },
]

for (const layout of layouts) {
  test(`第二批缩放基线：${layout.width}px/${layout.font}px/${layout.zoom * 100}%`, async ({
    testDataDirectory,
  }, info) => {
    const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
    try {
      await chooseTheme(page, '松间绿', 'light', layout.font)
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
        body: JSON.stringify({ layout, metrics }, null, 2),
        contentType: 'application/json',
      })
    } finally {
      await stop(application)
    }
  })
}
