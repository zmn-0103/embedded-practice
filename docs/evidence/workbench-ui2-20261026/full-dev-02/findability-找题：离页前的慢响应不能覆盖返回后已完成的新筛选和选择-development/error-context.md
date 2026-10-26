# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: findability.spec.ts >> 找题：离页前的慢响应不能覆盖返回后已完成的新筛选和选择
- Location: tests\e2e\findability.spec.ts:178:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '筛选题库', exact: true })
    - locator resolved to <button type="button">筛选题库</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <dialog open="" class="import-workspace" aria-labelledby="import-workspace-title">…</dialog> from <div>…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <dialog open="" class="import-workspace" aria-labelledby="import-workspace-title">…</dialog> from <div>…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    58 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <dialog open="" class="import-workspace" aria-labelledby="import-workspace-title">…</dialog> from <div>…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms

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
      - dialog [ref=f1e55]:
        - generic [ref=f1e56]:
          - heading "导入与模板" [level=2] [ref=f1e57]
          - button "关闭导入工作区" [ref=f1e58] [cursor=pointer]
        - list "导入步骤" [ref=f1e59]:
          - listitem [ref=f1e60]: 1. 选择文件
          - listitem [ref=f1e61]: 2. 检查预览
          - listitem [ref=f1e62]: 3. 确认导入
        - paragraph [ref=f1e63]: 每个专题文件是完整快照；遗漏的现有题目将归档，题目及学习记录保留。未参与导入的专题不受影响。请持续核对本次将归档数量。
        - paragraph [ref=f1e64]: 导入完成：新增 51，内容更新 0，信息变更 0，不变 0，归档 0，恢复 0。
    - region "题库浏览" [ref=f1e68]:
      - group [ref=f1e70]:
        - generic "管理分类" [ref=f1e71] [cursor=pointer]
      - generic [ref=f1e72]:
        - generic [ref=f1e73]:
          - generic [ref=f1e74]:
            - text: 题库搜索
            - searchbox "题库搜索" [ref=f1e75]
          - generic [ref=f1e76]:
            - generic [ref=f1e77]: 标签
            - combobox "题库标签" [ref=f1e79]
          - generic [ref=f1e80]:
            - text: 难度
            - combobox "题库难度" [ref=f1e81]:
              - option "全部难度" [selected]
              - option "未分级"
              - option "易（基础）"
              - option "中（进阶）"
              - option "难（综合）"
          - generic [ref=f1e82]:
            - text: 自评状态
            - combobox "题库自评状态" [ref=f1e83]:
              - option "全部状态" [selected]
              - option "未练习"
              - option "不会"
              - option "不熟"
              - option "掌握"
          - generic [ref=f1e84]:
            - checkbox "题库只看收藏" [ref=f1e85]
            - text: 只看收藏
          - paragraph [ref=f1e86]: 全部题目，未限定其他条件
        - generic [ref=f1e87]:
          - checkbox "题库只看内容更新待复习" [ref=f1e88]
          - text: 只看内容更新待复习
        - paragraph [ref=f1e89]: 有效题目
        - generic [ref=f1e90]:
          - button "筛选题库" [ref=f1e91] [cursor=pointer]
          - button "清空题库筛选" [ref=f1e92] [cursor=pointer]
        - generic [ref=f1e93]:
          - generic [ref=f1e94]:
            - text: 专题
            - combobox "专题" [ref=f1e95]:
              - option "全部专题"
              - option "A 找题专题（48）" [selected]
              - option "B 独立专题（3）"
          - generic [ref=f1e96]:
            - checkbox "查看归档题目" [ref=f1e97]
            - text: 查看归档题目
          - generic [ref=f1e98]: 共 48 题
      - generic [ref=f1e99]:
        - complementary "题库分类与专题导航" [ref=f1e100]:
          - group [ref=f1e101]:
            - generic "分类与专题" [ref=f1e102] [cursor=pointer]
            - navigation "题库分类导航" [ref=f1e103]:
              - generic [ref=f1e104]:
                - text: 查找专题
                - searchbox "题库专题检索" [ref=f1e105]
              - paragraph [ref=f1e106]: 检索只收窄导航，选择分类或专题后应用范围。
              - button "全部分类（51题）" [ref=f1e107] [cursor=pointer]
              - list [ref=f1e108]:
                - listitem [ref=f1e109]:
                  - generic [ref=f1e110]:
                    - button "收起未分类" [expanded] [ref=f1e111] [cursor=pointer]: ▾
                    - button "题库分类：未分类" [ref=f1e112] [cursor=pointer]: 未分类（51题）
                  - list [ref=f1e113]:
                    - listitem [ref=f1e114]:
                      - button "题库专题：A 找题专题" [ref=f1e115] [cursor=pointer]: A 找题专题（48题）
                    - listitem [ref=f1e116]:
                      - button "题库专题：B 独立专题" [ref=f1e117] [cursor=pointer]: B 独立专题（3题）
        - complementary "题目列表" [ref=f1e119]:
          - list [ref=f1e121]:
            - listitem [ref=f1e122]:
              - button "保留位置问题 1 A 找题专题 · q-01 · 难度：易（基础） 尚未练习" [ref=f1e123] [cursor=pointer]:
                - generic [ref=f1e124]: 保留位置问题 1
                - generic [ref=f1e125]:
                  - text: A 找题专题 · q-01 ·
                  - generic "难度：易（基础）" [ref=f1e126]: 易（基础）
                - generic [ref=f1e127]: 尚未练习
            - listitem [ref=f1e128]:
              - button "保留位置问题 2 A 找题专题 · q-02 · 难度：易（基础） 尚未练习" [ref=f1e129] [cursor=pointer]:
                - generic [ref=f1e130]: 保留位置问题 2
                - generic [ref=f1e131]:
                  - text: A 找题专题 · q-02 ·
                  - generic "难度：易（基础）" [ref=f1e132]: 易（基础）
                - generic [ref=f1e133]: 尚未练习
            - listitem [ref=f1e134]:
              - button "保留位置问题 3 A 找题专题 · q-03 · 难度：易（基础） 尚未练习" [ref=f1e135] [cursor=pointer]:
                - generic [ref=f1e136]: 保留位置问题 3
                - generic [ref=f1e137]:
                  - text: A 找题专题 · q-03 ·
                  - generic "难度：易（基础）" [ref=f1e138]: 易（基础）
                - generic [ref=f1e139]: 尚未练习
            - listitem [ref=f1e140]:
              - button "保留位置问题 4 A 找题专题 · q-04 · 难度：易（基础） 尚未练习" [ref=f1e141] [cursor=pointer]:
                - generic [ref=f1e142]: 保留位置问题 4
                - generic [ref=f1e143]:
                  - text: A 找题专题 · q-04 ·
                  - generic "难度：易（基础）" [ref=f1e144]: 易（基础）
                - generic [ref=f1e145]: 尚未练习
            - listitem [ref=f1e146]:
              - button "保留位置问题 5 A 找题专题 · q-05 · 难度：易（基础） 尚未练习" [ref=f1e147] [cursor=pointer]:
                - generic [ref=f1e148]: 保留位置问题 5
                - generic [ref=f1e149]:
                  - text: A 找题专题 · q-05 ·
                  - generic "难度：易（基础）" [ref=f1e150]: 易（基础）
                - generic [ref=f1e151]: 尚未练习
            - listitem [ref=f1e152]:
              - button "保留位置问题 6 A 找题专题 · q-06 · 难度：易（基础） 尚未练习" [ref=f1e153] [cursor=pointer]:
                - generic [ref=f1e154]: 保留位置问题 6
                - generic [ref=f1e155]:
                  - text: A 找题专题 · q-06 ·
                  - generic "难度：易（基础）" [ref=f1e156]: 易（基础）
                - generic [ref=f1e157]: 尚未练习
            - listitem [ref=f1e158]:
              - button "保留位置问题 7 A 找题专题 · q-07 · 难度：易（基础） 尚未练习" [ref=f1e159] [cursor=pointer]:
                - generic [ref=f1e160]: 保留位置问题 7
                - generic [ref=f1e161]:
                  - text: A 找题专题 · q-07 ·
                  - generic "难度：易（基础）" [ref=f1e162]: 易（基础）
                - generic [ref=f1e163]: 尚未练习
            - listitem [ref=f1e164]:
              - button "保留位置问题 8 A 找题专题 · q-08 · 难度：易（基础） 尚未练习" [ref=f1e165] [cursor=pointer]:
                - generic [ref=f1e166]: 保留位置问题 8
                - generic [ref=f1e167]:
                  - text: A 找题专题 · q-08 ·
                  - generic "难度：易（基础）" [ref=f1e168]: 易（基础）
                - generic [ref=f1e169]: 尚未练习
            - listitem [ref=f1e170]:
              - button "保留位置问题 9 A 找题专题 · q-09 · 难度：易（基础） 尚未练习" [ref=f1e171] [cursor=pointer]:
                - generic [ref=f1e172]: 保留位置问题 9
                - generic [ref=f1e173]:
                  - text: A 找题专题 · q-09 ·
                  - generic "难度：易（基础）" [ref=f1e174]: 易（基础）
                - generic [ref=f1e175]: 尚未练习
            - listitem [ref=f1e176]:
              - button "保留位置问题 10 A 找题专题 · q-10 · 难度：易（基础） 尚未练习" [ref=f1e177] [cursor=pointer]:
                - generic [ref=f1e178]: 保留位置问题 10
                - generic [ref=f1e179]:
                  - text: A 找题专题 · q-10 ·
                  - generic "难度：易（基础）" [ref=f1e180]: 易（基础）
                - generic [ref=f1e181]: 尚未练习
            - listitem [ref=f1e182]:
              - button "保留位置问题 11 A 找题专题 · q-11 · 难度：易（基础） 尚未练习" [ref=f1e183] [cursor=pointer]:
                - generic [ref=f1e184]: 保留位置问题 11
                - generic [ref=f1e185]:
                  - text: A 找题专题 · q-11 ·
                  - generic "难度：易（基础）" [ref=f1e186]: 易（基础）
                - generic [ref=f1e187]: 尚未练习
            - listitem [ref=f1e188]:
              - button "保留位置问题 12 A 找题专题 · q-12 · 难度：易（基础） 尚未练习" [ref=f1e189] [cursor=pointer]:
                - generic [ref=f1e190]: 保留位置问题 12
                - generic [ref=f1e191]:
                  - text: A 找题专题 · q-12 ·
                  - generic "难度：易（基础）" [ref=f1e192]: 易（基础）
                - generic [ref=f1e193]: 尚未练习
            - listitem [ref=f1e194]:
              - button "保留位置问题 13 A 找题专题 · q-13 · 难度：易（基础） 尚未练习" [ref=f1e195] [cursor=pointer]:
                - generic [ref=f1e196]: 保留位置问题 13
                - generic [ref=f1e197]:
                  - text: A 找题专题 · q-13 ·
                  - generic "难度：易（基础）" [ref=f1e198]: 易（基础）
                - generic [ref=f1e199]: 尚未练习
            - listitem [ref=f1e200]:
              - button "保留位置问题 14 A 找题专题 · q-14 · 难度：易（基础） 尚未练习" [ref=f1e201] [cursor=pointer]:
                - generic [ref=f1e202]: 保留位置问题 14
                - generic [ref=f1e203]:
                  - text: A 找题专题 · q-14 ·
                  - generic "难度：易（基础）" [ref=f1e204]: 易（基础）
                - generic [ref=f1e205]: 尚未练习
            - listitem [ref=f1e206]:
              - button "保留位置问题 15 A 找题专题 · q-15 · 难度：易（基础） 尚未练习" [ref=f1e207] [cursor=pointer]:
                - generic [ref=f1e208]: 保留位置问题 15
                - generic [ref=f1e209]:
                  - text: A 找题专题 · q-15 ·
                  - generic "难度：易（基础）" [ref=f1e210]: 易（基础）
                - generic [ref=f1e211]: 尚未练习
            - listitem [ref=f1e212]:
              - button "保留位置问题 16 A 找题专题 · q-16 · 难度：易（基础） 尚未练习" [ref=f1e213] [cursor=pointer]:
                - generic [ref=f1e214]: 保留位置问题 16
                - generic [ref=f1e215]:
                  - text: A 找题专题 · q-16 ·
                  - generic "难度：易（基础）" [ref=f1e216]: 易（基础）
                - generic [ref=f1e217]: 尚未练习
            - listitem [ref=f1e218]:
              - button "保留位置问题 17 A 找题专题 · q-17 · 难度：易（基础） 尚未练习" [ref=f1e219] [cursor=pointer]:
                - generic [ref=f1e220]: 保留位置问题 17
                - generic [ref=f1e221]:
                  - text: A 找题专题 · q-17 ·
                  - generic "难度：易（基础）" [ref=f1e222]: 易（基础）
                - generic [ref=f1e223]: 尚未练习
            - listitem [ref=f1e224]:
              - button "保留位置问题 18 A 找题专题 · q-18 · 难度：易（基础） 尚未练习" [ref=f1e225] [cursor=pointer]:
                - generic [ref=f1e226]: 保留位置问题 18
                - generic [ref=f1e227]:
                  - text: A 找题专题 · q-18 ·
                  - generic "难度：易（基础）" [ref=f1e228]: 易（基础）
                - generic [ref=f1e229]: 尚未练习
            - listitem [ref=f1e230]:
              - button "保留位置问题 19 A 找题专题 · q-19 · 难度：易（基础） 尚未练习" [ref=f1e231] [cursor=pointer]:
                - generic [ref=f1e232]: 保留位置问题 19
                - generic [ref=f1e233]:
                  - text: A 找题专题 · q-19 ·
                  - generic "难度：易（基础）" [ref=f1e234]: 易（基础）
                - generic [ref=f1e235]: 尚未练习
            - listitem [ref=f1e236]:
              - button "保留位置问题 20 A 找题专题 · q-20 · 难度：易（基础） 尚未练习" [ref=f1e237] [cursor=pointer]:
                - generic [ref=f1e238]: 保留位置问题 20
                - generic [ref=f1e239]:
                  - text: A 找题专题 · q-20 ·
                  - generic "难度：易（基础）" [ref=f1e240]: 易（基础）
                - generic [ref=f1e241]: 尚未练习
          - navigation "题目分页" [ref=f1e242]:
            - button "上一页" [disabled] [ref=f1e243]
            - generic [ref=f1e244]: 1 / 3
            - button "下一页" [ref=f1e245] [cursor=pointer]
    - status [ref=f1e246]:
      - paragraph [ref=f1e248]: 本地数据已就绪
  - contentinfo [ref=f1e249]:
    - generic [ref=f1e250]: 离线使用 · 数据保存在本机
    - generic [ref=f1e251]: V42.11.15 测试版 · 构建 20261026.1-workbench-e-ui2
