# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: review-storage.spec.ts >> 复习安排真实事务：幂等/CAS/完成与重开、到期分页、写失败回滚及归档重导入保持
- Location: tests\e2e\review-storage.spec.ts:127:5

# Error details

```
Error: expect(received).toMatchObject(expected)

Matcher error: received value must be a non-null object

Received has value: undefined
```

# Test source

```ts
  108 |       expect(backups).toHaveLength(1)
  109 |       const db = new DatabaseSync(join(testDataDirectory, 'backups', backups[0]!), {
  110 |         readOnly: true,
  111 |       })
  112 |       try {
  113 |         expect(controlRecords(db)).toEqual(before)
  114 |         expect(db.prepare('PRAGMA user_version').get()).toEqual({ user_version: 14 })
  115 |         expect(
  116 |           db.prepare("SELECT name FROM sqlite_schema WHERE name='private_review_index'").get(),
  117 |         ).toEqual({ name: 'private_review_index' })
  118 |       } finally {
  119 |         db.close()
  120 |       }
  121 |     } finally {
  122 |       await stop(application)
  123 |     }
  124 |   })
  125 | }
  126 | 
  127 | test('复习安排真实事务：幂等/CAS/完成与重开、到期分页、写失败回滚及归档重导入保持', async ({
  128 |   testDataDirectory,
  129 | }, info) => {
  130 |   const { application, page, file } = await prepareControl(testDataDirectory, info)
  131 |   try {
  132 |     expect(await readReview(page)).toEqual({ ok: true, value: null })
  133 |     expect(
  134 |       await saveReview(page, {
  135 |         ...a(1),
  136 |         expectedRevision: 0,
  137 |         state: 'done',
  138 |         dueDate: null,
  139 |         reason: '',
  140 |       }),
  141 |     ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } })
  142 |     const original = await arrangeReview(page, a(1), '2000-01-01')
  143 |     const command = {
  144 |       ...a(1),
  145 |       expectedRevision: 1,
  146 |       state: 'done' as const,
  147 |       dueDate: '2000-01-01',
  148 |       reason: '明确完成',
  149 |     }
  150 |     const completed = await saveReview(page, command)
  151 |     expect(completed).toMatchObject({
  152 |       ok: true,
  153 |       value: { revision: 2, state: 'done', reason: '明确完成' },
  154 |     })
  155 |     expect(await saveReview(page, command)).toEqual(completed)
  156 |     expect(await saveReview(page, { ...command, reason: '旧修订不能覆盖' })).toMatchObject({
  157 |       ok: false,
  158 |       error: { code: 'CONFLICT' },
  159 |     })
  160 |     if (!completed.ok) throw new Error('完成失败')
  161 |     const updated = await saveReview(page, {
  162 |       ...command,
  163 |       expectedRevision: 2,
  164 |       reason: '完成后补充',
  165 |     })
  166 |     expect(updated).toMatchObject({
  167 |       ok: true,
  168 |       value: { revision: 3, completedAt: completed.value.completedAt },
  169 |     })
  170 |     expect(
  171 |       await saveReview(page, {
  172 |         ...command,
  173 |         expectedRevision: 3,
  174 |         state: 'pending',
  175 |         reason: '延期',
  176 |         dueDate: '2099-01-01',
  177 |       }),
  178 |     ).toMatchObject({ ok: true, value: { revision: 4, completedAt: null } })
  179 |     for (let n = 2; n <= 27; n++) await arrangeReview(page, a(n), n % 2 === 0 ? '2000-01-01' : null)
  180 |     const due = await listReviews(page, { due: 'due' }),
  181 |       undated = await listReviews(page, { due: 'undated' })
  182 |     expect(due.total).toBe(13)
  183 |     expect(undated.total).toBe(13)
  184 |     expect((await listReviews(page, { page: 1 })).items).toHaveLength(20)
  185 |     expect(await listReviews(page, { page: 99 })).toMatchObject({ page: 2, total: 27 })
  186 |     const before = withHistoryDatabase(testDataDirectory, controlRecords)
  187 |     withHistoryDatabase(
  188 |       testDataDirectory,
  189 |       (db) =>
  190 |         db.exec(
  191 |           "CREATE TRIGGER fail_review BEFORE UPDATE ON review_todos BEGIN SELECT RAISE(ABORT,'injected review write'); END",
  192 |         ),
  193 |       false,
  194 |     )
  195 |     expect(
  196 |       await saveReview(page, { ...command, expectedRevision: 4, reason: '不能写入' }),
  197 |     ).toMatchObject({ ok: false, error: { code: 'DATABASE_UNAVAILABLE' } })
  198 |     expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
  199 |     withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER fail_review'), false)
  200 |     await writeFile(file, controlBank('control-a', 27, true, 1))
  201 |     await importHistoryFiles(application, page, [file])
  202 |     expect(await readReview(page)).toMatchObject({
  203 |       ok: true,
  204 |       value: { revision: 4, state: 'pending', reason: '延期' },
  205 |     })
  206 |     expect(
  207 |       (await listReviews(page, { page: 2 })).items.find((item) => item.questionId === 'q-1'),
> 208 |     ).toMatchObject({ archived: true })
      |       ^ Error: expect(received).toMatchObject(expected)
  209 |     await writeFile(file, controlBank('control-a'))
  210 |     await importHistoryFiles(application, page, [file])
  211 |     expect(await readReview(page)).toMatchObject({
  212 |       ok: true,
  213 |       value: { revision: 4, reason: '延期' },
  214 |     })
  215 |     expect(original.completedAt).toBeNull()
  216 |   } finally {
  217 |     await stop(application)
  218 |   }
  219 | })
  220 | 
  221 | test('完整备份恢复待办与最近条件，拒绝日期/完成状态/重复/孤儿损坏，源字节保持', async ({
  222 |   testDataDirectory,
  223 | }, info) => {
  224 |   const initial = await prepareControl(testDataDirectory, info, 3)
  225 |   const destination = await mkdtemp(join(tmpdir(), 'embedded-practice-review-restore-'))
  226 |   const opened: ElectronApplication[] = [initial.application]
  227 |   try {
  228 |     await arrangeReview(initial.page, a(1), '2000-01-01')
  229 |     await arrangeReview(initial.page, b(2))
  230 |     expect(
  231 |       await saveReview(initial.page, {
  232 |         ...b(2),
  233 |         expectedRevision: 1,
  234 |         state: 'done',
  235 |         dueDate: null,
  236 |         reason: '已明确完成',
  237 |       }),
  238 |     ).toMatchObject({ ok: true })
  239 |     const planId = randomUUID()
  240 |     expect(
  241 |       await initial.page.evaluate(
  242 |         ({ planId }) =>
  243 |           (globalThis as unknown as { desktop: DesktopApi }).desktop.practicePlans.change({
  244 |             kind: 'save',
  245 |             planId,
  246 |             name: '最近未练方案',
  247 |             options: {
  248 |               topicId: null,
  249 |               category: { kind: 'all' },
  250 |               count: 10,
  251 |               mode: 'random',
  252 |               filters: {
  253 |                 query: '',
  254 |                 tag: null,
  255 |                 difficulty: null,
  256 |                 mastery: 'all',
  257 |                 favoritesOnly: false,
  258 |                 practiceRecency: '7d',
  259 |                 practiceOrder: 'oldest',
  260 |               },
  261 |             },
  262 |           }),
  263 |         { planId },
  264 |       ),
  265 |     ).toMatchObject({ ok: true })
  266 |     const before = withHistoryDatabase(testDataDirectory, controlRecords),
  267 |       file = info.outputPath('review-todos.sqlite3')
  268 |     await initial.application.evaluate(({ dialog }, filePath) => {
  269 |       dialog.showSaveDialog = async () => ({ canceled: false, filePath })
  270 |     }, file)
  271 |     await openPage(initial.page, '备份恢复')
  272 |     await initial.page.getByRole('button', { name: '导出完整备份', exact: true }).click()
  273 |     await expect(initial.page.getByText('完整备份已导出并校验。', { exact: true })).toBeVisible()
  274 |     const bytes = await readFile(file)
  275 |     const empty = await launchApplication(destination, info.project.name, '备份恢复')
  276 |     opened.push(empty.application)
  277 |     const unchanged = withHistoryDatabase(destination, controlRecords)
  278 |     for (const [kind, sql] of [
  279 |       ['date', "UPDATE review_todos SET due_date='2026-02-30'"],
  280 |       [
  281 |         'completion',
  282 |         "PRAGMA ignore_check_constraints=ON; UPDATE review_todos SET completed_at=NULL WHERE state='done'",
  283 |       ],
  284 |       ['revision', 'PRAGMA ignore_check_constraints=ON; UPDATE review_todos SET revision=0'],
  285 |       [
  286 |         'reason',
  287 |         "PRAGMA ignore_check_constraints=ON; UPDATE review_todos SET reason=replace(hex(zeroblob(251)),'0','a')",
  288 |       ],
  289 |       [
  290 |         'duplicate',
  291 |         'ALTER TABLE review_todos RENAME TO copied_reviews; CREATE TABLE review_todos AS SELECT * FROM copied_reviews; INSERT INTO review_todos SELECT * FROM copied_reviews; DROP TABLE copied_reviews',
  292 |       ],
  293 |       [
  294 |         'orphan',
  295 |         'PRAGMA foreign_keys=OFF; UPDATE review_todos SET question_id=99999 WHERE question_id=(SELECT min(question_id) FROM review_todos)',
  296 |       ],
  297 |     ]) {
  298 |       const damaged = info.outputPath(`review-damaged-${kind}.sqlite3`)
  299 |       await copyFile(file, damaged)
  300 |       const db = new DatabaseSync(damaged)
  301 |       try {
  302 |         db.exec(sql!)
  303 |       } finally {
  304 |         db.close()
  305 |       }
  306 |       const damagedBytes = await readFile(damaged)
  307 |       await empty.application.evaluate(({ dialog }, path) => {
  308 |         dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
```