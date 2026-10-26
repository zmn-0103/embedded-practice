# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: findability.spec.ts >> 找题：离页前的慢响应不能覆盖返回后已完成的新筛选和选择
- Location: tests\e2e\findability.spec.ts:172:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  getByText('共 48 题', { exact: true })
Expected: visible
Received: hidden
Timeout:  10000ms

Call log:
  - Expect "toBeVisible" getByText('共 48 题', { exact: true }) with timeout 10000ms
  - waiting for getByText('共 48 题', { exact: true })
    23 × locator resolved to <span class="muted">共 48 题</span>
       - unexpected value "hidden"

```

```yaml
- banner:
  - heading "嵌入式刷题本" [level=1]
  - paragraph: 思考有迹，积累有序
  - button "收起导航" [expanded]: ‹
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
- main:
  - text: 学习工作台
  - strong: 题库
  - text: 本地离线
  - group: 外观
  - region "题库导入":
    - paragraph: 选择文件 → 核对预览 → 确认导入
    - heading "题库导入" [level=2]
    - button "导入题库"
    - button "导出题库模板"
    - paragraph: 导入完成：新增 51，内容更新 0，信息变更 0，不变 0，归档 0，恢复 0。
  - region "题库浏览":
    - button "返回题目列表"
    - article "题目内容":
      - paragraph: A 找题专题 · q-01
      - heading "保留位置问题 1" [level=3]
      - paragraph: 易（基础） · 共同 / 归档独有 / 检索标签01
      - paragraph: 当前内容尚未练习
      - button "收藏本题"
      - heading "题目" [level=4]
      - paragraph: 题干 1。
      - button "展开参考答案"
      - button "查看本题历史"
  - status:
    - paragraph: 本地数据已就绪
