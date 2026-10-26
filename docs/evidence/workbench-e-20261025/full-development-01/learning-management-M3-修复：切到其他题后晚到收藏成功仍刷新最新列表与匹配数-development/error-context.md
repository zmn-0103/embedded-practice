# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: learning-management.spec.ts >> M3 修复：切到其他题后晚到收藏成功仍刷新最新列表与匹配数
- Location: tests\e2e\learning-management.spec.ts:276:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /A 筛选专题.*q-02/ })

```

# Test source

```ts
  190 |     ipcMain.removeHandler('practice:ready')
  191 |     ipcMain.handle('practice:ready', async (...args) => {
  192 |       const result = await readyHandler(...args)
  193 |       control.readyCount++
  194 |       return result
  195 |     })
  196 |   })
  197 | }
  198 | async function favoriteResponseState(application: ElectronApplication, release = false) {
  199 |   return application.evaluate((_electron, shouldRelease) => {
  200 |     const control = Reflect.get(globalThis, 'favoriteResponseControl') as {
  201 |       written: boolean
  202 |       readyCount: number
  203 |       release?: () => void
  204 |     }
  205 |     if (shouldRelease) control.release?.()
  206 |     return { written: control.written, readyCount: control.readyCount }
  207 |   }, release)
  208 | }
  209 | 
  210 | for (const initialFavorite of [false, true]) {
  211 |   test(`M3 修复：旧收藏响应晚于新操作，最终${initialFavorite ? '已收藏' : '未收藏'}保持一致`, async ({
  212 |     testDataDirectory,
  213 |   }, info) => {
  214 |     const { application, page } = await prepare(testDataDirectory, info.project.name)
  215 |     try {
  216 |       const first = page.getByRole('button', { name: /A 筛选专题.*q-01/ })
  217 |       await first.click()
  218 |       // 题库详情必须持续挂载；只读取仍挂载的开始页就绪状态，不在竞态中切页。
  219 |       if (initialFavorite) {
  220 |         await page.getByRole('button', { name: '收藏本题', exact: true }).click()
  221 |         await expect(page.getByRole('button', { name: '取消收藏', exact: true })).toBeEnabled()
  222 |         await expect(
  223 |           page.getByRole('button', { name: '开始练习', exact: true, includeHidden: true }),
  224 |         ).toBeEnabled()
  225 |       }
  226 |       await holdFavoriteResponse(application)
  227 |       await page
  228 |         .getByRole('button', { name: initialFavorite ? '取消收藏' : '收藏本题', exact: true })
  229 |         .click()
  230 |       await expect.poll(async () => (await favoriteResponseState(application)).written).toBe(true)
  231 |       await page.getByRole('button', { name: /A 筛选专题.*q-02/ }).click()
  232 |       await expect(page.getByRole('heading', { name: '外设问题 2', exact: true })).toBeVisible()
  233 |       await first.click()
  234 |       await page
  235 |         .getByRole('button', { name: initialFavorite ? '收藏本题' : '取消收藏', exact: true })
  236 |         .click()
  237 |       const currentButton = page.getByRole('button', {
  238 |         name: initialFavorite ? '取消收藏' : '收藏本题',
  239 |         exact: true,
  240 |       })
  241 |       await expect(currentButton).toHaveAttribute('aria-pressed', String(initialFavorite))
  242 |       await expect(
  243 |         page.getByRole('button', { name: '开始练习', exact: true, includeHidden: true }),
  244 |       ).toBeEnabled()
  245 |       await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
  246 |       await page.getByRole('button', { name: '展开参考答案', exact: true }).click()
  247 |       const before = snapshot(testDataDirectory)
  248 |       const barrier = await favoriteResponseState(application, true)
  249 |       // 首页刷新说明旧回调已被页面消费，避免在旧响应到达前就通过否定断言。
  250 |       await expect
  251 |         .poll(async () => (await favoriteResponseState(application)).readyCount)
  252 |         .toBeGreaterThan(barrier.readyCount)
  253 |       await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
  254 |       const observed = {
  255 |         initialFavorite,
  256 |         list: await first.innerText(),
  257 |         detail: await currentButton.getAttribute('aria-pressed'),
  258 |         database: snapshot(testDataDirectory),
  259 |       }
  260 |       await info.attach('favorite-out-of-order.json', {
  261 |         body: JSON.stringify(observed),
  262 |         contentType: 'application/json',
  263 |       })
  264 |       expect(observed.list.includes('已收藏')).toBe(initialFavorite)
  265 |       expect(observed.detail).toBe(String(initialFavorite))
  266 |       expect(observed.database).toEqual(before)
  267 |       await expect(page.getByRole('region', { name: '参考答案', exact: true })).toContainText(
  268 |         `${secret}-m3-a-1`,
  269 |       )
  270 |     } finally {
  271 |       await stop(application)
  272 |     }
  273 |   })
  274 | }
  275 | 
  276 | test('M3 修复：切到其他题后晚到收藏成功仍刷新最新列表与匹配数', async ({
  277 |   testDataDirectory,
  278 | }, info) => {
  279 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  280 |   try {
  281 |     await openPage(page, '开始练习')
  282 |     await page.getByText('筛选练习题目', { exact: true }).click()
  283 |     await page.getByRole('checkbox', { name: '练习只看收藏' }).check()
  284 |     await expect(page.getByText('匹配 0 题', { exact: true })).toBeVisible()
  285 |     await openPage(page, '题库')
  286 |     await page.getByRole('button', { name: /A 筛选专题.*q-01/ }).click()
  287 |     await holdFavoriteResponse(application)
  288 |     await page.getByRole('button', { name: '收藏本题', exact: true }).click()
  289 |     await expect.poll(async () => (await favoriteResponseState(application)).written).toBe(true)
> 290 |     await page.getByRole('button', { name: /A 筛选专题.*q-02/ }).click()
      |                                                              ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
  291 |     await expect(page.getByRole('heading', { name: '外设问题 2', exact: true })).toBeVisible()
  292 |     const before = snapshot(testDataDirectory)
  293 |     const barrier = await favoriteResponseState(application, true)
  294 |     await expect
  295 |       .poll(async () => (await favoriteResponseState(application)).readyCount)
  296 |       .toBeGreaterThan(barrier.readyCount)
  297 |     await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
  298 |     await expect(page.getByRole('button', { name: /A 筛选专题.*q-01/ })).toContainText('已收藏')
  299 |     await expect(page.getByRole('heading', { name: '外设问题 2', exact: true })).toBeVisible()
  300 |     await expect(page.getByRole('button', { name: '收藏本题', exact: true })).toHaveAttribute(
  301 |       'aria-pressed',
  302 |       'false',
  303 |     )
  304 |     expect(snapshot(testDataDirectory)).toEqual(before)
  305 |     await openPage(page, '开始练习')
  306 |     await expect(page.getByText('匹配 1 题', { exact: true })).toBeVisible()
  307 |   } finally {
  308 |     await stop(application)
  309 |   }
  310 | })
  311 | 
  312 | test('M3 第一批：搜索标题/题干/标签、字面字符、交集、分页与答案边界', async ({
  313 |   testDataDirectory,
  314 | }, info) => {
  315 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  316 |   try {
  317 |     await page.getByRole('button', { name: '下一页', exact: true }).click()
  318 |     await expect(page.getByRole('navigation', { name: '题目分页' })).toContainText('2 / 2')
  319 |     await expect(
  320 |       page.getByRole('complementary', { name: '题目列表' }).getByRole('button'),
  321 |     ).toHaveCount(9)
  322 |     // 该 aside 同时含两个分页按钮：7 道题加 2 个分页按钮。
  323 |     for (const [query, count] of [
  324 |       ['gpiotitlemarker', 1],
  325 |       ['bodymarker', 1],
  326 |       ['onlytagmarker', 2],
  327 |       ['%', 1],
  328 |       ["_quote'", 1],
  329 |       ['backslash\\', 1],
  330 |       ["' OR 1=1 --", 0],
  331 |       [secret, 0],
  332 |     ] as const)
  333 |       await applyLibrary(page, query, count)
  334 |     await page.getByRole('button', { name: '清空题库筛选' }).click()
  335 |     await expect(page.getByText('共 27 题', { exact: true })).toBeVisible()
  336 |     await page.getByRole('combobox', { name: '专题', exact: true }).selectOption('m3-a')
  337 |     await expect(page.getByText('共 24 题', { exact: true })).toBeVisible()
  338 |     await page.getByRole('combobox', { name: '题库标签', exact: true }).fill('筛选标签')
  339 |     await page.getByRole('combobox', { name: '题库难度' }).selectOption('基础')
  340 |     await applyLibrary(page, '', 11)
  341 |     await page.getByRole('combobox', { name: '题库难度' }).selectOption('未分级')
  342 |     await applyLibrary(page, '', 1)
  343 |     await page.getByRole('button', { name: /q-24/ }).click()
  344 |     expect(await page.content()).not.toContain(secret)
  345 |     expect(await page.locator('body').ariaSnapshot()).not.toContain(secret)
  346 |     const response = await list(page, { query: 'BodyMarker' })
  347 |     expect(response.questions).toHaveLength(1)
  348 |     expect(Object.keys(response.questions[0]!).sort()).toEqual(
  349 |       [
  350 |         'archived',
  351 |         'contentUpdated',
  352 |         'currentRating',
  353 |         'difficulty',
  354 |         'favorite',
  355 |         'practiced',
  356 |         'questionId',
  357 |         'tags',
  358 |         'title',
  359 |         'topicId',
  360 |         'topicTitle',
  361 |         'versionId',
  362 |       ].sort(),
  363 |     )
  364 |     expect(JSON.stringify(response)).not.toContain(secret)
  365 |     const clamped = await list(page, { tag: 'ARM Cortex' }, { page: 999 })
  366 |     expect(clamped).toMatchObject({ total: 2, page: 1 })
  367 |     await info.attach('search-boundaries.json', {
  368 |       body: JSON.stringify({ response, clamped }),
  369 |       contentType: 'application/json',
  370 |     })
  371 |     await page.screenshot({ path: info.outputPath('search-filter.png'), fullPage: true })
  372 |   } finally {
  373 |     await stop(application)
  374 |   }
  375 | })
  376 | 
  377 | test('M3 第一批：收藏快速重复、练习数量同步、正常关闭重开持久化', async ({
  378 |   testDataDirectory,
  379 | }, info) => {
  380 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  381 |   let reopened: ElectronApplication | undefined
  382 |   try {
  383 |     await openPage(page, '开始练习')
  384 |     await page.getByText('筛选练习题目', { exact: true }).click()
  385 |     await page.getByRole('checkbox', { name: '练习只看收藏' }).check()
  386 |     await expect(page.getByText('匹配 0 题', { exact: true })).toBeVisible()
  387 |     await expect(page.getByRole('button', { name: '开始练习', exact: true })).toBeDisabled()
  388 |     await openPage(page, '题库')
  389 |     await page
  390 |       .getByRole('button', { name: /m3-a|A 筛选专题.*q-01/ })
```