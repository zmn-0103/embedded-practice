# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: recovery-guards.spec.ts >> 备份拒绝活动轮越界且原库与源备份不变
- Location: tests\e2e\recovery-guards.spec.ts:56:7

# Error details

```
Error: expect(received).toMatchObject(expected)

- Expected  - 4
+ Received  + 1

  Object {
-   "error": Object {
-     "code": "INVALID_BACKUP",
-   },
-   "ok": false,
+   "ok": true,
  }
```

# Test source

```ts
  1   | import { copyFile, mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises'
  2   | import { join } from 'node:path'
  3   | import { DatabaseSync } from 'node:sqlite'
  4   | import type { ElectronApplication, Page } from '@playwright/test'
  5   | import type { DesktopApi } from '../../src/shared/contracts/application'
  6   | import { expect, launchApplication, openPage, readAppStatus, test } from './helpers'
  7   | import { prepareHistory, stop, withHistoryDatabase } from './history-helpers'
  8   | import { openLibraryNote, prepareStudy } from './study-helpers'
  9   | 
  10  | async function choose(application: ElectronApplication, path: string, confirm = true) {
  11  |   await application.evaluate(
  12  |     ({ app, dialog }, { path, confirm }) => {
  13  |       dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
  14  |       dialog.showSaveDialog = async () => ({ canceled: false, filePath: path })
  15  |       dialog.showMessageBox = (async (...args: unknown[]) => {
  16  |         const options = args.at(-1) as { title: string }
  17  |         return {
  18  |           response: options.title === '确认恢复完整备份' && confirm ? 1 : 0,
  19  |           checkboxChecked: false,
  20  |         }
  21  |       }) as typeof dialog.showMessageBox
  22  |       // 验证退出后由测试显式重开；不让 relaunch 留下脱离测试管理的进程。
  23  |       app.relaunch = () => {}
  24  |     },
  25  |     { path, confirm },
  26  |   )
  27  | }
  28  | async function backup(page: Page, kind: 'export' | 'preview') {
  29  |   return page.evaluate(
  30  |     (kind) => (globalThis as unknown as { desktop: DesktopApi }).desktop.backup[kind](),
  31  |     kind,
  32  |   )
  33  | }
  34  | 
  35  | const invalidQueues = [
  36  |   {
  37  |     name: '活动轮越界',
  38  |     sql: "UPDATE practice_sessions SET status='active',ended_at=NULL,position=2 WHERE topic_id='history-a' AND status='finished'",
  39  |   },
  40  |   {
  41  |     name: '完成轮位置不等于题数',
  42  |     sql: "UPDATE practice_sessions SET position=0 WHERE status='finished'",
  43  |   },
  44  |   { name: '结束轮越界', sql: "UPDATE practice_sessions SET position=2 WHERE status='ended'" },
  45  |   {
  46  |     name: '队列空',
  47  |     sql: "DELETE FROM practice_items WHERE session_id IN (SELECT id FROM practice_sessions WHERE status='ended')",
  48  |   },
  49  |   { name: '队列有洞', sql: 'UPDATE practice_items SET position=3 WHERE position=1' },
  50  |   {
  51  |     name: '队列不从零开始',
  52  |     sql: "UPDATE practice_items SET position=position+10 WHERE session_id IN (SELECT id FROM practice_sessions WHERE status='ended')",
  53  |   },
  54  | ]
  55  | for (const scenario of invalidQueues) {
  56  |   test(`备份拒绝${scenario.name}且原库与源备份不变`, async ({ testDataDirectory }, info) => {
  57  |     const { application, page } = await prepareHistory(testDataDirectory, info.project.name, 1)
  58  |     try {
  59  |       const path = join(testDataDirectory, 'backups', 'invalid.sqlite3')
  60  |       await mkdir(join(testDataDirectory, 'backups'))
  61  |       await choose(application, path)
  62  |       // export 不允许自选数据目录；用 SQLite 一致性导出到外部的同级测试文件。
  63  |       const external = testDataDirectory + '-backup.sqlite3'
  64  |       try {
  65  |         await choose(application, external)
  66  |         expect((await backup(page, 'export')).ok).toBe(true)
  67  |         await copyFile(external, path)
  68  |       } finally {
  69  |         await unlink(external)
  70  |       }
  71  |       const db = new DatabaseSync(path)
  72  |       try {
  73  |         db.exec(scenario.sql)
  74  |         expect(db.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }])
  75  |         expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  76  |       } finally {
  77  |         db.close()
  78  |       }
  79  |       const original = withHistoryDatabase(testDataDirectory, (db) =>
  80  |         db.prepare('SELECT * FROM practice_sessions ORDER BY id').all(),
  81  |       )
  82  |       const bytes = await readFile(path)
  83  |       await choose(application, path)
> 84  |       expect(await backup(page, 'preview')).toMatchObject({
      |                                             ^ Error: expect(received).toMatchObject(expected)
  85  |         ok: false,
  86  |         error: { code: 'INVALID_BACKUP' },
  87  |       })
  88  |       expect(await readFile(path)).toEqual(bytes)
  89  |       expect(
  90  |         withHistoryDatabase(testDataDirectory, (db) =>
  91  |           db.prepare('SELECT * FROM practice_sessions ORDER BY id').all(),
  92  |         ),
  93  |       ).toEqual(original)
  94  |     } finally {
  95  |       await stop(application)
  96  |     }
  97  |   })
  98  | }
  99  | 
  100 | for (const kind of ['损坏', '更新版本', '保护失败', '替换失败'] as const) {
  101 |   test(`仅恢复模式：${kind}保留现场并从健康备份恢复或安全停止`, async ({
  102 |     testDataDirectory,
  103 |   }, info) => {
  104 |     const healthy = await prepareHistory(testDataDirectory, info.project.name, 1)
  105 |     const path = testDataDirectory + '-healthy.sqlite3'
  106 |     let current = healthy.application
  107 |     try {
  108 |       await choose(current, path)
  109 |       expect((await backup(healthy.page, 'export')).ok).toBe(true)
  110 |       await stop(current)
  111 |       const databasePath = join(testDataDirectory, 'practice.sqlite3')
  112 |       if (kind === '更新版本') {
  113 |         const db = new DatabaseSync(databasePath)
  114 |         try {
  115 |           db.exec('PRAGMA user_version=999')
  116 |         } finally {
  117 |           db.close()
  118 |         }
  119 |       } else await writeFile(databasePath, 'BROKEN-DATABASE-KEEP-EXACT-BYTES')
  120 |       await writeFile(databasePath + '-wal', 'BROKEN-WAL-KEEP')
  121 |       await writeFile(databasePath + '-shm', 'BROKEN-SHM-KEEP')
  122 |       const originals = await Promise.all(
  123 |         ['', '-wal', '-shm'].map((s) => readFile(databasePath + s)),
  124 |       )
  125 |       const launched = await launchApplication(testDataDirectory, info.project.name)
  126 |       current = launched.application
  127 |       expect((await readAppStatus(launched.page)).ok).toBe(false)
  128 |       await expect(
  129 |         launched.page.getByRole('button', { name: '选择备份并预览', exact: true }),
  130 |       ).toBeVisible()
  131 |       await choose(current, path, false)
  132 |       await launched.page.getByRole('button', { name: '选择备份并预览', exact: true }).click()
  133 |       await expect(
  134 |         launched.page.getByRole('heading', { name: '恢复预览', exact: true }),
  135 |       ).toBeVisible()
  136 |       await info.attach('recovery-preview.png', {
  137 |         body: await launched.page.screenshot(),
  138 |         contentType: 'image/png',
  139 |       })
  140 |       await launched.page.getByRole('button', { name: '恢复此备份…', exact: true }).click()
  141 |       await expect(launched.page.getByRole('status').filter({ hasText: '已取消' })).toBeVisible()
  142 |       expect(
  143 |         await Promise.all(['', '-wal', '-shm'].map((s) => readFile(databasePath + s))),
  144 |       ).toEqual(originals)
  145 |       await choose(current, path)
  146 |       if (kind === '保护失败') {
  147 |         await current.evaluate(() => {
  148 |           const fs = process.getBuiltinModule('node:fs/promises')
  149 |           const original = fs.copyFile
  150 |           fs.copyFile = (async (...args: Parameters<typeof fs.copyFile>) => {
  151 |             if (String(args[1]).includes('before-recovery-'))
  152 |               throw new Error('injected protection failure')
  153 |             return original(...args)
  154 |           }) as typeof fs.copyFile
  155 |         })
  156 |       }
  157 |       if (kind === '替换失败') {
  158 |         await current.evaluate(() => {
  159 |           const fs = process.getBuiltinModule('node:fs/promises')
  160 |           const original = fs.rename
  161 |           fs.rename = (async (...args: Parameters<typeof fs.rename>) => {
  162 |             if (
  163 |               String(args[0]).endsWith('candidate.sqlite3') &&
  164 |               String(args[1]).endsWith('practice.sqlite3')
  165 |             )
  166 |               throw new Error('injected replace failure')
  167 |             return original(...args)
  168 |           }) as typeof fs.rename
  169 |         })
  170 |       }
  171 |       const exited = kind === '保护失败' ? undefined : current.waitForEvent('close')
  172 |       await launched.page.getByRole('button', { name: '恢复此备份…', exact: true }).click()
  173 |       if (kind === '保护失败') {
  174 |         await expect(launched.page.locator('#backup-section [role=alert]')).toBeVisible()
  175 |         expect(current.process().exitCode).toBeNull()
  176 |       } else await exited
  177 |       if (kind === '保护失败' || kind === '替换失败') {
  178 |         expect(
  179 |           await Promise.all(['', '-wal', '-shm'].map((s) => readFile(databasePath + s))),
  180 |         ).toEqual(originals)
  181 |       } else {
  182 |         const directories = (await readdir(join(testDataDirectory, 'backups'))).filter((name) =>
  183 |           name.startsWith('before-recovery-'),
  184 |         )
```