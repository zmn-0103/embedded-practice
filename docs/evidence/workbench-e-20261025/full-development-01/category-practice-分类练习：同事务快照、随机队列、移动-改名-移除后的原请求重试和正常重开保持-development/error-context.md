# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: category-practice.spec.ts >> 分类练习：同事务快照、随机队列、移动/改名/移除后的原请求重试和正常重开保持
- Location: tests\e2e\category-practice.spec.ts:27:5

# Error details

```
Error: expect(locator).toBeEnabled() failed

Locator: getByRole('button', { name: '继续练习', exact: true })
Expected: enabled
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeEnabled" getByRole('button', { name: '继续练习', exact: true }) with timeout 10000ms
  - waiting for getByRole('button', { name: '继续练习', exact: true })

```

```yaml
- banner:
  - heading "嵌入式刷题本" [level=1]
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
  - strong: 学习总览
  - text: 本地离线
  - group: 外观
  - region "学习总览工作区":
    - paragraph: 从上次停下的地方继续
    - heading "继续你的嵌入式学习" [level=2]
    - paragraph: 先独立思考，再对照答案。每一轮积累都保存在本机。
    - region "当前练习概况":
      - paragraph: 继续原固定队列
      - heading "甲专题" [level=3]
      - paragraph: 当前位置 1 / 4 题
      - progressbar "本轮当前位置"
      - paragraph: 随机练习 · 已揭晓 0 题 · 已自评 0 题
      - button "继续本轮"
      - button "配置新练习"
    - term: 有效题目
    - definition: "5"
    - term: 已揭晓
    - definition: "0"
    - term: 已自评
    - definition: "0"
    - term: 收藏
    - definition: "1"
    - paragraph: 全部有效题目，按题目身份和当前内容版本去重。自评是个人判断。
    - region "本机知识板块":
      - heading "知识板块" [level=3]
      - button "查看全部板块"
      - button "板块 A 4 道有效题目":
        - strong: 板块 A
        - text: 4 道有效题目
      - button "板块 B 0 道有效题目":
        - strong: 板块 B
        - text: 0 道有效题目
    - region "复习筛选入口":
      - heading "复习入口" [level=3]
      - button "不会 0 题 · 去筛选":
        - strong: 不会
        - text: 0 题 · 去筛选
      - button "不熟 0 题 · 去筛选":
        - strong: 不熟
        - text: 0 题 · 去筛选
      - button "内容更新待复习 0 题 · 去筛选":
        - strong: 内容更新待复习
        - text: 0 题 · 去筛选
      - paragraph: 只填入题库筛选条件，不会自动开始或替换练习。
  - status:
    - paragraph: 本地数据已就绪
- contentinfo: 离线使用 · 数据保存在本机 V42.11.15 测试版 · 构建 20261025.3-workbench-e
```

# Test source

