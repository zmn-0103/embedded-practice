import { randomUUID } from 'node:crypto'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { EMPTY_QUESTION_FILTERS } from '../../src/shared/contracts/question-filters'
import { expect, launchApplication, openPage, test } from './helpers'
import { assignTopic, categoryChange, categoryList, prepareCategories } from './category-helpers'
import { historySnapshot, stop, withHistoryDatabase } from './history-helpers'
import { changePlan, openPlans, planOptions, readPlans, savePlan } from './practice-plan-helpers'

test('方案：命名保存完整条件、填入不建轮，正常重开后明确开始才替换原轮', async ({
  testDataDirectory,
}, info) => {
  const prepared = await prepareCategories(testDataDirectory, info.project.name)
  let instance = { application: prepared.application, page: prepared.page }
  const draft = '方案验收原轮草稿\n    preserved_before_plan();'
  try {
    expect(
      await instance.page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.library.setFavorite({
          topicId: 'cat-a',
          questionId: 'q-1',
          favorite: true,
        }),
      ),
    ).toMatchObject({ ok: true })
    await openPage(instance.page, '开始练习')
    await instance.page.getByLabel('本轮题数', { exact: true }).selectOption('all')
    await instance.page.getByRole('button', { name: '开始练习', exact: true }).click()
    await instance.page.getByRole('textbox', { name: '我的答案', exact: true }).fill(draft)
    await instance.page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
    const original = historySnapshot(testDataDirectory)
    await instance.page.getByText('按分类选择专题', { exact: true }).click()
    await instance.page.getByRole('button', { name: '练习分类：板块 A', exact: true }).click()
    await instance.page.getByLabel('练习专题', { exact: true }).selectOption('cat-a')
    await instance.page.getByLabel('练习模式', { exact: true }).selectOption('random')
    await instance.page.getByLabel('本轮题数', { exact: true }).selectOption('10')
    await instance.page.getByText('筛选练习题目', { exact: true }).click()
    await instance.page.getByLabel('练习搜索', { exact: true }).fill('CATEGORY-BODY-cat-a')
    await instance.page.getByLabel('练习标签', { exact: true }).fill('共同')
    await instance.page.getByLabel('练习难度', { exact: true }).selectOption('基础')
    await instance.page.getByLabel('练习自评状态', { exact: true }).selectOption('unpracticed')
    await instance.page.getByLabel('练习只看收藏', { exact: true }).check()
    const saved = await savePlan(instance.page, '板块A收藏基础随机10')
    expect(saved.options).toEqual({
      category: { kind: 'category', categoryId: prepared.first },
      topicId: 'cat-a',
      mode: 'random',
      count: 10,
      filters: {
        ...EMPTY_QUESTION_FILTERS,
        query: 'CATEGORY-BODY-cat-a',
        tag: '共同',
        difficulty: '基础',
        mastery: 'unpracticed',
        favoritesOnly: true,
      },
    })
    await instance.page.getByRole('button', { name: '练习分类：未分类', exact: true }).click()
    await instance.page.getByLabel('练习模式', { exact: true }).selectOption('sequential')
    await instance.page.getByLabel('本轮题数', { exact: true }).selectOption('50')
    await instance.page.getByRole('button', { name: '全部题目', exact: true }).click()
    const panel = await openPlans(instance.page)
    await panel.getByLabel('选用练习方案', { exact: true }).selectOption(saved.planId)
    await panel.getByRole('button', { name: '填入条件', exact: true }).click()
    await expect(instance.page.getByText('匹配 1 题', { exact: true })).toBeVisible()
    await expect(instance.page.getByLabel('练习模式', { exact: true })).toHaveValue('random')
    await expect(instance.page.getByLabel('练习专题', { exact: true })).toHaveValue('cat-a')
    await expect(instance.page.getByLabel('本轮题数', { exact: true })).toHaveValue('10')
    await expect(instance.page.getByLabel('练习搜索', { exact: true })).toHaveValue(
      saved.options.filters.query,
    )
    await expect(instance.page.getByLabel('练习只看收藏', { exact: true })).toBeChecked()
    expect(historySnapshot(testDataDirectory)).toEqual(original)
    await info.attach('practice-plan-filled.png', {
      body: await instance.page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
    const closed = instance.application.waitForEvent('close')
    await instance.application.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]!.close(),
    )
    await closed
    instance = await launchApplication(testDataDirectory, info.project.name)
    expect(await readPlans(instance.page)).toEqual([saved])
    expect(historySnapshot(testDataDirectory)).toEqual(original)
    const reopened = await openPlans(instance.page)
    await reopened.getByLabel('选用练习方案', { exact: true }).selectOption(saved.planId)
    await reopened.getByRole('button', { name: '填入条件', exact: true }).click()
    await expect(instance.page.getByText('匹配 1 题', { exact: true })).toBeVisible()
    await instance.page.getByRole('button', { name: '结束本轮并开始新练习', exact: true }).click()
    await expect(instance.page.getByLabel('练习进度')).toHaveText('第 1 / 1 题 · 随机练习')
    expect(
      await instance.page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({
          sessionId: null,
        }),
      ),
    ).toMatchObject({
      ok: true,
      value: {
        session: {
          filters: saved.options.filters,
          category: { kind: 'category', categoryId: prepared.first, title: '板块 A' },
        },
        item: { topicId: 'cat-a', questionId: 'q-1' },
      },
    })
    expect(historySnapshot(testDataDirectory).items.some((row) => row.draft === draft)).toBe(true)
  } finally {
    await stop(instance.application)
  }
})

