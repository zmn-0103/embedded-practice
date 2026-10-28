import { createHash, randomUUID } from 'node:crypto'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { legacyV3PracticeSchema } from '../fixtures/practice-v3-schema'
import { expect, launchApplication, test } from './helpers'
import { stop, withHistoryDatabase } from './history-helpers'

async function legacy(path: string, version: number, broken = false) {
  const frozen = await readFile(
    resolve(`tests/fixtures/schema-v${version === 4 ? 4 : 5}.sql`),
    'utf8',
  )
  const schema = new DatabaseSync(':memory:')
  let sql: string
  try {
    schema.exec(frozen)
    const objects = schema
      .prepare(
        `SELECT name, tbl_name AS tableName, sql FROM sqlite_schema
      WHERE sql IS NOT NULL AND name NOT GLOB 'sqlite_*' ORDER BY rowid`,
      )
      .all() as {
      name: string
      tableName: string
      sql: string
    }[]
    sql = objects
      .filter((object) => {
        if (version === 1) return object.name === 'app_startup'
        if (version <= 3)
          return (
            !object.tableName.startsWith('practice_') && object.tableName !== 'appearance_settings'
          )
        return true
      })
      .map((object) => object.sql + ';')
      .join('\n')
    if (version === 3) sql += legacyV3PracticeSchema
  } finally {
    schema.close()
  }
  const db = new DatabaseSync(path)
  try {
    db.exec(`PRAGMA application_id=0x45505231; PRAGMA user_version=${version}; ${sql}`)
    db.exec("INSERT INTO app_startup VALUES(1,3,'2026-10-20T00:00:00.000Z')")
    if (version > 1) {
      db.exec(`INSERT INTO library_meta VALUES(1,1);
        INSERT INTO topics VALUES('backup-legacy','旧备份专题','旧备份来源.md');
        INSERT INTO questions VALUES(1,'backup-legacy','q-1','旧备份题','[]','基础',0,0,NULL);`)
      const bytes = await readFile(resolve('tests/fixtures/images/small.png'))
      const hash = createHash('sha256').update(bytes).digest('hex')
      db.prepare(
        `INSERT INTO question_versions VALUES(1,1,1,'旧标题','旧题干','旧答案','[]',?,?,?)`,
      ).run(
        JSON.stringify([{ url: 'assets/old.png', hash }]),
        'a'.repeat(64),
        '2026-10-20T00:00:00.000Z',
      )
      db.exec(
        "UPDATE questions SET current_version_id=1; INSERT INTO question_user_state VALUES(1,1,'掌握',1)",
      )
      db.prepare("INSERT INTO image_resources VALUES(?,'png',2,3,?)").run(hash, bytes)
      db.prepare('INSERT INTO version_images VALUES(1,?)').run(hash)
    }
    if (version >= 3) {
      const sessionId = randomUUID()
      db.prepare(
        `INSERT INTO practice_sessions VALUES(?,?,'backup-legacy','active',0,0,?,NULL)`,
      ).run(sessionId, version === 3 ? 'sequential' : 'random', '2026-10-20T00:00:00.000Z')
      db.prepare(
        `INSERT INTO practice_items VALUES(?,0,1,1,'旧题','旧专题','[]','基础','旧草稿',1,NULL,NULL,NULL,NULL)`,
      ).run(sessionId)
    }
    if (version >= 5) db.exec("INSERT INTO appearance_settings VALUES(1,'dark',20)")
    // 冻结结构 6 增量，不引用当前生产迁移来构造旧备份。
    if (version === 6)
      db.exec(`ALTER TABLE practice_sessions ADD COLUMN filters_json TEXT
      CHECK (filters_json IS NULL OR (json_valid(filters_json) AND json_type(filters_json) = 'object'));`)
    if (broken) db.exec('ALTER TABLE practice_sessions ADD COLUMN filters_json TEXT')
  } finally {
    db.close()
  }
}

