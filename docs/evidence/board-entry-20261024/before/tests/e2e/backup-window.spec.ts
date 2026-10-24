import { createHash, randomUUID } from 'node:crypto'
import {
  copyFile,
  link,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { ElectronApplication, Page } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import type { BackupFile } from '../../src/shared/contracts/backup'
import { EMPTY_QUESTION_FILTERS } from '../../src/shared/contracts/question-filters'
import { expect, launchApplication, openPage, test } from './helpers'
import {
  alternatePng,
  captureHistory,
  historyBank,
  importHistoryFiles,
  prepareHistory,
  stop,
  withHistoryDatabase,
} from './history-helpers'

const tables = [
  'app_startup',
  'library_meta',
  'categories',
  'practice_plans',
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
function exportedRecords(path: string) {
  const db = new DatabaseSync(path, { readOnly: true })
  try {
    expect(db.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }])
    expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
    expect(db.prepare('PRAGMA application_id').get()).toEqual({ application_id: 0x45505231 })
    expect(db.prepare('PRAGMA user_version').get()).toEqual({ user_version: 9 })
    return records(db)
  } finally {
    db.close()
  }
}
async function outputDirectory<T>(work: (directory: string) => Promise<T>): Promise<T> {
  const directory = await mkdtemp(join(tmpdir(), 'embedded-practice-backup-files-'))
  try {
    return await work(directory)
  } finally {
    if (
      dirname(resolve(directory)) !== resolve(tmpdir()) ||
      !basename(directory).startsWith('embedded-practice-backup-files-')
    )
      throw new Error('拒绝清理非本次备份临时目录。')
    await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  }
}
async function select(
  application: ElectronApplication,
  kind: 'export' | 'preview',
  path: string | null,
) {
  await application.evaluate(
    ({ dialog }, args) => {
      if (args.kind === 'export')
        dialog.showSaveDialog = async () => ({
          canceled: args.path === null,
          filePath: args.path ?? '',
        })
      else
        dialog.showOpenDialog = async () => ({
          canceled: args.path === null,
          filePaths: args.path ? [args.path] : [],
        })
    },
    { kind, path },
  )
}
async function backup(page: Page, kind: 'export' | 'preview') {
  return page.evaluate(
    (kind) => (globalThis as unknown as { desktop: DesktopApi }).desktop.backup[kind](),
    kind,
  )
}
async function exportFile(
  application: ElectronApplication,
  page: Page,
  path: string,
): Promise<BackupFile> {
  await select(application, 'export', path)
  const result = await backup(page, 'export')
  expect(result.ok).toBe(true)
  if (!result.ok) throw new Error('导出测试失败：' + result.error.code)
  return result.value
}

