# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: themes-migration.spec.ts >> 结构9/ocean先保护备份再迁移主题，原明暗/字号/学习数据/方案逐行保持
- Location: tests\e2e\themes-migration.spec.ts:96:7

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 0
+ Received  + 3

@@ -68,19 +68,22 @@
        "mode": "random",
        "position": 0,
        "repeat_selection": null,
        "repeat_source_id": null,
        "revision": 3,
+       "selection_name": null,
        "status": "active",
        "topic_id": "theme-old",
      },
    ],
    "private_theme_notes": Array [
      Object {
        "note": "原自定义数据",
      },
    ],
+   "question_set_items": Array [],
+   "question_sets": Array [],
    "question_user_state": Array [
      Object {
        "favorite": 1,
        "last_rated_version_id": 1,
        "last_rating": "掌握",
```

# Test source

```ts
  20  |         .prepare(
  21  |           name === 'image_resources'
  22  |             ? 'SELECT hash,format,width,height,hex(bytes) AS bytes FROM image_resources ORDER BY hash'
  23  |             : `SELECT * FROM "${name.replaceAll('"', '""')}" ORDER BY rowid`,
  24  |         )
  25  |         .all(),
  26  |     ]),
  27  |   )
  28  | }
  29  | async function seedV9(directory: string, palette = 'ocean', mode = 'dark', fontSize = 22) {
  30  |   const sql = await readFile('tests/fixtures/schema-v9.sql', 'utf8')
  31  |   expect(createHash('sha256').update(sql).digest('hex')).toBe(
  32  |     '1c9a8173bf0e29bfc090beb19c48c69b1923fbb8f5f68b551c6d380c3e43b5ef',
  33  |   )
  34  |   const database = new DatabaseSync(join(directory, 'practice.sqlite3'))
  35  |   try {
  36  |     database.exec(sql)
  37  |     database
  38  |       .prepare('UPDATE appearance_settings SET palette=?,theme=?,font_size=? WHERE id=1')
  39  |       .run(palette, mode, fontSize)
  40  |     database.exec(`
  41  |       INSERT INTO categories VALUES('theme-old-category','原分类');
  42  |       INSERT INTO topics(topic_id,title,source_name,category_id) VALUES('theme-old','旧主题样本','旧来源.md','theme-old-category');
  43  |       INSERT INTO questions(id,topic_id,question_id,title,tags_json,difficulty,position,archived,current_version_id) VALUES(1,'theme-old','q-1','旧题','["旧标签"]','基础',0,0,NULL);
  44  |       INSERT INTO question_versions VALUES(1,1,1,'旧题','旧题干','旧答案','[]','[]','${'a'.repeat(64)}','2026-10-24T00:00:00.000Z');
  45  |       UPDATE questions SET current_version_id=1;
  46  |       INSERT INTO question_user_state VALUES(1,1,'掌握',1);
  47  |       CREATE TABLE private_theme_notes(note TEXT) STRICT; INSERT INTO private_theme_notes VALUES('原自定义数据');
  48  |       CREATE INDEX v9_theme_index ON appearance_settings(theme);
  49  |       CREATE TRIGGER v9_theme_probe AFTER UPDATE ON appearance_settings BEGIN SELECT 1; END;
  50  |     `)
  51  |     const sessionId = randomUUID()
  52  |     database
  53  |       .prepare(
  54  |         "INSERT INTO practice_sessions(id,mode,topic_id,status,position,revision,created_at,ended_at,filters_json,category_scope_json) VALUES(?,'random','theme-old','active',0,3,'2026-10-24T00:00:00.000Z',NULL,?,?)",
  55  |       )
  56  |       .run(
  57  |         sessionId,
  58  |         JSON.stringify(EMPTY_QUESTION_FILTERS),
  59  |         JSON.stringify({
  60  |           kind: 'category',
  61  |           categoryId: 'theme-old-category',
  62  |           title: '旧轮分类快照',
  63  |         }),
  64  |       )
  65  |     database
  66  |       .prepare(
  67  |         "INSERT INTO practice_items(session_id,position,question_id,version_id,title,topic_title,tags_json,difficulty,draft,draft_revision) VALUES(?,0,1,1,'旧题','旧主题样本','[\"旧标签\"]','基础',?,2)",
  68  |       )
  69  |       .run(sessionId, '结构9草稿\r\n    retained9();')
  70  |     database.prepare('INSERT INTO practice_plans VALUES(?,?,?)').run(
  71  |       randomUUID(),
  72  |       '原练习方案',
  73  |       JSON.stringify({
  74  |         category: { kind: 'all' },
  75  |         topicId: 'theme-old',
  76  |         mode: 'sequential',
  77  |         count: 20,
  78  |         filters: EMPTY_QUESTION_FILTERS,
  79  |       }),
  80  |     )
  81  |     database
  82  |       .prepare('INSERT INTO import_receipts VALUES(?,?,?)')
  83  |       .run(randomUUID(), '2026-10-24T00:00:00.000Z', '{"legacy":"原回执"}')
  84  |     expect(database.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  85  |     return records(database)
  86  |   } finally {
  87  |     database.close()
  88  |   }
  89  | }
  90  | for (const [palette, mode, size] of [
  91  |   ['forest', 'system', 15],
  92  |   ['ocean', 'light', 22],
  93  |   ['sand', 'dark', 20],
  94  |   ['lilac', 'system', 17],
  95  | ] as const) {
  96  |   test(`结构9/${palette}先保护备份再迁移主题，原明暗/字号/学习数据/方案逐行保持`, async ({
  97  |     testDataDirectory,
  98  |   }, info) => {
  99  |     const before = await seedV9(testDataDirectory, palette, mode, size)
  100 |     const expected = {
  101 |       ...before,
  102 |       installed_themes: [],
  103 |       practice_sessions: before.practice_sessions!.map((row) => ({
  104 |         ...row,
  105 |         repeat_source_id: null,
  106 |         repeat_selection: null,
  107 |       })),
  108 |       appearance_settings: before['appearance_settings']!.map((row) => ({
  109 |         ...row,
  110 |         theme_id: `builtin.${palette}`,
  111 |         navigation_collapsed: 0,
  112 |         auxiliary_hidden: 0,
  113 |       })),
  114 |     }
  115 |     const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  116 |     try {
  117 |       await expect(page.locator('html')).toHaveAttribute('data-theme-id', `builtin.${palette}`)
  118 |       await expect(page.locator('html')).toHaveAttribute('data-theme', mode)
  119 |       await expect(page.locator('html')).toHaveAttribute('data-font-size', String(size))
> 120 |       expect(withHistoryDatabase(testDataDirectory, records)).toEqual(expected)
      |                                                               ^ Error: expect(received).toEqual(expected) // deep equality
  121 |       expect(
  122 |         withHistoryDatabase(testDataDirectory, (database) =>
  123 |           database.prepare('PRAGMA user_version').get(),
  124 |         ),
  125 |       ).toEqual({ user_version: 12 })
  126 |       await page.getByRole('button', { name: '继续练习', exact: true }).click()
  127 |       await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  128 |         '结构9草稿\n    retained9();',
  129 |       )
  130 |       await expect(page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
  131 |     } finally {
  132 |       await stop(application)
  133 |     }
  134 |     const names = await readdir(join(testDataDirectory, 'backups'))
  135 |     expect(names).toHaveLength(1)
  136 |     expect(names[0]).toMatch(/^pre-migration-v9-/)
  137 |     const path = join(testDataDirectory, 'backups', names[0]!),
  138 |       sourceBytes = await readFile(path)
  139 |     const old = new DatabaseSync(path, { readOnly: true })
  140 |     try {
  141 |       expect(old.prepare('PRAGMA user_version').get()).toEqual({ user_version: 9 })
  142 |       expect(records(old)).toEqual(before)
  143 |     } finally {
  144 |       old.close()
  145 |     }
  146 |     const next = await launchApplication(testDataDirectory, info.project.name)
  147 |     try {
  148 |       expect(withHistoryDatabase(testDataDirectory, records)).toEqual(expected)
  149 |       expect(await readdir(join(testDataDirectory, 'backups'))).toEqual(names)
  150 |       await next.application.evaluate(({ dialog }, path) => {
  151 |         dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
  152 |       }, path)
  153 |       const preview = await next.page.evaluate(() =>
  154 |         (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
  155 |       )
  156 |       expect(preview).toMatchObject({
  157 |         ok: true,
  158 |         value: {
  159 |           summary: {
  160 |             schemaVersion: 9,
  161 |             requiresMigration: true,
  162 |             installedThemes: 0,
  163 |             appearance: { themeId: `builtin.${palette}`, theme: mode, fontSize: size },
  164 |           },
  165 |         },
  166 |       })
  167 |       expect(await readFile(path)).toEqual(sourceBytes)
  168 |       await info.attach('v9-theme-migration.json', {
  169 |         body: JSON.stringify({ palette, mode, size, before, after: expected, preview }),
  170 |         contentType: 'application/json',
  171 |       })
  172 |     } finally {
  173 |       await stop(next.application)
  174 |     }
  175 |   })
  176 | }
  177 | for (const failure of [
  178 |   'backup-blocked',
  179 |   'table-conflict',
  180 |   'column-conflict',
  181 |   'foreign-key',
  182 | ] as const) {
  183 |   test(`结构9主题迁移/${failure}停止或回滚，原文件和业务保持`, async ({
  184 |     testDataDirectory,
  185 |   }, info) => {
  186 |     await seedV9(testDataDirectory)
  187 |     if (failure === 'backup-blocked')
  188 |       await writeFile(join(testDataDirectory, 'backups'), '阻断保护备份目录')
  189 |     else
  190 |       withHistoryDatabase(
  191 |         testDataDirectory,
  192 |         (database) =>
  193 |           database.exec(
  194 |             failure === 'table-conflict'
  195 |               ? 'CREATE TABLE installed_themes(legacy TEXT)'
  196 |               : failure === 'column-conflict'
  197 |                 ? 'ALTER TABLE appearance_settings ADD COLUMN theme_id TEXT'
  198 |                 : 'PRAGMA foreign_keys=OFF; UPDATE question_user_state SET last_rated_version_id=9999',
  199 |           ),
  200 |         false,
  201 |       )
  202 |     const before = withHistoryDatabase(testDataDirectory, records),
  203 |       bytes = await readFile(join(testDataDirectory, 'practice.sqlite3'))
  204 |     const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  205 |     try {
  206 |       await expect(page.locator('.service-status')).toContainText('本地数据暂不可用')
  207 |       expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
  208 |       expect(
  209 |         withHistoryDatabase(testDataDirectory, (database) =>
  210 |           database.prepare('PRAGMA user_version').get(),
  211 |         ),
  212 |       ).toEqual({ user_version: 9 })
  213 |     } finally {
  214 |       await stop(application)
  215 |     }
  216 |     if (failure === 'backup-blocked')
  217 |       expect(await readFile(join(testDataDirectory, 'practice.sqlite3'))).toEqual(bytes)
  218 |     else expect(await readdir(join(testDataDirectory, 'backups'))).toHaveLength(1)
  219 |   })
  220 | }
```