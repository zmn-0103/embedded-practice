import { createHash } from 'node:crypto'
import { copyFile, cp, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { prepareImport } from '../../src/main/services/library/prepare-import'
import { exerciseLibraryImport } from '../integration/library-import-exercise'
import { expect, launchApplication, readAppStatus, test } from './helpers'

async function prepareSources(directory: string): Promise<string[]> {
  const sources = join(directory, 'sources')
  await cp(resolve('question-banks/examples'), sources, { recursive: true })
  await copyFile(resolve('tests/fixtures/images/small.png'), join(sources, 'assets', 'small.png'))
  await copyFile(
    resolve('question-banks/STM32F103RCT6-GPIO阶段自测题.md'),
    join(sources, 'GPIO.md'),
  )
  return [join(sources, 'GPIO.md'), join(sources, '格式示例.md')]
}

test('预览后来源移动，80 题与三种图片原子入库并跨进程读回', async ({ testDataDirectory }, info) => {
  const filePaths = await prepareSources(testDataDirectory)
  const prepared = await prepareImport(filePaths)
  if (!prepared.ok) throw new Error('集成测试来源准备失败')
  const expectedQuestions = prepared.value.topics
    .flatMap(({ topic, contentHashes }) =>
      topic.questions.map((q) => ({
        topicId: topic.topicId,
        questionId: q.questionId,
        title: q.title,
        questionHash: createHash('sha256').update(q.questionMarkdown).digest('hex'),
        answerHash: createHash('sha256').update(q.answerMarkdown).digest('hex'),
        definitions: q.definitions,
        contentHash: contentHashes.find((item) => item.questionId === q.questionId)!.hash,
      })),
    )
    .sort((a, b) => a.topicId.localeCompare(b.topicId) || a.questionId.localeCompare(b.questionId))
  const expectedResources = prepared.value.resources
    .map((image) => ({
      hash: image.hash,
      actualHash: image.hash,
      format: image.format,
      width: image.width,
      height: image.height,
      byteLength: image.bytes.byteLength,
    }))
    .sort((a, b) => a.hash.localeCompare(b.hash))
  const first = await launchApplication(testDataDirectory, info.project.name)
  let oldToken: string | undefined
  try {
    const report = await first.application.evaluate(exerciseLibraryImport, {
      mode: 'roundtrip' as const,
      directory: testDataDirectory,
      filePaths,
    })
    await info.attach('library-roundtrip.json', {
      body: JSON.stringify(report, null, 2),
      contentType: 'application/json',
    })
    expect(report).toMatchObject({
      counts: {
        topics: 2,
        questions: 80,
        question_versions: 80,
        image_resources: 3,
        import_receipts: 1,
      },
      first: { summary: { counts: { added: 80, newVersions: 80 } } },
      errors: [],
    })
    expect(report.first).toEqual(report.repeated)
    expect(report.first?.summary).toEqual(report.preview?.summary)
    oldToken = report.preview?.token
    expect((await stat(join(testDataDirectory, 'sources-moved'))).isDirectory()).toBe(true)
    await expect(stat(join(testDataDirectory, 'sources'))).rejects.toMatchObject({ code: 'ENOENT' })
  } finally {
    await first.application.close()
  }
  const second = await launchApplication(testDataDirectory, info.project.name)
  try {
    const report = await second.application.evaluate(exerciseLibraryImport, {
      mode: 'inspect' as const,
      directory: testDataDirectory,
      filePaths: [],
      ...(oldToken ? { oldToken } : {}),
    })
    await info.attach('library-reopened.json', {
      body: JSON.stringify(report, null, 2),
      contentType: 'application/json',
    })
    expect(report.questions).toEqual(expectedQuestions)
    expect(report.resources).toEqual(expectedResources)
    expect(report).toMatchObject({
      schemaVersion: 11,
      oldToken: { ok: false, error: { code: 'INVALID_TOKEN' } },
      foreignKeys: [],
      errors: [],
    })
    expect(await readAppStatus(second.page)).toMatchObject({ ok: true, value: { launchCount: 2 } })
  } finally {
    await second.application.close()
  }
})

test('真实事务区分元数据与内容版本，保留收藏/旧引用，归档恢复与旧基线保护', async ({
  testDataDirectory,
}, info) => {
  await prepareSources(testDataDirectory)
  const { application } = await launchApplication(testDataDirectory, info.project.name)
  try {
    const report = await application.evaluate(exerciseLibraryImport, {
      mode: 'changes' as const,
      directory: testDataDirectory,
      filePaths: [],
    })
    await info.attach('library-changes.json', {
      body: JSON.stringify(report, null, 2),
      contentType: 'application/json',
    })
    expect(report).toMatchObject({
      first: { summary: { counts: { added: 3 } } },
      metadata: { summary: { counts: { metadata: 2, newVersions: 0 } } },
      metadataState: { valid: 1 },
      imageUpdate: { summary: { counts: { updated: 1, newVersions: 1 } } },
      answerUpdate: { summary: { counts: { updated: 1, newVersions: 1 } } },
      archive: { summary: { counts: { archived: 1 } } },
      archived: { archived: 1 },
      restore: { summary: { counts: { restored: 1, newVersions: 0 } } },
      restoredChanged: { summary: { counts: { restored: 1, newVersions: 1 } } },
      same: { summary: { counts: { unchanged: 2, newVersions: 0 } } },
      stale: { ok: false, error: { code: 'PREVIEW_STALE' } },
      state: { favorite: 1, rating: '掌握', valid: 0, archived: 0 },
      wrongVersionRejected: true,
      counts: { topics: 2, questions: 3, question_versions: 6, image_resources: 2 },
      foreignKeys: [],
      errors: [],
    })
    expect(report.afterRepeat?.revision).toBe(report.beforeRepeat?.revision)
    expect(report.afterRepeat?.counts['questions']).toBe(report.beforeRepeat?.counts['questions'])
    expect(report.afterRepeat?.counts['question_versions']).toBe(
      report.beforeRepeat?.counts['question_versions'],
    )
    expect(report.afterRepeat?.counts['image_resources']).toBe(
      report.beforeRepeat?.counts['image_resources'],
    )
    expect(report.history).toEqual([{ version_id: report.identity?.version, note: 'retain' }])
    expect(report.state).toMatchObject({
      id: report.identity?.id,
      ratedVersion: report.identity?.version,
    })
  } finally {
    await application.close()
  }
})

test('第二专题中途写入失败整批回滚，确认无回执后可重试同一快照', async ({
  testDataDirectory,
}, info) => {
  await prepareSources(testDataDirectory)
  const { application } = await launchApplication(testDataDirectory, info.project.name)
  try {
    const report = await application.evaluate(exerciseLibraryImport, {
      mode: 'rollback' as const,
      directory: testDataDirectory,
      filePaths: [],
    })
    await info.attach('library-rollback.json', {
      body: JSON.stringify(report, null, 2),
      contentType: 'application/json',
    })
    expect(report.failed).toMatchObject({ ok: false, error: { code: 'DATABASE_UNAVAILABLE' } })
    expect(report.before).toEqual(report.after)
    expect(report.after).toMatchObject({
      revision: 0,
      counts: {
        topics: 0,
        questions: 0,
        question_versions: 0,
        image_resources: 0,
        import_receipts: 0,
      },
    })
    expect(report.retried).toEqual(report.storedReceipt)
    expect(report).toMatchObject({
      counts: {
        topics: 2,
        questions: 2,
        question_versions: 2,
        image_resources: 1,
        import_receipts: 1,
      },
      transactionReceiptRejected: true,
      foreignKeys: [],
    })
    expect(report.answers).toEqual([
      { answer: '首题快照\n![图](assets/small.png)' },
      { answer: 'FAIL_COMMIT' },
    ])
    expect(report.errors).toHaveLength(1)
  } finally {
    await application.close()
  }
})

function createLegacyDatabase(path: string, collision = false): void {
  const database = new DatabaseSync(path)
  try {
    database.exec(`PRAGMA application_id = 0x45505231; PRAGMA user_version = 1;
      CREATE TABLE app_startup (id INTEGER PRIMARY KEY CHECK (id = 1), launch_count INTEGER NOT NULL CHECK (launch_count > 0), last_started_at TEXT NOT NULL) STRICT;
      INSERT INTO app_startup VALUES (1, 7, '2026-10-19T00:00:00.000Z');
      CREATE TABLE retained_m0 (value TEXT); INSERT INTO retained_m0 VALUES ('保留');
      ${collision ? "CREATE TABLE topics (retained TEXT); INSERT INTO topics VALUES ('保留冲突表');" : ''}`)
  } finally {
    database.close()
  }
}

test('旧 M0 库迁移前备份可读，原启动记录与数据保留且升级不重复', async ({
  testDataDirectory,
}, info) => {
  const databasePath = join(testDataDirectory, 'practice.sqlite3')
  createLegacyDatabase(databasePath)
  const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  try {
    expect(await readAppStatus(page)).toMatchObject({ ok: true, value: { launchCount: 8 } })
    const report = await application.evaluate(exerciseLibraryImport, {
      mode: 'inspect' as const,
      directory: testDataDirectory,
      filePaths: [],
    })
    expect(report).toMatchObject({
      schemaVersion: 11,
      counts: { topics: 0, questions: 0 },
      foreignKeys: [],
      errors: [],
    })
  } finally {
    await application.close()
  }
  const names = await readdir(join(testDataDirectory, 'backups'))
  expect(names).toHaveLength(1)
  const backup = new DatabaseSync(join(testDataDirectory, 'backups', names[0]!), { readOnly: true })
  const current = new DatabaseSync(databasePath, { readOnly: true })
  try {
    expect(backup.prepare('PRAGMA integrity_check').get()).toMatchObject({ integrity_check: 'ok' })
    expect(backup.prepare('PRAGMA application_id').get()).toMatchObject({
      application_id: 0x45505231,
    })
    expect(backup.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 1 })
    expect(backup.prepare('SELECT launch_count FROM app_startup').get()).toMatchObject({
      launch_count: 7,
    })
    expect(current.prepare('SELECT * FROM retained_m0').get()).toMatchObject({ value: '保留' })
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

test('迁移前备份无法创建时停止，旧数据库不改写', async ({ testDataDirectory }, info) => {
  const path = join(testDataDirectory, 'practice.sqlite3')
  createLegacyDatabase(path)
  await writeFile(join(testDataDirectory, 'backups'), '阻止创建备份目录的测试文件')
  const before = await readFile(path)
  const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  try {
    expect(await readAppStatus(page)).toMatchObject({
      ok: false,
      error: { code: 'DATABASE_UNAVAILABLE' },
    })
    await expect(page.locator('.service-status')).toContainText('本地数据暂不可用')
  } finally {
    await application.close()
  }
  expect(await readFile(path)).toEqual(before)
})

test('迁移 DDL 失败回滚结构，保留旧库和保护性备份', async ({ testDataDirectory }, info) => {
  const path = join(testDataDirectory, 'practice.sqlite3')
  createLegacyDatabase(path, true)
  const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  try {
    expect(await readAppStatus(page)).toMatchObject({
      ok: false,
      error: { code: 'DATABASE_UNAVAILABLE' },
    })
  } finally {
    await application.close()
  }
  const database = new DatabaseSync(path, { readOnly: true })
  try {
    expect(database.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 1 })
    expect(database.prepare('SELECT launch_count FROM app_startup').get()).toMatchObject({
      launch_count: 7,
    })
    expect(database.prepare('SELECT * FROM topics').get()).toMatchObject({ retained: '保留冲突表' })
    expect(
      database.prepare("SELECT name FROM sqlite_schema WHERE name = 'library_meta'").all(),
    ).toEqual([])
  } finally {
    database.close()
  }
  expect(await readdir(join(testDataDirectory, 'backups'))).toHaveLength(1)
})
