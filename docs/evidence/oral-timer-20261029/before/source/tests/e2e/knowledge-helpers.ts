import { randomUUID } from 'node:crypto'
import type { Page } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import type { KnowledgeSearch, RelationChange } from '../../src/shared/contracts/knowledge'
import type { QuestionIdentity } from '../../src/shared/contracts/library-desktop'
import { expect, openPage } from './helpers'
import { a, b } from './practice-control-helpers'

export function changeRelation(page: Page, input: RelationChange) {
  return page.evaluate(
    (value) =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.knowledge.changeRelation(value),
    input,
  )
}
export async function createRelation(page: Page, source = a(1), target = b(1)) {
  const result = await changeRelation(page, {
    action: 'save',
    relationId: randomUUID(),
    expectedRevision: 0,
    source,
    target,
    kind: 'confused',
    explanation: 'DMA完成不等于UART完成',
  })
  if (!result.ok || !result.value) throw new Error('关联准备失败')
  return result.value
}
export async function relations(page: Page, identity = a(1), pageNumber = 1) {
  const result = await page.evaluate(
    (value) =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.knowledge.relations(value),
    { identity, page: pageNumber },
  )
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}
export async function searchKnowledge(page: Page, change: Partial<KnowledgeSearch> = {}) {
  const result = await page.evaluate(
    (value) => (globalThis as unknown as { desktop: DesktopApi }).desktop.knowledge.search(value),
    {
      query: '',
      kind: 'all',
      archive: 'all',
      hasNotes: false,
      sort: 'default',
      page: 1,
      ...change,
    } as KnowledgeSearch,
  )
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}
export async function openQuestionRelations(page: Page, identity: QuestionIdentity = a(1)) {
  await openPage(page, '题库')
  const back = page.getByRole('button', { name: '返回题目列表', exact: true })
  if (await back.isVisible()) await back.click()
  await page.getByLabel('专题', { exact: true }).selectOption(identity.topicId)
  await page
    .getByRole('complementary', { name: '题目列表' })
    .getByRole('button', { name: new RegExp(` · ${identity.questionId}(?:\\s|$)`) })
    .click()
  const panel = page.locator('.question-reader .question-relations')
  if ((await panel.getAttribute('open')) === null) await panel.locator(':scope > summary').click()
  await expect(panel.getByText('正在读取题目关联…', { exact: true })).toBeHidden()
  return panel
}
export async function openKnowledge(page: Page) {
  await openPage(page, '学习记录')
  await page.getByRole('tab', { name: '我的积累', exact: true }).click()
  const panel = page.getByRole('region', { name: '我的积累检索', exact: true })
  await expect(panel.getByText('正在检索我的积累…', { exact: true })).toBeHidden()
  return panel
}
