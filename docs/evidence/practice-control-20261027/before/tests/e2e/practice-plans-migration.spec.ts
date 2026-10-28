import { createHash, randomUUID } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { EMPTY_QUESTION_FILTERS } from '../../src/shared/contracts/question-filters'
import { expect, launchApplication, test } from './helpers'
import { stop, withHistoryDatabase } from './history-helpers'

function records(db: DatabaseSync) {
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT GLOB 'sqlite_*' AND name<>'app_startup' ORDER BY name",
    )
    .all() as { name: string }[]
  return Object.fromEntries(
    tables.map(({ name }) => [
      name,
      db.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}" ORDER BY rowid`).all(),
    ]),
  )
}
async function legacy(directory: string) {
  const sql = await readFile('tests/fixtures/schema-v8.sql', 'utf8')
  expect(createHash('sha256').update(sql).digest('hex')).toBe(
    'e63ccbb03c6b1a0bd7c9570670f53a3787998aaf6274e619531a0bdba9b7f5bf',
  )
  const db = new DatabaseSync(join(directory, 'practice.sqlite3')),
    sessionId = randomUUID()
  try {
    db.exec(`PRAGMA application_id=0x45505231; PRAGMA user_version=8; ${sql}
      INSERT INTO app_startup VALUES(1,7,'2026-10-23T00:00:00.000Z');
      INSERT INTO categories VALUES('old-category','当前分类名');
      INSERT INTO topics(topic_id,title,source_name,category_id) VALUES('old-topic','结构八专题','旧来源.md','old-category');
      INSERT INTO questions(id,topic_id,question_id,title,tags_json,difficulty,position,archived,current_version_id) VALUES(1,'old-topic','q-1','旧标题','[]','基础',0,0,NULL);
      INSERT INTO question_versions VALUES(1,1,1,'旧标题','旧题干','旧答案','[]','[]','${'a'.repeat(64)}','2026-10-23T00:00:00.000Z');
      UPDATE questions SET current_version_id=1;
      INSERT INTO question_user_state VALUES(1,1,NULL,NULL);
      CREATE TABLE private_notes(note TEXT) STRICT; INSERT INTO private_notes VALUES('原自定义数据');
      CREATE INDEX old_topic_title ON topics(title);
      CREATE TRIGGER old_session_probe AFTER UPDATE ON practice_sessions BEGIN SELECT 1; END;`)
    db.prepare(
      "INSERT INTO practice_sessions(id,mode,topic_id,status,position,revision,created_at,ended_at,filters_json,category_scope_json) VALUES(?,'random','old-topic','active',0,0,'2026-10-23T00:00:00.000Z',NULL,?,?)",
    ).run(
      sessionId,
      JSON.stringify(EMPTY_QUESTION_FILTERS),
      JSON.stringify({ kind: 'category', categoryId: 'old-category', title: '旧轮分类名' }),
    )
    db.prepare(
      "INSERT INTO practice_items(session_id,position,question_id,version_id,title,topic_title,tags_json,difficulty,draft,draft_revision) VALUES(?,0,1,1,'旧标题','结构八专题','[]','基础',?,2)",
    ).run(sessionId, '结构八原草稿\r\n    preserved8();')
    expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
    return { before: records(db), sessionId }
  } finally {
    db.close()
  }
}

