import { z } from 'zod'
import { identitySchema, PAGE_SIZE } from './library-desktop'

export const REVIEW_CHANNELS = {
  read: 'review:read',
  save: 'review:save',
  list: 'review:list',
} as const
export const reviewDraftSchema = z.strictObject({
  state: z.enum(['pending', 'done']),
  dueDate: z.iso.date().nullable(),
  reason: z
    .string()
    .max(500)
    .refine(
      (text) =>
        !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(text),
    ),
})
export const reviewTodoSchema = identitySchema
  .extend({
    ...reviewDraftSchema.shape,
    revision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    updatedAt: z.iso.datetime(),
    completedAt: z.iso.datetime().nullable(),
  })
  .refine((item) => (item.state === 'done') === (item.completedAt !== null))
export const saveReviewSchema = identitySchema.extend({
  ...reviewDraftSchema.shape,
  expectedRevision: z
    .number()
    .int()
    .nonnegative()
    .max(Number.MAX_SAFE_INTEGER - 1),
})
export const reviewListRequestSchema = z.strictObject({
  state: z.enum(['pending', 'done', 'all']),
  due: z.enum(['all', 'due', 'undated']),
  page: z.number().int().positive(),
})
export const reviewListItemSchema = identitySchema
  .extend({
    ...reviewDraftSchema.shape,
    revision: reviewTodoSchema.shape.revision,
    updatedAt: z.iso.datetime(),
    completedAt: z.iso.datetime().nullable(),
    title: z.string().min(1),
    topicTitle: z.string().min(1),
    archived: z.boolean(),
  })
  .refine((item) => (item.state === 'done') === (item.completedAt !== null))
export const reviewPageSchema = z.strictObject({
  page: z.number().int().positive(),
  pageSize: z.literal(PAGE_SIZE),
  total: z.number().int().nonnegative(),
  items: z.array(reviewListItemSchema).max(PAGE_SIZE),
})
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
export const readReviewResultSchema = result(reviewTodoSchema.nullable())
export const saveReviewResultSchema = result(reviewTodoSchema)
export const reviewListResultSchema = result(reviewPageSchema)
export type ReviewDraft = z.infer<typeof reviewDraftSchema>
export type ReviewTodo = z.infer<typeof reviewTodoSchema>
export type SaveReview = z.infer<typeof saveReviewSchema>
export type ReviewPage = z.infer<typeof reviewPageSchema>
export type ReviewListRequest = z.infer<typeof reviewListRequestSchema>
export interface ReviewDesktopApi {
  read(input: z.infer<typeof identitySchema>): Promise<z.infer<typeof readReviewResultSchema>>
  save(input: SaveReview): Promise<z.infer<typeof saveReviewResultSchema>>
  list(input: ReviewListRequest): Promise<z.infer<typeof reviewListResultSchema>>
}

export function localDateString(date = new Date()): string {
  return `${date.getFullYear().toString().padStart(4, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}
export function reviewPresetDate(preset: 'tomorrow' | 'weekend', today = new Date()): string {
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12)
  const day = date.getDay()
  date.setDate(date.getDate() + (preset === 'tomorrow' ? 1 : day === 0 || day === 6 ? 0 : 6 - day))
  return localDateString(date)
}
