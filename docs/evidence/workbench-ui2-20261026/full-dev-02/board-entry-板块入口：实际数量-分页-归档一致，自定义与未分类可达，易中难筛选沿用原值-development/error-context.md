# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: board-entry.spec.ts >> 板块入口：实际数量/分页/归档一致，自定义与未分类可达，易中难筛选沿用原值
- Location: tests\e2e\board-entry.spec.ts:310:5

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator: getByRole('article', { name: '板块：未分类', exact: true }).locator('.board-count')
Expected: "1 题"
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toHaveText" getByRole('article', { name: '板块：未分类', exact: true }).locator('.board-count') with timeout 10000ms
  - waiting for getByRole('article', { name: '板块：未分类', exact: true }).locator('.board-count')

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
  - strong: 知识板块
  - text: 本地离线
  - group: 外观
  - region "板块与继续练习":
    - region "题库板块":
      - paragraph: 按知识方向，找到下一道题
      - heading "题库板块" [level=2]
      - paragraph: 先看规划，再逐步积累自己的题库。
      - button "导入与管理分类"
      - button "按条件开始练习"
      - article "板块：全部题库":
        - button "进入板块：全部题库": 全部题库 · 27 题
      - article "板块：未分类":
        - button "进入板块：未分类": 未分类 · 1 题
      - text: 搜索板块
      - searchbox "搜索板块"
      - checkbox "显示拓展方向"
      - text: 显示拓展方向
      - paragraph: 题数来自本机当前分类中的活动题目。同名分类合并展示；新专题默认未分类，可在管理分类中安排归属。 搜索覆盖全部规划与本机专题，已有题的拓展板块始终显示。
      - paragraph: 显示 17 个知识板块
      - region "基础方向":
        - heading "基础方向 · 15" [level=3]
        - article "板块：C语言":
          - text: 基础板块
          - heading "C语言" [level=3]
          - paragraph: 类型、表达式、内存和可移植代码的基础。
          - paragraph:
            - strong: "0"
            - text: 题 · 待补题
          - button "进入板块：C语言" [disabled]: 查看题库
          - group: 查看专题与范围
        - article "板块：C++语言":
          - text: 基础板块
          - heading "C++语言" [level=3]
          - paragraph: 对象、泛型与资源管理。
          - paragraph:
            - strong: "0"
            - text: 题 · 待补题
          - button "进入板块：C++语言" [disabled]: 查看题库
          - group: 查看专题与范围
        - article "板块：数据结构与算法":
          - text: 基础板块
          - heading "数据结构与算法" [level=3]
          - paragraph: 组织数据、分析复杂度并解决问题。
          - paragraph:
            - strong: "0"
            - text: 题 · 待补题
          - button "进入板块：数据结构与算法" [disabled]: 查看题库
          - group: 查看专题与范围
        - article "板块：处理器与ARM架构":
          - text: 基础板块
          - heading "处理器与ARM架构" [level=3]
          - paragraph: 处理器如何执行程序和访问内存。
          - paragraph:
            - strong: "0"
            - text: 题 · 待补题
          - button "进入板块：处理器与ARM架构" [disabled]: 查看题库
          - group: 查看专题与范围
        - article "板块：MCU与外设原理":
          - text: 基础板块
          - heading "MCU与外设原理" [level=3]
          - paragraph: 不依赖具体芯片的单片机与外设知识。
          - paragraph:
            - strong: "0"
            - text: 题 · 待补题
          - button "进入板块：MCU与外设原理" [disabled]: 查看题库
          - group: 查看专题与范围
        - article "板块：MCU平台与SDK":
          - text: 基础板块
          - heading "MCU平台与SDK" [level=3]
          - paragraph: 具体芯片、寄存器、SDK及平台实现。
          - paragraph:
            - strong: "0"
            - text: 题 · 待补题
          - button "进入板块：MCU平台与SDK" [disabled]: 查看题库
          - group: 查看专题与范围
        - article "板块：通信协议":
          - text: 基础板块
          - heading "通信协议" [level=3]
          - paragraph: 设备互连、总线时序和消息组织。
          - paragraph:
            - strong: "23"
            - text: 题
          - button "进入板块：通信协议": 查看题库
          - group: 查看专题与范围
        - article "板块：计算机网络":
          - text: 基础板块
          - heading "计算机网络" [level=3]
          - paragraph: 从网络分层到连接和故障定位。
          - paragraph:
            - strong: "0"
            - text: 题 · 待补题
          - button "进入板块：计算机网络" [disabled]: 查看题库
          - group: 查看专题与范围
        - article "板块：RTOS与并发":
          - text: 基础板块
          - heading "RTOS与并发" [level=3]
          - paragraph: 调度、同步和实时资源管理。
          - paragraph:
            - strong: "0"
            - text: 题 · 待补题
          - button "进入板块：RTOS与并发" [disabled]: 查看题库
          - group: 查看专题与范围
        - article "板块：Linux系统与应用":
          - text: 基础板块
          - heading "Linux系统与应用" [level=3]
          - paragraph: Linux使用、用户态编程与部署。
          - paragraph:
            - strong: "0"
            - text: 题 · 待补题
          - button "进入板块：Linux系统与应用" [disabled]: 查看题库
          - group: 查看专题与范围
        - article "板块：Linux内核与驱动":
          - text: 基础板块
          - heading "Linux内核与驱动" [level=3]
          - paragraph: 内核机制、设备模型和驱动开发。
          - paragraph:
            - strong: "0"
            - text: 题 · 待补题
          - button "进入板块：Linux内核与驱动" [disabled]: 查看题库
          - group: 查看专题与范围
        - article "板块：硬件与电路基础":
          - text: 基础板块
          - heading "硬件与电路基础" [level=3]
          - paragraph: 读懂电路并理解接口的电气约束。
          - paragraph:
            - strong: "0"
            - text: 题 · 待补题
          - button "进入板块：硬件与电路基础" [disabled]: 查看题库
          - group: 查看专题与范围
        - article "板块：存储与文件系统":
          - text: 基础板块
          - heading "存储与文件系统" [level=3]
          - paragraph: 存储介质、数据组织和掉电一致性。
          - paragraph:
            - strong: "0"
            - text: 题 · 待补题
          - button "进入板块：存储与文件系统" [disabled]: 查看题库
          - group: 查看专题与范围
        - article "板块：编译调试与工程实践":
          - text: 基础板块
          - heading "编译调试与工程实践" [level=3]
          - paragraph: 把代码构建、验证并定位问题。
          - paragraph:
            - strong: "0"
            - text: 题 · 待补题
          - button "进入板块：编译调试与工程实践" [disabled]: 查看题库
          - group: 查看专题与范围
        - article "板块：项目与面试表达":
          - text: 基础板块
          - heading "项目与面试表达" [level=3]
          - paragraph: 用真实证据解释方案、职责与取舍。
          - paragraph:
            - strong: "0"
            - text: 题 · 待补题
          - button "进入板块：项目与面试表达" [disabled]: 查看题库
          - group: 查看专题与范围
      - region "本机自定义分类":
        - heading "本机自定义分类 · 2" [level=3]
        - article "板块：我的重点":
          - text: 自定义
          - heading "我的重点" [level=3]
          - paragraph: 本机自定义分类，沿用原有专题归属。
          - paragraph:
            - strong: "3"
            - text: 题
          - button "进入板块：我的重点": 查看题库
          - group: 查看专题与范围
        - article "板块：空分类":
          - text: 自定义
          - heading "空分类" [level=3]
          - paragraph: 本机自定义分类，沿用原有专题归属。
          - paragraph:
            - strong: "0"
            - text: 题 · 待补题
          - button "进入板块：空分类" [disabled]: 查看题库
          - group: 查看专题与范围
  - status:
    - paragraph: 本地数据已就绪
