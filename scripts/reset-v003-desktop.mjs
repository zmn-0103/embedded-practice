import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import {
  existsSync,
  lstatSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, parse, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { _electron } from '@playwright/test'

// 用户已明确授权删除旧题并清空使用记录；不创建个人数据库副本。
// --verify 仅准备独立空库；--apply 才替换本次正式目标。
const mode = process.argv[2]
assert(['--verify', '--apply'].includes(mode), '必须明确指定 --verify 或 --apply。')
const root = fileURLToPath(new URL('../', import.meta.url))
const executable = resolve(root, 'release/V0.0.3-20261030.1/win-unpacked/embedded-practice.exe')
const manifest = JSON.parse(
  readFileSync(resolve(root, 'question-banks/releases/v003-20261030/manifest.json'), 'utf8'),
)
assert(process.env.APPDATA, '无法确定正式数据位置。')
const personal = resolve(process.env.APPDATA, 'embedded-practice')
const databasePath = (directory) => join(directory, 'practice.sqlite3')
const emptyTables = [
  'practice_sessions',
  'practice_items',
  'practice_receipts',
  'practice_plans',
  'question_sets',
  'question_set_items',
  'personal_notes',
  'personal_tags',
  'question_personal_tags',
  'review_todos',
  'question_relations',
  'recent_knowledge_searches',
  'daily_targets',
  'study_goals',
  'quota_settings',
  'learning_activities',
  'installed_themes',
  'import_receipts',
]
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex')
function read(directory, work) {
  const db = new DatabaseSync(databasePath(directory), { readOnly: true })
  try {
    return work(db)
  } finally {
    db.close()
  }
}
function contents(db) {
  return db
    .prepare(
      `SELECT q.topic_id,q.question_id,q.title,q.tags_json,q.difficulty,q.position,
    v.title AS version_title,v.question_markdown,v.answer_markdown,v.definitions_json,
    v.image_bindings_json,v.content_hash FROM questions q
    JOIN question_versions v ON v.id=q.current_version_id WHERE q.archived=0
    ORDER BY q.topic_id,q.question_id`,
    )
    .all()
}
function noPersonalProcess() {
  // 应用进程退出后才能替换；同时拒绝正在运行的其他同名版本。
  const pids = execFileSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-Command',
      "@(Get-Process -Name embedded-practice -ErrorAction SilentlyContinue).Id -join ','",
    ],
    { encoding: 'utf8', windowsHide: true },
  ).trim()
  assert.equal(pids, '', '请先关闭所有嵌入式刷题本窗口。')
}
function noSidecars(directory, checkpoint = false) {
  assert.equal(
    realpathSync(directory).toLowerCase(),
    resolve(directory).toLowerCase(),
    '目标目录不能是链接或重定向。',
  )
  const stat = lstatSync(databasePath(directory))
  assert(stat.isFile() && !stat.isSymbolicLink(), '目标数据库必须是普通文件。')
  assert(!existsSync(join(directory, 'restore-transaction')), '存在待处理恢复事务，停止替换。')
  if (checkpoint) {
    // 只读 WAL 连接也可能留下零字节伴随文件；由 SQLite 收尾，禁止手动删除。
    const db = new DatabaseSync(databasePath(directory))
    try {
      assert.equal(db.prepare('PRAGMA wal_checkpoint(TRUNCATE)').get().busy, 0)
    } finally {
      db.close()
    }
  }
  for (const suffix of ['-wal', '-shm', '-journal'])
    assert(!existsSync(databasePath(directory) + suffix), `数据库尚未完全关闭：${suffix}`)
}
function backups() {
  const directory = join(personal, 'backups')
  return existsSync(directory) ? readdirSync(directory).sort() : []
}
function verify(directory) {
  return read(directory, (db) => {
    assert.equal(db.prepare('PRAGMA application_id').get().application_id, 0x45505231)
    assert.equal(db.prepare('PRAGMA user_version').get().user_version, 17)
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok')
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), [])
    assert.equal(db.prepare('SELECT count(*) n FROM topics').get().n, 23)
    assert.equal(db.prepare('SELECT count(*) n FROM questions').get().n, 382)
    assert.equal(db.prepare('SELECT count(*) n FROM questions WHERE archived<>0').get().n, 0)
    assert.equal(db.prepare('SELECT count(*) n FROM question_versions').get().n, 382)
    assert.equal(
      db.prepare('SELECT count(*) n FROM question_versions WHERE sequence<>1').get().n,
      0,
    )
    assert.equal(db.prepare('SELECT count(*) n FROM question_user_state').get().n, 382)
    assert.equal(
      db
        .prepare(
          `SELECT count(*) n FROM question_user_state
      WHERE favorite<>0 OR last_rating IS NOT NULL OR last_rated_version_id IS NOT NULL`,
        )
        .get().n,
      0,
    )
    for (const table of emptyTables)
      assert.equal(db.prepare(`SELECT count(*) n FROM ${table}`).get().n, 0, table)
    assert.deepEqual(
      { ...db.prepare('SELECT * FROM appearance_settings').get() },
      {
        id: 1,
        theme: 'system',
        font_size: 17,
        palette: 'forest',
        theme_id: 'builtin.forest',
        navigation_collapsed: 0,
        auxiliary_hidden: 0,
      },
    )
    const expectedBoards = [...new Set(manifest.files.map((file) => file.board))].sort()
    assert.deepEqual(
      db
        .prepare('SELECT title FROM categories ORDER BY title')
        .all()
        .map((r) => r.title)
        .sort(),
      expectedBoards,
    )
    for (const file of manifest.files) {
      const topic = db
        .prepare(
          `SELECT c.title,count(q.id) n FROM topics t
        JOIN categories c ON c.category_id=t.category_id JOIN questions q ON q.topic_id=t.topic_id
        WHERE t.topic_id=? GROUP BY t.topic_id`,
        )
        .get(file.topicId)
      assert.equal(topic?.n, file.count, file.topicId)
      assert.equal(topic?.title, file.board, file.topicId)
    }
    return {
      topics: 23,
      questions: 382,
      archived: 0,
      versions: 382,
      untouchedQuestions: 382,
      emptyTables,
      contentSha256: hash(contents(db)),
    }
  })
}
async function launch(directory, prepare) {
  const env = { ...process.env, EMBEDDED_PRACTICE_TEST_DATA_DIR: directory }
  delete env.ELECTRON_RUN_AS_NODE
  delete env.ELECTRON_RENDERER_URL
  const app = await _electron.launch({ executablePath: executable, args: [], env, timeout: 20_000 })
  try {
    const page = await app.firstWindow()
    await page.locator('.app-shell').waitFor()
    const actual = await app.evaluate(({ app }) => ({
      executable: process.execPath,
      data: app.getPath('userData'),
      version: app.getVersion(),
      packaged: app.isPackaged,
    }))
    assert.equal(resolve(actual.executable), executable)
    assert.equal(resolve(actual.data), directory)
    assert.equal(actual.version, '0.0.3')
    assert.equal(actual.packaged, true)
    await page.locator('footer').filter({ hasText: '20261030.1-v003-bank' }).waitFor()
    if (prepare) {
      await app.evaluate(
        ({ dialog }, paths) => {
          dialog.showOpenDialog = async () => ({ canceled: false, filePaths: paths })
        },
        manifest.files.map((file) => resolve(root, file.file)),
      )
      const preview = await page.evaluate(() => globalThis.desktop.library.previewImport())
      assert(preview.ok, JSON.stringify(preview))
      const committed = await page.evaluate(
        (token) => globalThis.desktop.library.commitImport(token),
        preview.value.token,
      )
      assert(committed.ok, JSON.stringify(committed))
      for (const board of new Set(manifest.files.map((file) => file.board))) {
        const created = await page.evaluate(
          (title) => globalThis.desktop.library.updateCategory({ kind: 'create', title }),
          board,
        )
        assert(created.ok, JSON.stringify(created))
      }
      const navigation = await page.evaluate(() =>
        globalThis.desktop.library.listQuestions({ topicId: null, archived: false, page: 1 }),
      )
      assert(navigation.ok, JSON.stringify(navigation))
      for (const file of manifest.files) {
        const categoryId = navigation.value.categories.find(
          (c) => c.title === file.board,
        )?.categoryId
        assert(categoryId, file.board)
        const assigned = await page.evaluate(
          (input) => globalThis.desktop.library.updateCategory(input),
          { kind: 'assign', topicId: file.topicId, categoryId },
        )
        assert(assigned.ok, JSON.stringify(assigned))
      }
    } else {
      verify(directory)
      const state = await page.evaluate(async () => ({
        startup: await globalThis.desktop.getAppStatus(),
        learning: await globalThis.desktop.learning.read({ topicId: null, archived: false }),
        archived: await globalThis.desktop.library.listQuestions({
          topicId: null,
          archived: true,
          page: 1,
        }),
        practice: await globalThis.desktop.practice.read({ sessionId: null }),
      }))
      assert(
        state.startup.ok && state.learning.ok && state.archived.ok && state.practice.ok,
        JSON.stringify(state),
      )
      assert.equal(state.startup.value.launchCount, 1)
      assert.equal(state.learning.value.total, 382)
      for (const key of ['revealed', 'rated', 'favorites', 'contentUpdated'])
        assert.equal(state.learning.value[key], 0, key)
      assert.equal(state.archived.value.total, 0)
      assert.equal(state.practice.value, null)
      await app.evaluate(async ({ session }) => {
        await session.defaultSession.clearStorageData()
        await session.defaultSession.clearCache()
      })
    }
    const closed = app.waitForEvent('close')
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].close())
    await closed
    return actual
  } finally {
    await app.close()
  }
}

