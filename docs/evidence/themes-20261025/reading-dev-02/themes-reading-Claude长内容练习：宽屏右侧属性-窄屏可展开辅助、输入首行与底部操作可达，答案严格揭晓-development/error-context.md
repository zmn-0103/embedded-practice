# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: themes-reading.spec.ts >> Claude长内容练习：宽屏右侧属性/窄屏可展开辅助、输入首行与底部操作可达，答案严格揭晓
- Location: tests\e2e\themes-reading.spec.ts:139:5

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 858.203125
Received:   940.953125
```

# Test source

```ts
  83  |       await openPage(page, '题库')
  84  |       await expect(page.getByRole('searchbox', { name: '题库搜索', exact: true })).toHaveValue(
  85  |         '主题阅读',
  86  |       )
  87  |       await expect(page.getByLabel('题库难度', { exact: true })).toHaveValue('基础')
  88  |       await expect(pagination).toContainText('2 / 2')
  89  |       await expect(selected).toHaveAttribute('aria-current', 'true')
  90  |       expect(await reader.evaluate((element) => Reflect.get(element, 'themeReaderProbe'))).toBe(
  91  |         'same-reader',
  92  |       )
  93  |       const code = reader.locator('.code-block pre').first()
  94  |       const overflow = await code.evaluate(
  95  |         (element) =>
  96  |           Number(Reflect.get(element, 'scrollWidth')) > Number(Reflect.get(element, 'clientWidth')),
  97  |       )
  98  |       expect(overflow).toBe(true)
  99  |       await code.evaluate((element) => Reflect.set(element, 'scrollLeft', 500))
  100 |       expect(
  101 |         await code.evaluate((element) => Number(Reflect.get(element, 'scrollLeft'))),
  102 |       ).toBeGreaterThan(0)
  103 |       const image = reader.getByRole('button', { name: '放大查看：主题大图', exact: true })
  104 |       await image.click()
  105 |       const dialog = page.getByRole('dialog', { name: '图片预览：主题大图', exact: true })
  106 |       await expect(dialog).toBeVisible()
  107 |       await expect
  108 |         .poll(() =>
  109 |           dialog
  110 |             .getByRole('img')
  111 |             .evaluate((element) => Number(Reflect.get(element, 'naturalWidth'))),
  112 |         )
  113 |         .toBe(2560)
  114 |       await dialog.getByRole('button', { name: '放大图片', exact: true }).click()
  115 |       await expect(dialog).toContainText('150%')
  116 |       await dialog.getByRole('button', { name: '关闭图片', exact: true }).click()
  117 |       await expect(image).toBeFocused()
  118 |       const reveal = reader.getByRole('button', { name: '展开参考答案', exact: true })
  119 |       if (await reveal.isVisible()) await reveal.click()
  120 |       await reader.getByText('THEME-ANSWER-END', { exact: true }).scrollIntoViewIfNeeded()
  121 |       await expect(reader.getByText('THEME-ANSWER-END', { exact: true })).toBeVisible()
  122 |       await noDocumentOverflow(page)
  123 |       expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
  124 |     }
  125 |     await page.getByRole('searchbox', { name: '题库搜索', exact: true }).fill('没有匹配的主题样本')
  126 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  127 |     await expect(page.getByText('当前筛选没有匹配题目。', { exact: true })).toBeVisible()
  128 |     await chooseTheme(page, 'Claude 风格', 'dark', 22)
  129 |     await openPage(page, '题库')
  130 |     await expect(page.getByRole('searchbox', { name: '题库搜索', exact: true })).toHaveValue(
  131 |       '没有匹配的主题样本',
  132 |     )
  133 |     await expect(page.getByText('当前筛选没有匹配题目。', { exact: true })).toBeVisible()
  134 |   } finally {
  135 |     await stop(application)
  136 |   }
  137 | })
  138 | 
  139 | test('Claude长内容练习：宽屏右侧属性/窄屏可展开辅助、输入首行与底部操作可达，答案严格揭晓', async ({
  140 |   testDataDirectory,
  141 | }, info) => {
  142 |   const { application, page } = await prepareReading(testDataDirectory, info.project.name)
  143 |   try {
  144 |     await chooseTheme(page, 'Claude 风格', 'dark', 22)
  145 |     await openPage(page, '开始练习')
  146 |     await page.getByLabel('练习专题', { exact: true }).selectOption('theme-many')
  147 |     await page.locator('.practice-filter-options summary').click()
  148 |     await page.getByRole('searchbox', { name: '练习搜索', exact: true }).fill('主题阅读 25')
  149 |     await expect(page.getByText('匹配 1 题', { exact: true })).toBeVisible()
  150 |     await page.getByRole('button', { name: '开始练习', exact: true }).click()
  151 |     for (const width of [1440, 900]) {
  152 |       await application.evaluate(
  153 |         ({ BrowserWindow }, width) =>
  154 |           BrowserWindow.getAllWindows()[0]!.setBounds({ width, height: 1000 }),
  155 |         width,
  156 |       )
  157 |       await expect(page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
  158 |       const auxiliary = page.getByLabel('练习辅助面板', { exact: true })
  159 |       await expect(auxiliary).toContainText('主题长内容')
  160 |       if (width === 900) {
  161 |         await page.getByRole('button', { name: '隐藏辅助面板', exact: true }).click()
  162 |         await expect(auxiliary).toBeHidden()
  163 |         await page.getByRole('button', { name: '显示辅助面板', exact: true }).click()
  164 |         await expect(auxiliary).toBeVisible()
  165 |       }
  166 |       await page.locator('.practice-heading').scrollIntoViewIfNeeded()
  167 |       await captureHistory(application, page, info, `claude-practice-${width}.png`)
  168 |       const input = page.getByRole('textbox', { name: '我的答案', exact: true })
  169 |       await input.focus()
  170 |       await page.evaluate(
  171 |         () =>
  172 |           new Promise<void>((done) =>
  173 |             (
  174 |               globalThis as unknown as { requestAnimationFrame: (callback: () => void) => number }
  175 |             ).requestAnimationFrame(() => done()),
  176 |           ),
  177 |       )
  178 |       const inputBounds = await input.boundingBox(),
  179 |         actions = await page.locator('.practice-actions').boundingBox()
  180 |       expect(inputBounds).not.toBeNull()
  181 |       expect(actions).not.toBeNull()
  182 |       expect(inputBounds!.y).toBeGreaterThanOrEqual(0)
> 183 |       expect(inputBounds!.y + 50).toBeLessThan(actions!.y)
      |                                   ^ Error: expect(received).toBeLessThan(expected)
  184 |       await expect(page.getByRole('button', { name: '查看参考答案', exact: true })).toBeVisible()
  185 |       await noDocumentOverflow(page)
  186 |     }
  187 |     await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  188 |     await page.getByText('THEME-ANSWER-END', { exact: true }).scrollIntoViewIfNeeded()
  189 |     await expect(page.getByRole('button', { name: '掌握', exact: true })).toBeVisible()
  190 |     await expect(page.getByRole('button', { name: '返回首页', exact: true })).toBeVisible()
  191 |     const finalActions = await page.locator('.practice-actions').boundingBox()
  192 |     const viewportHeight = await page
  193 |       .locator('html')
  194 |       .evaluate((element) => Number(Reflect.get(element, 'clientHeight')))
  195 |     expect(finalActions!.y).toBeGreaterThanOrEqual(0)
  196 |     expect(finalActions!.y + finalActions!.height).toBeLessThanOrEqual(viewportHeight)
  197 |   } finally {
  198 |     await stop(application)
  199 |   }
  200 | })
  201 | 
```