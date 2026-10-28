# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: palette-migration.spec.ts >> 真实结构6先保护备份再追加配色，全部业务/自定义对象/显示和条件保持
- Location: tests\e2e\palette-migration.spec.ts:87:5

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 0
+ Received  + 3

@@ -72,14 +72,17 @@
        "mode": "random",
        "position": 0,
        "repeat_selection": null,
        "repeat_source_id": null,
        "revision": 0,
+       "selection_name": null,
        "status": "active",
        "topic_id": "palette-legacy",
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
  15  |   return Object.fromEntries(
  16  |     names.map(({ name }) => [
  17  |       name,
  18  |       database
  19  |         .prepare(
  20  |           name === 'image_resources'
  21  |             ? 'SELECT hash,format,width,height,hex(bytes) AS bytes FROM image_resources ORDER BY hash'
  22  |             : `SELECT * FROM "${name.replaceAll('"', '""')}" ORDER BY rowid`,
  23  |         )
  24  |         .all(),
  25  |     ]),
  26  |   )
  27  | }
  28  | 
  29  | async function legacy(directory: string) {
  30  |   const sql = await readFile(resolve('tests/fixtures/schema-v6.sql'), 'utf8')
  31  |   const source = JSON.parse(
  32  |     await readFile(resolve('docs/evidence/ui-themes-20261023/schema-v6-source.json'), 'utf8'),
  33  |   )
  34  |   expect(createHash('sha256').update(sql).digest('hex')).toBe(source.sha256)
  35  |   const database = new DatabaseSync(join(directory, 'practice.sqlite3'))
  36  |   try {
  37  |     database.exec(`PRAGMA application_id=0x45505231; PRAGMA user_version=6; ${sql}`)
  38  |     database.exec(`INSERT INTO app_startup VALUES(1,7,'2026-10-22T00:00:00.000Z');
  39  |       INSERT INTO topics VALUES('palette-legacy','旧配色专题','旧配色.md');
  40  |       INSERT INTO questions VALUES(1,'palette-legacy','q-1','旧题','[]','基础',0,0,NULL);
  41  |       UPDATE appearance_settings SET theme='dark',font_size=20;
  42  |       CREATE TABLE personal_notes(id INTEGER PRIMARY KEY, note TEXT) STRICT;
  43  |       INSERT INTO personal_notes VALUES(1,'结构六的额外表必须保留');
  44  |       CREATE INDEX legacy_theme ON appearance_settings(theme);
  45  |       CREATE TRIGGER legacy_theme_probe AFTER UPDATE ON appearance_settings BEGIN SELECT 1; END;`)
  46  |     const bytes = await readFile(resolve('tests/fixtures/images/small.png'))
  47  |     const hash = createHash('sha256').update(bytes).digest('hex')
  48  |     database.prepare("INSERT INTO image_resources VALUES(?,'png',2,3,?)").run(hash, bytes)
  49  |     database
  50  |       .prepare(
  51  |         "INSERT INTO question_versions VALUES(1,1,1,'旧标题','旧题干','旧答案','[]',?,?,'2026-10-22T00:00:00.000Z')",
  52  |       )
  53  |       .run(JSON.stringify([{ url: 'assets/old.png', hash }]), 'a'.repeat(64))
  54  |     database.exec(
  55  |       'UPDATE questions SET current_version_id=1; INSERT INTO question_user_state VALUES(1,1,NULL,NULL)',
  56  |     )
  57  |     database.prepare('INSERT INTO version_images VALUES(1,?)').run(hash)
  58  |     const sessionId = randomUUID()
  59  |     database
  60  |       .prepare(
  61  |         "INSERT INTO practice_sessions VALUES(?,'random','palette-legacy','active',0,0,'2026-10-22T00:00:00.000Z',NULL,?)",
  62  |       )
  63  |       .run(
  64  |         sessionId,
  65  |         JSON.stringify({
  66  |           query: '旧条件',
  67  |           tag: null,
  68  |           difficulty: null,
  69  |           mastery: 'all',
  70  |           favoritesOnly: false,
  71  |         }),
  72  |       )
  73  |     database
  74  |       .prepare(
  75  |         "INSERT INTO practice_items VALUES(?,0,1,1,'旧题','旧专题','[]','基础',?,1,NULL,NULL,NULL,NULL)",
  76  |       )
  77  |       .run(sessionId, '结构六草稿\r\n    int kept = 6;')
  78  |     database
  79  |       .prepare('INSERT INTO practice_receipts VALUES(?,?,?,?)')
  80  |       .run(randomUUID(), 'b'.repeat(64), '{}', '2026-10-22T00:00:00.000Z')
  81  |     return records(database)
  82  |   } finally {
  83  |     database.close()
  84  |   }
  85  | }
  86  | 
  87  | test('真实结构6先保护备份再追加配色，全部业务/自定义对象/显示和条件保持', async ({
  88  |   testDataDirectory,
  89  | }, info) => {
  90  |   const before = await legacy(testDataDirectory)
  91  |   const expected = {
  92  |     ...before,
  93  |     categories: [],
  94  |     practice_plans: [],
  95  |     installed_themes: [],
  96  |     topics: before.topics!.map((row) => ({ ...row, category_id: null })),
  97  |     practice_sessions: before.practice_sessions!.map((row) => ({
  98  |       ...row,
  99  |       repeat_source_id: null,
  100 |       repeat_selection: null,
  101 |       category_scope_json: '{"kind":"all"}',
  102 |     })),
  103 |     appearance_settings: before.appearance_settings!.map((row) => ({
  104 |       ...row,
  105 |       palette: 'forest',
  106 |       theme_id: 'builtin.forest',
  107 |       navigation_collapsed: 0,
  108 |       auxiliary_hidden: 0,
  109 |     })),
  110 |   }
  111 |   const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  112 |   try {
  113 |     await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
  114 |     withHistoryDatabase(testDataDirectory, (database) => {
> 115 |       expect(records(database)).toEqual(expected)
      |                                 ^ Error: expect(received).toEqual(expected) // deep equality
  116 |       expect(database.prepare('PRAGMA user_version').get()).toEqual({ user_version: 12 })
  117 |       expect(database.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  118 |       expect(
  119 |         database
  120 |           .prepare(
  121 |             "SELECT name FROM sqlite_schema WHERE name IN ('legacy_theme','legacy_theme_probe') ORDER BY name",
  122 |           )
  123 |           .all(),
  124 |       ).toEqual([{ name: 'legacy_theme' }, { name: 'legacy_theme_probe' }])
  125 |     })
  126 |     await expect(page.locator('html')).toHaveAttribute('data-palette', 'forest')
  127 |     await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  128 |     await expect(page.locator('html')).toHaveAttribute('data-font-size', '20')
  129 |     expect(
  130 |       await page.evaluate(() =>
  131 |         (globalThis as unknown as { desktop: DesktopApi }).desktop.settings.read(),
  132 |       ),
  133 |     ).toEqual({
  134 |       ok: true,
  135 |       value: {
  136 |         theme: 'dark',
  137 |         palette: 'forest',
  138 |         fontSize: 20,
  139 |         themeId: 'builtin.forest',
  140 |         navigationCollapsed: false,
  141 |         auxiliaryHidden: false,
  142 |       },
  143 |     })
  144 |     await page.getByRole('button', { name: '继续练习', exact: true }).click()
  145 |     await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  146 |       '结构六草稿\r\n    int kept = 6;'.replaceAll('\r\n', '\n'),
  147 |     )
  148 |   } finally {
  149 |     await stop(application)
  150 |   }
  151 |   const backups = await readdir(join(testDataDirectory, 'backups'))
  152 |   expect(backups).toHaveLength(1)
  153 |   expect(backups[0]).toMatch(/^pre-migration-v6-/)
  154 |   const backup = new DatabaseSync(join(testDataDirectory, 'backups', backups[0]!), {
  155 |     readOnly: true,
  156 |   })
  157 |   try {
  158 |     expect(backup.prepare('PRAGMA user_version').get()).toEqual({ user_version: 6 })
  159 |     expect(backup.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }])
  160 |     expect(records(backup)).toEqual(before)
  161 |   } finally {
  162 |     backup.close()
  163 |   }
  164 |   const next = await launchApplication(testDataDirectory, info.project.name)
  165 |   try {
  166 |     expect(withHistoryDatabase(testDataDirectory, records)).toEqual(expected)
  167 |     expect(await readdir(join(testDataDirectory, 'backups'))).toEqual(backups)
  168 |     await info.attach('palette-v6-preserved.json', {
  169 |       body: JSON.stringify({ before, after: expected, backups }),
  170 |       contentType: 'application/json',
  171 |     })
  172 |   } finally {
  173 |     await stop(next.application)
  174 |   }
  175 | })
  176 | 
  177 | for (const failure of ['backup-blocked', 'column-conflict', 'foreign-key'] as const) {
  178 |   test(`结构6配色迁移 ${failure} 停止/回滚，不修补未知结构`, async ({
  179 |     testDataDirectory,
  180 |   }, info) => {
  181 |     await legacy(testDataDirectory)
  182 |     if (failure === 'backup-blocked')
  183 |       await writeFile(join(testDataDirectory, 'backups'), '阻止保护备份')
  184 |     else
  185 |       withHistoryDatabase(
  186 |         testDataDirectory,
  187 |         (database) =>
  188 |           database.exec(
  189 |             failure === 'column-conflict'
  190 |               ? 'ALTER TABLE appearance_settings ADD COLUMN palette TEXT'
  191 |               : "PRAGMA foreign_keys=OFF; UPDATE question_user_state SET last_rating='掌握',last_rated_version_id=999999",
  192 |           ),
  193 |         false,
  194 |       )
  195 |     const before = withHistoryDatabase(testDataDirectory, records)
  196 |     const bytes = await readFile(join(testDataDirectory, 'practice.sqlite3'))
  197 |     const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  198 |     try {
  199 |       await expect(page.locator('.service-status')).toContainText('本地数据暂不可用')
  200 |       expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
  201 |       withHistoryDatabase(testDataDirectory, (database) => {
  202 |         expect(database.prepare('PRAGMA user_version').get()).toEqual({ user_version: 6 })
  203 |         const columns = database.prepare('PRAGMA table_info(appearance_settings)').all() as {
  204 |           name: string
  205 |         }[]
  206 |         expect(columns.some((column) => column.name === 'palette')).toBe(
  207 |           failure === 'column-conflict',
  208 |         )
  209 |       })
  210 |     } finally {
  211 |       await stop(application)
  212 |     }
  213 |     if (failure === 'backup-blocked')
  214 |       expect(await readFile(join(testDataDirectory, 'practice.sqlite3'))).toEqual(bytes)
  215 |     else expect(await readdir(join(testDataDirectory, 'backups'))).toHaveLength(1)
```