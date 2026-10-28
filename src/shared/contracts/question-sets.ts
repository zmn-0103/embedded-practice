import { z } from 'zod'
import { identitySchema, versionIdentitySchema, type QuestionIdentity } from './library-desktop'

export const MAX_QUESTION_SETS = 100
export const MAX_QUESTION_SET_ITEMS = 500
export const QUESTION_SET_CHANNELS = {
  list: 'question-sets:list',
  preview: 'question-sets:preview',
  change: 'question-sets:change',
} as const
export const questionIdentityKey = (item: QuestionIdentity) =>
  JSON.stringify([item.topicId, item.questionId])
const unique = (items: QuestionIdentity[]) =>
  new Set(items.map(questionIdentityKey)).size === items.length
export const questionIdentitiesSchema = z
  .array(identitySchema)
  .max(MAX_QUESTION_SET_ITEMS)
  .refine(unique)
const nameSchema = z
  .string()
  .min(1)
  .max(60)
  .refine((name) => name === name.trim() && !/[\u0000-\u001f\u007f]/u.test(name))
export const questionSetSchema = z.strictObject({
  setId: z.uuid(),
  name: nameSchema,
  items: questionIdentitiesSchema.refine((items) => items.length > 0),
})
export const questionSetSummarySchema = questionSetSchema.omit({ items: true }).extend({
  count: z.number().int().min(1).max(MAX_QUESTION_SET_ITEMS),
})
export const questionSetChangeSchema = z.discriminatedUnion('kind', [
  questionSetSchema.extend({ kind: z.literal('save'), name: z.string().trim().pipe(nameSchema) }),
  questionSetSchema.extend({
    kind: z.literal('update'),
    name: z.string().trim().pipe(nameSchema),
    expected: questionSetSchema.omit({ setId: true }),
  }),
  z.strictObject({ kind: z.literal('delete'), setId: z.uuid() }),
])
export const questionSetPreviewRequestSchema = z.union([
  z.strictObject({ items: questionIdentitiesSchema, contentUpdatedOnly: z.boolean().optional() }),
  z.strictObject({ setId: z.uuid(), contentUpdatedOnly: z.boolean().optional() }),
])
const availableSchema = versionIdentitySchema.extend({
  title: z.string().min(1),
  topicTitle: z.string().min(1),
})
const previewItemSchema = z.discriminatedUnion('status', [
  availableSchema.extend({ status: z.literal('available') }),
  availableSchema.extend({ status: z.literal('archived') }),
  availableSchema.extend({ status: z.literal('not-pending') }),
  identitySchema.extend({
    status: z.literal('missing'),
    title: z.null(),
    topicTitle: z.null(),
    versionId: z.null(),
  }),
])
export const questionSetPreviewSchema = z.strictObject({
  definition: questionSetSchema.nullable(),
  items: z.array(previewItemSchema).max(MAX_QUESTION_SET_ITEMS),
})
export const selectedPracticeSchema = z.strictObject({
  contentUpdatedOnly: z.boolean().optional(),
  sourceName: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .refine((value) => !/[\u0000-\u001f\u007f]/u.test(value)),
  items: z.array(versionIdentitySchema).min(1).max(MAX_QUESTION_SET_ITEMS).refine(unique),
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
          'SERVICE_CLOSED',
          'DATABASE_UNAVAILABLE',
        ]),
        message: z.string().min(1),
      }),
    }),
  ])
export const questionSetListResultSchema = result(
  z.array(questionSetSummarySchema).max(MAX_QUESTION_SETS),
)
export const questionSetPreviewResultSchema = result(questionSetPreviewSchema)
export const questionSetChangeResultSchema = result(z.null())
export type QuestionSet = z.infer<typeof questionSetSchema>
export type QuestionSetChange = z.infer<typeof questionSetChangeSchema>
export type QuestionSetPreview = z.infer<typeof questionSetPreviewSchema>
export type SelectedPractice = z.infer<typeof selectedPracticeSchema>
export interface QuestionSetsDesktopApi {
  list(): Promise<z.infer<typeof questionSetListResultSchema>>
  preview(
    input: z.infer<typeof questionSetPreviewRequestSchema>,
  ): Promise<z.infer<typeof questionSetPreviewResultSchema>>
  change(input: QuestionSetChange): Promise<z.infer<typeof questionSetChangeResultSchema>>
}
