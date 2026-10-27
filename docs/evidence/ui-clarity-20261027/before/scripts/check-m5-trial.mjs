import { readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import {
  assert,
  close,
  createRun,
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
  '用法：node scripts/check-m5-trial.mjs 样本清单.json 新证据目录',
)
const run = await createRun(process.argv[2], process.argv[3], 'trial')
let sourceMap
let instance
async function readView(sessionId = null) {
  const result = await instance.page.evaluate(
    (id) => globalThis.desktop.practice.read({ sessionId: id }),
    sessionId,
  )
  assert(result.ok, JSON.stringify(result))
  return result.value
}
function storedQueue() {
  const database = new DatabaseSync(join(run.dataDirectory, 'practice.sqlite3'), { readOnly: true })
  try {
    return database
      .prepare(
        'SELECT i.position, q.question_id AS questionId, i.version_id AS versionId, i.draft, i.rating, i.revealed_at AS revealedAt, v.answer_markdown AS answer FROM practice_items i JOIN questions q ON q.id=i.question_id JOIN question_versions v ON v.id=i.version_id ORDER BY i.position',
      )
      .all()
  } finally {
    database.close()
  }
}
try {
  sourceMap = JSON.parse(
    await readFile(join(dirname(run.samples.trial.file), '题答来源.json'), 'utf8'),
  )
  instance = await launch(run)
  const imported = await importBank(instance, run.samples.trial.file, run, '30题来源选集首次导入')
  assert.deepEqual(imported.counts, ['30', '0', '0', '0', '0', '0'])
  const initial = await snapshotDatabase(run.dataDirectory)
  assert.equal(initial.counts.questions, 30)
  const sourceChecks = []
  for (const mapping of sourceMap.mappings) {
    const row = initial.versions.find((version) => version.questionId === mapping.questionId)
    assert(row, mapping.questionId)
    assert.equal(hash(row.question), mapping.questionSha256)
    assert.equal(hash(row.answer), mapping.answerSha256)
    sourceChecks.push({
      questionId: row.questionId,
      versionId: row.versionId,
      questionSha256: hash(row.question),
      answerSha256: hash(row.answer),
      matched: true,
    })
  }
  run.report.sourceChecks = sourceChecks
  await instance.page.getByRole('button', { name: /uart2-019/ }).click()
  await instance.page.getByRole('button', { name: '收藏本题', exact: true }).click()
  await expect(instance.page.getByRole('button', { name: '取消收藏', exact: true })).toBeVisible()
  await openPage(instance.page, '开始练习')
  await instance.page.getByLabel('本轮题数', { exact: true }).selectOption('all')
  await instance.page.getByRole('button', { name: '开始练习', exact: true }).click()
  await expect(instance.page.getByLabel('练习进度', { exact: true })).toContainText('第 1 / 30')
  const first = await readView()
  const sessionId = first.session.sessionId
  const draft = 'M5 独立验收草稿（不是用户学习答案）\n    indented_line();\n中文第二行'
  await instance.page.getByRole('textbox', { name: '我的答案', exact: true }).fill(draft)
  await expect.poll(async () => (await readView()).item.draft.text).toBe(draft)
  await expect(instance.page.locator('.practice-save')).toHaveText('已保存')
  await instance.page.getByRole('button', { name: '返回首页', exact: true }).click()
  const repeated = await importBank(instance, run.samples.trial.file, run, '相同30题重复导入')
  assert.deepEqual(repeated.counts, ['0', '0', '0', '30', '0', '0'])

  // 只更新新建临时副本的一道答案；原笔记和交付选集保持原文。
  const trial = await readFile(run.samples.trial.file, 'utf8')
  const mapping = sourceMap.mappings[0]
  const originalAnswer = `${mapping.verdict ? `**${mapping.verdict}**\n\n` : ''}${mapping.answer.body}`
  const answerOffset = trial.indexOf(originalAnswer)
  assert(answerOffset >= 0 && trial.lastIndexOf(originalAnswer) === answerOffset)
  const updateMarker =
    '\n\n#### 验收更新标记\n\nM5-TRIAL-UPDATED：仅此临时副本用于检查内容更新与旧轮固定版本。'
  const updateFile = join(dirname(run.dataDirectory), '30题 更新验收副本.md')
  await writeFile(
    updateFile,
    trial.slice(0, answerOffset) +
      originalAnswer +
      updateMarker +
      trial.slice(answerOffset + originalAnswer.length),
    { flag: 'wx' },
  )
  const updated = await importBank(instance, updateFile, run, '仅临时副本的1题内容更新')
  assert.deepEqual(updated.counts, ['0', '1', '0', '29', '0', '0'])
  const changed = await snapshotDatabase(run.dataDirectory)
  assert.equal(changed.counts.questions, 30)
  assert.equal(changed.counts.question_versions, 31)
  assert.equal(changed.versions[0].sequence, 2)
  assert(changed.versions[0].answer.includes('M5-TRIAL-UPDATED'))
  await close(instance)
  instance = undefined
  instance = await launch(run)
  await instance.page.getByRole('button', { name: '继续练习', exact: true }).click()
  await expect(instance.page.getByLabel('练习进度', { exact: true })).toContainText('第 1 / 30')
  await expect(instance.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
    draft,
  )
  const favorite = await instance.page.evaluate(
    (topicId) => globalThis.desktop.library.getQuestion({ topicId, questionId: 'uart2-019' }),
    sourceMap.topicId,
  )
  assert(favorite.ok && favorite.value.favorite)
  run.report.favoriteRetainedAfterUpdateAndReopen = true
  run.report.reopenDraftMatched = true
  run.report.questions = []
  let tablesShown = 0
  const longest = sourceMap.mappings.reduce((left, right) =>
    left.answer.body.length > right.answer.body.length ? left : right,
  )
  for (const [index, sourceQuestion] of sourceMap.mappings.entries()) {
    await expect(instance.page.getByLabel('练习进度', { exact: true })).toContainText(
      `第 ${index + 1} / 30`,
    )
    const hidden = await readView(sessionId)
    assert.equal(hidden.item.questionId, sourceQuestion.questionId)
    assert.equal(hidden.item.revealed, false)
    assert.equal(hidden.item.versionId, sourceChecks[index].versionId)
    assert(!Object.hasOwn(hidden.item, 'answer'))
    await expect(
      instance.page.getByRole('region', { name: '练习参考答案', exact: true }),
    ).toHaveCount(0)
    await instance.page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await expect(
      instance.page.getByRole('region', { name: '练习参考答案', exact: true }),
    ).toBeVisible()
    const revealed = await readView(sessionId)
    assert.equal(hash(revealed.item.answer.markdown), sourceQuestion.answerSha256)
    assert(!revealed.item.answer.markdown.includes('M5-TRIAL-UPDATED'))
    const tables = await instance.page.locator('.practice-reading table').count()
    tablesShown += tables
    if (tables || sourceQuestion.questionId === longest.questionId) {
      await instance.page.screenshot({
        path: join(run.output, `${sourceQuestion.questionId}-revealed.png`),
        fullPage: true,
      })
    }
    const rating = ['不会', '不熟', '掌握'][index] ?? null
    const next = instance.page.getByRole('button', {
      name: rating ?? '暂不评价，下一题',
      exact: true,
    })
    await expect(next).toBeEnabled()
    run.report.questions.push({
      questionId: sourceQuestion.questionId,
      originalNumber: sourceQuestion.originalNumber,
      versionId: hidden.item.versionId,
      hiddenBeforeReveal: true,
      sourceAnswerMatched: true,
      oldVersionPreserved: true,
      tables,
      ratingForTestOnly: rating,
    })
    await next.click()
  }
  await expect(
    instance.page.getByRole('heading', { name: '本轮已完成', exact: true }),
  ).toBeVisible()
  const finished = await readView(sessionId)
  assert.equal(finished.session.status, 'finished')
  assert.equal(finished.session.counts.revealed, 30)
  assert.equal(finished.session.counts.rated, 3)
  assert.equal(finished.session.counts.unrated, 27)
  assert.deepEqual(finished.session.counts.ratings, { 不会: 1, 不熟: 1, 掌握: 1 })
  assert.equal(tablesShown, run.samples.trial.nodes.table)
  const queue = storedQueue()
  assert.equal(queue.length, 30)
  assert.equal(queue[0].draft, draft)
  for (const [index, item] of queue.entries()) {
    assert.equal(item.position, index)
    assert.equal(item.versionId, sourceChecks[index].versionId)
    assert.equal(hash(item.answer), sourceChecks[index].answerSha256)
    assert(item.revealedAt)
  }
  run.report.finishedSession = finished.session
  run.report.tablesShown = tablesShown
  run.report.queueVersionsAndAnswersPreserved = true
  run.report.sourceFilesUnchanged = true
  for (const sourceFile of run.samples.sourceFiles)
    assert.equal(hash(await readFile(sourceFile.path)), sourceFile.sha256)
  assert.equal(hash(await readFile(run.samples.trial.file)), run.samples.trial.sha256)
  await instance.page.screenshot({
    path: join(run.output, '30-question-finished.png'),
    fullPage: true,
  })
  const final = await snapshotDatabase(run.dataDirectory)
  assert.equal(final.integrity[0].integrity_check, 'ok')
  assert.deepEqual(final.foreignKeys, [])
  run.report.finalDatabase = {
    counts: final.counts,
    integrity: final.integrity,
    foreignKeys: final.foreignKeys,
  }
  run.report.boundary =
    'Real Windows unpacked UI and production IPC/worker/SQLite with file-dialog selection replaced. No technical answer review or human learning acceptance; first three ratings are explicit isolated test inputs. Source self-tests contain no fenced code or images; indented draft was programmatically entered, not an IME or external-editor test.'
  run.report.completed = true
} catch (error) {
  run.report.errors.push({ phase: 'run', message: error.stack ?? String(error) })
  if (instance)
    await instance.page
      .screenshot({ path: join(run.output, 'failure.png'), fullPage: true })
      .catch(() => {})
  process.exitCode = 1
} finally {
  if (instance)
    await close(instance).catch((error) =>
      run.report.errors.push({ phase: 'cleanup', message: String(error) }),
    )
  if (run.report.errors.length) {
    run.report.completed = false
    process.exitCode = 1
  }
  run.report.finishedAt = new Date().toISOString()
  await run.save()
  console.log(
    JSON.stringify(
      {
        output: run.output,
        completed: run.report.completed ?? false,
        questions: run.report.questions?.length,
        tablesShown: run.report.tablesShown,
        finalDatabase: run.report.finalDatabase,
        errors: run.report.errors,
      },
      null,
      2,
    ),
  )
}
