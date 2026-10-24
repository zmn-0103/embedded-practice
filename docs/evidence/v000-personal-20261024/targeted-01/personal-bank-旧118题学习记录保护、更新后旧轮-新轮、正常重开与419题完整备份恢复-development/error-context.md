# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: personal-bank.spec.ts >> 旧118题学习记录保护、更新后旧轮/新轮、正常重开与419题完整备份恢复
- Location: tests\e2e\personal-bank.spec.ts:213:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "embedded-practice"
Received: "Electron"
```

# Test source

```ts
  1   | import { createHash } from 'node:crypto'
  2   | import { readFileSync } from 'node:fs'
  3   | import { join, resolve } from 'node:path'
  4   | import type { ElectronApplication, Page, TestInfo } from '@playwright/test'
  5   | import type { DesktopApi } from '../../src/shared/contracts/application'
  6   | import { expect, launchApplication, openPage, test } from './helpers'
  7   | import { addCategory, assignTopic, categoryList } from './category-helpers'
  8   | import { historySnapshot, importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
  9   | import { readPlans, savePlan } from './practice-plan-helpers'
  10  | 
  11  | const release = resolve('question-banks/releases/v000-20261024')
  12  | const before = resolve('docs/evidence/v000-personal-20261024/before')
  13  | const manifest = JSON.parse(readFileSync(join(release, '全量题库清单.json'), 'utf8')) as {
  14  |   files: {
  15  |     file: string
  16  |     topicId: string
  17  |     board: string
  18  |     count: number
  19  |     questions: {
  20  |       questionId: string
  21  |       questionSha256: string
  22  |       answerSha256: string
  23  |       difficulty: string
  24  |       tags: string[]
  25  |     }[]
  26  |   }[]
  27  | }
  28  | const files = manifest.files.map((file) => resolve(file.file))
  29  | const hash = (text: string) => createHash('sha256').update(text).digest('hex')
  30  | 
  31  | async function runtime(
  32  |   application: ElectronApplication,
  33  |   page: Page,
  34  |   directory: string,
  35  |   info: TestInfo,
  36  | ) {
  37  |   const actual = await application.evaluate(({ app }) => ({
  38  |     executable: process.execPath,
  39  |     appPath: app.getAppPath(),
  40  |     name: app.getName(),
  41  |     version: app.getVersion(),
  42  |     packaged: app.isPackaged,
  43  |     userData: app.getPath('userData'),
  44  |     electron: process.versions.electron,
  45  |   }))
  46  |   expect(actual.userData).toBe(directory)
  47  |   expect(actual.packaged).toBe(info.project.name === 'packaged')
> 48  |   expect(actual.name).toBe('embedded-practice')
      |                       ^ Error: expect(received).toBe(expected) // Object.is equality
  49  |   expect(actual.electron).toBe('42.11.15')
  50  |   expect(actual.version).toBe('0.0.0')
  51  |   if (actual.packaged)
  52  |     expect(resolve(actual.executable)).toBe(
  53  |       resolve(process.env['EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE']!),
  54  |     )
  55  |   else expect(resolve(actual.appPath)).toBe(resolve('out/main'))
  56  |   await expect(page.locator('footer span').last()).toHaveText(
  57  |     'V0.0.0 测试版 · 构建 20261024.4-v000',
  58  |   )
  59  |   expect(withHistoryDatabase(directory, (db) => db.prepare('PRAGMA user_version').get())).toEqual({
  60  |     user_version: 9,
  61  |   })
  62  |   await info.attach('runtime.json', {
  63  |     body: JSON.stringify(actual),
  64  |     contentType: 'application/json',
  65  |   })
  66  | }
  67  | async function importExact(
  68  |   application: ElectronApplication,
  69  |   page: Page,
  70  |   paths: string[],
  71  |   counts: string,
  72  | ) {
  73  |   await importHistoryFiles(application, page, paths)
  74  |   await expect(page.getByText(/^导入完成：/)).toHaveText(counts)
  75  | }
  76  | function verifyAll(directory: string) {
  77  |   const rows = withHistoryDatabase(directory, (db) => {
  78  |     expect(db.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }])
  79  |     expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  80  |     return db
  81  |       .prepare(
  82  |         `SELECT q.topic_id,q.question_id,q.difficulty,q.tags_json,
  83  |       v.question_markdown,v.answer_markdown FROM questions q
  84  |       JOIN question_versions v ON v.id=q.current_version_id WHERE q.archived=0`,
  85  |       )
  86  |       .all()
  87  |   }) as unknown as {
  88  |     topic_id: string
  89  |     question_id: string
  90  |     difficulty: string
  91  |     tags_json: string
  92  |     question_markdown: string
  93  |     answer_markdown: string
  94  |   }[]
  95  |   expect(rows).toHaveLength(419)
  96  |   for (const file of manifest.files)
  97  |     for (const q of file.questions) {
  98  |       const actual = rows.find(
  99  |         (row) => row.topic_id === file.topicId && row.question_id === q.questionId,
  100 |       )!
  101 |       expect(actual).toBeDefined()
  102 |       expect(hash(actual.question_markdown)).toBe(q.questionSha256)
  103 |       expect(hash(actual.answer_markdown)).toBe(q.answerSha256)
  104 |       expect(actual.difficulty).toBe(q.difficulty)
  105 |       expect(JSON.parse(actual.tags_json)).toEqual(q.tags)
  106 |     }
  107 | }
  108 | async function normalClose(application: ElectronApplication) {
  109 |   const closed = application.waitForEvent('close')
  110 |   await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.close())
  111 |   await closed
  112 | }
  113 | async function current(page: Page) {
  114 |   const result = await page.evaluate(() =>
  115 |     (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
  116 |   )
  117 |   if (!result.ok || !result.value) throw new Error('测试活动轮读取失败')
  118 |   return result.value
  119 | }
  120 | function completeState(directory: string) {
  121 |   return withHistoryDatabase(directory, (db) =>
  122 |     Object.fromEntries(
  123 |       [
  124 |         'library_meta',
  125 |         'categories',
  126 |         'practice_plans',
  127 |         'topics',
  128 |         'questions',
  129 |         'question_versions',
  130 |         'question_user_state',
  131 |         'import_receipts',
  132 |         'practice_sessions',
  133 |         'practice_items',
  134 |         'practice_receipts',
  135 |         'appearance_settings',
  136 |       ].map((table) => [table, db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()]),
  137 |     ),
  138 |   )
  139 | }
  140 | 
  141 | test('全量419题首次/重复导入、13专题归属、板块计数和三级难度筛选', async ({
  142 |   testDataDirectory,
  143 | }, info) => {
  144 |   test.setTimeout(120_000)
  145 |   const instance = await launchApplication(testDataDirectory, info.project.name, '题库')
  146 |   const { application, page } = instance
  147 |   try {
  148 |     await runtime(application, page, testDataDirectory, info)
```