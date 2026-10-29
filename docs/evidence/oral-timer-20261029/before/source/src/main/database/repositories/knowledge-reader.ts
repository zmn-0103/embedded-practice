import type Database from 'better-sqlite3'
import { PAGE_SIZE } from '../../../shared/contracts/library-desktop'
import {
  knowledgeSearchSchema,
  knowledgePageSchema,
  type KnowledgeSearch,
} from '../../../shared/contracts/knowledge'

export function createKnowledgeReader(database: Database.Database) {
  const texts = `WITH texts AS (
    SELECT q.id,q.topic_id AS topicId,q.question_id AS questionId,q.title,t.title AS topicTitle,q.archived,q.position,
      q.title||char(10)||v.question_markdown AS questionText,n.text AS noteText,
      CASE WHEN length(n.text)>0 THEN n.updated_at END AS noteUpdatedAt,
      (SELECT p.name FROM question_personal_tags x JOIN personal_tags p ON p.tag_id=x.tag_id
        WHERE x.question_id=q.id AND (@query='' OR instr(lower(p.name),lower(@query))>0)
        ORDER BY p.name,p.tag_id LIMIT 1) AS tagText,
      (SELECT CASE r.kind WHEN 'confused' THEN '容易混淆' WHEN 'prerequisite' THEN '前置知识' ELSE '同一项目场景' END
        ||char(10)||r.explanation FROM question_relations r
        WHERE (r.source_question_id=q.id OR r.target_question_id=q.id)
          AND (@query='' OR instr(lower(r.explanation),lower(@query))>0)
        ORDER BY r.updated_at DESC,r.relation_id LIMIT 1) AS relationText
    FROM questions q JOIN topics t ON t.topic_id=q.topic_id
    JOIN question_versions v ON v.id=q.current_version_id LEFT JOIN personal_notes n ON n.question_id=q.id
  ), hits AS (SELECT *,
    (@query='' OR instr(lower(questionText),lower(@query))>0) AS questionHit,
    (length(noteText)>0 AND (@query='' OR instr(lower(noteText),lower(@query))>0)) AS noteHit,
    (tagText IS NOT NULL) AS tagHit,(relationText IS NOT NULL) AS relationHit FROM texts)
  `
  const where = `(@archive='all' OR archived=@archived) AND (@hasNotes=0 OR length(noteText)>0)
    AND ((@kind='all' AND (questionHit OR noteHit OR tagHit OR relationHit))
      OR (@kind='question' AND questionHit) OR (@kind='note' AND noteHit)
      OR (@kind='tag' AND tagHit) OR (@kind='relation' AND relationHit))`
  const excerpt = (field: string) => {
    const start = `max(1,instr(lower(${field}),lower(@query))-40)`
    return `CASE WHEN ${start}>1 THEN '…' ELSE '' END||substr(${field},${start},180)
      ||CASE WHEN length(${field})>${start}+179 THEN '…' ELSE '' END`
  }
  const total = database.prepare(`${texts} SELECT count(*) FROM hits WHERE ${where}`).pluck()
  const rows =
    database.prepare(`${texts} SELECT topicId,questionId,title,topicTitle,archived,noteUpdatedAt,
    CASE WHEN questionHit THEN ${excerpt('questionText')} END AS question,
    CASE WHEN noteHit THEN ${excerpt('noteText')} END AS note,
    CASE WHEN tagHit THEN ${excerpt('tagText')} END AS tag,
    CASE WHEN relationHit THEN ${excerpt('relationText')} END AS relation
    FROM hits WHERE ${where} ORDER BY CASE WHEN @sort='notes' THEN noteUpdatedAt END DESC,
      topicTitle,topicId,position,id LIMIT @limit OFFSET @offset`)
  const search = database.transaction((input: KnowledgeSearch) => {
    const parameters = {
      ...input,
      archived: Number(input.archive === 'archived'),
      hasNotes: Number(input.hasNotes),
    }
    const count = total.get(parameters) as number,
      current = Math.min(input.page, Math.max(1, Math.ceil(count / PAGE_SIZE)))
    const items = (
      rows.all({ ...parameters, limit: PAGE_SIZE, offset: (current - 1) * PAGE_SIZE }) as Record<
        string,
        unknown
      >[]
    ).map((row) => ({
      topicId: row.topicId,
      questionId: row.questionId,
      title: row.title,
      topicTitle: row.topicTitle,
      archived: Boolean(row.archived),
      noteUpdatedAt: row.noteUpdatedAt,
      hits: (['question', 'note', 'tag', 'relation'] as const).flatMap((kind) =>
        typeof row[kind] === 'string' && (input.kind === 'all' || input.kind === kind)
          ? [{ kind, excerpt: row[kind] }]
          : [],
      ),
    }))
    return knowledgePageSchema.parse({ page: current, pageSize: PAGE_SIZE, total: count, items })
  })
  return {
    searchKnowledge(input: KnowledgeSearch) {
      return search.deferred(knowledgeSearchSchema.parse(input))
    },
  }
}
