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
  169 |       const imagesBeforeFocus = await page
  170 |         .locator('.practice-reading img')
  171 |         .evaluateAll((elements) =>
  172 |           elements.map((element) => ({
  173 |             complete: Reflect.get(element, 'complete'),
  174 |             width: Reflect.get(element, 'naturalWidth'),
  175 |             height: Reflect.get(element, 'clientHeight'),
  176 |           })),
  177 |         )
  178 |       await input.focus()
  179 |       await page.evaluate(
  180 |         () =>
  181 |           new Promise<void>((done) =>
  182 |             (
  183 |               globalThis as unknown as { requestAnimationFrame: (callback: () => void) => number }
  184 |             ).requestAnimationFrame(() => done()),
  185 |           ),
  186 |       )
  187 |       const inputBounds = await input.boundingBox(),
  188 |         actions = await page.locator('.practice-actions').boundingBox()
  189 |       await info.attach(`focus-geometry-${width}.json`, {
  190 |         body: JSON.stringify({
  191 |           inputBounds,
  192 |           actions,
  193 |           imagesBeforeFocus,
  194 |           imagesAfterFocus: await page
  195 |             .locator('.practice-reading img')
  196 |             .evaluateAll((elements) =>
  197 |               elements.map((element) => ({
  198 |                 complete: Reflect.get(element, 'complete'),
  199 |                 width: Reflect.get(element, 'naturalWidth'),
  200 |                 height: Reflect.get(element, 'clientHeight'),
  201 |               })),
  202 |             ),
  203 |           focused: await input.evaluate((element) => Reflect.get(element, 'id')),
  204 |         }),
  205 |         contentType: 'application/json',
  206 |       })
  207 |       expect(inputBounds).not.toBeNull()
  208 |       expect(actions).not.toBeNull()
  209 |       expect(inputBounds!.y).toBeGreaterThanOrEqual(0)
> 210 |       expect(inputBounds!.y + 50).toBeLessThan(actions!.y)
      |                                   ^ Error: expect(received).toBeLessThan(expected)
  211 |       await expect(page.getByRole('button', { name: '查看参考答案', exact: true })).toBeVisible()
  212 |       await noDocumentOverflow(page)
  213 |     }
  214 |     await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  215 |     await page.getByText('THEME-ANSWER-END', { exact: true }).scrollIntoViewIfNeeded()
  216 |     await expect(page.getByRole('button', { name: '掌握', exact: true })).toBeVisible()
  217 |     await expect(page.getByRole('button', { name: '返回首页', exact: true })).toBeVisible()
  218 |     const finalActions = await page.locator('.practice-actions').boundingBox()
  219 |     const viewportHeight = await page
  220 |       .locator('html')
  221 |       .evaluate((element) => Number(Reflect.get(element, 'clientHeight')))
  222 |     expect(finalActions!.y).toBeGreaterThanOrEqual(0)
  223 |     expect(finalActions!.y + finalActions!.height).toBeLessThanOrEqual(viewportHeight)
  224 |   } finally {
  225 |     await stop(application)
  226 |   }
  227 | })
  228 | 
```