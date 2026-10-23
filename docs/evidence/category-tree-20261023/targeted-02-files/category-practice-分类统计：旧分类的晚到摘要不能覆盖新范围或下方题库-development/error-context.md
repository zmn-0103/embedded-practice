# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: category-practice.spec.ts >> 分类统计：旧分类的晚到摘要不能覆盖新范围或下方题库
- Location: tests\e2e\category-practice.spec.ts:220:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /cat-c.*q-1/ })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button', { name: /cat-c.*q-1/ }) with timeout 10000ms
  - waiting for getByRole('button', { name: /cat-c.*q-1/ })

```

```yaml
- banner:
  - heading "嵌入式刷题本" [level=1]
  - paragraph: 思考有迹，积累有序
- navigation "主要页面":
  - link "开始练习":
    - /url: "#practice"
  - link "题库":
    - /url: "#library"
  - link "学习记录":
    - /url: "#records"
  - link "设置与数据":
    - /url: "#settings"
- main:
  - text: 学习记录 离线工作台
  - region "学习记录":
    - heading "学习记录" [level=2]
    - paragraph: 按题去重，仅统计所选范围的当前内容版本；多轮练习不会重复累计题数。
    - group:
      - text: 按分类查看学习记录
      - navigation "学习记录分类导航":
        - text: 查找专题
        - searchbox "学习记录专题检索"
        - paragraph: 检索只收窄导航，选择分类或专题后应用范围。
        - button "全部分类（5题）"
        - list:
          - listitem:
            - button "收起未分类" [expanded]
            - button "学习记录分类：未分类" [pressed]: 未分类（1题）
            - list:
              - listitem:
                - button "学习记录专题：丙专题": 丙专题（1题）
          - listitem:
            - button "展开板块 A"
            - button "学习记录分类：板块 A": 板块 A（4题）
          - listitem:
            - button "展开板块 B"
            - button "学习记录分类：板块 B": 板块 B（0题）
    - text: 学习记录专题
    - combobox "学习记录专题":
      - option "全部专题" [selected]
      - option "丙专题"
    - text: 学习记录范围
    - combobox "学习记录范围":
      - option "活动题目" [selected]
      - option "归档题目"
    - term: 范围内题数
    - definition: "1"
    - term: 已揭晓题数
    - definition: "0"
    - term: 已自评题数
    - definition: "0"
    - term: 收藏题数
    - definition: "0"
    - term: 内容更新待复习题数
    - definition: "0"
    - term: 不会
    - definition: "0"
    - term: 不熟
    - definition: "0"
    - term: 掌握
    - definition: "0"
    - paragraph: 揭晓只计算真实练习记录；仅保存草稿、跳过或查看题库答案不计入。旧数据若只有自评而无作答记录，只计入自评，不补造揭晓或历史。自评是个人判断。
    - heading "题目与单题历史" [level=3]
    - paragraph: 下方默认只看收藏，可取消或调整筛选后查看本范围其他题目。下方筛选不改变上方范围总览，历史需主动展开。
    - region "题库浏览":
      - text: 题库搜索
      - searchbox "题库搜索"
      - text: 标签
      - combobox "题库标签"
      - text: 难度
      - combobox "题库难度":
        - option "全部难度" [selected]
        - option "未分级"
        - option "基础"
        - option "进阶"
        - option "综合"
      - text: 自评状态
      - combobox "题库自评状态":
        - option "全部状态" [selected]
        - option "未练习"
        - option "不会"
        - option "不熟"
        - option "掌握"
      - checkbox "题库只看收藏"
      - text: 只看收藏
      - paragraph: 全部题目，未限定其他条件
      - button "筛选题库"
      - button "清空题库筛选"
      - text: 共 1 题
      - complementary "题目列表":
        - list:
          - listitem:
            - button "丙专题 · q-1 cat-c 问题 1"
        - navigation "题目分页":
          - button "上一页" [disabled]
          - text: 1 / 1
          - button "下一页" [disabled]
      - text: 选择一道题查看内容，再主动展开单题历史。
  - status:
    - paragraph: 本地数据已就绪
