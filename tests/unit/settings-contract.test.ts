import { describe, expect, it } from 'vitest'
import { appearanceSchema, settingsResultSchema } from '../../src/shared/contracts/settings'

describe('显示设置的明确目标与结果边界', () => {
  it('旧三种明暗、四种配色与15～22字号完整保留，并明确映射内置主题和布局偏好', () => {
    for (const theme of ['system', 'light', 'dark'])
      for (const palette of ['forest', 'ocean', 'sand', 'lilac'])
        for (let fontSize = 15; fontSize <= 22; fontSize++)
          expect(appearanceSchema.parse({ theme, palette, fontSize })).toEqual({
            theme,
            palette,
            fontSize,
            themeId: `builtin.${palette}`,
            navigationCollapsed: false,
            auxiliaryHidden: false,
          })
  })
  it('动态主题ID优先于兼容配色，布局偏好随保存保留且不接收CSS或路径', () => {
    const target = {
      theme: 'dark',
      palette: 'ocean',
      fontSize: 22,
      themeId: 'local.ink',
      navigationCollapsed: true,
      auxiliaryHidden: true,
    }
    expect(appearanceSchema.parse(target)).toEqual(target)
    for (const change of [
      { themeId: '../x' },
      { themeId: '' },
      { navigationCollapsed: 1 },
      { auxiliaryHidden: 'true' },
      { themeId: 'url(https://x)' },
    ])
      expect(appearanceSchema.safeParse({ ...target, ...change }).success).toBe(false)
  })
  it.each([
    {},
    { theme: 'system' },
    { fontSize: 17 },
    { theme: 'system', fontSize: 17 },
    { theme: 'auto', palette: 'forest', fontSize: 17 },
    { theme: 'dark', palette: 'forest', fontSize: 14 },
    { theme: 'dark', palette: 'forest', fontSize: 23 },
    { theme: 'dark', palette: 'forest', fontSize: 17.5 },
    { theme: 'dark', palette: 'forest', fontSize: '17' },
    { theme: 'dark', palette: 'forest', fontSize: null },
    { theme: 'dark', palette: 'forest', fontSize: Infinity },
    { theme: '<style>', palette: 'forest', fontSize: 17 },
    { theme: 'system', palette: 'forest', fontSize: 17, path: 'private' },
    { theme: 'system', palette: 'forest', fontSize: 17, sql: 'UPDATE' },
    { theme: 'system', palette: 'forest', fontSize: 17, css: 'url()' },
    { theme: 'light', palette: 'custom', fontSize: 17 },
    { theme: 'light', palette: null, fontSize: 17 },
    { theme: 'light', palette: 'url(https://example.com)', fontSize: 17 },
    { theme: 'light', palette: { css: 'color:red' }, fontSize: 17 },
  ])('拒绝缺失、非法值和额外能力 %j', (input) => {
    expect(appearanceSchema.safeParse(input).success).toBe(false)
  })
  it('成功必须有实际完整设置，错误不得伪造默认成功或泄露路径', () => {
    expect(
      settingsResultSchema.parse({
        ok: true,
        value: { theme: 'system', palette: 'forest', fontSize: 17 },
      }).ok,
    ).toBe(true)
    expect(settingsResultSchema.safeParse({ ok: true, value: {} }).success).toBe(false)
    expect(
      settingsResultSchema.safeParse({
        ok: false,
        value: { theme: 'system', palette: 'forest', fontSize: 17 },
      }).success,
    ).toBe(false)
    for (const code of ['FORBIDDEN', 'INVALID_REQUEST', 'SERVICE_CLOSED', 'DATABASE_UNAVAILABLE'])
      expect(
        settingsResultSchema.parse({ ok: false, error: { code, message: '操作失败，请重试。' } })
          .ok,
      ).toBe(false)
    expect(
      settingsResultSchema.safeParse({
        ok: false,
        error: { code: 'SQL_ERROR', message: '失败', path: 'private' },
      }).success,
    ).toBe(false)
  })
})
