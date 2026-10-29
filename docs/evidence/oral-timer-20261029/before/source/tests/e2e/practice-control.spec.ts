import { randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, launchApplication, test } from './helpers'
import { historySnapshot, importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
import { a, b, controlBank, prepareControl, selectForPractice } from './practice-control-helpers'
import { endFlow, startFlow } from './practice-flow-helpers'

async function read(page: Page) {
  const result = await page.evaluate(() =>
    (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
  )
  if (!result.ok || !result.value) throw new Error('缺少本轮')
  return result.value
}
async function jump(page: Page, targetPosition: number, text = '') {
  const { session, item } = await read(page)
  if (!item) throw new Error('缺少当前题')
  return page.evaluate(
    (input) => (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.navigate(input),
    {
      requestId: randomUUID(),
      cursor: {
        sessionId: session.sessionId,
        position: session.position,
        revision: session.revision,
      },
      draft: { revision: item.draft.revision + 1, text },
      direction: 'jump' as const,
      targetPosition,
    },
  )
}

test('指定身份顺序/随机仅选这些题，重开及题库更新不改变已建队列/版本/草稿', async ({
  testDataDirectory,
}, info) => {
  const prepared = await prepareControl(testDataDirectory, info)
  let instance = { application: prepared.application, page: prepared.page }
  try {
    const items = [b(2), a(3), a(1)]
    const selected = await selectForPractice(instance.page, items)
    const command = {
      requestId: randomUUID(),
      topicId: null,
      count: 'all' as const,
      replace: null,
      selected,
    }
    expect(await startFlow(instance.page, command)).toMatchObject({ ok: true, value: { total: 3 } })
    expect(await startFlow(instance.page, command)).toMatchObject({ ok: true, value: { total: 3 } })
    const initial = await read(instance.page)
    expect(initial.session.selectionName).toBe('题单：测试顺序')
    const queue = () =>
      withHistoryDatabase(testDataDirectory, (db) =>
        db
          .prepare(
            'SELECT q.topic_id AS topicId,q.question_id AS questionId,i.version_id AS versionId FROM practice_items i JOIN questions q ON q.id=i.question_id WHERE i.session_id=? ORDER BY i.position',
          )
          .all(initial.session.sessionId),
      )
    expect(queue()).toEqual(selected.items)
    expect(await jump(instance.page, 2, '首题独立草稿')).toMatchObject({
      ok: true,
      value: { position: 2 },
    })
    await writeFile(prepared.other, controlBank('control-b', 3, true, 2))
    await importHistoryFiles(instance.application, instance.page, [prepared.other])
    const storedQueue = queue(),
      before = historySnapshot(testDataDirectory)
    await stop(instance.application)
    instance = await launchApplication(testDataDirectory, info.project.name)
    expect(queue()).toEqual(storedQueue)
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    expect(await jump(instance.page, 0)).toMatchObject({ ok: true })
    const old = await read(instance.page)
    expect(old.item).toMatchObject({
      ...b(2),
      revealed: false,
      draft: { text: '首题独立草稿' },
      body: { markdown: 'CONTROL-OLD-BODY-control-b-2' },
    })
    expect(old.item).not.toHaveProperty('answer')
    expect(await endFlow(instance.page)).toMatchObject({ ok: true })
    const source = old.session.sessionId
    expect(
      await startFlow(instance.page, {
        requestId: randomUUID(),
        topicId: null,
        count: 'all',
        replace: null,
        repeat: { sessionId: source, selection: 'all' },
      }),
    ).toMatchObject({ ok: true, value: { total: 3 } })
    expect((await read(instance.page)).session.selectionName).toBe('题单：测试顺序')
    expect(await endFlow(instance.page)).toMatchObject({ ok: true })
    const randomItems = [a(7), b(1), a(9), a(2)]
    const random = await selectForPractice(instance.page, randomItems)
    expect(
      await startFlow(instance.page, {
        requestId: randomUUID(),
        topicId: null,
        count: 'all',
        replace: null,
        mode: 'random',
        selected: random,
      }),
    ).toMatchObject({ ok: true, value: { total: 4 } })
    const current = await read(instance.page)
    const randomQueue = withHistoryDatabase(testDataDirectory, (db) =>
      db
        .prepare(
          'SELECT q.topic_id AS topicId,q.question_id AS questionId FROM practice_items i JOIN questions q ON q.id=i.question_id WHERE i.session_id=? ORDER BY i.position',
        )
        .all(current.session.sessionId),
    )
    expect(randomQueue).toHaveLength(4)
    expect(randomQueue.map((item) => JSON.stringify(item)).sort()).toEqual(
      randomItems.map((item) => JSON.stringify(item)).sort(),
    )
  } finally {
    await stop(instance.application)
  }
})

test('开始前版本/归档/缺项变化拒绝整轮，真实插入失败保留原活动轮和全部记录', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareControl(testDataDirectory, info)
  try {
    expect(
      await startFlow(page, {
        requestId: randomUUID(),
        topicId: 'control-b',
        count: 'all',
        replace: null,
      }),
    ).toMatchObject({ ok: true })
    const old = await read(page)
    const replace = {
      sessionId: old.session.sessionId,
      position: old.session.position,
      revision: old.session.revision,
    }
    const selected = await selectForPractice(page, [a(1), a(2)])
    await writeFile(file, controlBank('control-a', 27, true, 2))
    await importHistoryFiles(application, page, [file])
    for (const items of [selected.items, [selected.items[1]!], [{ ...a(99), versionId: 1 }]]) {
      const before = historySnapshot(testDataDirectory)
      expect(
        await startFlow(page, {
          requestId: randomUUID(),
          topicId: null,
          count: 'all',
          replace,
          selected: { ...selected, items },
        }),
      ).toMatchObject({ ok: false, error: { code: 'SESSION_CONFLICT' } })
      expect(historySnapshot(testDataDirectory)).toEqual(before)
    }
    const fresh = await selectForPractice(page, [a(1), b(1)])
    const command = {
      requestId: randomUUID(),
      topicId: null,
      count: 'all' as const,
      replace,
      selected: fresh,
    }
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER selected_start_failure BEFORE INSERT ON practice_items WHEN NEW.position=1 BEGIN SELECT RAISE(ABORT,'injected selected start'); END",
        ),
      false,
    )
    const before = historySnapshot(testDataDirectory)
    expect(await startFlow(page, command)).toMatchObject({
      ok: false,
      error: { code: 'WRITE_FAILED' },
    })
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    withHistoryDatabase(
      testDataDirectory,
      (db) => db.exec('DROP TRIGGER selected_start_failure'),
      false,
    )
    expect(await startFlow(page, command)).toMatchObject({ ok: true, value: { total: 2 } })
    expect((await read(page)).item?.body.markdown).toBe('CONTROL-NEW-BODY-control-a-1')
  } finally {
    await stop(application)
  }
})

