import { randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import type { ElectronApplication, Page } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import type { StartPractice } from '../../src/shared/contracts/practice'
import { EMPTY_QUESTION_FILTERS } from '../../src/shared/contracts/question-filters'
import { expect, launchApplication, openPage, test } from './helpers'
import {
  captureHistory,
  historyBank,
  historySnapshot,
  importHistoryFiles,
  prepareHistory,
  stop,
  withHistoryDatabase,
} from './history-helpers'

const filters = {
  query: 'HISTORY-BODY-NEW',
  tag: '历史样本',
  difficulty: '基础' as const,
  mastery: 'unpracticed' as const,
  favoritesOnly: true,
}
async function read(page: Page) {
  const result = await page.evaluate(() =>
    (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
  )
  if (!result.ok || !result.value) throw new Error('测试活动轮读取失败。')
  return result.value
}
async function start(page: Page, input: StartPractice) {
  return page.evaluate(
    (request) => (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.start(request),
    input,
  )
}
async function close(application: ElectronApplication) {
  const finished = application.waitForEvent('close')
  await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.close())
  await finished
}
async function prepare(directory: string, project: string) {
  const launched = await prepareHistory(directory, project)
  try {
    await writeFile(launched.file, historyBank(true))
    await importHistoryFiles(launched.application, launched.page, [launched.file])
    for (const questionId of ['q-1', 'q-2']) {
      const result = await launched.page.evaluate(
        (questionId) =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.library.setFavorite({
            topicId: 'history-a',
            questionId,
            favorite: true,
          }),
        questionId,
      )
      expect(result.ok).toBe(true)
    }
    return launched
  } catch (error) {
    await stop(launched.application)
    throw error
  }
}

for (const mode of ['sequential', 'random'] as const) {
  test(`${mode} 建轮原筛选重开保持，修改首页与题库不重抽固定队列`, async ({
    testDataDirectory,
  }, info) => {
    const { application, page, file } = await prepare(testDataDirectory, info.project.name)
    let reopened: ElectronApplication | undefined
    try {
      await openPage(page, '开始练习')
      await page.getByLabel('练习模式', { exact: true }).selectOption(mode)
      await page.getByLabel('练习专题', { exact: true }).selectOption('history-a')
      await page.getByLabel('本轮题数', { exact: true }).selectOption('all')
      await page.getByText('筛选练习题目', { exact: true }).click()
      await page.getByRole('searchbox', { name: '练习搜索' }).fill(`  ${filters.query}  `)
      await page.getByLabel('练习标签', { exact: true }).fill(` ${filters.tag} `)
      await page.getByLabel('练习难度', { exact: true }).selectOption('基础')
      await page.getByLabel('练习自评状态', { exact: true }).selectOption('unpracticed')
      await page.getByLabel('练习只看收藏', { exact: true }).check()
      await expect(page.getByText('匹配 2 题', { exact: true })).toBeVisible()
      await page.getByRole('button', { name: '开始练习', exact: true }).click()
      const initial = await read(page)
      expect(initial.session).toMatchObject({ mode, topicId: 'history-a', filters, total: 2 })
      await page.getByRole('textbox', { name: '我的答案', exact: true }).fill('原轮第一题作答')
      await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
      await page.getByRole('button', { name: '掌握', exact: true }).click()
      await expect(page.getByLabel('练习进度')).toContainText('第 2 / 2')
      const draft = '筛选快照重开草稿\nint original = 6;'
      await page.getByRole('textbox', { name: '我的答案', exact: true }).fill(draft)
      await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
      await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
      const original = await read(page)
      for (const questionId of ['q-1', 'q-2']) {
        expect(
          await page.evaluate(
            (questionId) =>
              (globalThis as unknown as { desktop: DesktopApi }).desktop.library.setFavorite({
                topicId: 'history-a',
                questionId,
                favorite: false,
              }),
            questionId,
          ),
        ).toMatchObject({ ok: true })
      }
      await writeFile(file, historyBank())
      await importHistoryFiles(application, page, [file])
      await openPage(page, '开始练习')
      await page.getByText('筛选练习题目', { exact: true }).click()
      await expect(page.getByRole('searchbox', { name: '练习搜索' })).toBeVisible()
      await page.getByRole('searchbox', { name: '练习搜索' }).fill('首页后来编辑的新条件')
      await expect(page.getByText('匹配 0 题', { exact: true })).toBeVisible()
      const before = historySnapshot(testDataDirectory)
      await close(application)
      const next = await launchApplication(testDataDirectory, info.project.name)
      reopened = next.application
      await expect(next.page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
      expect(await read(next.page)).toEqual(original)
      expect(historySnapshot(testDataDirectory)).toEqual(before)
      const saved = next.page.getByLabel('本轮创建条件', { exact: true })
      await saved.getByText('本轮创建条件', { exact: true }).click()
      expect(await saved.locator('dd').allTextContents()).toEqual([
        'history-a',
        filters.query,
        filters.tag,
        '易（基础）',
        '未练习',
        '是',
      ])
      await saved.scrollIntoViewIfNeeded()
      await captureHistory(next.application, next.page, info, `original-filters-${mode}.png`)
      await next.page.getByRole('button', { name: '继续练习', exact: true }).click()
      await expect(next.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
        draft,
      )
      expect(await read(next.page)).toEqual(original)
      expect(historySnapshot(testDataDirectory)).toEqual(before)
      await info.attach(`filters-reopen-${mode}.json`, {
        body: JSON.stringify({
          initial,
          original,
          recovered: await read(next.page),
          before,
          after: historySnapshot(testDataDirectory),
        }),
        contentType: 'application/json',
      })
    } finally {
      await stop(application)
      if (reopened) await stop(reopened)
    }
  })
}

test('筛选快照与替换旧轮原子提交，失败回滚和丢响应重试不改快照', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name)
  try {
    const first = await start(page, {
      requestId: randomUUID(),
      topicId: 'history-a',
      count: 'all',
      replace: null,
    })
    if (!first.ok) throw new Error('测试原轮创建失败。')
    const input: StartPractice = {
      requestId: randomUUID(),
      topicId: 'history-a',
      count: 'all',
      mode: 'random',
      filters: { ...filters, query: ` ${filters.query} `, tag: ` ${filters.tag} ` },
      replace: {
        sessionId: first.value.sessionId,
        position: first.value.position,
        revision: first.value.revision,
      },
    }
    const before = historySnapshot(testDataDirectory)
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER fail_filter_queue BEFORE INSERT ON practice_items WHEN NEW.position=1 BEGIN SELECT RAISE(ABORT, '筛选队列测试失败'); END",
        ),
      false,
    )
    expect(await start(page, input)).toMatchObject({ ok: false, error: { code: 'WRITE_FAILED' } })
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER fail_filter_queue'), false)
    await application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('practice:start')
      let lost = false
      ipcMain.removeHandler('practice:start')
      ipcMain.handle('practice:start', async (...args) => {
        const result = await original(...args)
        if (!lost && result.ok) {
          lost = true
          return undefined
        }
        return result
      })
    })
    await expect(start(page, input)).rejects.toThrow()
    const afterCommit = historySnapshot(testDataDirectory)
    const created = await read(page)
    expect(created.session.filters).toEqual(filters)
    const retry = await start(page, input)
    expect(retry).toMatchObject({ ok: true, value: { sessionId: created.session.sessionId } })
    expect(historySnapshot(testDataDirectory)).toEqual(afterCommit)
    expect(
      await start(page, { ...input, filters: { ...filters, query: '不同的原请求' } }),
    ).toMatchObject({
      ok: false,
      error: { code: 'REQUEST_CONFLICT' },
    })
    expect(historySnapshot(testDataDirectory)).toEqual(afterCommit)
    await info.attach('filters-atomic-retry.json', {
      body: JSON.stringify({ before, afterCommit, created, retry }),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})

