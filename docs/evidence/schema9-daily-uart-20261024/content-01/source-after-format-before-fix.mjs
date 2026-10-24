import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import {
  assert,
  close,
  expect,
  hash,
  importBank,
  join,
  launch,
  openPage,
  snapshotDatabase,
} from './m5-desktop-harness.mjs'

assert(
  process.argv[2] && process.argv[3] && process.argv[4],
  '用法：node scripts/check-uart-content.mjs 修订前完整题库.md 新证据目录 明确的解包EXE',
)
const workspace = fileURLToPath(new URL('../', import.meta.url))
const baseline = resolve(process.argv[2]),
  output = resolve(process.argv[3])
const bank = join(workspace, 'question-banks/trials/STM32F103-UART第二层-30题试用.md')
const revisionFile = join(workspace, 'question-banks/trials/UART答案修订清单.json')
const revisions = JSON.parse(await readFile(revisionFile, 'utf8'))
await mkdir(output)
const temporaryRoot = await mkdtemp(join(tmpdir(), 'embedded-practice-m5b-uart-content-'))
const dataDirectory = join(temporaryRoot, '中文 数据')
await mkdir(dataDirectory)
const report = {
  baseline,
  bank,
  dataDirectory,
  events: [],
  errors: [],
  checks: {},
  boundary:
    '新建临时库，明确结构9解包EXE；仅文件选择框替身。真实界面/解析/事务/正常关闭重开；非用户答案、技术审阅、硬件或安装验收。',
}
const run = {
  output,
  dataDirectory,
  report,
  executable: resolve(process.argv[4]),
  save: () => writeFile(join(output, 'result.json'), JSON.stringify(report, null, 2) + '\n'),
}
let instance
const originalVersionIds = new Set()
const filters = { query: '', tag: null, difficulty: null, mastery: 'all', favoritesOnly: false }
const normalized = (text) => text.replaceAll('\r\n', '\n').trim()

async function practice() {
  const result = await instance.page.evaluate(() =>
    globalThis.desktop.practice.read({ sessionId: null }),
  )
  assert(result.ok, JSON.stringify(result))
  return result.value
}
async function plans() {
  const result = await instance.page.evaluate(() => globalThis.desktop.practicePlans.list())
  assert(result.ok, JSON.stringify(result))
  return result.value
}
async function applyPlan(planId) {
  const panel = instance.page.locator('.practice-plans')
  if ((await panel.getAttribute('open')) === null) await panel.locator('summary').click()
  await panel.getByLabel('选用练习方案', { exact: true }).selectOption(planId)
  await panel.getByRole('button', { name: '将方案填入练习条件', exact: true }).click()
  await expect(instance.page.getByText('匹配 30 题', { exact: true })).toBeVisible()
}
async function normalClose() {
  const closed = instance.application.waitForEvent('close', { timeout: 20_000 })
  await instance.application.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].close(),
  )
  await closed
  instance = undefined
}
// 数据目录只来自本脚本的mkdtemp；读取固定表，不接受外部数据库路径或写入命令。
function protectedState() {
  const db = new DatabaseSync(join(dataDirectory, 'practice.sqlite3'), { readOnly: true })
  try {
    db.exec('BEGIN')
    return {
      versions: db
        .prepare('SELECT * FROM question_versions ORDER BY id')
        .all()
        .filter((row) => originalVersionIds.has(row.id)),
      sessions: db.prepare('SELECT * FROM practice_sessions ORDER BY id').all(),
      items: db.prepare('SELECT * FROM practice_items ORDER BY session_id, position').all(),
      states: db.prepare('SELECT * FROM question_user_state ORDER BY question_id').all(),
      receipts: db.prepare('SELECT * FROM practice_receipts ORDER BY request_id').all(),
      categories: db.prepare('SELECT * FROM categories ORDER BY category_id').all(),
      plans: db.prepare('SELECT * FROM practice_plans ORDER BY plan_id').all(),
      assignments: db.prepare('SELECT topic_id,category_id FROM topics ORDER BY topic_id').all(),
      schema: db.prepare('PRAGMA user_version').get().user_version,
    }
  } finally {
    db.close()
  }
}

