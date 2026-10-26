# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: session-filters.spec.ts >> sequential 建轮原筛选重开保持，修改首页与题库不重抽固定队列
- Location: tests\e2e\session-filters.spec.ts:68:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.check: Timeout 30000ms exceeded.
Call log:
  - waiting for getByLabel('练习只看收藏', { exact: true })
    - locator resolved to <input type="checkbox" aria-label="练习只看收藏"/>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <p>暂无匹配标签；仍可按填写的完整标签筛选。</p> from <div class="tag-picker">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <p>暂无匹配标签；仍可按填写的完整标签筛选。</p> from <div class="tag-picker">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    58 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <p>暂无匹配标签；仍可按填写的完整标签筛选。</p> from <div class="tag-picker">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms

```

# Test source

```ts
  1   | import { randomUUID } from 'node:crypto'
  2   | import { writeFile } from 'node:fs/promises'
  3   | import type { ElectronApplication, Page } from '@playwright/test'
  4   | import type { DesktopApi } from '../../src/shared/contracts/application'
  5   | import type { StartPractice } from '../../src/shared/contracts/practice'
  6   | import { EMPTY_QUESTION_FILTERS } from '../../src/shared/contracts/question-filters'
  7   | import { expect, launchApplication, openPage, test } from './helpers'
  8   | import {
  9   |   captureHistory,
  10  |   historyBank,
  11  |   historySnapshot,
  12  |   importHistoryFiles,
  13  |   prepareHistory,
  14  |   stop,
  15  |   withHistoryDatabase,
  16  | } from './history-helpers'
  17  | 
  18  | const filters = {
  19  |   query: 'HISTORY-BODY-NEW',
  20  |   tag: '历史样本',
  21  |   difficulty: '基础' as const,
  22  |   mastery: 'unpracticed' as const,
  23  |   favoritesOnly: true,
  24  | }
  25  | async function read(page: Page) {
  26  |   const result = await page.evaluate(() =>
  27  |     (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
  28  |   )
  29  |   if (!result.ok || !result.value) throw new Error('测试活动轮读取失败。')
  30  |   return result.value
  31  | }
  32  | async function start(page: Page, input: StartPractice) {
  33  |   return page.evaluate(
  34  |     (request) => (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.start(request),
  35  |     input,
  36  |   )
  37  | }
  38  | async function close(application: ElectronApplication) {
  39  |   const finished = application.waitForEvent('close')
  40  |   await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.close())
  41  |   await finished
  42  | }
  43  | async function prepare(directory: string, project: string) {
  44  |   const launched = await prepareHistory(directory, project)
  45  |   try {
  46  |     await writeFile(launched.file, historyBank(true))
  47  |     await importHistoryFiles(launched.application, launched.page, [launched.file])
  48  |     for (const questionId of ['q-1', 'q-2']) {
  49  |       const result = await launched.page.evaluate(
  50  |         (questionId) =>
  51  |           (globalThis as unknown as { desktop: DesktopApi }).desktop.library.setFavorite({
  52  |             topicId: 'history-a',
  53  |             questionId,
  54  |             favorite: true,
  55  |           }),
  56  |         questionId,
  57  |       )
  58  |       expect(result.ok).toBe(true)
  59  |     }
  60  |     return launched
  61  |   } catch (error) {
  62  |     await stop(launched.application)
  63  |     throw error
  64  |   }
  65  | }
  66  | 
  67  | for (const mode of ['sequential', 'random'] as const) {
  68  |   test(`${mode} 建轮原筛选重开保持，修改首页与题库不重抽固定队列`, async ({
  69  |     testDataDirectory,
  70  |   }, info) => {
  71  |     const { application, page, file } = await prepare(testDataDirectory, info.project.name)
  72  |     let reopened: ElectronApplication | undefined
  73  |     try {
  74  |       await openPage(page, '开始练习')
  75  |       await page.getByLabel('练习模式', { exact: true }).selectOption(mode)
  76  |       await page.getByLabel('练习专题', { exact: true }).selectOption('history-a')
  77  |       await page.getByLabel('本轮题数', { exact: true }).selectOption('all')
  78  |       await page.getByText('筛选练习题目', { exact: true }).click()
  79  |       await page.getByRole('searchbox', { name: '练习搜索' }).fill(`  ${filters.query}  `)
  80  |       await page.getByLabel('练习标签', { exact: true }).fill(` ${filters.tag} `)
  81  |       await page.getByLabel('练习难度', { exact: true }).selectOption('基础')
  82  |       await page.getByLabel('练习自评状态', { exact: true }).selectOption('unpracticed')
> 83  |       await page.getByLabel('练习只看收藏', { exact: true }).check()
      |                                                        ^ TimeoutError: locator.check: Timeout 30000ms exceeded.
  84  |       await expect(page.getByText('匹配 2 题', { exact: true })).toBeVisible()
  85  |       await page.getByRole('button', { name: '开始练习', exact: true }).click()
  86  |       const initial = await read(page)
  87  |       expect(initial.session).toMatchObject({ mode, topicId: 'history-a', filters, total: 2 })
  88  |       await page.getByRole('textbox', { name: '我的答案', exact: true }).fill('原轮第一题作答')
  89  |       await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  90  |       await page.getByRole('button', { name: '掌握', exact: true }).click()
  91  |       await expect(page.getByLabel('练习进度')).toContainText('第 2 / 2')
  92  |       const draft = '筛选快照重开草稿\nint original = 6;'
  93  |       await page.getByRole('textbox', { name: '我的答案', exact: true }).fill(draft)
  94  |       await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
  95  |       await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
  96  |       const original = await read(page)
  97  |       for (const questionId of ['q-1', 'q-2']) {
  98  |         expect(
  99  |           await page.evaluate(
  100 |             (questionId) =>
  101 |               (globalThis as unknown as { desktop: DesktopApi }).desktop.library.setFavorite({
  102 |                 topicId: 'history-a',
  103 |                 questionId,
  104 |                 favorite: false,
  105 |               }),
  106 |             questionId,
  107 |           ),
  108 |         ).toMatchObject({ ok: true })
  109 |       }
  110 |       await writeFile(file, historyBank())
  111 |       await importHistoryFiles(application, page, [file])
  112 |       await openPage(page, '开始练习')
  113 |       await page.getByText('筛选练习题目', { exact: true }).click()
  114 |       await expect(page.getByRole('searchbox', { name: '练习搜索' })).toBeVisible()
  115 |       await page.getByRole('searchbox', { name: '练习搜索' }).fill('首页后来编辑的新条件')
  116 |       await expect(page.getByText('匹配 0 题', { exact: true })).toBeVisible()
  117 |       const before = historySnapshot(testDataDirectory)
  118 |       await close(application)
  119 |       const next = await launchApplication(testDataDirectory, info.project.name)
  120 |       reopened = next.application
  121 |       await expect(next.page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
  122 |       expect(await read(next.page)).toEqual(original)
  123 |       expect(historySnapshot(testDataDirectory)).toEqual(before)
  124 |       const saved = next.page.getByLabel('本轮创建条件', { exact: true })
  125 |       await saved.getByText('本轮创建条件', { exact: true }).click()
  126 |       expect(await saved.locator('dd').allTextContents()).toEqual([
  127 |         'history-a',
  128 |         filters.query,
  129 |         filters.tag,
  130 |         '易（基础）',
  131 |         '未练习',
  132 |         '是',
  133 |       ])
  134 |       await saved.scrollIntoViewIfNeeded()
  135 |       await captureHistory(next.application, next.page, info, `original-filters-${mode}.png`)
  136 |       await next.page.getByRole('button', { name: '继续练习', exact: true }).click()
  137 |       await expect(next.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  138 |         draft,
  139 |       )
  140 |       expect(await read(next.page)).toEqual(original)
  141 |       expect(historySnapshot(testDataDirectory)).toEqual(before)
  142 |       await info.attach(`filters-reopen-${mode}.json`, {
  143 |         body: JSON.stringify({
  144 |           initial,
  145 |           original,
  146 |           recovered: await read(next.page),
  147 |           before,
  148 |           after: historySnapshot(testDataDirectory),
  149 |         }),
  150 |         contentType: 'application/json',
  151 |       })
  152 |     } finally {
  153 |       await stop(application)
  154 |       if (reopened) await stop(reopened)
  155 |     }
  156 |   })
  157 | }
  158 | 
  159 | test('筛选快照与替换旧轮原子提交，失败回滚和丢响应重试不改快照', async ({
  160 |   testDataDirectory,
  161 | }, info) => {
  162 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  163 |   try {
  164 |     const first = await start(page, {
  165 |       requestId: randomUUID(),
  166 |       topicId: 'history-a',
  167 |       count: 'all',
  168 |       replace: null,
  169 |     })
  170 |     if (!first.ok) throw new Error('测试原轮创建失败。')
  171 |     const input: StartPractice = {
  172 |       requestId: randomUUID(),
  173 |       topicId: 'history-a',
  174 |       count: 'all',
  175 |       mode: 'random',
  176 |       filters: { ...filters, query: ` ${filters.query} `, tag: ` ${filters.tag} ` },
  177 |       replace: {
  178 |         sessionId: first.value.sessionId,
  179 |         position: first.value.position,
  180 |         revision: first.value.revision,
  181 |       },
  182 |     }
  183 |     const before = historySnapshot(testDataDirectory)
```