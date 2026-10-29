import { createHash, randomUUID } from 'node:crypto'
import { copyFile, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { ElectronApplication } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, launchApplication, openPage, readAppStatus, test } from './helpers'
import { importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
import { a, b, controlBank, controlRecords, prepareControl } from './practice-control-helpers'
import { arrangeReview, listReviews, readReview, saveReview } from './review-helpers'

async function seedV14(directory: string) {
  const sql = await readFile('tests/fixtures/schema-v14.sql')
  expect(createHash('sha256').update(sql).digest('hex')).toBe(
    'b79d0dd96a9eddbf326cce4794e1c6a7c3fd5862a269fc55b00b5dae27dafddb',
  )
  const db = new DatabaseSync(join(directory, 'practice.sqlite3'))
  try {
    db.exec(sql.toString('utf8'))
    db.exec(`INSERT INTO topics(topic_id,title,source_name) VALUES('old-review','旧专题','旧来源.md');
      INSERT INTO questions VALUES(1,'old-review','q-1','旧题','[]','基础',0,0,NULL);
      INSERT INTO question_versions VALUES(1,1,1,'旧题','旧题干','旧答案','[]','[]','${'a'.repeat(64)}','2026-10-28T00:00:00.000Z');
      UPDATE questions SET current_version_id=1;
      INSERT INTO personal_notes VALUES(1,2,'原笔记\n    keep();','2026-10-28T00:00:00.000Z');
      INSERT INTO question_user_state VALUES(1,1,'不熟',1);
      CREATE TABLE private_review_notes(text TEXT) STRICT; INSERT INTO private_review_notes VALUES('自定义资料保持');
      CREATE INDEX private_review_index ON private_review_notes(text);`)
    const tag = randomUUID(),
      plan = randomUUID(),
      set = randomUUID(),
      round = randomUUID()
    db.prepare('INSERT INTO personal_tags VALUES(?,?)').run(tag, '原个人标签')
    db.prepare('INSERT INTO question_personal_tags VALUES(1,?)').run(tag)
    db.prepare('INSERT INTO practice_plans VALUES(?,?,?,?,?)').run(
      plan,
      '原方案',
      JSON.stringify({
        topicId: null,
        count: 10,
        mode: 'sequential',
        filters: {
          query: '',
          tag: null,
          difficulty: null,
          mastery: 'all',
          favoritesOnly: false,
          personalTagId: tag,
        },
        category: { kind: 'all' },
      }),
      1,
      '2026-10-28T01:00:00.000Z',
    )
    db.prepare('INSERT INTO question_sets VALUES(?,?,?,?)').run(
      set,
      '原题单',
      1,
      '2026-10-28T01:00:00.000Z',
    )
    db.prepare("INSERT INTO question_set_items VALUES(?,0,'old-review','q-1')").run(set)
    db.prepare(
      "INSERT INTO practice_sessions(id,mode,topic_id,status,position,revision,created_at) VALUES(?,'sequential','old-review','active',0,0,'2026-10-28T00:00:00.000Z')",
    ).run(round)
    db.prepare(
      "INSERT INTO practice_items(session_id,position,question_id,version_id,title,topic_title,tags_json,difficulty,draft,draft_revision) VALUES(?,0,1,1,'旧题','旧专题','[]','基础','未完成旧草稿',3)",
    ).run(round)
    expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
    return controlRecords(db)
  } finally {
    db.close()
  }
}
for (const fault of ['none', 'backup-blocked', 'collision'] as const) {
  test(`结构14受保护升级17，原笔记/标签/元数据/活动轮逐表保持：${fault}`, async ({
    testDataDirectory,
  }, info) => {
    const before = await seedV14(testDataDirectory)
    if (fault === 'backup-blocked')
      await writeFile(join(testDataDirectory, 'backups'), '原文件保持')
    if (fault === 'collision')
      withHistoryDatabase(
        testDataDirectory,
        (db) => db.exec('CREATE TABLE review_todos(original TEXT) STRICT'),
        false,
      )
    const initial = withHistoryDatabase(testDataDirectory, controlRecords)
    const { application, page } = await launchApplication(testDataDirectory, info.project.name)
    try {
      expect((await readAppStatus(page)).ok).toBe(fault === 'none')
      if (fault !== 'none') {
        expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(initial)
        expect(
          withHistoryDatabase(testDataDirectory, (db) => db.prepare('PRAGMA user_version').get()),
        ).toEqual({ user_version: 14 })
        return
      }
      expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual({
        ...before,
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
      const backups = (await readdir(join(testDataDirectory, 'backups'))).filter((name) =>
        name.startsWith('pre-migration-v14-'),
      )
      expect(backups).toHaveLength(1)
      const db = new DatabaseSync(join(testDataDirectory, 'backups', backups[0]!), {
        readOnly: true,
      })
      try {
        expect(controlRecords(db)).toEqual(before)
        expect(db.prepare('PRAGMA user_version').get()).toEqual({ user_version: 14 })
        expect(
          db.prepare("SELECT name FROM sqlite_schema WHERE name='private_review_index'").get(),
        ).toEqual({ name: 'private_review_index' })
      } finally {
        db.close()
      }
    } finally {
      await stop(application)
    }
  })
}

test('复习安排真实事务：幂等/CAS/完成与重开、到期分页、写失败回滚及归档重导入保持', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareControl(testDataDirectory, info)
  try {
    expect(await readReview(page)).toEqual({ ok: true, value: null })
    expect(
      await saveReview(page, {
        ...a(1),
        expectedRevision: 0,
        state: 'done',
        dueDate: null,
        reason: '',
      }),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } })
    const original = await arrangeReview(page, a(1), '2000-01-01')
    const command = {
      ...a(1),
      expectedRevision: 1,
      state: 'done' as const,
      dueDate: '2000-01-01',
      reason: '明确完成',
    }
    const completed = await saveReview(page, command)
    expect(completed).toMatchObject({
      ok: true,
      value: { revision: 2, state: 'done', reason: '明确完成' },
    })
    expect(await saveReview(page, command)).toEqual(completed)
    expect(await saveReview(page, { ...command, reason: '旧修订不能覆盖' })).toMatchObject({
      ok: false,
      error: { code: 'CONFLICT' },
    })
    if (!completed.ok) throw new Error('完成失败')
    const updated = await saveReview(page, {
      ...command,
      expectedRevision: 2,
      reason: '完成后补充',
    })
    expect(updated).toMatchObject({
      ok: true,
      value: { revision: 3, completedAt: completed.value.completedAt },
    })
    expect(
      await saveReview(page, {
        ...command,
        expectedRevision: 3,
        state: 'pending',
        reason: '延期',
        dueDate: '2099-01-01',
      }),
    ).toMatchObject({ ok: true, value: { revision: 4, completedAt: null } })
    for (let n = 2; n <= 27; n++) await arrangeReview(page, a(n), n % 2 === 0 ? '2000-01-01' : null)
    const due = await listReviews(page, { due: 'due' }),
      undated = await listReviews(page, { due: 'undated' })
    expect(due.total).toBe(13)
    expect(undated.total).toBe(13)
    expect((await listReviews(page, { page: 1 })).items).toHaveLength(20)
    expect(await listReviews(page, { page: 99 })).toMatchObject({ page: 2, total: 27 })
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER fail_review BEFORE UPDATE ON review_todos BEGIN SELECT RAISE(ABORT,'injected review write'); END",
        ),
      false,
    )
    expect(
      await saveReview(page, { ...command, expectedRevision: 4, reason: '不能写入' }),
    ).toMatchObject({ ok: false, error: { code: 'DATABASE_UNAVAILABLE' } })
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
    withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER fail_review'), false)
    await writeFile(file, controlBank('control-a', 27, true, 1))
    await importHistoryFiles(application, page, [file])
    expect(await readReview(page)).toMatchObject({
      ok: true,
      value: { revision: 4, state: 'pending', reason: '延期' },
    })
    const archivedItems = [
      ...(await listReviews(page)).items,
      ...(await listReviews(page, { page: 2 })).items,
    ]
    expect(archivedItems.find((item) => item.questionId === 'q-1')).toMatchObject({
      archived: true,
    })
    await writeFile(file, controlBank('control-a'))
    await importHistoryFiles(application, page, [file])
    expect(await readReview(page)).toMatchObject({
      ok: true,
      value: { revision: 4, reason: '延期' },
    })
    expect(original.completedAt).toBeNull()
  } finally {
    await stop(application)
  }
})

