import { EventEmitter } from 'node:events'
import { randomUUID } from 'node:crypto'
import type { BrowserWindow, IpcMainInvokeEvent } from 'electron'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { registerPracticeIpc } from '../../src/main/ipc/practice'
import type { PracticeService } from '../../src/main/services/practice/practice'
import { PRACTICE_CHANNELS as channels } from '../../src/shared/contracts/practice-desktop'
import type { PracticeView } from '../../src/shared/contracts/practice'

const native = vi.hoisted(() => {
  const handlers = new Map<string, (event: unknown, ...args: unknown[]) => Promise<unknown>>()
  return {
    handlers,
    ipcMain: {
      handle: (name: string, callback: (event: unknown, ...args: unknown[]) => Promise<unknown>) =>
        handlers.set(name, callback),
      removeHandler: (name: string) => handlers.delete(name),
    },
  }
})
vi.mock('electron', () => native)
const registrations: ReturnType<typeof registerPracticeIpc>[] = []
function setup() {
  const frame = { isDestroyed: vi.fn(() => false), url: 'file:///app/index.html' }
  const contents = Object.assign(new EventEmitter(), {
    isDestroyed: vi.fn(() => false),
    mainFrame: frame,
    send: vi.fn(),
  })
  const window = Object.assign(new EventEmitter(), {
    isDestroyed: vi.fn(() => false),
    webContents: contents,
  }) as unknown as BrowserWindow
  const event = { sender: contents, senderFrame: frame } as unknown as IpcMainInvokeEvent
  const id = randomUUID()
  const ack = { sessionId: id, position: 0, revision: 0, total: 1, status: 'active' as const }
  const service: PracticeService = {
    outline: vi.fn(() => ({
      ok: true as const,
      value: {
        ...ack,
        page: 1,
        items: [
          {
            position: 0,
            topicId: 'fixture',
            questionId: 'q-1',
            title: '题1',
            topicTitle: '样本',
            revealed: false,
            rating: null,
            skipped: false,
          },
        ],
      },
    })),
    read: vi.fn(() => ({ ok: true as const, value: null })),
    start: vi.fn(() => ({ ok: true as const, value: ack })),
    saveDraft: vi.fn(() => ({
      ok: true as const,
      value: { sessionId: id, position: 0, draftRevision: 0 },
    })),
    reveal: vi.fn(() => ({ ok: true as const, value: ack })),
    rateAndAdvance: vi.fn(() => ({ ok: true as const, value: ack })),
    navigate: vi.fn(() => ({ ok: true as const, value: ack })),
    end: vi.fn(() => ({ ok: true as const, value: ack })),
    close: vi.fn(),
  }
  const report = vi.fn()
  const registration = registerPracticeIpc(window, frame.url, service, report, 50)
  registrations.push(registration)
  const invoke = (channel: string, ...args: unknown[]) =>
    native.handlers.get(channel)!(event, ...args)
  const lastCloseId = () => (contents.send.mock.lastCall?.[1] as { requestId: string }).requestId
  return { id, service, registration, invoke, report, event, contents, frame, lastCloseId, window }
}
beforeEach(() => {
  native.handlers.clear()
  vi.useFakeTimers()
})
afterEach(() => {
  registrations.splice(0).forEach((value) => value.close())
  vi.useRealTimers()
})

