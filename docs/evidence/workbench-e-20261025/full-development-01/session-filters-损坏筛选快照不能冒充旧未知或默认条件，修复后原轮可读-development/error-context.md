# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: session-filters.spec.ts >> 损坏筛选快照不能冒充旧未知或默认条件，修复后原轮可读
- Location: tests\e2e\session-filters.spec.ts:260:5

# Error details

```
Error: expect(locator).toBeEnabled() failed

Locator: getByRole('button', { name: '继续练习', exact: true })
Expected: enabled
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeEnabled" getByRole('button', { name: '继续练习', exact: true }) with timeout 10000ms
  - waiting for getByRole('button', { name: '继续练习', exact: true })

```

```yaml
- banner:
  - heading "嵌入式刷题本" [level=1]
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
  - strong: 学习总览
  - text: 本地离线
  - group: 外观
  - region "学习总览工作区":
    - paragraph: 从上次停下的地方继续
    - heading "继续你的嵌入式学习" [level=2]
    - paragraph: 先独立思考，再对照答案。每一轮积累都保存在本机。
    - region "当前练习概况":
      - paragraph: 继续原固定队列
      - heading "历史专题 A" [level=3]
      - paragraph: 当前位置 1 / 2 题
      - progressbar "本轮当前位置"
      - paragraph: 顺序练习 · 已揭晓 0 题 · 已自评 0 题
      - button "继续本轮"
      - button "配置新练习"
    - term: 有效题目
    - definition: "3"
    - term: 已揭晓
    - definition: "2"
    - term: 已自评
    - definition: "2"
    - term: 收藏
    - definition: "0"
    - paragraph: 全部有效题目，按题目身份和当前内容版本去重。自评是个人判断。
    - region "本机知识板块":
      - heading "知识板块" [level=3]
      - button "查看全部板块"
      - paragraph: 本机尚未创建分类。可先查看规划板块或导入专题。
    - region "复习筛选入口":
      - heading "复习入口" [level=3]
      - button "不会 1 题 · 去筛选":
        - strong: 不会
        - text: 1 题 · 去筛选
      - button "不熟 1 题 · 去筛选":
        - strong: 不熟
        - text: 1 题 · 去筛选
      - button "内容更新待复习 0 题 · 去筛选":
        - strong: 内容更新待复习
        - text: 0 题 · 去筛选
      - paragraph: 只填入题库筛选条件，不会自动开始或替换练习。
  - status:
    - paragraph: 本地数据已就绪
- contentinfo: 离线使用 · 数据保存在本机 V42.11.15 测试版 · 构建 20261025.3-workbench-e
```

# Test source

```ts
  208 |     await expect(start(page, input)).rejects.toThrow()
  209 |     const afterCommit = historySnapshot(testDataDirectory)
  210 |     const created = await read(page)
  211 |     expect(created.session.filters).toEqual(filters)
  212 |     const retry = await start(page, input)
  213 |     expect(retry).toMatchObject({ ok: true, value: { sessionId: created.session.sessionId } })
  214 |     expect(historySnapshot(testDataDirectory)).toEqual(afterCommit)
  215 |     expect(
  216 |       await start(page, { ...input, filters: { ...filters, query: '不同的原请求' } }),
  217 |     ).toMatchObject({
  218 |       ok: false,
  219 |       error: { code: 'REQUEST_CONFLICT' },
  220 |     })
  221 |     expect(historySnapshot(testDataDirectory)).toEqual(afterCommit)
  222 |     await info.attach('filters-atomic-retry.json', {
  223 |       body: JSON.stringify({ before, afterCommit, created, retry }),
  224 |       contentType: 'application/json',
  225 |     })
  226 |   } finally {
  227 |     await stop(application)
  228 |   }
  229 | })
  230 | 
  231 | test('省略条件的新轮保存明确默认快照，旧请求形状重试仍幂等', async ({
  232 |   testDataDirectory,
  233 | }, info) => {
  234 |   const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  235 |   try {
  236 |     const input = {
  237 |       requestId: randomUUID(),
  238 |       topicId: 'history-a',
  239 |       count: 'all' as const,
  240 |       replace: null,
  241 |     }
  242 |     const first = await start(page, input)
  243 |     expect(first.ok).toBe(true)
  244 |     expect((await read(page)).session.filters).toEqual(EMPTY_QUESTION_FILTERS)
  245 |     const before = historySnapshot(testDataDirectory)
  246 |     expect(await start(page, input)).toEqual(first)
  247 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  248 |     const session = await read(page)
  249 |     withHistoryDatabase(testDataDirectory, (db) => {
  250 |       const row = db
  251 |         .prepare('SELECT filters_json FROM practice_sessions WHERE id=?')
  252 |         .get(session.session.sessionId)!
  253 |       expect(JSON.parse(String(row.filters_json))).toEqual(EMPTY_QUESTION_FILTERS)
  254 |     })
  255 |   } finally {
  256 |     await stop(application)
  257 |   }
  258 | })
  259 | 
  260 | test('损坏筛选快照不能冒充旧未知或默认条件，修复后原轮可读', async ({
  261 |   testDataDirectory,
  262 | }, info) => {
  263 |   const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  264 |   try {
  265 |     expect(
  266 |       await start(page, {
  267 |         requestId: randomUUID(),
  268 |         topicId: 'history-a',
  269 |         count: 'all',
  270 |         replace: null,
  271 |       }),
  272 |     ).toMatchObject({ ok: true })
  273 |     const original = await read(page)
  274 |     const before = historySnapshot(testDataDirectory)
  275 |     withHistoryDatabase(
  276 |       testDataDirectory,
  277 |       (db) =>
  278 |         db
  279 |           .prepare('UPDATE practice_sessions SET filters_json=? WHERE id=?')
  280 |           .run('{"query":"SNAPSHOT-PRIVATE-QUERY"}', original.session.sessionId),
  281 |       false,
  282 |     )
  283 |     const result = await page.evaluate(() =>
  284 |       (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
  285 |     )
  286 |     expect(result).toMatchObject({ ok: false, error: { code: 'DATABASE_UNAVAILABLE' } })
  287 |     await page.reload()
  288 |     await expect(page.getByRole('alert')).toContainText('无法读取练习')
  289 |     expect(await page.getByLabel('本轮创建条件', { exact: true }).count()).toBe(0)
  290 |     withHistoryDatabase(
  291 |       testDataDirectory,
  292 |       (db) => {
  293 |         db.prepare('UPDATE practice_sessions SET filters_json=? WHERE id=?').run(
  294 |           JSON.stringify(original.session.filters),
  295 |           original.session.sessionId,
  296 |         )
  297 |         for (const invalid of ['not-json', 'null', '[]', '"string"']) {
  298 |           expect(() =>
  299 |             db
  300 |               .prepare('UPDATE practice_sessions SET filters_json=? WHERE id=?')
  301 |               .run(invalid, original.session.sessionId),
  302 |           ).toThrow()
  303 |         }
  304 |       },
  305 |       false,
  306 |     )
  307 |     await page.getByRole('button', { name: '重试读取练习', exact: true }).click()
> 308 |     await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
      |                                                                           ^ Error: expect(locator).toBeEnabled() failed
  309 |     expect(await read(page)).toEqual(original)
  310 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  311 |   } finally {
  312 |     await stop(application)
  313 |   }
  314 | })
  315 | 
```