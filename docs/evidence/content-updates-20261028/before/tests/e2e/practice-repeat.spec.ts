import { randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import type { DesktopApi } from '../../src/shared/contracts/application'
import type { RepeatPractice, StartPractice } from '../../src/shared/contracts/practice'
import { expect, launchApplication, openPage, test } from './helpers'
import { importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
import {
  endFlow,
  finishFlow,
  flowBank,
  flowQueue,
  prepareFlow,
  startFlow,
} from './practice-flow-helpers'

test('再练只取来源轮五种状态，原内容/队列/作答保留，原请求重复不建副本', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareFlow(testDataDirectory, info)
  try {
    const source = await finishFlow(page)
    const original = flowQueue(testDataDirectory, source.session.sessionId)
    expect(source.session.counts).toEqual({
      revealed: 4,
      rated: 3,
      unrated: 1,
      skipped: 1,
      ratings: { 不会: 1, 不熟: 1, 掌握: 1 },
    })
    await writeFile(file, flowBank(true))
    await importHistoryFiles(application, page, [file])
    // 最新状态已变为掌握，也不能改变来源轮的“不会”；最新版本状态仍由联合筛选另测。
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "UPDATE question_user_state SET last_rating='掌握' WHERE last_rated_version_id IS NOT NULL",
        ),
      false,
    )
    const selections: [RepeatPractice['selection'], string[]][] = [
      ['unknown', ['q-1']],
      ['weak', ['q-1', 'q-2']],
      ['skipped', ['q-3']],
      ['unrated', ['q-4']],
      ['all', ['q-1', 'q-2', 'q-3', 'q-4', 'q-5', 'q-6']],
    ]
    for (const [selection, ids] of selections) {
      const command: StartPractice = {
        requestId: randomUUID(),
        topicId: null,
        count: 'all',
        replace: null,
        repeat: { sessionId: source.session.sessionId, selection },
      }
      const started = await startFlow(page, command)
      expect(started).toMatchObject({ ok: true, value: { total: ids.length } })
      if (!started.ok) throw new Error(started.error.message)
      expect(await startFlow(page, command)).toEqual(started)
      const queue = flowQueue(testDataDirectory, started.value.sessionId)
      expect(queue.map((row) => row['questionId'])).toEqual(ids)
      for (const row of queue) {
        const prior = original.find((item) => item['questionId'] === row['questionId'])!
        expect(row).toEqual({ ...prior, draft: '', revealed: null, rating: null, skipped: null })
      }
      const read = await page.evaluate(
        (sessionId) =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId }),
        started.value.sessionId,
      )
      expect(read).toMatchObject({
        ok: true,
        value: {
          session: { repeat: command.repeat },
          item: { revealed: false, draft: { text: '' } },
        },
      })
      if (read.ok) expect(read.value?.item).not.toHaveProperty('answer')
      expect(await endFlow(page)).toMatchObject({ ok: true })
    }
    expect(flowQueue(testDataDirectory, source.session.sessionId)).toEqual(original)
    expect(
      withHistoryDatabase(testDataDirectory, (db) =>
        db.prepare('SELECT count(*) AS n FROM practice_sessions').get(),
      ),
    ).toEqual({ n: 6 })
    expect(
      withHistoryDatabase(testDataDirectory, (db) => db.prepare('PRAGMA foreign_key_check').all()),
    ).toEqual([])
  } finally {
    await stop(application)
  }
})

