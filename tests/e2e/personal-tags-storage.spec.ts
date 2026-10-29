import { createHash, randomUUID } from 'node:crypto'
import { copyFile, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { ElectronApplication } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, launchApplication, openPage, readAppStatus, test } from './helpers'
import { stop, withHistoryDatabase } from './history-helpers'
import {
  a,
  changeSet,
  controlRecords,
  prepareControl,
  selectForPractice,
} from './practice-control-helpers'
import { changePlan, planOptions } from './practice-plan-helpers'
import { startFlow } from './practice-flow-helpers'

// 结构13由原封存v12夹具加改前6fbce18的personal_notes定义构成；原夹具不改写。
async function seedV13(directory: string) {
  const sql = await readFile('tests/fixtures/schema-v12.sql')
  expect(createHash('sha256').update(sql).digest('hex')).toBe(
    '4a923af302982bb2513ca5a441e45300419bc4c33ffa6fd52e36259d2547c52c',
  )
  const db = new DatabaseSync(join(directory, 'practice.sqlite3'))
  try {
    db.exec(sql.toString('utf8'))
    db.exec(`CREATE TABLE personal_notes (
      question_id INTEGER PRIMARY KEY REFERENCES questions(id),
      revision INTEGER NOT NULL CHECK (revision BETWEEN 1 AND 9007199254740991),
      text TEXT NOT NULL CHECK (length(CAST(text AS BLOB)) <= 1048576), updated_at TEXT NOT NULL
    ) STRICT;
    PRAGMA user_version=13;
    INSERT INTO topics(topic_id,title,source_name) VALUES('old-tags','旧专题','旧来源.md');
    INSERT INTO questions(id,topic_id,question_id,title,tags_json,difficulty,position,archived,current_version_id) VALUES(1,'old-tags','q-1','旧题','[]','基础',0,0,NULL);
    INSERT INTO question_versions VALUES(1,1,1,'旧题','旧题干','旧答案','[]','[]','${'a'.repeat(64)}','2026-10-27T00:00:00.000Z');
    UPDATE questions SET current_version_id=1;
    INSERT INTO personal_notes VALUES(1,2,'结构13原笔记','2026-10-27T00:00:00.000Z');
    CREATE TABLE private_original(text TEXT) STRICT; INSERT INTO private_original VALUES('自定义资料保持');`)
    db.prepare('INSERT INTO practice_plans VALUES(?,?,?)').run(
      randomUUID(),
      '原方案',
      JSON.stringify(planOptions),
    )
    const setId = randomUUID()
    db.prepare('INSERT INTO question_sets VALUES(?,?)').run(setId, '原题单')
    db.prepare("INSERT INTO question_set_items VALUES(?,0,'old-tags','q-1')").run(setId)
    return controlRecords(db)
  } finally {
    db.close()
  }
}

for (const fault of ['none', 'backup-blocked', 'collision'] as const) {
  test(`结构13升级17保护原笔记/定义和用户表：${fault}`, async ({ testDataDirectory }, info) => {
    const before = await seedV13(testDataDirectory)
    if (fault === 'backup-blocked')
      await writeFile(join(testDataDirectory, 'backups'), '原文件保持')
    if (fault === 'collision')
      withHistoryDatabase(
        testDataDirectory,
        (db) => db.exec('CREATE TABLE personal_tags(original TEXT) STRICT'),
        false,
      )
    const initial = withHistoryDatabase(testDataDirectory, controlRecords)
    const { application, page } = await launchApplication(testDataDirectory, info.project.name)
    try {
      const status = await readAppStatus(page)
      expect(status.ok).toBe(fault === 'none')
      if (fault !== 'none') {
        expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(initial)
        expect(
          withHistoryDatabase(testDataDirectory, (db) => db.prepare('PRAGMA user_version').get()),
        ).toEqual({ user_version: 13 })
        return
      }
      expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual({
        ...before,
        personal_tags: [],
        question_personal_tags: [],
        review_todos: [],
        question_relations: [],
        recent_knowledge_searches: [],
        daily_targets: [],
        study_goals: [],
        quota_settings: [],
        learning_activities: [],
        practice_plans: before.practice_plans!.map((row) => ({
          ...row,
          pinned: 0,
          last_used_at: null,
        })),
        question_sets: before.question_sets!.map((row) => ({
          ...row,
          pinned: 0,
          last_used_at: null,
        })),
      })
      const names = (await readdir(join(testDataDirectory, 'backups'))).filter((name) =>
        name.startsWith('pre-migration-v13-'),
      )
      expect(names).toHaveLength(1)
      const backup = new DatabaseSync(join(testDataDirectory, 'backups', names[0]!), {
        readOnly: true,
      })
      try {
        expect(controlRecords(backup)).toEqual(before)
        expect(backup.prepare('PRAGMA user_version').get()).toEqual({ user_version: 13 })
      } finally {
        backup.close()
      }
      expect(
        withHistoryDatabase(testDataDirectory, (db) => db.prepare('PRAGMA user_version').get()),
      ).toEqual({ user_version: 17 })
    } finally {
      await stop(application)
    }
  })
}

