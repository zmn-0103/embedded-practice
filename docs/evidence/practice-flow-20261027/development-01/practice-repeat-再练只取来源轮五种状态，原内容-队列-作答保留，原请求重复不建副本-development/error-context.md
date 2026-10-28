# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: practice-repeat.spec.ts >> 再练只取来源轮五种状态，原内容/队列/作答保留，原请求重复不建副本
- Location: tests\e2e\practice-repeat.spec.ts:16:5

# Error details

```
Error: CHECK constraint failed: (last_rating IS NULL) = (last_rated_version_id IS NULL)
```

# Test source

```ts
  1   | import { randomUUID } from 'node:crypto'
  2   | import { writeFile } from 'node:fs/promises'
  3   | import type { DesktopApi } from '../../src/shared/contracts/application'
  4   | import type { RepeatPractice, StartPractice } from '../../src/shared/contracts/practice'
  5   | import { expect, openPage, test } from './helpers'
  6   | import { importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
  7   | import {
  8   |   endFlow,
  9   |   finishFlow,
  10  |   flowBank,
  11  |   flowQueue,
  12  |   prepareFlow,
  13  |   startFlow,
  14  | } from './practice-flow-helpers'
  15  | 
  16  | test('再练只取来源轮五种状态，原内容/队列/作答保留，原请求重复不建副本', async ({
  17  |   testDataDirectory,
  18  | }, info) => {
  19  |   const { application, page, file } = await prepareFlow(testDataDirectory, info)
  20  |   try {
  21  |     const source = await finishFlow(page)
  22  |     const original = flowQueue(testDataDirectory, source.session.sessionId)
  23  |     expect(source.session.counts).toEqual({
  24  |       revealed: 4,
  25  |       rated: 3,
  26  |       unrated: 1,
  27  |       skipped: 1,
  28  |       ratings: { 不会: 1, 不熟: 1, 掌握: 1 },
  29  |     })
  30  |     await writeFile(file, flowBank(true))
  31  |     await importHistoryFiles(application, page, [file])
  32  |     // 最新状态已变为掌握，也不能改变来源轮的“不会”；最新版本状态仍由联合筛选另测。
  33  |     withHistoryDatabase(
  34  |       testDataDirectory,
> 35  |       (db) => db.exec("UPDATE question_user_state SET last_rating='掌握'"),
      |                  ^ Error: CHECK constraint failed: (last_rating IS NULL) = (last_rated_version_id IS NULL)
  36  |       false,
  37  |     )
  38  |     const selections: [RepeatPractice['selection'], string[]][] = [
  39  |       ['unknown', ['q-1']],
  40  |       ['weak', ['q-1', 'q-2']],
  41  |       ['skipped', ['q-3']],
  42  |       ['unrated', ['q-4']],
  43  |       ['all', ['q-1', 'q-2', 'q-3', 'q-4', 'q-5', 'q-6']],
  44  |     ]
  45  |     for (const [selection, ids] of selections) {
  46  |       const command: StartPractice = {
  47  |         requestId: randomUUID(),
  48  |         topicId: null,
  49  |         count: 'all',
  50  |         replace: null,
  51  |         repeat: { sessionId: source.session.sessionId, selection },
  52  |       }
  53  |       const started = await startFlow(page, command)
  54  |       expect(started).toMatchObject({ ok: true, value: { total: ids.length } })
  55  |       if (!started.ok) throw new Error(started.error.message)
  56  |       expect(await startFlow(page, command)).toEqual(started)
  57  |       const queue = flowQueue(testDataDirectory, started.value.sessionId)
  58  |       expect(queue.map((row) => row['questionId'])).toEqual(ids)
  59  |       for (const row of queue) {
  60  |         const prior = original.find((item) => item['questionId'] === row['questionId'])!
  61  |         expect(row).toEqual({ ...prior, draft: '', revealed: null, rating: null, skipped: null })
  62  |       }
  63  |       const read = await page.evaluate(
  64  |         (sessionId) =>
  65  |           (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId }),
  66  |         started.value.sessionId,
  67  |       )
  68  |       expect(read).toMatchObject({
  69  |         ok: true,
  70  |         value: {
  71  |           session: { repeat: command.repeat },
  72  |           item: { revealed: false, draft: { text: '' } },
  73  |         },
  74  |       })
  75  |       if (read.ok) expect(read.value?.item).not.toHaveProperty('answer')
  76  |       expect(await endFlow(page)).toMatchObject({ ok: true })
  77  |     }
  78  |     expect(flowQueue(testDataDirectory, source.session.sessionId)).toEqual(original)
  79  |     expect(
  80  |       withHistoryDatabase(testDataDirectory, (db) =>
  81  |         db.prepare('SELECT count(*) AS n FROM practice_sessions').get(),
  82  |       ),
  83  |     ).toEqual({ n: 6 })
  84  |     expect(
  85  |       withHistoryDatabase(testDataDirectory, (db) => db.prepare('PRAGMA foreign_key_check').all()),
  86  |     ).toEqual([])
  87  |   } finally {
  88  |     await stop(application)
  89  |   }
  90  | })
  91  | 
  92  | test('再练随机只重排原题，重开保持；空结果/来源不存在/活动来源/写失败均不结束活动轮', async ({
  93  |   testDataDirectory,
  94  | }, info) => {
  95  |   const { application, page } = await prepareFlow(testDataDirectory, info)
  96  |   try {
  97  |     const source = await finishFlow(page)
  98  |     const started = await startFlow(page, {
  99  |       requestId: randomUUID(),
  100 |       topicId: null,
  101 |       count: 'all',
  102 |       replace: null,
  103 |       mode: 'random',
  104 |       repeat: { sessionId: source.session.sessionId, selection: 'all' },
  105 |     })
  106 |     if (!started.ok) throw new Error(started.error.message)
  107 |     const original = flowQueue(testDataDirectory, started.value.sessionId)
  108 |     expect(original.map((row) => row['questionId']).sort()).toEqual([
  109 |       'q-1',
  110 |       'q-2',
  111 |       'q-3',
  112 |       'q-4',
  113 |       'q-5',
  114 |       'q-6',
  115 |     ])
  116 |     const replace = { sessionId: started.value.sessionId, position: 0, revision: 0 }
  117 |     for (const sourceId of [started.value.sessionId, randomUUID()]) {
  118 |       expect(
  119 |         await startFlow(page, {
  120 |           requestId: randomUUID(),
  121 |           topicId: null,
  122 |           count: 'all',
  123 |           replace,
  124 |           repeat: { sessionId: sourceId, selection: 'weak' },
  125 |         }),
  126 |       ).toMatchObject({ ok: false })
  127 |       expect(flowQueue(testDataDirectory, started.value.sessionId)).toEqual(original)
  128 |     }
  129 |     withHistoryDatabase(
  130 |       testDataDirectory,
  131 |       (db) =>
  132 |         db.exec(
  133 |           "CREATE TRIGGER repeat_failure BEFORE INSERT ON practice_items BEGIN SELECT RAISE(ABORT,'repeat failure'); END",
  134 |         ),
  135 |       false,
```