test('本轮清单只读元数据且50题分页，跳过/未评价分开，跳题保存/越界/回执及写失败可恢复', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info, 52)
  try {
    expect(
      await startFlow(page, {
        requestId: randomUUID(),
        topicId: 'control-a',
        count: 'all',
        replace: null,
      }),
    ).toMatchObject({ ok: true, value: { total: 52 } })
    const result = await page.evaluate(async () => {
      const api = (globalThis as unknown as { desktop: DesktopApi }).desktop.practice
      const first = await api.read({ sessionId: null })
      if (!first.ok || !first.value?.item) throw new Error('无当前题')
      const draft = { revision: 0, text: '' }
      let cursor = { sessionId: first.value.session.sessionId, position: 0, revision: 0 }
      const skipped = await api.navigate({
        requestId: crypto.randomUUID(),
        cursor,
        draft,
        direction: 'skip',
      })
      if (!skipped.ok) throw new Error(skipped.error.message)
      cursor = { ...cursor, position: skipped.value.position, revision: skipped.value.revision }
      const shown = await api.reveal({ requestId: crypto.randomUUID(), cursor, draft })
      if (!shown.ok) throw new Error(shown.error.message)
      cursor = { ...cursor, revision: shown.value.revision }
      const rated = await api.rateAndAdvance({
        requestId: crypto.randomUUID(),
        cursor,
        draft,
        rating: '不会',
      })
      if (!rated.ok) throw new Error(rated.error.message)
      cursor = { ...cursor, position: rated.value.position, revision: rated.value.revision }
      const unrated = await api.reveal({ requestId: crypto.randomUUID(), cursor, draft })
      if (!unrated.ok) throw new Error(unrated.error.message)
      return unrated.value
    })
    const before = historySnapshot(testDataDirectory)
    const outline = await page.evaluate(
      (sessionId) =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.outline({
          sessionId,
          page: 1,
        }),
      result.sessionId,
    )
    expect(outline).toMatchObject({
      ok: true,
      value: {
        total: 52,
        page: 1,
        items: [
          expect.objectContaining({ position: 0, revealed: false, rating: null, skipped: true }),
          expect.objectContaining({ position: 1, revealed: true, rating: '不会', skipped: false }),
          expect.objectContaining({ position: 2, revealed: true, rating: null, skipped: false }),
          ...Array.from({ length: 47 }, () =>
            expect.objectContaining({ revealed: false, rating: null, skipped: false }),
          ),
        ],
      },
    })
    expect(JSON.stringify(outline)).not.toMatch(/CONTROL-|"body"|"answer"|"draft"/)
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    const target = {
      requestId: randomUUID(),
      cursor: { sessionId: result.sessionId, position: result.position, revision: result.revision },
      draft: { revision: 1, text: '跳转前完整输入\n  code();' },
      direction: 'jump' as const,
      targetPosition: 51,
    }
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER jump_failure BEFORE UPDATE OF position ON practice_sessions BEGIN SELECT RAISE(ABORT,'injected jump'); END",
        ),
      false,
    )
    expect(
      await page.evaluate(
        (input) =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.navigate(input),
        target,
      ),
    ).toMatchObject({ ok: false, error: { code: 'WRITE_FAILED' } })
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER jump_failure'), false)
    for (let n = 0; n < 2; n++)
      expect(
        await page.evaluate(
          (input) =>
            (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.navigate(input),
          target,
        ),
      ).toMatchObject({ ok: true, value: { position: 51 } })
    const after = historySnapshot(testDataDirectory)
    expect(
      await page.evaluate(
        (input) =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.navigate(input),
        { ...target, targetPosition: 50 },
      ),
    ).toMatchObject({ ok: false, error: { code: 'REQUEST_CONFLICT' } })
    expect(await jump(page, 52)).toMatchObject({ ok: false, error: { code: 'BOUNDARY' } })
    expect(historySnapshot(testDataDirectory)).toEqual(after)
    const last = await page.evaluate(
      (sessionId) =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.outline({
          sessionId,
          page: 2,
        }),
      result.sessionId,
    )
    expect(last).toMatchObject({
      ok: true,
      value: {
        items: [
          expect.objectContaining({ position: 50 }),
          expect.objectContaining({ position: 51 }),
        ],
      },
    })
    expect((await read(page)).item).toMatchObject({
      position: 51,
      revealed: false,
      draft: { text: '' },
    })
    expect(
      withHistoryDatabase(testDataDirectory, (db) =>
        db
          .prepare('SELECT draft,rating FROM practice_items WHERE session_id=? AND position=2')
          .get(result.sessionId),
      ),
    ).toEqual({ draft: '跳转前完整输入\n  code();', rating: null })
  } finally {
    await stop(application)
  }
})
