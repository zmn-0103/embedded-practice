# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: backup-window.spec.ts >> 完整备份导出覆盖版本图片历史草稿收藏固定随机队列条件和设置，预览不改原库
- Location: tests\e2e\backup-window.spec.ts:123:5

# Error details

```
Error: expect(received).toMatchObject(expected)

- Expected  - 1
+ Received  + 1

  Object {
    "app_version": "42.11.15",
    "created_at": StringMatching /^2026-/,
    "format_version": 1,
-   "schema_version": 6,
+   "schema_version": 7,
  }
```

# Test source

```ts
  85  |   application: ElectronApplication,
  86  |   kind: 'export' | 'preview',
  87  |   path: string | null,
  88  | ) {
  89  |   await application.evaluate(
  90  |     ({ dialog }, args) => {
  91  |       if (args.kind === 'export')
  92  |         dialog.showSaveDialog = async () => ({
  93  |           canceled: args.path === null,
  94  |           filePath: args.path ?? '',
  95  |         })
  96  |       else
  97  |         dialog.showOpenDialog = async () => ({
  98  |           canceled: args.path === null,
  99  |           filePaths: args.path ? [args.path] : [],
  100 |         })
  101 |     },
  102 |     { kind, path },
  103 |   )
  104 | }
  105 | async function backup(page: Page, kind: 'export' | 'preview') {
  106 |   return page.evaluate(
  107 |     (kind) => (globalThis as unknown as { desktop: DesktopApi }).desktop.backup[kind](),
  108 |     kind,
  109 |   )
  110 | }
  111 | async function exportFile(
  112 |   application: ElectronApplication,
  113 |   page: Page,
  114 |   path: string,
  115 | ): Promise<BackupFile> {
  116 |   await select(application, 'export', path)
  117 |   const result = await backup(page, 'export')
  118 |   expect(result.ok).toBe(true)
  119 |   if (!result.ok) throw new Error('导出测试失败：' + result.error.code)
  120 |   return result.value
  121 | }
  122 | 
  123 | test('完整备份导出覆盖版本图片历史草稿收藏固定随机队列条件和设置，预览不改原库', async ({
  124 |   testDataDirectory,
  125 | }, info) => {
  126 |   await outputDirectory(async (directory) => {
  127 |     const { application, page, file, folder } = await prepareHistory(
  128 |       testDataDirectory,
  129 |       info.project.name,
  130 |     )
  131 |     try {
  132 |       await page.evaluate(async () => {
  133 |         const api = (globalThis as unknown as { desktop: DesktopApi }).desktop
  134 |         for (const q of ['q-1', 'q-2'])
  135 |           if (
  136 |             !(
  137 |               await api.library.setFavorite({ topicId: 'history-a', questionId: q, favorite: true })
  138 |             ).ok
  139 |           )
  140 |             throw new Error('收藏失败')
  141 |       })
  142 |       await openPage(page, '开始练习')
  143 |       await page.getByLabel('练习模式', { exact: true }).selectOption('random')
  144 |       await page.getByLabel('练习专题', { exact: true }).selectOption('history-a')
  145 |       await page.getByText('筛选练习题目', { exact: true }).click()
  146 |       await page.getByLabel('练习标签', { exact: true }).fill('历史样本')
  147 |       await page.getByLabel('练习只看收藏', { exact: true }).check()
  148 |       await expect(page.getByText('匹配 2 题', { exact: true })).toBeVisible()
  149 |       await page.getByRole('button', { name: '开始练习', exact: true }).click()
  150 |       await page
  151 |         .getByRole('textbox', { name: '我的答案', exact: true })
  152 |         .fill('备份第一题作答\nint backup = 1;')
  153 |       await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  154 |       await page.getByRole('button', { name: '掌握', exact: true }).click()
  155 |       await expect(page.getByLabel('练习进度')).toContainText('第 2 / 2')
  156 |       await page
  157 |         .getByRole('textbox', { name: '我的答案', exact: true })
  158 |         .fill('备份未揭晓草稿\nint queued = 2;')
  159 |       await page.getByRole('button', { name: '返回首页', exact: true }).click()
  160 |       await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
  161 |       await writeFile(file, historyBank(true, false, true))
  162 |       await writeFile(join(folder, 'assets/history.png'), alternatePng)
  163 |       const other = join(folder, '异专题.md')
  164 |       await writeFile(other, historyBank(true, false, false, 'history-b'))
  165 |       await importHistoryFiles(application, page, [file, other])
  166 |       await openPage(page, '设置与数据')
  167 |       await page.getByLabel('显示主题', { exact: true }).selectOption('dark')
  168 |       await page.getByLabel('正文字号', { exact: true }).selectOption('22')
  169 |       await page.getByRole('button', { name: '保存显示设置', exact: true }).click()
  170 |       await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
  171 |       const before = withHistoryDatabase(testDataDirectory, records)
  172 |       const appVersion = await application.evaluate(({ app }) => app.getVersion())
  173 |       expect(before['image_resources']).toHaveLength(2)
  174 |       expect(before['question_versions']!.length).toBeGreaterThan(3)
  175 |       const destination = join(directory, '中文 空格路径', '完整备份.sqlite3')
  176 |       await mkdir(dirname(destination))
  177 |       await select(application, 'export', destination)
  178 |       await page.getByRole('button', { name: '导出完整备份', exact: true }).click()
  179 |       await expect(page.getByText('完整备份已导出并校验。', { exact: true })).toBeVisible()
  180 |       expect(exportedRecords(destination)).toEqual(before)
  181 |       expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
  182 |       expect(await readdir(dirname(destination))).toEqual(['完整备份.sqlite3'])
  183 |       const db = new DatabaseSync(destination, { readOnly: true })
  184 |       try {
> 185 |         expect(db.prepare('SELECT * FROM backup_manifest').get()).toMatchObject({
      |                                                                   ^ Error: expect(received).toMatchObject(expected)
  186 |           format_version: 1,
  187 |           schema_version: 6,
  188 |           created_at: expect.stringMatching(/^2026-/),
  189 |           app_version: appVersion,
  190 |         })
  191 |       } finally {
  192 |         db.close()
  193 |       }
  194 |       const originalHash = createHash('sha256')
  195 |         .update(await readFile(destination))
  196 |         .digest('hex')
  197 |       await select(application, 'preview', destination)
  198 |       await page.getByRole('button', { name: '选择备份并预览', exact: true }).click()
  199 |       const preview = page.getByLabel('恢复预览摘要', { exact: true })
  200 |       await expect(preview).toBeVisible()
  201 |       await expect(preview).toContainText('题目总数')
  202 |       await expect(preview).toContainText('包含可继续的练习轮次及固定队列。')
  203 |       await expect(preview).not.toContainText('备份未揭晓草稿')
  204 |       expect(
  205 |         createHash('sha256')
  206 |           .update(await readFile(destination))
  207 |           .digest('hex'),
  208 |       ).toBe(originalHash)
  209 |       expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
  210 |       expect(await readdir(join(testDataDirectory, 'backup-staging'))).toEqual([
  211 |         expect.stringMatching(/^preview-/),
  212 |       ])
  213 |       expect(
  214 |         withHistoryDatabase(testDataDirectory, (db) =>
  215 |           db.prepare("SELECT name FROM sqlite_schema WHERE name='backup_manifest'").all(),
  216 |         ),
  217 |       ).toEqual([])
  218 |       await preview.evaluate((element) => element.scrollIntoView({ block: 'start' }))
  219 |       await captureHistory(application, page, info, 'backup-preview-dark-22.png')
  220 |       await info.attach('complete-backup-records.json', {
  221 |         body: JSON.stringify({ before, exported: exportedRecords(destination), originalHash }),
  222 |         contentType: 'application/json',
  223 |       })
  224 |       await openPage(page, '开始练习')
  225 |       await page.getByRole('button', { name: '继续练习', exact: true }).click()
  226 |       await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  227 |         '备份未揭晓草稿\nint queued = 2;',
  228 |       )
  229 |     } finally {
  230 |       await stop(application)
  231 |     }
  232 |   })
  233 | })
  234 | 
  235 | test('备份取消与预览取消保留原状态，空库可导出并预览', async ({ testDataDirectory }, info) => {
  236 |   await outputDirectory(async (directory) => {
  237 |     const { application, page } = await launchApplication(
  238 |       testDataDirectory,
  239 |       info.project.name,
  240 |       '设置与数据',
  241 |     )
  242 |     try {
  243 |       const before = withHistoryDatabase(testDataDirectory, records)
  244 |       expect(
  245 |         await page.evaluate(() =>
  246 |           Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.backup).sort(),
  247 |         ),
  248 |       ).toEqual(['export', 'preview', 'restore'])
  249 |       for (const kind of ['export', 'preview'] as const) {
  250 |         await select(application, kind, null)
  251 |         await page
  252 |           .getByRole('button', {
  253 |             name: kind === 'export' ? '导出完整备份' : '选择备份并预览',
  254 |             exact: true,
  255 |           })
  256 |           .click()
  257 |         await expect(page.getByText('已取消本次备份操作。', { exact: true })).toBeVisible()
  258 |         expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
  259 |         expect(await readdir(directory)).toEqual([])
  260 |       }
  261 |       const file = await exportFile(application, page, join(directory, '空库.sqlite3'))
  262 |       expect(file.summary).toMatchObject({
  263 |         questions: 0,
  264 |         images: 0,
  265 |         sessions: 0,
  266 |         activeSession: false,
  267 |         schemaVersion: 7,
  268 |         requiresMigration: false,
  269 |       })
  270 |       await select(application, 'preview', file.filePath)
  271 |       expect(await backup(page, 'preview')).toEqual({
  272 |         ok: true,
  273 |         value: {
  274 |           ...file,
  275 |           token: expect.stringMatching(
  276 |             /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/,
  277 |           ),
  278 |         },
  279 |       })
  280 |     } finally {
  281 |       await stop(application)
  282 |     }
  283 |   })
  284 | })
  285 | 
```