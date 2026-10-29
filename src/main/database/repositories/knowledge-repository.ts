import type Database from 'better-sqlite3'
import { PAGE_SIZE, type QuestionIdentity } from '../../../shared/contracts/library-desktop'
import {
  recentSearchChangeSchema,
  recentSearchSchema,
  relationChangeSchema,
  relationListRequestSchema,
  relationPageSchema,
  relationSchema,
  type Relation,
  type RelationChange,
} from '../../../shared/contracts/knowledge'

export class KnowledgeFault extends Error {
  constructor(
    readonly code: 'NOT_FOUND' | 'CONFLICT' | 'INVALID_REQUEST',
    message: string,
  ) {
    super(message)
  }
}
export function createKnowledgeRepository(database: Database.Database) {
  const question = database
    .prepare('SELECT id FROM questions WHERE topic_id=? AND question_id=?')
    .pluck()
  const from = `FROM question_relations r JOIN questions s ON s.id=r.source_question_id
    JOIN questions t ON t.id=r.target_question_id
    JOIN topics st ON st.topic_id=s.topic_id JOIN topics tt ON tt.topic_id=t.topic_id`
  const columns = `r.relation_id AS relationId,r.kind,r.explanation,r.revision,r.updated_at AS updatedAt,
    s.topic_id AS sourceTopicId,s.question_id AS sourceQuestionId,t.topic_id AS targetTopicId,t.question_id AS targetQuestionId,
    s.title AS sourceTitle,t.title AS targetTitle,st.title AS sourceTopicTitle,tt.title AS targetTopicTitle,
    s.archived AS sourceArchived,t.archived AS targetArchived`
  const find = database.prepare(`SELECT ${columns} ${from} WHERE r.relation_id=?`)
  const count = database
    .prepare(
      'SELECT count(*) FROM question_relations WHERE source_question_id=@id OR target_question_id=@id',
    )
    .pluck()
  const list = database.prepare(`SELECT ${columns} ${from} WHERE s.id=@id OR t.id=@id
    ORDER BY r.updated_at DESC,r.relation_id LIMIT @limit OFFSET @offset`)
  const pair = database.prepare(`SELECT relation_id FROM question_relations WHERE
    min(source_question_id,target_question_id)=min(@source,@target) AND
    max(source_question_id,target_question_id)=max(@source,@target) AND kind=@kind AND relation_id<>@relationId`)
  function id(identity: QuestionIdentity) {
    const value = question.get(identity.topicId, identity.questionId)
    if (typeof value !== 'number')
      throw new KnowledgeFault('NOT_FOUND', '关联题目已失效，请重新选择。')
    return value
  }
  function item(row: Record<string, unknown>) {
    const { sourceTopicId, sourceQuestionId, targetTopicId, targetQuestionId, ...rest } = row
    return {
      ...rest,
      source: { topicId: sourceTopicId, questionId: sourceQuestionId },
      target: { topicId: targetTopicId, questionId: targetQuestionId },
      sourceArchived: Boolean(rest.sourceArchived),
      targetArchived: Boolean(rest.targetArchived),
    }
  }
  function read(relationId: string): Relation | undefined {
    const row = find.get(relationId) as Record<string, unknown> | undefined
    if (!row) return undefined
    const { source, target } = item(row)
    const { kind, explanation, revision, updatedAt } = row
    return relationSchema.parse({
      relationId,
      source,
      target,
      kind,
      explanation,
      revision,
      updatedAt,
    })
  }
  const change = database.transaction((input: RelationChange) => {
    if (input.action === 'delete') {
      const previous = read(input.expected.relationId)
      if (!previous) return null
      if (JSON.stringify(previous) !== JSON.stringify(input.expected))
        throw new KnowledgeFault(
          'CONFLICT',
          '关联已变化，请先保留本地说明，再重新读取；不能删除其他修订。',
        )
      database
        .prepare('DELETE FROM question_relations WHERE relation_id=?')
        .run(previous.relationId)
      return null
    }
    const previous = read(input.relationId)
    const content = (value: Pick<Relation, 'source' | 'target' | 'kind' | 'explanation'>) =>
      JSON.stringify([value.source, value.target, value.kind, value.explanation])
    if (
      previous &&
      content(previous) === content(input) &&
      (previous.revision === input.expectedRevision ||
        previous.revision === input.expectedRevision + 1)
    )
      return previous
    if ((previous?.revision ?? 0) !== input.expectedRevision)
      throw new KnowledgeFault(
        'CONFLICT',
        '关联已变化，请先保留本地说明，再重新读取；不能覆盖其他修订。',
      )
    const source = id(input.source),
      target = id(input.target)
    // 表上的 CHECK 只能保证写不进去；提前拒绝才能给出可理解的原因，而不是冒泡成写入失败。
    if (source === target) throw new KnowledgeFault('INVALID_REQUEST', '不能把题目关联到自身。')
    if (pair.get({ source, target, kind: input.kind, relationId: input.relationId }))
      throw new KnowledgeFault(
        'INVALID_REQUEST',
        '这两题已存在相同类型的关联，请在任一题的关联列表中编辑原记录。',
      )
    const revision = input.expectedRevision + 1,
      updatedAt = new Date().toISOString()
    if (previous)
      database
        .prepare(
          'UPDATE question_relations SET source_question_id=?,target_question_id=?,kind=?,explanation=?,revision=?,updated_at=? WHERE relation_id=?',
        )
        .run(source, target, input.kind, input.explanation, revision, updatedAt, input.relationId)
    else
      database
        .prepare('INSERT INTO question_relations VALUES(?,?,?,?,?,?,?)')
        .run(input.relationId, source, target, input.kind, input.explanation, revision, updatedAt)
    return relationSchema.parse(read(input.relationId))
  })
  const page = database.transaction((input: zRelationList) => {
    const questionId = id(input.identity),
      total = count.get({ id: questionId }) as number
    const current = Math.min(input.page, Math.max(1, Math.ceil(total / PAGE_SIZE)))
    return relationPageSchema.parse({
      page: current,
      pageSize: PAGE_SIZE,
      total,
      items: (
        list.all({ id: questionId, limit: PAGE_SIZE, offset: (current - 1) * PAGE_SIZE }) as Record<
          string,
          unknown
        >[]
      ).map(item),
    })
  })
  const changeRecent = database.transaction(
    (input: ReturnType<typeof recentSearchChangeSchema.parse>) => {
      if (input.kind === 'clear') database.prepare('DELETE FROM recent_knowledge_searches').run()
      else {
        database
          .prepare(
            'INSERT OR REPLACE INTO recent_knowledge_searches(query,searched_at) VALUES(?,?)',
          )
          .run(input.query, new Date().toISOString())
        database
          .prepare(
            'DELETE FROM recent_knowledge_searches WHERE query NOT IN (SELECT query FROM recent_knowledge_searches ORDER BY rowid DESC LIMIT 10)',
          )
          .run()
      }
    },
  )
  type zRelationList = ReturnType<typeof relationListRequestSchema.parse>
  return {
    listRelations(input: zRelationList) {
      return page.deferred(relationListRequestSchema.parse(input))
    },
    changeRelation(input: RelationChange) {
      if (database.inTransaction) throw new Error('关联写入不接受外层事务。')
      return change.immediate(relationChangeSchema.parse(input))
    },
    recentKnowledgeSearches() {
      return database
        .prepare(
          'SELECT query,searched_at AS searchedAt FROM recent_knowledge_searches ORDER BY rowid DESC LIMIT 10',
        )
        .all()
        .map((row) => recentSearchSchema.parse(row))
    },
    changeKnowledgeRecent(input: ReturnType<typeof recentSearchChangeSchema.parse>) {
      changeRecent.immediate(recentSearchChangeSchema.parse(input))
    },
  }
}