test('完整备份导出覆盖版本图片历史草稿收藏固定随机队列条件和设置，预览不改原库', async ({
  testDataDirectory,
}, info) => {
  await outputDirectory(async (directory) => {
    const { application, page, file, folder } = await prepareHistory(
      testDataDirectory,
      info.project.name,
    )
    try {
      await page.evaluate(async () => {
        const api = (globalThis as unknown as { desktop: DesktopApi }).desktop
        for (const q of ['q-1', 'q-2'])
          if (
            !(
              await api.library.setFavorite({ topicId: 'history-a', questionId: q, favorite: true })
            ).ok
          )
            throw new Error('收藏失败')
      })
      await openPage(page, '开始练习')
      await page.getByLabel('练习模式', { exact: true }).selectOption('random')
      await page.getByLabel('练习专题', { exact: true }).selectOption('history-a')
      await page.getByText('筛选练习题目', { exact: true }).click()
      await page.getByLabel('练习标签', { exact: true }).fill('历史样本')
      await page.getByLabel('练习只看收藏', { exact: true }).check()
      await expect(page.getByText('匹配 2 题', { exact: true })).toBeVisible()
      await page.getByRole('button', { name: '开始练习', exact: true }).click()
      await page
        .getByRole('textbox', { name: '我的答案', exact: true })
        .fill('备份第一题作答\nint backup = 1;')
      await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
      await page.getByRole('button', { name: '掌握', exact: true }).click()
      await expect(page.getByLabel('练习进度')).toContainText('第 2 / 2')
      await page
        .getByRole('textbox', { name: '我的答案', exact: true })
        .fill('备份未揭晓草稿\nint queued = 2;')
      await page.getByRole('button', { name: '返回首页', exact: true }).click()
      await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
      await writeFile(file, historyBank(true, false, true))
      await writeFile(join(folder, 'assets/history.png'), alternatePng)
      const other = join(folder, '异专题.md')
      await writeFile(other, historyBank(true, false, false, 'history-b'))
      await importHistoryFiles(application, page, [file, other])
      await openPage(page, '设置与数据')
      await page.getByLabel('显示主题', { exact: true }).selectOption('dark')
      await page.getByLabel('正文字号', { exact: true }).selectOption('22')
      await page.getByRole('button', { name: '保存显示设置', exact: true }).click()
      await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
      const before = withHistoryDatabase(testDataDirectory, records)
      const appVersion = await application.evaluate(({ app }) => app.getVersion())
      expect(before['image_resources']).toHaveLength(2)
      expect(before['question_versions']!.length).toBeGreaterThan(3)
      const destination = join(directory, '中文 空格路径', '完整备份.sqlite3')
      await mkdir(dirname(destination))
      await select(application, 'export', destination)
      await page.getByRole('button', { name: '导出完整备份', exact: true }).click()
      await expect(page.getByText('完整备份已导出并校验。', { exact: true })).toBeVisible()
      expect(exportedRecords(destination)).toEqual(before)
      expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
      expect(await readdir(dirname(destination))).toEqual(['完整备份.sqlite3'])
      const db = new DatabaseSync(destination, { readOnly: true })
      try {
        expect(db.prepare('SELECT * FROM backup_manifest').get()).toMatchObject({
          format_version: 1,
          schema_version: 9,
          created_at: expect.stringMatching(/^2026-/),
          app_version: appVersion,
        })
      } finally {
        db.close()
      }
      const originalHash = createHash('sha256')
        .update(await readFile(destination))
        .digest('hex')
      await select(application, 'preview', destination)
      await page.getByRole('button', { name: '选择备份并预览', exact: true }).click()
      const preview = page.getByLabel('恢复预览摘要', { exact: true })
      await expect(preview).toBeVisible()
      await expect(preview).toContainText('题目总数')
      await expect(preview).toContainText('包含可继续的练习轮次及固定队列。')
      await expect(preview).not.toContainText('备份未揭晓草稿')
      expect(
        createHash('sha256')
          .update(await readFile(destination))
          .digest('hex'),
      ).toBe(originalHash)
      expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
      expect(await readdir(join(testDataDirectory, 'backup-staging'))).toEqual([
        expect.stringMatching(/^preview-/),
      ])
      expect(
        withHistoryDatabase(testDataDirectory, (db) =>
          db.prepare("SELECT name FROM sqlite_schema WHERE name='backup_manifest'").all(),
        ),
      ).toEqual([])
      await preview.evaluate((element) => element.scrollIntoView({ block: 'start' }))
      await captureHistory(application, page, info, 'backup-preview-dark-22.png')
      await info.attach('complete-backup-records.json', {
        body: JSON.stringify({ before, exported: exportedRecords(destination), originalHash }),
        contentType: 'application/json',
      })
      await openPage(page, '开始练习')
      await page.getByRole('button', { name: '继续练习', exact: true }).click()
      await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
        '备份未揭晓草稿\nint queued = 2;',
      )
    } finally {
      await stop(application)
    }
  })
})

