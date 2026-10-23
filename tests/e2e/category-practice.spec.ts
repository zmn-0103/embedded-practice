import { randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import type { StartPractice } from '../../src/shared/contracts/practice'
import { expect, launchApplication, test } from './helpers'
import { categoryBank, categoryChange, categoryList, prepareCategories } from './category-helpers'
import { historySnapshot, importHistoryFiles, stop } from './history-helpers'
import { expectCounts, openRecords, readLearning } from './learning-helpers'

async function current(page: Page) {
  const result = await page.evaluate(() =>
    (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
  )
  if (!result.ok || !result.value) throw new Error('测试活动轮读取失败')
  return result.value
}
async function start(page: Page, input: StartPractice) {
  const result = await page.evaluate(
    (request) => (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.start(request),
    input,
  )
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}

test('分类练习：同事务快照、随机队列、移动/改名/移除后的原请求重试和正常重开保持', async ({
  testDataDirectory,
}, info) => {
  const prepared = await prepareCategories(testDataDirectory, info.project.name)
  let instance = { application: prepared.application, page: prepared.page }
  try {
    const input: StartPractice = {
      requestId: randomUUID(),
      category: { kind: 'category', categoryId: prepared.first },
      topicId: null,
      mode: 'random',
      count: 'all',
      replace: null,
    }
    const ack = await start(instance.page, input)
    const first = await current(instance.page)
    expect(first.session.category).toEqual({
      kind: 'category',
      categoryId: prepared.first,
      title: '板块 A',
    })
    expect(first.session.total).toBe(4)
    const firstIdentity = {
      topicId: first.item!.topicId,
      questionId: first.item!.questionId,
      favorite: true,
    }
    expect(
      await instance.page.evaluate(
        (request) =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.library.setFavorite(request),
        firstIdentity,
      ),
    ).toMatchObject({ ok: true })
    await instance.page.reload()
    await expect(instance.page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
    await instance.page.getByRole('button', { name: '继续练习', exact: true }).click()
    await instance.page
      .getByRole('textbox', { name: '我的答案', exact: true })
      .fill('分类原轮测试草稿一')
    await instance.page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await instance.page.getByRole('button', { name: '不熟', exact: true }).click()
    const draft = '分类验收专用，非用户答案\n    kept_queue();\n中文末行'
    await instance.page.getByRole('textbox', { name: '我的答案', exact: true }).fill(draft)
    await expect(instance.page.locator('.practice-save')).toHaveText('已保存')
    await instance.page.getByRole('button', { name: '返回首页', exact: true }).click()
    const before = historySnapshot(testDataDirectory)
    const position = await current(instance.page)
    for (const change of [
      { kind: 'rename' as const, categoryId: prepared.first, title: '已改名称' },
      { kind: 'assign' as const, topicId: 'cat-a', categoryId: prepared.second },
      { kind: 'assign' as const, topicId: 'cat-b', categoryId: prepared.second },
      { kind: 'delete' as const, categoryId: prepared.first },
    ]) {
      await categoryChange(instance.page, change)
      expect(historySnapshot(testDataDirectory)).toEqual(before)
    }
    expect(await start(instance.page, input)).toEqual(ack)
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    const replacement = await instance.page.evaluate(
      (request) =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.start(request),
      {
        ...input,
        requestId: randomUUID(),
        replace: {
          sessionId: position.session.sessionId,
          position: position.session.position,
          revision: position.session.revision,
        },
      },
    )
    expect(replacement).toMatchObject({ ok: false, error: { code: 'NO_QUESTIONS' } })
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    await instance.application.close()
    instance = await launchApplication(testDataDirectory, info.project.name)
    const details = instance.page.getByLabel('本轮创建条件', { exact: true })
    await details.locator('summary').click()
    await expect(details).toContainText('分类：板块 A')
    await instance.page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(instance.page.getByLabel('练习进度', { exact: true })).toContainText('第 2 / 4')
    await expect(instance.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      draft,
    )
    expect(await current(instance.page)).toEqual(position)
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    await info.attach('category-queue-reopened.png', {
      body: await instance.page.screenshot(),
      contentType: 'image/png',
    })
  } finally {
    await stop(instance.application)
  }
})

test('分类统计：同题多轮去重、当前版本/收藏与归档交集，题库下方保持同一固定范围', async ({
  testDataDirectory,
}, info) => {
  const { application, page, first, paths } = await prepareCategories(
    testDataDirectory,
    info.project.name,
  )
  try {
    let replace: StartPractice['replace'] = null
    for (let round = 0; round < 2; round++) {
      await start(page, {
        requestId: randomUUID(),
        topicId: 'cat-a',
        category: { kind: 'category', categoryId: first },
        mode: 'sequential',
        count: 'all',
        replace,
      })
      let view = await current(page)
      const draft = { revision: 0, text: '' }
      const cursor = () => ({
        sessionId: view.session.sessionId,
        position: view.session.position,
        revision: view.session.revision,
      })
      expect(
        await page.evaluate(
          (request) =>
            (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.reveal(request),
          { requestId: randomUUID(), cursor: cursor(), draft },
        ),
      ).toMatchObject({ ok: true })
      view = await current(page)
      expect(
        await page.evaluate(
          (request) =>
            (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.rateAndAdvance(
              request,
            ),
          { requestId: randomUUID(), cursor: cursor(), draft, rating: '不熟' as const },
        ),
      ).toMatchObject({ ok: true })
      view = await current(page)
      replace = cursor()
    }
    expect(
      await page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.library.setFavorite({
          topicId: 'cat-a',
          questionId: 'q-1',
          favorite: true,
        }),
      ),
    ).toMatchObject({ ok: true })
    expect(
      await readLearning(page, {
        category: { kind: 'category', categoryId: first },
        topicId: null,
        archived: false,
      }),
    ).toMatchObject({
      total: 4,
      revealed: 1,
      rated: 1,
      favorites: 1,
      ratings: { 不会: 0, 不熟: 1, 掌握: 0 },
    })
    await openRecords(page)
    await page.getByText('按分类查看学习记录', { exact: true }).click()
    await page.getByRole('button', { name: '学习记录分类：板块 A', exact: true }).click()
    await expectCounts(page, [4, 1, 1, 1, 0], [0, 1, 0])
    await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: '清空题库筛选', exact: true }).click()
    await expect(page.getByText('共 4 题', { exact: true })).toBeVisible()
    await expectCounts(page, [4, 1, 1, 1, 0], [0, 1, 0])
    await writeFile(paths[0]!, categoryBank('cat-a', 2, true))
    await importHistoryFiles(application, page, [paths[0]!])
    expect(
      (await categoryList(page)).topics.find((item) => item.topicId === 'cat-a')?.categoryId,
    ).toBe(first)
    expect(
      await readLearning(page, {
        category: { kind: 'category', categoryId: first },
        topicId: null,
        archived: false,
      }),
    ).toMatchObject({ total: 3, revealed: 0, rated: 0, favorites: 0 })
    await openRecords(page)
    await page.getByText('按分类查看学习记录', { exact: true }).click()
    await page.getByRole('button', { name: '学习记录分类：板块 A', exact: true }).click()
    await page.getByLabel('学习记录范围', { exact: true }).selectOption('archived')
    await expectCounts(page, [1, 1, 1, 1, 0], [0, 1, 0])
    await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
  } finally {
    await stop(application)
  }
})

test('分类统计：旧分类的晚到摘要不能覆盖新范围或下方题库', async ({ testDataDirectory }, info) => {
  const { application, page, first } = await prepareCategories(testDataDirectory, info.project.name)
  try {
    await openRecords(page)
    await page.getByText('按分类查看学习记录', { exact: true }).click()
    await application.evaluate(({ ipcMain }, id) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('learning:read')
      let hold = true
      ipcMain.removeHandler('learning:read')
      ipcMain.handle('learning:read', async (event, scope) => {
        const result = await original(event, scope)
        if (hold && scope.category?.categoryId === id) {
          hold = false
          await new Promise<void>((resolve) =>
            Reflect.set(globalThis, '__releaseCategorySummary', resolve),
          )
          Reflect.set(globalThis, '__categorySummaryDelivered', true)
        }
        return result
      })
    }, first)
    await page.getByRole('button', { name: '学习记录分类：板块 A', exact: true }).click()
    await expect
      .poll(() =>
        application.evaluate(() => typeof Reflect.get(globalThis, '__releaseCategorySummary')),
      )
      .toBe('function')
    await page.getByRole('button', { name: '学习记录分类：未分类', exact: true }).click()
    await expectCounts(page, [1, 0, 0, 0, 0], [0, 0, 0])
    await application.evaluate(() => Reflect.get(globalThis, '__releaseCategorySummary')())
    await expect
      .poll(() => application.evaluate(() => Reflect.get(globalThis, '__categorySummaryDelivered')))
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
    await expectCounts(page, [1, 0, 0, 0, 0], [0, 0, 0])
    await page.getByRole('button', { name: '清空题库筛选', exact: true }).click()
    await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /丙专题.*q-1/ })).toBeVisible()
  } finally {
    await application
      .evaluate(() => Reflect.get(globalThis, '__releaseCategorySummary')?.())
      .catch(() => {})
    await stop(application)
  }
})

