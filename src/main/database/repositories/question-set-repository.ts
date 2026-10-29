import type Database from 'better-sqlite3'
import {
  MAX_QUESTION_SETS,
  MAX_QUESTION_SET_ITEMS,
  questionIdentityKey,
  questionSetChangeSchema,
  questionSetPreviewRequestSchema,
  questionSetPreviewSchema,
  questionSetSchema,
  questionSetSummarySchema,
  type QuestionSet,
  type QuestionSetChange,
} from '../../../shared/contracts/question-sets'
import type { QuestionIdentity } from '../../../shared/contracts/library-desktop'
import { contentUpdatedSql, questionSelectionFrom } from './question-selection'

export class QuestionSetFault extends Error {
  constructor(
    readonly code: 'INVALID_REQUEST' | 'NOT_FOUND',
    message: string,
  ) {
    super(message)
  }
}

export function createQuestionSetRepository(database: Database.Database) {
  const names =
    database.prepare(`SELECT s.set_id AS setId,s.name,count(i.position) AS count,s.pinned,s.last_used_at AS lastUsedAt
    FROM question_sets s LEFT JOIN question_set_items i ON i.set_id=s.set_id
    GROUP BY s.set_id ORDER BY s.pinned DESC,s.last_used_at DESC,s.name COLLATE NOCASE,s.set_id LIMIT ${MAX_QUESTION_SETS + 1}`)
  const pin = database.prepare('UPDATE question_sets SET pinned=? WHERE set_id=?')
  const find = database.prepare('SELECT name FROM question_sets WHERE set_id=?')
  const members = database.prepare(`SELECT position,topic_id AS topicId,question_id AS questionId
    FROM question_set_items WHERE set_id=? ORDER BY position LIMIT ${MAX_QUESTION_SET_ITEMS + 1}`)
  const question = database.prepare(`SELECT q.current_version_id AS versionId,q.title,
    t.title AS topicTitle,q.archived,CASE WHEN @contentUpdatedOnly=0 THEN 0
    WHEN ${contentUpdatedSql} THEN 1 ELSE 0 END AS contentUpdated ${questionSelectionFrom}
    WHERE q.topic_id=@topicId AND q.question_id=@questionId`)
  const findName = database.prepare('SELECT 1 FROM question_sets WHERE name=? AND set_id<>?')
  const count = database.prepare('SELECT count(*) FROM question_sets').pluck()
  const insert = database.prepare('INSERT INTO question_sets(set_id,name) VALUES(?,?)')
  const update = database.prepare('UPDATE question_sets SET name=? WHERE set_id=?')
  const remove = database.prepare('DELETE FROM question_sets WHERE set_id=?')
  const clear = database.prepare('DELETE FROM question_set_items WHERE set_id=?')
  const add = database.prepare('INSERT INTO question_set_items VALUES(?,?,?,?)')

  function definition(setId: string): QuestionSet {
    const row = find.get(setId) as { name: string } | undefined
    if (!row) throw new QuestionSetFault('NOT_FOUND', '题单已不存在，请重新读取题单。')
    const rows = members.all(setId) as (QuestionIdentity & { position: number })[]
    if (rows.some((item, index) => item.position !== index)) throw new Error('题单顺序损坏。')
    return questionSetSchema.parse({
      setId,
      name: row.name,
      items: rows.map(({ topicId, questionId }) => ({ topicId, questionId })),
    })
  }
  function resolve(item: QuestionIdentity, contentUpdatedOnly = false) {
    const row = question.get({ ...item, contentUpdatedOnly: Number(contentUpdatedOnly) }) as
      | {
          versionId: number
          title: string
          topicTitle: string
          archived: number
          contentUpdated: number
        }
      | undefined
    if (!row)
      return { ...item, status: 'missing' as const, title: null, topicTitle: null, versionId: null }
    return {
      ...item,
      versionId: row.versionId,
      title: row.title,
      topicTitle: row.topicTitle,
      status: row.archived
        ? ('archived' as const)
        : contentUpdatedOnly && row.contentUpdated !== 1
          ? ('not-pending' as const)
          : ('available' as const),
    }
  }
  const readDefinition = database.transaction(definition)
  const preview = database.transaction((input: unknown) => {
    const parsed = questionSetPreviewRequestSchema.parse(input)
    const saved = 'setId' in parsed ? definition(parsed.setId) : null
    const items = saved ? saved.items : 'items' in parsed ? parsed.items : []
    return questionSetPreviewSchema.parse({
      definition: saved,
      items: items.map((item) => resolve(item, parsed.contentUpdatedOnly)),
    })
  })
  const change = database.transaction((input: QuestionSetChange) => {
    if (input.kind === 'pin') {
      if (!pin.run(Number(input.pinned), input.setId).changes)
        throw new QuestionSetFault('NOT_FOUND', '题单已删除，请重新读取。')
      return
    }
    if (input.kind === 'delete') {
      remove.run(input.setId)
      return
    }
    const previous = find.get(input.setId) ? definition(input.setId) : undefined
    const equal =
      previous?.name === input.name &&
      JSON.stringify(previous.items) === JSON.stringify(input.items)
    if (equal) return
    if (input.kind === 'update') {
      if (!previous) throw new QuestionSetFault('NOT_FOUND', '题单已删除，不能覆盖为新题单。')
      if (
        previous.name !== input.expected.name ||
        JSON.stringify(previous.items) !== JSON.stringify(input.expected.items)
      )
        throw new QuestionSetFault('INVALID_REQUEST', '题单已经变化，请重新载入后再更新。')
    } else if (previous)
      throw new QuestionSetFault('INVALID_REQUEST', '题单ID已存在，不能覆盖不同内容。')
    if (findName.get(input.name, input.setId))
      throw new QuestionSetFault('INVALID_REQUEST', '题单名称已存在，请使用其他名称。')
    if (input.kind === 'save' && (count.get() as number) >= MAX_QUESTION_SETS)
      throw new QuestionSetFault('INVALID_REQUEST', `最多保存${MAX_QUESTION_SETS}份题单。`)
    const retained = new Set(previous?.items.map(questionIdentityKey))
    for (const item of input.items)
      if (!retained.has(questionIdentityKey(item)) && resolve(item).status !== 'available')
        throw new QuestionSetFault('NOT_FOUND', '新加入的题目已归档或失效，请重新预览勾选题目。')
    if (input.kind === 'save') insert.run(input.setId, input.name)
    else {
      update.run(input.name, input.setId)
      clear.run(input.setId)
    }
    input.items.forEach((item, position) =>
      add.run(input.setId, position, item.topicId, item.questionId),
    )
  })
  return {
    listQuestionSets() {
      const rows = names.all()
      if (rows.length > MAX_QUESTION_SETS) throw new Error('题单数量超出支持范围。')
      return rows.map((row) => {
        const item = row as {
          setId: string
          name: string
          count: number
          pinned: number
          lastUsedAt: string | null
        }
        return questionSetSummarySchema.parse({ ...item, pinned: Boolean(item.pinned) })
      })
    },
    readQuestionSet(setId: string) {
      return readDefinition.deferred(setId)
    },
    previewQuestionSet(input: unknown) {
      return preview.deferred(input)
    },
    changeQuestionSet(input: QuestionSetChange) {
      if (database.inTransaction) throw new Error('题单写入不接受外层事务。')
      change.immediate(questionSetChangeSchema.parse(input))
    },
  }
}
