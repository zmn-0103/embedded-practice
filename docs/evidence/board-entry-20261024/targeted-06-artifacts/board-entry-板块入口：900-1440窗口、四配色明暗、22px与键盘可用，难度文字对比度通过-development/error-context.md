# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: board-entry.spec.ts >> 板块入口：900/1440窗口、四配色明暗、22px与键盘可用，难度文字对比度通过
- Location: tests\e2e\board-entry.spec.ts:390:5

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  getByLabel('题库专题检索', { exact: true })
Expected: focused
Received: inactive
Timeout:  10000ms

Call log:
  - Expect "toBeFocused" getByLabel('题库专题检索', { exact: true }) with timeout 10000ms
  - waiting for getByLabel('题库专题检索', { exact: true })
    24 × locator resolved to <input value="" type="search" aria-label="题库专题检索" placeholder="搜索分类或专题名称"/>
       - unexpected value "inactive"

```

```yaml
- searchbox "题库专题检索"
```

# Test source

```ts
  350 |       .click()
  351 |     await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
  352 |     await expect(page.getByLabel('题库搜索', { exact: true })).toHaveValue('')
  353 |     await expect(page.getByLabel('题库难度', { exact: true })).toHaveValue('')
  354 |     await expect(page.getByLabel('题库只看收藏', { exact: true })).not.toBeChecked()
  355 |     await expect(page.getByRole('navigation', { name: '题目分页', exact: true })).toContainText(
  356 |       '1 / 2',
  357 |     )
  358 |     await page.locator('.question-list li > button').first().click()
  359 |     await expect(
  360 |       page
  361 |         .getByRole('article', { name: '题目内容', exact: true })
  362 |         .getByLabel('难度：易（基础）', { exact: true }),
  363 |     ).toBeVisible()
  364 |     for (const [title, count] of [
  365 |       ['我的重点', 3],
  366 |       ['未分类', 1],
  367 |       ['全部题库', 27],
  368 |     ] as const) {
  369 |       await openPage(page, '板块')
  370 |       await board(page, title)
  371 |         .getByRole('button', { name: `进入板块：${title}`, exact: true })
  372 |         .click()
  373 |       await expect(page.getByText(`共 ${count} 题`, { exact: true })).toBeVisible()
  374 |     }
  375 |     await writeFile(paths[0]!, bank('board-a', 'UART板块测试', 23, true))
  376 |     await importHistoryFiles(application, page, [paths[0]!])
  377 |     await openPage(page, '板块')
  378 |     await expect(board(page, '通信协议').locator('.board-count')).toHaveText('22 题')
  379 |     await board(page, '通信协议')
  380 |       .getByRole('button', { name: '查看归档：通信协议', exact: true })
  381 |       .click()
  382 |     await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
  383 |     await expect(page.getByLabel('查看归档题目', { exact: true })).toBeChecked()
  384 |     await expect(page.locator('.question-list li')).toHaveCount(1)
  385 |   } finally {
  386 |     await stop(application)
  387 |   }
  388 | })
  389 | 
  390 | test('板块入口：900/1440窗口、四配色明暗、22px与键盘可用，难度文字对比度通过', async ({
  391 |   testDataDirectory,
  392 | }, info) => {
  393 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  394 |   try {
  395 |     const before = historySnapshot(testDataDirectory)
  396 |     const measurements = []
  397 |     for (const palette of ['松间绿', '晴空蓝', '暖沙金', '暮山紫']) {
  398 |       for (const theme of ['light', 'dark'] as const) {
  399 |         await application.evaluate(
  400 |           ({ BrowserWindow }, width) => BrowserWindow.getAllWindows()[0]!.setSize(width, 880),
  401 |           theme === 'light' ? 1440 : 900,
  402 |         )
  403 |         await openPage(page, '设置与数据')
  404 |         await page.getByRole('radio', { name: palette, exact: true }).check()
  405 |         await page.getByLabel('显示主题', { exact: true }).selectOption(theme)
  406 |         await page
  407 |           .getByLabel('正文字号', { exact: true })
  408 |           .selectOption(theme === 'dark' ? '22' : '17')
  409 |         await page.getByRole('button', { name: '保存显示设置', exact: true }).click()
  410 |         await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
  411 |         await openPage(page, '板块')
  412 |         await expect(board(page, '通信协议').locator('.board-count')).toHaveText('23 题')
  413 |         const search = page.getByRole('searchbox', { name: '搜索板块', exact: true })
  414 |         await search.focus()
  415 |         await search.press('Tab')
  416 |         const toggle = page.getByLabel('显示拓展方向', { exact: true })
  417 |         await expect(toggle).toBeFocused()
  418 |         await toggle.press('Space')
  419 |         await expect(toggle).toBeChecked()
  420 |         const summary = board(page, 'C语言').locator('summary')
  421 |         await summary.focus()
  422 |         await summary.press('Enter')
  423 |         await expect(
  424 |           board(page, 'C语言').getByText('数据类型与表达式', { exact: true }),
  425 |         ).toBeVisible()
  426 |         await expect(summary).toHaveCSS('box-shadow', /0px 0px 0px 2px, .*0px 0px 0px 4px/)
  427 |         const dimensions = await page.evaluate(() => {
  428 |           const browser = globalThis as unknown as {
  429 |             innerWidth: number
  430 |             document: { documentElement: { scrollWidth: number; clientWidth: number } }
  431 |           }
  432 |           return {
  433 |             viewport: browser.innerWidth,
  434 |             clientWidth: browser.document.documentElement.clientWidth,
  435 |             scrollWidth: browser.document.documentElement.scrollWidth,
  436 |           }
  437 |         })
  438 |         expect(dimensions.scrollWidth).toBe(dimensions.clientWidth)
  439 |         if (palette === '松间绿')
  440 |           await captureHistory(application, page, info, `boards-${theme}.png`)
  441 |         const enter = board(page, '通信协议').getByRole('button', {
  442 |           name: '进入板块：通信协议',
  443 |           exact: true,
  444 |         })
  445 |         await enter.focus()
  446 |         await enter.press('Enter')
  447 |         await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
  448 |         await expect(page.getByLabel('题库浏览', { exact: true })).toBeFocused()
  449 |         await page.getByLabel('题库浏览', { exact: true }).press('Tab')
> 450 |         await expect(page.getByLabel('题库专题检索', { exact: true })).toBeFocused()
      |                                                                  ^ Error: expect(locator).toBeFocused() failed
  451 |         const ratios = await page.evaluate(() => {
  452 |           const browser = globalThis as unknown as {
  453 |             document: { querySelector: (selector: string) => unknown }
  454 |             getComputedStyle: (element: unknown) => { color: string; backgroundColor: string }
  455 |           }
  456 |           const luminance = (rgb: string) =>
  457 |             rgb
  458 |               .match(/[\d.]+/g)!
  459 |               .slice(0, 3)
  460 |               .map(Number)
  461 |               .map((v) => {
  462 |                 const c = v / 255
  463 |                 return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  464 |               })
  465 |               .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i]!, 0)
  466 |           return ['easy', 'medium', 'hard', 'unrated'].map((tone) => {
  467 |             const style = browser.getComputedStyle(
  468 |               browser.document.querySelector(`.question-list .difficulty-${tone}`),
  469 |             )
  470 |             const values = [luminance(style.color), luminance(style.backgroundColor)].sort(
  471 |               (a, b) => b - a,
  472 |             )
  473 |             return { tone, ratio: (values[0]! + 0.05) / (values[1]! + 0.05) }
  474 |           })
  475 |         })
  476 |         for (const { ratio } of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5)
  477 |         measurements.push({ palette, theme, dimensions, ratios })
  478 |         if (palette === '松间绿')
  479 |           await captureHistory(application, page, info, `difficulty-${theme}.png`)
  480 |         expect(historySnapshot(testDataDirectory)).toEqual(before)
  481 |       }
  482 |     }
  483 |     await info.attach('board-appearance-measurements.json', {
  484 |       body: JSON.stringify(measurements, null, 2),
  485 |       contentType: 'application/json',
  486 |     })
  487 |   } finally {
  488 |     await stop(application)
  489 |   }
  490 | })
  491 | 
```