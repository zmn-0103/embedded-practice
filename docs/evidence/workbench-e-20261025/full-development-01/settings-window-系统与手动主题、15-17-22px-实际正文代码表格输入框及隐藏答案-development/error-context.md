# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: settings-window.spec.ts >> 系统与手动主题、15/17/22px 实际正文代码表格输入框及隐藏答案
- Location: tests\e2e\settings-window.spec.ts:84:5

# Error details

```
Error: expect(locator).not.toBeVisible() failed

Locator:  getByRole('navigation', { name: '主要页面' })
Expected: not visible
Received: visible
Timeout:  10000ms

Call log:
  - Expect "not toBeVisible" getByRole('navigation', { name: '主要页面' }) with timeout 10000ms
  - waiting for getByRole('navigation', { name: '主要页面' })
    24 × locator resolved to <nav aria-label="主要页面" class="page-navigation">…</nav>
       - unexpected value "visible"

```

```yaml
- navigation "主要页面":
  - link "学习总览" [disabled]:
    - /url: "#overview"
  - link "知识板块" [disabled]:
    - /url: "#boards"
  - link "开始练习" [disabled]:
    - /url: "#practice"
  - link "题库" [disabled]:
    - /url: "#library"
  - link "学习记录" [disabled]:
    - /url: "#records"
  - link "设置与数据" [disabled]:
    - /url: "#settings"
```

# Test source