test('省略条件的新轮保存明确默认快照，旧请求形状重试仍幂等', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  try {
    const input = {
      requestId: randomUUID(),
      topicId: 'history-a',
      count: 'all' as const,
      replace: null,
    }
    const first = await start(page, input)
    expect(first.ok).toBe(true)
    expect((await read(page)).session.filters).toEqual(EMPTY_QUESTION_FILTERS)
    const before = historySnapshot(testDataDirectory)
    expect(await start(page, input)).toEqual(first)
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    const session = await read(page)
    withHistoryDatabase(testDataDirectory, (db) => {
      const row = db
        .prepare('SELECT filters_json FROM practice_sessions WHERE id=?')
        .get(session.session.sessionId)!
      expect(JSON.parse(String(row.filters_json))).toEqual(EMPTY_QUESTION_FILTERS)
    })
  } finally {
    await stop(application)
  }
})

test('损坏筛选快照不能冒充旧未知或默认条件，修复后原轮可读', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  try {
    expect(
      await start(page, {
        requestId: randomUUID(),
        topicId: 'history-a',
        count: 'all',
        replace: null,
      }),
    ).toMatchObject({ ok: true })
    const original = await read(page)
    const before = historySnapshot(testDataDirectory)
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db
          .prepare('UPDATE practice_sessions SET filters_json=? WHERE id=?')
          .run('{"query":"SNAPSHOT-PRIVATE-QUERY"}', original.session.sessionId),
      false,
    )
    const result = await page.evaluate(() =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
    )
    expect(result).toMatchObject({ ok: false, error: { code: 'DATABASE_UNAVAILABLE' } })
    await page.reload()
    await expect(page.getByRole('alert')).toContainText('无法读取练习')
    expect(await page.getByLabel('本轮创建条件', { exact: true }).count()).toBe(0)
    withHistoryDatabase(
      testDataDirectory,
      (db) => {
        db.prepare('UPDATE practice_sessions SET filters_json=? WHERE id=?').run(
          JSON.stringify(original.session.filters),
          original.session.sessionId,
        )
        for (const invalid of ['not-json', 'null', '[]', '"string"']) {
          expect(() =>
            db
              .prepare('UPDATE practice_sessions SET filters_json=? WHERE id=?')
              .run(invalid, original.session.sessionId),
          ).toThrow()
        }
      },
      false,
    )
    await page.getByRole('button', { name: '重试读取练习', exact: true }).click()
    await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
    expect(await read(page)).toEqual(original)
    expect(historySnapshot(testDataDirectory)).toEqual(before)
  } finally {
    await stop(application)
  }
})
