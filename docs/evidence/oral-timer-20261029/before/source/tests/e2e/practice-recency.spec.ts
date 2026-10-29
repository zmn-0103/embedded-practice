import { randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import {
  EMPTY_QUESTION_FILTERS,
  type QuestionFilters,
} from '../../src/shared/contracts/question-filters'
import { expect, launchApplication, openPage, test } from './helpers'
import { captureHistory, importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
import { a, controlBank, prepareControl } from './practice-control-helpers'
import { endFlow, startFlow } from './practice-flow-helpers'
import { changePlan, openPlans, planOptions, readPlans, savePlan } from './practice-plan-helpers'
import { arrangeReview } from './review-helpers'
import { chooseTheme } from './theme-helpers'

function questions(page: Page, change: Partial<QuestionFilters> = {}, topicId = 'control-a') {
  return page.evaluate(
    (input) =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.library.listQuestions(input),
    { topicId, archived: false, page: 1, filters: { ...EMPTY_QUESTION_FILTERS, ...change } },
  )
}
function queue(directory: string, session: string) {
  return withHistoryDatabase(directory, (db) =>
    db
      .prepare(
        'SELECT q.question_id AS questionId,p.version_id AS versionId FROM practice_items p JOIN questions q ON q.id=p.question_id WHERE p.session_id=? ORDER BY p.position',
      )
      .all(session),
  ) as { questionId: string; versionId: number }[]
}

test('当前版本最近揭晓：7/30天精确边界、旧版本重导入、仅自评未知时间与最久优先顺序', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareControl(testDataDirectory, info, 8)
  try {
    const now = Date.parse('2026-10-29T03:00:00.000Z')
    await application.evaluate((_, now) => {
      Date.now = () => now
    }, now)
    const started = await startFlow(page, {
      requestId: randomUUID(),
      topicId: 'control-a',
      count: 'all',
      replace: null,
    })
    expect(started.ok).toBe(true)
    if (!started.ok) throw new Error('准备轮失败')
    expect(await endFlow(page)).toMatchObject({ ok: true })
    // 通过公开建轮取得真实队列，再以固定时刻设置日期夹具，精确覆盖窗口边界。
    withHistoryDatabase(
      testDataDirectory,
      (db) => {
        const update = db.prepare(
          'UPDATE practice_items SET revealed_at=? WHERE session_id=? AND question_id=(SELECT id FROM questions WHERE topic_id=? AND question_id=?)',
        )
        for (const [number, days] of [
          [1, 1],
          [2, 8],
          [3, 31],
          [4, 7],
          [5, 30],
          [8, 1],
        ])
          update.run(
            new Date(now - days! * 86400000).toISOString(),
            started.value.sessionId,
            'control-a',
            `q-${number}`,
          )
        db.exec(
          "UPDATE question_user_state SET last_rating='不熟',last_rated_version_id=(SELECT current_version_id FROM questions WHERE id=question_user_state.question_id) WHERE question_id=(SELECT id FROM questions WHERE topic_id='control-a' AND question_id='q-6')",
        )
      },
      false,
    )
    await arrangeReview(page, a(7))
    await page.evaluate(() =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.study.saveNote({
        ...{ topicId: 'control-a', questionId: 'q-7' },
        expectedRevision: 0,
        text: '编辑笔记和待办不计练习',
      }),
    )
    await writeFile(
      file,
      controlBank('control-a', 8).replace(
        'CONTROL-OLD-BODY-control-a-8',
        'CONTROL-NEW-BODY-control-a-8',
      ),
    )
    await importHistoryFiles(application, page, [file])
    const defaults = await questions(page)
    if (!defaults.ok) throw new Error(defaults.error.message)
    expect(defaults.value.questions.map((item) => item.questionId)).toEqual(
      Array.from({ length: 8 }, (_, i) => `q-${i + 1}`),
    )
    for (const item of defaults.value.questions) expect(item).not.toHaveProperty('lastPracticedAt')
    for (const [practiceRecency, expected] of [
      ['never', [7, 8]],
      ['7d', [2, 3, 5, 7, 8]],
      ['30d', [3, 7, 8]],
    ] as const) {
      const result = await questions(page, { practiceRecency })
      if (!result.ok) throw new Error(result.error.message)
      expect(result.value.questions.map((item) => item.questionId)).toEqual(
        expected.map((n) => `q-${n}`),
      )
    }
    const ordered = await questions(page, { practiceOrder: 'oldest' })
    if (!ordered.ok) throw new Error(ordered.error.message)
    expect(ordered.value.questions.map((item) => item.questionId)).toEqual(
      [7, 8, 3, 5, 2, 4, 1, 6].map((n) => `q-${n}`),
    )
    expect(ordered.value.questions.find((item) => item.questionId === 'q-6')).toMatchObject({
      practiced: true,
      lastPracticedAt: null,
    })
    expect(ordered.value.questions.find((item) => item.questionId === 'q-8')).toMatchObject({
      practiced: false,
      lastPracticedAt: null,
      contentUpdated: true,
    })
    expect(ordered.value.questions.find((item) => item.questionId === 'q-4')?.lastPracticedAt).toBe(
      '2026-10-22T03:00:00.000Z',
    )
    // 时区不同但表示同一时刻时，按真实时间比较。
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db
          .prepare(
            "UPDATE practice_items SET revealed_at='2026-10-22T11:00:00+08:00' WHERE session_id=? AND question_id=(SELECT id FROM questions WHERE topic_id='control-a' AND question_id='q-4')",
          )
          .run(started.value.sessionId),
      false,
    )
    const offset = await questions(page, { practiceRecency: '7d' })
    if (!offset.ok) throw new Error(offset.error.message)
    expect(offset.value.questions.map((item) => item.questionId)).toEqual([
      'q-2',
      'q-3',
      'q-5',
      'q-7',
      'q-8',
    ])
    const second = await startFlow(page, {
      requestId: randomUUID(),
      topicId: 'control-a',
      count: 'all',
      replace: null,
    })
    if (!second.ok) throw new Error(second.error.message)
    await endFlow(page)
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db
          .prepare(
            "UPDATE practice_items SET revealed_at=? WHERE session_id=? AND question_id=(SELECT id FROM questions WHERE topic_id='control-a' AND question_id='q-2')",
          )
          .run(new Date(now - 86400000).toISOString(), second.value.sessionId),
      false,
    )
    const latest = await questions(page, { practiceRecency: '7d' })
    if (!latest.ok) throw new Error(latest.error.message)
    expect(latest.value.questions.map((item) => item.questionId)).toEqual([
      'q-3',
      'q-5',
      'q-7',
      'q-8',
    ])
  } finally {
    await stop(application)
  }
})

