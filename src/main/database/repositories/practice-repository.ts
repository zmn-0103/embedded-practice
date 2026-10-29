import { createHash, randomInt, randomUUID } from 'node:crypto'
import type Database from 'better-sqlite3'
import { createActivityWriter } from './activity-writer'
import {
  draftAckSchema,
  practiceAckSchema,
  practiceViewSchema,
  repeatPracticeSchema,
  PRACTICE_OUTLINE_PAGE_SIZE,
  practiceOutlineSchema,
  type Draft,
  type DraftAck,
  type NavigatePractice,
  type PracticeAck,
  type PracticeCursor,
  type PracticeError,
  type PracticeView,
  type RatePractice,
  type RepeatPractice,
  type RevealPractice,
  type SaveDraft,
  type StartPractice,
} from '../../../shared/contracts/practice'
import { contentBodySchema } from '../../../shared/contracts/library-desktop'
import { categoryScopeSchema, categorySnapshotSchema } from '../../../shared/contracts/categories'
import {
  EMPTY_QUESTION_FILTERS,
  questionFiltersSchema,
} from '../../../shared/contracts/question-filters'
import {
  questionOrderSql,
  questionSelectionFrom,
  questionSelectionParameters,
  questionSelectionWhere,
  contentUpdatedSql,
} from './question-selection'

export class PracticeFault extends Error {
  constructor(
    readonly code: PracticeError['code'],
    message: string,
  ) {
    super(message)
  }
}
interface SessionRow {
  id: string
  mode: PracticeView['session']['mode']
  topicId: string | null
  filtersJson: string | null
  categoryJson: string
  repeatSourceId: string | null
  repeatSelection: RepeatPractice['selection'] | null
  selectionName: string | null
  status: PracticeAck['status']
  position: number
  revision: number
  createdAt: string
  endedAt: string | null
  total: number
}
interface ItemRow {
  questionId: number
  versionId: number
  draft: string
  draftRevision: number
  revealedAt: string | null
  rating: RatePractice['rating']
  skippedAt: string | null
}
interface QueueRow {
  questionId: number
  versionId: number
  title: string
  topicTitle: string
  tags: string
  difficulty: string
}

