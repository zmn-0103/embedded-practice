import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { chromium, type Browser, type ElectronApplication, type Page } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import type { BackupPreview } from '../../src/shared/contracts/backup'
import type { PracticePlan } from '../../src/shared/contracts/practice-plans'
import { EMPTY_QUESTION_FILTERS } from '../../src/shared/contracts/question-filters'
import { expect, launchApplication, openPage, test } from './helpers'
import { addCategory, assignTopic, categoryChange, categoryList } from './category-helpers'
import {
  alternatePng,
  historyBank,
  importHistoryFiles,
  prepareHistory,
  stop,
  withHistoryDatabase,
} from './history-helpers'

const tables = [
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
  'installed_themes',
] as const
function records(db: DatabaseSync) {
  expect(db.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }])
  expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  return Object.fromEntries(
    tables.map((table) => [
      table,
      db
        .prepare(
          table === 'image_resources'
            ? 'SELECT hash,format,width,height,hex(bytes) AS bytes FROM image_resources ORDER BY hash'
            : `SELECT * FROM ${table} ORDER BY rowid`,
        )
        .all(),
    ]),
  )
}
function saved(path: string) {
  const db = new DatabaseSync(path, { readOnly: true })
  try {
    return records(db)
  } finally {
    db.close()
  }
}
async function temporary<T>(work: (root: string) => Promise<T>) {
  const root = await mkdtemp(join(tmpdir(), 'embedded-practice-restore-'))
  let completed = false
  try {
    const result = await work(root)
    completed = true
    return result
  } finally {
    if (
      dirname(resolve(root)) !== resolve(tmpdir()) ||
      !basename(root).startsWith('embedded-practice-restore-')
    )
      throw new Error('拒绝清理非本次恢复目录。')
    if (completed) await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
    else
      await test
        .info()
        .attach('failed-temporary-directory.txt', { body: root, contentType: 'text/plain' })
  }
}
async function choose(
  application: ElectronApplication,
  path: string,
  confirm = true,
  actualRestartPort?: number,
) {
  await application.evaluate(
    ({ app, dialog }, args) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: args.path })
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [args.path] })
      dialog.showMessageBox = (async (...input: unknown[]) => {
        const options = input[input.length - 1] as { title: string }
        Reflect.set(globalThis, 'restoreConfirmation', input[input.length - 1])
        return {
          response: options.title === '确认恢复完整备份' && args.confirm ? 1 : 0,
          checkboxChecked: false,
        }
      }) as typeof dialog.showMessageBox
      const original = (Reflect.get(globalThis, 'originalTestRelaunch') ??
        app.relaunch.bind(app)) as typeof app.relaunch
      Reflect.set(globalThis, 'originalTestRelaunch', original)
      app.relaunch = (options) => {
        process
          .getBuiltinModule('node:fs')
          .writeFileSync(
            process
              .getBuiltinModule('node:path')
              .join(app.getPath('userData'), 'test-relaunch.json'),
            JSON.stringify(options),
          )
        if (args.port !== undefined)
          original({
            ...options,
            args: [...(options?.args ?? []), `--remote-debugging-port=${args.port}`],
          })
      }
    },
    { path, confirm, port: actualRestartPort },
  )
}
async function exportBackup(application: ElectronApplication, page: Page, path: string) {
  await choose(application, path)
  const result = await page.evaluate(() =>
    (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.export(),
  )
  expect(result.ok).toBe(true)
  if (!result.ok) throw new Error(result.error.code)
  return result.value
}
async function preview(
  application: ElectronApplication,
  page: Page,
  path: string,
): Promise<BackupPreview> {
  await choose(application, path)
  const result = await page.evaluate(() =>
    (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
  )
  expect(result.ok).toBe(true)
  if (!result.ok) throw new Error(result.error.code)
  return result.value
}
async function restore(page: Page, token: string) {
  return page.evaluate(
    (token) => (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.restore({ token }),
    token,
  )
}
async function fault(application: ElectronApplication, kind: string) {
  await application.evaluate(({ app, ipcMain }, kind) => {
    const path = process.getBuiltinModule('node:path')
    const load = process
      .getBuiltinModule('node:module')
      .createRequire(path.join(app.getAppPath(), 'restore-test.cjs'))
    const fs = process.getBuiltinModule('node:fs/promises')
    const database = path.join(app.getPath('userData'), 'practice.sqlite3')
    if (kind === 'protect' || kind === 'close') {
      const Database = load('better-sqlite3') as typeof import('better-sqlite3')
      if (kind === 'protect') {
        const original = Database.prototype.backup
        Database.prototype.backup = function () {
          Database.prototype.backup = original
          throw new Error('测试磁盘写入失败')
        }
      } else {
        const original = Database.prototype.close
        Database.prototype.close = function () {
          if (this.name === database && this.readonly) {
            Database.prototype.close = original
            throw new Error('测试连接未关闭')
          }
          return original.call(this)
        }
      }
    } else if (kind === 'save') {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('practice:finish-close')
      ipcMain.removeHandler('practice:finish-close')
      ipcMain.handle('practice:finish-close', (event, input) =>
        original(event, { ...input, saved: false }),
      )
    } else {
      const original = fs.rename
      fs.rename = async (...args: Parameters<typeof fs.rename>) => {
        const source = String(args[0]),
          destination = String(args[1])
        const pending = path.join(app.getPath('userData'), 'restore-transaction')
        const publish =
          source === path.join(pending, 'candidate.sqlite3') && destination === database
        const moveOriginal =
          source === database && destination === path.join(pending, 'original.sqlite3')
        const commit =
          source === path.join(pending, 'record.next') &&
          destination === path.join(pending, 'record.json') &&
          (await fs.readFile(source, 'utf8')).includes('committed')
        if ((kind === 'publish' || kind === 'rollback') && publish) {
          if (kind === 'publish') fs.rename = original
          throw new Error('测试发布失败')
        }
        if (
          kind === 'rollback' &&
          source === path.join(pending, 'original.sqlite3') &&
          destination === database
        )
          throw new Error('测试自动回退失败')
        if (
          (kind === 'crash-moved' && moveOriginal) ||
          (kind === 'crash-installed' && publish) ||
          (kind === 'crash-committed' && commit)
        ) {
          await original(...args)
          app.exit(77)
          return
        }
        return original(...args)
      }
    }
  }, kind)
}

test('全新目录从完整预览副本恢复全部业务数据并真实自动重启，源文件变化不影响确认内容', async ({
  testDataDirectory,
}, info) => {
  test.setTimeout(60_000)
  await temporary(async (root) => {
    const source = await prepareHistory(testDataDirectory, info.project.name, 2)
    const path = join(root, '中文 空格备份.sqlite3')
    let target: Awaited<ReturnType<typeof launchApplication>> | undefined
    let restarted: Browser | undefined
    try {
      await openPage(source.page, '题库')
      const categoryId = await addCategory(source.page, '恢复时的板块')
      const otherCategoryId = await addCategory(source.page, '另一恢复板块')
      await assignTopic(source.page, 'history-a', categoryId)
      await assignTopic(source.page, 'history-b', otherCategoryId)
      const savedPlan: PracticePlan = {
        planId: randomUUID(),
        name: '恢复后的分类随机方案',
        options: {
          category: { kind: 'category', categoryId },
          topicId: 'history-a',
          mode: 'random',
          count: 'all',
          filters: { ...EMPTY_QUESTION_FILTERS, tag: '历史样本' },
        },
      }
      expect(
        await source.page.evaluate(
          (plan) =>
            (globalThis as unknown as { desktop: DesktopApi }).desktop.practicePlans.change({
              kind: 'save',
              ...plan,
            }),
          savedPlan,
        ),
      ).toEqual({ ok: true, value: null })
      await openPage(source.page, '开始练习')
      await source.page.getByText('按分类选择专题', { exact: true }).click()
      await source.page.getByRole('button', { name: '练习分类：恢复时的板块', exact: true }).click()
      await source.page.getByLabel('练习模式', { exact: true }).selectOption('random')
      await source.page.getByLabel('练习专题', { exact: true }).selectOption('history-a')
      await source.page.getByText('筛选练习题目', { exact: true }).click()
      await source.page.getByLabel('练习标签', { exact: true }).fill('历史样本')
      await expect(source.page.getByText('匹配 2 题', { exact: true })).toBeVisible()
      await source.page.getByRole('button', { name: '开始练习', exact: true }).click()
      await source.page
        .getByRole('textbox', { name: '我的答案', exact: true })
        .fill('恢复第一题\nint a = 1;')
      await source.page.getByRole('button', { name: '查看参考答案', exact: true }).click()
      await source.page.getByRole('button', { name: '掌握', exact: true }).click()
      await expect(source.page.getByLabel('练习进度')).toContainText('第 2 / 2')
      await source.page
        .getByRole('textbox', { name: '我的答案', exact: true })
        .fill('恢复未揭晓草稿\nint keep = 2;')
      await source.page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
      await categoryChange(source.page, {
        kind: 'rename',
        categoryId,
        title: '恢复板块新名称',
      })
      await writeFile(source.file, historyBank(true, false, true))
      await writeFile(join(source.folder, 'assets/history.png'), alternatePng)
      await writeFile(
        join(source.folder, '异专题.md'),
        historyBank(true, false, false, 'history-b'),
      )
      await importHistoryFiles(source.application, source.page, [
        source.file,
        join(source.folder, '异专题.md'),
      ])
      await source.page.evaluate(async () => {
        const api = (globalThis as unknown as { desktop: DesktopApi }).desktop
        if (
          !(
            await api.library.setFavorite({
              topicId: 'history-a',
              questionId: 'q-2',
              favorite: true,
            })
          ).ok
        )
          throw new Error('收藏失败')
        if (!(await api.settings.save({ theme: 'dark', palette: 'ocean', fontSize: 22 })).ok)
          throw new Error('显示保存失败')
      })
      const expected = withHistoryDatabase(testDataDirectory, records)
      const exported = await exportBackup(source.application, source.page, path)
      expect(exported.summary.categories).toBe(2)
      expect(exported.summary.practicePlans).toBe(1)
      expect(saved(path)).toEqual(expected)
      await stop(source.application)
      const targetDirectory = join(root, '全新 数据目录')
      await mkdir(targetDirectory)
      target = await launchApplication(targetDirectory, info.project.name, '设置与数据')
      const empty = saved(join(targetDirectory, 'practice.sqlite3'))
      await choose(target.application, path)
      await target.page.getByRole('button', { name: '选择备份并预览', exact: true }).click()
      await expect(target.page.getByLabel('恢复预览摘要', { exact: true })).toBeVisible()
      await expect(
        target.page.getByRole('button', { name: '恢复此备份…', exact: true }),
      ).toBeEnabled()
      const server = createServer()
      await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
      const address = server.address()
      if (!address || typeof address === 'string') throw new Error('未分配调试端口')
      await new Promise<void>((done) => server.close(() => done()))
      await choose(target.application, path, true, address.port)
      await writeFile(path, '预览后源文件被其他程序替换；恢复须使用暂存副本')
      const exited = target.application.waitForEvent('close')
      await target.page.getByRole('button', { name: '恢复此备份…', exact: true }).click()
      await exited
      await info.attach('restart-request.json', {
        body: JSON.stringify({
          targetDirectory,
          request: JSON.parse(await readFile(join(targetDirectory, 'test-relaunch.json'), 'utf8')),
          port: address.port,
        }),
        contentType: 'application/json',
      })
      await expect
        .poll(
          async () => {
            try {
              restarted = await chromium.connectOverCDP(`http://127.0.0.1:${address.port}`, {
                timeout: 1000,
              })
              return true
            } catch {
              return false
            }
          },
          { timeout: 15_000 },
        )
        .toBe(true)
      const newPage = restarted!
        .contexts()[0]!
        .pages()
        .find((p) => p.url().includes('index.html'))!
      await expect(
        newPage.getByRole('heading', { name: '嵌入式刷题本', exact: true }),
      ).toBeVisible()
      expect(saved(join(targetDirectory, 'practice.sqlite3'))).toEqual(expected)
      expect(
        await newPage.evaluate(() =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.practicePlans.list(),
        ),
      ).toEqual({ ok: true, value: [savedPlan] })
      expect((await categoryList(newPage)).categories).toEqual(
        expect.arrayContaining([
          { categoryId, title: '恢复板块新名称' },
          { categoryId: otherCategoryId, title: '另一恢复板块' },
        ]),
      )
      expect(
        await newPage.evaluate(() =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({
            sessionId: null,
          }),
        ),
      ).toMatchObject({
        ok: true,
        value: { session: { category: { kind: 'category', categoryId, title: '恢复时的板块' } } },
      })
      const protections = (await readdir(join(targetDirectory, 'backups'))).filter((name) =>
        name.startsWith('before-restore-'),
      )
      expect(protections).toHaveLength(1)
      expect(saved(join(targetDirectory, 'backups', protections[0]!))).toEqual(empty)
      expect(await readdir(targetDirectory)).not.toContain('restore-transaction')
      await expect(newPage.locator('html')).toHaveAttribute('data-theme', 'dark')
      await expect(newPage.locator('html')).toHaveAttribute('data-palette', 'ocean')
      await expect(newPage.locator('html')).toHaveAttribute('data-font-size', '22')
      await openPage(newPage, '开始练习')
      await newPage.getByRole('button', { name: '继续练习', exact: true }).click()
      await expect(newPage.getByLabel('练习进度')).toHaveText('第 2 / 2 题 · 随机练习')
      await expect(newPage.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
        '恢复未揭晓草稿\nint keep = 2;',
      )
      await expect(newPage.locator('body')).not.toContainText('HISTORY-ANSWER')
      const restartArgs = JSON.parse(
        await readFile(join(targetDirectory, 'test-relaunch.json'), 'utf8'),
      )
      expect(
        restartArgs.args.every((arg: string) => !/^--(?:inspect|remote-debugging)/.test(arg)),
      ).toBe(true)
      await info.attach('restored-business-and-protection.json', {
        body: JSON.stringify({ expected, protections, restartArgs }),
        contentType: 'application/json',
      })
      await info.attach('restored-desktop.png', {
        body: await newPage.screenshot(),
        contentType: 'image/png',
      })
      await newPage.close()
      await restarted!.close()
      restarted = undefined
    } finally {
      if (restarted) {
        for (const page of restarted.contexts().flatMap((context) => context.pages()))
          await page.close().catch(() => {})
        await restarted.close().catch(() => {})
      }
      if (target) await stop(target.application)
      await stop(source.application)
    }
  })
})

for (const kind of ['protect', 'save', 'tampered', 'cancel'] as const) {
  test(`恢复准备 ${kind} 时不替换原库，窗口仍可继续保存`, async ({ testDataDirectory }, info) => {
    await temporary(async (root) => {
      const { application, page } = await prepareHistory(testDataDirectory, info.project.name, 1)
      try {
        const path = join(root, '准备 失败.sqlite3')
        await exportBackup(application, page, path)
        const selected = await preview(application, page, path)
        const before = withHistoryDatabase(testDataDirectory, records)
        if (kind === 'cancel') await choose(application, path, false)
        else if (kind === 'tampered') {
          const [folder] = await readdir(join(testDataDirectory, 'backup-staging'))
          await writeFile(
            join(testDataDirectory, 'backup-staging', folder!, 'backup.sqlite3'),
            '坏副本',
          )
        } else await fault(application, kind)
        const result = await restore(page, selected.token)
        expect(result).toMatchObject({
          ok: false,
          error: {
            code: {
              protect: 'RESTORE_FAILED',
              save: 'SAVE_FAILED',
              tampered: 'PREVIEW_EXPIRED',
              cancel: 'CANCELLED',
            }[kind],
          },
        })
        expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
        expect(await readdir(testDataDirectory)).not.toContain('restore-transaction')
        expect(await readdir(testDataDirectory)).not.toContain('test-relaunch.json')
        const backups = await readdir(join(testDataDirectory, 'backups')).catch(() => [])
        expect(backups.filter((name) => name.startsWith('before-restore-'))).toEqual([])
        await openPage(page, '开始练习')
        await page.getByLabel('练习专题', { exact: true }).selectOption('history-a')
        await page.getByRole('button', { name: '开始练习', exact: true }).click()
        await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toBeEditable()
        await page.getByRole('textbox', { name: '我的答案', exact: true }).fill('失败后仍可保存')
        await expect(page.getByText('已保存', { exact: true })).toBeVisible()
        expect(
          withHistoryDatabase(testDataDirectory, (db) =>
            db.prepare("SELECT draft FROM practice_items WHERE draft='失败后仍可保存'").all(),
          ),
        ).toHaveLength(1)
        await info.attach('preparation-failure.json', {
          body: JSON.stringify({ kind, result }),
          contentType: 'application/json',
        })
      } finally {
        await stop(application)
      }
    })
  })
}

for (const kind of [
  'publish',
  'close',
  'rollback',
  'crash-moved',
  'crash-installed',
  'crash-committed',
] as const) {
  test(`恢复 ${kind} 后独立进程保留可恢复数据且不创建空库`, async ({ testDataDirectory }, info) => {
    await temporary(async (root) => {
      const { application, page } = await prepareHistory(testDataDirectory, info.project.name, 1)
      let reopened: ElectronApplication | undefined
      try {
        const path = join(root, '恢复故障.sqlite3')
        await exportBackup(application, page, path)
        const restored = saved(path)
        const changed = await page.evaluate(() =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.settings.save({
            theme: 'dark',
            palette: 'forest',
            fontSize: 21,
          }),
        )
        expect(changed.ok).toBe(true)
        const before = withHistoryDatabase(testDataDirectory, records)
        const selected = await preview(application, page, path)
        await fault(application, kind)
        const exited = application.waitForEvent('close')
        const result = await restore(page, selected.token).catch(() => null)
        await exited
        if (kind === 'publish' || kind === 'close')
          expect(result).toMatchObject({ ok: false, error: { code: 'RESTORE_FAILED' } })
        if (kind === 'rollback')
          expect(result).toMatchObject({ ok: false, error: { code: 'RECOVERY_FAILED' } })
        if (kind.startsWith('crash'))
          expect(await readdir(testDataDirectory)).toContain('restore-transaction')
        const protections = (await readdir(join(testDataDirectory, 'backups'))).filter((name) =>
          name.startsWith('before-restore-'),
        )
        expect(protections).toHaveLength(1)
        expect(saved(join(testDataDirectory, 'backups', protections[0]!))).toEqual(before)
        const launched = await launchApplication(testDataDirectory, info.project.name)
        reopened = launched.application
        expect(withHistoryDatabase(testDataDirectory, records)).toEqual(
          kind === 'crash-committed' ? restored : before,
        )
        expect(await readdir(testDataDirectory)).not.toContain('restore-transaction')
        await expect(launched.page.getByLabel('练习专题', { exact: true })).toContainText(
          '历史专题 A',
        )
        await info.attach('replacement-failure.json', {
          body: JSON.stringify({
            kind,
            result,
            protections,
            recovered: withHistoryDatabase(testDataDirectory, records),
          }),
          contentType: 'application/json',
        })
      } finally {
        if (reopened) await stop(reopened)
        await stop(application)
      }
    })
  })
}

test('恢复文件事务保留并回退全部数据库伴随文件，未知事务现场不清理', async ({
  testDataDirectory,
}, info) => {
  await temporary(async (root) => {
    const { application, page } = await launchApplication(testDataDirectory, info.project.name)
    try {
      const path = join(root, '独立.sqlite3')
      await exportBackup(application, page, path)
      const target = join(root, '事务测试')
      await mkdir(target)
      await copyFile(path, join(target, 'practice.sqlite3'))
      for (const suffix of ['-wal', '-shm', '-journal'])
        await writeFile(join(target, 'practice.sqlite3' + suffix), `synthetic-companion${suffix}`)
      const before = await Promise.all(
        ['', '-wal', '-shm', '-journal'].map((suffix) =>
          readFile(join(target, 'practice.sqlite3' + suffix)),
        ),
      )
      const result = await application.evaluate(
        async ({ app }, input) => {
          const p = process.getBuiltinModule('node:path'),
            fs = process.getBuiltinModule('node:fs/promises')
          const load = process
            .getBuiltinModule('node:module')
            .createRequire(p.join(app.getAppPath(), 'restore-files-test.cjs'))
          const entry = [
            p.join(app.getAppPath(), 'out/main/restore-files.js'),
            p.join(app.getAppPath(), 'restore-files.js'),
          ].find((path) => process.getBuiltinModule('node:fs').existsSync(path))!
          const built = load(entry) as typeof import('../../src/main/services/backup/restore-files')
          const original = fs.rename
          fs.rename = async (...args: Parameters<typeof fs.rename>) => {
            if (String(args[0]).endsWith('candidate.sqlite3')) {
              fs.rename = original
              throw new Error('测试失败')
            }
            return original(...args)
          }
          try {
            await built.replaceDatabase(
              p.join(input.target, 'practice.sqlite3'),
              input.path,
              await built.hashBackupFile(input.path),
              () => {},
            )
            return 'unexpected'
          } catch (error) {
            return (error as { code?: string }).code
          } finally {
            fs.rename = original
          }
        },
        { path, target },
      )
      expect(result).toBe('RESTORE_FAILED')
      expect(
        await Promise.all(
          ['', '-wal', '-shm', '-journal'].map((suffix) =>
            readFile(join(target, 'practice.sqlite3' + suffix)),
          ),
        ),
      ).toEqual(before)
      expect(await readdir(target)).not.toContain('restore-transaction')
      await mkdir(join(target, 'restore-transaction'))
      await writeFile(join(target, 'restore-transaction', 'unknown.txt'), '保留现场')
      const unknown = await application.evaluate(async ({ app }, target) => {
        const p = process.getBuiltinModule('node:path'),
          load = process
            .getBuiltinModule('node:module')
            .createRequire(p.join(app.getAppPath(), 'restore-check.cjs'))
        const entry = [
          p.join(app.getAppPath(), 'out/main/restore-files.js'),
          p.join(app.getAppPath(), 'restore-files.js'),
        ].find((path) => process.getBuiltinModule('node:fs').existsSync(path))!
        try {
          await (
            load(entry) as typeof import('../../src/main/services/backup/restore-files')
          ).recoverDatabaseReplacement(p.join(target, 'practice.sqlite3'))
          return false
        } catch {
          return true
        }
      }, target)
      expect(unknown).toBe(true)
      expect(await readFile(join(target, 'restore-transaction', 'unknown.txt'), 'utf8')).toBe(
        '保留现场',
      )
    } finally {
      await stop(application)
    }
  })
})

test('恢复前提交未到自动保存时间的草稿，保护备份包括最终输入且暂停期间拒绝业务写入', async ({
  testDataDirectory,
}, info) => {
  await temporary(async (root) => {
    const { application, page } = await prepareHistory(testDataDirectory, info.project.name, 1)
    try {
      const path = join(root, '保存握手.sqlite3')
      await exportBackup(application, page, path)
      const expected = saved(path)
      const selected = await preview(application, page, path)
      await openPage(page, '开始练习')
      await page.getByLabel('练习专题', { exact: true }).selectOption('history-a')
      await page.getByRole('button', { name: '开始练习', exact: true }).click()
      await application.evaluate(({ app }) => {
        const p = process.getBuiltinModule('node:path')
        const load = process
          .getBuiltinModule('node:module')
          .createRequire(p.join(app.getAppPath(), 'restore-pause-test.cjs'))
        const Database = load('better-sqlite3') as typeof import('better-sqlite3')
        const original = Database.prototype.backup
        Database.prototype.backup = async function (...args: Parameters<typeof original>) {
          Database.prototype.backup = original
          Reflect.set(globalThis, 'protectionStarted', true)
          const result = await original.apply(this, args)
          await new Promise<void>((done) => setTimeout(done, 750))
          return result
        }
      })
      await page
        .getByRole('textbox', { name: '我的答案', exact: true })
        .fill('输入后立刻恢复\n中文保存握手')
      const exited = application.waitForEvent('close')
      const restoring = restore(page, selected.token)
      await expect
        .poll(() => application.evaluate(() => Reflect.get(globalThis, 'protectionStarted')))
        .toBe(true)
      const protectedState = withHistoryDatabase(testDataDirectory, records)
      expect(protectedState['practice_items']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ draft: '输入后立刻恢复\n中文保存握手' }),
        ]),
      )
      const blocked = await page.evaluate(async () => {
        const api = (globalThis as unknown as { desktop: DesktopApi }).desktop
        return [
          await api.settings.save({ theme: 'light', palette: 'forest', fontSize: 15 }),
          await api.library.setFavorite({
            topicId: 'history-a',
            questionId: 'q-1',
            favorite: true,
          }),
          await api.practice.start({
            requestId: crypto.randomUUID(),
            topicId: null,
            mode: 'random',
            count: 20,
            replace: null,
          }),
          await api.backup.restore({ token: '93dc94ba-210c-4e71-97f3-6b7251ca655a' }),
        ]
      })
      expect(blocked).toMatchObject([
        { error: { code: 'SERVICE_CLOSED' } },
        { error: { code: 'SERVICE_CLOSED' } },
        { error: { code: 'SERVICE_CLOSED' } },
        { error: { code: 'BACKUP_BUSY' } },
      ])
      expect(await restoring).toMatchObject({ ok: true })
      await exited
      expect(saved(join(testDataDirectory, 'practice.sqlite3'))).toEqual(expected)
      const protection = (await readdir(join(testDataDirectory, 'backups'))).filter((name) =>
        name.startsWith('before-restore-'),
      )
      expect(protection).toHaveLength(1)
      expect(saved(join(testDataDirectory, 'backups', protection[0]!))).toEqual(protectedState)
      await info.attach('restore-save-and-pause.json', {
        body: JSON.stringify({ blocked, protectedState }),
        contentType: 'application/json',
      })
    } finally {
      await stop(application)
    }
  })
})

