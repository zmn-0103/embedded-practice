# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: backup-window.spec.ts >> 完整备份导出覆盖版本图片历史草稿收藏固定随机队列条件和设置，预览不改原库
- Location: tests\e2e\backup-window.spec.ts:127:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.check: Timeout 30000ms exceeded.
Call log:
  - waiting for getByLabel('练习只看收藏', { exact: true })
    - locator resolved to <input type="checkbox" aria-label="练习只看收藏"/>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <button type="button" role="option" tabindex="-1" id="_r_0_-option-0" aria-selected="false">历史样本</button> from <div class="tag-picker">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <button type="button" role="option" tabindex="-1" id="_r_0_-option-0" aria-selected="false">历史样本</button> from <div class="tag-picker">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    58 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <button type="button" role="option" tabindex="-1" id="_r_0_-option-0" aria-selected="false">历史样本</button> from <div class="tag-picker">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms

```

# Test source

```ts
  51  |     tables.map((table) => [
  52  |       table,
  53  |       database
  54  |         .prepare(
  55  |           table === 'image_resources'
  56  |             ? 'SELECT hash,format,width,height,hex(bytes) AS bytes FROM image_resources ORDER BY hash'
  57  |             : `SELECT * FROM ${table} ORDER BY rowid`,
  58  |         )
  59  |         .all(),
  60  |     ]),
  61  |   )
  62  | }
  63  | function exportedRecords(path: string) {
  64  |   const db = new DatabaseSync(path, { readOnly: true })
  65  |   try {
  66  |     expect(db.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }])
  67  |     expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  68  |     expect(db.prepare('PRAGMA application_id').get()).toEqual({ application_id: 0x45505231 })
  69  |     expect(db.prepare('PRAGMA user_version').get()).toEqual({ user_version: 10 })
  70  |     return records(db)
  71  |   } finally {
  72  |     db.close()
  73  |   }
  74  | }
  75  | async function outputDirectory<T>(work: (directory: string) => Promise<T>): Promise<T> {
  76  |   const directory = await mkdtemp(join(tmpdir(), 'embedded-practice-backup-files-'))
  77  |   try {
  78  |     return await work(directory)
  79  |   } finally {
  80  |     if (
  81  |       dirname(resolve(directory)) !== resolve(tmpdir()) ||
  82  |       !basename(directory).startsWith('embedded-practice-backup-files-')
  83  |     )
  84  |       throw new Error('拒绝清理非本次备份临时目录。')
  85  |     await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  86  |   }
  87  | }
  88  | async function select(
  89  |   application: ElectronApplication,
  90  |   kind: 'export' | 'preview',
  91  |   path: string | null,
  92  | ) {
  93  |   await application.evaluate(
  94  |     ({ dialog }, args) => {
  95  |       if (args.kind === 'export')
  96  |         dialog.showSaveDialog = async () => ({
  97  |           canceled: args.path === null,
  98  |           filePath: args.path ?? '',
  99  |         })
  100 |       else
  101 |         dialog.showOpenDialog = async () => ({
  102 |           canceled: args.path === null,
  103 |           filePaths: args.path ? [args.path] : [],
  104 |         })
  105 |     },
  106 |     { kind, path },
  107 |   )
  108 | }
  109 | async function backup(page: Page, kind: 'export' | 'preview') {
  110 |   return page.evaluate(
  111 |     (kind) => (globalThis as unknown as { desktop: DesktopApi }).desktop.backup[kind](),
  112 |     kind,
  113 |   )
  114 | }
  115 | async function exportFile(
  116 |   application: ElectronApplication,
  117 |   page: Page,
  118 |   path: string,
  119 | ): Promise<BackupFile> {
  120 |   await select(application, 'export', path)
  121 |   const result = await backup(page, 'export')
  122 |   expect(result.ok).toBe(true)
  123 |   if (!result.ok) throw new Error('导出测试失败：' + result.error.code)
  124 |   return result.value
  125 | }
  126 | 
  127 | test('完整备份导出覆盖版本图片历史草稿收藏固定随机队列条件和设置，预览不改原库', async ({
  128 |   testDataDirectory,
  129 | }, info) => {
  130 |   await outputDirectory(async (directory) => {
  131 |     const { application, page, file, folder } = await prepareHistory(
  132 |       testDataDirectory,
  133 |       info.project.name,
  134 |     )
  135 |     try {
  136 |       await page.evaluate(async () => {
  137 |         const api = (globalThis as unknown as { desktop: DesktopApi }).desktop
  138 |         for (const q of ['q-1', 'q-2'])
  139 |           if (
  140 |             !(
  141 |               await api.library.setFavorite({ topicId: 'history-a', questionId: q, favorite: true })
  142 |             ).ok
  143 |           )
  144 |             throw new Error('收藏失败')
  145 |       })
  146 |       await openPage(page, '开始练习')
  147 |       await page.getByLabel('练习模式', { exact: true }).selectOption('random')
  148 |       await page.getByLabel('练习专题', { exact: true }).selectOption('history-a')
  149 |       await page.getByText('筛选练习题目', { exact: true }).click()
  150 |       await page.getByLabel('练习标签', { exact: true }).fill('历史样本')
> 151 |       await page.getByLabel('练习只看收藏', { exact: true }).check()
      |                                                        ^ TimeoutError: locator.check: Timeout 30000ms exceeded.
  152 |       await expect(page.getByText('匹配 2 题', { exact: true })).toBeVisible()
  153 |       await page.getByRole('button', { name: '开始练习', exact: true }).click()
  154 |       await page
  155 |         .getByRole('textbox', { name: '我的答案', exact: true })
  156 |         .fill('备份第一题作答\nint backup = 1;')
  157 |       await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  158 |       await page.getByRole('button', { name: '掌握', exact: true }).click()
  159 |       await expect(page.getByLabel('练习进度')).toContainText('第 2 / 2')
  160 |       await page
  161 |         .getByRole('textbox', { name: '我的答案', exact: true })
  162 |         .fill('备份未揭晓草稿\nint queued = 2;')
  163 |       await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
  164 |       await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
  165 |       await writeFile(file, historyBank(true, false, true))
  166 |       await writeFile(join(folder, 'assets/history.png'), alternatePng)
  167 |       const other = join(folder, '异专题.md')
  168 |       await writeFile(other, historyBank(true, false, false, 'history-b'))
  169 |       await importHistoryFiles(application, page, [file, other])
  170 |       await openPage(page, '设置与数据')
  171 |       await page.getByLabel('显示主题', { exact: true }).selectOption('dark')
  172 |       await page.getByLabel('正文字号', { exact: true }).selectOption('22')
  173 |       await page.getByRole('button', { name: '保存并应用', exact: true }).click()
  174 |       await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
  175 |       const before = withHistoryDatabase(testDataDirectory, records)
  176 |       const appVersion = await application.evaluate(({ app }) => app.getVersion())
  177 |       expect(before['image_resources']).toHaveLength(2)
  178 |       expect(before['question_versions']!.length).toBeGreaterThan(3)
  179 |       const destination = join(directory, '中文 空格路径', '完整备份.sqlite3')
  180 |       await mkdir(dirname(destination))
  181 |       await select(application, 'export', destination)
  182 |       await page.getByRole('button', { name: '导出完整备份', exact: true }).click()
  183 |       await expect(page.getByText('完整备份已导出并校验。', { exact: true })).toBeVisible()
  184 |       expect(exportedRecords(destination)).toEqual(before)
  185 |       expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
  186 |       expect(await readdir(dirname(destination))).toEqual(['完整备份.sqlite3'])
  187 |       const db = new DatabaseSync(destination, { readOnly: true })
  188 |       try {
  189 |         expect(db.prepare('SELECT * FROM backup_manifest').get()).toMatchObject({
  190 |           format_version: 1,
  191 |           schema_version: 10,
  192 |           created_at: expect.stringMatching(/^2026-/),
  193 |           app_version: appVersion,
  194 |         })
  195 |       } finally {
  196 |         db.close()
  197 |       }
  198 |       const originalHash = createHash('sha256')
  199 |         .update(await readFile(destination))
  200 |         .digest('hex')
  201 |       await select(application, 'preview', destination)
  202 |       await page.getByRole('button', { name: '选择备份并预览', exact: true }).click()
  203 |       const preview = page.getByLabel('恢复预览摘要', { exact: true })
  204 |       await expect(preview).toBeVisible()
  205 |       await expect(preview).toContainText('题目总数')
  206 |       await expect(preview).toContainText('包含可继续的练习轮次及固定队列。')
  207 |       await expect(preview).not.toContainText('备份未揭晓草稿')
  208 |       expect(
  209 |         createHash('sha256')
  210 |           .update(await readFile(destination))
  211 |           .digest('hex'),
  212 |       ).toBe(originalHash)
  213 |       expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
  214 |       expect(await readdir(join(testDataDirectory, 'backup-staging'))).toEqual([
  215 |         expect.stringMatching(/^preview-/),
  216 |       ])
  217 |       expect(
  218 |         withHistoryDatabase(testDataDirectory, (db) =>
  219 |           db.prepare("SELECT name FROM sqlite_schema WHERE name='backup_manifest'").all(),
  220 |         ),
  221 |       ).toEqual([])
  222 |       await preview.evaluate((element) => element.scrollIntoView({ block: 'start' }))
  223 |       await captureHistory(application, page, info, 'backup-preview-dark-22.png')
  224 |       await info.attach('complete-backup-records.json', {
  225 |         body: JSON.stringify({ before, exported: exportedRecords(destination), originalHash }),
  226 |         contentType: 'application/json',
  227 |       })
  228 |       await openPage(page, '开始练习')
  229 |       await page.getByRole('button', { name: '继续练习', exact: true }).click()
  230 |       await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  231 |         '备份未揭晓草稿\nint queued = 2;',
  232 |       )
  233 |     } finally {
  234 |       await stop(application)
  235 |     }
  236 |   })
  237 | })
  238 | 
  239 | test('备份取消与预览取消保留原状态，空库可导出并预览', async ({ testDataDirectory }, info) => {
  240 |   await outputDirectory(async (directory) => {
  241 |     const { application, page } = await launchApplication(
  242 |       testDataDirectory,
  243 |       info.project.name,
  244 |       '设置与数据',
  245 |     )
  246 |     try {
  247 |       const before = withHistoryDatabase(testDataDirectory, records)
  248 |       expect(
  249 |         await page.evaluate(() =>
  250 |           Object.keys((globalThis as unknown as { desktop: DesktopApi }).desktop.backup).sort(),
  251 |         ),
```