# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: board-entry.spec.ts >> 板块入口：改名移动移除后旧轮队列/草稿/历史/方案逐行保持，正常重开继续原轮
- Location: tests\e2e\board-entry.spec.ts:151:5

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 1

@@ -1,9 +1,9 @@
  Array [
    Object {
      "lastUsedAt": null,
-     "matchingCount": 6,
+     "matchingCount": 0,
      "name": "保留原条件的中等练习",
      "options": Object {
        "category": Object {
          "categoryId": "1d8b35d9-02e1-441e-bb69-e4db2bc09f0d",
          "kind": "category",
```

# Test source

```ts
  95  |   testDataDirectory,
  96  | }, info) => {
  97  |   const { application, page } = await launchApplication(
  98  |     testDataDirectory,
  99  |     info.project.name,
  100 |     '知识板块',
  101 |   )
  102 |   try {
  103 |     await page.reload()
  104 |     await expect(page.getByRole('link', { name: '学习总览', exact: true })).toHaveAttribute(
  105 |       'aria-current',
  106 |       'page',
  107 |     )
  108 |     await openPage(page, '知识板块')
  109 |     await expect(page.getByRole('link', { name: '知识板块', exact: true })).toHaveAttribute(
  110 |       'aria-current',
  111 |       'page',
  112 |     )
  113 |     await expect(page.locator('.board-card')).toHaveCount(15)
  114 |     await runtime(application, page, testDataDirectory, info)
  115 |     const c = board(page, 'C语言')
  116 |     await expect(c.locator('.board-count')).toHaveText('0 题 · 待补题')
  117 |     await expect(c.getByRole('button', { name: '进入板块：C语言', exact: true })).toBeDisabled()
  118 |     await c.locator('summary').focus()
  119 |     await c.locator('summary').press('Enter')
  120 |     await expect(c.getByText('数据类型与表达式', { exact: true })).toBeVisible()
  121 |     await page.getByLabel('显示拓展方向', { exact: true }).check()
  122 |     await expect(page.locator('.board-card')).toHaveCount(22)
  123 |     await page.getByLabel('显示拓展方向', { exact: true }).uncheck()
  124 |     const search = page.getByRole('searchbox', { name: '搜索板块', exact: true })
  125 |     await search.fill('Linux')
  126 |     await expect(page.locator('.board-card')).toHaveCount(2)
  127 |     await search.fill('Verilog')
  128 |     await expect(board(page, 'FPGA与数字设计')).toBeVisible()
  129 |     await search.fill('不存在的规划方向')
  130 |     await expect(
  131 |       page.getByText('没有匹配板块，请调整搜索或有题筛选。', { exact: true }),
  132 |     ).toBeVisible()
  133 |     await search.fill('')
  134 |     await captureHistory(application, page, info, 'boards-empty.png')
  135 |     await page.getByRole('button', { name: '按条件开始练习', exact: true }).focus()
  136 |     await page.getByRole('button', { name: '按条件开始练习', exact: true }).press('Enter')
  137 |     await expect(page.locator('#main-content')).toBeFocused()
  138 |     await expect(page.getByRole('button', { name: '开始练习', exact: true })).toBeDisabled()
  139 |     expect(historySnapshot(testDataDirectory).sessions).toEqual([])
  140 |     expect((await categoryList(page)).categories).toEqual([])
  141 |     await page.context().setOffline(true)
  142 |     await page.reload()
  143 |     await openPage(page, '知识板块')
  144 |     await expect(board(page, 'C语言')).toBeVisible()
  145 |     await expect(page.getByRole('status')).toHaveText('本地数据已就绪')
  146 |   } finally {
  147 |     await stop(application)
  148 |   }
  149 | })
  150 | 
  151 | test('板块入口：改名移动移除后旧轮队列/草稿/历史/方案逐行保持，正常重开继续原轮', async ({
  152 |   testDataDirectory,
  153 | }, info) => {
  154 |   const prepared = await prepare(testDataDirectory, info.project.name)
  155 |   let instance = { application: prepared.application, page: prepared.page }
  156 |   try {
  157 |     await openPage(instance.page, '开始练习')
  158 |     await instance.page.getByText('按分类选择专题', { exact: true }).click()
  159 |     await instance.page.getByRole('button', { name: '练习分类：通信协议', exact: true }).click()
  160 |     await instance.page.getByLabel('练习专题', { exact: true }).selectOption('board-a')
  161 |     await instance.page.getByLabel('本轮题数', { exact: true }).selectOption('all')
  162 |     await instance.page.getByRole('button', { name: '开始练习', exact: true }).click()
  163 |     await instance.page
  164 |       .getByRole('textbox', { name: '我的答案', exact: true })
  165 |       .fill('第一题合成作答')
  166 |     await instance.page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  167 |     await instance.page.getByRole('button', { name: '掌握', exact: true }).click()
  168 |     await expect(instance.page.getByLabel('练习进度')).toHaveText('第 2 / 23 题 · 顺序练习')
  169 |     const draft = '板块调整前的第二题草稿\n    keep_original_queue();'
  170 |     await instance.page.getByRole('textbox', { name: '我的答案', exact: true }).fill(draft)
  171 |     await instance.page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
  172 |     await instance.page.getByText('筛选练习题目', { exact: true }).click()
  173 |     await instance.page.getByLabel('练习难度', { exact: true }).selectOption('进阶')
  174 |     const plan = await savePlan(instance.page, '保留原条件的中等练习')
  175 |     expect(plan.options.filters.difficulty).toBe('进阶')
  176 |     const protectedRows = historySnapshot(testDataDirectory)
  177 |     const plans = await readPlans(instance.page)
  178 |     await openPage(instance.page, '题库')
  179 |     const manager = await openCategoryManager(instance.page)
  180 |     await manager.getByRole('button', { name: '修改或移除分类', exact: true }).click()
  181 |     await manager.getByLabel('要修改的分类', { exact: true }).selectOption(prepared.communication)
  182 |     await manager.getByLabel('分类新名称', { exact: true }).fill('我的通信复习')
  183 |     await manager.getByRole('button', { name: '保存分类名称', exact: true }).click()
  184 |     await expect
  185 |       .poll(
  186 |         async () =>
  187 |           (await categoryList(instance.page)).categories.find(
  188 |             (c) => c.categoryId === prepared.communication,
  189 |           )?.title,
  190 |       )
  191 |       .toBe('我的通信复习')
  192 |     await assignTopic(instance.page, 'board-a', prepared.personal)
  193 |     await categoryChange(instance.page, { kind: 'delete', categoryId: prepared.communication })
  194 |     expect(historySnapshot(testDataDirectory)).toEqual(protectedRows)
> 195 |     expect(await readPlans(instance.page)).toEqual(plans)
      |                                            ^ Error: expect(received).toEqual(expected) // deep equality
  196 |     await openPage(instance.page, '知识板块')
  197 |     await expect(board(instance.page, '通信协议').locator('.board-count')).toHaveText(
  198 |       '0 题 · 待补题',
  199 |     )
  200 |     await expect(board(instance.page, '我的重点').locator('.board-count')).toHaveText('26 题')
  201 |     await expect(
  202 |       instance.page.getByRole('region', { name: '继续上次练习', exact: true }),
  203 |     ).toContainText('第 2 / 23 题')
  204 |     const closed = instance.application.waitForEvent('close')
  205 |     await instance.application.evaluate(({ BrowserWindow }) =>
  206 |       BrowserWindow.getAllWindows()[0]!.close(),
  207 |     )
  208 |     await closed
  209 |     instance = await launchApplication(testDataDirectory, info.project.name, '知识板块')
  210 |     await runtime(instance.application, instance.page, testDataDirectory, info)
  211 |     expect(historySnapshot(testDataDirectory)).toEqual(protectedRows)
  212 |     expect(await readPlans(instance.page)).toEqual(plans)
  213 |     const panel = await openPlans(instance.page)
  214 |     await panel.getByLabel('选用练习方案', { exact: true }).selectOption(plan.planId)
  215 |     await expect(panel).toContainText('难度：中（进阶）')
  216 |     await expect(panel.getByRole('button', { name: '填入条件', exact: true })).toBeDisabled()
  217 |     await openPage(instance.page, '知识板块')
  218 |     await instance.page.getByRole('button', { name: '继续练习', exact: true }).click()
  219 |     await expect(instance.page.getByLabel('练习进度')).toHaveText('第 2 / 23 题 · 顺序练习')
  220 |     await expect(instance.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  221 |       draft,
  222 |     )
  223 |     await expect(
  224 |       instance.page.locator('.practice-heading').getByLabel('难度：中（进阶）', { exact: true }),
  225 |     ).toBeVisible()
  226 |     await expect(instance.page.getByText('BOARD-ANSWER-board-a-2', { exact: true })).toHaveCount(0)
  227 |     expect(historySnapshot(testDataDirectory)).toEqual(protectedRows)
  228 |     await info.attach('protected-learning-rows.json', {
  229 |       body: JSON.stringify({ rows: protectedRows, plans }, null, 2),
  230 |       contentType: 'application/json',
  231 |     })
  232 |   } finally {
  233 |     await stop(instance.application)
  234 |   }
  235 | })
  236 | 
  237 | test('板块入口：旧筛选慢响应不能覆盖新板块，计数读取失败明确重试且不写库', async ({
  238 |   testDataDirectory,
  239 | }, info) => {
  240 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  241 |   try {
  242 |     const before = historySnapshot(testDataDirectory)
  243 |     await application.evaluate(({ ipcMain }) => {
  244 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:list-questions')
  245 |       const control = {
  246 |         held: false,
  247 |         finished: false,
  248 |         fail: false,
  249 |         release: undefined as (() => void) | undefined,
  250 |       }
  251 |       Reflect.set(globalThis, 'boardReadControl', control)
  252 |       ipcMain.removeHandler('library:list-questions')
  253 |       ipcMain.handle('library:list-questions', async (event, request) => {
  254 |         if (control.fail && request.topicId === null && !request.filters && !request.category) {
  255 |           control.fail = false
  256 |           return {
  257 |             ok: false,
  258 |             error: { code: 'DATABASE_UNAVAILABLE', message: '定向模拟板块题数读取失败' },
  259 |           }
  260 |         }
  261 |         const result = await original(event, request)
  262 |         if (request.filters?.query === '延迟旧条件' && !control.held) {
  263 |           control.held = true
  264 |           await new Promise<void>((done) => {
  265 |             control.release = done
  266 |           })
  267 |           control.finished = true
  268 |         }
  269 |         return result
  270 |       })
  271 |     })
  272 |     await page.getByLabel('题库搜索', { exact: true }).fill('延迟旧条件')
  273 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  274 |     await expect
  275 |       .poll(() => application.evaluate(() => Reflect.get(globalThis, 'boardReadControl').held))
  276 |       .toBe(true)
  277 |     await openPage(page, '知识板块')
  278 |     await board(page, '通信协议')
  279 |       .getByRole('button', { name: '进入板块：通信协议', exact: true })
  280 |       .click()
  281 |     await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
  282 |     await application.evaluate(() => Reflect.get(globalThis, 'boardReadControl').release())
  283 |     await expect
  284 |       .poll(() => application.evaluate(() => Reflect.get(globalThis, 'boardReadControl').finished))
  285 |       .toBe(true)
  286 |     await page.evaluate(
  287 |       () =>
  288 |         new Promise<void>((done) => {
  289 |           const frame = Reflect.get(globalThis, 'requestAnimationFrame') as (cb: () => void) => void
  290 |           frame(() => frame(done))
  291 |         }),
  292 |     )
  293 |     await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
  294 |     await expect(page.getByLabel('题库搜索', { exact: true })).toHaveValue('')
  295 |     await application.evaluate(() => {
```