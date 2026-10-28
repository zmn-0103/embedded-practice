import type Database from 'better-sqlite3'
import { z } from 'zod'
import type { ImportSnapshot } from '../../../shared/contracts/import-snapshot'
import { commitReceiptSchema, type CommitReceipt } from '../../../shared/contracts/library-import'
import { questionDifficultySchema } from '../../../shared/contracts/question-bank'
import { compareImport, type LibraryBaseline } from '../../services/library/compare-import'

export class StalePreviewError extends Error {}

export interface LibraryRepository {
  baseline(topicIds: readonly string[]): LibraryBaseline
  receipt(token: string): CommitReceipt | undefined
  commit(token: string, snapshot: ImportSnapshot, expectedRevision: number): CommitReceipt
}

interface TopicRow {
  topicId: string
  title: string
  fileName: string
}
interface QuestionRow {
  questionId: string
  title: string
  tags: string
  difficulty: string
  position: number
  archived: number
  contentHash: string | null
}
interface IdentityRow {
  id: number
  currentVersionId: number | null
}

export function createLibraryRepository(database: Database.Database): LibraryRepository {
  const revisionQuery = database.prepare('SELECT revision FROM library_meta WHERE id = 1')
  const topicQuery = database.prepare(
    'SELECT topic_id AS topicId, title, source_name AS fileName FROM topics WHERE topic_id = ?',
  )
  const questionQuery = database.prepare(`
    SELECT q.question_id AS questionId, q.title, q.tags_json AS tags, q.difficulty,
      q.position, q.archived, v.content_hash AS contentHash
    FROM questions q LEFT JOIN question_versions v ON v.id = q.current_version_id
    WHERE q.topic_id = ? ORDER BY q.position, q.id
  `)
  const receiptQuery = database.prepare(
    'SELECT result_json AS result FROM import_receipts WHERE token = ?',
  )
  function receipt(token: string): CommitReceipt | undefined {
    const row = receiptQuery.get(token) as { result: string } | undefined
    return row === undefined ? undefined : commitReceiptSchema.parse(JSON.parse(row.result))
  }
  function readBaseline(topicIds: readonly string[]): LibraryBaseline {
    const revision = z
      .number()
      .int()
      .nonnegative()
      .parse((revisionQuery.get() as { revision?: number } | undefined)?.revision)
    return {
      revision,
      topics: topicIds.flatMap((topicId) => {
        const topic = topicQuery.get(topicId) as TopicRow | undefined
        if (topic === undefined) return []
        const questions = (questionQuery.all(topicId) as QuestionRow[]).map((question) => {
          if (question.contentHash === null) throw new Error('题目缺少当前版本，停止导入。')
          return {
            ...question,
            tags: z.array(z.string()).parse(JSON.parse(question.tags)),
            difficulty: questionDifficultySchema.or(z.literal('未分级')).parse(question.difficulty),
            archived: question.archived === 1,
            contentHash: question.contentHash,
          }
        })
        return [{ ...topic, questions }]
      }),
    }
  }
  const identityQuery = database.prepare(
    'SELECT id, current_version_id AS currentVersionId FROM questions WHERE topic_id = ? AND question_id = ?',
  )
  const insertTopic =
    database.prepare(`INSERT INTO topics (topic_id, title, source_name) VALUES (?, ?, ?)
    ON CONFLICT(topic_id) DO UPDATE SET title = excluded.title, source_name = excluded.source_name`)
  const insertQuestion = database.prepare(`INSERT INTO questions
    (topic_id, question_id, title, tags_json, difficulty, position, archived) VALUES (?, ?, ?, ?, ?, ?, 0)`)
  const updateQuestion =
    database.prepare(`UPDATE questions SET title = ?, tags_json = ?, difficulty = ?,
    position = ?, archived = 0, current_version_id = ? WHERE id = ?`)
  const insertState = database.prepare('INSERT INTO question_user_state (question_id) VALUES (?)')
  const sequenceQuery = database.prepare(
    'SELECT COALESCE(MAX(sequence), 0) + 1 AS sequence FROM question_versions WHERE question_id = ?',
  )
  const insertVersion = database.prepare(`INSERT INTO question_versions
    (question_id, sequence, title, question_markdown, answer_markdown, definitions_json, image_bindings_json, content_hash, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  const insertImage = database.prepare(
    'INSERT INTO image_resources VALUES (?, ?, ?, ?, ?) ON CONFLICT(hash) DO NOTHING',
  )
  const insertReference = database.prepare('INSERT INTO version_images VALUES (?, ?)')
  const archiveQuestion = database.prepare(
    'UPDATE questions SET archived = 1 WHERE topic_id = ? AND question_id = ?',
  )
  const bumpRevision = database.prepare(
    'UPDATE library_meta SET revision = revision + 1 WHERE id = 1',
  )
  const insertReceipt = database.prepare('INSERT INTO import_receipts VALUES (?, ?, ?)')

  const commit = database.transaction(
    (token: string, snapshot: ImportSnapshot, expectedRevision: number) => {
      const previousReceipt = receipt(token)
      if (previousReceipt !== undefined) return previousReceipt
      const before = readBaseline(snapshot.topics.map((item) => item.topic.topicId))
      if (before.revision !== expectedRevision)
        throw new StalePreviewError('题库已变化，请重新预览。')
      const summary = compareImport(snapshot, before)
      const changed = summary.topics.some(
        (topic) => topic.metadataChanged || topic.questions.some((q) => q.kind !== 'unchanged'),
      )
      const now = new Date().toISOString()
      if (changed) {
        for (const image of snapshot.resources)
          insertImage.run(image.hash, image.format, image.width, image.height, image.bytes)
        for (const [index, incoming] of snapshot.topics.entries()) {
          const { topic } = incoming
          const changes = summary.topics[index]!.questions
          const contentChanges = new Set(
            changes.filter((q) => q.contentChanged).map((q) => q.questionId),
          )
          const bindings = new Map(
            incoming.imageBindings.map((binding) => [binding.url, binding.hash]),
          )
          const hashes = new Map(incoming.contentHashes.map((item) => [item.questionId, item.hash]))
          insertTopic.run(topic.topicId, topic.topicTitle, topic.fileName)
          for (const [position, question] of topic.questions.entries()) {
            let identity = identityQuery.get(topic.topicId, question.questionId) as
              IdentityRow | undefined
            if (identity === undefined) {
              const created = insertQuestion.run(
                topic.topicId,
                question.questionId,
                question.title,
                JSON.stringify(question.tags),
                question.difficulty,
                position,
              )
              identity = { id: Number(created.lastInsertRowid), currentVersionId: null }
              insertState.run(identity.id)
            }
            let versionId = identity.currentVersionId
            if (contentChanges.has(question.questionId)) {
              const { sequence } = sequenceQuery.get(identity.id) as { sequence: number }
              const imageBindings = [...new Set(question.images.map((image) => image.url))].map(
                (url) => {
                  const hash = bindings.get(url)
                  if (hash === undefined) throw new Error('版本缺少图片绑定，停止提交。')
                  return { url, hash }
                },
              )
              const hash = hashes.get(question.questionId)
              if (hash === undefined) throw new Error('版本缺少内容指纹，停止提交。')
              versionId = Number(
                insertVersion.run(
                  identity.id,
                  sequence,
                  question.title,
                  question.questionMarkdown,
                  question.answerMarkdown,
                  JSON.stringify(question.definitions),
                  JSON.stringify(imageBindings),
                  hash,
                  now,
                ).lastInsertRowid,
              )
              for (const resourceHash of new Set(imageBindings.map((image) => image.hash)))
                insertReference.run(versionId, resourceHash)
            }
            if (versionId === null) throw new Error('题目没有可用版本，停止提交。')
            updateQuestion.run(
              question.title,
              JSON.stringify(question.tags),
              question.difficulty,
              position,
              versionId,
              identity.id,
            )
          }
          for (const change of changes) {
            if (change.kind === 'archived') archiveQuestion.run(topic.topicId, change.questionId)
          }
        }
        bumpRevision.run()
      }
      const result = commitReceiptSchema.parse({
        revision: before.revision + (changed ? 1 : 0),
        summary,
      })
      insertReceipt.run(token, now, JSON.stringify(result))
      return result
    },
  )
  const baseline = database.transaction(readBaseline)
  return {
    baseline: (ids) => baseline.deferred(ids),
    receipt: (token) => {
      if (database.inTransaction) throw new Error('数据库事务尚未结束，不能确认持久化回执。')
      return receipt(token)
    },
    commit: (token, snapshot, revision) => commit.immediate(token, snapshot, revision),
  }
}