test.each(['sender', 'frame', 'url', 'destroyed', 'frameDestroyed'])(
  '练习拒绝不可信来源 %s',
  async (kind) => {
    const { invoke, event, frame, contents, service } = setup()
    if (kind === 'sender') Reflect.set(event, 'sender', {})
    if (kind === 'frame') Reflect.set(event, 'senderFrame', { ...frame })
    if (kind === 'url') frame.url = 'https://example.com'
    if (kind === 'destroyed') contents.isDestroyed.mockReturnValue(true)
    if (kind === 'frameDestroyed') frame.isDestroyed.mockReturnValue(true)
    expect(await invoke(channels.read, { sessionId: null })).toMatchObject({
      error: { code: 'FORBIDDEN' },
    })
    expect(service.read).not.toHaveBeenCalled()
  },
)
test('八项业务只转发严格白名单参数，来源与输出分别验证', async () => {
  const { id, invoke, service } = setup()
  const command = {
    requestId: randomUUID(),
    cursor: { sessionId: id, position: 0, revision: 0 },
    draft: { revision: 0, text: '' },
  }
  const requests = [
    ['read', { sessionId: null }],
    ['outline', { sessionId: id, page: 1 }],
    ['start', { requestId: randomUUID(), topicId: null, count: 20, replace: null }],
    ['saveDraft', { sessionId: id, position: 0, draft: command.draft }],
    ['reveal', command],
    ['rateAndAdvance', { ...command, rating: '掌握' }],
    ['navigate', { ...command, direction: 'skip' }],
    ['end', command],
  ] as const
  for (const [method, input] of requests) {
    expect(await invoke(channels[method], { ...input, databasePath: 'C:/private' })).toMatchObject({
      error: { code: 'INVALID_REQUEST' },
    })
    expect(service[method]).not.toHaveBeenCalled()
    expect(await invoke(channels[method], input)).toMatchObject({ ok: true })
    expect(service[method]).toHaveBeenCalledExactlyOnceWith(input)
  }
})
test('响应校验错误不把答案、原始 Zod 数据或堆栈返回页面/诊断', async () => {
  const { invoke, service, report } = setup()
  vi.mocked(service.read).mockReturnValueOnce({
    ok: true,
    value: { secretAnswer: '不应进入日志的完整答案' } as unknown as PracticeView,
  })
  const result = await invoke(channels.read, { sessionId: null })
  expect(result).toMatchObject({ error: { code: 'DATABASE_UNAVAILABLE' } })
  expect(JSON.stringify(result)).not.toContain('secretAnswer')
  expect(String(report.mock.calls[0]?.[0])).toBe('Error: 练习桌面接口校验失败。')
})

test.each(['sequential', 'random'])('可信开始请求原样转发模式 %s', async (mode) => {
  const { invoke, service } = setup()
  const input = { requestId: randomUUID(), topicId: null, count: 20, replace: null, mode }
  expect(await invoke(channels.start, input)).toMatchObject({ ok: true })
  expect(service.start).toHaveBeenCalledExactlyOnceWith(input)
})

