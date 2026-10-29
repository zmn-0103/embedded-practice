import { writeFile } from 'node:fs/promises'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, openPage, test } from './helpers'
import { importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
import { controlBank, controlRecords } from './practice-control-helpers'
import { startFlow, endFlow } from './practice-flow-helpers'
import { a, prepareStudy, createStudyRound } from './study-helpers'
import { randomUUID } from 'node:crypto'

test('轮次分页/专题交集仅结束轮，未作答项也可复盘且不补造历史，历史跨页选两次', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareStudy(testDataDirectory, info)
  try {
    for (let n = 0; n < 23; n++) await createStudyRound(page, `独立记录${n}`)
    const unvisited = await startFlow(page, {
      requestId: randomUUID(),
      topicId: 'control-a',
      count: 'all',
      replace: null,
    })
    if (!unvisited.ok) throw new Error(unvisited.error.message)
    await endFlow(page)
    await startFlow(page, {
      requestId: randomUUID(),
      topicId: 'control-b',
      count: 'all',
      replace: null,
    })
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    const result = await page.evaluate(async (sessionId) => {
      const api = (globalThis as unknown as { desktop: DesktopApi }).desktop
      return {
        first: await api.study.listRounds({ topicId: null, page: 1 }),
        last: await api.study.listRounds({ topicId: null, page: 2 }),
        a: await api.study.listRounds({ topicId: 'control-a', page: 1 }),
        b: await api.study.listRounds({ topicId: 'control-b', page: 1 }),
        round: await api.study.readRound({ sessionId, page: 2 }),
        entry: await api.study.readEntry({ sessionId, position: 26 }),
        history: await api.history.getEntry({
          topicId: 'control-a',
          questionId: 'q-27',
          sessionId,
          position: 26,
        }),
      }
    }, unvisited.value.sessionId)
    expect(result.first).toMatchObject({
      ok: true,
      value: { total: 24, rounds: expect.any(Array) },
    })
    if (!result.first.ok || !result.last.ok) throw new Error('缺少轮次结果')
    expect(result.first.value.rounds).toHaveLength(20)
    expect(result.last.value.rounds).toHaveLength(4)
    expect(result.a).toMatchObject({ ok: true, value: { total: 24 } })
    expect(result.b).toMatchObject({ ok: true, value: { total: 23 } })
    expect(JSON.stringify(result.first)).not.toMatch(/独立记录|"body"|"answer"|"draft"/)
    expect(result.round).toMatchObject({ ok: true, value: { page: 2, items: expect.any(Array) } })
    if (result.round.ok) expect(result.round.value.items).toHaveLength(7)
    expect(result.entry).toMatchObject({
      ok: true,
      value: { position: 26, revealedAt: null, draft: { text: '', revision: 0 } },
    })
    if (result.entry.ok) expect(result.entry.value).not.toHaveProperty('answer')
    expect(result.history).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } })
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
    await page
      .locator('.question-row')
      .filter({ has: page.getByText('组卷题 A 1', { exact: true }) })
      .click()
    await page.getByRole('button', { name: '查看本题历史', exact: true }).click()
    const history = page.getByRole('region', { name: '本题历史', exact: true })
    await history
      .getByRole('checkbox', { name: /^选入作答对照/ })
      .first()
      .check()
    await history
      .getByRole('navigation', { name: '历史分页', exact: true })
      .getByRole('button', { name: '下一页', exact: true })
      .click()
    await history
      .getByRole('checkbox', { name: /^选入作答对照/ })
      .first()
      .check()
    await expect(history.getByRole('button', { name: '对照这两次作答', exact: true })).toBeEnabled()
    await expect(history.locator('.history-compare-controls')).toContainText('已选 2 / 2 条')
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
  } finally {
    await stop(application)
  }
})

