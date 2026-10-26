# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: backup-window.spec.ts >> 恢复预览拒绝 foreign-key，原备份字节及当前数据保持
- Location: tests\e2e\backup-window.spec.ts:402:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByLabel('恢复预览摘要', { exact: true })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByLabel('恢复预览摘要', { exact: true }) with timeout 10000ms
  - waiting for getByLabel('恢复预览摘要', { exact: true })

```

```yaml
- banner:
  - heading "嵌入式刷题本" [level=1]
  - paragraph: 思考有迹，积累有序
  - button "收起导航" [expanded]: ‹
- navigation "主要页面":
  - link "学习总览":
    - /url: "#overview"
  - link "知识板块":
    - /url: "#boards"
  - link "开始练习":
    - /url: "#practice"
  - link "题库":
    - /url: "#library"
  - link "学习记录":
    - /url: "#records"
  - link "设置与数据":
    - /url: "#settings"
- main:
  - text: 学习工作台
  - strong: 设置与数据
  - text: 本地离线
  - group: 外观
  - region "设置与数据":
    - heading "设置与数据" [level=2]
    - navigation "设置分区":
      - tablist "设置分区":
        - tab "外观主题"
        - tab "备份恢复" [selected]
        - tab "数据位置"
    - tabpanel "备份恢复":
      - region "完整备份与恢复预览":
        - heading "备份与恢复" [level=3]
        - paragraph: 完整备份包含题库、历史版本、图片、学习记录、收藏、练习进度、已安装主题及显示布局设置。 备份仅包含已经保存的数据；调整显示后请先保存，再导出。
        - button "导出完整备份"
        - button "选择备份并预览"
        - paragraph: 恢复将替换当前全部数据并重启。请先预览核对；程序会先保存待保存内容并创建当前数据的保护性备份，保护失败时停止恢复。
        - alert: 不能覆盖当前数据库或其伴随文件的别名。
  - status:
    - paragraph: 本地数据已就绪
