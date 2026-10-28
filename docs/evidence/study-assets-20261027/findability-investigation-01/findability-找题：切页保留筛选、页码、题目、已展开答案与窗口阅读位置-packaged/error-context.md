# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: findability.spec.ts >> 找题：切页保留筛选、页码、题目、已展开答案与窗口阅读位置
- Location: tests\e2e\findability.spec.ts:83:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 2412
Received: 72

Call Log:
- Timeout 10000ms exceeded while waiting on the predicate
```

# Test source

```ts
  2   | import { join } from 'node:path'
  3   | import type { ElectronApplication, Page, TestInfo } from '@playwright/test'
  4   | import type { DesktopApi } from '../../src/shared/contracts/application'
  5   | import type { ListRequest } from '../../src/shared/contracts/library-desktop'
  6   | import { expect, launchApplication, openPage, test } from './helpers'
  7   | 
  8   | function bank(topic = 'find-a', metadata = false, archive = false) {
  9   |   return (
  10  |     `---\nschema_version: 1\ntopic_id: ${topic}\ntopic_title: ${topic === 'find-a' ? 'A 找题专题' : 'B 独立专题'}\n---\n\n` +
  11  |     Array.from({ length: topic === 'find-a' ? 48 : 3 }, (_, index) => {
  12  |       const number = index + 1
  13  |       if (archive && number === 1) return ''
  14  |       const tag = topic === 'find-b' ? '仅B专题' : number === 1 ? '归档独有' : 'ARM Cortex'
  15  |       return (
  16  |         `## q-${String(number).padStart(2, '0')} | 保留位置问题 ${number}\n\n` +
  17  |         `标签：共同, ${tag}, 检索标签${String(number).padStart(2, '0')}${number === 45 ? ', 仅后页标签' : ''}${metadata ? ', 新增候选' : ''}\n难度：基础\n\n` +
  18  |         `### 题目\n\n题干 ${number}。\n\n` +
  19  |         (number === 21 ? '阅读位置验证段落，保持题目和答案的阅读上下文。\n\n'.repeat(40) : '') +
  20  |         `### 参考答案\n\nFIND-ANSWER-${topic}-${number}\n\n` +
  21  |         (number === 21 ? '长答案阅读段落，用于切页后准确恢复位置。\n\n'.repeat(40) : '')
  22  |       )
  23  |     }).join('')
  24  |   )
  25  | }
  26  | async function importFiles(application: ElectronApplication, page: Page, files: string[]) {
  27  |   await openPage(page, '题库')
  28  |   await application.evaluate(({ dialog }, paths) => {
  29  |     dialog.showOpenDialog = async () => ({ canceled: false, filePaths: paths })
  30  |   }, files)
  31  |   await page.getByRole('button', { name: '导入题库', exact: true }).click()
  32  |   await page.getByRole('button', { name: '确认导入', exact: true }).click()
  33  |   await expect(page.getByText(/^导入完成：/)).toBeVisible()
  34  |   await page.getByRole('button', { name: '关闭导入工作区', exact: true }).click()
  35  |   await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
  36  | }
  37  | async function prepare(directory: string, project: string) {
  38  |   const sources = join(directory, '中文 题库')
  39  |   await mkdir(sources)
  40  |   const file = join(sources, 'A.md')
  41  |   const other = join(sources, 'B.md')
  42  |   await writeFile(file, bank())
  43  |   await writeFile(other, bank('find-b'))
  44  |   const instance = await launchApplication(directory, project, '题库')
  45  |   await instance.application.evaluate(({ BrowserWindow }) => {
  46  |     BrowserWindow.getAllWindows()[0]?.setSize(1280, 820)
  47  |   })
  48  |   await importFiles(instance.application, instance.page, [file, other])
  49  |   return { ...instance, file }
  50  | }
  51  | async function list(page: Page, changes: Partial<ListRequest> = {}) {
  52  |   const result = await page.evaluate(
  53  |     (request) =>
  54  |       (globalThis as unknown as { desktop: DesktopApi }).desktop.library.listQuestions(request),
  55  |     { topicId: 'find-a', archived: false, page: 1, ...changes },
  56  |   )
  57  |   if (!result.ok) throw new Error(result.error.message)
  58  |   return result.value
  59  | }
  60  | async function current(page: Page) {
  61  |   const result = await page.evaluate(() =>
  62  |     (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
  63  |   )
  64  |   if (!result.ok) throw new Error(result.error.message)
  65  |   return result.value
  66  | }
  67  | async function capture(application: ElectronApplication, info: TestInfo, name: string) {
  68  |   const png = await application.evaluate(async ({ BrowserWindow }) =>
  69  |     (await BrowserWindow.getAllWindows()[0]!.capturePage()).toPNG().toString('base64'),
  70  |   )
  71  |   await info.attach(name, { body: Buffer.from(png, 'base64'), contentType: 'image/png' })
  72  | }
  73  | async function secondPage(page: Page) {
  74  |   await page.getByLabel('专题', { exact: true }).selectOption('find-a')
  75  |   await expect(page.getByText('共 48 题', { exact: true })).toBeVisible()
  76  |   await page.getByRole('searchbox', { name: '题库搜索', exact: true }).fill('保留')
  77  |   await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  78  |   await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
  79  |   await page.getByRole('button', { name: '下一页', exact: true }).click()
  80  |   await expect(page.getByRole('navigation', { name: '题目分页' })).toContainText('2 / 3')
  81  | }
  82  | 
  83  | test('找题：切页保留筛选、页码、题目、已展开答案与窗口阅读位置', async ({
  84  |   testDataDirectory,
  85  | }, info) => {
  86  |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  87  |   try {
  88  |     await secondPage(page)
  89  |     await page.getByRole('button', { name: /A 找题专题.*q-21/ }).click()
  90  |     await page.getByRole('button', { name: '展开参考答案', exact: true }).click()
  91  |     await page.getByRole('region', { name: '参考答案', exact: true }).scrollIntoViewIfNeeded()
  92  |     const before = await page.evaluate(() => Reflect.get(globalThis, 'scrollY') as number)
  93  |     expect(before).toBeGreaterThan(500)
  94  |     await openPage(page, '设置与数据')
  95  |     expect(await page.content()).not.toContain('FIND-ANSWER-find-a-21')
  96  |     expect(await page.locator('body').ariaSnapshot()).not.toContain('FIND-ANSWER-find-a-21')
  97  |     await openPage(page, '题库')
  98  |     await expect(page.getByRole('heading', { name: '保留位置问题 21', exact: true })).toBeVisible()
  99  |     await expect(page.getByRole('region', { name: '参考答案', exact: true })).toContainText(
  100 |       'FIND-ANSWER-find-a-21',
  101 |     )
> 102 |     await expect.poll(() => page.evaluate(() => Reflect.get(globalThis, 'scrollY'))).toBe(before)
      |                                                                                      ^ Error: expect(received).toBe(expected) // Object.is equality
  103 |     await capture(application, info, 'library-reading-restored.png')
  104 |     await page.getByRole('button', { name: '返回题目列表', exact: true }).click()
  105 |     await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
  106 |     await expect(page.getByRole('searchbox', { name: '题库搜索', exact: true })).toHaveValue('保留')
  107 |     await expect(page.getByLabel('专题', { exact: true })).toHaveValue('find-a')
  108 |     await expect(page.getByRole('navigation', { name: '题目分页' })).toContainText('2 / 3')
  109 |     await page.getByRole('button', { name: /A 找题专题.*q-21/ }).click()
  110 |     await expect(page.getByRole('heading', { name: '保留位置问题 21', exact: true })).toBeVisible()
  111 |     await expect(page.getByRole('region', { name: '参考答案', exact: true })).toContainText(
  112 |       'FIND-ANSWER-find-a-21',
  113 |     )
  114 |   } finally {
  115 |     await application.close()
  116 |   }
  117 | })
  118 | 
  119 | test('找题：标签候选跨分页、独立于筛选、限定专题，支持鼠标/键盘/无匹配/清除', async ({
  120 |   testDataDirectory,
  121 | }, info) => {
  122 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  123 |   try {
  124 |     const first = await list(page)
  125 |     expect(first.tagOptions).toContain('仅后页标签')
  126 |     expect(first.tagOptions).not.toContain('仅B专题')
  127 |     expect(new Set(first.tagOptions).size).toBe(first.tagOptions.length)
  128 |     await page.getByLabel('专题', { exact: true }).selectOption('find-a')
  129 |     const picker = page.getByRole('combobox', { name: '题库标签', exact: true })
  130 |     await picker.fill('arm')
  131 |     await expect(page.getByRole('option', { name: 'ARM Cortex', exact: true })).toBeVisible()
  132 |     await picker.press('ArrowDown')
  133 |     await picker.dispatchEvent('keydown', { key: 'Enter', isComposing: true, keyCode: 229 })
  134 |     await expect(picker).toHaveValue('arm')
  135 |     await expect(picker).toHaveAttribute('aria-expanded', 'true')
  136 |     await picker.press('Enter')
  137 |     await expect(picker).toHaveValue('ARM Cortex')
  138 |     await expect(picker).toHaveAttribute('aria-expanded', 'false')
  139 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  140 |     await expect(page.getByText('共 47 题', { exact: true })).toBeVisible()
  141 |     expect(
  142 |       (
  143 |         await list(page, {
  144 |           filters: {
  145 |             query: '无结果',
  146 |             tag: null,
  147 |             difficulty: null,
  148 |             mastery: 'all',
  149 |             favoritesOnly: false,
  150 |           },
  151 |         })
  152 |       ).tagOptions,
  153 |     ).toEqual(first.tagOptions)
  154 |     await picker.fill('仅后页')
  155 |     await page.getByRole('option', { name: '仅后页标签', exact: true }).click()
  156 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  157 |     await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
  158 |     await picker.fill('不存在的标签')
  159 |     await expect(page.getByText('暂无匹配标签；仍可按填写的完整标签筛选。')).toBeVisible()
  160 |     await picker.press('Escape')
  161 |     await expect(picker).toHaveAttribute('aria-expanded', 'false')
  162 |     await page.getByRole('button', { name: '题库标签清除', exact: true }).click()
  163 |     await expect(picker).toHaveValue('')
  164 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  165 |     await expect(page.getByText('共 48 题', { exact: true })).toBeVisible()
  166 |     expect(await current(page)).toBeNull()
  167 |     await picker.click()
  168 |     expect(first.tagOptions.length).toBeGreaterThan(50)
  169 |     await expect(
  170 |       page.getByRole('listbox', { name: '题库标签候选' }).getByRole('option'),
  171 |     ).toHaveCount(50)
  172 |     await expect(page.getByText(/共 52 个匹配标签，显示前 50 个/)).toBeVisible()
  173 |     await capture(application, info, 'tag-candidates.png')
  174 |   } finally {
  175 |     await application.close()
  176 |   }
  177 | })
  178 | 
  179 | test('找题：离页前的慢响应不能覆盖返回后已完成的新筛选和选择', async ({
  180 |   testDataDirectory,
  181 | }, info) => {
  182 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  183 |   try {
  184 |     await page.getByLabel('专题', { exact: true }).selectOption('find-a')
  185 |     await expect(page.getByText('共 48 题', { exact: true })).toBeVisible()
  186 |     await application.evaluate(({ ipcMain }) => {
  187 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:list-questions')
  188 |       const control = {
  189 |         held: false,
  190 |         finished: false,
  191 |         release: undefined as (() => void) | undefined,
  192 |       }
  193 |       Reflect.set(globalThis, 'findabilitySlowRead', control)
  194 |       ipcMain.removeHandler('library:list-questions')
  195 |       ipcMain.handle('library:list-questions', async (event, request) => {
  196 |         const result = await original(event, request)
  197 |         if (request.topicId === 'find-a' && request.filters?.query === '迟到' && !control.held) {
  198 |           control.held = true
  199 |           await new Promise<void>((resolve) => {
  200 |             control.release = resolve
  201 |           })
  202 |           control.finished = true
```