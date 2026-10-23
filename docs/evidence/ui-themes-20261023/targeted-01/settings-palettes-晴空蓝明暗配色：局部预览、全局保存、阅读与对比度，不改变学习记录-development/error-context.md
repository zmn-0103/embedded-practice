# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: settings-palettes.spec.ts >> 晴空蓝明暗配色：局部预览、全局保存、阅读与对比度，不改变学习记录
- Location: tests\e2e\settings-palettes.spec.ts:82:7

# Error details

```
Error: expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 4.5
Received:    2.7745459405266772
```

# Test source

```ts
  18  |   { id: 'lilac', name: '暮山紫', light: 'rgb(245, 243, 248)', dark: 'rgb(33, 27, 41)' },
  19  | ] as const
  20  | 
  21  | function stored(directory: string) {
  22  |   return withHistoryDatabase(directory, (database) =>
  23  |     database
  24  |       .prepare('SELECT theme,palette,font_size AS fontSize FROM appearance_settings WHERE id=1')
  25  |       .get(),
  26  |   )
  27  | }
  28  | async function choose(
  29  |   page: Page,
  30  |   name: string,
  31  |   theme: AppearanceSettings['theme'],
  32  |   fontSize: number,
  33  | ) {
  34  |   await openPage(page, '设置与数据')
  35  |   await page.getByRole('radio', { name, exact: true }).check()
  36  |   await page.getByLabel('显示主题', { exact: true }).selectOption(theme)
  37  |   await page.getByLabel('正文字号', { exact: true }).selectOption(String(fontSize))
  38  | }
  39  | async function save(page: Page) {
  40  |   await page.getByRole('button', { name: '保存显示设置', exact: true }).click()
  41  |   await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
  42  | }
  43  | async function closeNormally(application: ElectronApplication) {
  44  |   const closed = application.waitForEvent('close')
  45  |   await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.close())
  46  |   await closed
  47  | }
  48  | async function contrast(page: Page) {
  49  |   return page.evaluate(() => {
  50  |     const browser = globalThis as unknown as {
  51  |       document: { querySelector: (selector: string) => unknown }
  52  |       getComputedStyle: (element: unknown) => { color: string; backgroundColor: string }
  53  |     }
  54  |     const style = (selector: string) =>
  55  |       browser.getComputedStyle(browser.document.querySelector(selector))
  56  |     const luminance = (rgb: string) =>
  57  |       rgb
  58  |         .match(/[\d.]+/g)!
  59  |         .slice(0, 3)
  60  |         .map(Number)
  61  |         .map((value) => {
  62  |           const channel = value / 255
  63  |           return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  64  |         })
  65  |         .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index]!, 0)
  66  |     const ratio = (a: string, b: string) => {
  67  |       const values = [luminance(a), luminance(b)].sort((left, right) => right - left)
  68  |       return (values[0]! + 0.05) / (values[1]! + 0.05)
  69  |     }
  70  |     const panel = style('.settings-pane'),
  71  |       description = style('.appearance-save-row .muted'),
  72  |       primary = style('.appearance-save-row button')
  73  |     return {
  74  |       body: ratio(panel.color, panel.backgroundColor),
  75  |       secondary: ratio(description.color, panel.backgroundColor),
  76  |       primary: ratio(primary.color, primary.backgroundColor),
  77  |     }
  78  |   })
  79  | }
  80  | 
  81  | for (const palette of palettes) {
  82  |   test(`${palette.name}明暗配色：局部预览、全局保存、阅读与对比度，不改变学习记录`, async ({
  83  |     testDataDirectory,
  84  |   }, info) => {
  85  |     const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  86  |     try {
  87  |       const before = historySnapshot(testDataDirectory)
  88  |       const measurements = []
  89  |       for (const theme of ['light', 'dark'] as const) {
  90  |         const oldPalette = await page.locator('html').getAttribute('data-palette')
  91  |         const oldTheme = await page.locator('html').getAttribute('data-theme')
  92  |         const size = theme === 'light' ? 15 : 22
  93  |         await choose(page, palette.name, theme, size)
  94  |         await expect(page.locator('html')).toHaveAttribute('data-palette', oldPalette!)
  95  |         await expect(page.locator('html')).toHaveAttribute('data-theme', oldTheme!)
  96  |         await expect(page.getByLabel('显示设置局部预览', { exact: true })).toHaveCSS(
  97  |           'background-color',
  98  |           palette[theme],
  99  |         )
  100 |         const pageDescription = await page.locator('.page-description').evaluate(
  101 |           (element) =>
  102 |             (
  103 |               globalThis as unknown as {
  104 |                 getComputedStyle: (element: unknown) => { color: string }
  105 |               }
  106 |             ).getComputedStyle(element).color,
  107 |         )
  108 |         await expect(page.locator('.appearance-save-row .muted')).toHaveCSS(
  109 |           'color',
  110 |           pageDescription,
  111 |         )
  112 |         await save(page)
  113 |         await expect(page.locator('html')).toHaveAttribute('data-palette', palette.id)
  114 |         await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
  115 |         await expect(page.locator('html')).toHaveCSS('background-color', palette[theme])
  116 |         expect(stored(testDataDirectory)).toEqual({ theme, palette: palette.id, fontSize: size })
  117 |         const ratios = await contrast(page)
> 118 |         for (const value of Object.values(ratios)) expect(value).toBeGreaterThanOrEqual(4.5)
      |                                                                  ^ Error: expect(received).toBeGreaterThanOrEqual(expected)
  119 |         measurements.push({ theme, ratios })
  120 |         await page.getByRole('radio', { name: palette.name, exact: true }).scrollIntoViewIfNeeded()
  121 |         await captureHistory(application, page, info, `palette-${palette.id}-${theme}.png`)
  122 |         await selectHistoryQuestion(page)
  123 |         await page.getByRole('button', { name: '展开参考答案', exact: true }).click()
  124 |         await expect(page.locator('.question-reader pre code')).toHaveText('int value = 1;\n')
  125 |         await expect(page.locator('.question-reader pre code')).toHaveCSS('font-size', `${size}px`)
  126 |         await expect(page.locator('.question-reader img')).toHaveCSS('filter', 'none')
  127 |         await openPage(page, '学习记录')
  128 |         await expect(page.getByLabel('当前版本学习总览', { exact: true })).toBeVisible()
  129 |         await openPage(page, '开始练习')
  130 |         await expect(page.locator('html')).toHaveAttribute('data-palette', palette.id)
  131 |         expect(historySnapshot(testDataDirectory)).toEqual(before)
  132 |       }
  133 |       await info.attach(`palette-${palette.id}-contrast.json`, {
  134 |         body: JSON.stringify(measurements),
  135 |         contentType: 'application/json',
  136 |       })
  137 |     } finally {
  138 |       await stop(application)
  139 |     }
  140 |   })
  141 | }
  142 | 
  143 | test('配色真实写失败/丢响应保留选择，键盘切换后正常重开保留草稿', async ({
  144 |   testDataDirectory,
  145 | }, info) => {
  146 |   const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  147 |   let reopened: ElectronApplication | undefined
  148 |   try {
  149 |     await beginHistoryPractice(page)
  150 |     await page
  151 |       .getByRole('textbox', { name: '我的答案', exact: true })
  152 |       .fill('主题切换不能改变草稿\n    int kept = 7;')
  153 |     await page.getByRole('button', { name: '返回首页', exact: true }).click()
  154 |     const before = historySnapshot(testDataDirectory)
  155 |     withHistoryDatabase(
  156 |       testDataDirectory,
  157 |       (database) =>
  158 |         database.exec(
  159 |           "CREATE TRIGGER fail_palette BEFORE UPDATE ON appearance_settings BEGIN SELECT RAISE(ABORT,'配色写入失败'); END",
  160 |         ),
  161 |       false,
  162 |     )
  163 |     await choose(page, '晴空蓝', 'dark', 22)
  164 |     await page.getByRole('button', { name: '保存显示设置', exact: true }).click()
  165 |     await expect(page.getByRole('alert')).toContainText('显示设置暂不可用')
  166 |     await expect(page.getByRole('radio', { name: '晴空蓝', exact: true })).toBeChecked()
  167 |     await expect(page.locator('html')).toHaveAttribute('data-palette', 'forest')
  168 |     expect(stored(testDataDirectory)).toEqual({ theme: 'system', palette: 'forest', fontSize: 17 })
  169 |     withHistoryDatabase(
  170 |       testDataDirectory,
  171 |       (database) => database.exec('DROP TRIGGER fail_palette'),
  172 |       false,
  173 |     )
  174 |     await application.evaluate(({ ipcMain }) => {
  175 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('settings:save')
  176 |       let lost = false
  177 |       ipcMain.removeHandler('settings:save')
  178 |       ipcMain.handle('settings:save', async (...args) => {
  179 |         const result = await original(...args)
  180 |         if (!lost && result.ok) {
  181 |           lost = true
  182 |           return undefined
  183 |         }
  184 |         return result
  185 |       })
  186 |     })
  187 |     await page.getByRole('button', { name: '重试保存显示设置', exact: true }).click()
  188 |     await expect(page.getByRole('alert')).toContainText('显示设置保存结果尚未确认')
  189 |     expect(stored(testDataDirectory)).toEqual({ theme: 'dark', palette: 'ocean', fontSize: 22 })
  190 |     await expect(page.locator('html')).toHaveAttribute('data-palette', 'forest')
  191 |     await page.getByRole('button', { name: '重试保存显示设置', exact: true }).click()
  192 |     await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
  193 |     const ocean = page.getByRole('radio', { name: '晴空蓝', exact: true })
  194 |     await ocean.focus()
  195 |     await ocean.press('ArrowRight')
  196 |     await expect(page.getByRole('radio', { name: '暖沙金', exact: true })).toBeChecked()
  197 |     await expect(page.locator('html')).toHaveAttribute('data-palette', 'ocean')
  198 |     await save(page)
  199 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  200 |     await closeNormally(application)
  201 |     const next = await launchApplication(testDataDirectory, info.project.name)
  202 |     reopened = next.application
  203 |     await expect(next.page.locator('html')).toHaveAttribute('data-palette', 'sand')
  204 |     await expect(next.page.locator('html')).toHaveAttribute('data-theme', 'dark')
  205 |     expect(stored(testDataDirectory)).toEqual({ theme: 'dark', palette: 'sand', fontSize: 22 })
  206 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  207 |     await next.page.getByRole('button', { name: '继续练习', exact: true }).click()
  208 |     await expect(next.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  209 |       '主题切换不能改变草稿\n    int kept = 7;',
  210 |     )
  211 |   } finally {
  212 |     await stop(application)
  213 |     if (reopened) await stop(reopened)
  214 |   }
  215 | })
  216 | 
  217 | test('配色跟随系统、窄窗口、双环输入焦点和减少动态效果保持可操作', async ({
  218 |   testDataDirectory,
```