# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: category-practice.spec.ts >> 分类正常关闭等待在途保存：失败返回窗口并保留原目标
- Location: tests\e2e\category-practice.spec.ts:276:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.getAttribute: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('.category-manager').getByRole('button', { name: '新增分类', exact: true })

```

# Test source

```ts
  213 |     await page.getByLabel('学习记录范围', { exact: true }).selectOption('archived')
  214 |     await expectCounts(page, [1, 1, 1, 1, 0], [0, 1, 0])
  215 |     await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
  216 |   } finally {
  217 |     await stop(application)
  218 |   }
  219 | })
  220 | 
  221 | test('分类统计：旧分类的晚到摘要不能覆盖新范围或下方题库', async ({ testDataDirectory }, info) => {
  222 |   const { application, page, first } = await prepareCategories(testDataDirectory, info.project.name)
  223 |   try {
  224 |     await openRecords(page)
  225 |     await page.locator('.records-scope .topic-navigation-panel > summary').click()
  226 |     await application.evaluate(({ ipcMain }, id) => {
  227 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('learning:read')
  228 |       let hold = true
  229 |       ipcMain.removeHandler('learning:read')
  230 |       ipcMain.handle('learning:read', async (event, scope) => {
  231 |         const result = await original(event, scope)
  232 |         if (hold && scope.category?.categoryId === id) {
  233 |           hold = false
  234 |           await new Promise<void>((resolve) =>
  235 |             Reflect.set(globalThis, '__releaseCategorySummary', resolve),
  236 |           )
  237 |           Reflect.set(globalThis, '__categorySummaryDelivered', true)
  238 |         }
  239 |         return result
  240 |       })
  241 |     }, first)
  242 |     await page.getByRole('button', { name: '学习记录分类：板块 A', exact: true }).click()
  243 |     await expect
  244 |       .poll(() =>
  245 |         application.evaluate(() => typeof Reflect.get(globalThis, '__releaseCategorySummary')),
  246 |       )
  247 |       .toBe('function')
  248 |     await page.getByRole('button', { name: '学习记录分类：未分类', exact: true }).click()
  249 |     await expectCounts(page, [1, 0, 0, 0, 0], [0, 0, 0])
  250 |     await application.evaluate(() => Reflect.get(globalThis, '__releaseCategorySummary')())
  251 |     await expect
  252 |       .poll(() => application.evaluate(() => Reflect.get(globalThis, '__categorySummaryDelivered')))
  253 |       .toBe(true)
  254 |     await page.evaluate(
  255 |       () =>
  256 |         new Promise((done) =>
  257 |           Reflect.get(
  258 |             globalThis,
  259 |             'requestAnimationFrame',
  260 |           )(() => Reflect.get(globalThis, 'requestAnimationFrame')(done)),
  261 |         ),
  262 |     )
  263 |     await expectCounts(page, [1, 0, 0, 0, 0], [0, 0, 0])
  264 |     await page.getByRole('button', { name: '清空题库筛选', exact: true }).click()
  265 |     await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
  266 |     await expect(page.getByRole('button', { name: /丙专题.*q-1/ })).toBeVisible()
  267 |   } finally {
  268 |     await application
  269 |       .evaluate(() => Reflect.get(globalThis, '__releaseCategorySummary')?.())
  270 |       .catch(() => {})
  271 |     await stop(application)
  272 |   }
  273 | })
  274 | 
  275 | for (const failed of [false, true]) {
  276 |   test(`分类正常关闭等待在途保存：${failed ? '失败返回窗口并保留原目标' : '成功后退出重开保持'}`, async ({
  277 |     testDataDirectory,
  278 |   }, info) => {
  279 |     const prepared = await prepareCategories(testDataDirectory, info.project.name)
  280 |     let instance = { application: prepared.application, page: prepared.page }
  281 |     try {
  282 |       await instance.application.evaluate(({ ipcMain, dialog }, fail) => {
  283 |         const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:update-category')
  284 |         let hold = true
  285 |         ipcMain.removeHandler('library:update-category')
  286 |         ipcMain.handle('library:update-category', async (event, request) => {
  287 |           if (hold && request.kind === 'create' && request.title === '关闭等待分类') {
  288 |             hold = false
  289 |             const result = fail
  290 |               ? { ok: false, error: { code: 'DATABASE_UNAVAILABLE', message: '定向分类保存失败' } }
  291 |               : await original(event, request)
  292 |             await new Promise<void>((resolve) =>
  293 |               Reflect.set(globalThis, '__releaseCategorySave', resolve),
  294 |             )
  295 |             return result
  296 |           }
  297 |           return original(event, request)
  298 |         })
  299 |         dialog.showMessageBox = (async (...args: unknown[]) => {
  300 |           const options = args[args.length - 1] as { defaultId: number; buttons: string[] }
  301 |           if (options.defaultId !== 0 || options.buttons[0] !== '返回窗口')
  302 |             throw new Error('关闭确认默认项不符合预期')
  303 |           return { response: 0, checkboxChecked: false }
  304 |         }) as typeof dialog.showMessageBox
  305 |       }, failed)
  306 |       await instance.page.evaluate(() => {
  307 |         ;(globalThis as unknown as { desktop: DesktopApi }).desktop.practice.onBeforeClose(() => {
  308 |           Reflect.set(globalThis, '__categoryCloseSeen', true)
  309 |         })
  310 |       })
  311 |       const manager = instance.page.locator('.category-manager')
  312 |       const create = manager.getByRole('button', { name: '新增分类', exact: true })
> 313 |       if ((await create.getAttribute('aria-expanded')) !== 'true') await create.click()
      |                         ^ TimeoutError: locator.getAttribute: Timeout 30000ms exceeded.
  314 |       await manager.getByLabel('新分类名称', { exact: true }).fill('关闭等待分类')
  315 |       await manager.getByRole('button', { name: '添加分类', exact: true }).click()
  316 |       await expect
  317 |         .poll(() =>
  318 |           instance.application.evaluate(
  319 |             () => typeof Reflect.get(globalThis, '__releaseCategorySave'),
  320 |           ),
  321 |         )
  322 |         .toBe('function')
  323 |       await expect(
  324 |         instance.page.getByRole('link', { name: '设置与数据', exact: true }),
  325 |       ).toHaveAttribute('aria-disabled', 'true')
  326 |       await instance.application.evaluate(({ BrowserWindow }) =>
  327 |         BrowserWindow.getAllWindows()[0]!.close(),
  328 |       )
  329 |       await expect
  330 |         .poll(() => instance.page.evaluate(() => Reflect.get(globalThis, '__categoryCloseSeen')))
  331 |         .toBe(true)
  332 |       expect(instance.application.windows()).toHaveLength(1)
  333 |       if (failed) {
  334 |         await instance.application.evaluate(() =>
  335 |           Reflect.get(globalThis, '__releaseCategorySave')(),
  336 |         )
  337 |         await expect(manager.getByRole('alert')).toContainText('定向分类保存失败')
  338 |         await expect(
  339 |           instance.page.getByRole('link', { name: '设置与数据', exact: true }),
  340 |         ).toHaveAttribute('aria-disabled', 'false')
  341 |         await expect(manager.getByLabel('新分类名称', { exact: true })).toHaveValue('关闭等待分类')
  342 |         await manager.getByRole('button', { name: '添加分类', exact: true }).click()
  343 |         await expect
  344 |           .poll(async () =>
  345 |             (await categoryList(instance.page)).categories.some(
  346 |               (item) => item.title === '关闭等待分类',
  347 |             ),
  348 |           )
  349 |           .toBe(true)
  350 |       } else {
  351 |         const exited = instance.application.waitForEvent('close')
  352 |         await instance.application.evaluate(() =>
  353 |           Reflect.get(globalThis, '__releaseCategorySave')(),
  354 |         )
  355 |         await exited
  356 |         instance = await launchApplication(testDataDirectory, info.project.name, '题库')
  357 |         expect(
  358 |           (await categoryList(instance.page)).categories.some(
  359 |             (item) => item.title === '关闭等待分类',
  360 |           ),
  361 |         ).toBe(true)
  362 |       }
  363 |     } finally {
  364 |       await instance.application
  365 |         .evaluate(() => Reflect.get(globalThis, '__releaseCategorySave')?.())
  366 |         .catch(() => {})
  367 |       await stop(instance.application)
  368 |     }
  369 |   })
  370 | }
  371 | 
```