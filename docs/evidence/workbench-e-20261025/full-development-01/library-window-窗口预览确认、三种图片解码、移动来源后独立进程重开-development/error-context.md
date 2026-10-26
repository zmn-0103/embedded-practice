# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: library-window.spec.ts >> 窗口预览确认、三种图片解码、移动来源后独立进程重开
- Location: tests\e2e\library-window.spec.ts:82:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /ui-002/ })

```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - banner [ref=f1e4]:
    - heading "嵌入式刷题本" [level=1] [ref=f1e6]
    - button "收起导航" [expanded] [ref=f1e7] [cursor=pointer]: ‹
  - navigation "主要页面" [ref=f1e8]:
    - link "学习总览" [ref=f1e9] [cursor=pointer]:
      - /url: "#overview"
    - link "知识板块" [ref=f1e12] [cursor=pointer]:
      - /url: "#boards"
    - link "开始练习" [ref=f1e15] [cursor=pointer]:
      - /url: "#practice"
    - link "题库" [ref=f1e18] [cursor=pointer]:
      - /url: "#library"
    - link "学习记录" [ref=f1e21] [cursor=pointer]:
      - /url: "#records"
    - link "设置与数据" [ref=f1e24] [cursor=pointer]:
      - /url: "#settings"
  - main [ref=f1e27]:
    - generic [ref=f1e28]:
      - generic [ref=f1e29]:
        - generic [ref=f1e30]: 学习工作台
        - strong [ref=f1e31]: 题库
      - generic [ref=f1e32]:
        - generic [ref=f1e33]: 本地离线
        - group [ref=f1e35]:
          - generic "外观" [ref=f1e36] [cursor=pointer]
          - option "松间绿" [selected]
          - option "晴空蓝"
          - option "暖沙金"
          - option "暮山紫"
          - option "Claude 风格"
    - region "题库导入" [ref=f1e38]:
      - generic [ref=f1e39]:
        - generic [ref=f1e40]:
          - paragraph [ref=f1e41]: 选择文件 → 核对预览 → 确认导入
          - heading "题库导入" [level=2] [ref=f1e42]
        - generic [ref=f1e43]:
          - button "导入题库" [ref=f1e44] [cursor=pointer]
          - button "导出题库模板" [ref=f1e45] [cursor=pointer]
      - paragraph [ref=f1e46]: 导入完成：新增 2，内容更新 0，信息变更 0，不变 0，归档 0，恢复 0。
    - region "题库浏览" [ref=f1e50]:
      - generic [ref=f1e52]:
        - button "返回题目列表" [ref=f1e53] [cursor=pointer]
        - article "题目内容" [ref=f1e54]:
          - generic [ref=f1e55]:
            - paragraph [ref=f1e56]: 窗口验证样本 · ui-001
            - heading "代码与表格检查" [level=3] [ref=f1e57]
            - paragraph [ref=f1e58]:
              - generic "难度：易（基础）" [ref=f1e59]: 易（基础）
              - text: · 测试夹具
            - paragraph [ref=f1e60]: 当前内容尚未练习
            - button "收藏本题" [ref=f1e61] [cursor=pointer]
          - heading "题目" [level=4] [ref=f1e62]
          - generic [ref=f1e63]:
            - paragraph [ref=f1e64]: 检查下列代码与表格。
            - generic [ref=f1e65]:
              - generic [ref=f1e66]:
                - generic [ref=f1e67]: c
                - button "复制代码" [ref=f1e68] [cursor=pointer]
              - code [ref=f1e71]: int value = 1; // <script>globalThis.evil = 1</script>
            - table [ref=f1e72]:
              - rowgroup [ref=f1e73]:
                - row [ref=f1e74]:
                  - columnheader "项目" [ref=f1e75]
                  - columnheader "值" [ref=f1e76]
              - rowgroup [ref=f1e77]:
                - row [ref=f1e78]:
                  - cell "GPIO" [ref=f1e79]
                  - cell "1" [ref=f1e80]
            - paragraph [ref=f1e81]:
              - button "放大查看：PNG 图" [ref=f1e82]:
                - img "PNG 图" [ref=f1e83]
              - button "放大查看：JPEG 图" [ref=f1e84]:
                - img "JPEG 图" [ref=f1e85]
              - button "放大查看：WebP 图" [ref=f1e86]:
                - img "WebP 图" [ref=f1e87]
            - paragraph [ref=f1e88]:
              - link "参考手册" [ref=f1e89] [cursor=pointer]:
                - /url: https://example.com/manual
              - text: 和 不支持的文件链接
          - button "收起参考答案" [ref=f1e91] [cursor=pointer]
          - region "参考答案" [ref=f1e92]:
            - heading "参考答案" [level=4] [ref=f1e93]
            - generic [ref=f1e94]:
              - paragraph [ref=f1e95]: UI-ANSWER-ONE 仅展开后出现
              - paragraph [ref=f1e96]:
                - button "放大查看：答案图" [ref=f1e97]:
                  - img "答案图" [ref=f1e98]
          - button "查看本题历史" [ref=f1e100] [cursor=pointer]
    - status [ref=f1e101]:
      - paragraph [ref=f1e103]: 本地数据已就绪
  - contentinfo [ref=f1e104]:
    - generic [ref=f1e105]: 离线使用 · 数据保存在本机
    - generic [ref=f1e106]: V42.11.15 测试版 · 构建 20261025.3-workbench-e
```

