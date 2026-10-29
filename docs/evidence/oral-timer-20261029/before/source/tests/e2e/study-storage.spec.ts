import { createHash, randomUUID } from 'node:crypto'
import { copyFile, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, launchApplication, openPage, readAppStatus, test } from './helpers'
import { stop, withHistoryDatabase } from './history-helpers'
import { controlRecords, changeSet } from './practice-control-helpers'
import { startFlow } from './practice-flow-helpers'
import { a, prepareStudy, readNote, saveNote, createStudyRound } from './study-helpers'

async function seedV12(directory: string) {
  const sql = await readFile('tests/fixtures/schema-v12.sql')
  expect(createHash('sha256').update(sql).digest('hex')).toBe(
    '4a923af302982bb2513ca5a441e45300419bc4c33ffa6fd52e36259d2547c52c',
  )
  const db = new DatabaseSync(join(directory, 'practice.sqlite3'))
  try {
    db.exec(sql.toString('utf8'))
    db.exec(`INSERT INTO topics(topic_id,title,source_name) VALUES('old-study','旧专题','来源.md');
      INSERT INTO questions(id,topic_id,question_id,title,tags_json,difficulty,position,archived,current_version_id) VALUES(1,'old-study','q-1','旧题','[]','基础',0,0,NULL);
      INSERT INTO question_versions VALUES(1,1,1,'旧题','旧题干','旧答案','[]','[]','${'a'.repeat(64)}','2026-10-27T00:00:00.000Z');
      UPDATE questions SET current_version_id=1;
      CREATE TABLE private_study_notes(text TEXT) STRICT; INSERT INTO private_study_notes VALUES('原自定义资料');
      CREATE INDEX old_study_index ON practice_sessions(mode);
      CREATE TRIGGER old_study_probe AFTER UPDATE ON practice_sessions BEGIN SELECT 1; END;`)
    const sessionId = randomUUID(),
      setId = randomUUID()
    db.prepare(
      "INSERT INTO practice_sessions(id,mode,topic_id,status,position,revision,created_at,selection_name) VALUES(?,'random',NULL,'active',0,0,'2026-10-27T00:00:00.000Z','题单：原组卷')",
    ).run(sessionId)
    db.prepare(
      "INSERT INTO practice_items(session_id,position,question_id,version_id,title,topic_title,tags_json,difficulty,draft,draft_revision) VALUES(?,0,1,1,'旧题','旧专题','[]','基础','结构12原草稿',2)",
    ).run(sessionId)
    db.prepare('INSERT INTO question_sets VALUES(?,?)').run(setId, '原题单')
    db.prepare("INSERT INTO question_set_items VALUES(?,0,'old-study','q-1')").run(setId)
    expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
    return controlRecords(db)
  } finally {
    db.close()
  }
}

test('结构12先保护备份再升17，新增笔记/标签/待办与元数据，原题单/来源/草稿与自定义对象保持', async ({
  testDataDirectory,
}, info) => {
  const before = await seedV12(testDataDirectory)
  const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  try {
    expect(await readAppStatus(page)).toMatchObject({ ok: true })
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual({
      ...before,
      practice_plans: before['practice_plans']!.map((row) => ({
        ...row,
        pinned: 0,
        last_used_at: null,
      })),
      question_sets: before['question_sets']!.map((row) => ({
        ...row,
        pinned: 0,
        last_used_at: null,
      })),
      personal_notes: [],
      personal_tags: [],
      question_personal_tags: [],
      review_todos: [],
      question_relations: [],
      recent_knowledge_searches: [],
      daily_targets: [],
      study_goals: [],
      quota_settings: [],
      learning_activities: [],
    })
    expect(
      withHistoryDatabase(testDataDirectory, (db) => db.prepare('PRAGMA user_version').get()),
    ).toEqual({ user_version: 17 })
    expect(
      withHistoryDatabase(testDataDirectory, (db) =>
        db
          .prepare(
            "SELECT name FROM sqlite_schema WHERE name IN ('old_study_index','old_study_probe') ORDER BY name",
          )
          .all(),
      ),
    ).toEqual([{ name: 'old_study_index' }, { name: 'old_study_probe' }])
    const names = (await readdir(join(testDataDirectory, 'backups'))).filter((name) =>
      name.startsWith('pre-migration-v12-'),
    )
    expect(names).toHaveLength(1)
    const path = join(testDataDirectory, 'backups', names[0]!),
      bytes = await readFile(path)
    const db = new DatabaseSync(path, { readOnly: true })
    try {
      expect(controlRecords(db)).toEqual(before)
      expect(db.prepare('PRAGMA user_version').get()).toEqual({ user_version: 12 })
    } finally {
      db.close()
    }
    await application.evaluate(({ dialog }, path) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
    }, path)
    expect(
      await page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
      ),
    ).toMatchObject({
      ok: true,
      value: {
        summary: { schemaVersion: 12, requiresMigration: true, personalNotes: 0, questionSets: 1 },
      },
    })
    expect(await readFile(path)).toEqual(bytes)
    await page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      '结构12原草稿',
    )
    await expect(page.locator('.practice-reference-column .personal-note')).toHaveCount(0)
  } finally {
    await stop(application)
  }
})