for (const failed of [false, true]) {
  test(`分类正常关闭等待在途保存：${failed ? '失败返回窗口并保留原目标' : '成功后退出重开保持'}`, async ({
    testDataDirectory,
  }, info) => {
    const prepared = await prepareCategories(testDataDirectory, info.project.name)
    let instance = { application: prepared.application, page: prepared.page }
    try {
      await instance.application.evaluate(({ ipcMain, dialog }, fail) => {
        const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:update-category')
        let hold = true
        ipcMain.removeHandler('library:update-category')
        ipcMain.handle('library:update-category', async (event, request) => {
          if (hold && request.kind === 'create' && request.title === '关闭等待分类') {
            hold = false
            const result = fail
              ? { ok: false, error: { code: 'DATABASE_UNAVAILABLE', message: '定向分类保存失败' } }
              : await original(event, request)
            await new Promise<void>((resolve) =>
              Reflect.set(globalThis, '__releaseCategorySave', resolve),
            )
            return result
          }
          return original(event, request)
        })
        dialog.showMessageBox = (async (...args: unknown[]) => {
          const options = args[args.length - 1] as { defaultId: number; buttons: string[] }
          if (options.defaultId !== 0 || options.buttons[0] !== '返回窗口')
            throw new Error('关闭确认默认项不符合预期')
          return { response: 0, checkboxChecked: false }
        }) as typeof dialog.showMessageBox
      }, failed)
      await instance.page.evaluate(() => {
        ;(globalThis as unknown as { desktop: DesktopApi }).desktop.practice.onBeforeClose(() => {
          Reflect.set(globalThis, '__categoryCloseSeen', true)
        })
      })
      const manager = instance.page.locator('.category-manager')
      await manager.getByLabel('新分类名称', { exact: true }).fill('关闭等待分类')
      await manager.getByRole('button', { name: '添加分类', exact: true }).click()
      await expect
        .poll(() =>
          instance.application.evaluate(
            () => typeof Reflect.get(globalThis, '__releaseCategorySave'),
          ),
        )
        .toBe('function')
      await expect(
        instance.page.getByRole('link', { name: '设置与数据', exact: true }),
      ).toHaveAttribute('aria-disabled', 'true')
      await instance.application.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0]!.close(),
      )
      await expect
        .poll(() => instance.page.evaluate(() => Reflect.get(globalThis, '__categoryCloseSeen')))
        .toBe(true)
      expect(instance.application.windows()).toHaveLength(1)
      if (failed) {
        await instance.application.evaluate(() =>
          Reflect.get(globalThis, '__releaseCategorySave')(),
        )
        await expect(manager.getByRole('alert')).toContainText('定向分类保存失败')
        await expect(
          instance.page.getByRole('link', { name: '设置与数据', exact: true }),
        ).toHaveAttribute('aria-disabled', 'false')
        await expect(manager.getByLabel('新分类名称', { exact: true })).toHaveValue('关闭等待分类')
        await manager.getByRole('button', { name: '添加分类', exact: true }).click()
        await expect
          .poll(async () =>
            (await categoryList(instance.page)).categories.some(
              (item) => item.title === '关闭等待分类',
            ),
          )
          .toBe(true)
      } else {
        const exited = instance.application.waitForEvent('close')
        await instance.application.evaluate(() =>
          Reflect.get(globalThis, '__releaseCategorySave')(),
        )
        await exited
        instance = await launchApplication(testDataDirectory, info.project.name, '题库')
        expect(
          (await categoryList(instance.page)).categories.some(
            (item) => item.title === '关闭等待分类',
          ),
        ).toBe(true)
      }
    } finally {
      await instance.application
        .evaluate(() => Reflect.get(globalThis, '__releaseCategorySave')?.())
        .catch(() => {})
      await stop(instance.application)
    }
  })
}
