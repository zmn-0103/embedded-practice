import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { Page, TestInfo } from '@playwright/test'
import type { DatabaseSync } from 'node:sqlite'
import type { DesktopApi } from '../../src/shared/contracts/application'
import type { QuestionIdentity } from '../../src/shared/contracts/library-desktop'
import type { QuestionSetChange } from '../../src/shared/contracts/question-sets'
import { expect, launchApplication, openPage } from './helpers'
import { importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'

export const a = (n: number): QuestionIdentity => ({ topicId: 'control-a', questionId: `q-${n}` })
export const b = (n: number): QuestionIdentity => ({ topicId: 'control-b', questionId: `q-${n}` })
export function controlBank(topic = 'control-a', total = 27, updated = false, omit = 0) {
  return (
    `---\nschema_version: 1\ntopic_id: ${topic}\ntopic_title: ${topic === 'control-a' ? '组卷专题 A' : '组卷专题 B'}\n---\n\n` +
    Array.from({ length: total }, (_, i) => i + 1)
      .filter((n) => n !== omit)
      .map(
        (n) =>
          `## q-${n} | ${topic === 'control-a' ? '组卷题 A' : '组卷题 B'} ${n}\n\n标签：组卷样本\n难度：基础\n\n### 题目\n\nCONTROL-${updated ? 'NEW' : 'OLD'}-BODY-${topic}-${n}\n\n### 参考答案\n\nCONTROL-${updated ? 'NEW' : 'OLD'}-ANSWER-${topic}-${n}\n\n`,
      )
      .join('')
  )
}
export async function prepareControl(directory: string, info: TestInfo, total = 27) {
  const folder = join(directory, 'control-source')
  await mkdir(folder)
  const file = join(folder, '组卷A.md'),
    other = join(folder, '组卷B.md')
  await writeFile(file, controlBank('control-a', total))
  await writeFile(other, controlBank('control-b', 3))
  const instance = await launchApplication(directory, info.project.name)
  try {
    const actual = await instance.application.evaluate(({ app }) => ({
      exe: process.execPath,
      data: app.getPath('userData'),
      packaged: app.isPackaged,
    }))
    expect(actual.data).toBe(directory)
    expect(actual.packaged).toBe(info.project.name === 'packaged')
    if (actual.packaged) {
      const target = process.env['EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE']
      if (!target) throw new Error('必须显式指定本轮EXE')
      expect(actual.exe.toLowerCase()).toBe(resolve(target).toLowerCase())
    }
    await expect(instance.page.locator('footer')).toContainText('20261028.1-content-updates')
    expect(withHistoryDatabase(directory, (db) => db.prepare('PRAGMA user_version').get())).toEqual(
      { user_version: 13 },
    )
    await info.attach('practice-control-runtime', {
      body: JSON.stringify(actual),
      contentType: 'application/json',
    })
    await importHistoryFiles(instance.application, instance.page, [file, other])
    await openPage(instance.page, '题库')
    return { ...instance, file, other }
  } catch (error) {
    await stop(instance.application)
    throw error
  }
}
export function changeSet(page: Page, change: QuestionSetChange) {
  return page.evaluate(
    (input) =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.questionSets.change(input),
    change,
  )
}
export async function previewSet(
  page: Page,
  input: { items: QuestionIdentity[] } | { setId: string },
) {
  const result = await page.evaluate(
    (input) =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.questionSets.preview(input),
    input,
  )
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}
export async function readSets(page: Page) {
  const result = await page.evaluate(() =>
    (globalThis as unknown as { desktop: DesktopApi }).desktop.questionSets.list(),
  )
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}
export function controlRecords(db: DatabaseSync) {
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT GLOB 'sqlite_*' AND name NOT IN ('app_startup','backup_manifest') ORDER BY name",
    )
    .all() as { name: string }[]
  return Object.fromEntries(
    tables.map(({ name }) => [
      name,
      db
        .prepare(
          name === 'image_resources'
            ? 'SELECT hash,format,width,height,hex(bytes) AS bytes FROM image_resources ORDER BY hash'
            : `SELECT * FROM "${name.replaceAll('"', '""')}" ORDER BY rowid`,
        )
        .all(),
    ]),
  )
}
export async function selectForPractice(
  page: Page,
  items: QuestionIdentity[],
  sourceName = '题单：测试顺序',
) {
  const preview = await previewSet(page, { items })
  return {
    sourceName,
    items: preview.items.map((item) => {
      if (item.status !== 'available') throw new Error('测试组卷有不可用项')
      return { topicId: item.topicId, questionId: item.questionId, versionId: item.versionId }
    }),
  }
}
