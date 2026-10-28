# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: study-material.spec.ts >> 题单主动选择三类材料，正文/代码/图片可离开来源使用，默认不含个人内容或答案
- Location: tests\e2e\study-material.spec.ts:16:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.selectOption: Timeout 30000ms exceeded.
Call log:
  - waiting for getByLabel('勾选组卷与固定题单', { exact: true }).getByLabel('选用固定题单', { exact: true })
    - locator resolved to <select aria-label="选用固定题单">…</select>
  - attempting select option action
    2 × waiting for element to be visible and enabled
      - did not find some options
    - retrying select option action
    - waiting 20ms
    2 × waiting for element to be visible and enabled
      - did not find some options
    - retrying select option action
      - waiting 100ms
    59 × waiting for element to be visible and enabled
       - did not find some options
     - retrying select option action
       - waiting 500ms

```

# Test source

```ts
  1   | import { randomUUID, createHash } from 'node:crypto'
  2   | import { copyFile, mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises'
  3   | import { dirname, join, resolve } from 'node:path'
  4   | import { expect, openPage, test } from './helpers'
  5   | import {
  6   |   captureHistory,
  7   |   historyBank,
  8   |   importHistoryFiles,
  9   |   stop,
  10  |   withHistoryDatabase,
  11  | } from './history-helpers'
  12  | import { a, changeSet, controlBank, controlRecords } from './practice-control-helpers'
  13  | import { endFlow, startFlow } from './practice-flow-helpers'
  14  | import { createStudyRound, exportMaterial, prepareStudy, saveNote } from './study-helpers'
  15  | 
  16  | test('题单主动选择三类材料，正文/代码/图片可离开来源使用，默认不含个人内容或答案', async ({
  17  |   testDataDirectory,
  18  | }, info) => {
  19  |   const { application, page } = await prepareStudy(testDataDirectory, info)
  20  |   try {
  21  |     const folder = join(testDataDirectory, 'material-source')
  22  |     await mkdir(join(folder, 'assets'), { recursive: true })
  23  |     const png = await readFile(resolve('tests/fixtures/images/small.png'))
  24  |     await writeFile(join(folder, 'assets/history.png'), png)
  25  |     const file = join(folder, '材料.md')
  26  |     await writeFile(
  27  |       file,
  28  |       historyBank().replace(
  29  |         'HISTORY-BODY-OLD-history-a-1',
  30  |         'HISTORY-BODY-OLD-history-a-1\n\n| DMA | UART |\n| --- | --- |\n| 内存 | 外设 |',
  31  |       ),
  32  |     )
  33  |     await importHistoryFiles(application, page, [file])
  34  |     const imageIdentity = { topicId: 'history-a', questionId: 'q-1' }
  35  |     await createStudyRound(page, 'OWN-独立作答\n```c\nint transfer = 1;\n```', [imageIdentity])
  36  |     expect(
  37  |       await saveNote(page, {
  38  |         ...imageIdentity,
  39  |         expectedRevision: 0,
  40  |         text: 'NOTE-完成条件\n```c\nwait_tc();\n```',
  41  |       }),
  42  |     ).toMatchObject({ ok: true })
  43  |     const setId = randomUUID()
  44  |     expect(
  45  |       await changeSet(page, {
  46  |         kind: 'save',
  47  |         setId,
  48  |         name: '导出复习题单',
  49  |         items: [imageIdentity, a(1)],
  50  |       }),
  51  |     ).toMatchObject({ ok: true })
  52  |     // 源图/源题文件移走后，导出只能依赖入库资源。
  53  |     await rename(join(folder, 'assets/history.png'), join(folder, 'moved.png'))
  54  |     await rename(file, join(folder, 'moved.md'))
  55  |     const before = withHistoryDatabase(testDataDirectory, controlRecords)
  56  |     await openPage(page, '题库')
  57  |     await page.locator('.question-selection-panel > summary').click()
  58  |     const panel = page.getByLabel('勾选组卷与固定题单', { exact: true })
> 59  |     await panel.getByLabel('选用固定题单', { exact: true }).selectOption(setId)
      |                                                       ^ TimeoutError: locator.selectOption: Timeout 30000ms exceeded.
  60  |     const exporter = panel.locator('.material-export')
  61  |     await exporter.locator('summary').click()
  62  |     await expect(exporter.getByLabel('复习材料包含内容')).toHaveValue('questions')
  63  |     for (const mode of ['questions', 'answers', 'personal'] as const) {
  64  |       const target = info.outputPath(`${mode}.md`)
  65  |       await application.evaluate(({ dialog }, filePath) => {
  66  |         dialog.showSaveDialog = async () => ({ canceled: false, filePath })
  67  |       }, target)
  68  |       await exporter.getByLabel('复习材料包含内容').selectOption(mode)
  69  |       await exporter
  70  |         .getByRole('button', { name: '确认范围与内容并选择保存位置…', exact: true })
  71  |         .click()
  72  |       await expect(exporter.getByRole('status')).toContainText(target)
  73  |       const markdown = await readFile(target, 'utf8')
  74  |       expect(markdown).toContain('共2题')
  75  |       expect(markdown.indexOf('HISTORY-BODY-OLD-history-a-1')).toBeLessThan(
  76  |         markdown.indexOf('CONTROL-OLD-BODY-control-a-1'),
  77  |       )
  78  |       expect(markdown).toMatch(/\| DMA\s+\| UART/)
  79  |       expect(markdown).not.toMatch(/practice-image:|assets\/history\.png|file:\/\//)
  80  |       const resource = markdown.match(/!\[历史图\]\((review-assets-[\w-]+\/[a-f0-9]+\.png)\)/)?.[1]
  81  |       expect(resource).toBeTruthy()
  82  |       expect(await readFile(join(dirname(target), resource!))).toEqual(png)
  83  |       expect(resource).toContain(createHash('sha256').update(png).digest('hex'))
  84  |       if (mode === 'answers') {
  85  |         expect(markdown).toContain('HISTORY-ANSWER-OLD-history-a-1')
  86  |         expect(markdown).toContain('int value = 1;')
  87  |       } else expect(markdown).not.toContain('HISTORY-ANSWER-OLD')
  88  |       if (mode === 'personal') {
  89  |         expect(markdown).toContain('OWN-独立作答')
  90  |         expect(markdown).toContain('NOTE-完成条件')
  91  |         expect(markdown).toContain('wait_tc();')
  92  |         expect(markdown).toContain('当前版本尚无已结束轮次的实际作答')
  93  |         expect(markdown).toContain('并非当时笔记快照')
  94  |       } else expect(markdown).not.toMatch(/OWN-独立作答|NOTE-完成条件|wait_tc/)
  95  |     }
  96  |     expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
  97  |     await captureHistory(application, page, info, 'material-export.png')
  98  |   } finally {
  99  |     await stop(application)
  100 |   }
  101 | })
  102 | 
  103 | test('轮次材料固定旧版本/本轮作答，题单采用新版本且不套旧作答；归档/坏资源/取消不覆盖文件', async ({
  104 |   testDataDirectory,
  105 | }, info) => {
  106 |   const { application, page, file } = await prepareStudy(testDataDirectory, info)
  107 |   try {
  108 |     const round = await createStudyRound(page, 'OWN-旧版回答', [a(1), a(2)])
  109 |     const setId = randomUUID()
  110 |     await changeSet(page, { kind: 'save', setId, name: '版本与归档', items: [a(1)] })
  111 |     await writeFile(file, controlBank('control-a', 27, true))
  112 |     await importHistoryFiles(application, page, [file])
  113 |     const target = info.outputPath('version-material.md')
  114 |     await application.evaluate(({ dialog }, filePath) => {
  115 |       dialog.showSaveDialog = async () => ({ canceled: false, filePath })
  116 |     }, target)
  117 |     const before = withHistoryDatabase(testDataDirectory, controlRecords)
  118 |     expect(
  119 |       await exportMaterial(page, {
  120 |         source: { kind: 'round', sessionId: round.sessionId },
  121 |         mode: 'personal',
  122 |       }),
  123 |     ).toMatchObject({ ok: true, value: { questions: 2, images: 0 } })
  124 |     const personal = await readFile(target, 'utf8')
  125 |     expect(personal).toContain('CONTROL-OLD-BODY-control-a-1')
  126 |     expect(personal).toContain('OWN-旧版回答')
  127 |     expect(personal).not.toMatch(/CONTROL-NEW|CONTROL-OLD-ANSWER/)
  128 |     expect(
  129 |       await exportMaterial(page, {
  130 |         source: { kind: 'round', sessionId: round.sessionId },
  131 |         mode: 'answers',
  132 |       }),
  133 |     ).toMatchObject({ ok: true })
  134 |     expect(await readFile(target, 'utf8')).toContain('CONTROL-OLD-ANSWER-control-a-2')
  135 |     expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
  136 |     expect(
  137 |       await exportMaterial(page, { source: { kind: 'set', setId }, mode: 'personal' }),
  138 |     ).toMatchObject({ ok: true })
  139 |     const current = await readFile(target, 'utf8')
  140 |     expect(current).toContain('CONTROL-NEW-BODY-control-a-1')
  141 |     expect(current).toContain('当前版本尚无已结束轮次的实际作答')
  142 |     expect(current).not.toContain('OWN-旧版回答')
  143 |     await application.evaluate(({ dialog }) => {
  144 |       dialog.showSaveDialog = async () => ({ canceled: true, filePath: '' })
  145 |     })
  146 |     expect(
  147 |       await exportMaterial(page, { source: { kind: 'set', setId }, mode: 'questions' }),
  148 |     ).toMatchObject({ ok: false, error: { code: 'CANCELLED' } })
  149 |     expect(await readFile(target, 'utf8')).toBe(current)
  150 |     await writeFile(file, controlBank('control-a', 27, true, 1))
  151 |     await importHistoryFiles(application, page, [file])
  152 |     expect(
  153 |       await exportMaterial(page, { source: { kind: 'set', setId }, mode: 'questions' }),
  154 |     ).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } })
  155 |     expect(await readFile(target, 'utf8')).toBe(current)
  156 | 
  157 |     const folder = join(testDataDirectory, 'broken-image-source')
  158 |     await mkdir(join(folder, 'assets'), { recursive: true })
  159 |     await copyFile(resolve('tests/fixtures/images/small.png'), join(folder, 'assets/history.png'))
```