# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: practice-recency.spec.ts >> 题库和练习共用最近筛选，可保存/填入方案；窄窗暗色控件和结果可操作
- Location: tests\e2e\practice-recency.spec.ts:285:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('当前版本从未练习', { exact: true })
Expected: visible
Error: strict mode violation: getByText('当前版本从未练习', { exact: true }) resolved to 3 elements:
    1) <option value="never">当前版本从未练习</option> aka getByLabel('练习最近练习').getByText('当前版本从未练习')
    2) <option value="never">当前版本从未练习</option> aka getByLabel('题库最近练习').getByText('当前版本从未练习')
    3) <p class="muted">当前版本从未练习</p> aka getByRole('article', { name: '题目内容' }).getByText('当前版本从未练习')

Call log:
  - Expect "toBeVisible" getByText('当前版本从未练习', { exact: true }) with timeout 10000ms
  - waiting for getByText('当前版本从未练习', { exact: true })

```

# Test source

```ts
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
  297 |     const libraryRecent = page
  298 |       .getByRole('group', { name: '设置题库条件', exact: true })
  299 |       .locator('.recent-practice-filters > summary')
  300 |     await libraryRecent.click()
  301 |     await page.getByLabel('题库最近练习', { exact: true }).selectOption('7d')
  302 |     await page.getByLabel('题库选题优先级', { exact: true }).selectOption('oldest')
  303 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  304 |     await expect(page.locator('.question-row')).toHaveCount(6)
  305 |     await expect(page.getByLabel('题库已选条件', { exact: true })).toContainText(
  306 |       '最近7天未练 · 最久未练优先',
  307 |     )
  308 |     await libraryRecent.click()
  309 |     await page.locator('.question-row').first().click()
  310 |     await expect(page.getByRole('article', { name: '题目内容', exact: true })).toBeVisible()
> 311 |     await expect(page.getByText('当前版本从未练习', { exact: true })).toBeVisible()
      |                                                               ^ Error: expect(locator).toBeVisible() failed
  312 |     await captureHistory(application, page, info, 'recent-library-narrow-dark.png')
  313 |     await openPage(page, '开始练习')
  314 |     await page.getByLabel('练习专题', { exact: true }).selectOption('control-a')
  315 |     await page.getByText('筛选练习题目', { exact: true }).click()
  316 |     await page.locator('.practice-workspace .recent-practice-filters > summary').click()
  317 |     await page.getByLabel('练习最近练习', { exact: true }).selectOption('30d')
  318 |     await page.getByLabel('练习选题优先级', { exact: true }).selectOption('oldest')
  319 |     const saved = await savePlan(page, '最近30天未练优先')
  320 |     expect(saved.options.filters).toMatchObject({ practiceRecency: '30d', practiceOrder: 'oldest' })
  321 |     const panel = await openPlans(page)
  322 |     await panel.getByLabel('选用练习方案', { exact: true }).selectOption(saved.planId)
  323 |     await panel.getByRole('button', { name: '填入条件', exact: true }).click()
  324 |     await expect(page.getByLabel('练习最近练习', { exact: true })).toHaveValue('30d')
  325 |     await expect(page.getByLabel('练习选题优先级', { exact: true })).toHaveValue('oldest')
  326 |     await expect(page.getByText('匹配 3 题', { exact: true })).toBeVisible()
  327 |     await page.getByRole('button', { name: '开始练习', exact: true }).click()
  328 |     await expect(page.getByLabel('练习进度')).toContainText('第 1 / 3 题')
  329 |     await page.getByRole('button', { name: '保存并返回', exact: true }).click()
  330 |     await expect(page.locator('.practice-workspace')).toContainText('最近30天未练')
  331 |     await captureHistory(application, page, info, 'recent-plan-narrow-dark.png')
  332 |   } finally {
  333 |     await stop(application)
  334 |   }
  335 | })
  336 | 
```