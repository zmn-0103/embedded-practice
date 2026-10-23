import { createHash, randomUUID } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, launchApplication, test } from './helpers'
import { stop, withHistoryDatabase } from './history-helpers'

function records(database: DatabaseSync) {
  const names = database
    .prepare(
      "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT GLOB 'sqlite_*' AND name <> 'app_startup' ORDER BY name",
    )
    .all() as { name: string }[]
  return Object.fromEntries(
    names.map(({ name }) => [
      name,
      database
        .prepare(
          name === 'image_resources'
            ? 'SELECT hash,format,width,height,hex(bytes) AS bytes FROM image_resources ORDER BY hash'
            : `SELECT * FROM "${name.replaceAll('"', '""')}" ORDER BY rowid`,
        )
        .all(),
    ]),
  )
}

async function legacy(directory: string) {
  const sql = await readFile(resolve('tests/fixtures/schema-v6.sql'), 'utf8')
  const source = JSON.parse(
    await readFile(resolve('docs/evidence/ui-themes-20261023/schema-v6-source.json'), 'utf8'),
  )
  expect(createHash('sha256').update(sql).digest('hex')).toBe(source.sha256)
  const database = new DatabaseSync(join(directory, 'practice.sqlite3'))
  try {
    database.exec(`PRAGMA application_id=0x45505231; PRAGMA user_version=6; ${sql}`)
    database.exec(`INSERT INTO app_startup VALUES(1,7,'2026-10-22T00:00:00.000Z');
      INSERT INTO topics VALUES('palette-legacy','旧配色专题','旧配色.md');
      INSERT INTO questions VALUES(1,'palette-legacy','q-1','旧题','[]','基础',0,0,NULL);
      UPDATE appearance_settings SET theme='dark',font_size=20;
      CREATE TABLE personal_notes(id INTEGER PRIMARY KEY, note TEXT) STRICT;
      INSERT INTO personal_notes VALUES(1,'结构六的额外表必须保留');
      CREATE INDEX legacy_theme ON appearance_settings(theme);
      CREATE TRIGGER legacy_theme_probe AFTER UPDATE ON appearance_settings BEGIN SELECT 1; END;`)
    const bytes = await readFile(resolve('tests/fixtures/images/small.png'))
    const hash = createHash('sha256').update(bytes).digest('hex')
    database.prepare("INSERT INTO image_resources VALUES(?,'png',2,3,?)").run(hash, bytes)
    database
      .prepare(
        "INSERT INTO question_versions VALUES(1,1,1,'旧标题','旧题干','旧答案','[]',?,?,'2026-10-22T00:00:00.000Z')",
      )
      .run(JSON.stringify([{ url: 'assets/old.png', hash }]), 'a'.repeat(64))
    database.exec(
      'UPDATE questions SET current_version_id=1; INSERT INTO question_user_state VALUES(1,1,NULL,NULL)',
    )
    database.prepare('INSERT INTO version_images VALUES(1,?)').run(hash)
    const sessionId = randomUUID()
    database
      .prepare(
        "INSERT INTO practice_sessions VALUES(?,'random','palette-legacy','active',0,0,'2026-10-22T00:00:00.000Z',NULL,?)",
      )
      .run(
        sessionId,
        JSON.stringify({
          query: '旧条件',
          tag: null,
          difficulty: null,
          mastery: 'all',
          favoritesOnly: false,
        }),
      )
    database
      .prepare(
        "INSERT INTO practice_items VALUES(?,0,1,1,'旧题','旧专题','[]','基础',?,1,NULL,NULL,NULL,NULL)",
      )
      .run(sessionId, '结构六草稿\r\n    int kept = 6;')
    database
      .prepare('INSERT INTO practice_receipts VALUES(?,?,?,?)')
      .run(randomUUID(), 'b'.repeat(64), '{}', '2026-10-22T00:00:00.000Z')
    return records(database)
  } finally {
    database.close()
  }
}

