import { z } from 'zod'
import { contentBodySchema } from './library-desktop'
import { bankIdentifierSchema, questionDifficultySchema } from './question-bank'
import { masteryRatingSchema, questionFiltersSchema } from './question-filters'
import { categoryScopeSchema, categorySnapshotSchema } from './categories'

export const MAX_DRAFT_BYTES = 1024 * 1024
const counter = z.number().int().nonnegative()
export const practiceIdSchema = z.uuid()
export const ratingSchema = masteryRatingSchema
export const practiceModeSchema = z.enum(['sequential', 'random'])
export const draftSchema = z.strictObject({
  revision: counter,
  text: z
    .string()
    .max(MAX_DRAFT_BYTES)
    .refine(
      (text) =>
        !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(text),
    )
    .refine((text) => new TextEncoder().encode(text).byteLength <= MAX_DRAFT_BYTES),
})
export const cursorSchema = z.strictObject({
  sessionId: practiceIdSchema,
  position: counter,
  revision: counter,
})
export const startPracticeSchema = z.strictObject({
  requestId: practiceIdSchema,
  topicId: bankIdentifierSchema.nullable(),
  category: categoryScopeSchema.optional(),
  count: z.union([z.literal(10), z.literal(20), z.literal(50), z.literal('all')]),
  replace: cursorSchema.nullable(),
  filters: questionFiltersSchema.optional(),
  mode: practiceModeSchema.optional(),
})
export const readPracticeSchema = z.strictObject({ sessionId: practiceIdSchema.nullable() })
export const saveDraftSchema = z.strictObject({
  sessionId: practiceIdSchema,
  position: counter,
  draft: draftSchema,
})
export const revealPracticeSchema = z.strictObject({
  requestId: practiceIdSchema,
  cursor: cursorSchema,
  draft: draftSchema,
})
export const ratePracticeSchema = revealPracticeSchema.extend({ rating: ratingSchema.nullable() })
export const navigatePracticeSchema = revealPracticeSchema.extend({
  direction: z.enum(['previous', 'next', 'skip']),
})
export const endPracticeSchema = revealPracticeSchema

export const practiceAckSchema = z
  .strictObject({
    sessionId: practiceIdSchema,
    status: z.enum(['active', 'finished', 'ended']),
    position: counter,
    revision: counter,
    total: z.number().int().positive(),
  })
  .refine((value) =>
    value.status === 'finished' ? value.position === value.total : value.position < value.total,
  )
export const draftAckSchema = z.strictObject({
  sessionId: practiceIdSchema,
  position: counter,
  draftRevision: counter,
})
const summarySchema = practiceAckSchema
  .safeExtend({
    mode: practiceModeSchema,
    topicId: bankIdentifierSchema.nullable(),
    category: categorySnapshotSchema,
    filters: questionFiltersSchema.nullable(),
    createdAt: z.iso.datetime(),
    endedAt: z.iso.datetime().nullable(),
    counts: z.strictObject({
      revealed: counter,
      rated: counter,
      unrated: counter,
      skipped: counter,
      ratings: z.strictObject({ 不会: counter, 不熟: counter, 掌握: counter }),
    }),
  })
  .refine(
    ({ status, endedAt, counts, total }) =>
      (status === 'active') === (endedAt === null) &&
      counts.rated + counts.unrated === counts.revealed &&
      counts.revealed + counts.skipped <= total &&
      counts.rated === counts.ratings.不会 + counts.ratings.不熟 + counts.ratings.掌握,
  )
const itemSchema = z.strictObject({
  position: counter,
  topicId: bankIdentifierSchema,
  questionId: bankIdentifierSchema,
  versionId: z.number().int().positive(),
  title: z.string().min(1),
  topicTitle: z.string().min(1),
  tags: z.array(z.string()),
  difficulty: questionDifficultySchema.or(z.literal('未分级')),
  body: contentBodySchema,
  draft: draftSchema,
  rating: ratingSchema.nullable(),
  skippedAt: z.iso.datetime().nullable(),
})
export const practiceItemSchema = z.discriminatedUnion('revealed', [
  itemSchema.extend({ revealed: z.literal(false), revealedAt: z.null(), rating: z.null() }),
  itemSchema.extend({
    revealed: z.literal(true),
    revealedAt: z.iso.datetime(),
    answer: contentBodySchema,
  }),
])
export const practiceViewSchema = z
  .strictObject({ session: summarySchema, item: practiceItemSchema.nullable() })
  .refine(({ session, item }) =>
    session.status === 'active'
      ? item !== null && item.position === session.position
      : item === null,
  )
export const practiceErrorCodeSchema = z.enum([
  'INVALID_REQUEST',
  'NO_QUESTIONS',
  'ACTIVE_SESSION_EXISTS',
  'SESSION_CONFLICT',
  'SESSION_NOT_FOUND',
  'DRAFT_STALE',
  'DRAFT_CONFLICT',
  'REVEAL_REQUIRED',
  'BOUNDARY',
  'REQUEST_CONFLICT',
  'WRITE_FAILED',
  'OUTCOME_UNKNOWN',
  'SERVICE_CLOSED',
  'DATABASE_UNAVAILABLE',
])
export interface PracticeError {
  code: z.infer<typeof practiceErrorCodeSchema>
  message: string
}
export type PracticeResult<T> = { ok: true; value: T } | { ok: false; error: PracticeError }
export type PracticeCursor = z.infer<typeof cursorSchema>
export type Draft = z.infer<typeof draftSchema>
export type StartPractice = z.infer<typeof startPracticeSchema>
export type SaveDraft = z.infer<typeof saveDraftSchema>
export type RevealPractice = z.infer<typeof revealPracticeSchema>
export type RatePractice = z.infer<typeof ratePracticeSchema>
export type NavigatePractice = z.infer<typeof navigatePracticeSchema>
export type PracticeAck = z.infer<typeof practiceAckSchema>
export type DraftAck = z.infer<typeof draftAckSchema>
export type PracticeView = z.infer<typeof practiceViewSchema>
