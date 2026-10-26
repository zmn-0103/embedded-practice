# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: findability.spec.ts >> 找题：切页保留筛选、页码、题目、已展开答案与窗口阅读位置
- Location: tests\e2e\findability.spec.ts:82:5

# Error details

```
Error: expect(locator).toBeEnabled() failed

Locator: getByRole('button', { name: '筛选题库', exact: true })
Expected: enabled
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeEnabled" getByRole('button', { name: '筛选题库', exact: true }) with timeout 10000ms
  - waiting for getByRole('button', { name: '筛选题库', exact: true })

```

```yaml
- banner:
  - heading "嵌入式刷题本" [level=1]
  - paragraph: 思考有迹，积累有序
  - button "收起导航" [expanded]: ‹
- navigation "主要页面":
  - link "学习总览":
    - /url: "#overview"
  - link "知识板块":
    - /url: "#boards"
  - link "开始练习":
    - /url: "#practice"
  - link "题库":
    - /url: "#library"
  - link "学习记录":
    - /url: "#records"
  - link "设置与数据":
    - /url: "#settings"
- main:
  - text: 学习工作台
  - strong: 题库
  - text: 本地离线
  - group: 外观
  - region "题库导入":
    - paragraph: 选择文件 → 核对预览 → 确认导入
    - heading "题库导入" [level=2]
    - button "导入题库"
    - button "导出题库模板"
    - paragraph: 导入完成：新增 51，内容更新 0，信息变更 0，不变 0，归档 0，恢复 0。
  - region "题库浏览":
    - button "返回题目列表"
    - article "题目内容":
      - paragraph: A 找题专题 · q-21
      - heading "保留位置问题 21" [level=3]
      - paragraph: 易（基础） · 共同 / ARM Cortex / 检索标签21
      - paragraph: 当前内容尚未练习
      - button "收藏本题"
      - heading "题目" [level=4]
      - paragraph: 题干 21。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - paragraph: 阅读位置验证段落，保持题目和答案的阅读上下文。
      - button "收起参考答案"
      - region "参考答案":
        - heading "参考答案" [level=4]
        - paragraph: FIND-ANSWER-find-a-21
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
        - paragraph: 长答案阅读段落，用于切页后准确恢复位置。
      - button "查看本题历史"
  - status:
    - paragraph: 本地数据已就绪
- contentinfo: 离线使用 · 数据保存在本机 V42.11.15 测试版 · 构建 20261025.3-workbench-e
```

# Test source

