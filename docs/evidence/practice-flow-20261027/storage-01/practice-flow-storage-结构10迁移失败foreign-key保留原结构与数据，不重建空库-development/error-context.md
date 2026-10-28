# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: practice-flow-storage.spec.ts >> 结构10迁移失败foreign-key保留原结构与数据，不重建空库
- Location: tests\e2e\practice-flow-storage.spec.ts:128:7

# Error details

```
Error: FOREIGN KEY constraint failed
```

# Test source

```ts
  38  |   try {
  39  |     db.exec(sql)
  40  |     db.exec(`INSERT INTO topics(topic_id,title,source_name) VALUES('old-flow','原专题','原来源.md');
  41  |       INSERT INTO questions(id,topic_id,question_id,title,tags_json,difficulty,position,archived,current_version_id) VALUES(1,'old-flow','q-1','原题','[]','基础',0,0,NULL);
  42  |       INSERT INTO question_versions VALUES(1,1,1,'原题','原题干','原答案','[]','[]','${'a'.repeat(64)}','2026-10-26T00:00:00.000Z');
  43  |       UPDATE questions SET current_version_id=1;
  44  |       INSERT INTO question_user_state VALUES(1,1,'不熟',1);
  45  |       CREATE TABLE private_flow_notes(note TEXT) STRICT; INSERT INTO private_flow_notes VALUES('用户自定义数据');
  46  |       CREATE INDEX old_flow_index ON practice_sessions(mode);
  47  |       CREATE TRIGGER old_flow_probe AFTER UPDATE ON practice_sessions BEGIN SELECT 1; END;`)
  48  |     const sessionId = randomUUID()
  49  |     db.prepare(
  50  |       "INSERT INTO practice_sessions(id,mode,topic_id,status,position,revision,created_at,filters_json,category_scope_json) VALUES(?,'random','old-flow','active',0,2,'2026-10-26T00:00:00.000Z',?,?)",
  51  |     ).run(sessionId, JSON.stringify(planOptions.filters), '{"kind":"all"}')
  52  |     db.prepare(
  53  |       "INSERT INTO practice_items(session_id,position,question_id,version_id,title,topic_title,tags_json,difficulty,draft,draft_revision) VALUES(?,0,1,1,'原题','原专题','[]','基础',?,3)",
  54  |     ).run(sessionId, '原结构10草稿\r\n    keep();')
  55  |     db.prepare('INSERT INTO practice_plans VALUES(?,?,?)').run(
  56  |       randomUUID(),
  57  |       '原方案',
  58  |       JSON.stringify(planOptions),
  59  |     )
  60  |     expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  61  |     return records(db)
  62  |   } finally {
  63  |     db.close()
  64  |   }
  65  | }
  66  | 
  67  | test('结构10升级前保护备份，原队列/草稿/方案/自定义对象逐行保持，旧备份只在副本迁移', async ({
  68  |   testDataDirectory,
  69  | }, info) => {
  70  |   const before = await seedV10(testDataDirectory)
  71  |   const instance = await launchApplication(testDataDirectory, info.project.name)
  72  |   try {
  73  |     expect((await readAppStatus(instance.page)).ok).toBe(true)
  74  |     expect(withHistoryDatabase(testDataDirectory, records)).toEqual({
  75  |       ...before,
  76  |       practice_sessions: before['practice_sessions']!.map((row) => ({
  77  |         ...row,
  78  |         repeat_source_id: null,
  79  |         repeat_selection: null,
  80  |       })),
  81  |     })
  82  |     expect(
  83  |       withHistoryDatabase(testDataDirectory, (db) => db.prepare('PRAGMA user_version').get()),
  84  |     ).toEqual({ user_version: 11 })
  85  |     const copies = (await readdir(join(testDataDirectory, 'backups'))).filter((name) =>
  86  |       name.startsWith('pre-migration-v10-'),
  87  |     )
  88  |     expect(copies).toHaveLength(1)
  89  |     const backupPath = join(testDataDirectory, 'backups', copies[0]!)
  90  |     const bytes = await readFile(backupPath)
  91  |     const backup = new DatabaseSync(backupPath, { readOnly: true })
  92  |     try {
  93  |       expect(records(backup)).toEqual(before)
  94  |       expect(backup.prepare('PRAGMA user_version').get()).toEqual({ user_version: 10 })
  95  |     } finally {
  96  |       backup.close()
  97  |     }
  98  |     await instance.application.evaluate(({ dialog }, file) => {
  99  |       dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [file] })
  100 |     }, backupPath)
  101 |     expect(
  102 |       await instance.page.evaluate(() =>
  103 |         (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
  104 |       ),
  105 |     ).toMatchObject({
  106 |       ok: true,
  107 |       value: {
  108 |         summary: {
  109 |           schemaVersion: 10,
  110 |           requiresMigration: true,
  111 |           practicePlans: 1,
  112 |           activeSession: true,
  113 |         },
  114 |       },
  115 |     })
  116 |     expect(await readFile(backupPath)).toEqual(bytes)
  117 |     await instance.page.getByRole('button', { name: '继续练习', exact: true }).click()
  118 |     await expect(instance.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  119 |       '原结构10草稿\n    keep();',
  120 |     )
  121 |     await expect(instance.page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
  122 |   } finally {
  123 |     await stop(instance.application)
  124 |   }
  125 | })
  126 | 
  127 | for (const fault of ['backup-blocked', 'column-conflict', 'foreign-key'] as const) {
  128 |   test(`结构10迁移失败${fault}保留原结构与数据，不重建空库`, async ({
  129 |     testDataDirectory,
  130 |   }, info) => {
  131 |     await seedV10(testDataDirectory)
  132 |     if (fault === 'backup-blocked')
  133 |       await writeFile(join(testDataDirectory, 'backups'), '禁止覆盖此文件')
  134 |     else
  135 |       withHistoryDatabase(
  136 |         testDataDirectory,
  137 |         (db) =>
> 138 |           db.exec(
      |              ^ Error: FOREIGN KEY constraint failed
  139 |             fault === 'column-conflict'
  140 |               ? 'ALTER TABLE practice_sessions ADD COLUMN repeat_source_id TEXT'
  141 |               : 'UPDATE questions SET current_version_id=999',
  142 |           ),
  143 |         false,
  144 |       )
  145 |     const before = withHistoryDatabase(testDataDirectory, records)
  146 |     const instance = await launchApplication(testDataDirectory, info.project.name)
  147 |     try {
  148 |       expect(await readAppStatus(instance.page)).toMatchObject({ ok: false })
  149 |       expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
  150 |       expect(
  151 |         withHistoryDatabase(testDataDirectory, (db) => db.prepare('PRAGMA user_version').get()),
  152 |       ).toEqual({ user_version: 10 })
  153 |       if (fault === 'backup-blocked')
  154 |         expect(await readFile(join(testDataDirectory, 'backups'), 'utf8')).toBe('禁止覆盖此文件')
  155 |     } finally {
  156 |       await stop(instance.application)
  157 |     }
  158 |   })
  159 | }
  160 | 
  161 | test('完整备份恢复再练来源/固定旧版本/联合方案与草稿，坏来源拒绝且不覆盖当前数据', async ({
  162 |   testDataDirectory,
  163 | }, info) => {
  164 |   const initial = await prepareFlow(testDataDirectory, info)
  165 |   const opened = [initial.application]
  166 |   const restoredDirectory = await mkdtemp(join(tmpdir(), 'embedded-practice-flow-restore-'))
  167 |   let completed = false
  168 |   try {
  169 |     const source = await finishFlow(initial.page)
  170 |     const planId = randomUUID()
  171 |     expect(
  172 |       await changePlan(initial.page, {
  173 |         kind: 'save',
  174 |         planId,
  175 |         name: '原方案',
  176 |         options: planOptions,
  177 |       }),
  178 |     ).toMatchObject({ ok: true })
  179 |     const options = {
  180 |       ...planOptions,
  181 |       filters: { ...planOptions.filters, mastery: '不会＋不熟' as const },
  182 |     }
  183 |     expect(
  184 |       await changePlan(initial.page, {
  185 |         kind: 'update',
  186 |         planId,
  187 |         name: '联合复习方案',
  188 |         options,
  189 |         expected: { name: '原方案', options: planOptions },
  190 |       }),
  191 |     ).toMatchObject({ ok: true })
  192 |     const started = await startFlow(initial.page, {
  193 |       requestId: randomUUID(),
  194 |       topicId: null,
  195 |       count: 'all',
  196 |       replace: null,
  197 |       repeat: { sessionId: source.session.sessionId, selection: 'weak' },
  198 |     })
  199 |     if (!started.ok) throw new Error(started.error.message)
  200 |     expect(
  201 |       await initial.page.evaluate(
  202 |         (sessionId) =>
  203 |           (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.saveDraft({
  204 |             sessionId,
  205 |             position: 0,
  206 |             draft: { revision: 1, text: '再练独立草稿' },
  207 |           }),
  208 |         started.value.sessionId,
  209 |       ),
  210 |     ).toMatchObject({ ok: true })
  211 |     const before = withHistoryDatabase(testDataDirectory, records)
  212 |     await openPage(initial.page, '备份恢复')
  213 |     const file = info.outputPath('再练完整备份.sqlite3')
  214 |     await initial.application.evaluate(({ dialog }, filePath) => {
  215 |       dialog.showSaveDialog = async () => ({ canceled: false, filePath })
  216 |     }, file)
  217 |     await initial.page.getByRole('button', { name: '导出完整备份', exact: true }).click()
  218 |     await expect(initial.page.getByText('完整备份已导出并校验。', { exact: true })).toBeVisible()
  219 |     const empty = await launchApplication(restoredDirectory, info.project.name, '备份恢复')
  220 |     opened.push(empty.application)
  221 |     const emptyState = historySnapshot(restoredDirectory)
  222 |     const badPath = info.outputPath('坏再练来源.sqlite3')
  223 |     await copyFile(file, badPath)
  224 |     const damaged = new DatabaseSync(badPath)
  225 |     try {
  226 |       damaged.exec(
  227 |         'UPDATE practice_sessions SET repeat_source_id=id WHERE repeat_source_id IS NOT NULL',
  228 |       )
  229 |     } finally {
  230 |       damaged.close()
  231 |     }
  232 |     await empty.application.evaluate(({ dialog }, path) => {
  233 |       dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
  234 |     }, badPath)
  235 |     expect(
  236 |       await empty.page.evaluate(() =>
  237 |         (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
  238 |       ),
```