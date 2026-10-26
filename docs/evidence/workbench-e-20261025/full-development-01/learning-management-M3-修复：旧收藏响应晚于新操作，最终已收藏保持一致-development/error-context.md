# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: learning-management.spec.ts >> M3 修复：旧收藏响应晚于新操作，最终已收藏保持一致
- Location: tests\e2e\learning-management.spec.ts:211:7

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
  131 |   )
  132 |   if (!result.ok) throw new Error(result.error.message)
  133 |   return result.value
  134 | }
  135 | async function current(page: Page) {
  136 |   const result = await page.evaluate(() =>
  137 |     (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
  138 |   )
  139 |   if (!result.ok || !result.value) throw new Error('测试轮不存在。')
  140 |   return result.value
  141 | }
  142 | function cursor(value: Awaited<ReturnType<typeof current>>): PracticeCursor {
  143 |   return {
  144 |     sessionId: value.session.sessionId,
  145 |     position: value.session.position,
  146 |     revision: value.session.revision,
  147 |   }
  148 | }
  149 | async function favorite(page: Page, questionId: string, value: boolean) {
  150 |   const result = await page.evaluate(
  151 |     (setting) =>
  152 |       (globalThis as unknown as { desktop: DesktopApi }).desktop.library.setFavorite(setting),
  153 |     { topicId: 'm3-a', questionId, favorite: value },
  154 |   )
  155 |   expect(result).toMatchObject({ ok: true, value: { favorite: value } })
  156 | }
  157 | async function applyLibrary(page: Page, query: string, expected: number) {
  158 |   await page.getByRole('searchbox', { name: '题库搜索', exact: true }).fill(query)
  159 |   await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  160 |   await expect(page.getByText(`共 ${expected} 题`, { exact: true })).toBeVisible()
  161 |   await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
  162 | }
  163 | 
  164 | async function holdFavoriteResponse(application: ElectronApplication) {
  165 |   await application.evaluate(({ ipcMain }) => {
  166 |     const handlers = Reflect.get(ipcMain, '_invokeHandlers') as Map<
  167 |       string,
  168 |       (...args: unknown[]) => Promise<unknown>
  169 |     >
  170 |     const favoriteHandler = handlers.get('library:set-favorite')
  171 |     const readyHandler = handlers.get('practice:ready')
  172 |     if (!favoriteHandler || !readyHandler) throw new Error('测试所需 handler 不存在。')
  173 |     const control = {
  174 |       written: false,
  175 |       readyCount: 0,
  176 |       release: undefined as (() => void) | undefined,
  177 |     }
  178 |     Reflect.set(globalThis, 'favoriteResponseControl', control)
  179 |     ipcMain.removeHandler('library:set-favorite')
  180 |     ipcMain.handle('library:set-favorite', async (...args) => {
  181 |       const result = await favoriteHandler(...args)
  182 |       if (!control.written && (result as { ok: boolean }).ok) {
  183 |         control.written = true
  184 |         await new Promise<void>((resolve) => {
  185 |           control.release = resolve
  186 |         })
  187 |       }
  188 |       return result
  189 |     })
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
> 231 |       await page.getByRole('button', { name: /A 筛选专题.*q-02/ }).click()
      |                                                                ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
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
  290 |     await page.getByRole('button', { name: /A 筛选专题.*q-02/ }).click()
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
```