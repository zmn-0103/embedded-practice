import { createHash, randomUUID } from 'node:crypto'
import { copyFile, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { ElectronApplication } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, launchApplication, openPage, readAppStatus, test } from './helpers'
import { stop, withHistoryDatabase } from './history-helpers'
import { a, b, controlRecords, prepareControl } from './practice-control-helpers'
import { planOptions } from './practice-plan-helpers'
import { createRelation, relations, searchKnowledge } from './knowledge-helpers'
import { arrangeReview } from './review-helpers'
import { saveNote } from './study-helpers'

async function seed15(directory: string) {
  const sql = await readFile('tests/fixtures/schema-v15.sql')
  expect(createHash('sha256').update(sql).digest('hex')).toBe(
    '62c7780f844348980f8cde639107aaf11152a56b191704c194e226bcedd8db95',
  )
  const db = new DatabaseSync(join(directory, 'practice.sqlite3'))
  try {
    db.exec(sql.toString('utf8'))
    db.exec(`INSERT INTO topics(topic_id,title,source_name) VALUES('old-knowledge','原专题','原题库.md');
      INSERT INTO questions VALUES(1,'old-knowledge','q-1','原题','[]','基础',0,0,NULL);
      INSERT INTO question_versions VALUES(1,1,1,'原题','原题干','原答案','[]','[]','${'a'.repeat(64)}','2026-10-29T00:00:00.000Z');
      UPDATE questions SET current_version_id=1;
      INSERT INTO personal_notes VALUES(1,3,'原笔记 中文与代码','2026-10-29T00:00:00.000Z');
      INSERT INTO review_todos VALUES(1,2,'pending','2026-10-30','原待办原因','2026-10-29T00:00:00.000Z',NULL);
      INSERT INTO question_user_state VALUES(1,1,'不熟',1);
      CREATE TABLE private_knowledge(text TEXT) STRICT;INSERT INTO private_knowledge VALUES('用户自定义资料');
      CREATE INDEX private_knowledge_index ON private_knowledge(text);`)
    const tag = randomUUID(),
      plan = randomUUID(),
      set = randomUUID(),
      round = randomUUID()
    db.prepare('INSERT INTO personal_tags VALUES(?,?)').run(tag, '原标签')
    db.prepare('INSERT INTO question_personal_tags VALUES(1,?)').run(tag)
    db.prepare('INSERT INTO practice_plans VALUES(?,?,?,?,?)').run(
      plan,
      '原方案',
      JSON.stringify({
        ...planOptions,
        filters: { ...planOptions.filters, practiceRecency: '7d', practiceOrder: 'oldest' },
      }),
      1,
      '2026-10-29T00:00:00.000Z',
    )
    db.prepare('INSERT INTO question_sets VALUES(?,?,?,?)').run(
      set,
      '原题单',
      1,
      '2026-10-29T00:00:00.000Z',
    )
    db.prepare("INSERT INTO question_set_items VALUES(?,0,'old-knowledge','q-1')").run(set)
    db.prepare(
      "INSERT INTO practice_sessions(id,mode,topic_id,status,position,revision,created_at) VALUES(?,'sequential','old-knowledge','active',0,0,'2026-10-29T00:00:00.000Z')",
    ).run(round)
    db.prepare(
      "INSERT INTO practice_items(session_id,position,question_id,version_id,title,topic_title,tags_json,difficulty,draft,draft_revision) VALUES(?,0,1,1,'原题','原专题','[]','基础','原活动轮草稿',2)",
    ).run(round)
    expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
    return controlRecords(db)
  } finally {
    db.close()
  }
}
for (const fault of ['none', 'backup-blocked', 'second-table-collision'] as const) {
  test(`结构15受保护升级17，旧待办/笔记/标签/方案/草稿保持：${fault}`, async ({
    testDataDirectory,
  }, info) => {
    const before = await seed15(testDataDirectory)
    if (fault === 'backup-blocked')
      await writeFile(join(testDataDirectory, 'backups'), '原文件保持')
    if (fault === 'second-table-collision')
      withHistoryDatabase(
        testDataDirectory,
        (db) => db.exec('CREATE TABLE recent_knowledge_searches(original TEXT) STRICT'),
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
        ).toEqual({ user_version: 15 })
        return
      }
      expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual({
        ...before,
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
          db.prepare("SELECT name FROM sqlite_schema WHERE name='private_knowledge_index'").get(),
        ),
      ).toEqual({ name: 'private_knowledge_index' })
      const backups = (await readdir(join(testDataDirectory, 'backups'))).filter((name) =>
        name.startsWith('pre-migration-v15-'),
      )
      expect(backups).toHaveLength(1)
      const db = new DatabaseSync(join(testDataDirectory, 'backups', backups[0]!), {
        readOnly: true,
      })
      try {
        expect(controlRecords(db)).toEqual(before)
        expect(db.prepare('PRAGMA user_version').get()).toEqual({ user_version: 15 })
      } finally {
        db.close()
      }
    } finally {
      await stop(application)
    }
  })
}