```ts
  1   | import { randomUUID } from 'node:crypto'
  2   | import { writeFile } from 'node:fs/promises'
  3   | import type { Page } from '@playwright/test'
  4   | import type { DesktopApi } from '../../src/shared/contracts/application'
  5   | import type { StartPractice } from '../../src/shared/contracts/practice'
  6   | import { expect, launchApplication, test } from './helpers'
  7   | import { categoryBank, categoryChange, categoryList, prepareCategories } from './category-helpers'
  8   | import { historySnapshot, importHistoryFiles, stop } from './history-helpers'
  9   | import { expectCounts, openRecords, readLearning } from './learning-helpers'
  10  | 
  11  | async function current(page: Page) {
  12  |   const result = await page.evaluate(() =>
  13  |     (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
  14  |   )
  15  |   if (!result.ok || !result.value) throw new Error('测试活动轮读取失败')
  16  |   return result.value
  17  | }
  18  | async function start(page: Page, input: StartPractice) {
  19  |   const result = await page.evaluate(
  20  |     (request) => (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.start(request),
  21  |     input,
  22  |   )
  23  |   if (!result.ok) throw new Error(result.error.message)
  24  |   return result.value
  25  | }
  26  | 
  27  | test('分类练习：同事务快照、随机队列、移动/改名/移除后的原请求重试和正常重开保持', async ({
  28  |   testDataDirectory,
  29  | }, info) => {
  30  |   const prepared = await prepareCategories(testDataDirectory, info.project.name)
  31  |   let instance = { application: prepared.application, page: prepared.page }
  32  |   try {
  33  |     const input: StartPractice = {
  34  |       requestId: randomUUID(),
  35  |       category: { kind: 'category', categoryId: prepared.first },
  36  |       topicId: null,
  37  |       mode: 'random',
  38  |       count: 'all',
  39  |       replace: null,
  40  |     }
  41  |     const ack = await start(instance.page, input)
  42  |     const first = await current(instance.page)
  43  |     expect(first.session.category).toEqual({
  44  |       kind: 'category',
  45  |       categoryId: prepared.first,
  46  |       title: '板块 A',
  47  |     })
  48  |     expect(first.session.total).toBe(4)
  49  |     const firstIdentity = {
  50  |       topicId: first.item!.topicId,
  51  |       questionId: first.item!.questionId,
  52  |       favorite: true,
  53  |     }
  54  |     expect(
  55  |       await instance.page.evaluate(
  56  |         (request) =>
  57  |           (globalThis as unknown as { desktop: DesktopApi }).desktop.library.setFavorite(request),
  58  |         firstIdentity,
  59  |       ),
  60  |     ).toMatchObject({ ok: true })
  61  |     await instance.page.reload()
> 62  |     await expect(instance.page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
      |                                                                                    ^ Error: expect(locator).toBeEnabled() failed
  63  |     await instance.page.getByRole('button', { name: '继续练习', exact: true }).click()
  64  |     await instance.page
  65  |       .getByRole('textbox', { name: '我的答案', exact: true })
  66  |       .fill('分类原轮测试草稿一')
  67  |     await instance.page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  68  |     await instance.page.getByRole('button', { name: '不熟', exact: true }).click()
  69  |     const draft = '分类验收专用，非用户答案\n    kept_queue();\n中文末行'
  70  |     await instance.page.getByRole('textbox', { name: '我的答案', exact: true }).fill(draft)
  71  |     await expect(instance.page.locator('.practice-save')).toHaveText('已保存')
  72  |     await instance.page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
  73  |     const before = historySnapshot(testDataDirectory)
  74  |     const position = await current(instance.page)
  75  |     for (const change of [
  76  |       { kind: 'rename' as const, categoryId: prepared.first, title: '已改名称' },
  77  |       { kind: 'assign' as const, topicId: 'cat-a', categoryId: prepared.second },
  78  |       { kind: 'assign' as const, topicId: 'cat-b', categoryId: prepared.second },
  79  |       { kind: 'delete' as const, categoryId: prepared.first },
  80  |     ]) {
  81  |       await categoryChange(instance.page, change)
  82  |       expect(historySnapshot(testDataDirectory)).toEqual(before)
  83  |     }
  84  |     expect(await start(instance.page, input)).toEqual(ack)
  85  |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  86  |     const replacement = await instance.page.evaluate(
  87  |       (request) =>
  88  |         (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.start(request),
  89  |       {
  90  |         ...input,
  91  |         requestId: randomUUID(),
  92  |         replace: {
  93  |           sessionId: position.session.sessionId,
  94  |           position: position.session.position,
  95  |           revision: position.session.revision,
  96  |         },
  97  |       },
  98  |     )
  99  |     expect(replacement).toMatchObject({ ok: false, error: { code: 'NO_QUESTIONS' } })
  100 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  101 |     await instance.application.close()
  102 |     instance = await launchApplication(testDataDirectory, info.project.name)
  103 |     const details = instance.page.getByLabel('本轮创建条件', { exact: true })
  104 |     await details.locator('summary').click()
  105 |     await expect(details).toContainText('分类：板块 A')
  106 |     await instance.page.getByRole('button', { name: '继续练习', exact: true }).click()
  107 |     await expect(instance.page.getByLabel('练习进度', { exact: true })).toContainText('第 2 / 4')
  108 |     await expect(instance.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  109 |       draft,
  110 |     )
  111 |     expect(await current(instance.page)).toEqual(position)
  112 |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  113 |     await info.attach('category-queue-reopened.png', {
  114 |       body: await instance.page.screenshot(),
  115 |       contentType: 'image/png',
  116 |     })
  117 |   } finally {
  118 |     await stop(instance.application)
  119 |   }
  120 | })
  121 | 
  122 | test('分类统计：同题多轮去重、当前版本/收藏与归档交集，题库下方保持同一固定范围', async ({
  123 |   testDataDirectory,
  124 | }, info) => {
  125 |   const { application, page, first, paths } = await prepareCategories(
  126 |     testDataDirectory,
  127 |     info.project.name,
  128 |   )
  129 |   try {
  130 |     let replace: StartPractice['replace'] = null
  131 |     for (let round = 0; round < 2; round++) {
  132 |       await start(page, {
  133 |         requestId: randomUUID(),
  134 |         topicId: 'cat-a',
  135 |         category: { kind: 'category', categoryId: first },
  136 |         mode: 'sequential',
  137 |         count: 'all',
  138 |         replace,
  139 |       })
  140 |       let view = await current(page)
  141 |       const draft = { revision: 0, text: '' }
  142 |       const cursor = () => ({
  143 |         sessionId: view.session.sessionId,
  144 |         position: view.session.position,
  145 |         revision: view.session.revision,
  146 |       })
  147 |       expect(
  148 |         await page.evaluate(
  149 |           (request) =>
  150 |             (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.reveal(request),
  151 |           { requestId: randomUUID(), cursor: cursor(), draft },
  152 |         ),
  153 |       ).toMatchObject({ ok: true })
  154 |       view = await current(page)
  155 |       expect(
  156 |         await page.evaluate(
  157 |           (request) =>
  158 |             (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.rateAndAdvance(
  159 |               request,
  160 |             ),
  161 |           { requestId: randomUUID(), cursor: cursor(), draft, rating: '不熟' as const },
  162 |         ),
```