import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { librarySchema } from '../../src/main/database/library-schema'
import { exercisePractice } from '../integration/practice-exercise'
import { expect, launchApplication, readAppStatus, test } from './helpers'

function bank(topicId: string, title: string, count: number, updated = false): string {
  const prefix = topicId === 'practice-fixture' ? 'practice' : 'alpha'
  const numbers = updated ? [1, 3] : Array.from({ length: count }, (_, index) => index + 1)
  return (
    `---\nschema_version: 1\ntopic_id: ${topicId}\ntopic_title: ${title}\n---\n\n` +
    numbers
      .map(
        (n) =>
          `## ${prefix}-${String(n).padStart(3, '0')} | ${updated ? '更新' : '原始'}标题 ${n}\n\n标签：${updated ? '新标签' : '旧标签'}\n难度：基础\n\n### 题目\n\n${updated ? '更新' : '原始'}题干 ${n}\n\n${n === 1 ? '![测试图](assets/small.png)\n\n' : ''}### 参考答案\n\n${updated ? '更新' : '原始'}答案 ${n}\n\n`,
      )
      .join('')
  )
}
async function sources(directory: string, count = 2) {
  const root = join(directory, 'sources')
  const updated = join(directory, 'updated')
  await mkdir(join(root, 'assets'), { recursive: true })
  await mkdir(join(updated, 'assets'), { recursive: true })
  for (const folder of [root, updated])
    await copyFile(resolve('tests/fixtures/images/small.png'), join(folder, 'assets/small.png'))
  const first = join(root, '顺序练习.md'),
    second = join(root, '前序专题.md')
  const next = join(updated, '更名后的文件.md')
  await writeFile(first, bank('practice-fixture', 'B 专题', count))
  await writeFile(second, bank('alpha-fixture', 'A 专题', 2))
  await writeFile(next, bank('practice-fixture', 'Z 更新专题', count, true))
  return { filePaths: [first, second], updatedPaths: [next] }
}
function code(result: unknown, expected: string) {
  expect(result).toMatchObject({ ok: false, error: { code: expected } })
}

