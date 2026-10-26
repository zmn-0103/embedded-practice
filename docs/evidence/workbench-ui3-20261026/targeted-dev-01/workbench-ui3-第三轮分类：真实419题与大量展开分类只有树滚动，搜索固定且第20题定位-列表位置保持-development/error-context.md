# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workbench-ui3.spec.ts >> 第三轮分类：真实419题与大量展开分类只有树滚动，搜索固定且第20题定位/列表位置保持
- Location: tests\e2e\workbench-ui3.spec.ts:93:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('complementary', { name: '题库分类与专题导航', exact: true }).locator('.category-toggle[aria-expanded="false"]').nth(9)

```

# Test source

```ts
  9   | 
  10  | async function size(application: ElectronApplication, width = 1440) {
  11  |   await application.evaluate(
  12  |     ({ BrowserWindow }, width) => BrowserWindow.getAllWindows()[0]!.setContentSize(width, 900),
  13  |     width,
  14  |   )
  15  | }
  16  | 
  17  | async function inView(locator: Locator) {
  18  |   await expect(locator).toBeInViewport({ ratio: 1 })
  19  |   expect((await locator.boundingBox())!.y).toBeGreaterThanOrEqual(0)
  20  | }
  21  | 
  22  | async function capture(page: Page, info: TestInfo, name: string, geometry?: unknown) {
  23  |   await settleWorkbench(page)
  24  |   await info.attach(`${name}.png`, { body: await page.screenshot(), contentType: 'image/png' })
  25  |   if (geometry)
  26  |     await info.attach(`${name}.json`, {
  27  |       body: JSON.stringify(geometry, null, 2),
  28  |       contentType: 'application/json',
  29  |     })
  30  | }
  31  | 
  32  | async function prepareReal(directory: string, info: TestInfo, extraCategories = 0) {
  33  |   const manifest = JSON.parse(
  34  |     await readFile('question-banks/releases/v000-20261024/全量题库清单.json', 'utf8'),
  35  |   ) as { files: { file: string; topicId: string; board: string }[] }
  36  |   const instance = await launchApplication(directory, info.project.name, '题库')
  37  |   try {
  38  |     const runtime = await verifyThemeTarget(
  39  |       instance.application,
  40  |       instance.page,
  41  |       directory,
  42  |       info.project.name,
  43  |     )
  44  |     await info.attach('ui3-runtime.json', {
  45  |       body: JSON.stringify(runtime),
  46  |       contentType: 'application/json',
  47  |     })
  48  |     await size(instance.application)
  49  |     await importHistoryFiles(
  50  |       instance.application,
  51  |       instance.page,
  52  |       manifest.files.map((file) => resolve(file.file)),
  53  |     )
  54  |     await instance.page.evaluate(
  55  |       async ({ files, extraCategories }) => {
  56  |         const api = (globalThis as unknown as { desktop: DesktopApi }).desktop
  57  |         const titles = [
  58  |           ...new Set(files.map((file) => file.board)),
  59  |           ...Array.from({ length: extraCategories }, (_, index) => `独立布局分类 ${index + 1}`),
  60  |         ]
  61  |         for (const title of titles) {
  62  |           const result = await api.library.updateCategory({ kind: 'create', title })
  63  |           if (!result.ok) throw new Error(result.error.message)
  64  |         }
  65  |         const navigation = await api.library.listQuestions({
  66  |           topicId: null,
  67  |           archived: false,
  68  |           page: 1,
  69  |         })
  70  |         if (!navigation.ok) throw new Error(navigation.error.message)
  71  |         for (const file of files) {
  72  |           const category = navigation.value.categories.find((item) => item.title === file.board)!
  73  |           const result = await api.library.updateCategory({
  74  |             kind: 'assign',
  75  |             topicId: file.topicId,
  76  |             categoryId: category.categoryId,
  77  |           })
  78  |           if (!result.ok) throw new Error(result.error.message)
  79  |         }
  80  |       },
  81  |       { files: manifest.files, extraCategories },
  82  |     )
  83  |     await chooseTheme(instance.page, '晴空蓝')
  84  |     await openPage(instance.page, '题库')
  85  |     await expect(instance.page.getByText('共 419 题', { exact: true })).toBeVisible()
  86  |     return instance
  87  |   } catch (error) {
  88  |     await stop(instance.application)
  89  |     throw error
  90  |   }
  91  | }
  92  | 
  93  | test('第三轮分类：真实419题与大量展开分类只有树滚动，搜索固定且第20题定位/列表位置保持', async ({
  94  |   testDataDirectory,
  95  | }, info) => {
  96  |   const { application, page } = await prepareReal(testDataDirectory, info, 12)
  97  |   try {
  98  |     const before = themeBusinessSnapshot(testDataDirectory)
  99  |     for (const font of [17, 22]) {
  100 |       await chooseTheme(page, '晴空蓝', 'light', font)
  101 |       await openPage(page, '题库')
  102 |       const navigation = page.getByRole('complementary', {
  103 |         name: '题库分类与专题导航',
  104 |         exact: true,
  105 |       })
  106 |       for (const button of await navigation
  107 |         .locator('.category-toggle[aria-expanded="false"]')
  108 |         .all())
> 109 |         await button.click()
      |                      ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
  110 |       const scrollable = await navigation.evaluate((element) => {
  111 |         const browser = globalThis as unknown as {
  112 |           getComputedStyle: (node: unknown) => { overflowY: string }
  113 |         }
  114 |         return [element, ...element.querySelectorAll('*')]
  115 |           .filter(
  116 |             (node) =>
  117 |               node.clientHeight > 0 &&
  118 |               node.scrollHeight > node.clientHeight + 1 &&
  119 |               /auto|scroll/.test(browser.getComputedStyle(node).overflowY),
  120 |           )
  121 |           .map((node) => ({
  122 |             class: node.getAttribute('class'),
  123 |             client: node.clientHeight,
  124 |             scroll: node.scrollHeight,
  125 |           }))
  126 |       })
  127 |       expect(scrollable).toHaveLength(1)
  128 |       expect(scrollable[0]!.class).toBe('category-tree')
  129 |       const search = navigation.getByRole('searchbox', { name: '题库专题检索', exact: true })
  130 |       await inView(search)
  131 |       await navigation.locator('.category-tree').evaluate((element) => {
  132 |         element.scrollTop = element.scrollHeight
  133 |       })
  134 |       await inView(search)
  135 |       await search.fill('GPIO')
  136 |       await expect(
  137 |         navigation.getByRole('button', { name: /题库专题：.*GPIO/ }).first(),
  138 |       ).toBeVisible()
  139 |       await search.clear()
  140 |       await page.getByLabel('专题', { exact: true }).selectOption('stm32f103-gpio')
  141 |       await expect(page.locator('.question-row')).toHaveCount(20)
  142 |       const list = page.locator('.question-list-scroll')
  143 |       const row = page.locator('.question-row').nth(19)
  144 |       await row.scrollIntoViewIfNeeded()
  145 |       const top = await list.evaluate((element) => element.scrollTop)
  146 |       const title = await row.locator('.question-row-title').textContent()
  147 |       await row.click()
  148 |       await inView(
  149 |         page
  150 |           .getByRole('article', { name: '题目内容', exact: true })
  151 |           .getByRole('heading', { name: title!, exact: true }),
  152 |       )
  153 |       expect(await list.evaluate((element) => element.scrollTop)).toBe(top)
  154 |       await capture(page, info, `category-row20-1440-${font}`, {
  155 |         scrollable,
  156 |         listTopBefore: top,
  157 |         listTopAfter: await list.evaluate((element) => element.scrollTop),
  158 |       })
  159 |       await noWorkbenchOverflow(page)
  160 |     }
  161 |     expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
  162 |   } finally {
  163 |     await stop(application)
  164 |   }
  165 | })
  166 | 
  167 | test('第三轮板块：真实题库有活动轮时首排不超过450px、两排可见，有题筛选不改归属与固定队列', async ({
  168 |   testDataDirectory,
  169 | }, info) => {
  170 |   const { application, page } = await prepareReal(testDataDirectory, info)
  171 |   try {
  172 |     await openPage(page, '开始练习')
  173 |     await page.getByRole('button', { name: '开始练习', exact: true }).click()
  174 |     await page
  175 |       .getByRole('textbox', { name: '我的答案', exact: true })
  176 |       .fill('板块布局检查保留的草稿')
  177 |     await expect(page.locator('.practice-save')).toHaveText('已保存')
  178 |     await page.getByRole('button', { name: '保存后返回', exact: true }).click()
  179 |     const before = themeBusinessSnapshot(testDataDirectory)
  180 |     await openPage(page, '知识板块')
  181 |     const cards = page.locator('.board-card')
  182 |     await expect(cards).toHaveCount(16)
  183 |     expect((await cards.first().boundingBox())!.y).toBeLessThanOrEqual(450)
  184 |     for (const card of (await cards.all()).slice(0, 8)) await inView(card)
  185 |     const positions = await cards.evaluateAll((elements) =>
  186 |       elements
  187 |         .slice(0, 8)
  188 |         .map((element) => ({
  189 |           title: element.querySelector('h3')!.textContent,
  190 |           ...element.getBoundingClientRect().toJSON(),
  191 |         })),
  192 |     )
  193 |     await capture(page, info, 'boards-active-1440-17', positions)
  194 |     const conditions = page.getByLabel('本轮创建条件', { exact: true })
  195 |     await expect(conditions).not.toHaveAttribute('open', '')
  196 |     await conditions.locator('summary').click()
  197 |     await expect(conditions).toContainText('继续练习使用原固定队列')
  198 |     await conditions.locator('summary').click()
  199 |     await page.getByLabel('仅显示有题板块', { exact: true }).check()
  200 |     await expect(cards).toHaveCount(5)
  201 |     for (const card of await cards.all())
  202 |       await expect(card.locator('.board-count strong')).not.toHaveText('0')
  203 |     await page.getByLabel('仅显示有题板块', { exact: true }).uncheck()
  204 |     await expect(cards).toHaveCount(16)
  205 |     await page.getByRole('searchbox', { name: '搜索板块', exact: true }).fill('C语言')
  206 |     await expect(cards).toHaveCount(1)
  207 |     await page.getByRole('searchbox', { name: '搜索板块', exact: true }).clear()
  208 |     await chooseTheme(page, 'Claude 风格', 'dark', 22)
  209 |     await openPage(page, '知识板块')
```