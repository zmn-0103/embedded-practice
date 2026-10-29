import type Database from 'better-sqlite3'
import { localDay } from '../../../shared/contracts/planning'

// 必须由业务写入的同一事务调用，失败一起回滚；只保存活动事实，不复制学习正文。
export function createActivityWriter(database: Database.Database) {
  const insert = database.prepare(`INSERT INTO learning_activities
    (activity_id,kind,question_id,session_id,position,occurred_at,day) VALUES(?,?,?,?,?,?,?)`)
  return (
    activityId: string,
    kind: 'rating' | 'reveal' | 'review' | 'note',
    questionId: number,
    occurredAt: string,
    sessionId: string | null = null,
    position: number | null = null,
  ) => {
    insert.run(
      activityId,
      kind,
      questionId,
      sessionId,
      position,
      occurredAt,
      localDay(new Date(occurredAt)),
    )
  }
}
