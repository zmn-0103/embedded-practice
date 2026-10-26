# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: history-window.spec.ts >> 历史默认不读/不挂载，主动回看与自动保存保持，新题新轮重新关闭
- Location: tests\e2e\history-window.spec.ts:22:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '查看本题历史', exact: true })

```

# Test source

```ts
  1   | import { readFile } from 'node:fs/promises'
  2   | import { join } from 'node:path'
  3   | import type { ElectronApplication } from '@playwright/test'
  4   | import {
  5   |   beginHistoryPractice,
  6   |   captureHistory,
  7   |   historySnapshot,
  8   |   prepareHistory,
  9   |   readHistory,
  10  |   readHistoryEntry,
  11  |   selectHistoryQuestion,
  12  |   stop,
  13  |   withHistoryDatabase,
  14  | } from './history-helpers'
  15  | import { expect, test } from './helpers'
  16  | 
  17  | async function counts(application: ElectronApplication) {
  18  |   return application.evaluate(
  19  |     () => Reflect.get(globalThis, 'historyCalls') as { list: number; entry: number },
  20  |   )
  21  | }
  22  | test('历史默认不读/不挂载，主动回看与自动保存保持，新题新轮重新关闭', async ({
  23  |   testDataDirectory,
  24  | }, info) => {
  25  |   const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  26  |   try {
  27  |     await application.evaluate(({ ipcMain }) => {
  28  |       const handlers = Reflect.get(ipcMain, '_invokeHandlers') as Map<
  29  |         string,
  30  |         (...args: unknown[]) => Promise<unknown>
  31  |       >
  32  |       const state = { list: 0, entry: 0 }
  33  |       Reflect.set(globalThis, 'historyCalls', state)
  34  |       for (const [channel, key] of [
  35  |         ['history:list', 'list'],
  36  |         ['history:get-entry', 'entry'],
  37  |       ] as const) {
  38  |         const original = handlers.get(channel)
  39  |         if (!original) throw new Error('缺少历史接口。')
  40  |         ipcMain.removeHandler(channel)
  41  |         ipcMain.handle(channel, async (...args) => {
  42  |           state[key]++
  43  |           return original(...args)
  44  |         })
  45  |       }
  46  |     })
  47  |     await beginHistoryPractice(page)
  48  |     expect(await counts(application)).toEqual({ list: 0, entry: 0 })
  49  |     expect(await page.content()).not.toMatch(/HISTORY-DRAFT|HISTORY-ANSWER/)
  50  |     expect(await page.locator('body').ariaSnapshot()).not.toMatch(/HISTORY-DRAFT|HISTORY-ANSWER/)
  51  |     expect(await page.getByRole('region', { name: '本题历史', exact: true }).count()).toBe(0)
  52  |     const before = historySnapshot(testDataDirectory)
> 53  |     await page.getByRole('button', { name: '查看本题历史', exact: true }).click()
      |                                                                     ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
  54  |     const history = page.getByRole('region', { name: '本题历史', exact: true })
  55  |     await expect(history).toContainText('共 3 条历史记录')
  56  |     expect(await page.content()).not.toMatch(/HISTORY-DRAFT|HISTORY-ANSWER/)
  57  |     expect((await counts(application)).entry).toBe(0)
  58  |     await history.getByRole('button', { name: '展开本次记录', exact: true }).last().click()
  59  |     await expect(history.getByRole('region', { name: '历史作答', exact: true })).toContainText(
  60  |       'HISTORY-DRAFT-0',
  61  |     )
  62  |     await expect(history.locator('pre.history-draft')).toContainText('<script>literal</script>')
  63  |     expect(await history.locator('script').count()).toBe(0)
  64  |     await expect(history.getByRole('region', { name: '历史参考答案', exact: true })).toContainText(
  65  |       'HISTORY-ANSWER-OLD-history-a-1',
  66  |     )
  67  |     expect(await page.getByRole('region', { name: '练习参考答案', exact: true }).count()).toBe(0)
  68  |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  69  |     const requests = await counts(application)
  70  |     const input = page.getByRole('textbox', { name: '我的答案', exact: true })
  71  |     await input.fill('当前轮草稿，回看历史后继续输入')
  72  |     const geometry = () =>
  73  |       page.evaluate(() => {
  74  |         const browser = globalThis as unknown as {
  75  |           scrollY: number
  76  |           document: { activeElement: { id: string } | null }
  77  |         }
  78  |         return { scroll: browser.scrollY, active: browser.document.activeElement?.id }
  79  |       })
  80  |     const editing = await geometry()
  81  |     await expect(page.locator('.practice-save')).toHaveText('已保存')
  82  |     expect(
  83  |       withHistoryDatabase(
  84  |         testDataDirectory,
  85  |         (database) =>
  86  |           database
  87  |             .prepare(
  88  |               `SELECT i.draft
  89  |       FROM practice_items i JOIN practice_sessions s ON s.id=i.session_id
  90  |       WHERE s.status='active' AND i.position=s.position`,
  91  |             )
  92  |             .get()?.draft,
  93  |       ),
  94  |     ).toBe('当前轮草稿，回看历史后继续输入')
  95  |     expect(await geometry()).toEqual(editing)
  96  |     expect(await counts(application)).toEqual(requests)
  97  |     await expect(history.getByRole('button', { name: '收起本次记录', exact: true })).toBeVisible()
  98  |     await history.locator('pre.history-draft').scrollIntoViewIfNeeded()
  99  |     await expect(history.locator('pre.history-draft')).toBeInViewport()
  100 |     await captureHistory(application, page, info, 'history-expanded.png')
  101 |     await page.getByRole('button', { name: '跳过本题', exact: true }).click()
  102 |     await expect(page.getByLabel('练习进度')).toHaveText('第 2 / 2 题 · 顺序练习')
  103 |     expect(await page.getByRole('region', { name: '本题历史', exact: true }).count()).toBe(0)
  104 |     expect(await page.content()).not.toMatch(/HISTORY-DRAFT|HISTORY-ANSWER/)
  105 |     await page.getByRole('button', { name: '跳过本题', exact: true }).click()
  106 |     await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
  107 |     await beginHistoryPractice(page)
  108 |     expect(await page.getByRole('region', { name: '本题历史', exact: true }).count()).toBe(0)
  109 |     expect(await page.content()).not.toMatch(/HISTORY-DRAFT|HISTORY-ANSWER/)
  110 |     await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue('')
  111 |     expect(await counts(application)).toEqual(requests)
  112 |     await info.attach('history-default-readonly-autosave.json', {
  113 |       body: JSON.stringify({
  114 |         before,
  115 |         requests,
  116 |         editing,
  117 |         final: historySnapshot(testDataDirectory),
  118 |       }),
  119 |       contentType: 'application/json',
  120 |     })
  121 |   } finally {
  122 |     await stop(application)
  123 |   }
  124 | })
  125 | 
  126 | test('历史真实读取失败与坏记录可重试，保留已存数据且诊断不包含旧作答', async ({
  127 |   testDataDirectory,
  128 | }, info) => {
  129 |   const { application, page } = await prepareHistory(testDataDirectory, info.project.name, 1)
  130 |   let renamed = false
  131 |   let definition: { versionId: number; value: string } | undefined
  132 |   try {
  133 |     await selectHistoryQuestion(page)
  134 |     const before = historySnapshot(testDataDirectory)
  135 |     withHistoryDatabase(
  136 |       testDataDirectory,
  137 |       (database) => database.exec('ALTER TABLE practice_items RENAME TO history_fault_items'),
  138 |       false,
  139 |     )
  140 |     renamed = true
  141 |     await page.getByRole('button', { name: '查看本题历史', exact: true }).click()
  142 |     const history = page.getByRole('region', { name: '本题历史', exact: true })
  143 |     await expect(history.getByRole('alert')).toContainText('题库服务暂不可用')
  144 |     expect(await history.getByText('尚无历史记录。', { exact: true }).count()).toBe(0)
  145 |     withHistoryDatabase(
  146 |       testDataDirectory,
  147 |       (database) => database.exec('ALTER TABLE history_fault_items RENAME TO practice_items'),
  148 |       false,
  149 |     )
  150 |     renamed = false
  151 |     await history.getByRole('button', { name: '重试读取历史', exact: true }).click()
  152 |     await expect(history).toContainText('共 1 条历史记录')
  153 |     const record = (await readHistory(page)).entries[0]!
```