# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: category-tree.spec.ts >> 分类树：改名、检索、键盘选择、默认取消与移除保留全部专题/题目
- Location: tests\e2e\category-tree.spec.ts:12:5

# Error details

```
Error: locator.click: Error: strict mode violation: locator('.category-manager').locator('summary') resolved to 4 elements:
    1) <summary>管理分类</summary> aka getByText('管理分类')
    2) <summary>STM32 基础 · 2 个专题</summary> aka getByText('STM32 基础 · 2 个专题')
    3) <summary>板块 B · 0 个专题</summary> aka getByText('板块 B · 0 个专题')
    4) <summary>未分类 · 1 个专题</summary> aka getByText('未分类 · 1 个专题')

Call log:
  - waiting for locator('.category-manager').locator('summary')

```

# Test source

```ts
  1   | import { writeFile } from 'node:fs/promises'
  2   | import { expect, openPage, test } from './helpers'
  3   | import { historySnapshot, importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
  4   | import {
  5   |   categoryBank,
  6   |   categoryChange,
  7   |   categoryList,
  8   |   openCategoryManager,
  9   |   prepareCategories,
  10  | } from './category-helpers'
  11  | 
  12  | test('分类树：改名、检索、键盘选择、默认取消与移除保留全部专题/题目', async ({
  13  |   testDataDirectory,
  14  | }, info) => {
  15  |   const { application, page, first } = await prepareCategories(testDataDirectory, info.project.name)
  16  |   try {
  17  |     const before = historySnapshot(testDataDirectory)
  18  |     const manager = await openCategoryManager(page)
  19  |     await manager.getByRole('button', { name: '修改或移除分类', exact: true }).click()
  20  |     await manager.getByLabel('要修改的分类', { exact: true }).selectOption(first)
  21  |     await manager.getByLabel('分类新名称', { exact: true }).fill('STM32 基础')
  22  |     await manager.getByRole('button', { name: '保存分类名称', exact: true }).click()
  23  |     await expect
  24  |       .poll(
  25  |         async () =>
  26  |           (await categoryList(page)).categories.find((item) => item.categoryId === first)?.title,
  27  |       )
  28  |       .toBe('STM32 基础')
  29  |     const navigation = page.getByRole('navigation', { name: '题库分类导航', exact: true })
  30  |     await navigation.getByRole('button', { name: '题库分类：STM32 基础', exact: true }).click()
  31  |     await expect(page.getByText('共 4 题', { exact: true })).toBeVisible()
  32  |     await navigation.getByRole('searchbox', { name: '题库专题检索', exact: true }).fill('乙')
  33  |     await expect(
  34  |       navigation.getByRole('button', { name: '题库专题：甲专题', exact: true }),
  35  |     ).toHaveCount(0)
  36  |     await navigation.getByRole('button', { name: '题库专题：乙专题', exact: true }).focus()
  37  |     await navigation.getByRole('button', { name: '题库专题：乙专题', exact: true }).press('Enter')
  38  |     await expect(page.getByText('共 2 题', { exact: true })).toBeVisible()
  39  |     await expect(page.getByLabel('专题', { exact: true })).toHaveValue('cat-b')
  40  |     await navigation.getByRole('searchbox', { name: '题库专题检索', exact: true }).fill('')
  41  |     await navigation.getByRole('button', { name: '展开STM32 基础', exact: true }).click()
  42  |     await expect(
  43  |       navigation.getByRole('button', { name: '题库专题：甲专题', exact: true }),
  44  |     ).toBeVisible()
> 45  |     await manager.getByRole('button', { name: '关闭分类管理', exact: true }).click()
      |                                      ^ Error: locator.click: Error: strict mode violation: locator('.category-manager').locator('summary') resolved to 4 elements:
  46  |     await navigation.scrollIntoViewIfNeeded()
  47  |     await info.attach('category-tree.png', {
  48  |       body: await page.screenshot({ fullPage: true }),
  49  |       contentType: 'image/png',
  50  |     })
  51  |     await openCategoryManager(page)
  52  |     await manager.getByRole('button', { name: '移除分类', exact: true }).click()
  53  |     const confirmation = page.getByRole('alertdialog')
  54  |     await expect(confirmation.getByRole('button', { name: '取消移除', exact: true })).toBeFocused()
  55  |     await confirmation.getByRole('button', { name: '取消移除', exact: true }).click()
  56  |     expect((await categoryList(page)).categories.some((item) => item.categoryId === first)).toBe(
  57  |       true,
  58  |     )
  59  |     await manager.getByRole('button', { name: '移除分类', exact: true }).click()
  60  |     await page.getByRole('button', { name: '确认移除分类', exact: true }).click()
  61  |     await expect(page.getByText('所选分类已移除，请重新选择分类。', { exact: true })).toBeVisible()
  62  |     await expect(page.getByText('共 0 题', { exact: true })).toBeVisible()
  63  |     await navigation.getByRole('button', { name: /全部分类/ }).click()
  64  |     await expect(page.getByText('共 5 题', { exact: true })).toBeVisible()
  65  |     const after = await categoryList(page)
  66  |     expect(after.topics.every((item) => item.categoryId === null)).toBe(true)
  67  |     expect(after.categories).toHaveLength(1)
  68  |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  69  |     await categoryChange(page, { kind: 'delete', categoryId: first })
  70  |     expect(historySnapshot(testDataDirectory)).toEqual(before)
  71  |   } finally {
  72  |     await stop(application)
  73  |   }
  74  | })
  75  | 
  76  | test('分类范围：分类/专题/标签/难度/归档交集与候选，重导入保留归属和稳定身份', async ({
  77  |   testDataDirectory,
  78  | }, info) => {
  79  |   const { application, page, first, second, paths } = await prepareCategories(
  80  |     testDataDirectory,
  81  |     info.project.name,
  82  |   )
  83  |   try {
  84  |     const all = await categoryList(page)
  85  |     expect(all.total).toBe(5)
  86  |     expect(new Set(all.questions.map((item) => `${item.topicId}/${item.questionId}`)).size).toBe(5)
  87  |     const scope = { kind: 'category' as const, categoryId: first }
  88  |     const scoped = await categoryList(page, { category: scope })
  89  |     expect(scoped.total).toBe(4)
  90  |     expect([...scoped.tagOptions].sort()).toEqual(['共同', '仅cat-a', '仅cat-b'].sort())
  91  |     const filtered = await categoryList(page, {
  92  |       category: scope,
  93  |       filters: {
  94  |         query: '不匹配',
  95  |         tag: null,
  96  |         difficulty: '进阶',
  97  |         mastery: 'all',
  98  |         favoritesOnly: false,
  99  |       },
  100 |     })
  101 |     expect(filtered.total).toBe(0)
  102 |     expect(filtered.tagOptions).toEqual(scoped.tagOptions)
  103 |     expect((await categoryList(page, { category: scope, topicId: 'cat-c' })).total).toBe(0)
  104 |     expect(
  105 |       (await categoryList(page, { category: { kind: 'category', categoryId: second } })).total,
  106 |     ).toBe(0)
  107 |     expect((await categoryList(page, { category: { kind: 'uncategorized' } })).total).toBe(1)
  108 |     const versions = historySnapshot(testDataDirectory).versions
  109 |     await importHistoryFiles(application, page, [paths[0]!])
  110 |     expect(
  111 |       (await categoryList(page)).topics.find((item) => item.topicId === 'cat-a')?.categoryId,
  112 |     ).toBe(first)
  113 |     expect(historySnapshot(testDataDirectory).versions).toEqual(versions)
  114 |     await writeFile(paths[0]!, categoryBank('cat-a', 2, true))
  115 |     await importHistoryFiles(application, page, [paths[0]!])
  116 |     const archived = await categoryList(page, { category: scope, archived: true })
  117 |     expect(archived.total).toBe(1)
  118 |     expect(archived.questions[0]).toMatchObject({
  119 |       topicId: 'cat-a',
  120 |       questionId: 'q-1',
  121 |       archived: true,
  122 |     })
  123 |     expect(archived.tagOptions).toEqual(
  124 |       ['仅cat-a', '共同'].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
  125 |     )
  126 |     expect((await categoryList(page, { category: scope })).total).toBe(3)
  127 |     expect(historySnapshot(testDataDirectory).versions).toEqual(versions)
  128 |   } finally {
  129 |     await stop(application)
  130 |   }
  131 | })
  132 | 
  133 | test('分类事务：修订写入失败完整回滚，界面保留目标后重试，重复创建不新增', async ({
  134 |   testDataDirectory,
  135 | }, info) => {
  136 |   const { application, page, first, second } = await prepareCategories(
  137 |     testDataDirectory,
  138 |     info.project.name,
  139 |   )
  140 |   function snapshot() {
  141 |     return withHistoryDatabase(testDataDirectory, (db) => ({
  142 |       categories: db.prepare('SELECT * FROM categories ORDER BY category_id').all(),
  143 |       topics: db.prepare('SELECT * FROM topics ORDER BY topic_id').all(),
  144 |       revision: db.prepare('SELECT * FROM library_meta').all(),
  145 |     }))
```