```

# Test source

```ts
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
  130 |     await expect(page.getByRole('option', { name: 'ARM Cortex', exact: true })).toBeVisible()
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
> 207 |     await page.getByRole('button', { name: '筛选题库', exact: true }).click()
      |                                                                   ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
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
  231 |           frame(() => frame(() => done(null)))
  232 |         }),
  233 |     )
  234 |     await expect(page.getByRole('heading', { name: '保留位置问题 1', exact: true })).toBeVisible()
  235 |     await page.getByRole('button', { name: '返回题目列表', exact: true }).click()
  236 |     await expect(page.getByText('共 48 题', { exact: true })).toBeVisible()
  237 |     await expect(page.getByRole('button', { name: /A 找题专题.*q-01/ })).toHaveAttribute(
  238 |       'aria-current',
  239 |       'true',
  240 |     )
  241 |   } finally {
  242 |     await application
  243 |       .evaluate(() => Reflect.get(globalThis, 'findabilitySlowRead')?.release?.())
  244 |       .catch(() => {})
  245 |     await application.close()
  246 |   }
  247 | })
  248 | 
  249 | test('找题：导入元数据使候选缓存失效，归档范围隔离，清除旧题选择', async ({
  250 |   testDataDirectory,
  251 | }, info) => {
  252 |   const { application, page, file } = await prepare(testDataDirectory, info.project.name)
  253 |   try {
  254 |     expect((await list(page)).tagOptions).not.toContain('新增候选')
  255 |     await page.getByRole('button', { name: /A 找题专题.*q-01/ }).click()
  256 |     await page.getByRole('button', { name: '展开参考答案', exact: true }).click()
  257 |     await writeFile(file, bank('find-a', true, true))
  258 |     await importFiles(application, page, [file])
  259 |     const active = await list(page)
  260 |     expect(active.total).toBe(47)
  261 |     expect(active.tagOptions).toContain('新增候选')
  262 |     expect(active.tagOptions).not.toContain('归档独有')
  263 |     const archived = await list(page, { archived: true })
  264 |     expect(archived.total).toBe(1)
  265 |     expect(archived.tagOptions).toContain('归档独有')
  266 |     expect(archived.tagOptions).not.toContain('新增候选')
  267 |     expect(await page.getByRole('region', { name: '参考答案', exact: true }).count()).toBe(0)
  268 |     expect(await page.getByRole('article', { name: '题目内容', exact: true }).count()).toBe(0)
  269 |   } finally {
  270 |     await application.close()
  271 |   }
  272 | })
  273 | 
  274 | test('找题：返回后读取失败保留条件和页码，重试仍查询原范围', async ({
  275 |   testDataDirectory,
  276 | }, info) => {
  277 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  278 |   try {
  279 |     await secondPage(page)
  280 |     await openPage(page, '设置与数据')
  281 |     await application.evaluate(({ ipcMain }) => {
  282 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:list-questions')
  283 |       let fail = true
  284 |       ipcMain.removeHandler('library:list-questions')
  285 |       ipcMain.handle('library:list-questions', async (event, request) => {
  286 |         if (request.topicId === 'find-a' && fail) {
  287 |           fail = false
  288 |           return {
  289 |             ok: false,
  290 |             error: { code: 'DATABASE_UNAVAILABLE', message: '定向模拟返回读取失败' },
  291 |           }
  292 |         }
  293 |         return original(event, request)
  294 |       })
  295 |     })
  296 |     await openPage(page, '题库')
  297 |     await expect(page.getByRole('alert')).toContainText('定向模拟返回读取失败')
  298 |     await expect(page.getByRole('searchbox', { name: '题库搜索', exact: true })).toHaveValue('保留')
  299 |     await expect(page.getByRole('navigation', { name: '题目分页' })).toContainText('2 / 3')
  300 |     await page.getByRole('button', { name: '重新读取题库', exact: true }).click()
  301 |     await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
  302 |     await expect(page.getByRole('navigation', { name: '题目分页' })).toContainText('2 / 3')
  303 |     await expect(page.getByRole('alert')).toHaveCount(0)
  304 |   } finally {
  305 |     await application.close()
  306 |   }
  307 | })
```