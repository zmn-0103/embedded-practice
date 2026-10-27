import { z } from 'zod'

export const DATA_LOCATION_CHANNELS = {
  read: 'data-locations:read',
  open: 'data-locations:open',
} as const
export const directoryTargetSchema = z.enum(['data', 'backups', 'logs'])
const location = z
  .string()
  .min(1)
  .max(32767)
  .refine((value) => !value.includes('\0'))
export const dataLocationsSchema = z.strictObject({
  dataDirectory: location,
  backupDirectory: location,
  logDirectory: location,
  logFile: location,
})
export const dataLocationErrorSchema = z.strictObject({
  code: z.enum(['FORBIDDEN', 'INVALID_REQUEST', 'SERVICE_CLOSED', 'LOCATION_BUSY', 'FILE_ERROR']),
  message: z.string().min(1),
})
function result<T extends z.ZodType>(value: T) {
  return z.discriminatedUnion('ok', [
    z.strictObject({ ok: z.literal(true), value }),
    z.strictObject({ ok: z.literal(false), error: dataLocationErrorSchema }),
  ])
}
export const dataLocationsResultSchema = result(dataLocationsSchema)
export const directoryOpenResultSchema = result(z.null())
export type DataLocations = z.infer<typeof dataLocationsSchema>
export type DirectoryTarget = z.infer<typeof directoryTargetSchema>
export type DataLocationError = z.infer<typeof dataLocationErrorSchema>
export type DataLocationsResult = z.infer<typeof dataLocationsResultSchema>
export type DirectoryOpenResult = z.infer<typeof directoryOpenResultSchema>
export interface DataLocationsDesktopApi {
  read(): Promise<DataLocationsResult>
  open(target: DirectoryTarget): Promise<DirectoryOpenResult>
}
