import { z } from 'zod'
import {
  contentBodySchema,
  identitySchema,
  PAGE_SIZE,
  versionIdentitySchema,
} from './library-desktop'

export const CONTENT_UPDATE_CHANNELS = {
  versions: 'content-updates:versions',
  compare: 'content-updates:compare',
} as const
const positive = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const counter = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
export const contentVersionSchema = z.strictObject({
  versionId: positive,
  sequence: positive,
  createdAt: z.iso.datetime(),
})
export const contentVersionsRequestSchema = versionIdentitySchema.extend({ page: positive })
export const contentVersionsSchema = identitySchema
  .extend({
    target: contentVersionSchema,
    page: positive,
    pageSize: z.literal(PAGE_SIZE),
    total: counter,
    versions: z.array(contentVersionSchema).max(PAGE_SIZE),
  })
  .refine(({ target, page, total, versions }) => {
    const offset = (page - 1) * PAGE_SIZE
    return (
      page <= Math.max(1, Math.ceil(total / PAGE_SIZE)) &&
      versions.length === Math.max(0, Math.min(PAGE_SIZE, total - offset)) &&
      versions.every(
        (version, index) =>
          version.sequence < (index ? versions[index - 1]!.sequence : target.sequence),
      ) &&
      new Set(versions.map((version) => version.versionId)).size === versions.length &&
      !versions.some((version) => version.versionId === target.versionId)
    )
  })
export const contentComparisonRequestSchema = versionIdentitySchema
  .extend({ previousVersionId: positive, part: z.enum(['question', 'answer']) })
  .refine((input) => input.versionId !== input.previousVersionId)
const versionBodySchema = contentVersionSchema.extend({ body: contentBodySchema })
export const contentComparisonSchema = identitySchema
  .extend({
    part: z.enum(['question', 'answer']),
    previous: versionBodySchema,
    current: versionBodySchema,
  })
  .refine(
    ({ previous, current }) =>
      previous.sequence < current.sequence && previous.versionId !== current.versionId,
  )
const result = <T extends z.ZodType>(value: T) =>
  z.discriminatedUnion('ok', [
    z.strictObject({ ok: z.literal(true), value }),
    z.strictObject({
      ok: z.literal(false),
      error: z.strictObject({
        code: z.enum([
          'FORBIDDEN',
          'INVALID_REQUEST',
          'SERVICE_CLOSED',
          'DATABASE_UNAVAILABLE',
          'NOT_FOUND',
        ]),
        message: z.string().min(1),
      }),
    }),
  ])
export const contentVersionsResultSchema = result(contentVersionsSchema)
export const contentComparisonResultSchema = result(contentComparisonSchema)
export type ContentVersion = z.infer<typeof contentVersionSchema>
export type ContentVersions = z.infer<typeof contentVersionsSchema>
export type ContentComparison = z.infer<typeof contentComparisonSchema>
export type ContentComparisonRequest = z.infer<typeof contentComparisonRequestSchema>
export interface ContentUpdatesDesktopApi {
  versions(
    input: z.infer<typeof contentVersionsRequestSchema>,
  ): Promise<z.infer<typeof contentVersionsResultSchema>>
  compare(input: ContentComparisonRequest): Promise<z.infer<typeof contentComparisonResultSchema>>
}
