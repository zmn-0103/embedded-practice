# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: practice-control-storage.spec.ts >> 完整备份恢复题单顺序/失效身份/固定版本/来源与草稿，坏题单拒绝且不改当前库
- Location: tests\e2e\practice-control-storage.spec.ts:170:5

# Error details

```
Error: UNIQUE constraint failed: question_set_items.set_id, question_set_items.position
```

# Test source

```ts
  142 |                 : 'PRAGMA foreign_keys=OFF; UPDATE questions SET current_version_id=999',
  143 |           ),
  144 |         false,
  145 |       )
  146 |     const before = withHistoryDatabase(testDataDirectory, controlRecords)
  147 |     const objects = withHistoryDatabase(testDataDirectory, (db) =>
  148 |       db.prepare('SELECT name,sql FROM sqlite_schema ORDER BY rowid').all(),
  149 |     )
  150 |     const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  151 |     try {
  152 |       expect(await readAppStatus(page)).toMatchObject({ ok: false })
  153 |       expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
  154 |       expect(
  155 |         withHistoryDatabase(testDataDirectory, (db) =>
  156 |           db.prepare('SELECT name,sql FROM sqlite_schema ORDER BY rowid').all(),
  157 |         ),
  158 |       ).toEqual(objects)
  159 |       expect(
  160 |         withHistoryDatabase(testDataDirectory, (db) => db.prepare('PRAGMA user_version').get()),
  161 |       ).toEqual({ user_version: 11 })
  162 |       if (fault === 'backup-blocked')
  163 |         expect(await readFile(join(testDataDirectory, 'backups'), 'utf8')).toBe('不覆盖此文件')
  164 |     } finally {
  165 |       await stop(application)
  166 |     }
  167 |   })
  168 | }
  169 | 
  170 | test('完整备份恢复题单顺序/失效身份/固定版本/来源与草稿，坏题单拒绝且不改当前库', async ({
  171 |   testDataDirectory,
  172 | }, info) => {
  173 |   const initial = await prepareControl(testDataDirectory, info)
  174 |   const opened = [initial.application],
  175 |     destination = await mkdtemp(join(tmpdir(), 'embedded-practice-control-restore-'))
  176 |   let completed = false
  177 |   try {
  178 |     const definition = { setId: randomUUID(), name: '复盘指定题', items: [b(1), a(2)] }
  179 |     const missing = { setId: randomUUID(), name: '保留失效', items: [a(3)] }
  180 |     for (const set of [definition, missing])
  181 |       expect(await changeSet(initial.page, { kind: 'save', ...set })).toMatchObject({ ok: true })
  182 |     withHistoryDatabase(
  183 |       testDataDirectory,
  184 |       (db) =>
  185 |         db
  186 |           .prepare('UPDATE question_set_items SET question_id=? WHERE set_id=?')
  187 |           .run('q-missing', missing.setId),
  188 |       false,
  189 |     )
  190 |     const selected = await selectForPractice(initial.page, definition.items, '题单：复盘指定题')
  191 |     const started = await startFlow(initial.page, {
  192 |       requestId: randomUUID(),
  193 |       topicId: null,
  194 |       count: 'all',
  195 |       replace: null,
  196 |       selected,
  197 |     })
  198 |     if (!started.ok) throw new Error(started.error.message)
  199 |     expect(
  200 |       await initial.page.evaluate(
  201 |         (sessionId) =>
  202 |           (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.saveDraft({
  203 |             sessionId,
  204 |             position: 0,
  205 |             draft: { revision: 1, text: '指定题的个人回答\n  saved();' },
  206 |           }),
  207 |         started.value.sessionId,
  208 |       ),
  209 |     ).toMatchObject({ ok: true })
  210 |     const before = withHistoryDatabase(testDataDirectory, controlRecords)
  211 |     const file = info.outputPath('题单完整备份.sqlite3')
  212 |     await openPage(initial.page, '备份恢复')
  213 |     await initial.application.evaluate(({ dialog }, filePath) => {
  214 |       dialog.showSaveDialog = async () => ({ canceled: false, filePath })
  215 |     }, file)
  216 |     await initial.page.getByRole('button', { name: '导出完整备份', exact: true }).click()
  217 |     await expect(initial.page.getByText('完整备份已导出并校验。', { exact: true })).toBeVisible()
  218 |     const originalBytes = await readFile(file)
  219 |     const empty = await launchApplication(destination, info.project.name, '备份恢复')
  220 |     opened.push(empty.application)
  221 |     const emptyState = withHistoryDatabase(destination, controlRecords)
  222 |     for (const [kind, sql] of [
  223 |       ['gap', 'UPDATE question_set_items SET position=position+10'],
  224 |       ['orphan', `PRAGMA foreign_keys=OFF; UPDATE question_set_items SET set_id='${randomUUID()}'`],
  225 |       [
  226 |         'name',
  227 |         "PRAGMA ignore_check_constraints=ON; UPDATE question_sets SET name='换' || char(10) || '行' WHERE rowid=1",
  228 |       ],
  229 |       [
  230 |         'duplicate-name',
  231 |         "PRAGMA foreign_keys=OFF; CREATE TABLE copied_sets AS SELECT * FROM question_sets; DROP TABLE question_sets; CREATE TABLE question_sets(set_id TEXT,name TEXT) STRICT; INSERT INTO question_sets SELECT * FROM copied_sets; UPDATE question_sets SET name='same'; DROP TABLE copied_sets",
  232 |       ],
  233 |       [
  234 |         'duplicate-member',
  235 |         'PRAGMA foreign_keys=OFF; CREATE TABLE copied_items AS SELECT * FROM question_set_items; DROP TABLE question_set_items; CREATE TABLE question_set_items(set_id TEXT,position INTEGER,topic_id TEXT,question_id TEXT) STRICT; INSERT INTO question_set_items SELECT * FROM copied_items; INSERT INTO question_set_items SELECT set_id,position+20,topic_id,question_id FROM copied_items; DROP TABLE copied_items',
  236 |       ],
  237 |     ]) {
  238 |       const damaged = info.outputPath(`坏题单-${kind}.sqlite3`)
  239 |       await copyFile(file, damaged)
  240 |       const db = new DatabaseSync(damaged)
  241 |       try {
> 242 |         db.exec(sql!)
      |            ^ Error: UNIQUE constraint failed: question_set_items.set_id, question_set_items.position
  243 |       } finally {
  244 |         db.close()
  245 |       }
  246 |       await empty.application.evaluate(({ dialog }, path) => {
  247 |         dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
  248 |       }, damaged)
  249 |       expect(
  250 |         await empty.page.evaluate(() =>
  251 |           (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
  252 |         ),
  253 |       ).toMatchObject({ ok: false, error: { code: 'INVALID_BACKUP' } })
  254 |       expect(withHistoryDatabase(destination, controlRecords)).toEqual(emptyState)
  255 |     }
  256 |     expect(await readFile(file)).toEqual(originalBytes)
  257 |     await empty.application.evaluate(({ app, dialog }, path) => {
  258 |       dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
  259 |       dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false })
  260 |       app.relaunch = () => {}
  261 |     }, file)
  262 |     await empty.page.getByRole('button', { name: '选择备份并预览', exact: true }).click()
  263 |     await expect(empty.page.getByLabel('恢复预览摘要', { exact: true })).toContainText('固定题单')
  264 |     const exiting = empty.application.waitForEvent('close')
  265 |     await empty.page.getByRole('button', { name: '恢复此备份…', exact: true }).click()
  266 |     await exiting
  267 |     const restored = await launchApplication(destination, info.project.name)
  268 |     opened.push(restored.application)
  269 |     expect(withHistoryDatabase(destination, controlRecords)).toEqual(before)
  270 |     expect((await previewSet(restored.page, { setId: definition.setId })).definition).toEqual(
  271 |       definition,
  272 |     )
  273 |     expect((await previewSet(restored.page, { setId: missing.setId })).items[0]?.status).toBe(
  274 |       'missing',
  275 |     )
  276 |     await restored.page.getByRole('button', { name: '继续练习', exact: true }).click()
  277 |     await expect(restored.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  278 |       '指定题的个人回答\n  saved();',
  279 |     )
  280 |     await expect(restored.page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
  281 |     completed = true
  282 |   } finally {
  283 |     for (const app of opened) await stop(app)
  284 |     if (
  285 |       dirname(resolve(destination)) !== resolve(tmpdir()) ||
  286 |       !basename(destination).startsWith('embedded-practice-control-restore-')
  287 |     )
  288 |       throw new Error('拒绝清理非本次恢复目录')
  289 |     if (completed)
  290 |       await rm(destination, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  291 |     else
  292 |       await info.attach('control-restore-failed-directory', {
  293 |         body: destination,
  294 |         contentType: 'text/plain',
  295 |       })
  296 |   }
  297 | })
  298 | 
```