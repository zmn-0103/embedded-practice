# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: restore-window.spec.ts >> 全新目录从完整预览副本恢复全部业务数据并真实自动重启，源文件变化不影响确认内容
- Location: tests\e2e\restore-window.spec.ts:223:5

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 0
+ Received  + 4

@@ -1,9 +1,11 @@
  Object {
    "ok": true,
    "value": Array [
      Object {
+       "lastUsedAt": null,
+       "matchingCount": 1,
        "name": "恢复后的分类随机方案",
        "options": Object {
          "category": Object {
            "categoryId": "e568bb8c-92c2-464d-9db4-9d102246866f",
            "kind": "category",
@@ -17,9 +19,11 @@
            "tag": "历史样本",
          },
          "mode": "random",
          "topicId": "history-a",
        },
+       "personalTagMissing": false,
+       "pinned": false,
        "planId": "9105a100-17d2-4794-a0e2-c5efea9fbaff",
      },
    ],
  }
```

# Test source

```ts
  267 |       await source.page.getByRole('button', { name: '开始练习', exact: true }).click()
  268 |       await source.page
  269 |         .getByRole('textbox', { name: '我的答案', exact: true })
  270 |         .fill('恢复第一题\nint a = 1;')
  271 |       await source.page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  272 |       await source.page.getByRole('button', { name: '掌握', exact: true }).click()
  273 |       await expect(source.page.getByLabel('练习进度')).toContainText('第 2 / 2')
  274 |       await source.page
  275 |         .getByRole('textbox', { name: '我的答案', exact: true })
  276 |         .fill('恢复未揭晓草稿\nint keep = 2;')
  277 |       await source.page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
  278 |       await categoryChange(source.page, {
  279 |         kind: 'rename',
  280 |         categoryId,
  281 |         title: '恢复板块新名称',
  282 |       })
  283 |       await writeFile(source.file, historyBank(true, false, true))
  284 |       await writeFile(join(source.folder, 'assets/history.png'), alternatePng)
  285 |       await writeFile(
  286 |         join(source.folder, '异专题.md'),
  287 |         historyBank(true, false, false, 'history-b'),
  288 |       )
  289 |       await importHistoryFiles(source.application, source.page, [
  290 |         source.file,
  291 |         join(source.folder, '异专题.md'),
  292 |       ])
  293 |       await source.page.evaluate(async () => {
  294 |         const api = (globalThis as unknown as { desktop: DesktopApi }).desktop
  295 |         if (
  296 |           !(
  297 |             await api.library.setFavorite({
  298 |               topicId: 'history-a',
  299 |               questionId: 'q-2',
  300 |               favorite: true,
  301 |             })
  302 |           ).ok
  303 |         )
  304 |           throw new Error('收藏失败')
  305 |         if (!(await api.settings.save({ theme: 'dark', palette: 'ocean', fontSize: 22 })).ok)
  306 |           throw new Error('显示保存失败')
  307 |       })
  308 |       const expected = withHistoryDatabase(testDataDirectory, records)
  309 |       const exported = await exportBackup(source.application, source.page, path)
  310 |       expect(exported.summary.categories).toBe(2)
  311 |       expect(exported.summary.practicePlans).toBe(1)
  312 |       expect(saved(path)).toEqual(expected)
  313 |       await stop(source.application)
  314 |       const targetDirectory = join(root, '全新 数据目录')
  315 |       await mkdir(targetDirectory)
  316 |       target = await launchApplication(targetDirectory, info.project.name, '备份恢复')
  317 |       const empty = saved(join(targetDirectory, 'practice.sqlite3'))
  318 |       await choose(target.application, path)
  319 |       await target.page.getByRole('button', { name: '选择备份并预览', exact: true }).click()
  320 |       await expect(target.page.getByLabel('恢复预览摘要', { exact: true })).toBeVisible()
  321 |       await expect(
  322 |         target.page.getByRole('button', { name: '恢复此备份…', exact: true }),
  323 |       ).toBeEnabled()
  324 |       const server = createServer()
  325 |       await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
  326 |       const address = server.address()
  327 |       if (!address || typeof address === 'string') throw new Error('未分配调试端口')
  328 |       await new Promise<void>((done) => server.close(() => done()))
  329 |       await choose(target.application, path, true, address.port)
  330 |       await writeFile(path, '预览后源文件被其他程序替换；恢复须使用暂存副本')
  331 |       const exited = target.application.waitForEvent('close')
  332 |       await target.page.getByRole('button', { name: '恢复此备份…', exact: true }).click()
  333 |       await exited
  334 |       await info.attach('restart-request.json', {
  335 |         body: JSON.stringify({
  336 |           targetDirectory,
  337 |           request: JSON.parse(await readFile(join(targetDirectory, 'test-relaunch.json'), 'utf8')),
  338 |           port: address.port,
  339 |         }),
  340 |         contentType: 'application/json',
  341 |       })
  342 |       await expect
  343 |         .poll(
  344 |           async () => {
  345 |             try {
  346 |               restarted = await chromium.connectOverCDP(`http://127.0.0.1:${address.port}`, {
  347 |                 timeout: 1000,
  348 |               })
  349 |               return true
  350 |             } catch {
  351 |               return false
  352 |             }
  353 |           },
  354 |           { timeout: 15_000 },
  355 |         )
  356 |         .toBe(true)
  357 |       const newPage = restarted!
  358 |         .contexts()[0]!
  359 |         .pages()
  360 |         .find((p) => p.url().includes('index.html'))!
  361 |       await expect(newPage.locator('.brand-mark')).toBeVisible()
  362 |       expect(saved(join(targetDirectory, 'practice.sqlite3'))).toEqual(expected)
  363 |       expect(
  364 |         await newPage.evaluate(() =>
  365 |           (globalThis as unknown as { desktop: DesktopApi }).desktop.practicePlans.list(),
  366 |         ),
> 367 |       ).toEqual({ ok: true, value: [savedPlan] })
      |         ^ Error: expect(received).toEqual(expected) // deep equality
  368 |       expect((await categoryList(newPage)).categories).toEqual(
  369 |         expect.arrayContaining([
  370 |           { categoryId, title: '恢复板块新名称' },
  371 |           { categoryId: otherCategoryId, title: '另一恢复板块' },
  372 |         ]),
  373 |       )
  374 |       expect(
  375 |         await newPage.evaluate(() =>
  376 |           (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({
  377 |             sessionId: null,
  378 |           }),
  379 |         ),
  380 |       ).toMatchObject({
  381 |         ok: true,
  382 |         value: { session: { category: { kind: 'category', categoryId, title: '恢复时的板块' } } },
  383 |       })
  384 |       const protections = (await readdir(join(targetDirectory, 'backups'))).filter((name) =>
  385 |         name.startsWith('before-restore-'),
  386 |       )
  387 |       expect(protections).toHaveLength(1)
  388 |       expect(saved(join(targetDirectory, 'backups', protections[0]!))).toEqual(empty)
  389 |       expect(await readdir(targetDirectory)).not.toContain('restore-transaction')
  390 |       await expect(newPage.locator('html')).toHaveAttribute('data-theme', 'dark')
  391 |       await expect(newPage.locator('html')).toHaveAttribute('data-palette', 'ocean')
  392 |       await expect(newPage.locator('html')).toHaveAttribute('data-font-size', '22')
  393 |       await openPage(newPage, '开始练习')
  394 |       await newPage.getByRole('button', { name: '继续练习', exact: true }).click()
  395 |       await expect(newPage.getByLabel('练习进度')).toHaveText('第 2 / 2 题 · 随机练习')
  396 |       await expect(newPage.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  397 |         '恢复未揭晓草稿\nint keep = 2;',
  398 |       )
  399 |       await expect(newPage.locator('body')).not.toContainText('HISTORY-ANSWER')
  400 |       const restartArgs = JSON.parse(
  401 |         await readFile(join(targetDirectory, 'test-relaunch.json'), 'utf8'),
  402 |       )
  403 |       expect(
  404 |         restartArgs.args.every((arg: string) => !/^--(?:inspect|remote-debugging)/.test(arg)),
  405 |       ).toBe(true)
  406 |       await info.attach('restored-business-and-protection.json', {
  407 |         body: JSON.stringify({ expected, protections, restartArgs }),
  408 |         contentType: 'application/json',
  409 |       })
  410 |       await info.attach('restored-desktop.png', {
  411 |         body: await newPage.screenshot(),
  412 |         contentType: 'image/png',
  413 |       })
  414 |       await newPage.close()
  415 |       await restarted!.close()
  416 |       restarted = undefined
  417 |     } finally {
  418 |       if (restarted) {
  419 |         for (const page of restarted.contexts().flatMap((context) => context.pages()))
  420 |           await page.close().catch(() => {})
  421 |         await restarted.close().catch(() => {})
  422 |       }
  423 |       if (target) await stop(target.application)
  424 |       await stop(source.application)
  425 |     }
  426 |   })
  427 | })
  428 | 
  429 | for (const kind of ['protect', 'save', 'tampered', 'cancel'] as const) {
  430 |   test(`恢复准备 ${kind} 时不替换原库，窗口仍可继续保存`, async ({ testDataDirectory }, info) => {
  431 |     await temporary(async (root) => {
  432 |       const { application, page } = await prepareHistory(testDataDirectory, info.project.name, 1)
  433 |       try {
  434 |         const path = join(root, '准备 失败.sqlite3')
  435 |         await exportBackup(application, page, path)
  436 |         const selected = await preview(application, page, path)
  437 |         const before = withHistoryDatabase(testDataDirectory, records)
  438 |         if (kind === 'cancel') await choose(application, path, false)
  439 |         else if (kind === 'tampered') {
  440 |           const [folder] = await readdir(join(testDataDirectory, 'backup-staging'))
  441 |           await writeFile(
  442 |             join(testDataDirectory, 'backup-staging', folder!, 'backup.sqlite3'),
  443 |             '坏副本',
  444 |           )
  445 |         } else await fault(application, kind)
  446 |         const result = await restore(page, selected.token)
  447 |         expect(result).toMatchObject({
  448 |           ok: false,
  449 |           error: {
  450 |             code: {
  451 |               protect: 'RESTORE_FAILED',
  452 |               save: 'SAVE_FAILED',
  453 |               tampered: 'PREVIEW_EXPIRED',
  454 |               cancel: 'CANCELLED',
  455 |             }[kind],
  456 |           },
  457 |         })
  458 |         expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
  459 |         expect(await readdir(testDataDirectory)).not.toContain('restore-transaction')
  460 |         expect(await readdir(testDataDirectory)).not.toContain('test-relaunch.json')
  461 |         const backups = await readdir(join(testDataDirectory, 'backups')).catch(() => [])
  462 |         expect(backups.filter((name) => name.startsWith('before-restore-'))).toEqual([])
  463 |         await openPage(page, '开始练习')
  464 |         await page.getByLabel('练习专题', { exact: true }).selectOption('history-a')
  465 |         await page.getByRole('button', { name: '开始练习', exact: true }).click()
  466 |         await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toBeEditable()
  467 |         await page.getByRole('textbox', { name: '我的答案', exact: true }).fill('失败后仍可保存')
```