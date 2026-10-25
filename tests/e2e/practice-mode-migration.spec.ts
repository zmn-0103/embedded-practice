import { createHash, randomUUID } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { librarySchema } from '../../src/main/database/library-schema'
import { legacyV3PracticeSchema } from '../fixtures/practice-v3-schema'
import { expect, launchApplication, readAppStatus, test } from './helpers'

const now = '2026-10-20T00:00:00.000Z'
const tables = [
  'topics',
  'questions',
  'question_versions',
  'image_resources',
  'version_images',
  'question_user_state',
  'import_receipts',
  'library_meta',
  'practice_sessions',
  'practice_items',
  'practice_receipts',
] as const
function records(database: DatabaseSync) {
  return Object.fromEntries(
    tables.map((table) => [table, database.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()]),
  )
}

async function legacy(directory: string, fault = '') {
  const file = join(directory, 'practice.sqlite3')
  const database = new DatabaseSync(file)
  const sessionId = randomUUID()
  const startInput = {
    requestId: randomUUID(),
    topicId: 'legacy-v3',
    count: 'all' as const,
    replace: null,
  }
  const oldAck = { sessionId, status: 'active', position: 0, revision: 0, total: 3 }
  try {
    database.exec(
      `PRAGMA application_id = 0x45505231; PRAGMA user_version = 3;
      PRAGMA foreign_keys = ON;
      CREATE TABLE app_startup (id INTEGER PRIMARY KEY, launch_count INTEGER NOT NULL,
        last_started_at TEXT NOT NULL) STRICT;
      INSERT INTO app_startup VALUES (1, 7, '${now}');` +
        librarySchema +
        legacyV3PracticeSchema,
    )
    database.prepare('INSERT INTO topics VALUES (?, ?, ?)').run('legacy-v3', '旧专题', '原文件.md')
    for (let n = 1; n <= 3; n++) {
      database
        .prepare('INSERT INTO questions VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL)')
        .run(n, 'legacy-v3', `q-${n}`, `标题 ${n}`, '["旧标签"]', '基础', n - 1)
      database
        .prepare('INSERT INTO question_versions VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?)')
        .run(n, n, `标题 ${n}`, `旧题干 ${n}`, `旧答案 ${n}`, '[]', '[]', 'a'.repeat(64), now)
      database.prepare('UPDATE questions SET current_version_id = ? WHERE id = ?').run(n, n)
    }
    const bytes = await readFile(join(process.cwd(), 'tests/fixtures/images/small.png'))
    const hash = createHash('sha256').update(bytes).digest('hex')
    database.prepare('INSERT INTO image_resources VALUES (?, ?, 2, 3, ?)').run(hash, 'png', bytes)
    database.prepare('INSERT INTO version_images VALUES (1, ?)').run(hash)
    database
      .prepare('UPDATE question_versions SET image_bindings_json = ? WHERE id = 1')
      .run(JSON.stringify([{ url: 'assets/small.png', hash }]))
    database.exec("INSERT INTO question_user_state VALUES (1, 1, '掌握', 1)")
    for (const status of ['finished', 'ended', 'active']) {
      const id = status === 'active' ? sessionId : randomUUID()
      database
        .prepare('INSERT INTO practice_sessions VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(
          id,
          'sequential',
          'legacy-v3',
          status,
          status === 'finished' ? 3 : 1,
          5,
          now,
          status === 'active' ? null : now,
        )
      for (let n = 1; n <= 3; n++)
        database
          .prepare(
            `INSERT INTO practice_items
            (session_id, position, question_id, version_id, title, topic_title, tags_json,
            difficulty, draft, draft_revision, revealed_at, rating, rated_at, skipped_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            id,
            n - 1,
            n,
            n,
            `标题 ${n}`,
            '旧专题',
            '["旧标签"]',
            '基础',
            n === 1 ? '原自评作答\r\nint a = 1;' : n === 2 ? '当前位置草稿' : '',
            n === 1 ? 3 : n === 2 ? 2 : 0,
            n === 1 ? now : null,
            n === 1 ? '掌握' : null,
            n === 1 ? now : null,
            n === 3 ? now : null,
          )
    }
    const hashInput = createHash('sha256')
      .update(JSON.stringify({ action: 'start', input: startInput }))
      .digest('hex')
    database
      .prepare('INSERT INTO practice_receipts VALUES (?, ?, ?, ?)')
      .run(startInput.requestId, hashInput, JSON.stringify(oldAck), now)
    if (fault === 'conflict') database.exec('CREATE TABLE practice_sessions_v4 (retained TEXT)')
    if (fault === 'trigger')
      database.exec(`CREATE TRIGGER custom_session_guard BEFORE DELETE ON practice_sessions
        BEGIN SELECT RAISE(ABORT, '保留原触发器'); END`)
    if (fault === 'index') database.exec('CREATE INDEX custom_mode ON practice_sessions(mode)')
    if (fault === 'foreign-key') {
      database.exec('PRAGMA foreign_keys = OFF')
      database.exec("UPDATE practice_items SET session_id = 'missing' WHERE rowid = 1")
    }
    return { file, sessionId, startInput, oldAck, before: records(database) }
  } finally {
    database.close()
  }
}

test('v3 升级至 v10：备份、全部旧记录、原请求回执与顺序会话恢复保持', async ({
  testDataDirectory,
}, info) => {
  const original = await legacy(testDataDirectory)
  const launched = await launchApplication(testDataDirectory, info.project.name)
  try {
    expect(await readAppStatus(launched.page)).toMatchObject({
      ok: true,
      value: { launchCount: 8 },
    })
    const prior = await launched.page.evaluate(
      (input) => (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.start(input),
      original.startInput,
    )
    expect(prior).toEqual({ ok: true, value: original.oldAck })
    await launched.page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(launched.page.getByLabel('练习进度')).toHaveText('第 2 / 3 题 · 顺序练习')
    await expect(launched.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      '当前位置草稿',
    )
    expect(
      await launched.page.getByRole('region', { name: '练习参考答案', exact: true }).count(),
    ).toBe(0)
  } finally {
    await launched.application.close()
  }
  const names = await readdir(join(testDataDirectory, 'backups'))
  expect(names).toHaveLength(1)
  expect(names[0]).toMatch(/^pre-migration-v3-/)
  const backup = new DatabaseSync(join(testDataDirectory, 'backups', names[0]!), { readOnly: true })
  const current = new DatabaseSync(original.file)
  try {
    expect(backup.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 3 })
    expect(backup.prepare('PRAGMA application_id').get()).toMatchObject({
      application_id: 0x45505231,
    })
    expect(backup.prepare('PRAGMA integrity_check').get()).toMatchObject({ integrity_check: 'ok' })
    expect(records(backup)).toEqual(original.before)
    expect(records(current)).toEqual({
      ...original.before,
      topics: original.before.topics!.map((row) => ({ ...row, category_id: null })),
      practice_sessions: original.before.practice_sessions!.map((row) => ({
        ...row,
        filters_json: null,
        category_scope_json: '{"kind":"all"}',
      })),
    })
    expect(current.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 10 })
    expect(current.prepare('PRAGMA foreign_key_check').all()).toEqual([])
    current.exec('PRAGMA foreign_keys = ON; BEGIN')
    const insert = current.prepare(
      `INSERT INTO practice_sessions (id, mode, topic_id, status, position, revision, created_at, ended_at)
        VALUES (?, ?, NULL, ?, 0, 0, ?, ?)`,
    )
    expect(() => insert.run(randomUUID(), 'random', 'active', now, null)).toThrow()
    expect(() => insert.run(randomUUID(), 'invalid', 'ended', now, now)).toThrow()
    expect(() =>
      current.prepare("UPDATE practice_items SET session_id = 'missing'").run(),
    ).toThrow()
    insert.run(randomUUID(), 'random', 'ended', now, now)
    current.exec('ROLLBACK')
    await info.attach('migration-v3-preserved.json', {
      body: JSON.stringify({
        before: original.before,
        after: records(current),
        backups: names,
        backupIntegrity: backup.prepare('PRAGMA integrity_check').all(),
        foreignKeys: current.prepare('PRAGMA foreign_key_check').all(),
      }),
      contentType: 'application/json',
    })
  } finally {
    backup.close()
    current.close()
  }
  const reopened = await launchApplication(testDataDirectory, info.project.name)
  try {
    expect(await readAppStatus(reopened.page)).toMatchObject({
      ok: true,
      value: { launchCount: 9 },
    })
    await expect(reopened.page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
  } finally {
    await reopened.application.close()
  }
  expect(await readdir(join(testDataDirectory, 'backups'))).toEqual(names)
})

test('v3 备份失败停止升级，原文件逐字节不变', async ({ testDataDirectory }, info) => {
  const original = await legacy(testDataDirectory)
  await writeFile(join(testDataDirectory, 'backups'), '本测试阻止创建备份目录')
  const before = await readFile(original.file)
  const launched = await launchApplication(testDataDirectory, info.project.name)
  try {
    expect(await readAppStatus(launched.page)).toMatchObject({
      ok: false,
      error: { code: 'DATABASE_UNAVAILABLE' },
    })
  } finally {
    await launched.application.close()
  }
  expect(await readFile(original.file)).toEqual(before)
})

for (const fault of ['conflict', 'trigger', 'index', 'foreign-key']) {
  test(`v3 迁移拒绝 ${fault}，保留原结构、记录和保护性备份`, async ({
    testDataDirectory,
  }, info) => {
    const original = await legacy(testDataDirectory, fault)
    const before = new DatabaseSync(original.file, { readOnly: true })
    const objects = before.prepare('SELECT * FROM sqlite_schema ORDER BY name').all()
    before.close()
    const launched = await launchApplication(testDataDirectory, info.project.name)
    try {
      expect(await readAppStatus(launched.page)).toMatchObject({
        ok: false,
        error: { code: 'DATABASE_UNAVAILABLE' },
      })
    } finally {
      await launched.application.close()
    }
    const current = new DatabaseSync(original.file, { readOnly: true })
    try {
      expect(current.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 3 })
      expect(current.prepare('SELECT * FROM sqlite_schema ORDER BY name').all()).toEqual(objects)
      expect(records(current)).toEqual(original.before)
      expect(current.prepare('SELECT launch_count FROM app_startup').get()).toMatchObject({
        launch_count: 7,
      })
      await info.attach(`migration-v3-${fault}.json`, {
        body: JSON.stringify({ schema: objects, retained: records(current) }),
        contentType: 'application/json',
      })
    } finally {
      current.close()
    }
    const backups = await readdir(join(testDataDirectory, 'backups'))
    expect(backups).toHaveLength(1)
    const protectedCopy = new DatabaseSync(join(testDataDirectory, 'backups', backups[0]!), {
      readOnly: true,
    })
    try {
      expect(protectedCopy.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 3 })
      expect(protectedCopy.prepare('PRAGMA integrity_check').get()).toMatchObject({
        integrity_check: 'ok',
      })
      expect(records(protectedCopy)).toEqual(original.before)
    } finally {
      protectedCopy.close()
    }
  })
}
