import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { ElectronApplication, Page, TestInfo } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import type { HistoryListRequest, HistorySummary } from '../../src/shared/contracts/history'
import { seedHistory } from '../integration/history-seed'
import { expect, launchApplication, openPage } from './helpers'

export function historyBank(
  changed = false,
  metadata = false,
  omitted = false,
  topic = 'history-a',
) {
  return (
    `---\nschema_version: 1\ntopic_id: ${topic}\ntopic_title: ${metadata ? '元数据专题' : topic === 'history-a' ? '历史专题 A' : '历史专题 B'}\n---\n\n` +
    (topic === 'history-b' ? [1] : metadata ? [2, 1] : [1, 2])
      .filter((n) => !omitted || n !== 1)
      .map(
        (n) =>
          `## q-${n} | ${metadata ? '元数据题' : topic === 'history-a' ? '历史题' : '异专题题'} ${n}\n\n标签：历史样本${metadata ? ', 新标签' : ''}\n难度：基础\n\n### 题目\n\nHISTORY-BODY-${changed ? 'NEW' : 'OLD'}-${topic}-${n}\n\n${n === 1 ? '![历史图](assets/history.png)\n\n' : ''}### 参考答案\n\nHISTORY-ANSWER-${changed ? 'NEW' : 'OLD'}-${topic}-${n}\n\n\`\`\`c\nint value = ${changed ? 2 : 1};\n\`\`\`\n\n`,
      )
      .join('')
  )
}
// 自建 3×2 RGBA PNG：标准库 zlib/CRC 生成，区别于原 2×3 夹具。
export const alternatePng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAYAAACddGYaAAAAEUlEQVR4nGO4Y2T0H4YZkDkArhENe6mq6B4AAAAASUVORK5CYII=',
  'base64',
)
const closed = new WeakSet<ElectronApplication>()
export async function stop(application: ElectronApplication) {
  if (closed.has(application)) return
  // 窗口创建早于页面加载完成；诊断/清理过早 app.exit 会误触发启动加载失败。
  await Promise.all(
    application
      .windows()
      .map((page) => page.waitForLoadState('load', { timeout: 3000 }).catch(() => {})),
  )
  await application.evaluate(({ app }) => app.exit(0)).catch(() => {})
  await application.close().catch(() => {})
  closed.add(application)
}
export async function importHistoryFiles(
  application: ElectronApplication,
  page: Page,
  paths: string[],
) {
  await openPage(page, '题库')
  await application.evaluate(({ dialog }, selected) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: selected })
  }, paths)
  await page.getByRole('button', { name: '导入题库', exact: true }).click()
  await expect(page.getByRole('heading', { name: '导入预览', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '确认导入', exact: true }).click()
  await expect(page.getByText(/^导入完成：/)).toBeVisible()
}
export async function prepareHistory(directory: string, project: string, rounds = 3) {
  const folder = join(directory, '历史 中文来源')
  await mkdir(join(folder, 'assets'), { recursive: true })
  await copyFile(resolve('tests/fixtures/images/small.png'), join(folder, 'assets/history.png'))
  const file = join(folder, '历史.md')
  const other = join(folder, '异专题.md')
  await writeFile(file, historyBank())
  await writeFile(other, historyBank(false, false, false, 'history-b'))
  const launched = await launchApplication(directory, project)
  try {
    await importHistoryFiles(launched.application, launched.page, [file, other])
    const seed = await launched.application.evaluate(seedHistory, { directory, rounds })
    expect(seed.errors).toEqual([])
    return { ...launched, seed, folder, file }
  } catch (error) {
    await stop(launched.application)
    throw error
  }
}
export function withHistoryDatabase<T>(
  directory: string,
  work: (database: DatabaseSync) => T,
  readOnly = true,
): T {
  if (
    dirname(resolve(directory)) !== resolve(tmpdir()) ||
    !basename(directory).startsWith('embedded-practice-')
  )
    throw new Error('拒绝访问非本次测试库。')
  const database = new DatabaseSync(join(directory, 'practice.sqlite3'), { readOnly })
  try {
    return work(database)
  } finally {
    database.close()
  }
}
export function historySnapshot(directory: string) {
  return withHistoryDatabase(directory, (database) => ({
    sessions: database.prepare('SELECT * FROM practice_sessions ORDER BY rowid').all(),
    items: database.prepare('SELECT * FROM practice_items ORDER BY rowid').all(),
    states: database.prepare('SELECT * FROM question_user_state ORDER BY rowid').all(),
    receipts: database.prepare('SELECT * FROM practice_receipts ORDER BY rowid').all(),
    versions: database.prepare('SELECT * FROM question_versions ORDER BY id').all(),
    questions: database.prepare('SELECT * FROM questions ORDER BY id').all(),
    resources: database
      .prepare('SELECT hash, width, height, hex(bytes) AS bytes FROM image_resources ORDER BY hash')
      .all(),
    foreignKeys: database.prepare('PRAGMA foreign_key_check').all(),
    integrity: database.prepare('PRAGMA quick_check').all(),
    schema: database.prepare('PRAGMA user_version').get(),
  }))
}
export async function readHistory(page: Page, options: Partial<HistoryListRequest> = {}) {
  const result = await page.evaluate(
    (request) => (globalThis as unknown as { desktop: DesktopApi }).desktop.history.list(request),
    { topicId: 'history-a', questionId: 'q-1', page: 1, ...options },
  )
  if (!result.ok) throw new Error('历史读取失败：' + result.error.code)
  return result.value
}
export async function readHistoryEntry(
  page: Page,
  entry: Pick<HistorySummary, 'sessionId' | 'position'>,
  topicId = 'history-a',
  questionId = 'q-1',
) {
  const result = await page.evaluate(
    (request) =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.history.getEntry(request),
    { topicId, questionId, sessionId: entry.sessionId, position: entry.position },
  )
  if (!result.ok) throw new Error('历史详情失败：' + result.error.code)
  return result.value
}
export async function selectHistoryQuestion(page: Page, questionId = 'q-1') {
  await openPage(page, '题库')
  const returnToList = page.getByRole('button', { name: '返回题目列表', exact: true })
  if (await returnToList.isVisible()) await returnToList.click()
  await page.getByRole('combobox', { name: '专题', exact: true }).selectOption('history-a')
  await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
  await page
    .getByRole('complementary', { name: '题目列表' })
    .getByRole('button', { name: new RegExp(` · ${questionId}(?:\\s|$)`) })
    .click()
  await expect(page.getByRole('article', { name: '题目内容' })).toBeVisible()
}
export async function beginHistoryPractice(page: Page) {
  await openPage(page, '开始练习')
  await page.getByRole('combobox', { name: '练习专题', exact: true }).selectOption('history-a')
  await expect(page.getByText('匹配 2 题', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '开始练习', exact: true }).click()
  await expect(page.getByLabel('练习进度')).toHaveText('第 1 / 2 题 · 顺序练习')
}
export async function captureHistory(
  application: ElectronApplication,
  page: Page,
  info: TestInfo,
  name: string,
) {
  await page.evaluate(async () => {
    const browser = globalThis as unknown as {
      document: { fonts: { ready: Promise<unknown> } }
      requestAnimationFrame: (callback: () => void) => void
    }
    await browser.document.fonts.ready
    await new Promise<void>((done) =>
      browser.requestAnimationFrame(() => browser.requestAnimationFrame(() => done())),
    )
  })
  const png = await application.evaluate(async ({ BrowserWindow }) => {
    const window = BrowserWindow.getAllWindows()[0]
    if (!window) throw new Error('测试窗口不存在。')
    return (await window.webContents.capturePage()).toPNG().toString('base64')
  })
  const file = info.outputPath(name)
  await writeFile(file, Buffer.from(png, 'base64'))
  await info.attach(name, { path: file, contentType: 'image/png' })
}
