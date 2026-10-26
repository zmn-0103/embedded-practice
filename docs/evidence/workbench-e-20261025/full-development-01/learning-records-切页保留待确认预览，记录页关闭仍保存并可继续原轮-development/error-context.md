# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: learning-records.spec.ts >> 切页保留待确认预览，记录页关闭仍保存并可继续原轮
- Location: tests\e2e\learning-records.spec.ts:247:5

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByRole('navigation', { name: '主要页面', exact: true })
Expected: 0
Received: 1
Timeout:  10000ms

Call log:
  - Expect "toHaveCount" getByRole('navigation', { name: '主要页面', exact: true }) with timeout 10000ms
  - waiting for getByRole('navigation', { name: '主要页面', exact: true })
    24 × locator resolved to 1 element
       - unexpected value "1"

```

# Test source

```ts
  167 |     await importHistoryFiles(application, page, [file])
  168 |     const archived = await readLearning(page, { topicId: 'history-a', archived: true })
  169 |     expect(archived).toMatchObject({
  170 |       total: 1,
  171 |       revealed: 0,
  172 |       rated: 0,
  173 |       favorites: 1,
  174 |       contentUpdated: 1,
  175 |     })
  176 |     expect(await readLearning(page, a)).toMatchObject({ total: 1, rated: 1, favorites: 0 })
  177 |     await writeFile(file, historyBank(true))
  178 |     await importHistoryFiles(application, page, [file])
  179 |     const restored = await readLearning(page, a)
  180 |     const { topics: _legacyTopics, ...legacyCounts } = legacy
  181 |     expect(restored).toMatchObject(legacyCounts)
  182 |     expect(restored.topics.find((topic) => topic.topicId === 'history-a')?.title).toBe('历史专题 A')
  183 |     expect(await readLearning(page, { topicId: 'history-a', archived: true })).toMatchObject({
  184 |       total: 0,
  185 |     })
  186 |     await info.attach('learning-version-counts.json', {
  187 |       body: JSON.stringify({
  188 |         initial,
  189 |         revealed,
  190 |         updated,
  191 |         legacy,
  192 |         archived,
  193 |         final: historySnapshot(testDataDirectory),
  194 |       }),
  195 |       contentType: 'application/json',
  196 |     })
  197 |   } finally {
  198 |     await stop(application)
  199 |   }
  200 | })
  201 | 
  202 | test('学习记录页专题范围、收藏刷新、主动历史与明暗布局', async ({ testDataDirectory }, info) => {
  203 |   const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  204 |   try {
  205 |     await favoriteLearning(page, 'history-a', true)
  206 |     await favoriteLearning(page, 'history-b', true)
  207 |     await openRecords(page)
  208 |     await expectCounts(page, [3, 2, 2, 2, 0], [1, 1, 0])
  209 |     expect(await page.content()).not.toMatch(/HISTORY-DRAFT|HISTORY-ANSWER/)
  210 |     await page.getByLabel('学习记录专题', { exact: true }).selectOption('history-a')
  211 |     await expectCounts(page, [2, 1, 1, 1, 0], [0, 1, 0])
  212 |     await expect(page.getByRole('checkbox', { name: '题库只看收藏', exact: true })).toBeChecked()
  213 |     await page
  214 |       .getByRole('complementary', { name: '题目列表' })
  215 |       .getByRole('button', { name: /q-1/ })
  216 |       .click()
  217 |     expect(await page.getByRole('region', { name: '本题历史', exact: true }).count()).toBe(0)
  218 |     await page.getByRole('button', { name: '查看本题历史', exact: true }).click()
  219 |     await expect(page.getByRole('region', { name: '本题历史' })).toContainText('共 3 条历史记录')
  220 |     await page.getByRole('button', { name: '取消收藏', exact: true }).click()
  221 |     await expectCounts(page, [2, 1, 1, 0, 0], [0, 1, 0])
  222 |     await expect(
  223 |       page.getByRole('complementary', { name: '题目列表' }).getByRole('button', { name: /q-1/ }),
  224 |     ).toHaveCount(0)
  225 |     await page.getByRole('button', { name: '清空题库筛选', exact: true }).click()
  226 |     await expect(
  227 |       page.getByRole('complementary', { name: '题目列表' }).getByRole('button', { name: /q-/ }),
  228 |     ).toHaveCount(2)
  229 |     expect(await page.getByRole('button', { name: /异专题题/ }).count()).toBe(0)
  230 |     for (const scheme of ['light', 'dark'] as const) {
  231 |       await page.emulateMedia({ colorScheme: scheme })
  232 |       await page.getByRole('heading', { name: '学习记录', exact: true }).scrollIntoViewIfNeeded()
  233 |       await captureHistory(application, page, info, `learning-${scheme}.png`)
  234 |     }
  235 |     await page.getByLabel('学习记录范围', { exact: true }).selectOption('archived')
  236 |     await expectCounts(page, [0, 0, 0, 0, 0], [0, 0, 0])
  237 |     expect(await page.getByRole('region', { name: '本题历史', exact: true }).count()).toBe(0)
  238 |     await info.attach('learning-window-counts.json', {
  239 |       body: JSON.stringify(await readLearning(page)),
  240 |       contentType: 'application/json',
  241 |     })
  242 |   } finally {
  243 |     await stop(application)
  244 |   }
  245 | })
  246 | 
  247 | test('切页保留待确认预览，记录页关闭仍保存并可继续原轮', async ({ testDataDirectory }, info) => {
  248 |   const { application, page, file } = await prepareHistory(testDataDirectory, info.project.name)
  249 |   let reopened: ElectronApplication | undefined
  250 |   try {
  251 |     await writeFile(file, historyBank(true))
  252 |     await application.evaluate(({ dialog }, selected) => {
  253 |       dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [selected] })
  254 |     }, file)
  255 |     await page.getByRole('button', { name: '导入题库', exact: true }).click()
  256 |     await expect(page.getByRole('heading', { name: '导入预览', exact: true })).toBeVisible()
  257 |     const preview = await page.getByRole('table', { name: '分专题变更摘要' }).textContent()
  258 |     const before = historySnapshot(testDataDirectory)
  259 |     await openRecords(page)
  260 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  261 |     await openPage(page, '题库')
  262 |     await expect(page.getByRole('heading', { name: '导入预览', exact: true })).toBeVisible()
  263 |     expect(await page.getByRole('table', { name: '分专题变更摘要' }).textContent()).toBe(preview)
  264 |     await page.getByRole('button', { name: '确认导入', exact: true }).click()
  265 |     await expect(page.getByText(/^导入完成：/)).toBeVisible()
  266 |     await beginHistoryPractice(page)
> 267 |     await expect(page.getByRole('navigation', { name: '主要页面', exact: true })).toHaveCount(0)
      |                                                                               ^ Error: expect(locator).toHaveCount(expected) failed
  268 |     await page
  269 |       .getByRole('textbox', { name: '我的答案', exact: true })
  270 |       .fill('学习记录切页前确认的草稿')
  271 |     await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
  272 |     await openRecords(page)
  273 |     const stored = historySnapshot(testDataDirectory)
  274 |     await closeNormally(application)
  275 |     expect(historySnapshot(testDataDirectory)).toEqual(stored)
  276 |     const next = await launchApplication(testDataDirectory, info.project.name)
  277 |     reopened = next.application
  278 |     await openRecords(next.page)
  279 |     await expectCounts(next.page, [3, 1, 1, 0, 2], [1, 0, 0])
  280 |     await openPage(next.page, '开始练习')
  281 |     await next.page.getByRole('button', { name: '继续练习', exact: true }).click()
  282 |     await expect(next.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  283 |       '学习记录切页前确认的草稿',
  284 |     )
  285 |     expect(historySnapshot(testDataDirectory)).toEqual(stored)
  286 |     await info.attach('learning-page-reopen.json', {
  287 |       body: JSON.stringify({ stored, final: historySnapshot(testDataDirectory) }),
  288 |       contentType: 'application/json',
  289 |     })
  290 |   } finally {
  291 |     await stop(application)
  292 |     if (reopened) await stop(reopened)
  293 |   }
  294 | })
  295 | 
```