test('完整备份恢复关联/说明/最近搜索，拒绝重复/自关联/孤儿/非法文字日期且保留源字节', async ({
  testDataDirectory,
}, info) => {
  const initial = await prepareControl(testDataDirectory, info, 3),
    destination = await mkdtemp(join(tmpdir(), 'embedded-practice-knowledge-restore-'))
  const opened: ElectronApplication[] = [initial.application]
  try {
    await saveNote(initial.page, { ...a(1), expectedRevision: 0, text: 'DMA 发送完成积累' })
    await arrangeReview(initial.page)
    await createRelation(initial.page, a(1), b(2))
    const another = await createRelation(initial.page, a(2), b(1))
    expect(
      await initial.page.evaluate(
        (input) =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.knowledge.changeRelation(
            input,
          ),
        {
          action: 'save' as const,
          relationId: another.relationId,
          expectedRevision: 1,
          source: a(1),
          target: b(2),
          kind: 'scenario' as const,
          explanation: '同一项目场景',
        },
      ),
    ).toMatchObject({ ok: true })
    await initial.page.evaluate(async () => {
      const api = (globalThis as unknown as { desktop: DesktopApi }).desktop.knowledge
      await api.changeRecent({ kind: 'remember', query: 'DMA' })
      await api.changeRecent({ kind: 'remember', query: '串口完成' })
    })
    const before = withHistoryDatabase(testDataDirectory, controlRecords),
      file = info.outputPath('knowledge-full.sqlite3')
    await initial.application.evaluate(({ dialog }, filePath) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath })
    }, file)
    await openPage(initial.page, '备份恢复')
    await initial.page.getByRole('button', { name: '导出完整备份', exact: true }).click()
    await expect(initial.page.getByText('完整备份已导出并校验。', { exact: true })).toBeVisible()
    const bytes = await readFile(file),
      empty = await launchApplication(destination, info.project.name, '备份恢复')
    opened.push(empty.application)
    const unchanged = withHistoryDatabase(destination, controlRecords)
    for (const [kind, sql] of [
      [
        'duplicate-id',
        'ALTER TABLE question_relations RENAME TO copied_relations; CREATE TABLE question_relations AS SELECT * FROM copied_relations; INSERT INTO question_relations SELECT * FROM copied_relations; DROP TABLE copied_relations',
      ],
      [
        'duplicate-pair',
        "DROP INDEX relation_pair_kind; UPDATE question_relations SET kind='confused'",
      ],
      [
        'self',
        'PRAGMA ignore_check_constraints=ON; UPDATE question_relations SET target_question_id=source_question_id',
      ],
      ['orphan', 'PRAGMA foreign_keys=OFF; UPDATE question_relations SET source_question_id=99999'],
      [
        'text',
        "PRAGMA ignore_check_constraints=ON; UPDATE question_relations SET explanation=replace(hex(zeroblob(1001)),'0','a')",
      ],
      ['revision', 'PRAGMA ignore_check_constraints=ON; UPDATE question_relations SET revision=0'],
      ['date', "UPDATE question_relations SET updated_at='invalid-time'"],
      ['recent-date', "UPDATE recent_knowledge_searches SET searched_at='invalid-time'"],
      [
        'recent-without-rowid',
        'ALTER TABLE recent_knowledge_searches RENAME TO copied_searches; CREATE TABLE recent_knowledge_searches(query TEXT PRIMARY KEY,searched_at TEXT NOT NULL) WITHOUT ROWID; INSERT INTO recent_knowledge_searches SELECT * FROM copied_searches; DROP TABLE copied_searches',
      ],
      [
        'recent-duplicate',
        'ALTER TABLE recent_knowledge_searches RENAME TO copied_searches; CREATE TABLE recent_knowledge_searches AS SELECT * FROM copied_searches; INSERT INTO recent_knowledge_searches SELECT * FROM copied_searches; DROP TABLE copied_searches',
      ],
      [
        'recent-capacity',
        "INSERT INTO recent_knowledge_searches SELECT 'extra-'||value,'2026-10-29T00:00:00.000Z' FROM json_each('[1,2,3,4,5,6,7,8,9,10,11]')",
      ],
    ]) {
      const damaged = info.outputPath(`damaged-knowledge-${kind}.sqlite3`)
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
    expect((await relations(restored.page, b(2))).total).toBe(2)
    expect((await searchKnowledge(restored.page, { query: 'DMA', kind: 'note' })).total).toBe(1)
    expect(
      await restored.page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.knowledge.recent(),
      ),
    ).toMatchObject({ ok: true, value: [{ query: '串口完成' }, { query: 'DMA' }] })
    expect(await readFile(file)).toEqual(bytes)
  } finally {
    for (const app of opened) await stop(app)
    if (
      dirname(resolve(destination)) !== resolve(tmpdir()) ||
      !basename(destination).startsWith('embedded-practice-knowledge-restore-')
    )
      throw new Error('非本次测试根')
    await rm(destination, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  }
})
