import { expect, test } from 'vitest'
import {
  dataLocationsResultSchema,
  directoryOpenResultSchema,
  directoryTargetSchema,
} from '../../src/shared/contracts/data-locations'

const value = {
  dataDirectory: 'C:\\中文 数据\\应用',
  backupDirectory: 'C:\\中文 数据\\应用\\backups',
  logDirectory: 'C:\\中文 数据\\应用\\logs',
  logFile: 'C:\\中文 数据\\应用\\logs\\application.log',
}
test('数据位置完整保留中文空格路径，打开目标仅三个固定枚举', () => {
  expect(dataLocationsResultSchema.parse({ ok: true, value })).toEqual({ ok: true, value })
  for (const target of ['data', 'backups', 'logs'])
    expect(directoryTargetSchema.parse(target)).toBe(target)
  for (const target of ['', '../', 'C:/任意', 'https://example.com', 'application.log'])
    expect(directoryTargetSchema.safeParse(target).success).toBe(false)
})
test.each(['', '\0', 'a'.repeat(32768)])('位置拒绝空值/NUL/超长输入 %#', (path) => {
  expect(
    dataLocationsResultSchema.safeParse({ ok: true, value: { ...value, dataDirectory: path } })
      .success,
  ).toBe(false)
})
test('位置拒绝缺字段与任意文件能力，成功和失败结果严格区分', () => {
  const { logFile: _removed, ...partial } = value
  expect(dataLocationsResultSchema.safeParse({ ok: true, value: partial }).success).toBe(false)
  expect(
    dataLocationsResultSchema.safeParse({ ok: true, value: { ...value, fileContents: 'PRIVATE' } })
      .success,
  ).toBe(false)
  expect(directoryOpenResultSchema.parse({ ok: true, value: null }).ok).toBe(true)
  expect(
    directoryOpenResultSchema.safeParse({ ok: true, value: { path: 'C:/任意' } }).success,
  ).toBe(false)
  for (const code of [
    'FORBIDDEN',
    'INVALID_REQUEST',
    'SERVICE_CLOSED',
    'LOCATION_BUSY',
    'FILE_ERROR',
  ]) {
    expect(
      directoryOpenResultSchema.parse({ ok: false, error: { code, message: '中文反馈' } }).ok,
    ).toBe(false)
    expect(
      directoryOpenResultSchema.safeParse({
        ok: false,
        error: { code, message: '中文反馈', stack: 'PRIVATE' },
      }).success,
    ).toBe(false)
  }
})
