import type Database from 'better-sqlite3'
import { createActivityWriter } from './activity-writer'
import { PAGE_SIZE, type QuestionIdentity } from '../../../shared/contracts/library-desktop'
import {
  localDateString,
  reviewListRequestSchema,
  reviewPageSchema,
  reviewTodoSchema,
  saveReviewSchema,
  type ReviewListRequest,
  type ReviewTodo,
  type SaveReview,
} from '../../../shared/contracts/review-todos'

export class ReviewFault extends Error {
  constructor(
    readonly code: 'NOT_FOUND' | 'CONFLICT' | 'INVALID_REQUEST',
    message: string,
  ) {
    super(message)
  }
}
export function createReviewRepository(database: Database.Database) {
  const recordActivity = createActivityWriter(database)
  const question = database
    .prepare('SELECT id FROM questions WHERE topic_id=? AND question_id=?')
    .pluck()
  const columns = `q.topic_id AS topicId,q.question_id AS questionId,r.revision,r.state,
    r.due_date AS dueDate,r.reason,r.updated_at AS updatedAt,r.completed_at AS completedAt`
  const find = database.prepare(
    `SELECT ${columns} FROM review_todos r JOIN questions q ON q.id=r.question_id WHERE q.id=?`,
  )
  const insert = database.prepare(
    'INSERT INTO review_todos(question_id,revision,state,due_date,reason,updated_at,completed_at) VALUES(?,?,?,?,?,?,?)',
  )
  const update = database.prepare(
    'UPDATE review_todos SET revision=?,state=?,due_date=?,reason=?,updated_at=?,completed_at=? WHERE question_id=?',
  )
  const from = `FROM review_todos r JOIN questions q ON q.id=r.question_id JOIN topics t ON t.topic_id=q.topic_id`
  const where = `(@state='all' OR r.state=@state) AND (@due='all' OR (@due='due' AND r.due_date<=@today)
    OR (@due='undated' AND r.due_date IS NULL))`
  const count = database.prepare(`SELECT count(*) ${from} WHERE ${where}`).pluck()
  const list =
    database.prepare(`SELECT ${columns},q.title,t.title AS topicTitle,q.archived ${from} WHERE ${where}
    ORDER BY (r.state='pending') DESC,CASE WHEN r.state='done' THEN r.completed_at END DESC,
    (r.due_date IS NULL),r.due_date,t.title,q.position,q.id LIMIT @limit OFFSET @offset`)
  function questionId(identity: QuestionIdentity): number {
    const id = question.get(identity.topicId, identity.questionId)
    if (typeof id !== 'number')
      throw new ReviewFault('NOT_FOUND', '题目已失效，无法读取或保存复习安排。')
    return id
  }
  const read = (id: number): ReviewTodo | null => {
    const row = find.get(id)
    return row ? reviewTodoSchema.parse(row) : null
  }
  const save = database.transaction((input: SaveReview) => {
    const id = questionId(input)
    const previous = read(id)
    const same =
      previous &&
      previous.state === input.state &&
      previous.dueDate === input.dueDate &&
      previous.reason === input.reason
    if (
      same &&
      (previous.revision === input.expectedRevision ||
        previous.revision === input.expectedRevision + 1)
    )
      return previous
    if ((previous?.revision ?? 0) !== input.expectedRevision)
      throw new ReviewFault(
        'CONFLICT',
        '复习安排已变化，请先保存或重新读取实际安排，不能覆盖旧修订。',
      )
    if (!previous && input.state === 'done')
      throw new ReviewFault('INVALID_REQUEST', '此题尚未加入待复习，请先安排后再完成。')
    const now = new Date().toISOString()
    const completedAt = input.state === 'done' ? (previous?.completedAt ?? now) : null
    const revision = input.expectedRevision + 1
    if (previous)
      update.run(revision, input.state, input.dueDate, input.reason, now, completedAt, id)
    else insert.run(id, revision, input.state, input.dueDate, input.reason, now, completedAt)
    if (input.state === 'done' && previous?.state === 'pending')
      recordActivity(`review:${id}:${revision}`, 'review', id, now)
    return reviewTodoSchema.parse(find.get(id))
  })
  const page = database.transaction((request: ReviewListRequest) => {
    const parameters = { ...request, today: localDateString() }
    const total = count.get(parameters) as number
    const current = Math.min(request.page, Math.max(1, Math.ceil(total / PAGE_SIZE)))
    const rows = list.all({
      ...parameters,
      limit: PAGE_SIZE,
      offset: (current - 1) * PAGE_SIZE,
    }) as (Record<string, unknown> & { archived: number })[]
    return reviewPageSchema.parse({
      page: current,
      pageSize: PAGE_SIZE,
      total,
      items: rows.map((row) => ({ ...row, archived: Boolean(row.archived) })),
    })
  })
  return {
    readReview(identity: QuestionIdentity) {
      return read(questionId(identity))
    },
    saveReview(input: SaveReview) {
      if (database.inTransaction) throw new Error('复习安排写入不接受外层事务。')
      return save.immediate(saveReviewSchema.parse(input))
    },
    listReviews(input: ReviewListRequest) {
      return page.deferred(reviewListRequestSchema.parse(input))
    },
  }
}
