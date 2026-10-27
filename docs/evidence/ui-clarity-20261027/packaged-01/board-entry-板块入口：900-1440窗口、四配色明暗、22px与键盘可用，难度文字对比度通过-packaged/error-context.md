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

Locator:  getByRole('searchbox', { name: '题库搜索', exact: true })
Expected: focused
Received: inactive
Timeout:  10000ms

Call log:
  - Expect "toBeFocused" getByRole('searchbox', { name: '题库搜索', exact: true }) with timeout 10000ms
  - waiting for getByRole('searchbox', { name: '题库搜索', exact: true })
    23 × locator resolved to <input value="" type="search" maxlength="256" aria-label="题库搜索" placeholder="标题、题干或标签"/>
       - unexpected value "inactive"

```

```yaml
- searchbox "题库搜索"
```

# Test source

```ts
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
  485 |         await expect(managementSummary).toBeFocused()
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
> 497 |         await expect(page.getByRole('searchbox', { name: '题库搜索', exact: true })).toBeFocused()
      |                                                                                  ^ Error: expect(locator).toBeFocused() failed
  498 |         const navigationSummary = page.locator(
  499 |           '.library-navigation .topic-navigation-panel > summary',
  500 |         )
  501 |         for (
  502 |           let step = 0;
  503 |           step < 16 &&
  504 |           !(await navigationSummary.evaluate(
  505 |             (element) => element === element.ownerDocument.activeElement,
  506 |           ));
  507 |           step++
  508 |         )
  509 |           await page.keyboard.press('Tab')
  510 |         await expect(navigationSummary).toBeFocused()
  511 |         await navigationSummary.press('Tab')
  512 |         await expect(page.getByLabel('题库专题检索', { exact: true })).toBeFocused()
  513 |         const ratios = await page.evaluate(() => {
  514 |           const browser = globalThis as unknown as {
  515 |             document: { querySelector: (selector: string) => unknown }
  516 |             getComputedStyle: (element: unknown) => { color: string; backgroundColor: string }
  517 |           }
  518 |           const luminance = (rgb: string) =>
  519 |             rgb
  520 |               .match(/[\d.]+/g)!
  521 |               .slice(0, 3)
  522 |               .map(Number)
  523 |               .map((v) => {
  524 |                 const c = v / 255
  525 |                 return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  526 |               })
  527 |               .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i]!, 0)
  528 |           return ['easy', 'medium', 'hard', 'unrated'].map((tone) => {
  529 |             const style = browser.getComputedStyle(
  530 |               browser.document.querySelector(`.question-list .difficulty-${tone}`),
  531 |             )
  532 |             const values = [luminance(style.color), luminance(style.backgroundColor)].sort(
  533 |               (a, b) => b - a,
  534 |             )
  535 |             return { tone, ratio: (values[0]! + 0.05) / (values[1]! + 0.05) }
  536 |           })
  537 |         })
  538 |         for (const { ratio } of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5)
  539 |         measurements.push({ palette, theme, dimensions, ratios })
  540 |         if (palette === '松间绿')
  541 |           await captureHistory(application, page, info, `difficulty-${theme}.png`)
  542 |         expect(historySnapshot(testDataDirectory)).toEqual(before)
  543 |       }
  544 |     }
  545 |     await info.attach('board-appearance-measurements.json', {
  546 |       body: JSON.stringify(measurements, null, 2),
  547 |       contentType: 'application/json',
  548 |     })
  549 |   } finally {
  550 |     await stop(application)
  551 |   }
  552 | })
  553 | 
```