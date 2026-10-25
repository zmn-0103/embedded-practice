# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: settings-palettes.spec.ts >> 损坏配色明确报错且不伪造默认成功，修复重读保持学习数据
- Location: tests\e2e\settings-palettes.spec.ts:218:5

# Error details

```
Error: expect(locator).toBeChecked() failed

Locator:  getByRole('radio', { name: '暮山紫', exact: true })
Expected: checked
Received: unchecked
Timeout:  10000ms

Call log:
  - Expect "toBeChecked" getByRole('radio', { name: '暮山紫', exact: true }) with timeout 10000ms
  - waiting for getByRole('radio', { name: '暮山紫', exact: true })
    24 × locator resolved to <input type="radio" aria-label="暮山紫" value="builtin.lilac" name="appearance-palette"/>
       - unexpected value "unchecked"

```

```yaml
- radio "暮山紫"
```

# Test source

```ts
  152 |       .getByRole('textbox', { name: '我的答案', exact: true })
  153 |       .fill('主题切换不能改变草稿\n    int kept = 7;')
  154 |     await page.getByRole('button', { name: '返回首页', exact: true }).click()
  155 |     const before = historySnapshot(testDataDirectory)
  156 |     withHistoryDatabase(
  157 |       testDataDirectory,
  158 |       (database) =>
  159 |         database.exec(
  160 |           "CREATE TRIGGER fail_palette BEFORE UPDATE ON appearance_settings BEGIN SELECT RAISE(ABORT,'配色写入失败'); END",
  161 |         ),
  162 |       false,
  163 |     )
  164 |     await choose(page, '晴空蓝', 'dark', 22)
  165 |     await page.getByRole('button', { name: '保存并应用', exact: true }).click()
  166 |     await expect(page.getByRole('alert')).toContainText('显示设置暂不可用')
  167 |     await expect(page.getByRole('radio', { name: '晴空蓝', exact: true })).toBeChecked()
  168 |     await expect(page.locator('html')).toHaveAttribute('data-palette', 'forest')
  169 |     expect(stored(testDataDirectory)).toEqual({ theme: 'system', palette: 'forest', fontSize: 17 })
  170 |     withHistoryDatabase(
  171 |       testDataDirectory,
  172 |       (database) => database.exec('DROP TRIGGER fail_palette'),
  173 |       false,
  174 |     )
  175 |     await application.evaluate(({ ipcMain }) => {
  176 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('settings:save')
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
  248 |       (database) => database.exec("UPDATE appearance_settings SET palette='lilac'"),
  249 |       false,
  250 |     )
  251 |     await page.getByRole('button', { name: '重试读取显示设置', exact: true }).click()
> 252 |     await expect(page.getByRole('radio', { name: '暮山紫', exact: true })).toBeChecked()
      |                                                                         ^ Error: expect(locator).toBeChecked() failed
  253 |     await expect(page.locator('html')).toHaveAttribute('data-palette', 'lilac')
  254 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  255 |   } finally {
  256 |     await stop(application)
  257 |   }
  258 | })
  259 | 
  260 | test('配色跟随系统、窄窗口、双环输入焦点和减少动态效果保持可操作', async ({
  261 |   testDataDirectory,
  262 | }, info) => {
  263 |   const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  264 |   try {
  265 |     await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  266 |     await choose(page, '暮山紫', 'system', 22)
  267 |     await save(page)
  268 |     await expect(page.locator('html')).toHaveCSS('background-color', palettes[3].dark)
  269 |     await expect(page.locator('body')).toHaveCSS('font-weight', '360')
  270 |     await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  271 |     await expect(page.locator('html')).toHaveCSS('background-color', palettes[3].light)
  272 |     await expect(page.locator('body')).toHaveCSS('font-weight', '400')
  273 |     await application.evaluate(({ BrowserWindow }) =>
  274 |       BrowserWindow.getAllWindows()[0]?.setSize(900, 620),
  275 |     )
  276 |     await expect(page.locator('.page-navigation')).toHaveCSS('flex-direction', 'row')
  277 |     const geometry = await page.evaluate(() => {
  278 |       const browser = globalThis as unknown as {
  279 |         document: { documentElement: { scrollWidth: number; clientWidth: number } }
  280 |       }
  281 |       return {
  282 |         content: browser.document.documentElement.scrollWidth,
  283 |         viewport: browser.document.documentElement.clientWidth,
  284 |       }
  285 |     })
  286 |     expect(geometry.content).toBeLessThanOrEqual(geometry.viewport)
  287 |     await beginHistoryPractice(page)
  288 |     const input = page.getByRole('textbox', { name: '我的答案', exact: true })
  289 |     await input.focus()
  290 |     await input.fill('窄窗口输入仍然可见')
  291 |     await expect(input).toHaveCSS('outline-style', 'none')
  292 |     await expect(input).not.toHaveCSS('box-shadow', 'none')
  293 |     await expect(page.locator('.practice-save')).toHaveText('已保存')
  294 |     await expect(page.getByRole('button', { name: '查看参考答案', exact: true })).toBeInViewport()
  295 |     await captureHistory(application, page, info, 'palette-narrow-input.png')
  296 |     await page.getByRole('button', { name: '返回首页', exact: true }).click()
  297 |     await page.getByText('筛选练习题目', { exact: true }).click()
  298 |     await expect(page.getByLabel('练习搜索', { exact: true })).toBeVisible()
  299 |     await page.getByText('筛选练习题目', { exact: true }).click()
  300 |     await expect(page.getByLabel('练习搜索', { exact: true })).not.toBeVisible()
  301 |   } finally {
  302 |     await stop(application)
  303 |   }
  304 | })
  305 | 
  306 | test('复制成功反馈2.5秒自熄，重复复制重置、错误保留且切题拒绝晚到响应', async ({
  307 |   testDataDirectory,
  308 | }, info) => {
  309 |   const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  310 |   try {
  311 |     await selectHistoryQuestion(page)
  312 |     await page.getByRole('button', { name: '展开参考答案', exact: true }).click()
  313 |     const block = page.locator('.question-reader .code-block').first()
  314 |     await application.evaluate(({ clipboard }) => {
  315 |       clipboard.writeText = (text) => Reflect.set(globalThis, 'paletteCopied', text)
  316 |     })
  317 |     const copy = block.getByRole('button', { name: '复制代码', exact: true })
  318 |     await copy.click()
  319 |     await expect(block.getByText('已复制', { exact: true })).toBeVisible()
  320 |     await copy.click()
  321 |     await expect(block.locator('.copy-feedback[data-success=true]')).toHaveCount(1)
  322 |     expect(await application.evaluate(() => Reflect.get(globalThis, 'paletteCopied'))).toBe(
  323 |       'int value = 1;\n',
  324 |     )
  325 |     await expect(block.locator('.copy-feedback')).toHaveCount(0, { timeout: 4000 })
  326 |     await application.evaluate(({ clipboard }) => {
  327 |       clipboard.writeText = () => {
  328 |         throw new Error('测试复制失败')
  329 |       }
  330 |     })
  331 |     await copy.click()
  332 |     await expect(block.locator('.copy-feedback[data-success=false]')).toBeVisible()
  333 |     // 此等待验证错误不会被成功自熄计时清除，不用于等待业务状态。
  334 |     await page.waitForTimeout(2700)
  335 |     await expect(block.locator('.copy-feedback[data-success=false]')).toBeVisible()
  336 |     await application.evaluate(({ ipcMain }) => {
  337 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:copy-code')
  338 |       ipcMain.removeHandler('library:copy-code')
  339 |       ipcMain.handle(
  340 |         'library:copy-code',
  341 |         (...args) =>
  342 |           new Promise((resolve) =>
  343 |             Reflect.set(globalThis, 'releasePaletteCopy', async () =>
  344 |               resolve(await original(...args)),
  345 |             ),
  346 |           ),
  347 |       )
  348 |     })
  349 |     await copy.click()
  350 |     await expect
  351 |       .poll(() => application.evaluate(() => typeof Reflect.get(globalThis, 'releasePaletteCopy')))
  352 |       .toBe('function')
```