# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: personal-tags.spec.ts >> 个人标签可创建/改名/跨专题批量添加移除并用于题库和方案
- Location: tests\e2e\personal-tags.spec.ts:27:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.check: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('.question-selection-row').filter({ has: getByText('组卷题 A 1', { exact: true }) }).getByRole('checkbox')
    - locator resolved to <input type="checkbox" aria-label="勾选题目：control-a / q-1 组卷题 A 1"/>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <main tabindex="-1" id="main-content">…</main> intercepts pointer events
  - retrying click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <section tabindex="-1" aria-label="题库浏览" aria-busy="false" data-records="false" data-reading="false" class="library-workspace">…</section> intercepts pointer events
  - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <main tabindex="-1" id="main-content">…</main> intercepts pointer events
    - retrying click action
      - waiting 100ms
    14 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <main tabindex="-1" id="main-content">…</main> intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <section tabindex="-1" aria-label="题库浏览" aria-busy="false" data-records="false" data-reading="false" class="library-workspace">…</section> intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <main tabindex="-1" id="main-content">…</main> intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <main tabindex="-1" id="main-content">…</main> intercepts pointer events
     - retrying click action
       - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <main tabindex="-1" id="main-content">…</main> intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <section tabindex="-1" aria-label="题库浏览" aria-busy="false" data-records="false" data-reading="false" class="library-workspace">…</section> intercepts pointer events
  - retrying click action
    - waiting 500ms

