# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: personal-tags.spec.ts >> 标签等待真实响应期间先保存笔记并锁定新增输入，刷新移除详情后文字保留
- Location: tests\e2e\personal-tags.spec.ts:166:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.check: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('.question-selection-row').getByRole('checkbox')
    - locator resolved to <input type="checkbox" aria-label="勾选题目：control-a / q-1 组卷题 A 1"/>
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
    - <section tabindex="-1" aria-label="题库浏览" aria-busy="false" data-records="false" data-reading="false" class="library-workspace">…</section> intercepts pointer events
  - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <main tabindex="-1" id="main-content">…</main> intercepts pointer events
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
       - <section tabindex="-1" aria-label="题库浏览" aria-busy="false" data-records="false" data-reading="false" class="library-workspace">…</section> intercepts pointer events
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
       - <main tabindex="-1" id="main-content">…</main> intercepts pointer events
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
    - <section tabindex="-1" aria-label="题库浏览" aria-busy="false" data-records="false" data-reading="false" class="library-workspace">…</section> intercepts pointer events
  - retrying click action
    - waiting 500ms

```

# Test source

```ts
  95  |     })
  96  |     expect(
  97  |       await changeTag(page, { kind: 'save', tagId: randomUUID(), name: 'pROJECT' }),
  98  |     ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } })
  99  |     const assign = { kind: 'assign' as const, tagId, present: true, items: [a(1), b(2)] }
  100 |     expect(await changeTag(page, assign)).toMatchObject({ ok: true })
  101 |     expect(await changeTag(page, assign)).toMatchObject({ ok: true })
  102 |     const before = assignments(testDataDirectory)
  103 |     expect(
  104 |       await changeTag(page, {
  105 |         ...assign,
  106 |         items: [a(2), { topicId: 'missing', questionId: 'q-1' }],
  107 |       }),
  108 |     ).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } })
  109 |     expect(assignments(testDataDirectory)).toEqual(before)
  110 |     withHistoryDatabase(
  111 |       testDataDirectory,
  112 |       (db) =>
  113 |         db.exec(
  114 |           "CREATE TRIGGER tag_failure BEFORE INSERT ON question_personal_tags WHEN NEW.question_id=(SELECT id FROM questions WHERE topic_id='control-b' AND question_id='q-3') BEGIN SELECT RAISE(ABORT,'tag write'); END",
  115 |         ),
  116 |       false,
  117 |     )
  118 |     expect(await changeTag(page, { ...assign, items: [a(2), b(3)] })).toMatchObject({
  119 |       ok: false,
  120 |       error: { code: 'DATABASE_UNAVAILABLE' },
  121 |     })
  122 |     expect(assignments(testDataDirectory)).toEqual(before)
  123 |     withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER tag_failure'), false)
  124 |     await writeFile(file, controlBank('control-a', 3, true, 1))
  125 |     await importHistoryFiles(application, page, [file])
  126 |     expect(assignments(testDataDirectory)).toEqual(before)
  127 |     const options = { ...planOptions, filters: { ...planOptions.filters, personalTagId: tagId } }
  128 |     const planId = randomUUID()
  129 |     expect(
  130 |       await changePlan(page, { kind: 'save', planId, name: '标签条件', options }),
  131 |     ).toMatchObject({ ok: true })
  132 |     expect(
  133 |       await changeTag(page, { kind: 'rename', tagId, expectedName: 'Project', name: '项目用过' }),
  134 |     ).toMatchObject({ ok: true })
  135 |     expect((await readPlans(page))[0]).toMatchObject({
  136 |       personalTagMissing: false,
  137 |       matchingCount: 1,
  138 |     })
  139 |     expect(await changeTag(page, { kind: 'delete', tagId, expectedName: 'Project' })).toMatchObject(
  140 |       { ok: false },
  141 |     )
  142 |     expect(
  143 |       await changeTag(page, { kind: 'delete', tagId, expectedName: '项目用过' }),
  144 |     ).toMatchObject({ ok: true })
  145 |     expect((await readPlans(page))[0]).toMatchObject({
  146 |       options,
  147 |       personalTagMissing: true,
  148 |       matchingCount: 0,
  149 |     })
  150 |     const selected = await page.evaluate(
  151 |       (filters) =>
  152 |         (globalThis as unknown as { desktop: DesktopApi }).desktop.library.listQuestions({
  153 |           topicId: null,
  154 |           archived: false,
  155 |           page: 1,
  156 |           filters,
  157 |         }),
  158 |       options.filters,
  159 |     )
  160 |     expect(selected).toMatchObject({ ok: true, value: { total: 0, questions: [] } })
  161 |   } finally {
  162 |     await stop(application)
  163 |   }
  164 | })
  165 | 
  166 | test('标签等待真实响应期间先保存笔记并锁定新增输入，刷新移除详情后文字保留', async ({
  167 |   testDataDirectory,
  168 | }, info) => {
  169 |   const { application, page } = await prepareControl(testDataDirectory, info, 3)
  170 |   try {
  171 |     const panel = page
  172 |       .locator('details')
  173 |       .filter({ has: page.locator('summary', { hasText: /^个人标签（/ }) })
  174 |     await panel.locator('summary').click()
  175 |     await panel.getByLabel('个人标签名称', { exact: true }).fill('待讲清')
  176 |     await panel.getByRole('button', { name: '创建个人标签', exact: true }).click()
  177 |     await expect(panel.getByRole('status')).toHaveText('个人标签已保存。')
  178 |     const catalog = await page.evaluate(() =>
  179 |       (globalThis as unknown as { desktop: DesktopApi }).desktop.personalTags.list(),
  180 |     )
  181 |     if (!catalog.ok) throw new Error(catalog.error.message)
  182 |     const tagId = catalog.value[0]!.tagId
  183 |     await changeTag(page, { kind: 'assign', tagId, present: true, items: [a(1)] })
  184 |     await openPage(page, '学习总览')
  185 |     await openPage(page, '题库')
  186 |     // 重新读取目录后使用真实筛选和明确勾选。
  187 |     await page
  188 |       .getByLabel('题库个人标签')
  189 |       .locator('option')
  190 |       .filter({ hasText: '待讲清' })
  191 |       .waitFor({ state: 'attached' })
  192 |     await page.getByLabel('题库个人标签').selectOption(tagId)
  193 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  194 |     await expect(page.locator('.question-row')).toHaveCount(1)
> 195 |     await page.locator('.question-selection-row').getByRole('checkbox').check()
      |                                                                         ^ TimeoutError: locator.check: Timeout 30000ms exceeded.
  196 |     await panel.getByLabel('操作的个人标签').selectOption(tagId)
  197 |     const note = await openLibraryNote(page)
  198 |     const editor = note.getByRole('textbox', { name: '我的复习笔记', exact: true })
  199 |     await application.evaluate(({ ipcMain }) => {
  200 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('personal-tags:change')
  201 |       ipcMain.removeHandler('personal-tags:change')
  202 |       ipcMain.handle('personal-tags:change', async (event, input) => {
  203 |         const result = await original(event, input)
  204 |         await new Promise<void>((resolve) => Reflect.set(globalThis, '__releaseTag', resolve))
  205 |         return result
  206 |       })
  207 |     })
  208 |     const text = 'DMA完成不等于串口发送完成，等待期间应保存这段理解'
  209 |     await editor.fill(text)
  210 |     await panel.getByRole('button', { name: '从勾选题目移除个人标签', exact: true }).click()
  211 |     await expect
  212 |       .poll(() => application.evaluate(() => typeof Reflect.get(globalThis, '__releaseTag')))
  213 |       .toBe('function')
  214 |     await expect(editor).not.toBeEditable()
  215 |     await editor.focus()
  216 |     await page.keyboard.type('LATE-INPUT')
  217 |     await expect(editor).toHaveValue(text)
  218 |     expect(await readNote(page)).toMatchObject({ ok: true, value: { text } })
  219 |     await application.evaluate(() => Reflect.get(globalThis, '__releaseTag')())
  220 |     await expect(page.locator('.question-row')).toHaveCount(0)
  221 |     expect(await readNote(page)).toMatchObject({ ok: true, value: { text } })
  222 |   } finally {
  223 |     await stop(application)
  224 |   }
  225 | })
  226 | 
```