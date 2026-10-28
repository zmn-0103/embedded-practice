# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: practice-control-storage.spec.ts >> 完整备份恢复题单顺序/失效身份/固定版本/来源与草稿，坏题单拒绝且不改当前库
- Location: tests\e2e\practice-control-storage.spec.ts:170:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: electronApplication.waitForEvent: Timeout 30000ms exceeded while waiting for event "close"
```

# Test source

```ts
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
  224 |       [
  225 |         'orphan',
  226 |         `PRAGMA foreign_keys=OFF; UPDATE question_set_items SET set_id='${randomUUID()}' WHERE set_id='${definition.setId}'`,
  227 |       ],
  228 |       [
  229 |         'name',
  230 |         "PRAGMA ignore_check_constraints=ON; UPDATE question_sets SET name='换' || char(10) || '行' WHERE rowid=1",
  231 |       ],
  232 |       [
  233 |         'duplicate-name',
  234 |         "PRAGMA foreign_keys=OFF; CREATE TABLE copied_sets AS SELECT * FROM question_sets; DROP TABLE question_sets; CREATE TABLE question_sets(set_id TEXT,name TEXT) STRICT; INSERT INTO question_sets SELECT * FROM copied_sets; UPDATE question_sets SET name='same'; DROP TABLE copied_sets",
  235 |       ],
  236 |       [
  237 |         'duplicate-member',
  238 |         'PRAGMA foreign_keys=OFF; CREATE TABLE copied_items AS SELECT * FROM question_set_items; DROP TABLE question_set_items; CREATE TABLE question_set_items(set_id TEXT,position INTEGER,topic_id TEXT,question_id TEXT) STRICT; INSERT INTO question_set_items SELECT * FROM copied_items; INSERT INTO question_set_items SELECT set_id,position+20,topic_id,question_id FROM copied_items; DROP TABLE copied_items',
  239 |       ],
  240 |     ]) {
  241 |       const damaged = info.outputPath(`坏题单-${kind}.sqlite3`)
  242 |       await copyFile(file, damaged)
  243 |       const db = new DatabaseSync(damaged)
  244 |       try {
  245 |         db.exec(sql!)
  246 |       } finally {
  247 |         db.close()
  248 |       }
  249 |       await empty.application.evaluate(({ dialog }, path) => {
  250 |         dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
  251 |       }, damaged)
  252 |       expect(
  253 |         await empty.page.evaluate(() =>
  254 |           (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
  255 |         ),
  256 |       ).toMatchObject({ ok: false, error: { code: 'INVALID_BACKUP' } })
  257 |       expect(withHistoryDatabase(destination, controlRecords)).toEqual(emptyState)
  258 |     }
  259 |     expect(await readFile(file)).toEqual(originalBytes)
  260 |     await empty.application.evaluate(({ app, dialog }, path) => {
  261 |       dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
  262 |       dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false })
  263 |       app.relaunch = () => {}
  264 |     }, file)
  265 |     await empty.page.getByRole('button', { name: '选择备份并预览', exact: true }).click()
  266 |     await expect(empty.page.getByLabel('恢复预览摘要', { exact: true })).toContainText('固定题单')
> 267 |     const exiting = empty.application.waitForEvent('close')
      |                                       ^ TimeoutError: electronApplication.waitForEvent: Timeout 30000ms exceeded while waiting for event "close"
  268 |     await empty.page.getByRole('button', { name: '恢复此备份…', exact: true }).click()
  269 |     await exiting
  270 |     const restored = await launchApplication(destination, info.project.name)
  271 |     opened.push(restored.application)
  272 |     expect(withHistoryDatabase(destination, controlRecords)).toEqual(before)
  273 |     expect((await previewSet(restored.page, { setId: definition.setId })).definition).toEqual(
  274 |       definition,
  275 |     )
  276 |     expect((await previewSet(restored.page, { setId: missing.setId })).items[0]?.status).toBe(
  277 |       'missing',
  278 |     )
  279 |     await restored.page.getByRole('button', { name: '继续练习', exact: true }).click()
  280 |     await expect(restored.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  281 |       '指定题的个人回答\n  saved();',
  282 |     )
  283 |     await expect(restored.page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
  284 |     completed = true
  285 |   } finally {
  286 |     for (const app of opened) await stop(app)
  287 |     if (
  288 |       dirname(resolve(destination)) !== resolve(tmpdir()) ||
  289 |       !basename(destination).startsWith('embedded-practice-control-restore-')
  290 |     )
  291 |       throw new Error('拒绝清理非本次恢复目录')
  292 |     if (completed)
  293 |       await rm(destination, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  294 |     else
  295 |       await info.attach('control-restore-failed-directory', {
  296 |         body: destination,
  297 |         contentType: 'text/plain',
  298 |       })
  299 |   }
  300 | })
  301 | 
```