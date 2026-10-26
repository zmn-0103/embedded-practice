# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: history-versions.spec.ts >> 历史旧版本图片在替换/来源移动/归档恢复与独立进程重开后可读
- Location: tests\e2e\history-versions.spec.ts:222:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('complementary', { name: '题目列表' }).getByRole('button', { name: / · q-1(?:\s|$)/ })

```

# Test source

```ts
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
  59  |   await page.getByRole('button', { name: '关闭导入工作区', exact: true }).click()
  60  | }
  61  | export async function prepareHistory(directory: string, project: string, rounds = 3) {
  62  |   const folder = join(directory, '历史 中文来源')
  63  |   await mkdir(join(folder, 'assets'), { recursive: true })
  64  |   await copyFile(resolve('tests/fixtures/images/small.png'), join(folder, 'assets/history.png'))
  65  |   const file = join(folder, '历史.md')
  66  |   const other = join(folder, '异专题.md')
  67  |   await writeFile(file, historyBank())
  68  |   await writeFile(other, historyBank(false, false, false, 'history-b'))
  69  |   const launched = await launchApplication(directory, project)
  70  |   try {
  71  |     await importHistoryFiles(launched.application, launched.page, [file, other])
  72  |     const seed = await launched.application.evaluate(seedHistory, { directory, rounds })
  73  |     expect(seed.errors).toEqual([])
  74  |     return { ...launched, seed, folder, file }
  75  |   } catch (error) {
  76  |     await stop(launched.application)
  77  |     throw error
  78  |   }
  79  | }
  80  | export function withHistoryDatabase<T>(
  81  |   directory: string,
  82  |   work: (database: DatabaseSync) => T,
  83  |   readOnly = true,
  84  | ): T {
  85  |   if (
  86  |     dirname(resolve(directory)) !== resolve(tmpdir()) ||
  87  |     !basename(directory).startsWith('embedded-practice-')
  88  |   )
  89  |     throw new Error('拒绝访问非本次测试库。')
  90  |   const database = new DatabaseSync(join(directory, 'practice.sqlite3'), { readOnly })
  91  |   try {
  92  |     return work(database)
  93  |   } finally {
  94  |     database.close()
  95  |   }
  96  | }
  97  | export function historySnapshot(directory: string) {
  98  |   return withHistoryDatabase(directory, (database) => ({
  99  |     sessions: database.prepare('SELECT * FROM practice_sessions ORDER BY rowid').all(),
  100 |     items: database.prepare('SELECT * FROM practice_items ORDER BY rowid').all(),
  101 |     states: database.prepare('SELECT * FROM question_user_state ORDER BY rowid').all(),
  102 |     receipts: database.prepare('SELECT * FROM practice_receipts ORDER BY rowid').all(),
  103 |     versions: database.prepare('SELECT * FROM question_versions ORDER BY id').all(),
  104 |     questions: database.prepare('SELECT * FROM questions ORDER BY id').all(),
  105 |     resources: database
  106 |       .prepare('SELECT hash, width, height, hex(bytes) AS bytes FROM image_resources ORDER BY hash')
  107 |       .all(),
  108 |     foreignKeys: database.prepare('PRAGMA foreign_key_check').all(),
  109 |     integrity: database.prepare('PRAGMA quick_check').all(),
  110 |     schema: database.prepare('PRAGMA user_version').get(),
  111 |   }))
  112 | }
  113 | export async function readHistory(page: Page, options: Partial<HistoryListRequest> = {}) {
  114 |   const result = await page.evaluate(
  115 |     (request) => (globalThis as unknown as { desktop: DesktopApi }).desktop.history.list(request),
  116 |     { topicId: 'history-a', questionId: 'q-1', page: 1, ...options },
  117 |   )
  118 |   if (!result.ok) throw new Error('历史读取失败：' + result.error.code)
  119 |   return result.value
  120 | }
  121 | export async function readHistoryEntry(
  122 |   page: Page,
  123 |   entry: Pick<HistorySummary, 'sessionId' | 'position'>,
  124 |   topicId = 'history-a',
  125 |   questionId = 'q-1',
  126 | ) {
  127 |   const result = await page.evaluate(
  128 |     (request) =>
  129 |       (globalThis as unknown as { desktop: DesktopApi }).desktop.history.getEntry(request),
  130 |     { topicId, questionId, sessionId: entry.sessionId, position: entry.position },
  131 |   )
  132 |   if (!result.ok) throw new Error('历史详情失败：' + result.error.code)
  133 |   return result.value
  134 | }
  135 | export async function selectHistoryQuestion(page: Page, questionId = 'q-1') {
  136 |   await openPage(page, '题库')
  137 |   const returnToList = page.getByRole('button', { name: '返回题目列表', exact: true })
  138 |   if (await returnToList.isVisible()) await returnToList.click()
  139 |   await page.getByRole('combobox', { name: '专题', exact: true }).selectOption('history-a')
  140 |   await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
  141 |   await page
  142 |     .getByRole('complementary', { name: '题目列表' })
  143 |     .getByRole('button', { name: new RegExp(` · ${questionId}(?:\\s|$)`) })
> 144 |     .click()
      |      ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
  145 |   await expect(page.getByRole('article', { name: '题目内容' })).toBeVisible()
  146 | }
  147 | export async function beginHistoryPractice(page: Page) {
  148 |   await openPage(page, '开始练习')
  149 |   await page.getByRole('combobox', { name: '练习专题', exact: true }).selectOption('history-a')
  150 |   await expect(page.getByText('匹配 2 题', { exact: true })).toBeVisible()
  151 |   await page.getByRole('button', { name: '开始练习', exact: true }).click()
  152 |   await expect(page.getByLabel('练习进度')).toHaveText('第 1 / 2 题 · 顺序练习')
  153 | }
  154 | export async function captureHistory(
  155 |   application: ElectronApplication,
  156 |   page: Page,
  157 |   info: TestInfo,
  158 |   name: string,
  159 | ) {
  160 |   await page.evaluate(async () => {
  161 |     const browser = globalThis as unknown as {
  162 |       document: { fonts: { ready: Promise<unknown> } }
  163 |       requestAnimationFrame: (callback: () => void) => void
  164 |     }
  165 |     await browser.document.fonts.ready
  166 |     await new Promise<void>((done) =>
  167 |       browser.requestAnimationFrame(() => browser.requestAnimationFrame(() => done())),
  168 |     )
  169 |   })
  170 |   const png = await application.evaluate(async ({ BrowserWindow }) => {
  171 |     const window = BrowserWindow.getAllWindows()[0]
  172 |     if (!window) throw new Error('测试窗口不存在。')
  173 |     return (await window.webContents.capturePage()).toPNG().toString('base64')
  174 |   })
  175 |   const file = info.outputPath(name)
  176 |   await writeFile(file, Buffer.from(png, 'base64'))
  177 |   await info.attach(name, { path: file, contentType: 'image/png' })
  178 | }
  179 | 
```