test('最久优先先限10题再随机，固定队列不随历史变化/重新打开重排；方案兼容显式默认值', async ({
  testDataDirectory,
}, info) => {
  const initial = await prepareControl(testDataDirectory, info)
  let reopened: Awaited<ReturnType<typeof launchApplication>> | undefined
  try {
    const seeded = await startFlow(initial.page, {
      requestId: randomUUID(),
      topicId: 'control-a',
      count: 'all',
      replace: null,
    })
    if (!seeded.ok) throw new Error(seeded.error.message)
    await endFlow(initial.page)
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db
          .prepare('UPDATE practice_items SET revealed_at=? WHERE session_id=? AND position=0')
          .run(new Date().toISOString(), seeded.value.sessionId),
      false,
    )
    let active = ''
    for (let trial = 0; trial < 3; trial++) {
      const started = await startFlow(initial.page, {
        requestId: randomUUID(),
        topicId: 'control-a',
        count: 10,
        replace: null,
        mode: 'random',
        filters: { ...EMPTY_QUESTION_FILTERS, practiceOrder: 'oldest' },
      })
      if (!started.ok) throw new Error(started.error.message)
      active = started.value.sessionId
      expect(
        queue(testDataDirectory, active)
          .map((item) => item.questionId)
          .sort(),
      ).toEqual(Array.from({ length: 10 }, (_, i) => `q-${i + 2}`).sort())
      if (trial < 2) await endFlow(initial.page)
    }
    const fixed = queue(testDataDirectory, active)
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db
          .prepare('UPDATE practice_items SET revealed_at=? WHERE session_id=?')
          .run(new Date().toISOString(), seeded.value.sessionId),
      false,
    )
    await stop(initial.application)
    reopened = await launchApplication(testDataDirectory, info.project.name)
    expect(queue(testDataDirectory, active)).toEqual(fixed)
    expect(
      await reopened.page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({
          sessionId: null,
        }),
      ),
    ).toMatchObject({
      ok: true,
      value: {
        session: {
          sessionId: active,
          mode: 'random',
          filters: { ...EMPTY_QUESTION_FILTERS, practiceOrder: 'oldest' },
        },
      },
    })
    await endFlow(reopened.page)
    const planId = randomUUID()
    expect(
      await changePlan(reopened.page, {
        kind: 'save',
        planId,
        name: '旧默认条件',
        options: { ...planOptions, topicId: 'control-a' },
      }),
    ).toMatchObject({ ok: true })
    expect(
      await startFlow(reopened.page, {
        requestId: randomUUID(),
        topicId: 'control-a',
        count: 20,
        mode: 'random',
        replace: null,
        category: { kind: 'all' },
        filters: {
          ...EMPTY_QUESTION_FILTERS,
          personalTagId: null,
          practiceRecency: 'all',
          practiceOrder: 'default',
        },
        sourcePlanId: planId,
      }),
    ).toMatchObject({ ok: true, value: { total: 20 } })
    expect(
      (await readPlans(reopened.page)).find((item) => item.planId === planId)?.lastUsedAt,
    ).not.toBeNull()
  } finally {
    await stop(initial.application)
    if (reopened) await stop(reopened.application)
  }
})

