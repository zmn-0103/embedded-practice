# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: restore-window.spec.ts >> 恢复准备 save 时不替换原库，窗口仍可继续保存
- Location: tests\e2e\restore-window.spec.ts:432:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('已保存', { exact: true })
Expected: visible
Error: strict mode violation: getByText('已保存', { exact: true }) resolved to 2 elements:
    1) <p aria-live="polite" class="practice-input-save">已保存</p> aka getByRole('paragraph').filter({ hasText: '已保存' })
    2) <div aria-live="polite" class="practice-save">已保存</div> aka locator('div').filter({ hasText: /^已保存$/ })

Call log:
  - Expect "toBeVisible" getByText('已保存', { exact: true }) with timeout 10000ms
  - waiting for getByText('已保存', { exact: true })

```

# Test source

```ts
  370 |       expect((await categoryList(newPage)).categories).toEqual(
  371 |         expect.arrayContaining([
  372 |           { categoryId, title: '恢复板块新名称' },
  373 |           { categoryId: otherCategoryId, title: '另一恢复板块' },
  374 |         ]),
  375 |       )
  376 |       expect(
  377 |         await newPage.evaluate(() =>
  378 |           (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({
  379 |             sessionId: null,
  380 |           }),
  381 |         ),
  382 |       ).toMatchObject({
  383 |         ok: true,
  384 |         value: { session: { category: { kind: 'category', categoryId, title: '恢复时的板块' } } },
  385 |       })
  386 |       const protections = (await readdir(join(targetDirectory, 'backups'))).filter((name) =>
  387 |         name.startsWith('before-restore-'),
  388 |       )
  389 |       expect(protections).toHaveLength(1)
  390 |       expect(saved(join(targetDirectory, 'backups', protections[0]!))).toEqual(empty)
  391 |       expect(await readdir(targetDirectory)).not.toContain('restore-transaction')
  392 |       await expect(newPage.locator('html')).toHaveAttribute('data-theme', 'dark')
  393 |       await expect(newPage.locator('html')).toHaveAttribute('data-palette', 'ocean')
  394 |       await expect(newPage.locator('html')).toHaveAttribute('data-font-size', '22')
  395 |       await openPage(newPage, '开始练习')
  396 |       await newPage.getByRole('button', { name: '继续练习', exact: true }).click()
  397 |       await expect(newPage.getByLabel('练习进度')).toHaveText('第 2 / 2 题 · 随机练习')
  398 |       await expect(newPage.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  399 |         '恢复未揭晓草稿\nint keep = 2;',
  400 |       )
  401 |       await expect(newPage.locator('body')).not.toContainText('HISTORY-ANSWER')
  402 |       const restartArgs = JSON.parse(
  403 |         await readFile(join(targetDirectory, 'test-relaunch.json'), 'utf8'),
  404 |       )
  405 |       expect(
  406 |         restartArgs.args.every((arg: string) => !/^--(?:inspect|remote-debugging)/.test(arg)),
  407 |       ).toBe(true)
  408 |       await info.attach('restored-business-and-protection.json', {
  409 |         body: JSON.stringify({ expected, protections, restartArgs }),
  410 |         contentType: 'application/json',
  411 |       })
  412 |       await info.attach('restored-desktop.png', {
  413 |         body: await newPage.screenshot(),
  414 |         contentType: 'image/png',
  415 |       })
  416 |       await newPage.close()
  417 |       await restarted!.close()
  418 |       restarted = undefined
  419 |     } finally {
  420 |       if (restarted) {
  421 |         for (const page of restarted.contexts().flatMap((context) => context.pages()))
  422 |           await page.close().catch(() => {})
  423 |         await restarted.close().catch(() => {})
  424 |       }
  425 |       if (target) await stop(target.application)
  426 |       await stop(source.application)
  427 |     }
  428 |   })
  429 | })
  430 | 
  431 | for (const kind of ['protect', 'save', 'tampered', 'cancel'] as const) {
  432 |   test(`恢复准备 ${kind} 时不替换原库，窗口仍可继续保存`, async ({ testDataDirectory }, info) => {
  433 |     await temporary(async (root) => {
  434 |       const { application, page } = await prepareHistory(testDataDirectory, info.project.name, 1)
  435 |       try {
  436 |         const path = join(root, '准备 失败.sqlite3')
  437 |         await exportBackup(application, page, path)
  438 |         const selected = await preview(application, page, path)
  439 |         const before = withHistoryDatabase(testDataDirectory, records)
  440 |         if (kind === 'cancel') await choose(application, path, false)
  441 |         else if (kind === 'tampered') {
  442 |           const [folder] = await readdir(join(testDataDirectory, 'backup-staging'))
  443 |           await writeFile(
  444 |             join(testDataDirectory, 'backup-staging', folder!, 'backup.sqlite3'),
  445 |             '坏副本',
  446 |           )
  447 |         } else await fault(application, kind)
  448 |         const result = await restore(page, selected.token)
  449 |         expect(result).toMatchObject({
  450 |           ok: false,
  451 |           error: {
  452 |             code: {
  453 |               protect: 'RESTORE_FAILED',
  454 |               save: 'SAVE_FAILED',
  455 |               tampered: 'PREVIEW_EXPIRED',
  456 |               cancel: 'CANCELLED',
  457 |             }[kind],
  458 |           },
  459 |         })
  460 |         expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
  461 |         expect(await readdir(testDataDirectory)).not.toContain('restore-transaction')
  462 |         expect(await readdir(testDataDirectory)).not.toContain('test-relaunch.json')
  463 |         const backups = await readdir(join(testDataDirectory, 'backups')).catch(() => [])
  464 |         expect(backups.filter((name) => name.startsWith('before-restore-'))).toEqual([])
  465 |         await openPage(page, '开始练习')
  466 |         await page.getByLabel('练习专题', { exact: true }).selectOption('history-a')
  467 |         await page.getByRole('button', { name: '开始练习', exact: true }).click()
  468 |         await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toBeEditable()
  469 |         await page.getByRole('textbox', { name: '我的答案', exact: true }).fill('失败后仍可保存')
> 470 |         await expect(page.getByText('已保存', { exact: true })).toBeVisible()
      |                                                              ^ Error: expect(locator).toBeVisible() failed
  471 |         expect(
  472 |           withHistoryDatabase(testDataDirectory, (db) =>
  473 |             db.prepare("SELECT draft FROM practice_items WHERE draft='失败后仍可保存'").all(),
  474 |           ),
  475 |         ).toHaveLength(1)
  476 |         await info.attach('preparation-failure.json', {
  477 |           body: JSON.stringify({ kind, result }),
  478 |           contentType: 'application/json',
  479 |         })
  480 |       } finally {
  481 |         await stop(application)
  482 |       }
  483 |     })
  484 |   })
  485 | }
  486 | 
  487 | for (const kind of [
  488 |   'publish',
  489 |   'close',
  490 |   'rollback',
  491 |   'crash-moved',
  492 |   'crash-installed',
  493 |   'crash-committed',
  494 | ] as const) {
  495 |   test(`恢复 ${kind} 后独立进程保留可恢复数据且不创建空库`, async ({ testDataDirectory }, info) => {
  496 |     await temporary(async (root) => {
  497 |       const { application, page } = await prepareHistory(testDataDirectory, info.project.name, 1)
  498 |       let reopened: ElectronApplication | undefined
  499 |       try {
  500 |         const path = join(root, '恢复故障.sqlite3')
  501 |         await exportBackup(application, page, path)
  502 |         const restored = saved(path)
  503 |         const changed = await page.evaluate(() =>
  504 |           (globalThis as unknown as { desktop: DesktopApi }).desktop.settings.save({
  505 |             theme: 'dark',
  506 |             palette: 'forest',
  507 |             fontSize: 21,
  508 |           }),
  509 |         )
  510 |         expect(changed.ok).toBe(true)
  511 |         const before = withHistoryDatabase(testDataDirectory, records)
  512 |         const selected = await preview(application, page, path)
  513 |         await fault(application, kind)
  514 |         const exited = application.waitForEvent('close')
  515 |         const result = await restore(page, selected.token).catch(() => null)
  516 |         await exited
  517 |         if (kind === 'publish' || kind === 'close')
  518 |           expect(result).toMatchObject({ ok: false, error: { code: 'RESTORE_FAILED' } })
  519 |         if (kind === 'rollback')
  520 |           expect(result).toMatchObject({ ok: false, error: { code: 'RECOVERY_FAILED' } })
  521 |         if (kind.startsWith('crash'))
  522 |           expect(await readdir(testDataDirectory)).toContain('restore-transaction')
  523 |         const protections = (await readdir(join(testDataDirectory, 'backups'))).filter((name) =>
  524 |           name.startsWith('before-restore-'),
  525 |         )
  526 |         expect(protections).toHaveLength(1)
  527 |         expect(saved(join(testDataDirectory, 'backups', protections[0]!))).toEqual(before)
  528 |         const launched = await launchApplication(testDataDirectory, info.project.name)
  529 |         reopened = launched.application
  530 |         expect(withHistoryDatabase(testDataDirectory, records)).toEqual(
  531 |           kind === 'crash-committed' ? restored : before,
  532 |         )
  533 |         expect(await readdir(testDataDirectory)).not.toContain('restore-transaction')
  534 |         await expect(launched.page.getByLabel('练习专题', { exact: true })).toContainText(
  535 |           '历史专题 A',
  536 |         )
  537 |         await info.attach('replacement-failure.json', {
  538 |           body: JSON.stringify({
  539 |             kind,
  540 |             result,
  541 |             protections,
  542 |             recovered: withHistoryDatabase(testDataDirectory, records),
  543 |           }),
  544 |           contentType: 'application/json',
  545 |         })
  546 |       } finally {
  547 |         if (reopened) await stop(reopened)
  548 |         await stop(application)
  549 |       }
  550 |     })
  551 |   })
  552 | }
  553 | 
  554 | test('恢复文件事务保留并回退全部数据库伴随文件，未知事务现场不清理', async ({
  555 |   testDataDirectory,
  556 | }, info) => {
  557 |   await temporary(async (root) => {
  558 |     const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  559 |     try {
  560 |       const path = join(root, '独立.sqlite3')
  561 |       await exportBackup(application, page, path)
  562 |       const target = join(root, '事务测试')
  563 |       await mkdir(target)
  564 |       await copyFile(path, join(target, 'practice.sqlite3'))
  565 |       for (const suffix of ['-wal', '-shm', '-journal'])
  566 |         await writeFile(join(target, 'practice.sqlite3' + suffix), `synthetic-companion${suffix}`)
  567 |       const before = await Promise.all(
  568 |         ['', '-wal', '-shm', '-journal'].map((suffix) =>
  569 |           readFile(join(target, 'practice.sqlite3' + suffix)),
  570 |         ),
```