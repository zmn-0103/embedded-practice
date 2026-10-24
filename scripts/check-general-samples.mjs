import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import {
  assert,
  close,
  expect,
  hash,
  join,
  launch,
  openPage,
  snapshotDatabase,
} from './m5-desktop-harness.mjs'

assert(
  process.argv.length === 4,
  '用法：node scripts/check-general-samples.mjs 新证据目录 明确的结构9解包EXE',
)
const workspace = fileURLToPath(new URL('../', import.meta.url))
const output = resolve(process.argv[2])
const executable = resolve(process.argv[3])
const mappingFile = join(workspace, 'question-banks/sources/general/样题来源映射.json')
const mapping = JSON.parse(await readFile(mappingFile, 'utf8'))
assert.equal(mapping.files.length, 5)
assert.equal(mapping.questions.length, 10)
assert.equal(new Set(mapping.questions.map((item) => item.questionId)).size, 10)
const inputs = await Promise.all(
  [mappingFile, ...mapping.files.map((file) => join(workspace, file.file))].map(async (file) => [
    file,
    hash(await readFile(file)),
  ]),
)
for (const file of mapping.files)
  assert.equal(hash(await readFile(join(workspace, file.file))), file.sha256, file.file)
await mkdir(output)
const root = await mkdtemp(join(tmpdir(), 'embedded-practice-m5b-general-samples-'))
const dataDirectory = join(root, '中文 数据')
await mkdir(dataDirectory)
const report = {
  startedAt: new Date().toISOString(),
  dataDirectory,
  events: [],
  errors: [],
  checks: {},
  exercisedQuestionIds: [],
  boundary:
    '新建临时库；显式结构9解包EXE；仅文件选择框替身。自评和草稿为自动化合成输入，不代表用户掌握、内容审阅、原生输入、硬件或安装验收。',
}
const run = {
  output,
  dataDirectory,
  executable,
  report,
  save: () => writeFile(join(output, 'result.json'), JSON.stringify(report, null, 2) + '\n'),
}
const normalized = (value) => value.replaceAll('\r\n', '\n').trim()
let instance

// 数据路径仅由本脚本新建；只读取固定业务表，不接受外部数据库或SQL。
function protectedState() {
  const db = new DatabaseSync(join(dataDirectory, 'practice.sqlite3'), { readOnly: true })
  try {
    db.exec('BEGIN')
    const tables = [
      'topics',
      'questions',
      'question_versions',
      'question_user_state',
      'practice_sessions',
      'practice_items',
      'practice_receipts',
      'categories',
    ]
    return JSON.stringify(
      Object.fromEntries(
        tables.map((table) => [table, db.prepare(`SELECT * FROM ${table} ORDER BY 1,2`).all()]),
      ),
    )
  } finally {
    db.close()
  }
}

async function currentPractice() {
  const result = await instance.page.evaluate(() =>
    globalThis.desktop.practice.read({ sessionId: null }),
  )
  assert(result.ok)
  return result.value
}

async function importSamples(expectedCounts) {
  await openPage(instance.page, '题库')
  await instance.application.evaluate(
    ({ dialog }, files) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: files })
    },
    mapping.files.map((file) => join(workspace, file.file)),
  )
  await instance.page.getByRole('button', { name: '导入题库', exact: true }).click()
  await expect(instance.page.getByRole('heading', { name: '导入预览', exact: true })).toBeVisible()
  const counts = await instance.page.locator('.count-grid dd').allTextContents()
  assert.deepEqual(counts, expectedCounts)
  await instance.page.getByRole('button', { name: '确认导入', exact: true }).click()
  await expect(instance.page.getByText(/^导入完成：/)).toBeVisible()
  report.events.push({ phase: 'import', files: mapping.files.map((file) => file.file), counts })
  await run.save()
}

async function normalClose() {
  const closed = instance.application.waitForEvent('close', { timeout: 20_000 })
  await instance.application.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].close(),
  )
  await closed
  instance = undefined
}

async function answerCurrent(position) {
  await expect(instance.page.getByLabel('练习进度')).toContainText(`第 ${position} / 10`)
  const before = await currentPractice()
  const expected = mapping.questions.find((item) => item.questionId === before.item.questionId)
  assert(expected)
  assert.equal(before.item.topicId, expected.topicId)
  assert.equal(before.item.revealed, false)
  assert(!Object.hasOwn(before.item, 'answer'))
  await expect(
    instance.page.getByRole('region', { name: '练习参考答案', exact: true }),
  ).toHaveCount(0)
  await instance.page
    .getByRole('textbox', { name: '我的答案', exact: true })
    .fill(`通用样题验收合成输入 ${position}，不代表用户作答。`)
  await instance.page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  await expect(
    instance.page.getByRole('region', { name: '练习参考答案', exact: true }),
  ).toBeVisible()
  await expect(
    instance.page
      .getByRole('region', { name: '练习参考答案', exact: true })
      .locator('strong')
      .first(),
  ).toHaveText('核心结论：')
  const after = await currentPractice()
  assert.equal(hash(normalized(after.item.answer.markdown)), expected.answerSha256)
  if (position === 1 || position === 10)
    await instance.page.screenshot({ path: join(output, `answer-${position}.png`), fullPage: true })
  report.exercisedQuestionIds.push(expected.questionId)
  await instance.page.getByRole('button', { name: '不熟', exact: true }).click()
}

