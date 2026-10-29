import type Database from 'better-sqlite3'
import { contentBodySchema, PAGE_SIZE } from '../../../shared/contracts/library-desktop'
import {
  closedRoundSchema,
  roundEntrySchema,
  roundItemSchema,
  roundListRequestSchema,
  roundListSchema,
  roundPageSchema,
  roundRequestSchema,
  roundEntryRequestSchema,
  type RoundList,
  type RoundEntry,
} from '../../../shared/contracts/study'
import { StudyFault } from './study-fault'

type ItemRow = Omit<RoundEntry, 'body' | 'draft' | 'answer' | 'isCurrentVersion' | 'hasDraft'> & {
  isCurrentVersion: number
  hasDraft: number
}
type EntryRow = ItemRow & {
  markdown: string
  definitions: string
  imageBindings: string
  text: string
  draftRevision: number
  answerText: string | null
}
export function createRoundReader(database: Database.Database) {
  const from = `FROM practice_items i JOIN practice_sessions s ON s.id=i.session_id
    JOIN questions q ON q.id=i.question_id JOIN question_versions v ON v.id=i.version_id AND v.question_id=q.id`
  const columns = `i.session_id AS sessionId,i.position,q.topic_id AS topicId,q.question_id AS questionId,
    i.version_id AS versionId,v.sequence AS versionSequence,i.version_id=q.current_version_id AS isCurrentVersion,
    i.title,i.topic_title AS topicTitle,s.mode,s.status AS sessionStatus,s.created_at AS createdAt,
    s.ended_at AS endedAt,i.revealed_at AS revealedAt,i.rating,i.rated_at AS ratedAt,i.skipped_at AS skippedAt,
    length(CAST(i.draft AS BLOB))>0 AS hasDraft`
  const summaryQuery = database.prepare(`SELECT s.*,
    (SELECT count(*) FROM practice_items WHERE session_id=s.id) AS total,
    (SELECT count(*) FROM practice_items WHERE session_id=s.id AND revealed_at IS NOT NULL) AS revealed,
    (SELECT count(*) FROM practice_items WHERE session_id=s.id AND rating IS NOT NULL) AS rated,
    (SELECT count(*) FROM practice_items WHERE session_id=s.id AND revealed_at IS NOT NULL AND rating IS NULL) AS unrated,
    (SELECT count(*) FROM practice_items WHERE session_id=s.id AND skipped_at IS NOT NULL AND revealed_at IS NULL) AS skipped,
    (SELECT count(*) FROM practice_items WHERE session_id=s.id AND rating='不会') AS unknown_count,
    (SELECT count(*) FROM practice_items WHERE session_id=s.id AND rating='不熟') AS learning_count,
    (SELECT count(*) FROM practice_items WHERE session_id=s.id AND rating='掌握') AS mastered_count
    FROM practice_sessions s WHERE s.id=? AND s.status<>'active'`)
  const where = `s.status<>'active' AND (@topicId IS NULL OR EXISTS (
    SELECT 1 FROM practice_items i JOIN questions q ON q.id=i.question_id WHERE i.session_id=s.id AND q.topic_id=@topicId))`
  const count = database.prepare(`SELECT count(*) AS total FROM practice_sessions s WHERE ${where}`)
  const ids = database.prepare(`SELECT s.id FROM practice_sessions s WHERE ${where}
    ORDER BY s.created_at DESC,s.rowid DESC LIMIT ${PAGE_SIZE} OFFSET @offset`)
  const items = database.prepare(`SELECT ${columns} ${from} WHERE s.id=? AND s.status<>'active'
    ORDER BY i.position LIMIT ${PAGE_SIZE} OFFSET ?`)
  const entry =
    database.prepare(`SELECT ${columns},v.question_markdown AS markdown,v.definitions_json AS definitions,
    v.image_bindings_json AS imageBindings,i.draft AS text,i.draft_revision AS draftRevision,
    CASE WHEN i.revealed_at IS NOT NULL THEN v.answer_markdown ELSE NULL END AS answerText
    ${from} WHERE s.id=? AND i.position=? AND s.status<>'active'`)
  function summary(id: string) {
    const row = summaryQuery.get(id) as Record<string, unknown> | undefined
    if (!row) throw new StudyFault('NOT_FOUND', '该轮不存在或仍在练习中，请结束后再复盘。')
    return closedRoundSchema.parse({
      sessionId: row['id'],
      status: row['status'],
      position: row['position'],
      revision: row['revision'],
      total: row['total'],
      mode: row['mode'],
      topicId: row['topic_id'],
      category: JSON.parse(row['category_scope_json'] as string),
      filters: row['filters_json'] === null ? null : JSON.parse(row['filters_json'] as string),
      repeat:
        row['repeat_source_id'] === null
          ? null
          : { sessionId: row['repeat_source_id'], selection: row['repeat_selection'] },
      selectionName: row['selection_name'],
      createdAt: row['created_at'],
      endedAt: row['ended_at'],
      counts: {
        revealed: row['revealed'],
        rated: row['rated'],
        unrated: row['unrated'],
        skipped: row['skipped'],
        ratings: {
          不会: row['unknown_count'],
          不熟: row['learning_count'],
          掌握: row['mastered_count'],
        },
      },
    })
  }
  const metadata = (row: ItemRow) => ({
    ...row,
    isCurrentVersion: row.isCurrentVersion === 1,
    hasDraft: row.hasDraft === 1,
  })
  const list = database.transaction((input: unknown): RoundList => {
    const request = roundListRequestSchema.parse(input)
    const { total } = count.get({ topicId: request.topicId }) as { total: number }
    const page = Math.min(request.page, Math.max(1, Math.ceil(total / PAGE_SIZE)))
    const rows = ids.all({ topicId: request.topicId, offset: (page - 1) * PAGE_SIZE }) as {
      id: string
    }[]
    return roundListSchema.parse({
      ...request,
      page,
      pageSize: PAGE_SIZE,
      total,
      rounds: rows.map((row) => summary(row.id)),
    })
  })
  const read = database.transaction((input: unknown) => {
    const request = roundRequestSchema.parse(input),
      session = summary(request.sessionId)
    const page = Math.min(request.page, Math.max(1, Math.ceil(session.total / PAGE_SIZE)))
    const rows = items.all(request.sessionId, (page - 1) * PAGE_SIZE) as ItemRow[]
    return roundPageSchema.parse({
      session,
      page,
      pageSize: PAGE_SIZE,
      items: rows.map((row) => roundItemSchema.parse(metadata(row))),
    })
  })
  const detail = database.transaction((input: unknown): RoundEntry => {
    const request = roundEntryRequestSchema.parse(input)
    const row = entry.get(request.sessionId, request.position) as EntryRow | undefined
    if (!row) throw new StudyFault('NOT_FOUND', '该轮没有这道题，或该轮尚未结束。')
    const { markdown, definitions, imageBindings, text, draftRevision, answerText, ...info } = row
    const body = contentBodySchema.parse({
      markdown,
      definitions: JSON.parse(definitions),
      imageBindings: JSON.parse(imageBindings),
    })
    return roundEntrySchema.parse({
      ...metadata(info),
      body,
      draft: { revision: draftRevision, text },
      ...(answerText === null ? {} : { answer: { ...body, markdown: answerText } }),
    })
  })
  return {
    listRounds: (input: unknown) => list.deferred(input),
    readRound: (input: unknown) => read.deferred(input),
    readRoundEntry: (input: unknown) => detail.deferred(input),
  }
}