- contentinfo: 离线使用 · 数据保存在本机 V42.11.15 测试版 · 构建 20261025.3-workbench-e
```

# Test source

```ts
  128 |     await expect(picker).toHaveAttribute('aria-expanded', 'true')
  129 |     await picker.press('Enter')
  130 |     await expect(picker).toHaveValue('ARM Cortex')
  131 |     await expect(picker).toHaveAttribute('aria-expanded', 'false')
  132 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  133 |     await expect(page.getByText('共 47 题', { exact: true })).toBeVisible()
  134 |     expect(
  135 |       (
  136 |         await list(page, {
  137 |           filters: {
  138 |             query: '无结果',
  139 |             tag: null,
  140 |             difficulty: null,
  141 |             mastery: 'all',
  142 |             favoritesOnly: false,
  143 |           },
  144 |         })
  145 |       ).tagOptions,
  146 |     ).toEqual(first.tagOptions)
  147 |     await picker.fill('仅后页')
  148 |     await page.getByRole('option', { name: '仅后页标签', exact: true }).click()
  149 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  150 |     await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
  151 |     await picker.fill('不存在的标签')
  152 |     await expect(page.getByText('暂无匹配标签；仍可按填写的完整标签筛选。')).toBeVisible()
  153 |     await picker.press('Escape')
  154 |     await expect(picker).toHaveAttribute('aria-expanded', 'false')
  155 |     await page.getByRole('button', { name: '题库标签清除', exact: true }).click()
  156 |     await expect(picker).toHaveValue('')
  157 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  158 |     await expect(page.getByText('共 48 题', { exact: true })).toBeVisible()
  159 |     expect(await current(page)).toBeNull()
  160 |     await picker.click()
  161 |     expect(first.tagOptions.length).toBeGreaterThan(50)
  162 |     await expect(
  163 |       page.getByRole('listbox', { name: '题库标签候选' }).getByRole('option'),
  164 |     ).toHaveCount(50)
  165 |     await expect(page.getByText(/共 52 个匹配标签，显示前 50 个/)).toBeVisible()
  166 |     await capture(application, info, 'tag-candidates.png')
  167 |   } finally {
  168 |     await application.close()
  169 |   }
  170 | })
  171 | 
  172 | test('找题：离页前的慢响应不能覆盖返回后已完成的新筛选和选择', async ({
  173 |   testDataDirectory,
  174 | }, info) => {
  175 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  176 |   try {
  177 |     await page.getByLabel('专题', { exact: true }).selectOption('find-a')
  178 |     await expect(page.getByText('共 48 题', { exact: true })).toBeVisible()
  179 |     await application.evaluate(({ ipcMain }) => {
  180 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:list-questions')
  181 |       const control = {
  182 |         held: false,
  183 |         finished: false,
  184 |         release: undefined as (() => void) | undefined,
  185 |       }
  186 |       Reflect.set(globalThis, 'findabilitySlowRead', control)
  187 |       ipcMain.removeHandler('library:list-questions')
  188 |       ipcMain.handle('library:list-questions', async (event, request) => {
  189 |         const result = await original(event, request)
  190 |         if (request.topicId === 'find-a' && request.filters?.query === '迟到' && !control.held) {
  191 |           control.held = true
  192 |           await new Promise<void>((resolve) => {
  193 |             control.release = resolve
  194 |           })
  195 |           control.finished = true
  196 |         }
  197 |         return result
  198 |       })
  199 |     })
  200 |     await page.getByRole('searchbox', { name: '题库搜索', exact: true }).fill('迟到')
  201 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  202 |     await expect
  203 |       .poll(() => application.evaluate(() => Reflect.get(globalThis, 'findabilitySlowRead').held))
  204 |       .toBe(true)
  205 |     await openPage(page, '设置与数据')
  206 |     await openPage(page, '题库')
  207 |     await expect(page.getByText('共 0 题', { exact: true })).toBeVisible()
  208 |     await page.getByRole('searchbox', { name: '题库搜索', exact: true }).fill('保留')
  209 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  210 |     await expect(page.getByText('共 48 题', { exact: true })).toBeVisible()
  211 |     await page.getByRole('button', { name: /A 找题专题.*q-01/ }).click()
  212 |     await expect(page.getByRole('heading', { name: '保留位置问题 1', exact: true })).toBeVisible()
  213 |     await application.evaluate(() => Reflect.get(globalThis, 'findabilitySlowRead').release())
  214 |     await expect
  215 |       .poll(() =>
  216 |         application.evaluate(() => Reflect.get(globalThis, 'findabilitySlowRead').finished),
  217 |       )
  218 |       .toBe(true)
  219 |     await page.evaluate(
  220 |       () =>
  221 |         new Promise((done) => {
  222 |           const frame = Reflect.get(globalThis, 'requestAnimationFrame') as (
  223 |             callback: () => void,
  224 |           ) => void
  225 |           frame(() => frame(() => done(null)))
  226 |         }),
  227 |     )
> 228 |     await expect(page.getByText('共 48 题', { exact: true })).toBeVisible()
      |                                                             ^ Error: expect(locator).toBeVisible() failed
  229 |     await expect(page.getByRole('heading', { name: '保留位置问题 1', exact: true })).toBeVisible()
  230 |   } finally {
  231 |     await application
  232 |       .evaluate(() => Reflect.get(globalThis, 'findabilitySlowRead')?.release?.())
  233 |       .catch(() => {})
  234 |     await application.close()
  235 |   }
  236 | })
  237 | 
  238 | test('找题：导入元数据使候选缓存失效，归档范围隔离，清除旧题选择', async ({
  239 |   testDataDirectory,
  240 | }, info) => {
  241 |   const { application, page, file } = await prepare(testDataDirectory, info.project.name)
  242 |   try {
  243 |     expect((await list(page)).tagOptions).not.toContain('新增候选')
  244 |     await page.getByRole('button', { name: /A 找题专题.*q-01/ }).click()
  245 |     await page.getByRole('button', { name: '展开参考答案', exact: true }).click()
  246 |     await writeFile(file, bank('find-a', true, true))
  247 |     await importFiles(application, page, [file])
  248 |     const active = await list(page)
  249 |     expect(active.total).toBe(47)
  250 |     expect(active.tagOptions).toContain('新增候选')
  251 |     expect(active.tagOptions).not.toContain('归档独有')
  252 |     const archived = await list(page, { archived: true })
  253 |     expect(archived.total).toBe(1)
  254 |     expect(archived.tagOptions).toContain('归档独有')
  255 |     expect(archived.tagOptions).not.toContain('新增候选')
  256 |     expect(await page.getByRole('region', { name: '参考答案', exact: true }).count()).toBe(0)
  257 |     expect(await page.getByRole('article', { name: '题目内容', exact: true }).count()).toBe(0)
  258 |   } finally {
  259 |     await application.close()
  260 |   }
  261 | })
  262 | 
  263 | test('找题：返回后读取失败保留条件和页码，重试仍查询原范围', async ({
  264 |   testDataDirectory,
  265 | }, info) => {
  266 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  267 |   try {
  268 |     await secondPage(page)
  269 |     await openPage(page, '设置与数据')
  270 |     await application.evaluate(({ ipcMain }) => {
  271 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:list-questions')
  272 |       let fail = true
  273 |       ipcMain.removeHandler('library:list-questions')
  274 |       ipcMain.handle('library:list-questions', async (event, request) => {
  275 |         if (request.topicId === 'find-a' && fail) {
  276 |           fail = false
  277 |           return {
  278 |             ok: false,
  279 |             error: { code: 'DATABASE_UNAVAILABLE', message: '定向模拟返回读取失败' },
  280 |           }
  281 |         }
  282 |         return original(event, request)
  283 |       })
  284 |     })
  285 |     await openPage(page, '题库')
  286 |     await expect(page.getByRole('alert')).toContainText('定向模拟返回读取失败')
  287 |     await expect(page.getByRole('searchbox', { name: '题库搜索', exact: true })).toHaveValue('保留')
  288 |     await expect(page.getByRole('navigation', { name: '题目分页' })).toContainText('2 / 3')
  289 |     await page.getByRole('button', { name: '重新读取题库', exact: true }).click()
  290 |     await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
  291 |     await expect(page.getByRole('navigation', { name: '题目分页' })).toContainText('2 / 3')
  292 |     await expect(page.getByRole('alert')).toHaveCount(0)
  293 |   } finally {
  294 |     await application.close()
  295 |   }
  296 | })
  297 | 
  298 | test('找题：隐藏期间的收藏变化返回时重读，移除不再匹配的详情', async ({
  299 |   testDataDirectory,
  300 | }, info) => {
  301 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  302 |   try {
  303 |     await page.getByRole('button', { name: /A 找题专题.*q-01/ }).click()
  304 |     await page.getByRole('button', { name: '收藏本题', exact: true }).click()
  305 |     await page.getByRole('checkbox', { name: '题库只看收藏', exact: true }).check()
  306 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  307 |     await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
  308 |     await page.getByRole('button', { name: /A 找题专题.*q-01/ }).click()
  309 |     await openPage(page, '学习记录')
  310 |     await page.getByRole('button', { name: /A 找题专题.*q-01/ }).click()
  311 |     await page.getByRole('button', { name: '取消收藏', exact: true }).click()
  312 |     await expect(page.getByText('共 0 题', { exact: true })).toBeVisible()
  313 |     await openPage(page, '题库')
  314 |     await expect(page.getByText('共 0 题', { exact: true })).toBeVisible()
  315 |     await expect(page.getByRole('checkbox', { name: '题库只看收藏', exact: true })).toBeChecked()
  316 |     await expect(page.getByRole('article', { name: '题目内容', exact: true })).toHaveCount(0)
  317 |   } finally {
  318 |     await application.close()
  319 |   }
  320 | })
  321 | 
  322 | test('找题：首页快捷条件不替换旧轮，明确开始/无匹配/继续保留原契约', async ({
  323 |   testDataDirectory,
  324 | }, info) => {
  325 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  326 |   try {
  327 |     await page.getByRole('button', { name: /A 找题专题.*q-04/ }).click()
  328 |     await page.getByRole('button', { name: '收藏本题', exact: true }).click()
```