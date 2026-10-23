import { describe, expect, it } from 'vitest'
import { appStatusResultSchema, startupRecordSchema } from '../../src/shared/contracts/application'

const validRecord = { launchCount: 1, lastStartedAt: '2026-10-19T00:00:00.000Z' }

describe('桌面状态数据边界', () => {
  it('接受完整的真实启动记录', () => {
    expect(
      appStatusResultSchema.parse({
        ok: true,
        value: { appVersion: '0.1.0', ...validRecord },
      }).ok,
    ).toBe(true)
  })

  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    '拒绝损坏或无法精确表示的启动次数：%s',
    (launchCount) => {
      expect(startupRecordSchema.safeParse({ ...validRecord, launchCount }).success).toBe(false)
    },
  )

  it('拒绝无效启动时间', () => {
    expect(
      startupRecordSchema.safeParse({ ...validRecord, lastStartedAt: '2026-99-99' }).success,
    ).toBe(false)
  })

  it('拒绝将错误堆栈作为界面响应字段', () => {
    expect(
      appStatusResultSchema.safeParse({
        ok: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: '无法读取。', stack: 'private stack' },
      }).success,
    ).toBe(false)
  })
})
