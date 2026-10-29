import { randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { localDay, type QuotaRow } from '../../src/shared/contracts/planning'
import { expect, test } from './helpers'
import { importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
import {
  a,
  b,
  changeSet,
  controlBank,
  controlRecords,
  prepareControl,
  selectForPractice,
} from './practice-control-helpers'
import { createStudyRound, saveNote } from './study-helpers'
import { arrangeReview, saveReview } from './review-helpers'
import { startFlow, flowQueue } from './practice-flow-helpers'
import {
  calendarDay,
  changePlanning,
  goalProgress,
  goalScope,
  planningHome,
  quotaPreview,
} from './planning-helpers'

test('备考目标容量/重名与失效范围更新有边界，日历轮次独立分页不漏轮', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info, 3)
  try {
    const setId = randomUUID(),
      goalId = randomUUID()
    expect(
      await changeSet(page, { kind: 'save', setId, name: '容量题单', items: [a(1)] }),
    ).toMatchObject({ ok: true })
    const command = {
      kind: 'exam' as const,
      goalId,
      name: 'Interview',
      deadline: null,
      setIds: [setId],
      expectedRevision: 0,
    }
    const original = await changePlanning(page, command)
    expect(original).toMatchObject({ ok: true })
    expect(
      await changePlanning(page, { ...command, goalId: randomUUID(), name: 'interview' }),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } })
    for (let n = 1; n < 20; n++)
      expect(
        await changePlanning(page, { ...command, goalId: randomUUID(), name: `备考 ${n}` }),
      ).toMatchObject({ ok: true })
    expect(
      await changePlanning(page, { ...command, goalId: randomUUID(), name: '第21个' }),
    ).toMatchObject({ ok: false, error: { code: 'LIMIT_EXCEEDED' } })
    expect(
      await changePlanning(page, {
        ...command,
        setIds: [setId, randomUUID()],
        expectedRevision: 1,
      }),
    ).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } })
    if (!original.ok || original.value?.type !== 'exam') throw Error('目标保存失败')
    expect(await changePlanning(page, { kind: 'exam-delete', expected: original.value })).toEqual({
      ok: true,
      value: null,
    })
    expect(await changePlanning(page, { kind: 'exam-delete', expected: original.value })).toEqual({
      ok: true,
      value: null,
    })
    expect(await changePlanning(page, { ...command, expectedRevision: 1 })).toMatchObject({
      ok: false,
      error: { code: 'CONFLICT' },
    })
    for (let n = 0; n < 21; n++) await createStudyRound(page, `当日轮次 ${n}`, [a(1)])
    const first = await calendarDay(page),
      last = await calendarDay(page, localDay(), 99, 99)
    expect(first).toMatchObject({ eventTotal: 42, roundTotal: 21, eventPage: 1, roundPage: 1 })
    expect(first.rounds).toHaveLength(20)
    expect(last).toMatchObject({ eventPage: 3, roundPage: 2 })
    expect(last.rounds).toHaveLength(1)
    expect(new Set([...first.rounds, ...last.rounds].map((round) => round.sessionId)).size).toBe(21)
    expect((await planningHome(page)).counts).toMatchObject({
      ratingQuestions: 1,
      ratingAttempts: 21,
    })
  } finally {
    await stop(application)
  }
})