test('顺序队列、草稿、揭晓、自评修改、跳过与独立进程恢复', async ({ testDataDirectory }, info) => {
  const prepared = await sources(testDataDirectory, 12)
  const { application } = await launchApplication(testDataDirectory, info.project.name)
  try {
    const result = await application.evaluate(exercisePractice, {
      mode: 'lifecycle' as const,
      directory: testDataDirectory,
      ...prepared,
    })
    expect(result.noActive).toBeNull()
    code(result.noMatch, 'NO_QUESTIONS')
    expect(result.emptyCount).toEqual({ count: 0 })
    expect(result.started).toMatchObject({ total: 10, position: 0, revision: 0, status: 'active' })
    expect(result.queue).toEqual(
      Array.from({ length: 10 }, (_, i) => ({ id: `practice-${String(i + 1).padStart(3, '0')}` })),
    )
    code(result.requestConflict, 'REQUEST_CONFLICT')
    code(result.activeConflict, 'ACTIVE_SESSION_EXISTS')
    expect(result.first?.item).toMatchObject({
      revealed: false,
      draft: { revision: 0, text: '' },
      rating: null,
    })
    expect(result.first?.item).not.toHaveProperty('answer')
    expect(result.savedAgain).toEqual(result.saved)
    code(result.staleDraft, 'DRAFT_STALE')
    code(result.conflictingDraft, 'DRAFT_CONFLICT')
    expect(result.beforeReveal?.item?.draft).toEqual({
      revision: 2,
      text: '中文草稿\r\n  int value = 1;\n',
    })
    for (const failure of [result.ratingHidden, result.nextHidden]) code(failure, 'REVEAL_REQUIRED')
    code(result.firstBoundary, 'BOUNDARY')
    expect(result.staleTransitions).toHaveLength(3)
    for (const failure of [...(result.staleTransitions ?? []), result.staleRatingDraft])
      code(failure, 'DRAFT_STALE')
    expect(result.staleTransitionsUnchanged).toBe(true)
    expect(result.staleRatingUnchanged).toBe(true)
    expect(result.revealed?.item).toMatchObject({
      revealed: true,
      answer: { markdown: '原始答案 1' },
    })
    expect(result.firstTimeRetained).toBe(true)
    expect(result.revealAgain).toMatchObject({ position: 0, revision: 1 })
    expect(result.duplicateRate).toMatchObject({ position: 1, revision: 3 })
    code(result.staleRate, 'SESSION_CONFLICT')
    expect(result.second?.session.counts).toMatchObject({
      revealed: 1,
      rated: 1,
      ratings: { 掌握: 1 },
    })
    expect(result.second?.item).toMatchObject({
      revealed: false,
      draft: { text: '' },
      rating: null,
    })
    expect(result.skipped?.session.counts.skipped).toBe(1)
    expect(result.skippedReturned?.item).toMatchObject({
      revealed: false,
      questionId: 'practice-002',
    })
    expect(result.pureThinking?.session.counts).toMatchObject({
      revealed: 2,
      rated: 1,
      unrated: 1,
      skipped: 0,
    })
    expect(result.unrated?.session.counts.rated).toBe(1)
    expect(result.answerRetained?.item).toMatchObject({ revealed: true, draft: { text: '' } })
    expect(result.draftRetained?.item).toMatchObject({
      revealed: true,
      rating: '掌握',
      draft: result.beforeReveal?.item?.draft,
    })
    expect(result.changedRating?.session.counts).toMatchObject({
      rated: 1,
      ratings: { 不会: 1, 掌握: 0 },
    })
    expect(result.state).toEqual({ favorite: 1, rating: '不会' })
    expect(result.endedView).toMatchObject({ session: { status: 'ended', total: 10 }, item: null })
    expect(result.finished).toMatchObject({
      session: {
        status: 'finished',
        position: 2,
        total: 2,
        counts: { revealed: 1, rated: 0, unrated: 1, skipped: 1 },
      },
      item: null,
    })
    expect(result.all?.total).toBe(14)
    expect(result.allOrder?.slice(0, 3)).toEqual([
      { topicId: 'alpha-fixture', questionId: 'alpha-001' },
      { topicId: 'alpha-fixture', questionId: 'alpha-002' },
      { topicId: 'practice-fixture', questionId: 'practice-001' },
    ])
    code(result.failedReplace, 'NO_QUESTIONS')
    expect(result.preservedAfterEmpty?.sessionId).toBe(result.all?.sessionId)
    code(result.staleReplace, 'SESSION_CONFLICT')
    expect(result.priorEnded?.status).toBe('ended')
    expect(result.newRound?.item).toMatchObject({
      questionId: 'practice-001',
      revealed: false,
      rating: null,
      draft: { revision: 0, text: '' },
    })
    expect(result.newRound?.item).not.toHaveProperty('answer')
    expect(result.persistent?.item?.draft.text).toBe('跨进程保留的草稿')
    code(result.closed, 'SERVICE_CLOSED')
    expect(result.foreignKeys).toEqual([])
    expect(result.errors).toEqual([])
    await info.attach('practice-lifecycle.json', {
      body: JSON.stringify(result),
      contentType: 'application/json',
    })
  } finally {
    await application.close()
  }
  const reopened = await launchApplication(testDataDirectory, info.project.name)
  try {
    const result = await reopened.application.evaluate(exercisePractice, {
      mode: 'reopen' as const,
      directory: testDataDirectory,
      filePaths: [],
    })
    expect(result.view?.item).toMatchObject({
      questionId: 'practice-001',
      revealed: false,
      draft: { revision: 1, text: '跨进程保留的草稿' },
    })
    expect(result.view?.item).not.toHaveProperty('answer')
    expect(result.foreignKeys).toEqual([])
    expect(result.errors).toEqual([])
    await info.attach('practice-reopened.json', {
      body: JSON.stringify(result),
      contentType: 'application/json',
    })
  } finally {
    await reopened.application.close()
  }
})

