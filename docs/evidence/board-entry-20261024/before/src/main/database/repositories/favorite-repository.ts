import type Database from 'better-sqlite3'
import type { FavoriteSetting } from '../../../shared/contracts/library-desktop'

export function createFavoriteRepository(database: Database.Database) {
  const set = database.prepare(`INSERT INTO question_user_state (question_id, favorite)
    SELECT id, @favorite FROM questions WHERE topic_id = @topicId AND question_id = @questionId
    ON CONFLICT(question_id) DO UPDATE SET favorite = excluded.favorite`)
  return {
    setFavorite(setting: FavoriteSetting): FavoriteSetting | undefined {
      const result = set.run({
        topicId: setting.topicId,
        questionId: setting.questionId,
        favorite: Number(setting.favorite),
      })
      return result.changes === 0 ? undefined : { ...setting }
    },
  }
}
