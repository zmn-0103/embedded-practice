# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: practice-repeat.spec.ts >> 结果页明确本轮范围/题数/旧版本，丢失开始响应可原请求重试且新轮隐藏答案
- Location: tests\e2e\practice-repeat.spec.ts:170:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.selectOption: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('form', { name: '本轮题目再练', exact: true }).getByLabel('再练范围', { exact: true })

```

# Test source

```ts
  89  |   }
  90  | })
  91  | 
  92  | test('再练随机只重排原题，重开保持；空结果/来源不存在/活动来源/写失败均不结束活动轮', async ({
  93  |   testDataDirectory,
  94  | }, info) => {
  95  |   const { application, page } = await prepareFlow(testDataDirectory, info)
  96  |   try {
  97  |     const source = await finishFlow(page)
  98  |     const started = await startFlow(page, {
  99  |       requestId: randomUUID(),
  100 |       topicId: null,
  101 |       count: 'all',
  102 |       replace: null,
  103 |       mode: 'random',
  104 |       repeat: { sessionId: source.session.sessionId, selection: 'all' },
  105 |     })
  106 |     if (!started.ok) throw new Error(started.error.message)
  107 |     const original = flowQueue(testDataDirectory, started.value.sessionId)
  108 |     expect(original.map((row) => row['questionId']).sort()).toEqual([
  109 |       'q-1',
  110 |       'q-2',
  111 |       'q-3',
  112 |       'q-4',
  113 |       'q-5',
  114 |       'q-6',
  115 |     ])
  116 |     const replace = { sessionId: started.value.sessionId, position: 0, revision: 0 }
  117 |     for (const sourceId of [started.value.sessionId, randomUUID()]) {
  118 |       expect(
  119 |         await startFlow(page, {
  120 |           requestId: randomUUID(),
  121 |           topicId: null,
  122 |           count: 'all',
  123 |           replace,
  124 |           repeat: { sessionId: sourceId, selection: 'weak' },
  125 |         }),
  126 |       ).toMatchObject({ ok: false })
  127 |       expect(flowQueue(testDataDirectory, started.value.sessionId)).toEqual(original)
  128 |     }
  129 |     withHistoryDatabase(
  130 |       testDataDirectory,
  131 |       (db) =>
  132 |         db.exec(
  133 |           "CREATE TRIGGER repeat_failure BEFORE INSERT ON practice_items BEGIN SELECT RAISE(ABORT,'repeat failure'); END",
  134 |         ),
  135 |       false,
  136 |     )
  137 |     const failed: StartPractice = {
  138 |       requestId: randomUUID(),
  139 |       topicId: null,
  140 |       count: 'all',
  141 |       replace,
  142 |       repeat: { sessionId: source.session.sessionId, selection: 'weak' },
  143 |     }
  144 |     expect(await startFlow(page, failed)).toMatchObject({
  145 |       ok: false,
  146 |       error: { code: 'WRITE_FAILED' },
  147 |     })
  148 |     expect(
  149 |       withHistoryDatabase(testDataDirectory, (db) =>
  150 |         db.prepare('SELECT status FROM practice_sessions WHERE id=?').get(replace.sessionId),
  151 |       ),
  152 |     ).toEqual({ status: 'active' })
  153 |     withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER repeat_failure'), false)
  154 |     expect(await endFlow(page)).toMatchObject({ ok: true })
  155 |     expect(
  156 |       await startFlow(page, {
  157 |         ...failed,
  158 |         requestId: randomUUID(),
  159 |         replace: null,
  160 |         repeat: { sessionId: started.value.sessionId, selection: 'weak' },
  161 |       }),
  162 |     ).toMatchObject({ ok: false, error: { code: 'NO_QUESTIONS' } })
  163 |     await page.reload()
  164 |     expect(flowQueue(testDataDirectory, started.value.sessionId)).toEqual(original)
  165 |   } finally {
  166 |     await stop(application)
  167 |   }
  168 | })
  169 | 
  170 | test('结果页明确本轮范围/题数/旧版本，丢失开始响应可原请求重试且新轮隐藏答案', async ({
  171 |   testDataDirectory,
  172 | }, info) => {
  173 |   const { application, page } = await prepareFlow(testDataDirectory, info)
  174 |   try {
  175 |     await page.getByLabel('本轮题数', { exact: true }).selectOption('all')
  176 |     await page.getByRole('button', { name: '开始练习', exact: true }).click()
  177 |     for (const rating of ['不会', '不熟', 'skip', null, '掌握'] as const) {
  178 |       if (rating === 'skip')
  179 |         await page.getByRole('button', { name: '跳过本题', exact: true }).click()
  180 |       else {
  181 |         await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  182 |         await page.getByRole('button', { name: rating ?? '暂不评价，下一题', exact: true }).click()
  183 |       }
  184 |     }
  185 |     await page.getByRole('button', { name: '结束本轮', exact: true }).click()
  186 |     const repeat = page.getByRole('form', { name: '本轮题目再练', exact: true })
  187 |     await expect(repeat).toContainText('共 2 题')
  188 |     await expect(repeat).toContainText('其后更新或归档也不替换内容')
> 189 |     await repeat.getByLabel('再练范围', { exact: true }).selectOption('skipped')
      |                                                      ^ TimeoutError: locator.selectOption: Timeout 30000ms exceeded.
  190 |     await expect(repeat).toContainText('共 1 题')
  191 |     await repeat.getByLabel('再练范围', { exact: true }).selectOption('weak')
  192 |     await application.evaluate(({ ipcMain }) => {
  193 |       const handler = Reflect.get(ipcMain, '_invokeHandlers').get('practice:start')
  194 |       Reflect.set(globalThis, '__repeatCommands', [])
  195 |       let drop = true
  196 |       ipcMain.removeHandler('practice:start')
  197 |       ipcMain.handle('practice:start', async (event, command) => {
  198 |         Reflect.get(globalThis, '__repeatCommands').push(structuredClone(command))
  199 |         const result = await handler(event, command)
  200 |         if (drop) {
  201 |           drop = false
  202 |           return { ok: true, value: { broken: true } }
  203 |         }
  204 |         return result
  205 |       })
  206 |     })
  207 |     await info.attach('repeat-results.png', {
  208 |       body: await page.screenshot({ fullPage: true }),
  209 |       contentType: 'image/png',
  210 |     })
  211 |     await repeat.getByRole('button', { name: '确认再练 2 题', exact: true }).click()
  212 |     await expect(repeat.getByRole('alert')).toBeVisible()
  213 |     await expect(repeat.getByLabel('再练范围', { exact: true })).toBeDisabled()
  214 |     await expect(page.getByRole('button', { name: '返回首页', exact: true })).toBeDisabled()
  215 |     await repeat.getByRole('button', { name: '重试开始再练', exact: true }).click()
  216 |     await expect(page.getByLabel('练习进度')).toHaveText('第 1 / 2 题 · 顺序练习')
  217 |     await expect(page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
  218 |     await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue('')
  219 |     const commands = await application.evaluate(() => Reflect.get(globalThis, '__repeatCommands'))
  220 |     expect(commands).toHaveLength(2)
  221 |     expect(commands[1]).toEqual(commands[0])
  222 |     expect(
  223 |       withHistoryDatabase(testDataDirectory, (db) =>
  224 |         db.prepare('SELECT count(*) AS n FROM practice_sessions').get(),
  225 |       ),
  226 |     ).toEqual({ n: 2 })
  227 |     await page.getByRole('button', { name: '保存并返回', exact: true }).click()
  228 |     await openPage(page, '开始练习')
  229 |     await page.getByText('本轮创建条件', { exact: true }).click()
  230 |     await expect(page.getByText(/以下为来源轮的创建条件/)).toBeVisible()
  231 |   } finally {
  232 |     await stop(application)
  233 |   }
  234 | })
  235 | 
```