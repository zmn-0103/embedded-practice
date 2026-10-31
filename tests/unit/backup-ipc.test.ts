import { EventEmitter } from 'node:events'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import type { BrowserWindow, IpcMainInvokeEvent } from 'electron'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { registerBackupIpc } from '../../src/main/ipc/backup'
import { BackupFault } from '../../src/main/services/backup/validate-backup'
import type { BackupService } from '../../src/main/services/backup/backup'
import { BACKUP_CHANNELS, type BackupFile } from '../../src/shared/contracts/backup'

const native = vi.hoisted(() => ({
  handlers: new Map<string, (event: unknown, ...args: unknown[]) => Promise<unknown>>(),
  dialog: { showSaveDialog: vi.fn(), showOpenDialog: vi.fn(), showMessageBox: vi.fn() },
}))
vi.mock('electron', () => ({
  dialog: native.dialog,
  ipcMain: {
    handle: (name: string, callback: (event: unknown, ...args: unknown[]) => Promise<unknown>) =>
      native.handlers.set(name, callback),
    removeHandler: (name: string) => native.handlers.delete(name),
  },
}))
const file: BackupFile = {
  filePath: resolve('中文 空格', '备份.sqlite3'),
  summary: {
    createdAt: '2026-10-22T01:00:00.000Z',
    appVersion: '0.1.0',
    schemaVersion: 6,
    requiresMigration: false,
    topics: 1,
    categories: 0,
    practicePlans: 0,
    installedThemes: 0,
    appearance: {
      theme: 'system',
      palette: 'forest',
      fontSize: 17,
      themeId: 'builtin.forest',
      navigationCollapsed: false,
      auxiliaryHidden: false,
    },
    questions: 2,
    archivedQuestions: 0,
    versions: 3,
    images: 1,
    sessions: 1,
    drafts: 1,
    favorites: 1,
    ratings: 0,
    activeSession: true,
  },
}
const registrations: ReturnType<typeof registerBackupIpc>[] = []
const preview = { ...file, token: randomUUID() }
function setup(unavailable = false) {
  const frame = { isDestroyed: vi.fn(() => false), url: 'file:///app/index.html' }
  const contents = Object.assign(new EventEmitter(), {
    isDestroyed: vi.fn(() => false),
    mainFrame: frame,
  })
  const window = {
    isDestroyed: vi.fn(() => false),
    webContents: contents,
  } as unknown as BrowserWindow
  const event = { sender: contents, senderFrame: frame } as unknown as IpcMainInvokeEvent
  const service: BackupService = {
    export: vi.fn(async () => file),
    preview: vi.fn(async () => preview),
    discardPreview: vi.fn(async () => {}),
    prepareRestore: vi.fn(async () => {
      throw new Error('本组测试不直接调用服务恢复。')
    }),
    close: vi.fn(async () => {}),
  }
  const report = vi.fn()
  const restore = vi.fn(async (_token: string) => ({
    protectionPath: 'C:/data/backups/protection.sqlite3',
  }))
  const registration = registerBackupIpc(
    window,
    frame.url,
    unavailable ? undefined : service,
    report,
    restore,
  )
  registrations.push(registration)
  const invoke = (kind: 'export' | 'preview' | 'restore', ...args: unknown[]) =>
    native.handlers.get(BACKUP_CHANNELS[kind])!(event, ...args)
  return { frame, contents, event, service, report, registration, invoke, restore }
}
beforeEach(() => {
  native.handlers.clear()
  vi.resetAllMocks()
  native.dialog.showSaveDialog.mockResolvedValue({ canceled: false, filePath: file.filePath })
  native.dialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [file.filePath] })
  native.dialog.showMessageBox.mockResolvedValue({ response: 1, checkboxChecked: false })
})
afterEach(async () => {
  await Promise.all(registrations.splice(0).map((r) => r.close()))
})

