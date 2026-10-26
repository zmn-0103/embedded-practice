import { writeFile } from 'node:fs/promises'
import { expect, openPage, test } from './helpers'
import { historySnapshot, importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
import {
  categoryBank,
  categoryChange,
  categoryList,
  openCategoryManager,
  prepareCategories,
} from './category-helpers'

test('分类树：改名、检索、键盘选择、默认取消与移除保留全部专题/题目', async ({
  testDataDirectory,
}, info) => {
  const { application, page, first } = await prepareCategories(testDataDirectory, info.project.name)
  try {
    const before = historySnapshot(testDataDirectory)
    const manager = await openCategoryManager(page)
    await manager.getByRole('button', { name: '修改或移除分类', exact: true }).click()
    await manager.getByLabel('要修改的分类', { exact: true }).selectOption(first)
    await manager.getByLabel('分类新名称', { exact: true }).fill('STM32 基础')
    await manager.getByRole('button', { name: '保存分类名称', exact: true }).click()
    await expect
      .poll(
        async () =>
          (await categoryList(page)).categories.find((item) => item.categoryId === first)?.title,
      )
      .toBe('STM32 基础')
    const navigation = page.getByRole('navigation', { name: '题库分类导航', exact: true })
    await navigation.getByRole('button', { name: '题库分类：STM32 基础', exact: true }).click()
    await expect(page.getByText('共 4 题', { exact: true })).toBeVisible()
    await navigation.getByRole('searchbox', { name: '题库专题检索', exact: true }).fill('乙')
    await expect(
      navigation.getByRole('button', { name: '题库专题：甲专题', exact: true }),
    ).toHaveCount(0)
    await navigation.getByRole('button', { name: '题库专题：乙专题', exact: true }).focus()
    await navigation.getByRole('button', { name: '题库专题：乙专题', exact: true }).press('Enter')
    await expect(page.getByText('共 2 题', { exact: true })).toBeVisible()
    await expect(page.getByLabel('专题', { exact: true })).toHaveValue('cat-b')
    await navigation.getByRole('searchbox', { name: '题库专题检索', exact: true }).fill('')
    await navigation.getByRole('button', { name: '展开STM32 基础', exact: true }).click()
    await expect(
      navigation.getByRole('button', { name: '题库专题：甲专题', exact: true }),
    ).toBeVisible()
    await manager.getByRole('button', { name: '关闭分类管理', exact: true }).click()
    await navigation.scrollIntoViewIfNeeded()
    await info.attach('category-tree.png', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
    await openCategoryManager(page)
    await manager.getByRole('button', { name: '移除分类', exact: true }).click()
    const confirmation = page.getByRole('alertdialog')
    await expect(confirmation.getByRole('button', { name: '取消移除', exact: true })).toBeFocused()
    await confirmation.getByRole('button', { name: '取消移除', exact: true }).click()
    expect((await categoryList(page)).categories.some((item) => item.categoryId === first)).toBe(
      true,
    )
    await manager.getByRole('button', { name: '移除分类', exact: true }).click()
    await page.getByRole('button', { name: '确认移除分类', exact: true }).click()
    await expect(page.getByText('所选分类已移除，请重新选择分类。', { exact: true })).toBeVisible()
    await expect(page.getByText('共 0 题', { exact: true })).toBeVisible()
    await navigation.getByRole('button', { name: /全部分类/ }).click()
    await expect(page.getByText('共 5 题', { exact: true })).toBeVisible()
    const after = await categoryList(page)
    expect(after.topics.every((item) => item.categoryId === null)).toBe(true)
    expect(after.categories).toHaveLength(1)
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    await categoryChange(page, { kind: 'delete', categoryId: first })
    expect(historySnapshot(testDataDirectory)).toEqual(before)
  } finally {
    await stop(application)
  }
})

test('分类范围：分类/专题/标签/难度/归档交集与候选，重导入保留归属和稳定身份', async ({
  testDataDirectory,
}, info) => {
  const { application, page, first, second, paths } = await prepareCategories(
    testDataDirectory,
    info.project.name,
  )
  try {
    const all = await categoryList(page)
    expect(all.total).toBe(5)
    expect(new Set(all.questions.map((item) => `${item.topicId}/${item.questionId}`)).size).toBe(5)
    const scope = { kind: 'category' as const, categoryId: first }
    const scoped = await categoryList(page, { category: scope })
    expect(scoped.total).toBe(4)
    expect([...scoped.tagOptions].sort()).toEqual(['共同', '仅cat-a', '仅cat-b'].sort())
    const filtered = await categoryList(page, {
      category: scope,
      filters: {
        query: '不匹配',
        tag: null,
        difficulty: '进阶',
        mastery: 'all',
        favoritesOnly: false,
      },
    })
    expect(filtered.total).toBe(0)
    expect(filtered.tagOptions).toEqual(scoped.tagOptions)
    expect((await categoryList(page, { category: scope, topicId: 'cat-c' })).total).toBe(0)
    expect(
      (await categoryList(page, { category: { kind: 'category', categoryId: second } })).total,
    ).toBe(0)
    expect((await categoryList(page, { category: { kind: 'uncategorized' } })).total).toBe(1)
    const versions = historySnapshot(testDataDirectory).versions
    await importHistoryFiles(application, page, [paths[0]!])
    expect(
      (await categoryList(page)).topics.find((item) => item.topicId === 'cat-a')?.categoryId,
    ).toBe(first)
    expect(historySnapshot(testDataDirectory).versions).toEqual(versions)
    await writeFile(paths[0]!, categoryBank('cat-a', 2, true))
    await importHistoryFiles(application, page, [paths[0]!])
    const archived = await categoryList(page, { category: scope, archived: true })
    expect(archived.total).toBe(1)
    expect(archived.questions[0]).toMatchObject({
      topicId: 'cat-a',
      questionId: 'q-1',
      archived: true,
    })
    expect(archived.tagOptions).toEqual(
      ['仅cat-a', '共同'].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    )
    expect((await categoryList(page, { category: scope })).total).toBe(3)
    expect(historySnapshot(testDataDirectory).versions).toEqual(versions)
  } finally {
    await stop(application)
  }
})

test('分类事务：修订写入失败完整回滚，界面保留目标后重试，重复创建不新增', async ({
  testDataDirectory,
}, info) => {
  const { application, page, first, second } = await prepareCategories(
    testDataDirectory,
    info.project.name,
  )
  function snapshot() {
    return withHistoryDatabase(testDataDirectory, (db) => ({
      categories: db.prepare('SELECT * FROM categories ORDER BY category_id').all(),
      topics: db.prepare('SELECT * FROM topics ORDER BY topic_id').all(),
      revision: db.prepare('SELECT * FROM library_meta').all(),
    }))
  }
  try {
    const before = snapshot()
    const protectedRows = historySnapshot(testDataDirectory)
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER block_category_revision BEFORE UPDATE ON library_meta BEGIN SELECT RAISE(ABORT,'定向阻止分类提交'); END",
        ),
      false,
    )
    for (const change of [
      { kind: 'create' as const, title: '失败创建' },
      { kind: 'rename' as const, categoryId: first, title: '失败改名' },
      { kind: 'assign' as const, topicId: 'cat-a', categoryId: second },
      { kind: 'delete' as const, categoryId: first },
    ]) {
      const result = await page.evaluate(
        (request) =>
          (
            globalThis as unknown as {
              desktop: import('../../src/shared/contracts/application').DesktopApi
            }
          ).desktop.library.updateCategory(request),
        change,
      )
      expect(result).toMatchObject({ ok: false, error: { code: 'DATABASE_UNAVAILABLE' } })
      expect(snapshot()).toEqual(before)
      expect(historySnapshot(testDataDirectory)).toEqual(protectedRows)
    }
    const manager = await openCategoryManager(page)
    const assign = manager.getByRole('button', { name: '调整专题归属', exact: true })
    if ((await assign.getAttribute('aria-expanded')) !== 'true') await assign.click()
    await manager.getByLabel('调整归属的专题', { exact: true }).selectOption('cat-a')
    await manager.getByLabel('归入分类', { exact: true }).selectOption(second)
    await manager.getByRole('button', { name: '保存专题归属', exact: true }).click()
    await expect(manager.getByRole('alert')).toContainText('题库服务暂不可用')
    await expect(manager.getByLabel('归入分类', { exact: true })).toHaveValue(second)
    expect(snapshot()).toEqual(before)
    withHistoryDatabase(
      testDataDirectory,
      (db) => db.exec('DROP TRIGGER block_category_revision'),
      false,
    )
    await manager.getByRole('button', { name: '保存专题归属', exact: true }).click()
    await expect
      .poll(
        async () =>
          (await categoryList(page)).topics.find((item) => item.topicId === 'cat-a')?.categoryId,
      )
      .toBe(second)
    const revision = snapshot().revision
    await categoryChange(page, { kind: 'create', title: '板块 A' })
    expect((await categoryList(page)).categories).toHaveLength(2)
    expect(snapshot().revision).toEqual(revision)
    expect(historySnapshot(testDataDirectory)).toEqual(protectedRows)
  } finally {
    await stop(application)
  }
})

