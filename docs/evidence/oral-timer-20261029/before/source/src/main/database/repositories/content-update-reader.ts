import type Database from 'better-sqlite3'
import {
  contentComparisonRequestSchema,
  contentComparisonSchema,
  contentVersionsRequestSchema,
  contentVersionsSchema,
  type ContentVersion,
} from '../../../shared/contracts/content-updates'
import { PAGE_SIZE } from '../../../shared/contracts/library-desktop'
import { StudyFault } from './study-fault'

interface TargetRow extends ContentVersion {
  internalId: number
}
interface BodyRow extends ContentVersion {
  markdown: string
  definitions: string
  imageBindings: string
}
const metadata = ({ versionId, sequence, createdAt }: ContentVersion) => ({
  versionId,
  sequence,
  createdAt,
})

export function createContentUpdateReader(database: Database.Database) {
  const targetQuery = database.prepare(`SELECT q.id AS internalId,v.id AS versionId,
    v.sequence,v.created_at AS createdAt FROM questions q
    JOIN question_versions v ON v.id=q.current_version_id AND v.question_id=q.id
    WHERE q.topic_id=@topicId AND q.question_id=@questionId AND v.id=@versionId`)
  const count = database
    .prepare('SELECT count(*) FROM question_versions WHERE question_id=? AND sequence<?')
    .pluck()
  const versions = database.prepare(`SELECT id AS versionId,sequence,created_at AS createdAt
    FROM question_versions WHERE question_id=@internalId AND sequence<@sequence
    ORDER BY sequence DESC LIMIT @limit OFFSET @offset`)
  const content = database.prepare(`SELECT id AS versionId,sequence,created_at AS createdAt,
    CASE WHEN @part='question' THEN question_markdown ELSE answer_markdown END AS markdown,
    definitions_json AS definitions,image_bindings_json AS imageBindings
    FROM question_versions WHERE question_id=@internalId AND id=@versionId`)
  function target(input: { topicId: string; questionId: string; versionId: number }) {
    const row = targetQuery.get({
      topicId: input.topicId,
      questionId: input.questionId,
      versionId: input.versionId,
    }) as TargetRow | undefined
    if (!row)
      throw new StudyFault('NOT_FOUND', '题目内容已变化或不存在，请刷新题库后重新查看差异。')
    return row
  }
  const list = database.transaction((input: unknown) => {
    const request = contentVersionsRequestSchema.parse(input)
    const current = target(request)
    const total = count.get(current.internalId, current.sequence) as number
    const page = Math.min(request.page, Math.max(1, Math.ceil(total / PAGE_SIZE)))
    return contentVersionsSchema.parse({
      topicId: request.topicId,
      questionId: request.questionId,
      target: metadata(current),
      page,
      pageSize: PAGE_SIZE,
      total,
      versions: versions.all({
        internalId: current.internalId,
        sequence: current.sequence,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
    })
  })
  const compare = database.transaction((input: unknown) => {
    const request = contentComparisonRequestSchema.parse(input)
    const current = target({
      topicId: request.topicId,
      questionId: request.questionId,
      versionId: request.versionId,
    })
    const previous = content.get({
      internalId: current.internalId,
      versionId: request.previousVersionId,
      part: request.part,
    }) as BodyRow | undefined
    if (!previous || previous.sequence >= current.sequence)
      throw new StudyFault('NOT_FOUND', '所选旧版本不属于此题或不是更早版本，请重新选择。')
    const latest = content.get({
      internalId: current.internalId,
      versionId: current.versionId,
      part: request.part,
    }) as BodyRow | undefined
    if (!latest) throw new Error('目标内容版本缺失。')
    const body = (row: BodyRow) => ({
      ...metadata(row),
      body: {
        markdown: row.markdown,
        definitions: JSON.parse(row.definitions),
        imageBindings: JSON.parse(row.imageBindings),
      },
    })
    return contentComparisonSchema.parse({
      topicId: request.topicId,
      questionId: request.questionId,
      part: request.part,
      previous: body(previous),
      current: body(latest),
    })
  })
  return {
    listContentVersions: (input: unknown) => list.deferred(input),
    compareContentVersions: (input: unknown) => compare.deferred(input),
  }
}
