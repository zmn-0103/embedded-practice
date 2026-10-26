# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: findability.spec.ts >> 找题：标签候选跨分页、独立于筛选、限定专题，支持鼠标/键盘/无匹配/清除
- Location: tests\e2e\findability.spec.ts:118:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('option', { name: 'ARM Cortex', exact: true })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('option', { name: 'ARM Cortex', exact: true }) with timeout 10000ms
  - waiting for getByRole('option', { name: 'ARM Cortex', exact: true })

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
    - strong: 题库工具
    - button "导入题库"
    - button "导出题库模板"
    - dialog "导入与模板":
      - heading "导入与模板" [level=2]
      - button "关闭导入工作区"
      - list "导入步骤":
        - listitem: 1. 选择文件
        - listitem: 2. 检查预览
        - listitem: 3. 确认导入
      - paragraph: 每个专题文件是完整快照；遗漏的现有题目将归档，题目及学习记录保留。未参与导入的专题不受影响。请持续核对本次将归档数量。
      - paragraph: 导入完成：新增 51，内容更新 0，信息变更 0，不变 0，归档 0，恢复 0。
  - region "题库浏览":
    - group: 管理分类
    - text: 题库搜索
    - searchbox "题库搜索"
    - text: 标签
    - combobox "题库标签"
    - text: 难度
    - combobox "题库难度":
      - option "全部难度" [selected]
      - option "未分级"
      - option "易（基础）"
      - option "中（进阶）"
      - option "难（综合）"
    - text: 自评状态
    - combobox "题库自评状态":
      - option "全部状态" [selected]
      - option "未练习"
      - option "不会"
      - option "不熟"
      - option "掌握"
    - checkbox "题库只看收藏"
    - text: 只看收藏
    - paragraph: 全部题目，未限定其他条件
    - checkbox "题库只看内容更新待复习"
    - text: 只看内容更新待复习
    - paragraph: 有效题目
    - button "筛选题库"
    - button "清空题库筛选"
    - text: 专题
    - combobox "专题":
      - option "全部专题"
      - option "A 找题专题（48）" [selected]
      - option "B 独立专题（3）"
    - checkbox "查看归档题目"
    - text: 查看归档题目 共 48 题
    - complementary "题库分类与专题导航":
      - group:
        - text: 分类与专题
        - navigation "题库分类导航":
          - text: 查找专题
          - searchbox "题库专题检索"
          - paragraph: 检索只收窄导航，选择分类或专题后应用范围。
          - button "全部分类（51题）"
          - list:
            - listitem:
              - button "收起未分类" [expanded]
              - button "题库分类：未分类": 未分类（51题）
              - list:
                - listitem:
                  - button "题库专题：A 找题专题": A 找题专题（48题）
                - listitem:
                  - button "题库专题：B 独立专题": B 独立专题（3题）
    - complementary "题目列表":
      - list:
        - listitem:
          - button "保留位置问题 1 A 找题专题 · q-01 · 难度：易（基础） 尚未练习": 保留位置问题 1 A 找题专题 · q-01 · 易（基础） 尚未练习
        - listitem:
          - button "保留位置问题 2 A 找题专题 · q-02 · 难度：易（基础） 尚未练习": 保留位置问题 2 A 找题专题 · q-02 · 易（基础） 尚未练习
        - listitem:
          - button "保留位置问题 3 A 找题专题 · q-03 · 难度：易（基础） 尚未练习": 保留位置问题 3 A 找题专题 · q-03 · 易（基础） 尚未练习
        - listitem:
          - button "保留位置问题 4 A 找题专题 · q-04 · 难度：易（基础） 尚未练习": 保留位置问题 4 A 找题专题 · q-04 · 易（基础） 尚未练习
        - listitem:
          - button "保留位置问题 5 A 找题专题 · q-05 · 难度：易（基础） 尚未练习": 保留位置问题 5 A 找题专题 · q-05 · 易（基础） 尚未练习
        - listitem:
          - button "保留位置问题 6 A 找题专题 · q-06 · 难度：易（基础） 尚未练习": 保留位置问题 6 A 找题专题 · q-06 · 易（基础） 尚未练习
        - listitem:
          - button "保留位置问题 7 A 找题专题 · q-07 · 难度：易（基础） 尚未练习": 保留位置问题 7 A 找题专题 · q-07 · 易（基础） 尚未练习
        - listitem:
          - button "保留位置问题 8 A 找题专题 · q-08 · 难度：易（基础） 尚未练习": 保留位置问题 8 A 找题专题 · q-08 · 易（基础） 尚未练习
        - listitem:
          - button "保留位置问题 9 A 找题专题 · q-09 · 难度：易（基础） 尚未练习": 保留位置问题 9 A 找题专题 · q-09 · 易（基础） 尚未练习
        - listitem:
          - button "保留位置问题 10 A 找题专题 · q-10 · 难度：易（基础） 尚未练习": 保留位置问题 10 A 找题专题 · q-10 · 易（基础） 尚未练习
        - listitem:
          - button "保留位置问题 11 A 找题专题 · q-11 · 难度：易（基础） 尚未练习": 保留位置问题 11 A 找题专题 · q-11 · 易（基础） 尚未练习
        - listitem:
          - button "保留位置问题 12 A 找题专题 · q-12 · 难度：易（基础） 尚未练习": 保留位置问题 12 A 找题专题 · q-12 · 易（基础） 尚未练习
        - listitem:
          - button "保留位置问题 13 A 找题专题 · q-13 · 难度：易（基础） 尚未练习": 保留位置问题 13 A 找题专题 · q-13 · 易（基础） 尚未练习
        - listitem:
          - button "保留位置问题 14 A 找题专题 · q-14 · 难度：易（基础） 尚未练习": 保留位置问题 14 A 找题专题 · q-14 · 易（基础） 尚未练习
        - listitem:
          - button "保留位置问题 15 A 找题专题 · q-15 · 难度：易（基础） 尚未练习": 保留位置问题 15 A 找题专题 · q-15 · 易（基础） 尚未练习
        - listitem:
          - button "保留位置问题 16 A 找题专题 · q-16 · 难度：易（基础） 尚未练习": 保留位置问题 16 A 找题专题 · q-16 · 易（基础） 尚未练习
        - listitem:
          - button "保留位置问题 17 A 找题专题 · q-17 · 难度：易（基础） 尚未练习": 保留位置问题 17 A 找题专题 · q-17 · 易（基础） 尚未练习
        - listitem:
          - button "保留位置问题 18 A 找题专题 · q-18 · 难度：易（基础） 尚未练习": 保留位置问题 18 A 找题专题 · q-18 · 易（基础） 尚未练习
        - listitem:
          - button "保留位置问题 19 A 找题专题 · q-19 · 难度：易（基础） 尚未练习": 保留位置问题 19 A 找题专题 · q-19 · 易（基础） 尚未练习
        - listitem:
          - button "保留位置问题 20 A 找题专题 · q-20 · 难度：易（基础） 尚未练习": 保留位置问题 20 A 找题专题 · q-20 · 易（基础） 尚未练习
      - navigation "题目分页":
        - button "上一页" [disabled]
        - text: 1 / 3
        - button "下一页"
  - status:
    - paragraph: 本地数据已就绪