for (const fault of ['backup-blocked', 'table-conflict', 'foreign-key'] as const) {
  test(`结构12笔记迁移失败${fault}完整回滚，原库与原DDL不变`, async ({
    testDataDirectory,
  }, info) => {
    await seedV12(testDataDirectory)
    if (fault === 'backup-blocked')
      await writeFile(join(testDataDirectory, 'backups'), '保留原文件')
    else
      withHistoryDatabase(
        testDataDirectory,
        (db) =>
          db.exec(
            fault === 'table-conflict'
              ? "CREATE TABLE personal_notes(original TEXT); INSERT INTO personal_notes VALUES('保持')"
              : 'PRAGMA foreign_keys=OFF; UPDATE questions SET current_version_id=999',
          ),
        false,
      )
    const before = withHistoryDatabase(testDataDirectory, controlRecords),
      objects = withHistoryDatabase(testDataDirectory, (db) =>
        db.prepare('SELECT name,sql FROM sqlite_schema ORDER BY rowid').all(),
      )
    const { application, page } = await launchApplication(testDataDirectory, info.project.name)
    try {
      expect(await readAppStatus(page)).toMatchObject({ ok: false })
      expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
      expect(
        withHistoryDatabase(testDataDirectory, (db) =>
          db.prepare('SELECT name,sql FROM sqlite_schema ORDER BY rowid').all(),
        ),
      ).toEqual(objects)
      expect(
        withHistoryDatabase(testDataDirectory, (db) => db.prepare('PRAGMA user_version').get()),
      ).toEqual({ user_version: 12 })
    } finally {
      await stop(application)
    }
  })
}

