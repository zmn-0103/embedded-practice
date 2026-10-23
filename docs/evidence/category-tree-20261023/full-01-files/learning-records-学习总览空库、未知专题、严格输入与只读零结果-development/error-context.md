# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: learning-records.spec.ts >> 学习总览空库、未知专题、严格输入与只读零结果
- Location: tests\e2e\learning-records.spec.ts:24:5

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 0
+ Received  + 4

@@ -1,7 +1,11 @@
  Object {
    "archived": false,
+   "categories": Array [],
+   "category": Object {
+     "kind": "all",
+   },
    "contentUpdated": 0,
    "favorites": 0,
    "rated": 0,
    "ratings": Object {
      "不会": 0,
```

# Test source

```ts
  1   | import { writeFile } from 'node:fs/promises'
  2   | import type { ElectronApplication } from '@playwright/test'
  3   | import type { DesktopApi } from '../../src/shared/contracts/application'
  4   | import { expect, launchApplication, openPage, test } from './helpers'
  5   | import {
  6   |   beginHistoryPractice,
  7   |   captureHistory,
  8   |   historyBank,
  9   |   historySnapshot,
  10  |   importHistoryFiles,
  11  |   prepareHistory,
  12  |   readHistory,
  13  |   stop,
  14  |   withHistoryDatabase,
  15  | } from './history-helpers'
  16  | import { expectCounts, favoriteLearning, openRecords, readLearning } from './learning-helpers'
  17  | 
  18  | async function closeNormally(application: ElectronApplication) {
  19  |   const closed = application.waitForEvent('close')
  20  |   await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.close())
  21  |   await closed
  22  | }
  23  | 
  24  | test('学习总览空库、未知专题、严格输入与只读零结果', async ({ testDataDirectory }, info) => {
  25  |   const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  26  |   try {
  27  |     const before = historySnapshot(testDataDirectory)
  28  |     const empty = await readLearning(page)
> 29  |     expect(empty).toEqual({
      |                   ^ Error: expect(received).toEqual(expected) // deep equality
  30  |       topicId: null,
  31  |       archived: false,
  32  |       topics: [],
  33  |       total: 0,
  34  |       revealed: 0,
  35  |       rated: 0,
  36  |       favorites: 0,
  37  |       contentUpdated: 0,
  38  |       ratings: { 不会: 0, 不熟: 0, 掌握: 0 },
  39  |     })
  40  |     expect(await readLearning(page, { topicId: 'missing', archived: true })).toEqual({
  41  |       ...empty,
  42  |       topicId: 'missing',
  43  |       archived: true,
  44  |     })
  45  |     const invalid = await page.evaluate(() =>
  46  |       (globalThis as unknown as { desktop: DesktopApi }).desktop.learning.read({
  47  |         topicId: null,
  48  |         archived: false,
  49  |         sql: 'SELECT',
  50  |       } as { topicId: null; archived: false }),
  51  |     )
  52  |     expect(invalid).toMatchObject({ error: { code: 'INVALID_REQUEST' } })
  53  |     await openRecords(page)
  54  |     await expectCounts(page, [0, 0, 0, 0, 0], [0, 0, 0])
  55  |     expect(await page.content()).not.toContain('系统正确率')
  56  |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  57  |     await info.attach('learning-empty.json', {
  58  |       body: JSON.stringify({ empty, invalid, before }),
  59  |       contentType: 'application/json',
  60  |     })
  61  |   } finally {
  62  |     await stop(application)
  63  |   }
  64  | })
  65  | 
  66  | test('学习总览真实多轮去重、未评价、当前版本、旧状态和归档恢复', async ({
  67  |   testDataDirectory,
  68  | }, info) => {
  69  |   const { application, page, file } = await prepareHistory(testDataDirectory, info.project.name, 3)
  70  |   try {
  71  |     const initial = await readLearning(page)
  72  |     expect(initial).toMatchObject({
  73  |       total: 3,
  74  |       revealed: 2,
  75  |       rated: 2,
  76  |       favorites: 0,
  77  |       contentUpdated: 0,
  78  |       ratings: { 不会: 1, 不熟: 1, 掌握: 0 },
  79  |     })
  80  |     const a = { topicId: 'history-a', archived: false }
  81  |     expect(await readLearning(page, a)).toMatchObject({
  82  |       total: 2,
  83  |       revealed: 1,
  84  |       rated: 1,
  85  |       ratings: { 不会: 0, 不熟: 1, 掌握: 0 },
  86  |     })
  87  |     // 真实新轮：第一题跳过，第二题空作答揭晓且暂不评价。
  88  |     await page.evaluate(async () => {
  89  |       const api = (globalThis as unknown as { desktop: DesktopApi }).desktop.practice
  90  |       const requestId = () => globalThis.crypto.randomUUID()
  91  |       const draft = { revision: 0, text: '' }
  92  |       const start = await api.start({
  93  |         requestId: requestId(),
  94  |         topicId: 'history-a',
  95  |         count: 'all',
  96  |         replace: null,
  97  |       })
  98  |       if (!start.ok) throw new Error(start.error.code)
  99  |       let cursor = {
  100 |         sessionId: start.value.sessionId,
  101 |         position: start.value.position,
  102 |         revision: start.value.revision,
  103 |       }
  104 |       const skip = await api.navigate({ requestId: requestId(), cursor, draft, direction: 'skip' })
  105 |       if (!skip.ok) throw new Error(skip.error.code)
  106 |       cursor = {
  107 |         sessionId: skip.value.sessionId,
  108 |         position: skip.value.position,
  109 |         revision: skip.value.revision,
  110 |       }
  111 |       const reveal = await api.reveal({ requestId: requestId(), cursor, draft })
  112 |       if (!reveal.ok) throw new Error(reveal.error.code)
  113 |       cursor = {
  114 |         sessionId: reveal.value.sessionId,
  115 |         position: reveal.value.position,
  116 |         revision: reveal.value.revision,
  117 |       }
  118 |       const rate = await api.rateAndAdvance({ requestId: requestId(), cursor, draft, rating: null })
  119 |       if (!rate.ok) throw new Error(rate.error.code)
  120 |     })
  121 |     expect(await readLearning(page, a)).toMatchObject({ total: 2, revealed: 2, rated: 1 })
  122 |     await favoriteLearning(page, 'history-a', true)
  123 |     const readonlyBefore = historySnapshot(testDataDirectory)
  124 |     const revealed = await readLearning(page)
  125 |     expect(revealed).toMatchObject({ revealed: 3, rated: 2, favorites: 1 })
  126 |     expect(historySnapshot(testDataDirectory)).toEqual(readonlyBefore)
  127 |     await writeFile(file, historyBank(true))
  128 |     await importHistoryFiles(application, page, [file])
  129 |     const updated = await readLearning(page, a)
```