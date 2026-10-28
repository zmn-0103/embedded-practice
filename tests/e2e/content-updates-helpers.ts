import { writeFile } from 'node:fs/promises'
import type { Page, TestInfo } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import type { VersionIdentity } from '../../src/shared/contracts/library-desktop'
import type { ContentComparisonRequest } from '../../src/shared/contracts/content-updates'
import { expect, openPage } from './helpers'
import { importHistoryFiles, stop } from './history-helpers'
import { a, b, controlBank, prepareControl } from './practice-control-helpers'

export { a, b }
export function updatesBank(revision = 2, total = 4, omitted = 0) {
  return (
    `---\nschema_version: 1\ntopic_id: control-a\ntopic_title: 组卷专题 A\n---\n\n` +
    Array.from({ length: total }, (_, i) => i + 1)
      .filter((n) => n !== omitted)
      .map((n) => {
        const question =
          n === 4
            ? 'CONTROL-OLD-BODY-control-a-4'
            : n === 2
              ? 'UPDATES-SAME-QUESTION-2'
              : `共同说明\n\nUPDATES-BODY-${revision}-${n}\n\n中间未变说明\n\n\`\`\`c\nint step = ${revision};\n\`\`\`\n\n| 条件 | 位置 |\n| --- | --- |\n| DMA | 内存 |`
        const answer =
          n === 4 ? 'CONTROL-OLD-ANSWER-control-a-4' : `UPDATES-ANSWER-${revision}-${n}`
        return `## q-${n} | 组卷题 A ${n}\n\n标签：更新样本\n难度：基础\n\n### 题目\n\n${question}\n\n### 参考答案\n\n${answer}\n\n`
      })
      .join('')
  )
}
export async function prepareUpdates(directory: string, info: TestInfo, total = 4) {
  const instance = await prepareControl(directory, info, total)
  try {
    await writeFile(instance.file, updatesBank(2, total))
    await writeFile(instance.other, controlBank('control-b', 3, true))
    await importHistoryFiles(instance.application, instance.page, [instance.file, instance.other])
    return instance
  } catch (error) {
    await stop(instance.application)
    throw error
  }
}
export async function currentVersion(page: Page, identity = a(1)): Promise<VersionIdentity> {
  const result = await page.evaluate(
    (input) =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.library.getQuestion(input),
    identity,
  )
  if (!result.ok) throw new Error(result.error.message)
  return { ...identity, versionId: result.value.versionId }
}
export function listContentVersions(page: Page, identity: VersionIdentity, pageNumber = 1) {
  return page.evaluate(
    (input) =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.contentUpdates.versions(input),
    { ...identity, page: pageNumber },
  )
}
export function compareContent(page: Page, request: ContentComparisonRequest) {
  return page.evaluate(
    (input) =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.contentUpdates.compare(input),
    request,
  )
}
export async function selectUpdateQuestion(page: Page, title = '组卷题 A 1') {
  await openPage(page, '题库')
  await page
    .locator('.question-row')
    .filter({ has: page.getByText(title, { exact: true }) })
    .click()
  await expect(
    page.getByLabel('题目内容').getByRole('heading', { name: title, exact: true }),
  ).toBeVisible()
  return page.getByLabel('题目内容').locator('.content-updates')
}
export async function updatesSelection(page: Page, items = [a(1), b(1)]) {
  const preview = await page.evaluate(
    (items) =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.questionSets.preview({
        items,
        contentUpdatedOnly: true,
      }),
    items,
  )
  if (!preview.ok) throw new Error(preview.error.message)
  return {
    sourceName: '内容更新复习：测试勾选',
    contentUpdatedOnly: true,
    items: preview.value.items.map((item) => {
      if (item.status !== 'available') throw new Error('准备更新组卷含非待复习项')
      return { topicId: item.topicId, questionId: item.questionId, versionId: item.versionId }
    }),
  }
}
export async function readUpdateRound(page: Page) {
  const result = await page.evaluate(() =>
    (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
  )
  if (!result.ok || !result.value?.item) throw new Error('缺少更新复习活动轮')
  return result.value
}
export async function revealUpdateRound(page: Page) {
  const { session, item } = await readUpdateRound(page)
  return page.evaluate(
    (input) => (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.reveal(input),
    {
      requestId: crypto.randomUUID(),
      cursor: {
        sessionId: session.sessionId,
        position: session.position,
        revision: session.revision,
      },
      draft: item!.draft,
    },
  )
}
