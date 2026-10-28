import { randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { expect, test } from './helpers'
import { importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
import { controlBank, controlRecords, selectForPractice } from './practice-control-helpers'
import { startFlow } from './practice-flow-helpers'
import {
  a,
  b,
  prepareUpdates,
  readUpdateRound,
  revealUpdateRound,
  updatesBank,
  updatesSelection,
} from './content-updates-helpers'

test('更新题预览后已揭晓/版本更新/归档均整轮拒绝，原活动轮与完整学习数据不变', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file, other } = await prepareUpdates(testDataDirectory, info)
  try {
    const selected = await updatesSelection(page)
    expect(
      await startFlow(page, {
        requestId: randomUUID(),
        topicId: null,
        count: 'all',
        replace: null,
        selected: await selectForPractice(page, [a(1), b(2)]),
      }),
    ).toMatchObject({ ok: true })
    expect(await revealUpdateRound(page)).toMatchObject({ ok: true })
    const { session } = await readUpdateRound(page)
    const replace = {
      sessionId: session.sessionId,
      position: session.position,
      revision: session.revision,
    }
    const reject = async (selection: typeof selected) => {
      const before = withHistoryDatabase(testDataDirectory, controlRecords)
      expect(
        await startFlow(page, {
          requestId: randomUUID(),
          topicId: null,
          count: 'all',
          replace,
          selected: selection,
        }),
      ).toMatchObject({ ok: false, error: { code: 'SESSION_CONFLICT' } })
      expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
      expect((await readUpdateRound(page)).session.sessionId).toBe(session.sessionId)
    }
    await reject(selected)
    await writeFile(file, updatesBank(3))
    await importHistoryFiles(application, page, [file])
    await reject(selected)
    const fresh = await updatesSelection(page)
    await writeFile(other, controlBank('control-b', 3, true, 1))
    await importHistoryFiles(application, page, [other])
    await reject(fresh)
  } finally {
    await stop(application)
  }
})

test('更新建轮真实插入失败回滚原轮/队列/回执，同请求重试成功且揭晓后再重放不重复', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareUpdates(testDataDirectory, info)
  try {
    expect(
      await startFlow(page, {
        requestId: randomUUID(),
        topicId: 'control-b',
        count: 'all',
        replace: null,
      }),
    ).toMatchObject({ ok: true })
    const { session } = await readUpdateRound(page)
    const command = {
      requestId: randomUUID(),
      topicId: null,
      count: 'all' as const,
      replace: {
        sessionId: session.sessionId,
        position: session.position,
        revision: session.revision,
      },
      selected: await updatesSelection(page),
    }
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER updated_start_failure BEFORE INSERT ON practice_items WHEN NEW.position=1 BEGIN SELECT RAISE(ABORT,'injected updated start'); END",
        ),
      false,
    )
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    expect(await startFlow(page, command)).toMatchObject({
      ok: false,
      error: { code: 'WRITE_FAILED' },
    })
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
    withHistoryDatabase(
      testDataDirectory,
      (db) => db.exec('DROP TRIGGER updated_start_failure'),
      false,
    )
    const started = await startFlow(page, command)
    expect(started).toMatchObject({ ok: true, value: { total: 2 } })
    expect(await revealUpdateRound(page)).toMatchObject({ ok: true })
    const revealed = withHistoryDatabase(testDataDirectory, controlRecords)
    expect(await startFlow(page, command)).toEqual(started)
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(revealed)
    expect(
      withHistoryDatabase(testDataDirectory, (db) =>
        db
          .prepare(
            'SELECT status,count(*) AS total FROM practice_sessions GROUP BY status ORDER BY status',
          )
          .all(),
      ),
    ).toEqual([
      { status: 'active', total: 1 },
      { status: 'ended', total: 1 },
    ])
  } finally {
    await stop(application)
  }
})