# Test source

```ts
  16  |       if (omitSecond && n === 2) return ''
  17  |       const body =
  18  |         n === 1
  19  |           ? '检查下列代码与表格。\n\n```c\nint value = 1;\n// <script>globalThis.evil = 1</script>\n```\n\n| 项目 | 值 |\n| :--- | ---: |\n| GPIO | 1 |\n\n![PNG 图](assets/中文图.png)\n![JPEG 图](assets/带%20空格.jpg)\n![WebP 图](assets/test.webp)\n\n[参考手册][manual] 和 [不支持的文件链接](file:///C:/private.txt)'
  20  |           : `第 ${n} 题题干`
  21  |       const answer =
  22  |         n === 1
  23  |           ? `${update ? '更新后的答案' : secret}\n\n![答案图](assets/中文图.png)`
  24  |           : n === 2
  25  |             ? 'UI-ANSWER-TWO\n\n![损坏图](assets/header-only.png)'
  26  |             : `第 ${n} 题答案`
  27  |       return `## ui-${String(n).padStart(3, '0')} | ${n === 1 ? '代码与表格检查' : `窗口题 ${n}`}\n\n标签：测试夹具\n难度：基础\n\n### 题目\n\n${body}\n\n### 参考答案\n\n${answer}\n\n`
  28  |     }).join('')
  29  |   )
  30  | }
  31  | async function prepare(directory: string, count = 2) {
  32  |   const sources = join(directory, 'sources')
  33  |   const assets = join(sources, 'assets')
  34  |   await mkdir(assets, { recursive: true })
  35  |   await copyFile(resolve('tests/fixtures/images/small.png'), join(assets, '中文图.png'))
  36  |   await copyFile(resolve('tests/fixtures/images/small.jpg'), join(assets, '带 空格.jpg'))
  37  |   await copyFile(resolve('tests/fixtures/images/small.webp'), join(assets, 'test.webp'))
  38  |   // 有意只保留 PNG 头部：准备器可识别尺寸，但真实像素解码应失败并提示。
  39  |   await writeFile(
  40  |     join(assets, 'header-only.png'),
  41  |     (await readFile(resolve('tests/fixtures/images/small.png'))).subarray(0, 33),
  42  |   )
  43  |   const file = join(sources, '窗口样本.md')
  44  |   await writeFile(file, bank(count))
  45  |   return { sources, file }
  46  | }
  47  | async function choose(application: ElectronApplication, filePaths: string[], canceled = false) {
  48  |   await application.evaluate(
  49  |     ({ dialog }, selected) => {
  50  |       dialog.showOpenDialog = async () => ({
  51  |         canceled: selected.canceled,
  52  |         filePaths: selected.filePaths,
  53  |       })
  54  |     },
  55  |     { filePaths, canceled },
  56  |   )
  57  | }
  58  | async function importThroughWindow(application: ElectronApplication, page: Page, paths: string[]) {
  59  |   await choose(application, paths)
  60  |   await page.getByRole('button', { name: '导入题库', exact: true }).click()
  61  |   await expect(page.getByRole('heading', { name: '导入预览', exact: true })).toBeVisible()
  62  |   await page.getByRole('button', { name: '确认导入', exact: true }).click()
  63  |   await expect(page.getByText(/^导入完成：/)).toBeVisible()
  64  | }
  65  | async function expectImages(page: Page) {
  66  |   const images = page.locator('.question-reader img')
  67  |   await expect(images).toHaveCount(3)
  68  |   for (let index = 0; index < 3; index++) {
  69  |     const image = images.nth(index)
  70  |     await image.scrollIntoViewIfNeeded()
  71  |     await expect
  72  |       .poll(() =>
  73  |         image.evaluate((element) => (element as unknown as { naturalWidth: number }).naturalWidth),
  74  |       )
  75  |       .toBe(2)
  76  |     expect(await image.getAttribute('src')).toMatch(
  77  |       /^practice-image:\/\/resource\/[1-9]\d*\/[a-f0-9]{64}$/,
  78  |     )
  79  |   }
  80  | }
  81  | 
  82  | test('窗口预览确认、三种图片解码、移动来源后独立进程重开', async ({ testDataDirectory }, info) => {
  83  |   const { sources, file } = await prepare(testDataDirectory)
  84  |   const { application, page } = await launchApplication(
  85  |     testDataDirectory,
  86  |     info.project.name,
  87  |     '题库',
  88  |   )
  89  |   try {
  90  |     await choose(application, [file])
  91  |     await page.getByRole('button', { name: '导入题库', exact: true }).dblclick()
  92  |     await expect(page.getByRole('heading', { name: '导入预览', exact: true })).toBeVisible()
  93  |     await expect(page.locator('.count-grid dd')).toHaveText(['2', '0', '0', '0', '0', '0'])
  94  |     const moved = resolve(testDataDirectory, 'sources-moved')
  95  |     if (
  96  |       dirname(resolve(sources)) !== resolve(testDataDirectory) ||
  97  |       dirname(moved) !== resolve(testDataDirectory) ||
  98  |       dirname(resolve(testDataDirectory)) !== resolve(tmpdir()) ||
  99  |       !basename(testDataDirectory).startsWith('embedded-practice-')
  100 |     )
  101 |       throw new Error('拒绝移动非测试目录')
  102 |     await rename(sources, moved)
  103 |     await page.getByRole('button', { name: '确认导入', exact: true }).dblclick()
  104 |     await expect(page.getByText(/^导入完成：/)).toBeVisible()
  105 |     await page.getByRole('button', { name: /ui-001/ }).click()
  106 |     await expect(page.locator('.question-reader pre code')).toContainText('int value = 1;')
  107 |     await expect(page.locator('.question-reader table')).toContainText('GPIO')
  108 |     expect(await page.content()).not.toContain(secret)
  109 |     expect(await page.locator('body').ariaSnapshot()).not.toContain(secret)
  110 |     await expectImages(page)
  111 |     await page.screenshot({ path: info.outputPath('library-question-light.png'), fullPage: true })
  112 |     await page.getByRole('button', { name: '展开参考答案' }).click()
  113 |     await expect(page.getByRole('region', { name: '参考答案', exact: true })).toContainText(secret)
  114 |     await page.emulateMedia({ colorScheme: 'dark' })
  115 |     await page.screenshot({ path: info.outputPath('library-answer-dark.png'), fullPage: true })
> 116 |     await page.getByRole('button', { name: /ui-002/ }).click()
      |                                                        ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
  117 |     await expect(page.locator('.question-reader')).toContainText('第 2 题题干')
  118 |     expect(await page.content()).not.toContain(secret)
  119 |     expect(await page.content()).not.toContain('UI-ANSWER-TWO')
  120 |     await page.getByRole('button', { name: '展开参考答案' }).click()
  121 |     await expect(page.locator('.image-error')).toContainText('图片无法解码或读取')
  122 |   } finally {
  123 |     await application.close()
  124 |   }
  125 |   const reopened = await launchApplication(testDataDirectory, info.project.name, '题库')
  126 |   try {
  127 |     await reopened.page.getByRole('button', { name: /ui-001/ }).click()
  128 |     await expectImages(reopened.page)
  129 |     expect(await reopened.page.content()).not.toContain(secret)
  130 |     await reopened.page.getByRole('button', { name: '展开参考答案' }).click()
  131 |     await expect(
  132 |       reopened.page.getByRole('region', { name: '参考答案', exact: true }),
  133 |     ).toContainText(secret)
  134 |   } finally {
  135 |     await reopened.application.close()
  136 |   }
  137 | })
  138 | 
  139 | test('窗口取消、错误定位、放弃预览、重载与非法请求保护', async ({ testDataDirectory }, info) => {
  140 |   const { file, sources } = await prepare(testDataDirectory)
  141 |   const { application, page } = await launchApplication(
  142 |     testDataDirectory,
  143 |     info.project.name,
  144 |     '题库',
  145 |   )
  146 |   try {
  147 |     await choose(application, [], true)
  148 |     await page.getByRole('button', { name: '导入题库', exact: true }).click()
  149 |     await expect(page.getByText('已取消本次导入。')).toBeVisible()
  150 |     const invalid = join(sources, '错误题库.md')
  151 |     await writeFile(invalid, bank().replace('### 参考答案', '### 错误分区'))
  152 |     await choose(application, [invalid])
  153 |     await page.getByRole('button', { name: '导入题库', exact: true }).click()
  154 |     await expect(page.getByRole('alert')).toContainText('错误题库.md')
  155 |     await expect(page.getByRole('alert')).toContainText('第')
  156 |     await expect(page.getByRole('button', { name: '确认导入', exact: true })).toHaveCount(0)
  157 |     await choose(application, [file])
  158 |     await page.getByRole('button', { name: '导入题库', exact: true }).click()
  159 |     await expect(page.getByRole('heading', { name: '导入预览', exact: true })).toBeVisible()
  160 |     await page.getByRole('button', { name: '放弃预览' }).click()
  161 |     await expect(page.getByRole('heading', { name: '题库尚未导入' })).toBeVisible()
  162 |     const preview = await page.evaluate(() =>
  163 |       (globalThis as unknown as { desktop: DesktopApi }).desktop.library.previewImport(),
  164 |     )
  165 |     if (!preview.ok) throw new Error(preview.error.message)
  166 |     await page.reload()
  167 |     await expect(page.getByRole('status')).toHaveText('本地数据已就绪')
  168 |     const result = await page.evaluate(
  169 |       (token) =>
  170 |         (globalThis as unknown as { desktop: DesktopApi }).desktop.library.commitImport(token),
  171 |       preview.value.token,
  172 |     )
  173 |     expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_TOKEN' } })
  174 |     const invalidRequest = await page.evaluate(() =>
  175 |       (globalThis as unknown as { desktop: DesktopApi }).desktop.library.getQuestion({
  176 |         topicId: 'ui-fixture',
  177 |         questionId: 'ui-001',
  178 |         path: 'C:/private',
  179 |       } as never),
  180 |     )
  181 |     expect(invalidRequest).toMatchObject({ error: { code: 'INVALID_REQUEST' } })
  182 |   } finally {
  183 |     await application.close()
  184 |   }
  185 | })
  186 | 
  187 | test('分页与归档视图、窗口更新摘要及相同身份恢复', async ({ testDataDirectory }, info) => {
  188 |   const { file } = await prepare(testDataDirectory, 25)
  189 |   const { application, page } = await launchApplication(
  190 |     testDataDirectory,
  191 |     info.project.name,
  192 |     '题库',
  193 |   )
  194 |   try {
  195 |     await importThroughWindow(application, page, [file])
  196 |     await expect(page.locator('.question-list li')).toHaveCount(20)
  197 |     await page.getByRole('button', { name: '下一页', exact: true }).click()
  198 |     await expect(page.locator('.question-list li')).toHaveCount(5)
  199 |     await page.getByRole('button', { name: /ui-021/ }).click()
  200 |     await expect(page.locator('.question-reader')).toContainText('第 21 题题干')
  201 |     await writeFile(file, bank(25, true, true))
  202 |     await choose(application, [file])
  203 |     await page.getByRole('button', { name: '导入题库', exact: true }).click()
  204 |     await expect(page.getByRole('heading', { name: '导入预览', exact: true })).toBeVisible()
  205 |     await expect(page.locator('.count-grid dd').nth(1)).toHaveText('1')
  206 |     await expect(page.locator('.count-grid dd').nth(4)).toHaveText('1')
  207 |     await page.getByRole('button', { name: '确认导入', exact: true }).click()
  208 |     await expect(page.getByText(/^导入完成：/)).toBeVisible()
  209 |     await page.getByLabel('查看归档题目').check()
  210 |     await expect(page.locator('.question-list li')).toHaveCount(1)
  211 |     await page.getByRole('button', { name: /ui-002/ }).click()
  212 |     await expect(page.locator('.question-reader')).toContainText('已归档')
  213 |     await writeFile(file, bank(25, true))
  214 |     await importThroughWindow(application, page, [file])
  215 |     await expect(page.getByText(/^导入完成：/)).toContainText('恢复 1')
  216 |     await expect(page.locator('.question-list li')).toHaveCount(0)
```