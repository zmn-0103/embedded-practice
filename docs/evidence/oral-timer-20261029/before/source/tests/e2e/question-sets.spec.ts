import { randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { expect, test } from './helpers'
import { historySnapshot, importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
import {
  a,
  b,
  changeSet,
  controlBank,
  controlRecords,
  prepareControl,
  previewSet,
  readSets,
} from './practice-control-helpers'

test('固定题单保存有序身份，更新幂等/过期冲突/ASCII同名及删除不改变学习记录', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info)
  try {
    const learning = historySnapshot(testDataDirectory)
    const original = { setId: randomUUID(), name: 'Origin', items: [b(2), a(1), a(27)] }
    expect(await changeSet(page, { kind: 'save', ...original })).toEqual({ ok: true, value: null })
    expect(await changeSet(page, { kind: 'save', ...original })).toEqual({ ok: true, value: null })
    expect((await previewSet(page, { setId: original.setId })).definition).toEqual(original)
    const update = {
      ...original,
      kind: 'update' as const,
      name: 'Edited',
      items: [a(27), b(2)],
      expected: { name: original.name, items: original.items },
    }
    expect(await changeSet(page, update)).toMatchObject({ ok: true })
    expect(await changeSet(page, update)).toMatchObject({ ok: true })
    expect(await changeSet(page, { ...update, name: 'Stale' })).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    })
    expect(
      await changeSet(page, { kind: 'save', setId: randomUUID(), name: 'eDITED', items: [a(2)] }),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } })
    for (const name of ['Ä', 'ä'])
      expect(
        await changeSet(page, { kind: 'save', setId: randomUUID(), name, items: [a(2)] }),
      ).toMatchObject({ ok: true })
    expect(await readSets(page)).toHaveLength(3)
    expect((await previewSet(page, { setId: original.setId })).definition).toEqual({
      setId: original.setId,
      name: 'Edited',
      items: [a(27), b(2)],
    })
    expect(await changeSet(page, { kind: 'delete', setId: original.setId })).toMatchObject({
      ok: true,
    })
    expect(await changeSet(page, { kind: 'delete', setId: original.setId })).toMatchObject({
      ok: true,
    })
    expect(await changeSet(page, update)).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } })
    expect(historySnapshot(testDataDirectory)).toEqual(learning)
  } finally {
    await stop(application)
  }
})

test('题单更新成员真实写失败整单回滚，数量上限拒绝且不截断原定义', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info)
  try {
    const original = { setId: randomUUID(), name: '事务原题单', items: [a(1), b(1)] }
    expect(await changeSet(page, { kind: 'save', ...original })).toMatchObject({ ok: true })
    const command = {
      ...original,
      kind: 'update' as const,
      name: '事务后题单',
      items: [b(2), a(2)],
      expected: { name: original.name, items: original.items },
    }
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER member_failure BEFORE INSERT ON question_set_items WHEN NEW.position=1 BEGIN SELECT RAISE(ABORT,'injected member write'); END",
        ),
      false,
    )
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    expect(await changeSet(page, command)).toMatchObject({
      ok: false,
      error: { code: 'DATABASE_UNAVAILABLE' },
    })
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
    withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER member_failure'), false)
    expect(await changeSet(page, command)).toMatchObject({ ok: true })
    for (let n = 1; n < 100; n++)
      expect(
        await changeSet(page, {
          kind: 'save',
          setId: randomUUID(),
          name: `上限${n}`,
          items: [a(1)],
        }),
      ).toMatchObject({ ok: true })
    const full = withHistoryDatabase(testDataDirectory, controlRecords)
    expect(
      await changeSet(page, { kind: 'save', setId: randomUUID(), name: '第101份', items: [a(1)] }),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } })
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(full)
    expect(await readSets(page)).toHaveLength(100)
  } finally {
    await stop(application)
  }
})

test('重导入后题单身份不变，预览最新版本并保留归档/失效项，不自动换题', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareControl(testDataDirectory, info)
  try {
    const original = { setId: randomUUID(), name: '更新观察', items: [a(1), a(2), b(2)] }
    expect(await changeSet(page, { kind: 'save', ...original })).toMatchObject({ ok: true })
    const first = await previewSet(page, { setId: original.setId })
    await writeFile(file, controlBank('control-a', 27, true, 2))
    await importHistoryFiles(application, page, [file])
    const next = await previewSet(page, { setId: original.setId })
    expect(next.definition).toEqual(original)
    expect(next.items.map((item) => item.status)).toEqual(['available', 'archived', 'available'])
    expect(next.items[0]!.versionId).not.toBe(first.items[0]!.versionId)
    expect(next.items[1]!.versionId).toBe(first.items[1]!.versionId)
    expect(
      await changeSet(page, {
        kind: 'save',
        setId: randomUUID(),
        name: '新收录归档',
        items: [a(2)],
      }),
    ).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } })
    // 模拟另一有效备份带入的失效身份；该表有意不外键关联题目，不能自动删项。
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db
          .prepare('UPDATE question_set_items SET question_id=? WHERE set_id=? AND position=2')
          .run('q-missing', original.setId),
      false,
    )
    const missing = await previewSet(page, { setId: original.setId })
    expect(missing.items[2]).toEqual({
      topicId: 'control-b',
      questionId: 'q-missing',
      status: 'missing',
      title: null,
      topicTitle: null,
      versionId: null,
    })
    const definition = missing.definition!
    expect(
      await changeSet(page, {
        ...definition,
        kind: 'update',
        name: '保留缺项改名',
        expected: { name: definition.name, items: definition.items },
      }),
    ).toMatchObject({ ok: true })
    expect(
      (await previewSet(page, { setId: original.setId })).items.map((item) => item.status),
    ).toEqual(['available', 'archived', 'missing'])
  } finally {
    await stop(application)
  }
})
