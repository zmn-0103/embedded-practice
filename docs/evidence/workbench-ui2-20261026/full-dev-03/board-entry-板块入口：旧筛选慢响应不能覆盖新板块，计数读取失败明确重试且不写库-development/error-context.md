# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: board-entry.spec.ts >> 板块入口：旧筛选慢响应不能覆盖新板块，计数读取失败明确重试且不写库
- Location: tests\e2e\board-entry.spec.ts:235:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '筛选题库', exact: true })
    - locator resolved to <button type="button">筛选题库</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <summary>我的重点 · 1 个专题</summary> from <div class="library-management-tools">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <summary>我的重点 · 1 个专题</summary> from <div class="library-management-tools">…</div> subtree intercepts pointer events
  2 × retrying click action
      - waiting 100ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <details open="" class="category-manager">…</details> from <div class="library-management-tools">…</div> subtree intercepts pointer events
  14 × retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <summary>我的重点 · 1 个专题</summary> from <div class="library-management-tools">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <summary>我的重点 · 1 个专题</summary> from <div class="library-management-tools">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <details open="" class="category-manager">…</details> from <div class="library-management-tools">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <details open="" class="category-manager">…</details> from <div class="library-management-tools">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <summary>我的重点 · 1 个专题</summary> from <div class="library-management-tools">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms

```

# Test source

```ts
  171 |     await instance.page.getByLabel('练习难度', { exact: true }).selectOption('进阶')
  172 |     const plan = await savePlan(instance.page, '保留原条件的中等练习')
  173 |     expect(plan.options.filters.difficulty).toBe('进阶')
  174 |     const protectedRows = historySnapshot(testDataDirectory)
  175 |     const plans = await readPlans(instance.page)
  176 |     await openPage(instance.page, '题库')
  177 |     const manager = await openCategoryManager(instance.page)
  178 |     await manager.getByRole('button', { name: '修改或移除分类', exact: true }).click()
  179 |     await manager.getByLabel('要修改的分类', { exact: true }).selectOption(prepared.communication)
  180 |     await manager.getByLabel('分类新名称', { exact: true }).fill('我的通信复习')
  181 |     await manager.getByRole('button', { name: '保存分类名称', exact: true }).click()
  182 |     await expect
  183 |       .poll(
  184 |         async () =>
  185 |           (await categoryList(instance.page)).categories.find(
  186 |             (c) => c.categoryId === prepared.communication,
  187 |           )?.title,
  188 |       )
  189 |       .toBe('我的通信复习')
  190 |     await assignTopic(instance.page, 'board-a', prepared.personal)
  191 |     await categoryChange(instance.page, { kind: 'delete', categoryId: prepared.communication })
  192 |     expect(historySnapshot(testDataDirectory)).toEqual(protectedRows)
  193 |     expect(await readPlans(instance.page)).toEqual(plans)
  194 |     await openPage(instance.page, '知识板块')
  195 |     await expect(board(instance.page, '通信协议').locator('.board-count')).toHaveText(
  196 |       '0 题 · 待补题',
  197 |     )
  198 |     await expect(board(instance.page, '我的重点').locator('.board-count')).toHaveText('26 题')
  199 |     await expect(
  200 |       instance.page.getByRole('region', { name: '继续上次练习', exact: true }),
  201 |     ).toContainText('第 2 / 23 题')
  202 |     const closed = instance.application.waitForEvent('close')
  203 |     await instance.application.evaluate(({ BrowserWindow }) =>
  204 |       BrowserWindow.getAllWindows()[0]!.close(),
  205 |     )
  206 |     await closed
  207 |     instance = await launchApplication(testDataDirectory, info.project.name, '知识板块')
  208 |     await runtime(instance.application, instance.page, testDataDirectory, info)
  209 |     expect(historySnapshot(testDataDirectory)).toEqual(protectedRows)
  210 |     expect(await readPlans(instance.page)).toEqual(plans)
  211 |     const panel = await openPlans(instance.page)
  212 |     await panel.getByLabel('选用练习方案', { exact: true }).selectOption(plan.planId)
  213 |     await expect(panel).toContainText('难度：中（进阶）')
  214 |     await expect(panel.getByRole('button', { name: '填入条件', exact: true })).toBeDisabled()
  215 |     await openPage(instance.page, '知识板块')
  216 |     await instance.page.getByRole('button', { name: '继续练习', exact: true }).click()
  217 |     await expect(instance.page.getByLabel('练习进度')).toHaveText('第 2 / 23 题 · 顺序练习')
  218 |     await expect(instance.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  219 |       draft,
  220 |     )
  221 |     await expect(
  222 |       instance.page.locator('.practice-heading').getByLabel('难度：中（进阶）', { exact: true }),
  223 |     ).toBeVisible()
  224 |     await expect(instance.page.getByText('BOARD-ANSWER-board-a-2', { exact: true })).toHaveCount(0)
  225 |     expect(historySnapshot(testDataDirectory)).toEqual(protectedRows)
  226 |     await info.attach('protected-learning-rows.json', {
  227 |       body: JSON.stringify({ rows: protectedRows, plans }, null, 2),
  228 |       contentType: 'application/json',
  229 |     })
  230 |   } finally {
  231 |     await stop(instance.application)
  232 |   }
  233 | })
  234 | 
  235 | test('板块入口：旧筛选慢响应不能覆盖新板块，计数读取失败明确重试且不写库', async ({
  236 |   testDataDirectory,
  237 | }, info) => {
  238 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  239 |   try {
  240 |     const before = historySnapshot(testDataDirectory)
  241 |     await application.evaluate(({ ipcMain }) => {
  242 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:list-questions')
  243 |       const control = {
  244 |         held: false,
  245 |         finished: false,
  246 |         fail: false,
  247 |         release: undefined as (() => void) | undefined,
  248 |       }
  249 |       Reflect.set(globalThis, 'boardReadControl', control)
  250 |       ipcMain.removeHandler('library:list-questions')
  251 |       ipcMain.handle('library:list-questions', async (event, request) => {
  252 |         if (control.fail && request.topicId === null && !request.filters && !request.category) {
  253 |           control.fail = false
  254 |           return {
  255 |             ok: false,
  256 |             error: { code: 'DATABASE_UNAVAILABLE', message: '定向模拟板块题数读取失败' },
  257 |           }
  258 |         }
  259 |         const result = await original(event, request)
  260 |         if (request.filters?.query === '延迟旧条件' && !control.held) {
  261 |           control.held = true
  262 |           await new Promise<void>((done) => {
  263 |             control.release = done
  264 |           })
  265 |           control.finished = true
  266 |         }
  267 |         return result
  268 |       })
  269 |     })
  270 |     await page.getByLabel('题库搜索', { exact: true }).fill('延迟旧条件')
> 271 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
      |                                                                   ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
  272 |     await expect
  273 |       .poll(() => application.evaluate(() => Reflect.get(globalThis, 'boardReadControl').held))
  274 |       .toBe(true)
  275 |     await openPage(page, '知识板块')
  276 |     await board(page, '通信协议')
  277 |       .getByRole('button', { name: '进入板块：通信协议', exact: true })
  278 |       .click()
  279 |     await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
  280 |     await application.evaluate(() => Reflect.get(globalThis, 'boardReadControl').release())
  281 |     await expect
  282 |       .poll(() => application.evaluate(() => Reflect.get(globalThis, 'boardReadControl').finished))
  283 |       .toBe(true)
  284 |     await page.evaluate(
  285 |       () =>
  286 |         new Promise<void>((done) => {
  287 |           const frame = Reflect.get(globalThis, 'requestAnimationFrame') as (cb: () => void) => void
  288 |           frame(() => frame(done))
  289 |         }),
  290 |     )
  291 |     await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
  292 |     await expect(page.getByLabel('题库搜索', { exact: true })).toHaveValue('')
  293 |     await application.evaluate(() => {
  294 |       Reflect.get(globalThis, 'boardReadControl').fail = true
  295 |     })
  296 |     await openPage(page, '知识板块')
  297 |     await expect(page.getByRole('alert')).toContainText('定向模拟板块题数读取失败')
  298 |     await expect(page.locator('.board-card')).toHaveCount(0)
  299 |     await page.getByRole('button', { name: '重新读取板块', exact: true }).click()
  300 |     await expect(board(page, '通信协议').locator('.board-count')).toHaveText('23 题')
  301 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  302 |   } finally {
  303 |     await application
  304 |       .evaluate(() => Reflect.get(globalThis, 'boardReadControl')?.release?.())
  305 |       .catch(() => {})
  306 |     await stop(application)
  307 |   }
  308 | })
  309 | 
  310 | test('板块入口：实际数量/分页/归档一致，自定义与未分类可达，易中难筛选沿用原值', async ({
  311 |   testDataDirectory,
  312 | }, info) => {
  313 |   const { application, page, paths } = await prepare(testDataDirectory, info.project.name)
  314 |   try {
  315 |     await runtime(application, page, testDataDirectory, info)
  316 |     await openPage(page, '知识板块')
  317 |     await expect(board(page, '通信协议').locator('.board-count')).toHaveText('23 题')
  318 |     await expect(board(page, '我的重点').locator('.board-count')).toHaveText('3 题')
  319 |     await expect(
  320 |       board(page, '未分类').getByRole('button', { name: '进入板块：未分类', exact: true }),
  321 |     ).toHaveText('未分类 · 1 题')
  322 |     await expect(
  323 |       board(page, '全部题库').getByRole('button', { name: '进入板块：全部题库', exact: true }),
  324 |     ).toHaveText('全部题库 · 27 题')
  325 |     await expect(
  326 |       board(page, '空分类').getByRole('button', { name: '进入板块：空分类', exact: true }),
  327 |     ).toBeDisabled()
  328 |     const enter = board(page, '通信协议').getByRole('button', {
  329 |       name: '进入板块：通信协议',
  330 |       exact: true,
  331 |     })
  332 |     await enter.focus()
  333 |     await enter.press('Enter')
  334 |     await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
  335 |     await expect(page.getByLabel('题库浏览', { exact: true })).toBeFocused()
  336 |     await expect(page.locator('.question-list li')).toHaveCount(20)
  337 |     await expect(page.locator('.question-list .difficulty-badge')).toHaveCount(20)
  338 |     await page.getByRole('button', { name: '下一页', exact: true }).click()
  339 |     await expect(page.locator('.question-list li')).toHaveCount(3)
  340 |     for (const [value, label, count] of [
  341 |       ['基础', '易（基础）', 6],
  342 |       ['进阶', '中（进阶）', 6],
  343 |       ['综合', '难（综合）', 6],
  344 |       ['未分级', '未分级', 5],
  345 |     ] as const) {
  346 |       await page.getByLabel('题库难度', { exact: true }).selectOption({ label })
  347 |       await expect(page.getByLabel('题库难度', { exact: true })).toHaveValue(value)
  348 |       await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  349 |       await expect(page.getByText(`共 ${count} 题`, { exact: true })).toBeVisible()
  350 |       await expect(
  351 |         page.locator('.question-list').getByLabel(`难度：${label}`, { exact: true }),
  352 |       ).toHaveCount(count)
  353 |     }
  354 |     await page.getByLabel('题库搜索', { exact: true }).fill('不会匹配')
  355 |     await page.getByLabel('题库只看收藏', { exact: true }).check()
  356 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  357 |     await expect(page.getByText('共 0 题', { exact: true })).toBeVisible()
  358 |     await openPage(page, '知识板块')
  359 |     await board(page, '通信协议')
  360 |       .getByRole('button', { name: '进入板块：通信协议', exact: true })
  361 |       .click()
  362 |     await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
  363 |     await expect(page.getByLabel('题库搜索', { exact: true })).toHaveValue('')
  364 |     await expect(page.getByLabel('题库难度', { exact: true })).toHaveValue('')
  365 |     await expect(page.getByLabel('题库只看收藏', { exact: true })).not.toBeChecked()
  366 |     await expect(page.getByRole('navigation', { name: '题目分页', exact: true })).toContainText(
  367 |       '1 / 2',
  368 |     )
  369 |     await page.locator('.question-list li > button').first().click()
  370 |     await expect(
  371 |       page
```