- contentinfo: 离线使用 · 数据保存在本机 V0.0.1 测试版 · 构建 20261026.1-workbench-e-ui2
```

# Test source

```ts
  371 |       await select(application, 'export', target)
  372 |       expect(await backup(page, 'export')).toMatchObject({
  373 |         ok: false,
  374 |         error: { code: 'FILE_ERROR' },
  375 |       })
  376 |       expect(await readFile(target, 'utf8')).toBe('OLD-TARGET')
  377 |       expect(await readFile(target + '-wal', 'utf8')).toBe('OLD-WAL')
  378 |       expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
  379 |     } finally {
  380 |       await stop(application)
  381 |     }
  382 |   })
  383 | })
  384 | 
  385 | for (const fault of [
  386 |   'corrupt',
  387 |   'foreign-app',
  388 |   'future',
  389 |   'missing-table',
  390 |   'foreign-key',
  391 |   'metadata',
  392 |   'image-hash',
  393 |   'filters',
  394 |   'body-json',
  395 |   'palette',
  396 |   'category-title',
  397 |   'category-membership',
  398 |   'category-snapshot',
  399 |   'plan-options',
  400 |   'plan-name',
  401 | ] as const) {
  402 |   test(`恢复预览拒绝 ${fault}，原备份字节及当前数据保持`, async ({ testDataDirectory }, info) => {
  403 |     await outputDirectory(async (directory) => {
  404 |       const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  405 |       try {
  406 |         const valid = join(directory, '完整.sqlite3'),
  407 |           invalid = join(directory, '异常.sqlite3')
  408 |         await exportFile(application, page, valid)
  409 |         await copyFile(valid, invalid)
  410 |         if (fault === 'corrupt') await writeFile(invalid, 'not a SQLite backup')
  411 |         else {
  412 |           const db = new DatabaseSync(invalid)
  413 |           try {
  414 |             db.exec('PRAGMA foreign_keys=OFF')
  415 |             if (fault === 'foreign-app') db.exec('PRAGMA application_id=123')
  416 |             if (fault === 'future') db.exec('PRAGMA user_version=999')
  417 |             if (fault === 'missing-table') db.exec('DROP TABLE practice_receipts')
  418 |             if (fault === 'foreign-key')
  419 |               db.prepare('INSERT INTO version_images VALUES (999,?)').run('a'.repeat(64))
  420 |             if (fault === 'metadata') db.exec("UPDATE backup_manifest SET created_at='broken'")
  421 |             if (fault === 'image-hash')
  422 |               db.prepare('UPDATE image_resources SET bytes=?').run(alternatePng)
  423 |             if (fault === 'filters') db.exec("UPDATE practice_sessions SET filters_json='{}'")
  424 |             if (fault === 'body-json') db.exec("UPDATE question_versions SET definitions_json='{}'")
  425 |             if (fault === 'palette')
  426 |               db.exec(
  427 |                 "PRAGMA ignore_check_constraints=ON; UPDATE appearance_settings SET palette='custom'",
  428 |               )
  429 |             if (fault === 'category-title')
  430 |               db.exec(
  431 |                 "INSERT INTO categories(category_id,title) VALUES('invalid-category','未分类')",
  432 |               )
  433 |             if (fault === 'category-membership')
  434 |               db.exec("UPDATE topics SET category_id='missing-category'")
  435 |             if (fault === 'category-snapshot')
  436 |               db.prepare('UPDATE practice_sessions SET category_scope_json=?').run(
  437 |                 JSON.stringify({ kind: 'category', categoryId: 'missing-title' }),
  438 |               )
  439 |             if (fault === 'plan-options' || fault === 'plan-name')
  440 |               db.prepare('INSERT INTO practice_plans(plan_id,name,options_json) VALUES(?,?,?)').run(
  441 |                 randomUUID(),
  442 |                 fault === 'plan-name' ? '坏\n方案' : '异常条件方案',
  443 |                 fault === 'plan-options'
  444 |                   ? '{}'
  445 |                   : JSON.stringify({
  446 |                       category: { kind: 'all' },
  447 |                       topicId: null,
  448 |                       mode: 'random',
  449 |                       count: 20,
  450 |                       filters: { ...EMPTY_QUESTION_FILTERS },
  451 |                     }),
  452 |               )
  453 |           } finally {
  454 |             db.close()
  455 |           }
  456 |         }
  457 |         const original = await readFile(invalid)
  458 |         const before = withHistoryDatabase(testDataDirectory, records)
  459 |         await openPage(page, '备份恢复')
  460 |         await select(application, 'preview', invalid)
  461 |         const result = await backup(page, 'preview')
  462 |         expect(result).toMatchObject({
  463 |           ok: false,
  464 |           error: { code: fault === 'future' ? 'UNSUPPORTED_BACKUP' : 'INVALID_BACKUP' },
  465 |         })
  466 |         expect(await readFile(invalid)).toEqual(original)
  467 |         expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
  468 |         expect(await readdir(join(testDataDirectory, 'backup-staging'))).toEqual([])
  469 |         await select(application, 'preview', valid)
  470 |         await page.getByRole('button', { name: '选择备份并预览', exact: true }).click()
> 471 |         await expect(page.getByLabel('恢复预览摘要', { exact: true })).toBeVisible()
      |                                                                  ^ Error: expect(locator).toBeVisible() failed
  472 |         await info.attach('invalid-backup-result.json', {
  473 |           body: JSON.stringify({ fault, result }),
  474 |           contentType: 'application/json',
  475 |         })
  476 |       } finally {
  477 |         await stop(application)
  478 |       }
  479 |     })
  480 |   })
  481 | }
  482 | 
  483 | test('在途备份阻止重复操作和切页，正常退出等待已验证备份发布', async ({
  484 |   testDataDirectory,
  485 | }, info) => {
  486 |   await outputDirectory(async (directory) => {
  487 |     const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  488 |     const path = join(directory, '退出前备份.sqlite3')
  489 |     try {
  490 |       await openPage(page, '备份恢复')
  491 |       const before = withHistoryDatabase(testDataDirectory, records)
  492 |       await application.evaluate(() => {
  493 |         const fs = process.getBuiltinModule('node:fs/promises')
  494 |         const original = fs.rename
  495 |         const state = globalThis as unknown as { publishStarted: boolean }
  496 |         fs.rename = async (...args: Parameters<typeof fs.rename>) => {
  497 |           fs.rename = original
  498 |           state.publishStarted = true
  499 |           await new Promise((resolve) => setTimeout(resolve, 750))
  500 |           return original(...args)
  501 |         }
  502 |       })
  503 |       await select(application, 'export', path)
  504 |       await page.getByRole('button', { name: '导出完整备份', exact: true }).click()
  505 |       await expect
  506 |         .poll(() =>
  507 |           application.evaluate(
  508 |             () => (globalThis as unknown as { publishStarted: boolean }).publishStarted,
  509 |           ),
  510 |         )
  511 |         .toBe(true)
  512 |       await expect(
  513 |         page.getByRole('button', { name: '正在导出完整备份…', exact: true }),
  514 |       ).toBeDisabled()
  515 |       await expect(page.getByRole('link', { name: '题库', exact: true })).toHaveAttribute(
  516 |         'aria-disabled',
  517 |         'true',
  518 |       )
  519 |       expect(await backup(page, 'preview')).toMatchObject({
  520 |         ok: false,
  521 |         error: { code: 'BACKUP_BUSY' },
  522 |       })
  523 |       const finished = application.waitForEvent('close')
  524 |       await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.close())
  525 |       await finished
  526 |       expect(exportedRecords(path)).toEqual(before)
  527 |       expect(
  528 |         (await readdir(directory)).filter((name) => name.startsWith('.embedded-practice-export-')),
  529 |       ).toEqual([])
  530 |     } finally {
  531 |       await stop(application)
  532 |     }
  533 |   })
  534 | })
  535 | 
  536 | test('发布失败保留既有备份，来源读取中变化时停止预览且清理副本', async ({
  537 |   testDataDirectory,
  538 | }, info) => {
  539 |   await outputDirectory(async (directory) => {
  540 |     const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  541 |     try {
  542 |       const target = join(directory, '保留备份.sqlite3')
  543 |       await exportFile(application, page, target)
  544 |       const old = await readFile(target)
  545 |       const before = withHistoryDatabase(testDataDirectory, records)
  546 |       await application.evaluate(() => {
  547 |         const fs = process.getBuiltinModule('node:fs/promises'),
  548 |           original = fs.rename
  549 |         fs.rename = async () => {
  550 |           fs.rename = original
  551 |           throw new Error('INJECTED-PUBLISH-FAILURE')
  552 |         }
  553 |       })
  554 |       await select(application, 'export', target)
  555 |       expect(await backup(page, 'export')).toMatchObject({
  556 |         ok: false,
  557 |         error: { code: 'EXPORT_FAILED' },
  558 |       })
  559 |       expect(await readFile(target)).toEqual(old)
  560 |       expect(await readdir(directory)).toEqual(['保留备份.sqlite3'])
  561 |       await application.evaluate(() => {
  562 |         const fs = process.getBuiltinModule('node:fs/promises'),
  563 |           original = fs.copyFile
  564 |         fs.copyFile = async (...args: Parameters<typeof fs.copyFile>) => {
  565 |           fs.copyFile = original
  566 |           await original(...args)
  567 |           await fs.appendFile(args[0], 'EXTERNAL-CHANGE')
  568 |         }
  569 |       })
  570 |       await select(application, 'preview', target)
  571 |       expect(await backup(page, 'preview')).toMatchObject({
```