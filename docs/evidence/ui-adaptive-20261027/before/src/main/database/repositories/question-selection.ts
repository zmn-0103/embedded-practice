import {
  EMPTY_QUESTION_FILTERS,
  type QuestionFilters,
} from '../../../shared/contracts/question-filters'
import type { CategoryScope } from '../../../shared/contracts/categories'

// 列表、建轮和统计共用范围语义；只拼接固定SQL，用户条件均使用绑定参数。
export const categorySelectionWhere = `(@categoryKind = 'all'
  OR (@categoryKind = 'uncategorized' AND t.category_id IS NULL)
  OR (@categoryKind = 'category' AND t.category_id = @categoryId))`
export function categorySelectionParameters(category?: CategoryScope) {
  return {
    categoryKind: category?.kind ?? 'all',
    categoryId: category?.kind === 'category' ? category.categoryId : null,
  }
}

export const questionSelectionFrom = `FROM questions q
  JOIN topics t ON t.topic_id = q.topic_id
  JOIN question_versions v ON v.id = q.current_version_id
  LEFT JOIN question_user_state s ON s.question_id = q.id`
export const currentRatingSql = `CASE WHEN s.last_rated_version_id = q.current_version_id
  THEN s.last_rating ELSE NULL END`
export const practicedSql = `CASE WHEN (${currentRatingSql}) IS NOT NULL OR EXISTS (
  SELECT 1 FROM practice_items p WHERE p.version_id = q.current_version_id
  AND p.revealed_at IS NOT NULL) THEN 1 ELSE 0 END`
export const questionSelectionWhere = `q.archived = @archived
  AND ${categorySelectionWhere}
  AND (@topicId IS NULL OR q.topic_id = @topicId)
  AND (@tag IS NULL OR EXISTS (SELECT 1 FROM json_each(q.tags_json) WHERE value = @tag))
  AND (@difficulty IS NULL OR q.difficulty = @difficulty)
  AND (@favoritesOnly = 0 OR s.favorite = 1)
  AND (@mastery = 'all' OR (@mastery = 'unpracticed' AND (${practicedSql}) = 0)
    OR (${currentRatingSql}) = @mastery)
  AND (@query = '' OR instr(lower(q.title), lower(@query)) > 0
    OR instr(lower(v.question_markdown), lower(@query)) > 0
    OR EXISTS (SELECT 1 FROM json_each(q.tags_json) WHERE instr(lower(value), lower(@query)) > 0))`
export const questionOrderSql = 't.title, t.topic_id, q.position, q.id'

export function questionSelectionParameters(request: {
  topicId: string | null
  archived?: boolean
  filters?: QuestionFilters | undefined
  category?: CategoryScope | undefined
}) {
  const filters = request.filters ?? EMPTY_QUESTION_FILTERS
  return {
    ...categorySelectionParameters(request.category),
    topicId: request.topicId,
    archived: Number(request.archived ?? false),
    query: filters.query,
    tag: filters.tag,
    difficulty: filters.difficulty,
    mastery: filters.mastery,
    favoritesOnly: Number(filters.favoritesOnly),
  }
}
