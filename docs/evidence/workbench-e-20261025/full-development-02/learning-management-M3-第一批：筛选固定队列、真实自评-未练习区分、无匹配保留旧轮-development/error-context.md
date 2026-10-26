# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: learning-management.spec.ts >> M3 第一批：筛选固定队列、真实自评/未练习区分、无匹配保留旧轮
- Location: tests\e2e\learning-management.spec.ts:496:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.check: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('checkbox', { name: '练习只看收藏' })
    - locator resolved to <input type="checkbox" aria-label="练习只看收藏"/>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <button type="button" role="option" tabindex="-1" id="_r_0_-option-0" aria-selected="false">筛选标签</button> from <div class="tag-picker">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <button type="button" role="option" tabindex="-1" id="_r_0_-option-0" aria-selected="false">筛选标签</button> from <div class="tag-picker">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    58 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <button type="button" role="option" tabindex="-1" id="_r_0_-option-0" aria-selected="false">筛选标签</button> from <div class="tag-picker">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms

```

# Test source

```ts
  415 |     await closeWindow(application)
  416 |     const next = await launchApplication(testDataDirectory, info.project.name)
  417 |     reopened = next.application
  418 |     await openPage(next.page, '题库')
  419 |     await next.page.getByRole('button', { name: /A 筛选专题.*q-01/ }).click()
  420 |     await expect(next.page.getByRole('button', { name: '取消收藏', exact: true })).toHaveAttribute(
  421 |       'aria-pressed',
  422 |       'true',
  423 |     )
  424 |     await openPage(next.page, '开始练习')
  425 |     await expect(next.page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
  426 |     await info.attach('favorite-reopened.json', {
  427 |       body: JSON.stringify(snapshot(testDataDirectory)),
  428 |       contentType: 'application/json',
  429 |     })
  430 |   } finally {
  431 |     await stop(application)
  432 |     if (reopened) await stop(reopened)
  433 |   }
  434 | })
  435 | 
  436 | test('M3 第一批：收藏写入失败与响应丢失重试、收藏页取消后收敛', async ({
  437 |   testDataDirectory,
  438 | }, info) => {
  439 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  440 |   try {
  441 |     await page.getByRole('button', { name: /A 筛选专题.*q-01/ }).click()
  442 |     const before = snapshot(testDataDirectory)
  443 |     change(
  444 |       testDataDirectory,
  445 |       `CREATE TRIGGER fail_m3_favorite BEFORE UPDATE OF favorite ON question_user_state BEGIN SELECT RAISE(ABORT, '测试收藏失败'); END`,
  446 |     )
  447 |     await page.getByRole('button', { name: '收藏本题', exact: true }).click()
  448 |     await expect(page.getByRole('alert')).toContainText('收藏保存尚未确认')
  449 |     await expect(page.getByRole('button', { name: '收藏本题', exact: true })).toHaveAttribute(
  450 |       'aria-pressed',
  451 |       'false',
  452 |     )
  453 |     expect(snapshot(testDataDirectory)).toEqual(before)
  454 |     change(testDataDirectory, 'DROP TRIGGER fail_m3_favorite')
  455 |     // 第一次真实写入后丢弃成功响应；重试必须仍设置 true，不能再次切换。
  456 |     await application.evaluate(({ ipcMain }) => {
  457 |       const handlers = Reflect.get(ipcMain, '_invokeHandlers') as Map<
  458 |         string,
  459 |         (...args: unknown[]) => Promise<unknown>
  460 |       >
  461 |       const original = handlers.get('library:set-favorite')
  462 |       if (!original) throw new Error('收藏 handler 不存在。')
  463 |       ipcMain.removeHandler('library:set-favorite')
  464 |       let lost = false
  465 |       ipcMain.handle('library:set-favorite', async (...args) => {
  466 |         const result = await original(...args)
  467 |         if (!lost) {
  468 |           lost = true
  469 |           throw new Error('测试成功响应丢失')
  470 |         }
  471 |         return result
  472 |       })
  473 |     })
  474 |     await page.getByRole('button', { name: '收藏本题', exact: true }).click()
  475 |     await expect(page.getByRole('alert')).toContainText('收藏保存尚未确认')
  476 |     expect((await list(page, { favoritesOnly: true })).total).toBe(1)
  477 |     await page.getByRole('button', { name: '收藏本题', exact: true }).click()
  478 |     await expect(page.getByRole('button', { name: '取消收藏', exact: true })).toBeEnabled()
  479 |     await page.getByRole('checkbox', { name: '题库只看收藏' }).check()
  480 |     await applyLibrary(page, '', 1)
  481 |     await page.getByRole('button', { name: /A 筛选专题.*q-01/ }).click()
  482 |     await page.getByRole('button', { name: '取消收藏', exact: true }).click()
  483 |     await expect(page.getByText('共 0 题', { exact: true })).toBeVisible()
  484 |     await expect(page.getByRole('navigation', { name: '题目分页' })).toContainText('1 / 1')
  485 |     expect((await list(page, { favoritesOnly: true })).total).toBe(0)
  486 |     expect(snapshot(testDataDirectory).revision).toEqual(before.revision)
  487 |     await info.attach('favorite-failure-retry.json', {
  488 |       body: JSON.stringify(snapshot(testDataDirectory)),
  489 |       contentType: 'application/json',
  490 |     })
  491 |   } finally {
  492 |     await stop(application)
  493 |   }
  494 | })
  495 | 
  496 | test('M3 第一批：筛选固定队列、真实自评/未练习区分、无匹配保留旧轮', async ({
  497 |   testDataDirectory,
  498 | }, info) => {
  499 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  500 |   try {
  501 |     for (const id of ['q-02', 'q-04', 'q-24']) await favorite(page, id, true)
  502 |     const filters = {
  503 |       ...EMPTY_QUESTION_FILTERS,
  504 |       tag: '筛选标签',
  505 |       difficulty: '基础' as const,
  506 |       favoritesOnly: true,
  507 |     }
  508 |     const matches = await list(page, filters, { topicId: 'm3-a' })
  509 |     expect(matches.questions.map((q) => q.questionId)).toEqual(['q-02', 'q-04'])
  510 |     await openPage(page, '开始练习')
  511 |     await page.getByRole('combobox', { name: '练习专题' }).selectOption('m3-a')
  512 |     await page.getByText('筛选练习题目', { exact: true }).click()
  513 |     await page.getByRole('combobox', { name: '练习标签' }).fill('筛选标签')
  514 |     await page.getByRole('combobox', { name: '练习难度' }).selectOption('基础')
> 515 |     await page.getByRole('checkbox', { name: '练习只看收藏' }).check()
      |                                                          ^ TimeoutError: locator.check: Timeout 30000ms exceeded.
  516 |     await expect(page.getByText('匹配 2 题', { exact: true })).toBeVisible()
  517 |     await page.getByRole('button', { name: '开始练习', exact: true }).click()
  518 |     await expect(page.getByLabel('练习进度')).toContainText('第 1 / 2')
  519 |     const initial = snapshot(testDataDirectory)
  520 |     expect(initial.queue.map((q) => q['questionId'])).toEqual(
  521 |       matches.questions.map((q) => q.questionId),
  522 |     )
  523 |     expect((await list(page, { mastery: 'unpracticed' })).total).toBe(27)
  524 |     await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  525 |     expect((await list(page, { mastery: 'unpracticed' })).total).toBe(26)
  526 |     expect((await list(page, { query: 'BodyMarker' })).questions[0]).toMatchObject({
  527 |       practiced: true,
  528 |       currentRating: null,
  529 |       favorite: true,
  530 |     })
  531 |     await page.getByRole('button', { name: '掌握', exact: true }).click()
  532 |     await expect(page.getByLabel('练习进度')).toContainText('第 2 / 2')
  533 |     expect(
  534 |       (await list(page, { mastery: '掌握', favoritesOnly: true })).questions.map(
  535 |         (q) => q.questionId,
  536 |       ),
  537 |     ).toEqual(['q-02'])
  538 |     await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
  539 |     await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
  540 |     await page.getByText('筛选练习题目', { exact: true }).click()
  541 |     await page.getByRole('searchbox', { name: '练习搜索' }).fill('没有匹配的题目')
  542 |     await expect(page.getByText('匹配 0 题', { exact: true })).toBeVisible()
  543 |     await expect(page.getByRole('button', { name: '结束本轮并开始新练习' })).toBeDisabled()
  544 |     const prior = snapshot(testDataDirectory)
  545 |     const old = await current(page)
  546 |     const rejected = await page.evaluate(
  547 |       (input) => (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.start(input),
  548 |       {
  549 |         requestId: randomUUID(),
  550 |         topicId: null,
  551 |         count: 'all' as const,
  552 |         replace: cursor(old),
  553 |         filters: { ...EMPTY_QUESTION_FILTERS, query: '没有匹配的题目' },
  554 |       },
  555 |     )
  556 |     expect(rejected).toMatchObject({ error: { code: 'NO_QUESTIONS' } })
  557 |     expect(snapshot(testDataDirectory)).toEqual(prior)
  558 |     await favorite(page, 'q-04', false)
  559 |     await page.getByRole('button', { name: '继续练习', exact: true }).click()
  560 |     await expect(page.getByLabel('练习进度')).toContainText('第 2 / 2')
  561 |     await page.getByRole('button', { name: '跳过本题' }).click()
  562 |     await expect(page.getByRole('heading', { name: '本轮已完成' })).toBeVisible()
  563 |     expect((await list(page, { mastery: 'unpracticed' })).total).toBe(26)
  564 |     expect(
  565 |       (await list(page, { tag: '筛选标签' }, { topicId: 'm3-a' })).questions.find(
  566 |         (q) => q.questionId === 'q-04',
  567 |       ),
  568 |     ).toMatchObject({ practiced: false, currentRating: null, favorite: false })
  569 |     expect(snapshot(testDataDirectory).queue.map((q) => q['versionId'])).toEqual(
  570 |       initial.queue.map((q) => q['versionId']),
  571 |     )
  572 |     await info.attach('filtered-queue-state.json', {
  573 |       body: JSON.stringify(snapshot(testDataDirectory)),
  574 |       contentType: 'application/json',
  575 |     })
  576 |   } finally {
  577 |     await stop(application)
  578 |   }
  579 | })
  580 | 
  581 | test('M3 第一批：旧版本自评排除、元数据保持、归档恢复收藏和历史', async ({
  582 |   testDataDirectory,
  583 | }, info) => {
  584 |   const { application, page, file } = await prepare(testDataDirectory, info.project.name)
  585 |   try {
  586 |     await page.getByRole('button', { name: /A 筛选专题.*q-01/ }).click()
  587 |     await page.getByRole('button', { name: '收藏本题', exact: true }).click()
  588 |     await expect(page.getByRole('button', { name: '取消收藏', exact: true })).toBeEnabled()
  589 |     await openPage(page, '开始练习')
  590 |     await page.getByRole('button', { name: '开始练习', exact: true }).click()
  591 |     await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  592 |     await page.getByRole('button', { name: '不熟', exact: true }).click()
  593 |     await expect(page.getByLabel('练习进度')).toContainText('第 2 / 20')
  594 |     await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
  595 |     await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
  596 |     const before = snapshot(testDataDirectory)
  597 |     await writeFile(file, bank('m3-a', false, false, true))
  598 |     await importFiles(application, page, [file])
  599 |     expect((await list(page, { mastery: '不熟', favoritesOnly: true })).total).toBe(1)
  600 |     await writeFile(file, bank('m3-a', true))
  601 |     await importFiles(application, page, [file])
  602 |     expect((await list(page, { mastery: '不熟' })).total).toBe(0)
  603 |     expect(
  604 |       (await list(page, { query: 'gpiotitlemarker', mastery: 'unpracticed', favoritesOnly: true }))
  605 |         .total,
  606 |     ).toBe(1)
  607 |     expect(snapshot(testDataDirectory).queue).toEqual(before.queue)
  608 |     await writeFile(file, bank('m3-a', true, true))
  609 |     await importFiles(application, page, [file])
  610 |     expect((await list(page, { favoritesOnly: true })).total).toBe(0)
  611 |     expect((await list(page, { favoritesOnly: true }, { archived: true })).total).toBe(1)
  612 |     await writeFile(file, bank('m3-a', true))
  613 |     await importFiles(application, page, [file])
  614 |     const restored = await list(page, { query: 'gpiotitlemarker' })
  615 |     expect(restored.questions[0]).toMatchObject({
```