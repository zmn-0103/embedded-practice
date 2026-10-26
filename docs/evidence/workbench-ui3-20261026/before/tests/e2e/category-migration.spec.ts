import { createHash, randomUUID } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, launchApplication, test } from './helpers'
import { stop, withHistoryDatabase } from './history-helpers'

function records(database: DatabaseSync) {
  const tables = database
    .prepare(
      "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT GLOB 'sqlite_*' AND name <> 'app_startup' ORDER BY name",
    )
    .all() as { name: string }[]
  return Object.fromEntries(
    tables.map(({ name }) => [
      name,
      database.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}" ORDER BY rowid`).all(),
    ]),
  )
}
async function legacy(directory: string) {
  const sql = await readFile(resolve('tests/fixtures/schema-v7.sql'), 'utf8')
  const source = JSON.parse(
    await readFile(resolve('docs/evidence/category-tree-20261023/schema-v7-source.json'), 'utf8'),
  )
  expect(createHash('sha256').update(sql).digest('hex')).toBe(source.sha256)
  const database = new DatabaseSync(join(directory, 'practice.sqlite3'))
  const sessionId = randomUUID()
  const filters = {
    query: '旧题干',
    tag: null,
    difficulty: null,
    mastery: 'all' as const,
    favoritesOnly: false,
  }
  const input = {
    requestId: randomUUID(),
    topicId: 'v7-topic',
    count: 'all' as const,
    replace: null,
    filters,
    mode: 'random' as const,
  }
  const receipt = { sessionId, status: 'active', position: 0, revision: 0, total: 1 }
  try {
    database.exec(`PRAGMA application_id=0x45505231; PRAGMA user_version=7; ${sql}`)
    database.exec(`INSERT INTO app_startup VALUES(1,7,'2026-10-22T00:00:00.000Z');
      INSERT INTO topics(topic_id,title,source_name) VALUES('v7-topic','结构七旧专题','旧来源.md');
      INSERT INTO questions(id,topic_id,question_id,title,tags_json,difficulty,position,archived,current_version_id) VALUES(1,'v7-topic','q-1','旧标题','[]','基础',0,0,NULL);
      INSERT INTO question_versions VALUES(1,1,1,'旧标题','旧题干','旧答案','[]','[]','${'a'.repeat(64)}','2026-10-22T00:00:00.000Z');
      UPDATE questions SET current_version_id=1;
      INSERT INTO question_user_state VALUES(1,1,NULL,NULL);
      UPDATE appearance_settings SET theme='dark',font_size=20,palette='ocean';
      CREATE TABLE private_notes(id INTEGER PRIMARY KEY,note TEXT) STRICT;
      INSERT INTO private_notes VALUES(1,'自定义对象保持');
      CREATE INDEX v7_topic_title ON topics(title);
      CREATE TRIGGER v7_session_probe AFTER UPDATE ON practice_sessions BEGIN SELECT 1; END;`)
    database
      .prepare(
        "INSERT INTO practice_sessions(id,mode,topic_id,status,position,revision,created_at,ended_at,filters_json) VALUES(?,'random','v7-topic','active',0,0,'2026-10-22T00:00:00.000Z',NULL,?)",
      )
      .run(sessionId, JSON.stringify(filters))
    database
      .prepare(
        "INSERT INTO practice_items(session_id,position,question_id,version_id,title,topic_title,tags_json,difficulty,draft,draft_revision) VALUES(?,0,1,1,'旧标题','结构七旧专题','[]','基础',?,2)",
      )
      .run(sessionId, '结构七原草稿\r\n    preserved_v7();')
    database.prepare('INSERT INTO practice_receipts VALUES(?,?,?,?)').run(
      input.requestId,
      createHash('sha256')
        .update(JSON.stringify({ action: 'start', input }))
        .digest('hex'),
      JSON.stringify(receipt),
      '2026-10-22T00:00:00.000Z',
    )
    return { before: records(database), sessionId, filters, input, receipt }
  } finally {
    database.close()
  }
}