test('备份取消与预览取消保留原状态，空库可导出并预览', async ({ testDataDirectory }, info) => {
  await outputDirectory(async (directory) => {
    const { application, page } = await launchApplication(
      testDataDirectory,
      info.project.name,
      '设置与数据',
    )
    try {
      const before = withHistoryDatabase(testDataDirectory, records)
      expect(
        await page.evaluate(() =>
          Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.backup).sort(),
        ),
      ).toEqual(['export', 'preview', 'restore'])
      for (const kind of ['export', 'preview'] as const) {
        await select(application, kind, null)
        await page
          .getByRole('button', {
            name: kind === 'export' ? '导出完整备份' : '选择备份并预览',
            exact: true,
          })
          .click()
        await expect(page.getByText('已取消本次备份操作。', { exact: true })).toBeVisible()
        expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
        expect(await readdir(directory)).toEqual([])
      }
      const file = await exportFile(application, page, join(directory, '空库.sqlite3'))
      expect(file.summary).toMatchObject({
        questions: 0,
        categories: 0,
        practicePlans: 0,
        images: 0,
        sessions: 0,
        activeSession: false,
        schemaVersion: 9,
        requiresMigration: false,
      })
      await select(application, 'preview', file.filePath)
      expect(await backup(page, 'preview')).toEqual({
        ok: true,
        value: {
          ...file,
          token: expect.stringMatching(
            /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/,
          ),
        },
      })
    } finally {
      await stop(application)
    }
  })
})

test('实际备份写入失败保留已有目标与当前数据，清理暂存后可重试', async ({
  testDataDirectory,
}, info) => {
  await outputDirectory(async (directory) => {
    const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
    try {
      const path = join(directory, '旧备份.sqlite3')
      await writeFile(path, 'PREVIOUS-BACKUP-MUST-SURVIVE')
      const before = withHistoryDatabase(testDataDirectory, records)
      await application.evaluate(({ app }) => {
        const path = process.getBuiltinModule('node:path')
        const load = process
          .getBuiltinModule('node:module')
          .createRequire(path.join(app.getAppPath(), 'backup-test.cjs'))
        const Database = load('better-sqlite3') as typeof import('better-sqlite3')
        const original = Database.prototype.backup
        Database.prototype.backup = function () {
          Database.prototype.backup = original
          return Promise.reject(new Error('INJECTED-BACKUP-WRITE-FAILURE'))
        }
      })
      await openPage(page, '设置与数据')
      await select(application, 'export', path)
      await page.getByRole('button', { name: '导出完整备份', exact: true }).click()
      await expect(page.getByRole('alert')).toContainText('备份导出失败')
      expect(await readFile(path, 'utf8')).toBe('PREVIOUS-BACKUP-MUST-SURVIVE')
      expect(await readdir(directory)).toEqual(['旧备份.sqlite3'])
      expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
      await page.getByRole('button', { name: '导出完整备份', exact: true }).click()
      await expect(page.getByText('完整备份已导出并校验。', { exact: true })).toBeVisible()
      expect(exportedRecords(path)).toEqual(before)
      await select(application, 'export', join(directory, '不存在', '备份.sqlite3'))
      expect(await backup(page, 'export')).toMatchObject({
        ok: false,
        error: { code: 'EXPORT_FAILED' },
      })
      expect(exportedRecords(path)).toEqual(before)
    } finally {
      await stop(application)
    }
  })
})

