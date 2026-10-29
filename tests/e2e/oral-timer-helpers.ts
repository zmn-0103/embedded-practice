import { randomUUID } from 'node:crypto'
import type { Page, TestInfo } from '@playwright/test'
import { a, b, prepareControl, selectForPractice } from './practice-control-helpers'
import { startFlow } from './practice-flow-helpers'
import { expect, openPage } from './helpers'
import { chooseTheme } from './theme-helpers'
import { stop } from './history-helpers'

export async function prepareOral(directory: string, info: TestInfo, mode?: 'light' | 'dark') {
  const instance = await prepareControl(directory, info, 3)
  try {
    if (mode) await chooseTheme(instance.page, '松间绿', mode, 22)
    const selected = await selectForPractice(instance.page, [a(1), a(2), b(1)], '口述计时样本')
    const result = await startFlow(instance.page, {
      requestId: randomUUID(),
      topicId: null,
      count: 'all',
      replace: null,
      selected,
    })
    if (!result.ok) throw new Error(result.error.message)
    await instance.page.reload()
    await openPage(instance.page, '开始练习')
    await instance.page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(
      instance.page.getByRole('heading', { name: '组卷题 A 1', exact: true }),
    ).toBeVisible()
    await instance.application.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]!.focus(),
    )
    return { ...instance, sessionId: result.value.sessionId }
  } catch (error) {
    await stop(instance.application)
    throw error
  }
}
export async function freezeOralClock(page: Page) {
  await page.clock.install({ time: new Date('2026-10-29T09:00:00+08:00') })
  await page.clock.pauseAt(new Date('2026-10-29T09:00:01+08:00'))
}
