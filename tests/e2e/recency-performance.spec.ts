import { cpus, release } from 'node:os'
import { performance } from 'node:perf_hooks'
import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { EMPTY_QUESTION_FILTERS } from '../../src/shared/contracts/question-filters'
import { expect, launchApplication, test } from './helpers'
import { stop, withHistoryDatabase } from './history-helpers'

test('生成5000题与0/10万/50万历史项的最近练习筛选测量', async ({ testDataDirectory }, info) => {
  test.setTimeout(180_000)
  const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  const report: unknown[] = []
  try {
    const actual = await application.evaluate(({ app }) => ({
      directory: app.getPath('userData'),
      executable: process.execPath,
      electron: process.versions.electron,
    }))
    expect(actual.directory).toBe(testDataDirectory)
    await expect(page.locator('footer')).toContainText('20261030.1-v003-bank')
    withHistoryDatabase(
      testDataDirectory,
      (db) => {
        db.exec(`BEGIN;
        INSERT INTO topics(topic_id,title,source_name) VALUES('perf-recency','仅性能生成专题','generated');
        WITH RECURSIVE n(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM n WHERE x<5000)
        INSERT INTO questions(id,topic_id,question_id,title,tags_json,difficulty,position,archived)
          SELECT x,'perf-recency','q-'||x,'仅性能生成题 '||x,'[]','基础',x-1,0 FROM n;
        INSERT INTO question_versions(id,question_id,sequence,title,question_markdown,answer_markdown,definitions_json,image_bindings_json,content_hash,created_at)
          SELECT id,id,1,title,'生成题干','生成答案','[]','[]',printf('%064d',id),'2026-01-01T00:00:00.000Z' FROM questions;
        UPDATE questions SET current_version_id=id;
        INSERT INTO question_user_state(question_id) SELECT id FROM questions;
        COMMIT;`)
        expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
      },
      false,
    )
    let previous = 0
    for (const rounds of [0, 20, 100]) {
      if (rounds)
        withHistoryDatabase(
          testDataDirectory,
          (db) => {
            const now = Date.now()
            db.exec('BEGIN')
            const session = db.prepare(
              "INSERT INTO practice_sessions(id,mode,status,position,revision,created_at,ended_at) VALUES(?,'sequential','finished',5000,1,?,?)",
            )
            const items =
              db.prepare(`INSERT INTO practice_items(session_id,position,question_id,version_id,title,topic_title,tags_json,difficulty,revealed_at)
          SELECT ?,q.position,q.id,q.current_version_id,q.title,'仅性能生成专题','[]','基础',
            CASE q.id%4 WHEN 0 THEN NULL WHEN 1 THEN ? WHEN 2 THEN ? ELSE ? END FROM questions q`)
            for (let round = previous; round < rounds; round++) {
              const id = `00000000-0000-4000-8000-${String(round).padStart(12, '0')}`
              const stamp = new Date(now).toISOString()
              session.run(id, stamp, stamp)
              items.run(
                id,
                ...[2, 14, 60].map((days) => new Date(now - days * 86400000).toISOString()),
              )
            }
            db.exec('COMMIT')
            expect(db.prepare('SELECT count(*) AS total FROM practice_items').get()).toEqual({
              total: rounds * 5000,
            })
          },
          false,
        )
      previous = rounds
      for (const recency of ['all', 'never', '7d', '30d'] as const) {
        for (const order of ['default', 'oldest'] as const) {
          const samples: number[] = []
          for (let run = 0; run < 8; run++) {
            const started = performance.now()
            const response = await page.evaluate(
              (request) =>
                (globalThis as unknown as { desktop: DesktopApi }).desktop.library.listQuestions(
                  request,
                ),
              {
                topicId: null,
                archived: false,
                page: 1,
                filters: {
                  ...EMPTY_QUESTION_FILTERS,
                  practiceRecency: recency,
                  practiceOrder: order,
                },
              },
            )
            const elapsed = performance.now() - started
            expect(response.ok).toBe(true)
            if (!response.ok) throw new Error(response.error.message)
            expect(response.value.total).toBe(
              !rounds || recency === 'all'
                ? 5000
                : recency === 'never'
                  ? 1250
                  : recency === '7d'
                    ? 3750
                    : 2500,
            )
            if (rounds && (order === 'oldest' || recency === 'never'))
              expect(response.value.questions[0]?.questionId).toBe('q-4')
            if (run > 0) samples.push(elapsed)
          }
          const sorted = [...samples].sort((a, b) => a - b)
          report.push({
            items: rounds * 5000,
            recency,
            order,
            samplesMs: samples,
            medianMs: sorted[3],
            maxMs: sorted.at(-1),
          })
        }
      }
    }
    const databaseBytes = (await stat(join(testDataDirectory, 'practice.sqlite3'))).size
    await stop(application)
    const restartAt = performance.now()
    const reopened = await launchApplication(testDataDirectory, info.project.name)
    const startupWithCopyMs = performance.now() - restartAt
    await stop(reopened.application)
    await info.attach('recency-performance.json', {
      body: JSON.stringify(
        {
          actual,
          build: '20261030.1-v003-bank',
          schema: 17,
          databaseBytes,
          startupWithCopyMs,
          cpu: cpus()[0]?.model,
          windows: release(),
          scope:
            '开发Electron，真实生产IPC/SQL，生成题和历史，包含IPC开销；每组首轮预热后7次；不代表真实用户数据或安装器',
          measurements: report,
        },
        null,
        2,
      ),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})
