import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Page } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import type { CategoryChange } from '../../src/shared/contracts/categories'
import type { ListRequest } from '../../src/shared/contracts/library-desktop'
import { expect, launchApplication } from './helpers'
import { importHistoryFiles, stop } from './history-helpers'

export function categoryBank(topic: string, count: number, archived = false) {
  return (
    `---\nschema_version: 1\ntopic_id: ${topic}\ntopic_title: ${topic === 'cat-a' ? '甲专题' : topic === 'cat-b' ? '乙专题' : '丙专题'}\n---\n\n` +
    Array.from({ length: count }, (_, i) => i + 1)
      .filter((n) => !archived || n !== 1)
      .map(
        (n) =>
          `## q-${n} | ${topic} 问题 ${n}\n\n标签：共同, 仅${topic}\n难度：${n === 1 ? '基础' : '进阶'}\n\n### 题目\n\nCATEGORY-BODY-${topic}-${n}\n\n### 参考答案\n\nCATEGORY-ANSWER-${topic}-${n}\n\n`,
      )
      .join('')
  )
}
export async function categoryList(page: Page, changes: Partial<ListRequest> = {}) {
  const result = await page.evaluate(
    (request) =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.library.listQuestions(request),
    { topicId: null, archived: false, page: 1, ...changes },
  )
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}
export async function categoryChange(page: Page, change: CategoryChange) {
  const result = await page.evaluate(
    (request) =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.library.updateCategory(request),
    change,
  )
  expect(result).toEqual({ ok: true, value: null })
}
export async function openCategoryManager(page: Page) {
  const manager = page.locator('.category-manager')
  if ((await manager.getAttribute('open')) === null)
    await manager.locator('summary').first().click()
  return manager
}
export async function addCategory(page: Page, title: string) {
  const manager = await openCategoryManager(page)
  const create = manager.getByRole('button', { name: '新增分类', exact: true })
  if ((await create.getAttribute('aria-expanded')) !== 'true') await create.click()
  await manager.getByLabel('新分类名称', { exact: true }).fill(title)
  await manager.getByRole('button', { name: '添加分类', exact: true }).click()
  await expect
    .poll(async () => (await categoryList(page)).categories.some((item) => item.title === title))
    .toBe(true)
  await expect(manager.getByRole('button', { name: '添加分类', exact: true })).toBeDisabled()
  const found = (await categoryList(page)).categories.find((item) => item.title === title)
  expect(found).toBeDefined()
  await manager.getByRole('button', { name: '关闭分类管理', exact: true }).click()
  return found!.categoryId
}
export async function assignTopic(page: Page, topicId: string, categoryId: string | null) {
  const manager = await openCategoryManager(page)
  const assign = manager.getByRole('button', { name: '调整专题归属', exact: true })
  if ((await assign.getAttribute('aria-expanded')) !== 'true') await assign.click()
  await manager.getByLabel('调整归属的专题', { exact: true }).selectOption(topicId)
  await manager.getByLabel('归入分类', { exact: true }).selectOption(categoryId ?? '')
  await manager.getByRole('button', { name: '保存专题归属', exact: true }).click()
  await expect
    .poll(
      async () =>
        (await categoryList(page)).topics.find((topic) => topic.topicId === topicId)?.categoryId,
    )
    .toBe(categoryId)
  await expect(manager.getByRole('button', { name: '保存专题归属', exact: true })).toBeEnabled()
  await manager.getByRole('button', { name: '关闭分类管理', exact: true }).click()
}
export async function prepareCategories(directory: string, project: string) {
  const folder = join(directory, '分类 中文样本')
  await mkdir(folder)
  const paths = ['cat-a', 'cat-b', 'cat-c'].map((topic) => join(folder, `${topic}.md`))
  for (const [i, path] of paths.entries())
    await writeFile(path, categoryBank(['cat-a', 'cat-b', 'cat-c'][i]!, i === 2 ? 1 : 2))
  const instance = await launchApplication(directory, project, '题库')
  try {
    await importHistoryFiles(instance.application, instance.page, paths)
    const initial = await categoryList(instance.page)
    expect(initial.categories).toEqual([])
    expect(initial.topics.every((topic) => topic.categoryId === null)).toBe(true)
    const first = await addCategory(instance.page, '板块 A')
    const second = await addCategory(instance.page, '板块 B')
    await assignTopic(instance.page, 'cat-a', first)
    await assignTopic(instance.page, 'cat-b', first)
    return { ...instance, first, second, paths }
  } catch (error) {
    await stop(instance.application)
    throw error
  }
}
