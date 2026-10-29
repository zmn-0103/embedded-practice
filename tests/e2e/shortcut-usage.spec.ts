import { randomUUID } from 'node:crypto'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, openPage, test } from './helpers'
import { stop, withHistoryDatabase } from './history-helpers'
import {
  a,
  changeSet,
  controlRecords,
  prepareControl,
  readSets,
  selectForPractice,
} from './practice-control-helpers'
import { changePlan, planOptions, readPlans } from './practice-plan-helpers'
import { endFlow, startFlow } from './practice-flow-helpers'

test('方案置顶优先和最近成功建轮排序，查看/改名/原请求重试不计使用', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info, 3)
  try {
    const options = { ...planOptions, mode: 'sequential' as const, count: 'all' as const }
    const first = { planId: randomUUID(), name: 'A常用', options }
    const recent = { planId: randomUUID(), name: 'Z最近', options }
    for (const plan of [first, recent])
      expect(await changePlan(page, { kind: 'save', ...plan })).toMatchObject({ ok: true })
    expect(
      await changePlan(page, { kind: 'pin', planId: first.planId, pinned: true }),
    ).toMatchObject({ ok: true })
    expect((await readPlans(page)).map((plan) => [plan.planId, plan.lastUsedAt])).toEqual([
      [first.planId, null],
      [recent.planId, null],
    ])
    const request = {
      ...options,
      requestId: randomUUID(),
      sourcePlanId: recent.planId,
      replace: null,
    }
    const started = await startFlow(page, request)
    expect(started).toMatchObject({ ok: true })
    const beforeRetry = await readPlans(page)
    expect(beforeRetry.map((plan) => plan.planId)).toEqual([first.planId, recent.planId])
    expect(beforeRetry[1]!.lastUsedAt).toMatch(/^\d{4}-/)
    expect(await startFlow(page, request)).toEqual(started)
    expect(await readPlans(page)).toEqual(beforeRetry)
    await changePlan(page, { kind: 'pin', planId: first.planId, pinned: false })
    expect((await readPlans(page)).map((plan) => plan.planId)).toEqual([
      recent.planId,
      first.planId,
    ])
    await endFlow(page)
    // 使用改动后的条件不是原方案，不能把原方案计为最近使用。
    const previousTime = (await readPlans(page))[1]!.lastUsedAt
    expect(
      await startFlow(page, {
        ...request,
        requestId: randomUUID(),
        sourcePlanId: first.planId,
        count: 10,
      }),
    ).toMatchObject({ ok: true })
    expect((await readPlans(page)).find((plan) => plan.planId === first.planId)!.lastUsedAt).toBe(
      previousTime,
    )
  } finally {
    await stop(application)
  }
})

test('最近使用写失败与建轮一起回滚并保留原活动轮，题单仅原成员完整开始时计使用', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info, 3)
  try {
    const setId = randomUUID()
    expect(
      await changeSet(page, { kind: 'save', setId, name: '面试题单', items: [a(1), a(2)] }),
    ).toMatchObject({ ok: true })
    const selection = {
      ...(await selectForPractice(page, [a(1), a(2)], '题单：面试题单')),
      sourceSetId: setId,
    }
    expect((await readSets(page))[0]!.lastUsedAt).toBeNull()
    await changeSet(page, { kind: 'pin', setId, pinned: true })
    const started = await startFlow(page, {
      requestId: randomUUID(),
      topicId: null,
      count: 'all',
      replace: null,
      selected: selection,
    })
    if (!started.ok) throw new Error(started.error.message)
    const recent = (await readSets(page))[0]!
    expect(recent).toMatchObject({ pinned: true })
    expect(recent.lastUsedAt).toMatch(/^\d{4}-/)
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER usage_failure BEFORE UPDATE OF last_used_at ON question_sets BEGIN SELECT RAISE(ABORT,'usage write'); END",
        ),
      false,
    )
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    const { sessionId, position, revision } = started.value
    const request = {
      requestId: randomUUID(),
      topicId: null,
      count: 'all' as const,
      replace: { sessionId, position, revision },
      selected: selection,
    }
    expect(await startFlow(page, request)).toMatchObject({
      ok: false,
      error: { code: 'WRITE_FAILED' },
    })
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
    withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER usage_failure'), false)
    expect(
      await startFlow(page, {
        ...request,
        selected: { ...selection, items: selection.items.slice(0, 1) },
      }),
    ).toMatchObject({ ok: true })
    expect((await readSets(page))[0]!.lastUsedAt).toBe(recent.lastUsedAt)
  } finally {
    await stop(application)
  }
})

