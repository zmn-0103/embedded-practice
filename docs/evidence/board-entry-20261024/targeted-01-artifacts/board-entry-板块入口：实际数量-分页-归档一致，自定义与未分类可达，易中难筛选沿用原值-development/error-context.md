# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: board-entry.spec.ts >> 板块入口：实际数量/分页/归档一致，自定义与未分类可达，易中难筛选沿用原值
- Location: tests\e2e\board-entry.spec.ts:132:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "E:\\My_Projects\\embedded-practice"
Received: "E:\\My_Projects\\embedded-practice\\out\\main"
```

# Test source

```ts
  1   | import { mkdir, writeFile } from 'node:fs/promises'
  2   | import { join, resolve } from 'node:path'
  3   | import type { ElectronApplication, Page, TestInfo } from '@playwright/test'
  4   | import { expect, launchApplication, openPage, test } from './helpers'
  5   | import { addCategory, assignTopic, categoryList } from './category-helpers'
  6   | import {
  7   |   captureHistory,
  8   |   historySnapshot,
  9   |   importHistoryFiles,
  10  |   stop,
  11  |   withHistoryDatabase,
  12  | } from './history-helpers'
  13  | 
  14  | const board = (page: Page, title: string) =>
  15  |   page.getByRole('article', { name: `板块：${title}`, exact: true })
  16  | 
  17  | function bank(topic: string, title: string, count: number, omitFirst = false) {
  18  |   return (
  19  |     `---\nschema_version: 1\ntopic_id: ${topic}\ntopic_title: ${title}\n---\n\n` +
  20  |     Array.from({ length: count }, (_, i) => i + 1)
  21  |       .filter((n) => !omitFirst || n !== 1)
  22  |       .map((n) => {
  23  |         const difficulty = (['基础', '进阶', '综合', null] as const)[(n - 1) % 4]
  24  |         return `## q-${n} | 入口题 ${n}\n\n标签：板块样本\n${difficulty ? `难度：${difficulty}\n` : ''}\n### 题目\n\nBOARD-BODY-${topic}-${n}\n\n### 参考答案\n\nBOARD-ANSWER-${topic}-${n}\n\n`
  25  |       })
  26  |       .join('')
  27  |   )
  28  | }
  29  | 
  30  | async function runtime(
  31  |   application: ElectronApplication,
  32  |   page: Page,
  33  |   directory: string,
  34  |   info: TestInfo,
  35  | ) {
  36  |   const actual = await application.evaluate(({ app }) => ({
  37  |     executable: process.execPath,
  38  |     appPath: app.getAppPath(),
  39  |     packaged: app.isPackaged,
  40  |     userData: app.getPath('userData'),
  41  |     electron: process.versions.electron,
  42  |     node: process.versions.node,
  43  |   }))
  44  |   expect(actual.userData).toBe(directory)
  45  |   expect(actual.packaged).toBe(info.project.name === 'packaged')
  46  |   expect(actual.electron).toBe('42.11.15')
  47  |   if (actual.packaged)
  48  |     expect(resolve(actual.executable)).toBe(
  49  |       resolve(process.env['EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE']!),
  50  |     )
> 51  |   else expect(resolve(actual.appPath)).toBe(resolve('.'))
      |                                        ^ Error: expect(received).toBe(expected) // Object.is equality
  52  |   await expect(page.locator('footer')).toContainText('20261024.2-boards')
  53  |   const schema = withHistoryDatabase(directory, (db) => db.prepare('PRAGMA user_version').get())
  54  |   expect(schema).toEqual({ user_version: 9 })
  55  |   await info.attach('runtime.json', {
  56  |     body: JSON.stringify({ ...actual, schema, build: '20261024.2-boards' }, null, 2),
  57  |     contentType: 'application/json',
  58  |   })
  59  | }
  60  | 
  61  | async function prepare(directory: string, project: string) {
  62  |   const source = join(directory, '板块独立样本')
  63  |   await mkdir(source)
  64  |   const paths = ['board-a', 'board-b', 'board-c'].map((id) => join(source, `${id}.md`))
  65  |   await writeFile(paths[0]!, bank('board-a', 'UART板块测试', 23))
  66  |   await writeFile(paths[1]!, bank('board-b', '自定义专题', 3))
  67  |   await writeFile(paths[2]!, bank('board-c', '未归属专题', 1))
  68  |   const instance = await launchApplication(directory, project, '题库')
  69  |   try {
  70  |     await importHistoryFiles(instance.application, instance.page, paths)
  71  |     const communication = await addCategory(instance.page, '通信协议')
  72  |     const personal = await addCategory(instance.page, '我的重点')
  73  |     await addCategory(instance.page, '空分类')
  74  |     await assignTopic(instance.page, 'board-a', communication)
  75  |     await assignTopic(instance.page, 'board-b', personal)
  76  |     return { ...instance, communication, personal, paths }
  77  |   } catch (error) {
  78  |     await stop(instance.application)
  79  |     throw error
  80  |   }
  81  | }
  82  | 
  83  | test('板块入口：空库默认页可搜索和键盘浏览22份规划，不种分类或启动空练习', async ({
  84  |   testDataDirectory,
  85  | }, info) => {
  86  |   const { application, page } = await launchApplication(
  87  |     testDataDirectory,
  88  |     info.project.name,
  89  |     '板块',
  90  |   )
  91  |   try {
  92  |     await page.reload()
  93  |     await expect(page.getByRole('link', { name: '板块', exact: true })).toHaveAttribute(
  94  |       'aria-current',
  95  |       'page',
  96  |     )
  97  |     await expect(page.locator('.board-card')).toHaveCount(17)
  98  |     await runtime(application, page, testDataDirectory, info)
  99  |     const c = board(page, 'C语言')
  100 |     await expect(c.locator('.board-count')).toHaveText('0 题 · 待补题')
  101 |     await expect(c.getByRole('button', { name: '进入板块：C语言', exact: true })).toBeDisabled()
  102 |     await c.locator('summary').focus()
  103 |     await c.locator('summary').press('Enter')
  104 |     await expect(c.getByText('数据类型与表达式', { exact: true })).toBeVisible()
  105 |     await page.getByLabel('显示拓展方向', { exact: true }).check()
  106 |     await expect(page.locator('.board-card')).toHaveCount(24)
  107 |     await page.getByLabel('显示拓展方向', { exact: true }).uncheck()
  108 |     const search = page.getByRole('searchbox', { name: '搜索板块', exact: true })
  109 |     await search.fill('Linux')
  110 |     await expect(page.locator('.board-card')).toHaveCount(2)
  111 |     await search.fill('Verilog')
  112 |     await expect(board(page, 'FPGA与数字设计')).toBeVisible()
  113 |     await search.fill('不存在的规划方向')
  114 |     await expect(page.getByText('没有匹配板块，请调整或清空搜索。', { exact: true })).toBeVisible()
  115 |     await search.fill('')
  116 |     await captureHistory(application, page, info, 'boards-empty.png')
  117 |     await page.getByRole('button', { name: '按条件开始练习', exact: true }).focus()
  118 |     await page.getByRole('button', { name: '按条件开始练习', exact: true }).press('Enter')
  119 |     await expect(page.locator('#main-content')).toBeFocused()
  120 |     await expect(page.getByRole('button', { name: '开始练习', exact: true })).toBeDisabled()
  121 |     expect(historySnapshot(testDataDirectory).sessions).toEqual([])
  122 |     expect((await categoryList(page)).categories).toEqual([])
  123 |     await page.context().setOffline(true)
  124 |     await page.reload()
  125 |     await expect(board(page, 'C语言')).toBeVisible()
  126 |     await expect(page.getByRole('status')).toHaveText('本地数据已就绪')
  127 |   } finally {
  128 |     await stop(application)
  129 |   }
  130 | })
  131 | 
  132 | test('板块入口：实际数量/分页/归档一致，自定义与未分类可达，易中难筛选沿用原值', async ({
  133 |   testDataDirectory,
  134 | }, info) => {
  135 |   const { application, page, paths } = await prepare(testDataDirectory, info.project.name)
  136 |   try {
  137 |     await runtime(application, page, testDataDirectory, info)
  138 |     await openPage(page, '板块')
  139 |     await expect(board(page, '通信协议').locator('.board-count')).toHaveText('23 题')
  140 |     await expect(board(page, '我的重点').locator('.board-count')).toHaveText('3 题')
  141 |     await expect(board(page, '未分类').locator('.board-count')).toHaveText('1 题')
  142 |     await expect(board(page, '全部题库').locator('.board-count')).toHaveText('27 题')
  143 |     await expect(
  144 |       board(page, '空分类').getByRole('button', { name: '进入板块：空分类', exact: true }),
  145 |     ).toBeDisabled()
  146 |     const enter = board(page, '通信协议').getByRole('button', {
  147 |       name: '进入板块：通信协议',
  148 |       exact: true,
  149 |     })
  150 |     await enter.focus()
  151 |     await enter.press('Enter')
```