try {
  instance = await launch(run)
  await expect(instance.page.getByText(/20261024\.1-plans/)).toBeVisible()
  report.actualExecutable = await instance.application.evaluate(() => process.execPath)
  assert.equal(relative(executable, report.actualExecutable), '')
  await importSamples(['10', '0', '0', '0', '0', '0'])
  const initial = await snapshotDatabase(dataDirectory)
  assert.equal(initial.counts.topics, 5)
  assert.equal(initial.counts.questions, 10)
  assert.equal(initial.counts.question_versions, 10)
  const db = new DatabaseSync(join(dataDirectory, 'practice.sqlite3'), { readOnly: true })
  try {
    report.schema = db.prepare('PRAGMA user_version').get().user_version
    assert.equal(report.schema, 9)
    const rows = db.prepare('SELECT * FROM questions ORDER BY topic_id,question_id').all()
    for (const item of mapping.questions) {
      const row = rows.find(
        (value) => value.topic_id === item.topicId && value.question_id === item.questionId,
      )
      assert(row)
      assert.equal(row.title, item.title)
      assert.deepEqual(JSON.parse(row.tags_json), item.tags)
      assert.equal(row.difficulty, item.difficulty)
      const version = initial.versions.find((value) => value.questionId === item.questionId)
      assert.equal(hash(normalized(version.question)), item.questionSha256)
      assert.equal(hash(normalized(version.answer)), item.answerSha256)
    }
  } finally {
    db.close()
  }
  report.checks.tenQuestionAnswerPairsAndMetadataExact = true
  const manager = instance.page.locator('.category-manager')
  await manager.locator('summary').click()
  await manager.getByLabel('新分类名称', { exact: true }).fill('嵌入式通用基础')
  await manager.getByRole('button', { name: '添加分类', exact: true }).click()
  await expect(manager.getByText('分类已保存。', { exact: true })).toBeVisible()
  for (const file of mapping.files) {
    await manager.getByLabel('调整归属的专题', { exact: true }).selectOption(file.topicId)
    await manager.getByLabel('归入分类', { exact: true }).selectOption({ label: '嵌入式通用基础' })
    await manager.getByRole('button', { name: '保存专题归属', exact: true }).click()
    await expect(manager).toContainText('当前归属：嵌入式通用基础')
  }
  await openPage(instance.page, '开始练习')
  await instance.page.getByText('按分类选择专题', { exact: true }).click()
  await instance.page.getByRole('button', { name: '练习分类：嵌入式通用基础', exact: true }).click()
  await instance.page.getByLabel('练习专题', { exact: true }).selectOption('')
  await instance.page.getByLabel('本轮题数', { exact: true }).selectOption('all')
  await expect(instance.page.getByText('匹配 10 题', { exact: true })).toBeVisible()
  await instance.page.screenshot({ path: join(output, 'category-ready.png'), fullPage: true })
  await instance.page.getByRole('button', { name: '开始练习', exact: true }).click()
  await answerCurrent(1)
  await answerCurrent(2)
  await expect(instance.page.getByLabel('练习进度')).toContainText('第 3 / 10')
  const draft = '通用样题正常关闭验收，非用户答案\n    保留缩进与中文末行'
  await instance.page.getByRole('textbox', { name: '我的答案', exact: true }).fill(draft)
  const active = await currentPractice()
  await normalClose()
  const before = protectedState()
  report.protectedBeforeSha256 = hash(before)
  instance = await launch(run)
  await importSamples(['0', '0', '0', '10', '0', '0'])
  assert.equal(protectedState(), before)
  report.protectedAfterReimportSha256 = hash(protectedState())
  await openPage(instance.page, '开始练习')
  await instance.page.getByRole('button', { name: '继续练习', exact: true }).click()
  const resumed = await currentPractice()
  assert.equal(resumed.session.sessionId, active.session.sessionId)
  assert.equal(resumed.item.versionId, active.item.versionId)
  assert.equal(resumed.item.revealed, false)
  await expect(instance.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
    draft,
  )
  report.checks.categoryQueueDraftAndRatingsSurviveCloseAndReimport = true
  for (let position = 3; position <= 10; position++) await answerCurrent(position)
  await expect(
    instance.page.getByRole('heading', { name: '本轮已完成', exact: true }),
  ).toBeVisible()
  assert.deepEqual(
    [...report.exercisedQuestionIds].sort(),
    mapping.questions.map((q) => q.questionId).sort(),
  )
  report.checks.allTenAnswersHiddenThenRevealedAndRated = true
  const final = await snapshotDatabase(dataDirectory)
  assert.equal(final.integrity.length, 1)
  assert.equal(final.integrity[0].integrity_check, 'ok')
  assert.deepEqual(final.foreignKeys, [])
  assert.equal(final.counts.question_versions, 10)
  report.finalDatabase = final
  for (const [file, expected] of inputs) assert.equal(hash(await readFile(file)), expected, file)
  report.checks.inputsUnchangedByRun = true
  await normalClose()
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
  report.finishedAt = new Date().toISOString()
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
