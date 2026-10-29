import type Database from 'better-sqlite3'
import { PAGE_SIZE } from '../../../shared/contracts/library-desktop'
import {
  planningHomeRequestSchema,
  planningHomeSchema,
  planningMonthRequestSchema,
  planningMonthSchema,
  planningDayRequestSchema,
  planningDaySchema,
  planningGoalRequestSchema,
  goalProgressSchema,
} from '../../../shared/contracts/planning'
import type { createPlanningRepository } from './planning-repository'
import { currentRatingSql, practicedSql } from './question-selection'

// 新账本使用发生时的本地日期；旧轮仅按实际存在的时间字段回看，不补造旧事件。
const roundDays = `WITH round_days AS (
  SELECT date(created_at,'localtime') AS day,id AS session_id FROM practice_sessions
  UNION SELECT date(ended_at,'localtime'),id FROM practice_sessions WHERE ended_at IS NOT NULL
  UNION SELECT date(revealed_at,'localtime'),session_id FROM practice_items WHERE revealed_at IS NOT NULL
  UNION SELECT date(rated_at,'localtime'),session_id FROM practice_items WHERE rated_at IS NOT NULL
  UNION SELECT day,session_id FROM learning_activities WHERE session_id IS NOT NULL
)`
export function createPlanningReader(
  database: Database.Database,
  repository: ReturnType<typeof createPlanningRepository>,
) {
  const counts =
    database.prepare(`SELECT count(DISTINCT CASE WHEN kind='rating' THEN question_id END) AS ratingQuestions,
    count(CASE WHEN kind='rating' THEN 1 END) AS ratingAttempts,
    count(DISTINCT CASE WHEN kind='review' THEN question_id END) AS reviewQuestions,
    count(CASE WHEN kind='review' THEN 1 END) AS reviewAttempts,
    count(CASE WHEN kind='reveal' THEN 1 END) AS reveals,count(CASE WHEN kind='note' THEN 1 END) AS noteSaves
    FROM learning_activities WHERE day=?`)
  const home = database.transaction((input: ReturnType<typeof planningHomeRequestSchema.parse>) =>
    planningHomeSchema.parse({
      day: input.day,
      ...repository.planningDefinitions(input.day),
      counts: counts.get(input.day),
    }),
  )
  const month = database.transaction(
    (input: ReturnType<typeof planningMonthRequestSchema.parse>) => {
      const days = database
        .prepare(
          `${roundDays}, activity_days AS (SELECT day,count(*) AS activities FROM learning_activities WHERE substr(day,1,7)=@month GROUP BY day),
      calendar_rounds AS (SELECT day,count(*) AS rounds FROM round_days WHERE substr(day,1,7)=@month GROUP BY day)
      SELECT day,coalesce(activities,0) AS activities,coalesce(rounds,0) AS rounds FROM activity_days FULL OUTER JOIN calendar_rounds USING(day) ORDER BY day`,
        )
        .all(input)
      return planningMonthSchema.parse({ month: input.month, days })
    },
  )
  const day = database.transaction((input: ReturnType<typeof planningDayRequestSchema.parse>) => {
    const eventTotal = database
      .prepare('SELECT count(*) FROM learning_activities WHERE day=?')
      .pluck()
      .get(input.day) as number
    const roundTotal = database
      .prepare(`${roundDays} SELECT count(*) FROM round_days WHERE day=?`)
      .pluck()
      .get(input.day) as number
    const page = (wanted: number, total: number) =>
      Math.min(wanted, Math.max(1, Math.ceil(total / PAGE_SIZE)))
    const eventPage = page(input.eventPage, eventTotal),
      roundPage = page(input.roundPage, roundTotal)
    const events = database
      .prepare(
        `SELECT a.activity_id AS activityId,a.kind,a.occurred_at AS occurredAt,a.day,a.session_id AS sessionId,q.topic_id AS topicId,q.question_id AS questionId,q.title,t.title AS topicTitle FROM learning_activities a JOIN questions q ON q.id=a.question_id JOIN topics t ON t.topic_id=q.topic_id WHERE a.day=? ORDER BY a.occurred_at DESC,a.activity_id LIMIT ? OFFSET ?`,
      )
      .all(input.day, PAGE_SIZE, (eventPage - 1) * PAGE_SIZE)
    const rounds = database
      .prepare(
        `${roundDays} SELECT s.id AS sessionId,s.status,coalesce(s.selection_name,t.title,'综合练习') AS title,s.created_at AS createdAt,s.ended_at AS endedAt,(SELECT count(*) FROM practice_items i WHERE i.session_id=s.id) AS total FROM round_days d JOIN practice_sessions s ON s.id=d.session_id LEFT JOIN topics t ON t.topic_id=s.topic_id WHERE d.day=? ORDER BY s.created_at DESC,s.id LIMIT ? OFFSET ?`,
      )
      .all(input.day, PAGE_SIZE, (roundPage - 1) * PAGE_SIZE)
    return planningDaySchema.parse({
      day: input.day,
      eventPage,
      eventTotal,
      roundPage,
      roundTotal,
      pageSize: PAGE_SIZE,
      events,
      rounds,
    })
  })
  const progress = database.transaction(
    (input: ReturnType<typeof planningGoalRequestSchema.parse>) => {
      const goal = repository.readGoalDefinition(input.goalId)
      const sets = goal.setIds.map((setId) => {
        const row = database
          .prepare(
            'SELECT name,(SELECT count(*) FROM question_set_items i WHERE i.set_id=question_sets.set_id) AS count FROM question_sets WHERE set_id=?',
          )
          .get(setId) as { name: string; count: number } | undefined
        return { setId, name: row?.name ?? null, count: row?.count ?? null }
      })
      const row = database
        .prepare(
          `WITH members AS (SELECT DISTINCT i.topic_id,i.question_id FROM json_each(?) j JOIN question_set_items i ON i.set_id=j.value)
      SELECT count(*) AS total,count(CASE WHEN q.id IS NOT NULL AND q.archived=0 THEN 1 END) AS active,
      count(CASE WHEN q.archived=1 THEN 1 END) AS archived,count(CASE WHEN q.id IS NULL THEN 1 END) AS missing,
      count(CASE WHEN q.archived=0 AND (${practicedSql})=1 THEN 1 END) AS practiced,
      count(CASE WHEN q.archived=0 AND (${currentRatingSql}) IS NOT NULL THEN 1 END) AS rated,
      count(CASE WHEN q.archived=0 AND (${currentRatingSql})='掌握' THEN 1 END) AS mastered
      FROM members m LEFT JOIN questions q ON q.topic_id=m.topic_id AND q.question_id=m.question_id LEFT JOIN question_user_state s ON s.question_id=q.id`,
        )
        .get(JSON.stringify(goal.setIds))
      return goalProgressSchema.parse({ goalId: goal.goalId, ...(row as object), sets })
    },
  )
  return {
    readPlanningHome: (input: ReturnType<typeof planningHomeRequestSchema.parse>) =>
      home.deferred(planningHomeRequestSchema.parse(input)),
    readPlanningMonth: (input: ReturnType<typeof planningMonthRequestSchema.parse>) =>
      month.deferred(planningMonthRequestSchema.parse(input)),
    readPlanningDay: (input: ReturnType<typeof planningDayRequestSchema.parse>) =>
      day.deferred(planningDayRequestSchema.parse(input)),
    readGoalProgress: (input: ReturnType<typeof planningGoalRequestSchema.parse>) =>
      progress.deferred(planningGoalRequestSchema.parse(input)),
  }
}
