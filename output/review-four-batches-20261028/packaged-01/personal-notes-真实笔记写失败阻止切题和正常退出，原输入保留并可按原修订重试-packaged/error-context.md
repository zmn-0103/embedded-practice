# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: personal-notes.spec.ts >> 真实笔记写失败阻止切题和正常退出，原输入保留并可按原修订重试
- Location: tests\e2e\personal-notes.spec.ts:146:5

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator:  getByLabel('题目内容').locator('.personal-note').getByRole('textbox', { name: '我的复习笔记', exact: true })
Expected: "失败仍保留的笔记"
Received: "失败仍保留的笔记e"
Timeout:  10000ms

Call log:
  - Expect "toHaveValue" getByLabel('题目内容').locator('.personal-note').getByRole('textbox', { name: '我的复习笔记', exact: true }) with timeout 10000ms
  - waiting for getByLabel('题目内容').locator('.personal-note').getByRole('textbox', { name: '我的复习笔记', exact: true })
    24 × locator resolved to <textarea rows="6" readonly aria-label="我的复习笔记" maxlength="1048576">失败仍保留的笔记e</textarea>
       - unexpected value "失败仍保留的笔记e"

```

```yaml
- textbox "我的复习笔记": 失败仍保留的笔记e
```

# Test source

```ts
  67  | 
  68  | test('笔记主动读取，独立作答揭晓前零请求，跨页同步/切题/正常重开保留', async ({
  69  |   testDataDirectory,
  70  | }, info) => {
  71  |   const prepared = await prepareStudy(testDataDirectory, info)
  72  |   let instance = { application: prepared.application, page: prepared.page }
  73  |   try {
  74  |     await instance.application.evaluate(({ ipcMain }) => {
  75  |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('study:read-note')
  76  |       Reflect.set(globalThis, '__noteReads', 0)
  77  |       ipcMain.removeHandler('study:read-note')
  78  |       ipcMain.handle('study:read-note', (event, input) => {
  79  |         Reflect.set(globalThis, '__noteReads', Reflect.get(globalThis, '__noteReads') + 1)
  80  |         return original(event, input)
  81  |       })
  82  |     })
  83  |     expect(await instance.application.evaluate(() => Reflect.get(globalThis, '__noteReads'))).toBe(
  84  |       0,
  85  |     )
  86  |     const note = await openLibraryNote(instance.page)
  87  |     await note
  88  |       .getByRole('textbox', { name: '我的复习笔记', exact: true })
  89  |       .fill('OLD-PERSONAL-NOTE\n  explain();')
  90  |     await expect
  91  |       .poll(() =>
  92  |         withHistoryDatabase(testDataDirectory, (db) =>
  93  |           db.prepare('SELECT text FROM personal_notes').get(),
  94  |         ),
  95  |       )
  96  |       .toEqual({ text: 'OLD-PERSONAL-NOTE\n  explain();' })
  97  |     await openPage(instance.page, '开始练习')
  98  |     await instance.page.getByLabel('练习专题', { exact: true }).selectOption('control-a')
  99  |     await instance.page.getByLabel('本轮题数', { exact: true }).selectOption('all')
  100 |     const reads = await instance.application.evaluate(() => Reflect.get(globalThis, '__noteReads'))
  101 |     await instance.page.getByRole('button', { name: '开始练习', exact: true }).click()
  102 |     await expect(instance.page.locator('.practice-reference-column .personal-note')).toHaveCount(0)
  103 |     expect(await instance.application.evaluate(() => Reflect.get(globalThis, '__noteReads'))).toBe(
  104 |       reads,
  105 |     )
  106 |     await instance.page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  107 |     const practiceNote = instance.page.locator('.practice-reference-column .personal-note')
  108 |     await expect(practiceNote).not.toHaveAttribute('open')
  109 |     expect(await instance.application.evaluate(() => Reflect.get(globalThis, '__noteReads'))).toBe(
  110 |       reads,
  111 |     )
  112 |     await practiceNote.locator('summary').click()
  113 |     await expect(
  114 |       practiceNote.getByRole('textbox', { name: '我的复习笔记', exact: true }),
  115 |     ).toHaveValue('OLD-PERSONAL-NOTE\n  explain();')
  116 |     await practiceNote
  117 |       .getByRole('textbox', { name: '我的复习笔记', exact: true })
  118 |       .fill('NEW-PERSONAL-NOTE\n  improved();')
  119 |     await instance.page.locator('.practice-outline > summary').click()
  120 |     await instance.page
  121 |       .locator('.practice-outline')
  122 |       .getByRole('button', { name: /^7\. 组卷题 A 7 / })
  123 |       .click()
  124 |     await expect(instance.page.getByLabel('练习进度')).toHaveText('第 7 / 27 题 · 顺序练习')
  125 |     await expect(instance.page.locator('.practice-reference-column .personal-note')).toHaveCount(0)
  126 |     await instance.page.getByRole('button', { name: '保存并返回', exact: true }).click()
  127 |     await openPage(instance.page, '题库')
  128 |     await expect(
  129 |       instance.page.getByRole('textbox', { name: '我的复习笔记', exact: true }),
  130 |     ).toHaveValue('NEW-PERSONAL-NOTE\n  improved();')
  131 |     await info.attach('personal-note-library.png', {
  132 |       body: await instance.page.screenshot({ fullPage: true }),
  133 |       contentType: 'image/png',
  134 |     })
  135 |     await closeNormally(instance.application)
  136 |     instance = await launchApplication(testDataDirectory, info.project.name, '题库')
  137 |     const reopened = await openLibraryNote(instance.page)
  138 |     await expect(reopened.getByRole('textbox', { name: '我的复习笔记', exact: true })).toHaveValue(
  139 |       'NEW-PERSONAL-NOTE\n  improved();',
  140 |     )
  141 |   } finally {
  142 |     await stop(instance.application)
  143 |   }
  144 | })
  145 | 
  146 | test('真实笔记写失败阻止切题和正常退出，原输入保留并可按原修订重试', async ({
  147 |   testDataDirectory,
  148 | }, info) => {
  149 |   const { application, page } = await prepareStudy(testDataDirectory, info)
  150 |   try {
  151 |     const note = await openLibraryNote(page)
  152 |     withHistoryDatabase(
  153 |       testDataDirectory,
  154 |       (db) =>
  155 |         db.exec(
  156 |           "CREATE TRIGGER note_failure BEFORE INSERT ON personal_notes BEGIN SELECT RAISE(ABORT,'injected note write'); END",
  157 |         ),
  158 |       false,
  159 |     )
  160 |     const input = note.getByRole('textbox', { name: '我的复习笔记', exact: true })
  161 |     await input.fill('失败仍保留的笔记')
  162 |     await page
  163 |       .locator('.question-row')
  164 |       .filter({ has: page.getByText('组卷题 A 2', { exact: true }) })
  165 |       .click()
  166 |     await expect(note.getByRole('alert')).toBeVisible()
> 167 |     await expect(input).toHaveValue('失败仍保留的笔记')
      |                         ^ Error: expect(locator).toHaveValue(expected) failed
  168 |     await expect(page.getByRole('heading', { name: '组卷题 A 1', exact: true })).toBeVisible()
  169 |     await application.evaluate(({ dialog }) => {
  170 |       dialog.showMessageBox = (async () => {
  171 |         Reflect.set(globalThis, '__noteCloseReturned', true)
  172 |         return { response: 0, checkboxChecked: false }
  173 |       }) as typeof dialog.showMessageBox
  174 |     })
  175 |     await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.close())
  176 |     await expect
  177 |       .poll(() => application.evaluate(() => Reflect.get(globalThis, '__noteCloseReturned')))
  178 |       .toBe(true)
  179 |     expect(application.process().exitCode).toBeNull()
  180 |     expect(
  181 |       withHistoryDatabase(testDataDirectory, (db) =>
  182 |         db.prepare('SELECT * FROM personal_notes').all(),
  183 |       ),
  184 |     ).toEqual([])
  185 |     withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER note_failure'), false)
  186 |     await note.getByRole('button', { name: '重试原笔记保存', exact: true }).click()
  187 |     await expect
  188 |       .poll(() =>
  189 |         withHistoryDatabase(testDataDirectory, (db) =>
  190 |           db.prepare('SELECT revision,text FROM personal_notes').all(),
  191 |         ),
  192 |       )
  193 |       .toEqual([{ revision: 1, text: '失败仍保留的笔记' }])
  194 |     await page
  195 |       .locator('.question-row')
  196 |       .filter({ has: page.getByText('组卷题 A 2', { exact: true }) })
  197 |       .click()
  198 |     await expect(page.getByRole('heading', { name: '组卷题 A 2', exact: true })).toBeVisible()
  199 |   } finally {
  200 |     await stop(application)
  201 |   }
  202 | })
  203 | 
  204 | test('笔记已提交但响应丢失，原请求重试不增修订或改时间', async ({ testDataDirectory }, info) => {
  205 |   const { application, page } = await prepareStudy(testDataDirectory, info)
  206 |   try {
  207 |     const note = await openLibraryNote(page)
  208 |     await application.evaluate(({ ipcMain }) => {
  209 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('study:save-note'),
  210 |         commands: unknown[] = []
  211 |       Reflect.set(globalThis, '__noteCommands', commands)
  212 |       let drop = true
  213 |       ipcMain.removeHandler('study:save-note')
  214 |       ipcMain.handle('study:save-note', async (event, input) => {
  215 |         commands.push(structuredClone(input))
  216 |         const result = await original(event, input)
  217 |         if (drop) {
  218 |           drop = false
  219 |           return { ok: true, value: null }
  220 |         }
  221 |         return result
  222 |       })
  223 |     })
  224 |     await note.getByRole('textbox', { name: '我的复习笔记', exact: true }).fill('已写入仍等待确认')
  225 |     await note.getByRole('button', { name: '立即保存笔记', exact: true }).click()
  226 |     await expect(note.getByRole('alert')).toContainText('结果尚未确认')
  227 |     const before = withHistoryDatabase(testDataDirectory, (db) =>
  228 |       db.prepare('SELECT * FROM personal_notes').all(),
  229 |     )
  230 |     await note.getByRole('button', { name: '重试原笔记保存', exact: true }).click()
  231 |     await expect(note.locator('summary')).toContainText('已保存')
  232 |     expect(
  233 |       withHistoryDatabase(testDataDirectory, (db) =>
  234 |         db.prepare('SELECT * FROM personal_notes').all(),
  235 |       ),
  236 |     ).toEqual(before)
  237 |     const commands = await application.evaluate(() => Reflect.get(globalThis, '__noteCommands'))
  238 |     expect(commands).toHaveLength(2)
  239 |     expect(commands[1]).toEqual(commands[0])
  240 |   } finally {
  241 |     await stop(application)
  242 |   }
  243 | })
  244 | 
```