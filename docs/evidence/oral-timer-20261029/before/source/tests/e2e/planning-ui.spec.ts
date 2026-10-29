import { randomUUID } from 'node:crypto'
import { localDay } from '../../src/shared/contracts/planning'
import { expect, openPage, test } from './helpers'
import { captureHistory, stop, withHistoryDatabase } from './history-helpers'
import {
  a,
  b,
  changeSet,
  controlRecords,
  prepareControl,
  selectForPractice,
} from './practice-control-helpers'
import { createStudyRound, saveNote } from './study-helpers'
import { startFlow, flowQueue } from './practice-flow-helpers'
import { changePlanning, planningHome } from './planning-helpers'
import { chooseTheme } from './theme-helpers'

test('每日目标保存失败/坏回包保留原命令，退出受保护，冲突明确放弃后可沿用历史目标', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info, 3)
  try {
    await changePlanning(page, {
      kind: 'daily',
      day: '2026-01-01',
      ratingTarget: 7,
      reviewTarget: 1,
      expectedRevision: 0,
    })
    await openPage(page, '学习总览')
    const panel = page.getByRole('region', { name: '学习目标与日历', exact: true })
    await panel.getByRole('button', { name: '设置今日目标', exact: true }).click()
    await panel.getByLabel('目标自评不同题数', { exact: true }).fill('12')
    await expect(panel.getByLabel('目标自评不同题数', { exact: true })).toBeEditable()
    await expect(
      page
        .getByRole('navigation', { name: '主要页面', exact: true })
        .getByRole('link', { name: '题库', exact: true }),
    ).toHaveAttribute('aria-disabled', 'true')
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER fail_daily BEFORE INSERT ON daily_targets BEGIN SELECT RAISE(ABORT,'daily ui'); END",
        ),
      false,
    )
    await panel.getByRole('button', { name: '保存今日目标', exact: true }).click()
    await expect(panel.getByRole('alert')).toContainText('尚未确认')
    await expect(panel.getByLabel('目标自评不同题数', { exact: true })).toHaveValue('12')
    await application.evaluate(({ dialog }) => {
      dialog.showMessageBox = async () => {
        Reflect.set(globalThis, '__dailyCloseRejected', true)
        return { response: 0, checkboxChecked: false }
      }
    })
    await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.close())
    await expect
      .poll(() => application.evaluate(() => Reflect.get(globalThis, '__dailyCloseRejected')))
      .toBe(true)
    expect(application.windows()).toHaveLength(1)
    withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER fail_daily'), false)
    await application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('planning:change')
      Reflect.set(globalThis, '__dailyCommands', [])
      ipcMain.removeHandler('planning:change')
      ipcMain.handle('planning:change', async (event, input) => {
        const calls = Reflect.get(globalThis, '__dailyCommands')
        calls.push(input)
        const result = await original(event, input)
        return calls.length === 1 ? { invalid: true } : result
      })
    })
    await panel.getByRole('button', { name: '重试原目标保存', exact: true }).click()
    await expect(panel.getByRole('alert')).toContainText('尚未确认')
    await panel.getByRole('button', { name: '重试原目标保存', exact: true }).click()
    await expect(panel.getByText('今日目标已保存。', { exact: true })).toBeVisible()
    const calls = await application.evaluate(() => Reflect.get(globalThis, '__dailyCommands'))
    expect(calls).toHaveLength(2)
    expect(calls[0]).toEqual(calls[1])
    expect((await planningHome(page)).daily).toMatchObject({ ratingTarget: 12, revision: 1 })
    await panel.getByRole('button', { name: '编辑今日目标', exact: true }).click()
    await panel.getByLabel('目标自评不同题数', { exact: true }).fill('20')
    expect(
      await changePlanning(page, {
        kind: 'daily',
        day: localDay(),
        ratingTarget: 30,
        reviewTarget: 1,
        expectedRevision: 1,
      }),
    ).toMatchObject({ ok: true })
    await panel.getByRole('button', { name: '保存今日目标', exact: true }).click()
    await expect(panel.getByRole('alert')).toContainText('设置已变化')
    await expect(panel.getByLabel('目标自评不同题数', { exact: true })).toHaveValue('20')
    await panel.getByRole('button', { name: '放弃目标编辑', exact: true }).click()
    await panel.getByRole('button', { name: '保留目标输入', exact: true }).click()
    await expect(panel.getByLabel('目标自评不同题数', { exact: true })).toHaveValue('20')
    await panel.getByRole('button', { name: '放弃目标编辑', exact: true }).click()
    await panel.getByRole('button', { name: '确认放弃目标设置', exact: true }).click()
    await expect(panel.locator('.daily-goal-summary')).toContainText('/ 30 题')
    await panel.getByRole('button', { name: '沿用 2026-01-01 的目标', exact: true }).click()
    await expect(panel.getByLabel('目标自评不同题数', { exact: true })).toHaveValue('7')
    await panel.getByRole('button', { name: '保存今日目标', exact: true }).click()
    await expect(panel.locator('.daily-goal-summary')).toContainText('/ 7 题')
    await panel.scrollIntoViewIfNeeded()
    await captureHistory(application, page, info, 'goals-daily-saved.png')
  } finally {
    await stop(application)
  }
})

