import { copyFile, mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { ElectronApplication, Page } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, launchApplication, openPage, readAppStatus, test } from './helpers'
import { prepareHistory, stop, withHistoryDatabase } from './history-helpers'
import { openLibraryNote, prepareStudy } from './study-helpers'

async function choose(application: ElectronApplication, path: string, confirm = true) {
  await application.evaluate(
    ({ app, dialog }, { path, confirm }) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: path })
      dialog.showMessageBox = (async (...args: unknown[]) => {
        const options = args.at(-1) as { title: string }
        return {
          response: options.title === '确认恢复完整备份' && confirm ? 1 : 0,
          checkboxChecked: false,
        }
      }) as typeof dialog.showMessageBox
      // 验证退出后由测试显式重开；不让 relaunch 留下脱离测试管理的进程。
      app.relaunch = () => {}
    },
    { path, confirm },
  )
}
async function backup(page: Page, kind: 'export' | 'preview') {
  return page.evaluate(
    (kind) => (globalThis as unknown as { desktop: DesktopApi }).desktop.backup[kind](),
    kind,
  )
}

const invalidQueues = [
  {
    name: '活动轮越界',
    sql: "UPDATE practice_sessions SET status='active',ended_at=NULL,position=2 WHERE topic_id='history-a' AND status='finished'",
  },
  {
    name: '完成轮位置不等于题数',
    sql: "UPDATE practice_sessions SET position=0 WHERE status='finished'",
  },
  { name: '结束轮越界', sql: "UPDATE practice_sessions SET position=2 WHERE status='ended'" },
  {
    name: '队列空',
    sql: "DELETE FROM practice_items WHERE session_id IN (SELECT id FROM practice_sessions WHERE status='ended')",
  },
  { name: '队列有洞', sql: 'UPDATE practice_items SET position=3 WHERE position=1' },
  {
    name: '队列不从零开始',
    sql: "UPDATE practice_items SET position=position+10 WHERE session_id IN (SELECT id FROM practice_sessions WHERE status='ended')",
  },
]
for (const scenario of invalidQueues) {
  test(`备份拒绝${scenario.name}且原库与源备份不变`, async ({ testDataDirectory }, info) => {
    const { application, page } = await prepareHistory(testDataDirectory, info.project.name, 1)
    try {
      const path = join(testDataDirectory, 'backups', 'invalid.sqlite3')
      await mkdir(join(testDataDirectory, 'backups'))
      await choose(application, path)
      // export 不允许自选数据目录；用 SQLite 一致性导出到外部的同级测试文件。
      const external = testDataDirectory + '-backup.sqlite3'
      try {
        await choose(application, external)
        expect((await backup(page, 'export')).ok).toBe(true)
        await copyFile(external, path)
      } finally {
        await unlink(external)
      }
      const db = new DatabaseSync(path)
      try {
        db.exec(scenario.sql)
        expect(db.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }])
        expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
      } finally {
        db.close()
      }
      const original = withHistoryDatabase(testDataDirectory, (db) =>
        db.prepare('SELECT * FROM practice_sessions ORDER BY id').all(),
      )
      const bytes = await readFile(path)
      await choose(application, path)
      expect(await backup(page, 'preview')).toMatchObject({
        ok: false,
        error: { code: 'INVALID_BACKUP' },
      })
      expect(await readFile(path)).toEqual(bytes)
      expect(
        withHistoryDatabase(testDataDirectory, (db) =>
          db.prepare('SELECT * FROM practice_sessions ORDER BY id').all(),
        ),
      ).toEqual(original)
    } finally {
      await stop(application)
    }
  })
}

