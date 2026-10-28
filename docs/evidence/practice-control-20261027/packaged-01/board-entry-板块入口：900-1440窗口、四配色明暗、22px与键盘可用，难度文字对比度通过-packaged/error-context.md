# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: board-entry.spec.ts >> 板块入口：900/1440窗口、四配色明暗、22px与键盘可用，难度文字对比度通过
- Location: tests\e2e\board-entry.spec.ts:403:5

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  locator('.library-management-tools .category-manager > summary')
Expected: focused
Received: inactive
Timeout:  10000ms

Call log:
  - Expect "toBeFocused" locator('.library-management-tools .category-manager > summary') with timeout 10000ms
  - waiting for locator('.library-management-tools .category-manager > summary')
    23 × locator resolved to <summary>管理分类</summary>
       - unexpected value "inactive"

```

```yaml
- text: 管理分类
```

# Test source

```ts
  385 |         .click()
  386 |       await expect(page.getByText(`共 ${count} 题`, { exact: true })).toBeVisible()
  387 |     }
  388 |     await writeFile(paths[0]!, bank('board-a', 'UART板块测试', 23, true))
  389 |     await importHistoryFiles(application, page, [paths[0]!])
  390 |     await openPage(page, '知识板块')
  391 |     await expect(board(page, '通信协议').locator('.board-count')).toHaveText('22 题')
  392 |     await board(page, '通信协议')
  393 |       .getByRole('button', { name: '查看归档：通信协议', exact: true })
  394 |       .click()
  395 |     await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
  396 |     await expect(page.getByLabel('查看归档题目', { exact: true })).toBeChecked()
  397 |     await expect(page.locator('.question-list li')).toHaveCount(1)
  398 |   } finally {
  399 |     await stop(application)
  400 |   }
  401 | })
  402 | 
  403 | test('板块入口：900/1440窗口、四配色明暗、22px与键盘可用，难度文字对比度通过', async ({
  404 |   testDataDirectory,
  405 | }, info) => {
  406 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  407 |   try {
  408 |     const before = historySnapshot(testDataDirectory)
  409 |     const measurements = []
  410 |     for (const palette of ['松间绿', '晴空蓝', '暖沙金', '暮山紫']) {
  411 |       for (const theme of ['light', 'dark'] as const) {
  412 |         await application.evaluate(
  413 |           ({ BrowserWindow }, width) => BrowserWindow.getAllWindows()[0]!.setSize(width, 880),
  414 |           theme === 'light' ? 1440 : 900,
  415 |         )
  416 |         await openPage(page, '设置与数据')
  417 |         await page.getByRole('radio', { name: palette, exact: true }).check()
  418 |         await page.getByLabel('显示主题', { exact: true }).selectOption(theme)
  419 |         await page
  420 |           .getByLabel('正文字号', { exact: true })
  421 |           .selectOption(theme === 'dark' ? '22' : '17')
  422 |         await page.getByRole('button', { name: '保存并应用', exact: true }).click()
  423 |         await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
  424 |         await openPage(page, '知识板块')
  425 |         await expect(board(page, '通信协议').locator('.board-count')).toHaveText('23 题')
  426 |         const search = page.getByRole('searchbox', { name: '搜索板块', exact: true })
  427 |         await expect(search).toHaveCSS(
  428 |           'background-color',
  429 |           theme === 'dark'
  430 |             ? {
  431 |                 松间绿: 'rgb(27, 36, 32)',
  432 |                 晴空蓝: 'rgb(30, 39, 53)',
  433 |                 暖沙金: 'rgb(46, 39, 30)',
  434 |                 暮山紫: 'rgb(43, 35, 52)',
  435 |               }[palette]!
  436 |             : {
  437 |                 松间绿: 'rgb(252, 253, 251)',
  438 |                 晴空蓝: 'rgb(250, 252, 254)',
  439 |                 暖沙金: 'rgb(253, 250, 244)',
  440 |                 暮山紫: 'rgb(252, 250, 253)',
  441 |               }[palette]!,
  442 |         )
  443 |         await search.focus()
  444 |         await search.press('Tab')
  445 |         const toggle = page.getByLabel('显示拓展方向', { exact: true })
  446 |         await expect(toggle).toBeFocused()
  447 |         await toggle.press('Space')
  448 |         await expect(toggle).toBeChecked()
  449 |         const summary = board(page, 'C语言').locator('summary')
  450 |         await summary.focus()
  451 |         await summary.press('Enter')
  452 |         await expect(
  453 |           board(page, 'C语言').getByText('数据类型与表达式', { exact: true }),
  454 |         ).toBeVisible()
  455 |         await expect(summary).toHaveCSS('box-shadow', /0px 0px 0px 2px, .*0px 0px 0px 4px/)
  456 |         const dimensions = await page.evaluate(() => {
  457 |           const browser = globalThis as unknown as {
  458 |             innerWidth: number
  459 |             document: { documentElement: { scrollWidth: number; clientWidth: number } }
  460 |           }
  461 |           return {
  462 |             viewport: browser.innerWidth,
  463 |             clientWidth: browser.document.documentElement.clientWidth,
  464 |             scrollWidth: browser.document.documentElement.scrollWidth,
  465 |           }
  466 |         })
  467 |         expect(dimensions.scrollWidth).toBe(dimensions.clientWidth)
  468 |         await page.evaluate(() =>
  469 |           (Reflect.get(globalThis, 'scrollTo') as (x: number, y: number) => void)(0, 0),
  470 |         )
  471 |         if (palette === '松间绿')
  472 |           await captureHistory(application, page, info, `boards-${theme}.png`)
  473 |         const enter = board(page, '通信协议').getByRole('button', {
  474 |           name: '进入板块：通信协议',
  475 |           exact: true,
  476 |         })
  477 |         await enter.focus()
  478 |         await enter.press('Enter')
  479 |         await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
  480 |         await expect(page.getByLabel('题库浏览', { exact: true })).toBeFocused()
  481 |         await page.getByLabel('题库浏览', { exact: true }).press('Tab')
  482 |         const managementSummary = page.locator(
  483 |           '.library-management-tools .category-manager > summary',
  484 |         )
> 485 |         await expect(managementSummary).toBeFocused()
      |                                         ^ Error: expect(locator).toBeFocused() failed
  486 |         if (
  487 |           (await page
  488 |             .locator('.library-management-tools .category-manager')
  489 |             .getAttribute('open')) !== null
  490 |         ) {
  491 |           await managementSummary.press('Enter')
  492 |           await expect(
  493 |             page.locator('.library-management-tools .category-manager'),
  494 |           ).not.toHaveAttribute('open')
  495 |         }
  496 |         await managementSummary.press('Tab')
  497 |         const topicScope = page.getByLabel('专题', { exact: true })
  498 |         await expect(topicScope).toBeFocused()
  499 |         await topicScope.press('Tab')
  500 |         const archiveScope = page.getByRole('checkbox', { name: '查看归档题目', exact: true })
  501 |         await expect(archiveScope).toBeFocused()
  502 |         await archiveScope.press('Tab')
  503 |         await expect(page.getByRole('searchbox', { name: '题库搜索', exact: true })).toBeFocused()
  504 |         const navigationSummary = page.locator(
  505 |           '.library-navigation .topic-navigation-panel > summary',
  506 |         )
  507 |         for (
  508 |           let step = 0;
  509 |           step < 16 &&
  510 |           !(await navigationSummary.evaluate(
  511 |             (element) => element === element.ownerDocument.activeElement,
  512 |           ));
  513 |           step++
  514 |         )
  515 |           await page.keyboard.press('Tab')
  516 |         await expect(navigationSummary).toBeFocused()
  517 |         await navigationSummary.press('Tab')
  518 |         await expect(page.getByLabel('题库专题检索', { exact: true })).toBeFocused()
  519 |         const ratios = await page.evaluate(() => {
  520 |           const browser = globalThis as unknown as {
  521 |             document: { querySelector: (selector: string) => unknown }
  522 |             getComputedStyle: (element: unknown) => { color: string; backgroundColor: string }
  523 |           }
  524 |           const luminance = (rgb: string) =>
  525 |             rgb
  526 |               .match(/[\d.]+/g)!
  527 |               .slice(0, 3)
  528 |               .map(Number)
  529 |               .map((v) => {
  530 |                 const c = v / 255
  531 |                 return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  532 |               })
  533 |               .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i]!, 0)
  534 |           return ['easy', 'medium', 'hard', 'unrated'].map((tone) => {
  535 |             const style = browser.getComputedStyle(
  536 |               browser.document.querySelector(`.question-list .difficulty-${tone}`),
  537 |             )
  538 |             const values = [luminance(style.color), luminance(style.backgroundColor)].sort(
  539 |               (a, b) => b - a,
  540 |             )
  541 |             return { tone, ratio: (values[0]! + 0.05) / (values[1]! + 0.05) }
  542 |           })
  543 |         })
  544 |         for (const { ratio } of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5)
  545 |         measurements.push({ palette, theme, dimensions, ratios })
  546 |         if (palette === '松间绿')
  547 |           await captureHistory(application, page, info, `difficulty-${theme}.png`)
  548 |         expect(historySnapshot(testDataDirectory)).toEqual(before)
  549 |       }
  550 |     }
  551 |     await info.attach('board-appearance-measurements.json', {
  552 |       body: JSON.stringify(measurements, null, 2),
  553 |       contentType: 'application/json',
  554 |     })
  555 |   } finally {
  556 |     await stop(application)
  557 |   }
  558 | })
  559 | 
```