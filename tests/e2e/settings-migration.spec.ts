import { createHash, randomUUID } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { appearanceSchema } from '../../src/shared/contracts/settings'
import { expect, launchApplication, test } from './helpers'
import { stop, withHistoryDatabase } from './history-helpers'

const tables = [
  'library_meta',
  'topics',
  'questions',
  'question_versions',
  'image_resources',
  'version_images',
  'question_user_state',
  'import_receipts',
  'practice_sessions',
  'practice_items',
  'practice_receipts',
] as const
async function seedV4(directory: string) {
  const sql = await readFile(resolve('tests/fixtures/schema-v4.sql'), 'utf8')
  const source = JSON.parse(
    await readFile(resolve('docs/evidence/m3e/schema-v4-source.json'), 'utf8'),
  ) as { sha256: string }
  expect(createHash('sha256').update(sql).digest('hex')).toBe(source.sha256)
  const png = await readFile(resolve('tests/fixtures/images/small.png'))
  const hash = createHash('sha256').update(png).digest('hex')
  const activeId = randomUUID()
  const database = new DatabaseSync(join(directory, 'practice.sqlite3'))
  try {
    database.exec(`PRAGMA application_id = 0x45505231; PRAGMA user_version = 4; ${sql}`)
    database.exec(
      "INSERT INTO app_startup VALUES (1, 7, '2026-10-20T00:00:00.000Z'); INSERT INTO topics VALUES ('legacy-settings','旧显示设置升级样本','旧库.md');",
    )
    database.prepare('INSERT INTO image_resources VALUES (?, ?, 2, 3, ?)').run(hash, 'png', png)
    for (let n = 1; n <= 3; n++) {
      database
        .prepare(
          "INSERT INTO questions VALUES (?, 'legacy-settings', ?, ?, '[]', '基础', ?, ?, NULL)",
        )
        .run(n, `q-${n}`, `旧题 ${n}`, n - 1, Number(n === 3))
      database
        .prepare(
          "INSERT INTO question_versions VALUES (?, ?, 1, ?, ?, ?, '[]', ?, ?, '2026-10-20T00:00:00.000Z')",
        )
        .run(
          n,
          n,
          `旧题 ${n}`,
          `旧题干 ${n}`,
          `旧答案 ${n}`,
          JSON.stringify(n === 1 ? [{ url: 'assets/old.png', hash }] : []),
          'a'.repeat(64),
        )
      database.prepare('UPDATE questions SET current_version_id=? WHERE id=?').run(n, n)
      database
        .prepare('INSERT INTO question_user_state VALUES (?, ?, ?, ?)')
        .run(n, Number(n === 2), n === 1 ? '不熟' : null, n === 1 ? n : null)
    }
    database.prepare('INSERT INTO version_images VALUES (1, ?)').run(hash)
    for (const status of ['active', 'finished', 'ended']) {
      const id = status === 'active' ? activeId : randomUUID()
      database
        .prepare(
          "INSERT INTO practice_sessions VALUES (?, 'random', 'legacy-settings', ?, ?, 3, ?, ?)",
        )
        .run(
          id,
          status,
          status === 'finished' ? 2 : 1,
          '2026-10-20T01:00:00.000Z',
          status === 'active' ? null : '2026-10-20T02:00:00.000Z',
        )
      for (let n = 1; n <= 2; n++)
        database
          .prepare(
            `INSERT INTO practice_items
        (session_id,position,question_id,version_id,title,topic_title,tags_json,difficulty,draft,draft_revision,revealed_at,rating,rated_at,skipped_at)
        VALUES (?, ?, ?, ?, ?, '旧专题', '[]', '基础', ?, 2, ?, ?, ?, NULL)`,
          )
          .run(
            id,
            n - 1,
            n,
            n,
            `当时标题 ${n}`,
            n === 1 ? '旧已自评作答' : '旧未揭晓草稿\r\nint held = 2;',
            n === 1 ? '2026-10-20T01:01:00.000Z' : null,
            n === 1 ? '不熟' : null,
            n === 1 ? '2026-10-20T01:02:00.000Z' : null,
          )
    }
    database
      .prepare('INSERT INTO import_receipts VALUES (?, ?, ?)')
      .run(randomUUID(), '2026-10-20T00:00:00.000Z', '{"legacy":"原导入回执"}')
    database.prepare('INSERT INTO practice_receipts VALUES (?, ?, ?, ?)').run(
      randomUUID(),
      'b'.repeat(64),
      JSON.stringify({
        sessionId: activeId,
        status: 'active',
        position: 1,
        revision: 3,
        total: 2,
      }),
      '2026-10-20T01:00:00.000Z',
    )
    database.exec(
      'CREATE INDEX legacy_session_mode ON practice_sessions(mode); CREATE TRIGGER legacy_session_probe AFTER UPDATE ON practice_sessions BEGIN SELECT 1; END; PRAGMA foreign_keys=ON;',
    )
    expect(database.prepare('PRAGMA foreign_key_check').all()).toEqual([])
    return activeId
  } finally {
    database.close()
  }
}
function snapshot(directory: string) {
  return withHistoryDatabase(directory, (database) =>
    Object.fromEntries(
      tables.map((name) => [
        name,
        database
          .prepare(
            name === 'image_resources'
              ? 'SELECT hash,format,width,height,hex(bytes) AS bytes FROM image_resources ORDER BY hash'
              : `SELECT * FROM ${name} ORDER BY rowid`,
          )
          .all(),
      ]),
    ),
  )
}

