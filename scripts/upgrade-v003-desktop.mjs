import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { extname, join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath, pathToFileURL } from 'node:url'

// 本次用户明确要求不生成备份：仅此交付脚本在事务内执行已有10→17迁移，
// 不修改应用启动时的备份保护，也不复刻迁移SQL。
const root = fileURLToPath(new URL('../', import.meta.url))
const mode = process.argv[2]
assert(
  ['--verify', '--apply'].includes(mode),
  '使用 --verify 验证独立夹具，或 --apply 执行已授权桌面升级。',
)
const migrations = [
  ['practice-schema', 'repeatPracticeMigration'],
  ['question-set-schema', 'questionSetMigration'],
  ['note-schema', 'personalNoteMigration'],
  ['personal-tag-schema', 'personalTagMigration'],
  ['review-schema', 'reviewTodoMigration'],
  ['knowledge-schema', 'knowledgeMigration'],
  ['planning-schema', 'planningMigration'],
]
// Node 24 直接读取项目 TypeScript；只补项目采用的无扩展名相对导入。
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      specifier.startsWith('.') &&
      !extname(specifier) &&
      existsSync(new URL(`${specifier}.ts`, context.parentURL))
    )
      specifier += '.ts'
    return nextResolve(specifier, context)
  },
})
let sql
try {
  const statements = []
  for (const [file, name] of migrations) {
    const module = await import(pathToFileURL(resolve(root, `src/main/database/${file}.ts`)).href)
    assert.equal(typeof module[name], 'string', `缺少既有迁移：${name}`)
    statements.push(module[name])
  }
  sql = statements.join('\n')
} finally {
  hooks.deregister()
}
assert(sql && !/\bDROP\s+TABLE\b/i.test(sql), '此交付只允许新增结构与列的迁移。')
const quote = (name) => '"' + name.replaceAll('"', '""') + '"'
const digest = (rows) =>
  createHash('sha256')
    .update(
      JSON.stringify(rows, (_key, value) => (typeof value === 'bigint' ? value.toString() : value)),
    )
    .digest('hex')

function snapshot(database) {
  return database
    .prepare(
      "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT GLOB 'sqlite_*' ORDER BY name",
    )
    .all()
    .map(({ name }) => {
      const columns = database
        .prepare(`PRAGMA table_info(${quote(name)})`)
        .all()
        .map((column) => column.name)
      const rows = database
        .prepare(`SELECT ${columns.map(quote).join(',')} FROM ${quote(name)} ORDER BY rowid`)
        .all()
      return { name, columns, rows: rows.length, sha256: digest(rows) }
    })
}

function upgrade(database, injectFailure = false) {
  assert.equal(database.prepare('PRAGMA application_id').get().application_id, 0x45505231)
  assert.equal(database.prepare('PRAGMA user_version').get().user_version, 10)
  assert.equal(database.prepare('PRAGMA integrity_check').get().integrity_check, 'ok')
  assert.deepEqual(database.prepare('PRAGMA foreign_key_check').all(), [])
  database.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; BEGIN IMMEDIATE')
  try {
    const before = snapshot(database)
    database.exec(sql)
    if (injectFailure) throw new Error('验证事务回滚的受控失败')
    for (const table of before) {
      const rows = database
        .prepare(
          `SELECT ${table.columns.map(quote).join(',')} FROM ${quote(table.name)} ORDER BY rowid`,
        )
        .all()
      assert.equal(digest(rows), table.sha256, `${table.name}: 旧列内容变化，停止提交`)
    }
    assert.deepEqual(database.prepare('PRAGMA foreign_key_check').all(), [])
    assert.equal(database.prepare('PRAGMA integrity_check').get().integrity_check, 'ok')
    database.exec('PRAGMA user_version=17; COMMIT')
    return { schemaBefore: 10, schemaAfter: 17, preserved: before, backupCreated: false }
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  }
}

if (mode === '--verify') {
  const fixture = readFileSync(resolve(root, 'tests/fixtures/schema-v10.sql'), 'utf8')
  const database = new DatabaseSync(':memory:')
  try {
    database.exec(fixture)
    database.exec(
      "UPDATE app_startup SET launch_count=3,last_started_at='2026-10-30T00:00:00.000Z' WHERE id=1",
    )
    const before = snapshot(database)
    assert.throws(() => upgrade(database, true), /受控失败/)
    assert.equal(database.prepare('PRAGMA user_version').get().user_version, 10)
    assert.deepEqual(snapshot(database), before)
    const result = upgrade(database)
    assert.equal(database.prepare('PRAGMA user_version').get().user_version, 17)
    console.log(JSON.stringify({ mode, rollbackVerified: true, ...result }))
  } finally {
    database.close()
  }
} else {
  assert(process.env.APPDATA, '缺少 APPDATA，不能确定个人数据目录。')
  const directory = resolve(process.env.APPDATA, 'embedded-practice')
  const database = new DatabaseSync(join(directory, 'practice.sqlite3'), { open: false })
  // 只打开已存在目标；文件不存在时不允许默默建立空个人库。
  readFileSync(join(directory, 'practice.sqlite3'), { flag: 'r' }).subarray(0, 16)
  database.open()
  try {
    console.log(JSON.stringify({ mode, directory, ...upgrade(database) }))
  } finally {
    database.close()
  }
}
