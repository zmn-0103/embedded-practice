# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shortcut-usage.spec.ts >> 最近使用写失败与建轮一起回滚并保留原活动轮，题单仅原成员完整开始时计使用
- Location: tests\e2e\shortcut-usage.spec.ts:70:5

# Error details

```
Error: expect(received).toMatchObject(expected)

- Expected  - 1
+ Received  + 1

  Object {
    "error": Object {
-     "code": "DATABASE_UNAVAILABLE",
+     "code": "WRITE_FAILED",
    },
    "ok": false,
  }
```

# Test source

```ts
  13  | import { changePlan, planOptions, readPlans } from './practice-plan-helpers'
  14  | import { endFlow, startFlow } from './practice-flow-helpers'
  15  | 
  16  | test('方案置顶优先和最近成功建轮排序，查看/改名/原请求重试不计使用', async ({
  17  |   testDataDirectory,
  18  | }, info) => {
  19  |   const { application, page } = await prepareControl(testDataDirectory, info, 3)
  20  |   try {
  21  |     const options = { ...planOptions, mode: 'sequential' as const, count: 'all' as const }
  22  |     const first = { planId: randomUUID(), name: 'A常用', options }
  23  |     const recent = { planId: randomUUID(), name: 'Z最近', options }
  24  |     for (const plan of [first, recent])
  25  |       expect(await changePlan(page, { kind: 'save', ...plan })).toMatchObject({ ok: true })
  26  |     expect(
  27  |       await changePlan(page, { kind: 'pin', planId: first.planId, pinned: true }),
  28  |     ).toMatchObject({ ok: true })
  29  |     expect((await readPlans(page)).map((plan) => [plan.planId, plan.lastUsedAt])).toEqual([
  30  |       [first.planId, null],
  31  |       [recent.planId, null],
  32  |     ])
  33  |     const request = {
  34  |       ...options,
  35  |       requestId: randomUUID(),
  36  |       sourcePlanId: recent.planId,
  37  |       replace: null,
  38  |     }
  39  |     const started = await startFlow(page, request)
  40  |     expect(started).toMatchObject({ ok: true })
  41  |     const beforeRetry = await readPlans(page)
  42  |     expect(beforeRetry.map((plan) => plan.planId)).toEqual([first.planId, recent.planId])
  43  |     expect(beforeRetry[1]!.lastUsedAt).toMatch(/^\d{4}-/)
  44  |     expect(await startFlow(page, request)).toEqual(started)
  45  |     expect(await readPlans(page)).toEqual(beforeRetry)
  46  |     await changePlan(page, { kind: 'pin', planId: first.planId, pinned: false })
  47  |     expect((await readPlans(page)).map((plan) => plan.planId)).toEqual([
  48  |       recent.planId,
  49  |       first.planId,
  50  |     ])
  51  |     await endFlow(page)
  52  |     // 使用改动后的条件不是原方案，不能把原方案计为最近使用。
  53  |     const previousTime = (await readPlans(page))[1]!.lastUsedAt
  54  |     expect(
  55  |       await startFlow(page, {
  56  |         ...request,
  57  |         requestId: randomUUID(),
  58  |         sourcePlanId: first.planId,
  59  |         count: 10,
  60  |       }),
  61  |     ).toMatchObject({ ok: true })
  62  |     expect((await readPlans(page)).find((plan) => plan.planId === first.planId)!.lastUsedAt).toBe(
  63  |       previousTime,
  64  |     )
  65  |   } finally {
  66  |     await stop(application)
  67  |   }
  68  | })
  69  | 
  70  | test('最近使用写失败与建轮一起回滚并保留原活动轮，题单仅原成员完整开始时计使用', async ({
  71  |   testDataDirectory,
  72  | }, info) => {
  73  |   const { application, page } = await prepareControl(testDataDirectory, info, 3)
  74  |   try {
  75  |     const setId = randomUUID()
  76  |     expect(
  77  |       await changeSet(page, { kind: 'save', setId, name: '面试题单', items: [a(1), a(2)] }),
  78  |     ).toMatchObject({ ok: true })
  79  |     const selection = {
  80  |       ...(await selectForPractice(page, [a(1), a(2)], '题单：面试题单')),
  81  |       sourceSetId: setId,
  82  |     }
  83  |     expect((await readSets(page))[0]!.lastUsedAt).toBeNull()
  84  |     await changeSet(page, { kind: 'pin', setId, pinned: true })
  85  |     const started = await startFlow(page, {
  86  |       requestId: randomUUID(),
  87  |       topicId: null,
  88  |       count: 'all',
  89  |       replace: null,
  90  |       selected: selection,
  91  |     })
  92  |     if (!started.ok) throw new Error(started.error.message)
  93  |     const recent = (await readSets(page))[0]!
  94  |     expect(recent).toMatchObject({ pinned: true })
  95  |     expect(recent.lastUsedAt).toMatch(/^\d{4}-/)
  96  |     withHistoryDatabase(
  97  |       testDataDirectory,
  98  |       (db) =>
  99  |         db.exec(
  100 |           "CREATE TRIGGER usage_failure BEFORE UPDATE OF last_used_at ON question_sets BEGIN SELECT RAISE(ABORT,'usage write'); END",
  101 |         ),
  102 |       false,
  103 |     )
  104 |     const before = withHistoryDatabase(testDataDirectory, controlRecords)
  105 |     const { sessionId, position, revision } = started.value
  106 |     const request = {
  107 |       requestId: randomUUID(),
  108 |       topicId: null,
  109 |       count: 'all' as const,
  110 |       replace: { sessionId, position, revision },
  111 |       selected: selection,
  112 |     }
> 113 |     expect(await startFlow(page, request)).toMatchObject({
      |                                            ^ Error: expect(received).toMatchObject(expected)
  114 |       ok: false,
  115 |       error: { code: 'DATABASE_UNAVAILABLE' },
  116 |     })
  117 |     expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
  118 |     withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER usage_failure'), false)
  119 |     expect(
  120 |       await startFlow(page, {
  121 |         ...request,
  122 |         selected: { ...selection, items: selection.items.slice(0, 1) },
  123 |       }),
  124 |     ).toMatchObject({ ok: true })
  125 |     expect((await readSets(page))[0]!.lastUsedAt).toBe(recent.lastUsedAt)
  126 |   } finally {
  127 |     await stop(application)
  128 |   }
  129 | })
  130 | 
  131 | test('界面置顶/取消置顶方案与题单，题单载入后仍确认组卷并记录使用', async ({
  132 |   testDataDirectory,
  133 | }, info) => {
  134 |   const { application, page } = await prepareControl(testDataDirectory, info, 3)
  135 |   try {
  136 |     await page
  137 |       .locator('.question-selection-row')
  138 |       .filter({ has: page.getByText('组卷题 A 1', { exact: true }) })
  139 |       .getByRole('checkbox')
  140 |       .check()
  141 |     await page.locator('.question-selection-panel > summary').click()
  142 |     const panel = page.getByLabel('勾选组卷与固定题单', { exact: true })
  143 |     await panel.getByLabel('题单名称', { exact: true }).fill('常用面试')
  144 |     await panel.getByRole('button', { name: '保存为新题单', exact: true }).click()
  145 |     await expect(panel.getByRole('status')).toHaveText('固定题单已保存。')
  146 |     const set = (await readSets(page))[0]!
  147 |     await panel.getByLabel('选用固定题单').selectOption(set.setId)
  148 |     await panel.getByRole('button', { name: '置顶题单', exact: true }).click()
  149 |     await expect(panel.getByRole('status')).toHaveText('题单已置顶。')
  150 |     await panel.getByRole('button', { name: '取消置顶题单', exact: true }).click()
  151 |     await expect(panel.getByRole('status')).toHaveText('题单已取消置顶。')
  152 |     await panel.getByRole('button', { name: '载入题单并替换当前勾选', exact: true }).click()
  153 |     expect((await readSets(page))[0]!.lastUsedAt).toBeNull()
  154 |     await panel.getByRole('button', { name: '确认这批题目并练习…', exact: true }).click()
  155 |     await page.getByRole('button', { name: '确认开始组卷（1题）', exact: true }).click()
  156 |     await expect(page.getByLabel('练习进度')).toContainText('第 1 / 1')
  157 |     expect((await readSets(page))[0]!.lastUsedAt).toMatch(/^\d{4}-/)
  158 |     await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
  159 |     await openPage(page, '开始练习')
  160 |     const plans = page.locator('.practice-plans')
  161 |     await plans.getByLabel('方案名称', { exact: true }).fill('每日常用')
  162 |     await plans.getByRole('button', { name: '保存当前条件为方案', exact: true }).click()
  163 |     await expect(plans.getByRole('status')).toHaveText('练习方案已保存。')
  164 |     const plan = (await readPlans(page))[0]!
  165 |     await plans.getByLabel('选用练习方案').selectOption(plan.planId)
  166 |     await plans.getByRole('button', { name: '置顶方案', exact: true }).click()
  167 |     await expect(plans.getByRole('status')).toHaveText('方案已置顶。')
  168 |     await plans.getByRole('button', { name: '填入条件', exact: true }).click()
  169 |     expect((await readPlans(page))[0]!.lastUsedAt).toBeNull()
  170 |     await plans.getByRole('button', { name: '取消置顶方案', exact: true }).click()
  171 |     await expect(plans.getByRole('status')).toHaveText('方案已取消置顶。')
  172 |     const runtime = await application.evaluate(({ app }) => ({
  173 |       exe: process.execPath,
  174 |       data: app.getPath('userData'),
  175 |       packaged: app.isPackaged,
  176 |     }))
  177 |     await info.attach('shortcut-runtime', {
  178 |       body: JSON.stringify(runtime),
  179 |       contentType: 'application/json',
  180 |     })
  181 |     await page.screenshot({ path: info.outputPath('shortcuts.png') })
  182 |     const active = await page.evaluate(() =>
  183 |       (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
  184 |     )
  185 |     expect(active).toMatchObject({ ok: true, value: { session: { total: 1 } } })
  186 |   } finally {
  187 |     await stop(application)
  188 |   }
  189 | })
  190 | 
```