import { createHash, randomUUID } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { DesktopApi } from '../../src/shared/contracts/application'
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
  'appearance_settings',
] as const
function records(database: DatabaseSync) {
  return Object.fromEntries(
    tables.map((table) => [
      table,
      database
        .prepare(
          table === 'image_resources'
            ? 'SELECT hash,format,width,height,hex(bytes) AS bytes FROM image_resources ORDER BY hash'
            : `SELECT * FROM ${table} ORDER BY rowid`,
        )
        .all(),
    ]),
  )
}
async function legacy(directory: string) {
  const sql = await readFile(resolve('tests/fixtures/schema-v5.sql'), 'utf8')
  const source = JSON.parse(
    await readFile(resolve('docs/evidence/session-filters-fix/schema-v5-source.json'), 'utf8'),
  )
  expect(createHash('sha256').update(sql).digest('hex')).toBe(source.sha256)
  const sessionId = randomUUID()
  const input = {
    requestId: randomUUID(),
    topicId: 'filter-legacy',
    count: 'all' as const,
    replace: null,
    mode: 'random' as const,
  }
  const receipt = { sessionId, status: 'active', position: 0, revision: 0, total: 2 }
  const bytes = await readFile(resolve('tests/fixtures/images/small.png'))
  const hash = createHash('sha256').update(bytes).digest('hex')
  const database = new DatabaseSync(join(directory, 'practice.sqlite3'))
  try {
    database.exec(`PRAGMA application_id=0x45505231; PRAGMA user_version=5; ${sql}`)
    database.exec(
      "INSERT INTO app_startup VALUES (1,7,'2026-10-20T00:00:00.000Z'); INSERT INTO topics VALUES ('filter-legacy','旧专题','旧来源.md'); UPDATE appearance_settings SET theme='dark', font_size=20;",
    )
    database.prepare('INSERT INTO image_resources VALUES (?, ?, 2, 3, ?)').run(hash, 'png', bytes)
    for (let n = 1; n <= 2; n++) {
      database
        .prepare(
          "INSERT INTO questions VALUES (?, 'filter-legacy', ?, ?, '[\"旧标签\"]', '基础', ?, 0, NULL)",
        )
        .run(n, `q-${n}`, `旧题 ${n}`, n - 1)
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
        .run(n, Number(n === 1), n === 1 ? '掌握' : null, n === 1 ? n : null)
    }
    database.prepare('INSERT INTO version_images VALUES (1, ?)').run(hash)
    for (const status of ['active', 'ended', 'finished']) {
      const id = status === 'active' ? sessionId : randomUUID()
      database
        .prepare(
          "INSERT INTO practice_sessions VALUES (?, 'random', 'filter-legacy', ?, ?, 3, ?, ?)",
        )
        .run(
          id,
          status,
          status === 'finished' ? 2 : 1,
          '2026-10-20T00:00:00.000Z',
          status === 'active' ? null : '2026-10-20T02:00:00.000Z',
        )
      for (let n = 1; n <= 2; n++)
        database
          .prepare(
            `INSERT INTO practice_items
        (session_id,position,question_id,version_id,title,topic_title,tags_json,difficulty,draft,draft_revision,revealed_at,rating,rated_at,skipped_at)
        VALUES (?, ?, ?, ?, ?, '旧专题', '["旧标签"]', '基础', ?, 2, ?, ?, ?, NULL)`,
          )
          .run(
            id,
            n - 1,
            n,
            n,
            `旧题 ${n}`,
            n === 1 ? '旧已自评作答' : '旧草稿\r\nint retained = 5;',
            n === 1 ? '2026-10-20T01:00:00.000Z' : null,
            n === 1 ? '掌握' : null,
            n === 1 ? '2026-10-20T01:01:00.000Z' : null,
          )
    }
    database.prepare('INSERT INTO practice_receipts VALUES (?, ?, ?, ?)').run(
      input.requestId,
      createHash('sha256')
        .update(JSON.stringify({ action: 'start', input }))
        .digest('hex'),
      JSON.stringify(receipt),
      '2026-10-20T00:00:00.000Z',
    )
    database
      .prepare('INSERT INTO import_receipts VALUES (?, ?, ?)')
      .run(randomUUID(), '2026-10-20T00:00:00.000Z', '{"legacy":"旧导入回执"}')
    database.exec(
      'CREATE INDEX original_filter_mode ON practice_sessions(mode); CREATE TRIGGER original_filter_probe AFTER UPDATE ON practice_sessions BEGIN SELECT 1; END; PRAGMA foreign_keys=ON;',
    )
    expect(database.prepare('PRAGMA foreign_key_check').all()).toEqual([])
    return { sessionId, input, receipt, before: records(database) }
  } finally {
    database.close()
  }
}

