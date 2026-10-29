import { randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, test } from './helpers'
import { importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
import { a, b, controlBank, controlRecords, prepareControl } from './practice-control-helpers'
import { changeRelation, createRelation, relations, searchKnowledge } from './knowledge-helpers'
import { saveNote } from './study-helpers'

test('知识关联真实事务：两端同记录/方向、重复与CAS/幂等、删除不复活、失败回滚和归档分页', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareControl(testDataDirectory, info)
  try {
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    const original = await createRelation(page)
    expect((await relations(page, b(1))).items[0]).toMatchObject({
      ...original,
      sourceTitle: '组卷题 A 1',
      targetTitle: '组卷题 B 1',
    })
    expect(
      await changeRelation(page, {
        action: 'save',
        relationId: randomUUID(),
        expectedRevision: 0,
        ...{ source: b(1), target: a(1), kind: 'confused', explanation: '反向重复' },
      }),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } })
    expect(
      await changeRelation(page, {
        action: 'save',
        relationId: randomUUID(),
        expectedRevision: 0,
        ...{ source: a(1), target: a(1), kind: 'confused', explanation: '' },
      }),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } })
    const command = {
      action: 'save' as const,
      relationId: original.relationId,
      expectedRevision: 1,
      source: original.source,
      target: original.target,
      kind: 'prerequisite' as const,
      explanation: 'B是A的前置',
    }
    const edited = await changeRelation(page, command)
    expect(edited).toMatchObject({
      ok: true,
      value: { revision: 2, kind: 'prerequisite', source: a(1), target: b(1) },
    })
    expect(await changeRelation(page, command)).toEqual(edited)
    expect(await changeRelation(page, { ...command, explanation: '旧修订覆盖' })).toMatchObject({
      ok: false,
      error: { code: 'CONFLICT' },
    })
    const snapshot = withHistoryDatabase(testDataDirectory, controlRecords)
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER fail_knowledge BEFORE UPDATE ON question_relations BEGIN SELECT RAISE(ABORT,'injected relation update'); END",
        ),
      false,
    )
    expect(
      await changeRelation(page, { ...command, expectedRevision: 2, explanation: '不能写入' }),
    ).toMatchObject({ ok: false, error: { code: 'DATABASE_UNAVAILABLE' } })
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(snapshot)
    withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER fail_knowledge'), false)
    if (!edited.ok || !edited.value) throw new Error('编辑失败')
    expect(await changeRelation(page, { action: 'delete', expected: original })).toMatchObject({
      ok: false,
      error: { code: 'CONFLICT' },
    })
    expect(await changeRelation(page, { action: 'delete', expected: edited.value })).toEqual({
      ok: true,
      value: null,
    })
    expect(await changeRelation(page, { action: 'delete', expected: edited.value })).toEqual({
      ok: true,
      value: null,
    })
    expect(await changeRelation(page, { ...command, expectedRevision: 2 })).toMatchObject({
      ok: false,
      error: { code: 'CONFLICT' },
    })
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
    for (let n = 2; n <= 27; n++) await createRelation(page, a(1), a(n))
    expect((await relations(page)).items).toHaveLength(20)
    expect(await relations(page, a(1), 99)).toMatchObject({ page: 2, total: 26 })
    await writeFile(file, controlBank('control-a', 27, true, 1))
    await importHistoryFiles(application, page, [file])
    expect((await relations(page)).items.every((item) => item.sourceArchived)).toBe(true)
    expect((await relations(page, a(2))).items[0]).toMatchObject({
      source: a(1),
      sourceArchived: true,
    })
    await writeFile(file, controlBank())
    await importHistoryFiles(application, page, [file])
    expect((await relations(page)).total).toBe(26)
  } finally {
    await stop(application)
  }
})

