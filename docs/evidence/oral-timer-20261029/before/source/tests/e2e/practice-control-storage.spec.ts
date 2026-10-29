import { createHash, randomUUID } from 'node:crypto'
import { copyFile, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, launchApplication, openPage, readAppStatus, test } from './helpers'
import { stop, withHistoryDatabase } from './history-helpers'
import {
  a,
  b,
  changeSet,
  controlRecords,
  prepareControl,
  previewSet,
  selectForPractice,
} from './practice-control-helpers'
import { startFlow } from './practice-flow-helpers'

async function seedV11(directory: string) {
  const sql = await readFile('tests/fixtures/schema-v11.sql')
  expect(createHash('sha256').update(sql).digest('hex')).toBe(
    'f5452be2e4deaf3a7f390bd552b731ccbb5ad564feacbfe824d311b4b4e392e3',
  )
  const db = new DatabaseSync(join(directory, 'practice.sqlite3'))
  try {
    db.exec(sql.toString('utf8'))
    db.exec(`INSERT INTO topics(topic_id,title,source_name) VALUES('old-control','旧专题','来源.md');
      INSERT INTO questions(id,topic_id,question_id,title,tags_json,difficulty,position,archived,current_version_id) VALUES(1,'old-control','q-1','旧题','[]','基础',0,0,NULL);
      INSERT INTO question_versions VALUES(1,1,1,'旧题','旧题干','旧答案','[]','[]','${'a'.repeat(64)}','2026-10-26T00:00:00.000Z');
      UPDATE questions SET current_version_id=1;
      INSERT INTO question_user_state VALUES(1,1,'不熟',1);
      CREATE TABLE private_control_notes(note TEXT) STRICT;
      INSERT INTO private_control_notes VALUES('用户自定义资料');
      CREATE INDEX old_control_index ON practice_sessions(mode);
      CREATE TRIGGER old_control_probe AFTER UPDATE ON practice_sessions BEGIN SELECT 1; END;`)
    const source = randomUUID(),
      active = randomUUID()
    db.prepare(
      "INSERT INTO practice_sessions(id,mode,topic_id,status,position,revision,created_at,ended_at) VALUES(?,'sequential','old-control','ended',0,2,'2026-10-26T00:00:00.000Z','2026-10-26T01:00:00.000Z')",
    ).run(source)
    db.prepare(
      "INSERT INTO practice_sessions(id,mode,topic_id,status,position,revision,created_at,repeat_source_id,repeat_selection) VALUES(?,'random','old-control','active',0,0,'2026-10-26T02:00:00.000Z',?,'all')",
    ).run(active, source)
    for (const id of [source, active])
      db.prepare(
        "INSERT INTO practice_items(session_id,position,question_id,version_id,title,topic_title,tags_json,difficulty,draft,draft_revision) VALUES(?,0,1,1,'旧题','旧专题','[]','基础',?,3)",
      ).run(id, '结构11原草稿\r\n    keep();')
    expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
    return controlRecords(db)
  } finally {
    db.close()
  }
}

test('结构11受保护升级12，原再练/草稿/自定义对象不变，预览旧备份仅迁移副本', async ({
  testDataDirectory,
}, info) => {
  const before = await seedV11(testDataDirectory)
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
      question_sets: [],
      question_set_items: [],
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
      practice_sessions: before['practice_sessions']!.map((row) => ({
        ...row,
        selection_name: null,
      })),
    })
    expect(
      withHistoryDatabase(testDataDirectory, (db) =>
        db
          .prepare(
            "SELECT name FROM sqlite_schema WHERE name IN ('old_control_index','old_control_probe') ORDER BY name",
          )
          .all(),
      ),
    ).toEqual([{ name: 'old_control_index' }, { name: 'old_control_probe' }])
    const copies = (await readdir(join(testDataDirectory, 'backups'))).filter((name) =>
      name.startsWith('pre-migration-v11-'),
    )
    expect(copies).toHaveLength(1)
    const path = join(testDataDirectory, 'backups', copies[0]!),
      bytes = await readFile(path)
    const db = new DatabaseSync(path, { readOnly: true })
    try {
      expect(controlRecords(db)).toEqual(before)
      expect(db.prepare('PRAGMA user_version').get()).toEqual({ user_version: 11 })
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
        summary: {
          schemaVersion: 11,
          requiresMigration: true,
          questionSets: 0,
          activeSession: true,
        },
      },
    })
    expect(await readFile(path)).toEqual(bytes)
    await page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      '结构11原草稿\n    keep();',
    )
    await expect(page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
  } finally {
    await stop(application)
  }
})

