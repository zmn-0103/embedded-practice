# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-clarity.spec.ts >> 题库层级：草稿与生效条件分离，结果数/范围/清空集中且不创建练习
- Location: tests\e2e\ui-clarity.spec.ts:87:5

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('status')
Expected substring: "条件已调整"
Error: strict mode violation: getByRole('status') resolved to 2 elements:
    1) <p role="status" class="filter-pending">条件已调整，点击“筛选题库”后应用到列表。</p> aka getByText('条件已调整，点击“筛选题库”后应用到列表。')
    2) <section role="status" class="service-status status-ready">…</section> aka getByRole('status').filter({ hasText: '本地数据已就绪' })

Call log:
  - Expect "toContainText" getByRole('status') with timeout 10000ms
  - waiting for getByRole('status')

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
  43  |         await expect(page.locator('html')).toHaveAttribute('data-theme', mode)
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
> 100 |     await expect(page.getByRole('status')).toContainText('条件已调整')
      |                                            ^ Error: expect(locator).toContainText(expected) failed
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
  144 |   try {
  145 |     await openPage(page, '学习记录')
  146 |     await page.getByLabel('学习记录专题', { exact: true }).selectOption('workbench-a')
  147 |     await page.getByLabel('学习记录范围', { exact: true }).selectOption('archived')
  148 |     const summary = page.getByLabel('当前版本学习总览', { exact: true })
  149 |     await expect(page.getByText('共 0 题', { exact: true })).toBeVisible()
  150 |     const before = await summary.textContent()
  151 |     await expect(
  152 |       page.getByRole('button', { name: '清空题库筛选', exact: true }),
  153 |     ).toHaveAccessibleDescription('清空仅重置下方列表的附加条件，保留上方学习记录的范围。')
  154 |     await page.getByRole('button', { name: '清空题库筛选', exact: true }).click()
  155 |     await expect(page.getByLabel('题库结果范围', { exact: true })).toHaveText(
  156 |       '全部分类 · 工作台验收专题 · 归档题目',
  157 |     )
  158 |     await expect(page.getByLabel('学习记录专题', { exact: true })).toHaveValue('workbench-a')
  159 |     await expect(page.getByLabel('学习记录范围', { exact: true })).toHaveValue('archived')
  160 |     await expect(summary).toHaveText(before!)
  161 |   } finally {
  162 |     await stop(application)
  163 |   }
  164 | })
  165 | 
  166 | test('练习层级：揭晓是主要操作，自评提示说明自动保存推进，返回保存与恢复仍走原轮', async ({
  167 |   testDataDirectory,
  168 | }, info) => {
  169 |   const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  170 |   try {
  171 |     await openPage(page, '开始练习')
  172 |     await page.getByRole('button', { name: '开始练习', exact: true }).click()
  173 |     await expect(page.locator('.practice-stage')).toHaveText('思考与作答查看参考答案后，再自行评价')
  174 |     await expect(page.locator('.practice-actions button.primary')).toHaveText('查看参考答案')
  175 |     await expect(page.getByRole('button', { name: '保存并返回', exact: true })).not.toHaveClass(
  176 |       /primary/,
  177 |     )
  178 |     await expect(page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
  179 |     const input = page.getByRole('textbox', { name: '我的答案', exact: true })
  180 |     await input.fill('UI层级验证的独立草稿\n    keep_original_queue();')
  181 |     await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  182 |     await expect(page.locator('.practice-stage')).toContainText('选择自评后保存并进入下一题')
  183 |     await expect(page.locator('.practice-evaluation button[data-rating]')).toHaveCount(3)
  184 |     await capture(page, info, 'practice-revealed-1440.png')
  185 |     await page.getByRole('button', { name: '掌握', exact: true }).click()
  186 |     await expect(page.getByLabel('练习进度', { exact: true })).toContainText('第 2 / 20 题')
  187 |     await expect(page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
  188 |     await page.getByRole('button', { name: '上一题', exact: true }).click()
  189 |     await expect(input).toHaveValue('UI层级验证的独立草稿\n    keep_original_queue();')
  190 |     await expect(
  191 |       page.getByText('本轮自评：掌握，再次自评会更新本轮记录。', { exact: true }),
  192 |     ).toBeVisible()
  193 |     await page.getByRole('button', { name: '保存后返回', exact: true }).click()
  194 |     await page.getByRole('button', { name: '继续练习', exact: true }).click()
  195 |     await expect(input).toHaveValue('UI层级验证的独立草稿\n    keep_original_queue();')
  196 |     await noWorkbenchOverflow(page)
  197 |   } finally {
  198 |     await stop(application)
  199 |   }
  200 | })
```