test('真实结构6先保护备份再追加配色，全部业务/自定义对象/显示和条件保持', async ({
  testDataDirectory,
}, info) => {
  const before = await legacy(testDataDirectory)
  const expected = {
    ...before,
    categories: [],
    practice_plans: [],
    topics: before.topics!.map((row) => ({ ...row, category_id: null })),
    practice_sessions: before.practice_sessions!.map((row) => ({
      ...row,
      category_scope_json: '{"kind":"all"}',
    })),
    appearance_settings: before.appearance_settings!.map((row) => ({ ...row, palette: 'forest' })),
  }
  const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  try {
    await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
    withHistoryDatabase(testDataDirectory, (database) => {
      expect(records(database)).toEqual(expected)
      expect(database.prepare('PRAGMA user_version').get()).toEqual({ user_version: 9 })
      expect(database.prepare('PRAGMA foreign_key_check').all()).toEqual([])
      expect(
        database
          .prepare(
            "SELECT name FROM sqlite_schema WHERE name IN ('legacy_theme','legacy_theme_probe') ORDER BY name",
          )
          .all(),
      ).toEqual([{ name: 'legacy_theme' }, { name: 'legacy_theme_probe' }])
    })
    await expect(page.locator('html')).toHaveAttribute('data-palette', 'forest')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('html')).toHaveAttribute('data-font-size', '20')
    expect(
      await page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.settings.read(),
      ),
    ).toEqual({ ok: true, value: { theme: 'dark', palette: 'forest', fontSize: 20 } })
    await page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      '结构六草稿\r\n    int kept = 6;'.replaceAll('\r\n', '\n'),
    )
  } finally {
    await stop(application)
  }
  const backups = await readdir(join(testDataDirectory, 'backups'))
  expect(backups).toHaveLength(1)
  expect(backups[0]).toMatch(/^pre-migration-v6-/)
  const backup = new DatabaseSync(join(testDataDirectory, 'backups', backups[0]!), {
    readOnly: true,
  })
  try {
    expect(backup.prepare('PRAGMA user_version').get()).toEqual({ user_version: 6 })
    expect(backup.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }])
    expect(records(backup)).toEqual(before)
  } finally {
    backup.close()
  }
  const next = await launchApplication(testDataDirectory, info.project.name)
  try {
    expect(withHistoryDatabase(testDataDirectory, records)).toEqual(expected)
    expect(await readdir(join(testDataDirectory, 'backups'))).toEqual(backups)
    await info.attach('palette-v6-preserved.json', {
      body: JSON.stringify({ before, after: expected, backups }),
      contentType: 'application/json',
    })
  } finally {
    await stop(next.application)
  }
})

for (const failure of ['backup-blocked', 'column-conflict', 'foreign-key'] as const) {
  test(`结构6配色迁移 ${failure} 停止/回滚，不修补未知结构`, async ({
    testDataDirectory,
  }, info) => {
    await legacy(testDataDirectory)
    if (failure === 'backup-blocked')
      await writeFile(join(testDataDirectory, 'backups'), '阻止保护备份')
    else
      withHistoryDatabase(
        testDataDirectory,
        (database) =>
          database.exec(
            failure === 'column-conflict'
              ? 'ALTER TABLE appearance_settings ADD COLUMN palette TEXT'
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
      withHistoryDatabase(testDataDirectory, (database) => {
        expect(database.prepare('PRAGMA user_version').get()).toEqual({ user_version: 6 })
        const columns = database.prepare('PRAGMA table_info(appearance_settings)').all() as {
          name: string
        }[]
        expect(columns.some((column) => column.name === 'palette')).toBe(
          failure === 'column-conflict',
        )
      })
    } finally {
      await stop(application)
    }
    if (failure === 'backup-blocked')
      expect(await readFile(join(testDataDirectory, 'practice.sqlite3'))).toEqual(bytes)
    else expect(await readdir(join(testDataDirectory, 'backups'))).toHaveLength(1)
    await info.attach(`palette-v6-${failure}.json`, {
      body: JSON.stringify({
        failure,
        before,
        after: withHistoryDatabase(testDataDirectory, records),
      }),
      contentType: 'application/json',
    })
  })
}