for (const kind of ['损坏', '更新版本', '空主库', '保护失败', '替换失败'] as const) {
  test(`仅恢复模式：${kind}保留现场并从健康备份恢复或安全停止`, async ({
    testDataDirectory,
  }, info) => {
    const healthy = await prepareHistory(testDataDirectory, info.project.name, 1)
    const path = testDataDirectory + '-healthy.sqlite3'
    let current = healthy.application
    try {
      await choose(current, path)
      expect((await backup(healthy.page, 'export')).ok).toBe(true)
      await stop(current)
      const databasePath = join(testDataDirectory, 'practice.sqlite3')
      if (kind === '更新版本') {
        const db = new DatabaseSync(databasePath)
        try {
          db.exec('PRAGMA user_version=999')
        } finally {
          db.close()
        }
      } else
        await writeFile(databasePath, kind === '空主库' ? '' : 'BROKEN-DATABASE-KEEP-EXACT-BYTES')
      await writeFile(databasePath + '-wal', 'BROKEN-WAL-KEEP')
      await writeFile(databasePath + '-shm', 'BROKEN-SHM-KEEP')
      const originals = await Promise.all(
        ['', '-wal', '-shm'].map((s) => readFile(databasePath + s)),
      )
      const launched = await launchApplication(testDataDirectory, info.project.name)
      current = launched.application
      expect((await readAppStatus(launched.page)).ok).toBe(false)
      await expect(
        launched.page.getByRole('button', { name: '选择备份并预览', exact: true }),
      ).toBeVisible()
      await choose(current, path, false)
      await launched.page.getByRole('button', { name: '选择备份并预览', exact: true }).click()
      await expect(
        launched.page.getByRole('heading', { name: '恢复预览', exact: true }),
      ).toBeVisible()
      await info.attach('recovery-preview.png', {
        body: await launched.page.screenshot(),
        contentType: 'image/png',
      })
      await launched.page.getByRole('button', { name: '恢复此备份…', exact: true }).click()
      await expect(launched.page.getByRole('status').filter({ hasText: '已取消' })).toBeVisible()
      expect(
        await Promise.all(['', '-wal', '-shm'].map((s) => readFile(databasePath + s))),
      ).toEqual(originals)
      await choose(current, path)
      if (kind === '保护失败') {
        await current.evaluate(() => {
          const fs = process.getBuiltinModule('node:fs/promises')
          const original = fs.copyFile
          fs.copyFile = (async (...args: Parameters<typeof fs.copyFile>) => {
            if (String(args[1]).includes('before-recovery-'))
              throw new Error('injected protection failure')
            return original(...args)
          }) as typeof fs.copyFile
        })
      }
      if (kind === '替换失败') {
        await current.evaluate(() => {
          const fs = process.getBuiltinModule('node:fs/promises')
          const original = fs.rename
          fs.rename = (async (...args: Parameters<typeof fs.rename>) => {
            if (
              String(args[0]).endsWith('candidate.sqlite3') &&
              String(args[1]).endsWith('practice.sqlite3')
            )
              throw new Error('injected replace failure')
            return original(...args)
          }) as typeof fs.rename
        })
      }
      const exited = kind === '保护失败' ? undefined : current.waitForEvent('close')
      await launched.page.getByRole('button', { name: '恢复此备份…', exact: true }).click()
      if (kind === '保护失败') {
        await expect(launched.page.locator('#backup-section [role=alert]')).toBeVisible()
        expect(current.process().exitCode).toBeNull()
      } else await exited
      if (kind === '保护失败' || kind === '替换失败') {
        expect(
          await Promise.all(['', '-wal', '-shm'].map((s) => readFile(databasePath + s))),
        ).toEqual(originals)
      } else {
        const directories = (await readdir(join(testDataDirectory, 'backups'))).filter((name) =>
          name.startsWith('before-recovery-'),
        )
        expect(directories).toHaveLength(1)
        const protection = join(testDataDirectory, 'backups', directories[0]!)
        expect(
          await Promise.all(
            ['', '-wal', '-shm'].map((s) => readFile(join(protection, 'practice.sqlite3' + s))),
          ),
        ).toEqual(originals)
        const reopened = await launchApplication(testDataDirectory, info.project.name)
        current = reopened.application
        expect((await readAppStatus(reopened.page)).ok).toBe(true)
        expect(
          withHistoryDatabase(testDataDirectory, (db) =>
            db.prepare('SELECT count(*) AS total FROM questions').get(),
          ),
        ).toEqual({ total: 3 })
      }
    } finally {
      await stop(current)
      await unlink(path)
    }
  })
}

test('主导航等待笔记保存，失败保留输入与位置，再次点击导航重试成功后切页', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareStudy(testDataDirectory, info)
  try {
    const note = await openLibraryNote(page)
    const input = note.getByRole('textbox', { name: '我的复习笔记', exact: true })
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER navigation_note_failure BEFORE INSERT ON personal_notes BEGIN SELECT RAISE(ABORT,'injected navigation note failure'); END",
        ),
      false,
    )
    await input.fill('导航必须先保存的输入')
    const link = page
      .getByRole('navigation', { name: '主要页面' })
      .getByRole('link', { name: '学习记录', exact: true })
    await link.click()
    await expect(note.getByRole('alert')).toBeVisible()
    await expect(input).toHaveValue('导航必须先保存的输入')
    await expect(page.locator('.app-shell')).toHaveAttribute('data-page', 'library')
    const scroll = await page.evaluate(() => Reflect.get(globalThis, 'scrollY'))
    await link.click()
    await expect(input).toHaveValue('导航必须先保存的输入')
    expect(await page.evaluate(() => Reflect.get(globalThis, 'scrollY'))).toBe(scroll)
    withHistoryDatabase(
      testDataDirectory,
      (db) => db.exec('DROP TRIGGER navigation_note_failure'),
      false,
    )
    await link.click()
    await expect(page.locator('.app-shell')).toHaveAttribute('data-page', 'records')
    expect(
      withHistoryDatabase(testDataDirectory, (db) =>
        db.prepare('SELECT text,revision FROM personal_notes').all(),
      ),
    ).toEqual([{ text: '导航必须先保存的输入', revision: 1 }])
    await openPage(page, '题库')
    await expect(input).toHaveValue('导航必须先保存的输入')
  } finally {
    await stop(application)
  }
})
