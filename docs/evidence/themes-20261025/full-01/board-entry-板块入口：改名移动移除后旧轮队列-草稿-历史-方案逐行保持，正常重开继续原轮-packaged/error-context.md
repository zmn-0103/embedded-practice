# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: board-entry.spec.ts >> 板块入口：改名移动移除后旧轮队列/草稿/历史/方案逐行保持，正常重开继续原轮
- Location: tests\e2e\board-entry.spec.ts:143:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByLabel('难度：中（进阶）', { exact: true })
Expected: visible
Error: strict mode violation: getByLabel('难度：中（进阶）', { exact: true }) resolved to 2 elements:
    1) <span aria-label="难度：中（进阶）" class="difficulty-badge difficulty-medium">中（进阶）</span> aka getByRole('paragraph').filter({ hasText: 'UART板块测试 · 中（进阶） · 板块样本' }).getByLabel('难度：中（进阶）')
    2) <span aria-label="难度：中（进阶）" class="difficulty-badge difficulty-medium">中（进阶）</span> aka getByLabel('练习辅助面板').getByLabel('难度：中（进阶）')

Call log:
  - Expect "toBeVisible" getByLabel('难度：中（进阶）', { exact: true }) with timeout 10000ms
  - waiting for getByLabel('难度：中（进阶）', { exact: true })