test('结构7分类迁移：一致性保护、原业务/条件/回执/自定义对象保持，旧专题未分类与旧轮不限分类', async ({
  testDataDirectory,
}, info) => {
  const original = await legacy(testDataDirectory)
  const expected = {
    ...original.before,
    categories: [],
    practice_plans: [],
    installed_themes: [],
    appearance_settings: original.before.appearance_settings!.map((row) => ({
      ...row,
      theme_id: `builtin.${row['palette']}`,
      navigation_collapsed: 0,
      auxiliary_hidden: 0,
    })),
    topics: original.before.topics!.map((row) => ({ ...row, category_id: null })),
    practice_sessions: original.before.practice_sessions!.map((row) => ({
      ...row,
      category_scope_json: '{"kind":"all"}',
    })),
  }
  const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  try {
    await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
    expect(withHistoryDatabase(testDataDirectory, records)).toEqual(expected)
    withHistoryDatabase(testDataDirectory, (db) => {
      expect(db.prepare('PRAGMA user_version').get()).toEqual({ user_version: 10 })
      expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
      expect(
        db
          .prepare(
            "SELECT name FROM sqlite_schema WHERE name IN ('v7_topic_title','v7_session_probe') ORDER BY name",
          )
          .all(),
      ).toEqual([{ name: 'v7_session_probe' }, { name: 'v7_topic_title' }])
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
          filters: original.filters,
          category: { kind: 'all' },
        },
        item: {
          draft: { text: '结构七原草稿\r\n    preserved_v7();', revision: 2 },
          revealed: false,
        },
      },
    })
    expect(
      await page.evaluate(
        (input) => (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.start(input),
        original.input,
      ),
    ).toEqual({ ok: true, value: original.receipt })
    expect(withHistoryDatabase(testDataDirectory, records)).toEqual(expected)
    await expect(page.locator('html')).toHaveAttribute('data-palette', 'ocean')
    await page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      '结构七原草稿\n    preserved_v7();',
    )
  } finally {
    await stop(application)
  }
  const names = await readdir(join(testDataDirectory, 'backups'))
  expect(names).toHaveLength(1)
  expect(names[0]).toMatch(/^pre-migration-v7-/)
  const backup = new DatabaseSync(join(testDataDirectory, 'backups', names[0]!), { readOnly: true })
  try {
    expect(backup.prepare('PRAGMA user_version').get()).toEqual({ user_version: 7 })
    expect(backup.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }])
    expect(records(backup)).toEqual(original.before)
  } finally {
    backup.close()
  }
  const next = await launchApplication(testDataDirectory, info.project.name)
  try {
    await expect(next.page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
    expect(withHistoryDatabase(testDataDirectory, records)).toEqual(expected)
    expect(await readdir(join(testDataDirectory, 'backups'))).toEqual(names)
    const sourcePath = join(testDataDirectory, 'backups', names[0]!)
    const sourceBytes = await readFile(sourcePath)
    await next.application.evaluate(({ dialog }, path) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
    }, sourcePath)
    expect(
      await next.page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
      ),
    ).toMatchObject({
      ok: true,
      value: {
        summary: { schemaVersion: 7, requiresMigration: true, categories: 0, activeSession: true },
      },
    })
    expect(await readFile(sourcePath)).toEqual(sourceBytes)
    expect(withHistoryDatabase(testDataDirectory, records)).toEqual(expected)
    await info.attach('category-v7-migration.json', {
      body: JSON.stringify({ original, expected, backups: names }),
      contentType: 'application/json',
    })
  } finally {
    await stop(next.application)
  }
})

for (const failure of [
  'backup-blocked',
  'table-conflict',
  'scope-column-conflict',
  'foreign-key',
] as const) {
  test(`结构7分类迁移 ${failure} 停止或完整回滚，原库不修补不重建`, async ({
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
              ? "CREATE TABLE categories(retained TEXT); INSERT INTO categories VALUES('原同名表');"
              : failure === 'scope-column-conflict'
                ? 'ALTER TABLE practice_sessions ADD COLUMN category_scope_json TEXT'
                : "PRAGMA foreign_keys=OFF; UPDATE question_user_state SET last_rating='掌握',last_rated_version_id=999999",
          ),
        false,
      )
    const before = withHistoryDatabase(testDataDirectory, records)
    const bytes = await readFile(join(testDataDirectory, 'practice.sqlite3'))
    const { application, page } = await launchApplication(testDataDirectory, info.project.name)
    try {
      await expect(page.locator('.service-status')).toContainText('本地数据暂不可用')
      expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
      withHistoryDatabase(testDataDirectory, (db) => {
        expect(db.prepare('PRAGMA user_version').get()).toEqual({ user_version: 7 })
        expect(
          db
            .prepare('PRAGMA table_info(topics)')
            .all()
            .some((column) => column.name === 'category_id'),
        ).toBe(false)
        expect(
          db.prepare("SELECT name FROM sqlite_schema WHERE name='categories'").all().length,
        ).toBe(failure === 'table-conflict' ? 1 : 0)
      })
    } finally {
      await stop(application)
    }
    if (failure === 'backup-blocked')
      expect(await readFile(join(testDataDirectory, 'practice.sqlite3'))).toEqual(bytes)
    else expect(await readdir(join(testDataDirectory, 'backups'))).toHaveLength(1)
    await info.attach(`category-v7-${failure}.json`, {
      body: JSON.stringify({ before, after: withHistoryDatabase(testDataDirectory, records) }),
      contentType: 'application/json',
    })
  })
}