test('备考目标界面去重范围，进入原确认再建固定队列，取消/删除目标不改历史', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info, 3)
  try {
    const one = randomUUID(),
      two = randomUUID()
    await changeSet(page, { kind: 'save', setId: one, name: 'C与驱动', items: [a(1), a(2)] })
    await changeSet(page, { kind: 'save', setId: two, name: 'RTOS与通信', items: [a(2), b(2)] })
    await openPage(page, '学习总览')
    const panel = page.locator('.study-goals')
    await panel.locator(':scope > summary').click()
    await panel.getByRole('button', { name: '新建备考目标', exact: true }).click()
    await panel.getByLabel('备考目标名称', { exact: true }).fill('嵌入式实习面试')
    await panel.getByLabel('备考截止日期', { exact: true }).fill('2026-11-30')
    await panel.getByRole('checkbox', { name: 'C与驱动 · 2题', exact: true }).check()
    await panel.getByRole('checkbox', { name: 'RTOS与通信 · 2题', exact: true }).check()
    await panel.getByRole('button', { name: '保存备考目标', exact: true }).click()
    await expect(panel.getByText('备考目标已保存。', { exact: true })).toBeVisible()
    const goal = (await planningHome(page)).goals[0]!
    await panel.getByLabel('查看备考目标', { exact: true }).selectOption(goal.goalId)
    await expect(panel.getByRole('region', { name: '备考目标进度', exact: true })).toContainText(
      '已知范围去重 3 题',
    )
    await captureHistory(application, page, info, 'goals-exam-progress.png')
    await panel.getByRole('button', { name: '核对整个目标的题目', exact: true }).click()
    await expect(page.locator('.selected-question-list li')).toHaveCount(3)
    expect(
      withHistoryDatabase(testDataDirectory, (db) =>
        db.prepare('SELECT count(*) AS count FROM practice_sessions').get(),
      ),
    ).toEqual({ count: 0 })
    await page.getByRole('button', { name: '返回条件选题', exact: true }).click()
    await openPage(page, '学习总览')
    const again = page.locator('.study-goals')
    await again.locator(':scope > summary').click()
    await again.getByLabel('查看备考目标', { exact: true }).selectOption(goal.goalId)
    await again.getByRole('button', { name: '核对整个目标的题目', exact: true }).click()
    await page.getByRole('button', { name: '确认开始组卷（3题）', exact: true }).click()
    await expect(page.getByRole('button', { name: '查看参考答案', exact: true })).toBeVisible()
    const session = withHistoryDatabase(testDataDirectory, (db) =>
      db.prepare("SELECT id FROM practice_sessions WHERE status='active'").get(),
    ) as { id: string }
    expect(
      flowQueue(testDataDirectory, session.id).map(
        (item) => (item as { questionId: string }).questionId,
      ),
    ).toEqual(['q-1', 'q-2', 'q-2'])
    await page.getByRole('button', { name: '保存并返回', exact: true }).click()
    await openPage(page, '学习总览')
    const deleting = page.locator('.study-goals')
    await deleting.locator(':scope > summary').click()
    await deleting.getByLabel('查看备考目标', { exact: true }).selectOption(goal.goalId)
    await expect(deleting.getByRole('region', { name: '备考目标进度', exact: true })).toBeVisible()
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    await deleting.getByRole('button', { name: '删除备考目标', exact: true }).click()
    await deleting.getByRole('button', { name: '确认删除备考目标', exact: true }).click()
    await expect(deleting.getByText('备考目标已删除。', { exact: true })).toBeVisible()
    await expect(
      deleting.getByLabel('查看备考目标', { exact: true }).locator('option'),
    ).toHaveCount(1)
    await expect(deleting.getByText('正在读取备考范围…', { exact: true })).toBeHidden()
    await expect(deleting.getByRole('alert')).toHaveCount(0)
    const after = withHistoryDatabase(testDataDirectory, controlRecords)
    expect({ ...after, study_goals: before['study_goals'] }).toEqual(before)
  } finally {
    await stop(application)
  }
})