test.each(['sender', 'frame', 'url', 'destroyed', 'frameDestroyed'])(
  '备份拒绝不可信来源 %s',
  async (kind) => {
    const s = setup()
    if (kind === 'sender') Reflect.set(s.event, 'sender', {})
    if (kind === 'frame') Reflect.set(s.event, 'senderFrame', { ...s.frame })
    if (kind === 'url') s.frame.url = 'https://example.com'
    if (kind === 'destroyed') s.contents.isDestroyed.mockReturnValue(true)
    if (kind === 'frameDestroyed') s.frame.isDestroyed.mockReturnValue(true)
    expect(await s.invoke('export')).toMatchObject({ error: { code: 'FORBIDDEN' } })
    expect(native.dialog.showSaveDialog).not.toHaveBeenCalled()
    expect(s.service.export).not.toHaveBeenCalled()
  },
)
test.each(['export', 'preview'] as const)(
  '备份 %s 拒绝任意路径参数并只用系统选择结果',
  async (kind) => {
    const s = setup()
    expect(await s.invoke(kind, 'C:/任意.sqlite3')).toMatchObject({
      error: { code: 'INVALID_REQUEST' },
    })
    expect(await s.invoke(kind)).toEqual({ ok: true, value: kind === 'preview' ? preview : file })
    expect(s.service[kind]).toHaveBeenCalledExactlyOnceWith(file.filePath)
  },
)
test.each(['export', 'preview'] as const)('备份 %s 取消不调用服务', async (kind) => {
  const s = setup()
  native.dialog.showSaveDialog.mockResolvedValue({ canceled: true })
  native.dialog.showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] })
  expect(await s.invoke(kind)).toMatchObject({ error: { code: 'CANCELLED' } })
  expect(s.service[kind]).not.toHaveBeenCalled()
})
test('备份未就绪、非法路径与无效输出均明确报错', async () => {
  const unavailable = setup(true)
  expect(await unavailable.invoke('export')).toMatchObject({
    error: { code: 'DATABASE_UNAVAILABLE' },
  })
  const s = setup()
  native.dialog.showSaveDialog.mockResolvedValue({ canceled: false, filePath: 'relative.sqlite3' })
  expect(await s.invoke('export')).toMatchObject({ error: { code: 'FILE_ERROR' } })
  native.dialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [file.filePath] })
  vi.mocked(s.service.preview).mockResolvedValue({
    ...preview,
    summary: { ...file.summary, questions: -1 },
  })
  expect(await s.invoke('preview')).toMatchObject({ error: { code: 'INVALID_BACKUP' } })
})
test('明确版本错误透传，原始内容不进入意外异常日志', async () => {
  const s = setup()
  vi.mocked(s.service.preview).mockRejectedValue(
    new BackupFault('UNSUPPORTED_BACKUP', '结构版本过新。'),
  )
  expect(await s.invoke('preview')).toEqual({
    ok: false,
    error: { code: 'UNSUPPORTED_BACKUP', message: '结构版本过新。' },
  })
  vi.mocked(s.service.export).mockRejectedValue(new Error('PRIVATE-DRAFT-ANSWER'))
  expect(await s.invoke('export')).toMatchObject({ error: { code: 'EXPORT_FAILED' } })
  expect(s.report).toHaveBeenCalledTimes(1)
  expect(s.report.mock.calls[0]![0].message).not.toContain('PRIVATE-DRAFT-ANSWER')
})
test('选择中忙碌，来源变化后拒绝执行，随后可重试', async () => {
  const s = setup()
  let select!: (value: unknown) => void
  native.dialog.showSaveDialog.mockImplementation(
    () =>
      new Promise((resolve) => {
        select = resolve
      }),
  )
  const pending = s.invoke('export')
  expect(await s.invoke('preview')).toMatchObject({ error: { code: 'BACKUP_BUSY' } })
  await vi.waitFor(() => expect(native.dialog.showSaveDialog).toHaveBeenCalledTimes(1))
  s.frame.url = 'https://example.com'
  select({ canceled: false, filePath: file.filePath })
  expect(await pending).toMatchObject({ error: { code: 'CANCELLED' } })
  expect(s.service.export).not.toHaveBeenCalled()
  s.frame.url = 'file:///app/index.html'
  expect(await s.invoke('preview')).toEqual({ ok: true, value: preview })
})
test('关闭取消未完成选择，移除处理器和监听且不写数据', async () => {
  const s = setup()
  native.dialog.showOpenDialog.mockImplementation(() => new Promise(() => {}))
  const pending = s.invoke('preview')
  await s.registration.close()
  expect(await pending).toMatchObject({ error: { code: 'CANCELLED' } })
  expect(s.service.preview).not.toHaveBeenCalled()
  expect(native.handlers.size).toBe(0)
  expect(s.contents.listenerCount('did-start-navigation')).toBe(0)
})
test('退出等待已开始导出完成，期间拒绝第二次操作', async () => {
  const s = setup()
  let finish!: (value: BackupFile) => void
  vi.mocked(s.service.export).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const pending = s.invoke('export')
  await vi.waitFor(() => expect(s.service.export).toHaveBeenCalledTimes(1))
  expect(await s.invoke('preview')).toMatchObject({ error: { code: 'BACKUP_BUSY' } })
  let closed = false
  const closing = s.registration.close().then(() => {
    closed = true
  })
  await Promise.resolve()
  expect(closed).toBe(false)
  finish(file)
  expect(await pending).toEqual({ ok: true, value: file })
  await closing
  expect(closed).toBe(true)
})
test('导航使未完成文件选择失效，晚到路径不能开始备份', async () => {
  const s = setup()
  let select!: (value: unknown) => void
  native.dialog.showSaveDialog.mockImplementation(
    () =>
      new Promise((resolve) => {
        select = resolve
      }),
  )
  const pending = s.invoke('export')
  await vi.waitFor(() => expect(native.dialog.showSaveDialog).toHaveBeenCalledTimes(1))
  s.contents.emit('did-start-navigation', {}, 'file:///other', false, true)
  expect(await pending).toMatchObject({ error: { code: 'CANCELLED' } })
  select({ canceled: false, filePath: file.filePath })
  await Promise.resolve()
  expect(s.service.export).not.toHaveBeenCalled()
})