test('学习记录按轮查看原范围和单题作答，读取失败可重试，查看不写学习记录', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareStudy(testDataDirectory, info)
  try {
    const round = await createStudyRound(page, '本轮保存的独立回答')
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    await openPage(page, '学习记录')
    await page.getByRole('tab', { name: '按轮次复盘', exact: true }).click()
    await expect(page.locator('.round-list > li')).toHaveCount(1)
    await application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('study:read-round')
      let fail = true
      ipcMain.removeHandler('study:read-round')
      ipcMain.handle('study:read-round', (event, input) => {
        if (fail) {
          fail = false
          return { ok: false, error: { code: 'DATABASE_UNAVAILABLE', message: '轮次定向读取失败' } }
        }
        return original(event, input)
      })
    })
    await page
      .locator(`.round-list [data-session-id="${round.sessionId}"]`)
      .getByRole('button', { name: '查看这一轮', exact: true })
      .click()
    await expect(page.getByRole('alert')).toContainText('轮次定向读取失败')
    await page.getByRole('button', { name: '重试读取本轮题目', exact: true }).click()
    const detail = page.getByLabel('按轮次复盘详情', { exact: true })
    await expect(detail).toContainText('题单：积累测试')
    await expect(detail.getByText('本轮保存的独立回答', { exact: true })).toHaveCount(0)
    await detail.getByRole('button', { name: '查看本轮第1题', exact: true }).click()
    await expect(detail.getByLabel('历史作答', { exact: true })).toContainText('本轮保存的独立回答')
    await expect(detail.getByLabel('历史参考答案', { exact: true })).toContainText(
      'CONTROL-OLD-ANSWER-control-a-1',
    )
    await detail.getByRole('button', { name: '查看本轮第2题', exact: true }).click()
    await expect(detail.getByLabel('历史参考答案', { exact: true })).toHaveCount(0)
    await expect(detail.getByLabel('历史题干', { exact: true })).toContainText(
      'CONTROL-OLD-BODY-control-b-1',
    )
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
    await info.attach('round-review.png', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
  } finally {
    await stop(application)
  }
})

test('同题两次作答主动确认才读，版本不同提示，自己的回答并列且不挂参考答案', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareStudy(testDataDirectory, info)
  try {
    await createStudyRound(page, '第一次只解释减少CPU负担', [a(1)])
    await writeFile(file, controlBank('control-a', 27, true))
    await importHistoryFiles(application, page, [file])
    await createStudyRound(page, '第二次补充配置步骤、完成条件和异常处理', [a(1)])
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    await application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('history:get-entry')
      Reflect.set(globalThis, '__compareReads', 0)
      ipcMain.removeHandler('history:get-entry')
      ipcMain.handle('history:get-entry', (event, input) => {
        Reflect.set(globalThis, '__compareReads', Reflect.get(globalThis, '__compareReads') + 1)
        return original(event, input)
      })
    })
    await page
      .locator('.question-row')
      .filter({ has: page.getByText('组卷题 A 1', { exact: true }) })
      .click()
    await page.getByRole('button', { name: '查看本题历史', exact: true }).click()
    const history = page.getByRole('region', { name: '本题历史', exact: true })
    await expect(history.getByRole('checkbox', { name: /^选入作答对照/ })).toHaveCount(2)
    await history
      .getByRole('checkbox', { name: /^选入作答对照/ })
      .nth(0)
      .check()
    await history
      .getByRole('checkbox', { name: /^选入作答对照/ })
      .nth(1)
      .check()
    expect(await application.evaluate(() => Reflect.get(globalThis, '__compareReads'))).toBe(0)
    await history.getByRole('button', { name: '对照这两次作答', exact: true }).click()
    const comparison = history.getByLabel('两次作答对照', { exact: true })
    await expect(comparison.getByRole('alert')).toContainText('题目版本不同')
    await expect(comparison).toContainText('第一次只解释减少CPU负担')
    await expect(comparison).toContainText('第二次补充配置步骤、完成条件和异常处理')
    await expect(comparison).not.toContainText('CONTROL-OLD-ANSWER')
    await expect(comparison).not.toContainText('CONTROL-NEW-ANSWER')
    expect(await application.evaluate(() => Reflect.get(globalThis, '__compareReads'))).toBe(2)
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
    await info.attach('answer-comparison.png', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
  } finally {
    await stop(application)
  }
})