test('实际题库更新与归档保留本轮版本和真实作答行，新轮使用最新内容', async ({
  testDataDirectory,
}, info) => {
  const prepared = await sources(testDataDirectory)
  const { application } = await launchApplication(testDataDirectory, info.project.name)
  try {
    const result = await application.evaluate(exercisePractice, {
      mode: 'versions' as const,
      directory: testDataDirectory,
      ...prepared,
    })
    expect(result.update?.counts).toMatchObject({ added: 1, updated: 1, archived: 1 })
    expect(result.after).toEqual(result.before)
    expect(result.after?.item).toMatchObject({
      title: '原始标题 1',
      topicTitle: 'B 专题',
      answer: { markdown: '原始答案 1' },
    })
    expect(result.oldSecond?.item).toMatchObject({
      questionId: 'practice-002',
      title: '原始标题 2',
      body: { markdown: '原始题干 2' },
    })
    expect(result.state).toMatchObject({
      favorite: 1,
      ratedVersion: result.original?.item?.versionId,
    })
    expect(result.state).not.toMatchObject({ currentVersion: result.original?.item?.versionId })
    expect(result.history).toMatchObject([
      { draft: '旧版本作答', rating: '掌握', answer: '原始答案 1', imageCount: 1 },
      { draft: '', rating: null, answer: '原始答案 2' },
    ])
    expect(result.completed).toMatchObject({
      session: { status: 'finished', counts: { revealed: 2, rated: 1, unrated: 1 } },
    })
    expect(result.fresh?.item).toMatchObject({
      title: '更新标题 1',
      topicTitle: 'Z 更新专题',
      tags: ['新标签'],
      revealed: false,
      draft: { text: '' },
    })
    expect(result.fresh?.item?.versionId).not.toBe(result.original?.item?.versionId)
    expect(result.fresh?.item).not.toHaveProperty('answer')
    expect(result.foreignKeys).toEqual([])
    expect(result.errors).toEqual([])
    await info.attach('practice-versions.json', {
      body: JSON.stringify(result),
      contentType: 'application/json',
    })
  } finally {
    await application.close()
  }
})

test('自评推进、结束回执、草稿和揭晓故障分别整笔回滚并可重试', async ({
  testDataDirectory,
}, info) => {
  const prepared = await sources(testDataDirectory)
  const { application } = await launchApplication(testDataDirectory, info.project.name)
  try {
    const result = await application.evaluate(exercisePractice, {
      mode: 'rollback' as const,
      directory: testDataDirectory,
      ...prepared,
    })
    for (const failure of [
      result.failed,
      result.endFailed,
      result.draftFailed,
      result.revealFailed,
    ])
      code(failure, 'WRITE_FAILED')
    for (const unchanged of [
      result.unchanged,
      result.endUnchanged,
      result.draftUnchanged,
      result.revealUnchanged,
    ])
      expect(unchanged).toBe(true)
    expect(result.retry).toMatchObject({ position: 1, revision: 2 })
    expect(result.afterRetry?.session.counts).toMatchObject({ rated: 1, ratings: { 不会: 1 } })
    expect(result.ended).toMatchObject({ status: 'ended' })
    expect(result.errors).toEqual([
      '主动注入推进失败',
      '主动注入回执失败',
      '主动注入草稿失败',
      '主动注入揭晓失败',
    ])
    expect(result.foreignKeys).toEqual([])
    await info.attach('practice-rollback.json', {
      body: JSON.stringify(result),
      contentType: 'application/json',
    })
  } finally {
    await application.close()
  }
})