test('我的积累按来源合并片段，字面特殊字符/超长笔记有界、当前版本/归档与答案隔离', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareControl(testDataDirectory, info)
  try {
    await saveNote(page, {
      ...a(25),
      expectedRevision: 0,
      text:
        '前言'.repeat(30000) +
        ' DMA%_中文🧠 <script>private()</script> 发送完成说明 ' +
        '结尾'.repeat(30000),
    })
    const tagId = randomUUID()
    expect(
      await page.evaluate(
        async ({ tagId }) => {
          const api = (globalThis as unknown as { desktop: DesktopApi }).desktop.personalTags
          return [
            await api.change({ kind: 'save', tagId, name: 'DMA实践' }),
            await api.change({
              kind: 'assign',
              tagId,
              present: true,
              items: [{ topicId: 'control-a', questionId: 'q-25' }],
            }),
          ]
        },
        { tagId },
      ),
    ).toMatchObject([{ ok: true }, { ok: true }])
    await createRelation(page, a(25), a(1))
    await writeFile(file, controlBank().replace('CONTROL-OLD-BODY-control-a-2', 'DMA题干命中'))
    await importHistoryFiles(application, page, [file])
    const all = await searchKnowledge(page, { query: 'DMA' })
    expect(all.total).toBe(3)
    expect(
      all.items.find((item) => item.questionId === 'q-25')?.hits.map((hit) => hit.kind),
    ).toEqual(['note', 'tag', 'relation'])
    expect(
      all.items.find((item) => item.questionId === 'q-2')?.hits.map((hit) => hit.kind),
    ).toEqual(['question'])
    expect(JSON.stringify(all).length).toBeLessThan(4000)
    expect(all.items.every((item) => item.hits.every((hit) => hit.excerpt.length <= 400))).toBe(
      true,
    )
    const literal = await searchKnowledge(page, { query: '%_', kind: 'note' })
    expect(literal.total).toBe(1)
    expect(literal.items[0]?.hits[0]?.excerpt).toContain('DMA%_中文🧠')
    expect((await searchKnowledge(page, { query: 'CONTROL-OLD-ANSWER' })).total).toBe(0)
    const source = withHistoryDatabase(testDataDirectory, controlRecords)
    for (const kind of ['note', 'tag', 'relation'] as const)
      expect((await searchKnowledge(page, { query: 'DMA', kind })).total).toBe(
        kind === 'relation' ? 2 : 1,
      )
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(source)
    await writeFile(file, controlBank('control-a', 27, false, 25))
    await importHistoryFiles(application, page, [file])
    expect(
      (await searchKnowledge(page, { query: 'DMA', kind: 'note', archive: 'active' })).total,
    ).toBe(0)
    expect(
      (await searchKnowledge(page, { query: 'DMA', kind: 'note', archive: 'archived' })).items[0],
    ).toMatchObject({ questionId: 'q-25', archived: true })
  } finally {
    await stop(application)
  }
})

test('最近关键词保留成功次序的10个，重复提升、查询只读/分页不记词、真实写失败整批回滚', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info, 3)
  try {
    const result = await page.evaluate(async () => {
      const api = (globalThis as unknown as { desktop: DesktopApi }).desktop.knowledge
      for (let n = 0; n < 12; n++) {
        const saved = await api.changeRecent({ kind: 'remember', query: `DMA-${n}` })
        if (!saved.ok) throw new Error(saved.error.message)
      }
      return api.recent()
    })
    expect(result).toMatchObject({
      ok: true,
      value: Array.from({ length: 10 }, (_, i) => ({ query: `DMA-${11 - i}` })),
    })
    expect(
      await page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.knowledge.changeRecent({
          kind: 'remember',
          query: 'DMA-3',
        }),
      ),
    ).toEqual({ ok: true, value: null })
    const history = await page.evaluate(() =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.knowledge.recent(),
    )
    if (!history.ok) throw new Error(history.error.message)
    expect(history.value[0]?.query).toBe('DMA-3')
    await searchKnowledge(page, { query: 'only-read', page: 99 })
    expect(
      await page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.knowledge.recent(),
      ),
    ).toEqual(history)
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER fail_recent BEFORE INSERT ON recent_knowledge_searches BEGIN SELECT RAISE(ABORT,'injected recent write'); END",
        ),
      false,
    )
    expect(
      await page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.knowledge.changeRecent({
          kind: 'remember',
          query: 'DMA-3',
        }),
      ),
    ).toMatchObject({ ok: false, error: { code: 'DATABASE_UNAVAILABLE' } })
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
    withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER fail_recent'), false)
    expect(
      await page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.knowledge.changeRecent({
          kind: 'clear',
        }),
      ),
    ).toEqual({ ok: true, value: null })
    expect(
      await page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.knowledge.recent(),
      ),
    ).toEqual({ ok: true, value: [] })
  } finally {
    await stop(application)
  }
})
