# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: board-entry.spec.ts >> 板块入口：旧筛选慢响应不能覆盖新板块，计数读取失败明确重试且不写库
- Location: tests\e2e\board-entry.spec.ts:235:5

# Error details

```
Error: locator.click: Error: strict mode violation: locator('.category-manager').locator('summary') resolved to 2 elements:
    1) <summary>管理分类</summary> aka getByText('管理分类')
    2) <summary>未分类 · 3 个专题</summary> aka getByText('未分类 · 3 个专题')

Call log:
  - waiting for locator('.category-manager').locator('summary')

```

# Test source

```ts
  1  | import { mkdir, writeFile } from 'node:fs/promises'
  2  | import { join } from 'node:path'
  3  | import type { Page } from '@playwright/test'
  4  | import type { DesktopApi } from '../../src/shared/contracts/application'
  5  | import type { CategoryChange } from '../../src/shared/contracts/categories'
  6  | import type { ListRequest } from '../../src/shared/contracts/library-desktop'
  7  | import { expect, launchApplication } from './helpers'
  8  | import { importHistoryFiles, stop } from './history-helpers'
  9  | 
  10 | export function categoryBank(topic: string, count: number, archived = false) {
  11 |   return (
  12 |     `---\nschema_version: 1\ntopic_id: ${topic}\ntopic_title: ${topic === 'cat-a' ? '甲专题' : topic === 'cat-b' ? '乙专题' : '丙专题'}\n---\n\n` +
  13 |     Array.from({ length: count }, (_, i) => i + 1)
  14 |       .filter((n) => !archived || n !== 1)
  15 |       .map(
  16 |         (n) =>
  17 |           `## q-${n} | ${topic} 问题 ${n}\n\n标签：共同, 仅${topic}\n难度：${n === 1 ? '基础' : '进阶'}\n\n### 题目\n\nCATEGORY-BODY-${topic}-${n}\n\n### 参考答案\n\nCATEGORY-ANSWER-${topic}-${n}\n\n`,
  18 |       )
  19 |       .join('')
  20 |   )
  21 | }
  22 | export async function categoryList(page: Page, changes: Partial<ListRequest> = {}) {
  23 |   const result = await page.evaluate(
  24 |     (request) =>
  25 |       (globalThis as unknown as { desktop: DesktopApi }).desktop.library.listQuestions(request),
  26 |     { topicId: null, archived: false, page: 1, ...changes },
  27 |   )
  28 |   if (!result.ok) throw new Error(result.error.message)
  29 |   return result.value
  30 | }
  31 | export async function categoryChange(page: Page, change: CategoryChange) {
  32 |   const result = await page.evaluate(
  33 |     (request) =>
  34 |       (globalThis as unknown as { desktop: DesktopApi }).desktop.library.updateCategory(request),
  35 |     change,
  36 |   )
  37 |   expect(result).toEqual({ ok: true, value: null })
  38 | }
  39 | export async function openCategoryManager(page: Page) {
  40 |   const manager = page.locator('.category-manager')
> 41 |   if ((await manager.getAttribute('open')) === null) await manager.locator('summary').click()
     |                                                                                       ^ Error: locator.click: Error: strict mode violation: locator('.category-manager').locator('summary') resolved to 2 elements:
  42 |   return manager
  43 | }
  44 | export async function addCategory(page: Page, title: string) {
  45 |   const manager = await openCategoryManager(page)
  46 |   const create = manager.getByRole('button', { name: '新增分类', exact: true })
  47 |   if ((await create.getAttribute('aria-expanded')) !== 'true') await create.click()
  48 |   await manager.getByLabel('新分类名称', { exact: true }).fill(title)
  49 |   await manager.getByRole('button', { name: '添加分类', exact: true }).click()
  50 |   await expect
  51 |     .poll(async () => (await categoryList(page)).categories.some((item) => item.title === title))
  52 |     .toBe(true)
  53 |   await expect(manager.getByRole('button', { name: '添加分类', exact: true })).toBeDisabled()
  54 |   const found = (await categoryList(page)).categories.find((item) => item.title === title)
  55 |   expect(found).toBeDefined()
  56 |   return found!.categoryId
  57 | }
  58 | export async function assignTopic(page: Page, topicId: string, categoryId: string | null) {
  59 |   const manager = await openCategoryManager(page)
  60 |   const assign = manager.getByRole('button', { name: '调整专题归属', exact: true })
  61 |   if ((await assign.getAttribute('aria-expanded')) !== 'true') await assign.click()
  62 |   await manager.getByLabel('调整归属的专题', { exact: true }).selectOption(topicId)
  63 |   await manager.getByLabel('归入分类', { exact: true }).selectOption(categoryId ?? '')
  64 |   await manager.getByRole('button', { name: '保存专题归属', exact: true }).click()
  65 |   await expect
  66 |     .poll(
  67 |       async () =>
  68 |         (await categoryList(page)).topics.find((topic) => topic.topicId === topicId)?.categoryId,
  69 |     )
  70 |     .toBe(categoryId)
  71 |   await expect(manager.getByRole('button', { name: '保存专题归属', exact: true })).toBeEnabled()
  72 | }
  73 | export async function prepareCategories(directory: string, project: string) {
  74 |   const folder = join(directory, '分类 中文样本')
  75 |   await mkdir(folder)
  76 |   const paths = ['cat-a', 'cat-b', 'cat-c'].map((topic) => join(folder, `${topic}.md`))
  77 |   for (const [i, path] of paths.entries())
  78 |     await writeFile(path, categoryBank(['cat-a', 'cat-b', 'cat-c'][i]!, i === 2 ? 1 : 2))
  79 |   const instance = await launchApplication(directory, project, '题库')
  80 |   try {
  81 |     await importHistoryFiles(instance.application, instance.page, paths)
  82 |     const initial = await categoryList(instance.page)
  83 |     expect(initial.categories).toEqual([])
  84 |     expect(initial.topics.every((topic) => topic.categoryId === null)).toBe(true)
  85 |     const first = await addCategory(instance.page, '板块 A')
  86 |     const second = await addCategory(instance.page, '板块 B')
  87 |     await assignTopic(instance.page, 'cat-a', first)
  88 |     await assignTopic(instance.page, 'cat-b', first)
  89 |     return { ...instance, first, second, paths }
  90 |   } catch (error) {
  91 |     await stop(instance.application)
  92 |     throw error
  93 |   }
  94 | }
  95 | 
```