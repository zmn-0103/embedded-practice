import { createHash, randomUUID } from 'node:crypto'
import { copyFile, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { ElectronApplication } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, launchApplication, openPage, readAppStatus, test } from './helpers'
import { stop, withHistoryDatabase } from './history-helpers'
import { a, b, changeSet, controlRecords, prepareControl } from './practice-control-helpers'
import { createStudyRound, saveNote } from './study-helpers'
import { arrangeReview, saveReview } from './review-helpers'
import { calendarDay, changePlanning, goalProgress, planningHome } from './planning-helpers'
import { localDay } from '../../src/shared/contracts/planning'

async function seed16(directory: string) {
  const sql = await readFile('tests/fixtures/schema-v16.sql')
  expect(createHash('sha256').update(sql).digest('hex')).toBe(
    '52cda72212a8fec30e88e64f807e086be98d3f002d3a15514a01d95bfce2fced',
  )
  const db = new DatabaseSync(join(directory, 'practice.sqlite3'))
  try {
    db.exec(sql.toString('utf8'))
    db.exec(`INSERT INTO topics(topic_id,title,source_name) VALUES('legacy-goal','原专题','原.md');
    INSERT INTO questions VALUES(1,'legacy-goal','q-1','原题1','[]','基础',0,0,NULL);
    INSERT INTO questions VALUES(2,'legacy-goal','q-2','原题2','[]','基础',1,0,NULL);
    INSERT INTO question_versions VALUES(1,1,1,'原题1','原题干1','原答案1','[]','[]','${'a'.repeat(64)}','2000-02-29T00:00:00.000Z');
    INSERT INTO question_versions VALUES(2,2,1,'原题2','原题干2','原答案2','[]','[]','${'b'.repeat(64)}','2000-02-29T00:00:00.000Z');
    UPDATE questions SET current_version_id=id;
    INSERT INTO personal_notes VALUES(1,2,'旧理解正文','2000-02-29T00:00:00.000Z');
    INSERT INTO review_todos VALUES(1,2,'done',NULL,'旧明确完成','2000-02-29T00:00:00.000Z','2000-02-29T00:00:00.000Z');
    INSERT INTO recent_knowledge_searches VALUES('旧检索词','2000-02-29T00:00:00.000Z');
    CREATE TABLE private_planning(value TEXT) STRICT;INSERT INTO private_planning VALUES('用户原资料');`)
    const relation = randomUUID(),
      round = randomUUID(),
      active = randomUUID()
    db.prepare('INSERT INTO question_relations VALUES(?,1,2,?,?,1,?)').run(
      relation,
      'confused',
      '旧易混点',
      '2000-02-29T00:00:00.000Z',
    )
    db.prepare(
      "INSERT INTO practice_sessions(id,mode,topic_id,status,position,revision,created_at,ended_at) VALUES(?,'sequential','legacy-goal','finished',0,2,'2000-02-29T00:00:00.000Z','2000-02-29T00:00:00.000Z')",
    ).run(round)
    db.prepare(
      "INSERT INTO practice_items(session_id,position,question_id,version_id,title,topic_title,tags_json,difficulty,draft,draft_revision,revealed_at,rating,rated_at) VALUES(?,0,1,1,'原题1','原专题','[]','基础','旧作答',1,'2000-02-29T00:00:00.000Z','不熟','2000-02-29T00:00:00.000Z')",
    ).run(round)
    db.prepare(
      "INSERT INTO practice_sessions(id,mode,topic_id,status,position,revision,created_at) VALUES(?,'sequential','legacy-goal','active',0,0,'2000-02-29T00:00:00.000Z')",
    ).run(active)
    db.prepare(
      "INSERT INTO practice_items(session_id,position,question_id,version_id,title,topic_title,tags_json,difficulty,draft,draft_revision) VALUES(?,0,2,2,'原题2','原专题','[]','基础','未完成草稿',2)",
    ).run(active)
    expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  } finally {
    db.close()
  }
}
for (const fault of ['none', 'backup-blocked', 'second-table-collision'] as const) {
  test(`结构16受保护升级17，原知识/待办/笔记/历史/草稿逐表保持：${fault}`, async ({
    testDataDirectory,
  }, info) => {
    await seed16(testDataDirectory)
    if (fault === 'backup-blocked')
      await writeFile(join(testDataDirectory, 'backups'), '原文件保持')
    if (fault === 'second-table-collision')
      withHistoryDatabase(
        testDataDirectory,
        (db) =>
          db.exec(
            "CREATE TABLE study_goals(private_value TEXT) STRICT;INSERT INTO study_goals VALUES('原同名资料')",
          ),
        false,
      )
    const before = withHistoryDatabase(testDataDirectory, controlRecords),
      { application, page } = await launchApplication(testDataDirectory, info.project.name)
    try {
      if (fault !== 'none') {
        expect(await readAppStatus(page)).toMatchObject({ ok: false })
        expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
        expect(
          withHistoryDatabase(testDataDirectory, (db) => db.prepare('PRAGMA user_version').get()),
        ).toEqual({ user_version: 16 })
        return
      }
      expect(await readAppStatus(page)).toMatchObject({ ok: true })
      expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual({
        ...before,
        daily_targets: [],
        study_goals: [],
        quota_settings: [],
        learning_activities: [],
      })
      expect(
        withHistoryDatabase(testDataDirectory, (db) => db.prepare('PRAGMA user_version').get()),
      ).toEqual({ user_version: 17 })
      expect(await calendarDay(page, '2000-02-29')).toMatchObject({ eventTotal: 0, roundTotal: 2 })
      expect((await planningHome(page, '2000-02-29')).counts).toMatchObject({
        ratingQuestions: 0,
        reviewQuestions: 0,
      })
      const backups = (await readdir(join(testDataDirectory, 'backups'))).filter((name) =>
        name.startsWith('pre-migration-v16-'),
      )
      expect(backups).toHaveLength(1)
      const old = new DatabaseSync(join(testDataDirectory, 'backups', backups[0]!), {
        readOnly: true,
      })
      try {
        expect(controlRecords(old)).toEqual(before)
        expect(old.prepare('PRAGMA user_version').get()).toEqual({ user_version: 16 })
      } finally {
        old.close()
      }
    } finally {
      await stop(application)
    }
  })
}

