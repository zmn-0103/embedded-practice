import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Page } from '@playwright/test'
import { expect, launchApplication } from './helpers'
import { importHistoryFiles, stop } from './history-helpers'
import { verifyThemeTarget } from './theme-helpers'

export function workbenchBank(changed = false) {
  return (
    `---\nschema_version: 1\ntopic_id: workbench-a\ntopic_title: 工作台验收专题\n---\n\n` +
    Array.from({ length: 25 }, (_, index) => {
      const n = index + 1
      return `## q-${n} | 工作台题目 ${n}\n\n标签：工作台, 分组${n % 2}\n难度：${n % 2 ? '基础' : '进阶'}\n\n### 题目\n\nWORKBENCH-BODY-${n}\n\n### 参考答案\n\nWORKBENCH-ANSWER-${n}${changed && n === 1 ? '-NEW' : ''}\n\n`
    }).join('')
  )
}

export async function prepareWorkbench(directory: string, project: string) {
  const file = join(directory, '工作台独立验收.md')
  await writeFile(file, workbenchBank())
  const instance = await launchApplication(directory, project, '题库')
  try {
    await instance.application.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]!.setContentSize(1440, 1000),
    )
    await verifyThemeTarget(instance.application, instance.page, directory, project)
    await importHistoryFiles(instance.application, instance.page, [file])
    return { ...instance, file }
  } catch (error) {
    await stop(instance.application)
    throw error
  }
}

export async function settleWorkbench(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((done) => {
        const browser = globalThis as unknown as {
          requestAnimationFrame: (callback: () => void) => number
        }
        browser.requestAnimationFrame(() => browser.requestAnimationFrame(done))
      }),
  )
}

export async function noWorkbenchOverflow(page: Page) {
  const width = await page
    .locator('html')
    .evaluate((element) => ({ content: element.scrollWidth, viewport: element.clientWidth }))
  expect(width.content).toBe(width.viewport)
}
