# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: personal-notes.spec.ts >> 笔记主动读取，独立作答揭晓前零请求，跨页同步/切题/正常重开保留
- Location: tests\e2e\personal-notes.spec.ts:68:5

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 1

  Object {
    "text": "OLD-PERSONAL-NOTE
-   explain();",
+   explai",
  }

Call Log:
- Timeout 10000ms exceeded while waiting on the predicate
```

# Test source

```ts
  1   | import { writeFile } from 'node:fs/promises'
  2   | import { expect, launchApplication, openPage, test } from './helpers'
  3   | import { historySnapshot, importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
  4   | import { controlBank } from './practice-control-helpers'
  5   | import {
  6   |   a,
  7   |   prepareStudy,
  8   |   readNote,
  9   |   saveNote,
  10  |   openLibraryNote,
  11  |   closeNormally,
  12  | } from './study-helpers'
  13  | 
  14  | test('个人笔记CAS/幂等/清空修订，重导入和归档不覆盖，学习记录逐行保持', async ({
  15  |   testDataDirectory,
  16  | }, info) => {
  17  |   const { application, page, file } = await prepareStudy(testDataDirectory, info)
  18  |   try {
  19  |     const before = historySnapshot(testDataDirectory)
  20  |     expect(await readNote(page)).toMatchObject({
  21  |       ok: true,
  22  |       value: { ...a(1), revision: 0, text: '', updatedAt: null },
  23  |     })
  24  |     const command = { ...a(1), expectedRevision: 0, text: 'DMA完成≠UART完成\n  wait_tc();' }
  25  |     const saved = await saveNote(page, command)
  26  |     expect(saved).toMatchObject({ ok: true, value: { revision: 1, text: command.text } })
  27  |     expect(await saveNote(page, command)).toEqual(saved)
  28  |     expect(await saveNote(page, { ...command, text: '过期覆盖' })).toMatchObject({
  29  |       ok: false,
  30  |       error: { code: 'NOTE_CONFLICT' },
  31  |     })
  32  |     expect(await saveNote(page, { ...command, expectedRevision: 1, text: '' })).toMatchObject({
  33  |       ok: true,
  34  |       value: { revision: 2, text: '' },
  35  |     })
  36  |     expect(
  37  |       withHistoryDatabase(testDataDirectory, (db) =>
  38  |         db.prepare('SELECT revision,text FROM personal_notes').all(),
  39  |       ),
  40  |     ).toEqual([{ revision: 2, text: '' }])
  41  |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  42  |     expect(await saveNote(page, { ...command, expectedRevision: 2 })).toMatchObject({
  43  |       ok: true,
  44  |       value: { revision: 3 },
  45  |     })
  46  |     await writeFile(file, controlBank('control-a', 27, true, 1))
  47  |     await importHistoryFiles(application, page, [file])
  48  |     expect(await readNote(page)).toMatchObject({
  49  |       ok: true,
  50  |       value: { revision: 3, text: command.text },
  51  |     })
  52  |     expect(
  53  |       await saveNote(page, { ...command, expectedRevision: 3, text: '归档后仍可整理笔记' }),
  54  |     ).toMatchObject({ ok: true, value: { revision: 4 } })
  55  |     expect(await saveNote(page, { ...command, questionId: 'q-missing' })).toMatchObject({
  56  |       ok: false,
  57  |       error: { code: 'NOT_FOUND' },
  58  |     })
  59  |     expect(await saveNote(page, { ...command, text: '中'.repeat(350_000) })).toMatchObject({
  60  |       ok: false,
  61  |       error: { code: 'INVALID_REQUEST' },
  62  |     })
  63  |   } finally {
  64  |     await stop(application)
  65  |   }
  66  | })
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
> 96  |       .toEqual({ text: 'OLD-PERSONAL-NOTE\n  explain();' })
      |        ^ Error: expect(received).toEqual(expected) // deep equality
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
  167 |     await expect(input).toHaveValue('失败仍保留的笔记')
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
```