test('完整备份恢复笔记/清空修订/轮次/题单/活动草稿，五类坏笔记拒绝且不改原库', async ({
  testDataDirectory,
}, info) => {
  const initial = await prepareStudy(testDataDirectory, info)
  const destination = await mkdtemp(join(tmpdir(), 'embedded-practice-study-restore-'))
  const opened = [initial.application]
  let completed = false
  try {
    expect(
      await saveNote(initial.page, {
        ...a(1),
        expectedRevision: 0,
        text: '个人理解\n```c\nkeep();\n```',
      }),
    ).toMatchObject({ ok: true })
    await saveNote(initial.page, { ...a(2), expectedRevision: 0, text: '将要清空' })
    await saveNote(initial.page, { ...a(2), expectedRevision: 1, text: '' })
    await createStudyRound(initial.page, '原轮次作答', [a(1)])
    await changeSet(initial.page, {
      kind: 'save',
      setId: randomUUID(),
      name: '原题单',
      items: [a(1), a(2)],
    })
    const active = await startFlow(initial.page, {
      requestId: randomUUID(),
      topicId: 'control-a',
      count: 'all',
      replace: null,
    })
    if (!active.ok) throw new Error(active.error.message)
    await initial.page.evaluate(
      (sessionId) =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.saveDraft({
          sessionId,
          position: 0,
          draft: { revision: 1, text: '活动轮独立草稿' },
        }),
      active.value.sessionId,
    )
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    const file = info.outputPath('个人积累完整备份.sqlite3')
    await openPage(initial.page, '备份恢复')
    await initial.application.evaluate(({ dialog }, filePath) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath })
    }, file)
    await initial.page.getByRole('button', { name: '导出完整备份', exact: true }).click()
    await expect(initial.page.getByText('完整备份已导出并校验。', { exact: true })).toBeVisible()
    const originalBytes = await readFile(file)
    const empty = await launchApplication(destination, info.project.name, '备份恢复')
    opened.push(empty.application)
    const emptyState = withHistoryDatabase(destination, controlRecords)
    for (const [kind, sql] of [
      ['revision', 'PRAGMA ignore_check_constraints=ON; UPDATE personal_notes SET revision=-1'],
      ['time', "UPDATE personal_notes SET updated_at='不是时间'"],
      [
        'orphan',
        'PRAGMA foreign_keys=OFF; UPDATE personal_notes SET question_id=999 WHERE question_id=1',
      ],
      [
        'oversize',
        "PRAGMA ignore_check_constraints=ON; UPDATE personal_notes SET text=replace(hex(zeroblob(550000)),'0','中') WHERE question_id=1",
      ],
      [
        'duplicate',
        'PRAGMA foreign_keys=OFF; CREATE TABLE copied_notes AS SELECT * FROM personal_notes; DROP TABLE personal_notes; CREATE TABLE personal_notes(question_id INTEGER,revision INTEGER,text TEXT,updated_at TEXT) STRICT; INSERT INTO personal_notes SELECT * FROM copied_notes; INSERT INTO personal_notes SELECT * FROM copied_notes; DROP TABLE copied_notes',
      ],
    ]) {
      const damaged = info.outputPath(`坏笔记-${kind}.sqlite3`)
      await copyFile(file, damaged)
      const db = new DatabaseSync(damaged)
      try {
        db.exec(sql!)
      } finally {
        db.close()
      }
      await empty.application.evaluate(({ dialog }, path) => {
        dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
      }, damaged)
      expect(
        await empty.page.evaluate(() =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
        ),
      ).toMatchObject({ ok: false, error: { code: 'INVALID_BACKUP' } })
      expect(withHistoryDatabase(destination, controlRecords)).toEqual(emptyState)
    }
    expect(await readFile(file)).toEqual(originalBytes)
    await empty.application.evaluate(({ app, dialog }, path) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
      dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false })
      app.relaunch = () => {}
    }, file)
    await empty.page.getByRole('button', { name: '选择备份并预览', exact: true }).click()
    await expect(empty.page.getByLabel('恢复预览摘要', { exact: true })).toContainText('个人笔记')
    const closing = empty.application.waitForEvent('close')
    await empty.page.getByRole('button', { name: '恢复此备份…', exact: true }).click()
    await closing
    const restored = await launchApplication(destination, info.project.name)
    opened.push(restored.application)
    expect(withHistoryDatabase(destination, controlRecords)).toEqual(before)
    expect(await readNote(restored.page)).toMatchObject({
      ok: true,
      value: { revision: 1, text: '个人理解\n```c\nkeep();\n```' },
    })
    expect(await readNote(restored.page, a(2))).toMatchObject({
      ok: true,
      value: { revision: 2, text: '' },
    })
    await restored.page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(restored.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      '活动轮独立草稿',
    )
    await expect(restored.page.locator('.practice-reference-column .personal-note')).toHaveCount(0)
    completed = true
  } finally {
    for (const app of opened) await stop(app)
    if (
      dirname(resolve(destination)) !== resolve(tmpdir()) ||
      !basename(destination).startsWith('embedded-practice-study-restore-')
    )
      throw new Error('拒绝清理非本次恢复目录')
    if (completed)
      await rm(destination, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
    else
      await info.attach('study-restore-failed-directory', {
        body: destination,
        contentType: 'text/plain',
      })
  }
})