try {
  assert.equal(hash(await readFile(baseline)), revisions.beforeFileSha256)
  assert.equal(hash(await readFile(bank)), revisions.afterFileSha256)
  const inputs = [
    baseline,
    bank,
    revisionFile,
    join(workspace, 'question-banks/trials/题答来源.json'),
    join(workspace, 'question-banks/trials/UART题目整理清单.json'),
  ]
  const inputHashes = await Promise.all(
    inputs.map(async (file) => [file, hash(await readFile(file))]),
  )
  instance = await launch(run)
  await expect(instance.page.getByText(/20261024\.1-plans/)).toBeVisible()
  assert.equal(protectedState().schema, 9)
  assert.deepEqual((await importBank(instance, baseline, run, '修订前完整30题')).counts, [
    '30',
    '0',
    '0',
    '0',
    '0',
    '0',
  ])
  const initial = await snapshotDatabase(dataDirectory)
  for (const row of initial.versions) originalVersionIds.add(row.versionId)
  assert.equal(originalVersionIds.size, 30)
  await instance.page.getByRole('button', { name: /uart2-020/ }).click()
  await instance.page.getByRole('button', { name: '收藏本题', exact: true }).click()
  await expect(instance.page.getByRole('button', { name: '取消收藏', exact: true })).toBeVisible()
  const manager = instance.page.locator('.category-manager')
  await manager.locator('summary').click()
  await manager.getByLabel('新分类名称', { exact: true }).fill('STM32定向试用')
  await manager.getByRole('button', { name: '添加分类', exact: true }).click()
  await expect(manager.getByRole('status')).toHaveText('分类已保存。')
  await manager.getByLabel('调整归属的专题', { exact: true }).selectOption(revisions.topicId)
  await manager.getByLabel('归入分类', { exact: true }).selectOption({ label: 'STM32定向试用' })
  const categoryId = await manager.getByLabel('归入分类', { exact: true }).inputValue()
  await manager.getByRole('button', { name: '保存专题归属', exact: true }).click()
  await expect(manager).toContainText('当前归属：STM32定向试用')

  await openPage(instance.page, '开始练习')
  await instance.page.getByText('按分类选择专题', { exact: true }).click()
  await instance.page.getByRole('button', { name: '练习分类：STM32定向试用', exact: true }).click()
  await instance.page.getByLabel('练习专题', { exact: true }).selectOption(revisions.topicId)
  await instance.page.getByLabel('本轮题数', { exact: true }).selectOption('all')
  const panel = instance.page.locator('.practice-plans')
  await panel.locator('summary').click()
  await panel.getByLabel('方案名称', { exact: true }).fill('UART完整顺序练习')
  await panel.getByRole('button', { name: '保存当前条件为方案', exact: true }).click()
  await expect(panel.getByRole('status')).toHaveText('练习方案已保存。')
  const saved = (await plans())[0]
  assert.deepEqual(saved.options, {
    category: { kind: 'category', categoryId },
    topicId: revisions.topicId,
    mode: 'sequential',
    count: 'all',
    filters,
  })
  await instance.page.getByLabel('练习模式', { exact: true }).selectOption('random')
  await instance.page.getByLabel('本轮题数', { exact: true }).selectOption('10')
  await applyPlan(saved.planId)
  assert.equal(await practice(), null)
  await expect(instance.page.getByLabel('练习模式', { exact: true })).toHaveValue('sequential')
  await expect(instance.page.getByLabel('本轮题数', { exact: true })).toHaveValue('all')
  await instance.page.screenshot({ path: join(output, 'plan-filled.png'), fullPage: true })
  await instance.page.getByRole('button', { name: '开始练习', exact: true }).click()
  for (let position = 1; position <= 2; position++) {
    await expect(instance.page.getByLabel('练习进度')).toContainText(`第 ${position} / 30`)
    await instance.page
      .getByRole('textbox', { name: '我的答案', exact: true })
      .fill(`验收合成草稿${position}\n    preserved();`)
    await instance.page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await instance.page.getByRole('button', { name: '不熟', exact: true }).click()
  }
  await expect(instance.page.getByLabel('练习进度')).toContainText('第 3 / 30')
  const draft = '当前结构9正常关闭握手验收，非用户答案\n    keep_indent();\n中文末行'
  await instance.page.getByRole('textbox', { name: '我的答案', exact: true }).fill(draft)
  const active = await practice()
  await normalClose()
  assert.equal(protectedState().items[2].draft, draft)
  instance = await launch(run)
  await instance.page.getByRole('button', { name: '继续练习', exact: true }).click()
  await expect(instance.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
    draft,
  )
  assert.equal((await practice()).session.sessionId, active.session.sessionId)
  assert.equal((await practice()).item.versionId, active.item.versionId)
  assert.equal((await practice()).item.revealed, false)
  assert(!Object.hasOwn((await practice()).item, 'answer'))
  await instance.page.screenshot({ path: join(output, 'daily-resumed.png'), fullPage: true })
  await instance.page.getByRole('button', { name: '返回首页', exact: true }).click()
  const before = protectedState()
  report.protectedBeforeSha256 = hash(JSON.stringify(before))
  assert.equal(before.items.length, 30)
  report.checks.classificationPlanStartSaveCloseAndResume = true

  assert.deepEqual((await importBank(instance, bank, run, '七题答案内容更新')).counts, [
    '0',
    '7',
    '0',
    '23',
    '0',
    '0',
  ])
  assert.deepEqual(protectedState(), before)
  const updated = await snapshotDatabase(dataDirectory)
  assert.equal(updated.counts.question_versions, 37)
  for (const old of initial.versions) {
    const current = updated.versions.find((row) => row.questionId === old.questionId)
    assert(current, old.questionId)
    const revision = revisions.questions.find((row) => row.questionId === old.questionId)
    assert.equal(normalized(current.question), normalized(old.question))
    if (revision) {
      assert.notEqual(current.versionId, old.versionId)
      assert.equal(normalized(current.answer), normalized(revision.afterAnswer))
    } else assert.deepEqual(current, old)
  }
  const detail = await instance.page.evaluate(
    (identity) => globalThis.desktop.library.getQuestion(identity),
    { topicId: revisions.topicId, questionId: 'uart2-020' },
  )
  assert(detail.ok)
  assert.equal(detail.value.favorite, true)
  assert.equal(detail.value.contentUpdated, true)
  assert.deepEqual((await importBank(instance, bank, run, '修订版重复导入')).counts, [
    '0',
    '0',
    '0',
    '30',
    '0',
    '0',
  ])
  assert.deepEqual(protectedState(), before)
  await normalClose()
  instance = await launch(run)
  assert.deepEqual(protectedState(), before)
  assert.deepEqual(await plans(), [saved])
  report.protectedAfterReopenSha256 = hash(JSON.stringify(protectedState()))
  report.checks.exactSevenUpdatesAndThirtyUnchangedReimport = true
  report.checks.oldVersionsQueueDraftsRatingsFavoritesCategoriesPlansAndReceiptsPreserved = true
  await instance.page.getByRole('button', { name: '继续练习', exact: true }).click()
  await expect(instance.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
    draft,
  )
  assert.equal((await practice()).item.versionId, active.item.versionId)
  await instance.page.getByRole('button', { name: '返回首页', exact: true }).click()
  await applyPlan(saved.planId)
  await instance.page.getByRole('button', { name: '结束本轮并开始新练习', exact: true }).click()
  assert.notEqual((await practice()).session.sessionId, active.session.sessionId)
  await instance.page.getByRole('button', { name: '跳过本题', exact: true }).click()
  await expect(instance.page.getByLabel('练习进度')).toContainText('第 2 / 30')
  const fresh = await practice()
  assert.equal(fresh.item.questionId, 'uart2-020')
  assert.equal(
    fresh.item.versionId,
    updated.versions.find((row) => row.questionId === 'uart2-020').versionId,
  )
  assert.equal(fresh.item.revealed, false)
  assert(!Object.hasOwn(fresh.item, 'answer'))
  await instance.page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  await expect(
    instance.page.getByRole('heading', { name: '适用条件与来源', exact: true }),
  ).toBeVisible()
  assert((await practice()).item.answer.markdown.includes('0x00C0'))
  await instance.page.screenshot({ path: join(output, 'revised-answer.png'), fullPage: true })
  report.checks.newRoundUsesCurrentVersionAndHidesAnswerUntilReveal = true
  for (const [file, expected] of inputHashes)
    assert.equal(hash(await readFile(file)), expected, file)
  const final = await snapshotDatabase(dataDirectory)
  assert.equal(final.integrity.length, 1)
  assert.equal(final.integrity[0].integrity_check, 'ok')
  assert.deepEqual(final.foreignKeys, [])
  report.finalDatabase = {
    counts: final.counts,
    integrity: final.integrity,
    foreignKeys: final.foreignKeys,
  }
  report.checks.inputFilesUnchangedByRun = true
  report.completed = true
} catch (error) {
  report.errors.push({ phase: 'run', message: error.stack ?? String(error) })
  if (instance)
    await instance.page
      .screenshot({ path: join(output, 'failure.png'), fullPage: true })
      .catch(() => {})
} finally {
  if (instance)
    await close(instance).catch((error) =>
      report.errors.push({ phase: 'cleanup', message: String(error) }),
    )
  report.completed = report.completed === true && report.errors.length === 0
  if (!report.completed) process.exitCode = 1
  await run.save()
  console.log(
    JSON.stringify({
      output,
      completed: report.completed,
      checks: report.checks,
      errors: report.errors,
    }),
  )
}
