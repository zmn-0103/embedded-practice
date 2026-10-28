# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: updated-practice.spec.ts >> 更新筛选跨页勾选与固定题单保持，普通项须明确移除，随机仅含确认题并固定版本
- Location: tests\e2e\updated-practice.spec.ts:7:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '揭晓参考答案', exact: true })

```

# Test source

```ts
  1   | import type { DesktopApi } from '../../src/shared/contracts/application'
  2   | import { expect, openPage, test } from './helpers'
  3   | import { captureHistory, stop, withHistoryDatabase } from './history-helpers'
  4   | import { controlRecords, previewSet, readSets } from './practice-control-helpers'
  5   | import { a, b, prepareUpdates, readUpdateRound, revealUpdateRound } from './content-updates-helpers'
  6   | 
  7   | test('更新筛选跨页勾选与固定题单保持，普通项须明确移除，随机仅含确认题并固定版本', async ({
  8   |   testDataDirectory,
  9   | }, info) => {
  10  |   const { application, page } = await prepareUpdates(testDataDirectory, info, 24)
  11  |   try {
  12  |     await page.getByRole('checkbox', { name: '题库只看内容更新待复习', exact: true }).check()
  13  |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  14  |     await page.getByRole('checkbox', { name: /^勾选题目：control-a \/ q-1 / }).check()
  15  |     await page
  16  |       .getByRole('navigation', { name: '题目分页', exact: true })
  17  |       .getByRole('button', { name: '下一页', exact: true })
  18  |       .click()
  19  |     await page.getByRole('checkbox', { name: /^勾选题目：control-b \/ q-1 / }).check()
  20  |     await page.getByRole('checkbox', { name: '题库只看内容更新待复习', exact: true }).uncheck()
  21  |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  22  |     await page.getByRole('checkbox', { name: /^勾选题目：control-a \/ q-4 / }).check()
  23  |     await page.locator('.question-selection-panel > summary').click()
  24  |     const sets = page.getByLabel('勾选组卷与固定题单', { exact: true })
  25  |     await sets.getByLabel('题单名称', { exact: true }).fill('更新复习原题单')
  26  |     await sets.getByRole('button', { name: '保存为新题单', exact: true }).click()
  27  |     await expect(sets.getByRole('status')).toHaveText('固定题单已保存。')
  28  |     const setId = (await readSets(page))[0]!.setId
  29  |     const original = (await previewSet(page, { setId })).definition
  30  |     expect(original?.items).toEqual([a(1), b(1), a(4)])
  31  |     const before = withHistoryDatabase(testDataDirectory, controlRecords)
  32  |     await sets.getByRole('button', { name: '复习勾选中的更新题…', exact: true }).click()
  33  |     const confirm = page.getByLabel('确认勾选组卷', { exact: true })
  34  |     await expect(confirm).toContainText('不属于更新待复习')
  35  |     await expect(
  36  |       confirm.getByRole('button', { name: '确认开始更新题复习（3题）', exact: true }),
  37  |     ).toBeDisabled()
  38  |     expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
  39  |     await captureHistory(application, page, info, 'updated-selection-unavailable.png')
  40  |     await confirm.getByRole('button', { name: '从本轮移除不可用项', exact: true }).click()
  41  |     await confirm.getByLabel('组卷顺序', { exact: true }).selectOption('random')
  42  |     await expect(
  43  |       confirm.getByRole('button', { name: '确认开始更新题复习（2题）', exact: true }),
  44  |     ).toBeEnabled()
  45  |     await captureHistory(application, page, info, 'updated-selection-confirm.png')
  46  |     await confirm.getByRole('button', { name: '确认开始更新题复习（2题）', exact: true }).click()
  47  |     await expect(page.getByLabel('练习进度')).toHaveText('第 1 / 2 题 · 随机练习')
  48  |     const round = await readUpdateRound(page)
  49  |     expect(round.session.selectionName).toContain('内容更新复习：')
  50  |     const queue = () =>
  51  |       withHistoryDatabase(testDataDirectory, (db) =>
  52  |         db
  53  |           .prepare(
  54  |             'SELECT q.topic_id AS topicId,q.question_id AS questionId,v.sequence FROM practice_items i JOIN questions q ON q.id=i.question_id JOIN question_versions v ON v.id=i.version_id WHERE i.session_id=? ORDER BY i.position',
  55  |           )
  56  |           .all(round.session.sessionId),
  57  |       )
  58  |     const fixed = queue()
  59  |     expect(fixed).toHaveLength(2)
  60  |     expect(fixed).toEqual(
  61  |       expect.arrayContaining([
  62  |         { ...a(1), sequence: 2 },
  63  |         { ...b(1), sequence: 2 },
  64  |       ]),
  65  |     )
  66  |     await expect(page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
  67  |     await expect(page.locator('.practice-reference-column .personal-note')).toHaveCount(0)
> 68  |     await page.getByRole('button', { name: '揭晓参考答案', exact: true }).click()
      |                                                                     ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
  69  |     await expect(page.getByLabel('练习参考答案', { exact: true })).toBeVisible()
  70  |     expect(queue()).toEqual(fixed)
  71  |     expect((await previewSet(page, { setId })).definition).toEqual(original)
  72  |     await page.getByRole('button', { name: '保存后返回', exact: true }).click()
  73  |     await openPage(page, '题库')
  74  |     await expect(page.getByText('已勾选 3 题', { exact: true })).toBeVisible()
  75  |     expect((await readSets(page))[0]?.count).toBe(3)
  76  |   } finally {
  77  |     await stop(application)
  78  |   }
  79  | })
  80  | 
  81  | test('更新复习开始响应丢失后按原请求重试，揭晓已消除待复习也从回执恢复同一轮', async ({
  82  |   testDataDirectory,
  83  | }, info) => {
  84  |   const { application, page } = await prepareUpdates(testDataDirectory, info)
  85  |   try {
  86  |     await application.evaluate(({ ipcMain }) => {
  87  |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('practice:start')
  88  |       const commands: unknown[] = []
  89  |       Reflect.set(globalThis, '__updatedStartCommands', commands)
  90  |       ipcMain.removeHandler('practice:start')
  91  |       ipcMain.handle('practice:start', async (event, input) => {
  92  |         commands.push(structuredClone(input))
  93  |         const result = await original(event, input)
  94  |         return commands.length === 1 && result.ok ? { ok: true, value: {} } : result
  95  |       })
  96  |     })
  97  |     await page.getByRole('checkbox', { name: /^勾选题目：control-a \/ q-1 / }).check()
  98  |     await page.locator('.question-selection-panel > summary').click()
  99  |     await page.getByRole('button', { name: '复习勾选中的更新题…', exact: true }).click()
  100 |     const confirm = page.getByLabel('确认勾选组卷', { exact: true })
  101 |     await confirm.getByRole('button', { name: '确认开始更新题复习（1题）', exact: true }).click()
  102 |     await expect(
  103 |       confirm.getByRole('button', { name: '重试开始更新题复习', exact: true }),
  104 |     ).toBeEnabled()
  105 |     const committed = await readUpdateRound(page)
  106 |     expect(await revealUpdateRound(page)).toMatchObject({ ok: true })
  107 |     const noLongerPending = await page.evaluate(
  108 |       (items) =>
  109 |         (globalThis as unknown as { desktop: DesktopApi }).desktop.questionSets.preview({
  110 |           items,
  111 |           contentUpdatedOnly: true,
  112 |         }),
  113 |       [a(1)],
  114 |     )
  115 |     expect(noLongerPending).toMatchObject({
  116 |       ok: true,
  117 |       value: { items: [{ status: 'not-pending' }] },
  118 |     })
  119 |     await confirm.getByRole('button', { name: '重试开始更新题复习', exact: true }).click()
  120 |     await expect(page.getByLabel('练习进度')).toHaveText('第 1 / 1 题 · 顺序练习')
  121 |     expect((await readUpdateRound(page)).session.sessionId).toBe(committed.session.sessionId)
  122 |     const commands = await application.evaluate(() =>
  123 |       Reflect.get(globalThis, '__updatedStartCommands'),
  124 |     )
  125 |     expect(commands).toHaveLength(2)
  126 |     expect(commands[1]).toEqual(commands[0])
  127 |     expect(commands[0].selected.contentUpdatedOnly).toBe(true)
  128 |     expect(
  129 |       withHistoryDatabase(testDataDirectory, (db) =>
  130 |         db.prepare('SELECT count(*) AS total FROM practice_sessions').get(),
  131 |       ),
  132 |     ).toEqual({ total: 1 })
  133 |   } finally {
  134 |     await stop(application)
  135 |   }
  136 | })
  137 | 
```