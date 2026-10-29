# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: practice-flow-storage.spec.ts >> 完整备份恢复再练来源/固定旧版本/联合方案与草稿，坏来源拒绝且不覆盖当前数据
- Location: tests\e2e\practice-flow-storage.spec.ts:172:5

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 0
+ Received  + 4

@@ -1,7 +1,9 @@
  Array [
    Object {
+     "lastUsedAt": null,
+     "matchingCount": 2,
      "name": "联合复习方案",
      "options": Object {
        "category": Object {
          "kind": "all",
        },
@@ -14,8 +16,10 @@
          "tag": null,
        },
        "mode": "random",
        "topicId": null,
      },
+     "personalTagMissing": false,
+     "pinned": false,
      "planId": "e21fceb1-59e4-4bd0-a0de-fcea70ca93a1",
    },
  ]
```

# Test source

```ts
  165 |         expect(await readFile(join(testDataDirectory, 'backups'), 'utf8')).toBe('禁止覆盖此文件')
  166 |     } finally {
  167 |       await stop(instance.application)
  168 |     }
  169 |   })
  170 | }
  171 | 
  172 | test('完整备份恢复再练来源/固定旧版本/联合方案与草稿，坏来源拒绝且不覆盖当前数据', async ({
  173 |   testDataDirectory,
  174 | }, info) => {
  175 |   const initial = await prepareFlow(testDataDirectory, info)
  176 |   const opened = [initial.application]
  177 |   const restoredDirectory = await mkdtemp(join(tmpdir(), 'embedded-practice-flow-restore-'))
  178 |   let completed = false
  179 |   try {
  180 |     const source = await finishFlow(initial.page)
  181 |     const planId = randomUUID()
  182 |     expect(
  183 |       await changePlan(initial.page, {
  184 |         kind: 'save',
  185 |         planId,
  186 |         name: '原方案',
  187 |         options: planOptions,
  188 |       }),
  189 |     ).toMatchObject({ ok: true })
  190 |     const options = {
  191 |       ...planOptions,
  192 |       filters: { ...planOptions.filters, mastery: '不会＋不熟' as const },
  193 |     }
  194 |     expect(
  195 |       await changePlan(initial.page, {
  196 |         kind: 'update',
  197 |         planId,
  198 |         name: '联合复习方案',
  199 |         options,
  200 |         expected: { name: '原方案', options: planOptions },
  201 |       }),
  202 |     ).toMatchObject({ ok: true })
  203 |     const started = await startFlow(initial.page, {
  204 |       requestId: randomUUID(),
  205 |       topicId: null,
  206 |       count: 'all',
  207 |       replace: null,
  208 |       repeat: { sessionId: source.session.sessionId, selection: 'weak' },
  209 |     })
  210 |     if (!started.ok) throw new Error(started.error.message)
  211 |     expect(
  212 |       await initial.page.evaluate(
  213 |         (sessionId) =>
  214 |           (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.saveDraft({
  215 |             sessionId,
  216 |             position: 0,
  217 |             draft: { revision: 1, text: '再练独立草稿' },
  218 |           }),
  219 |         started.value.sessionId,
  220 |       ),
  221 |     ).toMatchObject({ ok: true })
  222 |     const before = withHistoryDatabase(testDataDirectory, records)
  223 |     await openPage(initial.page, '备份恢复')
  224 |     const file = info.outputPath('再练完整备份.sqlite3')
  225 |     await initial.application.evaluate(({ dialog }, filePath) => {
  226 |       dialog.showSaveDialog = async () => ({ canceled: false, filePath })
  227 |     }, file)
  228 |     await initial.page.getByRole('button', { name: '导出完整备份', exact: true }).click()
  229 |     await expect(initial.page.getByText('完整备份已导出并校验。', { exact: true })).toBeVisible()
  230 |     const empty = await launchApplication(restoredDirectory, info.project.name, '备份恢复')
  231 |     opened.push(empty.application)
  232 |     const emptyState = historySnapshot(restoredDirectory)
  233 |     const badPath = info.outputPath('坏再练来源.sqlite3')
  234 |     await copyFile(file, badPath)
  235 |     const damaged = new DatabaseSync(badPath)
  236 |     try {
  237 |       damaged.exec(
  238 |         'UPDATE practice_sessions SET repeat_source_id=id WHERE repeat_source_id IS NOT NULL',
  239 |       )
  240 |     } finally {
  241 |       damaged.close()
  242 |     }
  243 |     await empty.application.evaluate(({ dialog }, path) => {
  244 |       dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
  245 |     }, badPath)
  246 |     expect(
  247 |       await empty.page.evaluate(() =>
  248 |         (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
  249 |       ),
  250 |     ).toMatchObject({ ok: false, error: { code: 'INVALID_BACKUP' } })
  251 |     expect(historySnapshot(restoredDirectory)).toEqual(emptyState)
  252 |     await empty.application.evaluate(({ app, dialog }, path) => {
  253 |       dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
  254 |       dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false })
  255 |       app.relaunch = () => {}
  256 |     }, file)
  257 |     await empty.page.getByRole('button', { name: '选择备份并预览', exact: true }).click()
  258 |     await expect(empty.page.getByLabel('恢复预览摘要', { exact: true })).toBeVisible()
  259 |     const exiting = empty.application.waitForEvent('close')
  260 |     await empty.page.getByRole('button', { name: '恢复此备份…', exact: true }).click()
  261 |     await exiting
  262 |     const restored = await launchApplication(restoredDirectory, info.project.name)
  263 |     opened.push(restored.application)
  264 |     expect(withHistoryDatabase(restoredDirectory, records)).toEqual(before)
> 265 |     expect(await readPlans(restored.page)).toEqual([{ planId, name: '联合复习方案', options }])
      |                                            ^ Error: expect(received).toEqual(expected) // deep equality
  266 |     await restored.page.getByRole('button', { name: '继续练习', exact: true }).click()
  267 |     await expect(restored.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  268 |       '再练独立草稿',
  269 |     )
  270 |     await expect(restored.page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
  271 |     await expect(
  272 |       restored.page.getByText('本轮为再练，沿用来源轮保存的题目与参考答案版本。', { exact: true }),
  273 |     ).toBeVisible()
  274 |     completed = true
  275 |   } finally {
  276 |     for (const app of opened) await stop(app)
  277 |     if (
  278 |       dirname(resolve(restoredDirectory)) !== resolve(tmpdir()) ||
  279 |       !basename(restoredDirectory).startsWith('embedded-practice-flow-restore-')
  280 |     )
  281 |       throw new Error('拒绝清理非本次恢复目录')
  282 |     if (completed)
  283 |       await rm(restoredDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  284 |     else
  285 |       await info.attach('flow-restore-failed-directory', {
  286 |         body: restoredDirectory,
  287 |         contentType: 'text/plain',
  288 |       })
  289 |   }
  290 | })
  291 | 
```