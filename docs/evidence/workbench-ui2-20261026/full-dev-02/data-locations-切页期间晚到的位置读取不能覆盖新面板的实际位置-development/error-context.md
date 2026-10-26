# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: data-locations.spec.ts >> 切页期间晚到的位置读取不能覆盖新面板的实际位置
- Location: tests\e2e\data-locations.spec.ts:384:5

# Error details

```
Error: expect(locator).not.toContainText(expected) failed

Locator: getByLabel('数据位置', { exact: true })
Expected substring: not "STALE"
Error: strict mode violation: getByLabel('数据位置', { exact: true }) resolved to 2 elements:
    1) <div role="tabpanel" id="data-location-section-panel" aria-labelledby="data-location-section-tab">…</div> aka getByRole('tabpanel', { name: '数据位置' })
    2) <section tabindex="-1" aria-label="数据位置" class="data-locations" id="data-location-section">…</section> aka getByRole('region', { name: '数据位置' })

Call log:
  - Expect "not toContainText" getByLabel('数据位置', { exact: true }) with timeout 10000ms
  - waiting for getByLabel('数据位置', { exact: true })

```

# Test source

```ts
  315 |   }
  316 | })
  317 | 
  318 | test('恢复先暂停并等待目录打开，结算后才创建保护备份和替换', async ({
  319 |   testDataDirectory,
  320 | }, info) => {
  321 |   await directory(async (output) => {
  322 |     const { application, page } = await launchApplication(
  323 |       testDataDirectory,
  324 |       info.project.name,
  325 |       '数据位置',
  326 |     )
  327 |     try {
  328 |       const path = join(output, '位置检查 备份.sqlite3')
  329 |       await application.evaluate(({ app, dialog }, path) => {
  330 |         dialog.showSaveDialog = async () => ({ canceled: false, filePath: path })
  331 |         dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
  332 |         dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false })
  333 |         app.relaunch = () => {} // 真正自动重启由既有 M4 场景验证，本项验证新增暂停次序。
  334 |       }, path)
  335 |       expect(
  336 |         (
  337 |           await page.evaluate(() =>
  338 |             (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.export(),
  339 |           )
  340 |         ).ok,
  341 |       ).toBe(true)
  342 |       const preview = await page.evaluate(() =>
  343 |         (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
  344 |       )
  345 |       if (!preview.ok) throw new Error(preview.error.code)
  346 |       await nativeFolders(application, true)
  347 |       const opening = page.evaluate(() =>
  348 |         (globalThis as unknown as { desktop: DesktopApi }).desktop.dataLocations.open('logs'),
  349 |       )
  350 |       void opening.catch(() => {})
  351 |       await expect.poll(() => folderPaths(application)).toHaveLength(1)
  352 |       const exited = application.waitForEvent('close')
  353 |       const restoring = page.evaluate(
  354 |         (token) =>
  355 |           (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.restore({ token }),
  356 |         preview.value.token,
  357 |       )
  358 |       void restoring.catch(() => {})
  359 |       await expect
  360 |         .poll(() => readLocations(page))
  361 |         .toMatchObject({ error: { code: 'SERVICE_CLOSED' } })
  362 |       expect(await readdir(testDataDirectory)).not.toContain('backups')
  363 |       await release(application)
  364 |       expect(await opening).toMatchObject({ error: { code: 'SERVICE_CLOSED' } })
  365 |       const restored = await restoring
  366 |       expect(restored.ok).toBe(true)
  367 |       await exited
  368 |       expect(
  369 |         (await readdir(join(testDataDirectory, 'backups'))).filter((name) =>
  370 |           name.startsWith('before-restore-'),
  371 |         ),
  372 |       ).toHaveLength(1)
  373 |       await info.attach('directory-restore-order.json', {
  374 |         body: JSON.stringify({ restored }),
  375 |         contentType: 'application/json',
  376 |       })
  377 |     } finally {
  378 |       await release(application)
  379 |       await stop(application)
  380 |     }
  381 |   })
  382 | })
  383 | 
  384 | test('切页期间晚到的位置读取不能覆盖新面板的实际位置', async ({ testDataDirectory }, info) => {
  385 |   const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  386 |   try {
  387 |     await application.evaluate(({ ipcMain }) => {
  388 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('data-locations:read')
  389 |       let calls = 0
  390 |       ipcMain.removeHandler('data-locations:read')
  391 |       ipcMain.handle('data-locations:read', (...args) => {
  392 |         if (++calls !== 1) return original(...args)
  393 |         return new Promise((done) =>
  394 |           Reflect.set(globalThis, 'releaseLocationRead', () =>
  395 |             done({
  396 |               ok: true,
  397 |               value: {
  398 |                 dataDirectory: 'C:/STALE',
  399 |                 backupDirectory: 'C:/STALE/backups',
  400 |                 logDirectory: 'C:/STALE/logs',
  401 |                 logFile: 'C:/STALE/logs/application.log',
  402 |               },
  403 |             }),
  404 |           ),
  405 |         )
  406 |       })
  407 |     })
  408 |     await openPage(page, '数据位置')
  409 |     await expect(page.getByText('正在读取数据位置…', { exact: true })).toBeVisible()
  410 |     await openPage(page, '题库')
  411 |     await openPage(page, '数据位置')
  412 |     const panel = page.getByLabel('数据位置', { exact: true })
  413 |     await expect(panel.getByText(testDataDirectory, { exact: true })).toBeVisible()
  414 |     await application.evaluate(() => Reflect.get(globalThis, 'releaseLocationRead')())
> 415 |     await expect(panel).not.toContainText('STALE')
      |                             ^ Error: expect(locator).not.toContainText(expected) failed
  416 |     expect(await readLocations(page)).toEqual({
  417 |       ok: true,
  418 |       value: expectedLocations(testDataDirectory),
  419 |     })
  420 |   } finally {
  421 |     await stop(application)
  422 |   }
  423 | })
  424 | 
  425 | test('Windows 已有 Logs Backups 和 Backup-Staging 目录可正常打开并完成保护恢复', async ({
  426 |   testDataDirectory,
  427 | }, info) => {
  428 |   await directory(async (output) => {
  429 |     for (const folder of ['Logs', 'Backups', 'Backup-Staging'])
  430 |       await mkdir(join(testDataDirectory, folder))
  431 |     const { application, page } = await launchApplication(
  432 |       testDataDirectory,
  433 |       info.project.name,
  434 |       '数据位置',
  435 |     )
  436 |     let reopened: ElectronApplication | undefined
  437 |     try {
  438 |       await nativeFolders(application)
  439 |       for (const target of ['logs', 'backups'] as const)
  440 |         expect(
  441 |           await page.evaluate(
  442 |             (target) =>
  443 |               (globalThis as unknown as { desktop: DesktopApi }).desktop.dataLocations.open(target),
  444 |             target,
  445 |           ),
  446 |         ).toEqual({ ok: true, value: null })
  447 |       expect(await folderPaths(application)).toEqual([
  448 |         join(testDataDirectory, 'Logs'),
  449 |         join(testDataDirectory, 'Backups'),
  450 |       ])
  451 |       const exportedPath = join(output, '已确认快照.sqlite3')
  452 |       await application.evaluate(({ app, dialog }, path) => {
  453 |         dialog.showSaveDialog = async () => ({ canceled: false, filePath: path })
  454 |         dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false })
  455 |         app.relaunch = () => {}
  456 |       }, exportedPath)
  457 |       const exported = await page.evaluate(() =>
  458 |         (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.export(),
  459 |       )
  460 |       expect(exported.ok).toBe(true)
  461 |       // 复制的是已关闭、已校验导出文件，不复制写入中的当前数据库。
  462 |       const selectedPath = join(testDataDirectory, 'Backups', '独立备份.sqlite3')
  463 |       const bytes = await readFile(exportedPath)
  464 |       await writeFile(selectedPath, bytes)
  465 |       const changed = await page.evaluate(() =>
  466 |         (globalThis as unknown as { desktop: DesktopApi }).desktop.settings.save({
  467 |           theme: 'dark',
  468 |           palette: 'forest',
  469 |           fontSize: 21,
  470 |         }),
  471 |       )
  472 |       expect(changed.ok).toBe(true)
  473 |       await application.evaluate(({ dialog }, path) => {
  474 |         dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
  475 |       }, selectedPath)
  476 |       const selected = await page.evaluate(() =>
  477 |         (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
  478 |       )
  479 |       expect(selected.ok).toBe(true)
  480 |       if (!selected.ok) throw new Error(selected.error.code)
  481 |       const exited = application.waitForEvent('close')
  482 |       const restored = await page.evaluate(
  483 |         (token) =>
  484 |           (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.restore({ token }),
  485 |         selected.value.token,
  486 |       )
  487 |       expect(restored.ok).toBe(true)
  488 |       await exited
  489 |       const protections = (await readdir(join(testDataDirectory, 'Backups'))).filter((name) =>
  490 |         name.startsWith('before-restore-'),
  491 |       )
  492 |       expect(protections).toHaveLength(1)
  493 |       expect(await readFile(selectedPath)).toEqual(bytes)
  494 |       const launched = await launchApplication(testDataDirectory, info.project.name, '数据位置')
  495 |       reopened = launched.application
  496 |       await expect(launched.page.getByLabel('显示主题', { exact: true })).toHaveValue('system')
  497 |       await expect(launched.page.getByLabel('正文字号', { exact: true })).toHaveValue('17')
  498 |       await nativeFolders(reopened)
  499 |       expect(
  500 |         await launched.page.evaluate(() =>
  501 |           (globalThis as unknown as { desktop: DesktopApi }).desktop.dataLocations.open('backups'),
  502 |         ),
  503 |       ).toEqual({ ok: true, value: null })
  504 |       expect(await folderPaths(reopened)).toEqual([join(testDataDirectory, 'Backups')])
  505 |       await info.attach('windows-directory-case-restored.json', {
  506 |         body: JSON.stringify({ restored, protections, selectedPath }),
  507 |         contentType: 'application/json',
  508 |       })
  509 |     } finally {
  510 |       if (reopened) await stop(reopened)
  511 |       await stop(application)
  512 |     }
  513 |   })
  514 | })
  515 | 
```