```

# Test source

```ts
  1   | import { randomUUID } from 'node:crypto'
  2   | import { writeFile } from 'node:fs/promises'
  3   | import type { Page } from '@playwright/test'
  4   | import type { DesktopApi } from '../../src/shared/contracts/application'
  5   | import type { PersonalTagChange } from '../../src/shared/contracts/personal-tags'
  6   | import { expect, openPage, test } from './helpers'
  7   | import { importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
  8   | import { a, b, controlBank, prepareControl } from './practice-control-helpers'
  9   | import { changePlan, planOptions, readPlans } from './practice-plan-helpers'
  10  | import { openLibraryNote, readNote } from './study-helpers'
  11  | 
  12  | function changeTag(page: Page, input: PersonalTagChange) {
  13  |   return page.evaluate(
  14  |     (command) =>
  15  |       (globalThis as unknown as { desktop: DesktopApi }).desktop.personalTags.change(command),
  16  |     input,
  17  |   )
  18  | }
  19  | function assignments(directory: string) {
  20  |   return withHistoryDatabase(directory, (db) =>
  21  |     db
  22  |       .prepare('SELECT question_id,tag_id FROM question_personal_tags ORDER BY question_id,tag_id')
  23  |       .all(),
  24  |   )
  25  | }
  26  | 
  27  | test('个人标签可创建/改名/跨专题批量添加移除并用于题库和方案', async ({
  28  |   testDataDirectory,
  29  | }, info) => {
  30  |   const { application, page } = await prepareControl(testDataDirectory, info, 3)
  31  |   try {
  32  |     const panel = page
  33  |       .locator('details')
  34  |       .filter({ has: page.locator('summary', { hasText: /^个人标签（/ }) })
  35  |     await panel.locator('summary').click()
  36  |     await panel.getByLabel('个人标签名称', { exact: true }).fill('面试前必看')
  37  |     await panel.getByRole('button', { name: '创建个人标签', exact: true }).click()
  38  |     await expect(panel.getByRole('status')).toHaveText('个人标签已保存。')
  39  |     const result = await page.evaluate(() =>
  40  |       (globalThis as unknown as { desktop: DesktopApi }).desktop.personalTags.list(),
  41  |     )
  42  |     if (!result.ok) throw new Error(result.error.message)
  43  |     const tag = result.value[0]!
  44  |     await panel.getByLabel('操作的个人标签').selectOption(tag.tagId)
  45  |     await page
  46  |       .locator('.question-selection-row')
  47  |       .filter({ has: page.getByText('组卷题 A 1', { exact: true }) })
  48  |       .getByRole('checkbox')
> 49  |       .check()
      |        ^ TimeoutError: locator.check: Timeout 30000ms exceeded.
  50  |     await page
  51  |       .locator('.question-selection-row')
  52  |       .filter({ has: page.getByText('组卷题 B 2', { exact: true }) })
  53  |       .getByRole('checkbox')
  54  |       .check()
  55  |     await panel.getByRole('button', { name: '为勾选题目添加个人标签', exact: true }).click()
  56  |     await expect(panel.getByRole('status')).toHaveText('已为明确勾选的2题添加个人标签。')
  57  |     expect(assignments(testDataDirectory)).toHaveLength(2)
  58  |     await page.getByLabel('题库个人标签', { exact: true }).selectOption(tag.tagId)
  59  |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  60  |     await expect(page.locator('.question-row')).toHaveCount(2)
  61  |     await panel.getByLabel('个人标签名称', { exact: true }).fill('讲清楚再进面试')
  62  |     await panel.getByRole('button', { name: '重命名个人标签', exact: true }).click()
  63  |     await expect(panel.getByRole('status')).toHaveText('个人标签已保存。')
  64  |     await expect(page.getByLabel('题库个人标签').locator('option:checked')).toHaveText(
  65  |       '讲清楚再进面试',
  66  |     )
  67  |     const plan = {
  68  |       planId: randomUUID(),
  69  |       name: '按个人标签练',
  70  |       options: { ...planOptions, filters: { ...planOptions.filters, personalTagId: tag.tagId } },
  71  |     }
  72  |     expect(await changePlan(page, { kind: 'save', ...plan })).toMatchObject({ ok: true })
  73  |     expect((await readPlans(page))[0]).toMatchObject({
  74  |       ...plan,
  75  |       matchingCount: 2,
  76  |       personalTagMissing: false,
  77  |     })
  78  |     await panel.getByRole('button', { name: '从勾选题目移除个人标签', exact: true }).click()
  79  |     await expect(panel.getByRole('status')).toHaveText('已为明确勾选的2题移除个人标签。')
  80  |     await expect(page.locator('.question-row')).toHaveCount(0)
  81  |     expect(assignments(testDataDirectory)).toEqual([])
  82  |   } finally {
  83  |     await stop(application)
  84  |   }
  85  | })
  86  | 
  87  | test('个人标签重导入/归档保留，失效成员或真实写失败整批回滚，删除不扩大方案', async ({
  88  |   testDataDirectory,
  89  | }, info) => {
  90  |   const { application, page, file } = await prepareControl(testDataDirectory, info, 3)
  91  |   try {
  92  |     const tagId = randomUUID()
  93  |     expect(await changeTag(page, { kind: 'save', tagId, name: 'Project' })).toMatchObject({
  94  |       ok: true,
  95  |     })
  96  |     expect(
  97  |       await changeTag(page, { kind: 'save', tagId: randomUUID(), name: 'pROJECT' }),
  98  |     ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } })
  99  |     const assign = { kind: 'assign' as const, tagId, present: true, items: [a(1), b(2)] }
  100 |     expect(await changeTag(page, assign)).toMatchObject({ ok: true })
  101 |     expect(await changeTag(page, assign)).toMatchObject({ ok: true })
  102 |     const before = assignments(testDataDirectory)
  103 |     expect(
  104 |       await changeTag(page, {
  105 |         ...assign,
  106 |         items: [a(2), { topicId: 'missing', questionId: 'q-1' }],
  107 |       }),
  108 |     ).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } })
  109 |     expect(assignments(testDataDirectory)).toEqual(before)
  110 |     withHistoryDatabase(
  111 |       testDataDirectory,
  112 |       (db) =>
  113 |         db.exec(
  114 |           "CREATE TRIGGER tag_failure BEFORE INSERT ON question_personal_tags WHEN NEW.question_id=(SELECT id FROM questions WHERE topic_id='control-b' AND question_id='q-3') BEGIN SELECT RAISE(ABORT,'tag write'); END",
  115 |         ),
  116 |       false,
  117 |     )
  118 |     expect(await changeTag(page, { ...assign, items: [a(2), b(3)] })).toMatchObject({
  119 |       ok: false,
  120 |       error: { code: 'DATABASE_UNAVAILABLE' },
  121 |     })
  122 |     expect(assignments(testDataDirectory)).toEqual(before)
  123 |     withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER tag_failure'), false)
  124 |     await writeFile(file, controlBank('control-a', 3, true, 1))
  125 |     await importHistoryFiles(application, page, [file])
  126 |     expect(assignments(testDataDirectory)).toEqual(before)
  127 |     const options = { ...planOptions, filters: { ...planOptions.filters, personalTagId: tagId } }
  128 |     const planId = randomUUID()
  129 |     expect(
  130 |       await changePlan(page, { kind: 'save', planId, name: '标签条件', options }),
  131 |     ).toMatchObject({ ok: true })
  132 |     expect(
  133 |       await changeTag(page, { kind: 'rename', tagId, expectedName: 'Project', name: '项目用过' }),
  134 |     ).toMatchObject({ ok: true })
  135 |     expect((await readPlans(page))[0]).toMatchObject({
  136 |       personalTagMissing: false,
  137 |       matchingCount: 1,
  138 |     })
  139 |     expect(await changeTag(page, { kind: 'delete', tagId, expectedName: 'Project' })).toMatchObject(
  140 |       { ok: false },
  141 |     )
  142 |     expect(
  143 |       await changeTag(page, { kind: 'delete', tagId, expectedName: '项目用过' }),
  144 |     ).toMatchObject({ ok: true })
  145 |     expect((await readPlans(page))[0]).toMatchObject({
  146 |       options,
  147 |       personalTagMissing: true,
  148 |       matchingCount: 0,
  149 |     })
```