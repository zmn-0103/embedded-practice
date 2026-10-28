import { describe, expect, it } from 'vitest'
import {
  compareThemeVersions,
  themeDefinitionSchema,
  themeVariables,
} from '../../src/shared/contracts/themes'
import { BUILTIN_THEMES } from '../../src/shared/themes'

const base = BUILTIN_THEMES[0]!
describe('受限主题包', () => {
  it('五套内置定义来自同一严格契约，变量仅含固定安全令牌', () => {
    expect(new Set(BUILTIN_THEMES.map((theme) => theme.id)).size).toBe(5)
    for (const definition of BUILTIN_THEMES) {
      expect(themeDefinitionSchema.parse(definition)).toEqual(definition)
      const variables = themeVariables(definition)
      expect(Object.keys(variables)).toHaveLength(19)
      expect(Object.values(variables).join('')).not.toMatch(/url\(|@import|[{};]/i)
      expect(variables['--accent']).toBe(
        `light-dark(${definition.light.accent}, ${definition.dark.accent})`,
      )
    }
  })
  it.each([
    { script: 'alert(1)' },
    { css: '*{display:none}' },
    { html: '<div>' },
    { screenshot: 'file:///x' },
    { formatVersion: 2 },
    { id: '../theme' },
    { id: 'x'.repeat(65) },
    { version: '1.0' },
    { version: '1.0.0-beta' },
    { version: '01.0.0' },
    { version: '1000000.0.0' },
    { light: { ...base.light, accent: 'red' } },
    { light: { ...base.light, accent: 'url(https://x)' } },
    { dark: { ...base.dark, extra: '#ffffff' } },
    { presentation: { ...base.presentation, layout: 'free' } },
    { presentation: { ...base.presentation, font: 'C:/font.ttf' } },
    { presentation: { ...base.presentation, radius: 99 } },
    { description: 'x\n隐藏脚本' },
  ])('拒绝不受支持的字段和值 %j', (change) =>
    expect(themeDefinitionSchema.safeParse({ ...base, ...change }).success).toBe(false),
  )
  it('版本按三个数值比较，同版相等，非法输入拒绝', () => {
    expect(compareThemeVersions('1.10.0', '1.2.99')).toBe(1)
    expect(compareThemeVersions('1.0.9', '2.0.0')).toBe(-1)
    expect(compareThemeVersions('0.0.0', '0.0.0')).toBe(0)
    expect(() => compareThemeVersions('../x', '1.0.0')).toThrow()
  })
})

function luminance(hex: string) {
  const channels = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
  return channels
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index]!, 0)
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((a, b) => b - a)
  return (values[0]! + 0.05) / (values[1]! + 0.05)
}
for (const theme of BUILTIN_THEMES)
  for (const mode of ['light', 'dark'] as const) {
    it(`${theme.name}/${mode}正文、按钮、代码、错误与焦点具有可读对比`, () => {
      const c = theme[mode]
      for (const [foreground, background] of [
        [c.text, c.surface],
        [c.muted, c.surface],
        [c.muted, c.background],
        [c.accentInk, c.accent],
        [c.codeKeyword, c.codeBackground],
        [c.codeValue, c.codeBackground],
        [c.error, c.errorSoft],
      ])
        expect(
          contrast(foreground!, background!),
          `${foreground}/${background}`,
        ).toBeGreaterThanOrEqual(4.5)
      expect(contrast(c.focus, c.surface)).toBeGreaterThanOrEqual(3)
    })
  }
