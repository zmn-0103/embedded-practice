import type { Page } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import type {
  PracticePlanChange,
  PracticePlanOptions,
} from '../../src/shared/contracts/practice-plans'
import { EMPTY_QUESTION_FILTERS } from '../../src/shared/contracts/question-filters'
import { expect, openPage } from './helpers'

export const planOptions: PracticePlanOptions = {
  category: { kind: 'all' },
  topicId: null,
  mode: 'random',
  count: 20,
  filters: { ...EMPTY_QUESTION_FILTERS },
}
export async function readPlans(page: Page) {
  const result = await page.evaluate(() =>
    (globalThis as unknown as { desktop: DesktopApi }).desktop.practicePlans.list(),
  )
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}
export async function changePlan(page: Page, command: PracticePlanChange) {
  return page.evaluate(
    (change) =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.practicePlans.change(change),
    command,
  )
}
export async function openPlans(page: Page) {
  await openPage(page, '开始练习')
  const panel = page.locator('.practice-plans')
  if ((await panel.getAttribute('open')) === null) await panel.locator('summary').click()
  return panel
}
export async function savePlan(page: Page, name: string) {
  const panel = await openPlans(page)
  await panel.getByLabel('方案名称', { exact: true }).fill(name)
  await panel.getByRole('button', { name: '保存当前条件为方案', exact: true }).click()
  await expect(panel.getByRole('status')).toHaveText('练习方案已保存。')
  const found = (await readPlans(page)).find((plan) => plan.name === name)
  expect(found).toBeDefined()
  return found!
}
