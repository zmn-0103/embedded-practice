import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, openPage, test } from './helpers'
import { captureHistory, stop, withHistoryDatabase } from './history-helpers'
import { controlRecords, previewSet, readSets } from './practice-control-helpers'
import { a, b, prepareUpdates, readUpdateRound, revealUpdateRound } from './content-updates-helpers'

test('更新筛选跨页勾选与固定题单保持，普通项须明确移除，随机仅含确认题并固定版本', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareUpdates(testDataDirectory, info, 24)
  try {
    await page.getByRole('checkbox', { name: '题库只看内容更新待复习', exact: true }).check()
    await page.getByRole('button', { name: '筛选题库', exact: true }).click()
    await page.getByRole('checkbox', { name: /^勾选题目：control-a \/ q-1 / }).check()
    await page
      .getByRole('navigation', { name: '题目分页', exact: true })
      .getByRole('button', { name: '下一页', exact: true })
      .click()
    await page.getByRole('checkbox', { name: /^勾选题目：control-b \/ q-1 / }).check()
    await page.getByRole('checkbox', { name: '题库只看内容更新待复习', exact: true }).uncheck()
    await page.getByRole('button', { name: '筛选题库', exact: true }).click()
    await page.getByRole('checkbox', { name: /^勾选题目：control-a \/ q-4 / }).check()
    await page.locator('.question-selection-panel > summary').click()
    const sets = page.getByLabel('勾选组卷与固定题单', { exact: true })
    await sets.getByLabel('题单名称', { exact: true }).fill('更新复习原题单')
    await sets.getByRole('button', { name: '保存为新题单', exact: true }).click()
    await expect(sets.getByRole('status')).toHaveText('固定题单已保存。')
    const setId = (await readSets(page))[0]!.setId
    const original = (await previewSet(page, { setId })).definition
    expect(original?.items).toEqual([a(1), b(1), a(4)])
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    await sets.getByRole('button', { name: '复习勾选中的更新题…', exact: true }).click()
    const confirm = page.getByLabel('确认勾选组卷', { exact: true })
    await expect(confirm).toContainText('不属于更新待复习')
    await expect(
      confirm.getByRole('button', { name: '确认开始更新题复习（3题）', exact: true }),
    ).toBeDisabled()
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
    await captureHistory(application, page, info, 'updated-selection-unavailable.png')
    await confirm.getByRole('button', { name: '从本轮移除不可用项', exact: true }).click()
    await confirm.getByLabel('组卷顺序', { exact: true }).selectOption('random')
    await expect(
      confirm.getByRole('button', { name: '确认开始更新题复习（2题）', exact: true }),
    ).toBeEnabled()
    await captureHistory(application, page, info, 'updated-selection-confirm.png')
    await confirm.getByRole('button', { name: '确认开始更新题复习（2题）', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toHaveText('第 1 / 2 题 · 随机练习')
    const round = await readUpdateRound(page)
    expect(round.session.selectionName).toContain('内容更新复习：')
    const queue = () =>
      withHistoryDatabase(testDataDirectory, (db) =>
        db
          .prepare(
            'SELECT q.topic_id AS topicId,q.question_id AS questionId,v.sequence FROM practice_items i JOIN questions q ON q.id=i.question_id JOIN question_versions v ON v.id=i.version_id WHERE i.session_id=? ORDER BY i.position',
          )
          .all(round.session.sessionId),
      )
    const fixed = queue()
    expect(fixed).toHaveLength(2)
    expect(fixed).toEqual(
      expect.arrayContaining([
        { ...a(1), sequence: 2 },
        { ...b(1), sequence: 2 },
      ]),
    )
    await expect(page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
    await expect(page.locator('.practice-reference-column .personal-note')).toHaveCount(0)
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await expect(page.getByLabel('练习参考答案', { exact: true })).toBeVisible()
    expect(queue()).toEqual(fixed)
    expect((await previewSet(page, { setId })).definition).toEqual(original)
    await page.getByRole('button', { name: '保存后返回', exact: true }).click()
    await openPage(page, '题库')
    await expect(page.getByText('已勾选 3 题', { exact: true })).toBeVisible()
    expect((await readSets(page))[0]?.count).toBe(3)
  } finally {
    await stop(application)
  }
})

test('更新复习开始响应丢失后按原请求重试，揭晓已消除待复习也从回执恢复同一轮', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareUpdates(testDataDirectory, info)
  try {
    await application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('practice:start')
      const commands: unknown[] = []
      Reflect.set(globalThis, '__updatedStartCommands', commands)
      ipcMain.removeHandler('practice:start')
      ipcMain.handle('practice:start', async (event, input) => {
        commands.push(structuredClone(input))
        const result = await original(event, input)
        return commands.length === 1 && result.ok ? { ok: true, value: {} } : result
      })
    })
    await page.getByRole('checkbox', { name: /^勾选题目：control-a \/ q-1 / }).check()
    await page.locator('.question-selection-panel > summary').click()
    await page.getByRole('button', { name: '复习勾选中的更新题…', exact: true }).click()
    const confirm = page.getByLabel('确认勾选组卷', { exact: true })
    await confirm.getByRole('button', { name: '确认开始更新题复习（1题）', exact: true }).click()
    await expect(
      confirm.getByRole('button', { name: '重试开始更新题复习', exact: true }),
    ).toBeEnabled()
    const committed = await readUpdateRound(page)
    expect(await revealUpdateRound(page)).toMatchObject({ ok: true })
    const noLongerPending = await page.evaluate(
      (items) =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.questionSets.preview({
          items,
          contentUpdatedOnly: true,
        }),
      [a(1)],
    )
    expect(noLongerPending).toMatchObject({
      ok: true,
      value: { items: [{ status: 'not-pending' }] },
    })
    await confirm.getByRole('button', { name: '重试开始更新题复习', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toHaveText('第 1 / 1 题 · 顺序练习')
    expect((await readUpdateRound(page)).session.sessionId).toBe(committed.session.sessionId)
    const commands = await application.evaluate(() =>
      Reflect.get(globalThis, '__updatedStartCommands'),
    )
    expect(commands).toHaveLength(2)
    expect(commands[1]).toEqual(commands[0])
    expect(commands[0].selected.contentUpdatedOnly).toBe(true)
    expect(
      withHistoryDatabase(testDataDirectory, (db) =>
        db.prepare('SELECT count(*) AS total FROM practice_sessions').get(),
      ),
    ).toEqual({ total: 1 })
  } finally {
    await stop(application)
  }
})
