import { createHash, randomUUID } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { EMPTY_QUESTION_FILTERS } from '../../src/shared/contracts/question-filters'
import { expect, launchApplication, test } from './helpers'
import { stop, withHistoryDatabase } from './history-helpers'

function records(database: DatabaseSync) {
  const tables = database
    .prepare(
      "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT GLOB 'sqlite_*' AND name<>'app_startup' ORDER BY name",
    )
    .all() as { name: string }[]
  return Object.fromEntries(
    tables.map(({ name }) => [
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
async function seedV9(directory: string, palette = 'ocean', mode = 'dark', fontSize = 22) {
  const sql = await readFile('tests/fixtures/schema-v9.sql', 'utf8')
  expect(createHash('sha256').update(sql).digest('hex')).toBe(
    '1c9a8173bf0e29bfc090beb19c48c69b1923fbb8f5f68b551c6d380c3e43b5ef',
  )
  const database = new DatabaseSync(join(directory, 'practice.sqlite3'))
  try {
    database.exec(sql)
    database
      .prepare('UPDATE appearance_settings SET palette=?,theme=?,font_size=? WHERE id=1')
      .run(palette, mode, fontSize)
    database.exec(`
      INSERT INTO categories VALUES('theme-old-category','原分类');
      INSERT INTO topics(topic_id,title,source_name,category_id) VALUES('theme-old','旧主题样本','旧来源.md','theme-old-category');
      INSERT INTO questions(id,topic_id,question_id,title,tags_json,difficulty,position,archived,current_version_id) VALUES(1,'theme-old','q-1','旧题','["旧标签"]','基础',0,0,NULL);
      INSERT INTO question_versions VALUES(1,1,1,'旧题','旧题干','旧答案','[]','[]','${'a'.repeat(64)}','2026-10-24T00:00:00.000Z');
      UPDATE questions SET current_version_id=1;
      INSERT INTO question_user_state VALUES(1,1,'掌握',1);
      CREATE TABLE private_theme_notes(note TEXT) STRICT; INSERT INTO private_theme_notes VALUES('原自定义数据');
      CREATE INDEX v9_theme_index ON appearance_settings(theme);
      CREATE TRIGGER v9_theme_probe AFTER UPDATE ON appearance_settings BEGIN SELECT 1; END;
    `)
    const sessionId = randomUUID()
    database
      .prepare(
        "INSERT INTO practice_sessions(id,mode,topic_id,status,position,revision,created_at,ended_at,filters_json,category_scope_json) VALUES(?,'random','theme-old','active',0,3,'2026-10-24T00:00:00.000Z',NULL,?,?)",
      )
      .run(
        sessionId,
        JSON.stringify(EMPTY_QUESTION_FILTERS),
        JSON.stringify({
          kind: 'category',
          categoryId: 'theme-old-category',
          title: '旧轮分类快照',
        }),
      )
    database
      .prepare(
        "INSERT INTO practice_items(session_id,position,question_id,version_id,title,topic_title,tags_json,difficulty,draft,draft_revision) VALUES(?,0,1,1,'旧题','旧主题样本','[\"旧标签\"]','基础',?,2)",
      )
      .run(sessionId, '结构9草稿\r\n    retained9();')
    database.prepare('INSERT INTO practice_plans VALUES(?,?,?)').run(
      randomUUID(),
      '原练习方案',
      JSON.stringify({
        category: { kind: 'all' },
        topicId: 'theme-old',
        mode: 'sequential',
        count: 20,
        filters: EMPTY_QUESTION_FILTERS,
      }),
    )
    database
      .prepare('INSERT INTO import_receipts VALUES(?,?,?)')
      .run(randomUUID(), '2026-10-24T00:00:00.000Z', '{"legacy":"原回执"}')
    expect(database.prepare('PRAGMA foreign_key_check').all()).toEqual([])
    return records(database)
  } finally {
    database.close()
  }
}
for (const [palette, mode, size] of [
  ['forest', 'system', 15],
  ['ocean', 'light', 22],
  ['sand', 'dark', 20],
  ['lilac', 'system', 17],
] as const) {
  test(`结构9/${palette}先保护备份再迁移主题，原明暗/字号/学习数据/方案逐行保持`, async ({
    testDataDirectory,
  }, info) => {
    const before = await seedV9(testDataDirectory, palette, mode, size)
    const expected = {
      ...before,
      installed_themes: [],
      practice_sessions: before.practice_sessions!.map((row) => ({
        ...row,
        repeat_source_id: null,
        repeat_selection: null,
      })),
      appearance_settings: before['appearance_settings']!.map((row) => ({
        ...row,
        theme_id: `builtin.${palette}`,
        navigation_collapsed: 0,
        auxiliary_hidden: 0,
      })),
    }
    const { application, page } = await launchApplication(testDataDirectory, info.project.name)
    try {
      await expect(page.locator('html')).toHaveAttribute('data-theme-id', `builtin.${palette}`)
      await expect(page.locator('html')).toHaveAttribute('data-theme', mode)
      await expect(page.locator('html')).toHaveAttribute('data-font-size', String(size))
      expect(withHistoryDatabase(testDataDirectory, records)).toEqual(expected)
      expect(
        withHistoryDatabase(testDataDirectory, (database) =>
          database.prepare('PRAGMA user_version').get(),
        ),
      ).toEqual({ user_version: 11 })
      await page.getByRole('button', { name: '继续练习', exact: true }).click()
      await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
        '结构9草稿\n    retained9();',
      )
      await expect(page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
    } finally {
      await stop(application)
    }
    const names = await readdir(join(testDataDirectory, 'backups'))
    expect(names).toHaveLength(1)
    expect(names[0]).toMatch(/^pre-migration-v9-/)
    const path = join(testDataDirectory, 'backups', names[0]!),
      sourceBytes = await readFile(path)
    const old = new DatabaseSync(path, { readOnly: true })
    try {
      expect(old.prepare('PRAGMA user_version').get()).toEqual({ user_version: 9 })
      expect(records(old)).toEqual(before)
    } finally {
      old.close()
    }
    const next = await launchApplication(testDataDirectory, info.project.name)
    try {
      expect(withHistoryDatabase(testDataDirectory, records)).toEqual(expected)
      expect(await readdir(join(testDataDirectory, 'backups'))).toEqual(names)
      await next.application.evaluate(({ dialog }, path) => {
        dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
      }, path)
      const preview = await next.page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
      )
      expect(preview).toMatchObject({
        ok: true,
        value: {
          summary: {
            schemaVersion: 9,
            requiresMigration: true,
            installedThemes: 0,
            appearance: { themeId: `builtin.${palette}`, theme: mode, fontSize: size },
          },
        },
      })
      expect(await readFile(path)).toEqual(sourceBytes)
      await info.attach('v9-theme-migration.json', {
        body: JSON.stringify({ palette, mode, size, before, after: expected, preview }),
        contentType: 'application/json',
      })
    } finally {
      await stop(next.application)
    }
  })
}
for (const failure of [
  'backup-blocked',
  'table-conflict',
  'column-conflict',
  'foreign-key',
] as const) {
  test(`结构9主题迁移/${failure}停止或回滚，原文件和业务保持`, async ({
    testDataDirectory,
  }, info) => {
    await seedV9(testDataDirectory)
    if (failure === 'backup-blocked')
      await writeFile(join(testDataDirectory, 'backups'), '阻断保护备份目录')
    else
      withHistoryDatabase(
        testDataDirectory,
        (database) =>
          database.exec(
            failure === 'table-conflict'
              ? 'CREATE TABLE installed_themes(legacy TEXT)'
              : failure === 'column-conflict'
                ? 'ALTER TABLE appearance_settings ADD COLUMN theme_id TEXT'
                : 'PRAGMA foreign_keys=OFF; UPDATE question_user_state SET last_rated_version_id=9999',
          ),
        false,
      )
    const before = withHistoryDatabase(testDataDirectory, records),
      bytes = await readFile(join(testDataDirectory, 'practice.sqlite3'))
    const { application, page } = await launchApplication(testDataDirectory, info.project.name)
    try {
      await expect(page.locator('.service-status')).toContainText('本地数据暂不可用')
      expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
      expect(
        withHistoryDatabase(testDataDirectory, (database) =>
          database.prepare('PRAGMA user_version').get(),
        ),
      ).toEqual({ user_version: 9 })
    } finally {
      await stop(application)
    }
    if (failure === 'backup-blocked')
      expect(await readFile(join(testDataDirectory, 'practice.sqlite3'))).toEqual(bytes)
    else expect(await readdir(join(testDataDirectory, 'backups'))).toHaveLength(1)
  })
}
