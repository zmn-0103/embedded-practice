# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: personal-tags.spec.ts >> 个人标签已提交但响应丢失时锁定表单，重试原操作不重复创建
- Location: tests\e2e\personal-tags.spec.ts:150:5

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator: locator('.personal-tags-panel').getByRole('status')
Expected: "个人标签已保存。"
Error: strict mode violation: locator('.personal-tags-panel').getByRole('status') resolved to 2 elements:
    1) <p role="status">正在读取个人标签…</p> aka getByText('正在读取个人标签…')
    2) <p role="status">个人标签已保存。</p> aka getByText('个人标签已保存。')

Call log:
  - Expect "toHaveText" locator('.personal-tags-panel').getByRole('status') with timeout 10000ms
  - waiting for locator('.personal-tags-panel').getByRole('status')

```

# Test source

```ts
  77  | }, info) => {
  78  |   const { application, page } = await prepareControl(testDataDirectory, info, 3)
  79  |   try {
  80  |     const panel = page
  81  |       .locator('details')
  82  |       .filter({ has: page.locator('summary', { hasText: /^个人标签（/ }) })
  83  |     await panel.locator('summary').click()
  84  |     await panel.getByLabel('个人标签名称', { exact: true }).fill('面试前必看')
  85  |     await panel.getByRole('button', { name: '创建个人标签', exact: true }).click()
  86  |     await expect(panel.getByRole('status')).toHaveText('个人标签已保存。')
  87  |     const result = await page.evaluate(() =>
  88  |       (globalThis as unknown as { desktop: DesktopApi }).desktop.personalTags.list(),
  89  |     )
  90  |     if (!result.ok) throw new Error(result.error.message)
  91  |     const tag = result.value[0]!
  92  |     await panel.getByLabel('操作的个人标签').selectOption(tag.tagId)
  93  |     await panel.locator('summary').click()
  94  |     await page
  95  |       .locator('.question-selection-row')
  96  |       .filter({ has: page.getByText('组卷题 A 1', { exact: true }) })
  97  |       .getByRole('checkbox')
  98  |       .check()
  99  |     await page
  100 |       .locator('.question-selection-row')
  101 |       .filter({ has: page.getByText('组卷题 B 2', { exact: true }) })
  102 |       .getByRole('checkbox')
  103 |       .check()
  104 |     await panel.locator('summary').click()
  105 |     await panel.getByRole('button', { name: '为勾选题目添加个人标签', exact: true }).click()
  106 |     await expect(panel.getByRole('status')).toHaveText('已为明确勾选的2题添加个人标签。')
  107 |     expect(assignments(testDataDirectory)).toHaveLength(2)
  108 |     await panel.locator('summary').click()
  109 |     await page.getByLabel('题库个人标签', { exact: true }).selectOption(tag.tagId)
  110 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  111 |     await expect(page.locator('.question-row')).toHaveCount(2)
  112 |     await captureHistory(application, page, info, 'personal-tag-filter.png')
  113 |     await panel.locator('summary').click()
  114 |     await captureHistory(application, page, info, 'personal-tag-management.png')
  115 |     await panel.getByLabel('个人标签名称', { exact: true }).fill('讲清楚再进面试')
  116 |     await panel.getByRole('button', { name: '重命名个人标签', exact: true }).click()
  117 |     await expect(panel.getByRole('status')).toHaveText('个人标签已保存。')
  118 |     await panel.locator('summary').click()
  119 |     await expect(page.getByLabel('题库个人标签').locator('option:checked')).toHaveText(
  120 |       '讲清楚再进面试',
  121 |     )
  122 |     const plan = {
  123 |       planId: randomUUID(),
  124 |       name: '按个人标签练',
  125 |       options: { ...planOptions, filters: { ...planOptions.filters, personalTagId: tag.tagId } },
  126 |     }
  127 |     expect(await changePlan(page, { kind: 'save', ...plan })).toMatchObject({ ok: true })
  128 |     expect((await readPlans(page))[0]).toMatchObject({
  129 |       ...plan,
  130 |       matchingCount: 2,
  131 |       personalTagMissing: false,
  132 |     })
  133 |     await panel.locator('summary').click()
  134 |     await panel.getByRole('button', { name: '从勾选题目移除个人标签', exact: true }).click()
  135 |     await expect(panel.getByRole('status')).toHaveText('已为明确勾选的2题移除个人标签。')
  136 |     await expect(page.locator('.question-row')).toHaveCount(0)
  137 |     expect(assignments(testDataDirectory)).toEqual([])
  138 |     await panel.getByRole('button', { name: '删除个人标签…', exact: true }).click()
  139 |     await panel.getByRole('button', { name: '取消删除个人标签', exact: true }).click()
  140 |     expect((await readPlans(page))[0]!.personalTagMissing).toBe(false)
  141 |     await panel.getByRole('button', { name: '删除个人标签…', exact: true }).click()
  142 |     await panel.getByRole('button', { name: '确认删除个人标签', exact: true }).click()
  143 |     await expect(panel.getByRole('status')).toContainText('个人标签已删除')
  144 |     expect((await readPlans(page))[0]).toMatchObject({ personalTagMissing: true, matchingCount: 0 })
  145 |   } finally {
  146 |     await stop(application)
  147 |   }
  148 | })
  149 | 
  150 | test('个人标签已提交但响应丢失时锁定表单，重试原操作不重复创建', async ({
  151 |   testDataDirectory,
  152 | }, info) => {
  153 |   const { application, page } = await prepareControl(testDataDirectory, info, 3)
  154 |   try {
  155 |     const panel = page.locator('.personal-tags-panel')
  156 |     await panel.locator('summary').click()
  157 |     await application.evaluate(({ ipcMain }) => {
  158 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('personal-tags:change')
  159 |       let drop = true
  160 |       Reflect.set(globalThis, '__tagRequests', [])
  161 |       ipcMain.removeHandler('personal-tags:change')
  162 |       ipcMain.handle('personal-tags:change', async (event, input) => {
  163 |         Reflect.get(globalThis, '__tagRequests').push(structuredClone(input))
  164 |         const result = await original(event, input)
  165 |         if (drop) {
  166 |           drop = false
  167 |           return { ok: true, value: 'invalid-reply' }
  168 |         }
  169 |         return result
  170 |       })
  171 |     })
  172 |     await panel.getByLabel('个人标签名称', { exact: true }).fill('需要再口述')
  173 |     await panel.getByRole('button', { name: '创建个人标签', exact: true }).click()
  174 |     await expect(panel.getByRole('alert')).toContainText('结果尚未确认')
  175 |     await expect(panel.getByLabel('个人标签名称', { exact: true })).toBeDisabled()
  176 |     await panel.getByRole('button', { name: '重试原标签操作', exact: true }).click()
> 177 |     await expect(panel.getByRole('status')).toHaveText('个人标签已保存。')
      |                                             ^ Error: expect(locator).toHaveText(expected) failed
  178 |     const requests = await application.evaluate(() => Reflect.get(globalThis, '__tagRequests'))
  179 |     expect(requests).toHaveLength(2)
  180 |     expect(requests[1]).toEqual(requests[0])
  181 |     const tags = await page.evaluate(() =>
  182 |       (globalThis as unknown as { desktop: DesktopApi }).desktop.personalTags.list(),
  183 |     )
  184 |     expect(tags).toMatchObject({ ok: true, value: [{ name: '需要再口述' }] })
  185 |     if (!tags.ok) throw new Error(tags.error.message)
  186 |     expect(tags.value).toHaveLength(1)
  187 |   } finally {
  188 |     await stop(application)
  189 |   }
  190 | })
  191 | 
  192 | test('个人标签重导入/归档保留，失效成员或真实写失败整批回滚，删除不扩大方案', async ({
  193 |   testDataDirectory,
  194 | }, info) => {
  195 |   const { application, page, file } = await prepareControl(testDataDirectory, info, 3)
  196 |   try {
  197 |     const tagId = randomUUID()
  198 |     expect(await changeTag(page, { kind: 'save', tagId, name: 'Project' })).toMatchObject({
  199 |       ok: true,
  200 |     })
  201 |     expect(
  202 |       await changeTag(page, { kind: 'save', tagId: randomUUID(), name: 'pROJECT' }),
  203 |     ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } })
  204 |     const assign = { kind: 'assign' as const, tagId, present: true, items: [a(1), b(2)] }
  205 |     expect(await changeTag(page, assign)).toMatchObject({ ok: true })
  206 |     expect(await changeTag(page, assign)).toMatchObject({ ok: true })
  207 |     const before = assignments(testDataDirectory)
  208 |     expect(
  209 |       await changeTag(page, {
  210 |         ...assign,
  211 |         items: [a(2), { topicId: 'missing', questionId: 'q-1' }],
  212 |       }),
  213 |     ).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } })
  214 |     expect(assignments(testDataDirectory)).toEqual(before)
  215 |     withHistoryDatabase(
  216 |       testDataDirectory,
  217 |       (db) =>
  218 |         db.exec(
  219 |           "CREATE TRIGGER tag_failure BEFORE INSERT ON question_personal_tags WHEN NEW.question_id=(SELECT id FROM questions WHERE topic_id='control-b' AND question_id='q-3') BEGIN SELECT RAISE(ABORT,'tag write'); END",
  220 |         ),
  221 |       false,
  222 |     )
  223 |     expect(await changeTag(page, { ...assign, items: [a(2), b(3)] })).toMatchObject({
  224 |       ok: false,
  225 |       error: { code: 'DATABASE_UNAVAILABLE' },
  226 |     })
  227 |     expect(assignments(testDataDirectory)).toEqual(before)
  228 |     withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER tag_failure'), false)
  229 |     await writeFile(file, controlBank('control-a', 3, true, 1))
  230 |     await importHistoryFiles(application, page, [file])
  231 |     expect(assignments(testDataDirectory)).toEqual(before)
  232 |     const options = { ...planOptions, filters: { ...planOptions.filters, personalTagId: tagId } }
  233 |     const planId = randomUUID()
  234 |     expect(
  235 |       await changePlan(page, { kind: 'save', planId, name: '标签条件', options }),
  236 |     ).toMatchObject({ ok: true })
  237 |     expect(
  238 |       await changeTag(page, { kind: 'rename', tagId, expectedName: 'Project', name: '项目用过' }),
  239 |     ).toMatchObject({ ok: true })
  240 |     expect((await readPlans(page))[0]).toMatchObject({
  241 |       personalTagMissing: false,
  242 |       matchingCount: 1,
  243 |     })
  244 |     expect(await changeTag(page, { kind: 'delete', tagId, expectedName: 'Project' })).toMatchObject(
  245 |       { ok: false },
  246 |     )
  247 |     expect(
  248 |       await changeTag(page, { kind: 'delete', tagId, expectedName: '项目用过' }),
  249 |     ).toMatchObject({ ok: true })
  250 |     expect((await readPlans(page))[0]).toMatchObject({
  251 |       options,
  252 |       personalTagMissing: true,
  253 |       matchingCount: 0,
  254 |     })
  255 |     const selected = await page.evaluate(
  256 |       (filters) =>
  257 |         (globalThis as unknown as { desktop: DesktopApi }).desktop.library.listQuestions({
  258 |           topicId: null,
  259 |           archived: false,
  260 |           page: 1,
  261 |           filters,
  262 |         }),
  263 |       options.filters,
  264 |     )
  265 |     expect(selected).toMatchObject({ ok: true, value: { total: 0, questions: [] } })
  266 |   } finally {
  267 |     await stop(application)
  268 |   }
  269 | })
  270 | 
  271 | test('标签等待真实响应期间先保存笔记并锁定新增输入，刷新移除详情后文字保留', async ({
  272 |   testDataDirectory,
  273 | }, info) => {
  274 |   const { application, page } = await prepareControl(testDataDirectory, info, 3)
  275 |   try {
  276 |     const panel = page
  277 |       .locator('details')
```