test('备份拒绝当前库伴随文件及目录链接硬链接别名，目标有旧 WAL 时不发布', async ({
  testDataDirectory,
}, info) => {
  await outputDirectory(async (directory) => {
    const { application, page } = await launchApplication(testDataDirectory, info.project.name)
    try {
      const database = join(testDataDirectory, 'practice.sqlite3')
      const hard = join(directory, '硬链接.sqlite3')
      await link(database, hard)
      const junction = join(directory, '数据目录链接')
      await symlink(testDataDirectory, junction, 'junction')
      const before = withHistoryDatabase(testDataDirectory, records)
      for (const target of [
        database,
        database + '-wal',
        join(junction, 'practice.sqlite3'),
        hard,
        directory,
      ]) {
        await select(application, 'export', target)
        expect(await backup(page, 'export')).toMatchObject({
          ok: false,
          error: { code: 'FILE_ERROR' },
        })
      }
      for (const target of [database, hard]) {
        await select(application, 'preview', target)
        expect(await backup(page, 'preview')).toMatchObject({
          ok: false,
          error: { code: 'FILE_ERROR' },
        })
      }
      const target = join(directory, '外部旧库.sqlite3')
      await writeFile(target, 'OLD-TARGET')
      await writeFile(target + '-wal', 'OLD-WAL')
      await select(application, 'export', target)
      expect(await backup(page, 'export')).toMatchObject({
        ok: false,
        error: { code: 'FILE_ERROR' },
      })
      expect(await readFile(target, 'utf8')).toBe('OLD-TARGET')
      expect(await readFile(target + '-wal', 'utf8')).toBe('OLD-WAL')
      expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
    } finally {
      await stop(application)
    }
  })
})

for (const fault of [
  'corrupt',
  'foreign-app',
  'future',
  'missing-table',
  'foreign-key',
  'metadata',
  'image-hash',
  'filters',
  'body-json',
  'palette',
  'category-title',
  'category-membership',
  'category-snapshot',
  'plan-options',
  'plan-name',
] as const) {
  test(`恢复预览拒绝 ${fault}，原备份字节及当前数据保持`, async ({ testDataDirectory }, info) => {
    await outputDirectory(async (directory) => {
      const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
      try {
        const valid = join(directory, '完整.sqlite3'),
          invalid = join(directory, '异常.sqlite3')
        await exportFile(application, page, valid)
        await copyFile(valid, invalid)
        if (fault === 'corrupt') await writeFile(invalid, 'not a SQLite backup')
        else {
          const db = new DatabaseSync(invalid)
          try {
            db.exec('PRAGMA foreign_keys=OFF')
            if (fault === 'foreign-app') db.exec('PRAGMA application_id=123')
            if (fault === 'future') db.exec('PRAGMA user_version=999')
            if (fault === 'missing-table') db.exec('DROP TABLE practice_receipts')
            if (fault === 'foreign-key')
              db.prepare('INSERT INTO version_images VALUES (999,?)').run('a'.repeat(64))
            if (fault === 'metadata') db.exec("UPDATE backup_manifest SET created_at='broken'")
            if (fault === 'image-hash')
              db.prepare('UPDATE image_resources SET bytes=?').run(alternatePng)
            if (fault === 'filters') db.exec("UPDATE practice_sessions SET filters_json='{}'")
            if (fault === 'body-json') db.exec("UPDATE question_versions SET definitions_json='{}'")
            if (fault === 'palette')
              db.exec(
                "PRAGMA ignore_check_constraints=ON; UPDATE appearance_settings SET palette='custom'",
              )
            if (fault === 'category-title')
              db.exec(
                "INSERT INTO categories(category_id,title) VALUES('invalid-category','未分类')",
              )
            if (fault === 'category-membership')
              db.exec("UPDATE topics SET category_id='missing-category'")
            if (fault === 'category-snapshot')
              db.prepare('UPDATE practice_sessions SET category_scope_json=?').run(
                JSON.stringify({ kind: 'category', categoryId: 'missing-title' }),
              )
            if (fault === 'plan-options' || fault === 'plan-name')
              db.prepare('INSERT INTO practice_plans(plan_id,name,options_json) VALUES(?,?,?)').run(
                randomUUID(),
                fault === 'plan-name' ? '坏\n方案' : '异常条件方案',
                fault === 'plan-options'
                  ? '{}'
                  : JSON.stringify({
                      category: { kind: 'all' },
                      topicId: null,
                      mode: 'random',
                      count: 20,
                      filters: { ...EMPTY_QUESTION_FILTERS },
                    }),
              )
          } finally {
            db.close()
          }
        }
        const original = await readFile(invalid)
        const before = withHistoryDatabase(testDataDirectory, records)
        await openPage(page, '设置与数据')
        await select(application, 'preview', invalid)
        const result = await backup(page, 'preview')
        expect(result).toMatchObject({
          ok: false,
          error: { code: fault === 'future' ? 'UNSUPPORTED_BACKUP' : 'INVALID_BACKUP' },
        })
        expect(await readFile(invalid)).toEqual(original)
        expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
        expect(await readdir(join(testDataDirectory, 'backup-staging'))).toEqual([])
        await select(application, 'preview', valid)
        await page.getByRole('button', { name: '选择备份并预览', exact: true }).click()
        await expect(page.getByLabel('恢复预览摘要', { exact: true })).toBeVisible()
        await info.attach('invalid-backup-result.json', {
          body: JSON.stringify({ fault, result }),
          contentType: 'application/json',
        })
      } finally {
        await stop(application)
      }
    })
  })
}

