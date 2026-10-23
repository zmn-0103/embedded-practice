import { describe, expect, it } from 'vitest'
import { appearanceSchema, settingsResultSchema } from '../../src/shared/contracts/settings'

describe('显示设置的明确目标与结果边界', () => {
  it('完整接受三主题与 15～22 整数字号，不注入隐藏默认值', () => {
    for (const theme of ['system', 'light', 'dark'])
      for (let fontSize = 15; fontSize <= 22; fontSize++)
        expect(appearanceSchema.parse({ theme, fontSize })).toEqual({ theme, fontSize })
  })
  it.each([
    {},
    { theme: 'system' },
    { fontSize: 17 },
    { theme: 'auto', fontSize: 17 },
    { theme: 'dark', fontSize: 14 },
    { theme: 'dark', fontSize: 23 },
    { theme: 'dark', fontSize: 17.5 },
    { theme: 'dark', fontSize: '17' },
    { theme: 'dark', fontSize: null },
    { theme: 'dark', fontSize: Infinity },
    { theme: '<style>', fontSize: 17 },
    { theme: 'system', fontSize: 17, path: 'private' },
    { theme: 'system', fontSize: 17, sql: 'UPDATE' },
    { theme: 'system', fontSize: 17, css: 'url()' },
  ])('拒绝缺失、非法值和额外能力 %j', (input) => {
    expect(appearanceSchema.safeParse(input).success).toBe(false)
  })
  it('成功必须有实际完整设置，错误不得伪造默认成功或泄露路径', () => {
    expect(
      settingsResultSchema.parse({ ok: true, value: { theme: 'system', fontSize: 17 } }).ok,
    ).toBe(true)
    expect(settingsResultSchema.safeParse({ ok: true, value: {} }).success).toBe(false)
    expect(
      settingsResultSchema.safeParse({ ok: false, value: { theme: 'system', fontSize: 17 } })
        .success,
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
