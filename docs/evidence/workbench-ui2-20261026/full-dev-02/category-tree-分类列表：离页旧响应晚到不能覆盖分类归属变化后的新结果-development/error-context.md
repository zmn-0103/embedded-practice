# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: category-tree.spec.ts >> 分类列表：离页旧响应晚到不能覆盖分类归属变化后的新结果
- Location: tests\e2e\category-tree.spec.ts:242:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '题库分类：板块 A', exact: true })
    - locator resolved to <button type="button" aria-pressed="false" aria-label="题库分类：板块 A">板块 A（4题）</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <main tabindex="-1" id="main-content">…</main> intercepts pointer events
  - retrying click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <p>本地数据已就绪</p> from <section role="status" class="service-status status-ready">…</section> subtree intercepts pointer events
  - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <main tabindex="-1" id="main-content">…</main> intercepts pointer events
  - retrying click action
    - waiting 100ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <footer>…</footer> intercepts pointer events
  - retrying click action
    - waiting 100ms
    14 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <main tabindex="-1" id="main-content">…</main> intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <p>本地数据已就绪</p> from <section role="status" class="service-status status-ready">…</section> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <main tabindex="-1" id="main-content">…</main> intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <footer>…</footer> intercepts pointer events
     - retrying click action
       - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <main tabindex="-1" id="main-content">…</main> intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <p>本地数据已就绪</p> from <section role="status" class="service-status status-ready">…</section> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms

