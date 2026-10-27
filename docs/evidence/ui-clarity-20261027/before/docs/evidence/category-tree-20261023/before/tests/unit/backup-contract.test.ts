import { expect, test } from 'vitest'
import {
  backupResultSchema,
  backupSummarySchema,
  backupPreviewResultSchema,
  restoreRequestSchema,
  restoreResultSchema,
} from '../../src/shared/contracts/backup'

const summary = {
  createdAt: '2026-10-22T01:00:00.000Z',
  appVersion: '0.1.0',
  schemaVersion: 6,
  requiresMigration: false,
  topics: 2,
  questions: 3,
  archivedQuestions: 1,
  versions: 5,
  images: 2,
  sessions: 3,
  drafts: 2,
  favorites: 1,
  ratings: 2,
  activeSession: true,
}
test('完整备份摘要保留明确数量、时间和旧格式未知时间', () => {
  expect(backupSummarySchema.parse(summary)).toEqual(summary)
  expect(
    backupSummarySchema.parse({ ...summary, createdAt: null, appVersion: null }).createdAt,
  ).toBeNull()
  expect(
    backupResultSchema.parse({
      ok: true,
      value: { filePath: 'C:/中文 路径/备份.sqlite3', summary },
    }).ok,
  ).toBe(true)
})

test('预览必须携带一次性凭据，恢复仅接收 UUID 并返回保护备份位置', () => {
  const token = '93dc94ba-210c-4e71-97f3-6b7251ca655a'
  const file = { filePath: 'C:/中文 空格/备份.sqlite3', summary }
  expect(backupPreviewResultSchema.safeParse({ ok: true, value: file }).success).toBe(false)
  expect(backupPreviewResultSchema.parse({ ok: true, value: { ...file, token } }).ok).toBe(true)
  expect(restoreRequestSchema.parse({ token })).toEqual({ token })
  for (const request of [{ token: 'path' }, { token, path: 'C:/a' }, {}, { token, sql: 'DELETE' }])
    expect(restoreRequestSchema.safeParse(request).success).toBe(false)
  expect(
    restoreResultSchema.parse({
      ok: true,
      value: { protectionPath: 'C:/data/backups/original.sqlite3' },
    }).ok,
  ).toBe(true)
  expect(restoreResultSchema.safeParse({ ok: true, value: null }).success).toBe(false)
  for (const code of ['PREVIEW_EXPIRED', 'SAVE_FAILED', 'RESTORE_FAILED', 'RECOVERY_FAILED'])
    expect(
      restoreResultSchema.parse({ ok: false, error: { code, message: '已停止恢复。' } }).ok,
    ).toBe(false)
})
test.each([-1, 0.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1])(
  '拒绝非法备份数量 %s',
  (questions) => {
    expect(backupSummarySchema.safeParse({ ...summary, questions }).success).toBe(false)
  },
)
test('拒绝缺字段、未知时间伪造、额外恢复能力和作答原文', () => {
  const { createdAt: _removed, ...incomplete } = summary
  expect(backupSummarySchema.safeParse(incomplete).success).toBe(false)
  expect(backupSummarySchema.safeParse({ ...summary, createdAt: 'yesterday' }).success).toBe(false)
  expect(backupSummarySchema.safeParse({ ...summary, draft: '用户原文' }).success).toBe(false)
  expect(
    backupResultSchema.safeParse({
      ok: true,
      value: { filePath: 'backup', summary, restore: true },
    }).success,
  ).toBe(false)
})
test('取消、忙碌与校验失败严格区分且拒绝日志堆栈', () => {
  for (const code of [
    'CANCELLED',
    'BACKUP_BUSY',
    'INVALID_BACKUP',
    'UNSUPPORTED_BACKUP',
    'EXPORT_FAILED',
  ]) {
    expect(
      backupResultSchema.safeParse({ ok: false, error: { code, message: '中文提示' } }).success,
    ).toBe(true)
    expect(
      backupResultSchema.safeParse({
        ok: false,
        error: { code, message: '中文提示', stack: '私有' },
      }).success,
    ).toBe(false)
  }
})
