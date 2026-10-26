# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: category-tree.spec.ts >> 分类树：改名、检索、键盘选择、默认取消与移除保留全部专题/题目
- Location: tests\e2e\category-tree.spec.ts:13:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('navigation', { name: '题库分类导航', exact: true }).getByRole('button', { name: '题库分类：STM32 基础', exact: true })
    - locator resolved to <button type="button" aria-pressed="false" aria-label="题库分类：STM32 基础">STM32 基础（4题）</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <p>本地数据已就绪</p> from <section role="status" class="service-status status-ready">…</section> subtree intercepts pointer events
  - retrying click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <p aria-label="题库已选条件" class="filter-summary">全部题目，未限定其他条件</p> from <div class="library-controls">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <p>本地数据已就绪</p> from <section role="status" class="service-status status-ready">…</section> subtree intercepts pointer events
  - retrying click action
    - waiting 100ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <main tabindex="-1" id="main-content">…</main> intercepts pointer events
  - retrying click action
    - waiting 100ms
    14 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <p>本地数据已就绪</p> from <section role="status" class="service-status status-ready">…</section> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <p aria-label="题库已选条件" class="filter-summary">全部题目，未限定其他条件</p> from <div class="library-controls">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <p>本地数据已就绪</p> from <section role="status" class="service-status status-ready">…</section> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <main tabindex="-1" id="main-content">…</main> intercepts pointer events
     - retrying click action
       - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <p>本地数据已就绪</p> from <section role="status" class="service-status status-ready">…</section> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <p aria-label="题库已选条件" class="filter-summary">全部题目，未限定其他条件</p> from <div class="library-controls">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms

