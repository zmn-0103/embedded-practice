# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workbench-ui2.spec.ts >> 第二轮画面：短题首屏包含题干/输入/揭晓/返回，22px保存失败在当前操作附近且预留高度
- Location: tests\e2e\workbench-ui2.spec.ts:82:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '继续本轮', exact: true })

```

# Test source

```ts
  5   | import { importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
  6   | import { chooseTheme, readAppearance, themeBusinessSnapshot } from './theme-helpers'
  7   | import { noWorkbenchOverflow, prepareWorkbench, settleWorkbench } from './workbench-helpers'
  8   | 
  9   | async function size(application: ElectronApplication, width = 1440) {
  10  |   await application.evaluate(
  11  |     ({ BrowserWindow }, width) => BrowserWindow.getAllWindows()[0]!.setContentSize(width, 900),
  12  |     width,
  13  |   )
  14  | }
  15  | 
  16  | async function inView(locator: Locator) {
  17  |   await expect(locator).toBeInViewport({ ratio: 1 })
  18  |   const box = await locator.boundingBox()
  19  |   expect(box).not.toBeNull()
  20  |   expect(box!.y).toBeGreaterThanOrEqual(0)
  21  | }
  22  | 
  23  | async function screenshot(page: Page, info: TestInfo, name: string) {
  24  |   await settleWorkbench(page)
  25  |   await info.attach(name, { body: await page.screenshot(), contentType: 'image/png' })
  26  | }
  27  | 
  28  | test('第二轮画面：第1/10/20项详情均在视口，列表不回顶，分页/主题/字号和窄窗返回保持上下文', async ({
  29  |   testDataDirectory,
  30  | }, info) => {
  31  |   const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  32  |   try {
  33  |     await size(application)
  34  |     await chooseTheme(page, '晴空蓝')
  35  |     await openPage(page, '题库')
  36  |     const before = themeBusinessSnapshot(testDataDirectory)
  37  |     const list = page.locator('.question-list-scroll')
  38  |     for (const index of [0, 9, 19]) {
  39  |       const row = page.locator('.question-row').nth(index)
  40  |       await row.scrollIntoViewIfNeeded()
  41  |       const position = await list.evaluate((element) => element.scrollTop)
  42  |       const windowTop = await page.evaluate(
  43  |         () => (globalThis as unknown as { scrollY: number }).scrollY,
  44  |       )
  45  |       await row.click()
  46  |       const title = page
  47  |         .getByRole('article', { name: '题目内容', exact: true })
  48  |         .getByRole('heading', { name: `工作台题目 ${index + 1}`, exact: true })
  49  |       await inView(title)
  50  |       expect(await list.evaluate((element) => element.scrollTop)).toBe(position)
  51  |       expect(
  52  |         await page.evaluate(() => (globalThis as unknown as { scrollY: number }).scrollY),
  53  |       ).toBe(windowTop)
  54  |       if (index === 19) expect(position).toBeGreaterThan(0)
  55  |     }
  56  |     await screenshot(page, info, 'library-row20-1440-17.png')
  57  |     const paging = page.getByRole('navigation', { name: '题目分页', exact: true })
  58  |     await inView(paging)
  59  |     const previous = await paging.getByRole('button', { name: '上一页' }).boundingBox()
  60  |     const next = await paging.getByRole('button', { name: '下一页' }).boundingBox()
  61  |     expect(previous!.y).toBe(next!.y)
  62  |     await paging.getByRole('button', { name: '下一页' }).click()
  63  |     await expect(page.locator('.question-row')).toHaveCount(5)
  64  |     await page.locator('.question-row').last().click()
  65  |     await inView(page.getByRole('heading', { name: '工作台题目 25', exact: true }))
  66  |     await chooseTheme(page, 'Claude 风格', 'dark', 22)
  67  |     await openPage(page, '题库')
  68  |     await inView(page.getByRole('heading', { name: '工作台题目 25', exact: true }))
  69  |     await size(application, 900)
  70  |     await page.getByRole('button', { name: '返回题目列表', exact: true }).click()
  71  |     await expect(paging).toContainText('2 / 2')
  72  |     await expect(page.locator('.question-row[aria-current="true"]')).toBeFocused()
  73  |     await page.locator('.question-row').last().click()
  74  |     await inView(page.getByRole('heading', { name: '工作台题目 25', exact: true }))
  75  |     await noWorkbenchOverflow(page)
  76  |     expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
  77  |   } finally {
  78  |     await stop(application)
  79  |   }
  80  | })
  81  | 
  82  | test('第二轮画面：短题首屏包含题干/输入/揭晓/返回，22px保存失败在当前操作附近且预留高度', async ({
  83  |   testDataDirectory,
  84  | }, info) => {
  85  |   const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  86  |   let fault = false
  87  |   try {
  88  |     await size(application)
  89  |     await chooseTheme(page, '晴空蓝')
  90  |     await openPage(page, '开始练习')
  91  |     await page.getByRole('button', { name: '开始练习', exact: true }).click()
  92  |     const input = page.getByRole('textbox', { name: '我的答案', exact: true })
  93  |     for (const locator of [
  94  |       page.getByLabel('练习题干', { exact: true }),
  95  |       input,
  96  |       page.getByRole('button', { name: '查看参考答案', exact: true }),
  97  |       page.getByRole('button', { name: '保存并返回', exact: true }),
  98  |     ])
  99  |       await inView(locator)
  100 |     await screenshot(page, info, 'practice-short-1440-17.png')
  101 |     await page.getByRole('button', { name: '保存并返回', exact: true }).click()
  102 |     await chooseTheme(page, '晴空蓝', 'light', 22)
  103 |     await size(application, 900)
  104 |     await openPage(page, '开始练习')
> 105 |     await page.getByRole('button', { name: '继续本轮', exact: true }).click()
      |                                                                   ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
  106 |     withHistoryDatabase(
  107 |       testDataDirectory,
  108 |       (db) =>
  109 |         db.exec(
  110 |           "CREATE TRIGGER ui2_draft_fault BEFORE UPDATE OF draft ON practice_items BEGIN SELECT RAISE(ABORT, '第二轮保存失败'); END",
  111 |         ),
  112 |       false,
  113 |     )
  114 |     fault = true
  115 |     await input.fill(
  116 |       Array.from({ length: 120 }, (_, index) => `必须保留的长答案 ${index}`).join('\n'),
  117 |     )
  118 |     await expect(page.locator('.practice-save')).toHaveText('保存失败')
  119 |     const retry = page.getByRole('button', { name: '重试保存', exact: true })
  120 |     await inView(retry)
  121 |     await inView(page.locator('.practice-actions [role="alert"]'))
  122 |     await input.focus()
  123 |     await page.evaluate(() =>
  124 |       (globalThis as unknown as { scrollTo: (x: number, y: number) => void }).scrollTo(0, 100000),
  125 |     )
  126 |     await settleWorkbench(page)
  127 |     const editor = await input.boundingBox()
  128 |     const actions = await page.locator('.practice-actions').boundingBox()
  129 |     expect(editor!.y + editor!.height).toBeLessThanOrEqual(actions!.y)
  130 |     expect(
  131 |       await page
  132 |         .locator('.practice-action-reserve')
  133 |         .evaluate((element) => element.getBoundingClientRect().height),
  134 |     ).toBeGreaterThanOrEqual(actions!.height)
  135 |     await screenshot(page, info, 'practice-failed-900-22.png')
  136 |     await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  137 |     await expect(page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
  138 |     withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER ui2_draft_fault'), false)
  139 |     fault = false
  140 |     await page.getByRole('button', { name: /重试保存|重试原操作/, exact: true }).click()
  141 |     await expect(page.locator('.practice-save')).toHaveText('已保存')
  142 |     await expect(input).toContainText('')
  143 |     await noWorkbenchOverflow(page)
  144 |   } finally {
  145 |     if (fault)
  146 |       withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER ui2_draft_fault'), false)
  147 |     await stop(application)
  148 |   }
  149 | })
  150 | 
  151 | test('第二轮画面：1440→900→1440导航按钮声明对应画面，窄窗不写宽窗偏好', async ({
  152 |   testDataDirectory,
  153 | }, info) => {
  154 |   const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  155 |   try {
  156 |     await size(application)
  157 |     const before = await readAppearance(page)
  158 |     await expect(page.getByRole('button', { name: '收起导航', exact: true })).toHaveAttribute(
  159 |       'aria-expanded',
  160 |       'true',
  161 |     )
  162 |     await size(application, 900)
  163 |     await expect(page.locator('.navigation-toggle')).toBeHidden()
  164 |     await expect(page.locator('.brand-mark')).toBeVisible()
  165 |     await expect(page.locator('.navigation-label').first()).toBeHidden()
  166 |     expect(await readAppearance(page)).toEqual(before)
  167 |     await size(application)
  168 |     await expect(page.getByRole('button', { name: '收起导航', exact: true })).toBeVisible()
  169 |     await page.getByRole('button', { name: '收起导航', exact: true }).click()
  170 |     await expect(page.getByRole('button', { name: '展开导航', exact: true })).toHaveAttribute(
  171 |       'aria-expanded',
  172 |       'false',
  173 |     )
  174 |     await expect(page.locator('.navigation-label').first()).toBeHidden()
  175 |     const collapsed = await readAppearance(page)
  176 |     await size(application, 900)
  177 |     await expect(page.locator('.navigation-toggle')).toBeHidden()
  178 |     await size(application)
  179 |     expect(await readAppearance(page)).toEqual(collapsed)
  180 |     await expect(page.getByRole('button', { name: '展开导航', exact: true })).toBeVisible()
  181 |   } finally {
  182 |     await stop(application)
  183 |   }
  184 | })
  185 | 
  186 | test('第二轮画面：设置真正切区，导航/标题在视口，未应用外观保留且不自动保存', async ({
  187 |   testDataDirectory,
  188 | }, info) => {
  189 |   const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  190 |   try {
  191 |     await size(application)
  192 |     await chooseTheme(page, '晴空蓝')
  193 |     const saved = await readAppearance(page)
  194 |     await page.getByRole('radio', { name: '暮山紫', exact: true }).check()
  195 |     const tabs = page.getByRole('tablist', { name: '设置分区', exact: true })
  196 |     await page.getByRole('tab', { name: '备份恢复', exact: true }).click()
  197 |     await inView(tabs)
  198 |     await inView(page.getByRole('heading', { name: '备份与恢复', exact: true }))
  199 |     await expect(page.getByRole('tab', { name: '备份恢复', exact: true })).toHaveAttribute(
  200 |       'aria-selected',
  201 |       'true',
  202 |     )
  203 |     await expect(page.getByRole('radio', { name: '暮山紫', exact: true })).toHaveCount(0)
  204 |     await screenshot(page, info, 'settings-backup-1440-17.png')
  205 |     await page.getByRole('tab', { name: '数据位置', exact: true }).click()
```