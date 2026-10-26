# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: restore-window.spec.ts >> 恢复准备 tampered 时不替换原库，窗口仍可继续保存
- Location: tests\e2e\restore-window.spec.ts:430:7

# Error details

```
Error: expect(received).toHaveLength(expected)

Expected length: 1
Received length: 0
Received array:  []
```

# Test source

```ts
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
  468 |         await expect(page.locator('.practice-save')).toBeVisible()
  469 |         expect(
  470 |           withHistoryDatabase(testDataDirectory, (db) =>
  471 |             db.prepare("SELECT draft FROM practice_items WHERE draft='失败后仍可保存'").all(),
  472 |           ),
> 473 |         ).toHaveLength(1)
      |           ^ Error: expect(received).toHaveLength(expected)
  474 |         await info.attach('preparation-failure.json', {
  475 |           body: JSON.stringify({ kind, result }),
  476 |           contentType: 'application/json',
  477 |         })
  478 |       } finally {
  479 |         await stop(application)
  480 |       }
  481 |     })
  482 |   })
  483 | }
  484 | 
  485 | for (const kind of [
  486 |   'publish',
  487 |   'close',
  488 |   'rollback',
  489 |   'crash-moved',
  490 |   'crash-installed',
  491 |   'crash-committed',
  492 | ] as const) {
  493 |   test(`恢复 ${kind} 后独立进程保留可恢复数据且不创建空库`, async ({ testDataDirectory }, info) => {
  494 |     await temporary(async (root) => {
  495 |       const { application, page } = await prepareHistory(testDataDirectory, info.project.name, 1)
  496 |       let reopened: ElectronApplication | undefined
  497 |       try {
  498 |         const path = join(root, '恢复故障.sqlite3')
  499 |         await exportBackup(application, page, path)
  500 |         const restored = saved(path)
  501 |         const changed = await page.evaluate(() =>
  502 |           (globalThis as unknown as { desktop: DesktopApi }).desktop.settings.save({
  503 |             theme: 'dark',
  504 |             palette: 'forest',
  505 |             fontSize: 21,
  506 |           }),
  507 |         )
  508 |         expect(changed.ok).toBe(true)
  509 |         const before = withHistoryDatabase(testDataDirectory, records)
  510 |         const selected = await preview(application, page, path)
  511 |         await fault(application, kind)
  512 |         const exited = application.waitForEvent('close')
  513 |         const result = await restore(page, selected.token).catch(() => null)
  514 |         await exited
  515 |         if (kind === 'publish' || kind === 'close')
  516 |           expect(result).toMatchObject({ ok: false, error: { code: 'RESTORE_FAILED' } })
  517 |         if (kind === 'rollback')
  518 |           expect(result).toMatchObject({ ok: false, error: { code: 'RECOVERY_FAILED' } })
  519 |         if (kind.startsWith('crash'))
  520 |           expect(await readdir(testDataDirectory)).toContain('restore-transaction')
  521 |         const protections = (await readdir(join(testDataDirectory, 'backups'))).filter((name) =>
  522 |           name.startsWith('before-restore-'),
  523 |         )
  524 |         expect(protections).toHaveLength(1)
  525 |         expect(saved(join(testDataDirectory, 'backups', protections[0]!))).toEqual(before)
  526 |         const launched = await launchApplication(testDataDirectory, info.project.name)
  527 |         reopened = launched.application
  528 |         expect(withHistoryDatabase(testDataDirectory, records)).toEqual(
  529 |           kind === 'crash-committed' ? restored : before,
  530 |         )
  531 |         expect(await readdir(testDataDirectory)).not.toContain('restore-transaction')
  532 |         await expect(launched.page.getByLabel('练习专题', { exact: true })).toContainText(
  533 |           '历史专题 A',
  534 |         )
  535 |         await info.attach('replacement-failure.json', {
  536 |           body: JSON.stringify({
  537 |             kind,
  538 |             result,
  539 |             protections,
  540 |             recovered: withHistoryDatabase(testDataDirectory, records),
  541 |           }),
  542 |           contentType: 'application/json',
  543 |         })
  544 |       } finally {
  545 |         if (reopened) await stop(reopened)
  546 |         await stop(application)
  547 |       }
  548 |     })
  549 |   })
  550 | }
  551 | 
  552 | test('恢复文件事务保留并回退全部数据库伴随文件，未知事务现场不清理', async ({
  553 |   testDataDirectory,
  554 | }, info) => {
  555 |   await temporary(async (root) => {
  556 |     const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  557 |     try {
  558 |       const path = join(root, '独立.sqlite3')
  559 |       await exportBackup(application, page, path)
  560 |       const target = join(root, '事务测试')
  561 |       await mkdir(target)
  562 |       await copyFile(path, join(target, 'practice.sqlite3'))
  563 |       for (const suffix of ['-wal', '-shm', '-journal'])
  564 |         await writeFile(join(target, 'practice.sqlite3' + suffix), `synthetic-companion${suffix}`)
  565 |       const before = await Promise.all(
  566 |         ['', '-wal', '-shm', '-journal'].map((suffix) =>
  567 |           readFile(join(target, 'practice.sqlite3' + suffix)),
  568 |         ),
  569 |       )
  570 |       const result = await application.evaluate(
  571 |         async ({ app }, input) => {
  572 |           const p = process.getBuiltinModule('node:path'),
  573 |             fs = process.getBuiltinModule('node:fs/promises')
```