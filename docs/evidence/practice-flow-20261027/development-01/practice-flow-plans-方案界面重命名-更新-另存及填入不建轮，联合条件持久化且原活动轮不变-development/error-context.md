# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: practice-flow-plans.spec.ts >> 方案界面重命名/更新/另存及填入不建轮，联合条件持久化且原活动轮不变
- Location: tests\e2e\practice-flow-plans.spec.ts:123:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '开始练习', exact: true })

```

# Test source

```ts
  30  |         revision: session.revision,
  31  |       },
  32  |       draft: item.draft,
  33  |     })
  34  |     if (!revealed.ok) throw new Error(revealed.error.message)
  35  |     return api.rateAndAdvance({
  36  |       requestId: crypto.randomUUID(),
  37  |       cursor: {
  38  |         sessionId: revealed.value.sessionId,
  39  |         position: revealed.value.position,
  40  |         revision: revealed.value.revision,
  41  |       },
  42  |       draft: item.draft,
  43  |       rating,
  44  |     })
  45  |   }, rating)
  46  | }
  47  | 
  48  | test('联合筛选列表/匹配数/建轮一致，旧自评排除，练旧版本不覆盖最新版本已掌握', async ({
  49  |   testDataDirectory,
  50  | }, info) => {
  51  |   const { application, page, file } = await prepareFlow(testDataDirectory, info)
  52  |   try {
  53  |     const source = await finishFlow(page)
  54  |     const filters = { ...EMPTY_QUESTION_FILTERS, mastery: '不会＋不熟' as const }
  55  |     const list = await categoryList(page, { filters })
  56  |     expect(list.total).toBe(2)
  57  |     expect(list.questions.map((q) => q.questionId)).toEqual(['q-1', 'q-2'])
  58  |     const started = await startFlow(page, {
  59  |       requestId: randomUUID(),
  60  |       topicId: 'flow-main',
  61  |       count: 10,
  62  |       replace: null,
  63  |       filters,
  64  |     })
  65  |     if (!started.ok) throw new Error(started.error.message)
  66  |     expect(started.value.total).toBe(2)
  67  |     expect(
  68  |       flowQueue(testDataDirectory, started.value.sessionId).map((row) => row['questionId']),
  69  |     ).toEqual(['q-1', 'q-2'])
  70  |     expect(await endFlow(page)).toMatchObject({ ok: true })
  71  |     expect((await categoryList(page, { filters: { ...filters, query: 'QUESTION-2' } })).total).toBe(
  72  |       1,
  73  |     )
  74  |     expect((await categoryList(page, { filters: { ...filters, favoritesOnly: true } })).total).toBe(
  75  |       0,
  76  |     )
  77  |     await writeFile(file, flowBank(true))
  78  |     await importHistoryFiles(application, page, [file])
  79  |     expect((await categoryList(page, { filters })).total).toBe(0)
  80  |     expect(
  81  |       await startFlow(page, {
  82  |         requestId: randomUUID(),
  83  |         topicId: 'flow-main',
  84  |         count: 'all',
  85  |         replace: null,
  86  |         filters: { ...EMPTY_QUESTION_FILTERS, query: 'FLOW-NEW-QUESTION-1' },
  87  |       }),
  88  |     ).toMatchObject({ ok: true, value: { total: 1 } })
  89  |     expect(await rateFirst(page, '掌握')).toMatchObject({ ok: true, value: { status: 'finished' } })
  90  |     const latestState = withHistoryDatabase(testDataDirectory, (db) =>
  91  |       db
  92  |         .prepare(
  93  |           'SELECT * FROM question_user_state WHERE question_id=(SELECT id FROM questions WHERE question_id=?)',
  94  |         )
  95  |         .get('q-1'),
  96  |     )
  97  |     expect(
  98  |       await startFlow(page, {
  99  |         requestId: randomUUID(),
  100 |         topicId: null,
  101 |         count: 'all',
  102 |         replace: null,
  103 |         repeat: { sessionId: source.session.sessionId, selection: 'unknown' },
  104 |       }),
  105 |     ).toMatchObject({ ok: true })
  106 |     expect(await rateFirst(page, '不会')).toMatchObject({ ok: true, value: { status: 'finished' } })
  107 |     expect(
  108 |       withHistoryDatabase(testDataDirectory, (db) =>
  109 |         db
  110 |           .prepare(
  111 |             'SELECT * FROM question_user_state WHERE question_id=(SELECT id FROM questions WHERE question_id=?)',
  112 |           )
  113 |           .get('q-1'),
  114 |       ),
  115 |     ).toEqual(latestState)
  116 |     expect((await categoryList(page, { filters })).total).toBe(0)
  117 |     expect((await categoryList(page, { filters: { ...filters, mastery: '掌握' } })).total).toBe(1)
  118 |   } finally {
  119 |     await stop(application)
  120 |   }
  121 | })
  122 | 
  123 | test('方案界面重命名/更新/另存及填入不建轮，联合条件持久化且原活动轮不变', async ({
  124 |   testDataDirectory,
  125 | }, info) => {
  126 |   const { application, page } = await prepareFlow(testDataDirectory, info)
  127 |   try {
  128 |     await finishFlow(page)
  129 |     await page.reload()
> 130 |     await page.getByRole('button', { name: '开始练习', exact: true }).click()
      |                                                                   ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
  131 |     await page.getByRole('textbox', { name: '我的答案', exact: true }).fill('活动轮原草稿')
  132 |     await page.getByRole('button', { name: '保存并返回', exact: true }).click()
  133 |     const before = historySnapshot(testDataDirectory)
  134 |     const original = await savePlan(page, '原20题方案')
  135 |     const panel = await openPlans(page)
  136 |     await panel.getByLabel('选用练习方案', { exact: true }).selectOption(original.planId)
  137 |     await page.getByRole('button', { name: '练不会＋不熟', exact: true }).click()
  138 |     await page.getByLabel('练习模式', { exact: true }).selectOption('random')
  139 |     await page.getByLabel('本轮题数', { exact: true }).selectOption('10')
  140 |     await expect(page.getByText('匹配 2 题', { exact: true })).toBeVisible()
  141 |     await panel.getByRole('button', { name: '用当前条件更新方案…', exact: true }).click()
  142 |     await panel.getByLabel('新方案名称', { exact: true }).fill('薄弱复习10')
  143 |     await panel.getByRole('button', { name: '确认更新方案', exact: true }).click()
  144 |     await expect(panel.getByRole('status')).toHaveText('练习方案已更新，当前练习保持。')
  145 |     const updated = (await readPlans(page))[0]!
  146 |     expect(updated).toMatchObject({
  147 |       planId: original.planId,
  148 |       name: '薄弱复习10',
  149 |       options: { mode: 'random', count: 10, filters: { mastery: '不会＋不熟' } },
  150 |     })
  151 |     await panel.getByRole('button', { name: '重命名方案…', exact: true }).click()
  152 |     await panel.getByLabel('新方案名称', { exact: true }).fill('面试薄弱题')
  153 |     await panel.getByRole('button', { name: '确认更新方案', exact: true }).click()
  154 |     await expect.poll(async () => (await readPlans(page))[0]?.name).toBe('面试薄弱题')
  155 |     expect((await readPlans(page))[0]?.options).toEqual(updated.options)
  156 |     await panel.getByRole('button', { name: '另存当前条件…', exact: true }).click()
  157 |     await panel.getByRole('button', { name: '保存当前条件为方案', exact: true }).click()
  158 |     await expect(panel.getByRole('status')).toHaveText('练习方案已保存。')
  159 |     const saved = await readPlans(page)
  160 |     expect(saved).toHaveLength(2)
  161 |     expect(new Set(saved.map((p) => p.planId)).size).toBe(2)
  162 |     expect(saved.every((p) => JSON.stringify(p.options) === JSON.stringify(updated.options))).toBe(
  163 |       true,
  164 |     )
  165 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  166 |     const window = await application.browserWindow(page)
  167 |     await window.evaluate((window) => window.setContentSize(900, 800))
  168 |     await info.attach('plans-updated-narrow.png', {
  169 |       body: await page.screenshot({ fullPage: true }),
  170 |       contentType: 'image/png',
  171 |     })
  172 |     await page.reload()
  173 |     expect(await readPlans(page)).toEqual(saved)
  174 |     const reopened = await openPlans(page)
  175 |     await reopened.getByLabel('选用练习方案', { exact: true }).selectOption(original.planId)
  176 |     await reopened.getByRole('button', { name: '填入条件', exact: true }).click()
  177 |     await expect(page.getByText('匹配 2 题', { exact: true })).toBeVisible()
  178 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  179 |   } finally {
  180 |     await stop(application)
  181 |   }
  182 | })
  183 | 
  184 | test('方案更新原条件重试幂等、过期/同名/删除后编辑拒绝，真实写失败保留原方案', async ({
  185 |   testDataDirectory,
  186 | }, info) => {
  187 |   const { application, page } = await prepareFlow(testDataDirectory, info)
  188 |   try {
  189 |     const original = { planId: randomUUID(), name: 'Origin', options: planOptions }
  190 |     expect(await changePlan(page, { kind: 'save', ...original })).toMatchObject({ ok: true })
  191 |     const expected = { name: original.name, options: original.options }
  192 |     const update = {
  193 |       kind: 'update' as const,
  194 |       ...original,
  195 |       name: 'New',
  196 |       expected,
  197 |       options: {
  198 |         ...planOptions,
  199 |         count: 10 as const,
  200 |         filters: { ...EMPTY_QUESTION_FILTERS, mastery: '不会＋不熟' as const },
  201 |       },
  202 |     }
  203 |     for (let n = 0; n < 2; n++) expect(await changePlan(page, update)).toMatchObject({ ok: true })
  204 |     const after = await readPlans(page)
  205 |     expect(await changePlan(page, { ...update, name: 'Stale' })).toMatchObject({
  206 |       ok: false,
  207 |       error: { code: 'INVALID_REQUEST' },
  208 |     })
  209 |     expect(
  210 |       await changePlan(page, {
  211 |         kind: 'save',
  212 |         planId: randomUUID(),
  213 |         name: 'new',
  214 |         options: planOptions,
  215 |       }),
  216 |     ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } })
  217 |     const next = {
  218 |       ...update,
  219 |       name: 'AfterFailure',
  220 |       expected: { name: after[0]!.name, options: after[0]!.options },
  221 |     }
  222 |     withHistoryDatabase(
  223 |       testDataDirectory,
  224 |       (db) =>
  225 |         db.exec(
  226 |           "CREATE TRIGGER update_failure BEFORE UPDATE ON practice_plans BEGIN SELECT RAISE(ABORT,'plan update failure'); END",
  227 |         ),
  228 |       false,
  229 |     )
  230 |     expect(await changePlan(page, next)).toMatchObject({
```