```ts
  38  |   await expect(page.locator('html')).toHaveCSS(
  39  |     'background-color',
  40  |     dark ? 'rgb(20, 27, 24)' : 'rgb(245, 246, 244)',
  41  |   )
  42  |   await expect(page.locator('body')).toHaveCSS(
  43  |     'color',
  44  |     dark ? 'rgb(228, 237, 231)' : 'rgb(32, 51, 45)',
  45  |   )
  46  | }
  47  | 
  48  | test('四入口初始空库、独立页面、地址与显示默认值保持', async ({ testDataDirectory }, info) => {
  49  |   const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  50  |   try {
  51  |     const url = page.url()
  52  |     await openPage(page, '开始练习')
  53  |     await expect(page.getByRole('heading', { name: '开始一轮练习' })).toBeVisible()
  54  |     await expect(page.getByRole('button', { name: '开始练习', exact: true })).toBeDisabled()
  55  |     await expect(page.getByRole('button', { name: '导入题库', exact: true })).not.toBeVisible()
  56  |     await openPage(page, '题库')
  57  |     await expect(page.getByRole('button', { name: '导入题库', exact: true })).toBeVisible()
  58  |     await expect(page.getByRole('heading', { name: '开始一轮练习' })).not.toBeVisible()
  59  |     await openPage(page, '学习记录')
  60  |     await expect(page.getByLabel('当前版本学习总览', { exact: true })).toBeVisible()
  61  |     await expect(page.getByRole('button', { name: '导入题库', exact: true })).not.toBeVisible()
  62  |     await openPage(page, '设置与数据')
  63  |     await expect(page.getByLabel('显示主题', { exact: true })).toHaveValue('system')
  64  |     await expect(page.getByLabel('正文字号', { exact: true })).toHaveValue('17')
  65  |     expect(stored(testDataDirectory)).toEqual([
  66  |       { id: 1, theme: 'system', font_size: 17, palette: 'forest' },
  67  |     ])
  68  |     expect(page.url()).toBe(url)
  69  |     await expect(page.getByRole('button', { name: '导出完整备份', exact: true })).toBeVisible()
  70  |     await expect(page.getByRole('button', { name: '选择备份并预览', exact: true })).toBeVisible()
  71  |     expect(
  72  |       await page
  73  |         .getByLabel('完整备份与恢复预览', { exact: true })
  74  |         .getByRole('button', { name: /备份|恢复/ })
  75  |         .count(),
  76  |     ).toBe(2)
  77  |     expect(historySnapshot(testDataDirectory).questions).toEqual([])
  78  |     await captureHistory(application, page, info, 'settings-default.png')
  79  |   } finally {
  80  |     await stop(application)
  81  |   }
  82  | })
  83  | 
  84  | test('系统与手动主题、15/17/22px 实际正文代码表格输入框及隐藏答案', async ({
  85  |   testDataDirectory,
  86  | }, info) => {
  87  |   const { application, page, file } = await prepareHistory(testDataDirectory, info.project.name)
  88  |   try {
  89  |     await writeFile(
  90  |       file,
  91  |       historyBank().replace(
  92  |         'HISTORY-BODY-OLD-history-a-1',
  93  |         'HISTORY-BODY-OLD-history-a-1\n\n| 项目 | 内容 |\n| --- | --- |\n| 字号 | SETTINGS-TABLE |',
  94  |       ),
  95  |     )
  96  |     await importHistoryFiles(application, page, [file])
  97  |     await page.emulateMedia({ colorScheme: 'dark' })
  98  |     await colors(page, true)
  99  |     await page.emulateMedia({ colorScheme: 'light' })
  100 |     await colors(page, false)
  101 |     let active = false
  102 |     for (const [theme, size, systemDark] of [
  103 |       ['light', 15, true],
  104 |       ['system', 17, false],
  105 |       ['dark', 22, false],
  106 |     ] as const) {
  107 |       const before = historySnapshot(testDataDirectory)
  108 |       await page.emulateMedia({ colorScheme: systemDark ? 'dark' : 'light' })
  109 |       await save(page, theme, size)
  110 |       await colors(page, theme === 'dark')
  111 |       expect(historySnapshot(testDataDirectory)).toEqual(before)
  112 |       await captureHistory(application, page, info, `settings-${theme}-${size}.png`)
  113 |       await selectHistoryQuestion(page)
  114 |       const body = page.getByRole('article', { name: '题目内容' })
  115 |       await expect(body.getByText('HISTORY-BODY-OLD-history-a-1', { exact: true })).toHaveCSS(
  116 |         'font-size',
  117 |         `${size}px`,
  118 |       )
  119 |       await expect(body.getByRole('table')).toHaveCSS('font-size', `${size}px`)
  120 |       await page.getByRole('button', { name: '展开参考答案', exact: true }).click()
  121 |       await expect(body.locator('pre code')).toHaveCSS('font-size', `${size}px`)
  122 |       await expect(body.locator('.hljs-type').first()).toHaveCSS(
  123 |         'color',
  124 |         theme === 'dark' ? 'rgb(212, 181, 255)' : 'rgb(129, 85, 187)',
  125 |       )
  126 |       await body.getByRole('table').scrollIntoViewIfNeeded()
  127 |       await captureHistory(application, page, info, `reading-${theme}-${size}.png`)
  128 |       if (active) {
  129 |         await openPage(page, '开始练习')
  130 |         await page.getByRole('button', { name: '继续练习', exact: true }).click()
  131 |       } else {
  132 |         await beginHistoryPractice(page)
  133 |         active = true
  134 |       }
  135 |       const input = page.getByRole('textbox', { name: '我的答案', exact: true })
  136 |       await expect(input).toHaveCSS('font-size', `${size}px`)
  137 |       expect(await page.locator('body').ariaSnapshot()).not.toContain('HISTORY-ANSWER')
> 138 |       await expect(page.getByRole('navigation', { name: '主要页面' })).not.toBeVisible()
      |                                                                        ^ Error: expect(locator).not.toBeVisible() failed
  139 |       await input.scrollIntoViewIfNeeded()
  140 |       await captureHistory(application, page, info, `practice-${theme}-${size}.png`)
  141 |       await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
  142 |     }
  143 |     await info.attach('appearance-rendering.json', {
  144 |       body: JSON.stringify({
  145 |         settings: stored(testDataDirectory),
  146 |         state: historySnapshot(testDataDirectory),
  147 |       }),
  148 |       contentType: 'application/json',
  149 |     })
  150 |   } finally {
  151 |     await stop(application)
  152 |   }
  153 | })
  154 | 
  155 | test('显示设置正常关闭独立重开，保留草稿位置自评收藏与历史', async ({
  156 |   testDataDirectory,
  157 | }, info) => {
  158 |   const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  159 |   let reopened: ElectronApplication | undefined
  160 |   try {
  161 |     const favorite = await page.evaluate(() =>
  162 |       (globalThis as unknown as { desktop: DesktopApi }).desktop.library.setFavorite({
  163 |         topicId: 'history-a',
  164 |         questionId: 'q-1',
  165 |         favorite: true,
  166 |       }),
  167 |     )
  168 |     expect(favorite.ok).toBe(true)
  169 |     await beginHistoryPractice(page)
  170 |     await page.getByRole('textbox', { name: '我的答案', exact: true }).fill('第一题真实作答')
  171 |     await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  172 |     await page.getByRole('button', { name: '掌握', exact: true }).click()
  173 |     await expect(page.getByLabel('练习进度')).toContainText('第 2 / 2')
  174 |     const draft = '设置重开草稿\nint saved = 22;'
  175 |     await page.getByRole('textbox', { name: '我的答案', exact: true }).fill(draft)
  176 |     await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
  177 |     await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
  178 |     const before = historySnapshot(testDataDirectory)
  179 |     await save(page, 'dark', 22)
  180 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  181 |     await normalClose(application)
  182 |     const next = await launchApplication(testDataDirectory, info.project.name)
  183 |     reopened = next.application
  184 |     await expect(next.page.locator('html')).toHaveAttribute('data-theme', 'dark')
  185 |     await expect(next.page.locator('html')).toHaveAttribute('data-font-size', '22')
  186 |     expect(stored(testDataDirectory)).toEqual([
  187 |       { id: 1, theme: 'dark', font_size: 22, palette: 'forest' },
  188 |     ])
  189 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  190 |     await next.page.getByRole('button', { name: '继续练习', exact: true }).click()
  191 |     await expect(next.page.getByLabel('练习进度')).toHaveText('第 2 / 2 题 · 顺序练习')
  192 |     await expect(next.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  193 |       draft,
  194 |     )
  195 |     expect(await next.page.locator('body').ariaSnapshot()).not.toContain('HISTORY-ANSWER')
  196 |     await info.attach('appearance-reopened.json', {
  197 |       body: JSON.stringify({
  198 |         settings: stored(testDataDirectory),
  199 |         before,
  200 |         after: historySnapshot(testDataDirectory),
  201 |       }),
  202 |       contentType: 'application/json',
  203 |     })
  204 |   } finally {
  205 |     await stop(application)
  206 |     if (reopened) await stop(reopened)
  207 |   }
  208 | })
  209 | 
  210 | test('真实设置写入失败及提交后响应丢失，原目标重试不改变学习数据', async ({
  211 |   testDataDirectory,
  212 | }, info) => {
  213 |   const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  214 |   try {
  215 |     const before = historySnapshot(testDataDirectory)
  216 |     withHistoryDatabase(
  217 |       testDataDirectory,
  218 |       (db) =>
  219 |         db.exec(
  220 |           "CREATE TRIGGER fail_appearance BEFORE UPDATE ON appearance_settings BEGIN SELECT RAISE(ABORT, '显示设置测试写入失败'); END",
  221 |         ),
  222 |       false,
  223 |     )
  224 |     await openPage(page, '设置与数据')
  225 |     await page.getByLabel('显示主题', { exact: true }).selectOption('dark')
  226 |     await page.getByLabel('正文字号', { exact: true }).selectOption('22')
  227 |     await page.getByRole('button', { name: '保存并应用', exact: true }).click()
  228 |     await expect(page.getByRole('alert')).toContainText('显示设置暂不可用')
  229 |     await expect(page.locator('html')).toHaveAttribute('data-theme', 'system')
  230 |     await expect(page.locator('html')).toHaveAttribute('data-font-size', '17')
  231 |     await expect(page.getByLabel('显示主题', { exact: true })).toHaveValue('dark')
  232 |     await expect(page.getByLabel('正文字号', { exact: true })).toHaveValue('22')
  233 |     expect(stored(testDataDirectory)).toEqual([
  234 |       { id: 1, theme: 'system', font_size: 17, palette: 'forest' },
  235 |     ])
  236 |     withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER fail_appearance'), false)
  237 |     await application.evaluate(({ ipcMain }) => {
  238 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('settings:save')
```