# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: findability.spec.ts >> 找题：隐藏期间的收藏变化返回时重读，移除不再匹配的详情
- Location: tests\e2e\findability.spec.ts:298:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.check: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('checkbox', { name: '题库只看收藏', exact: true })

```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - banner [ref=f1e4]:
    - generic [ref=f1e9]:
      - heading "嵌入式刷题本" [level=1] [ref=f1e10]
      - paragraph [ref=f1e11]: 思考有迹，积累有序
    - button "收起导航" [expanded] [ref=f1e12] [cursor=pointer]: ‹
  - navigation "主要页面" [ref=f1e13]:
    - link "学习总览" [ref=f1e14] [cursor=pointer]:
      - /url: "#overview"
    - link "知识板块" [ref=f1e18] [cursor=pointer]:
      - /url: "#boards"
    - link "开始练习" [ref=f1e22] [cursor=pointer]:
      - /url: "#practice"
    - link "题库" [ref=f1e26] [cursor=pointer]:
      - /url: "#library"
    - link "学习记录" [ref=f1e30] [cursor=pointer]:
      - /url: "#records"
    - link "设置与数据" [ref=f1e34] [cursor=pointer]:
      - /url: "#settings"
  - main [ref=f1e38]:
    - generic [ref=f1e39]:
      - generic [ref=f1e40]:
        - generic [ref=f1e41]: 学习工作台
        - strong [ref=f1e42]: 题库
      - generic [ref=f1e43]:
        - generic [ref=f1e44]: 本地离线
        - group [ref=f1e46]:
          - generic "外观" [ref=f1e47] [cursor=pointer]
          - option "松间绿" [selected]
          - option "晴空蓝"
          - option "暖沙金"
          - option "暮山紫"
          - option "Claude 风格"
    - region "题库导入" [ref=f1e49]:
      - generic [ref=f1e50]:
        - generic [ref=f1e51]:
          - paragraph [ref=f1e52]: 选择文件 → 核对预览 → 确认导入
          - heading "题库导入" [level=2] [ref=f1e53]
        - generic [ref=f1e54]:
          - button "导入题库" [ref=f1e55] [cursor=pointer]
          - button "导出题库模板" [ref=f1e56] [cursor=pointer]
      - paragraph [ref=f1e57]: 导入完成：新增 51，内容更新 0，信息变更 0，不变 0，归档 0，恢复 0。
    - region "题库浏览" [ref=f1e61]:
      - generic [ref=f1e63]:
        - button "返回题目列表" [ref=f1e64] [cursor=pointer]
        - article "题目内容" [ref=f1e65]:
          - generic [ref=f1e66]:
            - paragraph [ref=f1e67]: A 找题专题 · q-01
            - heading "保留位置问题 1" [level=3] [ref=f1e68]
            - paragraph [ref=f1e69]:
              - generic "难度：易（基础）" [ref=f1e70]: 易（基础）
              - text: · 共同 / 归档独有 / 检索标签01
            - paragraph [ref=f1e71]: 当前内容尚未练习
            - button "取消收藏" [pressed] [ref=f1e72] [cursor=pointer]
          - heading "题目" [level=4] [ref=f1e73]
          - paragraph [ref=f1e75]: 题干 1。
          - button "展开参考答案" [ref=f1e77] [cursor=pointer]
          - button "查看本题历史" [ref=f1e79] [cursor=pointer]
    - status [ref=f1e80]:
      - paragraph [ref=f1e82]: 本地数据已就绪
  - contentinfo [ref=f1e83]:
    - generic [ref=f1e84]: 离线使用 · 数据保存在本机
    - generic [ref=f1e85]: V42.11.15 测试版 · 构建 20261025.3-workbench-e
```

# Test source

```ts
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
  228 |     await expect(page.getByText('共 48 题', { exact: true })).toBeVisible()
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
> 305 |     await page.getByRole('checkbox', { name: '题库只看收藏', exact: true }).check()
      |                                                                       ^ TimeoutError: locator.check: Timeout 30000ms exceeded.
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
  329 |     await openPage(page, '开始练习')
  330 |     await page.getByLabel('练习专题', { exact: true }).selectOption('find-a')
  331 |     await page.getByLabel('本轮题数', { exact: true }).selectOption('10')
  332 |     await page.getByRole('button', { name: '开始练习', exact: true }).click()
  333 |     for (const rating of ['不会', '不熟', '掌握']) {
  334 |       await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  335 |       await page.getByRole('button', { name: rating, exact: true }).click()
  336 |     }
  337 |     await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
  338 |     const original = await current(page)
  339 |     expect(original?.session.position).toBe(3)
  340 |     await page.getByLabel('练习模式', { exact: true }).selectOption('random')
  341 |     for (const label of ['练不会', '练不熟', '练收藏']) {
  342 |       await page.getByRole('button', { name: label, exact: true }).click()
  343 |       await expect(page.getByText('匹配 1 题', { exact: true })).toBeVisible()
  344 |       expect(await current(page)).toEqual(original)
  345 |       await expect(page.getByRole('button', { name: label, exact: true })).toHaveAttribute(
  346 |         'aria-pressed',
  347 |         'true',
  348 |       )
  349 |       await expect(page.getByLabel('练习模式', { exact: true })).toHaveValue('random')
  350 |       await expect(page.getByLabel('本轮题数', { exact: true })).toHaveValue('10')
  351 |     }
  352 |     await page.getByLabel('练习专题', { exact: true }).selectOption('find-b')
  353 |     await expect(page.getByText('匹配 0 题', { exact: true })).toBeVisible()
  354 |     await expect(
  355 |       page.getByRole('button', { name: '结束本轮并开始新练习', exact: true }),
  356 |     ).toBeDisabled()
  357 |     await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
  358 |     const resume = page.getByRole('region', { name: '继续上次练习', exact: true })
  359 |     await expect(resume).toContainText('A 找题专题')
  360 |     await expect(resume).toContainText('第 4 / 10 题')
  361 |     await capture(application, info, 'home-resume-priority.png')
  362 |     await page.getByRole('button', { name: '继续练习', exact: true }).click()
  363 |     expect(await current(page)).toEqual(original)
  364 |     await expect(page.getByLabel('练习进度', { exact: true })).toContainText('第 4 / 10')
  365 |     await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
  366 |     await page.getByLabel('练习专题', { exact: true }).selectOption('find-a')
  367 |     await page.getByRole('button', { name: '练不会', exact: true }).click()
  368 |     await expect(page.getByText('匹配 1 题', { exact: true })).toBeVisible()
  369 |     await page.getByRole('button', { name: '结束本轮并开始新练习', exact: true }).click()
  370 |     const replacement = await current(page)
  371 |     expect(replacement?.session.sessionId).not.toBe(original?.session.sessionId)
  372 |     expect(replacement?.session.filters?.mastery).toBe('不会')
  373 |     expect(replacement?.item?.questionId).toBe('q-01')
  374 |     expect(replacement?.item?.revealed).toBe(false)
  375 |     await expect(page.getByRole('region', { name: '练习参考答案', exact: true })).toHaveCount(0)
  376 |   } finally {
  377 |     await application.close()
  378 |   }
  379 | })
  380 | 
```