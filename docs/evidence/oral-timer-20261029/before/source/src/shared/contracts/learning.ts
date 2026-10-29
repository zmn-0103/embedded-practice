import { z } from 'zod'
import { libraryPageSchema, listRequestSchema } from './library-desktop'
import { categoryScopeSchema } from './categories'

export const LEARNING_CHANNEL = 'learning:read'
export const learningScopeSchema = listRequestSchema.pick({
  topicId: true,
  archived: true,
  category: true,
})
const counter = z.number().int().nonnegative()
export const learningSummarySchema = learningScopeSchema
  .extend({
    category: categoryScopeSchema,
    categories: libraryPageSchema.shape.categories,
    topics: libraryPageSchema.shape.topics,
    total: counter,
    revealed: counter,
    rated: counter,
    favorites: counter,
    contentUpdated: counter,
    ratings: z.strictObject({ 不会: counter, 不熟: counter, 掌握: counter }),
  })
  .refine(
    (value) =>
      [value.revealed, value.rated, value.favorites, value.contentUpdated].every(
        (count) => count <= value.total,
      ) && value.rated === value.ratings.不会 + value.ratings.不熟 + value.ratings.掌握,
  )
export const learningResultSchema = z.discriminatedUnion('ok', [
  z.strictObject({ ok: z.literal(true), value: learningSummarySchema }),
  z.strictObject({
    ok: z.literal(false),
    error: z.strictObject({
      code: z.enum(['FORBIDDEN', 'INVALID_REQUEST', 'SERVICE_CLOSED', 'DATABASE_UNAVAILABLE']),
      message: z.string().min(1),
    }),
  }),
])
export type LearningScope = z.infer<typeof learningScopeSchema>
export type LearningSummary = z.infer<typeof learningSummarySchema>
export interface LearningDesktopApi {
  read(scope: LearningScope): Promise<z.infer<typeof learningResultSchema>>
}
