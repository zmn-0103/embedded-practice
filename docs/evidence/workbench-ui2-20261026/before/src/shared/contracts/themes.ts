import { z } from 'zod'

export const MAX_THEME_BYTES = 256 * 1024
export const MAX_INSTALLED_THEMES = 100
export const DEFAULT_THEME_ID = 'builtin.forest'
export const themeIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/)
export const themeVersionSchema = z
  .string()
  .regex(/^(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})$/)
const label = (max: number) =>
  z
    .string()
    .min(1)
    .max(max)
    .regex(/^[^\u0000-\u001f\u007f]+$/)
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/)
export const themeColorsSchema = z.strictObject({
  background: color,
  surface: color,
  sidebar: color,
  text: color,
  muted: color,
  line: color,
  accent: color,
  accentSoft: color,
  accentInk: color,
  codeBackground: color,
  error: color,
  errorSoft: color,
  codeKeyword: color,
  codeValue: color,
  focus: color,
  success: color,
})
export const themeDefinitionSchema = z.strictObject({
  formatVersion: z.literal(1),
  id: themeIdSchema,
  name: label(60),
  version: themeVersionSchema,
  author: label(100),
  description: label(300),
  license: label(200),
  light: themeColorsSchema,
  dark: themeColorsSchema,
  presentation: z.strictObject({
    font: z.enum(['system', 'serif']),
    radius: z.enum(['square', 'soft', 'rounded']),
    density: z.enum(['compact', 'comfortable']),
    layout: z.enum(['classic', 'study']),
  }),
})
export type ThemeDefinition = z.infer<typeof themeDefinitionSchema>
export type ThemeColors = z.infer<typeof themeColorsSchema>

export function compareThemeVersions(left: string, right: string): number {
  const a = themeVersionSchema.parse(left).split('.').map(Number)
  const b = themeVersionSchema.parse(right).split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const difference = a[i]! - b[i]!
    if (difference) return Math.sign(difference)
  }
  return 0
}

// 所有键和字体均由程序提供，包内只有受限枚举和六位颜色，不拼接任意样式。
export function themeVariables(definition: ThemeDefinition): Record<string, string> {
  const variables: Record<string, string> = {}
  for (const key of Object.keys(definition.light) as (keyof ThemeColors)[]) {
    const cssKey = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
    variables[`--${cssKey}`] = `light-dark(${definition.light[key]}, ${definition.dark[key]})`
  }
  variables['--theme-font'] =
    definition.presentation.font === 'serif'
      ? "Georgia, 'Microsoft YaHei', serif"
      : "'Microsoft YaHei UI', 'Microsoft YaHei', 'Segoe UI', sans-serif"
  variables['--theme-radius'] = { square: '2px', soft: '8px', rounded: '16px' }[
    definition.presentation.radius
  ]
  variables['--theme-spacing'] = definition.presentation.density === 'compact' ? '16px' : '24px'
  return variables
}

export const THEME_CHANNELS = {
  list: 'themes:list',
  preview: 'themes:preview',
  install: 'themes:install',
  uninstall: 'themes:uninstall',
} as const
export const themeCatalogSchema = z.strictObject({
  entries: z
    .array(z.strictObject({ definition: themeDefinitionSchema, builtIn: z.boolean() }))
    .max(MAX_INSTALLED_THEMES + 5),
  issues: z
    .array(z.strictObject({ id: themeIdSchema, message: z.string().min(1).max(300) }))
    .max(MAX_INSTALLED_THEMES),
})
export const themePreviewSchema = z.strictObject({
  token: z.uuid(),
  expiresAt: z.iso.datetime(),
  definition: themeDefinitionSchema,
  action: z.enum(['install', 'update', 'installed']),
  previousVersion: themeVersionSchema.nullable(),
})
export const themeTokenSchema = z.strictObject({ token: z.uuid() })
export const themeRemoveSchema = z.strictObject({ themeId: themeIdSchema })
export const themeErrorSchema = z.strictObject({
  code: z.enum([
    'FORBIDDEN',
    'INVALID_REQUEST',
    'SERVICE_CLOSED',
    'DATABASE_UNAVAILABLE',
    'CANCELLED',
    'THEME_BUSY',
    'INVALID_THEME',
    'THEME_CONFLICT',
    'THEME_LIMIT',
    'PREVIEW_EXPIRED',
    'FILE_ERROR',
  ]),
  message: z.string().min(1),
})
const result = <T extends z.ZodType>(value: T) =>
  z.discriminatedUnion('ok', [
    z.strictObject({ ok: z.literal(true), value }),
    z.strictObject({ ok: z.literal(false), error: themeErrorSchema }),
  ])
export const themeCatalogResultSchema = result(themeCatalogSchema)
export const themePreviewResultSchema = result(themePreviewSchema)
export type ThemeCatalog = z.infer<typeof themeCatalogSchema>
export type ThemePreview = z.infer<typeof themePreviewSchema>
export type ThemeError = z.infer<typeof themeErrorSchema>
export interface ThemesDesktopApi {
  list(): Promise<z.infer<typeof themeCatalogResultSchema>>
  preview(): Promise<z.infer<typeof themePreviewResultSchema>>
  install(
    input: z.infer<typeof themeTokenSchema>,
  ): Promise<z.infer<typeof themeCatalogResultSchema>>
  uninstall(
    input: z.infer<typeof themeRemoveSchema>,
  ): Promise<z.infer<typeof themeCatalogResultSchema>>
}
