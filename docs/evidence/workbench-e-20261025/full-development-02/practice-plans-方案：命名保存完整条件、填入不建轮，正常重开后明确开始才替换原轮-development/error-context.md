# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: practice-plans.spec.ts >> 方案：命名保存完整条件、填入不建轮，正常重开后明确开始才替换原轮
- Location: tests\e2e\practice-plans.spec.ts:9:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.check: Timeout 30000ms exceeded.
Call log:
  - waiting for getByLabel('练习只看收藏', { exact: true })
    - locator resolved to <input type="checkbox" aria-label="练习只看收藏"/>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <button type="button" role="option" tabindex="-1" id="_r_5_-option-0" aria-selected="false">共同</button> from <div class="tag-picker">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <button type="button" role="option" tabindex="-1" id="_r_5_-option-0" aria-selected="false">共同</button> from <div class="tag-picker">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    58 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <button type="button" role="option" tabindex="-1" id="_r_5_-option-0" aria-selected="false">共同</button> from <div class="tag-picker">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms

```

# Test source

```ts
  1   | import { randomUUID } from 'node:crypto'
  2   | import type { DesktopApi } from '../../src/shared/contracts/application'
  3   | import { EMPTY_QUESTION_FILTERS } from '../../src/shared/contracts/question-filters'
  4   | import { expect, launchApplication, openPage, test } from './helpers'
  5   | import { assignTopic, categoryChange, categoryList, prepareCategories } from './category-helpers'
  6   | import { historySnapshot, stop, withHistoryDatabase } from './history-helpers'
  7   | import { changePlan, openPlans, planOptions, readPlans, savePlan } from './practice-plan-helpers'
  8   | 
  9   | test('方案：命名保存完整条件、填入不建轮，正常重开后明确开始才替换原轮', async ({
  10  |   testDataDirectory,
  11  | }, info) => {
  12  |   const prepared = await prepareCategories(testDataDirectory, info.project.name)
  13  |   let instance = { application: prepared.application, page: prepared.page }
  14  |   const draft = '方案验收原轮草稿\n    preserved_before_plan();'
  15  |   try {
  16  |     expect(
  17  |       await instance.page.evaluate(() =>
  18  |         (globalThis as unknown as { desktop: DesktopApi }).desktop.library.setFavorite({
  19  |           topicId: 'cat-a',
  20  |           questionId: 'q-1',
  21  |           favorite: true,
  22  |         }),
  23  |       ),
  24  |     ).toMatchObject({ ok: true })
  25  |     await openPage(instance.page, '开始练习')
  26  |     await instance.page.getByLabel('本轮题数', { exact: true }).selectOption('all')
  27  |     await instance.page.getByRole('button', { name: '开始练习', exact: true }).click()
  28  |     await instance.page.getByRole('textbox', { name: '我的答案', exact: true }).fill(draft)
  29  |     await instance.page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
  30  |     const original = historySnapshot(testDataDirectory)
  31  |     await instance.page.getByText('按分类选择专题', { exact: true }).click()
  32  |     await instance.page.getByRole('button', { name: '练习分类：板块 A', exact: true }).click()
  33  |     await instance.page.getByLabel('练习专题', { exact: true }).selectOption('cat-a')
  34  |     await instance.page.getByLabel('练习模式', { exact: true }).selectOption('random')
  35  |     await instance.page.getByLabel('本轮题数', { exact: true }).selectOption('10')
  36  |     await instance.page.getByText('筛选练习题目', { exact: true }).click()
  37  |     await instance.page.getByLabel('练习搜索', { exact: true }).fill('CATEGORY-BODY-cat-a')
  38  |     await instance.page.getByLabel('练习标签', { exact: true }).fill('共同')
  39  |     await instance.page.getByLabel('练习难度', { exact: true }).selectOption('基础')
  40  |     await instance.page.getByLabel('练习自评状态', { exact: true }).selectOption('unpracticed')
> 41  |     await instance.page.getByLabel('练习只看收藏', { exact: true }).check()
      |                                                               ^ TimeoutError: locator.check: Timeout 30000ms exceeded.
  42  |     const saved = await savePlan(instance.page, '板块A收藏基础随机10')
  43  |     expect(saved.options).toEqual({
  44  |       category: { kind: 'category', categoryId: prepared.first },
  45  |       topicId: 'cat-a',
  46  |       mode: 'random',
  47  |       count: 10,
  48  |       filters: {
  49  |         ...EMPTY_QUESTION_FILTERS,
  50  |         query: 'CATEGORY-BODY-cat-a',
  51  |         tag: '共同',
  52  |         difficulty: '基础',
  53  |         mastery: 'unpracticed',
  54  |         favoritesOnly: true,
  55  |       },
  56  |     })
  57  |     await instance.page.getByRole('button', { name: '练习分类：未分类', exact: true }).click()
  58  |     await instance.page.getByLabel('练习模式', { exact: true }).selectOption('sequential')
  59  |     await instance.page.getByLabel('本轮题数', { exact: true }).selectOption('50')
  60  |     await instance.page.getByRole('button', { name: '全部题目', exact: true }).click()
  61  |     const panel = await openPlans(instance.page)
  62  |     await panel.getByLabel('选用练习方案', { exact: true }).selectOption(saved.planId)
  63  |     await panel.getByRole('button', { name: '将方案填入练习条件', exact: true }).click()
  64  |     await expect(instance.page.getByText('匹配 1 题', { exact: true })).toBeVisible()
  65  |     await expect(instance.page.getByLabel('练习模式', { exact: true })).toHaveValue('random')
  66  |     await expect(instance.page.getByLabel('练习专题', { exact: true })).toHaveValue('cat-a')
  67  |     await expect(instance.page.getByLabel('本轮题数', { exact: true })).toHaveValue('10')
  68  |     await expect(instance.page.getByLabel('练习搜索', { exact: true })).toHaveValue(
  69  |       saved.options.filters.query,
  70  |     )
  71  |     await expect(instance.page.getByLabel('练习只看收藏', { exact: true })).toBeChecked()
  72  |     expect(historySnapshot(testDataDirectory)).toEqual(original)
  73  |     await info.attach('practice-plan-filled.png', {
  74  |       body: await instance.page.screenshot({ fullPage: true }),
  75  |       contentType: 'image/png',
  76  |     })
  77  |     const closed = instance.application.waitForEvent('close')
  78  |     await instance.application.evaluate(({ BrowserWindow }) =>
  79  |       BrowserWindow.getAllWindows()[0]!.close(),
  80  |     )
  81  |     await closed
  82  |     instance = await launchApplication(testDataDirectory, info.project.name)
  83  |     expect(await readPlans(instance.page)).toEqual([saved])
  84  |     expect(historySnapshot(testDataDirectory)).toEqual(original)
  85  |     const reopened = await openPlans(instance.page)
  86  |     await reopened.getByLabel('选用练习方案', { exact: true }).selectOption(saved.planId)
  87  |     await reopened.getByRole('button', { name: '将方案填入练习条件', exact: true }).click()
  88  |     await expect(instance.page.getByText('匹配 1 题', { exact: true })).toBeVisible()
  89  |     await instance.page.getByRole('button', { name: '结束本轮并开始新练习', exact: true }).click()
  90  |     await expect(instance.page.getByLabel('练习进度')).toHaveText('第 1 / 1 题 · 随机练习')
  91  |     expect(
  92  |       await instance.page.evaluate(() =>
  93  |         (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({
  94  |           sessionId: null,
  95  |         }),
  96  |       ),
  97  |     ).toMatchObject({
  98  |       ok: true,
  99  |       value: {
  100 |         session: {
  101 |           filters: saved.options.filters,
  102 |           category: { kind: 'category', categoryId: prepared.first, title: '板块 A' },
  103 |         },
  104 |         item: { topicId: 'cat-a', questionId: 'q-1' },
  105 |       },
  106 |     })
  107 |     expect(historySnapshot(testDataDirectory).items.some((row) => row.draft === draft)).toBe(true)
  108 |   } finally {
  109 |     await stop(instance.application)
  110 |   }
  111 | })
  112 | 
  113 | test('方案：原ID重试、同名拒绝、容量、写入回滚及坏JSON读取，不改变原业务或题库修订', async ({
  114 |   testDataDirectory,
  115 | }, info) => {
  116 |   const { application, page } = await prepareCategories(testDataDirectory, info.project.name)
  117 |   try {
  118 |     const before = historySnapshot(testDataDirectory),
  119 |       revision = (await categoryList(page)).revision
  120 |     const command = {
  121 |       kind: 'save' as const,
  122 |       planId: randomUUID(),
  123 |       name: 'rule-plan',
  124 |       options: planOptions,
  125 |     }
  126 |     for (let i = 0; i < 2; i++)
  127 |       expect(await changePlan(page, command)).toEqual({ ok: true, value: null })
  128 |     expect(await readPlans(page)).toHaveLength(1)
  129 |     for (const changed of [
  130 |       { ...command, name: '其他条件' },
  131 |       { ...command, planId: randomUUID(), name: 'RULE-PLAN' },
  132 |     ])
  133 |       expect(await changePlan(page, changed)).toMatchObject({
  134 |         ok: false,
  135 |         error: { code: 'INVALID_REQUEST' },
  136 |       })
  137 |     expect(
  138 |       await changePlan(page, {
  139 |         ...command,
  140 |         planId: randomUUID(),
  141 |         name: '失效范围',
```