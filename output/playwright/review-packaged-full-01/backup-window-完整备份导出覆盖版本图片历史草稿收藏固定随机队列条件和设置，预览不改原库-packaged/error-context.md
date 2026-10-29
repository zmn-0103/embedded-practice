# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: backup-window.spec.ts >> 完整备份导出覆盖版本图片历史草稿收藏固定随机队列条件和设置，预览不改原库
- Location: tests\e2e\backup-window.spec.ts:196:5

# Error details

```
Error: expect(received).toMatchObject(expected)

- Expected  - 1
+ Received  + 1

  Object {
    "app_version": "0.0.2",
    "created_at": StringMatching /^2026-/,
    "format_version": 1,
-   "schema_version": 14,
+   "schema_version": 15,
  }
```

# Test source

```ts
  159 |             }
  160 |             return value
  161 |           }) as typeof fs.lstat
  162 |           fs.stat = (async (...args: Parameters<typeof fs.stat>) => {
  163 |             const value = await original.stat(...args)
  164 |             if (String(args[0]) === database) {
  165 |               Reflect.set(value, 'dev', args[1]?.bigint ? 9n : 9)
  166 |               Reflect.set(value, 'ino', args[1]?.bigint ? BigInt(input.first) : Number(input.first))
  167 |             }
  168 |             return value
  169 |           }) as typeof fs.stat
  170 |         },
  171 |         { target, first, second },
  172 |       )
  173 |       await select(application, 'preview', target)
  174 |       const independent = await backup(page, 'preview')
  175 |       expect(independent.ok).toBe(true)
  176 |       expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
  177 |       await application.evaluate(() => Reflect.set(globalThis, '__ui2Alias', true))
  178 |       expect(await backup(page, 'preview')).toMatchObject({
  179 |         ok: false,
  180 |         error: { code: 'FILE_ERROR' },
  181 |       })
  182 |       expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
  183 |       await info.attach('file-id-precision.json', {
  184 |         body: JSON.stringify({ first, second, independent, numberCollision: true }),
  185 |         contentType: 'application/json',
  186 |       })
  187 |     } finally {
  188 |       await application
  189 |         .evaluate(() => Reflect.get(globalThis, '__ui2RestoreFileIds')?.())
  190 |         .catch(() => {})
  191 |       await stop(application)
  192 |     }
  193 |   })
  194 | })
  195 | 
  196 | test('完整备份导出覆盖版本图片历史草稿收藏固定随机队列条件和设置，预览不改原库', async ({
  197 |   testDataDirectory,
  198 | }, info) => {
  199 |   await outputDirectory(async (directory) => {
  200 |     const { application, page, file, folder } = await prepareHistory(
  201 |       testDataDirectory,
  202 |       info.project.name,
  203 |     )
  204 |     try {
  205 |       await page.evaluate(async () => {
  206 |         const api = (globalThis as unknown as { desktop: DesktopApi }).desktop
  207 |         for (const q of ['q-1', 'q-2'])
  208 |           if (
  209 |             !(
  210 |               await api.library.setFavorite({ topicId: 'history-a', questionId: q, favorite: true })
  211 |             ).ok
  212 |           )
  213 |             throw new Error('收藏失败')
  214 |       })
  215 |       await openPage(page, '开始练习')
  216 |       await page.getByLabel('练习模式', { exact: true }).selectOption('random')
  217 |       await page.getByLabel('练习专题', { exact: true }).selectOption('history-a')
  218 |       await page.getByText('筛选练习题目', { exact: true }).click()
  219 |       await page.getByLabel('练习标签', { exact: true }).fill('历史样本')
  220 |       await page.getByLabel('练习只看收藏', { exact: true }).check()
  221 |       await expect(page.getByText('匹配 2 题', { exact: true })).toBeVisible()
  222 |       await page.getByRole('button', { name: '开始练习', exact: true }).click()
  223 |       await page
  224 |         .getByRole('textbox', { name: '我的答案', exact: true })
  225 |         .fill('备份第一题作答\nint backup = 1;')
  226 |       await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  227 |       await page.getByRole('button', { name: '掌握', exact: true }).click()
  228 |       await expect(page.getByLabel('练习进度')).toContainText('第 2 / 2')
  229 |       await page
  230 |         .getByRole('textbox', { name: '我的答案', exact: true })
  231 |         .fill('备份未揭晓草稿\nint queued = 2;')
  232 |       await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
  233 |       await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
  234 |       await writeFile(file, historyBank(true, false, true))
  235 |       await writeFile(join(folder, 'assets/history.png'), alternatePng)
  236 |       const other = join(folder, '异专题.md')
  237 |       await writeFile(other, historyBank(true, false, false, 'history-b'))
  238 |       await importHistoryFiles(application, page, [file, other])
  239 |       await openPage(page, '设置与数据')
  240 |       await page.getByLabel('显示主题', { exact: true }).selectOption('dark')
  241 |       await page.getByLabel('正文字号', { exact: true }).selectOption('22')
  242 |       await page.getByRole('button', { name: '保存并应用', exact: true }).click()
  243 |       await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
  244 |       await openPage(page, '备份恢复')
  245 |       const before = withHistoryDatabase(testDataDirectory, records)
  246 |       const appVersion = await application.evaluate(({ app }) => app.getVersion())
  247 |       expect(before['image_resources']).toHaveLength(2)
  248 |       expect(before['question_versions']!.length).toBeGreaterThan(3)
  249 |       const destination = join(directory, '中文 空格路径', '完整备份.sqlite3')
  250 |       await mkdir(dirname(destination))
  251 |       await select(application, 'export', destination)
  252 |       await page.getByRole('button', { name: '导出完整备份', exact: true }).click()
  253 |       await expect(page.getByText('完整备份已导出并校验。', { exact: true })).toBeVisible()
  254 |       expect(exportedRecords(destination)).toEqual(before)
  255 |       expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
  256 |       expect(await readdir(dirname(destination))).toEqual(['完整备份.sqlite3'])
  257 |       const db = new DatabaseSync(destination, { readOnly: true })
  258 |       try {
> 259 |         expect(db.prepare('SELECT * FROM backup_manifest').get()).toMatchObject({
      |                                                                   ^ Error: expect(received).toMatchObject(expected)
  260 |           format_version: 1,
  261 |           schema_version: 14,
  262 |           created_at: expect.stringMatching(/^2026-/),
  263 |           app_version: appVersion,
  264 |         })
  265 |       } finally {
  266 |         db.close()
  267 |       }
  268 |       const originalHash = createHash('sha256')
  269 |         .update(await readFile(destination))
  270 |         .digest('hex')
  271 |       await select(application, 'preview', destination)
  272 |       await page.getByRole('button', { name: '选择备份并预览', exact: true }).click()
  273 |       const preview = page.getByLabel('恢复预览摘要', { exact: true })
  274 |       await expect(preview).toBeVisible()
  275 |       await expect(preview).toContainText('题目总数')
  276 |       await expect(preview).toContainText('包含可继续的练习轮次及固定队列。')
  277 |       await expect(preview).not.toContainText('备份未揭晓草稿')
  278 |       expect(
  279 |         createHash('sha256')
  280 |           .update(await readFile(destination))
  281 |           .digest('hex'),
  282 |       ).toBe(originalHash)
  283 |       expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
  284 |       expect(await readdir(join(testDataDirectory, 'backup-staging'))).toEqual([
  285 |         expect.stringMatching(/^preview-/),
  286 |       ])
  287 |       expect(
  288 |         withHistoryDatabase(testDataDirectory, (db) =>
  289 |           db.prepare("SELECT name FROM sqlite_schema WHERE name='backup_manifest'").all(),
  290 |         ),
  291 |       ).toEqual([])
  292 |       await preview.evaluate((element) => element.scrollIntoView({ block: 'start' }))
  293 |       await captureHistory(application, page, info, 'backup-preview-dark-22.png')
  294 |       await info.attach('complete-backup-records.json', {
  295 |         body: JSON.stringify({ before, exported: exportedRecords(destination), originalHash }),
  296 |         contentType: 'application/json',
  297 |       })
  298 |       await openPage(page, '开始练习')
  299 |       await page.getByRole('button', { name: '继续练习', exact: true }).click()
  300 |       await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  301 |         '备份未揭晓草稿\nint queued = 2;',
  302 |       )
  303 |     } finally {
  304 |       await stop(application)
  305 |     }
  306 |   })
  307 | })
  308 | 
  309 | test('备份取消与预览取消保留原状态，空库可导出并预览', async ({ testDataDirectory }, info) => {
  310 |   await outputDirectory(async (directory) => {
  311 |     const { application, page } = await launchApplication(
  312 |       testDataDirectory,
  313 |       info.project.name,
  314 |       '备份恢复',
  315 |     )
  316 |     try {
  317 |       const before = withHistoryDatabase(testDataDirectory, records)
  318 |       expect(
  319 |         await page.evaluate(() =>
  320 |           Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.backup).sort(),
  321 |         ),
  322 |       ).toEqual(['export', 'preview', 'restore'])
  323 |       for (const kind of ['export', 'preview'] as const) {
  324 |         await select(application, kind, null)
  325 |         await page
  326 |           .getByRole('button', {
  327 |             name: kind === 'export' ? '导出完整备份' : '选择备份并预览',
  328 |             exact: true,
  329 |           })
  330 |           .click()
  331 |         await expect(page.getByText('已取消本次备份操作。', { exact: true })).toBeVisible()
  332 |         expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
  333 |         expect(await readdir(directory)).toEqual([])
  334 |       }
  335 |       const file = await exportFile(application, page, join(directory, '空库.sqlite3'))
  336 |       expect(file.summary).toMatchObject({
  337 |         questions: 0,
  338 |         categories: 0,
  339 |         practicePlans: 0,
  340 |         images: 0,
  341 |         sessions: 0,
  342 |         activeSession: false,
  343 |         schemaVersion: 15,
  344 |         requiresMigration: false,
  345 |       })
  346 |       await select(application, 'preview', file.filePath)
  347 |       expect(await backup(page, 'preview')).toEqual({
  348 |         ok: true,
  349 |         value: {
  350 |           ...file,
  351 |           token: expect.stringMatching(
  352 |             /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/,
  353 |           ),
  354 |         },
  355 |       })
  356 |     } finally {
  357 |       await stop(application)
  358 |     }
  359 |   })
```