test('提交后响应异常先确认持久化；核实不可用时停写，重开按原回执确认', async ({
  testDataDirectory,
}, info) => {
  const prepared = await sources(testDataDirectory)
  const { application } = await launchApplication(testDataDirectory, info.project.name)
  try {
    const result = await application.evaluate(exercisePractice, {
      mode: 'durability' as const,
      directory: testDataDirectory,
      ...prepared,
    })
    expect(result.outer).toBe('WRITE_FAILED')
    expect(result.started).toMatchObject({ status: 'active', position: 0, total: 2 })
    expect(result.saved).toMatchObject({ position: 0, draftRevision: 1 })
    expect(result.rated).toMatchObject({ position: 1, revision: 2 })
    for (const failure of [
      result.unknown,
      result.blocked,
      result.draftUnknown,
      result.draftBlocked,
    ])
      expect(failure).toBe('OUTCOME_UNKNOWN')
    expect(result.recovered).toMatchObject({
      session: { status: 'finished', position: 2, counts: { rated: 1, skipped: 1 } },
      item: null,
    })
    expect(result.recoveredReceipt).toMatchObject({ status: 'finished', position: 2, revision: 3 })
    expect(result.draftRecovered?.item?.draft).toEqual({ revision: 1, text: '关闭连接后仍已入库' })
    expect(result.draftConfirmed).toMatchObject({ position: 0, draftRevision: 1 })
    expect(result.foreignKeys).toEqual([])
    expect(result.errors).toEqual([])
    await info.attach('practice-durability.json', {
      body: JSON.stringify(result),
      contentType: 'application/json',
    })
  } finally {
    await application.close()
  }
})

test('草稿真实 UTF-8 字节边界、非法输入和数据库约束', async ({ testDataDirectory }, info) => {
  const prepared = await sources(testDataDirectory)
  const { application } = await launchApplication(testDataDirectory, info.project.name)
  try {
    const result = await application.evaluate(exercisePractice, {
      mode: 'limits' as const,
      directory: testDataDirectory,
      ...prepared,
    })
    for (const failure of result.invalid ?? []) code(failure, 'INVALID_REQUEST')
    expect(result.invalid).toHaveLength(4)
    code(result.oversized, 'INVALID_REQUEST')
    code(result.missing, 'SESSION_NOT_FOUND')
    code(result.badPosition, 'SESSION_CONFLICT')
    expect(result.bytes).toBe(1048576)
    expect(result.exact).toBe(true)
    expect(result.constraints).toEqual([
      'singleActive',
      'versionOwner',
      'ratingBeforeReveal',
      'byteLimit',
      'uniqueQuestion',
    ])
    expect(result.foreignKeys).toEqual([])
    expect(result.errors).toEqual([])
    await info.attach('practice-limits.json', {
      body: JSON.stringify(result),
      contentType: 'application/json',
    })
  } finally {
    await application.close()
  }
})

async function legacyV2(databasePath: string, conflict = false) {
  const bytes = await readFile(resolve('tests/fixtures/images/small.png'))
  const hash = createHash('sha256').update(bytes).digest('hex')
  const database = new DatabaseSync(databasePath)
  try {
    database.exec(
      `PRAGMA application_id = 0x45505231; PRAGMA user_version = 2;
      PRAGMA foreign_keys = ON;
      CREATE TABLE app_startup (id INTEGER PRIMARY KEY CHECK (id = 1), launch_count INTEGER NOT NULL CHECK (launch_count > 0), last_started_at TEXT NOT NULL) STRICT;
      INSERT INTO app_startup VALUES (1, 7, '2026-10-19T00:00:00.000Z');` + librarySchema,
    )
    database.prepare('INSERT INTO topics VALUES (?, ?, ?)').run('legacy-v2', '旧专题', '旧题库.md')
    database
      .prepare('INSERT INTO questions VALUES (1, ?, ?, ?, ?, ?, 0, 0, NULL)')
      .run('legacy-v2', 'old-1', '旧标题', '["旧标签"]', '基础')
    database
      .prepare('INSERT INTO question_versions VALUES (1, 1, 1, ?, ?, ?, ?, ?, ?, ?)')
      .run(
        '旧标题',
        '旧题干',
        '旧答案',
        '[]',
        JSON.stringify([{ url: 'assets/small.png', hash }]),
        'a'.repeat(64),
        '2026-10-19T00:00:00.000Z',
      )
    database.exec(
      "UPDATE questions SET current_version_id = 1; INSERT INTO question_user_state VALUES (1, 1, '掌握', 1)",
    )
    database.prepare('INSERT INTO image_resources VALUES (?, ?, 2, 3, ?)').run(hash, 'png', bytes)
    database.prepare('INSERT INTO version_images VALUES (1, ?)').run(hash)
    if (conflict)
      database.exec(
        "CREATE TABLE practice_sessions (retained TEXT); INSERT INTO practice_sessions VALUES ('保留旧冲突对象')",
      )
  } finally {
    database.close()
  }
  return { bytes, hash }
}

