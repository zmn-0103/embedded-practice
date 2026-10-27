import { z } from 'zod'
import { contentBodySchema, identitySchema, PAGE_SIZE } from './library-desktop'
import { draftSchema, practiceIdSchema, practiceModeSchema, ratingSchema } from './practice'

export const HISTORY_CHANNELS = {
  list: 'history:list',
  getEntry: 'history:get-entry',
} as const
const counter = z.number().int().nonnegative()
export const historyListRequestSchema = identitySchema.extend({
  page: z.number().int().positive(),
  excludeSessionId: practiceIdSchema.optional(),
})
export const historyEntryRequestSchema = identitySchema.extend({
  sessionId: practiceIdSchema,
  position: counter,
})
export const historySummarySchema = z
  .strictObject({
    sessionId: practiceIdSchema,
    position: counter,
    versionId: z.number().int().positive(),
    versionSequence: z.number().int().positive(),
    isCurrentVersion: z.boolean(),
    title: z.string().min(1),
    topicTitle: z.string().min(1),
    mode: practiceModeSchema,
    sessionStatus: z.enum(['active', 'finished', 'ended']),
    createdAt: z.iso.datetime(),
    endedAt: z.iso.datetime().nullable(),
    revealedAt: z.iso.datetime().nullable(),
    rating: ratingSchema.nullable(),
    ratedAt: z.iso.datetime().nullable(),
    skippedAt: z.iso.datetime().nullable(),
    hasDraft: z.boolean(),
  })
  .refine(
    (item) =>
      (item.sessionStatus === 'active') === (item.endedAt === null) &&
      (item.rating === null) === (item.ratedAt === null) &&
      (item.rating === null || item.revealedAt !== null),
  )
export const historyEntrySchema = historySummarySchema
  .safeExtend({ body: contentBodySchema, draft: draftSchema, answer: contentBodySchema.optional() })
  .refine((entry) => (entry.revealedAt !== null) === (entry.answer !== undefined))
export const historyPageSchema = identitySchema.extend({
  currentVersionId: z.number().int().positive(),
  archived: z.boolean(),
  total: counter,
  page: z.number().int().positive(),
  pageSize: z.literal(PAGE_SIZE),
  entries: z.array(historySummarySchema).max(PAGE_SIZE),
})
const errorSchema = z.strictObject({
  code: z.enum([
    'FORBIDDEN',
    'INVALID_REQUEST',
    'SERVICE_CLOSED',
    'DATABASE_UNAVAILABLE',
    'NOT_FOUND',
  ]),
  message: z.string().min(1),
})
function resultSchema<T extends z.ZodType>(value: T) {
  return z.discriminatedUnion('ok', [
    z.strictObject({ ok: z.literal(true), value }),
    z.strictObject({ ok: z.literal(false), error: errorSchema }),
  ])
}
export const historyListResultSchema = resultSchema(historyPageSchema)
export const historyEntryResultSchema = resultSchema(historyEntrySchema)
export type HistoryListRequest = z.infer<typeof historyListRequestSchema>
export type HistoryEntryRequest = z.infer<typeof historyEntryRequestSchema>
export type HistorySummary = z.infer<typeof historySummarySchema>
export type HistoryEntry = z.infer<typeof historyEntrySchema>
export type HistoryPage = z.infer<typeof historyPageSchema>
export interface HistoryDesktopApi {
  list(request: HistoryListRequest): Promise<z.infer<typeof historyListResultSchema>>
  getEntry(request: HistoryEntryRequest): Promise<z.infer<typeof historyEntryResultSchema>>
}
