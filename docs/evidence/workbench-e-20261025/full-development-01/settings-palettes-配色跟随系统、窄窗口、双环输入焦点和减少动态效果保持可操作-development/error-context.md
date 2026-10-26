# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: settings-palettes.spec.ts >> 配色跟随系统、窄窗口、双环输入焦点和减少动态效果保持可操作
- Location: tests\e2e\settings-palettes.spec.ts:261:5

# Error details

```
Error: expect(locator).toHaveCSS(expected) failed

Locator:  locator('.page-navigation')
Expected: "row"
Received: "column"
Timeout:  10000ms

Call log:
  - Expect "toHaveCSS" locator('.page-navigation') with timeout 10000ms
  - waiting for locator('.page-navigation')
    23 × locator resolved to <nav aria-label="主要页面" class="page-navigation">…</nav>
       - unexpected value "column"

```

```yaml
- navigation "主要页面":
  - link "学习总览":
    - /url: "#overview"
  - link "知识板块":
    - /url: "#boards"
  - link "开始练习":
    - /url: "#practice"
  - link "题库":
    - /url: "#library"
  - link "学习记录":
    - /url: "#records"
  - link "设置与数据":
    - /url: "#settings"
```

# Test source

```ts
  177 |       let lost = false
  178 |       ipcMain.removeHandler('settings:save')
  179 |       ipcMain.handle('settings:save', async (...args) => {
  180 |         const result = await original(...args)
  181 |         if (!lost && result.ok) {
  182 |           lost = true
  183 |           return undefined
  184 |         }
  185 |         return result
  186 |       })
  187 |     })
  188 |     await page.getByRole('button', { name: '重试保存并应用', exact: true }).click()
  189 |     await expect(page.getByRole('alert')).toContainText('显示设置保存结果尚未确认')
  190 |     expect(stored(testDataDirectory)).toEqual({ theme: 'dark', palette: 'ocean', fontSize: 22 })
  191 |     await expect(page.locator('html')).toHaveAttribute('data-palette', 'forest')
  192 |     await page.getByRole('button', { name: '重试保存并应用', exact: true }).click()
  193 |     await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
  194 |     const ocean = page.getByRole('radio', { name: '晴空蓝', exact: true })
  195 |     await ocean.focus()
  196 |     await ocean.press('ArrowRight')
  197 |     await expect(page.getByRole('radio', { name: '暖沙金', exact: true })).toBeChecked()
  198 |     await expect(page.locator('html')).toHaveAttribute('data-palette', 'ocean')
  199 |     await save(page)
  200 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  201 |     await closeNormally(application)
  202 |     const next = await launchApplication(testDataDirectory, info.project.name)
  203 |     reopened = next.application
  204 |     await expect(next.page.locator('html')).toHaveAttribute('data-palette', 'sand')
  205 |     await expect(next.page.locator('html')).toHaveAttribute('data-theme', 'dark')
  206 |     expect(stored(testDataDirectory)).toEqual({ theme: 'dark', palette: 'sand', fontSize: 22 })
  207 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  208 |     await next.page.getByRole('button', { name: '继续练习', exact: true }).click()
  209 |     await expect(next.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  210 |       '主题切换不能改变草稿\n    int kept = 7;',
  211 |     )
  212 |   } finally {
  213 |     await stop(application)
  214 |     if (reopened) await stop(reopened)
  215 |   }
  216 | })
  217 | 
  218 | test('损坏配色明确报错且不伪造默认成功，修复重读保持学习数据', async ({
  219 |   testDataDirectory,
  220 | }, info) => {
  221 |   const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  222 |   try {
  223 |     const before = historySnapshot(testDataDirectory)
  224 |     const rejected = await page.evaluate(() =>
  225 |       (globalThis as unknown as { desktop: DesktopApi }).desktop.settings.save({
  226 |         theme: 'light',
  227 |         palette: 'custom' as 'forest',
  228 |         fontSize: 17,
  229 |       }),
  230 |     )
  231 |     expect(rejected).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } })
  232 |     withHistoryDatabase(
  233 |       testDataDirectory,
  234 |       (database) =>
  235 |         database.exec(
  236 |           "PRAGMA ignore_check_constraints=ON; UPDATE appearance_settings SET palette='custom'",
  237 |         ),
  238 |       false,
  239 |     )
  240 |     await page.reload()
  241 |     await expect(page.getByRole('alert')).toContainText('显示设置暂不可用')
  242 |     await openPage(page, '设置与数据')
  243 |     await expect(page.getByRole('radio')).toHaveCount(0)
  244 |     await expect(page.getByRole('button', { name: '保存并应用', exact: true })).toHaveCount(0)
  245 |     expect(stored(testDataDirectory)).toEqual({ theme: 'system', palette: 'custom', fontSize: 17 })
  246 |     withHistoryDatabase(
  247 |       testDataDirectory,
  248 |       (database) =>
  249 |         database.exec("UPDATE appearance_settings SET palette='lilac',theme_id='builtin.lilac'"),
  250 |       false,
  251 |     )
  252 |     await page.getByRole('button', { name: '重试读取显示设置', exact: true }).click()
  253 |     await expect(page.getByRole('radio', { name: '暮山紫', exact: true })).toBeChecked()
  254 |     await expect(page.locator('html')).toHaveAttribute('data-palette', 'lilac')
  255 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  256 |   } finally {
  257 |     await stop(application)
  258 |   }
  259 | })
  260 | 
  261 | test('配色跟随系统、窄窗口、双环输入焦点和减少动态效果保持可操作', async ({
  262 |   testDataDirectory,
  263 | }, info) => {
  264 |   const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  265 |   try {
  266 |     await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  267 |     await choose(page, '暮山紫', 'system', 22)
  268 |     await save(page)
  269 |     await expect(page.locator('html')).toHaveCSS('background-color', palettes[3].dark)
  270 |     await expect(page.locator('body')).toHaveCSS('font-weight', '360')
  271 |     await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  272 |     await expect(page.locator('html')).toHaveCSS('background-color', palettes[3].light)
  273 |     await expect(page.locator('body')).toHaveCSS('font-weight', '400')
  274 |     await application.evaluate(({ BrowserWindow }) =>
  275 |       BrowserWindow.getAllWindows()[0]?.setSize(900, 620),
  276 |     )
> 277 |     await expect(page.locator('.page-navigation')).toHaveCSS('flex-direction', 'row')
      |                                                    ^ Error: expect(locator).toHaveCSS(expected) failed
  278 |     const geometry = await page.evaluate(() => {
  279 |       const browser = globalThis as unknown as {
  280 |         document: { documentElement: { scrollWidth: number; clientWidth: number } }
  281 |       }
  282 |       return {
  283 |         content: browser.document.documentElement.scrollWidth,
  284 |         viewport: browser.document.documentElement.clientWidth,
  285 |       }
  286 |     })
  287 |     expect(geometry.content).toBeLessThanOrEqual(geometry.viewport)
  288 |     await beginHistoryPractice(page)
  289 |     const input = page.getByRole('textbox', { name: '我的答案', exact: true })
  290 |     await input.focus()
  291 |     await input.fill('窄窗口输入仍然可见')
  292 |     await expect(input).toHaveCSS('outline-style', 'none')
  293 |     await expect(input).not.toHaveCSS('box-shadow', 'none')
  294 |     await expect(page.locator('.practice-save')).toHaveText('已保存')
  295 |     await expect(page.getByRole('button', { name: '查看参考答案', exact: true })).toBeInViewport()
  296 |     await captureHistory(application, page, info, 'palette-narrow-input.png')
  297 |     await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
  298 |     await page.getByText('筛选练习题目', { exact: true }).click()
  299 |     await expect(page.getByLabel('练习搜索', { exact: true })).toBeVisible()
  300 |     await page.getByText('筛选练习题目', { exact: true }).click()
  301 |     await expect(page.getByLabel('练习搜索', { exact: true })).not.toBeVisible()
  302 |   } finally {
  303 |     await stop(application)
  304 |   }
  305 | })
  306 | 
  307 | test('复制成功反馈2.5秒自熄，重复复制重置、错误保留且切题拒绝晚到响应', async ({
  308 |   testDataDirectory,
  309 | }, info) => {
  310 |   const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  311 |   try {
  312 |     await selectHistoryQuestion(page)
  313 |     await page.getByRole('button', { name: '展开参考答案', exact: true }).click()
  314 |     const block = page.locator('.question-reader .code-block').first()
  315 |     await application.evaluate(({ clipboard }) => {
  316 |       clipboard.writeText = (text) => Reflect.set(globalThis, 'paletteCopied', text)
  317 |     })
  318 |     const copy = block.getByRole('button', { name: '复制代码', exact: true })
  319 |     await copy.click()
  320 |     await expect(block.getByText('已复制', { exact: true })).toBeVisible()
  321 |     await copy.click()
  322 |     await expect(block.locator('.copy-feedback[data-success=true]')).toHaveCount(1)
  323 |     expect(await application.evaluate(() => Reflect.get(globalThis, 'paletteCopied'))).toBe(
  324 |       'int value = 1;\n',
  325 |     )
  326 |     await expect(block.locator('.copy-feedback')).toHaveCount(0, { timeout: 4000 })
  327 |     await application.evaluate(({ clipboard }) => {
  328 |       clipboard.writeText = () => {
  329 |         throw new Error('测试复制失败')
  330 |       }
  331 |     })
  332 |     await copy.click()
  333 |     await expect(block.locator('.copy-feedback[data-success=false]')).toBeVisible()
  334 |     // 此等待验证错误不会被成功自熄计时清除，不用于等待业务状态。
  335 |     await page.waitForTimeout(2700)
  336 |     await expect(block.locator('.copy-feedback[data-success=false]')).toBeVisible()
  337 |     await application.evaluate(({ ipcMain }) => {
  338 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:copy-code')
  339 |       ipcMain.removeHandler('library:copy-code')
  340 |       ipcMain.handle(
  341 |         'library:copy-code',
  342 |         (...args) =>
  343 |           new Promise((resolve) =>
  344 |             Reflect.set(globalThis, 'releasePaletteCopy', async () =>
  345 |               resolve(await original(...args)),
  346 |             ),
  347 |           ),
  348 |       )
  349 |     })
  350 |     await copy.click()
  351 |     await expect
  352 |       .poll(() => application.evaluate(() => typeof Reflect.get(globalThis, 'releasePaletteCopy')))
  353 |       .toBe('function')
  354 |     await page.getByRole('button', { name: '收起参考答案', exact: true }).click()
  355 |     await application.evaluate(() => Reflect.get(globalThis, 'releasePaletteCopy')())
  356 |     await page.getByRole('button', { name: '展开参考答案', exact: true }).click()
  357 |     await expect(block.locator('.copy-feedback')).toHaveCount(0)
  358 |   } finally {
  359 |     await stop(application)
  360 |   }
  361 | })
  362 | 
```