for (const fault of [
  'backup-blocked',
  'column-conflict',
  'table-conflict',
  'foreign-key',
] as const) {
  test(`结构11迁移失败${fault}回滚全部DDL并保持原数据`, async ({ testDataDirectory }, info) => {
    await seedV11(testDataDirectory)
    if (fault === 'backup-blocked')
      await writeFile(join(testDataDirectory, 'backups'), '不覆盖此文件')
    else
      withHistoryDatabase(
        testDataDirectory,
        (db) =>
          db.exec(
            fault === 'column-conflict'
              ? 'ALTER TABLE practice_sessions ADD COLUMN selection_name TEXT'
              : fault === 'table-conflict'
                ? 'CREATE TABLE question_sets(dummy TEXT)'
                : 'PRAGMA foreign_keys=OFF; UPDATE questions SET current_version_id=999',
          ),
        false,
      )
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    const objects = withHistoryDatabase(testDataDirectory, (db) =>
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
      ).toEqual({ user_version: 11 })
      if (fault === 'backup-blocked')
        expect(await readFile(join(testDataDirectory, 'backups'), 'utf8')).toBe('不覆盖此文件')
    } finally {
      await stop(application)
    }
  })
}

test('完整备份恢复题单顺序/失效身份/固定版本/来源与草稿，坏题单拒绝且不改当前库', async ({
  testDataDirectory,
}, info) => {
  const initial = await prepareControl(testDataDirectory, info)
  const opened = [initial.application],
    destination = await mkdtemp(join(tmpdir(), 'embedded-practice-control-restore-'))
  let completed = false
  try {
    const definition = { setId: randomUUID(), name: '复盘指定题', items: [b(1), a(2)] }
    const missing = { setId: randomUUID(), name: '保留失效', items: [a(3)] }
    for (const set of [definition, missing])
      expect(await changeSet(initial.page, { kind: 'save', ...set })).toMatchObject({ ok: true })
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db
          .prepare('UPDATE question_set_items SET question_id=? WHERE set_id=?')
          .run('q-missing', missing.setId),
      false,
    )
    const selected = await selectForPractice(initial.page, definition.items, '题单：复盘指定题')
    const started = await startFlow(initial.page, {
      requestId: randomUUID(),
      topicId: null,
      count: 'all',
      replace: null,
      selected,
    })
    if (!started.ok) throw new Error(started.error.message)
    expect(
      await initial.page.evaluate(
        (sessionId) =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.saveDraft({
            sessionId,
            position: 0,
            draft: { revision: 1, text: '指定题的个人回答\n  saved();' },
          }),
        started.value.sessionId,
      ),
    ).toMatchObject({ ok: true })
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    const file = info.outputPath('题单完整备份.sqlite3')
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
      ['gap', 'UPDATE question_set_items SET position=position+10'],
      [
        'orphan',
        `PRAGMA foreign_keys=OFF; UPDATE question_set_items SET set_id='${randomUUID()}' WHERE set_id='${definition.setId}'`,
      ],
      [
        'name',
        "PRAGMA ignore_check_constraints=ON; UPDATE question_sets SET name='换' || char(10) || '行' WHERE rowid=1",
      ],
      [
        'duplicate-name',
        "PRAGMA foreign_keys=OFF; CREATE TABLE copied_sets AS SELECT * FROM question_sets; DROP TABLE question_sets; CREATE TABLE question_sets(set_id TEXT,name TEXT,pinned INTEGER,last_used_at TEXT) STRICT; INSERT INTO question_sets SELECT * FROM copied_sets; UPDATE question_sets SET name='same'; DROP TABLE copied_sets",
      ],
      [
        'duplicate-member',
        'PRAGMA foreign_keys=OFF; CREATE TABLE copied_items AS SELECT * FROM question_set_items; DROP TABLE question_set_items; CREATE TABLE question_set_items(set_id TEXT,position INTEGER,topic_id TEXT,question_id TEXT) STRICT; INSERT INTO question_set_items SELECT * FROM copied_items; INSERT INTO question_set_items SELECT set_id,position+20,topic_id,question_id FROM copied_items; DROP TABLE copied_items',
      ],
    ]) {
      const damaged = info.outputPath(`坏题单-${kind}.sqlite3`)
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
    await expect(empty.page.getByLabel('恢复预览摘要', { exact: true })).toContainText('固定题单')
    const exiting = empty.application.waitForEvent('close')
    await empty.page.getByRole('button', { name: '恢复此备份…', exact: true }).click()
    await exiting
    const restored = await launchApplication(destination, info.project.name)
    opened.push(restored.application)
    expect(withHistoryDatabase(destination, controlRecords)).toEqual(before)
    expect((await previewSet(restored.page, { setId: definition.setId })).definition).toEqual(
      definition,
    )
    expect((await previewSet(restored.page, { setId: missing.setId })).items[0]?.status).toBe(
      'missing',
    )
    await restored.page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(restored.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      '指定题的个人回答\n  saved();',
    )
    await expect(restored.page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
    completed = true
  } finally {
    for (const app of opened) await stop(app)
    if (
      dirname(resolve(destination)) !== resolve(tmpdir()) ||
      !basename(destination).startsWith('embedded-practice-control-restore-')
    )
      throw new Error('拒绝清理非本次恢复目录')
    if (completed)
      await rm(destination, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
    else
      await info.attach('control-restore-failed-directory', {
        body: destination,
        contentType: 'text/plain',
      })
  }
})
