import { EventEmitter } from 'node:events'
import { join, resolve } from 'node:path'
import type { BrowserWindow, IpcMainInvokeEvent } from 'electron'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { registerDataLocationsIpc } from '../../src/main/ipc/data-locations'
import { DATA_LOCATION_CHANNELS } from '../../src/shared/contracts/data-locations'

const native = vi.hoisted(() => ({
  handlers: new Map<string, (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown>(),
  openPath: vi.fn(),
  mkdir: vi.fn(),
  lstat: vi.fn(),
  realpath: vi.fn(),
}))
vi.mock('electron', () => ({
  shell: { openPath: native.openPath },
  ipcMain: {
    handle: (
      channel: string,
      handler: (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown,
    ) => native.handlers.set(channel, handler),
    removeHandler: (channel: string) => native.handlers.delete(channel),
  },
}))
vi.mock('node:fs/promises', () => ({
  mkdir: native.mkdir,
  lstat: native.lstat,
  realpath: native.realpath,
}))
const directory = resolve('C:/独立 数据/刷题本')
const registrations: ReturnType<typeof registerDataLocationsIpc>[] = []
function setup() {
  const frame = { url: 'file:///app/index.html', isDestroyed: vi.fn(() => false) }
  const contents = Object.assign(new EventEmitter(), {
    mainFrame: frame,
    isDestroyed: vi.fn(() => false),
  })
  const window = {
    webContents: contents,
    isDestroyed: vi.fn(() => false),
  } as unknown as BrowserWindow
  const event = { sender: contents, senderFrame: frame } as unknown as IpcMainInvokeEvent
  const report = vi.fn()
  const registration = registerDataLocationsIpc(window, frame.url, directory, report)
  registrations.push(registration)
  const invoke = (kind: 'read' | 'open', ...args: unknown[]) =>
    native.handlers.get(DATA_LOCATION_CHANNELS[kind])!(event, ...args)
  return { frame, contents, window, event, report, registration, invoke }
}
beforeEach(() => {
  vi.resetAllMocks()
  native.handlers.clear()
  native.openPath.mockResolvedValue('')
  native.mkdir.mockResolvedValue(undefined)
  native.lstat.mockResolvedValue({ isDirectory: () => true, isSymbolicLink: () => false })
  native.realpath.mockImplementation(async (path: string) => path)
})
afterEach(async () => {
  await Promise.all(registrations.splice(0).map((registration) => registration.close()))
})

test('位置读取独立于数据库且没有文件系统/打开副作用', async () => {
  const s = setup()
  expect(await s.invoke('read')).toEqual({
    ok: true,
    value: {
      dataDirectory: directory,
      backupDirectory: join(directory, 'backups'),
      logDirectory: join(directory, 'logs'),
      logFile: join(directory, 'logs', 'application.log'),
    },
  })
  expect(native.realpath).not.toHaveBeenCalled()
  expect(native.mkdir).not.toHaveBeenCalled()
  expect(native.openPath).not.toHaveBeenCalled()
})
test.each(['sender', 'frame', 'url', 'destroyed', 'frameDestroyed'] as const)(
  '数据位置拒绝不可信来源 %s',
  async (kind) => {
    const s = setup()
    if (kind === 'sender') Reflect.set(s.event, 'sender', {})
    if (kind === 'frame') Reflect.set(s.event, 'senderFrame', { ...s.frame })
    if (kind === 'url') s.frame.url = 'https://example.com'
    if (kind === 'destroyed') s.contents.isDestroyed.mockReturnValue(true)
    if (kind === 'frameDestroyed') s.frame.isDestroyed.mockReturnValue(true)
    expect(await s.invoke('read')).toMatchObject({ error: { code: 'FORBIDDEN' } })
    expect(await s.invoke('open', 'logs')).toMatchObject({ error: { code: 'FORBIDDEN' } })
    expect(native.realpath).not.toHaveBeenCalled()
  },
)
test('参数校验拒绝任意路径、额外字段、缺参数和读取入参', async () => {
  const s = setup()
  expect(await s.invoke('read', 'data')).toMatchObject({ error: { code: 'INVALID_REQUEST' } })
  for (const args of [
    [],
    ['../'],
    ['C:/private'],
    [{ target: 'logs', path: 'C:/x' }],
    ['data', 'C:/x'],
  ])
    expect(await s.invoke('open', ...args)).toMatchObject({ error: { code: 'INVALID_REQUEST' } })
  expect(native.realpath).not.toHaveBeenCalled()
})
test.each(['data', 'backups', 'logs'] as const)(
  '打开 %s 只作用于实际根的固定文件夹',
  async (target) => {
    const s = setup()
    expect(await s.invoke('open', target)).toEqual({ ok: true, value: null })
    const expected = target === 'data' ? directory : join(directory, target)
    expect(native.openPath).toHaveBeenCalledExactlyOnceWith(expected)
    if (target === 'data') expect(native.mkdir).not.toHaveBeenCalled()
    else expect(native.mkdir).toHaveBeenCalledExactlyOnceWith(expected)
  },
)
test('已有空目录可以打开，EEXIST 不当作写入失败', async () => {
  const s = setup()
  native.mkdir.mockRejectedValueOnce(Object.assign(new Error('exists'), { code: 'EEXIST' }))
  expect(await s.invoke('open', 'logs')).toEqual({ ok: true, value: null })
})

test('Windows 同一目录大小写不同仍打开真实路径', async () => {
  const s = setup()
  const actual = join(directory, 'Logs')
  native.realpath.mockResolvedValueOnce(directory).mockResolvedValueOnce(actual)
  native.mkdir.mockRejectedValueOnce(Object.assign(new Error('exists'), { code: 'EEXIST' }))
  expect(await s.invoke('open', 'logs')).toEqual({ ok: true, value: null })
  expect(native.openPath).toHaveBeenCalledExactlyOnceWith(actual)
})
test.each([
  'missing-root',
  'mkdir',
  'file',
  'link',
  'changed',
  'shell-error',
  'shell-reject',
] as const)('位置 %s 失败保持明确错误且可重试', async (kind) => {
  const s = setup()
  if (kind === 'missing-root') native.realpath.mockRejectedValueOnce(new Error('PRIVATE-PATH'))
  if (kind === 'mkdir') native.mkdir.mockRejectedValueOnce(new Error('PRIVATE-PATH'))
  if (kind === 'file')
    native.lstat.mockResolvedValueOnce({ isDirectory: () => false, isSymbolicLink: () => false })
  if (kind === 'link')
    native.lstat.mockResolvedValueOnce({ isDirectory: () => false, isSymbolicLink: () => true })
  if (kind === 'changed')
    native.realpath.mockResolvedValueOnce(directory).mockResolvedValueOnce(join(directory, 'other'))
  if (kind === 'shell-error') native.openPath.mockResolvedValueOnce('PRIVATE-PATH')
  if (kind === 'shell-reject') native.openPath.mockRejectedValueOnce(new Error('PRIVATE-PATH'))
  expect(await s.invoke('open', 'logs')).toMatchObject({ error: { code: 'FILE_ERROR' } })
  expect(JSON.stringify(s.report.mock.calls.map(([error]) => error.message))).not.toContain(
    'PRIVATE-PATH',
  )
  expect(await s.invoke('open', 'logs')).toEqual({ ok: true, value: null })
})
test('打开中忙碌，暂停和关闭等待在途响应，暂停后可以恢复', async () => {
  const s = setup()
  let finish!: (error: string) => void
  native.openPath.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const pending = s.invoke('open', 'logs')
  await vi.waitFor(() => expect(native.openPath).toHaveBeenCalledTimes(1))
  expect(await s.invoke('open', 'data')).toMatchObject({ error: { code: 'LOCATION_BUSY' } })
  let paused = false
  const pausing = s.registration.pause().then(() => {
    paused = true
  })
  expect(await s.invoke('read')).toMatchObject({ error: { code: 'SERVICE_CLOSED' } })
  await Promise.resolve()
  expect(paused).toBe(false)
  finish('')
  expect(await pending).toMatchObject({ error: { code: 'SERVICE_CLOSED' } })
  await pausing
  s.registration.resume()
  expect(await s.invoke('read')).toMatchObject({ ok: true })
  const handler = native.handlers.get(DATA_LOCATION_CHANNELS.open)!
  await s.registration.close()
  expect(native.handlers.size).toBe(0)
  expect(s.contents.eventNames()).toEqual([])
  expect(await handler(s.event, 'data')).toMatchObject({ error: { code: 'SERVICE_CLOSED' } })
})
test.each(['close', 'navigation', 'source'] as const)(
  '首个异步边界后 %s 不能晚到打开或建立目录',
  async (kind) => {
    const s = setup()
    let root!: (path: string) => void
    native.realpath.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          root = resolve
        }),
    )
    const pending = s.invoke('open', 'logs')
    const closing = kind === 'close' ? s.registration.close() : undefined
    if (kind === 'navigation')
      s.contents.emit('did-start-navigation', {}, 'file:///other', false, true)
    if (kind === 'source') s.frame.url = 'https://example.com'
    root(directory)
    expect(await pending).toMatchObject({ error: { code: 'SERVICE_CLOSED' } })
    await closing
    expect(native.mkdir).not.toHaveBeenCalled()
    expect(native.openPath).not.toHaveBeenCalled()
  },
)