for (const version of [1, 2, 3, 4, 5, 6]) {
  test(`结构 ${version} 备份确认恢复后独立启动保留旧题图收藏草稿和设置`, async ({
    testDataDirectory,
  }, info) => {
    const directory = await mkdtemp(join(tmpdir(), 'embedded-practice-backup-legacy-'))
    const { application, page } = await launchApplication(
      testDataDirectory,
      info.project.name,
      '备份恢复',
    )
    let reopened: typeof application | undefined
    try {
      const path = join(directory, `恢复旧结构 ${version}.sqlite3`)
      await legacy(path, version)
      const bytes = await readFile(path)
      await application.evaluate(({ app, dialog }, path) => {
        dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
        dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false })
        app.relaunch = () => {} // 本组检查独立启动，真实自动重启另有专门场景。
      }, path)
      const preview = await page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
      )
      expect(preview.ok).toBe(true)
      if (!preview.ok) throw new Error(preview.error.code)
      const exited = application.waitForEvent('close')
      expect(
        await page.evaluate(
          (token) =>
            (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.restore({ token }),
          preview.value.token,
        ),
      ).toMatchObject({ ok: true })
      await exited
      expect(await readFile(path)).toEqual(bytes)
      const launched = await launchApplication(testDataDirectory, info.project.name)
      reopened = launched.application
      const result = withHistoryDatabase(testDataDirectory, (db) => ({
        integrity: db.prepare('PRAGMA integrity_check').all(),
        foreignKeys: db.prepare('PRAGMA foreign_key_check').all(),
        version: db.prepare('PRAGMA user_version').get(),
        questions: db.prepare('SELECT title FROM questions').all(),
        images: db.prepare('SELECT hex(bytes) AS bytes FROM image_resources').all(),
        states: db.prepare('SELECT favorite,last_rating FROM question_user_state').all(),
        items: db.prepare('SELECT draft FROM practice_items').all(),
        sessions: db.prepare('SELECT filters_json FROM practice_sessions').all(),
        settings: db.prepare('SELECT theme,font_size,palette FROM appearance_settings').get(),
      }))
      expect(result.integrity).toEqual([{ integrity_check: 'ok' }])
      expect(result.foreignKeys).toEqual([])
      expect(result.version).toEqual({ user_version: 12 })
      expect(result.questions).toEqual(version > 1 ? [{ title: '旧备份题' }] : [])
      expect(result.images).toEqual(
        version > 1
          ? [
              {
                bytes: (await readFile(resolve('tests/fixtures/images/small.png')))
                  .toString('hex')
                  .toUpperCase(),
              },
            ]
          : [],
      )
      expect(result.states).toEqual(version > 1 ? [{ favorite: 1, last_rating: '掌握' }] : [])
      expect(result.items).toEqual(version >= 3 ? [{ draft: '旧草稿' }] : [])
      expect(result.sessions).toEqual(version >= 3 ? [{ filters_json: null }] : [])
      expect(result.settings).toMatchObject(
        version >= 5
          ? { theme: 'dark', font_size: 20, palette: 'forest' }
          : { theme: 'system', font_size: 17, palette: 'forest' },
      )
      expect(await readdir(testDataDirectory)).not.toContain('restore-transaction')
      await info.attach('legacy-restored.json', {
        body: JSON.stringify({ version, result }),
        contentType: 'application/json',
      })
    } finally {
      if (reopened) await stop(reopened)
      await stop(application)
      if (
        dirname(resolve(directory)) !== resolve(tmpdir()) ||
        !basename(directory).startsWith('embedded-practice-backup-legacy-')
      )
        throw new Error('拒绝清理非本次旧备份目录。')
      await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
    }
  })
}

for (const version of [1, 2, 3, 4, 5, 6]) {
  test(`结构 ${version} 备份只迁移暂存副本，旧时间未知且来源不变`, async ({
    testDataDirectory,
  }, info) => {
    const directory = await mkdtemp(join(tmpdir(), 'embedded-practice-backup-legacy-'))
    const { application, page } = await launchApplication(
      testDataDirectory,
      info.project.name,
      '备份恢复',
    )
    try {
      const path = join(directory, `旧结构 ${version}.sqlite3`)
      await legacy(path, version)
      const original = await readFile(path)
      const before = withHistoryDatabase(testDataDirectory, (db) =>
        db.prepare('SELECT * FROM app_startup').all(),
      )
      await application.evaluate(({ dialog }, path) => {
        dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
      }, path)
      await page.getByRole('button', { name: '选择备份并预览', exact: true }).click()
      await expect(page.getByLabel('恢复预览摘要', { exact: true })).toBeVisible()
      await expect(page.getByLabel('恢复预览摘要', { exact: true })).toContainText(
        '未知（旧备份未记录时间）',
      )
      const result = await page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
      )
      expect(result).toMatchObject({
        ok: true,
        value: {
          filePath: path,
          summary: {
            createdAt: null,
            appVersion: null,
            schemaVersion: version,
            requiresMigration: true,
            topics: version > 1 ? 1 : 0,
            questions: version > 1 ? 1 : 0,
            images: version > 1 ? 1 : 0,
            favorites: version > 1 ? 1 : 0,
            sessions: version >= 3 ? 1 : 0,
            drafts: version >= 3 ? 1 : 0,
            activeSession: version >= 3,
          },
        },
      })
      expect(await readFile(path)).toEqual(original)
      const source = new DatabaseSync(path, { readOnly: true })
      try {
        expect(source.prepare('PRAGMA user_version').get()).toEqual({ user_version: version })
      } finally {
        source.close()
      }
      expect(
        withHistoryDatabase(testDataDirectory, (db) =>
          db.prepare('SELECT * FROM app_startup').all(),
        ),
      ).toEqual(before)
      expect(await readdir(join(testDataDirectory, 'backup-staging'))).toEqual([
        expect.stringMatching(/^preview-/),
      ])
      await info.attach('legacy-backup-preview.json', {
        body: JSON.stringify({
          version,
          result,
          sha256: createHash('sha256').update(original).digest('hex'),
        }),
        contentType: 'application/json',
      })
      if (version === 5) {
        const bad = join(directory, '升级冲突.sqlite3')
        await legacy(bad, 5, true)
        const bytes = await readFile(bad)
        await application.evaluate(({ dialog }, path) => {
          dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
        }, bad)
        expect(
          await page.evaluate(() =>
            (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
          ),
        ).toMatchObject({ ok: false, error: { code: 'INVALID_BACKUP' } })
        expect(await readFile(bad)).toEqual(bytes)
        expect(await readdir(join(testDataDirectory, 'backup-staging'))).toEqual([])
      }
    } finally {
      await stop(application)
      if (
        dirname(resolve(directory)) !== resolve(tmpdir()) ||
        !basename(directory).startsWith('embedded-practice-backup-legacy-')
      )
        throw new Error('拒绝清理非本次旧备份目录。')
      await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
    }
  })
}