test('结构8方案升级：只追加空方案表，原分类/条件/草稿/自定义对象与保护备份保持', async ({
  testDataDirectory,
}, info) => {
  const original = await legacy(testDataDirectory),
    expected = {
      ...original.before,
      practice_plans: [],
      installed_themes: [],
      practice_sessions: original.before.practice_sessions!.map((row) => ({
        ...row,
        repeat_source_id: null,
        repeat_selection: null,
      })),
      appearance_settings: original.before.appearance_settings!.map((row) => ({
        ...row,
        theme_id: `builtin.${row['palette']}`,
        navigation_collapsed: 0,
        auxiliary_hidden: 0,
      })),
    }
  const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  try {
    expect(withHistoryDatabase(testDataDirectory, records)).toEqual(expected)
    withHistoryDatabase(testDataDirectory, (db) => {
      expect(db.prepare('PRAGMA user_version').get()).toEqual({ user_version: 11 })
      expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
      expect(
        db
          .prepare(
            "SELECT name FROM sqlite_schema WHERE name IN ('old_topic_title','old_session_probe') ORDER BY name",
          )
          .all(),
      ).toEqual([{ name: 'old_session_probe' }, { name: 'old_topic_title' }])
    })
    expect(
      await page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({
          sessionId: null,
        }),
      ),
    ).toMatchObject({
      ok: true,
      value: {
        session: {
          sessionId: original.sessionId,
          category: { kind: 'category', title: '旧轮分类名' },
          filters: EMPTY_QUESTION_FILTERS,
        },
        item: { draft: { text: '结构八原草稿\r\n    preserved8();', revision: 2 } },
      },
    })
  } finally {
    await stop(application)
  }
  const names = await readdir(join(testDataDirectory, 'backups'))
  expect(names).toHaveLength(1)
  expect(names[0]).toMatch(/^pre-migration-v8-/)
  const path = join(testDataDirectory, 'backups', names[0]!),
    source = await readFile(path)
  const old = new DatabaseSync(path, { readOnly: true })
  try {
    expect(old.prepare('PRAGMA user_version').get()).toEqual({ user_version: 8 })
    expect(records(old)).toEqual(original.before)
  } finally {
    old.close()
  }
  const next = await launchApplication(testDataDirectory, info.project.name)
  try {
    await next.application.evaluate(({ dialog }, path) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
    }, path)
    expect(
      await next.page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
      ),
    ).toMatchObject({
      ok: true,
      value: {
        summary: {
          schemaVersion: 8,
          requiresMigration: true,
          practicePlans: 0,
          categories: 1,
          activeSession: true,
        },
      },
    })
    expect(await readFile(path)).toEqual(source)
    expect(withHistoryDatabase(testDataDirectory, records)).toEqual(expected)
    expect(await readdir(join(testDataDirectory, 'backups'))).toEqual(names)
    await info.attach('plans-v8-upgrade.json', {
      body: JSON.stringify({ original, expected, backups: names }),
      contentType: 'application/json',
    })
  } finally {
    await stop(next.application)
  }
})

for (const failure of ['backup-blocked', 'table-conflict', 'foreign-key'] as const) {
  test(`结构8方案升级 ${failure} 停止或完整回滚，原库与分类不修补`, async ({
    testDataDirectory,
  }, info) => {
    await legacy(testDataDirectory)
    if (failure === 'backup-blocked')
      await writeFile(join(testDataDirectory, 'backups'), '阻止保护目录')
    else
      withHistoryDatabase(
        testDataDirectory,
        (db) =>
          db.exec(
            failure === 'table-conflict'
              ? "CREATE TABLE practice_plans(retained TEXT); INSERT INTO practice_plans VALUES('未知原表保持');"
              : 'PRAGMA foreign_keys=OFF; UPDATE questions SET current_version_id=999999',
          ),
        false,
      )
    const before = withHistoryDatabase(testDataDirectory, records),
      bytes = await readFile(join(testDataDirectory, 'practice.sqlite3'))
    const { application, page } = await launchApplication(testDataDirectory, info.project.name)
    try {
      await expect(page.locator('.service-status')).toContainText('本地数据暂不可用')
      expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
      withHistoryDatabase(testDataDirectory, (db) => {
        expect(db.prepare('PRAGMA user_version').get()).toEqual({ user_version: 8 })
        expect(
          db.prepare("SELECT name FROM sqlite_schema WHERE name='practice_plans'").all(),
        ).toHaveLength(failure === 'table-conflict' ? 1 : 0)
      })
    } finally {
      await stop(application)
    }
    if (failure === 'backup-blocked')
      expect(await readFile(join(testDataDirectory, 'practice.sqlite3'))).toEqual(bytes)
    else expect(await readdir(join(testDataDirectory, 'backups'))).toHaveLength(1)
    await info.attach(`plans-v8-${failure}.json`, {
      body: JSON.stringify({ before, after: withHistoryDatabase(testDataDirectory, records) }),
      contentType: 'application/json',
    })
  })
}
