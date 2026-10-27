import type Database from 'better-sqlite3'
import { libraryNavigationSchema } from '../../../shared/contracts/categories'

export function createTopicNavigationReader(database: Database.Database) {
  const categories = database.prepare(`SELECT category_id AS categoryId, title
    FROM categories ORDER BY title, category_id`)
  const topics = database.prepare(`SELECT t.topic_id AS topicId, t.title,
    t.category_id AS categoryId,
    SUM(CASE WHEN q.archived = 0 THEN 1 ELSE 0 END) AS activeCount,
    SUM(CASE WHEN q.archived = 1 THEN 1 ELSE 0 END) AS archivedCount
    FROM topics t LEFT JOIN questions q ON q.topic_id = t.topic_id
    GROUP BY t.topic_id ORDER BY t.title, t.topic_id`)
  // 调用方的列表/统计只读事务提供同一快照；不按作答行连接，避免计数重复。
  return () => libraryNavigationSchema.parse({ categories: categories.all(), topics: topics.all() })
}