test('每日目标按成功活动去重，待办重开/同题重复自评/归档不抹事实，旧日期不补造', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareControl(testDataDirectory, info)
  try {
    const day = localDay(),
      command = {
        kind: 'daily' as const,
        day,
        ratingTarget: 10,
        reviewTarget: 2,
        expectedRevision: 0,
      }
    expect((await planningHome(page)).counts).toEqual({
      ratingQuestions: 0,
      ratingAttempts: 0,
      reviewQuestions: 0,
      reviewAttempts: 0,
      reveals: 0,
      noteSaves: 0,
    })
    const saved = await changePlanning(page, command)
    expect(saved).toMatchObject({ ok: true, value: { revision: 1 } })
    expect(await changePlanning(page, command)).toEqual(saved)
    expect(await changePlanning(page, { ...command, ratingTarget: 11 })).toMatchObject({
      ok: false,
      error: { code: 'CONFLICT' },
    })
    const round = await createStudyRound(page, '第一次独立作答', [a(1)])
    await createStudyRound(page, '再次作答', [a(1)])
    let review = await arrangeReview(page)
    const done = {
      ...a(1),
      state: 'done' as const,
      dueDate: review.dueDate,
      reason: review.reason,
      expectedRevision: review.revision,
    }
    const completed = await saveReview(page, done)
    expect(await saveReview(page, done)).toEqual(completed)
    expect(
      await saveReview(page, { ...done, expectedRevision: 2, reason: '只改说明不重计' }),
    ).toMatchObject({ ok: true, value: { revision: 3 } })
    expect(
      await saveReview(page, { ...done, state: 'pending', expectedRevision: 3 }),
    ).toMatchObject({ ok: true, value: { revision: 4 } })
    expect(await saveReview(page, { ...done, expectedRevision: 4 })).toMatchObject({
      ok: true,
      value: { revision: 5 },
    })
    const note = { ...a(1), expectedRevision: 0, text: '笔记只单独统计' }
    const first = await saveNote(page, note)
    expect(await saveNote(page, note)).toEqual(first)
    expect(await saveNote(page, { ...note, expectedRevision: 1 })).toEqual(first)
    expect((await planningHome(page)).counts).toEqual({
      ratingQuestions: 1,
      ratingAttempts: 2,
      reviewQuestions: 1,
      reviewAttempts: 2,
      reveals: 2,
      noteSaves: 1,
    })
    await writeFile(file, controlBank('control-a', 27, false, 1))
    await importHistoryFiles(application, page, [file])
    expect((await planningHome(page)).counts.ratingQuestions).toBe(1)
    const today = await calendarDay(page)
    expect(today.rounds.map((item) => item.sessionId)).toContain(round.sessionId)
    expect(today.eventTotal).toBe(7)
    expect(today.events.every((item) => !('text' in item) && !('answer' in item))).toBe(true)
    const old = await calendarDay(page, '2000-02-29')
    expect(old).toMatchObject({ eventTotal: 0, roundTotal: 0 })
    await changePlanning(page, {
      ...command,
      day: '2026-01-01',
      ratingTarget: 4,
      expectedRevision: 0,
    })
    expect((await planningHome(page, '2026-01-02')).previous).toMatchObject({
      day: '2026-01-01',
      ratingTarget: 4,
    })
    expect((await planningHome(page, '2026-01-02')).daily).toBeNull()
  } finally {
    await stop(application)
  }
})

test('活动和实际保存同事务回滚，重复回执只计一次，重复揭晓/暂不评价不计自评', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info)
  try {
    await arrangeReview(page)
    const selected = await selectForPractice(page, [a(1)])
    const start = await startFlow(page, {
      requestId: randomUUID(),
      topicId: null,
      count: 'all',
      replace: null,
      selected,
    })
    if (!start.ok) throw Error(start.error.message)
    const reveal = {
      requestId: randomUUID(),
      cursor: { sessionId: start.value.sessionId, position: 0, revision: start.value.revision },
      draft: { revision: 1, text: '必须与活动一起保存' },
    }
    const fail = () =>
      withHistoryDatabase(
        testDataDirectory,
        (db) =>
          db.exec(
            "CREATE TRIGGER fail_activity BEFORE INSERT ON learning_activities BEGIN SELECT RAISE(ABORT,'injected activity'); END",
          ),
        false,
      )
    const clear = () =>
      withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER fail_activity'), false)
    fail()
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    expect(
      await page.evaluate(
        (input) =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.reveal(input),
        reveal,
      ),
    ).toMatchObject({ ok: false })
    expect(
      await saveNote(page, { ...a(1), expectedRevision: 0, text: '失败不能计数' }),
    ).toMatchObject({ ok: false })
    expect(
      await saveReview(page, {
        ...a(1),
        expectedRevision: 1,
        state: 'done',
        dueDate: null,
        reason: '失败不能完成',
      }),
    ).toMatchObject({ ok: false })
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
    clear()
    const revealed = await page.evaluate(
      (input) => (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.reveal(input),
      reveal,
    )
    expect(
      await page.evaluate(
        (input) =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.reveal(input),
        reveal,
      ),
    ).toEqual(revealed)
    if (!revealed.ok) throw Error(revealed.error.message)
    const rating = {
      requestId: randomUUID(),
      cursor: {
        sessionId: revealed.value.sessionId,
        position: 0,
        revision: revealed.value.revision,
      },
      draft: reveal.draft,
      rating: '掌握' as const,
    }
    fail()
    const beforeRate = withHistoryDatabase(testDataDirectory, controlRecords)
    expect(
      await page.evaluate(
        (input) =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.rateAndAdvance(input),
        rating,
      ),
    ).toMatchObject({ ok: false })
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(beforeRate)
    clear()
    const rated = await page.evaluate(
      (input) =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.rateAndAdvance(input),
      rating,
    )
    expect(
      await page.evaluate(
        (input) =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.rateAndAdvance(input),
        rating,
      ),
    ).toEqual(rated)
    expect((await planningHome(page)).counts).toMatchObject({
      ratingQuestions: 1,
      ratingAttempts: 1,
      reveals: 1,
      noteSaves: 0,
      reviewAttempts: 0,
    })
    // 另轮同一题再次揭晓但不自评，第一次揭晓仍只计一次。
    const next = await startFlow(page, {
      requestId: randomUUID(),
      topicId: null,
      count: 'all',
      replace: null,
      selected,
    })
    if (!next.ok) throw Error(next.error.message)
    const outcome = await page.evaluate(async (ack) => {
      const api = (globalThis as unknown as { desktop: DesktopApi }).desktop.practice,
        draft = { revision: 0, text: '' }
      const first = await api.reveal({
        requestId: crypto.randomUUID(),
        cursor: { sessionId: ack.sessionId, position: 0, revision: ack.revision },
        draft,
      })
      if (!first.ok) throw Error(first.error.message)
      const second = await api.reveal({
        requestId: crypto.randomUUID(),
        cursor: { sessionId: ack.sessionId, position: 0, revision: first.value.revision },
        draft,
      })
      if (!second.ok) throw Error(second.error.message)
      return api.rateAndAdvance({
        requestId: crypto.randomUUID(),
        cursor: { sessionId: ack.sessionId, position: 0, revision: second.value.revision },
        draft,
        rating: null,
      })
    }, next.value)
    expect(outcome).toMatchObject({ ok: true })
    expect((await planningHome(page)).counts).toMatchObject({ ratingAttempts: 1, reveals: 2 })
  } finally {
    await stop(application)
  }
})

