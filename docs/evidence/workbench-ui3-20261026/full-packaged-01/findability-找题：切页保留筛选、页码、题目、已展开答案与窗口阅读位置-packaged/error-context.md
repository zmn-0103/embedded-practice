# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: findability.spec.ts >> 找题：切页保留筛选、页码、题目、已展开答案与窗口阅读位置
- Location: tests\e2e\findability.spec.ts:83:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /A 找题专题.*q-21/ })

```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - banner [ref=f1e4]:
    - generic [ref=f1e9]:
      - heading "嵌入式刷题本" [level=1] [ref=f1e10]
      - paragraph [ref=f1e11]: 思考有迹，积累有序
    - button "收起导航" [expanded] [ref=f1e12] [cursor=pointer]: ‹
  - navigation "主要页面" [ref=f1e13]:
    - link "学习总览" [ref=f1e14] [cursor=pointer]:
      - /url: "#overview"
    - link "知识板块" [ref=f1e18] [cursor=pointer]:
      - /url: "#boards"
    - link "开始练习" [ref=f1e22] [cursor=pointer]:
      - /url: "#practice"
    - link "题库" [ref=f1e26] [cursor=pointer]:
      - /url: "#library"
    - link "学习记录" [ref=f1e30] [cursor=pointer]:
      - /url: "#records"
    - link "设置与数据" [ref=f1e34] [cursor=pointer]:
      - /url: "#settings"
  - main [ref=f1e38]:
    - generic [ref=f1e39]:
      - generic [ref=f1e40]:
        - generic [ref=f1e41]: 学习工作台
        - strong [ref=f1e42]: 题库
      - generic [ref=f1e43]:
        - generic [ref=f1e44]: 本地离线
        - group [ref=f1e46]:
          - generic "外观" [ref=f1e47] [cursor=pointer]
          - option "松间绿" [selected]
          - option "晴空蓝"
          - option "暖沙金"
          - option "暮山紫"
          - option "Claude 风格"
    - region "题库导入" [ref=f1e49]:
      - generic [ref=f1e50]:
        - strong [ref=f1e51]: 题库工具
        - generic [ref=f1e52]:
          - button "导入题库" [ref=f1e53] [cursor=pointer]
          - button "导出题库模板" [ref=f1e54] [cursor=pointer]
    - region "题库浏览" [ref=f1e58]:
      - group [ref=f1e60]:
        - generic "管理分类" [ref=f1e61] [cursor=pointer]
      - generic [ref=f1e62]:
        - generic [ref=f1e63]:
          - generic [ref=f1e64]:
            - text: 题库搜索
            - searchbox "题库搜索" [ref=f1e65]: 保留
          - generic [ref=f1e66]:
            - generic [ref=f1e67]: 标签
            - combobox "题库标签" [ref=f1e69]
          - generic [ref=f1e70]:
            - text: 难度
            - combobox "题库难度" [ref=f1e71]:
              - option "全部难度" [selected]
              - option "未分级"
              - option "易（基础）"
              - option "中（进阶）"
              - option "难（综合）"
          - generic [ref=f1e72]:
            - text: 自评状态
            - combobox "题库自评状态" [ref=f1e73]:
              - option "全部状态" [selected]
              - option "未练习"
              - option "不会"
              - option "不熟"
              - option "掌握"
          - generic [ref=f1e74]:
            - checkbox "题库只看收藏" [ref=f1e75]
            - text: 只看收藏
          - paragraph [ref=f1e76]: 搜索：保留
        - generic [ref=f1e77]:
          - checkbox "题库只看内容更新待复习" [ref=f1e78]
          - text: 只看内容更新待复习
        - paragraph [ref=f1e79]: 有效题目
        - generic [ref=f1e80]:
          - button "筛选题库" [ref=f1e81] [cursor=pointer]
          - button "清空题库筛选" [ref=f1e82] [cursor=pointer]
        - generic [ref=f1e83]:
          - generic [ref=f1e84]:
            - text: 专题
            - combobox "专题" [ref=f1e85]:
              - option "全部专题"
              - option "A 找题专题（48）" [selected]
              - option "B 独立专题（3）"
          - generic [ref=f1e86]:
            - checkbox "查看归档题目" [ref=f1e87]
            - text: 查看归档题目
          - generic [ref=f1e88]: 共 48 题
      - generic [ref=f1e89]:
        - complementary "题库分类与专题导航" [ref=f1e90]:
          - group [ref=f1e91]:
            - generic "分类与专题" [ref=f1e92] [cursor=pointer]
            - navigation "题库分类导航" [ref=f1e93]:
              - generic [ref=f1e94]:
                - text: 查找专题
                - searchbox "题库专题检索" [ref=f1e95]
              - paragraph [ref=f1e96]: 检索仅筛选导航；点击后应用范围。
              - button "全部分类（51题）" [ref=f1e97] [cursor=pointer]
              - list [ref=f1e98]:
                - listitem [ref=f1e99]:
                  - generic [ref=f1e100]:
                    - button "收起未分类" [expanded] [active] [ref=f1e101] [cursor=pointer]: ▾
                    - button "题库分类：未分类" [ref=f1e102] [cursor=pointer]: 未分类（51题）
                  - list [ref=f1e103]:
                    - listitem [ref=f1e104]:
                      - button "题库专题：A 找题专题" [ref=f1e105] [cursor=pointer]: A 找题专题（48题）
                    - listitem [ref=f1e106]:
                      - button "题库专题：B 独立专题" [ref=f1e107] [cursor=pointer]: B 独立专题（3题）
        - complementary "题目列表" [ref=f1e109]:
          - list [ref=f1e111]:
            - listitem [ref=f1e112]:
              - button "保留位置问题 21 q-21 难度：易（基础） 尚未练习" [ref=f1e113] [cursor=pointer]:
                - generic [ref=f1e114]: 保留位置问题 21
                - generic [ref=f1e115]:
                  - generic [ref=f1e116]: q-21
                  - generic "难度：易（基础）" [ref=f1e117]: 易（基础）
                  - generic [ref=f1e118]: 尚未练习
            - listitem [ref=f1e119]:
              - button "保留位置问题 22 q-22 难度：易（基础） 尚未练习" [ref=f1e120] [cursor=pointer]:
                - generic [ref=f1e121]: 保留位置问题 22
                - generic [ref=f1e122]:
                  - generic [ref=f1e123]: q-22
                  - generic "难度：易（基础）" [ref=f1e124]: 易（基础）
                  - generic [ref=f1e125]: 尚未练习
            - listitem [ref=f1e126]:
              - button "保留位置问题 23 q-23 难度：易（基础） 尚未练习" [ref=f1e127] [cursor=pointer]:
                - generic [ref=f1e128]: 保留位置问题 23
                - generic [ref=f1e129]:
                  - generic [ref=f1e130]: q-23
                  - generic "难度：易（基础）" [ref=f1e131]: 易（基础）
                  - generic [ref=f1e132]: 尚未练习
            - listitem [ref=f1e133]:
              - button "保留位置问题 24 q-24 难度：易（基础） 尚未练习" [ref=f1e134] [cursor=pointer]:
                - generic [ref=f1e135]: 保留位置问题 24
                - generic [ref=f1e136]:
                  - generic [ref=f1e137]: q-24
                  - generic "难度：易（基础）" [ref=f1e138]: 易（基础）
                  - generic [ref=f1e139]: 尚未练习
            - listitem [ref=f1e140]:
              - button "保留位置问题 25 q-25 难度：易（基础） 尚未练习" [ref=f1e141] [cursor=pointer]:
                - generic [ref=f1e142]: 保留位置问题 25
                - generic [ref=f1e143]:
                  - generic [ref=f1e144]: q-25
                  - generic "难度：易（基础）" [ref=f1e145]: 易（基础）
                  - generic [ref=f1e146]: 尚未练习
            - listitem [ref=f1e147]:
              - button "保留位置问题 26 q-26 难度：易（基础） 尚未练习" [ref=f1e148] [cursor=pointer]:
                - generic [ref=f1e149]: 保留位置问题 26
                - generic [ref=f1e150]:
                  - generic [ref=f1e151]: q-26
                  - generic "难度：易（基础）" [ref=f1e152]: 易（基础）
                  - generic [ref=f1e153]: 尚未练习
            - listitem [ref=f1e154]:
              - button "保留位置问题 27 q-27 难度：易（基础） 尚未练习" [ref=f1e155] [cursor=pointer]:
                - generic [ref=f1e156]: 保留位置问题 27
                - generic [ref=f1e157]:
                  - generic [ref=f1e158]: q-27
                  - generic "难度：易（基础）" [ref=f1e159]: 易（基础）
                  - generic [ref=f1e160]: 尚未练习
            - listitem [ref=f1e161]:
              - button "保留位置问题 28 q-28 难度：易（基础） 尚未练习" [ref=f1e162] [cursor=pointer]:
                - generic [ref=f1e163]: 保留位置问题 28
                - generic [ref=f1e164]:
                  - generic [ref=f1e165]: q-28
                  - generic "难度：易（基础）" [ref=f1e166]: 易（基础）
                  - generic [ref=f1e167]: 尚未练习
            - listitem [ref=f1e168]:
              - button "保留位置问题 29 q-29 难度：易（基础） 尚未练习" [ref=f1e169] [cursor=pointer]:
                - generic [ref=f1e170]: 保留位置问题 29
                - generic [ref=f1e171]:
                  - generic [ref=f1e172]: q-29
                  - generic "难度：易（基础）" [ref=f1e173]: 易（基础）
                  - generic [ref=f1e174]: 尚未练习
            - listitem [ref=f1e175]:
              - button "保留位置问题 30 q-30 难度：易（基础） 尚未练习" [ref=f1e176] [cursor=pointer]:
                - generic [ref=f1e177]: 保留位置问题 30
                - generic [ref=f1e178]:
                  - generic [ref=f1e179]: q-30
                  - generic "难度：易（基础）" [ref=f1e180]: 易（基础）
                  - generic [ref=f1e181]: 尚未练习
            - listitem [ref=f1e182]:
              - button "保留位置问题 31 q-31 难度：易（基础） 尚未练习" [ref=f1e183] [cursor=pointer]:
                - generic [ref=f1e184]: 保留位置问题 31
                - generic [ref=f1e185]:
                  - generic [ref=f1e186]: q-31
                  - generic "难度：易（基础）" [ref=f1e187]: 易（基础）
                  - generic [ref=f1e188]: 尚未练习
            - listitem [ref=f1e189]:
              - button "保留位置问题 32 q-32 难度：易（基础） 尚未练习" [ref=f1e190] [cursor=pointer]:
                - generic [ref=f1e191]: 保留位置问题 32
                - generic [ref=f1e192]:
                  - generic [ref=f1e193]: q-32
                  - generic "难度：易（基础）" [ref=f1e194]: 易（基础）
                  - generic [ref=f1e195]: 尚未练习
            - listitem [ref=f1e196]:
              - button "保留位置问题 33 q-33 难度：易（基础） 尚未练习" [ref=f1e197] [cursor=pointer]:
                - generic [ref=f1e198]: 保留位置问题 33
                - generic [ref=f1e199]:
                  - generic [ref=f1e200]: q-33
                  - generic "难度：易（基础）" [ref=f1e201]: 易（基础）
                  - generic [ref=f1e202]: 尚未练习
            - listitem [ref=f1e203]:
              - button "保留位置问题 34 q-34 难度：易（基础） 尚未练习" [ref=f1e204] [cursor=pointer]:
                - generic [ref=f1e205]: 保留位置问题 34
                - generic [ref=f1e206]:
                  - generic [ref=f1e207]: q-34
                  - generic "难度：易（基础）" [ref=f1e208]: 易（基础）
                  - generic [ref=f1e209]: 尚未练习
            - listitem [ref=f1e210]:
              - button "保留位置问题 35 q-35 难度：易（基础） 尚未练习" [ref=f1e211] [cursor=pointer]:
                - generic [ref=f1e212]: 保留位置问题 35
                - generic [ref=f1e213]:
                  - generic [ref=f1e214]: q-35
                  - generic "难度：易（基础）" [ref=f1e215]: 易（基础）
                  - generic [ref=f1e216]: 尚未练习
            - listitem [ref=f1e217]:
              - button "保留位置问题 36 q-36 难度：易（基础） 尚未练习" [ref=f1e218] [cursor=pointer]:
                - generic [ref=f1e219]: 保留位置问题 36
                - generic [ref=f1e220]:
                  - generic [ref=f1e221]: q-36
                  - generic "难度：易（基础）" [ref=f1e222]: 易（基础）
                  - generic [ref=f1e223]: 尚未练习
            - listitem [ref=f1e224]:
              - button "保留位置问题 37 q-37 难度：易（基础） 尚未练习" [ref=f1e225] [cursor=pointer]:
                - generic [ref=f1e226]: 保留位置问题 37
                - generic [ref=f1e227]:
                  - generic [ref=f1e228]: q-37
                  - generic "难度：易（基础）" [ref=f1e229]: 易（基础）
                  - generic [ref=f1e230]: 尚未练习
            - listitem [ref=f1e231]:
              - button "保留位置问题 38 q-38 难度：易（基础） 尚未练习" [ref=f1e232] [cursor=pointer]:
                - generic [ref=f1e233]: 保留位置问题 38
                - generic [ref=f1e234]:
                  - generic [ref=f1e235]: q-38
                  - generic "难度：易（基础）" [ref=f1e236]: 易（基础）
                  - generic [ref=f1e237]: 尚未练习
            - listitem [ref=f1e238]:
              - button "保留位置问题 39 q-39 难度：易（基础） 尚未练习" [ref=f1e239] [cursor=pointer]:
                - generic [ref=f1e240]: 保留位置问题 39
                - generic [ref=f1e241]:
                  - generic [ref=f1e242]: q-39
                  - generic "难度：易（基础）" [ref=f1e243]: 易（基础）
                  - generic [ref=f1e244]: 尚未练习
            - listitem [ref=f1e245]:
              - button "保留位置问题 40 q-40 难度：易（基础） 尚未练习" [ref=f1e246] [cursor=pointer]:
                - generic [ref=f1e247]: 保留位置问题 40
                - generic [ref=f1e248]:
                  - generic [ref=f1e249]: q-40
                  - generic "难度：易（基础）" [ref=f1e250]: 易（基础）
                  - generic [ref=f1e251]: 尚未练习
          - navigation "题目分页" [ref=f1e252]:
            - button "上一页" [ref=f1e253] [cursor=pointer]
            - generic [ref=f1e254]: 2 / 3
            - button "下一页" [ref=f1e255] [cursor=pointer]
    - status [ref=f1e256]:
      - paragraph [ref=f1e258]: 本地数据已就绪
  - contentinfo [ref=f1e259]:
    - generic [ref=f1e260]: 离线使用 · 数据保存在本机
    - generic [ref=f1e261]: V0.0.1 测试版 · 构建 20261026.2-workbench-e-ui3
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
> 89  |     await page.getByRole('button', { name: /A 找题专题.*q-21/ }).click()
      |                                                              ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
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
  102 |     await expect.poll(() => page.evaluate(() => Reflect.get(globalThis, 'scrollY'))).toBe(before)
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
```