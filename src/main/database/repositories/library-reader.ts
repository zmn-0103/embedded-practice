import type Database from 'better-sqlite3'
import {
  contentBodySchema,
  libraryPageSchema,
  PAGE_SIZE,
  questionDetailSchema,
  type ListRequest,
  type QuestionIdentity,
  type VersionIdentity,
} from '../../../shared/contracts/library-desktop'
import { MAX_IMAGE_BYTES } from '../../../shared/contracts/import-snapshot'
import {
  categorySelectionParameters,
  categorySelectionWhere,
  currentRatingSql,
  practicedSql,
  questionOrderSql,
  questionSelectionFrom,
  questionSelectionParameters,
  questionSelectionWhere,
} from './question-selection'
import { createTopicNavigationReader } from './topic-navigation'

interface ContentRow {
  markdown: string
  definitions: string
  imageBindings: string
}
interface InfoRow {
  topicId: string
  questionId: string
  versionId: number
  title: string
  topicTitle: string
  tags: string
  difficulty: string
  archived: number
  favorite: number
  practiced: number
  contentUpdated: number
  currentRating: string | null
}

export function createLibraryReader(database: Database.Database) {
  const navigation = createTopicNavigationReader(database)
  // 与列表原有更新标记使用同一当前版本口径；只影响浏览，不改变建轮条件。
  const listWhere = `${questionSelectionWhere}
    AND (@contentUpdatedOnly = 0 OR (v.sequence > 1 AND (${practicedSql}) = 0))`
  const total = database.prepare(`SELECT count(*) AS total ${questionSelectionFrom}
    WHERE ${listWhere}`)
  const infoColumns = `q.topic_id AS topicId, q.question_id AS questionId, q.current_version_id AS versionId,
    q.title, t.title AS topicTitle, q.tags_json AS tags, q.difficulty, q.archived,
    COALESCE(s.favorite, 0) AS favorite, ${practicedSql} AS practiced,
    ${currentRatingSql} AS currentRating,
    CASE WHEN v.sequence > 1 AND (${practicedSql}) = 0 THEN 1 ELSE 0 END AS contentUpdated`
  const pageQuery = database.prepare(`SELECT ${infoColumns} ${questionSelectionFrom}
    WHERE ${listWhere} ORDER BY ${questionOrderSql} LIMIT @limit OFFSET @offset`)
  const detailQuery = database.prepare(`SELECT ${infoColumns}, v.question_markdown AS markdown,
    v.definitions_json AS definitions, v.image_bindings_json AS imageBindings ${questionSelectionFrom}
    WHERE q.topic_id = ? AND q.question_id = ?`)
  const answerQuery =
    database.prepare(`SELECT v.answer_markdown AS markdown, v.definitions_json AS definitions,
    v.image_bindings_json AS imageBindings FROM question_versions v JOIN questions q ON q.id = v.question_id
    WHERE q.topic_id = ? AND q.question_id = ? AND v.id = ?`)
  const imageQuery =
    database.prepare(`SELECT r.format, r.bytes FROM image_resources r WHERE r.hash = ?
    AND EXISTS (SELECT 1 FROM version_images vi WHERE vi.version_id = ? AND vi.resource_hash = r.hash)`)
  const revision = database.prepare('SELECT revision FROM library_meta WHERE id = 1')
  const tagQuery = database.prepare(`SELECT DISTINCT tag.value AS tag
    FROM questions q JOIN topics t ON t.topic_id = q.topic_id, json_each(q.tags_json) tag
    WHERE q.archived = @archived AND (@topicId IS NULL OR q.topic_id = @topicId)
    AND ${categorySelectionWhere}
    ORDER BY tag.value`)
  let tagCache: { revision: number; scope: string; tags: string[] } | undefined
  function info(row: InfoRow) {
    return {
      topicId: row.topicId,
      questionId: row.questionId,
      versionId: row.versionId,
      title: row.title,
      topicTitle: row.topicTitle,
      tags: JSON.parse(row.tags) as unknown,
      difficulty: row.difficulty,
      archived: row.archived === 1,
      favorite: row.favorite === 1,
      practiced: row.practiced === 1,
      contentUpdated: row.contentUpdated === 1,
      currentRating: row.currentRating,
    }
  }
  function body(row: ContentRow) {
    return contentBodySchema.parse({
      markdown: row.markdown,
      definitions: JSON.parse(row.definitions),
      imageBindings: JSON.parse(row.imageBindings),
    })
  }
  const list = database.transaction((request: ListRequest) => {
    const parameters = {
      ...questionSelectionParameters(request),
      contentUpdatedOnly: Number(request.contentUpdatedOnly ?? false),
    }
    const currentRevision = (revision.get() as { revision: number }).revision
    const tagScope = JSON.stringify([
      request.category ?? { kind: 'all' },
      request.topicId,
      request.archived,
    ])
    if (tagCache?.revision !== currentRevision || tagCache.scope !== tagScope) {
      tagCache = {
        revision: currentRevision,
        scope: tagScope,
        tags: (
          tagQuery.all({
            ...categorySelectionParameters(request.category),
            topicId: request.topicId,
            archived: parameters.archived,
          }) as {
            tag: string
          }[]
        ).map((row) => row.tag),
      }
    }
    const count = (total.get(parameters) as { total: number }).total
    const page = Math.min(request.page, Math.max(1, Math.ceil(count / PAGE_SIZE)))
    const rows = pageQuery.all({
      ...parameters,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }) as InfoRow[]
    return libraryPageSchema.parse({
      revision: currentRevision,
      total: count,
      page,
      pageSize: PAGE_SIZE,
      tagOptions: tagCache.tags,
      ...navigation(),
      questions: rows.map(info),
    })
  })
  return {
    listQuestions: (request: ListRequest) => list.deferred(request),
    getQuestion(identity: QuestionIdentity) {
      const row = detailQuery.get(identity.topicId, identity.questionId) as
        (InfoRow & ContentRow) | undefined
      return row === undefined
        ? undefined
        : questionDetailSchema.parse({
            ...info(row),
            body: body(row),
          })
    },
    getAnswer(identity: VersionIdentity) {
      const row = answerQuery.get(identity.topicId, identity.questionId, identity.versionId) as
        ContentRow | undefined
      return row === undefined ? undefined : body(row)
    },
    readImage(versionId: number, hash: string) {
      const row = imageQuery.get(hash, versionId) as { format: string; bytes: Buffer } | undefined
      if (row === undefined) return undefined
      if (
        !['png', 'jpeg', 'webp'].includes(row.format) ||
        row.bytes.byteLength < 1 ||
        row.bytes.byteLength > MAX_IMAGE_BYTES
      )
        throw new Error('数据库图片类型或大小无效。')
      return { mime: `image/${row.format}`, bytes: new Uint8Array(row.bytes) }
    },
  }
}
