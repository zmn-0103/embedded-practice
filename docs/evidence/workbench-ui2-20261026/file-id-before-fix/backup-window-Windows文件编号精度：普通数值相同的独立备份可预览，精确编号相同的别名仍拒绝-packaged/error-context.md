# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: backup-window.spec.ts >> Windows文件编号精度：普通数值相同的独立备份可预览，精确编号相同的别名仍拒绝
- Location: tests\e2e\backup-window.spec.ts:127:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
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
  127 | test('Windows文件编号精度：普通数值相同的独立备份可预览，精确编号相同的别名仍拒绝', async ({
  128 |   testDataDirectory,
  129 | }, info) => {
  130 |   await outputDirectory(async (directory) => {
  131 |     const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  132 |     try {
  133 |       const target = join(directory, '独立完整备份.sqlite3')
  134 |       await exportFile(application, page, target)
  135 |       const before = withHistoryDatabase(testDataDirectory, records)
  136 |       const first = '172544160723982050',
  137 |         second = '172544160723982063'
  138 |       expect(Number(first)).toBe(Number(second))
  139 |       expect(BigInt(first)).not.toBe(BigInt(second))
  140 |       await application.evaluate(
  141 |         ({ app }, input) => {
  142 |           const fs = process.getBuiltinModule('node:fs/promises')
  143 |           const path = process.getBuiltinModule('node:path')
  144 |           const database = path.join(app.getPath('userData'), 'practice.sqlite3')
  145 |           const original = { lstat: fs.lstat, stat: fs.stat }
  146 |           Reflect.set(globalThis, '__ui2Alias', false)
  147 |           Reflect.set(globalThis, '__ui2RestoreFileIds', () => {
  148 |             fs.lstat = original.lstat
  149 |             fs.stat = original.stat
  150 |           })
  151 |           fs.lstat = (async (...args: Parameters<typeof fs.lstat>) => {
  152 |             const value = await original.lstat(...args)
  153 |             if (String(args[0]) === input.target) {
  154 |               const exact = BigInt(
  155 |                 Reflect.get(globalThis, '__ui2Alias') ? input.first : input.second,
  156 |               )
  157 |               Reflect.set(value, 'dev', args[1]?.bigint ? 9n : 9)
  158 |               Reflect.set(value, 'ino', args[1]?.bigint ? exact : Number(exact))
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
> 175 |       expect(independent.ok).toBe(true)
      |                              ^ Error: expect(received).toBe(expected) // Object.is equality
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
  259 |         expect(db.prepare('SELECT * FROM backup_manifest').get()).toMatchObject({
  260 |           format_version: 1,
  261 |           schema_version: 10,
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
```