test('方案：原ID重试、同名拒绝、容量、写入回滚及坏JSON读取，不改变原业务或题库修订', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareCategories(testDataDirectory, info.project.name)
  try {
    const before = historySnapshot(testDataDirectory),
      revision = (await categoryList(page)).revision
    const command = {
      kind: 'save' as const,
      planId: randomUUID(),
      name: 'rule-plan',
      options: planOptions,
    }
    for (let i = 0; i < 2; i++)
      expect(await changePlan(page, command)).toEqual({ ok: true, value: null })
    expect(await readPlans(page)).toHaveLength(1)
    for (const changed of [
      { ...command, name: '其他条件' },
      { ...command, planId: randomUUID(), name: 'RULE-PLAN' },
    ])
      expect(await changePlan(page, changed)).toMatchObject({
        ok: false,
        error: { code: 'INVALID_REQUEST' },
      })
    expect(
      await changePlan(page, {
        ...command,
        planId: randomUUID(),
        name: '失效范围',
        options: { ...planOptions, category: { kind: 'category', categoryId: 'missing' } },
      }),
    ).toMatchObject({ error: { code: 'NOT_FOUND' } })
    for (let i = 1; i < 100; i++)
      expect(
        await changePlan(page, { ...command, planId: randomUUID(), name: `方案${i}` }),
      ).toEqual({ ok: true, value: null })
    expect(await readPlans(page)).toHaveLength(100)
    expect(
      await changePlan(page, { ...command, planId: randomUUID(), name: '第101份' }),
    ).toMatchObject({ error: { code: 'INVALID_REQUEST' } })
    expect(await changePlan(page, command)).toEqual({ ok: true, value: null })
    for (let i = 0; i < 2; i++)
      expect(await changePlan(page, { kind: 'delete', planId: command.planId })).toEqual({
        ok: true,
        value: null,
      })
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER plan_failure BEFORE INSERT ON practice_plans BEGIN SELECT RAISE(ABORT,'test failure'); END",
        ),
      false,
    )
    expect(
      await changePlan(page, { ...command, planId: randomUUID(), name: '失败保持' }),
    ).toMatchObject({ error: { code: 'DATABASE_UNAVAILABLE' } })
    expect(await readPlans(page)).toHaveLength(99)
    withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER plan_failure'), false)
    expect((await categoryList(page)).revision).toBe(revision)
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    const damaged = (await readPlans(page))[0]!.planId
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.prepare("UPDATE practice_plans SET options_json='{}' WHERE plan_id=?").run(damaged),
      false,
    )
    expect(
      await page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.practicePlans.list(),
      ),
    ).toMatchObject({ ok: false, error: { code: 'DATABASE_UNAVAILABLE' } })
    expect(historySnapshot(testDataDirectory)).toEqual(before)
  } finally {
    await stop(application)
  }
})

test('方案：分类改名沿原ID，移出/移除不扩大范围，删除默认取消且只删方案', async ({
  testDataDirectory,
}, info) => {
  const { application, page, first, second } = await prepareCategories(
    testDataDirectory,
    info.project.name,
  )
  try {
    await openPlans(page)
    await page.getByText('按分类选择专题', { exact: true }).click()
    await page.getByRole('button', { name: '练习分类：板块 A', exact: true }).click()
    await page.getByLabel('练习专题', { exact: true }).selectOption('cat-a')
    const saved = await savePlan(page, '分类方案')
    await categoryChange(page, { kind: 'rename', categoryId: first, title: '当前分类名' })
    await page.reload()
    let panel = await openPlans(page)
    await panel.getByLabel('选用练习方案', { exact: true }).selectOption(saved.planId)
    await expect(panel).toContainText('当前分类名')
    await panel.getByRole('button', { name: '填入条件', exact: true }).click()
    await expect(page.getByText('匹配 2 题', { exact: true })).toBeVisible()
    // 合法归档夹具模拟专题已无活动题，刷新后仍须保留明确选中的专题ID。
    withHistoryDatabase(
      testDataDirectory,
      (db) => db.exec("UPDATE questions SET archived=1 WHERE topic_id='cat-a'"),
      false,
    )
    const before = historySnapshot(testDataDirectory)
    await openPage(page, '题库')
    await assignTopic(page, 'cat-a', second)
    panel = await openPlans(page)
    await expect(page.getByLabel('练习专题', { exact: true })).toHaveValue('cat-a')
    await expect(page.getByText('匹配 0 题', { exact: true })).toBeVisible()
    await expect(panel.getByRole('button', { name: '填入条件', exact: true })).toBeDisabled()
    expect(
      await changePlan(page, { kind: 'save', ...saved, planId: randomUUID(), name: '失效不保存' }),
    ).toMatchObject({ error: { code: 'NOT_FOUND' } })
    await categoryChange(page, { kind: 'delete', categoryId: first })
    await page.reload()
    panel = await openPlans(page)
    await panel.getByLabel('选用练习方案', { exact: true }).selectOption(saved.planId)
    await expect(panel).toContainText('分类已移除')
    await expect(panel.getByRole('button', { name: '填入条件', exact: true })).toBeDisabled()
    expect(await readPlans(page)).toEqual([saved])
    await panel.getByRole('button', { name: '删除所选方案…', exact: true }).click()
    await expect(panel.getByRole('button', { name: '取消删除方案', exact: true })).toBeFocused()
    await panel.getByRole('button', { name: '取消删除方案', exact: true }).click()
    expect(await readPlans(page)).toEqual([saved])
    await panel.getByRole('button', { name: '删除所选方案…', exact: true }).click()
    await panel.getByRole('button', { name: '确认删除方案', exact: true }).click()
    await expect(panel.getByRole('status')).toContainText('练习方案已删除')
    expect(await readPlans(page)).toEqual([])
    expect(historySnapshot(testDataDirectory)).toEqual(before)
  } finally {
    await stop(application)
  }
})
