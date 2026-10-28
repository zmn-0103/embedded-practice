# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: practice-mode-migration.spec.ts >> v3 升级至 v11：备份、全部旧记录、原请求回执与顺序会话恢复保持
- Location: tests\e2e\practice-mode-migration.spec.ts:129:5

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 0
+ Received  + 3

@@ -263,10 +263,11 @@
        "mode": "sequential",
        "position": 3,
        "repeat_selection": null,
        "repeat_source_id": null,
        "revision": 5,
+       "selection_name": null,
        "status": "finished",
        "topic_id": "legacy-v3",
      },
      Object {
        "category_scope_json": "{\"kind\":\"all\"}",
@@ -277,10 +278,11 @@
        "mode": "sequential",
        "position": 1,
        "repeat_selection": null,
        "repeat_source_id": null,
        "revision": 5,
+       "selection_name": null,
        "status": "ended",
        "topic_id": "legacy-v3",
      },
      Object {
        "category_scope_json": "{\"kind\":\"all\"}",
@@ -291,10 +293,11 @@
        "mode": "sequential",
        "position": 1,
        "repeat_selection": null,
        "repeat_source_id": null,
        "revision": 5,
+       "selection_name": null,
        "status": "active",
        "topic_id": "legacy-v3",
      },
    ],
    "question_user_state": Array [
```

# Test source

```ts
  67  |       .run(JSON.stringify([{ url: 'assets/small.png', hash }]))
  68  |     database.exec("INSERT INTO question_user_state VALUES (1, 1, '掌握', 1)")
  69  |     for (const status of ['finished', 'ended', 'active']) {
  70  |       const id = status === 'active' ? sessionId : randomUUID()
  71  |       database
  72  |         .prepare('INSERT INTO practice_sessions VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  73  |         .run(
  74  |           id,
  75  |           'sequential',
  76  |           'legacy-v3',
  77  |           status,
  78  |           status === 'finished' ? 3 : 1,
  79  |           5,
  80  |           now,
  81  |           status === 'active' ? null : now,
  82  |         )
  83  |       for (let n = 1; n <= 3; n++)
  84  |         database
  85  |           .prepare(
  86  |             `INSERT INTO practice_items
  87  |             (session_id, position, question_id, version_id, title, topic_title, tags_json,
  88  |             difficulty, draft, draft_revision, revealed_at, rating, rated_at, skipped_at)
  89  |             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  90  |           )
  91  |           .run(
  92  |             id,
  93  |             n - 1,
  94  |             n,
  95  |             n,
  96  |             `标题 ${n}`,
  97  |             '旧专题',
  98  |             '["旧标签"]',
  99  |             '基础',
  100 |             n === 1 ? '原自评作答\r\nint a = 1;' : n === 2 ? '当前位置草稿' : '',
  101 |             n === 1 ? 3 : n === 2 ? 2 : 0,
  102 |             n === 1 ? now : null,
  103 |             n === 1 ? '掌握' : null,
  104 |             n === 1 ? now : null,
  105 |             n === 3 ? now : null,
  106 |           )
  107 |     }
  108 |     const hashInput = createHash('sha256')
  109 |       .update(JSON.stringify({ action: 'start', input: startInput }))
  110 |       .digest('hex')
  111 |     database
  112 |       .prepare('INSERT INTO practice_receipts VALUES (?, ?, ?, ?)')
  113 |       .run(startInput.requestId, hashInput, JSON.stringify(oldAck), now)
  114 |     if (fault === 'conflict') database.exec('CREATE TABLE practice_sessions_v4 (retained TEXT)')
  115 |     if (fault === 'trigger')
  116 |       database.exec(`CREATE TRIGGER custom_session_guard BEFORE DELETE ON practice_sessions
  117 |         BEGIN SELECT RAISE(ABORT, '保留原触发器'); END`)
  118 |     if (fault === 'index') database.exec('CREATE INDEX custom_mode ON practice_sessions(mode)')
  119 |     if (fault === 'foreign-key') {
  120 |       database.exec('PRAGMA foreign_keys = OFF')
  121 |       database.exec("UPDATE practice_items SET session_id = 'missing' WHERE rowid = 1")
  122 |     }
  123 |     return { file, sessionId, startInput, oldAck, before: records(database) }
  124 |   } finally {
  125 |     database.close()
  126 |   }
  127 | }
  128 | 
  129 | test('v3 升级至 v11：备份、全部旧记录、原请求回执与顺序会话恢复保持', async ({
  130 |   testDataDirectory,
  131 | }, info) => {
  132 |   const original = await legacy(testDataDirectory)
  133 |   const launched = await launchApplication(testDataDirectory, info.project.name)
  134 |   try {
  135 |     expect(await readAppStatus(launched.page)).toMatchObject({
  136 |       ok: true,
  137 |       value: { launchCount: 8 },
  138 |     })
  139 |     const prior = await launched.page.evaluate(
  140 |       (input) => (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.start(input),
  141 |       original.startInput,
  142 |     )
  143 |     expect(prior).toEqual({ ok: true, value: original.oldAck })
  144 |     await launched.page.getByRole('button', { name: '继续练习', exact: true }).click()
  145 |     await expect(launched.page.getByLabel('练习进度')).toHaveText('第 2 / 3 题 · 顺序练习')
  146 |     await expect(launched.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  147 |       '当前位置草稿',
  148 |     )
  149 |     expect(
  150 |       await launched.page.getByRole('region', { name: '练习参考答案', exact: true }).count(),
  151 |     ).toBe(0)
  152 |   } finally {
  153 |     await launched.application.close()
  154 |   }
  155 |   const names = await readdir(join(testDataDirectory, 'backups'))
  156 |   expect(names).toHaveLength(1)
  157 |   expect(names[0]).toMatch(/^pre-migration-v3-/)
  158 |   const backup = new DatabaseSync(join(testDataDirectory, 'backups', names[0]!), { readOnly: true })
  159 |   const current = new DatabaseSync(original.file)
  160 |   try {
  161 |     expect(backup.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 3 })
  162 |     expect(backup.prepare('PRAGMA application_id').get()).toMatchObject({
  163 |       application_id: 0x45505231,
  164 |     })
  165 |     expect(backup.prepare('PRAGMA integrity_check').get()).toMatchObject({ integrity_check: 'ok' })
  166 |     expect(records(backup)).toEqual(original.before)
> 167 |     expect(records(current)).toEqual({
      |                              ^ Error: expect(received).toEqual(expected) // deep equality
  168 |       ...original.before,
  169 |       topics: original.before.topics!.map((row) => ({ ...row, category_id: null })),
  170 |       practice_sessions: original.before.practice_sessions!.map((row) => ({
  171 |         ...row,
  172 |         repeat_source_id: null,
  173 |         repeat_selection: null,
  174 |         filters_json: null,
  175 |         category_scope_json: '{"kind":"all"}',
  176 |       })),
  177 |     })
  178 |     expect(current.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 12 })
  179 |     expect(current.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  180 |     current.exec('PRAGMA foreign_keys = ON; BEGIN')
  181 |     const insert = current.prepare(
  182 |       `INSERT INTO practice_sessions (id, mode, topic_id, status, position, revision, created_at, ended_at)
  183 |         VALUES (?, ?, NULL, ?, 0, 0, ?, ?)`,
  184 |     )
  185 |     expect(() => insert.run(randomUUID(), 'random', 'active', now, null)).toThrow()
  186 |     expect(() => insert.run(randomUUID(), 'invalid', 'ended', now, now)).toThrow()
  187 |     expect(() =>
  188 |       current.prepare("UPDATE practice_items SET session_id = 'missing'").run(),
  189 |     ).toThrow()
  190 |     insert.run(randomUUID(), 'random', 'ended', now, now)
  191 |     current.exec('ROLLBACK')
  192 |     await info.attach('migration-v3-preserved.json', {
  193 |       body: JSON.stringify({
  194 |         before: original.before,
  195 |         after: records(current),
  196 |         backups: names,
  197 |         backupIntegrity: backup.prepare('PRAGMA integrity_check').all(),
  198 |         foreignKeys: current.prepare('PRAGMA foreign_key_check').all(),
  199 |       }),
  200 |       contentType: 'application/json',
  201 |     })
  202 |   } finally {
  203 |     backup.close()
  204 |     current.close()
  205 |   }
  206 |   const reopened = await launchApplication(testDataDirectory, info.project.name)
  207 |   try {
  208 |     expect(await readAppStatus(reopened.page)).toMatchObject({
  209 |       ok: true,
  210 |       value: { launchCount: 9 },
  211 |     })
  212 |     await expect(reopened.page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
  213 |   } finally {
  214 |     await reopened.application.close()
  215 |   }
  216 |   expect(await readdir(join(testDataDirectory, 'backups'))).toEqual(names)
  217 | })
  218 | 
  219 | test('v3 备份失败停止升级，原文件逐字节不变', async ({ testDataDirectory }, info) => {
  220 |   const original = await legacy(testDataDirectory)
  221 |   await writeFile(join(testDataDirectory, 'backups'), '本测试阻止创建备份目录')
  222 |   const before = await readFile(original.file)
  223 |   const launched = await launchApplication(testDataDirectory, info.project.name)
  224 |   try {
  225 |     expect(await readAppStatus(launched.page)).toMatchObject({
  226 |       ok: false,
  227 |       error: { code: 'DATABASE_UNAVAILABLE' },
  228 |     })
  229 |   } finally {
  230 |     await launched.application.close()
  231 |   }
  232 |   expect(await readFile(original.file)).toEqual(before)
  233 | })
  234 | 
  235 | for (const fault of ['conflict', 'trigger', 'index', 'foreign-key']) {
  236 |   test(`v3 迁移拒绝 ${fault}，保留原结构、记录和保护性备份`, async ({
  237 |     testDataDirectory,
  238 |   }, info) => {
  239 |     const original = await legacy(testDataDirectory, fault)
  240 |     const before = new DatabaseSync(original.file, { readOnly: true })
  241 |     const objects = before.prepare('SELECT * FROM sqlite_schema ORDER BY name').all()
  242 |     before.close()
  243 |     const launched = await launchApplication(testDataDirectory, info.project.name)
  244 |     try {
  245 |       expect(await readAppStatus(launched.page)).toMatchObject({
  246 |         ok: false,
  247 |         error: { code: 'DATABASE_UNAVAILABLE' },
  248 |       })
  249 |     } finally {
  250 |       await launched.application.close()
  251 |     }
  252 |     const current = new DatabaseSync(original.file, { readOnly: true })
  253 |     try {
  254 |       expect(current.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 3 })
  255 |       expect(current.prepare('SELECT * FROM sqlite_schema ORDER BY name').all()).toEqual(objects)
  256 |       expect(records(current)).toEqual(original.before)
  257 |       expect(current.prepare('SELECT launch_count FROM app_startup').get()).toMatchObject({
  258 |         launch_count: 7,
  259 |       })
  260 |       await info.attach(`migration-v3-${fault}.json`, {
  261 |         body: JSON.stringify({ schema: objects, retained: records(current) }),
  262 |         contentType: 'application/json',
  263 |       })
  264 |     } finally {
  265 |       current.close()
  266 |     }
  267 |     const backups = await readdir(join(testDataDirectory, 'backups'))
```