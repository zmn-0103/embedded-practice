import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { _electron } from '@playwright/test'

// 已授权的正式桌面交付，不是自动化测试；测试只能使用独立临时目录。
const root = fileURLToPath(new URL('../', import.meta.url))
const executable = resolve(root, 'release/V0.0.3-20261030.1/win-unpacked/embedded-practice.exe')
assert(process.env.APPDATA, '不能确定已授权的个人数据位置。')
const directory = resolve(process.env.APPDATA, 'embedded-practice')
const manifest = JSON.parse(
  readFileSync(resolve(root, 'question-banks/releases/v003-20261030/manifest.json'), 'utf8'),
)
const paths = manifest.files.map((file) => resolve(root, file.file))
const hash = (rows) => createHash('sha256').update(JSON.stringify(rows)).digest('hex')
const backups = () => readdirSync(join(directory, 'backups')).sort()

function read(work) {
  const database = new DatabaseSync(join(directory, 'practice.sqlite3'), { readOnly: true })
  try {
    return work(database)
  } finally {
    database.close()
  }
}
const originalLimit = read((db) => ({
  question: db.prepare('SELECT max(id) AS maximum FROM questions').get().maximum ?? 0,
  version: db.prepare('SELECT max(id) AS maximum FROM question_versions').get().maximum ?? 0,
}))
const learningTables = [
  'practice_sessions',
  'practice_items',
  'practice_receipts',
  'practice_plans',
  'appearance_settings',
  'installed_themes',
  'personal_notes',
  'question_personal_tags',
  'review_todos',
  'question_relations',
  'recent_knowledge_searches',
  'daily_targets',
  'study_goals',
  'quota_settings',
  'learning_activities',
  'question_sets',
  'question_set_items',
]
function learningSnapshot() {
  return read((db) => {
    assert.equal(db.prepare('PRAGMA user_version').get().user_version, 17)
    const result = {}
    for (const table of learningTables) {
      const rows = db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()
      result[table] = { rows: rows.length, sha256: hash(rows) }
    }
    for (const [table, filter] of [
      ['question_user_state', `question_id <= ${originalLimit.question}`],
      ['question_versions', `id <= ${originalLimit.version}`],
      ['image_resources', '1=1'],
      ['version_images', `version_id <= ${originalLimit.version}`],
    ]) {
      const rows = db.prepare(`SELECT * FROM ${table} WHERE ${filter} ORDER BY rowid`).all()
      result[table] = { rows: rows.length, sha256: hash(rows) }
    }
    return result
  })
}
const before = learningSnapshot()
const backupsBefore = backups()
const env = { ...process.env }
for (const name of [
  'EMBEDDED_PRACTICE_TEST_DATA_DIR',
  'ELECTRON_RUN_AS_NODE',
  'ELECTRON_RENDERER_URL',
])
  delete env[name]
const application = await _electron.launch({
  executablePath: executable,
  args: [],
  env,
  timeout: 20_000,
})
try {
  const page = await application.firstWindow()
  await page.locator('.app-shell').waitFor()
  const actual = await application.evaluate(({ app }) => ({
    executable: process.execPath,
    version: app.getVersion(),
    packaged: app.isPackaged,
    data: app.getPath('userData'),
  }))
  assert.equal(resolve(actual.executable), executable)
  assert.equal(actual.version, '0.0.3')
  assert.equal(actual.packaged, true)
  assert.equal(resolve(actual.data), directory)
  await page.locator('footer').filter({ hasText: '20261030.1-v003-bank' }).waitFor()
  const status = await page.evaluate(() => globalThis.desktop.getAppStatus())
  assert(status.ok, JSON.stringify(status))
  await application.evaluate(({ dialog }, selected) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: selected })
  }, paths)
  const preview = await page.evaluate(() => globalThis.desktop.library.previewImport())
  assert(preview.ok, JSON.stringify(preview))
  const committed = await page.evaluate(
    (token) => globalThis.desktop.library.commitImport(token),
    preview.value.token,
  )
  assert(committed.ok, JSON.stringify(committed))
  let navigation = await page.evaluate(() =>
    globalThis.desktop.library.listQuestions({ topicId: null, archived: false, page: 1 }),
  )
  assert(navigation.ok, JSON.stringify(navigation))
  const categoryChanges = []
  for (const file of manifest.files) {
    const topic = navigation.value.topics.find((item) => item.topicId === file.topicId)
    assert.equal(topic?.activeCount, file.count, file.topicId)
    if (topic.categoryId !== null) continue
    let category = navigation.value.categories.find((item) => item.title === file.board)
    if (!category) {
      const created = await page.evaluate(
        (title) => globalThis.desktop.library.updateCategory({ kind: 'create', title }),
        file.board,
      )
      assert(created.ok, JSON.stringify(created))
      navigation = await page.evaluate(() =>
        globalThis.desktop.library.listQuestions({ topicId: null, archived: false, page: 1 }),
      )
      assert(navigation.ok, JSON.stringify(navigation))
      category = navigation.value.categories.find((item) => item.title === file.board)
    }
    assert(category, file.board)
    const assigned = await page.evaluate(
      (input) => globalThis.desktop.library.updateCategory(input),
      {
        kind: 'assign',
        topicId: file.topicId,
        categoryId: category.categoryId,
      },
    )
    assert(assigned.ok, JSON.stringify(assigned))
    categoryChanges.push({ topicId: file.topicId, board: file.board })
  }
  assert.deepEqual(learningSnapshot(), before, '导入改变了原学习记录、旧版本或活动队列。')
  assert.deepEqual(backups(), backupsBefore, '此次正式交付出现额外备份文件。')
  const final = read((db) => {
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok')
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), [])
    return {
      schema: db.prepare('PRAGMA user_version').get().user_version,
      topics: db.prepare('SELECT count(*) AS count FROM topics').get().count,
      activeQuestions: db.prepare('SELECT count(*) AS count FROM questions WHERE archived=0').get()
        .count,
      archivedQuestions: db
        .prepare('SELECT count(*) AS count FROM questions WHERE archived=1')
        .get().count,
    }
  })
  console.log(
    JSON.stringify({
      actual,
      final,
      counts: committed.value.summary.counts,
      categoryChanges,
      learningPreserved: before,
      backupCreated: false,
    }),
  )
  const closed = application.waitForEvent('close')
  await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].close())
  await closed
} finally {
  await application.close()
}