test('界面置顶/取消置顶方案与题单，题单载入后仍确认组卷并记录使用', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info, 3)
  try {
    await page
      .locator('.question-selection-row')
      .filter({ has: page.getByText('组卷题 A 1', { exact: true }) })
      .getByRole('checkbox')
      .check()
    await page.locator('.question-selection-panel > summary').click()
    const panel = page.getByLabel('勾选组卷与固定题单', { exact: true })
    await panel.getByLabel('题单名称', { exact: true }).fill('常用面试')
    await panel.getByRole('button', { name: '保存为新题单', exact: true }).click()
    await expect(panel.getByRole('status')).toHaveText('固定题单已保存。')
    const set = (await readSets(page))[0]!
    await panel.getByLabel('选用固定题单').selectOption(set.setId)
    await panel.getByRole('button', { name: '置顶题单', exact: true }).click()
    await expect(panel.getByRole('status')).toHaveText('题单已置顶。')
    await panel.getByRole('button', { name: '取消置顶题单', exact: true }).click()
    await expect(panel.getByRole('status')).toHaveText('题单已取消置顶。')
    await panel.getByRole('button', { name: '载入题单并替换当前勾选', exact: true }).click()
    expect((await readSets(page))[0]!.lastUsedAt).toBeNull()
    await panel.getByRole('button', { name: '确认这批题目并练习…', exact: true }).click()
    await page.getByRole('button', { name: '确认开始组卷（1题）', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toContainText('第 1 / 1')
    expect((await readSets(page))[0]!.lastUsedAt).toMatch(/^\d{4}-/)
    await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
    await openPage(page, '题库')
    await expect(panel.getByText(/^最近开始：/)).toBeVisible()
    await openPage(page, '开始练习')
    const plans = page.locator('.practice-plans')
    await plans.getByLabel('方案名称', { exact: true }).fill('每日常用')
    await plans.getByRole('button', { name: '保存当前条件为方案', exact: true }).click()
    await expect(plans.getByRole('status')).toHaveText('练习方案已保存。')
    const plan = (await readPlans(page))[0]!
    await plans.getByLabel('选用练习方案').selectOption(plan.planId)
    await plans.getByRole('button', { name: '置顶方案', exact: true }).click()
    await expect(plans.getByRole('status')).toHaveText('方案已置顶。')
    await plans.getByRole('button', { name: '填入条件', exact: true }).click()
    expect((await readPlans(page))[0]!.lastUsedAt).toBeNull()
    await plans.getByRole('button', { name: '取消置顶方案', exact: true }).click()
    await expect(plans.getByRole('status')).toHaveText('方案已取消置顶。')
    const runtime = await application.evaluate(({ app }) => ({
      exe: process.execPath,
      data: app.getPath('userData'),
      packaged: app.isPackaged,
    }))
    await info.attach('shortcut-runtime', {
      body: JSON.stringify(runtime),
      contentType: 'application/json',
    })
    await page.screenshot({ path: info.outputPath('shortcuts.png') })
    const active = await page.evaluate(() =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
    )
    expect(active).toMatchObject({ ok: true, value: { session: { total: 1 } } })
    await page.getByRole('button', { name: '结束本轮并开始新练习', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toContainText('第 1 / 6')
    expect((await readPlans(page))[0]!.lastUsedAt).toMatch(/^\d{4}-/)
  } finally {
    await stop(application)
  }
})
