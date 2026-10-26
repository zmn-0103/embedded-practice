# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: board-entry.spec.ts >> 板块入口：900/1440窗口、四配色明暗、22px与键盘可用，难度文字对比度通过
- Location: tests\e2e\board-entry.spec.ts:397:5

# Error details

```
Error: expect(locator).toBeFocused() failed

Locator: locator('.library-workspace > .topic-navigation-panel > summary')
Expected: focused
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeFocused" locator('.library-workspace > .topic-navigation-panel > summary') with timeout 10000ms
  - waiting for locator('.library-workspace > .topic-navigation-panel > summary')

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
    - paragraph: 导入完成：新增 27，内容更新 0，信息变更 0，不变 0，归档 0，恢复 0。
  - region "题库浏览":
    - complementary "题库分类与专题导航":
      - group:
        - text: 分类与专题
        - navigation "题库分类导航":
          - text: 查找专题
          - searchbox "题库专题检索"
          - paragraph: 检索只收窄导航，选择分类或专题后应用范围。
          - button "全部分类（27题）"
          - list:
            - listitem:
              - button "收起未分类" [expanded]
              - button "题库分类：未分类": 未分类（1题）
              - list:
                - listitem:
                  - button "题库专题：未归属专题": 未归属专题（1题）
            - listitem:
              - button "展开我的重点"
              - button "题库分类：我的重点": 我的重点（3题）
            - listitem:
              - button "展开空分类"
              - button "题库分类：空分类": 空分类（0题）
            - listitem:
              - button "展开通信协议"
              - button "题库分类：通信协议" [pressed]: 通信协议（23题）
      - group:
        - text: 管理分类
        - paragraph: 移动专题或移除分类会保留题目和已有练习；归属不随题库重导入清空。
        - group "添加分类":
          - text: 添加分类 新分类名称
          - textbox "新分类名称"
          - button "添加分类" [disabled]
          - paragraph: 名称最长60字符；“未分类”和“全部分类”用于系统范围。
        - group "修改分类":
          - text: 修改分类 要修改的分类
          - combobox "要修改的分类":
            - option "请选择分类" [selected]
            - option "我的重点"
            - option "空分类"
            - option "通信协议"
          - text: 分类新名称
          - textbox "分类新名称"
          - button "保存分类名称" [disabled]
          - button "移除分类" [disabled]
        - group "专题归属":
          - text: 专题归属 调整归属的专题
          - combobox "调整归属的专题":
            - option "请选择专题"
            - option "UART板块测试"
            - option "未归属专题"
            - option "自定义专题" [selected]
          - paragraph: 当前归属：我的重点
          - text: 归入分类
          - combobox "归入分类":
            - option "未分类"
            - option "我的重点" [selected]
            - option "空分类"
            - option "通信协议"
          - button "保存专题归属"
        - paragraph: 分类已保存。
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
      - option "全部专题" [selected]
      - option "UART板块测试（23）"
    - checkbox "查看归档题目"
    - text: 查看归档题目 共 23 题
    - complementary "题目列表":
      - list:
        - listitem:
          - button "UART板块测试 · q-1 入口题 1 难度：易（基础） 尚未练习": UART板块测试 · q-1 入口题 1 易（基础） 尚未练习
        - listitem:
          - button "UART板块测试 · q-2 入口题 2 难度：中（进阶） 尚未练习": UART板块测试 · q-2 入口题 2 中（进阶） 尚未练习
        - listitem:
          - button "UART板块测试 · q-3 入口题 3 难度：难（综合） 尚未练习": UART板块测试 · q-3 入口题 3 难（综合） 尚未练习
        - listitem:
          - button "UART板块测试 · q-4 入口题 4 难度：未分级 尚未练习": UART板块测试 · q-4 入口题 4 未分级 尚未练习
        - listitem:
          - button "UART板块测试 · q-5 入口题 5 难度：易（基础） 尚未练习": UART板块测试 · q-5 入口题 5 易（基础） 尚未练习
        - listitem:
          - button "UART板块测试 · q-6 入口题 6 难度：中（进阶） 尚未练习": UART板块测试 · q-6 入口题 6 中（进阶） 尚未练习
        - listitem:
          - button "UART板块测试 · q-7 入口题 7 难度：难（综合） 尚未练习": UART板块测试 · q-7 入口题 7 难（综合） 尚未练习
        - listitem:
          - button "UART板块测试 · q-8 入口题 8 难度：未分级 尚未练习": UART板块测试 · q-8 入口题 8 未分级 尚未练习
        - listitem:
          - button "UART板块测试 · q-9 入口题 9 难度：易（基础） 尚未练习": UART板块测试 · q-9 入口题 9 易（基础） 尚未练习
        - listitem:
          - button "UART板块测试 · q-10 入口题 10 难度：中（进阶） 尚未练习": UART板块测试 · q-10 入口题 10 中（进阶） 尚未练习
        - listitem:
          - button "UART板块测试 · q-11 入口题 11 难度：难（综合） 尚未练习": UART板块测试 · q-11 入口题 11 难（综合） 尚未练习
        - listitem:
          - button "UART板块测试 · q-12 入口题 12 难度：未分级 尚未练习": UART板块测试 · q-12 入口题 12 未分级 尚未练习
        - listitem:
          - button "UART板块测试 · q-13 入口题 13 难度：易（基础） 尚未练习": UART板块测试 · q-13 入口题 13 易（基础） 尚未练习
        - listitem:
          - button "UART板块测试 · q-14 入口题 14 难度：中（进阶） 尚未练习": UART板块测试 · q-14 入口题 14 中（进阶） 尚未练习
        - listitem:
          - button "UART板块测试 · q-15 入口题 15 难度：难（综合） 尚未练习": UART板块测试 · q-15 入口题 15 难（综合） 尚未练习
        - listitem:
          - button "UART板块测试 · q-16 入口题 16 难度：未分级 尚未练习": UART板块测试 · q-16 入口题 16 未分级 尚未练习
        - listitem:
          - button "UART板块测试 · q-17 入口题 17 难度：易（基础） 尚未练习": UART板块测试 · q-17 入口题 17 易（基础） 尚未练习
        - listitem:
          - button "UART板块测试 · q-18 入口题 18 难度：中（进阶） 尚未练习": UART板块测试 · q-18 入口题 18 中（进阶） 尚未练习
        - listitem:
          - button "UART板块测试 · q-19 入口题 19 难度：难（综合） 尚未练习": UART板块测试 · q-19 入口题 19 难（综合） 尚未练习
        - listitem:
          - button "UART板块测试 · q-20 入口题 20 难度：未分级 尚未练习": UART板块测试 · q-20 入口题 20 未分级 尚未练习
      - navigation "题目分页":
        - button "上一页" [disabled]
        - text: 1 / 2
        - button "下一页"
  - status:
    - paragraph: 本地数据已就绪
- contentinfo: 离线使用 · 数据保存在本机 V42.11.15 测试版 · 构建 20261025.3-workbench-e
```

