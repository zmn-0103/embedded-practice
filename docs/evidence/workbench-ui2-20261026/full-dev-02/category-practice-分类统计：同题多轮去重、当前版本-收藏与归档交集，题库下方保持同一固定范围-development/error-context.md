# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: category-practice.spec.ts >> 分类统计：同题多轮去重、当前版本/收藏与归档交集，题库下方保持同一固定范围
- Location: tests\e2e\category-practice.spec.ts:123:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByText('按分类查看学习记录', { exact: true })

```

# Test source

```ts
  91  |         ...input,
  92  |         requestId: randomUUID(),
  93  |         replace: {
  94  |           sessionId: position.session.sessionId,
  95  |           position: position.session.position,
  96  |           revision: position.session.revision,
  97  |         },
  98  |       },
  99  |     )
  100 |     expect(replacement).toMatchObject({ ok: false, error: { code: 'NO_QUESTIONS' } })
  101 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  102 |     await instance.application.close()
  103 |     instance = await launchApplication(testDataDirectory, info.project.name)
  104 |     const details = instance.page.getByLabel('本轮创建条件', { exact: true })
  105 |     await details.locator('summary').click()
  106 |     await expect(details).toContainText('分类：板块 A')
  107 |     await instance.page.getByRole('button', { name: '继续练习', exact: true }).click()
  108 |     await expect(instance.page.getByLabel('练习进度', { exact: true })).toContainText('第 2 / 4')
  109 |     await expect(instance.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  110 |       draft,
  111 |     )
  112 |     expect(await current(instance.page)).toEqual(position)
  113 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  114 |     await info.attach('category-queue-reopened.png', {
  115 |       body: await instance.page.screenshot(),
  116 |       contentType: 'image/png',
  117 |     })
  118 |   } finally {
  119 |     await stop(instance.application)
  120 |   }
  121 | })
  122 | 
  123 | test('分类统计：同题多轮去重、当前版本/收藏与归档交集，题库下方保持同一固定范围', async ({
  124 |   testDataDirectory,
  125 | }, info) => {
  126 |   const { application, page, first, paths } = await prepareCategories(
  127 |     testDataDirectory,
  128 |     info.project.name,
  129 |   )
  130 |   try {
  131 |     let replace: StartPractice['replace'] = null
  132 |     for (let round = 0; round < 2; round++) {
  133 |       await start(page, {
  134 |         requestId: randomUUID(),
  135 |         topicId: 'cat-a',
  136 |         category: { kind: 'category', categoryId: first },
  137 |         mode: 'sequential',
  138 |         count: 'all',
  139 |         replace,
  140 |       })
  141 |       let view = await current(page)
  142 |       const draft = { revision: 0, text: '' }
  143 |       const cursor = () => ({
  144 |         sessionId: view.session.sessionId,
  145 |         position: view.session.position,
  146 |         revision: view.session.revision,
  147 |       })
  148 |       expect(
  149 |         await page.evaluate(
  150 |           (request) =>
  151 |             (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.reveal(request),
  152 |           { requestId: randomUUID(), cursor: cursor(), draft },
  153 |         ),
  154 |       ).toMatchObject({ ok: true })
  155 |       view = await current(page)
  156 |       expect(
  157 |         await page.evaluate(
  158 |           (request) =>
  159 |             (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.rateAndAdvance(
  160 |               request,
  161 |             ),
  162 |           { requestId: randomUUID(), cursor: cursor(), draft, rating: '不熟' as const },
  163 |         ),
  164 |       ).toMatchObject({ ok: true })
  165 |       view = await current(page)
  166 |       replace = cursor()
  167 |     }
  168 |     expect(
  169 |       await page.evaluate(() =>
  170 |         (globalThis as unknown as { desktop: DesktopApi }).desktop.library.setFavorite({
  171 |           topicId: 'cat-a',
  172 |           questionId: 'q-1',
  173 |           favorite: true,
  174 |         }),
  175 |       ),
  176 |     ).toMatchObject({ ok: true })
  177 |     expect(
  178 |       await readLearning(page, {
  179 |         category: { kind: 'category', categoryId: first },
  180 |         topicId: null,
  181 |         archived: false,
  182 |       }),
  183 |     ).toMatchObject({
  184 |       total: 4,
  185 |       revealed: 1,
  186 |       rated: 1,
  187 |       favorites: 1,
  188 |       ratings: { 不会: 0, 不熟: 1, 掌握: 0 },
  189 |     })
  190 |     await openRecords(page)
> 191 |     await page.getByText('按分类查看学习记录', { exact: true }).click()
      |                                                        ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
  192 |     await page.getByRole('button', { name: '学习记录分类：板块 A', exact: true }).click()
  193 |     await expectCounts(page, [4, 1, 1, 1, 0], [0, 1, 0])
  194 |     await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
  195 |     await page.getByRole('button', { name: '清空题库筛选', exact: true }).click()
  196 |     await expect(page.getByText('共 4 题', { exact: true })).toBeVisible()
  197 |     await expectCounts(page, [4, 1, 1, 1, 0], [0, 1, 0])
  198 |     await writeFile(paths[0]!, categoryBank('cat-a', 2, true))
  199 |     await importHistoryFiles(application, page, [paths[0]!])
  200 |     expect(
  201 |       (await categoryList(page)).topics.find((item) => item.topicId === 'cat-a')?.categoryId,
  202 |     ).toBe(first)
  203 |     expect(
  204 |       await readLearning(page, {
  205 |         category: { kind: 'category', categoryId: first },
  206 |         topicId: null,
  207 |         archived: false,
  208 |       }),
  209 |     ).toMatchObject({ total: 3, revealed: 0, rated: 0, favorites: 0 })
  210 |     await openRecords(page)
  211 |     await page.getByText('按分类查看学习记录', { exact: true }).click()
  212 |     await page.getByRole('button', { name: '学习记录分类：板块 A', exact: true }).click()
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
  225 |     await page.getByText('按分类查看学习记录', { exact: true }).click()
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
```