test('v4 升级至 v10：一致性备份、完整业务与随机原轮保留，显示设置重开不重复升级', async ({
  testDataDirectory,
}, info) => {
  const activeId = await seedV4(testDataDirectory)
  const before = snapshot(testDataDirectory)
  const migrated = {
    ...before,
    topics: before.topics!.map((row) => ({ ...row, category_id: null })),
    practice_sessions: before.practice_sessions!.map((row) => ({
      ...row,
      filters_json: null,
      category_scope_json: '{"kind":"all"}',
    })),
  }
  const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  try {
    expect(snapshot(testDataDirectory)).toEqual(migrated)
    const view = await page.evaluate(() =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
    )
    expect(view).toMatchObject({
      ok: true,
      value: {
        session: { sessionId: activeId, mode: 'random', filters: null, position: 1, total: 2 },
        item: { draft: { text: '旧未揭晓草稿\r\nint held = 2;' }, revealed: false },
      },
    })
    const settings = await page.evaluate(() =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.settings.read(),
    )
    expect(settings).toEqual({
      ok: true,
      value: appearanceSchema.parse({ theme: 'system', palette: 'forest', fontSize: 17 }),
    })
    const target = appearanceSchema.parse({ theme: 'dark', palette: 'forest', fontSize: 22 })
    expect(
      await page.evaluate(
        (value) => (globalThis as unknown as { desktop: DesktopApi }).desktop.settings.save(value),
        target,
      ),
    ).toEqual({ ok: true, value: target })
    withHistoryDatabase(
      testDataDirectory,
      (database) => {
        expect(database.prepare('PRAGMA user_version').get()).toEqual({ user_version: 10 })
        expect(
          database
            .prepare(
              "SELECT name FROM sqlite_schema WHERE name IN ('legacy_session_mode','legacy_session_probe') ORDER BY name",
            )
            .all(),
        ).toEqual([{ name: 'legacy_session_mode' }, { name: 'legacy_session_probe' }])
        for (const [theme, size] of [
          ['invalid', 17],
          ['dark', 14],
          ['dark', 23],
          ['dark', null],
        ] as const) {
          database.exec('BEGIN')
          try {
            expect(() =>
              database
                .prepare('UPDATE appearance_settings SET theme=?,font_size=? WHERE id=1')
                .run(theme, size),
            ).toThrow()
          } finally {
            database.exec('ROLLBACK')
          }
        }
      },
      false,
    )
  } finally {
    await stop(application)
  }
  const names = await readdir(join(testDataDirectory, 'backups'))
  expect(names).toHaveLength(1)
  const backup = new DatabaseSync(join(testDataDirectory, 'backups', names[0]!), { readOnly: true })
  try {
    expect(backup.prepare('PRAGMA user_version').get()).toEqual({ user_version: 4 })
    expect(backup.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }])
    expect(backup.prepare('PRAGMA foreign_key_check').all()).toEqual([])
    expect(
      backup.prepare("SELECT name FROM sqlite_schema WHERE name='appearance_settings'").all(),
    ).toEqual([])
    for (const name of tables)
      expect(
        backup
          .prepare(
            name === 'image_resources'
              ? 'SELECT hash,format,width,height,hex(bytes) AS bytes FROM image_resources ORDER BY hash'
              : `SELECT * FROM ${name} ORDER BY rowid`,
          )
          .all(),
      ).toEqual(before[name])
    expect(backup.prepare('SELECT launch_count FROM app_startup').get()).toEqual({
      launch_count: 7,
    })
  } finally {
    backup.close()
  }
  const reopened = await launchApplication(testDataDirectory, info.project.name)
  try {
    expect(
      await reopened.page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.settings.read(),
      ),
    ).toEqual({
      ok: true,
      value: appearanceSchema.parse({ theme: 'dark', palette: 'forest', fontSize: 22 }),
    })
    expect(snapshot(testDataDirectory)).toEqual(migrated)
    expect(await readdir(join(testDataDirectory, 'backups'))).toEqual(names)
    await info.attach('settings-v4-preserved.json', {
      body: JSON.stringify({
        before,
        after: snapshot(testDataDirectory),
        backup: names[0],
        activeId,
      }),
      contentType: 'application/json',
    })
  } finally {
    await stop(reopened.application)
  }
})

