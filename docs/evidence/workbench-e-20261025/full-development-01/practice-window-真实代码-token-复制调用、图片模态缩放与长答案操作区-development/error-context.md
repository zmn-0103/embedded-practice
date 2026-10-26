# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: practice-window.spec.ts >> 真实代码 token/复制调用、图片模态缩放与长答案操作区
- Location: tests\e2e\practice-window.spec.ts:379:5

# Error details

```
Error: expect(locator).toBeInViewport() failed

Locator:  getByRole('button', { name: '掌握', exact: true })
Expected: in viewport
Received: viewport ratio 0
Timeout:  10000ms

Call log:
  - Expect "toBeInViewport" getByRole('button', { name: '掌握', exact: true }) with timeout 10000ms
  - waiting for getByRole('button', { name: '掌握', exact: true })
    5 × locator resolved to <button disabled type="button" data-rating="掌握">掌握</button>
      - unexpected value "viewport ratio 0"
    19 × locator resolved to <button type="button" data-rating="掌握">掌握</button>
       - unexpected value "viewport ratio 0"

```

```yaml
- button "掌握"
```

# Test source

```ts
  317 |       testDataDirectory,
  318 |       `CREATE TRIGGER fail_discard_draft BEFORE UPDATE OF draft ON practice_items BEGIN SELECT RAISE(ABORT, '主动注入明确放弃场景'); END`,
  319 |     )
  320 |     await input.fill('用户明确放弃的未保存内容')
  321 |     await closeWindow(application)
  322 |     expect(stored(testDataDirectory).items[0]?.draft).toBe('已确认保存')
  323 |   } finally {
  324 |     await stop(application)
  325 |   }
  326 | })
  327 | 
  328 | test('窗口提交后响应丢失，重试原请求不再次推进', async ({ testDataDirectory }, info) => {
  329 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  330 |   try {
  331 |     await begin(page)
  332 |     await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  333 |     await expect(page.getByRole('region', { name: '练习参考答案' })).toBeVisible()
  334 |     await application.evaluate(async ({ app, ipcMain }) => {
  335 |       const path = process.getBuiltinModule('node:path'),
  336 |         fs = process.getBuiltinModule('node:fs')
  337 |       const load = process
  338 |         .getBuiltinModule('node:module')
  339 |         .createRequire(path.join(app.getAppPath(), 'window-fault.cjs'))
  340 |       const entry = [
  341 |         path.join(app.getAppPath(), 'out/main/practice.js'),
  342 |         path.join(app.getAppPath(), 'practice.js'),
  343 |       ].find((file) => fs.existsSync(file))
  344 |       if (!entry) throw new Error('缺少实际练习构建')
  345 |       const built = load(entry) as typeof import('../../src/main/services/practice/practice')
  346 |       const service: PracticeService = await built.openPracticeService(
  347 |         path.join(app.getPath('userData'), 'practice.sqlite3'),
  348 |         () => {},
  349 |       )
  350 |       app.once('will-quit', () => service.close())
  351 |       let lost = true
  352 |       ipcMain.removeHandler('practice:rate-and-advance')
  353 |       ipcMain.handle('practice:rate-and-advance', (_event, input: unknown) => {
  354 |         const result = service.rateAndAdvance(input)
  355 |         if (lost) {
  356 |           lost = false
  357 |           throw new Error('主动注入提交后响应丢失')
  358 |         }
  359 |         return result
  360 |       })
  361 |     })
  362 |     await page.getByRole('button', { name: '掌握', exact: true }).click()
  363 |     await expect(page.getByRole('button', { name: '重试原操作' })).toBeVisible()
  364 |     expect(stored(testDataDirectory).sessions[0]?.position).toBe(1)
  365 |     await page.getByRole('button', { name: '重试原操作' }).click()
  366 |     await expect(page.getByLabel('练习进度')).toContainText('第 2 / 3')
  367 |     const result = stored(testDataDirectory)
  368 |     expect(result.sessions[0]?.position).toBe(1)
  369 |     expect(result.items.filter((item) => item.rating !== null)).toHaveLength(1)
  370 |     await info.attach('practice-window-retry.json', {
  371 |       body: JSON.stringify(result),
  372 |       contentType: 'application/json',
  373 |     })
  374 |   } finally {
  375 |     await stop(application)
  376 |   }
  377 | })
  378 | 
  379 | test('真实代码 token/复制调用、图片模态缩放与长答案操作区', async ({ testDataDirectory }, info) => {
  380 |   const { application, page, code } = await prepare(testDataDirectory, info.project.name, {
  381 |     longAnswer: true,
  382 |   })
  383 |   try {
  384 |     await begin(page)
  385 |     const firstCode = page.locator('.practice-reading .code-block').first()
  386 |     await expect(firstCode.locator('.hljs-type, .hljs-keyword').first()).toBeVisible()
  387 |     await expect(firstCode.locator('code')).toHaveText(code)
  388 |     await expect(page.locator('code.language-cpp .hljs-keyword').first()).toHaveText('class')
  389 |     await expect(page.locator('code.language-arm .hljs-keyword').first()).toHaveText('MOV')
  390 |     await expect(page.locator('code.language-unknown-language')).toHaveText('保持原样 <tag>\n')
  391 |     await expect(page.locator('code.language-unknown-language span')).toHaveCount(0)
  392 |     expect(await page.evaluate(() => Reflect.get(globalThis, 'practiceEvil'))).toBeUndefined()
  393 |     await application.evaluate(({ clipboard }) => {
  394 |       clipboard.writeText = (text) => {
  395 |         Reflect.set(globalThis, 'copiedPracticeCode', text)
  396 |       }
  397 |     })
  398 |     await firstCode.getByRole('button', { name: '复制代码', exact: true }).click()
  399 |     await expect(firstCode.getByText('已复制', { exact: true })).toBeVisible()
  400 |     expect(await application.evaluate(() => Reflect.get(globalThis, 'copiedPracticeCode'))).toBe(
  401 |       code,
  402 |     )
  403 |     const image = page.getByRole('button', { name: '放大查看：PNG', exact: true })
  404 |     await image.click()
  405 |     const dialog = page.getByRole('dialog', { name: '图片预览：PNG', exact: true })
  406 |     await expect(dialog).toBeVisible()
  407 |     await dialog.getByRole('button', { name: '放大图片', exact: true }).click()
  408 |     await expect(dialog.getByText('150%', { exact: true })).toBeVisible()
  409 |     await expect(dialog.locator('img')).toHaveAttribute('width', '3')
  410 |     await page.screenshot({ path: info.outputPath('practice-image-zoom.png') })
  411 |     await page.keyboard.press('Escape')
  412 |     await expect(dialog).toHaveCount(0)
  413 |     await expect(image).toBeFocused()
  414 |     await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  415 |     await expect(page.getByRole('region', { name: '练习参考答案' })).toContainText('第 60 段长答案')
  416 |     const button = page.getByRole('button', { name: '掌握', exact: true })
> 417 |     await expect(button).toBeInViewport()
      |                          ^ Error: expect(locator).toBeInViewport() failed
  418 |     await page.screenshot({ path: info.outputPath('practice-light.png') })
  419 |     await page.emulateMedia({ colorScheme: 'dark' })
  420 |     await page.screenshot({ path: info.outputPath('practice-dark.png') })
  421 |   } finally {
  422 |     await stop(application)
  423 |   }
  424 | })
  425 | 
  426 | for (const interval of [50, 100, 250]) {
  427 |   test(`快速重复：${interval}ms 双击跳过和上一题只移动一题`, async ({
  428 |     testDataDirectory,
  429 |   }, info) => {
  430 |     const { application, page } = await prepare(testDataDirectory, info.project.name)
  431 |     try {
  432 |       await begin(page)
  433 |       const before = stored(testDataDirectory)
  434 |       const skip = page.getByRole('button', { name: '跳过本题', exact: true })
  435 |       await skip.dblclick({ delay: interval })
  436 |       await expect(page.getByLabel('练习进度')).toHaveText('第 2 / 3 题 · 顺序练习')
  437 |       const afterSkip = stored(testDataDirectory)
  438 |       await info.attach('repeat-skip.json', {
  439 |         body: JSON.stringify({ interval, before, afterSkip }),
  440 |         contentType: 'application/json',
  441 |       })
  442 |       expect(afterSkip.sessions[0]?.position).toBe(1)
  443 |       expect(afterSkip.sessions[0]?.revision).toBe((before.sessions[0]?.revision ?? -1) + 1)
  444 |       expect(afterSkip.items).toHaveLength(3)
  445 |       expect(afterSkip.items.filter((item) => item.skippedAt !== null)).toHaveLength(1)
  446 |       expect(afterSkip.receipts).toHaveLength(before.receipts.length + 1)
  447 |       // 等待按钮恢复后，用户可以明确进行下一次单步操作。
  448 |       await expect(skip).toBeEnabled()
  449 |       await skip.click()
  450 |       await expect(page.getByLabel('练习进度')).toHaveText('第 3 / 3 题 · 顺序练习')
  451 |       const previous = page.getByRole('button', { name: '上一题', exact: true })
  452 |       await expect(previous).toBeEnabled()
  453 |       const beforePrevious = stored(testDataDirectory)
  454 |       await previous.dblclick({ delay: interval })
  455 |       await expect(page.getByLabel('练习进度')).toHaveText('第 2 / 3 题 · 顺序练习')
  456 |       const afterPrevious = stored(testDataDirectory)
  457 |       expect(afterPrevious.sessions[0]?.position).toBe(1)
  458 |       expect(afterPrevious.sessions[0]?.revision).toBe(
  459 |         (beforePrevious.sessions[0]?.revision ?? -1) + 1,
  460 |       )
  461 |       expect(afterPrevious.items).toEqual(beforePrevious.items)
  462 |       expect(afterPrevious.receipts).toHaveLength(beforePrevious.receipts.length + 1)
  463 |       expect(afterPrevious.foreignKeys).toEqual([])
  464 |       await info.attach('repeat-previous.json', {
  465 |         body: JSON.stringify({ interval, beforePrevious, afterPrevious }),
  466 |         contentType: 'application/json',
  467 |       })
  468 |     } finally {
  469 |       await stop(application)
  470 |     }
  471 |   })
  472 | }
  473 | 
  474 | for (const key of ['Enter', 'Space']) {
  475 |   test(`快速重复：100ms 两次 ${key} 激活跳过只移动一题`, async ({ testDataDirectory }, info) => {
  476 |     const { application, page } = await prepare(testDataDirectory, info.project.name)
  477 |     try {
  478 |       await begin(page)
  479 |       const before = stored(testDataDirectory)
  480 |       const skip = page.getByRole('button', { name: '跳过本题', exact: true })
  481 |       await skip.focus()
  482 |       await page.keyboard.press(key)
  483 |       // 真实按键间隔用于复现前次请求已完成后再次激活的窗口。
  484 |       await page.waitForTimeout(100)
  485 |       await page.keyboard.press(key)
  486 |       await expect(page.getByLabel('练习进度')).toHaveText('第 2 / 3 题 · 顺序练习')
  487 |       const result = stored(testDataDirectory)
  488 |       expect(result.sessions[0]?.position).toBe(1)
  489 |       expect(result.items.filter((item) => item.skippedAt !== null)).toHaveLength(1)
  490 |       expect(result.receipts).toHaveLength(before.receipts.length + 1)
  491 |       await expect(skip).toBeEnabled()
  492 |       await skip.focus()
  493 |       await page.keyboard.press(key)
  494 |       await expect(page.getByLabel('练习进度')).toHaveText('第 3 / 3 题 · 顺序练习')
  495 |       await info.attach('repeat-keyboard.json', {
  496 |         body: JSON.stringify({ key, before, result, deliberateNext: stored(testDataDirectory) }),
  497 |         contentType: 'application/json',
  498 |       })
  499 |     } finally {
  500 |       await stop(application)
  501 |     }
  502 |   })
  503 | }
  504 | 
  505 | test('快速重复：持续按住 Enter 不会在操作恢复后再次跳过', async ({ testDataDirectory }, info) => {
  506 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  507 |   try {
  508 |     await begin(page)
  509 |     const before = stored(testDataDirectory)
  510 |     const skip = page.getByRole('button', { name: '跳过本题', exact: true })
  511 |     await skip.focus()
  512 |     await page.keyboard.down('Enter')
  513 |     await expect(page.getByLabel('练习进度')).toHaveText('第 2 / 3 题 · 顺序练习')
  514 |     await expect(skip).toBeEnabled()
  515 |     await skip.focus()
  516 |     // 第二次 down 沿用同一次按住状态，浏览器会标记为 repeat。
  517 |     await page.keyboard.down('Enter')
```