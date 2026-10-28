# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: category-migration.spec.ts >> 结构7分类迁移：一致性保护、原业务/条件/回执/自定义对象保持，旧专题未分类与旧轮不限分类
- Location: tests\e2e\category-migration.spec.ts:83:5

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 0
+ Received  + 3

@@ -58,20 +58,23 @@
        "mode": "random",
        "position": 0,
        "repeat_selection": null,
        "repeat_source_id": null,
        "revision": 0,
+       "selection_name": null,
        "status": "active",
        "topic_id": "v7-topic",
      },
    ],
    "private_notes": Array [
      Object {
        "id": 1,
        "note": "自定义对象保持",
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
  9   | function records(database: DatabaseSync) {
  10  |   const tables = database
  11  |     .prepare(
  12  |       "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT GLOB 'sqlite_*' AND name <> 'app_startup' ORDER BY name",
  13  |     )
  14  |     .all() as { name: string }[]
  15  |   return Object.fromEntries(
  16  |     tables.map(({ name }) => [
  17  |       name,
  18  |       database.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}" ORDER BY rowid`).all(),
  19  |     ]),
  20  |   )
  21  | }
  22  | async function legacy(directory: string) {
  23  |   const sql = await readFile(resolve('tests/fixtures/schema-v7.sql'), 'utf8')
  24  |   const source = JSON.parse(
  25  |     await readFile(resolve('docs/evidence/category-tree-20261023/schema-v7-source.json'), 'utf8'),
  26  |   )
  27  |   expect(createHash('sha256').update(sql).digest('hex')).toBe(source.sha256)
  28  |   const database = new DatabaseSync(join(directory, 'practice.sqlite3'))
  29  |   const sessionId = randomUUID()
  30  |   const filters = {
  31  |     query: '旧题干',
  32  |     tag: null,
  33  |     difficulty: null,
  34  |     mastery: 'all' as const,
  35  |     favoritesOnly: false,
  36  |   }
  37  |   const input = {
  38  |     requestId: randomUUID(),
  39  |     topicId: 'v7-topic',
  40  |     count: 'all' as const,
  41  |     replace: null,
  42  |     filters,
  43  |     mode: 'random' as const,
  44  |   }
  45  |   const receipt = { sessionId, status: 'active', position: 0, revision: 0, total: 1 }
  46  |   try {
  47  |     database.exec(`PRAGMA application_id=0x45505231; PRAGMA user_version=7; ${sql}`)
  48  |     database.exec(`INSERT INTO app_startup VALUES(1,7,'2026-10-22T00:00:00.000Z');
  49  |       INSERT INTO topics(topic_id,title,source_name) VALUES('v7-topic','结构七旧专题','旧来源.md');
  50  |       INSERT INTO questions(id,topic_id,question_id,title,tags_json,difficulty,position,archived,current_version_id) VALUES(1,'v7-topic','q-1','旧标题','[]','基础',0,0,NULL);
  51  |       INSERT INTO question_versions VALUES(1,1,1,'旧标题','旧题干','旧答案','[]','[]','${'a'.repeat(64)}','2026-10-22T00:00:00.000Z');
  52  |       UPDATE questions SET current_version_id=1;
  53  |       INSERT INTO question_user_state VALUES(1,1,NULL,NULL);
  54  |       UPDATE appearance_settings SET theme='dark',font_size=20,palette='ocean';
  55  |       CREATE TABLE private_notes(id INTEGER PRIMARY KEY,note TEXT) STRICT;
  56  |       INSERT INTO private_notes VALUES(1,'自定义对象保持');
  57  |       CREATE INDEX v7_topic_title ON topics(title);
  58  |       CREATE TRIGGER v7_session_probe AFTER UPDATE ON practice_sessions BEGIN SELECT 1; END;`)
  59  |     database
  60  |       .prepare(
  61  |         "INSERT INTO practice_sessions(id,mode,topic_id,status,position,revision,created_at,ended_at,filters_json) VALUES(?,'random','v7-topic','active',0,0,'2026-10-22T00:00:00.000Z',NULL,?)",
  62  |       )
  63  |       .run(sessionId, JSON.stringify(filters))
  64  |     database
  65  |       .prepare(
  66  |         "INSERT INTO practice_items(session_id,position,question_id,version_id,title,topic_title,tags_json,difficulty,draft,draft_revision) VALUES(?,0,1,1,'旧标题','结构七旧专题','[]','基础',?,2)",
  67  |       )
  68  |       .run(sessionId, '结构七原草稿\r\n    preserved_v7();')
  69  |     database.prepare('INSERT INTO practice_receipts VALUES(?,?,?,?)').run(
  70  |       input.requestId,
  71  |       createHash('sha256')
  72  |         .update(JSON.stringify({ action: 'start', input }))
  73  |         .digest('hex'),
  74  |       JSON.stringify(receipt),
  75  |       '2026-10-22T00:00:00.000Z',
  76  |     )
  77  |     return { before: records(database), sessionId, filters, input, receipt }
  78  |   } finally {
  79  |     database.close()
  80  |   }
  81  | }
  82  | 
  83  | test('结构7分类迁移：一致性保护、原业务/条件/回执/自定义对象保持，旧专题未分类与旧轮不限分类', async ({
  84  |   testDataDirectory,
  85  | }, info) => {
  86  |   const original = await legacy(testDataDirectory)
  87  |   const expected = {
  88  |     ...original.before,
  89  |     categories: [],
  90  |     practice_plans: [],
  91  |     installed_themes: [],
  92  |     appearance_settings: original.before.appearance_settings!.map((row) => ({
  93  |       ...row,
  94  |       theme_id: `builtin.${row['palette']}`,
  95  |       navigation_collapsed: 0,
  96  |       auxiliary_hidden: 0,
  97  |     })),
  98  |     topics: original.before.topics!.map((row) => ({ ...row, category_id: null })),
  99  |     practice_sessions: original.before.practice_sessions!.map((row) => ({
  100 |       ...row,
  101 |       repeat_source_id: null,
  102 |       repeat_selection: null,
  103 |       category_scope_json: '{"kind":"all"}',
  104 |     })),
  105 |   }
  106 |   const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  107 |   try {
  108 |     await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
> 109 |     expect(withHistoryDatabase(testDataDirectory, records)).toEqual(expected)
      |                                                             ^ Error: expect(received).toEqual(expected) // deep equality
  110 |     withHistoryDatabase(testDataDirectory, (db) => {
  111 |       expect(db.prepare('PRAGMA user_version').get()).toEqual({ user_version: 12 })
  112 |       expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  113 |       expect(
  114 |         db
  115 |           .prepare(
  116 |             "SELECT name FROM sqlite_schema WHERE name IN ('v7_topic_title','v7_session_probe') ORDER BY name",
  117 |           )
  118 |           .all(),
  119 |       ).toEqual([{ name: 'v7_session_probe' }, { name: 'v7_topic_title' }])
  120 |     })
  121 |     expect(
  122 |       await page.evaluate(() =>
  123 |         (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({
  124 |           sessionId: null,
  125 |         }),
  126 |       ),
  127 |     ).toMatchObject({
  128 |       ok: true,
  129 |       value: {
  130 |         session: {
  131 |           sessionId: original.sessionId,
  132 |           filters: original.filters,
  133 |           category: { kind: 'all' },
  134 |         },
  135 |         item: {
  136 |           draft: { text: '结构七原草稿\r\n    preserved_v7();', revision: 2 },
  137 |           revealed: false,
  138 |         },
  139 |       },
  140 |     })
  141 |     expect(
  142 |       await page.evaluate(
  143 |         (input) => (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.start(input),
  144 |         original.input,
  145 |       ),
  146 |     ).toEqual({ ok: true, value: original.receipt })
  147 |     expect(withHistoryDatabase(testDataDirectory, records)).toEqual(expected)
  148 |     await expect(page.locator('html')).toHaveAttribute('data-palette', 'ocean')
  149 |     await page.getByRole('button', { name: '继续练习', exact: true }).click()
  150 |     await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  151 |       '结构七原草稿\n    preserved_v7();',
  152 |     )
  153 |   } finally {
  154 |     await stop(application)
  155 |   }
  156 |   const names = await readdir(join(testDataDirectory, 'backups'))
  157 |   expect(names).toHaveLength(1)
  158 |   expect(names[0]).toMatch(/^pre-migration-v7-/)
  159 |   const backup = new DatabaseSync(join(testDataDirectory, 'backups', names[0]!), { readOnly: true })
  160 |   try {
  161 |     expect(backup.prepare('PRAGMA user_version').get()).toEqual({ user_version: 7 })
  162 |     expect(backup.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }])
  163 |     expect(records(backup)).toEqual(original.before)
  164 |   } finally {
  165 |     backup.close()
  166 |   }
  167 |   const next = await launchApplication(testDataDirectory, info.project.name)
  168 |   try {
  169 |     await expect(next.page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
  170 |     expect(withHistoryDatabase(testDataDirectory, records)).toEqual(expected)
  171 |     expect(await readdir(join(testDataDirectory, 'backups'))).toEqual(names)
  172 |     const sourcePath = join(testDataDirectory, 'backups', names[0]!)
  173 |     const sourceBytes = await readFile(sourcePath)
  174 |     await next.application.evaluate(({ dialog }, path) => {
  175 |       dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
  176 |     }, sourcePath)
  177 |     expect(
  178 |       await next.page.evaluate(() =>
  179 |         (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
  180 |       ),
  181 |     ).toMatchObject({
  182 |       ok: true,
  183 |       value: {
  184 |         summary: { schemaVersion: 7, requiresMigration: true, categories: 0, activeSession: true },
  185 |       },
  186 |     })
  187 |     expect(await readFile(sourcePath)).toEqual(sourceBytes)
  188 |     expect(withHistoryDatabase(testDataDirectory, records)).toEqual(expected)
  189 |     await info.attach('category-v7-migration.json', {
  190 |       body: JSON.stringify({ original, expected, backups: names }),
  191 |       contentType: 'application/json',
  192 |     })
  193 |   } finally {
  194 |     await stop(next.application)
  195 |   }
  196 | })
  197 | 
  198 | for (const failure of [
  199 |   'backup-blocked',
  200 |   'table-conflict',
  201 |   'scope-column-conflict',
  202 |   'foreign-key',
  203 | ] as const) {
  204 |   test(`结构7分类迁移 ${failure} 停止或完整回滚，原库不修补不重建`, async ({
  205 |     testDataDirectory,
  206 |   }, info) => {
  207 |     await legacy(testDataDirectory)
  208 |     if (failure === 'backup-blocked')
  209 |       await writeFile(join(testDataDirectory, 'backups'), '阻止保护目录')
```