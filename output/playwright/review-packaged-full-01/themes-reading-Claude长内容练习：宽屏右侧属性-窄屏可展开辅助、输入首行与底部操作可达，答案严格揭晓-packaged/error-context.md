# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: themes-reading.spec.ts >> Claude长内容练习：宽屏右侧属性/窄屏可展开辅助、输入首行与底部操作可达，答案严格揭晓
- Location: tests\e2e\themes-reading.spec.ts:145:5

# Error details

```
Error: locator.click: Error: strict mode violation: locator('.practice-filter-options summary') resolved to 2 elements:
    1) <summary>筛选练习题目</summary> aka getByText('筛选练习题目')
    2) <summary>最近练习与排序</summary> aka getByText('最近练习与排序')

Call log:
  - waiting for locator('.practice-filter-options summary')

```

# Test source

```ts
  53  |   testDataDirectory,
  54  | }, info) => {
  55  |   const { application, page } = await prepareReading(testDataDirectory, info.project.name)
  56  |   try {
  57  |     await installThemeFile(application, page, resolve('themes/examples/paper-ink.ep-theme.json'))
  58  |     await openPage(page, '题库')
  59  |     await page.getByLabel('专题', { exact: true }).selectOption('theme-many')
  60  |     await page.getByRole('searchbox', { name: '题库搜索', exact: true }).fill('主题阅读')
  61  |     await page.getByLabel('题库难度', { exact: true }).selectOption('基础')
  62  |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  63  |     const pagination = page.getByRole('navigation', { name: '题目分页', exact: true })
  64  |     await pagination.getByRole('button', { name: '下一页', exact: true }).click()
  65  |     const selected = page
  66  |       .getByRole('complementary', { name: '题目列表', exact: true })
  67  |       .getByRole('button', { name: / · q-25(?:\s|$)/ })
  68  |     await selected.click()
  69  |     const reader = page.getByRole('article', { name: '题目内容', exact: true })
  70  |     await reader.evaluate((element) => Reflect.set(element, 'themeReaderProbe', 'same-reader'))
  71  |     const before = themeBusinessSnapshot(testDataDirectory)
  72  |     for (const [name, mode, width] of [
  73  |       ['Claude 风格', 'light', 1440],
  74  |       ['Claude 风格', 'dark', 900],
  75  |       ['纸页墨色', 'dark', 900],
  76  |     ] as const) {
  77  |       await chooseTheme(page, name, mode, 22)
  78  |       await application.evaluate(
  79  |         ({ BrowserWindow }, width) =>
  80  |           BrowserWindow.getAllWindows()[0]!.setBounds({ width, height: 1000 }),
  81  |         width,
  82  |       )
  83  |       await openPage(page, '题库')
  84  |       const returnToList = page.getByRole('button', { name: '返回题目列表', exact: true })
  85  |       const narrow = await returnToList.isVisible()
  86  |       if (narrow) await returnToList.click()
  87  |       await expect(page.getByRole('searchbox', { name: '题库搜索', exact: true })).toHaveValue(
  88  |         '主题阅读',
  89  |       )
  90  |       await expect(page.getByLabel('题库难度', { exact: true })).toHaveValue('基础')
  91  |       await expect(pagination).toContainText('2 / 2')
  92  |       await expect(selected).toHaveAttribute('aria-current', 'true')
  93  |       if (narrow) await selected.click()
  94  |       expect(await reader.evaluate((element) => Reflect.get(element, 'themeReaderProbe'))).toBe(
  95  |         'same-reader',
  96  |       )
  97  |       const code = reader.locator('.code-block pre').first()
  98  |       const overflow = await code.evaluate(
  99  |         (element) =>
  100 |           Number(Reflect.get(element, 'scrollWidth')) > Number(Reflect.get(element, 'clientWidth')),
  101 |       )
  102 |       expect(overflow).toBe(true)
  103 |       await code.evaluate((element) => Reflect.set(element, 'scrollLeft', 500))
  104 |       expect(
  105 |         await code.evaluate((element) => Number(Reflect.get(element, 'scrollLeft'))),
  106 |       ).toBeGreaterThan(0)
  107 |       const image = reader.getByRole('button', { name: '放大查看：主题大图', exact: true })
  108 |       await image.click()
  109 |       const dialog = page.getByRole('dialog', { name: '图片预览：主题大图', exact: true })
  110 |       await expect(dialog).toBeVisible()
  111 |       await expect
  112 |         .poll(() =>
  113 |           dialog
  114 |             .getByRole('img')
  115 |             .evaluate((element) => Number(Reflect.get(element, 'naturalWidth'))),
  116 |         )
  117 |         .toBe(2560)
  118 |       await dialog.getByRole('button', { name: '放大图片', exact: true }).click()
  119 |       await expect(dialog).toContainText('150%')
  120 |       await dialog.getByRole('button', { name: '关闭图片', exact: true }).click()
  121 |       await expect(image).toBeFocused()
  122 |       const reveal = reader.getByRole('button', { name: '展开参考答案', exact: true })
  123 |       if (await reveal.isVisible()) await reveal.click()
  124 |       await reader.getByText('THEME-ANSWER-END', { exact: true }).scrollIntoViewIfNeeded()
  125 |       await expect(reader.getByText('THEME-ANSWER-END', { exact: true })).toBeVisible()
  126 |       await noDocumentOverflow(page)
  127 |       expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
  128 |     }
  129 |     const returnToList = page.getByRole('button', { name: '返回题目列表', exact: true })
  130 |     if (await returnToList.isVisible()) await returnToList.click()
  131 |     await page.getByRole('searchbox', { name: '题库搜索', exact: true }).fill('没有匹配的主题样本')
  132 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  133 |     await expect(page.getByText('当前筛选没有匹配题目。', { exact: true })).toBeVisible()
  134 |     await chooseTheme(page, 'Claude 风格', 'dark', 22)
  135 |     await openPage(page, '题库')
  136 |     await expect(page.getByRole('searchbox', { name: '题库搜索', exact: true })).toHaveValue(
  137 |       '没有匹配的主题样本',
  138 |     )
  139 |     await expect(page.getByText('当前筛选没有匹配题目。', { exact: true })).toBeVisible()
  140 |   } finally {
  141 |     await stop(application)
  142 |   }
  143 | })
  144 | 
  145 | test('Claude长内容练习：宽屏右侧属性/窄屏可展开辅助、输入首行与底部操作可达，答案严格揭晓', async ({
  146 |   testDataDirectory,
  147 | }, info) => {
  148 |   const { application, page } = await prepareReading(testDataDirectory, info.project.name)
  149 |   try {
  150 |     await chooseTheme(page, 'Claude 风格', 'dark', 22)
  151 |     await openPage(page, '开始练习')
  152 |     await page.getByLabel('练习专题', { exact: true }).selectOption('theme-many')
> 153 |     await page.locator('.practice-filter-options summary').click()
      |                                                            ^ Error: locator.click: Error: strict mode violation: locator('.practice-filter-options summary') resolved to 2 elements:
  154 |     await page.getByRole('searchbox', { name: '练习搜索', exact: true }).fill('主题阅读 25')
  155 |     await expect(page.getByText('匹配 1 题', { exact: true })).toBeVisible()
  156 |     await page.getByRole('button', { name: '开始练习', exact: true }).click()
  157 |     for (const width of [1440, 900]) {
  158 |       await application.evaluate(
  159 |         ({ BrowserWindow }, width) =>
  160 |           BrowserWindow.getAllWindows()[0]!.setBounds({ width, height: 1000 }),
  161 |         width,
  162 |       )
  163 |       await expect(page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
  164 |       const auxiliary = page.getByLabel('练习辅助面板', { exact: true })
  165 |       await expect(page.locator('.practice-heading')).toContainText('主题长内容')
  166 |       await expect(auxiliary).toContainText('已揭晓')
  167 |       if (width === 900) {
  168 |         await page.getByRole('button', { name: '隐藏辅助面板', exact: true }).click()
  169 |         await expect(auxiliary).toBeHidden()
  170 |         await page.getByRole('button', { name: '显示辅助面板', exact: true }).click()
  171 |         await expect(auxiliary).toBeVisible()
  172 |       }
  173 |       await page.locator('.practice-heading').scrollIntoViewIfNeeded()
  174 |       await captureHistory(application, page, info, `claude-practice-${width}.png`)
  175 |       const input = page.getByRole('textbox', { name: '我的答案', exact: true })
  176 |       const imagesBeforeFocus = await page
  177 |         .locator('.practice-reading img')
  178 |         .evaluateAll((elements) =>
  179 |           elements.map((element) => ({
  180 |             complete: Reflect.get(element, 'complete'),
  181 |             width: Reflect.get(element, 'naturalWidth'),
  182 |             height: Reflect.get(element, 'clientHeight'),
  183 |           })),
  184 |         )
  185 |       await input.focus()
  186 |       await page
  187 |         .locator('.practice-reading img')
  188 |         .evaluateAll((elements) =>
  189 |           Promise.all(
  190 |             elements.map((element) =>
  191 |               (element as unknown as { decode: () => Promise<void> }).decode(),
  192 |             ),
  193 |           ),
  194 |         )
  195 |       await page.evaluate(
  196 |         () =>
  197 |           new Promise<void>((done) =>
  198 |             (
  199 |               globalThis as unknown as { requestAnimationFrame: (callback: () => void) => number }
  200 |             ).requestAnimationFrame(() =>
  201 |               (
  202 |                 globalThis as unknown as { requestAnimationFrame: (callback: () => void) => number }
  203 |               ).requestAnimationFrame(() => done()),
  204 |             ),
  205 |           ),
  206 |       )
  207 |       const inputBounds = await input.boundingBox(),
  208 |         actions = await page.locator('.practice-actions').boundingBox()
  209 |       await info.attach(`focus-geometry-${width}.json`, {
  210 |         body: JSON.stringify({
  211 |           inputBounds,
  212 |           actions,
  213 |           imagesBeforeFocus,
  214 |           imagesAfterFocus: await page.locator('.practice-reading img').evaluateAll((elements) =>
  215 |             elements.map((element) => ({
  216 |               complete: Reflect.get(element, 'complete'),
  217 |               width: Reflect.get(element, 'naturalWidth'),
  218 |               height: Reflect.get(element, 'clientHeight'),
  219 |             })),
  220 |           ),
  221 |           focused: await input.evaluate((element) => Reflect.get(element, 'id')),
  222 |         }),
  223 |         contentType: 'application/json',
  224 |       })
  225 |       expect(inputBounds).not.toBeNull()
  226 |       expect(actions).not.toBeNull()
  227 |       expect(inputBounds!.y).toBeGreaterThanOrEqual(0)
  228 |       expect(inputBounds!.y + 50).toBeLessThan(actions!.y)
  229 |       await expect(page.getByRole('button', { name: '查看参考答案', exact: true })).toBeVisible()
  230 |       await noDocumentOverflow(page)
  231 |     }
  232 |     await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  233 |     await page.getByText('THEME-ANSWER-END', { exact: true }).scrollIntoViewIfNeeded()
  234 |     await expect(page.getByRole('button', { name: '掌握', exact: true })).toBeVisible()
  235 |     await expect(page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ })).toBeVisible()
  236 |     const finalActions = await page.locator('.practice-actions').boundingBox()
  237 |     const viewportHeight = await page
  238 |       .locator('html')
  239 |       .evaluate((element) => Number(Reflect.get(element, 'clientHeight')))
  240 |     expect(finalActions!.y).toBeGreaterThanOrEqual(0)
  241 |     expect(finalActions!.y + finalActions!.height).toBeLessThanOrEqual(viewportHeight)
  242 |   } finally {
  243 |     await stop(application)
  244 |   }
  245 | })
  246 | 
```