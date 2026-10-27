import type Database from 'better-sqlite3'
import { learningSummarySchema, type LearningScope } from '../../../shared/contracts/learning'
import { currentRatingSql, practicedSql, questionSelectionFrom } from './question-selection'

interface CountsRow {
  total: number
  revealed: number
  rated: number
  favorites: number
  contentUpdated: number
  unknownCount: number
  learningCount: number
  masteredCount: number
}

export function createLearningReader(database: Database.Database) {
  const topics = database.prepare(`SELECT t.topic_id AS topicId, t.title,
    SUM(CASE WHEN q.archived = 0 THEN 1 ELSE 0 END) AS activeCount,
    SUM(CASE WHEN q.archived = 1 THEN 1 ELSE 0 END) AS archivedCount
    FROM topics t LEFT JOIN questions q ON q.topic_id = t.topic_id
    GROUP BY t.topic_id ORDER BY t.title, t.topic_id`)
  // 每道题只进入内层一次；多轮作答通过 EXISTS 去重，不按作答行累计。
  const counts = database.prepare(`SELECT count(*) AS total,
    COALESCE(sum(revealed), 0) AS revealed, count(currentRating) AS rated,
    COALESCE(sum(favorite), 0) AS favorites,
    count(CASE WHEN sequence > 1 AND practiced = 0 THEN 1 END) AS contentUpdated,
    count(CASE WHEN currentRating = '不会' THEN 1 END) AS unknownCount,
    count(CASE WHEN currentRating = '不熟' THEN 1 END) AS learningCount,
    count(CASE WHEN currentRating = '掌握' THEN 1 END) AS masteredCount
    FROM (SELECT v.sequence, COALESCE(s.favorite, 0) AS favorite,
      ${currentRatingSql} AS currentRating, ${practicedSql} AS practiced,
      CASE WHEN EXISTS (SELECT 1 FROM practice_items p
        WHERE p.question_id = q.id AND p.version_id = q.current_version_id
        AND p.revealed_at IS NOT NULL) THEN 1 ELSE 0 END AS revealed
      ${questionSelectionFrom}
      WHERE q.archived = @archived AND (@topicId IS NULL OR q.topic_id = @topicId))`)
  const read = database.transaction((scope: LearningScope) => {
    const row = counts.get({
      topicId: scope.topicId,
      archived: Number(scope.archived),
    }) as CountsRow
    return learningSummarySchema.parse({
      ...scope,
      topics: topics.all(),
      total: row.total,
      revealed: row.revealed,
      rated: row.rated,
      favorites: row.favorites,
      contentUpdated: row.contentUpdated,
      ratings: { 不会: row.unknownCount, 不熟: row.learningCount, 掌握: row.masteredCount },
    })
  })
  return { readLearningSummary: (scope: LearningScope) => read.deferred(scope) }
}
