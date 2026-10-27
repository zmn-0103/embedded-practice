import { z } from 'zod'

export const SETTINGS_CHANNELS = { read: 'settings:read', save: 'settings:save' } as const
export const appearanceSchema = z.strictObject({
  theme: z.enum(['system', 'light', 'dark']),
  palette: z.enum(['forest', 'ocean', 'sand', 'lilac']),
  fontSize: z.number().int().min(15).max(22),
})
export const settingsResultSchema = z.discriminatedUnion('ok', [
  z.strictObject({ ok: z.literal(true), value: appearanceSchema }),
  z.strictObject({
    ok: z.literal(false),
    error: z.strictObject({
      code: z.enum(['FORBIDDEN', 'INVALID_REQUEST', 'SERVICE_CLOSED', 'DATABASE_UNAVAILABLE']),
      message: z.string().min(1),
    }),
  }),
])
export type AppearanceSettings = z.infer<typeof appearanceSchema>
export interface SettingsDesktopApi {
  read(): Promise<z.infer<typeof settingsResultSchema>>
  save(settings: AppearanceSettings): Promise<z.infer<typeof settingsResultSchema>>
}
