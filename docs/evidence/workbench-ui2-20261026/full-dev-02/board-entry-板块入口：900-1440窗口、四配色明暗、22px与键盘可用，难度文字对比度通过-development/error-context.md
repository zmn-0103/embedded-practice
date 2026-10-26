# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: board-entry.spec.ts >> 板块入口：900/1440窗口、四配色明暗、22px与键盘可用，难度文字对比度通过
- Location: tests\e2e\board-entry.spec.ts:397:5

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
  394 |   }
  395 | })
  396 | 
  397 | test('板块入口：900/1440窗口、四配色明暗、22px与键盘可用，难度文字对比度通过', async ({
  398 |   testDataDirectory,
  399 | }, info) => {
  400 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  401 |   try {
  402 |     const before = historySnapshot(testDataDirectory)
  403 |     const measurements = []
  404 |     for (const palette of ['松间绿', '晴空蓝', '暖沙金', '暮山紫']) {
  405 |       for (const theme of ['light', 'dark'] as const) {
  406 |         await application.evaluate(
  407 |           ({ BrowserWindow }, width) => BrowserWindow.getAllWindows()[0]!.setSize(width, 880),
  408 |           theme === 'light' ? 1440 : 900,
  409 |         )
  410 |         await openPage(page, '设置与数据')
  411 |         await page.getByRole('radio', { name: palette, exact: true }).check()
  412 |         await page.getByLabel('显示主题', { exact: true }).selectOption(theme)
  413 |         await page
  414 |           .getByLabel('正文字号', { exact: true })
  415 |           .selectOption(theme === 'dark' ? '22' : '17')
  416 |         await page.getByRole('button', { name: '保存并应用', exact: true }).click()
  417 |         await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
  418 |         await openPage(page, '知识板块')
  419 |         await expect(board(page, '通信协议').locator('.board-count')).toHaveText('23 题')
  420 |         const search = page.getByRole('searchbox', { name: '搜索板块', exact: true })
  421 |         await expect(search).toHaveCSS(
  422 |           'background-color',
  423 |           theme === 'dark'
  424 |             ? {
  425 |                 松间绿: 'rgb(27, 36, 32)',
  426 |                 晴空蓝: 'rgb(30, 39, 53)',
  427 |                 暖沙金: 'rgb(46, 39, 30)',
  428 |                 暮山紫: 'rgb(43, 35, 52)',
  429 |               }[palette]!
  430 |             : {
  431 |                 松间绿: 'rgb(252, 253, 251)',
  432 |                 晴空蓝: 'rgb(250, 252, 254)',
  433 |                 暖沙金: 'rgb(253, 250, 244)',
  434 |                 暮山紫: 'rgb(252, 250, 253)',
  435 |               }[palette]!,
  436 |         )
  437 |         await search.focus()
  438 |         await search.press('Tab')
  439 |         const toggle = page.getByLabel('显示拓展方向', { exact: true })
  440 |         await expect(toggle).toBeFocused()
  441 |         await toggle.press('Space')
  442 |         await expect(toggle).toBeChecked()
  443 |         const summary = board(page, 'C语言').locator('summary')
  444 |         await summary.focus()
  445 |         await summary.press('Enter')
  446 |         await expect(
  447 |           board(page, 'C语言').getByText('数据类型与表达式', { exact: true }),
  448 |         ).toBeVisible()
  449 |         await expect(summary).toHaveCSS('box-shadow', /0px 0px 0px 2px, .*0px 0px 0px 4px/)
  450 |         const dimensions = await page.evaluate(() => {
  451 |           const browser = globalThis as unknown as {
  452 |             innerWidth: number
  453 |             document: { documentElement: { scrollWidth: number; clientWidth: number } }
  454 |           }
  455 |           return {
  456 |             viewport: browser.innerWidth,
  457 |             clientWidth: browser.document.documentElement.clientWidth,
  458 |             scrollWidth: browser.document.documentElement.scrollWidth,
  459 |           }
  460 |         })
  461 |         expect(dimensions.scrollWidth).toBe(dimensions.clientWidth)
  462 |         await page.evaluate(() =>
  463 |           (Reflect.get(globalThis, 'scrollTo') as (x: number, y: number) => void)(0, 0),
  464 |         )
  465 |         if (palette === '松间绿')
  466 |           await captureHistory(application, page, info, `boards-${theme}.png`)
  467 |         const enter = board(page, '通信协议').getByRole('button', {
  468 |           name: '进入板块：通信协议',
  469 |           exact: true,
  470 |         })
  471 |         await enter.focus()
  472 |         await enter.press('Enter')
  473 |         await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
  474 |         await expect(page.getByLabel('题库浏览', { exact: true })).toBeFocused()
  475 |         await page.getByLabel('题库浏览', { exact: true }).press('Tab')
  476 |         const managementSummary = page.locator(
  477 |           '.library-management-tools .category-manager > summary',
  478 |         )
  479 |         await expect(managementSummary).toBeFocused()
  480 |         if (
  481 |           (await page
  482 |             .locator('.library-management-tools .category-manager')
  483 |             .getAttribute('open')) !== null
  484 |         ) {
  485 |           await managementSummary.press('Enter')
  486 |           await expect(
  487 |             page.locator('.library-management-tools .category-manager'),
  488 |           ).not.toHaveAttribute('open')
  489 |         }
  490 |         await managementSummary.press('Tab')
  491 |         const navigationSummary = page.locator(
  492 |           '.library-navigation .topic-navigation-panel > summary',
  493 |         )
> 494 |         await expect(navigationSummary).toBeFocused()
      |                                         ^ Error: expect(locator).toBeFocused() failed
  495 |         await navigationSummary.press('Tab')
  496 |         await expect(page.getByLabel('题库专题检索', { exact: true })).toBeFocused()
  497 |         const ratios = await page.evaluate(() => {
  498 |           const browser = globalThis as unknown as {
  499 |             document: { querySelector: (selector: string) => unknown }
  500 |             getComputedStyle: (element: unknown) => { color: string; backgroundColor: string }
  501 |           }
  502 |           const luminance = (rgb: string) =>
  503 |             rgb
  504 |               .match(/[\d.]+/g)!
  505 |               .slice(0, 3)
  506 |               .map(Number)
  507 |               .map((v) => {
  508 |                 const c = v / 255
  509 |                 return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  510 |               })
  511 |               .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i]!, 0)
  512 |           return ['easy', 'medium', 'hard', 'unrated'].map((tone) => {
  513 |             const style = browser.getComputedStyle(
  514 |               browser.document.querySelector(`.question-list .difficulty-${tone}`),
  515 |             )
  516 |             const values = [luminance(style.color), luminance(style.backgroundColor)].sort(
  517 |               (a, b) => b - a,
  518 |             )
  519 |             return { tone, ratio: (values[0]! + 0.05) / (values[1]! + 0.05) }
  520 |           })
  521 |         })
  522 |         for (const { ratio } of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5)
  523 |         measurements.push({ palette, theme, dimensions, ratios })
  524 |         if (palette === '松间绿')
  525 |           await captureHistory(application, page, info, `difficulty-${theme}.png`)
  526 |         expect(historySnapshot(testDataDirectory)).toEqual(before)
  527 |       }
  528 |     }
  529 |     await info.attach('board-appearance-measurements.json', {
  530 |       body: JSON.stringify(measurements, null, 2),
  531 |       contentType: 'application/json',
  532 |     })
  533 |   } finally {
  534 |     await stop(application)
  535 |   }
  536 | })
  537 | 
```