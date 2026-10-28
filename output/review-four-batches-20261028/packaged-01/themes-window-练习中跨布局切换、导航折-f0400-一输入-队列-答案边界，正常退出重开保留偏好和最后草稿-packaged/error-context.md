# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: themes-window.spec.ts >> 练习中跨布局切换、导航折叠与辅助隐藏保持同一输入/队列/答案边界，正常退出重开保留偏好和最后草稿
- Location: tests\e2e\themes-window.spec.ts:95:5

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator: getByRole('textbox', { name: '我的答案', exact: true })
Timeout: 10000ms
- Expected  - 1
+ Received  + 1

  主题切换保持同一练习
-     uint8_t retained = 1;
+     uint8_t retained = 1;xie

Call log:
  - Expect "toHaveValue" getByRole('textbox', { name: '我的答案', exact: true }) with timeout 10000ms
  - waiting for getByRole('textbox', { name: '我的答案', exact: true })
    23 × locator resolved to <textarea rows="6" id="practice-answer" placeholder="写下思路或代码，也可以先思考再揭晓。" aria-labelledby="practice-answer-label">主题切换保持同一练习↵    uint8_t retained = 1;xie</textarea>
       - unexpected value "主题切换保持同一练习
    uint8_t retained = 1;xie"

```

```yaml
- textbox "我的答案":
  - /placeholder: 写下思路或代码，也可以先思考再揭晓。
  - text: 主题切换保持同一练习 uint8_t retained = 1;xie
