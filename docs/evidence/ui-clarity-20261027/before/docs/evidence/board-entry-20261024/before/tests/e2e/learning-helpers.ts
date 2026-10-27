import type { Page } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import type { LearningScope } from '../../src/shared/contracts/learning'
import { expect, openPage } from './helpers'

export async function readLearning(
  page: Page,
  scope: LearningScope = { topicId: null, archived: false },
) {
  const result = await page.evaluate(
    (request) => (globalThis as unknown as { desktop: DesktopApi }).desktop.learning.read(request),
    scope,
  )
  if (!result.ok) throw new Error('总览读取失败：' + result.error.code)
  return result.value
}
export async function openRecords(page: Page) {
  await openPage(page, '学习记录')
  await expect(page.getByLabel('当前版本学习总览', { exact: true })).toBeVisible()
}
export async function expectCounts(page: Page, counts: number[], ratings: number[]) {
  await expect(page.getByLabel('当前版本学习总览', { exact: true }).locator('dd')).toHaveText(
    counts.map(String),
  )
  await expect(page.getByLabel('当前版本自评分布', { exact: true }).locator('dd')).toHaveText(
    ratings.map(String),
  )
}
export async function favoriteLearning(page: Page, topicId: string, favorite: boolean) {
  const result = await page.evaluate(
    (setting) =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.library.setFavorite(setting),
    { topicId, questionId: 'q-1', favorite },
  )
  expect(result).toEqual({ ok: true, value: { topicId, questionId: 'q-1', favorite } })
}
