import { z } from 'zod'
import { categoryScopeSchema } from './categories'
import { practiceModeSchema, startPracticeSchema } from './practice'
import { questionFiltersSchema } from './question-filters'

export const MAX_PRACTICE_PLANS = 100
export const PRACTICE_PLAN_CHANNELS = {
  list: 'practice-plans:list',
  change: 'practice-plans:change',
} as const
const nameSchema = z
  .string()
  .min(1)
  .max(60)
  .refine((name) => name === name.trim() && !/[\u0000-\u001f\u007f]/u.test(name))
export const practicePlanOptionsSchema = z.strictObject({
  category: categoryScopeSchema,
  topicId: startPracticeSchema.shape.topicId,
  mode: practiceModeSchema,
  count: startPracticeSchema.shape.count,
  filters: questionFiltersSchema,
})
export const practicePlanSchema = z.strictObject({
  planId: z.uuid(),
  name: nameSchema,
  options: practicePlanOptionsSchema,
})
export const practicePlanChangeSchema = z.discriminatedUnion('kind', [
  practicePlanSchema.extend({ kind: z.literal('save'), name: z.string().trim().pipe(nameSchema) }),
  practicePlanSchema.extend({
    kind: z.literal('update'),
    name: z.string().trim().pipe(nameSchema),
    expected: practicePlanSchema.omit({ planId: true }),
  }),
  z.strictObject({ kind: z.literal('delete'), planId: z.uuid() }),
])
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
const result = <T extends z.ZodType>(value: T) =>
  z.discriminatedUnion('ok', [
    z.strictObject({ ok: z.literal(true), value }),
    z.strictObject({ ok: z.literal(false), error: errorSchema }),
  ])
export const practicePlansResultSchema = result(z.array(practicePlanSchema).max(MAX_PRACTICE_PLANS))
export const practicePlanChangeResultSchema = result(z.null())
export type PracticePlan = z.infer<typeof practicePlanSchema>
export type PracticePlanOptions = z.infer<typeof practicePlanOptionsSchema>
export type PracticePlanChange = z.infer<typeof practicePlanChangeSchema>
export interface PracticePlansDesktopApi {
  list(): Promise<z.infer<typeof practicePlansResultSchema>>
  change(change: PracticePlanChange): Promise<z.infer<typeof practicePlanChangeResultSchema>>
}