test('M1 v2 升级前一致性备份并保留题库、图片、收藏和旧自评，重开不重复升级', async ({
  testDataDirectory,
}, info) => {
  const file = join(testDataDirectory, 'practice.sqlite3')
  const legacy = await legacyV2(file)
  const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  try {
    expect(await readAppStatus(page)).toMatchObject({ ok: true, value: { launchCount: 8 } })
  } finally {
    await application.close()
  }
  const names = await readdir(join(testDataDirectory, 'backups'))
  expect(names).toHaveLength(1)
  expect(names[0]).toMatch(/^pre-migration-v2-/)
  const backup = new DatabaseSync(join(testDataDirectory, 'backups', names[0]!), { readOnly: true })
  const current = new DatabaseSync(file, { readOnly: true })
  try {
    expect(backup.prepare('PRAGMA integrity_check').get()).toMatchObject({ integrity_check: 'ok' })
    expect(backup.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 2 })
    expect(backup.prepare('SELECT launch_count FROM app_startup').get()).toMatchObject({
      launch_count: 7,
    })
    expect(current.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 8 })
    expect(current.prepare('SELECT * FROM question_user_state').get()).toMatchObject({
      favorite: 1,
      last_rating: '掌握',
      last_rated_version_id: 1,
    })
    expect(current.prepare('SELECT answer_markdown FROM question_versions').get()).toMatchObject({
      answer_markdown: '旧答案',
    })
    expect(
      Buffer.from(
        current.prepare('SELECT bytes FROM image_resources WHERE hash = ?').get(legacy.hash)
          ?.bytes as Uint8Array,
      ),
    ).toEqual(legacy.bytes)
    expect(current.prepare('SELECT count(*) AS count FROM practice_sessions').get()).toMatchObject({
      count: 0,
    })
    expect(current.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  } finally {
    backup.close()
    current.close()
  }
  const reopened = await launchApplication(testDataDirectory, info.project.name)
  try {
    expect(await readAppStatus(reopened.page)).toMatchObject({
      ok: true,
      value: { launchCount: 9 },
    })
  } finally {
    await reopened.application.close()
  }
  expect(await readdir(join(testDataDirectory, 'backups'))).toEqual(names)
})

test('v2 备份失败时停止，原数据库逐字节保持', async ({ testDataDirectory }, info) => {
  const file = join(testDataDirectory, 'practice.sqlite3')
  await legacyV2(file)
  await writeFile(join(testDataDirectory, 'backups'), '阻止备份目录创建')
  const before = await readFile(file)
  const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  try {
    code(await readAppStatus(page), 'DATABASE_UNAVAILABLE')
  } finally {
    await application.close()
  }
  expect(await readFile(file)).toEqual(before)
})

test('v2 迁移 DDL 冲突回滚且保留原结构和保护性备份', async ({ testDataDirectory }, info) => {
  const file = join(testDataDirectory, 'practice.sqlite3')
  await legacyV2(file, true)
  const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  try {
    code(await readAppStatus(page), 'DATABASE_UNAVAILABLE')
  } finally {
    await application.close()
  }
  const current = new DatabaseSync(file, { readOnly: true })
  try {
    expect(current.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 2 })
    expect(current.prepare('SELECT * FROM practice_sessions').get()).toMatchObject({
      retained: '保留旧冲突对象',
    })
    expect(
      current
        .prepare(
          "SELECT name FROM sqlite_schema WHERE name IN ('practice_items', 'practice_receipts')",
        )
        .all(),
    ).toEqual([])
    expect(current.prepare('SELECT launch_count FROM app_startup').get()).toMatchObject({
      launch_count: 7,
    })
    expect(current.prepare('SELECT answer_markdown FROM question_versions').get()).toMatchObject({
      answer_markdown: '旧答案',
    })
  } finally {
    current.close()
  }
  expect(await readdir(join(testDataDirectory, 'backups'))).toHaveLength(1)
})
