import { z } from 'zod'
import { identitySchema, PAGE_SIZE } from './library-desktop'

export const KNOWLEDGE_CHANNELS = {
  search: 'knowledge:search',
  recent: 'knowledge:recent',
  changeRecent: 'knowledge:change-recent',
  relations: 'knowledge:relations',
  changeRelation: 'knowledge:change-relation',
} as const
export const RELATION_LABELS = {
  confused: '容易混淆',
  prerequisite: '前置知识',
  scenario: '同一项目场景',
} as const
const plain = (max: number) =>
  z
    .string()
    .max(max)
    .refine(
      (text) =>
        !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(text),
    )
export const knowledgeQuerySchema = plain(128).transform((text) => text.trim())
export const knowledgeSearchSchema = z.strictObject({
  query: knowledgeQuerySchema,
  kind: z.enum(['all', 'question', 'note', 'tag', 'relation']),
  archive: z.enum(['active', 'archived', 'all']),
  hasNotes: z.boolean(),
  sort: z.enum(['default', 'notes']),
  page: z.number().int().positive(),
})
export const knowledgeHitSchema = z.strictObject({
  kind: z.enum(['question', 'note', 'tag', 'relation']),
  excerpt: z.string().max(400),
})
export const knowledgeSearchItemSchema = identitySchema.extend({
  title: z.string().min(1),
  topicTitle: z.string().min(1),
  archived: z.boolean(),
  noteUpdatedAt: z.iso.datetime().nullable(),
  hits: z.array(knowledgeHitSchema).min(1).max(4),
})
export const knowledgePageSchema = z.strictObject({
  page: z.number().int().positive(),
  pageSize: z.literal(PAGE_SIZE),
  total: z.number().int().nonnegative(),
  items: z.array(knowledgeSearchItemSchema).max(PAGE_SIZE),
})
export const recentSearchSchema = z.strictObject({
  query: plain(128).refine((text) => text.length > 0 && text === text.trim()),
  searchedAt: z.iso.datetime(),
})
export const recentSearchChangeSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('remember'),
    query: knowledgeQuerySchema.pipe(z.string().min(1)),
  }),
  z.strictObject({ kind: z.literal('clear') }),
])
export const relationDraftSchema = z
  .strictObject({
    source: identitySchema,
    target: identitySchema,
    kind: z.enum(['confused', 'prerequisite', 'scenario']),
    explanation: plain(2000),
  })
  .refine(
    (item) =>
      item.source.topicId !== item.target.topicId ||
      item.source.questionId !== item.target.questionId,
  )
export const relationSchema = relationDraftSchema.safeExtend({
  relationId: z.uuid(),
  revision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  updatedAt: z.iso.datetime(),
})
export const relationItemSchema = relationSchema.safeExtend({
  sourceTitle: z.string().min(1),
  targetTitle: z.string().min(1),
  sourceTopicTitle: z.string().min(1),
  targetTopicTitle: z.string().min(1),
  sourceArchived: z.boolean(),
  targetArchived: z.boolean(),
})
export const relationListRequestSchema = z.strictObject({
  identity: identitySchema,
  page: z.number().int().positive(),
})
export const relationPageSchema = z.strictObject({
  page: z.number().int().positive(),
  pageSize: z.literal(PAGE_SIZE),
  total: z.number().int().nonnegative(),
  items: z.array(relationItemSchema).max(PAGE_SIZE),
})
export const relationChangeSchema = z.discriminatedUnion('action', [
  relationDraftSchema.safeExtend({
    action: z.literal('save'),
    relationId: z.uuid(),
    expectedRevision: z
      .number()
      .int()
      .nonnegative()
      .max(Number.MAX_SAFE_INTEGER - 1),
  }),
  z.strictObject({ action: z.literal('delete'), expected: relationSchema }),
])
const result = <T extends z.ZodType>(value: T) =>
  z.discriminatedUnion('ok', [
    z.strictObject({ ok: z.literal(true), value }),
    z.strictObject({
      ok: z.literal(false),
      error: z.strictObject({
        code: z.enum([
          'FORBIDDEN',
          'INVALID_REQUEST',
          'NOT_FOUND',
          'CONFLICT',
          'SERVICE_CLOSED',
          'DATABASE_UNAVAILABLE',
        ]),
        message: z.string().min(1),
      }),
    }),
  ])
export const knowledgeSearchResultSchema = result(knowledgePageSchema)
export const recentSearchResultSchema = result(z.array(recentSearchSchema).max(10))
export const knowledgeEmptyResultSchema = result(z.null())
export const relationListResultSchema = result(relationPageSchema)
export const relationChangeResultSchema = result(relationSchema.nullable())
export type KnowledgeSearch = z.infer<typeof knowledgeSearchSchema>
export type KnowledgePage = z.infer<typeof knowledgePageSchema>
export type Relation = z.infer<typeof relationSchema>
export type RelationDraft = z.infer<typeof relationDraftSchema>
export type RelationItem = z.infer<typeof relationItemSchema>
export type RelationPage = z.infer<typeof relationPageSchema>
export type RelationChange = z.infer<typeof relationChangeSchema>
export interface KnowledgeDesktopApi {
  search(input: KnowledgeSearch): Promise<z.infer<typeof knowledgeSearchResultSchema>>
  recent(): Promise<z.infer<typeof recentSearchResultSchema>>
  changeRecent(
    input: z.infer<typeof recentSearchChangeSchema>,
  ): Promise<z.infer<typeof knowledgeEmptyResultSchema>>
  relations(
    input: z.infer<typeof relationListRequestSchema>,
  ): Promise<z.infer<typeof relationListResultSchema>>
  changeRelation(input: RelationChange): Promise<z.infer<typeof relationChangeResultSchema>>
}
