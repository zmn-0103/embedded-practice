# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: practice-recency.spec.ts >> 当前版本最近揭晓：7/30天精确边界、旧版本重导入、仅自评未知时间与最久优先顺序
- Location: tests\e2e\practice-recency.spec.ts:34:5

# Error details

```
Error: UNIQUE constraint failed: question_user_state.question_id
```

# Test source

```ts
  1   | import { randomUUID } from 'node:crypto'
  2   | import { writeFile } from 'node:fs/promises'
  3   | import type { Page } from '@playwright/test'
  4   | import type { DesktopApi } from '../../src/shared/contracts/application'
  5   | import {
  6   |   EMPTY_QUESTION_FILTERS,
  7   |   type QuestionFilters,
  8   | } from '../../src/shared/contracts/question-filters'
  9   | import { expect, launchApplication, openPage, test } from './helpers'
  10  | import { captureHistory, importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
  11  | import { a, controlBank, prepareControl } from './practice-control-helpers'
  12  | import { endFlow, startFlow } from './practice-flow-helpers'
  13  | import { changePlan, openPlans, planOptions, readPlans, savePlan } from './practice-plan-helpers'
  14  | import { arrangeReview } from './review-helpers'
  15  | import { chooseTheme } from './theme-helpers'
  16  | 
  17  | function questions(page: Page, change: Partial<QuestionFilters> = {}, topicId = 'control-a') {
  18  |   return page.evaluate(
  19  |     (input) =>
  20  |       (globalThis as unknown as { desktop: DesktopApi }).desktop.library.listQuestions(input),
  21  |     { topicId, archived: false, page: 1, filters: { ...EMPTY_QUESTION_FILTERS, ...change } },
  22  |   )
  23  | }
  24  | function queue(directory: string, session: string) {
  25  |   return withHistoryDatabase(directory, (db) =>
  26  |     db
  27  |       .prepare(
  28  |         'SELECT q.question_id AS questionId,p.version_id AS versionId FROM practice_items p JOIN questions q ON q.id=p.question_id WHERE p.session_id=? ORDER BY p.position',
  29  |       )
  30  |       .all(session),
  31  |   ) as { questionId: string; versionId: number }[]
  32  | }
  33  | 
  34  | test('当前版本最近揭晓：7/30天精确边界、旧版本重导入、仅自评未知时间与最久优先顺序', async ({
  35  |   testDataDirectory,
  36  | }, info) => {
  37  |   const { application, page, file } = await prepareControl(testDataDirectory, info, 8)
  38  |   try {
  39  |     const now = Date.parse('2026-10-29T03:00:00.000Z')
  40  |     await application.evaluate((_, now) => {
  41  |       Date.now = () => now
  42  |     }, now)
  43  |     const started = await startFlow(page, {
  44  |       requestId: randomUUID(),
  45  |       topicId: 'control-a',
  46  |       count: 'all',
  47  |       replace: null,
  48  |     })
  49  |     expect(started.ok).toBe(true)
  50  |     if (!started.ok) throw new Error('准备轮失败')
  51  |     expect(await endFlow(page)).toMatchObject({ ok: true })
  52  |     // 通过公开建轮取得真实队列，再以固定时刻设置日期夹具，精确覆盖窗口边界。
  53  |     withHistoryDatabase(
  54  |       testDataDirectory,
  55  |       (db) => {
  56  |         const update = db.prepare(
  57  |           'UPDATE practice_items SET revealed_at=? WHERE session_id=? AND question_id=(SELECT id FROM questions WHERE topic_id=? AND question_id=?)',
  58  |         )
  59  |         for (const [number, days] of [
  60  |           [1, 1],
  61  |           [2, 8],
  62  |           [3, 31],
  63  |           [4, 7],
  64  |           [5, 30],
  65  |           [8, 1],
  66  |         ])
  67  |           update.run(
  68  |             new Date(now - days! * 86400000).toISOString(),
  69  |             started.value.sessionId,
  70  |             'control-a',
  71  |             `q-${number}`,
  72  |           )
> 73  |         db.exec(
      |            ^ Error: UNIQUE constraint failed: question_user_state.question_id
  74  |           "INSERT INTO question_user_state(question_id,favorite,last_rating,last_rated_version_id) SELECT id,0,'不熟',current_version_id FROM questions WHERE topic_id='control-a' AND question_id='q-6'",
  75  |         )
  76  |       },
  77  |       false,
  78  |     )
  79  |     await arrangeReview(page, a(7))
  80  |     await page.evaluate(() =>
  81  |       (globalThis as unknown as { desktop: DesktopApi }).desktop.study.saveNote({
  82  |         ...{ topicId: 'control-a', questionId: 'q-7' },
  83  |         expectedRevision: 0,
  84  |         text: '编辑笔记和待办不计练习',
  85  |       }),
  86  |     )
  87  |     await writeFile(
  88  |       file,
  89  |       controlBank('control-a', 8).replace(
  90  |         'CONTROL-OLD-BODY-control-a-8',
  91  |         'CONTROL-NEW-BODY-control-a-8',
  92  |       ),
  93  |     )
  94  |     await importHistoryFiles(application, page, [file])
  95  |     const defaults = await questions(page)
  96  |     if (!defaults.ok) throw new Error(defaults.error.message)
  97  |     expect(defaults.value.questions.map((item) => item.questionId)).toEqual(
  98  |       Array.from({ length: 8 }, (_, i) => `q-${i + 1}`),
  99  |     )
  100 |     for (const item of defaults.value.questions) expect(item).not.toHaveProperty('lastPracticedAt')
  101 |     for (const [practiceRecency, expected] of [
  102 |       ['never', [7, 8]],
  103 |       ['7d', [2, 3, 5, 7, 8]],
  104 |       ['30d', [3, 7, 8]],
  105 |     ] as const) {
  106 |       const result = await questions(page, { practiceRecency })
  107 |       if (!result.ok) throw new Error(result.error.message)
  108 |       expect(result.value.questions.map((item) => item.questionId)).toEqual(
  109 |         expected.map((n) => `q-${n}`),
  110 |       )
  111 |     }
  112 |     const ordered = await questions(page, { practiceOrder: 'oldest' })
  113 |     if (!ordered.ok) throw new Error(ordered.error.message)
  114 |     expect(ordered.value.questions.map((item) => item.questionId)).toEqual(
  115 |       [7, 8, 3, 5, 2, 4, 1, 6].map((n) => `q-${n}`),
  116 |     )
  117 |     expect(ordered.value.questions.find((item) => item.questionId === 'q-6')).toMatchObject({
  118 |       practiced: true,
  119 |       lastPracticedAt: null,
  120 |     })
  121 |     expect(ordered.value.questions.find((item) => item.questionId === 'q-8')).toMatchObject({
  122 |       practiced: false,
  123 |       lastPracticedAt: null,
  124 |       contentUpdated: true,
  125 |     })
  126 |     expect(ordered.value.questions.find((item) => item.questionId === 'q-4')?.lastPracticedAt).toBe(
  127 |       '2026-10-22T03:00:00.000Z',
  128 |     )
  129 |     // 时区不同但表示同一时刻时，按真实时间比较。
  130 |     withHistoryDatabase(
  131 |       testDataDirectory,
  132 |       (db) =>
  133 |         db
  134 |           .prepare(
  135 |             "UPDATE practice_items SET revealed_at='2026-10-22T11:00:00+08:00' WHERE session_id=? AND question_id=(SELECT id FROM questions WHERE topic_id='control-a' AND question_id='q-4')",
  136 |           )
  137 |           .run(started.value.sessionId),
  138 |       false,
  139 |     )
  140 |     const offset = await questions(page, { practiceRecency: '7d' })
  141 |     if (!offset.ok) throw new Error(offset.error.message)
  142 |     expect(offset.value.questions.map((item) => item.questionId)).toEqual([
  143 |       'q-2',
  144 |       'q-3',
  145 |       'q-5',
  146 |       'q-7',
  147 |       'q-8',
  148 |     ])
  149 |     const second = await startFlow(page, {
  150 |       requestId: randomUUID(),
  151 |       topicId: 'control-a',
  152 |       count: 'all',
  153 |       replace: null,
  154 |     })
  155 |     if (!second.ok) throw new Error(second.error.message)
  156 |     await endFlow(page)
  157 |     withHistoryDatabase(
  158 |       testDataDirectory,
  159 |       (db) =>
  160 |         db
  161 |           .prepare(
  162 |             "UPDATE practice_items SET revealed_at=? WHERE session_id=? AND question_id=(SELECT id FROM questions WHERE topic_id='control-a' AND question_id='q-2')",
  163 |           )
  164 |           .run(new Date(now - 86400000).toISOString(), second.value.sessionId),
  165 |       false,
  166 |     )
  167 |     const latest = await questions(page, { practiceRecency: '7d' })
  168 |     if (!latest.ok) throw new Error(latest.error.message)
  169 |     expect(latest.value.questions.map((item) => item.questionId)).toEqual([
  170 |       'q-3',
  171 |       'q-5',
  172 |       'q-7',
  173 |       'q-8',
```