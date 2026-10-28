import { createHash, randomUUID } from 'node:crypto'
import { copyFile, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, launchApplication, openPage, readAppStatus, test } from './helpers'
import { historySnapshot, stop, withHistoryDatabase } from './history-helpers'
import { changePlan, planOptions, readPlans } from './practice-plan-helpers'
import { finishFlow, prepareFlow, startFlow } from './practice-flow-helpers'

function records(db: DatabaseSync) {
  const tables = db
    .prepare(
      "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT GLOB 'sqlite_*' AND name NOT IN ('app_startup','backup_manifest') ORDER BY name",
    )
    .all() as { name: string }[]
  return Object.fromEntries(
    tables.map(({ name }) => [
      name,
      db
        .prepare(
          name === 'image_resources'
            ? 'SELECT hash,format,width,height,hex(bytes) AS bytes FROM image_resources ORDER BY hash'
            : `SELECT * FROM "${name.replaceAll('"', '""')}" ORDER BY rowid`,
        )
        .all(),
    ]),
  )
}

async function seedV10(directory: string) {
  const sql = await readFile('tests/fixtures/schema-v10.sql', 'utf8')
  expect(createHash('sha256').update(sql).digest('hex')).toBe(
    '319383094af4ab2495e79e250a22707b56ba29102643f6ef467304081b9fbdd4',
  )
  const db = new DatabaseSync(join(directory, 'practice.sqlite3'))
  try {
    db.exec(sql)
    db.exec(`INSERT INTO topics(topic_id,title,source_name) VALUES('old-flow','原专题','原来源.md');
      INSERT INTO questions(id,topic_id,question_id,title,tags_json,difficulty,position,archived,current_version_id) VALUES(1,'old-flow','q-1','原题','[]','基础',0,0,NULL);
      INSERT INTO question_versions VALUES(1,1,1,'原题','原题干','原答案','[]','[]','${'a'.repeat(64)}','2026-10-26T00:00:00.000Z');
      UPDATE questions SET current_version_id=1;
      INSERT INTO question_user_state VALUES(1,1,'不熟',1);
      CREATE TABLE private_flow_notes(note TEXT) STRICT; INSERT INTO private_flow_notes VALUES('用户自定义数据');
      CREATE INDEX old_flow_index ON practice_sessions(mode);
      CREATE TRIGGER old_flow_probe AFTER UPDATE ON practice_sessions BEGIN SELECT 1; END;`)
    const sessionId = randomUUID()
    db.prepare(
      "INSERT INTO practice_sessions(id,mode,topic_id,status,position,revision,created_at,filters_json,category_scope_json) VALUES(?,'random','old-flow','active',0,2,'2026-10-26T00:00:00.000Z',?,?)",
    ).run(sessionId, JSON.stringify(planOptions.filters), '{"kind":"all"}')
    db.prepare(
      "INSERT INTO practice_items(session_id,position,question_id,version_id,title,topic_title,tags_json,difficulty,draft,draft_revision) VALUES(?,0,1,1,'原题','原专题','[]','基础',?,3)",
    ).run(sessionId, '原结构10草稿\r\n    keep();')
    db.prepare('INSERT INTO practice_plans VALUES(?,?,?)').run(
      randomUUID(),
      '原方案',
      JSON.stringify(planOptions),
    )
    expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
    return records(db)
  } finally {
    db.close()
  }
}

test('结构10升级前保护备份，原队列/草稿/方案/自定义对象逐行保持，旧备份只在副本迁移', async ({
  testDataDirectory,
}, info) => {
  const before = await seedV10(testDataDirectory)
  const instance = await launchApplication(testDataDirectory, info.project.name)
  try {
    expect((await readAppStatus(instance.page)).ok).toBe(true)
    expect(withHistoryDatabase(testDataDirectory, records)).toEqual({
      ...before,
      question_sets: [],
      question_set_items: [],
      personal_notes: [],
      practice_sessions: before['practice_sessions']!.map((row) => ({
        ...row,
        repeat_source_id: null,
        repeat_selection: null,
        selection_name: null,
      })),
    })
    expect(
      withHistoryDatabase(testDataDirectory, (db) => db.prepare('PRAGMA user_version').get()),
    ).toEqual({ user_version: 13 })
    const copies = (await readdir(join(testDataDirectory, 'backups'))).filter((name) =>
      name.startsWith('pre-migration-v10-'),
    )
    expect(copies).toHaveLength(1)
    const backupPath = join(testDataDirectory, 'backups', copies[0]!)
    const bytes = await readFile(backupPath)
    const backup = new DatabaseSync(backupPath, { readOnly: true })
    try {
      expect(records(backup)).toEqual(before)
      expect(backup.prepare('PRAGMA user_version').get()).toEqual({ user_version: 10 })
    } finally {
      backup.close()
    }
    await instance.application.evaluate(({ dialog }, file) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [file] })
    }, backupPath)
    expect(
      await instance.page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
      ),
    ).toMatchObject({
      ok: true,
      value: {
        summary: {
          schemaVersion: 10,
          requiresMigration: true,
          practicePlans: 1,
          activeSession: true,
        },
      },
    })
    expect(await readFile(backupPath)).toEqual(bytes)
    await instance.page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(instance.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      '原结构10草稿\n    keep();',
    )
    await expect(instance.page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
  } finally {
    await stop(instance.application)
  }
})