test('在途备份阻止重复操作和切页，正常退出等待已验证备份发布', async ({
  testDataDirectory,
}, info) => {
  await outputDirectory(async (directory) => {
    const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
    const path = join(directory, '退出前备份.sqlite3')
    try {
      await openPage(page, '设置与数据')
      const before = withHistoryDatabase(testDataDirectory, records)
      await application.evaluate(() => {
        const fs = process.getBuiltinModule('node:fs/promises')
        const original = fs.rename
        const state = globalThis as unknown as { publishStarted: boolean }
        fs.rename = async (...args: Parameters<typeof fs.rename>) => {
          fs.rename = original
          state.publishStarted = true
          await new Promise((resolve) => setTimeout(resolve, 750))
          return original(...args)
        }
      })
      await select(application, 'export', path)
      await page.getByRole('button', { name: '导出完整备份', exact: true }).click()
      await expect
        .poll(() =>
          application.evaluate(
            () => (globalThis as unknown as { publishStarted: boolean }).publishStarted,
          ),
        )
        .toBe(true)
      await expect(
        page.getByRole('button', { name: '正在导出完整备份…', exact: true }),
      ).toBeDisabled()
      await expect(page.getByRole('link', { name: '题库', exact: true })).toHaveAttribute(
        'aria-disabled',
        'true',
      )
      expect(await backup(page, 'preview')).toMatchObject({
        ok: false,
        error: { code: 'BACKUP_BUSY' },
      })
      const finished = application.waitForEvent('close')
      await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.close())
      await finished
      expect(exportedRecords(path)).toEqual(before)
      expect(
        (await readdir(directory)).filter((name) => name.startsWith('.embedded-practice-export-')),
      ).toEqual([])
    } finally {
      await stop(application)
    }
  })
})

test('发布失败保留既有备份，来源读取中变化时停止预览且清理副本', async ({
  testDataDirectory,
}, info) => {
  await outputDirectory(async (directory) => {
    const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
    try {
      const target = join(directory, '保留备份.sqlite3')
      await exportFile(application, page, target)
      const old = await readFile(target)
      const before = withHistoryDatabase(testDataDirectory, records)
      await application.evaluate(() => {
        const fs = process.getBuiltinModule('node:fs/promises'),
          original = fs.rename
        fs.rename = async () => {
          fs.rename = original
          throw new Error('INJECTED-PUBLISH-FAILURE')
        }
      })
      await select(application, 'export', target)
      expect(await backup(page, 'export')).toMatchObject({
        ok: false,
        error: { code: 'EXPORT_FAILED' },
      })
      expect(await readFile(target)).toEqual(old)
      expect(await readdir(directory)).toEqual(['保留备份.sqlite3'])
      await application.evaluate(() => {
        const fs = process.getBuiltinModule('node:fs/promises'),
          original = fs.copyFile
        fs.copyFile = async (...args: Parameters<typeof fs.copyFile>) => {
          fs.copyFile = original
          await original(...args)
          await fs.appendFile(args[0], 'EXTERNAL-CHANGE')
        }
      })
      await select(application, 'preview', target)
      expect(await backup(page, 'preview')).toMatchObject({
        ok: false,
        error: { code: 'FILE_ERROR' },
      })
      expect(await readFile(target)).toEqual(Buffer.concat([old, Buffer.from('EXTERNAL-CHANGE')]))
      expect(await readdir(join(testDataDirectory, 'backup-staging'))).toEqual([])
      expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
    } finally {
      await stop(application)
    }
  })
})