test('完整备份恢复目标/配额/独立活动事实，拒绝日期/计数/重复/事件位置损坏并保留源字节', async ({
  testDataDirectory,
}, info) => {
  const initial = await prepareControl(testDataDirectory, info, 3),
    destination = await mkdtemp(join(tmpdir(), 'embedded-practice-planning-restore-'))
  const opened: ElectronApplication[] = [initial.application]
  try {
    const setId = randomUUID(),
      goalId = randomUUID(),
      day = localDay()
    await changeSet(initial.page, {
      kind: 'save',
      setId,
      name: '备考固定范围',
      items: [a(1), b(2)],
    })
    await changePlanning(initial.page, {
      kind: 'exam',
      goalId,
      name: '备考恢复',
      deadline: '2026-12-01',
      setIds: [setId],
      expectedRevision: 0,
    })
    await changePlanning(initial.page, {
      kind: 'daily',
      day,
      ratingTarget: 10,
      reviewTarget: 2,
      expectedRevision: 0,
    })
    await changePlanning(initial.page, {
      kind: 'quota',
      rows: [{ topicId: 'control-a', count: 2, priority: 'oldest' }],
      expectedRevision: 0,
    })
    await createStudyRound(initial.page, '实际自评记录', [a(1)])
    await saveNote(initial.page, { ...b(2), expectedRevision: 0, text: '实际笔记活动' })
    await arrangeReview(initial.page)
    await saveReview(initial.page, {
      ...a(1),
      state: 'done',
      dueDate: null,
      reason: '完成一次',
      expectedRevision: 1,
    })
    await saveReview(initial.page, {
      ...a(1),
      state: 'pending',
      dueDate: null,
      reason: '后续再次处理',
      expectedRevision: 2,
    })
    // 模拟备份迁移了时区后仍保留发生日，不能依据当前时区回算账本日期。
    withHistoryDatabase(
      testDataDirectory,
      (db) => db.exec("UPDATE learning_activities SET day='2000-02-29' WHERE kind='note'"),
      false,
    )
    const before = withHistoryDatabase(testDataDirectory, controlRecords),
      file = info.outputPath('planning-full.sqlite3')
    await initial.application.evaluate(({ dialog }, filePath) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath })
    }, file)
    await openPage(initial.page, '备份恢复')
    await initial.page.getByRole('button', { name: '导出完整备份', exact: true }).click()
    await expect(initial.page.getByText('完整备份已导出并校验。', { exact: true })).toBeVisible()
    const bytes = await readFile(file),
      empty = await launchApplication(destination, info.project.name, '备份恢复')
    opened.push(empty.application)
    const untouched = withHistoryDatabase(destination, controlRecords)
    for (const [kind, sql] of [
      [
        'daily-count',
        'PRAGMA ignore_check_constraints=ON;UPDATE daily_targets SET rating_target=501',
      ],
      ['daily-date', "UPDATE daily_targets SET day='2026-02-30'"],
      [
        'daily-duplicate',
        'ALTER TABLE daily_targets RENAME TO copied_daily;CREATE TABLE daily_targets AS SELECT * FROM copied_daily;INSERT INTO daily_targets SELECT * FROM copied_daily;DROP TABLE copied_daily',
      ],
      ['exam-sets', `UPDATE study_goals SET set_ids_json='["${setId}","${setId}"]'`],
      ['exam-date', "UPDATE study_goals SET deadline='bad'"],
      [
        'quota-count',
        `UPDATE quota_settings SET rows_json='[{"topicId":"control-a","count":501,"priority":"oldest"}]'`,
      ],
      [
        'quota-duplicate',
        `UPDATE quota_settings SET rows_json='[{"topicId":"control-a","count":1,"priority":"weak"},{"topicId":"control-a","count":2,"priority":"weak"}]'`,
      ],
      ['activity-date', "UPDATE learning_activities SET day='2026-02-30'"],
      [
        'activity-orphan',
        'PRAGMA foreign_keys=OFF;UPDATE learning_activities SET question_id=99999',
      ],
      [
        'activity-position',
        "PRAGMA foreign_keys=OFF;UPDATE learning_activities SET position=40 WHERE kind='rating'",
      ],
      [
        'activity-wrong-question',
        "PRAGMA foreign_keys=OFF;UPDATE learning_activities SET question_id=2 WHERE kind='rating'",
      ],
      [
        'activity-kind',
        "PRAGMA ignore_check_constraints=ON;UPDATE learning_activities SET kind='note' WHERE kind='rating'",
      ],
      ['activity-id', "UPDATE learning_activities SET activity_id='bad' WHERE kind='rating'"],
      [
        'activity-duplicate',
        'ALTER TABLE learning_activities RENAME TO copied_activities;CREATE TABLE learning_activities AS SELECT * FROM copied_activities;INSERT INTO learning_activities SELECT * FROM copied_activities;DROP TABLE copied_activities',
      ],
    ]) {
      const damaged = info.outputPath(`damaged-planning-${kind}.sqlite3`)
      await copyFile(file, damaged)
      const db = new DatabaseSync(damaged)
      try {
        db.exec(sql!)
      } finally {
        db.close()
      }
      const damagedBytes = await readFile(damaged)
      await empty.application.evaluate(({ dialog }, path) => {
        dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
      }, damaged)
      expect(
        await empty.page.evaluate(() =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
        ),
      ).toMatchObject({ ok: false, error: { code: 'INVALID_BACKUP' } })
      expect(withHistoryDatabase(destination, controlRecords)).toEqual(untouched)
      expect(await readFile(damaged)).toEqual(damagedBytes)
    }
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
    expect((await planningHome(restored.page)).counts).toMatchObject({
      ratingQuestions: 1,
      reviewQuestions: 1,
      noteSaves: 0,
    })
    expect(await calendarDay(restored.page, '2000-02-29')).toMatchObject({ eventTotal: 1 })
    expect(await goalProgress(restored.page, goalId)).toMatchObject({ total: 2, practiced: 1 })
    expect(await readFile(file)).toEqual(bytes)
  } finally {
    for (const app of opened) await stop(app)
    if (
      resolve(dirname(destination)) !== resolve(tmpdir()) ||
      !basename(destination).startsWith('embedded-practice-planning-restore-')
    )
      throw Error('临时目录越界')
    await rm(destination, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  }
})