- contentinfo: 离线使用 · 数据保存在本机 V42.11.15 测试版 · 构建 20261026.1-workbench-e-ui2
```

# Test source

```ts
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
  271 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
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
> 319 |     await expect(board(page, '未分类').locator('.board-count')).toHaveText('1 题')
      |                                                              ^ Error: expect(locator).toHaveText(expected) failed
  320 |     await expect(board(page, '全部题库').locator('.board-count')).toHaveText('27 题')
  321 |     await expect(
  322 |       board(page, '空分类').getByRole('button', { name: '进入板块：空分类', exact: true }),
  323 |     ).toBeDisabled()
  324 |     const enter = board(page, '通信协议').getByRole('button', {
  325 |       name: '进入板块：通信协议',
  326 |       exact: true,
  327 |     })
  328 |     await enter.focus()
  329 |     await enter.press('Enter')
  330 |     await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
  331 |     await expect(page.getByLabel('题库浏览', { exact: true })).toBeFocused()
  332 |     await expect(page.locator('.question-list li')).toHaveCount(20)
  333 |     await expect(page.locator('.question-list .difficulty-badge')).toHaveCount(20)
  334 |     await page.getByRole('button', { name: '下一页', exact: true }).click()
  335 |     await expect(page.locator('.question-list li')).toHaveCount(3)
  336 |     for (const [value, label, count] of [
  337 |       ['基础', '易（基础）', 6],
  338 |       ['进阶', '中（进阶）', 6],
  339 |       ['综合', '难（综合）', 6],
  340 |       ['未分级', '未分级', 5],
  341 |     ] as const) {
  342 |       await page.getByLabel('题库难度', { exact: true }).selectOption({ label })
  343 |       await expect(page.getByLabel('题库难度', { exact: true })).toHaveValue(value)
  344 |       await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  345 |       await expect(page.getByText(`共 ${count} 题`, { exact: true })).toBeVisible()
  346 |       await expect(
  347 |         page.locator('.question-list').getByLabel(`难度：${label}`, { exact: true }),
  348 |       ).toHaveCount(count)
  349 |     }
  350 |     await page.getByLabel('题库搜索', { exact: true }).fill('不会匹配')
  351 |     await page.getByLabel('题库只看收藏', { exact: true }).check()
  352 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  353 |     await expect(page.getByText('共 0 题', { exact: true })).toBeVisible()
  354 |     await openPage(page, '知识板块')
  355 |     await board(page, '通信协议')
  356 |       .getByRole('button', { name: '进入板块：通信协议', exact: true })
  357 |       .click()
  358 |     await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
  359 |     await expect(page.getByLabel('题库搜索', { exact: true })).toHaveValue('')
  360 |     await expect(page.getByLabel('题库难度', { exact: true })).toHaveValue('')
  361 |     await expect(page.getByLabel('题库只看收藏', { exact: true })).not.toBeChecked()
  362 |     await expect(page.getByRole('navigation', { name: '题目分页', exact: true })).toContainText(
  363 |       '1 / 2',
  364 |     )
  365 |     await page.locator('.question-list li > button').first().click()
  366 |     await expect(
  367 |       page
  368 |         .getByRole('article', { name: '题目内容', exact: true })
  369 |         .getByLabel('难度：易（基础）', { exact: true }),
  370 |     ).toBeVisible()
  371 |     for (const [title, count] of [
  372 |       ['我的重点', 3],
  373 |       ['未分类', 1],
  374 |       ['全部题库', 27],
  375 |     ] as const) {
  376 |       await openPage(page, '知识板块')
  377 |       await board(page, title)
  378 |         .getByRole('button', { name: `进入板块：${title}`, exact: true })
  379 |         .click()
  380 |       await expect(page.getByText(`共 ${count} 题`, { exact: true })).toBeVisible()
  381 |     }
  382 |     await writeFile(paths[0]!, bank('board-a', 'UART板块测试', 23, true))
  383 |     await importHistoryFiles(application, page, [paths[0]!])
  384 |     await openPage(page, '知识板块')
  385 |     await expect(board(page, '通信协议').locator('.board-count')).toHaveText('22 题')
  386 |     await board(page, '通信协议')
  387 |       .getByRole('button', { name: '查看归档：通信协议', exact: true })
  388 |       .click()
  389 |     await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
  390 |     await expect(page.getByLabel('查看归档题目', { exact: true })).toBeChecked()
  391 |     await expect(page.locator('.question-list li')).toHaveCount(1)
  392 |   } finally {
  393 |     await stop(application)
  394 |   }
  395 | })
  396 | 
  397 | test('板块入口：900/1440窗口、四配色明暗、22px与键盘可用，难度文字对比度通过', async ({
  398 |   testDataDirectory,
  399 | }, info) => {
  400 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  401 |   try {
  402 |     const before = historySnapshot(testDataDirectory)
  403 |     const measurements = []
  404 |     for (const palette of ['松间绿', '晴空蓝', '暖沙金', '暮山紫']) {
  405 |       for (const theme of ['light', 'dark'] as const) {
  406 |         await application.evaluate(
  407 |           ({ BrowserWindow }, width) => BrowserWindow.getAllWindows()[0]!.setSize(width, 880),
  408 |           theme === 'light' ? 1440 : 900,
  409 |         )
  410 |         await openPage(page, '设置与数据')
  411 |         await page.getByRole('radio', { name: palette, exact: true }).check()
  412 |         await page.getByLabel('显示主题', { exact: true }).selectOption(theme)
  413 |         await page
  414 |           .getByLabel('正文字号', { exact: true })
  415 |           .selectOption(theme === 'dark' ? '22' : '17')
  416 |         await page.getByRole('button', { name: '保存并应用', exact: true }).click()
  417 |         await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
  418 |         await openPage(page, '知识板块')
  419 |         await expect(board(page, '通信协议').locator('.board-count')).toHaveText('23 题')
```