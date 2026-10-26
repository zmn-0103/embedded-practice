# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: board-entry.spec.ts >> 板块入口：900/1440窗口、四配色明暗、22px与键盘可用，难度文字对比度通过
- Location: tests\e2e\board-entry.spec.ts:398:5

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator:  locator('.library-navigation .topic-navigation-panel > summary')
Expected: focused
Received: inactive
Timeout:  10000ms

Call log:
  - Expect "toBeFocused" locator('.library-navigation .topic-navigation-panel > summary') with timeout 10000ms
  - waiting for locator('.library-navigation .topic-navigation-panel > summary')
    24 × locator resolved to <summary>分类与专题</summary>
       - unexpected value "inactive"

```

```yaml
- text: 分类与专题
```

# Test source

```ts
  385 |     await openPage(page, '知识板块')
  386 |     await expect(board(page, '通信协议').locator('.board-count')).toHaveText('22 题')
  387 |     await board(page, '通信协议')
  388 |       .getByRole('button', { name: '查看归档：通信协议', exact: true })
  389 |       .click()
  390 |     await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
  391 |     await expect(page.getByLabel('查看归档题目', { exact: true })).toBeChecked()
  392 |     await expect(page.locator('.question-list li')).toHaveCount(1)
  393 |   } finally {
  394 |     await stop(application)
  395 |   }
  396 | })
  397 | 
  398 | test('板块入口：900/1440窗口、四配色明暗、22px与键盘可用，难度文字对比度通过', async ({
  399 |   testDataDirectory,
  400 | }, info) => {
  401 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  402 |   try {
  403 |     const before = historySnapshot(testDataDirectory)
  404 |     const measurements = []
  405 |     for (const palette of ['松间绿', '晴空蓝', '暖沙金', '暮山紫']) {
  406 |       for (const theme of ['light', 'dark'] as const) {
  407 |         await application.evaluate(
  408 |           ({ BrowserWindow }, width) => BrowserWindow.getAllWindows()[0]!.setSize(width, 880),
  409 |           theme === 'light' ? 1440 : 900,
  410 |         )
  411 |         await openPage(page, '设置与数据')
  412 |         await page.getByRole('radio', { name: palette, exact: true }).check()
  413 |         await page.getByLabel('显示主题', { exact: true }).selectOption(theme)
  414 |         await page
  415 |           .getByLabel('正文字号', { exact: true })
  416 |           .selectOption(theme === 'dark' ? '22' : '17')
  417 |         await page.getByRole('button', { name: '保存并应用', exact: true }).click()
  418 |         await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
  419 |         await openPage(page, '知识板块')
  420 |         await expect(board(page, '通信协议').locator('.board-count')).toHaveText('23 题')
  421 |         const search = page.getByRole('searchbox', { name: '搜索板块', exact: true })
  422 |         await expect(search).toHaveCSS(
  423 |           'background-color',
  424 |           theme === 'dark'
  425 |             ? {
  426 |                 松间绿: 'rgb(27, 36, 32)',
  427 |                 晴空蓝: 'rgb(30, 39, 53)',
  428 |                 暖沙金: 'rgb(46, 39, 30)',
  429 |                 暮山紫: 'rgb(43, 35, 52)',
  430 |               }[palette]!
  431 |             : {
  432 |                 松间绿: 'rgb(252, 253, 251)',
  433 |                 晴空蓝: 'rgb(250, 252, 254)',
  434 |                 暖沙金: 'rgb(253, 250, 244)',
  435 |                 暮山紫: 'rgb(252, 250, 253)',
  436 |               }[palette]!,
  437 |         )
  438 |         await search.focus()
  439 |         await search.press('Tab')
  440 |         const toggle = page.getByLabel('显示拓展方向', { exact: true })
  441 |         await expect(toggle).toBeFocused()
  442 |         await toggle.press('Space')
  443 |         await expect(toggle).toBeChecked()
  444 |         const summary = board(page, 'C语言').locator('summary')
  445 |         await summary.focus()
  446 |         await summary.press('Enter')
  447 |         await expect(
  448 |           board(page, 'C语言').getByText('数据类型与表达式', { exact: true }),
  449 |         ).toBeVisible()
  450 |         await expect(summary).toHaveCSS('box-shadow', /0px 0px 0px 2px, .*0px 0px 0px 4px/)
  451 |         const dimensions = await page.evaluate(() => {
  452 |           const browser = globalThis as unknown as {
  453 |             innerWidth: number
  454 |             document: { documentElement: { scrollWidth: number; clientWidth: number } }
  455 |           }
  456 |           return {
  457 |             viewport: browser.innerWidth,
  458 |             clientWidth: browser.document.documentElement.clientWidth,
  459 |             scrollWidth: browser.document.documentElement.scrollWidth,
  460 |           }
  461 |         })
  462 |         expect(dimensions.scrollWidth).toBe(dimensions.clientWidth)
  463 |         await page.evaluate(() =>
  464 |           (Reflect.get(globalThis, 'scrollTo') as (x: number, y: number) => void)(0, 0),
  465 |         )
  466 |         if (palette === '松间绿')
  467 |           await captureHistory(application, page, info, `boards-${theme}.png`)
  468 |         const enter = board(page, '通信协议').getByRole('button', {
  469 |           name: '进入板块：通信协议',
  470 |           exact: true,
  471 |         })
  472 |         await enter.focus()
  473 |         await enter.press('Enter')
  474 |         await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
  475 |         await expect(page.getByLabel('题库浏览', { exact: true })).toBeFocused()
  476 |         await page.getByLabel('题库浏览', { exact: true }).press('Tab')
  477 |         const managementSummary = page.locator(
  478 |           '.library-management-tools .category-manager > summary',
  479 |         )
  480 |         await expect(managementSummary).toBeFocused()
  481 |         await managementSummary.press('Tab')
  482 |         const navigationSummary = page.locator(
  483 |           '.library-navigation .topic-navigation-panel > summary',
  484 |         )
> 485 |         await expect(navigationSummary).toBeFocused()
      |                                         ^ Error: expect(locator).toBeFocused() failed
  486 |         await navigationSummary.press('Tab')
  487 |         await expect(page.getByLabel('题库专题检索', { exact: true })).toBeFocused()
  488 |         const ratios = await page.evaluate(() => {
  489 |           const browser = globalThis as unknown as {
  490 |             document: { querySelector: (selector: string) => unknown }
  491 |             getComputedStyle: (element: unknown) => { color: string; backgroundColor: string }
  492 |           }
  493 |           const luminance = (rgb: string) =>
  494 |             rgb
  495 |               .match(/[\d.]+/g)!
  496 |               .slice(0, 3)
  497 |               .map(Number)
  498 |               .map((v) => {
  499 |                 const c = v / 255
  500 |                 return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  501 |               })
  502 |               .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i]!, 0)
  503 |           return ['easy', 'medium', 'hard', 'unrated'].map((tone) => {
  504 |             const style = browser.getComputedStyle(
  505 |               browser.document.querySelector(`.question-list .difficulty-${tone}`),
  506 |             )
  507 |             const values = [luminance(style.color), luminance(style.backgroundColor)].sort(
  508 |               (a, b) => b - a,
  509 |             )
  510 |             return { tone, ratio: (values[0]! + 0.05) / (values[1]! + 0.05) }
  511 |           })
  512 |         })
  513 |         for (const { ratio } of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5)
  514 |         measurements.push({ palette, theme, dimensions, ratios })
  515 |         if (palette === '松间绿')
  516 |           await captureHistory(application, page, info, `difficulty-${theme}.png`)
  517 |         expect(historySnapshot(testDataDirectory)).toEqual(before)
  518 |       }
  519 |     }
  520 |     await info.attach('board-appearance-measurements.json', {
  521 |       body: JSON.stringify(measurements, null, 2),
  522 |       contentType: 'application/json',
  523 |     })
  524 |   } finally {
  525 |     await stop(application)
  526 |   }
  527 | })
  528 | 
```