# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: settings-migration.spec.ts >> v4 升级至 v11：一致性备份、完整业务与随机原轮保留，显示设置重开不重复升级
- Location: tests\e2e\settings-migration.spec.ts:137:5

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 0
+ Received  + 3

@@ -140,10 +140,11 @@
        "mode": "random",
        "position": 1,
        "repeat_selection": null,
        "repeat_source_id": null,
        "revision": 3,
+       "selection_name": null,
        "status": "active",
        "topic_id": "legacy-settings",
      },
      Object {
        "category_scope_json": "{\"kind\":\"all\"}",
@@ -154,10 +155,11 @@
        "mode": "random",
        "position": 2,
        "repeat_selection": null,
        "repeat_source_id": null,
        "revision": 3,
+       "selection_name": null,
        "status": "finished",
        "topic_id": "legacy-settings",
      },
      Object {
        "category_scope_json": "{\"kind\":\"all\"}",
@@ -168,10 +170,11 @@
        "mode": "random",
        "position": 1,
        "repeat_selection": null,
        "repeat_source_id": null,
        "revision": 3,
+       "selection_name": null,
        "status": "ended",
        "topic_id": "legacy-settings",
      },
    ],
    "question_user_state": Array [
```

# Test source

```ts
  55  |           JSON.stringify(n === 1 ? [{ url: 'assets/old.png', hash }] : []),
  56  |           'a'.repeat(64),
  57  |         )
  58  |       database.prepare('UPDATE questions SET current_version_id=? WHERE id=?').run(n, n)
  59  |       database
  60  |         .prepare('INSERT INTO question_user_state VALUES (?, ?, ?, ?)')
  61  |         .run(n, Number(n === 2), n === 1 ? '不熟' : null, n === 1 ? n : null)
  62  |     }
  63  |     database.prepare('INSERT INTO version_images VALUES (1, ?)').run(hash)
  64  |     for (const status of ['active', 'finished', 'ended']) {
  65  |       const id = status === 'active' ? activeId : randomUUID()
  66  |       database
  67  |         .prepare(
  68  |           "INSERT INTO practice_sessions VALUES (?, 'random', 'legacy-settings', ?, ?, 3, ?, ?)",
  69  |         )
  70  |         .run(
  71  |           id,
  72  |           status,
  73  |           status === 'finished' ? 2 : 1,
  74  |           '2026-10-20T01:00:00.000Z',
  75  |           status === 'active' ? null : '2026-10-20T02:00:00.000Z',
  76  |         )
  77  |       for (let n = 1; n <= 2; n++)
  78  |         database
  79  |           .prepare(
  80  |             `INSERT INTO practice_items
  81  |         (session_id,position,question_id,version_id,title,topic_title,tags_json,difficulty,draft,draft_revision,revealed_at,rating,rated_at,skipped_at)
  82  |         VALUES (?, ?, ?, ?, ?, '旧专题', '[]', '基础', ?, 2, ?, ?, ?, NULL)`,
  83  |           )
  84  |           .run(
  85  |             id,
  86  |             n - 1,
  87  |             n,
  88  |             n,
  89  |             `当时标题 ${n}`,
  90  |             n === 1 ? '旧已自评作答' : '旧未揭晓草稿\r\nint held = 2;',
  91  |             n === 1 ? '2026-10-20T01:01:00.000Z' : null,
  92  |             n === 1 ? '不熟' : null,
  93  |             n === 1 ? '2026-10-20T01:02:00.000Z' : null,
  94  |           )
  95  |     }
  96  |     database
  97  |       .prepare('INSERT INTO import_receipts VALUES (?, ?, ?)')
  98  |       .run(randomUUID(), '2026-10-20T00:00:00.000Z', '{"legacy":"原导入回执"}')
  99  |     database.prepare('INSERT INTO practice_receipts VALUES (?, ?, ?, ?)').run(
  100 |       randomUUID(),
  101 |       'b'.repeat(64),
  102 |       JSON.stringify({
  103 |         sessionId: activeId,
  104 |         status: 'active',
  105 |         position: 1,
  106 |         revision: 3,
  107 |         total: 2,
  108 |       }),
  109 |       '2026-10-20T01:00:00.000Z',
  110 |     )
  111 |     database.exec(
  112 |       'CREATE INDEX legacy_session_mode ON practice_sessions(mode); CREATE TRIGGER legacy_session_probe AFTER UPDATE ON practice_sessions BEGIN SELECT 1; END; PRAGMA foreign_keys=ON;',
  113 |     )
  114 |     expect(database.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  115 |     return activeId
  116 |   } finally {
  117 |     database.close()
  118 |   }
  119 | }
  120 | function snapshot(directory: string) {
  121 |   return withHistoryDatabase(directory, (database) =>
  122 |     Object.fromEntries(
  123 |       tables.map((name) => [
  124 |         name,
  125 |         database
  126 |           .prepare(
  127 |             name === 'image_resources'
  128 |               ? 'SELECT hash,format,width,height,hex(bytes) AS bytes FROM image_resources ORDER BY hash'
  129 |               : `SELECT * FROM ${name} ORDER BY rowid`,
  130 |           )
  131 |           .all(),
  132 |       ]),
  133 |     ),
  134 |   )
  135 | }
  136 | 
  137 | test('v4 升级至 v11：一致性备份、完整业务与随机原轮保留，显示设置重开不重复升级', async ({
  138 |   testDataDirectory,
  139 | }, info) => {
  140 |   const activeId = await seedV4(testDataDirectory)
  141 |   const before = snapshot(testDataDirectory)
  142 |   const migrated = {
  143 |     ...before,
  144 |     topics: before.topics!.map((row) => ({ ...row, category_id: null })),
  145 |     practice_sessions: before.practice_sessions!.map((row) => ({
  146 |       ...row,
  147 |       repeat_source_id: null,
  148 |       repeat_selection: null,
  149 |       filters_json: null,
  150 |       category_scope_json: '{"kind":"all"}',
  151 |     })),
  152 |   }
  153 |   const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  154 |   try {
> 155 |     expect(snapshot(testDataDirectory)).toEqual(migrated)
      |                                         ^ Error: expect(received).toEqual(expected) // deep equality
  156 |     const view = await page.evaluate(() =>
  157 |       (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
  158 |     )
  159 |     expect(view).toMatchObject({
  160 |       ok: true,
  161 |       value: {
  162 |         session: { sessionId: activeId, mode: 'random', filters: null, position: 1, total: 2 },
  163 |         item: { draft: { text: '旧未揭晓草稿\r\nint held = 2;' }, revealed: false },
  164 |       },
  165 |     })
  166 |     const settings = await page.evaluate(() =>
  167 |       (globalThis as unknown as { desktop: DesktopApi }).desktop.settings.read(),
  168 |     )
  169 |     expect(settings).toEqual({
  170 |       ok: true,
  171 |       value: appearanceSchema.parse({ theme: 'system', palette: 'forest', fontSize: 17 }),
  172 |     })
  173 |     const target = appearanceSchema.parse({ theme: 'dark', palette: 'forest', fontSize: 22 })
  174 |     expect(
  175 |       await page.evaluate(
  176 |         (value) => (globalThis as unknown as { desktop: DesktopApi }).desktop.settings.save(value),
  177 |         target,
  178 |       ),
  179 |     ).toEqual({ ok: true, value: target })
  180 |     withHistoryDatabase(
  181 |       testDataDirectory,
  182 |       (database) => {
  183 |         expect(database.prepare('PRAGMA user_version').get()).toEqual({ user_version: 12 })
  184 |         expect(
  185 |           database
  186 |             .prepare(
  187 |               "SELECT name FROM sqlite_schema WHERE name IN ('legacy_session_mode','legacy_session_probe') ORDER BY name",
  188 |             )
  189 |             .all(),
  190 |         ).toEqual([{ name: 'legacy_session_mode' }, { name: 'legacy_session_probe' }])
  191 |         for (const [theme, size] of [
  192 |           ['invalid', 17],
  193 |           ['dark', 14],
  194 |           ['dark', 23],
  195 |           ['dark', null],
  196 |         ] as const) {
  197 |           database.exec('BEGIN')
  198 |           try {
  199 |             expect(() =>
  200 |               database
  201 |                 .prepare('UPDATE appearance_settings SET theme=?,font_size=? WHERE id=1')
  202 |                 .run(theme, size),
  203 |             ).toThrow()
  204 |           } finally {
  205 |             database.exec('ROLLBACK')
  206 |           }
  207 |         }
  208 |       },
  209 |       false,
  210 |     )
  211 |   } finally {
  212 |     await stop(application)
  213 |   }
  214 |   const names = await readdir(join(testDataDirectory, 'backups'))
  215 |   expect(names).toHaveLength(1)
  216 |   const backup = new DatabaseSync(join(testDataDirectory, 'backups', names[0]!), { readOnly: true })
  217 |   try {
  218 |     expect(backup.prepare('PRAGMA user_version').get()).toEqual({ user_version: 4 })
  219 |     expect(backup.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }])
  220 |     expect(backup.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  221 |     expect(
  222 |       backup.prepare("SELECT name FROM sqlite_schema WHERE name='appearance_settings'").all(),
  223 |     ).toEqual([])
  224 |     for (const name of tables)
  225 |       expect(
  226 |         backup
  227 |           .prepare(
  228 |             name === 'image_resources'
  229 |               ? 'SELECT hash,format,width,height,hex(bytes) AS bytes FROM image_resources ORDER BY hash'
  230 |               : `SELECT * FROM ${name} ORDER BY rowid`,
  231 |           )
  232 |           .all(),
  233 |       ).toEqual(before[name])
  234 |     expect(backup.prepare('SELECT launch_count FROM app_startup').get()).toEqual({
  235 |       launch_count: 7,
  236 |     })
  237 |   } finally {
  238 |     backup.close()
  239 |   }
  240 |   const reopened = await launchApplication(testDataDirectory, info.project.name)
  241 |   try {
  242 |     expect(
  243 |       await reopened.page.evaluate(() =>
  244 |         (globalThis as unknown as { desktop: DesktopApi }).desktop.settings.read(),
  245 |       ),
  246 |     ).toEqual({
  247 |       ok: true,
  248 |       value: appearanceSchema.parse({ theme: 'dark', palette: 'forest', fontSize: 22 }),
  249 |     })
  250 |     expect(snapshot(testDataDirectory)).toEqual(migrated)
  251 |     expect(await readdir(join(testDataDirectory, 'backups'))).toEqual(names)
  252 |     await info.attach('settings-v4-preserved.json', {
  253 |       body: JSON.stringify({
  254 |         before,
  255 |         after: snapshot(testDataDirectory),
```