```

# Test source

```ts
  1   | import { writeFile } from 'node:fs/promises'
  2   | import { expect, openPage, test } from './helpers'
  3   | import { historySnapshot, importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
  4   | import {
  5   |   addCategory,
  6   |   categoryBank,
  7   |   categoryChange,
  8   |   categoryList,
  9   |   openCategoryManager,
  10  |   prepareCategories,
  11  | } from './category-helpers'
  12  | 
  13  | test('分类树：改名、检索、键盘选择、默认取消与移除保留全部专题/题目', async ({
  14  |   testDataDirectory,
  15  | }, info) => {
  16  |   const { application, page, first } = await prepareCategories(testDataDirectory, info.project.name)
  17  |   try {
  18  |     const before = historySnapshot(testDataDirectory)
  19  |     const manager = await openCategoryManager(page)
  20  |     await manager.getByRole('button', { name: '修改或移除分类', exact: true }).click()
  21  |     await manager.getByLabel('要修改的分类', { exact: true }).selectOption(first)
  22  |     await manager.getByLabel('分类新名称', { exact: true }).fill('STM32 基础')
  23  |     await manager.getByRole('button', { name: '保存分类名称', exact: true }).click()
  24  |     await expect
  25  |       .poll(
  26  |         async () =>
  27  |           (await categoryList(page)).categories.find((item) => item.categoryId === first)?.title,
  28  |       )
  29  |       .toBe('STM32 基础')
  30  |     const navigation = page.getByRole('navigation', { name: '题库分类导航', exact: true })
> 31  |     await navigation.getByRole('button', { name: '题库分类：STM32 基础', exact: true }).click()
      |                                                                                  ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
  32  |     await expect(page.getByText('共 4 题', { exact: true })).toBeVisible()
  33  |     await navigation.getByRole('searchbox', { name: '题库专题检索', exact: true }).fill('乙')
  34  |     await expect(
  35  |       navigation.getByRole('button', { name: '题库专题：甲专题', exact: true }),
  36  |     ).toHaveCount(0)
  37  |     await navigation.getByRole('button', { name: '题库专题：乙专题', exact: true }).focus()
  38  |     await navigation.getByRole('button', { name: '题库专题：乙专题', exact: true }).press('Enter')
  39  |     await expect(page.getByText('共 2 题', { exact: true })).toBeVisible()
  40  |     await expect(page.getByLabel('专题', { exact: true })).toHaveValue('cat-b')
  41  |     await navigation.getByRole('searchbox', { name: '题库专题检索', exact: true }).fill('')
  42  |     await navigation.getByRole('button', { name: '展开STM32 基础', exact: true }).click()
  43  |     await expect(
  44  |       navigation.getByRole('button', { name: '题库专题：甲专题', exact: true }),
  45  |     ).toBeVisible()
  46  |     await manager.locator('summary').click()
  47  |     await navigation.scrollIntoViewIfNeeded()
  48  |     await info.attach('category-tree.png', {
  49  |       body: await page.screenshot({ fullPage: true }),
  50  |       contentType: 'image/png',
  51  |     })
  52  |     await openCategoryManager(page)
  53  |     await manager.getByRole('button', { name: '移除分类', exact: true }).click()
  54  |     const confirmation = page.getByRole('alertdialog')
  55  |     await expect(confirmation.getByRole('button', { name: '取消移除', exact: true })).toBeFocused()
  56  |     await confirmation.getByRole('button', { name: '取消移除', exact: true }).click()
  57  |     expect((await categoryList(page)).categories.some((item) => item.categoryId === first)).toBe(
  58  |       true,
  59  |     )
  60  |     await manager.getByRole('button', { name: '移除分类', exact: true }).click()
  61  |     await page.getByRole('button', { name: '确认移除分类', exact: true }).click()
  62  |     await expect(page.getByText('所选分类已移除，请重新选择分类。', { exact: true })).toBeVisible()
  63  |     await expect(page.getByText('共 0 题', { exact: true })).toBeVisible()
  64  |     await navigation.getByRole('button', { name: /全部分类/ }).click()
  65  |     await expect(page.getByText('共 5 题', { exact: true })).toBeVisible()
  66  |     const after = await categoryList(page)
  67  |     expect(after.topics.every((item) => item.categoryId === null)).toBe(true)
  68  |     expect(after.categories).toHaveLength(1)
  69  |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  70  |     await categoryChange(page, { kind: 'delete', categoryId: first })
  71  |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  72  |   } finally {
  73  |     await stop(application)
  74  |   }
  75  | })
  76  | 
  77  | test('分类范围：分类/专题/标签/难度/归档交集与候选，重导入保留归属和稳定身份', async ({
  78  |   testDataDirectory,
  79  | }, info) => {
  80  |   const { application, page, first, second, paths } = await prepareCategories(
  81  |     testDataDirectory,
  82  |     info.project.name,
  83  |   )
  84  |   try {
  85  |     const all = await categoryList(page)
  86  |     expect(all.total).toBe(5)
  87  |     expect(new Set(all.questions.map((item) => `${item.topicId}/${item.questionId}`)).size).toBe(5)
  88  |     const scope = { kind: 'category' as const, categoryId: first }
  89  |     const scoped = await categoryList(page, { category: scope })
  90  |     expect(scoped.total).toBe(4)
  91  |     expect([...scoped.tagOptions].sort()).toEqual(['共同', '仅cat-a', '仅cat-b'].sort())
  92  |     const filtered = await categoryList(page, {
  93  |       category: scope,
  94  |       filters: {
  95  |         query: '不匹配',
  96  |         tag: null,
  97  |         difficulty: '进阶',
  98  |         mastery: 'all',
  99  |         favoritesOnly: false,
  100 |       },
  101 |     })
  102 |     expect(filtered.total).toBe(0)
  103 |     expect(filtered.tagOptions).toEqual(scoped.tagOptions)
  104 |     expect((await categoryList(page, { category: scope, topicId: 'cat-c' })).total).toBe(0)
  105 |     expect(
  106 |       (await categoryList(page, { category: { kind: 'category', categoryId: second } })).total,
  107 |     ).toBe(0)
  108 |     expect((await categoryList(page, { category: { kind: 'uncategorized' } })).total).toBe(1)
  109 |     const versions = historySnapshot(testDataDirectory).versions
  110 |     await importHistoryFiles(application, page, [paths[0]!])
  111 |     expect(
  112 |       (await categoryList(page)).topics.find((item) => item.topicId === 'cat-a')?.categoryId,
  113 |     ).toBe(first)
  114 |     expect(historySnapshot(testDataDirectory).versions).toEqual(versions)
  115 |     await writeFile(paths[0]!, categoryBank('cat-a', 2, true))
  116 |     await importHistoryFiles(application, page, [paths[0]!])
  117 |     const archived = await categoryList(page, { category: scope, archived: true })
  118 |     expect(archived.total).toBe(1)
  119 |     expect(archived.questions[0]).toMatchObject({
  120 |       topicId: 'cat-a',
  121 |       questionId: 'q-1',
  122 |       archived: true,
  123 |     })
  124 |     expect(archived.tagOptions).toEqual(
  125 |       ['仅cat-a', '共同'].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
  126 |     )
  127 |     expect((await categoryList(page, { category: scope })).total).toBe(3)
  128 |     expect(historySnapshot(testDataDirectory).versions).toEqual(versions)
  129 |   } finally {
  130 |     await stop(application)
  131 |   }
```