test('配额界面显示缺额，不替换活动轮，确认完整范围后只练明确题目', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info, 3)
  try {
    const selected = await selectForPractice(page, [a(3)], '原活动轮'),
      started = await startFlow(page, {
        requestId: randomUUID(),
        topicId: null,
        count: 'all',
        replace: null,
        selected,
      })
    if (!started.ok) throw Error(started.error.message)
    await page.reload()
    await openPage(page, '开始练习')
    const panel = page.locator('.quota-composer')
    await panel.locator(':scope > summary').click()
    await panel.getByRole('button', { name: '设置专题配额', exact: true }).click()
    await panel.getByLabel('配额题数 1', { exact: true }).fill('2')
    await panel.getByRole('button', { name: '增加配额专题', exact: true }).click()
    await panel.getByLabel('配额题数 2', { exact: true }).fill('4')
    await panel.getByLabel('配额优先方式 1', { exact: true }).selectOption('weak')
    await panel.getByRole('button', { name: '保存并预览配额组卷', exact: true }).click()
    await expect(panel.getByRole('region', { name: '配额组卷预览', exact: true })).toContainText(
      '需要 4 题 / 可用 3 题 · 缺 1 题',
    )
    await expect(
      panel.getByRole('button', { name: '核对这批配额题目', exact: true }),
    ).toBeDisabled()
    const original = flowQueue(testDataDirectory, started.value.sessionId)
    expect(original).toHaveLength(1)
    await panel.getByRole('button', { name: '编辑配额设置', exact: true }).click()
    await panel.getByLabel('配额题数 2', { exact: true }).fill('2')
    await panel.getByLabel('配额优先方式 2', { exact: true }).selectOption('oldest')
    await panel.getByRole('button', { name: '保存并预览配额组卷', exact: true }).click()
    await expect(panel.getByRole('button', { name: '核对这批配额题目', exact: true })).toBeEnabled()
    await captureHistory(application, page, info, 'goals-quota-preview.png')
    await panel.getByRole('button', { name: '核对这批配额题目', exact: true }).click()
    await expect(page.locator('.selected-question-list li')).toHaveCount(4)
    expect(flowQueue(testDataDirectory, started.value.sessionId)).toEqual(original)
    await page.getByRole('button', { name: '结束原轮并开始组卷（4题）', exact: true }).click()
    await expect(page.getByRole('button', { name: '查看参考答案', exact: true })).toBeVisible()
    const sessions = withHistoryDatabase(testDataDirectory, (db) =>
      db.prepare('SELECT id,status,selection_name FROM practice_sessions ORDER BY rowid').all(),
    ) as { id: string; status: string; selection_name: string }[]
    expect(sessions[0]?.status).toBe('ended')
    expect(sessions[1]?.selection_name).toBe('分专题配额组卷 · 2专题 4题')
    expect(
      flowQueue(testDataDirectory, sessions[1]!.id).map(
        (item) => (item as { questionId: string }).questionId,
      ),
    ).toEqual(['q-1', 'q-2', 'q-1', 'q-2'])
  } finally {
    await stop(application)
  }
})

