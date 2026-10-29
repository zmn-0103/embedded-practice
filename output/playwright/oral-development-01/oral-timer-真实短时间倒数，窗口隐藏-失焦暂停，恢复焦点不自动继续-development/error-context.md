# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: oral-timer.spec.ts >> 真实短时间倒数，窗口隐藏/失焦暂停，恢复焦点不自动继续
- Location: tests\e2e\oral-timer.spec.ts:243:5

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByRole('region', { name: '口述计时', exact: true }).getByRole('button', { name: '继续计时', exact: true })
Expected: 1
Received: 0
Timeout:  10000ms

Call log:
  - Expect "toHaveCount" getByRole('region', { name: '口述计时', exact: true }).getByRole('button', { name: '继续计时', exact: true }) with timeout 10000ms
  - waiting for getByRole('region', { name: '口述计时', exact: true }).getByRole('button', { name: '继续计时', exact: true })
    24 × locator resolved to 0 elements
       - unexpected value "0"

```

# Test source

```ts
  154 |     await panel.getByRole('button', { name: '暂停计时', exact: true }).click()
  155 |     await page.clock.fastForward(600000)
  156 |     await expect(panel.getByRole('timer')).toHaveText('01:59')
  157 |     await page.clock.setSystemTime(new Date('2030-01-01T00:00:00Z'))
  158 |     await expect(panel.getByRole('timer')).toHaveText('01:59')
  159 |     await panel.getByRole('button', { name: '继续计时', exact: true }).click()
  160 |     await page.clock.fastForward(200000)
  161 |     await expect(panel.getByRole('timer')).toHaveText('00:00')
  162 |     await expect(panel.getByRole('status')).toContainText('本题口述计时已到')
  163 |     await expect(page.getByRole('heading', { name: '组卷题 A 1', exact: true })).toBeVisible()
  164 |     await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toBeEditable()
  165 |     await expect(
  166 |       page.locator('.reference-answer,.personal-note,.review-editor,.question-relations'),
  167 |     ).toHaveCount(0)
  168 |     expect(await application.evaluate(() => Reflect.get(globalThis, '__oralCalls'))).toEqual([])
  169 |     expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
  170 |     await page.clock.resume()
  171 |     await panel.scrollIntoViewIfNeeded()
  172 |     await captureHistory(application, page, info, 'oral-expired.png')
  173 |     await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  174 |     await expect(page.getByRole('region', { name: '练习参考答案', exact: true })).toContainText(
  175 |       'CONTROL-OLD-ANSWER-control-a-1',
  176 |     )
  177 |     await expect(panel.getByRole('button', { name: '重置本题计时', exact: true })).toBeDisabled()
  178 |     expect(await application.evaluate(() => Reflect.get(globalThis, '__oralCalls'))).toContain(
  179 |       PRACTICE_CHANNELS.reveal,
  180 |     )
  181 |     expect(
  182 |       withHistoryDatabase(testDataDirectory, (db) =>
  183 |         db.prepare('SELECT kind FROM learning_activities ORDER BY rowid').all(),
  184 |       ),
  185 |     ).toEqual([{ kind: 'reveal' }])
  186 |   } finally {
  187 |     await stop(application)
  188 |   }
  189 | })
  190 | 
  191 | test('计时分题保留和本题时长/重置，保存返回后暂停继续，关闭重开只重置计时', async ({
  192 |   testDataDirectory,
  193 | }, info) => {
  194 |   const { application, page } = await prepareOral(testDataDirectory, info),
  195 |     opened: ElectronApplication[] = [application]
  196 |   try {
  197 |     await freezeOralClock(page)
  198 |     let panel = page.getByRole('region', { name: '口述计时', exact: true })
  199 |     await panel.getByRole('checkbox', { name: '启用口述计时（可选）', exact: true }).check()
  200 |     await panel.getByRole('button', { name: '开始计时', exact: true }).click()
  201 |     await page.clock.runFor(10000)
  202 |     await page.getByRole('button', { name: '跳过本题', exact: true }).click()
  203 |     await page.clock.runFor(600)
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
> 254 |     await expect(panel.getByRole('button', { name: '继续计时', exact: true })).toHaveCount(1)
      |                                                                            ^ Error: expect(locator).toHaveCount(expected) failed
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
  304 |     await page.getByRole('button', { name: '重试原操作', exact: true }).click()
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