test('v5 升级至 v13 保留全业务、原回执与显示设置，旧筛选明确未知', async ({
  testDataDirectory,
}, info) => {
  const original = await legacy(testDataDirectory)
  const expected = {
    ...original.before,
    topics: original.before.topics!.map((row) => ({ ...row, category_id: null })),
    appearance_settings: original.before.appearance_settings!.map((row) => ({
      ...row,
      palette: 'forest',
      theme_id: 'builtin.forest',
      navigation_collapsed: 0,
      auxiliary_hidden: 0,
    })),
    practice_sessions: original.before.practice_sessions!.map((row) => ({
      ...row,
      repeat_source_id: null,
      repeat_selection: null,
      selection_name: null,
      filters_json: null,
      category_scope_json: '{"kind":"all"}',
    })),
  }
  const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  try {
    await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
    withHistoryDatabase(testDataDirectory, (database) => {
      expect(records(database)).toEqual(expected)
      expect(database.prepare('PRAGMA user_version').get()).toEqual({ user_version: 13 })
      expect(database.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }])
      expect(database.prepare('PRAGMA foreign_key_check').all()).toEqual([])
      expect(
        database
          .prepare(
            "SELECT name FROM sqlite_schema WHERE name IN ('original_filter_mode','original_filter_probe') ORDER BY name",
          )
          .all(),
      ).toEqual([{ name: 'original_filter_mode' }, { name: 'original_filter_probe' }])
    })
    const read = await page.evaluate(() =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
    )
    expect(read).toMatchObject({
      ok: true,
      value: {
        session: { sessionId: original.sessionId, mode: 'random', position: 1, filters: null },
        item: { draft: { text: '旧草稿\r\nint retained = 5;' }, revealed: false },
      },
    })
    expect(
      await page.evaluate(
        (input) => (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.start(input),
        original.input,
      ),
    ).toEqual({ ok: true, value: original.receipt })
    const conditions = page.getByLabel('本轮创建条件', { exact: true })
    await conditions.getByText('本轮创建条件', { exact: true }).click()
    await expect(conditions).toContainText('此旧会话未保存筛选条件，原条件未知。')
    expect(await conditions.locator('dd').count()).toBe(0)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('html')).toHaveAttribute('data-font-size', '20')
    withHistoryDatabase(testDataDirectory, (database) =>
      expect(records(database)).toEqual(expected),
    )
  } finally {
    await stop(application)
  }
  const backups = await readdir(join(testDataDirectory, 'backups'))
  expect(backups).toHaveLength(1)
  expect(backups[0]).toMatch(/^pre-migration-v5-/)
  const backup = new DatabaseSync(join(testDataDirectory, 'backups', backups[0]!), {
    readOnly: true,
  })
  try {
    expect(records(backup)).toEqual(original.before)
    expect(backup.prepare('PRAGMA user_version').get()).toEqual({ user_version: 5 })
    expect(backup.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }])
    expect(backup.prepare('PRAGMA foreign_key_check').all()).toEqual([])
    expect(
      backup
        .prepare('PRAGMA table_info(practice_sessions)')
        .all()
        .map((x) => x.name),
    ).not.toContain('filters_json')
  } finally {
    backup.close()
  }
  const reopened = await launchApplication(testDataDirectory, info.project.name)
  try {
    await expect(reopened.page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
    withHistoryDatabase(testDataDirectory, (database) =>
      expect(records(database)).toEqual(expected),
    )
    expect(await readdir(join(testDataDirectory, 'backups'))).toEqual(backups)
    await info.attach('filters-v5-preserved.json', {
      body: JSON.stringify({ original, expected, backups }),
      contentType: 'application/json',
    })
  } finally {
    await stop(reopened.application)
  }
})

for (const fault of ['backup-blocked', 'column-conflict', 'foreign-key'] as const) {
  test(`v5 筛选迁移 ${fault} 停止或回滚，原库保留`, async ({ testDataDirectory }, info) => {
    await legacy(testDataDirectory)
    if (fault === 'backup-blocked')
      await writeFile(join(testDataDirectory, 'backups'), '阻断保护备份目录')
    else
      withHistoryDatabase(
        testDataDirectory,
        (database) =>
          database.exec(
            fault === 'column-conflict'
              ? 'ALTER TABLE practice_sessions ADD COLUMN filters_json TEXT; UPDATE practice_sessions SET filters_json=\'{"retained":"旧冲突列"}\';'
              : 'PRAGMA foreign_keys=OFF; UPDATE question_user_state SET last_rated_version_id=999999 WHERE question_id=1;',
          ),
        false,
      )
    const before = withHistoryDatabase(testDataDirectory, records)
    const bytes = await readFile(join(testDataDirectory, 'practice.sqlite3'))
    const { application, page } = await launchApplication(testDataDirectory, info.project.name)
    try {
      await expect(page.locator('.service-status')).toContainText('本地数据暂不可用')
      withHistoryDatabase(testDataDirectory, (database) => {
        expect(records(database)).toEqual(before)
        expect(database.prepare('PRAGMA user_version').get()).toEqual({ user_version: 5 })
      })
    } finally {
      await stop(application)
    }
    if (fault === 'backup-blocked')
      expect(await readFile(join(testDataDirectory, 'practice.sqlite3'))).toEqual(bytes)
    else {
      const names = await readdir(join(testDataDirectory, 'backups'))
      expect(names).toHaveLength(1)
      const backup = new DatabaseSync(join(testDataDirectory, 'backups', names[0]!), {
        readOnly: true,
      })
      try {
        expect(records(backup)).toEqual(before)
        expect(backup.prepare('PRAGMA user_version').get()).toEqual({ user_version: 5 })
      } finally {
        backup.close()
      }
    }
    await info.attach(`filters-v5-${fault}.json`, {
      body: JSON.stringify({ before, after: withHistoryDatabase(testDataDirectory, records) }),
      contentType: 'application/json',
    })
  })
}