test('分类修订使导入旧预览失效，重新预览保留归属且才更新内容', async ({
  testDataDirectory,
}, info) => {
  const { application, page, first, paths } = await prepareCategories(
    testDataDirectory,
    info.project.name,
  )
  try {
    await writeFile(
      paths[0]!,
      categoryBank('cat-a', 2).replace('CATEGORY-BODY-cat-a-1', 'CATEGORY-BODY-UPDATED'),
    )
    await application.evaluate(({ dialog }, file) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [file] })
    }, paths[0]!)
    await page.getByRole('button', { name: '导入题库', exact: true }).click()
    await expect(page.getByRole('heading', { name: '导入预览', exact: true })).toBeVisible()
    // 模态预览期间用实际IPC模拟另一操作导致修订变化，校验原预览保护。
    await categoryChange(page, { kind: 'create', title: '预览后新增分类' })
    await page.getByRole('button', { name: '确认导入', exact: true }).click()
    await expect(
      page.getByText('题库在预览后已变化，请重新预览再确认。', { exact: true }),
    ).toBeVisible()
    expect(historySnapshot(testDataDirectory).versions).toHaveLength(5)
    await page.getByRole('button', { name: '关闭导入工作区', exact: true }).click()
    await importHistoryFiles(application, page, [paths[0]!])
    expect(historySnapshot(testDataDirectory).versions).toHaveLength(6)
    expect(
      (await categoryList(page)).topics.find((item) => item.topicId === 'cat-a')?.categoryId,
    ).toBe(first)
  } finally {
    await stop(application)
  }
})