test('完整备份恢复个人标签/关联/置顶与最近使用，拒绝损坏元数据和关联且源文件不变', async ({
  testDataDirectory,
}, info) => {
  const initial = await prepareControl(testDataDirectory, info, 3)
  const destination = await mkdtemp(join(tmpdir(), 'embedded-practice-tags-restore-'))
  const opened: ElectronApplication[] = [initial.application]
  try {
    const tagId = randomUUID(),
      setId = randomUUID(),
      planId = randomUUID()
    await initial.page.evaluate(
      async ({ tagId }) => {
        const api = (globalThis as unknown as { desktop: DesktopApi }).desktop.personalTags
        if (
          !(await api.change({ kind: 'save', tagId, name: '需要上板验证' })).ok ||
          !(
            await api.change({
              kind: 'assign',
              tagId,
              present: true,
              items: [{ topicId: 'control-a', questionId: 'q-1' }],
            })
          ).ok
        )
          throw new Error('标签准备失败')
      },
      { tagId },
    )
    await changePlan(initial.page, {
      kind: 'save',
      planId,
      name: '标签方案',
      options: { ...planOptions, filters: { ...planOptions.filters, personalTagId: tagId } },
    })
    await changePlan(initial.page, { kind: 'pin', planId, pinned: true })
    await changeSet(initial.page, { kind: 'save', setId, name: '标签题单', items: [a(1)] })
    await changeSet(initial.page, { kind: 'pin', setId, pinned: true })
    const selected = { ...(await selectForPractice(initial.page, [a(1)])), sourceSetId: setId }
    expect(
      await startFlow(initial.page, {
        requestId: randomUUID(),
        topicId: null,
        count: 'all',
        replace: null,
        selected,
      }),
    ).toMatchObject({ ok: true })
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    const file = info.outputPath('personal-tags.sqlite3')
    await initial.application.evaluate(({ dialog }, filePath) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath })
    }, file)
    await openPage(initial.page, '备份恢复')
    await initial.page.getByRole('button', { name: '导出完整备份', exact: true }).click()
    await expect(initial.page.getByText('完整备份已导出并校验。', { exact: true })).toBeVisible()
    const bytes = await readFile(file)
    const empty = await launchApplication(destination, info.project.name, '备份恢复')
    opened.push(empty.application)
    const unchanged = withHistoryDatabase(destination, controlRecords)
    for (const [kind, sql] of [
      ['date', "UPDATE question_sets SET last_used_at='invalid-time'"],
      ['pin', 'PRAGMA ignore_check_constraints=ON; UPDATE practice_plans SET pinned=2'],
      [
        'duplicate-member',
        'PRAGMA foreign_keys=OFF; ALTER TABLE question_personal_tags RENAME TO copied_links; CREATE TABLE question_personal_tags AS SELECT * FROM copied_links; INSERT INTO question_personal_tags SELECT * FROM copied_links; DROP TABLE copied_links',
      ],
      [
        'duplicate-id',
        "PRAGMA foreign_keys=OFF; ALTER TABLE question_personal_tags RENAME TO copied_links; CREATE TABLE question_personal_tags AS SELECT * FROM copied_links; DROP TABLE copied_links; CREATE TABLE copied_tags AS SELECT * FROM personal_tags; DROP TABLE personal_tags; CREATE TABLE personal_tags(tag_id TEXT,name TEXT) STRICT; INSERT INTO personal_tags SELECT * FROM copied_tags; INSERT INTO personal_tags SELECT tag_id,'重复身份新名称' FROM copied_tags; DROP TABLE copied_tags",
      ],
      [
        'orphan',
        "PRAGMA foreign_keys=OFF; UPDATE question_personal_tags SET tag_id='00000000-0000-4000-8000-000000000000'",
      ],
    ]) {
      const damaged = info.outputPath(`damaged-tags-${kind}.sqlite3`)
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
      const result = await empty.page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
      )
      expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_BACKUP' } })
      expect(withHistoryDatabase(destination, controlRecords)).toEqual(unchanged)
    }
    expect(await readFile(file)).toEqual(bytes)
    await empty.application.evaluate(({ app, dialog }, path) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
      dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false })
      app.relaunch = () => {}
    }, file)
    await empty.page.getByRole('button', { name: '选择备份并预览', exact: true }).click()
    await expect(empty.page.getByLabel('恢复预览摘要', { exact: true })).toBeVisible()
    const closing = empty.application.waitForEvent('close')
    await empty.page.getByRole('button', { name: '恢复此备份…', exact: true }).click()
    await closing
    const restored = await launchApplication(destination, info.project.name)
    opened.push(restored.application)
    expect(withHistoryDatabase(destination, controlRecords)).toEqual(before)
    expect(await readFile(file)).toEqual(bytes)
  } finally {
    for (const application of opened) await stop(application)
    if (
      dirname(resolve(destination)) !== resolve(tmpdir()) ||
      !basename(destination).startsWith('embedded-practice-tags-restore-')
    )
      throw new Error('拒绝清理非本次临时目录')
    await rm(destination, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  }
})
