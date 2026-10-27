import { rename, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import type { Page } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import type { HistorySummary } from '../../src/shared/contracts/history'
import {
  alternatePng,
  beginHistoryPractice,
  captureHistory,
  historyBank,
  historySnapshot,
  importHistoryFiles,
  prepareHistory,
  readHistory,
  readHistoryEntry,
  selectHistoryQuestion,
  stop,
  withHistoryDatabase,
} from './history-helpers'
import { expect, launchApplication, openPage, test } from './helpers'

async function questions(page: Page, archived = false) {
  const result = await page.evaluate(
    (request) =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.library.listQuestions(request),
    { topicId: 'history-a', archived, page: 1 },
  )
  if (!result.ok) throw new Error('无法读取测试题库。')
  return result.value.questions
}

test('单题历史真实记录资格、倒序分页、同轮改评、跨专题隔离及只读', async ({
  testDataDirectory,
}, info) => {
  const { application, page, seed } = await prepareHistory(testDataDirectory, info.project.name, 25)
  try {
    const before = historySnapshot(testDataDirectory)
    const first = await readHistory(page)
    const second = await readHistory(page, { page: 2 })
    expect(first).toMatchObject({ total: 25, page: 1, pageSize: 20, archived: false })
    expect(first.entries).toHaveLength(20)
    expect(second.entries).toHaveLength(5)
    const entries = [...first.entries, ...second.entries]
    expect(entries.map((entry) => entry.sessionId)).toEqual([...seed.sessions].reverse())
    expect(
      entries.every(
        (entry) =>
          entry.sessionId !== seed.untouchedSessionId && entry.sessionId !== seed.otherSessionId,
      ),
    ).toBe(true)
    expect(JSON.stringify(entries)).not.toMatch(/HISTORY-DRAFT|HISTORY-ANSWER|HISTORY-BODY/)
    const oldest = entries.find((entry) => entry.sessionId === seed.sessions[0])!
    expect(oldest.rating).toBe('不熟')
    expect(entries.filter((entry) => entry.sessionId === seed.sessions[0])).toHaveLength(1)
    const detail = await readHistoryEntry(page, oldest)
    expect(detail.draft.text).toBe('HISTORY-DRAFT-0\r\n<script>literal</script>\nint value = 0;')
    expect(detail.answer?.markdown).toContain('HISTORY-ANSWER-OLD-history-a-1')
    const hidden = await readHistoryEntry(
      page,
      entries.find((entry) => entry.revealedAt === null)!,
    )
    expect(hidden.draft.text).toMatch(/^HISTORY-DRAFT-/)
    expect(hidden).not.toHaveProperty('answer')
    const empty = await readHistoryEntry(
      page,
      entries.find((entry) => entry.revealedAt !== null && !entry.hasDraft)!,
    )
    expect(empty.draft.text).toBe('')
    expect(empty.answer?.markdown).toContain('HISTORY-ANSWER-OLD-history-a-1')
    expect((await readHistory(page, { page: 999 })).page).toBe(2)
    expect((await readHistory(page, { excludeSessionId: first.entries[0]!.sessionId })).total).toBe(
      24,
    )
    const other = await readHistory(page, { topicId: 'history-b' })
    expect(other.total).toBe(1)
    expect(
      await readHistory(page, { topicId: 'history-b', excludeSessionId: seed.otherSessionId }),
    ).toMatchObject({ total: 0, page: 1, entries: [] })
    expect((await readHistoryEntry(page, other.entries[0]!, 'history-b')).draft.text).toBe(
      'OTHER-TOPIC-DRAFT 不可串题',
    )
    for (const owner of [
      { topicId: 'history-b', questionId: 'q-1' },
      { topicId: 'history-a', questionId: 'q-2' },
    ]) {
      const mismatch = await page.evaluate(
        (request) =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.history.getEntry(request),
        { ...owner, sessionId: oldest.sessionId, position: oldest.position },
      )
      expect(mismatch).toMatchObject({ error: { code: 'NOT_FOUND' } })
    }
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    expect(before.schema).toEqual({ user_version: 9 })
    expect(before.foreignKeys).toEqual([])
    expect(before.integrity).toEqual([{ quick_check: 'ok' }])
    await info.attach('history-query-matrix.json', {
      body: JSON.stringify({ seed, first, second, detail, hidden, empty, other, before }),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})

test('内容更新标记按最新揭晓消除，旧轮/跳过/只读历史不消除，元数据不新增标记', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file, folder } = await prepareHistory(
    testDataDirectory,
    info.project.name,
  )
  try {
    expect((await questions(page)).every((question) => !question.contentUpdated)).toBe(true)
    await beginHistoryPractice(page)
    await page.getByRole('button', { name: '返回首页', exact: true }).click()
    await writeFile(file, historyBank(true))
    await importHistoryFiles(application, page, [file])
    const changed = await questions(page)
    expect(changed.every((question) => question.contentUpdated)).toBe(true)
    await selectHistoryQuestion(page)
    await expect(
      page.getByRole('article', { name: '题目内容' }).getByText('内容更新待复习', { exact: true }),
    ).toBeVisible()
    await page
      .getByRole('article', { name: '题目内容' })
      .getByText('内容更新待复习', { exact: true })
      .scrollIntoViewIfNeeded()
    await captureHistory(application, page, info, 'content-update.png')
    const beforeRead = historySnapshot(testDataDirectory)
    await page.getByRole('button', { name: '展开参考答案', exact: true }).click()
    await page.getByRole('button', { name: '查看本题历史', exact: true }).click()
    await page
      .getByRole('region', { name: '本题历史', exact: true })
      .getByRole('button', { name: '展开本次记录', exact: true })
      .first()
      .click()
    expect(historySnapshot(testDataDirectory)).toEqual(beforeRead)
    await openPage(page, '开始练习')
    await page.getByRole('button', { name: '继续练习', exact: true }).click()
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await expect(page.getByRole('region', { name: '练习参考答案', exact: true })).toContainText(
      'HISTORY-ANSWER-OLD-history-a-1',
    )
    await page.getByRole('button', { name: '返回首页', exact: true }).click()
    expect(
      (await questions(page)).find((question) => question.questionId === 'q-1')?.contentUpdated,
    ).toBe(true)
    await openPage(page, '开始练习')
    await page.getByRole('button', { name: '继续练习', exact: true }).click()
    await page.getByRole('button', { name: '结束本轮', exact: true }).click()
    await page.getByRole('button', { name: '返回首页', exact: true }).click()
    await beginHistoryPractice(page)
    await expect(page.getByRole('region', { name: '练习题干', exact: true })).toContainText(
      'HISTORY-BODY-NEW-history-a-1',
    )
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await page.getByRole('button', { name: '暂不评价，下一题', exact: true }).click()
    await page.getByRole('button', { name: '跳过本题', exact: true }).click()
    await page.getByRole('button', { name: '返回首页', exact: true }).click()
    const reviewed = await questions(page)
    expect(reviewed.find((question) => question.questionId === 'q-1')).toMatchObject({
      contentUpdated: false,
      practiced: true,
      currentRating: null,
    })
    expect(reviewed.find((question) => question.questionId === 'q-2')).toMatchObject({
      contentUpdated: true,
      practiced: false,
    })
    await writeFile(file, historyBank(true, true))
    await importHistoryFiles(application, page, [file])
    const metadata = await questions(page)
    for (const question of metadata) {
      const prior = reviewed.find((old) => old.questionId === question.questionId)!
      expect(question).toMatchObject({
        versionId: prior.versionId,
        contentUpdated: prior.contentUpdated,
      })
    }
    await writeFile(join(folder, 'assets/history.png'), alternatePng)
    await importHistoryFiles(application, page, [file])
    const imageUpdated = await questions(page)
    expect(imageUpdated.find((question) => question.questionId === 'q-1')?.contentUpdated).toBe(
      true,
    )
    expect(imageUpdated.find((question) => question.questionId === 'q-1')?.versionId).not.toBe(
      metadata.find((question) => question.questionId === 'q-1')?.versionId,
    )
    expect(imageUpdated.find((question) => question.questionId === 'q-2')?.versionId).toBe(
      metadata.find((question) => question.questionId === 'q-2')?.versionId,
    )
    // 独立旧状态兼容：只有新版有效自评、没有新版作答，不补造历史。
    const countBefore = (await readHistory(page, { questionId: 'q-2' })).total
    withHistoryDatabase(
      testDataDirectory,
      (database) =>
        database.exec(`UPDATE question_user_state
      SET last_rating = '掌握', last_rated_version_id = (SELECT current_version_id FROM questions WHERE topic_id='history-a' AND question_id='q-2')
      WHERE question_id = (SELECT id FROM questions WHERE topic_id='history-a' AND question_id='q-2')`),
      false,
    )
    expect((await questions(page)).find((question) => question.questionId === 'q-2')).toMatchObject(
      { contentUpdated: false, currentRating: '掌握' },
    )
    expect((await readHistory(page, { questionId: 'q-2' })).total).toBe(countBefore)
    await info.attach('content-update-lifecycle.json', {
      body: JSON.stringify({
        changed,
        reviewed,
        metadata,
        imageUpdated,
        final: historySnapshot(testDataDirectory),
      }),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})

test('历史旧版本图片在替换/来源移动/归档恢复与独立进程重开后可读', async ({
  testDataDirectory,
}, info) => {
  const first = await prepareHistory(testDataDirectory, info.project.name, 2)
  let movedFile = ''
  let originalHistory: Awaited<ReturnType<typeof readHistory>>
  let oldEntry: HistorySummary
  try {
    originalHistory = await readHistory(first.page)
    oldEntry = originalHistory.entries.find((entry) => entry.revealedAt !== null)!
    await writeFile(join(first.folder, 'assets/history.png'), alternatePng)
    await importHistoryFiles(first.application, first.page, [first.file])
    const destination = resolve(join(testDataDirectory, '已移动的历史来源'))
    if (
      dirname(resolve(first.folder)) !== resolve(testDataDirectory) ||
      dirname(destination) !== resolve(testDataDirectory)
    )
      throw new Error('拒绝移动测试目录以外的路径。')
    await rename(first.folder, destination)
    movedFile = join(destination, '历史.md')
    await first.application.close()
  } finally {
    await stop(first.application)
  }
  const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  try {
    await selectHistoryQuestion(page)
    const currentImage = page
      .getByRole('article', { name: '题目内容' })
      .getByRole('img', { name: '历史图', exact: true })
    await expect
      .poll(() =>
        currentImage.evaluate((node) => (node as unknown as { naturalWidth: number }).naturalWidth),
      )
      .toBe(3)
    await page.getByRole('button', { name: '查看本题历史', exact: true }).click()
    const records = page.getByRole('region', { name: '本题历史', exact: true })
    await records.getByRole('button', { name: '展开本次记录', exact: true }).last().click()
    const oldImage = records
      .getByRole('region', { name: '历史题干', exact: true })
      .getByRole('img', { name: '历史图', exact: true })
    await oldImage.scrollIntoViewIfNeeded()
    await expect
      .poll(() =>
        oldImage.evaluate((node) => (node as unknown as { naturalWidth: number }).naturalWidth),
      )
      .toBe(2)
    expect(await oldImage.getAttribute('src')).toContain(`/resource/${oldEntry.versionId}/`)
    await expect(records.getByRole('region', { name: '历史参考答案', exact: true })).toContainText(
      'HISTORY-ANSWER-OLD-history-a-1',
    )
    await captureHistory(application, page, info, 'history-old-image.png')
    const beforeArchive = await readHistory(page)
    expect(
      beforeArchive.entries.every(
        (entry) => !entry.isCurrentVersion && entry.versionSequence === 1,
      ),
    ).toBe(true)
    await writeFile(movedFile, historyBank(false, false, true))
    await importHistoryFiles(application, page, [movedFile])
    const archived = await readHistory(page)
    expect(archived.archived).toBe(true)
    expect(archived.entries).toEqual(beforeArchive.entries)
    await page.getByRole('checkbox', { name: '查看归档题目', exact: true }).check()
    await selectHistoryQuestion(page)
    await expect(page.getByRole('article', { name: '题目内容' })).toContainText('已归档')
    await page.getByRole('button', { name: '查看本题历史', exact: true }).click()
    await expect(page.getByRole('region', { name: '本题历史', exact: true })).toContainText(
      '共 2 条历史记录',
    )
    await writeFile(movedFile, historyBank())
    await importHistoryFiles(application, page, [movedFile])
    const restored = await readHistory(page)
    expect(restored.archived).toBe(false)
    expect(restored.currentVersionId).toBe(beforeArchive.currentVersionId)
    expect(restored.entries).toEqual(beforeArchive.entries)
    expect((await readHistoryEntry(page, oldEntry)).answer?.markdown).toContain(
      'HISTORY-ANSWER-OLD-history-a-1',
    )
    expect(historySnapshot(testDataDirectory).foreignKeys).toEqual([])
    await info.attach('history-image-archive-restore.json', {
      body: JSON.stringify({
        originalHistory,
        beforeArchive,
        archived,
        restored,
        final: historySnapshot(testDataDirectory),
      }),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})