for (const fault of ['backup-blocked', 'column-conflict', 'foreign-key'] as const) {
  test(`结构10迁移失败${fault}保留原结构与数据，不重建空库`, async ({
    testDataDirectory,
  }, info) => {
    await seedV10(testDataDirectory)
    if (fault === 'backup-blocked')
      await writeFile(join(testDataDirectory, 'backups'), '禁止覆盖此文件')
    else
      withHistoryDatabase(
        testDataDirectory,
        (db) =>
          db.exec(
            fault === 'column-conflict'
              ? 'ALTER TABLE practice_sessions ADD COLUMN repeat_source_id TEXT'
              : 'PRAGMA foreign_keys=OFF; UPDATE questions SET current_version_id=999',
          ),
        false,
      )
    const before = withHistoryDatabase(testDataDirectory, records)
    const instance = await launchApplication(testDataDirectory, info.project.name)
    try {
      expect(await readAppStatus(instance.page)).toMatchObject({ ok: false })
      expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
      expect(
        withHistoryDatabase(testDataDirectory, (db) => db.prepare('PRAGMA user_version').get()),
      ).toEqual({ user_version: 10 })
      if (fault === 'backup-blocked')
        expect(await readFile(join(testDataDirectory, 'backups'), 'utf8')).toBe('禁止覆盖此文件')
    } finally {
      await stop(instance.application)
    }
  })
}

test('完整备份恢复再练来源/固定旧版本/联合方案与草稿，坏来源拒绝且不覆盖当前数据', async ({
  testDataDirectory,
}, info) => {
  const initial = await prepareFlow(testDataDirectory, info)
  const opened = [initial.application]
  const restoredDirectory = await mkdtemp(join(tmpdir(), 'embedded-practice-flow-restore-'))
  let completed = false
  try {
    const source = await finishFlow(initial.page)
    const planId = randomUUID()
    expect(
      await changePlan(initial.page, {
        kind: 'save',
        planId,
        name: '原方案',
        options: planOptions,
      }),
    ).toMatchObject({ ok: true })
    const options = {
      ...planOptions,
      filters: { ...planOptions.filters, mastery: '不会＋不熟' as const },
    }
    expect(
      await changePlan(initial.page, {
        kind: 'update',
        planId,
        name: '联合复习方案',
        options,
        expected: { name: '原方案', options: planOptions },
      }),
    ).toMatchObject({ ok: true })
    const started = await startFlow(initial.page, {
      requestId: randomUUID(),
      topicId: null,
      count: 'all',
      replace: null,
      repeat: { sessionId: source.session.sessionId, selection: 'weak' },
    })
    if (!started.ok) throw new Error(started.error.message)
    expect(
      await initial.page.evaluate(
        (sessionId) =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.saveDraft({
            sessionId,
            position: 0,
            draft: { revision: 1, text: '再练独立草稿' },
          }),
        started.value.sessionId,
      ),
    ).toMatchObject({ ok: true })
    const before = withHistoryDatabase(testDataDirectory, records)
    await openPage(initial.page, '备份恢复')
    const file = info.outputPath('再练完整备份.sqlite3')
    await initial.application.evaluate(({ dialog }, filePath) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath })
    }, file)
    await initial.page.getByRole('button', { name: '导出完整备份', exact: true }).click()
    await expect(initial.page.getByText('完整备份已导出并校验。', { exact: true })).toBeVisible()
    const empty = await launchApplication(restoredDirectory, info.project.name, '备份恢复')
    opened.push(empty.application)
    const emptyState = historySnapshot(restoredDirectory)
    const badPath = info.outputPath('坏再练来源.sqlite3')
    await copyFile(file, badPath)
    const damaged = new DatabaseSync(badPath)
    try {
      damaged.exec(
        'UPDATE practice_sessions SET repeat_source_id=id WHERE repeat_source_id IS NOT NULL',
      )
    } finally {
      damaged.close()
    }
    await empty.application.evaluate(({ dialog }, path) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
    }, badPath)
    expect(
      await empty.page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
      ),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_BACKUP' } })
    expect(historySnapshot(restoredDirectory)).toEqual(emptyState)
    await empty.application.evaluate(({ app, dialog }, path) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
      dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false })
      app.relaunch = () => {}
    }, file)
    await empty.page.getByRole('button', { name: '选择备份并预览', exact: true }).click()
    await expect(empty.page.getByLabel('恢复预览摘要', { exact: true })).toBeVisible()
    const exiting = empty.application.waitForEvent('close')
    await empty.page.getByRole('button', { name: '恢复此备份…', exact: true }).click()
    await exiting
    const restored = await launchApplication(restoredDirectory, info.project.name)
    opened.push(restored.application)
    expect(withHistoryDatabase(restoredDirectory, records)).toEqual(before)
    expect(await readPlans(restored.page)).toEqual([{ planId, name: '联合复习方案', options }])
    await restored.page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(restored.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      '再练独立草稿',
    )
    await expect(restored.page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
    await expect(
      restored.page.getByText('本轮为再练，沿用来源轮保存的题目与参考答案版本。', { exact: true }),
    ).toBeVisible()
    completed = true
  } finally {
    for (const app of opened) await stop(app)
    if (
      dirname(resolve(restoredDirectory)) !== resolve(tmpdir()) ||
      !basename(restoredDirectory).startsWith('embedded-practice-flow-restore-')
    )
      throw new Error('拒绝清理非本次恢复目录')
    if (completed)
      await rm(restoredDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
    else
      await info.attach('flow-restore-failed-directory', {
        body: restoredDirectory,
        contentType: 'text/plain',
      })
  }
})