test('恢复只接收当前预览的一次性 UUID，拒绝路径、额外字段和旧凭据', async () => {
  const s = setup()
  for (const args of [[], ['C:/a'], [{ token: 'bad' }], [{ token: preview.token, path: 'C:/a' }]])
    expect(await s.invoke('restore', ...args)).toMatchObject({ error: { code: 'INVALID_REQUEST' } })
  expect(await s.invoke('restore', { token: preview.token })).toMatchObject({
    error: { code: 'PREVIEW_EXPIRED' },
  })
  await s.invoke('preview')
  expect(await s.invoke('restore', { token: randomUUID() })).toMatchObject({
    error: { code: 'PREVIEW_EXPIRED' },
  })
  expect(await s.invoke('restore', { token: preview.token })).toMatchObject({ ok: true })
  expect(s.restore).toHaveBeenCalledExactlyOnceWith(preview.token)
  expect(await s.invoke('restore', { token: preview.token })).toMatchObject({
    error: { code: 'PREVIEW_EXPIRED' },
  })
})

test('恢复确认默认取消且摘要来自已校验预览，取消不执行并可再次确认', async () => {
  const s = setup()
  await s.invoke('preview')
  native.dialog.showMessageBox.mockResolvedValueOnce({ response: 0 })
  expect(await s.invoke('restore', { token: preview.token })).toMatchObject({
    error: { code: 'CANCELLED' },
  })
  expect(s.restore).not.toHaveBeenCalled()
  expect(native.dialog.showMessageBox.mock.calls[0]![1]).toMatchObject({
    defaultId: 0,
    cancelId: 0,
    detail: expect.stringContaining(file.filePath),
  })
  expect(await s.invoke('restore', { token: preview.token })).toMatchObject({ ok: true })
})

test('恢复仍验证来源，保存失败反馈不包含用户原文或堆栈', async () => {
  const s = setup()
  await s.invoke('preview')
  s.frame.url = 'https://example.com'
  expect(await s.invoke('restore', { token: preview.token })).toMatchObject({
    error: { code: 'FORBIDDEN' },
  })
  s.frame.url = 'file:///app/index.html'
  s.restore.mockRejectedValueOnce(new BackupFault('SAVE_FAILED', '尚未保存。'))
  expect(await s.invoke('restore', { token: preview.token })).toEqual({
    ok: false,
    error: { code: 'SAVE_FAILED', message: '尚未保存。' },
  })
  s.restore.mockRejectedValueOnce(new Error('PRIVATE ANSWER'))
  expect(await s.invoke('restore', { token: preview.token })).toMatchObject({
    error: { code: 'RESTORE_FAILED' },
  })
  expect(JSON.stringify(s.report.mock.calls.map(([e]) => e.message))).not.toContain(
    'PRIVATE ANSWER',
  )
})

test('恢复确认期间忙碌，导航使确认失效且清除原预览', async () => {
  const s = setup()
  await s.invoke('preview')
  let confirm!: (value: unknown) => void
  native.dialog.showMessageBox.mockImplementation(
    () =>
      new Promise((resolve) => {
        confirm = resolve
      }),
  )
  const pending = s.invoke('restore', { token: preview.token })
  expect(await s.invoke('export')).toMatchObject({ error: { code: 'BACKUP_BUSY' } })
  s.contents.emit('did-start-navigation', {}, 'file:///other', false, true)
  expect(await pending).toMatchObject({ error: { code: 'CANCELLED' } })
  confirm({ response: 1 })
  expect(s.restore).not.toHaveBeenCalled()
  expect(await s.invoke('restore', { token: preview.token })).toMatchObject({
    error: { code: 'PREVIEW_EXPIRED' },
  })
})

test('新导出即使取消也使旧预览失效，晚到预览不能重新授权', async () => {
  const s = setup()
  await s.invoke('preview')
  native.dialog.showSaveDialog.mockResolvedValueOnce({ canceled: true })
  await s.invoke('export')
  expect(await s.invoke('restore', { token: preview.token })).toMatchObject({
    error: { code: 'PREVIEW_EXPIRED' },
  })
  let finish!: (value: typeof preview) => void
  vi.mocked(s.service.preview).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const pending = s.invoke('preview')
  await vi.waitFor(() => expect(s.service.preview).toHaveBeenCalledTimes(2))
  s.contents.emit('render-process-gone')
  finish(preview)
  expect(await pending).toMatchObject({ error: { code: 'CANCELLED' } })
  expect(s.service.discardPreview).toHaveBeenCalled()
})
