# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: themes-layout.spec.ts >> 纸页墨色：六页/明暗及跟随系统/15与22px/900与1440窗口/离线无远程资源
- Location: tests\e2e\themes-layout.spec.ts:34:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.selectOption: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('combobox', { name: '专题', exact: true })

```

# Test source

```ts
  36  |   // 窗口创建早于页面加载完成；诊断/清理过早 app.exit 会误触发启动加载失败。
  37  |   await Promise.all(
  38  |     application
  39  |       .windows()
  40  |       .map((page) => page.waitForLoadState('load', { timeout: 3000 }).catch(() => {})),
  41  |   )
  42  |   await application.evaluate(({ app }) => app.exit(0)).catch(() => {})
  43  |   await application.close().catch(() => {})
  44  |   closed.add(application)
  45  | }
  46  | export async function importHistoryFiles(
  47  |   application: ElectronApplication,
  48  |   page: Page,
  49  |   paths: string[],
  50  | ) {
  51  |   await openPage(page, '题库')
  52  |   await application.evaluate(({ dialog }, selected) => {
  53  |     dialog.showOpenDialog = async () => ({ canceled: false, filePaths: selected })
  54  |   }, paths)
  55  |   await page.getByRole('button', { name: '导入题库', exact: true }).click()
  56  |   await expect(page.getByRole('heading', { name: '导入预览', exact: true })).toBeVisible()
  57  |   await page.getByRole('button', { name: '确认导入', exact: true }).click()
  58  |   await expect(page.getByText(/^导入完成：/)).toBeVisible()
  59  | }
  60  | export async function prepareHistory(directory: string, project: string, rounds = 3) {
  61  |   const folder = join(directory, '历史 中文来源')
  62  |   await mkdir(join(folder, 'assets'), { recursive: true })
  63  |   await copyFile(resolve('tests/fixtures/images/small.png'), join(folder, 'assets/history.png'))
  64  |   const file = join(folder, '历史.md')
  65  |   const other = join(folder, '异专题.md')
  66  |   await writeFile(file, historyBank())
  67  |   await writeFile(other, historyBank(false, false, false, 'history-b'))
  68  |   const launched = await launchApplication(directory, project)
  69  |   try {
  70  |     await importHistoryFiles(launched.application, launched.page, [file, other])
  71  |     const seed = await launched.application.evaluate(seedHistory, { directory, rounds })
  72  |     expect(seed.errors).toEqual([])
  73  |     return { ...launched, seed, folder, file }
  74  |   } catch (error) {
  75  |     await stop(launched.application)
  76  |     throw error
  77  |   }
  78  | }
  79  | export function withHistoryDatabase<T>(
  80  |   directory: string,
  81  |   work: (database: DatabaseSync) => T,
  82  |   readOnly = true,
  83  | ): T {
  84  |   if (
  85  |     dirname(resolve(directory)) !== resolve(tmpdir()) ||
  86  |     !basename(directory).startsWith('embedded-practice-')
  87  |   )
  88  |     throw new Error('拒绝访问非本次测试库。')
  89  |   const database = new DatabaseSync(join(directory, 'practice.sqlite3'), { readOnly })
  90  |   try {
  91  |     return work(database)
  92  |   } finally {
  93  |     database.close()
  94  |   }
  95  | }
  96  | export function historySnapshot(directory: string) {
  97  |   return withHistoryDatabase(directory, (database) => ({
  98  |     sessions: database.prepare('SELECT * FROM practice_sessions ORDER BY rowid').all(),
  99  |     items: database.prepare('SELECT * FROM practice_items ORDER BY rowid').all(),
  100 |     states: database.prepare('SELECT * FROM question_user_state ORDER BY rowid').all(),
  101 |     receipts: database.prepare('SELECT * FROM practice_receipts ORDER BY rowid').all(),
  102 |     versions: database.prepare('SELECT * FROM question_versions ORDER BY id').all(),
  103 |     questions: database.prepare('SELECT * FROM questions ORDER BY id').all(),
  104 |     resources: database
  105 |       .prepare('SELECT hash, width, height, hex(bytes) AS bytes FROM image_resources ORDER BY hash')
  106 |       .all(),
  107 |     foreignKeys: database.prepare('PRAGMA foreign_key_check').all(),
  108 |     integrity: database.prepare('PRAGMA quick_check').all(),
  109 |     schema: database.prepare('PRAGMA user_version').get(),
  110 |   }))
  111 | }
  112 | export async function readHistory(page: Page, options: Partial<HistoryListRequest> = {}) {
  113 |   const result = await page.evaluate(
  114 |     (request) => (globalThis as unknown as { desktop: DesktopApi }).desktop.history.list(request),
  115 |     { topicId: 'history-a', questionId: 'q-1', page: 1, ...options },
  116 |   )
  117 |   if (!result.ok) throw new Error('历史读取失败：' + result.error.code)
  118 |   return result.value
  119 | }
  120 | export async function readHistoryEntry(
  121 |   page: Page,
  122 |   entry: Pick<HistorySummary, 'sessionId' | 'position'>,
  123 |   topicId = 'history-a',
  124 |   questionId = 'q-1',
  125 | ) {
  126 |   const result = await page.evaluate(
  127 |     (request) =>
  128 |       (globalThis as unknown as { desktop: DesktopApi }).desktop.history.getEntry(request),
  129 |     { topicId, questionId, sessionId: entry.sessionId, position: entry.position },
  130 |   )
  131 |   if (!result.ok) throw new Error('历史详情失败：' + result.error.code)
  132 |   return result.value
  133 | }
  134 | export async function selectHistoryQuestion(page: Page, questionId = 'q-1') {
  135 |   await openPage(page, '题库')
> 136 |   await page.getByRole('combobox', { name: '专题', exact: true }).selectOption('history-a')
      |                                                                 ^ TimeoutError: locator.selectOption: Timeout 30000ms exceeded.
  137 |   await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
  138 |   await page
  139 |     .getByRole('complementary', { name: '题目列表' })
  140 |     .getByRole('button', { name: new RegExp(` · ${questionId}(?:\\s|$)`) })
  141 |     .click()
  142 |   await expect(page.getByRole('article', { name: '题目内容' })).toBeVisible()
  143 | }
  144 | export async function beginHistoryPractice(page: Page) {
  145 |   await openPage(page, '开始练习')
  146 |   await page.getByRole('combobox', { name: '练习专题', exact: true }).selectOption('history-a')
  147 |   await expect(page.getByText('匹配 2 题', { exact: true })).toBeVisible()
  148 |   await page.getByRole('button', { name: '开始练习', exact: true }).click()
  149 |   await expect(page.getByLabel('练习进度')).toHaveText('第 1 / 2 题 · 顺序练习')
  150 | }
  151 | export async function captureHistory(
  152 |   application: ElectronApplication,
  153 |   page: Page,
  154 |   info: TestInfo,
  155 |   name: string,
  156 | ) {
  157 |   await page.evaluate(async () => {
  158 |     const browser = globalThis as unknown as {
  159 |       document: { fonts: { ready: Promise<unknown> } }
  160 |       requestAnimationFrame: (callback: () => void) => void
  161 |     }
  162 |     await browser.document.fonts.ready
  163 |     await new Promise<void>((done) =>
  164 |       browser.requestAnimationFrame(() => browser.requestAnimationFrame(() => done())),
  165 |     )
  166 |   })
  167 |   const png = await application.evaluate(async ({ BrowserWindow }) => {
  168 |     const window = BrowserWindow.getAllWindows()[0]
  169 |     if (!window) throw new Error('测试窗口不存在。')
  170 |     return (await window.webContents.capturePage()).toPNG().toString('base64')
  171 |   })
  172 |   const file = info.outputPath(name)
  173 |   await writeFile(file, Buffer.from(png, 'base64'))
  174 |   await info.attach(name, { path: file, contentType: 'image/png' })
  175 | }
  176 | 
```