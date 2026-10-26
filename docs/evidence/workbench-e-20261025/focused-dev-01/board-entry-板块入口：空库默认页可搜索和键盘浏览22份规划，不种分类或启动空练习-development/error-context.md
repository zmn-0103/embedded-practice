# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: board-entry.spec.ts >> 板块入口：空库默认页可搜索和键盘浏览22份规划，不种分类或启动空练习
- Location: tests\e2e\board-entry.spec.ts:94:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('article', { name: '板块：C语言', exact: true })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('article', { name: '板块：C语言', exact: true }) with timeout 10000ms
  - waiting for getByRole('article', { name: '板块：C语言', exact: true })

```

```yaml
- banner:
  - heading "嵌入式刷题本" [level=1]
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
  - strong: 学习总览
  - text: 本地离线
  - group: 外观
  - region "学习总览工作区":
    - paragraph: 从上次停下的地方继续
    - heading "继续你的嵌入式学习" [level=2]
    - paragraph: 先独立思考，再对照答案。每一轮积累都保存在本机。
    - region "当前练习概况":
      - heading "开始新练习" [level=3]
      - paragraph: 选择范围、顺序和题数；确认开始后才创建本轮。
      - button "配置一轮练习"
    - term: 有效题目
    - definition: "0"
    - term: 已揭晓
    - definition: "0"
    - term: 已自评
    - definition: "0"
    - term: 收藏
    - definition: "0"
    - paragraph: 全部有效题目，按题目身份和当前内容版本去重。自评是个人判断。
    - heading "从导入你的题库开始" [level=3]
    - paragraph: 在题库页选择 Markdown 文件，或导出模板在程序外填写。
    - button "导入题库或导出模板"
    - region "本机知识板块":
      - heading "知识板块" [level=3]
      - button "查看全部板块"
      - paragraph: 本机尚未创建分类。可先查看规划板块或导入专题。
    - region "复习筛选入口":
      - heading "复习入口" [level=3]
      - button "不会 0 题 · 去筛选":
        - strong: 不会
        - text: 0 题 · 去筛选
      - button "不熟 0 题 · 去筛选":
        - strong: 不熟
        - text: 0 题 · 去筛选
      - button "内容更新待复习 0 题 · 去筛选":
        - strong: 内容更新待复习
        - text: 0 题 · 去筛选
      - paragraph: 只填入题库筛选条件，不会自动开始或替换练习。
  - status:
    - paragraph: 本地数据已就绪