```

# Test source

```ts
  116 |     await page.getByLabel('显示拓展方向', { exact: true }).check()
  117 |     await expect(page.locator('.board-card')).toHaveCount(24)
  118 |     await page.getByLabel('显示拓展方向', { exact: true }).uncheck()
  119 |     const search = page.getByRole('searchbox', { name: '搜索板块', exact: true })
  120 |     await search.fill('Linux')
  121 |     await expect(page.locator('.board-card')).toHaveCount(2)
  122 |     await search.fill('Verilog')
  123 |     await expect(board(page, 'FPGA与数字设计')).toBeVisible()
  124 |     await search.fill('不存在的规划方向')
  125 |     await expect(page.getByText('没有匹配板块，请调整或清空搜索。', { exact: true })).toBeVisible()
  126 |     await search.fill('')
  127 |     await captureHistory(application, page, info, 'boards-empty.png')
  128 |     await page.getByRole('button', { name: '按条件开始练习', exact: true }).focus()
  129 |     await page.getByRole('button', { name: '按条件开始练习', exact: true }).press('Enter')
  130 |     await expect(page.locator('#main-content')).toBeFocused()
  131 |     await expect(page.getByRole('button', { name: '开始练习', exact: true })).toBeDisabled()
  132 |     expect(historySnapshot(testDataDirectory).sessions).toEqual([])
  133 |     expect((await categoryList(page)).categories).toEqual([])
  134 |     await page.context().setOffline(true)
  135 |     await page.reload()
  136 |     await expect(board(page, 'C语言')).toBeVisible()
  137 |     await expect(page.getByRole('status')).toHaveText('本地数据已就绪')
  138 |   } finally {
  139 |     await stop(application)
  140 |   }
  141 | })
  142 | 
  143 | test('板块入口：改名移动移除后旧轮队列/草稿/历史/方案逐行保持，正常重开继续原轮', async ({
  144 |   testDataDirectory,
  145 | }, info) => {
  146 |   const prepared = await prepare(testDataDirectory, info.project.name)
  147 |   let instance = { application: prepared.application, page: prepared.page }
  148 |   try {
  149 |     await openPage(instance.page, '开始练习')
  150 |     await instance.page.getByText('按分类选择专题', { exact: true }).click()
  151 |     await instance.page.getByRole('button', { name: '练习分类：通信协议', exact: true }).click()
  152 |     await instance.page.getByLabel('练习专题', { exact: true }).selectOption('board-a')
  153 |     await instance.page.getByLabel('本轮题数', { exact: true }).selectOption('all')
  154 |     await instance.page.getByRole('button', { name: '开始练习', exact: true }).click()
  155 |     await instance.page
  156 |       .getByRole('textbox', { name: '我的答案', exact: true })
  157 |       .fill('第一题合成作答')
  158 |     await instance.page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  159 |     await instance.page.getByRole('button', { name: '掌握', exact: true }).click()
  160 |     await expect(instance.page.getByLabel('练习进度')).toHaveText('第 2 / 23 题 · 顺序练习')
  161 |     const draft = '板块调整前的第二题草稿\n    keep_original_queue();'
  162 |     await instance.page.getByRole('textbox', { name: '我的答案', exact: true }).fill(draft)
  163 |     await instance.page.getByRole('button', { name: '返回首页', exact: true }).click()
  164 |     await instance.page.getByText('筛选练习题目', { exact: true }).click()
  165 |     await instance.page.getByLabel('练习难度', { exact: true }).selectOption('进阶')
  166 |     const plan = await savePlan(instance.page, '保留原条件的中等练习')
  167 |     expect(plan.options.filters.difficulty).toBe('进阶')
  168 |     const protectedRows = historySnapshot(testDataDirectory)
  169 |     const plans = await readPlans(instance.page)
  170 |     await openPage(instance.page, '题库')
  171 |     const manager = await openCategoryManager(instance.page)
  172 |     await manager.getByLabel('要修改的分类', { exact: true }).selectOption(prepared.communication)
  173 |     await manager.getByLabel('分类新名称', { exact: true }).fill('我的通信复习')
  174 |     await manager.getByRole('button', { name: '保存分类名称', exact: true }).click()
  175 |     await expect
  176 |       .poll(
  177 |         async () =>
  178 |           (await categoryList(instance.page)).categories.find(
  179 |             (c) => c.categoryId === prepared.communication,
  180 |           )?.title,
  181 |       )
  182 |       .toBe('我的通信复习')
  183 |     await assignTopic(instance.page, 'board-a', prepared.personal)
  184 |     await categoryChange(instance.page, { kind: 'delete', categoryId: prepared.communication })
  185 |     expect(historySnapshot(testDataDirectory)).toEqual(protectedRows)
  186 |     expect(await readPlans(instance.page)).toEqual(plans)
  187 |     await openPage(instance.page, '板块')
  188 |     await expect(board(instance.page, '通信协议').locator('.board-count')).toHaveText(
  189 |       '0 题 · 待补题',
  190 |     )
  191 |     await expect(board(instance.page, '我的重点').locator('.board-count')).toHaveText('26 题')
  192 |     await expect(
  193 |       instance.page.getByRole('region', { name: '继续上次练习', exact: true }),
  194 |     ).toContainText('第 2 / 23 题')
  195 |     const closed = instance.application.waitForEvent('close')
  196 |     await instance.application.evaluate(({ BrowserWindow }) =>
  197 |       BrowserWindow.getAllWindows()[0]!.close(),
  198 |     )
  199 |     await closed
  200 |     instance = await launchApplication(testDataDirectory, info.project.name, '板块')
  201 |     await runtime(instance.application, instance.page, testDataDirectory, info)
  202 |     expect(historySnapshot(testDataDirectory)).toEqual(protectedRows)
  203 |     expect(await readPlans(instance.page)).toEqual(plans)
  204 |     const panel = await openPlans(instance.page)
  205 |     await panel.getByLabel('选用练习方案', { exact: true }).selectOption(plan.planId)
  206 |     await expect(panel).toContainText('难度：中（进阶）')
  207 |     await expect(
  208 |       panel.getByRole('button', { name: '将方案填入练习条件', exact: true }),
  209 |     ).toBeDisabled()
  210 |     await openPage(instance.page, '板块')
  211 |     await instance.page.getByRole('button', { name: '继续练习', exact: true }).click()
  212 |     await expect(instance.page.getByLabel('练习进度')).toHaveText('第 2 / 23 题 · 顺序练习')
  213 |     await expect(instance.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  214 |       draft,
  215 |     )
> 216 |     await expect(instance.page.getByLabel('难度：中（进阶）', { exact: true })).toBeVisible()
      |                                                                         ^ Error: expect(locator).toBeVisible() failed
  217 |     await expect(instance.page.getByText('BOARD-ANSWER-board-a-2', { exact: true })).toHaveCount(0)
  218 |     expect(historySnapshot(testDataDirectory)).toEqual(protectedRows)
  219 |     await info.attach('protected-learning-rows.json', {
  220 |       body: JSON.stringify({ rows: protectedRows, plans }, null, 2),
  221 |       contentType: 'application/json',
  222 |     })
  223 |   } finally {
  224 |     await stop(instance.application)
  225 |   }
  226 | })
  227 | 
  228 | test('板块入口：旧筛选慢响应不能覆盖新板块，计数读取失败明确重试且不写库', async ({
  229 |   testDataDirectory,
  230 | }, info) => {
  231 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  232 |   try {
  233 |     const before = historySnapshot(testDataDirectory)
  234 |     await application.evaluate(({ ipcMain }) => {
  235 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:list-questions')
  236 |       const control = {
  237 |         held: false,
  238 |         finished: false,
  239 |         fail: false,
  240 |         release: undefined as (() => void) | undefined,
  241 |       }
  242 |       Reflect.set(globalThis, 'boardReadControl', control)
  243 |       ipcMain.removeHandler('library:list-questions')
  244 |       ipcMain.handle('library:list-questions', async (event, request) => {
  245 |         if (control.fail && request.topicId === null && !request.filters && !request.category) {
  246 |           control.fail = false
  247 |           return {
  248 |             ok: false,
  249 |             error: { code: 'DATABASE_UNAVAILABLE', message: '定向模拟板块题数读取失败' },
  250 |           }
  251 |         }
  252 |         const result = await original(event, request)
  253 |         if (request.filters?.query === '延迟旧条件' && !control.held) {
  254 |           control.held = true
  255 |           await new Promise<void>((done) => {
  256 |             control.release = done
  257 |           })
  258 |           control.finished = true
  259 |         }
  260 |         return result
  261 |       })
  262 |     })
  263 |     await page.getByLabel('题库搜索', { exact: true }).fill('延迟旧条件')
  264 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  265 |     await expect
  266 |       .poll(() => application.evaluate(() => Reflect.get(globalThis, 'boardReadControl').held))
  267 |       .toBe(true)
  268 |     await openPage(page, '板块')
  269 |     await board(page, '通信协议')
  270 |       .getByRole('button', { name: '进入板块：通信协议', exact: true })
  271 |       .click()
  272 |     await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
  273 |     await application.evaluate(() => Reflect.get(globalThis, 'boardReadControl').release())
  274 |     await expect
  275 |       .poll(() => application.evaluate(() => Reflect.get(globalThis, 'boardReadControl').finished))
  276 |       .toBe(true)
  277 |     await page.evaluate(
  278 |       () =>
  279 |         new Promise<void>((done) => {
  280 |           const frame = Reflect.get(globalThis, 'requestAnimationFrame') as (cb: () => void) => void
  281 |           frame(() => frame(done))
  282 |         }),
  283 |     )
  284 |     await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
  285 |     await expect(page.getByLabel('题库搜索', { exact: true })).toHaveValue('')
  286 |     await application.evaluate(() => {
  287 |       Reflect.get(globalThis, 'boardReadControl').fail = true
  288 |     })
  289 |     await openPage(page, '板块')
  290 |     await expect(page.getByRole('alert')).toContainText('定向模拟板块题数读取失败')
  291 |     await expect(page.locator('.board-card')).toHaveCount(0)
  292 |     await page.getByRole('button', { name: '重新读取板块', exact: true }).click()
  293 |     await expect(board(page, '通信协议').locator('.board-count')).toHaveText('23 题')
  294 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  295 |   } finally {
  296 |     await application
  297 |       .evaluate(() => Reflect.get(globalThis, 'boardReadControl')?.release?.())
  298 |       .catch(() => {})
  299 |     await stop(application)
  300 |   }
  301 | })
  302 | 
  303 | test('板块入口：实际数量/分页/归档一致，自定义与未分类可达，易中难筛选沿用原值', async ({
  304 |   testDataDirectory,
  305 | }, info) => {
  306 |   const { application, page, paths } = await prepare(testDataDirectory, info.project.name)
  307 |   try {
  308 |     await runtime(application, page, testDataDirectory, info)
  309 |     await openPage(page, '板块')
  310 |     await expect(board(page, '通信协议').locator('.board-count')).toHaveText('23 题')
  311 |     await expect(board(page, '我的重点').locator('.board-count')).toHaveText('3 题')
  312 |     await expect(board(page, '未分类').locator('.board-count')).toHaveText('1 题')
  313 |     await expect(board(page, '全部题库').locator('.board-count')).toHaveText('27 题')
  314 |     await expect(
  315 |       board(page, '空分类').getByRole('button', { name: '进入板块：空分类', exact: true }),
  316 |     ).toBeDisabled()
```