for (const failure of ['backup-blocked', 'table-conflict', 'foreign-key'] as const) {
  test(`v4 显示设置升级 ${failure} 时停止/回滚且保留原库`, async ({ testDataDirectory }, info) => {
    await seedV4(testDataDirectory)
    if (failure === 'backup-blocked')
      await writeFile(join(testDataDirectory, 'backups'), '测试阻断备份目录')
    else
      withHistoryDatabase(
        testDataDirectory,
        (database) =>
          database.exec(
            failure === 'table-conflict'
              ? 'CREATE TABLE appearance_settings (legacy TEXT);'
              : 'PRAGMA foreign_keys=OFF; UPDATE question_user_state SET last_rated_version_id=999999 WHERE question_id=1;',
          ),
        false,
      )
    const before = snapshot(testDataDirectory)
    const bytes = await readFile(join(testDataDirectory, 'practice.sqlite3'))
    const { application, page } = await launchApplication(testDataDirectory, info.project.name)
    try {
      await expect(page.locator('.service-status')).toContainText('本地数据暂不可用')
      expect(snapshot(testDataDirectory)).toEqual(before)
      withHistoryDatabase(testDataDirectory, (database) => {
        expect(database.prepare('PRAGMA user_version').get()).toEqual({ user_version: 4 })
        expect(
          database.prepare("SELECT name FROM sqlite_schema WHERE name='appearance_settings'").all(),
        ).toHaveLength(failure === 'table-conflict' ? 1 : 0)
      })
    } finally {
      await stop(application)
    }
    if (failure === 'backup-blocked')
      expect(await readFile(join(testDataDirectory, 'practice.sqlite3'))).toEqual(bytes)
    else expect(await readdir(join(testDataDirectory, 'backups'))).toHaveLength(1)
    await info.attach(`settings-v4-${failure}.json`, {
      body: JSON.stringify({ before, after: snapshot(testDataDirectory), version: 4 }),
      contentType: 'application/json',
    })
  })
}
