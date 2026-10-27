# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-clarity.spec.ts >> 占位提示：Claude 风格明暗两模式空白输入的实际对比度不少于4.5
- Location: tests\e2e\ui-clarity.spec.ts:25:7

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('html')
Expected: "light"
Received: "system"
Timeout:  10000ms

Call log:
  - Expect "toHaveAttribute" locator('html') with timeout 10000ms
  - waiting for locator('html')
    23 × locator resolved to <html lang="zh-CN" data-theme="system" data-font-size="17" data-layout="study" data-palette="forest" data-auxiliary-hidden="false" data-theme-id="builtin.claude" data-navigation-collapsed="false">…</html>
       - unexpected value "system"

```

```yaml
- document:
  - banner
  - navigation "主要页面"
  - main
  - contentinfo: 离线使用 · 数据保存在本机 V42.11.15 测试版 · 构建 20261027.1-ui-clarity
```

# Test source

```ts
  1   | import type { Page, TestInfo } from '@playwright/test'
  2   | import { BUILTIN_THEMES } from '../../src/shared/themes'
  3   | import { expect, openPage, test } from './helpers'
  4   | import { stop, withHistoryDatabase } from './history-helpers'
  5   | import { chooseTheme, verifyThemeTarget } from './theme-helpers'
  6   | import { noWorkbenchOverflow, prepareWorkbench, settleWorkbench } from './workbench-helpers'
  7   | 
  8   | async function capture(page: Page, info: TestInfo, name: string) {
  9   |   const path = info.outputPath(name)
  10  |   await page.screenshot({ path, fullPage: true })
  11  |   await info.attach(name, { path, contentType: 'image/png' })
  12  | }
  13  | 
  14  | function luminance(color: string) {
  15  |   const channels = color.match(/[\d.]+/g)?.map(Number)
  16  |   if (!channels || channels.length < 3) throw new Error(`无法解析实际颜色：${color}`)
  17  |   const linear = channels.slice(0, 3).map((channel) => {
  18  |     const value = channel / 255
  19  |     return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  20  |   })
  21  |   return linear[0]! * 0.2126 + linear[1]! * 0.7152 + linear[2]! * 0.0722
  22  | }
  23  | 
  24  | for (const theme of BUILTIN_THEMES) {
  25  |   test(`占位提示：${theme.name}明暗两模式空白输入的实际对比度不少于4.5`, async ({
  26  |     testDataDirectory,
  27  |   }, info) => {
  28  |     const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  29  |     try {
  30  |       const runtime = await verifyThemeTarget(
  31  |         application,
  32  |         page,
  33  |         testDataDirectory,
  34  |         info.project.name,
  35  |       )
  36  |       await chooseTheme(page, theme.name, 'system')
  37  |       await openPage(page, '开始练习')
  38  |       await page.getByRole('button', { name: '开始练习', exact: true }).click()
  39  |       const input = page.getByRole('textbox', { name: '我的答案', exact: true })
  40  |       const samples = []
  41  |       for (const mode of ['light', 'dark'] as const) {
  42  |         await page.emulateMedia({ colorScheme: mode })
> 43  |         await expect(page.locator('html')).toHaveAttribute('data-theme', mode)
      |                                            ^ Error: expect(locator).toHaveAttribute(expected) failed
  44  |         await expect(input).toHaveValue('')
  45  |         const sample = await input.evaluate((element) => {
  46  |           const browser = globalThis as unknown as {
  47  |             getComputedStyle: (
  48  |               element: unknown,
  49  |               pseudo?: string,
  50  |             ) => {
  51  |               color: string
  52  |               backgroundColor: string
  53  |               opacity: string
  54  |               getPropertyValue: (property: string) => string
  55  |             }
  56  |           }
  57  |           const hint = browser.getComputedStyle(element, '::placeholder')
  58  |           const editor = browser.getComputedStyle(element)
  59  |           return {
  60  |             foreground: hint.color,
  61  |             background: editor.backgroundColor,
  62  |             opacity: hint.opacity,
  63  |             muted: editor.getPropertyValue('--muted').trim(),
  64  |             visible: element.matches(':placeholder-shown'),
  65  |           }
  66  |         })
  67  |         const foreground = luminance(sample.foreground)
  68  |         const background = luminance(sample.background)
  69  |         const ratio =
  70  |           (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05)
  71  |         expect(sample.visible).toBe(true)
  72  |         expect(sample.opacity).toBe('1')
  73  |         expect(ratio).toBeGreaterThanOrEqual(4.5)
  74  |         samples.push({ theme: theme.id, mode, ...sample, ratio })
  75  |         await capture(page, info, `${theme.id}-${mode}.png`)
  76  |       }
  77  |       await info.attach('contrast-and-runtime.json', {
  78  |         body: JSON.stringify({ runtime, samples }, null, 2),
  79  |         contentType: 'application/json',
  80  |       })
  81  |     } finally {
  82  |       await stop(application)
  83  |     }
  84  |   })
  85  | }
  86  | 
  87  | test('题库层级：草稿与生效条件分离，结果数/范围/清空集中且不创建练习', async ({
  88  |   testDataDirectory,
  89  | }, info) => {
  90  |   const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  91  |   try {
  92  |     await page.getByLabel('专题', { exact: true }).selectOption('workbench-a')
  93  |     await expect(page.getByText('共 25 题', { exact: true })).toBeVisible()
  94  |     await expect(page.getByLabel('题库结果范围', { exact: true })).toContainText('工作台验收专题')
  95  |     const input = page.getByRole('searchbox', { name: '题库搜索', exact: true })
  96  |     const applied = page.getByLabel('题库生效条件', { exact: true })
  97  |     await input.fill('WORKBENCH-BODY-25')
  98  |     await expect(page.getByText('共 25 题', { exact: true })).toBeVisible()
  99  |     await expect(applied).not.toContainText('WORKBENCH-BODY-25')
  100 |     await expect(page.getByRole('status')).toContainText('条件已调整')
  101 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  102 |     await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
  103 |     await expect(applied).toHaveText('搜索：WORKBENCH-BODY-25')
  104 |     await capture(page, info, 'library-applied-1440.png')
  105 |     await input.fill('NO-MATCH-CLARITY')
  106 |     await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
  107 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  108 |     await expect(page.getByText('共 0 题', { exact: true })).toBeVisible()
  109 |     await expect(applied).toHaveText('搜索：NO-MATCH-CLARITY')
  110 |     await expect(page.getByText('当前筛选没有匹配题目。', { exact: true })).toBeVisible()
  111 |     await expect(
  112 |       page.getByRole('button', { name: '清空题库筛选', exact: true }),
  113 |     ).toHaveAccessibleDescription('清空将恢复全部分类、全部专题和有效题目，并移除所有附加条件。')
  114 |     await page.getByRole('button', { name: '清空题库筛选', exact: true }).click()
  115 |     await expect(page.getByText('共 25 题', { exact: true })).toBeVisible()
  116 |     await expect(page.getByLabel('专题', { exact: true })).toHaveValue('')
  117 |     await expect(input).toHaveValue('')
  118 |     await expect(page.getByLabel('题库结果范围', { exact: true })).toHaveText(
  119 |       '全部分类 · 全部专题 · 有效题目',
  120 |     )
  121 |     expect(
  122 |       withHistoryDatabase(testDataDirectory, (db) =>
  123 |         db.prepare('SELECT count(*) AS total FROM practice_sessions').get(),
  124 |       ),
  125 |     ).toEqual({ total: 0 })
  126 |     for (const width of [1440, 900]) {
  127 |       await application.evaluate(
  128 |         ({ BrowserWindow }, width) => BrowserWindow.getAllWindows()[0]!.setContentSize(width, 900),
  129 |         width,
  130 |       )
  131 |       await settleWorkbench(page)
  132 |       await noWorkbenchOverflow(page)
  133 |       await capture(page, info, `library-clear-${width}.png`)
  134 |     }
  135 |   } finally {
  136 |     await stop(application)
  137 |   }
  138 | })
  139 | 
  140 | test('学习记录：清空列表筛选保留专题和归档范围，不改变上方统计', async ({
  141 |   testDataDirectory,
  142 | }, info) => {
  143 |   const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
```