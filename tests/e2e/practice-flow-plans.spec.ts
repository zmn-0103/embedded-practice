import { randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { EMPTY_QUESTION_FILTERS } from '../../src/shared/contracts/question-filters'
import { expect, openPage, test } from './helpers'
import { categoryList } from './category-helpers'
import { historySnapshot, importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
import { changePlan, openPlans, planOptions, readPlans, savePlan } from './practice-plan-helpers'
import {
  endFlow,
  finishFlow,
  flowBank,
  flowQueue,
  prepareFlow,
  startFlow,
} from './practice-flow-helpers'

async function rateFirst(page: Page, rating: '不会' | '掌握') {
  return page.evaluate(async (rating) => {
    const api = (globalThis as unknown as { desktop: DesktopApi }).desktop.practice
    const read = await api.read({ sessionId: null })
    if (!read.ok || !read.value?.item) throw new Error('缺少活动题目')
    const { session, item } = read.value
    const revealed = await api.reveal({
      requestId: crypto.randomUUID(),
      cursor: {
        sessionId: session.sessionId,
        position: session.position,
        revision: session.revision,
      },
      draft: item.draft,
    })
    if (!revealed.ok) throw new Error(revealed.error.message)
    return api.rateAndAdvance({
      requestId: crypto.randomUUID(),
      cursor: {
        sessionId: revealed.value.sessionId,
        position: revealed.value.position,
        revision: revealed.value.revision,
      },
      draft: item.draft,
      rating,
    })
  }, rating)
}

test('联合筛选列表/匹配数/建轮一致，旧自评排除，练旧版本不覆盖最新版本已掌握', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareFlow(testDataDirectory, info)
  try {
    const source = await finishFlow(page)
    const filters = { ...EMPTY_QUESTION_FILTERS, mastery: '不会＋不熟' as const }
    const list = await categoryList(page, { filters })
    expect(list.total).toBe(2)
    expect(list.questions.map((q) => q.questionId)).toEqual(['q-1', 'q-2'])
    const started = await startFlow(page, {
      requestId: randomUUID(),
      topicId: 'flow-main',
      count: 10,
      replace: null,
      filters,
    })
    if (!started.ok) throw new Error(started.error.message)
    expect(started.value.total).toBe(2)
    expect(
      flowQueue(testDataDirectory, started.value.sessionId).map((row) => row['questionId']),
    ).toEqual(['q-1', 'q-2'])
    expect(await endFlow(page)).toMatchObject({ ok: true })
    expect((await categoryList(page, { filters: { ...filters, query: 'QUESTION-2' } })).total).toBe(
      1,
    )
    expect((await categoryList(page, { filters: { ...filters, favoritesOnly: true } })).total).toBe(
      0,
    )
    await writeFile(file, flowBank(true))
    await importHistoryFiles(application, page, [file])
    expect((await categoryList(page, { filters })).total).toBe(0)
    expect(
      await startFlow(page, {
        requestId: randomUUID(),
        topicId: 'flow-main',
        count: 'all',
        replace: null,
        filters: { ...EMPTY_QUESTION_FILTERS, query: 'FLOW-NEW-QUESTION-1' },
      }),
    ).toMatchObject({ ok: true, value: { total: 1 } })
    expect(await rateFirst(page, '掌握')).toMatchObject({ ok: true, value: { status: 'finished' } })
    const latestState = withHistoryDatabase(testDataDirectory, (db) =>
      db
        .prepare(
          'SELECT * FROM question_user_state WHERE question_id=(SELECT id FROM questions WHERE question_id=?)',
        )
        .get('q-1'),
    )
    expect(
      await startFlow(page, {
        requestId: randomUUID(),
        topicId: null,
        count: 'all',
        replace: null,
        repeat: { sessionId: source.session.sessionId, selection: 'unknown' },
      }),
    ).toMatchObject({ ok: true })
    expect(await rateFirst(page, '不会')).toMatchObject({ ok: true, value: { status: 'finished' } })
    expect(
      withHistoryDatabase(testDataDirectory, (db) =>
        db
          .prepare(
            'SELECT * FROM question_user_state WHERE question_id=(SELECT id FROM questions WHERE question_id=?)',
          )
          .get('q-1'),
      ),
    ).toEqual(latestState)
    expect((await categoryList(page, { filters })).total).toBe(0)
    expect((await categoryList(page, { filters: { ...filters, mastery: '掌握' } })).total).toBe(1)
  } finally {
    await stop(application)
  }
})

test('方案界面重命名/更新/另存及填入不建轮，联合条件持久化且原活动轮不变', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareFlow(testDataDirectory, info)
  try {
    await finishFlow(page)
    await page.reload()
    await openPage(page, '开始练习')
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    await page.getByRole('textbox', { name: '我的答案', exact: true }).fill('活动轮原草稿')
    await page.getByRole('button', { name: '保存并返回', exact: true }).click()
    const before = historySnapshot(testDataDirectory)
    const original = await savePlan(page, '原20题方案')
    const panel = await openPlans(page)
    await panel.getByLabel('选用练习方案', { exact: true }).selectOption(original.planId)
    await page.getByRole('button', { name: '练不会＋不熟', exact: true }).click()
    await page.getByLabel('练习模式', { exact: true }).selectOption('random')
    await page.getByLabel('本轮题数', { exact: true }).selectOption('10')
    await expect(page.getByText('匹配 2 题', { exact: true })).toBeVisible()
    const inputStyle = await panel.getByLabel('方案名称', { exact: true }).evaluate((input) => {
      const style = input.ownerDocument.defaultView!.getComputedStyle(input)
      return {
        background: style.backgroundColor,
        padding: style.padding,
        radius: style.borderRadius,
      }
    })
    await panel.getByRole('button', { name: '用当前条件更新方案…', exact: true }).click()
    expect(
      await panel.getByLabel('新方案名称', { exact: true }).evaluate((input) => {
        const style = input.ownerDocument.defaultView!.getComputedStyle(input)
        return {
          background: style.backgroundColor,
          padding: style.padding,
          radius: style.borderRadius,
        }
      }),
    ).toEqual(inputStyle)
    await panel.getByLabel('新方案名称', { exact: true }).fill('薄弱复习10')
    await info.attach('plans-edit-confirmation.png', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
    await panel.getByRole('button', { name: '确认更新方案', exact: true }).click()
    await expect(panel.getByRole('status')).toHaveText('练习方案已更新，当前练习保持。')
    const updated = (await readPlans(page))[0]!
    expect(updated).toMatchObject({
      planId: original.planId,
      name: '薄弱复习10',
      options: { mode: 'random', count: 10, filters: { mastery: '不会＋不熟' } },
    })
    await panel.getByRole('button', { name: '重命名方案…', exact: true }).click()
    await panel.getByLabel('新方案名称', { exact: true }).fill('面试薄弱题')
    await panel.getByRole('button', { name: '确认更新方案', exact: true }).click()
    await expect.poll(async () => (await readPlans(page))[0]?.name).toBe('面试薄弱题')
    expect((await readPlans(page))[0]?.options).toEqual(updated.options)
    await panel.getByRole('button', { name: '另存当前条件…', exact: true }).click()
    await panel.getByRole('button', { name: '保存当前条件为方案', exact: true }).click()
    await expect(panel.getByRole('status')).toHaveText('练习方案已保存。')
    const saved = await readPlans(page)
    expect(saved).toHaveLength(2)
    expect(new Set(saved.map((p) => p.planId)).size).toBe(2)
    expect(saved.every((p) => JSON.stringify(p.options) === JSON.stringify(updated.options))).toBe(
      true,
    )
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    const window = await application.browserWindow(page)
    await window.evaluate((window) => window.setContentSize(900, 800))
    await info.attach('plans-updated-narrow.png', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
    await page.reload()
    expect(await readPlans(page)).toEqual(saved)
    const reopened = await openPlans(page)
    await reopened.getByLabel('选用练习方案', { exact: true }).selectOption(original.planId)
    await reopened.getByRole('button', { name: '填入条件', exact: true }).click()
    await expect(page.getByText('匹配 2 题', { exact: true })).toBeVisible()
    expect(historySnapshot(testDataDirectory)).toEqual(before)
  } finally {
    await stop(application)
  }
})

test('方案更新原条件重试幂等、过期/同名/删除后编辑拒绝，真实写失败保留原方案', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareFlow(testDataDirectory, info)
  try {
    const original = { planId: randomUUID(), name: 'Origin', options: planOptions }
    expect(await changePlan(page, { kind: 'save', ...original })).toMatchObject({ ok: true })
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db
          .prepare('UPDATE practice_plans SET options_json=? WHERE plan_id=?')
          .run(
            JSON.stringify(Object.fromEntries(Object.entries(planOptions).reverse()), null, 2),
            original.planId,
          ),
      false,
    )
    const expected = { name: original.name, options: original.options }
    const update = {
      kind: 'update' as const,
      ...original,
      name: 'New',
      expected,
      options: {
        ...planOptions,
        count: 10 as const,
        filters: { ...EMPTY_QUESTION_FILTERS, mastery: '不会＋不熟' as const },
      },
    }
    for (let n = 0; n < 2; n++) expect(await changePlan(page, update)).toMatchObject({ ok: true })
    const after = await readPlans(page)
    expect(await changePlan(page, { ...update, name: 'Stale' })).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    })
    expect(
      await changePlan(page, {
        kind: 'save',
        planId: randomUUID(),
        name: 'new',
        options: planOptions,
      }),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } })
    const next = {
      ...update,
      name: 'AfterFailure',
      expected: { name: after[0]!.name, options: after[0]!.options },
    }
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER update_failure BEFORE UPDATE ON practice_plans BEGIN SELECT RAISE(ABORT,'plan update failure'); END",
        ),
      false,
    )
    expect(await changePlan(page, next)).toMatchObject({
      ok: false,
      error: { code: 'DATABASE_UNAVAILABLE' },
    })
    expect(await readPlans(page)).toEqual(after)
    withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER update_failure'), false)
    expect(await changePlan(page, next)).toMatchObject({ ok: true })
    expect(await changePlan(page, { kind: 'delete', planId: original.planId })).toMatchObject({
      ok: true,
    })
    expect(await changePlan(page, next)).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } })
    expect(await readPlans(page)).toEqual([])
  } finally {
    await stop(application)
  }
})

