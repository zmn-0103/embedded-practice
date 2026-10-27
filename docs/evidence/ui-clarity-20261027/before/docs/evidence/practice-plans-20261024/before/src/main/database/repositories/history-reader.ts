import type Database from 'better-sqlite3'
import { contentBodySchema, PAGE_SIZE } from '../../../shared/contracts/library-desktop'
import {
  historyEntrySchema,
  historyPageSchema,
  historySummarySchema,
  type HistoryEntryRequest,
  type HistoryListRequest,
  type HistorySummary,
} from '../../../shared/contracts/history'

type SummaryRow = Omit<HistorySummary, 'isCurrentVersion' | 'hasDraft'> & {
  isCurrentVersion: number
  hasDraft: number
}
interface EntryRow extends SummaryRow {
  markdown: string
  definitions: string
  imageBindings: string
  draft: string
  draftRevision: number
  answer: string | null
}

export function createHistoryReader(database: Database.Database) {
  const identityQuery = database.prepare(`SELECT current_version_id AS currentVersionId, archived
    FROM questions WHERE topic_id = ? AND question_id = ?`)
  const from = `FROM practice_items i JOIN practice_sessions s ON s.id = i.session_id
    JOIN questions q ON q.id = i.question_id
    JOIN question_versions v ON v.id = i.version_id AND v.question_id = q.id`
  const where = `q.topic_id = @topicId AND q.question_id = @questionId
    AND (i.draft_revision > 0 OR i.revealed_at IS NOT NULL OR i.skipped_at IS NOT NULL)`
  const summaryColumns = `i.session_id AS sessionId, i.position, i.version_id AS versionId,
    v.sequence AS versionSequence, CASE WHEN i.version_id = q.current_version_id THEN 1 ELSE 0 END AS isCurrentVersion,
    i.title, i.topic_title AS topicTitle, s.mode, s.status AS sessionStatus,
    s.created_at AS createdAt, s.ended_at AS endedAt, i.revealed_at AS revealedAt,
    i.rating, i.rated_at AS ratedAt, i.skipped_at AS skippedAt,
    CASE WHEN length(CAST(i.draft AS BLOB)) > 0 THEN 1 ELSE 0 END AS hasDraft`
  const countQuery = database.prepare(`SELECT count(*) AS total ${from} WHERE ${where}
    AND (@excludeSessionId IS NULL OR i.session_id != @excludeSessionId)`)
  const listQuery = database.prepare(`SELECT ${summaryColumns} ${from} WHERE ${where}
    AND (@excludeSessionId IS NULL OR i.session_id != @excludeSessionId)
    ORDER BY s.created_at DESC, s.rowid DESC, i.position LIMIT @limit OFFSET @offset`)
  const entryQuery = database.prepare(`SELECT ${summaryColumns}, i.draft,
    i.draft_revision AS draftRevision, v.question_markdown AS markdown,
    v.definitions_json AS definitions, v.image_bindings_json AS imageBindings,
    CASE WHEN i.revealed_at IS NOT NULL THEN v.answer_markdown ELSE NULL END AS answer
    ${from} WHERE ${where} AND i.session_id = @sessionId AND i.position = @position`)
  function summary(row: SummaryRow): HistorySummary {
    return historySummarySchema.parse({
      sessionId: row.sessionId,
      position: row.position,
      versionId: row.versionId,
      versionSequence: row.versionSequence,
      isCurrentVersion: row.isCurrentVersion === 1,
      title: row.title,
      topicTitle: row.topicTitle,
      mode: row.mode,
      sessionStatus: row.sessionStatus,
      createdAt: row.createdAt,
      endedAt: row.endedAt,
      revealedAt: row.revealedAt,
      rating: row.rating,
      ratedAt: row.ratedAt,
      skippedAt: row.skippedAt,
      hasDraft: row.hasDraft === 1,
    })
  }
  const list = database.transaction((request: HistoryListRequest) => {
    const identity = identityQuery.get(request.topicId, request.questionId) as
      { currentVersionId: number; archived: number } | undefined
    if (!identity) return undefined
    const parameters = {
      topicId: request.topicId,
      questionId: request.questionId,
      excludeSessionId: request.excludeSessionId ?? null,
    }
    const { total } = countQuery.get(parameters) as { total: number }
    const page = Math.min(request.page, Math.max(1, Math.ceil(total / PAGE_SIZE)))
    const rows = listQuery.all({
      ...parameters,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }) as SummaryRow[]
    return historyPageSchema.parse({
      topicId: request.topicId,
      questionId: request.questionId,
      currentVersionId: identity.currentVersionId,
      archived: identity.archived === 1,
      total,
      page,
      pageSize: PAGE_SIZE,
      entries: rows.map(summary),
    })
  })
  return {
    listHistory: (request: HistoryListRequest) => list.deferred(request),
    getHistoryEntry(request: HistoryEntryRequest) {
      const row = entryQuery.get(request) as EntryRow | undefined
      if (!row) return undefined
      const body = contentBodySchema.parse({
        markdown: row.markdown,
        definitions: JSON.parse(row.definitions),
        imageBindings: JSON.parse(row.imageBindings),
      })
      return historyEntrySchema.parse({
        ...summary(row),
        body,
        draft: { revision: row.draftRevision, text: row.draft },
        ...(row.answer === null ? {} : { answer: { ...body, markdown: row.answer } }),
      })
    },
  }
}