export function createPracticeRepository(database: Database.Database) {
  const recordActivity = createActivityWriter(database)
  let writeBlocked = false
  const sessionQuery = database.prepare(`SELECT s.id, s.mode, s.topic_id AS topicId, s.status,
    s.position, s.revision, s.created_at AS createdAt, s.ended_at AS endedAt, s.filters_json AS filtersJson,
    s.category_scope_json AS categoryJson,
    s.repeat_source_id AS repeatSourceId, s.repeat_selection AS repeatSelection,
    s.selection_name AS selectionName,
    (SELECT count(*) FROM practice_items i WHERE i.session_id = s.id) AS total
    FROM practice_sessions s WHERE s.id = ?`)
  const activeQuery = database.prepare("SELECT id FROM practice_sessions WHERE status = 'active'")
  const categoryQuery = database.prepare('SELECT title FROM categories WHERE category_id = ?')
  const itemQuery = database.prepare(`SELECT question_id AS questionId, version_id AS versionId,
    draft, draft_revision AS draftRevision, revealed_at AS revealedAt, rating, skipped_at AS skippedAt
    FROM practice_items WHERE session_id = ? AND position = ?`)
  const receiptQuery = database.prepare(
    'SELECT payload_hash AS hash, result_json AS result FROM practice_receipts WHERE request_id = ?',
  )
  const insertReceipt = database.prepare('INSERT INTO practice_receipts VALUES (?, ?, ?, ?)')
  const updateDraft = database.prepare(
    'UPDATE practice_items SET draft = ?, draft_revision = ? WHERE session_id = ? AND position = ?',
  )
  const updateCursor = database.prepare(`UPDATE practice_sessions
    SET position = ?, revision = revision + 1, status = ?, ended_at = ? WHERE id = ?`)
  const queueSql = `SELECT q.id AS questionId, q.current_version_id AS versionId,
    q.title, t.title AS topicTitle, q.tags_json AS tags, q.difficulty
    ${questionSelectionFrom} WHERE ${questionSelectionWhere}`
  const queueQuery = database.prepare(`${queueSql} ORDER BY ${questionOrderSql} LIMIT @limit`)
  // 先对完整匹配集随机排序再限量；只在首次建轮事务内执行，继续与重试不重抽。
  const randomQueueQuery = database.prepare(`${queueSql} ORDER BY random(), q.id LIMIT @limit`)
  const selectedQuestionQuery = database.prepare(`SELECT q.id AS questionId,
    q.current_version_id AS versionId,q.title,t.title AS topicTitle,q.tags_json AS tags,q.difficulty
    ${questionSelectionFrom}
    WHERE q.topic_id=? AND q.question_id=? AND q.current_version_id=? AND q.archived=0
    AND CASE WHEN ?=0 THEN 1 WHEN ${contentUpdatedSql} THEN 1 ELSE 0 END`)
  const repeatQueueQuery = database.prepare(`SELECT question_id AS questionId,
    version_id AS versionId, title, topic_title AS topicTitle, tags_json AS tags, difficulty
    FROM practice_items WHERE session_id = @sessionId AND (
      @selection = 'all' OR (@selection = 'unknown' AND rating = '不会')
      OR (@selection = 'weak' AND rating IN ('不会', '不熟'))
      OR (@selection = 'skipped' AND skipped_at IS NOT NULL AND revealed_at IS NULL)
      OR (@selection = 'unrated' AND revealed_at IS NOT NULL AND rating IS NULL))
    ORDER BY CASE WHEN @random = 1 THEN random() ELSE position END, position`)
  const insertSession = database.prepare(`INSERT INTO practice_sessions
    (id, mode, topic_id, status, position, revision, created_at, filters_json, category_scope_json,
      repeat_source_id, repeat_selection, selection_name)
    VALUES (?, ?, ?, 'active', 0, 0, ?, ?, ?, ?, ?, ?)`)
  const insertItem = database.prepare(`INSERT INTO practice_items
    (session_id, position, question_id, version_id, title, topic_title, tags_json, difficulty)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
  const revealItem =
    database.prepare(`UPDATE practice_items SET revealed_at = COALESCE(revealed_at, ?)
    WHERE session_id = ? AND position = ?`)
  const rateItem = database.prepare(`UPDATE practice_items SET rating = ?, rated_at = ?
    WHERE session_id = ? AND position = ?`)
  const rateState =
    database.prepare(`INSERT INTO question_user_state (question_id, last_rating, last_rated_version_id)
    VALUES (?, ?, ?) ON CONFLICT(question_id) DO UPDATE
    SET last_rating = excluded.last_rating, last_rated_version_id = excluded.last_rated_version_id
    WHERE question_user_state.last_rated_version_id IS NOT
      (SELECT current_version_id FROM questions WHERE id = excluded.question_id)
    OR excluded.last_rated_version_id =
      (SELECT current_version_id FROM questions WHERE id = excluded.question_id)`)
  const skipItem = database.prepare(`UPDATE practice_items SET skipped_at = COALESCE(skipped_at, ?)
    WHERE session_id = ? AND position = ?`)
  const countsQuery = database.prepare(`SELECT
    count(revealed_at) AS revealed, count(rating) AS rated,
    count(CASE WHEN revealed_at IS NOT NULL AND rating IS NULL THEN 1 END) AS unrated,
    count(CASE WHEN skipped_at IS NOT NULL AND revealed_at IS NULL THEN 1 END) AS skipped,
    count(CASE WHEN rating = '不会' THEN 1 END) AS unknownCount,
    count(CASE WHEN rating = '不熟' THEN 1 END) AS learningCount,
    count(CASE WHEN rating = '掌握' THEN 1 END) AS masteredCount
    FROM practice_items WHERE session_id = ?`)
  const detailQuery = database.prepare(`SELECT q.topic_id AS topicId, q.question_id AS questionId,
    i.position, i.version_id AS versionId, i.title, i.topic_title AS topicTitle, i.tags_json AS tags,
    i.difficulty, v.question_markdown AS markdown, v.definitions_json AS definitions,
    v.image_bindings_json AS imageBindings FROM practice_items i
    JOIN questions q ON q.id = i.question_id JOIN question_versions v ON v.id = i.version_id
    WHERE i.session_id = ? AND i.position = ?`)
  const answerQuery = database.prepare(
    'SELECT answer_markdown AS markdown FROM question_versions WHERE id = ?',
  )
  const outlineQuery = database.prepare(`SELECT i.position,q.topic_id AS topicId,
    q.question_id AS questionId,i.title,i.topic_title AS topicTitle,
    i.revealed_at IS NOT NULL AS revealed,i.rating,i.skipped_at IS NOT NULL AS skipped
    FROM practice_items i JOIN questions q ON q.id=i.question_id
    WHERE i.session_id=? ORDER BY i.position LIMIT ${PRACTICE_OUTLINE_PAGE_SIZE} OFFSET ?`)

  function session(id: string): SessionRow {
    const row = sessionQuery.get(id) as SessionRow | undefined
    if (!row) throw new PracticeFault('SESSION_NOT_FOUND', '练习会话不存在，请重新读取当前练习。')
    return row
  }
  function item(id: string, position: number): ItemRow {
    const row = itemQuery.get(id, position) as ItemRow | undefined
    if (!row) throw new PracticeFault('SESSION_CONFLICT', '练习题目位置无效，请重新读取当前练习。')
    return row
  }
  // 缺失版本必须报错：展开 undefined 会让题干冒充参考答案。
  function answerMarkdown(versionId: number): string {
    const row = answerQuery.get(versionId) as { markdown: string } | undefined
    if (!row) throw new Error('练习队列缺少固定答案版本。')
    return row.markdown
  }
  function ack(row: SessionRow): PracticeAck {
    return practiceAckSchema.parse({
      sessionId: row.id,
      status: row.status,
      position: row.position,
      revision: row.revision,
      total: row.total,
    })
  }
  function current(cursor: PracticeCursor): SessionRow {
    const row = session(cursor.sessionId)
    if (
      row.status !== 'active' ||
      row.position !== cursor.position ||
      row.revision !== cursor.revision ||
      row.revision === Number.MAX_SAFE_INTEGER
    )
      throw new PracticeFault(
        'SESSION_CONFLICT',
        '练习位置已变化，请重新读取当前练习，勿重复切题。',
      )
    return row
  }
  function save(id: string, position: number, draft: Draft): DraftAck {
    const saved = item(id, position)
    if (draft.revision < saved.draftRevision)
      throw new PracticeFault('DRAFT_STALE', '草稿修订已过期，请读取已保存内容后重新提交。')
    if (draft.revision === saved.draftRevision && draft.text !== saved.draft)
      throw new PracticeFault(
        'DRAFT_CONFLICT',
        '相同修订包含不同草稿，请保留输入并核对已保存内容。',
      )
    if (draft.revision > saved.draftRevision)
      updateDraft.run(draft.text, draft.revision, id, position)
    return draftAckSchema.parse({ sessionId: id, position, draftRevision: draft.revision })
  }
  function ensureWritable() {
    if (writeBlocked)
      throw new PracticeFault('OUTCOME_UNKNOWN', '此前保存结果无法确认，已停止写入，请重启后核对。')
    if (database.inTransaction)
      throw new PracticeFault('WRITE_FAILED', '练习保存不接受外层事务，请在独立事务边界重试。')
  }
  function uncertain(): never {
    writeBlocked = true
    throw new PracticeFault(
      'OUTCOME_UNKNOWN',
      '保存结果无法确认，已停止写入，请重启后核对，勿假定未保存。',
    )
  }
  function receipt(requestId: string, hash: string): PracticeAck | undefined {
    const row = receiptQuery.get(requestId) as { hash: string; result: string } | undefined
    if (!row) return undefined
    if (row.hash !== hash)
      throw new PracticeFault('REQUEST_CONFLICT', '同一请求标识不能用于不同操作。')
    return practiceAckSchema.parse(JSON.parse(row.result))
  }
  function command(
    action: string,
    input: { requestId: string },
    work: () => PracticeAck,
  ): PracticeAck {
    ensureWritable()
    const hash = createHash('sha256').update(JSON.stringify({ action, input })).digest('hex')
    try {
      return database
        .transaction(() => {
          const prior = receipt(input.requestId, hash)
          if (prior) return prior
          const result = practiceAckSchema.parse(work())
          insertReceipt.run(input.requestId, hash, JSON.stringify(result), new Date().toISOString())
          return result
        })
        .immediate()
    } catch (error) {
      if (error instanceof PracticeFault) throw error
      // 先确认持久化结果；事务内可见的回执不能证明已经提交。
      let prior: PracticeAck | undefined
      try {
        if (database.inTransaction) return uncertain()
        prior = receipt(input.requestId, hash)
      } catch {
        return uncertain()
      }
      if (prior) return prior
      throw error
    }
  }
  function move(row: SessionRow, position: number): PracticeAck {
    const finished = position === row.total
    updateCursor.run(
      position,
      finished ? 'finished' : 'active',
      finished ? new Date().toISOString() : null,
      row.id,
    )
    return ack(session(row.id))
  }
  const readTransaction = database.transaction((id: string | null): PracticeView | null => {
    const selected = id ?? (activeQuery.get() as { id: string } | undefined)?.id
    if (!selected) return null
    const row = session(selected)
    const counts = countsQuery.get(selected) as {
      revealed: number
      rated: number
      unrated: number
      skipped: number
      unknownCount: number
      learningCount: number
      masteredCount: number
    }
    const summary = {
      ...ack(row),
      mode: row.mode,
      category: categorySnapshotSchema.parse(JSON.parse(row.categoryJson)),
      topicId: row.topicId,
      filters:
        row.filtersJson === null ? null : questionFiltersSchema.parse(JSON.parse(row.filtersJson)),
      repeat:
        row.repeatSourceId === null && row.repeatSelection === null
          ? null
          : repeatPracticeSchema.parse({
              sessionId: row.repeatSourceId,
              selection: row.repeatSelection,
            }),
      selectionName: row.selectionName,
      createdAt: row.createdAt,
      endedAt: row.endedAt,
      counts: {
        revealed: counts.revealed,
        rated: counts.rated,
        unrated: counts.unrated,
        skipped: counts.skipped,
        ratings: {
          不会: counts.unknownCount,
          不熟: counts.learningCount,
          掌握: counts.masteredCount,
        },
      },
    }
    if (row.status !== 'active') return practiceViewSchema.parse({ session: summary, item: null })
    const state = item(row.id, row.position)
    const detail = detailQuery.get(row.id, row.position) as
      | {
          position: number
          topicId: string
          questionId: string
          versionId: number
          title: string
          topicTitle: string
          tags: string
          difficulty: string
          markdown: string
          definitions: string
          imageBindings: string
        }
      | undefined
    if (!detail) throw new Error('练习队列缺少固定版本。')
    const body = contentBodySchema.parse({
      markdown: detail.markdown,
      definitions: JSON.parse(detail.definitions),
      imageBindings: JSON.parse(detail.imageBindings),
    })
    const info = {
      position: detail.position,
      topicId: detail.topicId,
      questionId: detail.questionId,
      versionId: detail.versionId,
      title: detail.title,
      topicTitle: detail.topicTitle,
      tags: JSON.parse(detail.tags) as unknown,
      difficulty: detail.difficulty,
      body,
      draft: { revision: state.draftRevision, text: state.draft },
      rating: state.rating,
      skippedAt: state.skippedAt,
    }
    return practiceViewSchema.parse({
      session: summary,
      item:
        state.revealedAt === null
          ? { ...info, revealed: false, revealedAt: null }
          : {
              ...info,
              revealed: true,
              revealedAt: state.revealedAt,
              answer: { ...body, markdown: answerMarkdown(state.versionId) },
            },
    })
  })
  const outlineTransaction = database.transaction((id: string, page: number) => {
    const row = session(id)
    if (page > Math.ceil(row.total / PRACTICE_OUTLINE_PAGE_SIZE))
      throw new PracticeFault('BOUNDARY', '本轮没有这一页题目，请重新读取清单。')
    const items = outlineQuery.all(id, (page - 1) * PRACTICE_OUTLINE_PAGE_SIZE) as {
      position: number
      topicId: string
      questionId: string
      title: string
      topicTitle: string
      revealed: number
      rating: string | null
      skipped: number
    }[]
    return practiceOutlineSchema.parse({
      ...ack(row),
      page,
      items: items.map((item) => ({
        ...item,
        revealed: Boolean(item.revealed),
        skipped: Boolean(item.skipped),
      })),
    })
  })
  return {
    read: (id: string | null) => readTransaction.deferred(id),
    outline: ({ sessionId, page }: { sessionId: string; page: number }) =>
      outlineTransaction.deferred(sessionId, page),
    start(input: StartPractice): PracticeAck {
      return command('start', input, () => {
        const active = activeQuery.get() as { id: string } | undefined
        if (active && !input.replace)
          throw new PracticeFault(
            'ACTIVE_SESSION_EXISTS',
            '已有活动练习，请继续或明确结束原练习后新建。',
          )
        if (input.replace && input.replace.sessionId !== active?.id)
          throw new PracticeFault('SESSION_CONFLICT', '活动练习已变化，请重新读取后决定是否结束。')
        const old = input.replace ? current(input.replace) : undefined
        const source = input.repeat ? session(input.repeat.sessionId) : undefined
        if (source?.status === 'active')
          throw new PracticeFault('SESSION_CONFLICT', '来源轮尚未结束，请先完成或结束该轮。')
        const mode = input.mode ?? 'sequential'
        const filters = questionFiltersSchema.parse(input.filters ?? EMPTY_QUESTION_FILTERS)
        const prioritizeOldest =
          !input.repeat && !input.selected && filters.practiceOrder === 'oldest'
        const category = categoryScopeSchema.parse(input.category ?? { kind: 'all' })
        const namedCategory =
          category.kind === 'category'
            ? (categoryQuery.get(category.categoryId) as { title: string } | undefined)
            : undefined
        if (!source && category.kind === 'category' && !namedCategory)
          throw new PracticeFault('NO_QUESTIONS', '分类已移除，请重新选择；原练习已保留。')
        const categorySnapshot = categorySnapshotSchema.parse(
          source
            ? JSON.parse(source.categoryJson)
            : category.kind === 'category'
              ? { ...category, title: namedCategory!.title }
              : category,
        )
        const queue = (
          input.selected
            ? input.selected.items.map((item) => {
                const found = selectedQuestionQuery.get(
                  item.topicId,
                  item.questionId,
                  item.versionId,
                  Number(input.selected!.contentUpdatedOnly ?? false),
                ) as QueueRow | undefined
                if (!found)
                  throw new PracticeFault(
                    'SESSION_CONFLICT',
                    input.selected!.contentUpdatedOnly
                      ? '勾选题目的内容、归档或待复习状态已变化，请重新预览更新题；原练习保持。'
                      : '勾选题目的内容或归档状态已变化，请重新预览；原练习保持。',
                  )
                return found
              })
            : input.repeat
              ? repeatQueueQuery.all({ ...input.repeat, random: Number(mode === 'random') })
              : (mode === 'random' && !prioritizeOldest ? randomQueueQuery : queueQuery).all({
                  ...questionSelectionParameters({ ...input, filters, category }),
                  limit: input.count === 'all' ? -1 : input.count,
                })
        ) as QueueRow[]
        if ((input.selected || prioritizeOldest) && mode === 'random')
          for (let index = queue.length - 1; index > 0; index--) {
            const target = randomInt(index + 1)
            ;[queue[index], queue[target]] = [queue[target]!, queue[index]!]
          }
        if (!queue.length)
          throw new PracticeFault(
            'NO_QUESTIONS',
            input.repeat
              ? '来源轮没有所选状态的题目，未创建新轮。'
              : '没有匹配的活动题目，不创建空练习。',
          )
        const now = new Date().toISOString()
        if (old) updateCursor.run(old.position, 'ended', now, old.id)
        const id = randomUUID()
        insertSession.run(
          id,
          mode,
          source ? source.topicId : input.topicId,
          now,
          source ? source.filtersJson : input.selected ? null : JSON.stringify(filters),
          JSON.stringify(categorySnapshot),
          input.repeat?.sessionId ?? null,
          input.repeat?.selection ?? null,
          input.selected?.sourceName ?? source?.selectionName ?? null,
        )
        queue.forEach((question, position) =>
          insertItem.run(
            id,
            position,
            question.questionId,
            question.versionId,
            question.title,
            question.topicTitle,
            question.tags,
            question.difficulty,
          ),
        )
        // 与建轮和回执同一事务；仅原定义确实用于本次成功建轮时计最近使用。
        if (input.sourcePlanId) {
          const plan = database
            .prepare('SELECT options_json FROM practice_plans WHERE plan_id=?')
            .get(input.sourcePlanId) as { options_json: string } | undefined
          if (plan) {
            const options = JSON.parse(plan.options_json) as {
              category: unknown
              topicId: string | null
              count: unknown
              mode: unknown
              filters: unknown
            }
            const savedFilters = questionFiltersSchema.parse(options.filters)
            const filterValues = (value: typeof filters) => [
              value.query,
              value.tag,
              value.difficulty,
              value.mastery,
              value.favoritesOnly,
              value.personalTagId ?? null,
              value.practiceRecency ?? 'all',
              value.practiceOrder ?? 'default',
            ]
            if (
              JSON.stringify(options.category) === JSON.stringify(category) &&
              options.topicId === input.topicId &&
              options.count === input.count &&
              options.mode === mode &&
              JSON.stringify(filterValues(savedFilters)) === JSON.stringify(filterValues(filters))
            )
              database
                .prepare('UPDATE practice_plans SET last_used_at=? WHERE plan_id=?')
                .run(now, input.sourcePlanId)
          }
        }
        if (input.selected?.sourceSetId) {
          const members = database
            .prepare(
              `SELECT topic_id AS topicId,question_id AS questionId
            FROM question_set_items WHERE set_id=? ORDER BY position`,
            )
            .all(input.selected.sourceSetId)
          const identities = input.selected.items.map(({ topicId, questionId }) => ({
            topicId,
            questionId,
          }))
          if (JSON.stringify(members) === JSON.stringify(identities))
            database
              .prepare('UPDATE question_sets SET last_used_at=? WHERE set_id=?')
              .run(now, input.selected.sourceSetId)
        }
        return ack(session(id))
      })
    },
    saveDraft(input: SaveDraft): DraftAck {
      ensureWritable()
      try {
        return database
          .transaction(() => {
            if (session(input.sessionId).status !== 'active')
              throw new PracticeFault('SESSION_CONFLICT', '练习已结束，不能写入旧轮草稿。')
            return save(input.sessionId, input.position, input.draft)
          })
          .immediate()
      } catch (error) {
        if (error instanceof PracticeFault) throw error
        try {
          if (database.inTransaction) return uncertain()
          const saved = item(input.sessionId, input.position)
          if (saved.draftRevision === input.draft.revision && saved.draft === input.draft.text)
            return draftAckSchema.parse({
              sessionId: input.sessionId,
              position: input.position,
              draftRevision: saved.draftRevision,
            })
          // 能读回当前状态即说明写入没有生效，结果是确定的：按具体冲突返回。
          // 若在这里统一返回 unknown，会把可恢复的草稿冲突升级为整个服务停写直到重启。
          if (saved.draftRevision > input.draft.revision)
            throw new PracticeFault('DRAFT_STALE', '草稿修订已过期，请读取已保存内容后重新提交。')
          if (saved.draftRevision === input.draft.revision)
            throw new PracticeFault(
              'DRAFT_CONFLICT',
              '相同修订包含不同草稿，请保留输入并核对已保存内容。',
            )
        } catch (readError) {
          if (readError instanceof PracticeFault) throw readError
          return uncertain()
        }
        throw error
      }
    },
    reveal(input: RevealPractice): PracticeAck {
      return command('reveal', input, () => {
        const row = current(input.cursor)
        const question = item(row.id, row.position)
        save(row.id, row.position, input.draft)
        const now = new Date().toISOString()
        revealItem.run(now, row.id, row.position)
        if (!question.revealedAt)
          recordActivity(
            `reveal:${input.requestId}`,
            'reveal',
            question.questionId,
            now,
            row.id,
            row.position,
          )
        return move(row, row.position)
      })
    },
    rateAndAdvance(input: RatePractice): PracticeAck {
      return command('rate', input, () => {
        const row = current(input.cursor)
        const question = item(row.id, row.position)
        if (!question.revealedAt)
          throw new PracticeFault('REVEAL_REQUIRED', '请先揭晓参考答案，再自评或暂不评价。')
        save(row.id, row.position, input.draft)
        if (input.rating !== null) {
          const now = new Date().toISOString()
          rateItem.run(input.rating, now, row.id, row.position)
          rateState.run(question.questionId, input.rating, question.versionId)
          recordActivity(
            `rating:${input.requestId}`,
            'rating',
            question.questionId,
            now,
            row.id,
            row.position,
          )
        }
        return move(row, row.position + 1)
      })
    },
    navigate(input: NavigatePractice): PracticeAck {
      return command('navigate', input, () => {
        const row = current(input.cursor)
        const question = item(row.id, row.position)
        if (input.direction === 'jump') {
          if (input.targetPosition === undefined || input.targetPosition >= row.total)
            throw new PracticeFault('BOUNDARY', '目标题目不在本轮固定队列中。')
          save(row.id, row.position, input.draft)
          return move(row, input.targetPosition)
        }
        if (input.direction === 'previous' && row.position === 0)
          throw new PracticeFault('BOUNDARY', '当前已经是第一题。')
        if (input.direction === 'next' && !question.revealedAt)
          throw new PracticeFault('REVEAL_REQUIRED', '请先揭晓，或选择跳过本题。')
        if (input.direction === 'skip' && question.revealedAt)
          throw new PracticeFault('ALREADY_REVEALED', '本题已经揭晓，请选择下一题或暂不评价。')
        save(row.id, row.position, input.draft)
        if (input.direction === 'skip') skipItem.run(new Date().toISOString(), row.id, row.position)
        return move(row, row.position + (input.direction === 'previous' ? -1 : 1))
      })
    },
    end(input: RevealPractice): PracticeAck {
      return command('end', input, () => {
        const row = current(input.cursor)
        save(row.id, row.position, input.draft)
        updateCursor.run(row.position, 'ended', new Date().toISOString(), row.id)
        return ack(session(row.id))
      })
    },
  }
}

export type PracticeRepository = ReturnType<typeof createPracticeRepository>