test('非法开始模式在主进程拒绝，不执行服务', async () => {
  const { invoke, service } = setup()
  const input = {
    requestId: randomUUID(),
    topicId: null,
    count: 20,
    replace: null,
    mode: 'shuffle',
  }
  expect(await invoke(channels.start, input)).toMatchObject({ error: { code: 'INVALID_REQUEST' } })
  expect(service.start).not.toHaveBeenCalled()
})
test('页面未就绪没有待保存输入，之后关闭需同一 UUID 确认', async () => {
  const { invoke, registration, contents, lastCloseId } = setup()
  expect(await registration.requestClose()).toBe(true)
  expect(contents.send).not.toHaveBeenCalled()
  expect(await invoke(channels.ready)).toEqual({ ok: true, value: null })
  const pending = registration.requestClose()
  expect(registration.requestClose()).toBe(pending)
  expect(contents.send).toHaveBeenCalledTimes(1)
  expect(
    await invoke(channels.finishClose, { requestId: randomUUID(), saved: true }),
  ).toMatchObject({ error: { code: 'INVALID_REQUEST' } })
  expect(await invoke(channels.finishClose, { requestId: lastCloseId(), saved: true })).toEqual({
    ok: true,
    value: null,
  })
  expect(await pending).toBe(true)
})
test('失败回执、超时及旧 UUID 不允许当前关闭', async () => {
  const { invoke, registration, lastCloseId } = setup()
  await invoke(channels.ready)
  const first = registration.requestClose(),
    firstId = lastCloseId()
  await invoke(channels.finishClose, { requestId: firstId, saved: false })
  expect(await first).toBe(false)
  const timeout = registration.requestClose()
  await vi.advanceTimersByTimeAsync(50)
  expect(await timeout).toBe(false)
  const next = registration.requestClose(),
    currentId = lastCloseId()
  expect(await invoke(channels.finishClose, { requestId: firstId, saved: true })).toMatchObject({
    error: { code: 'INVALID_REQUEST' },
  })
  await invoke(channels.finishClose, { requestId: currentId, saved: true })
  expect(await next).toBe(true)
})
test.each(['did-start-navigation', 'render-process-gone', 'destroyed'])(
  '页面事件 %s 使待确认关闭失败并释放',
  async (event) => {
    const { invoke, registration, contents } = setup()
    await invoke(channels.ready)
    const pending = registration.requestClose()
    contents.emit(event, {}, 'file:///app/index.html', false, true)
    expect(await pending).toBe(false)
    expect(await registration.requestClose()).toBe(true)
  },
)
test('关闭与发送失败不悬挂，移除全部处理器和监听', async () => {
  const { invoke, registration, contents, report } = setup()
  await invoke(channels.ready)
  contents.send.mockImplementationOnce(() => {
    throw new Error('窗口已消失')
  })
  expect(await registration.requestClose()).toBe(false)
  expect(report).toHaveBeenCalledTimes(1)
  const pending = registration.requestClose()
  registration.close()
  registration.close()
  expect(await pending).toBe(false)
  expect(native.handlers.size).toBe(0)
  expect(contents.eventNames()).toEqual([])
})

test('原生失焦/最小化/隐藏只发空计时通知，关闭解绑且销毁不再发送', () => {
  const { window, contents, registration, service } = setup()
  for (const name of ['blur', 'minimize', 'hide'] as const) window.emit(name)
  expect(contents.send.mock.calls).toEqual([
    [channels.timerPause],
    [channels.timerPause],
    [channels.timerPause],
  ])
  expect(native.handlers.has(channels.timerPause)).toBe(false)
  expect(service.navigate).not.toHaveBeenCalled()
  expect(service.reveal).not.toHaveBeenCalled()
  contents.isDestroyed.mockReturnValue(true)
  window.emit('minimize')
  expect(contents.send).toHaveBeenCalledTimes(3)
  registration.close()
  expect(window.eventNames()).toEqual([])
  window.emit('hide')
  expect(contents.send).toHaveBeenCalledTimes(3)
})
test('计时通知发送失败只报告，不影响业务或关闭清理', async () => {
  const { window, contents, report, invoke, registration } = setup()
  contents.send.mockImplementationOnce(() => {
    throw new Error('injected timer send')
  })
  expect(() => window.emit('minimize')).not.toThrow()
  expect(report).toHaveBeenCalledTimes(1)
  expect(await invoke(channels.read, { sessionId: null })).toEqual({ ok: true, value: null })
  registration.close()
  expect(window.eventNames()).toEqual([])
})
test('恢复暂停拒绝业务写入，失败恢复后通知窗口复位关闭状态', async () => {
  const { invoke, registration, contents, service } = setup()
  registration.pause()
  const input = {
    requestId: randomUUID(),
    topicId: null,
    count: 20,
    replace: null,
    mode: 'sequential',
  }
  expect(await invoke(channels.start, input)).toMatchObject({ error: { code: 'SERVICE_CLOSED' } })
  expect(service.start).not.toHaveBeenCalled()
  registration.resume()
  expect(contents.send).toHaveBeenCalledWith(channels.closeCancelled)
  expect(await invoke(channels.start, input)).toMatchObject({ ok: true })
  registration.close()
  contents.send.mockClear()
  registration.resume()
  expect(contents.send).not.toHaveBeenCalled()
})
