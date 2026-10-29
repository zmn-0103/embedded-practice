import { randomUUID } from 'node:crypto'
import type { ElectronApplication, Page } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import type { QuestionIdentity } from '../../src/shared/contracts/library-desktop'
import type { MaterialRequest, SaveNote } from '../../src/shared/contracts/study'
import { expect } from './helpers'
import { a, b, prepareControl, selectForPractice } from './practice-control-helpers'
import { startFlow } from './practice-flow-helpers'

export { a, b, prepareControl as prepareStudy }
export function readNote(page: Page, identity: QuestionIdentity = a(1)) {
  return page.evaluate(
    (input) => (globalThis as unknown as { desktop: DesktopApi }).desktop.study.readNote(input),
    identity,
  )
}
export function saveNote(page: Page, input: SaveNote) {
  return page.evaluate(
    (input) => (globalThis as unknown as { desktop: DesktopApi }).desktop.study.saveNote(input),
    input,
  )
}
export function exportMaterial(page: Page, input: MaterialRequest) {
  return page.evaluate(
    (input) =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.study.exportMaterial(input),
    input,
  )
}
export async function openLibraryNote(page: Page, title = '组卷题 A 1') {
  await page
    .locator('.question-row')
    .filter({ has: page.getByText(title, { exact: true }) })
    .click()
  const note = page.getByLabel('题目内容').locator('.personal-note')
  await note.locator('summary').click()
  await expect(note.getByRole('textbox', { name: '我的复习笔记', exact: true })).toBeEditable()
  return note
}
export async function closeNormally(application: ElectronApplication) {
  const closing = application.waitForEvent('close')
  await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.close())
  await closing
}
export async function createStudyRound(
  page: Page,
  text: string,
  identities: QuestionIdentity[] = [a(1), b(1)],
) {
  const selected = await selectForPractice(page, identities, '题单：积累测试')
  const started = await startFlow(page, {
    requestId: randomUUID(),
    topicId: null,
    count: 'all',
    replace: null,
    selected,
  })
  if (!started.ok) throw new Error(started.error.message)
  return page.evaluate(
    async ({ ack, text }) => {
      const api = (globalThis as unknown as { desktop: DesktopApi }).desktop.practice
      const revealed = await api.reveal({
        requestId: crypto.randomUUID(),
        cursor: { sessionId: ack.sessionId, position: 0, revision: ack.revision },
        draft: { revision: 1, text },
      })
      if (!revealed.ok) throw new Error(revealed.error.message)
      const next = await api.rateAndAdvance({
        requestId: crypto.randomUUID(),
        cursor: {
          sessionId: ack.sessionId,
          position: revealed.value.position,
          revision: revealed.value.revision,
        },
        draft: { revision: 1, text },
        rating: '不熟',
      })
      if (!next.ok) throw new Error(next.error.message)
      if (next.value.status !== 'active') return next.value
      const ended = await api.end({
        requestId: crypto.randomUUID(),
        cursor: {
          sessionId: ack.sessionId,
          position: next.value.position,
          revision: next.value.revision,
        },
        draft: { revision: 0, text: '' },
      })
      if (!ended.ok) throw new Error(ended.error.message)
      return ended.value
    },
    { ack: started.value, text },
  )
}
