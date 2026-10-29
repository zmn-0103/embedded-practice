import { z } from 'zod'
import { questionIdentitiesSchema } from './question-sets'

export const MAX_PERSONAL_TAGS = 100
export const PERSONAL_TAG_CHANNELS = {
  list: 'personal-tags:list',
  change: 'personal-tags:change',
} as const
const nameSchema = z
  .string()
  .min(1)
  .max(60)
  .refine((name) => name === name.trim() && !/[\u0000-\u001f\u007f]/u.test(name))
export const personalTagSchema = z.strictObject({ tagId: z.uuid(), name: nameSchema })
export const personalTagChangeSchema = z.discriminatedUnion('kind', [
  personalTagSchema.extend({ kind: z.literal('save'), name: z.string().trim().pipe(nameSchema) }),
  personalTagSchema.extend({
    kind: z.literal('rename'),
    name: z.string().trim().pipe(nameSchema),
    expectedName: nameSchema,
  }),
  z.strictObject({ kind: z.literal('delete'), tagId: z.uuid(), expectedName: nameSchema }),
  z.strictObject({
    kind: z.literal('assign'),
    tagId: z.uuid(),
    present: z.boolean(),
    items: questionIdentitiesSchema.refine((items) => items.length > 0),
  }),
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
          'SERVICE_CLOSED',
          'DATABASE_UNAVAILABLE',
        ]),
        message: z.string().min(1),
      }),
    }),
  ])
export const personalTagListResultSchema = result(z.array(personalTagSchema).max(MAX_PERSONAL_TAGS))
export const personalTagChangeResultSchema = result(z.null())
export type PersonalTag = z.infer<typeof personalTagSchema>
export type PersonalTagChange = z.infer<typeof personalTagChangeSchema>
export interface PersonalTagsDesktopApi {
  list(): Promise<z.infer<typeof personalTagListResultSchema>>
  change(input: PersonalTagChange): Promise<z.infer<typeof personalTagChangeResultSchema>>
}
