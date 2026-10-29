# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: knowledge-ui.spec.ts >> 我的积累与关联对照在900宽/150%暗色可操作、中文混排不横向溢出
- Location: tests\e2e\knowledge-ui.spec.ts:346:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('region', { name: '我的积累检索', exact: true }).locator('.question-relations > summary')
    - locator resolved to <summary>易混点与关联题</summary>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
      - waiting 100ms
    59 × waiting for element to be visible, enabled and stable
       - element is not visible
     - retrying click action
       - waiting 500ms

```

# Test source

```ts
  269 |     ).toEqual([
  270 |       { topic_id: 'control-b', question_id: 'q-2' },
  271 |       { topic_id: 'control-a', question_id: 'q-1' },
  272 |     ])
  273 |   } finally {
  274 |     await stop(application)
  275 |   }
  276 | })
  277 | 
  278 | test('练习揭晓前不读关联/搜索，旧轮复盘对照当前题干且不改旧轮次', async ({
  279 |   testDataDirectory,
  280 | }, info) => {
  281 |   const { application, page, file } = await prepareControl(testDataDirectory, info, 3)
  282 |   try {
  283 |     await createRelation(page)
  284 |     const round = await createStudyRound(page, '旧轮回答保持')
  285 |     await application.evaluate(({ ipcMain }) => {
  286 |       const handlers = Reflect.get(ipcMain, '_invokeHandlers')
  287 |       Reflect.set(globalThis, '__knowledgeReads', { relations: 0, search: 0 })
  288 |       for (const [channel, key] of [
  289 |         ['knowledge:relations', 'relations'],
  290 |         ['knowledge:search', 'search'],
  291 |       ] as const) {
  292 |         const original = handlers.get(channel)
  293 |         ipcMain.removeHandler(channel)
  294 |         ipcMain.handle(channel, (event, input) => {
  295 |           Reflect.get(globalThis, '__knowledgeReads')[key]++
  296 |           return original(event, input)
  297 |         })
  298 |       }
  299 |     })
  300 |     await openPage(page, '开始练习')
  301 |     await page.getByLabel('练习专题', { exact: true }).selectOption('control-a')
  302 |     await page.getByRole('button', { name: '开始练习', exact: true }).click()
  303 |     await expect(page.locator('.practice-reference-column .question-relations')).toHaveCount(0)
  304 |     expect(await application.evaluate(() => Reflect.get(globalThis, '__knowledgeReads'))).toEqual({
  305 |       relations: 0,
  306 |       search: 0,
  307 |     })
  308 |     await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  309 |     const panel = page.locator('.practice-reference-column .question-relations')
  310 |     await expect(panel).not.toHaveAttribute('open')
  311 |     expect(await application.evaluate(() => Reflect.get(globalThis, '__knowledgeReads'))).toEqual({
  312 |       relations: 0,
  313 |       search: 0,
  314 |     })
  315 |     await panel.locator(':scope > summary').click()
  316 |     await expect(panel).toContainText('DMA完成不等于UART完成')
  317 |     await page.getByRole('button', { name: '保存并返回', exact: true }).click()
  318 |     await writeFile(file, controlBank('control-a', 3, true))
  319 |     await importHistoryFiles(application, page, [file])
  320 |     const before = withHistoryDatabase(testDataDirectory, (db) =>
  321 |       db.prepare('SELECT * FROM practice_items ORDER BY rowid').all(),
  322 |     )
  323 |     await openPage(page, '学习记录')
  324 |     await page.getByRole('tab', { name: '按轮次复盘', exact: true }).click()
  325 |     await page
  326 |       .locator(`.round-list [data-session-id="${round.sessionId}"]`)
  327 |       .getByRole('button', { name: '查看这一轮', exact: true })
  328 |       .click()
  329 |     const detail = page.getByLabel('按轮次复盘详情', { exact: true })
  330 |     await detail.getByRole('button', { name: '查看本轮第1题', exact: true }).click()
  331 |     await detail.locator('.question-relations > summary').click()
  332 |     await detail.getByRole('button', { name: '对照这两题', exact: true }).click()
  333 |     await expect(detail.getByRole('region', { name: '关联题对照', exact: true })).toContainText(
  334 |       'CONTROL-NEW-BODY-control-a-1',
  335 |     )
  336 |     expect(
  337 |       withHistoryDatabase(testDataDirectory, (db) =>
  338 |         db.prepare('SELECT * FROM practice_items ORDER BY rowid').all(),
  339 |       ),
  340 |     ).toEqual(before)
  341 |   } finally {
  342 |     await stop(application)
  343 |   }
  344 | })
  345 | 
  346 | test('我的积累与关联对照在900宽/150%暗色可操作、中文混排不横向溢出', async ({
  347 |   testDataDirectory,
  348 | }, info) => {
  349 |   const { application, page } = await prepareControl(testDataDirectory, info, 3)
  350 |   try {
  351 |     await saveNote(page, {
  352 |       ...a(1),
  353 |       expectedRevision: 0,
  354 |       text: 'DMA完成不等于UART完成，需对照说明',
  355 |     })
  356 |     await createRelation(page)
  357 |     await chooseTheme(page, '松间绿', 'dark')
  358 |     const window = await application.browserWindow(page)
  359 |     await window.evaluate((window) => {
  360 |       window.setContentSize(900, 800)
  361 |       window.webContents.setZoomFactor(1.5)
  362 |     })
  363 |     const panel = await openKnowledge(page)
  364 |     await panel.getByLabel('积累关键词', { exact: true }).fill('DMA')
  365 |     await panel.getByRole('button', { name: '检索我的积累', exact: true }).click()
  366 |     await expect(panel.getByText(/^匹配 1 道题/)).toBeVisible()
  367 |     await captureHistory(application, page, info, 'knowledge-narrow-dark-search.png')
  368 |     await panel.getByRole('button', { name: '组卷题 A 1 · control-a / q-1', exact: true }).click()
> 369 |     await panel.locator('.question-relations > summary').click()
      |                                                          ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
  370 |     await panel.getByRole('button', { name: '对照这两题', exact: true }).click()
  371 |     await expect(panel.getByRole('region', { name: '关联题对照', exact: true })).toContainText(
  372 |       'CONTROL-OLD-BODY-control-b-1',
  373 |     )
  374 |     const sizes = await page
  375 |       .locator('html')
  376 |       .evaluate((element) => ({
  377 |         scroll: Reflect.get(element, 'scrollWidth'),
  378 |         client: Reflect.get(element, 'clientWidth'),
  379 |       }))
  380 |     expect(sizes.scroll).toBeLessThanOrEqual(sizes.client + 1)
  381 |     await captureHistory(application, page, info, 'knowledge-narrow-dark-comparison.png')
  382 |     await panel.getByRole('button', { name: '返回原检索结果', exact: true }).click()
  383 |     await expect(panel.getByLabel('积累关键词', { exact: true })).toHaveValue('DMA')
  384 |   } finally {
  385 |     await stop(application)
  386 |   }
  387 | })
  388 | 
```