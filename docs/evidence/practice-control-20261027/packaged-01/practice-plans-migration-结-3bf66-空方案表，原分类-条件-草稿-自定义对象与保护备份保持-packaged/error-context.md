# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: practice-plans-migration.spec.ts >> 结构8方案升级：只追加空方案表，原分类/条件/草稿/自定义对象与保护备份保持
- Location: tests\e2e\practice-plans-migration.spec.ts:59:5

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 0
+ Received  + 3

@@ -56,19 +56,22 @@
        "mode": "random",
        "position": 0,
        "repeat_selection": null,
        "repeat_source_id": null,
        "revision": 0,
+       "selection_name": null,
        "status": "active",
        "topic_id": "old-topic",
      },
    ],
    "private_notes": Array [
      Object {
        "note": "原自定义数据",
      },
    ],
+   "question_set_items": Array [],
+   "question_sets": Array [],
    "question_user_state": Array [
      Object {
        "favorite": 1,
        "last_rated_version_id": null,
        "last_rating": null,
```

# Test source

```ts
  1   | import { createHash, randomUUID } from 'node:crypto'
  2   | import { readFile, readdir, writeFile } from 'node:fs/promises'
  3   | import { join } from 'node:path'
  4   | import { DatabaseSync } from 'node:sqlite'
  5   | import type { DesktopApi } from '../../src/shared/contracts/application'
  6   | import { EMPTY_QUESTION_FILTERS } from '../../src/shared/contracts/question-filters'
  7   | import { expect, launchApplication, test } from './helpers'
  8   | import { stop, withHistoryDatabase } from './history-helpers'
  9   | 
  10  | function records(db: DatabaseSync) {
  11  |   const tables = db
  12  |     .prepare(
  13  |       "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT GLOB 'sqlite_*' AND name<>'app_startup' ORDER BY name",
  14  |     )
  15  |     .all() as { name: string }[]
  16  |   return Object.fromEntries(
  17  |     tables.map(({ name }) => [
  18  |       name,
  19  |       db.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}" ORDER BY rowid`).all(),
  20  |     ]),
  21  |   )
  22  | }
  23  | async function legacy(directory: string) {
  24  |   const sql = await readFile('tests/fixtures/schema-v8.sql', 'utf8')
  25  |   expect(createHash('sha256').update(sql).digest('hex')).toBe(
  26  |     'e63ccbb03c6b1a0bd7c9570670f53a3787998aaf6274e619531a0bdba9b7f5bf',
  27  |   )
  28  |   const db = new DatabaseSync(join(directory, 'practice.sqlite3')),
  29  |     sessionId = randomUUID()
  30  |   try {
  31  |     db.exec(`PRAGMA application_id=0x45505231; PRAGMA user_version=8; ${sql}
  32  |       INSERT INTO app_startup VALUES(1,7,'2026-10-23T00:00:00.000Z');
  33  |       INSERT INTO categories VALUES('old-category','当前分类名');
  34  |       INSERT INTO topics(topic_id,title,source_name,category_id) VALUES('old-topic','结构八专题','旧来源.md','old-category');
  35  |       INSERT INTO questions(id,topic_id,question_id,title,tags_json,difficulty,position,archived,current_version_id) VALUES(1,'old-topic','q-1','旧标题','[]','基础',0,0,NULL);
  36  |       INSERT INTO question_versions VALUES(1,1,1,'旧标题','旧题干','旧答案','[]','[]','${'a'.repeat(64)}','2026-10-23T00:00:00.000Z');
  37  |       UPDATE questions SET current_version_id=1;
  38  |       INSERT INTO question_user_state VALUES(1,1,NULL,NULL);
  39  |       CREATE TABLE private_notes(note TEXT) STRICT; INSERT INTO private_notes VALUES('原自定义数据');
  40  |       CREATE INDEX old_topic_title ON topics(title);
  41  |       CREATE TRIGGER old_session_probe AFTER UPDATE ON practice_sessions BEGIN SELECT 1; END;`)
  42  |     db.prepare(
  43  |       "INSERT INTO practice_sessions(id,mode,topic_id,status,position,revision,created_at,ended_at,filters_json,category_scope_json) VALUES(?,'random','old-topic','active',0,0,'2026-10-23T00:00:00.000Z',NULL,?,?)",
  44  |     ).run(
  45  |       sessionId,
  46  |       JSON.stringify(EMPTY_QUESTION_FILTERS),
  47  |       JSON.stringify({ kind: 'category', categoryId: 'old-category', title: '旧轮分类名' }),
  48  |     )
  49  |     db.prepare(
  50  |       "INSERT INTO practice_items(session_id,position,question_id,version_id,title,topic_title,tags_json,difficulty,draft,draft_revision) VALUES(?,0,1,1,'旧标题','结构八专题','[]','基础',?,2)",
  51  |     ).run(sessionId, '结构八原草稿\r\n    preserved8();')
  52  |     expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  53  |     return { before: records(db), sessionId }
  54  |   } finally {
  55  |     db.close()
  56  |   }
  57  | }
  58  | 
  59  | test('结构8方案升级：只追加空方案表，原分类/条件/草稿/自定义对象与保护备份保持', async ({
  60  |   testDataDirectory,
  61  | }, info) => {
  62  |   const original = await legacy(testDataDirectory),
  63  |     expected = {
  64  |       ...original.before,
  65  |       practice_plans: [],
  66  |       installed_themes: [],
  67  |       practice_sessions: original.before.practice_sessions!.map((row) => ({
  68  |         ...row,
  69  |         repeat_source_id: null,
  70  |         repeat_selection: null,
  71  |       })),
  72  |       appearance_settings: original.before.appearance_settings!.map((row) => ({
  73  |         ...row,
  74  |         theme_id: `builtin.${row['palette']}`,
  75  |         navigation_collapsed: 0,
  76  |         auxiliary_hidden: 0,
  77  |       })),
  78  |     }
  79  |   const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  80  |   try {
> 81  |     expect(withHistoryDatabase(testDataDirectory, records)).toEqual(expected)
      |                                                             ^ Error: expect(received).toEqual(expected) // deep equality
  82  |     withHistoryDatabase(testDataDirectory, (db) => {
  83  |       expect(db.prepare('PRAGMA user_version').get()).toEqual({ user_version: 12 })
  84  |       expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  85  |       expect(
  86  |         db
  87  |           .prepare(
  88  |             "SELECT name FROM sqlite_schema WHERE name IN ('old_topic_title','old_session_probe') ORDER BY name",
  89  |           )
  90  |           .all(),
  91  |       ).toEqual([{ name: 'old_session_probe' }, { name: 'old_topic_title' }])
  92  |     })
  93  |     expect(
  94  |       await page.evaluate(() =>
  95  |         (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({
  96  |           sessionId: null,
  97  |         }),
  98  |       ),
  99  |     ).toMatchObject({
  100 |       ok: true,
  101 |       value: {
  102 |         session: {
  103 |           sessionId: original.sessionId,
  104 |           category: { kind: 'category', title: '旧轮分类名' },
  105 |           filters: EMPTY_QUESTION_FILTERS,
  106 |         },
  107 |         item: { draft: { text: '结构八原草稿\r\n    preserved8();', revision: 2 } },
  108 |       },
  109 |     })
  110 |   } finally {
  111 |     await stop(application)
  112 |   }
  113 |   const names = await readdir(join(testDataDirectory, 'backups'))
  114 |   expect(names).toHaveLength(1)
  115 |   expect(names[0]).toMatch(/^pre-migration-v8-/)
  116 |   const path = join(testDataDirectory, 'backups', names[0]!),
  117 |     source = await readFile(path)
  118 |   const old = new DatabaseSync(path, { readOnly: true })
  119 |   try {
  120 |     expect(old.prepare('PRAGMA user_version').get()).toEqual({ user_version: 8 })
  121 |     expect(records(old)).toEqual(original.before)
  122 |   } finally {
  123 |     old.close()
  124 |   }
  125 |   const next = await launchApplication(testDataDirectory, info.project.name)
  126 |   try {
  127 |     await next.application.evaluate(({ dialog }, path) => {
  128 |       dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
  129 |     }, path)
  130 |     expect(
  131 |       await next.page.evaluate(() =>
  132 |         (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
  133 |       ),
  134 |     ).toMatchObject({
  135 |       ok: true,
  136 |       value: {
  137 |         summary: {
  138 |           schemaVersion: 8,
  139 |           requiresMigration: true,
  140 |           practicePlans: 0,
  141 |           categories: 1,
  142 |           activeSession: true,
  143 |         },
  144 |       },
  145 |     })
  146 |     expect(await readFile(path)).toEqual(source)
  147 |     expect(withHistoryDatabase(testDataDirectory, records)).toEqual(expected)
  148 |     expect(await readdir(join(testDataDirectory, 'backups'))).toEqual(names)
  149 |     await info.attach('plans-v8-upgrade.json', {
  150 |       body: JSON.stringify({ original, expected, backups: names }),
  151 |       contentType: 'application/json',
  152 |     })
  153 |   } finally {
  154 |     await stop(next.application)
  155 |   }
  156 | })
  157 | 
  158 | for (const failure of ['backup-blocked', 'table-conflict', 'foreign-key'] as const) {
  159 |   test(`结构8方案升级 ${failure} 停止或完整回滚，原库与分类不修补`, async ({
  160 |     testDataDirectory,
  161 |   }, info) => {
  162 |     await legacy(testDataDirectory)
  163 |     if (failure === 'backup-blocked')
  164 |       await writeFile(join(testDataDirectory, 'backups'), '阻止保护目录')
  165 |     else
  166 |       withHistoryDatabase(
  167 |         testDataDirectory,
  168 |         (db) =>
  169 |           db.exec(
  170 |             failure === 'table-conflict'
  171 |               ? "CREATE TABLE practice_plans(retained TEXT); INSERT INTO practice_plans VALUES('未知原表保持');"
  172 |               : 'PRAGMA foreign_keys=OFF; UPDATE questions SET current_version_id=999999',
  173 |           ),
  174 |         false,
  175 |       )
  176 |     const before = withHistoryDatabase(testDataDirectory, records),
  177 |       bytes = await readFile(join(testDataDirectory, 'practice.sqlite3'))
  178 |     const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  179 |     try {
  180 |       await expect(page.locator('.service-status')).toContainText('本地数据暂不可用')
  181 |       expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
```