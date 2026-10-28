import { z } from 'zod'
import { themeIdSchema } from './themes'

export const SETTINGS_CHANNELS = { read: 'settings:read', save: 'settings:save' } as const
export const appearanceSchema = z
  .strictObject({
    theme: z.enum(['system', 'light', 'dark']),
    // 保留旧接口输入兼容；有 themeId 时以它为准。
    palette: z.enum(['forest', 'ocean', 'sand', 'lilac']),
    fontSize: z.number().int().min(15).max(22),
    themeId: themeIdSchema.optional(),
    navigationCollapsed: z.boolean().default(false),
    auxiliaryHidden: z.boolean().default(false),
  })
  .transform((settings) => ({
    ...settings,
    themeId: settings.themeId ?? `builtin.${settings.palette}`,
  }))
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
export type AppearanceInput = z.input<typeof appearanceSchema>
export interface SettingsDesktopApi {
  read(): Promise<z.infer<typeof settingsResultSchema>>
  save(settings: AppearanceInput): Promise<z.infer<typeof settingsResultSchema>>
}
