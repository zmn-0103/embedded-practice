# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: practice-recency.spec.ts >> 题库和练习共用最近筛选，可保存/填入方案；窄窗暗色控件和结果可操作
- Location: tests\e2e\practice-recency.spec.ts:285:5

# Error details

```
Error: locator.click: Error: strict mode violation: locator('.recent-practice-filters > summary') resolved to 2 elements:
    1) <summary>最近练习与排序</summary> aka getByText('最近练习与排序').first()
    2) <summary>最近练习与排序</summary> aka getByRole('group', { name: '设置题库条件' }).getByText('最近练习与排序')

Call log:
  - waiting for locator('.recent-practice-filters > summary')

```

# Test source

```ts
  197 |         db
  198 |           .prepare('UPDATE practice_items SET revealed_at=? WHERE session_id=? AND position=0')
  199 |           .run(new Date().toISOString(), seeded.value.sessionId),
  200 |       false,
  201 |     )
  202 |     let active = ''
  203 |     for (let trial = 0; trial < 3; trial++) {
  204 |       const started = await startFlow(initial.page, {
  205 |         requestId: randomUUID(),
  206 |         topicId: 'control-a',
  207 |         count: 10,
  208 |         replace: null,
  209 |         mode: 'random',
  210 |         filters: { ...EMPTY_QUESTION_FILTERS, practiceOrder: 'oldest' },
  211 |       })
  212 |       if (!started.ok) throw new Error(started.error.message)
  213 |       active = started.value.sessionId
  214 |       expect(
  215 |         queue(testDataDirectory, active)
  216 |           .map((item) => item.questionId)
  217 |           .sort(),
  218 |       ).toEqual(Array.from({ length: 10 }, (_, i) => `q-${i + 2}`).sort())
  219 |       if (trial < 2) await endFlow(initial.page)
  220 |     }
  221 |     const fixed = queue(testDataDirectory, active)
  222 |     withHistoryDatabase(
  223 |       testDataDirectory,
  224 |       (db) =>
  225 |         db
  226 |           .prepare('UPDATE practice_items SET revealed_at=? WHERE session_id=?')
  227 |           .run(new Date().toISOString(), seeded.value.sessionId),
  228 |       false,
  229 |     )
  230 |     await stop(initial.application)
  231 |     reopened = await launchApplication(testDataDirectory, info.project.name)
  232 |     expect(queue(testDataDirectory, active)).toEqual(fixed)
  233 |     expect(
  234 |       await reopened.page.evaluate(() =>
  235 |         (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({
  236 |           sessionId: null,
  237 |         }),
  238 |       ),
  239 |     ).toMatchObject({
  240 |       ok: true,
  241 |       value: {
  242 |         session: {
  243 |           sessionId: active,
  244 |           mode: 'random',
  245 |           filters: { ...EMPTY_QUESTION_FILTERS, practiceOrder: 'oldest' },
  246 |         },
  247 |       },
  248 |     })
  249 |     await endFlow(reopened.page)
  250 |     const planId = randomUUID()
  251 |     expect(
  252 |       await changePlan(reopened.page, {
  253 |         kind: 'save',
  254 |         planId,
  255 |         name: '旧默认条件',
  256 |         options: { ...planOptions, topicId: 'control-a' },
  257 |       }),
  258 |     ).toMatchObject({ ok: true })
  259 |     expect(
  260 |       await startFlow(reopened.page, {
  261 |         requestId: randomUUID(),
  262 |         topicId: 'control-a',
  263 |         count: 20,
  264 |         mode: 'random',
  265 |         replace: null,
  266 |         category: { kind: 'all' },
  267 |         filters: {
  268 |           ...EMPTY_QUESTION_FILTERS,
  269 |           personalTagId: null,
  270 |           practiceRecency: 'all',
  271 |           practiceOrder: 'default',
  272 |         },
  273 |         sourcePlanId: planId,
  274 |       }),
  275 |     ).toMatchObject({ ok: true, value: { total: 20 } })
  276 |     expect(
  277 |       (await readPlans(reopened.page)).find((item) => item.planId === planId)?.lastUsedAt,
  278 |     ).not.toBeNull()
  279 |   } finally {
  280 |     await stop(initial.application)
  281 |     if (reopened) await stop(reopened.application)
  282 |   }
  283 | })
  284 | 
  285 | test('题库和练习共用最近筛选，可保存/填入方案；窄窗暗色控件和结果可操作', async ({
  286 |   testDataDirectory,
  287 | }, info) => {
  288 |   const { application, page } = await prepareControl(testDataDirectory, info, 3)
  289 |   try {
  290 |     await chooseTheme(page, '松间绿', 'dark')
  291 |     await openPage(page, '题库')
  292 |     const window = await application.browserWindow(page)
  293 |     await window.evaluate((window) => {
  294 |       window.setContentSize(900, 800)
  295 |       window.webContents.setZoomFactor(1.5)
  296 |     })
> 297 |     await page.locator('.recent-practice-filters > summary').click()
      |                                                              ^ Error: locator.click: Error: strict mode violation: locator('.recent-practice-filters > summary') resolved to 2 elements:
  298 |     await page.getByLabel('题库最近练习', { exact: true }).selectOption('7d')
  299 |     await page.getByLabel('题库选题优先级', { exact: true }).selectOption('oldest')
  300 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  301 |     await expect(page.locator('.question-row')).toHaveCount(6)
  302 |     await expect(page.getByLabel('题库已选条件', { exact: true })).toContainText(
  303 |       '最近7天未练 · 最久未练优先',
  304 |     )
  305 |     await page.locator('.recent-practice-filters > summary').click()
  306 |     await page.locator('.question-row').first().click()
  307 |     await expect(page.getByRole('article', { name: '题目内容', exact: true })).toBeVisible()
  308 |     await expect(page.getByText('当前版本从未练习', { exact: true })).toBeVisible()
  309 |     await captureHistory(application, page, info, 'recent-library-narrow-dark.png')
  310 |     await openPage(page, '开始练习')
  311 |     await page.getByLabel('练习专题', { exact: true }).selectOption('control-a')
  312 |     await page.getByText('筛选练习题目', { exact: true }).click()
  313 |     await page.locator('.recent-practice-filters > summary').click()
  314 |     await page.getByLabel('练习最近练习', { exact: true }).selectOption('30d')
  315 |     await page.getByLabel('练习选题优先级', { exact: true }).selectOption('oldest')
  316 |     const saved = await savePlan(page, '最近30天未练优先')
  317 |     expect(saved.options.filters).toMatchObject({ practiceRecency: '30d', practiceOrder: 'oldest' })
  318 |     const panel = await openPlans(page)
  319 |     await panel.getByLabel('选用练习方案', { exact: true }).selectOption(saved.planId)
  320 |     await panel.getByRole('button', { name: '填入条件', exact: true }).click()
  321 |     await expect(page.getByLabel('练习最近练习', { exact: true })).toHaveValue('30d')
  322 |     await expect(page.getByLabel('练习选题优先级', { exact: true })).toHaveValue('oldest')
  323 |     await expect(page.getByText('匹配 3 题', { exact: true })).toBeVisible()
  324 |     await page.getByRole('button', { name: '开始练习', exact: true }).click()
  325 |     await expect(page.getByLabel('练习进度')).toContainText('第 1 / 3 题')
  326 |     await page.getByRole('button', { name: '保存并返回', exact: true }).click()
  327 |     await expect(page.locator('.practice-workspace')).toContainText('最近30天未练')
  328 |     await captureHistory(application, page, info, 'recent-plan-narrow-dark.png')
  329 |   } finally {
  330 |     await stop(application)
  331 |   }
  332 | })
  333 | 
```