- contentinfo: 离线使用 · 数据保存在本机 V42.11.15 测试版 · 构建 20261026.1-workbench-e-ui2
```

# Test source

```ts
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
  97  |     await expect(page.getByRole('heading', { name: '保留位置问题 21', exact: true })).toBeVisible()
  98  |     await expect(page.getByRole('region', { name: '参考答案', exact: true })).toContainText(
  99  |       'FIND-ANSWER-find-a-21',
  100 |     )
  101 |     await expect.poll(() => page.evaluate(() => Reflect.get(globalThis, 'scrollY'))).toBe(before)
  102 |     await capture(application, info, 'library-reading-restored.png')
  103 |     await page.getByRole('button', { name: '返回题目列表', exact: true }).click()
  104 |     await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
  105 |     await expect(page.getByRole('searchbox', { name: '题库搜索', exact: true })).toHaveValue('保留')
  106 |     await expect(page.getByLabel('专题', { exact: true })).toHaveValue('find-a')
  107 |     await expect(page.getByRole('navigation', { name: '题目分页' })).toContainText('2 / 3')
  108 |     await page.getByRole('button', { name: /A 找题专题.*q-21/ }).click()
  109 |     await expect(page.getByRole('heading', { name: '保留位置问题 21', exact: true })).toBeVisible()
  110 |     await expect(page.getByRole('region', { name: '参考答案', exact: true })).toContainText(
  111 |       'FIND-ANSWER-find-a-21',
  112 |     )
  113 |   } finally {
  114 |     await application.close()
  115 |   }
  116 | })
  117 | 
  118 | test('找题：标签候选跨分页、独立于筛选、限定专题，支持鼠标/键盘/无匹配/清除', async ({
  119 |   testDataDirectory,
  120 | }, info) => {
  121 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  122 |   try {
  123 |     const first = await list(page)
  124 |     expect(first.tagOptions).toContain('仅后页标签')
  125 |     expect(first.tagOptions).not.toContain('仅B专题')
  126 |     expect(new Set(first.tagOptions).size).toBe(first.tagOptions.length)
  127 |     await page.getByLabel('专题', { exact: true }).selectOption('find-a')
  128 |     const picker = page.getByRole('combobox', { name: '题库标签', exact: true })
  129 |     await picker.fill('arm')
> 130 |     await expect(page.getByRole('option', { name: 'ARM Cortex', exact: true })).toBeVisible()
      |                                                                                 ^ Error: expect(locator).toBeVisible() failed
  131 |     await picker.press('ArrowDown')
  132 |     await picker.dispatchEvent('keydown', { key: 'Enter', isComposing: true, keyCode: 229 })
  133 |     await expect(picker).toHaveValue('arm')
  134 |     await expect(picker).toHaveAttribute('aria-expanded', 'true')
  135 |     await picker.press('Enter')
  136 |     await expect(picker).toHaveValue('ARM Cortex')
  137 |     await expect(picker).toHaveAttribute('aria-expanded', 'false')
  138 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  139 |     await expect(page.getByText('共 47 题', { exact: true })).toBeVisible()
  140 |     expect(
  141 |       (
  142 |         await list(page, {
  143 |           filters: {
  144 |             query: '无结果',
  145 |             tag: null,
  146 |             difficulty: null,
  147 |             mastery: 'all',
  148 |             favoritesOnly: false,
  149 |           },
  150 |         })
  151 |       ).tagOptions,
  152 |     ).toEqual(first.tagOptions)
  153 |     await picker.fill('仅后页')
  154 |     await page.getByRole('option', { name: '仅后页标签', exact: true }).click()
  155 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  156 |     await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
  157 |     await picker.fill('不存在的标签')
  158 |     await expect(page.getByText('暂无匹配标签；仍可按填写的完整标签筛选。')).toBeVisible()
  159 |     await picker.press('Escape')
  160 |     await expect(picker).toHaveAttribute('aria-expanded', 'false')
  161 |     await page.getByRole('button', { name: '题库标签清除', exact: true }).click()
  162 |     await expect(picker).toHaveValue('')
  163 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  164 |     await expect(page.getByText('共 48 题', { exact: true })).toBeVisible()
  165 |     expect(await current(page)).toBeNull()
  166 |     await picker.click()
  167 |     expect(first.tagOptions.length).toBeGreaterThan(50)
  168 |     await expect(
  169 |       page.getByRole('listbox', { name: '题库标签候选' }).getByRole('option'),
  170 |     ).toHaveCount(50)
  171 |     await expect(page.getByText(/共 52 个匹配标签，显示前 50 个/)).toBeVisible()
  172 |     await capture(application, info, 'tag-candidates.png')
  173 |   } finally {
  174 |     await application.close()
  175 |   }
  176 | })
  177 | 
  178 | test('找题：离页前的慢响应不能覆盖返回后已完成的新筛选和选择', async ({
  179 |   testDataDirectory,
  180 | }, info) => {
  181 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  182 |   try {
  183 |     await page.getByLabel('专题', { exact: true }).selectOption('find-a')
  184 |     await expect(page.getByText('共 48 题', { exact: true })).toBeVisible()
  185 |     await application.evaluate(({ ipcMain }) => {
  186 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:list-questions')
  187 |       const control = {
  188 |         held: false,
  189 |         finished: false,
  190 |         release: undefined as (() => void) | undefined,
  191 |       }
  192 |       Reflect.set(globalThis, 'findabilitySlowRead', control)
  193 |       ipcMain.removeHandler('library:list-questions')
  194 |       ipcMain.handle('library:list-questions', async (event, request) => {
  195 |         const result = await original(event, request)
  196 |         if (request.topicId === 'find-a' && request.filters?.query === '迟到' && !control.held) {
  197 |           control.held = true
  198 |           await new Promise<void>((resolve) => {
  199 |             control.release = resolve
  200 |           })
  201 |           control.finished = true
  202 |         }
  203 |         return result
  204 |       })
  205 |     })
  206 |     await page.getByRole('searchbox', { name: '题库搜索', exact: true }).fill('迟到')
  207 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  208 |     await expect
  209 |       .poll(() => application.evaluate(() => Reflect.get(globalThis, 'findabilitySlowRead').held))
  210 |       .toBe(true)
  211 |     await openPage(page, '设置与数据')
  212 |     await openPage(page, '题库')
  213 |     await expect(page.getByText('共 0 题', { exact: true })).toBeVisible()
  214 |     await page.getByRole('searchbox', { name: '题库搜索', exact: true }).fill('保留')
  215 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  216 |     await expect(page.getByText('共 48 题', { exact: true })).toBeVisible()
  217 |     await page.getByRole('button', { name: /A 找题专题.*q-01/ }).click()
  218 |     await expect(page.getByRole('heading', { name: '保留位置问题 1', exact: true })).toBeVisible()
  219 |     await application.evaluate(() => Reflect.get(globalThis, 'findabilitySlowRead').release())
  220 |     await expect
  221 |       .poll(() =>
  222 |         application.evaluate(() => Reflect.get(globalThis, 'findabilitySlowRead').finished),
  223 |       )
  224 |       .toBe(true)
  225 |     await page.evaluate(
  226 |       () =>
  227 |         new Promise((done) => {
  228 |           const frame = Reflect.get(globalThis, 'requestAnimationFrame') as (
  229 |             callback: () => void,
  230 |           ) => void
```