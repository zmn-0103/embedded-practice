import { z } from 'zod'

export const BACKUP_CHANNELS = {
  export: 'backup:export',
  preview: 'backup:preview',
  restore: 'backup:restore',
} as const

const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
export const backupSummarySchema = z.strictObject({
  createdAt: z.iso.datetime().nullable(),
  appVersion: z.string().min(1).nullable(),
  schemaVersion: z.number().int().positive(),
  requiresMigration: z.boolean(),
  categories: count,
  practicePlans: count,
  topics: count,
  questions: count,
  archivedQuestions: count,
  versions: count,
  images: count,
  sessions: count,
  drafts: count,
  favorites: count,
  ratings: count,
  activeSession: z.boolean(),
})
export const backupFileSchema = z.strictObject({
  filePath: z.string().min(1),
  summary: backupSummarySchema,
})
export const backupPreviewSchema = backupFileSchema.extend({ token: z.uuid() })
export const restoreRequestSchema = z.strictObject({ token: z.uuid() })
export const backupErrorSchema = z.strictObject({
  code: z.enum([
    'FORBIDDEN',
    'INVALID_REQUEST',
    'SERVICE_CLOSED',
    'DATABASE_UNAVAILABLE',
    'CANCELLED',
    'BACKUP_BUSY',
    'EXPORT_FAILED',
    'INVALID_BACKUP',
    'UNSUPPORTED_BACKUP',
    'FILE_ERROR',
    'PREVIEW_EXPIRED',
    'SAVE_FAILED',
    'RESTORE_FAILED',
    'RECOVERY_FAILED',
  ]),
  message: z.string().min(1),
})
export const backupResultSchema = z.discriminatedUnion('ok', [
  z.strictObject({ ok: z.literal(true), value: backupFileSchema }),
  z.strictObject({ ok: z.literal(false), error: backupErrorSchema }),
])
export const backupPreviewResultSchema = z.discriminatedUnion('ok', [
  z.strictObject({ ok: z.literal(true), value: backupPreviewSchema }),
  z.strictObject({ ok: z.literal(false), error: backupErrorSchema }),
])
export const restoreResultSchema = z.discriminatedUnion('ok', [
  z.strictObject({
    ok: z.literal(true),
    value: z.strictObject({ protectionPath: z.string().min(1) }),
  }),
  z.strictObject({ ok: z.literal(false), error: backupErrorSchema }),
])

export type BackupSummary = z.infer<typeof backupSummarySchema>
export type BackupFile = z.infer<typeof backupFileSchema>
export type BackupPreview = z.infer<typeof backupPreviewSchema>
export type BackupPreviewResult = z.infer<typeof backupPreviewResultSchema>
export type RestoreResult = z.infer<typeof restoreResultSchema>
export type BackupResult = z.infer<typeof backupResultSchema>
export type BackupError = z.infer<typeof backupErrorSchema>
export interface BackupDesktopApi {
  export(): Promise<BackupResult>
  preview(): Promise<BackupPreviewResult>
  restore(input: z.infer<typeof restoreRequestSchema>): Promise<RestoreResult>
}
