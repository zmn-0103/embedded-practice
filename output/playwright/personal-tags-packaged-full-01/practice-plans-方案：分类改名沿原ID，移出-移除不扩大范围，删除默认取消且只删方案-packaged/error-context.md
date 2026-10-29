# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: practice-plans.spec.ts >> 方案：分类改名沿原ID，移出/移除不扩大范围，删除默认取消且只删方案
- Location: tests\e2e\practice-plans.spec.ts:192:5

# Error details

```
Error: expect(received).toMatchObject(expected)

- Expected  - 1
+ Received  + 1

  Object {
    "error": Object {
-     "code": "NOT_FOUND",
+     "code": "INVALID_REQUEST",
    },
  }
```

# Test source

```ts
  127 |       expect(await changePlan(page, command)).toEqual({ ok: true, value: null })
  128 |     expect(await readPlans(page)).toHaveLength(1)
  129 |     for (const changed of [
  130 |       { ...command, name: '其他条件' },
  131 |       { ...command, planId: randomUUID(), name: 'RULE-PLAN' },
  132 |     ])
  133 |       expect(await changePlan(page, changed)).toMatchObject({
  134 |         ok: false,
  135 |         error: { code: 'INVALID_REQUEST' },
  136 |       })
  137 |     expect(
  138 |       await changePlan(page, {
  139 |         ...command,
  140 |         planId: randomUUID(),
  141 |         name: '失效范围',
  142 |         options: { ...planOptions, category: { kind: 'category', categoryId: 'missing' } },
  143 |       }),
  144 |     ).toMatchObject({ error: { code: 'NOT_FOUND' } })
  145 |     for (let i = 1; i < 100; i++)
  146 |       expect(
  147 |         await changePlan(page, { ...command, planId: randomUUID(), name: `方案${i}` }),
  148 |       ).toEqual({ ok: true, value: null })
  149 |     expect(await readPlans(page)).toHaveLength(100)
  150 |     expect(
  151 |       await changePlan(page, { ...command, planId: randomUUID(), name: '第101份' }),
  152 |     ).toMatchObject({ error: { code: 'INVALID_REQUEST' } })
  153 |     expect(await changePlan(page, command)).toEqual({ ok: true, value: null })
  154 |     for (let i = 0; i < 2; i++)
  155 |       expect(await changePlan(page, { kind: 'delete', planId: command.planId })).toEqual({
  156 |         ok: true,
  157 |         value: null,
  158 |       })
  159 |     withHistoryDatabase(
  160 |       testDataDirectory,
  161 |       (db) =>
  162 |         db.exec(
  163 |           "CREATE TRIGGER plan_failure BEFORE INSERT ON practice_plans BEGIN SELECT RAISE(ABORT,'test failure'); END",
  164 |         ),
  165 |       false,
  166 |     )
  167 |     expect(
  168 |       await changePlan(page, { ...command, planId: randomUUID(), name: '失败保持' }),
  169 |     ).toMatchObject({ error: { code: 'DATABASE_UNAVAILABLE' } })
  170 |     expect(await readPlans(page)).toHaveLength(99)
  171 |     withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER plan_failure'), false)
  172 |     expect((await categoryList(page)).revision).toBe(revision)
  173 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  174 |     const damaged = (await readPlans(page))[0]!.planId
  175 |     withHistoryDatabase(
  176 |       testDataDirectory,
  177 |       (db) =>
  178 |         db.prepare("UPDATE practice_plans SET options_json='{}' WHERE plan_id=?").run(damaged),
  179 |       false,
  180 |     )
  181 |     expect(
  182 |       await page.evaluate(() =>
  183 |         (globalThis as unknown as { desktop: DesktopApi }).desktop.practicePlans.list(),
  184 |       ),
  185 |     ).toMatchObject({ ok: false, error: { code: 'DATABASE_UNAVAILABLE' } })
  186 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  187 |   } finally {
  188 |     await stop(application)
  189 |   }
  190 | })
  191 | 
  192 | test('方案：分类改名沿原ID，移出/移除不扩大范围，删除默认取消且只删方案', async ({
  193 |   testDataDirectory,
  194 | }, info) => {
  195 |   const { application, page, first, second } = await prepareCategories(
  196 |     testDataDirectory,
  197 |     info.project.name,
  198 |   )
  199 |   try {
  200 |     await openPlans(page)
  201 |     await page.getByText('按分类选择专题', { exact: true }).click()
  202 |     await page.getByRole('button', { name: '练习分类：板块 A', exact: true }).click()
  203 |     await page.getByLabel('练习专题', { exact: true }).selectOption('cat-a')
  204 |     const saved = await savePlan(page, '分类方案')
  205 |     await categoryChange(page, { kind: 'rename', categoryId: first, title: '当前分类名' })
  206 |     await page.reload()
  207 |     let panel = await openPlans(page)
  208 |     await panel.getByLabel('选用练习方案', { exact: true }).selectOption(saved.planId)
  209 |     await expect(panel).toContainText('当前分类名')
  210 |     await panel.getByRole('button', { name: '填入条件', exact: true }).click()
  211 |     await expect(page.getByText('匹配 2 题', { exact: true })).toBeVisible()
  212 |     // 合法归档夹具模拟专题已无活动题，刷新后仍须保留明确选中的专题ID。
  213 |     withHistoryDatabase(
  214 |       testDataDirectory,
  215 |       (db) => db.exec("UPDATE questions SET archived=1 WHERE topic_id='cat-a'"),
  216 |       false,
  217 |     )
  218 |     const before = historySnapshot(testDataDirectory)
  219 |     await openPage(page, '题库')
  220 |     await assignTopic(page, 'cat-a', second)
  221 |     panel = await openPlans(page)
  222 |     await expect(page.getByLabel('练习专题', { exact: true })).toHaveValue('cat-a')
  223 |     await expect(page.getByText('匹配 0 题', { exact: true })).toBeVisible()
  224 |     await expect(panel.getByRole('button', { name: '填入条件', exact: true })).toBeDisabled()
  225 |     expect(
  226 |       await changePlan(page, { kind: 'save', ...saved, planId: randomUUID(), name: '失效不保存' }),
> 227 |     ).toMatchObject({ error: { code: 'NOT_FOUND' } })
      |       ^ Error: expect(received).toMatchObject(expected)
  228 |     await categoryChange(page, { kind: 'delete', categoryId: first })
  229 |     await page.reload()
  230 |     panel = await openPlans(page)
  231 |     await panel.getByLabel('选用练习方案', { exact: true }).selectOption(saved.planId)
  232 |     await expect(panel).toContainText('分类已移除')
  233 |     await expect(panel.getByRole('button', { name: '填入条件', exact: true })).toBeDisabled()
  234 |     expect(await readPlans(page)).toEqual([saved])
  235 |     await panel.getByRole('button', { name: '删除所选方案…', exact: true }).click()
  236 |     await expect(panel.getByRole('button', { name: '取消删除方案', exact: true })).toBeFocused()
  237 |     await panel.getByRole('button', { name: '取消删除方案', exact: true }).click()
  238 |     expect(await readPlans(page)).toEqual([saved])
  239 |     await panel.getByRole('button', { name: '删除所选方案…', exact: true }).click()
  240 |     await panel.getByRole('button', { name: '确认删除方案', exact: true }).click()
  241 |     await expect(panel.getByRole('status')).toContainText('练习方案已删除')
  242 |     expect(await readPlans(page)).toEqual([])
  243 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  244 |   } finally {
  245 |     await stop(application)
  246 |   }
  247 | })
  248 | 
```