if (mode === '--apply') noPersonalProcess()
const original =
  mode === '--apply'
    ? read(personal, (db) => ({
        contentSha256: hash(contents(db)),
        questions: db.prepare('SELECT count(*) n FROM questions').get().n,
        archived: db.prepare('SELECT count(*) n FROM questions WHERE archived=1').get().n,
        versions: db.prepare('SELECT count(*) n FROM question_versions').get().n,
        sessions: db.prepare('SELECT count(*) n FROM practice_sessions').get().n,
        items: db.prepare('SELECT count(*) n FROM practice_items').get().n,
      }))
    : null
const backupsBefore = mode === '--apply' ? backups() : null
const staging = mkdtempSync(join(tmpdir(), 'embedded-practice-v003-clean-'))
try {
  const preparedRuntime = await launch(staging, true)
  const db = new DatabaseSync(databasePath(staging))
  try {
    db.exec('BEGIN IMMEDIATE; DELETE FROM app_startup; DELETE FROM import_receipts; COMMIT')
    db.exec('PRAGMA wal_checkpoint(TRUNCATE)')
  } finally {
    db.close()
  }
  noSidecars(staging)
  const fresh = verify(staging)
  if (mode === '--apply') {
    noPersonalProcess()
    noSidecars(personal, true)
    assert.equal(
      parse(staging).root.toLowerCase(),
      parse(personal).root.toLowerCase(),
      '替换必须在同一磁盘。',
    )
    assert.equal(
      fresh.contentSha256,
      original.contentSha256,
      '新库题目内容与当前有效题不一致，停止替换。',
    )
    assert.deepEqual(backups(), backupsBefore)
    // 同盘文件重命名替换现有目标，不删除旧库后再复制，不生成旧库备份。
    renameSync(databasePath(staging), databasePath(personal))
    let actual
    try {
      actual = await launch(personal, false)
    } catch (error) {
      console.error('正式数据库已替换为全新题库；后续启动或缓存核对失败，请按此状态处理。')
      throw error
    }
    assert.deepEqual(verify(personal), fresh)
    assert.deepEqual(backups(), backupsBefore, '出现额外备份。')
    console.log(JSON.stringify({ mode, actual, original, final: fresh, backupCreated: false }))
  } else {
    await launch(staging, false)
    assert.deepEqual(verify(staging), fresh)
    noSidecars(staging, true)
    // 在独立临时目录实际验证 Windows 覆盖已有目标的重命名行为。
    const probe = join(staging, 'rename-probe.sqlite3')
    const probeDb = new DatabaseSync(probe)
    probeDb.close()
    renameSync(databasePath(staging), probe)
    const check = new DatabaseSync(probe, { readOnly: true })
    try {
      assert.equal(check.prepare('SELECT count(*) n FROM questions').get().n, 382)
    } finally {
      check.close()
    }
    console.log(
      JSON.stringify({
        mode,
        actual: preparedRuntime,
        final: fresh,
        replacementVerified: true,
        personalDataAccessed: false,
      }),
    )
  }
} finally {
  assert.equal(resolve(dirname(staging)), resolve(tmpdir()))
  assert(basename(staging).startsWith('embedded-practice-v003-clean-'))
  rmSync(staging, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
}
