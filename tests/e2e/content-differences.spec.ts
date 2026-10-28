import { writeFile } from 'node:fs/promises'
import { expect, test } from './helpers'
import { captureHistory, importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
import { controlRecords } from './practice-control-helpers'
import {
  a,
  b,
  compareContent,
  currentVersion,
  listContentVersions,
  prepareUpdates,
  selectUpdateQuestion,
  updatesBank,
} from './content-updates-helpers'

test('版本元数据20条分页/无答案，分区内容严格同题/旧先新后，查询不改学习状态', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareUpdates(testDataDirectory, info)
  try {
    for (let revision = 3; revision <= 24; revision++) {
      await writeFile(file, updatesBank(revision))
      await importHistoryFiles(application, page, [file])
    }
    const identity = await currentVersion(page)
    const other = await currentVersion(page, b(1))
    const unmodified = await currentVersion(page, a(4))
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    const first = await listContentVersions(page, identity)
    const last = await listContentVersions(page, identity, 999)
    expect(first).toMatchObject({
      ok: true,
      value: { total: 23, page: 1, target: { sequence: 24 } },
    })
    if (!first.ok || !last.ok) throw new Error('缺少版本元数据')
    expect(first.value.versions).toHaveLength(20)
    expect(last.value.page).toBe(2)
    expect(last.value.versions.map((version) => version.sequence)).toEqual([3, 2, 1])
    expect(JSON.stringify(first)).not.toMatch(
      /"body"|UPDATES-BODY|UPDATES-ANSWER|CONTROL-OLD-ANSWER/,
    )
    expect(await listContentVersions(page, unmodified)).toMatchObject({
      ok: true,
      value: { total: 0, versions: [] },
    })
    const previousVersionId = last.value.versions.at(-1)!.versionId
    const question = await compareContent(page, {
      ...identity,
      previousVersionId,
      part: 'question',
    })
    expect(question).toMatchObject({
      ok: true,
      value: { previous: { sequence: 1 }, current: { sequence: 24 } },
    })
    expect(JSON.stringify(question)).toContain('CONTROL-OLD-BODY-control-a-1')
    expect(JSON.stringify(question)).toContain('UPDATES-BODY-24-1')
    expect(JSON.stringify(question)).not.toMatch(/UPDATES-ANSWER|CONTROL-OLD-ANSWER/)
    const answer = await compareContent(page, { ...identity, previousVersionId, part: 'answer' })
    expect(JSON.stringify(answer)).toContain('UPDATES-ANSWER-24-1')
    expect(JSON.stringify(answer)).not.toContain('UPDATES-BODY')
    expect(
      await compareContent(page, {
        ...identity,
        previousVersionId: other.versionId,
        part: 'question',
      }),
    ).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } })
    expect(
      await compareContent(page, {
        ...identity,
        previousVersionId: identity.versionId,
        part: 'answer',
      }),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } })
    expect(
      await listContentVersions(page, { ...identity, versionId: previousVersionId }),
    ).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } })
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
  } finally {
    await stop(application)
  }
})

test('差异主动打开才读题干，答案明确查看才读/挂载，改选旧版重新隐藏且只读', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareUpdates(testDataDirectory, info)
  try {
    await writeFile(file, updatesBank(3))
    await importHistoryFiles(application, page, [file])
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    await application.evaluate(({ ipcMain }) => {
      Reflect.set(globalThis, '__contentReads', [])
      for (const channel of ['content-updates:versions', 'content-updates:compare']) {
        const original = Reflect.get(ipcMain, '_invokeHandlers').get(channel)
        ipcMain.removeHandler(channel)
        ipcMain.handle(channel, (event, input) => {
          Reflect.get(globalThis, '__contentReads').push({ channel, part: input.part ?? null })
          return original(event, input)
        })
      }
    })
    const panel = await selectUpdateQuestion(page)
    expect(await application.evaluate(() => Reflect.get(globalThis, '__contentReads'))).toEqual([])
    await panel.locator('summary').first().click()
    const question = panel.getByLabel('题干内容差异', { exact: true })
    await expect(question).toContainText('UPDATES-BODY-2-1')
    await expect(question).toContainText('UPDATES-BODY-3-1')
    await expect(panel.getByLabel('参考答案内容差异', { exact: true })).toHaveCount(0)
    await expect(page.getByLabel('题目内容')).not.toContainText('UPDATES-ANSWER')
    expect(
      await application.evaluate(
        () =>
          Reflect.get(globalThis, '__contentReads').filter(
            (read: { part: string }) => read.part === 'answer',
          ).length,
      ),
    ).toBe(0)
    await captureHistory(application, page, info, 'question-differences.png')
    await panel.getByRole('button', { name: '查看参考答案变化', exact: true }).click()
    const answer = panel.getByLabel('参考答案内容差异', { exact: true })
    await expect(answer).toContainText('UPDATES-ANSWER-2-1')
    await expect(answer).toContainText('UPDATES-ANSWER-3-1')
    expect(
      await application.evaluate(
        () =>
          Reflect.get(globalThis, '__contentReads').filter(
            (read: { part: string }) => read.part === 'answer',
          ).length,
      ),
    ).toBeGreaterThan(0)
    await answer.scrollIntoViewIfNeeded()
    await captureHistory(application, page, info, 'answer-differences.png')
    await panel.getByRole('radio', { name: '对照内容版本1', exact: true }).check()
    await expect(question).toContainText('CONTROL-OLD-BODY-control-a-1')
    await expect(panel.getByLabel('参考答案内容差异', { exact: true })).toHaveCount(0)
    await expect(panel).not.toContainText('UPDATES-ANSWER')
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
    await panel.locator('summary').first().click()
    await expect(panel.getByLabel('题干内容差异', { exact: true })).toHaveCount(0)
  } finally {
    await stop(application)
  }
})
