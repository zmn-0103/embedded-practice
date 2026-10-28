import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, openPage, test } from './helpers'
import { historySnapshot, prepareHistory, stop, withHistoryDatabase } from './history-helpers'
import { expectCounts, openRecords, readLearning } from './learning-helpers'

test('学习记录真实读取失败不伪造零，修复后重试保留原数据', async ({ testDataDirectory }, info) => {
  const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  let renamed = false
  try {
    const before = historySnapshot(testDataDirectory)
    withHistoryDatabase(
      testDataDirectory,
      (database) => database.exec('ALTER TABLE question_user_state RENAME TO learning_fault_state'),
      false,
    )
    renamed = true
    await openPage(page, '学习记录')
    const records = page.getByRole('region', { name: '学习记录', exact: true })
    await expect(records.locator(':scope > [role="alert"]')).toContainText('题库服务暂不可用')
    expect(await page.getByLabel('当前版本学习总览', { exact: true }).count()).toBe(0)
    withHistoryDatabase(
      testDataDirectory,
      (database) => database.exec('ALTER TABLE learning_fault_state RENAME TO question_user_state'),
      false,
    )
    renamed = false
    await page.getByRole('button', { name: '重试读取学习记录', exact: true }).click()
    await expectCounts(page, [3, 2, 2, 0, 0], [1, 1, 0])
    await page.getByRole('button', { name: '重新读取题库', exact: true }).click()
    await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    const log = await readFile(join(testDataDirectory, 'logs/application.log'), 'utf8')
    expect(log).toContain('question_user_state')
    expect(log).not.toMatch(/HISTORY-DRAFT|HISTORY-ANSWER|OTHER-TOPIC-DRAFT/)
    await info.attach('learning-read-failure.json', {
      body: JSON.stringify({ before, restored: await readLearning(page), unchanged: true }),
      contentType: 'application/json',
    })
  } finally {
    try {
      if (renamed)
        withHistoryDatabase(
          testDataDirectory,
          (database) =>
            database.exec('ALTER TABLE learning_fault_state RENAME TO question_user_state'),
          false,
        )
    } finally {
      await stop(application)
    }
  }
})

test('学习总览晚到的旧专题响应不覆盖新专题或归档范围', async ({ testDataDirectory }, info) => {
  const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  try {
    await openRecords(page)
    const before = historySnapshot(testDataDirectory)
    await application.evaluate(({ ipcMain }) => {
      const handlers = Reflect.get(ipcMain, '_invokeHandlers') as Map<
        string,
        (...args: unknown[]) => Promise<unknown>
      >
      const original = handlers.get('learning:read')
      if (!original) throw new Error('缺少总览接口。')
      const control = { started: 0, returned: 0, hold: true, releases: [] as (() => void)[] }
      Reflect.set(globalThis, 'learningResponseControl', control)
      ipcMain.removeHandler('learning:read')
      ipcMain.handle('learning:read', async (...args) => {
        const result = await original(...args)
        const scope = args[1] as { topicId: string | null; archived: boolean }
        if (control.hold && scope.topicId === 'history-a') {
          control.started++
          await new Promise<void>((done) => control.releases.push(done))
          control.returned++
        }
        return result
      })
    })
    const state = () =>
      application.evaluate(() => {
        const control = Reflect.get(globalThis, 'learningResponseControl') as {
          started: number
          returned: number
        }
        return { started: control.started, returned: control.returned }
      })
    await page.getByLabel('学习记录专题', { exact: true }).selectOption('history-a')
    await expect.poll(async () => (await state()).started).toBeGreaterThan(0)
    expect(await page.getByLabel('当前版本学习总览', { exact: true }).count()).toBe(0)
    await page.getByLabel('学习记录专题', { exact: true }).selectOption('history-b')
    await expectCounts(page, [1, 1, 1, 0, 0], [1, 0, 0])
    await page.getByLabel('学习记录范围', { exact: true }).selectOption('archived')
    await expectCounts(page, [0, 0, 0, 0, 0], [0, 0, 0])
    const held = (await state()).started
    await application.evaluate(() => {
      const control = Reflect.get(globalThis, 'learningResponseControl') as {
        hold: boolean
        releases: (() => void)[]
      }
      control.hold = false
      control.releases.splice(0).forEach((done) => done())
    })
    await expect.poll(async () => (await state()).returned).toBe(held)
    await readLearning(page, { topicId: 'history-b', archived: true })
    await page.evaluate(
      () =>
        new Promise<void>((done) => {
          const browser = globalThis as unknown as {
            requestAnimationFrame: (callback: () => void) => void
          }
          browser.requestAnimationFrame(() => browser.requestAnimationFrame(() => done()))
        }),
    )
    await expectCounts(page, [0, 0, 0, 0, 0], [0, 0, 0])
    await expect(page.getByLabel('学习记录专题', { exact: true })).toHaveValue('history-b')
    await expect(page.getByLabel('学习记录范围', { exact: true })).toHaveValue('archived')
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    await info.attach('learning-late-response.json', {
      body: JSON.stringify({ held, returned: await state(), unchanged: true }),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})