test('方案编辑已提交但回包丢失，锁定条件并按原名称/原条件重试，不重复另存', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareFlow(testDataDirectory, info)
  try {
    const original = await savePlan(page, '编辑前方案')
    const before = historySnapshot(testDataDirectory)
    const panel = await openPlans(page)
    await panel.getByLabel('选用练习方案', { exact: true }).selectOption(original.planId)
    await application.evaluate(({ ipcMain }) => {
      const handler = Reflect.get(ipcMain, '_invokeHandlers').get('practice-plans:change')
      Reflect.set(globalThis, '__editCommands', [])
      let drop = true
      ipcMain.removeHandler('practice-plans:change')
      ipcMain.handle('practice-plans:change', async (event, command) => {
        Reflect.get(globalThis, '__editCommands').push(structuredClone(command))
        const result = await handler(event, command)
        if (drop) {
          drop = false
          return { ok: true, value: 'invalid-reply' }
        }
        return result
      })
    })
    await panel.getByRole('button', { name: '重命名方案…', exact: true }).click()
    await panel.getByLabel('新方案名称', { exact: true }).fill('编辑后方案')
    await panel.getByRole('button', { name: '确认更新方案', exact: true }).click()
    await expect(panel.getByRole('alert')).toContainText('结果尚未确认')
    await expect(page.getByRole('button', { name: '开始练习', exact: true })).toBeDisabled()
    await panel.getByRole('button', { name: '重试原方案操作', exact: true }).click()
    await expect(panel.getByRole('status')).toHaveText('练习方案已更新，当前练习保持。')
    expect(await readPlans(page)).toEqual([{ ...original, name: '编辑后方案' }])
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    const commands = await application.evaluate(() => Reflect.get(globalThis, '__editCommands'))
    expect(commands).toHaveLength(2)
    expect(commands[1]).toEqual(commands[0])
    expect(commands[0]).toMatchObject({
      kind: 'update',
      planId: original.planId,
      name: '编辑后方案',
      expected: { name: original.name, options: original.options },
    })
  } finally {
    await stop(application)
  }
})
