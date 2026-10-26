# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: category-tree.spec.ts >> 分类修订使导入旧预览失效，重新预览保留归属且才更新内容
- Location: tests\e2e\category-tree.spec.ts:209:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('.category-manager').getByRole('button', { name: '新增分类', exact: true })
    - locator resolved to <button type="button" aria-expanded="false">新增分类</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <h3 id="preview-title">导入预览</h3> from <div>…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <h3 id="preview-title">导入预览</h3> from <div>…</div> subtree intercepts pointer events
  2 × retrying click action
      - waiting 100ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <dialog open="" class="import-workspace" aria-labelledby="import-workspace-title">…</dialog> from <div>…</div> subtree intercepts pointer events
  14 × retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <h3 id="preview-title">导入预览</h3> from <div>…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <h3 id="preview-title">导入预览</h3> from <div>…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <dialog open="" class="import-workspace" aria-labelledby="import-workspace-title">…</dialog> from <div>…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <dialog open="" class="import-workspace" aria-labelledby="import-workspace-title">…</dialog> from <div>…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <h3 id="preview-title">导入预览</h3> from <div>…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms

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
  41 |   if ((await manager.getAttribute('open')) === null)
  42 |     await manager.locator('summary').first().click()
  43 |   return manager
  44 | }
  45 | export async function addCategory(page: Page, title: string) {
  46 |   const manager = await openCategoryManager(page)
  47 |   const create = manager.getByRole('button', { name: '新增分类', exact: true })
> 48 |   if ((await create.getAttribute('aria-expanded')) !== 'true') await create.click()
     |                                                                             ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
  49 |   await manager.getByLabel('新分类名称', { exact: true }).fill(title)
  50 |   await manager.getByRole('button', { name: '添加分类', exact: true }).click()
  51 |   await expect
  52 |     .poll(async () => (await categoryList(page)).categories.some((item) => item.title === title))
  53 |     .toBe(true)
  54 |   await expect(manager.getByRole('button', { name: '添加分类', exact: true })).toBeDisabled()
  55 |   const found = (await categoryList(page)).categories.find((item) => item.title === title)
  56 |   expect(found).toBeDefined()
  57 |   return found!.categoryId
  58 | }
  59 | export async function assignTopic(page: Page, topicId: string, categoryId: string | null) {
  60 |   const manager = await openCategoryManager(page)
  61 |   const assign = manager.getByRole('button', { name: '调整专题归属', exact: true })
  62 |   if ((await assign.getAttribute('aria-expanded')) !== 'true') await assign.click()
  63 |   await manager.getByLabel('调整归属的专题', { exact: true }).selectOption(topicId)
  64 |   await manager.getByLabel('归入分类', { exact: true }).selectOption(categoryId ?? '')
  65 |   await manager.getByRole('button', { name: '保存专题归属', exact: true }).click()
  66 |   await expect
  67 |     .poll(
  68 |       async () =>
  69 |         (await categoryList(page)).topics.find((topic) => topic.topicId === topicId)?.categoryId,
  70 |     )
  71 |     .toBe(categoryId)
  72 |   await expect(manager.getByRole('button', { name: '保存专题归属', exact: true })).toBeEnabled()
  73 | }
  74 | export async function prepareCategories(directory: string, project: string) {
  75 |   const folder = join(directory, '分类 中文样本')
  76 |   await mkdir(folder)
  77 |   const paths = ['cat-a', 'cat-b', 'cat-c'].map((topic) => join(folder, `${topic}.md`))
  78 |   for (const [i, path] of paths.entries())
  79 |     await writeFile(path, categoryBank(['cat-a', 'cat-b', 'cat-c'][i]!, i === 2 ? 1 : 2))
  80 |   const instance = await launchApplication(directory, project, '题库')
  81 |   try {
  82 |     await importHistoryFiles(instance.application, instance.page, paths)
  83 |     const initial = await categoryList(instance.page)
  84 |     expect(initial.categories).toEqual([])
  85 |     expect(initial.topics.every((topic) => topic.categoryId === null)).toBe(true)
  86 |     const first = await addCategory(instance.page, '板块 A')
  87 |     const second = await addCategory(instance.page, '板块 B')
  88 |     await assignTopic(instance.page, 'cat-a', first)
  89 |     await assignTopic(instance.page, 'cat-b', first)
  90 |     return { ...instance, first, second, paths }
  91 |   } catch (error) {
  92 |     await stop(instance.application)
  93 |     throw error
  94 |   }
  95 | }
  96 | 
```