# Test source

```ts
  379 |         .click()
  380 |       await expect(page.getByText(`共 ${count} 题`, { exact: true })).toBeVisible()
  381 |     }
  382 |     await writeFile(paths[0]!, bank('board-a', 'UART板块测试', 23, true))
  383 |     await importHistoryFiles(application, page, [paths[0]!])
  384 |     await openPage(page, '知识板块')
  385 |     await expect(board(page, '通信协议').locator('.board-count')).toHaveText('22 题')
  386 |     await board(page, '通信协议')
  387 |       .getByRole('button', { name: '查看归档：通信协议', exact: true })
  388 |       .click()
  389 |     await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
  390 |     await expect(page.getByLabel('查看归档题目', { exact: true })).toBeChecked()
  391 |     await expect(page.locator('.question-list li')).toHaveCount(1)
  392 |   } finally {
  393 |     await stop(application)
  394 |   }
  395 | })
  396 | 
  397 | test('板块入口：900/1440窗口、四配色明暗、22px与键盘可用，难度文字对比度通过', async ({
  398 |   testDataDirectory,
  399 | }, info) => {
  400 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  401 |   try {
  402 |     const before = historySnapshot(testDataDirectory)
  403 |     const measurements = []
  404 |     for (const palette of ['松间绿', '晴空蓝', '暖沙金', '暮山紫']) {
  405 |       for (const theme of ['light', 'dark'] as const) {
  406 |         await application.evaluate(
  407 |           ({ BrowserWindow }, width) => BrowserWindow.getAllWindows()[0]!.setSize(width, 880),
  408 |           theme === 'light' ? 1440 : 900,
  409 |         )
  410 |         await openPage(page, '设置与数据')
  411 |         await page.getByRole('radio', { name: palette, exact: true }).check()
  412 |         await page.getByLabel('显示主题', { exact: true }).selectOption(theme)
  413 |         await page
  414 |           .getByLabel('正文字号', { exact: true })
  415 |           .selectOption(theme === 'dark' ? '22' : '17')
  416 |         await page.getByRole('button', { name: '保存并应用', exact: true }).click()
  417 |         await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
  418 |         await openPage(page, '知识板块')
  419 |         await expect(board(page, '通信协议').locator('.board-count')).toHaveText('23 题')
  420 |         const search = page.getByRole('searchbox', { name: '搜索板块', exact: true })
  421 |         await expect(search).toHaveCSS(
  422 |           'background-color',
  423 |           theme === 'dark'
  424 |             ? {
  425 |                 松间绿: 'rgb(27, 36, 32)',
  426 |                 晴空蓝: 'rgb(30, 39, 53)',
  427 |                 暖沙金: 'rgb(46, 39, 30)',
  428 |                 暮山紫: 'rgb(43, 35, 52)',
  429 |               }[palette]!
  430 |             : {
  431 |                 松间绿: 'rgb(252, 253, 251)',
  432 |                 晴空蓝: 'rgb(250, 252, 254)',
  433 |                 暖沙金: 'rgb(253, 250, 244)',
  434 |                 暮山紫: 'rgb(252, 250, 253)',
  435 |               }[palette]!,
  436 |         )
  437 |         await search.focus()
  438 |         await search.press('Tab')
  439 |         const toggle = page.getByLabel('显示拓展方向', { exact: true })
  440 |         await expect(toggle).toBeFocused()
  441 |         await toggle.press('Space')
  442 |         await expect(toggle).toBeChecked()
  443 |         const summary = board(page, 'C语言').locator('summary')
  444 |         await summary.focus()
  445 |         await summary.press('Enter')
  446 |         await expect(
  447 |           board(page, 'C语言').getByText('数据类型与表达式', { exact: true }),
  448 |         ).toBeVisible()
  449 |         await expect(summary).toHaveCSS('box-shadow', /0px 0px 0px 2px, .*0px 0px 0px 4px/)
  450 |         const dimensions = await page.evaluate(() => {
  451 |           const browser = globalThis as unknown as {
  452 |             innerWidth: number
  453 |             document: { documentElement: { scrollWidth: number; clientWidth: number } }
  454 |           }
  455 |           return {
  456 |             viewport: browser.innerWidth,
  457 |             clientWidth: browser.document.documentElement.clientWidth,
  458 |             scrollWidth: browser.document.documentElement.scrollWidth,
  459 |           }
  460 |         })
  461 |         expect(dimensions.scrollWidth).toBe(dimensions.clientWidth)
  462 |         await page.evaluate(() =>
  463 |           (Reflect.get(globalThis, 'scrollTo') as (x: number, y: number) => void)(0, 0),
  464 |         )
  465 |         if (palette === '松间绿')
  466 |           await captureHistory(application, page, info, `boards-${theme}.png`)
  467 |         const enter = board(page, '通信协议').getByRole('button', {
  468 |           name: '进入板块：通信协议',
  469 |           exact: true,
  470 |         })
  471 |         await enter.focus()
  472 |         await enter.press('Enter')
  473 |         await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
  474 |         await expect(page.getByLabel('题库浏览', { exact: true })).toBeFocused()
  475 |         await page.getByLabel('题库浏览', { exact: true }).press('Tab')
  476 |         const navigationSummary = page.locator(
  477 |           '.library-workspace > .topic-navigation-panel > summary',
  478 |         )
> 479 |         await expect(navigationSummary).toBeFocused()
      |                                         ^ Error: expect(locator).toBeFocused() failed
  480 |         await navigationSummary.press('Tab')
  481 |         await expect(page.getByLabel('题库专题检索', { exact: true })).toBeFocused()
  482 |         const ratios = await page.evaluate(() => {
  483 |           const browser = globalThis as unknown as {
  484 |             document: { querySelector: (selector: string) => unknown }
  485 |             getComputedStyle: (element: unknown) => { color: string; backgroundColor: string }
  486 |           }
  487 |           const luminance = (rgb: string) =>
  488 |             rgb
  489 |               .match(/[\d.]+/g)!
  490 |               .slice(0, 3)
  491 |               .map(Number)
  492 |               .map((v) => {
  493 |                 const c = v / 255
  494 |                 return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  495 |               })
  496 |               .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i]!, 0)
  497 |           return ['easy', 'medium', 'hard', 'unrated'].map((tone) => {
  498 |             const style = browser.getComputedStyle(
  499 |               browser.document.querySelector(`.question-list .difficulty-${tone}`),
  500 |             )
  501 |             const values = [luminance(style.color), luminance(style.backgroundColor)].sort(
  502 |               (a, b) => b - a,
  503 |             )
  504 |             return { tone, ratio: (values[0]! + 0.05) / (values[1]! + 0.05) }
  505 |           })
  506 |         })
  507 |         for (const { ratio } of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5)
  508 |         measurements.push({ palette, theme, dimensions, ratios })
  509 |         if (palette === '松间绿')
  510 |           await captureHistory(application, page, info, `difficulty-${theme}.png`)
  511 |         expect(historySnapshot(testDataDirectory)).toEqual(before)
  512 |       }
  513 |     }
  514 |     await info.attach('board-appearance-measurements.json', {
  515 |       body: JSON.stringify(measurements, null, 2),
  516 |       contentType: 'application/json',
  517 |     })
  518 |   } finally {
  519 |     await stop(application)
  520 |   }
  521 | })
  522 | 
```