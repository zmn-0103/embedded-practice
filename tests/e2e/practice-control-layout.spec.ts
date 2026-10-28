import { writeFile } from 'node:fs/promises'
import { expect, test } from './helpers'
import { stop } from './history-helpers'
import { prepareControl } from './practice-control-helpers'

for (const setting of [
  { width: 900, height: 800, zoom: 1, color: 'light' },
  { width: 900, height: 800, zoom: 1.25, color: 'dark' },
  { width: 1200, height: 900, zoom: 1.5, color: 'dark' },
] as const) {
  test(`选题与清单在${setting.width}宽/${setting.zoom * 100}%/${setting.color}可见且可操作`, async ({
    testDataDirectory,
  }, info) => {
    const { application, page } = await prepareControl(testDataDirectory, info)
    try {
      const window = await application.browserWindow(page)
      await window.evaluate((window, setting) => {
        window.setContentSize(setting.width, setting.height)
        window.webContents.setZoomFactor(setting.zoom)
      }, setting)
      await page.emulateMedia({ colorScheme: setting.color })
      const capture = async (name: string) => {
        await page.evaluate(
          () =>
            new Promise<void>((resolve) => {
              const frame = Reflect.get(globalThis, 'requestAnimationFrame') as (
                callback: () => void,
              ) => number
              frame(() => frame(resolve))
            }),
        )
        const bytes = await application.evaluate(async ({ BrowserWindow }) =>
          (await BrowserWindow.getAllWindows()[0]!.webContents.capturePage())
            .toPNG()
            .toString('base64'),
        )
        const path = info.outputPath(name)
        await writeFile(path, Buffer.from(bytes, 'base64'))
        await info.attach(name, { path, contentType: 'image/png' })
      }
      const noHorizontalOverflow = async () => {
        const layout = await page.locator('html').evaluate((element) => ({
          width: element.ownerDocument.defaultView!.innerWidth,
          scrollWidth: element.scrollWidth,
        }))
        expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width + 1)
      }
      await page.getByLabel('专题', { exact: true }).selectOption('control-a')
      await page.getByRole('button', { name: '勾选本页有效题', exact: true }).click()
      await expect(page.getByText('已勾选 20 题', { exact: true })).toBeVisible()
      await page.locator('.question-selection-panel > summary').click()
      const panel = page.getByLabel('勾选组卷与固定题单', { exact: true })
      await expect(panel.locator('li')).toHaveCount(20)
      const bounds = await page.locator('.question-selection-panel').evaluate((element) => {
        const box = element.getBoundingClientRect()
        return {
          left: box.left,
          right: box.right,
          top: box.top,
          bottom: box.bottom,
          width: element.ownerDocument.defaultView!.innerWidth,
          height: element.ownerDocument.defaultView!.innerHeight,
        }
      })
      expect(bounds.left).toBeGreaterThanOrEqual(0)
      expect(bounds.right).toBeLessThanOrEqual(bounds.width)
      expect(bounds.bottom).toBeLessThanOrEqual(bounds.height)
      await noHorizontalOverflow()
      await capture('sets-popup.png')
      await panel.getByLabel('题单名称', { exact: true }).fill('中断与DMA以及UART面试复习')
      await panel.getByRole('button', { name: '保存为新题单', exact: true }).click()
      await expect(panel.getByRole('status')).toHaveText('固定题单已保存。')
      await panel.getByRole('button', { name: '确认这批题目并练习…', exact: true }).click()
      const confirm = page.getByLabel('确认勾选组卷', { exact: true })
      await expect(
        confirm.getByRole('button', { name: '确认开始组卷（20题）', exact: true }),
      ).toBeEnabled()
      await noHorizontalOverflow()
      await capture('selected-confirm.png')
      await confirm.getByRole('button', { name: '确认开始组卷（20题）', exact: true }).click()
      const outline = page.locator('.practice-outline')
      await outline.locator('summary').click()
      await expect(outline.locator('li')).toHaveCount(20)
      await noHorizontalOverflow()
      await capture('outline-open.png')
      await outline.getByRole('button', { name: /^20\. 组卷题 A 20 / }).click()
      await expect(page.getByLabel('练习进度')).toHaveText('第 20 / 20 题 · 顺序练习')
      const input = page.getByRole('textbox', { name: '我的答案', exact: true })
      await input.fill('缩放后可继续独立作答')
      await expect(page.locator('.practice-save')).toHaveText('已保存')
      await expect(input).toBeFocused()
      await expect(page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
      await capture('outline-jumped-answer.png')
    } finally {
      await stop(application)
    }
  })
}
