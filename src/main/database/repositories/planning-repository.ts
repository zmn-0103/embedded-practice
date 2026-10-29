import type Database from 'better-sqlite3'
import {
  dailyTargetSchema,
  examGoalSchema,
  quotaSettingSchema,
  planningChangeSchema,
  quotaPreviewRequestSchema,
  quotaPreviewSchema,
  planningScopeRequestSchema,
  planningScopeSchema,
  type DailyTarget,
  type ExamGoal,
  type PlanningChange,
  type PlanningRecord,
} from '../../../shared/contracts/planning'
import { currentRatingSql, questionOrderSql, questionSelectionFrom } from './question-selection'

export class PlanningFault extends Error {
  constructor(
    readonly code: 'NOT_FOUND' | 'CONFLICT' | 'INVALID_REQUEST' | 'LIMIT_EXCEEDED',
    message: string,
  ) {
    super(message)
  }
}
export function createPlanningRepository(database: Database.Database) {
  const dailyColumns =
    'day,rating_target AS ratingTarget,review_target AS reviewTarget,revision,updated_at AS updatedAt'
  const goalColumns =
    'goal_id AS goalId,name,deadline,set_ids_json AS setIdsJson,revision,updated_at AS updatedAt'
  function daily(row: unknown): DailyTarget | null {
    return row ? dailyTargetSchema.parse({ type: 'daily', ...(row as object) }) : null
  }
  function goal(row: unknown): ExamGoal | null {
    if (!row) return null
    const { setIdsJson, ...rest } = row as Record<string, unknown>
    return examGoalSchema.parse({ type: 'exam', ...rest, setIds: JSON.parse(setIdsJson as string) })
  }
  function readDaily(day: string) {
    return daily(database.prepare(`SELECT ${dailyColumns} FROM daily_targets WHERE day=?`).get(day))
  }
  function readGoal(goalId: string): ExamGoal {
    const result = goal(
      database.prepare(`SELECT ${goalColumns} FROM study_goals WHERE goal_id=?`).get(goalId),
    )
    if (!result) throw new PlanningFault('NOT_FOUND', '备考目标已不存在，请重新读取。')
    return result
  }
  function readQuota() {
    const row = database
      .prepare(
        'SELECT rows_json AS rowsJson,revision,updated_at AS updatedAt FROM quota_settings WHERE id=1',
      )
      .get() as { rowsJson: string; revision: number; updatedAt: string } | undefined
    return row
      ? quotaSettingSchema.parse({
          type: 'quota',
          rows: JSON.parse(row.rowsJson),
          revision: row.revision,
          updatedAt: row.updatedAt,
        })
      : null
  }
  function content(record: PlanningRecord | PlanningChange) {
    const type = 'type' in record ? record.type : record.kind
    if (type === 'daily') {
      const value = record as DailyTarget
      return JSON.stringify([value.day, value.ratingTarget, value.reviewTarget])
    }
    if (type === 'exam') {
      const value = record as ExamGoal
      return JSON.stringify([value.goalId, value.name, value.deadline, value.setIds])
    }
    return JSON.stringify((record as { rows: unknown }).rows)
  }
  const change = database.transaction((input: PlanningChange): PlanningRecord | null => {
    if (input.kind === 'exam-delete') {
      const row = database
        .prepare('SELECT 1 FROM study_goals WHERE goal_id=?')
        .get(input.expected.goalId)
      if (!row) return null
      if (JSON.stringify(readGoal(input.expected.goalId)) !== JSON.stringify(input.expected))
        throw new PlanningFault(
          'CONFLICT',
          '目标已变化，不能删除其他修订；请先保留输入并重新读取。',
        )
      database.prepare('DELETE FROM study_goals WHERE goal_id=?').run(input.expected.goalId)
      return null
    }
    const previous =
      input.kind === 'daily'
        ? readDaily(input.day)
        : input.kind === 'quota'
          ? readQuota()
          : goal(
              database
                .prepare(`SELECT ${goalColumns} FROM study_goals WHERE goal_id=?`)
                .get(input.goalId),
            )
    if (
      previous &&
      content(previous) === content(input) &&
      (previous.revision === input.expectedRevision ||
        previous.revision === input.expectedRevision + 1)
    )
      return previous
    if ((previous?.revision ?? 0) !== input.expectedRevision)
      throw new PlanningFault(
        'CONFLICT',
        '设置已变化，当前输入保留；请明确放弃或重新读取，不能覆盖其他修订。',
      )
    const revision = input.expectedRevision + 1,
      updatedAt = new Date().toISOString()
    if (input.kind === 'daily') {
      database
        .prepare(
          `INSERT INTO daily_targets VALUES(?,?,?,?,?) ON CONFLICT(day) DO UPDATE SET rating_target=excluded.rating_target,review_target=excluded.review_target,revision=excluded.revision,updated_at=excluded.updated_at`,
        )
        .run(input.day, input.ratingTarget, input.reviewTarget, revision, updatedAt)
      return readDaily(input.day)
    }
    if (input.kind === 'quota') {
      database
        .prepare(
          `INSERT INTO quota_settings VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET rows_json=excluded.rows_json,revision=excluded.revision,updated_at=excluded.updated_at`,
        )
        .run(JSON.stringify(input.rows), revision, updatedAt)
      return readQuota()
    }
    if (
      !previous &&
      (database.prepare('SELECT count(*) FROM study_goals').pluck().get() as number) >= 20
    )
      throw new PlanningFault('LIMIT_EXCEEDED', '最多保存20个备考目标，请先整理已有目标。')
    if (
      database
        .prepare('SELECT 1 FROM study_goals WHERE name=? AND goal_id<>?')
        .get(input.name, input.goalId)
    )
      throw new PlanningFault('INVALID_REQUEST', '目标名称已存在，请换一个名称。')
    // 只改名/截止日允许保留原来的失效引用；明确改范围必须选择仍存在的题单。
    if (
      !previous ||
      JSON.stringify((previous as ExamGoal).setIds) !== JSON.stringify(input.setIds)
    ) {
      const find = database.prepare('SELECT 1 FROM question_sets WHERE set_id=?')
      if (input.setIds.some((id) => !find.get(id)))
        throw new PlanningFault('NOT_FOUND', '所选题单已失效，请重新读取后选择。')
    }
    database
      .prepare(
        `INSERT INTO study_goals VALUES(?,?,?,?,?,?) ON CONFLICT(goal_id) DO UPDATE SET name=excluded.name,deadline=excluded.deadline,set_ids_json=excluded.set_ids_json,revision=excluded.revision,updated_at=excluded.updated_at`,
      )
      .run(
        input.goalId,
        input.name,
        input.deadline,
        JSON.stringify(input.setIds),
        revision,
        updatedAt,
      )
    return readGoal(input.goalId)
  })
  const preview = database.transaction(
    (input: ReturnType<typeof quotaPreviewRequestSchema.parse>) => {
      const rows = input.rows.map((row) => {
        const topicTitle = database
          .prepare('SELECT title FROM topics WHERE topic_id=?')
          .pluck()
          .get(row.topicId) as string | undefined
        const available = database
          .prepare(
            'SELECT count(*) FROM questions WHERE topic_id=? AND archived=0 AND current_version_id IS NOT NULL',
          )
          .pluck()
          .get(row.topicId) as number
        const order =
          row.priority === 'random'
            ? 'random()'
            : row.priority === 'weak'
              ? `CASE WHEN (${currentRatingSql}) IN ('不会','不熟') THEN 0 WHEN (${currentRatingSql}) IS NULL THEN 1 ELSE 2 END,q.position,q.id`
              : questionOrderSql
        const items = database
          .prepare(
            `SELECT q.topic_id AS topicId,q.question_id AS questionId,q.current_version_id AS versionId,q.title,t.title AS topicTitle ${questionSelectionFrom} WHERE q.topic_id=@topicId AND q.archived=0 ORDER BY ${order} LIMIT @count`,
          )
          .all({ ...row, practiceOrder: 'oldest' })
        return {
          ...row,
          topicTitle: topicTitle ?? null,
          available,
          deficit: Math.max(0, row.count - available),
          items,
        }
      })
      return quotaPreviewSchema.parse({
        ready: rows.every((row) => row.topicTitle !== null && row.deficit === 0),
        rows,
      })
    },
  )
  const scope = database.transaction(
    (input: ReturnType<typeof planningScopeRequestSchema.parse>) => {
      const value = readGoal(input.goalId)
      if (input.setId && !value.setIds.includes(input.setId))
        throw new PlanningFault('INVALID_REQUEST', '题单不属于此目标。')
      const ids = input.setId ? [input.setId] : value.setIds
      const find = database.prepare('SELECT name FROM question_sets WHERE set_id=?').pluck()
      if (ids.some((id) => !find.get(id)))
        throw new PlanningFault(
          'NOT_FOUND',
          '范围包含失效题单，请先处理目标或明确选择一份现有题单。',
        )
      const items = database
        .prepare(
          `SELECT i.topic_id AS topicId,i.question_id AS questionId FROM json_each(?) s JOIN question_set_items i ON i.set_id=s.value GROUP BY i.topic_id,i.question_id ORDER BY min(CAST(s.key AS INTEGER)*500+i.position) LIMIT 501`,
        )
        .all(JSON.stringify(ids))
      if (items.length > 500)
        throw new PlanningFault(
          'LIMIT_EXCEEDED',
          '目标超过单轮500题，请选择其中一份题单练习，不会截断范围。',
        )
      return planningScopeSchema.parse({
        items,
        sourceName: input.setId ? `题单：${find.get(input.setId)}` : `备考目标：${value.name}`,
        ...(input.setId ? { sourceSetId: input.setId } : {}),
      })
    },
  )
  return {
    planningDefinitions(day: string) {
      return {
        daily: readDaily(day),
        previous: daily(
          database
            .prepare(
              `SELECT ${dailyColumns} FROM daily_targets WHERE day<? ORDER BY day DESC LIMIT 1`,
            )
            .get(day),
        ),
        goals: database
          .prepare(
            `SELECT ${goalColumns} FROM study_goals ORDER BY deadline IS NULL,deadline,name COLLATE NOCASE,goal_id`,
          )
          .all()
          .map((row) => goal(row)!),
        sets: database
          .prepare(
            `SELECT s.set_id AS setId,s.name,count(i.position) AS count FROM question_sets s LEFT JOIN question_set_items i ON i.set_id=s.set_id GROUP BY s.set_id ORDER BY s.name COLLATE NOCASE,s.set_id`,
          )
          .all(),
      }
    },
    readGoalDefinition: readGoal,
    readQuotaSettings: readQuota,
    readPlanningScope: (input: ReturnType<typeof planningScopeRequestSchema.parse>) =>
      scope.deferred(planningScopeRequestSchema.parse(input)),
    previewQuota: (input: ReturnType<typeof quotaPreviewRequestSchema.parse>) =>
      preview.deferred(quotaPreviewRequestSchema.parse(input)),
    changePlanning(input: PlanningChange) {
      if (database.inTransaction) throw new Error('目标设置写入不接受外层事务。')
      return change.immediate(planningChangeSchema.parse(input))
    },
  }
}