test('备份期间其他连接的事务写入保持一致性快照', async ({ testDataDirectory }, info) => {
  await outputDirectory(async (directory) => {
    const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
    try {
      const before = withHistoryDatabase(testDataDirectory, records)
      await application.evaluate(({ app }, directory) => {
        const path = process.getBuiltinModule('node:path')
        const load = process
          .getBuiltinModule('node:module')
          .createRequire(path.join(app.getAppPath(), 'backup-test.cjs'))
        const Database = load('better-sqlite3') as typeof import('better-sqlite3')
        const original = Database.prototype.backup
        Database.prototype.backup = function (destination, options) {
          Database.prototype.backup = original
          let changed = false
          const writer = new Database(path.join(directory, 'practice.sqlite3'))
          return original
            .call(this, destination, {
              ...options,
              progress: () => {
                if (!changed) {
                  changed = true
                  writer.transaction(() => {
                    writer.exec(
                      "UPDATE appearance_settings SET theme='dark',font_size=22; UPDATE library_meta SET revision=revision+1",
                    )
                  })()
                }
                return 100
              },
            })
            .finally(() => writer.close())
        }
      }, testDataDirectory)
      const file = await exportFile(application, page, join(directory, '并发一致性.sqlite3'))
      const after = withHistoryDatabase(testDataDirectory, records)
      expect(after['appearance_settings']).toEqual([
        { id: 1, theme: 'dark', font_size: 22, palette: 'forest' },
      ])
      const actual = exportedRecords(file.filePath)
      expect([JSON.stringify(before), JSON.stringify(after)]).toContain(JSON.stringify(actual))
      expect(after).not.toEqual(before)
      await info.attach('concurrent-backup-snapshot.json', {
        body: JSON.stringify({ before, after, actual }),
        contentType: 'application/json',
      })
    } finally {
      await stop(application)
    }
  })
})

test('导出保留未知自定义表，同名未知元数据表冲突时停止且保留旧目标', async ({
  testDataDirectory,
}, info) => {
  await outputDirectory(async (directory) => {
    const { application, page } = await launchApplication(testDataDirectory, info.project.name)
    try {
      withHistoryDatabase(
        testDataDirectory,
        (db) =>
          db.exec(
            "CREATE TABLE retained_extra(value TEXT); INSERT INTO retained_extra VALUES('RETAIN-EXTRA')",
          ),
        false,
      )
      const target = join(directory, '自定义表备份.sqlite3')
      await exportFile(application, page, target)
      const copy = new DatabaseSync(target, { readOnly: true })
      try {
        expect(copy.prepare('SELECT value FROM retained_extra').all()).toEqual([
          { value: 'RETAIN-EXTRA' },
        ])
      } finally {
        copy.close()
      }
      const old = await readFile(target)
      withHistoryDatabase(
        testDataDirectory,
        (db) =>
          db.exec(
            "CREATE TABLE backup_manifest(value TEXT); INSERT INTO backup_manifest VALUES('RETAIN-COLLISION')",
          ),
        false,
      )
      const before = withHistoryDatabase(testDataDirectory, records)
      await select(application, 'export', target)
      expect(await backup(page, 'export')).toMatchObject({
        ok: false,
        error: { code: 'INVALID_BACKUP' },
      })
      expect(await readFile(target)).toEqual(old)
      expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
      expect(
        withHistoryDatabase(testDataDirectory, (db) =>
          db.prepare('SELECT value FROM backup_manifest').all(),
        ),
      ).toEqual([{ value: 'RETAIN-COLLISION' }])
      expect(await readdir(directory)).toEqual(['自定义表备份.sqlite3'])
    } finally {
      await stop(application)
    }
  })
})
