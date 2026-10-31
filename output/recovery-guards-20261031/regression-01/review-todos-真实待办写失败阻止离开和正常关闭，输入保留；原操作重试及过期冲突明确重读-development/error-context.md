# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: review-todos.spec.ts >> 真实待办写失败阻止离开和正常关闭，输入保留；原操作重试及过期冲突明确重读
- Location: tests\e2e\review-todos.spec.ts:74:5

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  getByRole('navigation', { name: '主要页面', exact: true }).getByRole('link', { name: '学习总览', exact: true })
Expected: "true"
Received: "false"
Timeout:  10000ms

Call log:
  - Expect "toHaveAttribute" getByRole('navigation', { name: '主要页面', exact: true }).getByRole('link', { name: '学习总览', exact: true }) with timeout 10000ms
  - waiting for getByRole('navigation', { name: '主要页面', exact: true }).getByRole('link', { name: '学习总览', exact: true })
    23 × locator resolved to <a title="学习总览" href="#overview" aria-label="学习总览" aria-disabled="false">…</a>
       - unexpected value "false"

```

```yaml
- link "学习总览":
  - /url: "#overview"
```

# Test source

```ts
  3   | import { localDateString, reviewPresetDate } from '../../src/shared/contracts/review-todos'
  4   | import { expect, launchApplication, openPage, test } from './helpers'
  5   | import { captureHistory, importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
  6   | import { a, b, controlBank, prepareControl } from './practice-control-helpers'
  7   | import {
  8   |   arrangeReview,
  9   |   listReviews,
  10  |   openLibraryReview,
  11  |   openReviewEditor,
  12  |   readReview,
  13  | } from './review-helpers'
  14  | import { closeNormally, createStudyRound } from './study-helpers'
  15  | import { chooseTheme } from './theme-helpers'
  16  | 
  17  | test('题目复习安排：明确加入、日期快捷操作和原因自动保存，完成/重开与正常关闭重读', async ({
  18  |   testDataDirectory,
  19  | }, info) => {
  20  |   const initial = await prepareControl(testDataDirectory, info, 3)
  21  |   let reopened: Awaited<ReturnType<typeof launchApplication>> | undefined
  22  |   try {
  23  |     const editor = await openLibraryReview(initial.page)
  24  |     expect(await readReview(initial.page)).toEqual({ ok: true, value: null })
  25  |     await editor.getByRole('button', { name: '加入待复习', exact: true }).click()
  26  |     await expect(editor.getByText('复习安排已保存。', { exact: true })).toBeVisible()
  27  |     await editor.getByRole('button', { name: '明天复习', exact: true }).click()
  28  |     await expect(editor.getByLabel('复习日期', { exact: true })).toHaveValue(
  29  |       reviewPresetDate('tomorrow'),
  30  |     )
  31  |     await editor
  32  |       .getByRole('textbox', { name: '复习原因', exact: true })
  33  |       .fill('再口述TC与DMA完成的区别')
  34  |     await expect
  35  |       .poll(() => readReview(initial.page))
  36  |       .toMatchObject({
  37  |         ok: true,
  38  |         value: {
  39  |           state: 'pending',
  40  |           dueDate: reviewPresetDate('tomorrow'),
  41  |           reason: '再口述TC与DMA完成的区别',
  42  |         },
  43  |       })
  44  |     await editor.getByRole('button', { name: '本周末复习', exact: true }).click()
  45  |     await expect
  46  |       .poll(() => readReview(initial.page))
  47  |       .toMatchObject({ ok: true, value: { dueDate: reviewPresetDate('weekend') } })
  48  |     await editor.getByRole('button', { name: '不设复习日期', exact: true }).click()
  49  |     await expect
  50  |       .poll(() => readReview(initial.page))
  51  |       .toMatchObject({ ok: true, value: { dueDate: null } })
  52  |     await editor.getByRole('button', { name: '完成这条待办', exact: true }).click()
  53  |     await expect(editor.getByText('待办已完成。', { exact: true })).toBeVisible()
  54  |     expect((await listReviews(initial.page, { state: 'done' })).total).toBe(1)
  55  |     await editor.getByRole('button', { name: '重新加入待复习', exact: true }).click()
  56  |     await expect(editor.getByText('复习安排已保存。', { exact: true })).toBeVisible()
  57  |     await editor
  58  |       .getByRole('textbox', { name: '复习原因', exact: true })
  59  |       .fill('关闭前尚未等500ms的原因')
  60  |     await closeNormally(initial.application)
  61  |     reopened = await launchApplication(testDataDirectory, info.project.name)
  62  |     expect(await readReview(reopened.page)).toMatchObject({
  63  |       ok: true,
  64  |       value: { state: 'pending', completedAt: null, reason: '关闭前尚未等500ms的原因' },
  65  |     })
  66  |     await openLibraryReview(reopened.page)
  67  |     await captureHistory(reopened.application, reopened.page, info, 'review-editor-saved.png')
  68  |   } finally {
  69  |     await stop(initial.application)
  70  |     if (reopened) await stop(reopened.application)
  71  |   }
  72  | })
  73  | 
  74  | test('真实待办写失败阻止离开和正常关闭，输入保留；原操作重试及过期冲突明确重读', async ({
  75  |   testDataDirectory,
  76  | }, info) => {
  77  |   const { application, page } = await prepareControl(testDataDirectory, info, 3)
  78  |   try {
  79  |     await arrangeReview(page)
  80  |     const editor = await openLibraryReview(page),
  81  |       text = editor.getByRole('textbox', { name: '复习原因', exact: true })
  82  |     await application.evaluate(({ dialog }) => {
  83  |       dialog.showMessageBox = async () => {
  84  |         Reflect.set(globalThis, '__reviewCloseRejected', true)
  85  |         return { response: 0, checkboxChecked: false }
  86  |       }
  87  |     })
  88  |     withHistoryDatabase(
  89  |       testDataDirectory,
  90  |       (db) =>
  91  |         db.exec(
  92  |           "CREATE TRIGGER fail_review_ui BEFORE UPDATE ON review_todos BEGIN SELECT RAISE(ABORT,'review ui failure'); END",
  93  |         ),
  94  |       false,
  95  |     )
  96  |     await text.fill('保存失败仍须保留的原因')
  97  |     await expect(editor.getByRole('alert')).toBeVisible()
  98  |     await expect(text).toHaveValue('保存失败仍须保留的原因')
  99  |     await expect(
  100 |       page
  101 |         .getByRole('navigation', { name: '主要页面', exact: true })
  102 |         .getByRole('link', { name: '学习总览', exact: true }),
> 103 |     ).toHaveAttribute('aria-disabled', 'true')
      |       ^ Error: expect(locator).toHaveAttribute(expected) failed
  104 |     await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.close())
  105 |     await expect
  106 |       .poll(() => application.evaluate(() => Reflect.get(globalThis, '__reviewCloseRejected')))
  107 |       .toBe(true)
  108 |     expect(application.windows()).toHaveLength(1)
  109 |     expect(await readReview(page)).toMatchObject({ ok: true, value: { revision: 1 } })
  110 |     await captureHistory(application, page, info, 'review-save-failed.png')
  111 |     withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER fail_review_ui'), false)
  112 |     await editor.getByRole('button', { name: '重试原待办保存', exact: true }).click()
  113 |     await expect(text).toBeEditable()
  114 |     expect(await readReview(page)).toMatchObject({
  115 |       ok: true,
  116 |       value: { revision: 2, reason: '保存失败仍须保留的原因' },
  117 |     })
  118 |     expect(
  119 |       await page.evaluate(async () => {
  120 |         const api = (globalThis as unknown as { desktop: DesktopApi }).desktop.reviewTodos
  121 |         return api.save({
  122 |           ...{ topicId: 'control-a', questionId: 'q-1' },
  123 |           expectedRevision: 2,
  124 |           state: 'pending',
  125 |           dueDate: null,
  126 |           reason: '另一编辑器的新安排',
  127 |         })
  128 |       }),
  129 |     ).toMatchObject({ ok: true })
  130 |     await text.fill('本地较旧编辑器的输入')
  131 |     await expect(editor.getByRole('alert')).toContainText('复习安排已变化')
  132 |     await expect(text).toHaveValue('本地较旧编辑器的输入')
  133 |     await editor.getByRole('button', { name: '重新读取复习安排', exact: true }).click()
  134 |     await editor.getByRole('button', { name: '保留当前安排', exact: true }).click()
  135 |     await expect(text).toHaveValue('本地较旧编辑器的输入')
  136 |     await editor.getByRole('button', { name: '重新读取复习安排', exact: true }).click()
  137 |     await editor.getByRole('button', { name: '放弃本地修改并读取安排', exact: true }).click()
  138 |     await expect(text).toHaveValue('另一编辑器的新安排')
  139 |     await expect(text).toBeEditable()
  140 |   } finally {
  141 |     await stop(application)
  142 |   }
  143 | })
  144 | 
  145 | test('真实提交后坏响应原操作重试不重复；独立作答前不读取/展示旧原因，揭晓和练习不会完成待办', async ({
  146 |   testDataDirectory,
  147 | }, info) => {
  148 |   const { application, page } = await prepareControl(testDataDirectory, info, 3)
  149 |   try {
  150 |     await application.evaluate(({ ipcMain }) => {
  151 |       const handlers = Reflect.get(ipcMain, '_invokeHandlers'),
  152 |         save = handlers.get('review:save'),
  153 |         read = handlers.get('review:read')
  154 |       Reflect.set(globalThis, '__reviewCommands', [])
  155 |       Reflect.set(globalThis, '__reviewReads', 0)
  156 |       ipcMain.removeHandler('review:save')
  157 |       ipcMain.handle('review:save', async (event, input) => {
  158 |         const commands = Reflect.get(globalThis, '__reviewCommands')
  159 |         commands.push(input)
  160 |         const result = await save(event, input)
  161 |         return commands.length === 1 ? { invalid: true } : result
  162 |       })
  163 |       ipcMain.removeHandler('review:read')
  164 |       ipcMain.handle('review:read', (event, input) => {
  165 |         Reflect.set(globalThis, '__reviewReads', Reflect.get(globalThis, '__reviewReads') + 1)
  166 |         return read(event, input)
  167 |       })
  168 |     })
  169 |     const editor = await openLibraryReview(page)
  170 |     await editor
  171 |       .getByRole('textbox', { name: '复习原因', exact: true })
  172 |       .fill('PRIVATE-REVIEW-REASON-TC-DMA')
  173 |     await expect(editor.getByRole('alert')).toContainText('尚未确认')
  174 |     await editor.getByRole('button', { name: '重试原待办保存', exact: true }).click()
  175 |     await expect(editor.getByText('复习安排已保存。', { exact: true })).toBeVisible()
  176 |     const commands = await application.evaluate(() => Reflect.get(globalThis, '__reviewCommands'))
  177 |     expect(commands).toHaveLength(2)
  178 |     expect(commands[1]).toEqual(commands[0])
  179 |     expect(await readReview(page)).toMatchObject({ ok: true, value: { revision: 1 } })
  180 |     await openPage(page, '开始练习')
  181 |     await page.getByLabel('练习专题', { exact: true }).selectOption('control-a')
  182 |     await page.getByLabel('本轮题数', { exact: true }).selectOption('all')
  183 |     const reads = await application.evaluate(() => Reflect.get(globalThis, '__reviewReads'))
  184 |     await page.getByRole('button', { name: '开始练习', exact: true }).click()
  185 |     await expect(page.locator('.practice-reference-column .review-editor')).toHaveCount(0)
  186 |     await expect(page.getByText('PRIVATE-REVIEW-REASON-TC-DMA', { exact: true })).toHaveCount(0)
  187 |     expect(await application.evaluate(() => Reflect.get(globalThis, '__reviewReads'))).toBe(reads)
  188 |     await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  189 |     const revealed = page.locator('.practice-reference-column .review-editor')
  190 |     await expect(revealed).not.toHaveAttribute('open')
  191 |     expect(await application.evaluate(() => Reflect.get(globalThis, '__reviewReads'))).toBe(reads)
  192 |     await openReviewEditor(revealed)
  193 |     await expect(revealed.getByRole('textbox', { name: '复习原因', exact: true })).toHaveValue(
  194 |       'PRIVATE-REVIEW-REASON-TC-DMA',
  195 |     )
  196 |     expect(await readReview(page)).toMatchObject({
  197 |       ok: true,
  198 |       value: { state: 'pending', completedAt: null, revision: 1 },
  199 |     })
  200 |     await revealed
  201 |       .getByRole('textbox', { name: '复习原因', exact: true })
  202 |       .fill('自评切题前保存，仍保留待办')
  203 |     await page.getByRole('button', { name: '掌握', exact: true }).click()
```