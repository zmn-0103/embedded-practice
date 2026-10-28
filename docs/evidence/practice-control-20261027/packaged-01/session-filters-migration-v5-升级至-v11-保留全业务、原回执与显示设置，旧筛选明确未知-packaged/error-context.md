# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: session-filters-migration.spec.ts >> v5 升级至 v11 保留全业务、原回执与显示设置，旧筛选明确未知
- Location: tests\e2e\session-filters-migration.spec.ts:139:5

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 0
+ Received  + 3

@@ -151,10 +151,11 @@
        "mode": "random",
        "position": 1,
        "repeat_selection": null,
        "repeat_source_id": null,
        "revision": 3,
+       "selection_name": null,
        "status": "active",
        "topic_id": "filter-legacy",
      },
      Object {
        "category_scope_json": "{\"kind\":\"all\"}",
@@ -165,10 +166,11 @@
        "mode": "random",
        "position": 1,
        "repeat_selection": null,
        "repeat_source_id": null,
        "revision": 3,
+       "selection_name": null,
        "status": "ended",
        "topic_id": "filter-legacy",
      },
      Object {
        "category_scope_json": "{\"kind\":\"all\"}",
@@ -179,10 +181,11 @@
        "mode": "random",
        "position": 2,
        "repeat_selection": null,
        "repeat_source_id": null,
        "revision": 3,
+       "selection_name": null,
        "status": "finished",
        "topic_id": "filter-legacy",
      },
    ],
    "question_user_state": Array [
```

# Test source

```ts
  65  |         )
  66  |         .run(n, `q-${n}`, `旧题 ${n}`, n - 1)
  67  |       database
  68  |         .prepare(
  69  |           "INSERT INTO question_versions VALUES (?, ?, 1, ?, ?, ?, '[]', ?, ?, '2026-10-20T00:00:00.000Z')",
  70  |         )
  71  |         .run(
  72  |           n,
  73  |           n,
  74  |           `旧题 ${n}`,
  75  |           `旧题干 ${n}`,
  76  |           `旧答案 ${n}`,
  77  |           JSON.stringify(n === 1 ? [{ url: 'assets/old.png', hash }] : []),
  78  |           'a'.repeat(64),
  79  |         )
  80  |       database.prepare('UPDATE questions SET current_version_id=? WHERE id=?').run(n, n)
  81  |       database
  82  |         .prepare('INSERT INTO question_user_state VALUES (?, ?, ?, ?)')
  83  |         .run(n, Number(n === 1), n === 1 ? '掌握' : null, n === 1 ? n : null)
  84  |     }
  85  |     database.prepare('INSERT INTO version_images VALUES (1, ?)').run(hash)
  86  |     for (const status of ['active', 'ended', 'finished']) {
  87  |       const id = status === 'active' ? sessionId : randomUUID()
  88  |       database
  89  |         .prepare(
  90  |           "INSERT INTO practice_sessions VALUES (?, 'random', 'filter-legacy', ?, ?, 3, ?, ?)",
  91  |         )
  92  |         .run(
  93  |           id,
  94  |           status,
  95  |           status === 'finished' ? 2 : 1,
  96  |           '2026-10-20T00:00:00.000Z',
  97  |           status === 'active' ? null : '2026-10-20T02:00:00.000Z',
  98  |         )
  99  |       for (let n = 1; n <= 2; n++)
  100 |         database
  101 |           .prepare(
  102 |             `INSERT INTO practice_items
  103 |         (session_id,position,question_id,version_id,title,topic_title,tags_json,difficulty,draft,draft_revision,revealed_at,rating,rated_at,skipped_at)
  104 |         VALUES (?, ?, ?, ?, ?, '旧专题', '["旧标签"]', '基础', ?, 2, ?, ?, ?, NULL)`,
  105 |           )
  106 |           .run(
  107 |             id,
  108 |             n - 1,
  109 |             n,
  110 |             n,
  111 |             `旧题 ${n}`,
  112 |             n === 1 ? '旧已自评作答' : '旧草稿\r\nint retained = 5;',
  113 |             n === 1 ? '2026-10-20T01:00:00.000Z' : null,
  114 |             n === 1 ? '掌握' : null,
  115 |             n === 1 ? '2026-10-20T01:01:00.000Z' : null,
  116 |           )
  117 |     }
  118 |     database.prepare('INSERT INTO practice_receipts VALUES (?, ?, ?, ?)').run(
  119 |       input.requestId,
  120 |       createHash('sha256')
  121 |         .update(JSON.stringify({ action: 'start', input }))
  122 |         .digest('hex'),
  123 |       JSON.stringify(receipt),
  124 |       '2026-10-20T00:00:00.000Z',
  125 |     )
  126 |     database
  127 |       .prepare('INSERT INTO import_receipts VALUES (?, ?, ?)')
  128 |       .run(randomUUID(), '2026-10-20T00:00:00.000Z', '{"legacy":"旧导入回执"}')
  129 |     database.exec(
  130 |       'CREATE INDEX original_filter_mode ON practice_sessions(mode); CREATE TRIGGER original_filter_probe AFTER UPDATE ON practice_sessions BEGIN SELECT 1; END; PRAGMA foreign_keys=ON;',
  131 |     )
  132 |     expect(database.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  133 |     return { sessionId, input, receipt, before: records(database) }
  134 |   } finally {
  135 |     database.close()
  136 |   }
  137 | }
  138 | 
  139 | test('v5 升级至 v11 保留全业务、原回执与显示设置，旧筛选明确未知', async ({
  140 |   testDataDirectory,
  141 | }, info) => {
  142 |   const original = await legacy(testDataDirectory)
  143 |   const expected = {
  144 |     ...original.before,
  145 |     topics: original.before.topics!.map((row) => ({ ...row, category_id: null })),
  146 |     appearance_settings: original.before.appearance_settings!.map((row) => ({
  147 |       ...row,
  148 |       palette: 'forest',
  149 |       theme_id: 'builtin.forest',
  150 |       navigation_collapsed: 0,
  151 |       auxiliary_hidden: 0,
  152 |     })),
  153 |     practice_sessions: original.before.practice_sessions!.map((row) => ({
  154 |       ...row,
  155 |       repeat_source_id: null,
  156 |       repeat_selection: null,
  157 |       filters_json: null,
  158 |       category_scope_json: '{"kind":"all"}',
  159 |     })),
  160 |   }
  161 |   const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  162 |   try {
  163 |     await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
  164 |     withHistoryDatabase(testDataDirectory, (database) => {
> 165 |       expect(records(database)).toEqual(expected)
      |                                 ^ Error: expect(received).toEqual(expected) // deep equality
  166 |       expect(database.prepare('PRAGMA user_version').get()).toEqual({ user_version: 12 })
  167 |       expect(database.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }])
  168 |       expect(database.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  169 |       expect(
  170 |         database
  171 |           .prepare(
  172 |             "SELECT name FROM sqlite_schema WHERE name IN ('original_filter_mode','original_filter_probe') ORDER BY name",
  173 |           )
  174 |           .all(),
  175 |       ).toEqual([{ name: 'original_filter_mode' }, { name: 'original_filter_probe' }])
  176 |     })
  177 |     const read = await page.evaluate(() =>
  178 |       (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
  179 |     )
  180 |     expect(read).toMatchObject({
  181 |       ok: true,
  182 |       value: {
  183 |         session: { sessionId: original.sessionId, mode: 'random', position: 1, filters: null },
  184 |         item: { draft: { text: '旧草稿\r\nint retained = 5;' }, revealed: false },
  185 |       },
  186 |     })
  187 |     expect(
  188 |       await page.evaluate(
  189 |         (input) => (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.start(input),
  190 |         original.input,
  191 |       ),
  192 |     ).toEqual({ ok: true, value: original.receipt })
  193 |     const conditions = page.getByLabel('本轮创建条件', { exact: true })
  194 |     await conditions.getByText('本轮创建条件', { exact: true }).click()
  195 |     await expect(conditions).toContainText('此旧会话未保存筛选条件，原条件未知。')
  196 |     expect(await conditions.locator('dd').count()).toBe(0)
  197 |     await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  198 |     await expect(page.locator('html')).toHaveAttribute('data-font-size', '20')
  199 |     withHistoryDatabase(testDataDirectory, (database) =>
  200 |       expect(records(database)).toEqual(expected),
  201 |     )
  202 |   } finally {
  203 |     await stop(application)
  204 |   }
  205 |   const backups = await readdir(join(testDataDirectory, 'backups'))
  206 |   expect(backups).toHaveLength(1)
  207 |   expect(backups[0]).toMatch(/^pre-migration-v5-/)
  208 |   const backup = new DatabaseSync(join(testDataDirectory, 'backups', backups[0]!), {
  209 |     readOnly: true,
  210 |   })
  211 |   try {
  212 |     expect(records(backup)).toEqual(original.before)
  213 |     expect(backup.prepare('PRAGMA user_version').get()).toEqual({ user_version: 5 })
  214 |     expect(backup.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }])
  215 |     expect(backup.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  216 |     expect(
  217 |       backup
  218 |         .prepare('PRAGMA table_info(practice_sessions)')
  219 |         .all()
  220 |         .map((x) => x.name),
  221 |     ).not.toContain('filters_json')
  222 |   } finally {
  223 |     backup.close()
  224 |   }
  225 |   const reopened = await launchApplication(testDataDirectory, info.project.name)
  226 |   try {
  227 |     await expect(reopened.page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
  228 |     withHistoryDatabase(testDataDirectory, (database) =>
  229 |       expect(records(database)).toEqual(expected),
  230 |     )
  231 |     expect(await readdir(join(testDataDirectory, 'backups'))).toEqual(backups)
  232 |     await info.attach('filters-v5-preserved.json', {
  233 |       body: JSON.stringify({ original, expected, backups }),
  234 |       contentType: 'application/json',
  235 |     })
  236 |   } finally {
  237 |     await stop(reopened.application)
  238 |   }
  239 | })
  240 | 
  241 | for (const fault of ['backup-blocked', 'column-conflict', 'foreign-key'] as const) {
  242 |   test(`v5 筛选迁移 ${fault} 停止或回滚，原库保留`, async ({ testDataDirectory }, info) => {
  243 |     await legacy(testDataDirectory)
  244 |     if (fault === 'backup-blocked')
  245 |       await writeFile(join(testDataDirectory, 'backups'), '阻断保护备份目录')
  246 |     else
  247 |       withHistoryDatabase(
  248 |         testDataDirectory,
  249 |         (database) =>
  250 |           database.exec(
  251 |             fault === 'column-conflict'
  252 |               ? 'ALTER TABLE practice_sessions ADD COLUMN filters_json TEXT; UPDATE practice_sessions SET filters_json=\'{"retained":"旧冲突列"}\';'
  253 |               : 'PRAGMA foreign_keys=OFF; UPDATE question_user_state SET last_rated_version_id=999999 WHERE question_id=1;',
  254 |           ),
  255 |         false,
  256 |       )
  257 |     const before = withHistoryDatabase(testDataDirectory, records)
  258 |     const bytes = await readFile(join(testDataDirectory, 'practice.sqlite3'))
  259 |     const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  260 |     try {
  261 |       await expect(page.locator('.service-status')).toContainText('本地数据暂不可用')
  262 |       withHistoryDatabase(testDataDirectory, (database) => {
  263 |         expect(records(database)).toEqual(before)
  264 |         expect(database.prepare('PRAGMA user_version').get()).toEqual({ user_version: 5 })
  265 |       })
```