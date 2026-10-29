# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: oral-timer.spec.ts >> 真实短时间倒数，窗口隐藏/失焦暂停，恢复焦点不自动继续
- Location: tests\e2e\oral-timer.spec.ts:243:5

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  getByRole('region', { name: '口述计时', exact: true }).getByRole('timer')
Expected: "01:59"
Received: "01:48"
Timeout:  10000ms

Call log:
  - Expect "toHaveText" getByRole('region', { name: '口述计时', exact: true }).getByRole('timer') with timeout 10000ms
  - waiting for getByRole('region', { name: '口述计时', exact: true }).getByRole('timer')
    3 × locator resolved to <span role="timer" aria-live="off" aria-label="本题剩余时间" class="oral-timer-clock">01:58</span>
      - unexpected value "01:58"
    3 × locator resolved to <span role="timer" aria-live="off" aria-label="本题剩余时间" class="oral-timer-clock">01:57</span>
      - unexpected value "01:57"
    2 × locator resolved to <span role="timer" aria-live="off" aria-label="本题剩余时间" class="oral-timer-clock">01:56</span>
      - unexpected value "01:56"
    2 × locator resolved to <span role="timer" aria-live="off" aria-label="本题剩余时间" class="oral-timer-clock">01:55</span>
      - unexpected value "01:55"
    2 × locator resolved to <span role="timer" aria-live="off" aria-label="本题剩余时间" class="oral-timer-clock">01:54</span>
      - unexpected value "01:54"
    2 × locator resolved to <span role="timer" aria-live="off" aria-label="本题剩余时间" class="oral-timer-clock">01:53</span>
      - unexpected value "01:53"
    2 × locator resolved to <span role="timer" aria-live="off" aria-label="本题剩余时间" class="oral-timer-clock">01:52</span>
      - unexpected value "01:52"
    2 × locator resolved to <span role="timer" aria-live="off" aria-label="本题剩余时间" class="oral-timer-clock">01:51</span>
      - unexpected value "01:51"
    2 × locator resolved to <span role="timer" aria-live="off" aria-label="本题剩余时间" class="oral-timer-clock">01:50</span>
      - unexpected value "01:50"
    2 × locator resolved to <span role="timer" aria-live="off" aria-label="本题剩余时间" class="oral-timer-clock">01:49</span>
      - unexpected value "01:49"
    2 × locator resolved to <span role="timer" aria-live="off" aria-label="本题剩余时间" class="oral-timer-clock">01:48</span>
      - unexpected value "01:48"

```

```yaml
- timer "本题剩余时间": 01:48
```

# Test source

```ts
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
  253 |     const frozen = await panel.getByRole('timer').innerText(),
  254 |       startedAt = Date.now()
  255 |     await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.minimize())
  256 |     await expect
  257 |       .poll(() =>
  258 |         application.evaluate(({ BrowserWindow }) =>
  259 |           BrowserWindow.getAllWindows()[0]!.isMinimized(),
  260 |         ),
  261 |       )
  262 |       .toBe(true)
  263 |     await new Promise((resolve) => setTimeout(resolve, 1500))
  264 |     await application.evaluate(({ BrowserWindow }) => {
  265 |       const window = BrowserWindow.getAllWindows()[0]!
  266 |       window.restore()
  267 |       window.focus()
  268 |     })
  269 |     expect(Date.now() - startedAt).toBeGreaterThanOrEqual(1500)
> 270 |     await expect(panel.getByRole('timer')).toHaveText(frozen)
      |                                            ^ Error: expect(locator).toHaveText(expected) failed
  271 |     await expect(panel.getByRole('button', { name: '继续计时', exact: true })).toBeEnabled()
  272 |     expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
  273 |   } finally {
  274 |     await stop(application)
  275 |   }
  276 | })
  277 | 
  278 | test('保存失败暂停且保留输入/余时，重试保存后明确切题不重置旧题计时', async ({
  279 |   testDataDirectory,
  280 | }, info) => {
  281 |   const { application, page } = await prepareOral(testDataDirectory, info)
  282 |   try {
  283 |     await freezeOralClock(page)
  284 |     const panel = page.getByRole('region', { name: '口述计时', exact: true })
  285 |     await panel.getByRole('checkbox', { name: '启用口述计时（可选）', exact: true }).check()
  286 |     await panel.getByRole('button', { name: '开始计时', exact: true }).click()
  287 |     await page.clock.runFor(10000)
  288 |     withHistoryDatabase(
  289 |       testDataDirectory,
  290 |       (db) =>
  291 |         db.exec(
  292 |           "CREATE TRIGGER fail_oral BEFORE UPDATE ON practice_items BEGIN SELECT RAISE(ABORT,'oral draft'); END",
  293 |         ),
  294 |       false,
  295 |     )
  296 |     const before = withHistoryDatabase(testDataDirectory, controlRecords)
  297 |     await page
  298 |       .getByRole('textbox', { name: '我的答案', exact: true })
  299 |       .fill('失败时保留独立口述草稿')
  300 |     await page.getByRole('button', { name: '跳过本题', exact: true }).click()
  301 |     await expect(page.locator('.practice-actions [role="alert"]')).toBeVisible()
  302 |     await page.clock.fastForward(300000)
  303 |     await expect(page.getByRole('heading', { name: '组卷题 A 1', exact: true })).toBeVisible()
  304 |     await expect(panel.getByRole('timer')).toHaveText('01:50')
  305 |     await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  306 |       '失败时保留独立口述草稿',
  307 |     )
  308 |     expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
  309 |     withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER fail_oral'), false)
  310 |     await page.getByRole('button', { name: '重试保存', exact: true }).click()
  311 |     await expect(page.locator('.practice-input-save')).toHaveText('已保存')
  312 |     await expect(page.getByRole('heading', { name: '组卷题 A 1', exact: true })).toBeVisible()
  313 |     await expect(panel.getByRole('timer')).toHaveText('01:50')
  314 |     await page.getByRole('button', { name: '跳过本题', exact: true }).click()
  315 |     await expect(page.getByRole('heading', { name: '组卷题 A 2', exact: true })).toBeVisible()
  316 |     await page.clock.runFor(600)
  317 |     await page.getByRole('button', { name: '上一题', exact: true }).click()
  318 |     await page.clock.runFor(600)
  319 |     await expect(panel.getByRole('timer')).toHaveText('01:50')
  320 |     await page.clock.resume()
  321 |     await captureHistory(application, page, info, 'oral-save-recovered.png')
  322 |   } finally {
  323 |     await stop(application)
  324 |   }
  325 | })
  326 | 
```