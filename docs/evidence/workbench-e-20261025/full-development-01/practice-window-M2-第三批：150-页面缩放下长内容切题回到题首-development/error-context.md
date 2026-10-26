# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: practice-window.spec.ts >> M2 第三批：150% 页面缩放下长内容切题回到题首
- Location: tests\e2e\practice-window.spec.ts:568:7

# Error details

```
Error: expect(locator).toBeInViewport() failed

Locator:  getByRole('button', { name: '跳过本题', exact: true })
Expected: in viewport
Received: viewport ratio 0
Timeout:  10000ms

Call log:
  - Expect "toBeInViewport" getByRole('button', { name: '跳过本题', exact: true }) with timeout 10000ms
  - waiting for getByRole('button', { name: '跳过本题', exact: true })
    5 × locator resolved to <button disabled type="button">跳过本题</button>
      - unexpected value "viewport ratio 0"
    19 × locator resolved to <button type="button">跳过本题</button>
       - unexpected value "viewport ratio 0"

```

```yaml
- button "跳过本题"
```

# Test source

```ts
  509 |     const before = stored(testDataDirectory)
  510 |     const skip = page.getByRole('button', { name: '跳过本题', exact: true })
  511 |     await skip.focus()
  512 |     await page.keyboard.down('Enter')
  513 |     await expect(page.getByLabel('练习进度')).toHaveText('第 2 / 3 题 · 顺序练习')
  514 |     await expect(skip).toBeEnabled()
  515 |     await skip.focus()
  516 |     // 第二次 down 沿用同一次按住状态，浏览器会标记为 repeat。
  517 |     await page.keyboard.down('Enter')
  518 |     await page.keyboard.up('Enter')
  519 |     await expect(page.getByLabel('练习进度')).toHaveText('第 2 / 3 题 · 顺序练习')
  520 |     const result = stored(testDataDirectory)
  521 |     expect(result.sessions[0]?.position).toBe(1)
  522 |     expect(result.receipts).toHaveLength(before.receipts.length + 1)
  523 |     await info.attach('repeat-held-key.json', {
  524 |       body: JSON.stringify({ before, result }),
  525 |       contentType: 'application/json',
  526 |     })
  527 |   } finally {
  528 |     await stop(application)
  529 |   }
  530 | })
  531 | 
  532 | test('图片自动保存：放大窗口与缩放状态在草稿保存后保留', async ({ testDataDirectory }, info) => {
  533 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  534 |   try {
  535 |     await begin(page)
  536 |     const input = page.getByRole('textbox', { name: '我的答案', exact: true })
  537 |     const image = page.getByRole('button', { name: '放大查看：PNG', exact: true })
  538 |     await input.fill('图片打开期间自动保存的草稿')
  539 |     await image.click()
  540 |     const dialog = page.getByRole('dialog', { name: '图片预览：PNG', exact: true })
  541 |     await expect(dialog).toBeVisible()
  542 |     await expect(page.locator('.practice-save')).toHaveText('待保存')
  543 |     await dialog.getByRole('button', { name: '放大图片', exact: true }).click()
  544 |     await expect(dialog.getByText('150%', { exact: true })).toBeVisible()
  545 |     await expect(page.locator('.practice-save')).toHaveText('已保存')
  546 |     expect(stored(testDataDirectory).items[0]?.draft).toBe('图片打开期间自动保存的草稿')
  547 |     await expect(dialog).toBeVisible()
  548 |     await expect(dialog.getByText('150%', { exact: true })).toBeVisible()
  549 |     await expect(dialog.locator('img')).toHaveAttribute('width', '3')
  550 |     await page.screenshot({ path: info.outputPath('image-after-autosave.png') })
  551 |     await page.keyboard.press('Escape')
  552 |     await expect(dialog).toHaveCount(0)
  553 |     await expect(image).toBeFocused()
  554 |     await image.click()
  555 |     await expect(dialog.getByText('100%', { exact: true })).toBeVisible()
  556 |     await dialog.getByRole('button', { name: '关闭图片', exact: true }).click()
  557 |     await expect(dialog).toHaveCount(0)
  558 |     await info.attach('image-autosave.json', {
  559 |       body: JSON.stringify(stored(testDataDirectory)),
  560 |       contentType: 'application/json',
  561 |     })
  562 |   } finally {
  563 |     await stop(application)
  564 |   }
  565 | })
  566 | 
  567 | for (const zoomFactor of [1, 1.25, 1.5]) {
  568 |   test(`M2 第三批：${zoomFactor * 100}% 页面缩放下长内容切题回到题首`, async ({
  569 |     testDataDirectory,
  570 |   }, info) => {
  571 |     const { application, page } = await prepare(testDataDirectory, info.project.name, {
  572 |       longAnswer: true,
  573 |       longQuestions: true,
  574 |     })
  575 |     try {
  576 |       await application.evaluate(({ BrowserWindow }, factor) => {
  577 |         BrowserWindow.getAllWindows()[0]?.webContents.setZoomFactor(factor)
  578 |       }, zoomFactor)
  579 |       await begin(page)
  580 |       const input = page.getByRole('textbox', { name: '我的答案', exact: true })
  581 |       await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  582 |       await input.fill('长答案阅读时自动保存，不抢焦点和阅读位置')
  583 |       await page
  584 |         .getByText('第 60 段长答案，用来核对操作按钮在长内容下仍可见。', { exact: true })
  585 |         .scrollIntoViewIfNeeded()
  586 |       const beforeSaveScroll = await page.evaluate(() => Number(Reflect.get(globalThis, 'scrollY')))
  587 |       expect(beforeSaveScroll).toBeGreaterThan(1000)
  588 |       await expect(page.locator('.practice-save')).toHaveText('已保存')
  589 |       expect(await page.evaluate(() => Number(Reflect.get(globalThis, 'scrollY')))).toBe(
  590 |         beforeSaveScroll,
  591 |       )
  592 |       await expect(input).toBeFocused()
  593 |       await page.getByRole('button', { name: '掌握', exact: true }).click()
  594 |       await expect(page.getByLabel('练习进度')).toHaveText('第 2 / 3 题 · 顺序练习')
  595 |       const secondTitle = page.getByRole('heading', { name: '窗口练习 2', exact: true })
  596 |       const afterAdvance = {
  597 |         zoomFactor,
  598 |         scrollY: await page.evaluate(() => Number(Reflect.get(globalThis, 'scrollY'))),
  599 |         titleBox: await secondTitle.boundingBox(),
  600 |         stored: stored(testDataDirectory),
  601 |       }
  602 |       await info.attach('long-content-advance.json', {
  603 |         body: JSON.stringify(afterAdvance),
  604 |         contentType: 'application/json',
  605 |       })
  606 |       await expect(secondTitle).toBeInViewport({ ratio: 1 })
  607 |       await expect(secondTitle).toBeFocused()
  608 |       await expect(page.getByLabel('练习进度')).toBeInViewport({ ratio: 1 })
> 609 |       await expect(page.getByRole('button', { name: '跳过本题', exact: true })).toBeInViewport()
      |                                                                             ^ Error: expect(locator).toBeInViewport() failed
  610 |       // 页面缩放时浏览器截图可能按 CSS 尺寸裁切；从 Electron 捕获完整可视区域。
  611 |       const screenshot = await application.evaluate(async ({ BrowserWindow }) => {
  612 |         const window = BrowserWindow.getAllWindows()[0]
  613 |         if (!window) throw new Error('测试窗口已经关闭。')
  614 |         return (await window.webContents.capturePage()).toPNG().toString('base64')
  615 |       })
  616 |       await writeFile(info.outputPath('long-content-next.png'), Buffer.from(screenshot, 'base64'))
  617 |       await page
  618 |         .getByText('第 2 题第 60 段长题干，核对切题时阅读入口与操作位置。', { exact: true })
  619 |         .scrollIntoViewIfNeeded()
  620 |       await page.getByRole('button', { name: '上一题', exact: true }).click()
  621 |       const firstTitle = page.getByRole('heading', { name: '窗口练习 1', exact: true })
  622 |       await expect(firstTitle).toBeInViewport({ ratio: 1 })
  623 |       await expect(firstTitle).toBeFocused()
  624 |       await expect(input).toHaveValue('长答案阅读时自动保存，不抢焦点和阅读位置')
  625 |       await expect(page.getByRole('region', { name: '练习参考答案' })).toContainText(secret)
  626 |       await page
  627 |         .getByText('第 60 段长答案，用来核对操作按钮在长内容下仍可见。', { exact: true })
  628 |         .scrollIntoViewIfNeeded()
  629 |       await page.getByRole('button', { name: '结束本轮', exact: true }).click()
  630 |       const resultTitle = page.getByRole('heading', { name: '本轮已结束', exact: true })
  631 |       await expect(resultTitle).toBeInViewport({ ratio: 1 })
  632 |       await expect(resultTitle).toBeFocused()
  633 |       expect(stored(testDataDirectory).sessions[0]?.status).toBe('ended')
  634 |     } finally {
  635 |       await stop(application)
  636 |     }
  637 |   })
  638 | }
  639 | 
  640 | test('M2 第三批：长题干末题完成后展示并聚焦结果标题', async ({ testDataDirectory }, info) => {
  641 |   const { application, page } = await prepare(testDataDirectory, info.project.name, {
  642 |     longQuestions: true,
  643 |   })
  644 |   try {
  645 |     await begin(page)
  646 |     const skip = page.getByRole('button', { name: '跳过本题', exact: true })
  647 |     await skip.click()
  648 |     await expect(page.getByLabel('练习进度')).toContainText('第 2 / 3')
  649 |     await skip.click()
  650 |     await expect(page.getByLabel('练习进度')).toContainText('第 3 / 3')
  651 |     await page
  652 |       .getByText('第 3 题第 60 段长题干，核对切题时阅读入口与操作位置。', { exact: true })
  653 |       .scrollIntoViewIfNeeded()
  654 |     await skip.click()
  655 |     const title = page.getByRole('heading', { name: '本轮已完成', exact: true })
  656 |     await expect(title).toBeInViewport({ ratio: 1 })
  657 |     await expect(title).toBeFocused()
  658 |     const result = stored(testDataDirectory)
  659 |     expect(result.sessions[0]).toMatchObject({ status: 'finished', position: 3 })
  660 |     expect(result.items.filter((item) => item.skippedAt !== null)).toHaveLength(3)
  661 |     await info.attach('long-content-finished.json', {
  662 |       body: JSON.stringify(result),
  663 |       contentType: 'application/json',
  664 |     })
  665 |   } finally {
  666 |     await stop(application)
  667 |   }
  668 | })
  669 | 
  670 | test('M2 第三批：强制终止后恢复已确认草稿、原位置与自评', async ({ testDataDirectory }, info) => {
  671 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  672 |   let confirmed: ReturnType<typeof stored>
  673 |   try {
  674 |     await begin(page)
  675 |     const input = page.getByRole('textbox', { name: '我的答案', exact: true })
  676 |     await input.fill('第一题已经确认保存\nint answer = 1;')
  677 |     await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  678 |     await page.getByRole('button', { name: '不熟', exact: true }).click()
  679 |     await expect(page.getByLabel('练习进度')).toHaveText('第 2 / 3 题 · 顺序练习')
  680 |     await input.fill('第二题已经确认保存的草稿')
  681 |     await expect(page.locator('.practice-save')).toHaveText('已保存')
  682 |     confirmed = stored(testDataDirectory)
  683 |     expect(confirmed.sessions[0]?.position).toBe(1)
  684 |     expect(confirmed.items[0]?.rating).toBe('不熟')
  685 |     expect(confirmed.items[1]?.draft).toBe('第二题已经确认保存的草稿')
  686 |     await input.fill('第二题已经确认保存的草稿 + 尚未提交尾部')
  687 |     await expect(page.locator('.practice-save')).toHaveText('待保存')
  688 |     expect(stored(testDataDirectory)).toEqual(confirmed)
  689 |     // Windows 下 process() 可能是启动外壳；校验数据目录后只终止实际 Electron 主进程。
  690 |     const target = await application.evaluate(({ app }) => ({
  691 |       pid: process.pid,
  692 |       directory: app.getPath('userData'),
  693 |     }))
  694 |     if (resolve(target.directory) !== resolve(testDataDirectory))
  695 |       throw new Error('拒绝终止不属于本场景数据目录的进程。')
  696 |     const closed = application.waitForEvent('close')
  697 |     if (!process.kill(target.pid, 'SIGKILL')) throw new Error('未能终止本场景的测试进程。')
  698 |     await closed
  699 |     closedApplications.add(application)
  700 |     expect(stored(testDataDirectory)).toEqual(confirmed)
  701 |     await info.attach('forced-stop-confirmed.json', {
  702 |       body: JSON.stringify({
  703 |         pid: target.pid,
  704 |         confirmed,
  705 |         afterStop: stored(testDataDirectory),
  706 |       }),
  707 |       contentType: 'application/json',
  708 |     })
  709 |   } finally {
```