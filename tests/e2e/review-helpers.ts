import type { Locator, Page } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import type { QuestionIdentity } from '../../src/shared/contracts/library-desktop'
import type { ReviewListRequest, SaveReview } from '../../src/shared/contracts/review-todos'
import { expect, openPage } from './helpers'
import { a } from './practice-control-helpers'

export function saveReview(page: Page, input: SaveReview) {
  return page.evaluate(
    (value) => (globalThis as unknown as { desktop: DesktopApi }).desktop.reviewTodos.save(value),
    input,
  )
}
export function readReview(page: Page, identity = a(1)) {
  return page.evaluate(
    (value) => (globalThis as unknown as { desktop: DesktopApi }).desktop.reviewTodos.read(value),
    identity,
  )
}
export async function listReviews(page: Page, change: Partial<ReviewListRequest> = {}) {
  const result = await page.evaluate(
    (value) => (globalThis as unknown as { desktop: DesktopApi }).desktop.reviewTodos.list(value),
    { state: 'pending', due: 'all', page: 1, ...change } as ReviewListRequest,
  )
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}
export async function arrangeReview(page: Page, identity = a(1), dueDate: string | null = null) {
  const result = await saveReview(page, {
    ...identity,
    expectedRevision: 0,
    state: 'pending',
    dueDate,
    reason: `复习原因 ${identity.topicId}/${identity.questionId}`,
  })
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}
export async function openReviewEditor(editor: Locator) {
  if ((await editor.getAttribute('open')) === null) await editor.locator('summary').click()
  await expect(editor.getByText('正在读取复习安排…', { exact: true })).toBeHidden()
  await expect(editor.getByRole('textbox', { name: '复习原因', exact: true })).toBeEditable()
  return editor
}
export async function openLibraryReview(page: Page, identity: QuestionIdentity = a(1)) {
  await openPage(page, '题库')
  const back = page.getByRole('button', { name: '返回题目列表', exact: true })
  if (await back.isVisible()) await back.click()
  await page.getByRole('combobox', { name: '专题', exact: true }).selectOption(identity.topicId)
  await page
    .getByRole('complementary', { name: '题目列表' })
    .getByRole('button', { name: new RegExp(` · ${identity.questionId}(?:\\s|$)`) })
    .click()
  return openReviewEditor(page.locator('.question-reader .review-editor'))
}
