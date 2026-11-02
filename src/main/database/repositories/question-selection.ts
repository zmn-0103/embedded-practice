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
// 大范围最近筛选按版本聚合一次；普通列表和单题读取保留原索引点查，避免全历史聚合。
export function createQuestionSelectionSql(historySummary = false) {
  const from = historySummary
    ? `${questionSelectionFrom}
      LEFT JOIN (SELECT version_id, count(*) AS revealedCount,
        max(julianday(revealed_at)) AS lastPracticeJulian
        FROM practice_items NOT INDEXED WHERE revealed_at IS NOT NULL GROUP BY version_id
      ) recentPractice ON recentPractice.version_id = q.current_version_id`
    : questionSelectionFrom
  const practicedSql = historySummary
    ? `CASE WHEN (${currentRatingSql}) IS NOT NULL OR recentPractice.revealedCount > 0 THEN 1 ELSE 0 END`
    : `CASE WHEN (${currentRatingSql}) IS NOT NULL OR EXISTS (
  SELECT 1 FROM practice_items p WHERE p.version_id = q.current_version_id
  AND p.revealed_at IS NOT NULL) THEN 1 ELSE 0 END`
  const lastPracticeJulianSql = historySummary
    ? 'recentPractice.lastPracticeJulian'
    : `(SELECT max(julianday(p.revealed_at)) FROM practice_items p
  WHERE p.version_id=q.current_version_id AND p.revealed_at IS NOT NULL)`
  const lastPracticedAtSql = `strftime('%Y-%m-%dT%H:%M:%fZ',${lastPracticeJulianSql})`
  const contentUpdatedSql = `(v.sequence > 1 AND (${practicedSql}) = 0)`
  const questionSelectionWhere = `q.archived = @archived
  AND ${categorySelectionWhere}
  AND (@topicId IS NULL OR q.topic_id = @topicId)
  AND (@tag IS NULL OR EXISTS (SELECT 1 FROM json_each(q.tags_json) WHERE value = @tag))
  AND (@personalTagId IS NULL OR EXISTS (SELECT 1 FROM question_personal_tags pt
    WHERE pt.question_id = q.id AND pt.tag_id = @personalTagId))
  AND (@difficulty IS NULL OR q.difficulty = @difficulty)
  AND (@favoritesOnly = 0 OR s.favorite = 1)
  AND (@practiceRecency='all' OR (@practiceRecency='never' AND (${practicedSql})=0)
    OR (@practiceRecency IN ('7d','30d') AND ((${practicedSql})=0
      OR ${lastPracticeJulianSql}<julianday(@practicedBefore))))
  AND (@mastery = 'all' OR (@mastery = 'unpracticed' AND (${practicedSql}) = 0)
    OR (@mastery = '不会＋不熟' AND (${currentRatingSql}) IN ('不会', '不熟'))
    OR (${currentRatingSql}) = @mastery)
  AND (@query = '' OR instr(lower(q.title), lower(@query)) > 0
    OR instr(lower(v.question_markdown), lower(@query)) > 0
    OR EXISTS (SELECT 1 FROM json_each(q.tags_json) WHERE instr(lower(value), lower(@query)) > 0))`
  const questionOrderSql = `CASE WHEN @practiceOrder='oldest' THEN
  CASE WHEN (${practicedSql})=0 THEN 0 WHEN ${lastPracticeJulianSql} IS NOT NULL THEN 1 ELSE 2 END END,
  CASE WHEN @practiceOrder='oldest' THEN ${lastPracticeJulianSql} END,
  t.title,t.topic_id,q.position,q.id`
  return {
    from,
    practicedSql,
    lastPracticeJulianSql,
    lastPracticedAtSql,
    contentUpdatedSql,
    questionSelectionWhere,
    questionOrderSql,
  }
}

export const {
  practicedSql,
  lastPracticeJulianSql,
  lastPracticedAtSql,
  contentUpdatedSql,
  questionSelectionWhere,
  questionOrderSql,
} = createQuestionSelectionSql()

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
    personalTagId: filters.personalTagId ?? null,
    practiceRecency: filters.practiceRecency ?? 'all',
    practiceOrder: filters.practiceOrder ?? 'default',
    practicedBefore:
      filters.practiceRecency === '7d' || filters.practiceRecency === '30d'
        ? new Date(
            Date.now() - (filters.practiceRecency === '7d' ? 7 : 30) * 86400000,
          ).toISOString()
        : null,
    difficulty: filters.difficulty,
    mastery: filters.mastery,
    favoritesOnly: Number(filters.favoritesOnly),
  }
}
