# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: board-entry.spec.ts >> 板块入口：实际数量/分页/归档一致，自定义与未分类可达，易中难筛选沿用原值
- Location: tests\e2e\board-entry.spec.ts:310:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '筛选题库', exact: true })
    - locator resolved to <button type="button">筛选题库</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <summary>我的重点 · 1 个专题</summary> from <div class="library-management-tools">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <summary>我的重点 · 1 个专题</summary> from <div class="library-management-tools">…</div> subtree intercepts pointer events
  2 × retrying click action
      - waiting 100ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <details open="" class="category-manager">…</details> from <div class="library-management-tools">…</div> subtree intercepts pointer events
  14 × retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <summary>我的重点 · 1 个专题</summary> from <div class="library-management-tools">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <summary>我的重点 · 1 个专题</summary> from <div class="library-management-tools">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <details open="" class="category-manager">…</details> from <div class="library-management-tools">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <details open="" class="category-manager">…</details> from <div class="library-management-tools">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <summary>我的重点 · 1 个专题</summary> from <div class="library-management-tools">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms

```

# Test source

```ts
  248 |       }
  249 |       Reflect.set(globalThis, 'boardReadControl', control)
  250 |       ipcMain.removeHandler('library:list-questions')
  251 |       ipcMain.handle('library:list-questions', async (event, request) => {
  252 |         if (control.fail && request.topicId === null && !request.filters && !request.category) {
  253 |           control.fail = false
  254 |           return {
  255 |             ok: false,
  256 |             error: { code: 'DATABASE_UNAVAILABLE', message: '定向模拟板块题数读取失败' },
  257 |           }
  258 |         }
  259 |         const result = await original(event, request)
  260 |         if (request.filters?.query === '延迟旧条件' && !control.held) {
  261 |           control.held = true
  262 |           await new Promise<void>((done) => {
  263 |             control.release = done
  264 |           })
  265 |           control.finished = true
  266 |         }
  267 |         return result
  268 |       })
  269 |     })
  270 |     await page.getByLabel('题库搜索', { exact: true }).fill('延迟旧条件')
  271 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  272 |     await expect
  273 |       .poll(() => application.evaluate(() => Reflect.get(globalThis, 'boardReadControl').held))
  274 |       .toBe(true)
  275 |     await openPage(page, '知识板块')
  276 |     await board(page, '通信协议')
  277 |       .getByRole('button', { name: '进入板块：通信协议', exact: true })
  278 |       .click()
  279 |     await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
  280 |     await application.evaluate(() => Reflect.get(globalThis, 'boardReadControl').release())
  281 |     await expect
  282 |       .poll(() => application.evaluate(() => Reflect.get(globalThis, 'boardReadControl').finished))
  283 |       .toBe(true)
  284 |     await page.evaluate(
  285 |       () =>
  286 |         new Promise<void>((done) => {
  287 |           const frame = Reflect.get(globalThis, 'requestAnimationFrame') as (cb: () => void) => void
  288 |           frame(() => frame(done))
  289 |         }),
  290 |     )
  291 |     await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
  292 |     await expect(page.getByLabel('题库搜索', { exact: true })).toHaveValue('')
  293 |     await application.evaluate(() => {
  294 |       Reflect.get(globalThis, 'boardReadControl').fail = true
  295 |     })
  296 |     await openPage(page, '知识板块')
  297 |     await expect(page.getByRole('alert')).toContainText('定向模拟板块题数读取失败')
  298 |     await expect(page.locator('.board-card')).toHaveCount(0)
  299 |     await page.getByRole('button', { name: '重新读取板块', exact: true }).click()
  300 |     await expect(board(page, '通信协议').locator('.board-count')).toHaveText('23 题')
  301 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  302 |   } finally {
  303 |     await application
  304 |       .evaluate(() => Reflect.get(globalThis, 'boardReadControl')?.release?.())
  305 |       .catch(() => {})
  306 |     await stop(application)
  307 |   }
  308 | })
  309 | 
  310 | test('板块入口：实际数量/分页/归档一致，自定义与未分类可达，易中难筛选沿用原值', async ({
  311 |   testDataDirectory,
  312 | }, info) => {
  313 |   const { application, page, paths } = await prepare(testDataDirectory, info.project.name)
  314 |   try {
  315 |     await runtime(application, page, testDataDirectory, info)
  316 |     await openPage(page, '知识板块')
  317 |     await expect(board(page, '通信协议').locator('.board-count')).toHaveText('23 题')
  318 |     await expect(board(page, '我的重点').locator('.board-count')).toHaveText('3 题')
  319 |     await expect(
  320 |       board(page, '未分类').getByRole('button', { name: '进入板块：未分类', exact: true }),
  321 |     ).toHaveText('未分类 · 1 题')
  322 |     await expect(
  323 |       board(page, '全部题库').getByRole('button', { name: '进入板块：全部题库', exact: true }),
  324 |     ).toHaveText('全部题库 · 27 题')
  325 |     await expect(
  326 |       board(page, '空分类').getByRole('button', { name: '进入板块：空分类', exact: true }),
  327 |     ).toBeDisabled()
  328 |     const enter = board(page, '通信协议').getByRole('button', {
  329 |       name: '进入板块：通信协议',
  330 |       exact: true,
  331 |     })
  332 |     await enter.focus()
  333 |     await enter.press('Enter')
  334 |     await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
  335 |     await expect(page.getByLabel('题库浏览', { exact: true })).toBeFocused()
  336 |     await expect(page.locator('.question-list li')).toHaveCount(20)
  337 |     await expect(page.locator('.question-list .difficulty-badge')).toHaveCount(20)
  338 |     await page.getByRole('button', { name: '下一页', exact: true }).click()
  339 |     await expect(page.locator('.question-list li')).toHaveCount(3)
  340 |     for (const [value, label, count] of [
  341 |       ['基础', '易（基础）', 6],
  342 |       ['进阶', '中（进阶）', 6],
  343 |       ['综合', '难（综合）', 6],
  344 |       ['未分级', '未分级', 5],
  345 |     ] as const) {
  346 |       await page.getByLabel('题库难度', { exact: true }).selectOption({ label })
  347 |       await expect(page.getByLabel('题库难度', { exact: true })).toHaveValue(value)
> 348 |       await page.getByRole('button', { name: '筛选题库', exact: true }).click()
      |                                                                     ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
  349 |       await expect(page.getByText(`共 ${count} 题`, { exact: true })).toBeVisible()
  350 |       await expect(
  351 |         page.locator('.question-list').getByLabel(`难度：${label}`, { exact: true }),
  352 |       ).toHaveCount(count)
  353 |     }
  354 |     await page.getByLabel('题库搜索', { exact: true }).fill('不会匹配')
  355 |     await page.getByLabel('题库只看收藏', { exact: true }).check()
  356 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  357 |     await expect(page.getByText('共 0 题', { exact: true })).toBeVisible()
  358 |     await openPage(page, '知识板块')
  359 |     await board(page, '通信协议')
  360 |       .getByRole('button', { name: '进入板块：通信协议', exact: true })
  361 |       .click()
  362 |     await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
  363 |     await expect(page.getByLabel('题库搜索', { exact: true })).toHaveValue('')
  364 |     await expect(page.getByLabel('题库难度', { exact: true })).toHaveValue('')
  365 |     await expect(page.getByLabel('题库只看收藏', { exact: true })).not.toBeChecked()
  366 |     await expect(page.getByRole('navigation', { name: '题目分页', exact: true })).toContainText(
  367 |       '1 / 2',
  368 |     )
  369 |     await page.locator('.question-list li > button').first().click()
  370 |     await expect(
  371 |       page
  372 |         .getByRole('article', { name: '题目内容', exact: true })
  373 |         .getByLabel('难度：易（基础）', { exact: true }),
  374 |     ).toBeVisible()
  375 |     for (const [title, count] of [
  376 |       ['我的重点', 3],
  377 |       ['未分类', 1],
  378 |       ['全部题库', 27],
  379 |     ] as const) {
  380 |       await openPage(page, '知识板块')
  381 |       await board(page, title)
  382 |         .getByRole('button', { name: `进入板块：${title}`, exact: true })
  383 |         .click()
  384 |       await expect(page.getByText(`共 ${count} 题`, { exact: true })).toBeVisible()
  385 |     }
  386 |     await writeFile(paths[0]!, bank('board-a', 'UART板块测试', 23, true))
  387 |     await importHistoryFiles(application, page, [paths[0]!])
  388 |     await openPage(page, '知识板块')
  389 |     await expect(board(page, '通信协议').locator('.board-count')).toHaveText('22 题')
  390 |     await board(page, '通信协议')
  391 |       .getByRole('button', { name: '查看归档：通信协议', exact: true })
  392 |       .click()
  393 |     await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
  394 |     await expect(page.getByLabel('查看归档题目', { exact: true })).toBeChecked()
  395 |     await expect(page.locator('.question-list li')).toHaveCount(1)
  396 |   } finally {
  397 |     await stop(application)
  398 |   }
  399 | })
  400 | 
  401 | test('板块入口：900/1440窗口、四配色明暗、22px与键盘可用，难度文字对比度通过', async ({
  402 |   testDataDirectory,
  403 | }, info) => {
  404 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  405 |   try {
  406 |     const before = historySnapshot(testDataDirectory)
  407 |     const measurements = []
  408 |     for (const palette of ['松间绿', '晴空蓝', '暖沙金', '暮山紫']) {
  409 |       for (const theme of ['light', 'dark'] as const) {
  410 |         await application.evaluate(
  411 |           ({ BrowserWindow }, width) => BrowserWindow.getAllWindows()[0]!.setSize(width, 880),
  412 |           theme === 'light' ? 1440 : 900,
  413 |         )
  414 |         await openPage(page, '设置与数据')
  415 |         await page.getByRole('radio', { name: palette, exact: true }).check()
  416 |         await page.getByLabel('显示主题', { exact: true }).selectOption(theme)
  417 |         await page
  418 |           .getByLabel('正文字号', { exact: true })
  419 |           .selectOption(theme === 'dark' ? '22' : '17')
  420 |         await page.getByRole('button', { name: '保存并应用', exact: true }).click()
  421 |         await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
  422 |         await openPage(page, '知识板块')
  423 |         await expect(board(page, '通信协议').locator('.board-count')).toHaveText('23 题')
  424 |         const search = page.getByRole('searchbox', { name: '搜索板块', exact: true })
  425 |         await expect(search).toHaveCSS(
  426 |           'background-color',
  427 |           theme === 'dark'
  428 |             ? {
  429 |                 松间绿: 'rgb(27, 36, 32)',
  430 |                 晴空蓝: 'rgb(30, 39, 53)',
  431 |                 暖沙金: 'rgb(46, 39, 30)',
  432 |                 暮山紫: 'rgb(43, 35, 52)',
  433 |               }[palette]!
  434 |             : {
  435 |                 松间绿: 'rgb(252, 253, 251)',
  436 |                 晴空蓝: 'rgb(250, 252, 254)',
  437 |                 暖沙金: 'rgb(253, 250, 244)',
  438 |                 暮山紫: 'rgb(252, 250, 253)',
  439 |               }[palette]!,
  440 |         )
  441 |         await search.focus()
  442 |         await search.press('Tab')
  443 |         const toggle = page.getByLabel('显示拓展方向', { exact: true })
  444 |         await expect(toggle).toBeFocused()
  445 |         await toggle.press('Space')
  446 |         await expect(toggle).toBeChecked()
  447 |         const summary = board(page, 'C语言').locator('summary')
  448 |         await summary.focus()
```