- contentinfo: 离线使用 · 数据保存在本机 V42.11.15 测试版 · 构建 20261025.3-workbench-e
```

# Test source

```ts
  41  |   info: TestInfo,
  42  | ) {
  43  |   const actual = await application.evaluate(({ app }) => ({
  44  |     executable: process.execPath,
  45  |     appPath: app.getAppPath(),
  46  |     packaged: app.isPackaged,
  47  |     userData: app.getPath('userData'),
  48  |     electron: process.versions.electron,
  49  |     node: process.versions.node,
  50  |     arguments: process.argv,
  51  |   }))
  52  |   expect(actual.userData).toBe(directory)
  53  |   expect(actual.packaged).toBe(info.project.name === 'packaged')
  54  |   expect(actual.electron).toBe('42.11.15')
  55  |   if (actual.packaged)
  56  |     expect(resolve(actual.executable)).toBe(
  57  |       resolve(process.env['EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE']!),
  58  |     )
  59  |   else {
  60  |     expect(resolve(actual.appPath)).toBe(resolve('out/main'))
  61  |     expect(actual.arguments).toContain(resolve('out/main/index.js'))
  62  |   }
  63  |   await expect(page.locator('footer')).toContainText('20261025.3-workbench-e')
  64  |   const schema = withHistoryDatabase(directory, (db) => db.prepare('PRAGMA user_version').get())
  65  |   expect(schema).toEqual({ user_version: 10 })
  66  |   await info.attach('runtime.json', {
  67  |     body: JSON.stringify({ ...actual, schema, build: '20261025.3-workbench-e' }, null, 2),
  68  |     contentType: 'application/json',
  69  |   })
  70  | }
  71  | 
  72  | async function prepare(directory: string, project: string) {
  73  |   const source = join(directory, '板块独立样本')
  74  |   await mkdir(source)
  75  |   const paths = ['board-a', 'board-b', 'board-c'].map((id) => join(source, `${id}.md`))
  76  |   await writeFile(paths[0]!, bank('board-a', 'UART板块测试', 23))
  77  |   await writeFile(paths[1]!, bank('board-b', '自定义专题', 3))
  78  |   await writeFile(paths[2]!, bank('board-c', '未归属专题', 1))
  79  |   const instance = await launchApplication(directory, project, '题库')
  80  |   try {
  81  |     await importHistoryFiles(instance.application, instance.page, paths)
  82  |     const communication = await addCategory(instance.page, '通信协议')
  83  |     const personal = await addCategory(instance.page, '我的重点')
  84  |     await addCategory(instance.page, '空分类')
  85  |     await assignTopic(instance.page, 'board-a', communication)
  86  |     await assignTopic(instance.page, 'board-b', personal)
  87  |     return { ...instance, communication, personal, paths }
  88  |   } catch (error) {
  89  |     await stop(instance.application)
  90  |     throw error
  91  |   }
  92  | }
  93  | 
  94  | test('板块入口：空库默认页可搜索和键盘浏览22份规划，不种分类或启动空练习', async ({
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
  113 |     await expect(page.locator('.board-card')).toHaveCount(17)
  114 |     await runtime(application, page, testDataDirectory, info)
  115 |     const c = board(page, 'C语言')
  116 |     await expect(c.locator('.board-count')).toHaveText('0 题 · 待补题')
  117 |     await expect(c.getByRole('button', { name: '进入板块：C语言', exact: true })).toBeDisabled()
  118 |     await c.locator('summary').focus()
  119 |     await c.locator('summary').press('Enter')
  120 |     await expect(c.getByText('数据类型与表达式', { exact: true })).toBeVisible()
  121 |     await page.getByLabel('显示拓展方向', { exact: true }).check()
  122 |     await expect(page.locator('.board-card')).toHaveCount(24)
  123 |     await page.getByLabel('显示拓展方向', { exact: true }).uncheck()
  124 |     const search = page.getByRole('searchbox', { name: '搜索板块', exact: true })
  125 |     await search.fill('Linux')
  126 |     await expect(page.locator('.board-card')).toHaveCount(2)
  127 |     await search.fill('Verilog')
  128 |     await expect(board(page, 'FPGA与数字设计')).toBeVisible()
  129 |     await search.fill('不存在的规划方向')
  130 |     await expect(page.getByText('没有匹配板块，请调整或清空搜索。', { exact: true })).toBeVisible()
  131 |     await search.fill('')
  132 |     await captureHistory(application, page, info, 'boards-empty.png')
  133 |     await page.getByRole('button', { name: '按条件开始练习', exact: true }).focus()
  134 |     await page.getByRole('button', { name: '按条件开始练习', exact: true }).press('Enter')
  135 |     await expect(page.locator('#main-content')).toBeFocused()
  136 |     await expect(page.getByRole('button', { name: '开始练习', exact: true })).toBeDisabled()
  137 |     expect(historySnapshot(testDataDirectory).sessions).toEqual([])
  138 |     expect((await categoryList(page)).categories).toEqual([])
  139 |     await page.context().setOffline(true)
  140 |     await page.reload()
> 141 |     await expect(board(page, 'C语言')).toBeVisible()
      |                                      ^ Error: expect(locator).toBeVisible() failed
  142 |     await expect(page.getByRole('status')).toHaveText('本地数据已就绪')
  143 |   } finally {
  144 |     await stop(application)
  145 |   }
  146 | })
  147 | 
  148 | test('板块入口：改名移动移除后旧轮队列/草稿/历史/方案逐行保持，正常重开继续原轮', async ({
  149 |   testDataDirectory,
  150 | }, info) => {
  151 |   const prepared = await prepare(testDataDirectory, info.project.name)
  152 |   let instance = { application: prepared.application, page: prepared.page }
  153 |   try {
  154 |     await openPage(instance.page, '开始练习')
  155 |     await instance.page.getByText('按分类选择专题', { exact: true }).click()
  156 |     await instance.page.getByRole('button', { name: '练习分类：通信协议', exact: true }).click()
  157 |     await instance.page.getByLabel('练习专题', { exact: true }).selectOption('board-a')
  158 |     await instance.page.getByLabel('本轮题数', { exact: true }).selectOption('all')
  159 |     await instance.page.getByRole('button', { name: '开始练习', exact: true }).click()
  160 |     await instance.page
  161 |       .getByRole('textbox', { name: '我的答案', exact: true })
  162 |       .fill('第一题合成作答')
  163 |     await instance.page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  164 |     await instance.page.getByRole('button', { name: '掌握', exact: true }).click()
  165 |     await expect(instance.page.getByLabel('练习进度')).toHaveText('第 2 / 23 题 · 顺序练习')
  166 |     const draft = '板块调整前的第二题草稿\n    keep_original_queue();'
  167 |     await instance.page.getByRole('textbox', { name: '我的答案', exact: true }).fill(draft)
  168 |     await instance.page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
  169 |     await instance.page.getByText('筛选练习题目', { exact: true }).click()
  170 |     await instance.page.getByLabel('练习难度', { exact: true }).selectOption('进阶')
  171 |     const plan = await savePlan(instance.page, '保留原条件的中等练习')
  172 |     expect(plan.options.filters.difficulty).toBe('进阶')
  173 |     const protectedRows = historySnapshot(testDataDirectory)
  174 |     const plans = await readPlans(instance.page)
  175 |     await openPage(instance.page, '题库')
  176 |     const manager = await openCategoryManager(instance.page)
  177 |     await manager.getByLabel('要修改的分类', { exact: true }).selectOption(prepared.communication)
  178 |     await manager.getByLabel('分类新名称', { exact: true }).fill('我的通信复习')
  179 |     await manager.getByRole('button', { name: '保存分类名称', exact: true }).click()
  180 |     await expect
  181 |       .poll(
  182 |         async () =>
  183 |           (await categoryList(instance.page)).categories.find(
  184 |             (c) => c.categoryId === prepared.communication,
  185 |           )?.title,
  186 |       )
  187 |       .toBe('我的通信复习')
  188 |     await assignTopic(instance.page, 'board-a', prepared.personal)
  189 |     await categoryChange(instance.page, { kind: 'delete', categoryId: prepared.communication })
  190 |     expect(historySnapshot(testDataDirectory)).toEqual(protectedRows)
  191 |     expect(await readPlans(instance.page)).toEqual(plans)
  192 |     await openPage(instance.page, '知识板块')
  193 |     await expect(board(instance.page, '通信协议').locator('.board-count')).toHaveText(
  194 |       '0 题 · 待补题',
  195 |     )
  196 |     await expect(board(instance.page, '我的重点').locator('.board-count')).toHaveText('26 题')
  197 |     await expect(
  198 |       instance.page.getByRole('region', { name: '继续上次练习', exact: true }),
  199 |     ).toContainText('第 2 / 23 题')
  200 |     const closed = instance.application.waitForEvent('close')
  201 |     await instance.application.evaluate(({ BrowserWindow }) =>
  202 |       BrowserWindow.getAllWindows()[0]!.close(),
  203 |     )
  204 |     await closed
  205 |     instance = await launchApplication(testDataDirectory, info.project.name, '知识板块')
  206 |     await runtime(instance.application, instance.page, testDataDirectory, info)
  207 |     expect(historySnapshot(testDataDirectory)).toEqual(protectedRows)
  208 |     expect(await readPlans(instance.page)).toEqual(plans)
  209 |     const panel = await openPlans(instance.page)
  210 |     await panel.getByLabel('选用练习方案', { exact: true }).selectOption(plan.planId)
  211 |     await expect(panel).toContainText('难度：中（进阶）')
  212 |     await expect(
  213 |       panel.getByRole('button', { name: '将方案填入练习条件', exact: true }),
  214 |     ).toBeDisabled()
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
```