test('备考题单去重、CAS与删除失效，当前版本覆盖/归档分开，超500不截断', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareControl(testDataDirectory, info, 501)
  try {
    const one = randomUUID(),
      two = randomUUID(),
      goalId = randomUUID()
    expect(
      await changeSet(page, { kind: 'save', setId: one, name: '目标范围一', items: [a(1), a(2)] }),
    ).toMatchObject({ ok: true })
    expect(
      await changeSet(page, { kind: 'save', setId: two, name: '目标范围二', items: [a(2), b(1)] }),
    ).toMatchObject({ ok: true })
    const command = {
      kind: 'exam' as const,
      goalId,
      name: '嵌入式面试准备',
      deadline: '2026-11-30',
      setIds: [one, two],
      expectedRevision: 0,
    }
    const saved = await changePlanning(page, command)
    expect(await changePlanning(page, command)).toEqual(saved)
    expect(await goalScope(page, goalId)).toMatchObject({
      ok: true,
      value: { items: [a(1), a(2), b(1)] },
    })
    await createStudyRound(page, '口述练习', [a(1)])
    expect(await goalProgress(page, goalId)).toMatchObject({
      total: 3,
      active: 3,
      practiced: 1,
      rated: 1,
      mastered: 0,
    })
    await writeFile(file, controlBank('control-a', 501, true, 2))
    await importHistoryFiles(application, page, [file])
    expect(await goalProgress(page, goalId)).toMatchObject({
      total: 3,
      active: 2,
      archived: 1,
      practiced: 0,
      rated: 0,
    })
    expect(await changeSet(page, { kind: 'delete', setId: one })).toMatchObject({ ok: true })
    expect(await goalProgress(page, goalId)).toMatchObject({
      sets: [
        { setId: one, name: null },
        { setId: two, name: '目标范围二' },
      ],
    })
    expect(await goalScope(page, goalId)).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } })
    expect(await goalScope(page, goalId, two)).toMatchObject({
      ok: true,
      value: { sourceSetId: two, items: [a(2), b(1)] },
    })
    expect(
      await changePlanning(page, { ...command, name: '改名保留失效范围', expectedRevision: 1 }),
    ).toMatchObject({ ok: true, value: { revision: 2 } })
    expect(
      await changePlanning(page, { ...command, deadline: null, expectedRevision: 0 }),
    ).toMatchObject({ ok: false, error: { code: 'CONFLICT' } })
    if (!saved.ok || saved.value?.type !== 'exam') throw Error('目标未保存')
    expect(
      await changePlanning(page, { kind: 'exam-delete', expected: saved.value }),
    ).toMatchObject({ ok: false, error: { code: 'CONFLICT' } })
    const large = randomUUID(),
      tail = randomUUID(),
      largeGoal = randomUUID()
    expect(
      await changeSet(page, {
        kind: 'save',
        setId: large,
        name: '500题范围',
        items: [a(1), ...Array.from({ length: 499 }, (_, i) => a(i + 3))],
      }),
    ).toMatchObject({ ok: true })
    expect(
      await changeSet(page, { kind: 'save', setId: tail, name: '追加一题', items: [b(2)] }),
    ).toMatchObject({ ok: true })
    expect(
      await changePlanning(page, {
        ...command,
        goalId: largeGoal,
        name: '大目标',
        setIds: [large, tail],
      }),
    ).toMatchObject({ ok: true })
    expect(await goalScope(page, largeGoal)).toMatchObject({
      ok: false,
      error: { code: 'LIMIT_EXCEEDED' },
    })
    expect(await goalScope(page, largeGoal, large)).toMatchObject({
      ok: true,
      value: { sourceSetId: large },
    })
  } finally {
    await stop(application)
  }
})