test('题库和练习共用最近筛选，可保存/填入方案；窄窗暗色控件和结果可操作', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info, 3)
  try {
    await chooseTheme(page, '松间绿', 'dark')
    await openPage(page, '题库')
    const window = await application.browserWindow(page)
    await window.evaluate((window) => {
      window.setContentSize(900, 800)
      window.webContents.setZoomFactor(1.5)
    })
    const libraryRecent = page
      .getByRole('group', { name: '设置题库条件', exact: true })
      .locator('.recent-practice-filters > summary')
    await libraryRecent.click()
    await page.getByLabel('题库最近练习', { exact: true }).selectOption('7d')
    await page.getByLabel('题库选题优先级', { exact: true }).selectOption('oldest')
    await page.getByRole('button', { name: '筛选题库', exact: true }).click()
    await expect(page.locator('.question-row')).toHaveCount(6)
    await expect(page.getByLabel('题库已选条件', { exact: true })).toContainText(
      '最近7天未练 · 最久未练优先',
    )
    await libraryRecent.click()
    await page.locator('.question-row').first().click()
    await expect(page.getByRole('article', { name: '题目内容', exact: true })).toBeVisible()
    await expect(
      page
        .getByRole('article', { name: '题目内容', exact: true })
        .getByText('当前版本从未练习', { exact: true }),
    ).toBeVisible()
    await captureHistory(application, page, info, 'recent-library-narrow-dark.png')
    await openPage(page, '开始练习')
    await page.getByLabel('练习专题', { exact: true }).selectOption('control-a')
    await page.getByText('筛选练习题目', { exact: true }).click()
    await page.locator('.practice-workspace .recent-practice-filters > summary').click()
    await page.getByLabel('练习最近练习', { exact: true }).selectOption('30d')
    await page.getByLabel('练习选题优先级', { exact: true }).selectOption('oldest')
    const saved = await savePlan(page, '最近30天未练优先')
    expect(saved.options.filters).toMatchObject({ practiceRecency: '30d', practiceOrder: 'oldest' })
    const panel = await openPlans(page)
    await panel.getByLabel('选用练习方案', { exact: true }).selectOption(saved.planId)
    await panel.getByRole('button', { name: '填入条件', exact: true }).click()
    await expect(page.getByLabel('练习最近练习', { exact: true })).toHaveValue('30d')
    await expect(page.getByLabel('练习选题优先级', { exact: true })).toHaveValue('oldest')
    await expect(page.getByText('匹配 3 题', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toContainText('第 1 / 3 题')
    await page.getByRole('button', { name: '保存并返回', exact: true }).click()
    await expect(page.locator('.practice-workspace')).toContainText('最近30天未练')
    await captureHistory(application, page, info, 'recent-plan-narrow-dark.png')
  } finally {
    await stop(application)
  }
})