```ts
  1   | import { mkdir, writeFile } from 'node:fs/promises'
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
  34  |   await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
  35  | }
  36  | async function prepare(directory: string, project: string) {
  37  |   const sources = join(directory, '中文 题库')
  38  |   await mkdir(sources)
  39  |   const file = join(sources, 'A.md')
  40  |   const other = join(sources, 'B.md')
  41  |   await writeFile(file, bank())
  42  |   await writeFile(other, bank('find-b'))
  43  |   const instance = await launchApplication(directory, project, '题库')
  44  |   await instance.application.evaluate(({ BrowserWindow }) => {
  45  |     BrowserWindow.getAllWindows()[0]?.setSize(1280, 820)
  46  |   })
  47  |   await importFiles(instance.application, instance.page, [file, other])
  48  |   return { ...instance, file }
  49  | }
  50  | async function list(page: Page, changes: Partial<ListRequest> = {}) {
  51  |   const result = await page.evaluate(
  52  |     (request) =>
  53  |       (globalThis as unknown as { desktop: DesktopApi }).desktop.library.listQuestions(request),
  54  |     { topicId: 'find-a', archived: false, page: 1, ...changes },
  55  |   )
  56  |   if (!result.ok) throw new Error(result.error.message)
  57  |   return result.value
  58  | }
  59  | async function current(page: Page) {
  60  |   const result = await page.evaluate(() =>
  61  |     (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
  62  |   )
  63  |   if (!result.ok) throw new Error(result.error.message)
  64  |   return result.value
  65  | }
  66  | async function capture(application: ElectronApplication, info: TestInfo, name: string) {
  67  |   const png = await application.evaluate(async ({ BrowserWindow }) =>
  68  |     (await BrowserWindow.getAllWindows()[0]!.capturePage()).toPNG().toString('base64'),
  69  |   )
  70  |   await info.attach(name, { body: Buffer.from(png, 'base64'), contentType: 'image/png' })
  71  | }
  72  | async function secondPage(page: Page) {
  73  |   await page.getByLabel('专题', { exact: true }).selectOption('find-a')
  74  |   await expect(page.getByText('共 48 题', { exact: true })).toBeVisible()
  75  |   await page.getByRole('searchbox', { name: '题库搜索', exact: true }).fill('保留')
  76  |   await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  77  |   await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
  78  |   await page.getByRole('button', { name: '下一页', exact: true }).click()
  79  |   await expect(page.getByRole('navigation', { name: '题目分页' })).toContainText('2 / 3')
  80  | }
  81  | 
  82  | test('找题：切页保留筛选、页码、题目、已展开答案与窗口阅读位置', async ({
  83  |   testDataDirectory,
  84  | }, info) => {
  85  |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  86  |   try {
  87  |     await secondPage(page)
  88  |     await page.getByRole('button', { name: /A 找题专题.*q-21/ }).click()
  89  |     await page.getByRole('button', { name: '展开参考答案', exact: true }).click()
  90  |     await page.getByRole('region', { name: '参考答案', exact: true }).scrollIntoViewIfNeeded()
  91  |     const before = await page.evaluate(() => Reflect.get(globalThis, 'scrollY') as number)
  92  |     expect(before).toBeGreaterThan(500)
  93  |     await openPage(page, '设置与数据')
  94  |     expect(await page.content()).not.toContain('FIND-ANSWER-find-a-21')
  95  |     expect(await page.locator('body').ariaSnapshot()).not.toContain('FIND-ANSWER-find-a-21')
  96  |     await openPage(page, '题库')
> 97  |     await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
      |                                                                           ^ Error: expect(locator).toBeEnabled() failed
  98  |     await expect(page.getByRole('searchbox', { name: '题库搜索', exact: true })).toHaveValue('保留')
  99  |     await expect(page.getByLabel('专题', { exact: true })).toHaveValue('find-a')
  100 |     await expect(page.getByRole('navigation', { name: '题目分页' })).toContainText('2 / 3')
  101 |     await expect(page.getByRole('heading', { name: '保留位置问题 21', exact: true })).toBeVisible()
  102 |     await expect(page.getByRole('region', { name: '参考答案', exact: true })).toContainText(
  103 |       'FIND-ANSWER-find-a-21',
  104 |     )
  105 |     await expect.poll(() => page.evaluate(() => Reflect.get(globalThis, 'scrollY'))).toBe(before)
  106 |     await capture(application, info, 'library-reading-restored.png')
  107 |   } finally {
  108 |     await application.close()
  109 |   }
  110 | })
  111 | 
  112 | test('找题：标签候选跨分页、独立于筛选、限定专题，支持鼠标/键盘/无匹配/清除', async ({
  113 |   testDataDirectory,
  114 | }, info) => {
  115 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  116 |   try {
  117 |     const first = await list(page)
  118 |     expect(first.tagOptions).toContain('仅后页标签')
  119 |     expect(first.tagOptions).not.toContain('仅B专题')
  120 |     expect(new Set(first.tagOptions).size).toBe(first.tagOptions.length)
  121 |     await page.getByLabel('专题', { exact: true }).selectOption('find-a')
  122 |     const picker = page.getByRole('combobox', { name: '题库标签', exact: true })
  123 |     await picker.fill('arm')
  124 |     await expect(page.getByRole('option', { name: 'ARM Cortex', exact: true })).toBeVisible()
  125 |     await picker.press('ArrowDown')
  126 |     await picker.dispatchEvent('keydown', { key: 'Enter', isComposing: true, keyCode: 229 })
  127 |     await expect(picker).toHaveValue('arm')
  128 |     await expect(picker).toHaveAttribute('aria-expanded', 'true')
  129 |     await picker.press('Enter')
  130 |     await expect(picker).toHaveValue('ARM Cortex')
  131 |     await expect(picker).toHaveAttribute('aria-expanded', 'false')
  132 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  133 |     await expect(page.getByText('共 47 题', { exact: true })).toBeVisible()
  134 |     expect(
  135 |       (
  136 |         await list(page, {
  137 |           filters: {
  138 |             query: '无结果',
  139 |             tag: null,
  140 |             difficulty: null,
  141 |             mastery: 'all',
  142 |             favoritesOnly: false,
  143 |           },
  144 |         })
  145 |       ).tagOptions,
  146 |     ).toEqual(first.tagOptions)
  147 |     await picker.fill('仅后页')
  148 |     await page.getByRole('option', { name: '仅后页标签', exact: true }).click()
  149 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  150 |     await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
  151 |     await picker.fill('不存在的标签')
  152 |     await expect(page.getByText('暂无匹配标签；仍可按填写的完整标签筛选。')).toBeVisible()
  153 |     await picker.press('Escape')
  154 |     await expect(picker).toHaveAttribute('aria-expanded', 'false')
  155 |     await page.getByRole('button', { name: '题库标签清除', exact: true }).click()
  156 |     await expect(picker).toHaveValue('')
  157 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  158 |     await expect(page.getByText('共 48 题', { exact: true })).toBeVisible()
  159 |     expect(await current(page)).toBeNull()
  160 |     await picker.click()
  161 |     expect(first.tagOptions.length).toBeGreaterThan(50)
  162 |     await expect(
  163 |       page.getByRole('listbox', { name: '题库标签候选' }).getByRole('option'),
  164 |     ).toHaveCount(50)
  165 |     await expect(page.getByText(/共 52 个匹配标签，显示前 50 个/)).toBeVisible()
  166 |     await capture(application, info, 'tag-candidates.png')
  167 |   } finally {
  168 |     await application.close()
  169 |   }
  170 | })
  171 | 
  172 | test('找题：离页前的慢响应不能覆盖返回后已完成的新筛选和选择', async ({
  173 |   testDataDirectory,
  174 | }, info) => {
  175 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  176 |   try {
  177 |     await page.getByLabel('专题', { exact: true }).selectOption('find-a')
  178 |     await expect(page.getByText('共 48 题', { exact: true })).toBeVisible()
  179 |     await application.evaluate(({ ipcMain }) => {
  180 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:list-questions')
  181 |       const control = {
  182 |         held: false,
  183 |         finished: false,
  184 |         release: undefined as (() => void) | undefined,
  185 |       }
  186 |       Reflect.set(globalThis, 'findabilitySlowRead', control)
  187 |       ipcMain.removeHandler('library:list-questions')
  188 |       ipcMain.handle('library:list-questions', async (event, request) => {
  189 |         const result = await original(event, request)
  190 |         if (request.topicId === 'find-a' && request.filters?.query === '迟到' && !control.held) {
  191 |           control.held = true
  192 |           await new Promise<void>((resolve) => {
  193 |             control.release = resolve
  194 |           })
  195 |           control.finished = true
  196 |         }
  197 |         return result
```