test('完整备份恢复待办与最近条件，拒绝日期/完成状态/重复/孤儿损坏，源字节保持', async ({
  testDataDirectory,
}, info) => {
  const initial = await prepareControl(testDataDirectory, info, 3)
  const destination = await mkdtemp(join(tmpdir(), 'embedded-practice-review-restore-'))
  const opened: ElectronApplication[] = [initial.application]
  try {
    await arrangeReview(initial.page, a(1), '2000-01-01')
    await arrangeReview(initial.page, b(2))
    expect(
      await saveReview(initial.page, {
        ...b(2),
        expectedRevision: 1,
        state: 'done',
        dueDate: null,
        reason: '已明确完成',
      }),
    ).toMatchObject({ ok: true })
    const planId = randomUUID()
    expect(
      await initial.page.evaluate(
        ({ planId }) =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.practicePlans.change({
            kind: 'save',
            planId,
            name: '最近未练方案',
            options: {
              topicId: null,
              category: { kind: 'all' },
              count: 10,
              mode: 'random',
              filters: {
                query: '',
                tag: null,
                difficulty: null,
                mastery: 'all',
                favoritesOnly: false,
                practiceRecency: '7d',
                practiceOrder: 'oldest',
              },
            },
          }),
        { planId },
      ),
    ).toMatchObject({ ok: true })
    const before = withHistoryDatabase(testDataDirectory, controlRecords),
      file = info.outputPath('review-todos.sqlite3')
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
      ['date', "UPDATE review_todos SET due_date='2026-02-30'"],
      [
        'completion',
        "PRAGMA ignore_check_constraints=ON; UPDATE review_todos SET completed_at=NULL WHERE state='done'",
      ],
      ['revision', 'PRAGMA ignore_check_constraints=ON; UPDATE review_todos SET revision=0'],
      [
        'reason',
        "PRAGMA ignore_check_constraints=ON; UPDATE review_todos SET reason=replace(hex(zeroblob(251)),'0','a')",
      ],
      [
        'duplicate',
        'ALTER TABLE review_todos RENAME TO copied_reviews; CREATE TABLE review_todos AS SELECT * FROM copied_reviews; INSERT INTO review_todos SELECT * FROM copied_reviews; DROP TABLE copied_reviews',
      ],
      [
        'orphan',
        'PRAGMA foreign_keys=OFF; UPDATE review_todos SET question_id=99999 WHERE question_id=(SELECT min(question_id) FROM review_todos)',
      ],
    ]) {
      const damaged = info.outputPath(`review-damaged-${kind}.sqlite3`)
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
      expect(withHistoryDatabase(destination, controlRecords)).toEqual(unchanged)
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
    expect(await readReview(restored.page)).toMatchObject({
      ok: true,
      value: { state: 'pending', dueDate: '2000-01-01' },
    })
    expect(await readFile(file)).toEqual(bytes)
  } finally {
    for (const app of opened) await stop(app)
    if (
      dirname(resolve(destination)) !== resolve(tmpdir()) ||
      !basename(destination).startsWith('embedded-practice-review-restore-')
    )
      throw new Error('非本次测试临时目录')
    await rm(destination, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  }
})