test('保护性备份可直接从本数据目录选择并恢复，来源文件不被覆盖', async ({
  testDataDirectory,
}, info) => {
  await temporary(async (root) => {
    const initial = await prepareHistory(testDataDirectory, info.project.name, 1)
    let reopened: ElectronApplication | undefined
    try {
      const path = join(root, '首次恢复.sqlite3')
      await exportBackup(initial.application, initial.page, path)
      expect(
        (
          await initial.page.evaluate(() =>
            (globalThis as unknown as { desktop: DesktopApi }).desktop.settings.save({
              theme: 'dark',
              palette: 'forest',
              fontSize: 21,
            }),
          )
        ).ok,
      ).toBe(true)
      const expected = withHistoryDatabase(testDataDirectory, records)
      const selected = await preview(initial.application, initial.page, path)
      let exited = initial.application.waitForEvent('close')
      const first = await restore(initial.page, selected.token)
      expect(first.ok).toBe(true)
      if (!first.ok) throw new Error(first.error.code)
      await exited
      const bytes = await readFile(first.value.protectionPath)
      expect(saved(first.value.protectionPath)).toEqual(expected)
      const launched = await launchApplication(testDataDirectory, info.project.name, '设置与数据')
      reopened = launched.application
      const protection = await preview(reopened, launched.page, first.value.protectionPath)
      expect(protection.summary.schemaVersion).toBe(10)
      exited = reopened.waitForEvent('close')
      const second = await restore(launched.page, protection.token)
      expect(second.ok).toBe(true)
      if (!second.ok) throw new Error(second.error.code)
      await exited
      expect(second.value.protectionPath).not.toBe(first.value.protectionPath)
      expect(saved(join(testDataDirectory, 'practice.sqlite3'))).toEqual(expected)
      expect(await readFile(first.value.protectionPath)).toEqual(bytes)
      const final = await launchApplication(testDataDirectory, info.project.name, '设置与数据')
      reopened = final.application
      await expect(final.page.getByLabel('显示主题', { exact: true })).toHaveValue('dark')
      await expect(final.page.getByLabel('正文字号', { exact: true })).toHaveValue('21')
      await info.attach('protective-backup-restored.json', {
        body: JSON.stringify({ first, second, expected }),
        contentType: 'application/json',
      })
    } finally {
      if (reopened) await stop(reopened)
      await stop(initial.application)
    }
  })
})