```

# Test source

```ts
  150 |     const protectedRows = historySnapshot(testDataDirectory)
  151 |     withHistoryDatabase(
  152 |       testDataDirectory,
  153 |       (db) =>
  154 |         db.exec(
  155 |           "CREATE TRIGGER block_category_revision BEFORE UPDATE ON library_meta BEGIN SELECT RAISE(ABORT,'定向阻止分类提交'); END",
  156 |         ),
  157 |       false,
  158 |     )
  159 |     for (const change of [
  160 |       { kind: 'create' as const, title: '失败创建' },
  161 |       { kind: 'rename' as const, categoryId: first, title: '失败改名' },
  162 |       { kind: 'assign' as const, topicId: 'cat-a', categoryId: second },
  163 |       { kind: 'delete' as const, categoryId: first },
  164 |     ]) {
  165 |       const result = await page.evaluate(
  166 |         (request) =>
  167 |           (
  168 |             globalThis as unknown as {
  169 |               desktop: import('../../src/shared/contracts/application').DesktopApi
  170 |             }
  171 |           ).desktop.library.updateCategory(request),
  172 |         change,
  173 |       )
  174 |       expect(result).toMatchObject({ ok: false, error: { code: 'DATABASE_UNAVAILABLE' } })
  175 |       expect(snapshot()).toEqual(before)
  176 |       expect(historySnapshot(testDataDirectory)).toEqual(protectedRows)
  177 |     }
  178 |     const manager = await openCategoryManager(page)
  179 |     const assign = manager.getByRole('button', { name: '调整专题归属', exact: true })
  180 |     if ((await assign.getAttribute('aria-expanded')) !== 'true') await assign.click()
  181 |     await manager.getByLabel('调整归属的专题', { exact: true }).selectOption('cat-a')
  182 |     await manager.getByLabel('归入分类', { exact: true }).selectOption(second)
  183 |     await manager.getByRole('button', { name: '保存专题归属', exact: true }).click()
  184 |     await expect(manager.getByRole('alert')).toContainText('题库服务暂不可用')
  185 |     await expect(manager.getByLabel('归入分类', { exact: true })).toHaveValue(second)
  186 |     expect(snapshot()).toEqual(before)
  187 |     withHistoryDatabase(
  188 |       testDataDirectory,
  189 |       (db) => db.exec('DROP TRIGGER block_category_revision'),
  190 |       false,
  191 |     )
  192 |     await manager.getByRole('button', { name: '保存专题归属', exact: true }).click()
  193 |     await expect
  194 |       .poll(
  195 |         async () =>
  196 |           (await categoryList(page)).topics.find((item) => item.topicId === 'cat-a')?.categoryId,
  197 |       )
  198 |       .toBe(second)
  199 |     const revision = snapshot().revision
  200 |     await categoryChange(page, { kind: 'create', title: '板块 A' })
  201 |     expect((await categoryList(page)).categories).toHaveLength(2)
  202 |     expect(snapshot().revision).toEqual(revision)
  203 |     expect(historySnapshot(testDataDirectory)).toEqual(protectedRows)
  204 |   } finally {
  205 |     await stop(application)
  206 |   }
  207 | })
  208 | 
  209 | test('分类修订使导入旧预览失效，重新预览保留归属且才更新内容', async ({
  210 |   testDataDirectory,
  211 | }, info) => {
  212 |   const { application, page, first, paths } = await prepareCategories(
  213 |     testDataDirectory,
  214 |     info.project.name,
  215 |   )
  216 |   try {
  217 |     await writeFile(
  218 |       paths[0]!,
  219 |       categoryBank('cat-a', 2).replace('CATEGORY-BODY-cat-a-1', 'CATEGORY-BODY-UPDATED'),
  220 |     )
  221 |     await application.evaluate(({ dialog }, file) => {
  222 |       dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [file] })
  223 |     }, paths[0]!)
  224 |     await page.getByRole('button', { name: '导入题库', exact: true }).click()
  225 |     await expect(page.getByRole('heading', { name: '导入预览', exact: true })).toBeVisible()
  226 |     await addCategory(page, '预览后新增分类')
  227 |     await page.getByRole('button', { name: '确认导入', exact: true }).click()
  228 |     await expect(
  229 |       page.getByText('题库在预览后已变化，请重新预览再确认。', { exact: true }),
  230 |     ).toBeVisible()
  231 |     expect(historySnapshot(testDataDirectory).versions).toHaveLength(5)
  232 |     await importHistoryFiles(application, page, [paths[0]!])
  233 |     expect(historySnapshot(testDataDirectory).versions).toHaveLength(6)
  234 |     expect(
  235 |       (await categoryList(page)).topics.find((item) => item.topicId === 'cat-a')?.categoryId,
  236 |     ).toBe(first)
  237 |   } finally {
  238 |     await stop(application)
  239 |   }
  240 | })
  241 | 
  242 | test('分类列表：离页旧响应晚到不能覆盖分类归属变化后的新结果', async ({
  243 |   testDataDirectory,
  244 | }, info) => {
  245 |   const { application, page, first, second } = await prepareCategories(
  246 |     testDataDirectory,
  247 |     info.project.name,
  248 |   )
  249 |   try {
> 250 |     await page.getByRole('button', { name: '题库分类：板块 A', exact: true }).click()
      |                                                                        ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
  251 |     await expect(page.getByText('共 4 题', { exact: true })).toBeVisible()
  252 |     await openPage(page, '设置与数据')
  253 |     await application.evaluate(({ ipcMain }, id) => {
  254 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:list-questions')
  255 |       let hold = true
  256 |       ipcMain.removeHandler('library:list-questions')
  257 |       ipcMain.handle('library:list-questions', async (event, request) => {
  258 |         const result = await original(event, request)
  259 |         if (hold && request.category?.categoryId === id) {
  260 |           hold = false
  261 |           await new Promise<void>((resolve) =>
  262 |             Reflect.set(globalThis, '__releaseCategoryList', resolve),
  263 |           )
  264 |           Reflect.set(globalThis, '__categoryListDelivered', true)
  265 |         }
  266 |         return result
  267 |       })
  268 |     }, first)
  269 |     await openPage(page, '题库')
  270 |     await expect
  271 |       .poll(() =>
  272 |         application.evaluate(() => typeof Reflect.get(globalThis, '__releaseCategoryList')),
  273 |       )
  274 |       .toBe('function')
  275 |     await openPage(page, '设置与数据')
  276 |     await categoryChange(page, { kind: 'assign', topicId: 'cat-a', categoryId: second })
  277 |     await openPage(page, '题库')
  278 |     await expect(page.getByText('共 2 题', { exact: true })).toBeVisible()
  279 |     await application.evaluate(() => Reflect.get(globalThis, '__releaseCategoryList')())
  280 |     await expect
  281 |       .poll(() => application.evaluate(() => Reflect.get(globalThis, '__categoryListDelivered')))
  282 |       .toBe(true)
  283 |     await page.evaluate(
  284 |       () =>
  285 |         new Promise((done) =>
  286 |           Reflect.get(
  287 |             globalThis,
  288 |             'requestAnimationFrame',
  289 |           )(() => Reflect.get(globalThis, 'requestAnimationFrame')(done)),
  290 |         ),
  291 |     )
  292 |     await expect(page.getByText('共 2 题', { exact: true })).toBeVisible()
  293 |     expect(
  294 |       (
  295 |         await categoryList(page, { category: { kind: 'category', categoryId: first } })
  296 |       ).questions.every((item) => item.topicId === 'cat-b'),
  297 |     ).toBe(true)
  298 |   } finally {
  299 |     await application
  300 |       .evaluate(() => Reflect.get(globalThis, '__releaseCategoryList')?.())
  301 |       .catch(() => {})
  302 |     await stop(application)
  303 |   }
  304 | })
  305 | 
```