```

# Test source

```ts
  16  | } from './theme-helpers'
  17  | 
  18  | test('两个外部主题独立预览/安装/应用，源文件删除后重开、版本更新与卸载均保留学习记录', async ({
  19  |   testDataDirectory,
  20  | }, info) => {
  21  |   const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  22  |   let reopened: ElectronApplication | undefined
  23  |   try {
  24  |     await verifyThemeTarget(application, page, testDataDirectory, info.project.name)
  25  |     await page.emulateMedia({ colorScheme: 'light' })
  26  |     const before = themeBusinessSnapshot(testDataDirectory)
  27  |     const paper = join(testDataDirectory, '纸页.ep-theme.json'),
  28  |       blue = join(testDataDirectory, '夜航.ep-theme.json')
  29  |     await copyFile(resolve('themes/examples/paper-ink.ep-theme.json'), paper)
  30  |     await copyFile(resolve('themes/examples/circuit-blue.ep-theme.json'), blue)
  31  |     await previewThemeFile(application, page, paper)
  32  |     await expect(page.getByLabel('待安装主题局部预览', { exact: true })).toHaveCSS(
  33  |       'background-color',
  34  |       'rgb(245, 241, 232)',
  35  |     )
  36  |     await expect(page.locator('html')).toHaveAttribute('data-theme-id', 'builtin.forest')
  37  |     expect((await readThemes(page)).entries).toHaveLength(5)
  38  |     await page.getByRole('button', { name: '取消安装预览', exact: true }).click()
  39  |     await installThemeFile(application, page, paper)
  40  |     await installThemeFile(application, page, blue)
  41  |     expect((await readThemes(page)).entries.filter((entry) => !entry.builtIn)).toHaveLength(2)
  42  |     await expect(page.locator('html')).toHaveAttribute('data-theme-id', 'builtin.forest')
  43  |     await chooseTheme(page, '电路夜航', 'light', 15)
  44  |     await expect(page.locator('html')).toHaveAttribute('data-layout', 'study')
  45  |     await chooseTheme(page, '纸页墨色', 'dark', 22)
  46  |     await unlink(paper)
  47  |     await unlink(blue)
  48  |     expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
  49  |     await closeNormally(application)
  50  |     const next = await launchApplication(testDataDirectory, info.project.name)
  51  |     reopened = next.application
  52  |     await verifyThemeTarget(next.application, next.page, testDataDirectory, info.project.name)
  53  |     await expect(next.page.locator('html')).toHaveAttribute('data-theme-id', 'local.paper-ink')
  54  |     await expect(next.page.locator('html')).toHaveAttribute('data-theme', 'dark')
  55  |     await expect(next.page.locator('html')).toHaveAttribute('data-font-size', '22')
  56  |     const updated = { ...(await exampleTheme()), version: '1.1.0' }
  57  |     updated.dark = { ...updated.dark, background: '#26221c' }
  58  |     await writeFile(paper, JSON.stringify(updated))
  59  |     await installThemeFile(next.application, next.page, paper, '确认更新主题')
  60  |     await expect(next.page.locator('html')).toHaveCSS('background-color', 'rgb(33, 31, 27)')
  61  |     await chooseTheme(next.page, '纸页墨色', 'dark', 22)
  62  |     await expect(next.page.locator('html')).toHaveCSS('background-color', 'rgb(38, 34, 28)')
  63  |     await installThemeFile(next.application, next.page, paper, '核对已安装主题')
  64  |     for (const definition of [
  65  |       { ...updated, name: '同版不同内容' },
  66  |       { ...updated, version: '0.9.0' },
  67  |       { ...updated, id: 'builtin.forest' },
  68  |     ]) {
  69  |       await writeFile(paper, JSON.stringify(definition))
  70  |       await next.page.getByRole('button', { name: '安装本地主题…', exact: true }).click()
  71  |       await expect(next.page.getByRole('alert')).toContainText(/不同|降级|保留标识/)
  72  |       expect(
  73  |         (await readThemes(next.page)).entries.find((entry) => entry.definition.id === updated.id)
  74  |           ?.definition,
  75  |       ).toEqual(updated)
  76  |     }
  77  |     await next.page.getByRole('button', { name: '卸载 纸页墨色', exact: true }).click()
  78  |     await expect(
  79  |       next.page.getByText('这是当前主题，卸载后将切换到内置松间绿。', { exact: false }),
  80  |     ).toBeVisible()
  81  |     await next.page.getByRole('button', { name: '取消卸载', exact: true }).click()
  82  |     expect((await readAppearance(next.page)).themeId).toBe('local.paper-ink')
  83  |     await next.page.getByRole('button', { name: '卸载 纸页墨色', exact: true }).click()
  84  |     await next.page.getByRole('button', { name: '确认卸载主题', exact: true }).click()
  85  |     await expect(next.page.locator('html')).toHaveAttribute('data-theme-id', 'builtin.forest')
  86  |     expect((await readAppearance(next.page)).themeId).toBe('builtin.forest')
  87  |     expect((await readThemes(next.page)).entries.filter((entry) => !entry.builtIn)).toHaveLength(1)
  88  |     expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
  89  |   } finally {
  90  |     await stop(application)
  91  |     if (reopened) await stop(reopened)
  92  |   }
  93  | })
  94  | 
  95  | test('练习中跨布局切换、导航折叠与辅助隐藏保持同一输入/队列/答案边界，正常退出重开保留偏好和最后草稿', async ({
  96  |   testDataDirectory,
  97  | }, info) => {
  98  |   const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  99  |   let reopened: ElectronApplication | undefined
  100 |   try {
  101 |     await verifyThemeTarget(application, page, testDataDirectory, info.project.name)
  102 |     await beginHistoryPractice(page)
  103 |     const editor = page.getByRole('textbox', { name: '我的答案', exact: true })
  104 |     const draft = '主题切换保持同一练习\n    uint8_t retained = 1;'
  105 |     await editor.fill(draft)
  106 |     await expect(page.locator('.practice-save')).toHaveText('已保存')
  107 |     await editor.evaluate((element) => Reflect.set(element, 'themeIdentityProbe', 'same-editor'))
  108 |     const before = themeBusinessSnapshot(testDataDirectory)
  109 |     await page.locator('.quick-appearance summary').click()
  110 |     for (const id of ['builtin.claude', 'builtin.ocean', 'builtin.claude']) {
  111 |       await page.getByLabel('快捷主题选择', { exact: true }).selectOption(id)
  112 |       const apply = page.getByRole('button', { name: '应用所选主题', exact: true })
  113 |       await apply.click()
  114 |       await expect(page.locator('html')).toHaveAttribute('data-theme-id', id)
  115 |       await expect(apply).toBeFocused()
> 116 |       await expect(editor).toHaveValue(draft)
      |                            ^ Error: expect(locator).toHaveValue(expected) failed
  117 |       expect(await editor.evaluate((element) => Reflect.get(element, 'themeIdentityProbe'))).toBe(
  118 |         'same-editor',
  119 |       )
  120 |       await expect(page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
  121 |       expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
  122 |     }
  123 |     const libraryLink = page
  124 |       .getByRole('navigation', { name: '主要页面', exact: true })
  125 |       .getByRole('link', { name: '题库', exact: true })
  126 |     await expect(libraryLink).toHaveAttribute('aria-disabled', 'true')
  127 |     await libraryLink.dispatchEvent('click')
  128 |     await expect(editor).toBeVisible()
  129 |     await page.getByRole('button', { name: '收起导航', exact: true }).click()
  130 |     await expect(page.getByRole('button', { name: '展开导航', exact: true })).toBeFocused()
  131 |     await expect(page.locator('html')).toHaveAttribute('data-navigation-collapsed', 'true')
  132 |     await page.getByRole('button', { name: '隐藏辅助面板', exact: true }).click()
  133 |     await expect(page.getByLabel('练习辅助面板', { exact: true })).toBeHidden()
  134 |     expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
  135 |     await expect(editor).toHaveValue(draft)
  136 |     const finalDraft = draft + '\n关闭前最后输入'
  137 |     await editor.fill(finalDraft)
  138 |     await closeNormally(application)
  139 |     const next = await launchApplication(testDataDirectory, info.project.name)
  140 |     reopened = next.application
  141 |     await expect(next.page.locator('html')).toHaveAttribute('data-theme-id', 'builtin.claude')
  142 |     expect(await readAppearance(next.page)).toMatchObject({
  143 |       navigationCollapsed: true,
  144 |       auxiliaryHidden: true,
  145 |     })
  146 |     await next.page.getByRole('button', { name: '继续练习', exact: true }).click()
  147 |     await expect(next.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  148 |       finalDraft,
  149 |     )
  150 |     await expect(next.page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
  151 |   } finally {
  152 |     await stop(application)
  153 |     if (reopened) await stop(reopened)
  154 |   }
  155 | })
  156 | 
  157 | test('安装写入失败与提交后响应丢失均保留请求，原操作重试安全且外观不提前应用', async ({
  158 |   testDataDirectory,
  159 | }, info) => {
  160 |   const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  161 |   try {
  162 |     const before = themeBusinessSnapshot(testDataDirectory)
  163 |     await previewThemeFile(application, page, resolve('themes/examples/paper-ink.ep-theme.json'))
  164 |     withHistoryDatabase(
  165 |       testDataDirectory,
  166 |       (database) =>
  167 |         database.exec(
  168 |           "CREATE TRIGGER fail_theme_install BEFORE INSERT ON installed_themes BEGIN SELECT RAISE(ABORT,'injected'); END",
  169 |         ),
  170 |       false,
  171 |     )
  172 |     await page.getByRole('button', { name: '确认安装主题', exact: true }).click()
  173 |     await expect(page.getByRole('alert')).toContainText('题库服务暂不可用')
  174 |     expect((await readThemes(page)).entries).toHaveLength(5)
  175 |     withHistoryDatabase(
  176 |       testDataDirectory,
  177 |       (database) => database.exec('DROP TRIGGER fail_theme_install'),
  178 |       false,
  179 |     )
  180 |     await application.evaluate(({ ipcMain }) => {
  181 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('themes:install')
  182 |       let lost = false
  183 |       ipcMain.removeHandler('themes:install')
  184 |       ipcMain.handle('themes:install', async (...args) => {
  185 |         const result = await original(...args)
  186 |         if (!lost && result.ok) {
  187 |           lost = true
  188 |           return undefined
  189 |         }
  190 |         return result
  191 |       })
  192 |     })
  193 |     await page.getByRole('button', { name: '重试原主题操作', exact: true }).click()
  194 |     await expect(page.getByRole('alert')).toContainText('主题操作结果尚未确认')
  195 |     expect((await readThemes(page)).entries.filter((entry) => !entry.builtIn)).toHaveLength(1)
  196 |     await expect(page.locator('html')).toHaveAttribute('data-theme-id', 'builtin.forest')
  197 |     await page.getByRole('button', { name: '重试原主题操作', exact: true }).click()
  198 |     await expect(
  199 |       page.getByText('主题已安装并核对。请选择主题后保存并应用；安装不会自动改变当前外观。', {
  200 |         exact: true,
  201 |       }),
  202 |     ).toBeVisible()
  203 |     expect((await readThemes(page)).entries.filter((entry) => !entry.builtIn)).toHaveLength(1)
  204 |     expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
  205 |   } finally {
  206 |     await stop(application)
  207 |   }
  208 | })
  209 | 
  210 | test('当前外部配置损坏临时回退并保留原选择，恢复默认仅改变显示设置', async ({
  211 |   testDataDirectory,
  212 | }, info) => {
  213 |   const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  214 |   let reopened: ElectronApplication | undefined
  215 |   try {
  216 |     await installThemeFile(application, page, resolve('themes/examples/paper-ink.ep-theme.json'))
```