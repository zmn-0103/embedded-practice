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
  process.argv[2] && process.argv[3],
  '用法：node scripts/check-uart-metadata.mjs 原版30题.md 新证据目录 [完整解包目录中的EXE]',
)
const workspace = fileURLToPath(new URL('../', import.meta.url))
const baseline = resolve(process.argv[2])
const bank = join(workspace, 'question-banks/trials/STM32F103-UART第二层-30题试用.md')
const indexFile = join(workspace, 'question-banks/trials/UART题目整理清单.json')
const sourceFile = join(workspace, 'question-banks/trials/题答来源.json')
const output = resolve(process.argv[3])
await mkdir(output)
const temporaryRoot = await mkdtemp(join(tmpdir(), 'embedded-practice-m5b-uart-metadata-'))
const dataDirectory = join(temporaryRoot, '中文 数据')
await mkdir(dataDirectory)
const report = {
  startedAt: new Date().toISOString(),
  baseline,
  bank,
  dataDirectory,
  events: [],
  errors: [],
  checks: {},
  boundary:
    '独立临时数据目录、真实Windows解包EXE/界面/生产解析与事务；仅文件选择框被明确替换。验收草稿和自评不是用户答案或学习结果；不代表技术审阅、硬件或安装验收。',
}
const run = {
  output,
  dataDirectory,
  report,
  executable: resolve(
    process.argv[4] ??
      join(workspace, 'release/findability-20261023-r2/win-unpacked/embedded-practice.exe'),
  ),
  async save() {
    await writeFile(join(output, 'result.json'), JSON.stringify(report, null, 2) + '\n')
  },
}
let instance
let sourceMap
const filters = {
  query: '',
  tag: null,
  difficulty: null,
  mastery: 'all',
  favoritesOnly: false,
}

async function current() {
  const response = await instance.page.evaluate(() =>
    globalThis.desktop.practice.read({ sessionId: null }),
  )
  assert(response.ok, JSON.stringify(response))
  return response.value
}

async function list(changes = {}, page = 1) {
  const response = await instance.page.evaluate(
    (request) => globalThis.desktop.library.listQuestions(request),
    { topicId: sourceMap.topicId, archived: false, page, filters: { ...filters, ...changes } },
  )
  assert(response.ok, JSON.stringify(response))
  return response.value
}

async function matchingIds(changes = {}) {
  const first = await list(changes)
  const questions = [...first.questions]
  for (let page = 2; page <= Math.ceil(first.total / first.pageSize); page++) {
    const next = await list(changes, page)
    assert.equal(next.total, first.total)
    questions.push(...next.questions)
  }
  assert.equal(questions.length, first.total)
  assert(questions.every((question) => !Object.hasOwn(question, 'answer')))
  return questions.map((question) => question.questionId)
}

// 路径只来自本脚本刚创建的临时根；只读事务比较整个旧队列及其持久化记录。
function protectedState() {
  const database = new DatabaseSync(join(dataDirectory, 'practice.sqlite3'), { readOnly: true })
  try {
    database.exec('BEGIN')
    return {
      versions: database.prepare('SELECT * FROM question_versions ORDER BY id').all(),
      sessions: database.prepare('SELECT * FROM practice_sessions ORDER BY id').all(),
      items: database.prepare('SELECT * FROM practice_items ORDER BY session_id, position').all(),
      states: database.prepare('SELECT * FROM question_user_state ORDER BY question_id').all(),
      receipts: database.prepare('SELECT * FROM practice_receipts ORDER BY request_id').all(),
    }
  } finally {
    database.close()
  }
}

async function checkOriginalContent() {
  const snapshot = await snapshotDatabase(dataDirectory)
  assert.equal(snapshot.counts.questions, 30)
  assert.equal(snapshot.counts.question_versions, 30)
  assert.equal(snapshot.integrity[0].integrity_check, 'ok')
  assert.deepEqual(snapshot.foreignKeys, [])
  for (const mapping of sourceMap.mappings) {
    const version = snapshot.versions.find((item) => item.questionId === mapping.questionId)
    assert(version, mapping.questionId)
    assert.equal(version.sequence, 1)
    assert.equal(hash(version.question), mapping.questionSha256, mapping.questionId)
    assert.equal(hash(version.answer), mapping.answerSha256, mapping.questionId)
  }
  return snapshot
}

