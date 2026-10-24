# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: board-entry.spec.ts >> 板块入口：900/1440窗口、四配色明暗、22px与键盘可用，难度文字对比度通过
- Location: tests\e2e\board-entry.spec.ts:390:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 1424
Received: 1409
```

# Test source

```ts
  337 |       await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  338 |       await expect(page.getByText(`共 ${count} 题`, { exact: true })).toBeVisible()
  339 |       await expect(
  340 |         page.locator('.question-list').getByLabel(`难度：${label}`, { exact: true }),
  341 |       ).toHaveCount(count)
  342 |     }
  343 |     await page.getByLabel('题库搜索', { exact: true }).fill('不会匹配')
  344 |     await page.getByLabel('题库只看收藏', { exact: true }).check()
  345 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  346 |     await expect(page.getByText('共 0 题', { exact: true })).toBeVisible()
  347 |     await openPage(page, '板块')
  348 |     await board(page, '通信协议')
  349 |       .getByRole('button', { name: '进入板块：通信协议', exact: true })
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
  430 |             document: { documentElement: { scrollWidth: number } }
  431 |           }
  432 |           return {
  433 |             viewport: browser.innerWidth,
  434 |             scrollWidth: browser.document.documentElement.scrollWidth,
  435 |           }
  436 |         })
> 437 |         expect(dimensions.scrollWidth).toBe(dimensions.viewport)
      |                                        ^ Error: expect(received).toBe(expected) // Object.is equality
  438 |         if (palette === '松间绿')
  439 |           await captureHistory(application, page, info, `boards-${theme}.png`)
  440 |         const enter = board(page, '通信协议').getByRole('button', {
  441 |           name: '进入板块：通信协议',
  442 |           exact: true,
  443 |         })
  444 |         await enter.focus()
  445 |         await enter.press('Enter')
  446 |         await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
  447 |         await expect(page.getByLabel('题库浏览', { exact: true })).toBeFocused()
  448 |         await page.getByLabel('题库浏览', { exact: true }).press('Tab')
  449 |         await expect(page.getByLabel('题库专题检索', { exact: true })).toBeFocused()
  450 |         const ratios = await page.evaluate(() => {
  451 |           const browser = globalThis as unknown as {
  452 |             document: { querySelector: (selector: string) => unknown }
  453 |             getComputedStyle: (element: unknown) => { color: string; backgroundColor: string }
  454 |           }
  455 |           const luminance = (rgb: string) =>
  456 |             rgb
  457 |               .match(/[\d.]+/g)!
  458 |               .slice(0, 3)
  459 |               .map(Number)
  460 |               .map((v) => {
  461 |                 const c = v / 255
  462 |                 return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  463 |               })
  464 |               .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i]!, 0)
  465 |           return ['easy', 'medium', 'hard', 'unrated'].map((tone) => {
  466 |             const style = browser.getComputedStyle(
  467 |               browser.document.querySelector(`.question-list .difficulty-${tone}`),
  468 |             )
  469 |             const values = [luminance(style.color), luminance(style.backgroundColor)].sort(
  470 |               (a, b) => b - a,
  471 |             )
  472 |             return { tone, ratio: (values[0]! + 0.05) / (values[1]! + 0.05) }
  473 |           })
  474 |         })
  475 |         for (const { ratio } of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5)
  476 |         measurements.push({ palette, theme, dimensions, ratios })
  477 |         if (palette === '松间绿')
  478 |           await captureHistory(application, page, info, `difficulty-${theme}.png`)
  479 |         expect(historySnapshot(testDataDirectory)).toEqual(before)
  480 |       }
  481 |     }
  482 |     await info.attach('board-appearance-measurements.json', {
  483 |       body: JSON.stringify(measurements, null, 2),
  484 |       contentType: 'application/json',
  485 |     })
  486 |   } finally {
  487 |     await stop(application)
  488 |   }
  489 | })
  490 | 
```