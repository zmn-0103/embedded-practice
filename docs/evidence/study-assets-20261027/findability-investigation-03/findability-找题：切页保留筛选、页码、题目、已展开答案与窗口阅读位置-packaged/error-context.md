# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: findability.spec.ts >> 找题：切页保留筛选、页码、题目、已展开答案与窗口阅读位置
- Location: tests\e2e\findability.spec.ts:83:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 2412
Received: 72

Call Log:
- Timeout 10000ms exceeded while waiting on the predicate
```

# Test source

```ts
  32  |   await page.getByRole('button', { name: '确认导入', exact: true }).click()
  33  |   await expect(page.getByText(/^导入完成：/)).toBeVisible()
  34  |   await page.getByRole('button', { name: '关闭导入工作区', exact: true }).click()
  35  |   await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
  36  | }
  37  | async function prepare(directory: string, project: string) {
  38  |   const sources = join(directory, '中文 题库')
  39  |   await mkdir(sources)
  40  |   const file = join(sources, 'A.md')
  41  |   const other = join(sources, 'B.md')
  42  |   await writeFile(file, bank())
  43  |   await writeFile(other, bank('find-b'))
  44  |   const instance = await launchApplication(directory, project, '题库')
  45  |   await instance.application.evaluate(({ BrowserWindow }) => {
  46  |     BrowserWindow.getAllWindows()[0]?.setSize(1280, 820)
  47  |   })
  48  |   await importFiles(instance.application, instance.page, [file, other])
  49  |   return { ...instance, file }
  50  | }
  51  | async function list(page: Page, changes: Partial<ListRequest> = {}) {
  52  |   const result = await page.evaluate(
  53  |     (request) =>
  54  |       (globalThis as unknown as { desktop: DesktopApi }).desktop.library.listQuestions(request),
  55  |     { topicId: 'find-a', archived: false, page: 1, ...changes },
  56  |   )
  57  |   if (!result.ok) throw new Error(result.error.message)
  58  |   return result.value
  59  | }
  60  | async function current(page: Page) {
  61  |   const result = await page.evaluate(() =>
  62  |     (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
  63  |   )
  64  |   if (!result.ok) throw new Error(result.error.message)
  65  |   return result.value
  66  | }
  67  | async function capture(application: ElectronApplication, info: TestInfo, name: string) {
  68  |   const png = await application.evaluate(async ({ BrowserWindow }) =>
  69  |     (await BrowserWindow.getAllWindows()[0]!.capturePage()).toPNG().toString('base64'),
  70  |   )
  71  |   await info.attach(name, { body: Buffer.from(png, 'base64'), contentType: 'image/png' })
  72  | }
  73  | async function secondPage(page: Page) {
  74  |   await page.getByLabel('专题', { exact: true }).selectOption('find-a')
  75  |   await expect(page.getByText('共 48 题', { exact: true })).toBeVisible()
  76  |   await page.getByRole('searchbox', { name: '题库搜索', exact: true }).fill('保留')
  77  |   await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  78  |   await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
  79  |   await page.getByRole('button', { name: '下一页', exact: true }).click()
  80  |   await expect(page.getByRole('navigation', { name: '题目分页' })).toContainText('2 / 3')
  81  | }
  82  | 
  83  | test('找题：切页保留筛选、页码、题目、已展开答案与窗口阅读位置', async ({
  84  |   testDataDirectory,
  85  | }, info) => {
  86  |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  87  |   try {
  88  |     await page.locator('html').evaluate((root) => {
  89  |       const browser = root.ownerDocument.defaultView!
  90  |       const original = browser.scrollTo.bind(browser)
  91  |       const trace: unknown[] = []
  92  |       Reflect.set(globalThis, '__readingTrace', trace)
  93  |       browser.scrollTo = (...args: unknown[]) => {
  94  |         const before = browser.scrollY
  95  |         Reflect.apply(original, browser, args)
  96  |         trace.push({
  97  |           args,
  98  |           before,
  99  |           after: browser.scrollY,
  100 |           height: root.scrollHeight,
  101 |           busy: root.ownerDocument.querySelector('.library-browser')?.getAttribute('aria-busy'),
  102 |         })
  103 |       }
  104 |     })
  105 |     await secondPage(page)
  106 |     await page.getByRole('button', { name: /A 找题专题.*q-21/ }).click()
  107 |     await page.getByRole('button', { name: '展开参考答案', exact: true }).click()
  108 |     await page.getByRole('region', { name: '参考答案', exact: true }).scrollIntoViewIfNeeded()
  109 |     const before = await page.evaluate(() => Reflect.get(globalThis, 'scrollY') as number)
  110 |     expect(before).toBeGreaterThan(500)
  111 |     await openPage(page, '设置与数据')
  112 |     expect(await page.content()).not.toContain('FIND-ANSWER-find-a-21')
  113 |     expect(await page.locator('body').ariaSnapshot()).not.toContain('FIND-ANSWER-find-a-21')
  114 |     // 返回时让题目清单晚于首次布局，验证恢复等待实际内容，而非依赖本机读取时序。
  115 |     await application.evaluate(({ ipcMain }) => {
  116 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:list-questions')
  117 |       ipcMain.removeHandler('library:list-questions')
  118 |       ipcMain.handle('library:list-questions', async (event, input) => {
  119 |         await new Promise((resolve) => setTimeout(resolve, 150))
  120 |         return original(event, input)
  121 |       })
  122 |     })
  123 |     await openPage(page, '题库')
  124 |     await expect(page.getByRole('heading', { name: '保留位置问题 21', exact: true })).toBeVisible()
  125 |     await expect(page.getByRole('region', { name: '参考答案', exact: true })).toContainText(
  126 |       'FIND-ANSWER-find-a-21',
  127 |     )
  128 |     await info.attach('reading-position-diagnostics.json', {
  129 |       body: JSON.stringify(await page.evaluate(() => Reflect.get(globalThis, '__readingTrace'))),
  130 |       contentType: 'application/json',
  131 |     })
> 132 |     await expect.poll(() => page.evaluate(() => Reflect.get(globalThis, 'scrollY'))).toBe(before)
      |                                                                                      ^ Error: expect(received).toBe(expected) // Object.is equality
  133 |     await capture(application, info, 'library-reading-restored.png')
  134 |     await page.getByRole('button', { name: '返回题目列表', exact: true }).click()
  135 |     await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
  136 |     await expect(page.getByRole('searchbox', { name: '题库搜索', exact: true })).toHaveValue('保留')
  137 |     await expect(page.getByLabel('专题', { exact: true })).toHaveValue('find-a')
  138 |     await expect(page.getByRole('navigation', { name: '题目分页' })).toContainText('2 / 3')
  139 |     await page.getByRole('button', { name: /A 找题专题.*q-21/ }).click()
  140 |     await expect(page.getByRole('heading', { name: '保留位置问题 21', exact: true })).toBeVisible()
  141 |     await expect(page.getByRole('region', { name: '参考答案', exact: true })).toContainText(
  142 |       'FIND-ANSWER-find-a-21',
  143 |     )
  144 |   } finally {
  145 |     await application.close()
  146 |   }
  147 | })
  148 | 
  149 | test('找题：标签候选跨分页、独立于筛选、限定专题，支持鼠标/键盘/无匹配/清除', async ({
  150 |   testDataDirectory,
  151 | }, info) => {
  152 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  153 |   try {
  154 |     const first = await list(page)
  155 |     expect(first.tagOptions).toContain('仅后页标签')
  156 |     expect(first.tagOptions).not.toContain('仅B专题')
  157 |     expect(new Set(first.tagOptions).size).toBe(first.tagOptions.length)
  158 |     await page.getByLabel('专题', { exact: true }).selectOption('find-a')
  159 |     const picker = page.getByRole('combobox', { name: '题库标签', exact: true })
  160 |     await picker.fill('arm')
  161 |     await expect(page.getByRole('option', { name: 'ARM Cortex', exact: true })).toBeVisible()
  162 |     await picker.press('ArrowDown')
  163 |     await picker.dispatchEvent('keydown', { key: 'Enter', isComposing: true, keyCode: 229 })
  164 |     await expect(picker).toHaveValue('arm')
  165 |     await expect(picker).toHaveAttribute('aria-expanded', 'true')
  166 |     await picker.press('Enter')
  167 |     await expect(picker).toHaveValue('ARM Cortex')
  168 |     await expect(picker).toHaveAttribute('aria-expanded', 'false')
  169 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  170 |     await expect(page.getByText('共 47 题', { exact: true })).toBeVisible()
  171 |     expect(
  172 |       (
  173 |         await list(page, {
  174 |           filters: {
  175 |             query: '无结果',
  176 |             tag: null,
  177 |             difficulty: null,
  178 |             mastery: 'all',
  179 |             favoritesOnly: false,
  180 |           },
  181 |         })
  182 |       ).tagOptions,
  183 |     ).toEqual(first.tagOptions)
  184 |     await picker.fill('仅后页')
  185 |     await page.getByRole('option', { name: '仅后页标签', exact: true }).click()
  186 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  187 |     await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
  188 |     await picker.fill('不存在的标签')
  189 |     await expect(page.getByText('暂无匹配标签；仍可按填写的完整标签筛选。')).toBeVisible()
  190 |     await picker.press('Escape')
  191 |     await expect(picker).toHaveAttribute('aria-expanded', 'false')
  192 |     await page.getByRole('button', { name: '题库标签清除', exact: true }).click()
  193 |     await expect(picker).toHaveValue('')
  194 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  195 |     await expect(page.getByText('共 48 题', { exact: true })).toBeVisible()
  196 |     expect(await current(page)).toBeNull()
  197 |     await picker.click()
  198 |     expect(first.tagOptions.length).toBeGreaterThan(50)
  199 |     await expect(
  200 |       page.getByRole('listbox', { name: '题库标签候选' }).getByRole('option'),
  201 |     ).toHaveCount(50)
  202 |     await expect(page.getByText(/共 52 个匹配标签，显示前 50 个/)).toBeVisible()
  203 |     await capture(application, info, 'tag-candidates.png')
  204 |   } finally {
  205 |     await application.close()
  206 |   }
  207 | })
  208 | 
  209 | test('找题：离页前的慢响应不能覆盖返回后已完成的新筛选和选择', async ({
  210 |   testDataDirectory,
  211 | }, info) => {
  212 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  213 |   try {
  214 |     await page.getByLabel('专题', { exact: true }).selectOption('find-a')
  215 |     await expect(page.getByText('共 48 题', { exact: true })).toBeVisible()
  216 |     await application.evaluate(({ ipcMain }) => {
  217 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:list-questions')
  218 |       const control = {
  219 |         held: false,
  220 |         finished: false,
  221 |         release: undefined as (() => void) | undefined,
  222 |       }
  223 |       Reflect.set(globalThis, 'findabilitySlowRead', control)
  224 |       ipcMain.removeHandler('library:list-questions')
  225 |       ipcMain.handle('library:list-questions', async (event, request) => {
  226 |         const result = await original(event, request)
  227 |         if (request.topicId === 'find-a' && request.filters?.query === '迟到' && !control.held) {
  228 |           control.held = true
  229 |           await new Promise<void>((resolve) => {
  230 |             control.release = resolve
  231 |           })
  232 |           control.finished = true
```