test('配额优先方式/不足/重复与候选只读，确认后固定队列，日历两类分页', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info)
  try {
    await createStudyRound(page, '较早练习', [a(1)])
    const weak: QuotaRow[] = [
      { topicId: 'control-a', count: 2, priority: 'weak' },
      { topicId: 'control-b', count: 2, priority: 'oldest' },
    ]
    const before = withHistoryDatabase(testDataDirectory, controlRecords),
      preview = await quotaPreview(page, weak)
    expect(preview.ready).toBe(true)
    expect(preview.rows[0]?.items.map((item) => item.questionId)).toEqual(['q-1', 'q-2'])
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
    const oldest = await quotaPreview(page, [
      { topicId: 'control-a', count: 27, priority: 'oldest' },
    ])
    expect(oldest.rows[0]?.items.at(-1)?.questionId).toBe('q-1')
    const random = await quotaPreview(page, [
      { topicId: 'control-a', count: 27, priority: 'random' },
    ])
    expect(new Set(random.rows[0]?.items.map((item) => item.questionId)).size).toBe(27)
    expect(
      await quotaPreview(page, [
        { topicId: 'control-b', count: 4, priority: 'weak' },
        { topicId: 'missing-topic', count: 2, priority: 'random' },
      ]),
    ).toMatchObject({
      ready: false,
      rows: [
        { available: 3, deficit: 1, items: expect.any(Array) },
        { topicTitle: null, available: 0, deficit: 2, items: [] },
      ],
    })
    expect(
      await changePlanning(page, {
        kind: 'quota',
        expectedRevision: 0,
        rows: [weak[0]!, weak[0]!],
      }),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } })
    const settings = { kind: 'quota' as const, expectedRevision: 0, rows: weak },
      saved = await changePlanning(page, settings)
    expect(await changePlanning(page, settings)).toEqual(saved)
    const selected = await selectForPractice(
      page,
      preview.rows.flatMap((row) =>
        row.items.map(({ topicId, questionId }) => ({ topicId, questionId })),
      ),
      '分专题配额组卷',
    )
    const started = await startFlow(page, {
      requestId: randomUUID(),
      topicId: null,
      count: 'all',
      replace: null,
      selected,
    })
    if (!started.ok) throw Error(started.error.message)
    const queue = flowQueue(testDataDirectory, started.value.sessionId)
    await changePlanning(page, {
      ...settings,
      expectedRevision: 1,
      rows: [{ topicId: 'control-b', count: 1, priority: 'random' }],
    })
    await quotaPreview(page, weak)
    expect(flowQueue(testDataDirectory, started.value.sessionId)).toEqual(queue)
    expect(
      await page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({
          sessionId: null,
        }),
      ),
    ).toMatchObject({ ok: true, value: { session: { sessionId: started.value.sessionId } } })
    for (let n = 1; n <= 27; n++)
      await saveNote(page, { ...a(n), expectedRevision: 0, text: `日历笔记 ${n}` })
    const day = await calendarDay(page)
    expect(day.events).toHaveLength(20)
    expect(day.eventTotal).toBe(29)
    expect(await calendarDay(page, localDay(), 99, 99)).toMatchObject({
      eventPage: 2,
      roundPage: 1,
      eventTotal: 29,
      roundTotal: 2,
    })
    const month = await page.evaluate(
      (input) => (globalThis as unknown as { desktop: DesktopApi }).desktop.planning.month(input),
      { month: localDay().slice(0, 7) },
    )
    expect(month).toMatchObject({
      ok: true,
      value: { days: [{ day: localDay(), activities: 29, rounds: 2 }] },
    })
  } finally {
    await stop(application)
  }
})
