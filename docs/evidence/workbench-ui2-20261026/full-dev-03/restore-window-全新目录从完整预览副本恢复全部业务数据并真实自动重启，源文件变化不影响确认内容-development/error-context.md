# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: restore-window.spec.ts >> 全新目录从完整预览副本恢复全部业务数据并真实自动重启，源文件变化不影响确认内容
- Location: tests\e2e\restore-window.spec.ts:223:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: '嵌入式刷题本', exact: true })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: '嵌入式刷题本', exact: true }) with timeout 10000ms
  - waiting for getByRole('heading', { name: '嵌入式刷题本', exact: true })

```

```yaml
- banner
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
  - strong: 学习总览
  - text: 本地离线
  - group: 外观
  - region "学习总览工作区":
    - heading "继续你的嵌入式学习" [level=2]
    - paragraph: 先独立思考，再对照答案。每一轮积累都保存在本机。
    - region "当前练习概况":
      - paragraph: 继续原固定队列
      - heading "历史专题 A" [level=3]
      - paragraph: 当前位置 2 / 2 题
      - progressbar "本轮当前位置"
      - paragraph: 随机练习 · 已揭晓 1 题 · 已自评 1 题
      - button "继续本轮"
      - button "配置新练习"
    - term: 有效题目
    - definition: "2"
    - term: 已揭晓
    - definition: "0"
    - term: 已自评
    - definition: "0"
    - term: 收藏
    - definition: "1"
    - paragraph: 全部有效题目，按题目身份和当前内容版本去重。自评是个人判断。
    - region "本机知识板块":
      - heading "知识板块" [level=3]
      - button "查看全部板块"
      - button "另一恢复板块 1 道有效题目":
        - strong: 另一恢复板块
        - text: 1 道有效题目
      - button "恢复板块新名称 1 道有效题目":
        - strong: 恢复板块新名称
        - text: 1 道有效题目
    - region "复习筛选入口":
      - heading "复习入口" [level=3]
      - button "不会 0 题 · 去筛选":
        - strong: 不会
        - text: 0 题 · 去筛选
      - button "不熟 0 题 · 去筛选":
        - strong: 不熟
        - text: 0 题 · 去筛选
      - button "内容更新待复习 2 题 · 去筛选":
        - strong: 内容更新待复习
        - text: 2 题 · 去筛选
      - paragraph: 只填入题库筛选条件，不会自动开始或替换练习。
  - status:
    - paragraph: 本地数据已就绪
- contentinfo: 离线使用 · 数据保存在本机 V42.11.15 测试版 · 构建 20261026.1-workbench-e-ui2
```

# Test source

```ts
  263 |       await source.page.getByLabel('练习专题', { exact: true }).selectOption('history-a')
  264 |       await source.page.getByText('筛选练习题目', { exact: true }).click()
  265 |       await source.page.getByLabel('练习标签', { exact: true }).fill('历史样本')
  266 |       await expect(source.page.getByText('匹配 2 题', { exact: true })).toBeVisible()
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
  361 |       await expect(
  362 |         newPage.getByRole('heading', { name: '嵌入式刷题本', exact: true }),
> 363 |       ).toBeVisible()
      |         ^ Error: expect(locator).toBeVisible() failed
  364 |       expect(saved(join(targetDirectory, 'practice.sqlite3'))).toEqual(expected)
  365 |       expect(
  366 |         await newPage.evaluate(() =>
  367 |           (globalThis as unknown as { desktop: DesktopApi }).desktop.practicePlans.list(),
  368 |         ),
  369 |       ).toEqual({ ok: true, value: [savedPlan] })
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
```