try {
  await run.save()
  const originals = new Map(
    await Promise.all(
      [baseline, bank, indexFile, sourceFile].map(async (file) => [
        file,
        hash(await readFile(file)),
      ]),
    ),
  )
  const index = JSON.parse(await readFile(indexFile, 'utf8'))
  sourceMap = JSON.parse(await readFile(sourceFile, 'utf8'))
  assert.equal(index.topicId, sourceMap.topicId)
  assert.equal(index.questions.length, 30)
  assert.deepEqual(
    index.questions.map((question) => question.questionId),
    sourceMap.mappings.map((question) => question.questionId),
  )
  assert(index.questions.every((question) => question.userReview === '待用户审阅'))
  instance = await launch(run)
  await expect(instance.page.getByText(/构建 20261023\.3-findability/)).toBeVisible()
  const initial = await importBank(instance, baseline, run, '原版30题首次导入')
  assert.deepEqual(initial.counts, ['30', '0', '0', '0', '0', '0'])
  await checkOriginalContent()

  await instance.page.getByRole('button', { name: /uart2-019/ }).click()
  await instance.page.getByRole('button', { name: '收藏本题', exact: true }).click()
  await expect(instance.page.getByRole('button', { name: '取消收藏', exact: true })).toBeVisible()
  await openPage(instance.page, '开始练习')
  await instance.page.getByLabel('练习专题', { exact: true }).selectOption(index.topicId)
  await instance.page.getByLabel('本轮题数', { exact: true }).selectOption('all')
  await instance.page.getByRole('button', { name: '开始练习', exact: true }).click()
  await expect(instance.page.getByLabel('练习进度', { exact: true })).toContainText('第 1 / 30')
  const firstDraft = 'UART 元数据验收专用，非用户答案\n    preserved_line();\n中文末行'
  await instance.page.getByRole('textbox', { name: '我的答案', exact: true }).fill(firstDraft)
  await expect(instance.page.locator('.practice-save')).toHaveText('已保存')
  await instance.page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  const rating = instance.page.getByRole('button', { name: '不熟', exact: true })
  await expect(rating).toBeEnabled()
  await rating.click()
  await expect(instance.page.getByLabel('练习进度', { exact: true })).toContainText('第 2 / 30')
  const secondDraft = '第二题元数据验收草稿\n    keep_draft();\n结束'
  await instance.page.getByRole('textbox', { name: '我的答案', exact: true }).fill(secondDraft)
  await expect.poll(async () => (await current()).item.draft.text).toBe(secondDraft)
  await expect(instance.page.locator('.practice-save')).toHaveText('已保存')
  const active = await current()
  await instance.page.getByRole('button', { name: '返回首页', exact: true }).click()
  const before = protectedState()
  assert.equal(before.items.length, 30)
  assert.equal(before.items[0].draft, firstDraft)
  assert.equal(before.items[0].rating, '不熟')
  assert(before.items[0].revealed_at)
  assert.equal(before.items[1].draft, secondDraft)
  report.protectedBeforeSha256 = hash(JSON.stringify(before))

  const changed = await importBank(instance, bank, run, '整理版30题仅元数据更新')
  assert.deepEqual(changed.counts, ['0', '0', '30', '0', '0', '0'])
  assert.deepEqual(protectedState(), before)
  const all = await list()
  assert.equal(all.total, 30)
  const tags = [...new Set(index.questions.flatMap((question) => question.tags))]
  assert.deepEqual([...all.tagOptions].sort(), [...tags].sort())
  report.metadata = []
  for (const question of index.questions) {
    const result = await instance.page.evaluate(
      (identity) => globalThis.desktop.library.getQuestion(identity),
      { topicId: index.topicId, questionId: question.questionId },
    )
    assert(result.ok, JSON.stringify(result))
    assert.equal(result.value.title, question.title)
    assert.deepEqual(result.value.tags, question.tags)
    assert.equal(result.value.difficulty, question.difficulty)
    assert.equal(result.value.contentUpdated, false)
    if (question.questionId === 'uart2-019') {
      assert.equal(result.value.favorite, true)
      assert.equal(result.value.currentRating, '不熟')
      assert.equal(result.value.practiced, true)
    }
    report.metadata.push({ questionId: question.questionId, matched: true })
  }
  report.filterChecks = []
  for (const tag of tags) {
    const expected = index.questions.filter((question) => question.tags.includes(tag))
    assert.deepEqual(
      await matchingIds({ tag }),
      expected.map((question) => question.questionId),
    )
    report.filterChecks.push({ tag, count: expected.length })
  }
  for (const difficulty of ['基础', '进阶', '综合']) {
    const expected = index.questions.filter((question) => question.difficulty === difficulty)
    assert.deepEqual(
      await matchingIds({ difficulty }),
      expected.map((question) => question.questionId),
    )
    report.filterChecks.push({ difficulty, count: expected.length })
  }
  const picker = instance.page.getByRole('combobox', { name: '题库标签', exact: true })
  await picker.fill('波特')
  await instance.page.getByRole('option', { name: '波特率', exact: true }).click()
  await instance.page.getByLabel('题库难度', { exact: true }).selectOption('进阶')
  await instance.page.getByRole('button', { name: '筛选题库', exact: true }).click()
  await expect(instance.page.getByText('共 2 题', { exact: true })).toBeVisible()
  for (const id of ['uart2-029', 'uart2-041'])
    await expect(instance.page.getByRole('button', { name: new RegExp(id) })).toBeVisible()
  await instance.page.getByRole('button', { name: /uart2-029/ }).click()
  await instance.page.screenshot({
    path: join(output, 'uart-metadata-filters.png'),
    fullPage: true,
  })
  report.checks.tagAndDifficultyUi = true

  const repeated = await importBank(instance, bank, run, '整理版再次导入保持幂等')
  assert.deepEqual(repeated.counts, ['0', '0', '0', '30', '0', '0'])
  assert.deepEqual(protectedState(), before)
  await close(instance)
  instance = undefined
  instance = await launch(run)
  await instance.page.getByRole('button', { name: '继续练习', exact: true }).click()
  await expect(instance.page.getByLabel('练习进度', { exact: true })).toContainText('第 2 / 30')
  await expect(instance.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
    secondDraft,
  )
  const resumed = await current()
  assert.equal(resumed.session.sessionId, active.session.sessionId)
  assert.equal(resumed.item.title, sourceMap.mappings[1].title)
  assert.equal(resumed.item.versionId, active.item.versionId)
  assert.equal(resumed.item.revealed, false)
  assert(!Object.hasOwn(resumed.item, 'answer'))
  assert.deepEqual(protectedState(), before)
  report.protectedAfterReopenSha256 = hash(JSON.stringify(protectedState()))
  report.checks.originalQueueMetadataAndVersionsRetained = true
  report.checks.historyDraftFavoriteRatingAndReceiptsRetained = true
  report.checks.noNewContentVersionOrUpdateMarker = true
  report.checks.idempotentReimport = true
  report.checks.normalCloseAndResume = true
  await instance.page.screenshot({
    path: join(output, 'uart-original-queue-resumed.png'),
    fullPage: true,
  })
  const final = await checkOriginalContent()
  report.finalDatabase = {
    counts: final.counts,
    integrity: final.integrity,
    foreignKeys: final.foreignKeys,
  }
  for (const [file, sha256] of originals) assert.equal(hash(await readFile(file)), sha256, file)
  report.checks.inputFilesUnchangedByTest = true
  report.completed = true
} catch (error) {
  report.errors.push({ phase: 'run', message: error.stack ?? String(error) })
  if (instance)
    await instance.page
      .screenshot({ path: join(output, 'failure.png'), fullPage: true })
      .catch(() => {})
  process.exitCode = 1
} finally {
  if (instance)
    await close(instance).catch((error) =>
      report.errors.push({ phase: 'cleanup', message: error.stack ?? String(error) }),
    )
  if (report.errors.length) {
    report.completed = false
    process.exitCode = 1
  }
  report.finishedAt = new Date().toISOString()
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