test('分类列表：离页旧响应晚到不能覆盖分类归属变化后的新结果', async ({
  testDataDirectory,
}, info) => {
  const { application, page, first, second } = await prepareCategories(
    testDataDirectory,
    info.project.name,
  )
  try {
    await page.getByRole('button', { name: '题库分类：板块 A', exact: true }).click()
    await expect(page.getByText('共 4 题', { exact: true })).toBeVisible()
    await openPage(page, '设置与数据')
    await application.evaluate(({ ipcMain }, id) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:list-questions')
      let hold = true
      ipcMain.removeHandler('library:list-questions')
      ipcMain.handle('library:list-questions', async (event, request) => {
        const result = await original(event, request)
        if (hold && request.category?.categoryId === id) {
          hold = false
          await new Promise<void>((resolve) =>
            Reflect.set(globalThis, '__releaseCategoryList', resolve),
          )
          Reflect.set(globalThis, '__categoryListDelivered', true)
        }
        return result
      })
    }, first)
    await openPage(page, '题库')
    await expect
      .poll(() =>
        application.evaluate(() => typeof Reflect.get(globalThis, '__releaseCategoryList')),
      )
      .toBe('function')
    await openPage(page, '设置与数据')
    await categoryChange(page, { kind: 'assign', topicId: 'cat-a', categoryId: second })
    await openPage(page, '题库')
    await expect(page.getByText('共 2 题', { exact: true })).toBeVisible()
    await application.evaluate(() => Reflect.get(globalThis, '__releaseCategoryList')())
    await expect
      .poll(() => application.evaluate(() => Reflect.get(globalThis, '__categoryListDelivered')))
      .toBe(true)
    await page.evaluate(
      () =>
        new Promise((done) =>
          Reflect.get(
            globalThis,
            'requestAnimationFrame',
          )(() => Reflect.get(globalThis, 'requestAnimationFrame')(done)),
        ),
    )
    await expect(page.getByText('共 2 题', { exact: true })).toBeVisible()
    expect(
      (
        await categoryList(page, { category: { kind: 'category', categoryId: first } })
      ).questions.every((item) => item.topicId === 'cat-b'),
    ).toBe(true)
  } finally {
    await application
      .evaluate(() => Reflect.get(globalThis, '__releaseCategoryList')?.())
      .catch(() => {})
    await stop(application)
  }
})
