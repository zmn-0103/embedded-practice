import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ElectronApplication, Page, TestInfo } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, launchApplication, openPage, test } from './helpers'
import { addCategory, assignTopic, categoryList } from './category-helpers'
import { historySnapshot, importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'

const manifest = JSON.parse(
  readFileSync('question-banks/releases/v003-20261030/manifest.json', 'utf8'),
) as {
  questionCount: number
  files: { file: string; topicId: string; board: string; count: number }[]
  legacyMappings: { topicId: string; questionId: string; action: string }[]
}
const paths = manifest.files.map((file) => resolve(file.file))
const old = JSON.parse(
  readFileSync('question-banks/releases/v000-20261024/全量题库清单.json', 'utf8'),
) as { files: { file: string }[] }

async function verifyRuntime(
  application: ElectronApplication,
  page: Page,
  directory: string,
  info: TestInfo,
) {
  const actual = await application.evaluate(({ app }) => ({
    executable: process.execPath,
    version: app.getVersion(),
    packaged: app.isPackaged,
    data: app.getPath('userData'),
  }))
  expect(actual.data).toBe(directory)
  expect(actual.packaged).toBe(info.project.name === 'packaged')
  if (actual.packaged) {
    expect(resolve(actual.executable)).toBe(
      resolve(process.env['EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE']!),
    )
    expect(actual.version).toBe('0.0.3')
  }
  await expect(page.locator('footer')).toContainText('20261030.1-v003-bank')
  expect(withHistoryDatabase(directory, (db) => db.prepare('PRAGMA user_version').get())).toEqual({
    user_version: 17,
  })
  await info.attach('v003-runtime.json', {
    body: JSON.stringify(actual),
    contentType: 'application/json',
  })
}

function verifyBank(directory: string) {
  withHistoryDatabase(directory, (database) => {
    expect(database.prepare('PRAGMA integrity_check').get()).toEqual({ integrity_check: 'ok' })
    expect(database.prepare('PRAGMA foreign_key_check').all()).toEqual([])
    const rows = database
      .prepare(
        'SELECT topic_id,count(*) AS total FROM questions WHERE archived=0 GROUP BY topic_id',
      )
      .all()
    expect(rows).toHaveLength(manifest.files.length)
    for (const file of manifest.files)
      expect(rows.find((row) => row['topic_id'] === file.topicId)?.['total']).toBe(file.count)
    expect(
      database.prepare('SELECT count(*) AS total FROM questions WHERE archived=0').get()?.['total'],
    ).toBe(manifest.questionCount)
  })
}

test('V0.0.3全量首次及重复导入、板块归属、口述揭晓与重开', async ({ testDataDirectory }, info) => {
  test.setTimeout(120_000)
  let { application, page } = await launchApplication(testDataDirectory, info.project.name, '题库')
  try {
    await verifyRuntime(application, page, testDataDirectory, info)
    await importHistoryFiles(application, page, paths)
    verifyBank(testDataDirectory)
    const versions = historySnapshot(testDataDirectory).versions
    const categories = new Map<string, string>()
    for (const file of manifest.files) {
      if (!categories.has(file.board))
        categories.set(file.board, await addCategory(page, file.board))
      await assignTopic(page, file.topicId, categories.get(file.board)!)
    }
    expect((await categoryList(page)).total).toBe(manifest.questionCount)
    await importHistoryFiles(application, page, paths)
    verifyBank(testDataDirectory)
    expect(historySnapshot(testDataDirectory).versions).toEqual(versions)
    await openPage(page, '开始练习')
    await page.getByLabel('练习专题', { exact: true }).selectOption('general-can')
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    await expect(page.getByRole('region', { name: '练习参考答案', exact: true })).toHaveCount(0)
    await page
      .getByRole('textbox', { name: '我的答案', exact: true })
      .fill('独立临时数据的口述要点')
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await expect(page.getByRole('region', { name: '练习参考答案', exact: true })).toContainText(
      '核心回答',
    )
    await page.screenshot({ path: info.outputPath('v003-practice.png'), fullPage: true })
    const closed = application.waitForEvent('close')
    await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.close())
    await closed
    ;({ application, page } = await launchApplication(testDataDirectory, info.project.name))
    await page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      '独立临时数据的口述要点',
    )
    verifyBank(testDataDirectory)
  } finally {
    await stop(application)
  }
})

test('旧419题更新保留收藏、历史草稿和固定队列，归档与新题身份明确', async ({
  testDataDirectory,
}, info) => {
  test.setTimeout(120_000)
  const { application, page } = await launchApplication(
    testDataDirectory,
    info.project.name,
    '题库',
  )
  try {
    await verifyRuntime(application, page, testDataDirectory, info)
    await importHistoryFiles(
      application,
      page,
      old.files.map((file) => resolve(file.file)),
    )
    const retained = manifest.legacyMappings.find((item) => item.action === '更新')!
    const archived = manifest.legacyMappings.find((item) => item.action === '归档')!
    for (const item of [retained, archived]) {
      const result = await page.evaluate(
        (identity) =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.library.setFavorite({
            topicId: identity.topicId,
            questionId: identity.questionId,
            favorite: true,
          }),
        item,
      )
      expect(result.ok).toBe(true)
    }
    await openPage(page, '开始练习')
    await page.getByLabel('练习专题', { exact: true }).selectOption('stm32f103-gpio')
    await page.getByLabel('本轮题数', { exact: true }).selectOption('all')
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await page.getByRole('button', { name: '掌握', exact: true }).click()
    await page
      .getByRole('textbox', { name: '我的答案', exact: true })
      .fill('旧轮固定版本与合成草稿')
    await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
    const before = historySnapshot(testDataDirectory)
    await importHistoryFiles(application, page, paths)
    verifyBank(testDataDirectory)
    const after = historySnapshot(testDataDirectory)
    for (const name of ['sessions', 'items', 'receipts'] as const)
      expect(after[name]).toEqual(before[name])
    const oldIds = new Set(before.states.map((row) => row['question_id']))
    expect(after.states.filter((row) => oldIds.has(row['question_id']))).toEqual(before.states)
    expect(after.versions).toEqual(expect.arrayContaining(before.versions))
    for (const mapping of manifest.legacyMappings) {
      const row = after.questions.find(
        (question) =>
          question['topic_id'] === mapping.topicId &&
          question['question_id'] === mapping.questionId,
      )!
      expect(row['archived']).toBe(mapping.action === '归档' ? 1 : 0)
    }
    await openPage(page, '开始练习')
    await page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toContainText('第 2 / 78')
    await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      '旧轮固定版本与合成草稿',
    )
    await info.attach('old-records-preserved.json', {
      body: JSON.stringify({
        sessions: before.sessions.length,
        items: before.items.length,
        archived: manifest.legacyMappings.filter((item) => item.action === '归档').length,
        oldStateHash: createHash('sha256').update(JSON.stringify(before.states)).digest('hex'),
      }),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})