test('再练随机只重排原题，重开保持；空结果/来源不存在/活动来源/写失败均不结束活动轮', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareFlow(testDataDirectory, info)
  try {
    const source = await finishFlow(page)
    const started = await startFlow(page, {
      requestId: randomUUID(),
      topicId: null,
      count: 'all',
      replace: null,
      mode: 'random',
      repeat: { sessionId: source.session.sessionId, selection: 'all' },
    })
    if (!started.ok) throw new Error(started.error.message)
    const original = flowQueue(testDataDirectory, started.value.sessionId)
    expect(original.map((row) => row['questionId']).sort()).toEqual([
      'q-1',
      'q-2',
      'q-3',
      'q-4',
      'q-5',
      'q-6',
    ])
    const replace = { sessionId: started.value.sessionId, position: 0, revision: 0 }
    for (const sourceId of [started.value.sessionId, randomUUID()]) {
      expect(
        await startFlow(page, {
          requestId: randomUUID(),
          topicId: null,
          count: 'all',
          replace,
          repeat: { sessionId: sourceId, selection: 'weak' },
        }),
      ).toMatchObject({ ok: false })
      expect(flowQueue(testDataDirectory, started.value.sessionId)).toEqual(original)
    }
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER repeat_failure BEFORE INSERT ON practice_items BEGIN SELECT RAISE(ABORT,'repeat failure'); END",
        ),
      false,
    )
    const failed: StartPractice = {
      requestId: randomUUID(),
      topicId: null,
      count: 'all',
      replace,
      repeat: { sessionId: source.session.sessionId, selection: 'weak' },
    }
    expect(await startFlow(page, failed)).toMatchObject({
      ok: false,
      error: { code: 'WRITE_FAILED' },
    })
    expect(
      withHistoryDatabase(testDataDirectory, (db) =>
        db.prepare('SELECT status FROM practice_sessions WHERE id=?').get(replace.sessionId),
      ),
    ).toEqual({ status: 'active' })
    withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER repeat_failure'), false)
    expect(await endFlow(page)).toMatchObject({ ok: true })
    expect(
      await startFlow(page, {
        ...failed,
        requestId: randomUUID(),
        replace: null,
        repeat: { sessionId: started.value.sessionId, selection: 'weak' },
      }),
    ).toMatchObject({ ok: false, error: { code: 'NO_QUESTIONS' } })
    const restart = await startFlow(page, {
      requestId: randomUUID(),
      topicId: null,
      count: 'all',
      replace: null,
      mode: 'random',
      repeat: { sessionId: source.session.sessionId, selection: 'all' },
    })
    if (!restart.ok) throw new Error(restart.error.message)
    const persistent = flowQueue(testDataDirectory, restart.value.sessionId)
    const closing = application.waitForEvent('close')
    await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.close())
    await closing
    const reopened = await launchApplication(testDataDirectory, info.project.name)
    try {
      expect(flowQueue(testDataDirectory, restart.value.sessionId)).toEqual(persistent)
      await reopened.page.getByRole('button', { name: '继续练习', exact: true }).click()
      await expect(reopened.page.getByLabel('练习进度')).toHaveText('第 1 / 6 题 · 随机练习')
      await expect(reopened.page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
    } finally {
      await stop(reopened.application)
    }
  } finally {
    await stop(application)
  }
})

test('结果页明确本轮范围/题数/旧版本，丢失开始响应可原请求重试且新轮隐藏答案', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareFlow(testDataDirectory, info)
  try {
    await page.getByLabel('本轮题数', { exact: true }).selectOption('all')
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    for (const rating of ['不会', '不熟', 'skip', null, '掌握'] as const) {
      if (rating === 'skip')
        await page.getByRole('button', { name: '跳过本题', exact: true }).click()
      else {
        await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
        await page.getByRole('button', { name: rating ?? '暂不评价，下一题', exact: true }).click()
      }
    }
    await page.getByRole('button', { name: '结束本轮', exact: true }).click()
    const repeat = page.getByRole('form', { name: '本轮题目再练', exact: true })
    await expect(repeat).toContainText('共 2 题')
    await expect(repeat).toContainText('其后更新或归档也不替换内容')
    await repeat.getByLabel('再练范围', { exact: true }).selectOption('skipped')
    await expect(repeat).toContainText('共 1 题')
    await repeat.getByLabel('再练范围', { exact: true }).selectOption('weak')
    await application.evaluate(({ ipcMain }) => {
      const handler = Reflect.get(ipcMain, '_invokeHandlers').get('practice:start')
      Reflect.set(globalThis, '__repeatCommands', [])
      let drop = true
      ipcMain.removeHandler('practice:start')
      ipcMain.handle('practice:start', async (event, command) => {
        Reflect.get(globalThis, '__repeatCommands').push(structuredClone(command))
        const result = await handler(event, command)
        if (drop) {
          drop = false
          return { ok: true, value: { broken: true } }
        }
        return result
      })
    })
    await info.attach('repeat-results.png', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
    await repeat.getByRole('button', { name: '确认再练 2 题', exact: true }).click()
    await expect(repeat.getByRole('alert')).toBeVisible()
    await expect(repeat.getByLabel('再练范围', { exact: true })).toBeDisabled()
    await expect(page.getByRole('button', { name: '返回首页', exact: true })).toBeDisabled()
    await repeat.getByRole('button', { name: '重试开始再练', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toHaveText('第 1 / 2 题 · 顺序练习')
    await expect(page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
    await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue('')
    const commands = await application.evaluate(() => Reflect.get(globalThis, '__repeatCommands'))
    expect(commands).toHaveLength(2)
    expect(commands[1]).toEqual(commands[0])
    expect(
      withHistoryDatabase(testDataDirectory, (db) =>
        db.prepare('SELECT count(*) AS n FROM practice_sessions').get(),
      ),
    ).toEqual({ n: 2 })
    await page.getByRole('button', { name: '保存并返回', exact: true }).click()
    await openPage(page, '开始练习')
    await page.getByText('本轮创建条件', { exact: true }).click()
    await expect(page.getByText(/以下为来源轮的创建条件/)).toBeVisible()
  } finally {
    await stop(application)
  }
})
