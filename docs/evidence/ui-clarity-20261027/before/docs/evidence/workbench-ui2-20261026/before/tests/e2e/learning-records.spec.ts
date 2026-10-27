import { writeFile } from 'node:fs/promises'
import type { ElectronApplication } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, launchApplication, openPage, test } from './helpers'
import {
  beginHistoryPractice,
  captureHistory,
  historyBank,
  historySnapshot,
  importHistoryFiles,
  prepareHistory,
  readHistory,
  stop,
  withHistoryDatabase,
} from './history-helpers'
import { expectCounts, favoriteLearning, openRecords, readLearning } from './learning-helpers'

async function closeNormally(application: ElectronApplication) {
  const closed = application.waitForEvent('close')
  await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.close())
  await closed
}

test('学习总览空库、未知专题、严格输入与只读零结果', async ({ testDataDirectory }, info) => {
  const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  try {
    const before = historySnapshot(testDataDirectory)
    const empty = await readLearning(page)
    expect(empty).toEqual({
      category: { kind: 'all' },
      categories: [],
      topicId: null,
      archived: false,
      topics: [],
      total: 0,
      revealed: 0,
      rated: 0,
      favorites: 0,
      contentUpdated: 0,
      ratings: { 不会: 0, 不熟: 0, 掌握: 0 },
    })
    expect(await readLearning(page, { topicId: 'missing', archived: true })).toEqual({
      ...empty,
      topicId: 'missing',
      archived: true,
    })
    const invalid = await page.evaluate(() =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.learning.read({
        topicId: null,
        archived: false,
        sql: 'SELECT',
      } as { topicId: null; archived: false }),
    )
    expect(invalid).toMatchObject({ error: { code: 'INVALID_REQUEST' } })
    await openRecords(page)
    await expectCounts(page, [0, 0, 0, 0, 0], [0, 0, 0])
    expect(await page.content()).not.toContain('系统正确率')
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    await info.attach('learning-empty.json', {
      body: JSON.stringify({ empty, invalid, before }),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})

test('学习总览真实多轮去重、未评价、当前版本、旧状态和归档恢复', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareHistory(testDataDirectory, info.project.name, 3)
  try {
    const initial = await readLearning(page)
    expect(initial).toMatchObject({
      total: 3,
      revealed: 2,
      rated: 2,
      favorites: 0,
      contentUpdated: 0,
      ratings: { 不会: 1, 不熟: 1, 掌握: 0 },
    })
    const a = { topicId: 'history-a', archived: false }
    expect(await readLearning(page, a)).toMatchObject({
      total: 2,
      revealed: 1,
      rated: 1,
      ratings: { 不会: 0, 不熟: 1, 掌握: 0 },
    })
    // 真实新轮：第一题跳过，第二题空作答揭晓且暂不评价。
    await page.evaluate(async () => {
      const api = (globalThis as unknown as { desktop: DesktopApi }).desktop.practice
      const requestId = () => globalThis.crypto.randomUUID()
      const draft = { revision: 0, text: '' }
      const start = await api.start({
        requestId: requestId(),
        topicId: 'history-a',
        count: 'all',
        replace: null,
      })
      if (!start.ok) throw new Error(start.error.code)
      let cursor = {
        sessionId: start.value.sessionId,
        position: start.value.position,
        revision: start.value.revision,
      }
      const skip = await api.navigate({ requestId: requestId(), cursor, draft, direction: 'skip' })
      if (!skip.ok) throw new Error(skip.error.code)
      cursor = {
        sessionId: skip.value.sessionId,
        position: skip.value.position,
        revision: skip.value.revision,
      }
      const reveal = await api.reveal({ requestId: requestId(), cursor, draft })
      if (!reveal.ok) throw new Error(reveal.error.code)
      cursor = {
        sessionId: reveal.value.sessionId,
        position: reveal.value.position,
        revision: reveal.value.revision,
      }
      const rate = await api.rateAndAdvance({ requestId: requestId(), cursor, draft, rating: null })
      if (!rate.ok) throw new Error(rate.error.code)
    })
    expect(await readLearning(page, a)).toMatchObject({ total: 2, revealed: 2, rated: 1 })
    await favoriteLearning(page, 'history-a', true)
    const readonlyBefore = historySnapshot(testDataDirectory)
    const revealed = await readLearning(page)
    expect(revealed).toMatchObject({ revealed: 3, rated: 2, favorites: 1 })
    expect(historySnapshot(testDataDirectory)).toEqual(readonlyBefore)
    await writeFile(file, historyBank(true))
    await importHistoryFiles(application, page, [file])
    const updated = await readLearning(page, a)
    expect(updated).toMatchObject({
      total: 2,
      revealed: 0,
      rated: 0,
      favorites: 1,
      contentUpdated: 2,
      ratings: { 不会: 0, 不熟: 0, 掌握: 0 },
    })
    const versions = historySnapshot(testDataDirectory).versions
    await writeFile(file, historyBank(true, true))
    await importHistoryFiles(application, page, [file])
    const metadata = await readLearning(page, a)
    const { topics: _oldTopics, ...updatedCounts } = updated
    expect(metadata).toMatchObject(updatedCounts)
    expect(metadata.topics.find((topic) => topic.topicId === 'history-a')?.title).toBe('元数据专题')
    expect(historySnapshot(testDataDirectory).versions).toEqual(versions)
    const historyCount = (await readHistory(page, { questionId: 'q-2' })).total
    // 明确模拟旧状态：只有有效最新版自评，无最新版实际作答。
    withHistoryDatabase(
      testDataDirectory,
      (database) =>
        database.exec(`UPDATE question_user_state
      SET last_rating='掌握', last_rated_version_id=(SELECT current_version_id FROM questions WHERE topic_id='history-a' AND question_id='q-2')
      WHERE question_id=(SELECT id FROM questions WHERE topic_id='history-a' AND question_id='q-2')`),
      false,
    )
    const legacy = await readLearning(page, a)
    expect(legacy).toMatchObject({
      revealed: 0,
      rated: 1,
      contentUpdated: 1,
      ratings: { 不会: 0, 不熟: 0, 掌握: 1 },
    })
    expect((await readHistory(page, { questionId: 'q-2' })).total).toBe(historyCount)
    await writeFile(file, historyBank(true, false, true))
    await importHistoryFiles(application, page, [file])
    const archived = await readLearning(page, { topicId: 'history-a', archived: true })
    expect(archived).toMatchObject({
      total: 1,
      revealed: 0,
      rated: 0,
      favorites: 1,
      contentUpdated: 1,
    })
    expect(await readLearning(page, a)).toMatchObject({ total: 1, rated: 1, favorites: 0 })
    await writeFile(file, historyBank(true))
    await importHistoryFiles(application, page, [file])
    const restored = await readLearning(page, a)
    const { topics: _legacyTopics, ...legacyCounts } = legacy
    expect(restored).toMatchObject(legacyCounts)
    expect(restored.topics.find((topic) => topic.topicId === 'history-a')?.title).toBe('历史专题 A')
    expect(await readLearning(page, { topicId: 'history-a', archived: true })).toMatchObject({
      total: 0,
    })
    await info.attach('learning-version-counts.json', {
      body: JSON.stringify({
        initial,
        revealed,
        updated,
        legacy,
        archived,
        final: historySnapshot(testDataDirectory),
      }),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})

test('学习记录页专题范围、收藏刷新、主动历史与明暗布局', async ({ testDataDirectory }, info) => {
  const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  try {
    await favoriteLearning(page, 'history-a', true)
    await favoriteLearning(page, 'history-b', true)
    await openRecords(page)
    await expectCounts(page, [3, 2, 2, 2, 0], [1, 1, 0])
    expect(await page.content()).not.toMatch(/HISTORY-DRAFT|HISTORY-ANSWER/)
    await page.getByLabel('学习记录专题', { exact: true }).selectOption('history-a')
    await expectCounts(page, [2, 1, 1, 1, 0], [0, 1, 0])
    await expect(page.getByRole('checkbox', { name: '题库只看收藏', exact: true })).toBeChecked()
    await page
      .getByRole('complementary', { name: '题目列表' })
      .getByRole('button', { name: /q-1/ })
      .click()
    expect(await page.getByRole('region', { name: '本题历史', exact: true }).count()).toBe(0)
    await page.getByRole('button', { name: '查看本题历史', exact: true }).click()
    await expect(page.getByRole('region', { name: '本题历史' })).toContainText('共 3 条历史记录')
    await page.getByRole('button', { name: '取消收藏', exact: true }).click()
    await expectCounts(page, [2, 1, 1, 0, 0], [0, 1, 0])
    await expect(
      page.getByRole('complementary', { name: '题目列表' }).getByRole('button', { name: /q-1/ }),
    ).toHaveCount(0)
    await page.getByRole('button', { name: '清空题库筛选', exact: true }).click()
    await expect(
      page.getByRole('complementary', { name: '题目列表' }).getByRole('button', { name: /q-/ }),
    ).toHaveCount(2)
    expect(await page.getByRole('button', { name: /异专题题/ }).count()).toBe(0)
    for (const scheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: scheme })
      await page.getByRole('heading', { name: '学习记录', exact: true }).scrollIntoViewIfNeeded()
      await captureHistory(application, page, info, `learning-${scheme}.png`)
    }
    await page.getByLabel('学习记录范围', { exact: true }).selectOption('archived')
    await expectCounts(page, [0, 0, 0, 0, 0], [0, 0, 0])
    expect(await page.getByRole('region', { name: '本题历史', exact: true }).count()).toBe(0)
    await info.attach('learning-window-counts.json', {
      body: JSON.stringify(await readLearning(page)),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})

test('切页保留待确认预览，记录页关闭仍保存并可继续原轮', async ({ testDataDirectory }, info) => {
  const { application, page, file } = await prepareHistory(testDataDirectory, info.project.name)
  let reopened: ElectronApplication | undefined
  try {
    await writeFile(file, historyBank(true))
    await application.evaluate(({ dialog }, selected) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [selected] })
    }, file)
    await page.getByRole('button', { name: '导入题库', exact: true }).click()
    await expect(page.getByRole('heading', { name: '导入预览', exact: true })).toBeVisible()
    const preview = await page.getByRole('table', { name: '分专题变更摘要' }).textContent()
    const before = historySnapshot(testDataDirectory)
    await openRecords(page)
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    await openPage(page, '题库')
    await expect(page.getByRole('heading', { name: '导入预览', exact: true })).toBeVisible()
    expect(await page.getByRole('table', { name: '分专题变更摘要' }).textContent()).toBe(preview)
    await page.getByRole('button', { name: '确认导入', exact: true }).click()
    await expect(page.getByText(/^导入完成：/)).toBeVisible()
    await beginHistoryPractice(page)
    const navigation = page.getByRole('navigation', { name: '主要页面', exact: true })
    await expect(navigation).toBeVisible()
    await expect(navigation.getByRole('link')).toHaveCount(6)
    for (const link of await navigation.getByRole('link').all())
      await expect(link).toHaveAttribute('aria-disabled', 'true')
    await page
      .getByRole('textbox', { name: '我的答案', exact: true })
      .fill('学习记录切页前确认的草稿')
    await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
    await openRecords(page)
    const stored = historySnapshot(testDataDirectory)
    await closeNormally(application)
    expect(historySnapshot(testDataDirectory)).toEqual(stored)
    const next = await launchApplication(testDataDirectory, info.project.name)
    reopened = next.application
    await openRecords(next.page)
    await expectCounts(next.page, [3, 1, 1, 0, 2], [1, 0, 0])
    await openPage(next.page, '开始练习')
    await next.page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(next.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      '学习记录切页前确认的草稿',
    )
    expect(historySnapshot(testDataDirectory)).toEqual(stored)
    await info.attach('learning-page-reopen.json', {
      body: JSON.stringify({ stored, final: historySnapshot(testDataDirectory) }),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
    if (reopened) await stop(reopened)
  }
})
