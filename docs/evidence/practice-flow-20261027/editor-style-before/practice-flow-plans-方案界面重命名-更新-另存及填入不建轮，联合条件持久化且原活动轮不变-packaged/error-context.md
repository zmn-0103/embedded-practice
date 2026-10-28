# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: practice-flow-plans.spec.ts >> 方案界面重命名/更新/另存及填入不建轮，联合条件持久化且原活动轮不变
- Location: tests\e2e\practice-flow-plans.spec.ts:123:5

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 2
+ Received  + 2

  Object {
-   "background": "rgb(252, 253, 251)",
-   "padding": "7px 10px",
+   "background": "rgb(255, 255, 255)",
+   "padding": "1px 2px",
    "radius": "8px",
  }
```

# Test source

```ts
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
  130 |     await openPage(page, '开始练习')
  131 |     await page.getByRole('button', { name: '开始练习', exact: true }).click()
  132 |     await page.getByRole('textbox', { name: '我的答案', exact: true }).fill('活动轮原草稿')
  133 |     await page.getByRole('button', { name: '保存并返回', exact: true }).click()
  134 |     const before = historySnapshot(testDataDirectory)
  135 |     const original = await savePlan(page, '原20题方案')
  136 |     const panel = await openPlans(page)
  137 |     await panel.getByLabel('选用练习方案', { exact: true }).selectOption(original.planId)
  138 |     await page.getByRole('button', { name: '练不会＋不熟', exact: true }).click()
  139 |     await page.getByLabel('练习模式', { exact: true }).selectOption('random')
  140 |     await page.getByLabel('本轮题数', { exact: true }).selectOption('10')
  141 |     await expect(page.getByText('匹配 2 题', { exact: true })).toBeVisible()
  142 |     const inputStyle = await panel.getByLabel('方案名称', { exact: true }).evaluate((input) => {
  143 |       const style = getComputedStyle(input)
  144 |       return {
  145 |         background: style.backgroundColor,
  146 |         padding: style.padding,
  147 |         radius: style.borderRadius,
  148 |       }
  149 |     })
  150 |     await panel.getByRole('button', { name: '用当前条件更新方案…', exact: true }).click()
  151 |     expect(
  152 |       await panel.getByLabel('新方案名称', { exact: true }).evaluate((input) => {
  153 |         const style = getComputedStyle(input)
  154 |         return {
  155 |           background: style.backgroundColor,
  156 |           padding: style.padding,
  157 |           radius: style.borderRadius,
  158 |         }
  159 |       }),
> 160 |     ).toEqual(inputStyle)
      |       ^ Error: expect(received).toEqual(expected) // deep equality
  161 |     await panel.getByLabel('新方案名称', { exact: true }).fill('薄弱复习10')
  162 |     await panel.getByRole('button', { name: '确认更新方案', exact: true }).click()
  163 |     await expect(panel.getByRole('status')).toHaveText('练习方案已更新，当前练习保持。')
  164 |     const updated = (await readPlans(page))[0]!
  165 |     expect(updated).toMatchObject({
  166 |       planId: original.planId,
  167 |       name: '薄弱复习10',
  168 |       options: { mode: 'random', count: 10, filters: { mastery: '不会＋不熟' } },
  169 |     })
  170 |     await panel.getByRole('button', { name: '重命名方案…', exact: true }).click()
  171 |     await panel.getByLabel('新方案名称', { exact: true }).fill('面试薄弱题')
  172 |     await panel.getByRole('button', { name: '确认更新方案', exact: true }).click()
  173 |     await expect.poll(async () => (await readPlans(page))[0]?.name).toBe('面试薄弱题')
  174 |     expect((await readPlans(page))[0]?.options).toEqual(updated.options)
  175 |     await panel.getByRole('button', { name: '另存当前条件…', exact: true }).click()
  176 |     await panel.getByRole('button', { name: '保存当前条件为方案', exact: true }).click()
  177 |     await expect(panel.getByRole('status')).toHaveText('练习方案已保存。')
  178 |     const saved = await readPlans(page)
  179 |     expect(saved).toHaveLength(2)
  180 |     expect(new Set(saved.map((p) => p.planId)).size).toBe(2)
  181 |     expect(saved.every((p) => JSON.stringify(p.options) === JSON.stringify(updated.options))).toBe(
  182 |       true,
  183 |     )
  184 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  185 |     const window = await application.browserWindow(page)
  186 |     await window.evaluate((window) => window.setContentSize(900, 800))
  187 |     await info.attach('plans-updated-narrow.png', {
  188 |       body: await page.screenshot({ fullPage: true }),
  189 |       contentType: 'image/png',
  190 |     })
  191 |     await page.reload()
  192 |     expect(await readPlans(page)).toEqual(saved)
  193 |     const reopened = await openPlans(page)
  194 |     await reopened.getByLabel('选用练习方案', { exact: true }).selectOption(original.planId)
  195 |     await reopened.getByRole('button', { name: '填入条件', exact: true }).click()
  196 |     await expect(page.getByText('匹配 2 题', { exact: true })).toBeVisible()
  197 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  198 |   } finally {
  199 |     await stop(application)
  200 |   }
  201 | })
  202 | 
  203 | test('方案更新原条件重试幂等、过期/同名/删除后编辑拒绝，真实写失败保留原方案', async ({
  204 |   testDataDirectory,
  205 | }, info) => {
  206 |   const { application, page } = await prepareFlow(testDataDirectory, info)
  207 |   try {
  208 |     const original = { planId: randomUUID(), name: 'Origin', options: planOptions }
  209 |     expect(await changePlan(page, { kind: 'save', ...original })).toMatchObject({ ok: true })
  210 |     withHistoryDatabase(
  211 |       testDataDirectory,
  212 |       (db) =>
  213 |         db
  214 |           .prepare('UPDATE practice_plans SET options_json=? WHERE plan_id=?')
  215 |           .run(
  216 |             JSON.stringify(Object.fromEntries(Object.entries(planOptions).reverse()), null, 2),
  217 |             original.planId,
  218 |           ),
  219 |       false,
  220 |     )
  221 |     const expected = { name: original.name, options: original.options }
  222 |     const update = {
  223 |       kind: 'update' as const,
  224 |       ...original,
  225 |       name: 'New',
  226 |       expected,
  227 |       options: {
  228 |         ...planOptions,
  229 |         count: 10 as const,
  230 |         filters: { ...EMPTY_QUESTION_FILTERS, mastery: '不会＋不熟' as const },
  231 |       },
  232 |     }
  233 |     for (let n = 0; n < 2; n++) expect(await changePlan(page, update)).toMatchObject({ ok: true })
  234 |     const after = await readPlans(page)
  235 |     expect(await changePlan(page, { ...update, name: 'Stale' })).toMatchObject({
  236 |       ok: false,
  237 |       error: { code: 'INVALID_REQUEST' },
  238 |     })
  239 |     expect(
  240 |       await changePlan(page, {
  241 |         kind: 'save',
  242 |         planId: randomUUID(),
  243 |         name: 'new',
  244 |         options: planOptions,
  245 |       }),
  246 |     ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } })
  247 |     const next = {
  248 |       ...update,
  249 |       name: 'AfterFailure',
  250 |       expected: { name: after[0]!.name, options: after[0]!.options },
  251 |     }
  252 |     withHistoryDatabase(
  253 |       testDataDirectory,
  254 |       (db) =>
  255 |         db.exec(
  256 |           "CREATE TRIGGER update_failure BEFORE UPDATE ON practice_plans BEGIN SELECT RAISE(ABORT,'plan update failure'); END",
  257 |         ),
  258 |       false,
  259 |     )
  260 |     expect(await changePlan(page, next)).toMatchObject({
```