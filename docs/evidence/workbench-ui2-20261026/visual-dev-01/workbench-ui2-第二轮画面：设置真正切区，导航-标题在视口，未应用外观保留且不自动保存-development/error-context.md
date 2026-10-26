# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workbench-ui2.spec.ts >> 第二轮画面：设置真正切区，导航/标题在视口，未应用外观保留且不自动保存
- Location: tests\e2e\workbench-ui2.spec.ts:186:5

# Error details

```
Error: expect(locator).toBeInViewport() failed

Locator:  getByRole('button', { name: '保存并应用', exact: true })
Expected: in viewport
Received: viewport ratio 0.5566731095314026
Timeout:  10000ms

Call log:
  - Expect "toBeInViewport" getByRole('button', { name: '保存并应用', exact: true }) with timeout 10000ms
  - waiting for getByRole('button', { name: '保存并应用', exact: true })
    23 × locator resolved to <button type="submit" class="primary">保存并应用</button>
       - unexpected value "viewport ratio 0.5566731095314026"

```

```yaml
- button "保存并应用"
```

# Test source

```ts
  1   | import { writeFile } from 'node:fs/promises'
  2   | import { join, resolve } from 'node:path'
  3   | import type { ElectronApplication, Locator, Page, TestInfo } from '@playwright/test'
  4   | import { expect, launchApplication, openPage, test } from './helpers'
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
> 17  |   await expect(locator).toBeInViewport({ ratio: 1 })
      |                         ^ Error: expect(locator).toBeInViewport() failed
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
  105 |     await page.getByRole('button', { name: '继续本轮', exact: true }).click()
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
```