- contentinfo: 离线使用 · 数据保存在本机 v42.11.15 · 构建 20261023.4-categories
```

# Test source

```ts
  165 |       replace = cursor()
  166 |     }
  167 |     expect(
  168 |       await page.evaluate(() =>
  169 |         (globalThis as unknown as { desktop: DesktopApi }).desktop.library.setFavorite({
  170 |           topicId: 'cat-a',
  171 |           questionId: 'q-1',
  172 |           favorite: true,
  173 |         }),
  174 |       ),
  175 |     ).toMatchObject({ ok: true })
  176 |     expect(
  177 |       await readLearning(page, {
  178 |         category: { kind: 'category', categoryId: first },
  179 |         topicId: null,
  180 |         archived: false,
  181 |       }),
  182 |     ).toMatchObject({
  183 |       total: 4,
  184 |       revealed: 1,
  185 |       rated: 1,
  186 |       favorites: 1,
  187 |       ratings: { 不会: 0, 不熟: 1, 掌握: 0 },
  188 |     })
  189 |     await openRecords(page)
  190 |     await page.getByText('按分类查看学习记录', { exact: true }).click()
  191 |     await page.getByRole('button', { name: '学习记录分类：板块 A', exact: true }).click()
  192 |     await expectCounts(page, [4, 1, 1, 1, 0], [0, 1, 0])
  193 |     await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
  194 |     await page.getByRole('button', { name: '清空题库筛选', exact: true }).click()
  195 |     await expect(page.getByText('共 4 题', { exact: true })).toBeVisible()
  196 |     await expectCounts(page, [4, 1, 1, 1, 0], [0, 1, 0])
  197 |     await writeFile(paths[0]!, categoryBank('cat-a', 2, true))
  198 |     await importHistoryFiles(application, page, [paths[0]!])
  199 |     expect(
  200 |       (await categoryList(page)).topics.find((item) => item.topicId === 'cat-a')?.categoryId,
  201 |     ).toBe(first)
  202 |     expect(
  203 |       await readLearning(page, {
  204 |         category: { kind: 'category', categoryId: first },
  205 |         topicId: null,
  206 |         archived: false,
  207 |       }),
  208 |     ).toMatchObject({ total: 3, revealed: 0, rated: 0, favorites: 0 })
  209 |     await openRecords(page)
  210 |     await page.getByText('按分类查看学习记录', { exact: true }).click()
  211 |     await page.getByRole('button', { name: '学习记录分类：板块 A', exact: true }).click()
  212 |     await page.getByLabel('学习记录范围', { exact: true }).selectOption('archived')
  213 |     await expectCounts(page, [1, 1, 1, 1, 0], [0, 1, 0])
  214 |     await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
  215 |   } finally {
  216 |     await stop(application)
  217 |   }
  218 | })
  219 | 
  220 | test('分类统计：旧分类的晚到摘要不能覆盖新范围或下方题库', async ({ testDataDirectory }, info) => {
  221 |   const { application, page, first } = await prepareCategories(testDataDirectory, info.project.name)
  222 |   try {
  223 |     await openRecords(page)
  224 |     await page.getByText('按分类查看学习记录', { exact: true }).click()
  225 |     await application.evaluate(({ ipcMain }, id) => {
  226 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('learning:read')
  227 |       let hold = true
  228 |       ipcMain.removeHandler('learning:read')
  229 |       ipcMain.handle('learning:read', async (event, scope) => {
  230 |         const result = await original(event, scope)
  231 |         if (hold && scope.category?.categoryId === id) {
  232 |           hold = false
  233 |           await new Promise<void>((resolve) =>
  234 |             Reflect.set(globalThis, '__releaseCategorySummary', resolve),
  235 |           )
  236 |           Reflect.set(globalThis, '__categorySummaryDelivered', true)
  237 |         }
  238 |         return result
  239 |       })
  240 |     }, first)
  241 |     await page.getByRole('button', { name: '学习记录分类：板块 A', exact: true }).click()
  242 |     await expect
  243 |       .poll(() =>
  244 |         application.evaluate(() => typeof Reflect.get(globalThis, '__releaseCategorySummary')),
  245 |       )
  246 |       .toBe('function')
  247 |     await page.getByRole('button', { name: '学习记录分类：未分类', exact: true }).click()
  248 |     await expectCounts(page, [1, 0, 0, 0, 0], [0, 0, 0])
  249 |     await application.evaluate(() => Reflect.get(globalThis, '__releaseCategorySummary')())
  250 |     await expect
  251 |       .poll(() => application.evaluate(() => Reflect.get(globalThis, '__categorySummaryDelivered')))
  252 |       .toBe(true)
  253 |     await page.evaluate(
  254 |       () =>
  255 |         new Promise((done) =>
  256 |           Reflect.get(
  257 |             globalThis,
  258 |             'requestAnimationFrame',
  259 |           )(() => Reflect.get(globalThis, 'requestAnimationFrame')(done)),
  260 |         ),
  261 |     )
  262 |     await expectCounts(page, [1, 0, 0, 0, 0], [0, 0, 0])
  263 |     await page.getByRole('button', { name: '清空题库筛选', exact: true }).click()
  264 |     await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
> 265 |     await expect(page.getByRole('button', { name: /cat-c.*q-1/ })).toBeVisible()
      |                                                                    ^ Error: expect(locator).toBeVisible() failed
  266 |   } finally {
  267 |     await application
  268 |       .evaluate(() => Reflect.get(globalThis, '__releaseCategorySummary')?.())
  269 |       .catch(() => {})
  270 |     await stop(application)
  271 |   }
  272 | })
  273 | 
  274 | for (const failed of [false, true]) {
  275 |   test(`分类正常关闭等待在途保存：${failed ? '失败返回窗口并保留原目标' : '成功后退出重开保持'}`, async ({
  276 |     testDataDirectory,
  277 |   }, info) => {
  278 |     const prepared = await prepareCategories(testDataDirectory, info.project.name)
  279 |     let instance = { application: prepared.application, page: prepared.page }
  280 |     try {
  281 |       await instance.application.evaluate(({ ipcMain, dialog }, fail) => {
  282 |         const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:update-category')
  283 |         let hold = true
  284 |         ipcMain.removeHandler('library:update-category')
  285 |         ipcMain.handle('library:update-category', async (event, request) => {
  286 |           if (hold && request.kind === 'create' && request.title === '关闭等待分类') {
  287 |             hold = false
  288 |             const result = fail
  289 |               ? { ok: false, error: { code: 'DATABASE_UNAVAILABLE', message: '定向分类保存失败' } }
  290 |               : await original(event, request)
  291 |             await new Promise<void>((resolve) =>
  292 |               Reflect.set(globalThis, '__releaseCategorySave', resolve),
  293 |             )
  294 |             return result
  295 |           }
  296 |           return original(event, request)
  297 |         })
  298 |         dialog.showMessageBox = (async (...args: unknown[]) => {
  299 |           const options = args[args.length - 1] as { defaultId: number; buttons: string[] }
  300 |           if (options.defaultId !== 0 || options.buttons[0] !== '返回窗口')
  301 |             throw new Error('关闭确认默认项不符合预期')
  302 |           return { response: 0, checkboxChecked: false }
  303 |         }) as typeof dialog.showMessageBox
  304 |       }, failed)
  305 |       await instance.page.evaluate(() => {
  306 |         ;(globalThis as unknown as { desktop: DesktopApi }).desktop.practice.onBeforeClose(() => {
  307 |           Reflect.set(globalThis, '__categoryCloseSeen', true)
  308 |         })
  309 |       })
  310 |       const manager = instance.page.locator('.category-manager')
  311 |       await manager.getByLabel('新分类名称', { exact: true }).fill('关闭等待分类')
  312 |       await manager.getByRole('button', { name: '添加分类', exact: true }).click()
  313 |       await expect
  314 |         .poll(() =>
  315 |           instance.application.evaluate(
  316 |             () => typeof Reflect.get(globalThis, '__releaseCategorySave'),
  317 |           ),
  318 |         )
  319 |         .toBe('function')
  320 |       await expect(
  321 |         instance.page.getByRole('link', { name: '设置与数据', exact: true }),
  322 |       ).toHaveAttribute('aria-disabled', 'true')
  323 |       await instance.application.evaluate(({ BrowserWindow }) =>
  324 |         BrowserWindow.getAllWindows()[0]!.close(),
  325 |       )
  326 |       await expect
  327 |         .poll(() => instance.page.evaluate(() => Reflect.get(globalThis, '__categoryCloseSeen')))
  328 |         .toBe(true)
  329 |       expect(instance.application.windows()).toHaveLength(1)
  330 |       if (failed) {
  331 |         await instance.application.evaluate(() =>
  332 |           Reflect.get(globalThis, '__releaseCategorySave')(),
  333 |         )
  334 |         await expect(manager.getByRole('alert')).toContainText('定向分类保存失败')
  335 |         await expect(
  336 |           instance.page.getByRole('link', { name: '设置与数据', exact: true }),
  337 |         ).toHaveAttribute('aria-disabled', 'false')
  338 |         await expect(manager.getByLabel('新分类名称', { exact: true })).toHaveValue('关闭等待分类')
  339 |         await manager.getByRole('button', { name: '添加分类', exact: true }).click()
  340 |         await expect
  341 |           .poll(async () =>
  342 |             (await categoryList(instance.page)).categories.some(
  343 |               (item) => item.title === '关闭等待分类',
  344 |             ),
  345 |           )
  346 |           .toBe(true)
  347 |       } else {
  348 |         const exited = instance.application.waitForEvent('close')
  349 |         await instance.application.evaluate(() =>
  350 |           Reflect.get(globalThis, '__releaseCategorySave')(),
  351 |         )
  352 |         await exited
  353 |         instance = await launchApplication(testDataDirectory, info.project.name, '题库')
  354 |         expect(
  355 |           (await categoryList(instance.page)).categories.some(
  356 |             (item) => item.title === '关闭等待分类',
  357 |           ),
  358 |         ).toBe(true)
  359 |       }
  360 |     } finally {
  361 |       await instance.application
  362 |         .evaluate(() => Reflect.get(globalThis, '__releaseCategorySave')?.())
  363 |         .catch(() => {})
  364 |       await stop(instance.application)
  365 |     }
```