test('日历日期可看活动分页与原轮作答笔记，旧日期零事件有明确说明', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info)
  try {
    await createStudyRound(page, '日历原作答', [a(1)])
    for (let n = 1; n <= 27; n++)
      await saveNote(page, { ...a(n), expectedRevision: 0, text: `日历个人理解 ${n}` })
    await openPage(page, '学习总览')
    const panel = page.locator('.learning-calendar')
    await panel.locator(':scope > summary').click()
    await panel.getByRole('button', { name: `查看 ${localDay()} 的学习记录`, exact: true }).click()
    await expect(panel.getByRole('region', { name: '当日学习记录', exact: true })).toContainText(
      '活动 29 条 · 关联轮次 1 轮',
    )
    await expect(panel.locator('.calendar-events li')).toHaveCount(20)
    await panel.locator('.calendar-grid').scrollIntoViewIfNeeded()
    await captureHistory(application, page, info, 'goals-calendar-month.png')
    await panel.getByRole('button', { name: '下一页活动', exact: true }).click()
    await expect(panel.locator('.calendar-events li')).toHaveCount(9)
    await panel.getByRole('button', { name: '回看此轮', exact: true }).click()
    await panel.getByRole('button', { name: '查看本轮第1题', exact: true }).click()
    await expect(panel.locator('.round-entry')).toContainText('日历原作答')
    await captureHistory(application, page, info, 'goals-calendar-round.png')
    await panel.getByRole('button', { name: '收起当日轮次复盘', exact: true }).click()
    await panel.getByLabel('日历月份', { exact: true }).fill('2000-02')
    await panel.getByRole('button', { name: '查看 2000-02-29 的学习记录', exact: true }).click()
    await expect(panel.getByRole('region', { name: '当日学习记录', exact: true })).toContainText(
      '这一天没有本版记录的学习活动。',
    )
  } finally {
    await stop(application)
  }
})

test('目标/日历/配额在900宽150%暗色可操作且中文混排无横向溢出', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info, 3)
  try {
    await chooseTheme(page, '松间绿', 'dark', 19)
    await application.evaluate(({ BrowserWindow }) => {
      const window = BrowserWindow.getAllWindows()[0]!
      window.setContentSize(900, 760)
      window.webContents.setZoomFactor(1.5)
    })
    await openPage(page, '学习总览')
    const planner = page.locator('.study-planner')
    await planner.getByRole('button', { name: '设置今日目标', exact: true }).click()
    await planner.getByLabel('目标自评不同题数', { exact: true }).fill('10')
    await planner.getByRole('button', { name: '保存今日目标', exact: true }).click()
    await expect(planner.getByText('今日目标已保存。', { exact: true })).toBeVisible()
    await planner.locator('.learning-calendar > summary').click()
    await expect(planner.getByRole('region', { name: '当日学习记录', exact: true })).toBeVisible()
    let sizes = await page.locator('html').evaluate((element) => ({
      scroll: Reflect.get(element, 'scrollWidth'),
      client: Reflect.get(element, 'clientWidth'),
    }))
    expect(sizes.scroll).toBeLessThanOrEqual(sizes.client + 1)
    await planner.locator('.calendar-grid').scrollIntoViewIfNeeded()
    await captureHistory(application, page, info, 'goals-narrow-dark-calendar.png')
    await openPage(page, '开始练习')
    const quota = page.locator('.quota-composer')
    await quota.locator(':scope > summary').click()
    await quota.getByRole('button', { name: '设置专题配额', exact: true }).click()
    await quota.getByRole('button', { name: '增加配额专题', exact: true }).click()
    await quota.getByRole('button', { name: '保存并预览配额组卷', exact: true }).click()
    await expect(quota.getByRole('button', { name: '核对这批配额题目', exact: true })).toBeEnabled()
    sizes = await page.locator('html').evaluate((element) => ({
      scroll: Reflect.get(element, 'scrollWidth'),
      client: Reflect.get(element, 'clientWidth'),
    }))
    expect(sizes.scroll).toBeLessThanOrEqual(sizes.client + 1)
    await quota.getByRole('region', { name: '配额组卷预览', exact: true }).scrollIntoViewIfNeeded()
    await captureHistory(application, page, info, 'goals-narrow-dark-quota.png')
  } finally {
    await stop(application)
  }
})
