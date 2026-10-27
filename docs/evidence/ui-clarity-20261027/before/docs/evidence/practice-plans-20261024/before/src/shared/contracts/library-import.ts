import { z } from 'zod'
import { bankIdentifierSchema, type ParseIssue } from './question-bank'

export const previewTokenSchema = z.uuid()
export const importCountsSchema = z.strictObject({
  added: z.number().int().nonnegative(),
  updated: z.number().int().nonnegative(),
  metadata: z.number().int().nonnegative(),
  unchanged: z.number().int().nonnegative(),
  archived: z.number().int().nonnegative(),
  restored: z.number().int().nonnegative(),
  newVersions: z.number().int().nonnegative(),
})
export const importSummarySchema = z.strictObject({
  counts: importCountsSchema,
  topics: z.array(
    z.strictObject({
      topicId: bankIdentifierSchema,
      topicTitle: z.string().min(1),
      metadataChanged: z.boolean(),
      counts: importCountsSchema,
      questions: z.array(
        z.strictObject({
          questionId: bankIdentifierSchema,
          kind: z.enum(['added', 'updated', 'metadata', 'unchanged', 'archived', 'restored']),
          contentChanged: z.boolean(),
        }),
      ),
    }),
  ),
})
export const commitReceiptSchema = z.strictObject({
  revision: z.number().int().nonnegative(),
  summary: importSummarySchema,
})

export type ImportCounts = z.infer<typeof importCountsSchema>
export type ImportSummary = z.infer<typeof importSummarySchema>
export type CommitReceipt = z.infer<typeof commitReceiptSchema>
export const importPreviewSchema = z.strictObject({
  token: previewTokenSchema,
  expiresAt: z.iso.datetime(),
  summary: importSummarySchema,
})
export type ImportPreview = z.infer<typeof importPreviewSchema>
export const importErrorCodeSchema = z.enum([
  'INVALID_REQUEST',
  'INVALID_TOKEN',
  'PREVIEW_EXPIRED',
  'PREVIEW_STALE',
  'IMPORT_BUSY',
  'PREPARATION_FAILED',
  'IMPORT_CANCELLED',
  'SERVICE_CLOSED',
  'DATABASE_UNAVAILABLE',
])
export type ImportErrorCode = z.infer<typeof importErrorCodeSchema>

export type ImportResult<T> =
  | { readonly ok: true; readonly value: T }
  | {
      readonly ok: false
      readonly error: {
        readonly code: ImportErrorCode
        readonly message: string
        readonly issues?: readonly ParseIssue[]
      }
    }
