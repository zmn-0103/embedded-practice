# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: oral-timer.spec.ts >> 保存失败暂停且保留输入/余时，重试按原流程切题不重置旧题计时
- Location: tests\e2e\oral-timer.spec.ts:272:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '重试原操作', exact: true })

```

# Test source

```ts
  204 |     await expect(page.getByRole('heading', { name: '组卷题 A 2', exact: true })).toBeVisible()
  205 |     await expect(panel.getByRole('timer')).toHaveText('02:00')
  206 |     await panel.getByLabel('本题口述时长', { exact: true }).selectOption('180')
  207 |     await panel.getByRole('button', { name: '开始计时', exact: true }).click()
  208 |     await page.clock.runFor(5000)
  209 |     await page.getByRole('button', { name: '上一题', exact: true }).click()
  210 |     await page.clock.runFor(600)
  211 |     await expect(panel.getByRole('timer')).toHaveText('01:50')
  212 |     await expect(panel.getByLabel('本题口述时长', { exact: true })).toHaveValue('120')
  213 |     await page.getByRole('button', { name: '保存并返回', exact: true }).click()
  214 |     await page.clock.fastForward(600000)
  215 |     await openPage(page, '学习总览')
  216 |     await openPage(page, '开始练习')
  217 |     await page.getByRole('button', { name: '继续练习', exact: true }).click()
  218 |     panel = page.getByRole('region', { name: '口述计时', exact: true })
  219 |     await expect(panel.getByRole('timer')).toHaveText('01:50')
  220 |     await expect(panel.getByRole('button', { name: '继续计时', exact: true })).toBeEnabled()
  221 |     await panel.getByRole('button', { name: '重置本题计时', exact: true }).click()
  222 |     await expect(panel.getByRole('timer')).toHaveText('02:00')
  223 |     await expect(panel.getByRole('button', { name: '开始计时', exact: true })).toBeEnabled()
  224 |     await page.clock.resume()
  225 |     const before = withHistoryDatabase(testDataDirectory, controlRecords)
  226 |     await closeNormally(application)
  227 |     const reopened = await launchApplication(testDataDirectory, info.project.name, '开始练习')
  228 |     opened.push(reopened.application)
  229 |     await reopened.page.getByRole('button', { name: '继续练习', exact: true }).click()
  230 |     await expect(
  231 |       reopened.page.getByRole('heading', { name: '组卷题 A 1', exact: true }),
  232 |     ).toBeVisible()
  233 |     await expect(
  234 |       reopened.page.getByRole('checkbox', { name: '启用口述计时（可选）', exact: true }),
  235 |     ).not.toBeChecked()
  236 |     await expect(reopened.page.getByRole('timer')).toHaveCount(0)
  237 |     expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
  238 |   } finally {
  239 |     for (const app of opened) await stop(app)
  240 |   }
  241 | })
  242 | 
  243 | test('真实短时间倒数，窗口隐藏/失焦暂停，恢复焦点不自动继续', async ({
  244 |   testDataDirectory,
  245 | }, info) => {
  246 |   const { application, page } = await prepareOral(testDataDirectory, info)
  247 |   try {
  248 |     const panel = page.getByRole('region', { name: '口述计时', exact: true }),
  249 |       before = withHistoryDatabase(testDataDirectory, controlRecords)
  250 |     await panel.getByRole('checkbox', { name: '启用口述计时（可选）', exact: true }).check()
  251 |     await panel.getByRole('button', { name: '开始计时', exact: true }).click()
  252 |     await expect(panel.getByRole('timer')).not.toHaveText('02:00')
  253 |     await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.minimize())
  254 |     await expect(panel.getByRole('button', { name: '继续计时', exact: true })).toHaveCount(1)
  255 |     const frozen = await panel.getByRole('timer').innerText(),
  256 |       startedAt = Date.now()
  257 |     await new Promise((resolve) => setTimeout(resolve, 1500))
  258 |     await application.evaluate(({ BrowserWindow }) => {
  259 |       const window = BrowserWindow.getAllWindows()[0]!
  260 |       window.restore()
  261 |       window.focus()
  262 |     })
  263 |     expect(Date.now() - startedAt).toBeGreaterThanOrEqual(1500)
  264 |     await expect(panel.getByRole('timer')).toHaveText(frozen)
  265 |     await expect(panel.getByRole('button', { name: '继续计时', exact: true })).toBeEnabled()
  266 |     expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
  267 |   } finally {
  268 |     await stop(application)
  269 |   }
  270 | })
  271 | 
  272 | test('保存失败暂停且保留输入/余时，重试按原流程切题不重置旧题计时', async ({
  273 |   testDataDirectory,
  274 | }, info) => {
  275 |   const { application, page } = await prepareOral(testDataDirectory, info)
  276 |   try {
  277 |     await freezeOralClock(page)
  278 |     const panel = page.getByRole('region', { name: '口述计时', exact: true })
  279 |     await panel.getByRole('checkbox', { name: '启用口述计时（可选）', exact: true }).check()
  280 |     await panel.getByRole('button', { name: '开始计时', exact: true }).click()
  281 |     await page.clock.runFor(10000)
  282 |     withHistoryDatabase(
  283 |       testDataDirectory,
  284 |       (db) =>
  285 |         db.exec(
  286 |           "CREATE TRIGGER fail_oral BEFORE UPDATE ON practice_items BEGIN SELECT RAISE(ABORT,'oral draft'); END",
  287 |         ),
  288 |       false,
  289 |     )
  290 |     const before = withHistoryDatabase(testDataDirectory, controlRecords)
  291 |     await page
  292 |       .getByRole('textbox', { name: '我的答案', exact: true })
  293 |       .fill('失败时保留独立口述草稿')
  294 |     await page.getByRole('button', { name: '跳过本题', exact: true }).click()
  295 |     await expect(page.locator('.practice-actions [role="alert"]')).toBeVisible()
  296 |     await page.clock.fastForward(300000)
  297 |     await expect(page.getByRole('heading', { name: '组卷题 A 1', exact: true })).toBeVisible()
  298 |     await expect(panel.getByRole('timer')).toHaveText('01:50')
  299 |     await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  300 |       '失败时保留独立口述草稿',
  301 |     )
  302 |     expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
  303 |     withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER fail_oral'), false)
> 304 |     await page.getByRole('button', { name: '重试原操作', exact: true }).click()
      |                                                                    ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
  305 |     await expect(page.getByRole('heading', { name: '组卷题 A 2', exact: true })).toBeVisible()
  306 |     await page.clock.runFor(600)
  307 |     await page.getByRole('button', { name: '上一题', exact: true }).click()
  308 |     await page.clock.runFor(600)
  309 |     await expect(panel.getByRole('timer')).toHaveText('01:50')
  310 |     await page.clock.resume()
  311 |     await captureHistory(application, page, info, 'oral-save-recovered.png')
  312 |   } finally {
  313 |     await stop(application)
  314 |   }
  315 | })
  316 | 
```