import { EventEmitter } from 'node:events'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { BrowserWindow, IpcMainInvokeEvent, Session } from 'electron'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerLibraryIpc } from '../../src/main/ipc/library'
import { registerImageProtocol } from '../../src/main/services/resources/image-protocol'
import type { LibraryImportService } from '../../src/main/services/library/library-import'
import { imageResourceUrl } from '../../src/shared/contracts/content-urls'
import { LIBRARY_CHANNELS } from '../../src/shared/contracts/library-desktop'
import { HISTORY_CHANNELS } from '../../src/shared/contracts/history'
import { LEARNING_CHANNEL } from '../../src/shared/contracts/learning'
import { SETTINGS_CHANNELS } from '../../src/shared/contracts/settings'
import { CATEGORY_CHANNEL } from '../../src/shared/contracts/categories'
import { CategoryFault } from '../../src/main/database/repositories/category-repository'
import { PRACTICE_PLAN_CHANNELS } from '../../src/shared/contracts/practice-plans'
import { PracticePlanFault } from '../../src/main/database/repositories/practice-plan-repository'
import { EMPTY_QUESTION_FILTERS } from '../../src/shared/contracts/question-filters'
import type { ImportPreview } from '../../src/shared/contracts/library-import'
import { withImportDirectory } from '../helpers/import-directory'

const native = vi.hoisted(() => {
  const handlers = new Map<string, (event: unknown, ...args: unknown[]) => Promise<unknown>>()
  return {
    handlers,
    ipcMain: {
      handle: (name: string, callback: (event: unknown, ...args: unknown[]) => Promise<unknown>) =>
        handlers.set(name, callback),
      removeHandler: (name: string) => handlers.delete(name),
    },
    dialog: { showOpenDialog: vi.fn(), showSaveDialog: vi.fn() },
    shell: { openExternal: vi.fn() },
    clipboard: { writeText: vi.fn() },
  }
})
vi.mock('electron', () => native)
const counts = {
  added: 1,
  updated: 0,
  metadata: 0,
  unchanged: 0,
  archived: 0,
  restored: 0,
  newVersions: 1,
}
const preview: ImportPreview = {
  token: randomUUID(),
  expiresAt: '2099-01-01T00:00:00.000Z',
  summary: {
    counts,
    topics: [
      {
        topicId: 'unit',
        topicTitle: '单元夹具',
        metadataChanged: true,
        counts,
        questions: [{ questionId: 'q-1', kind: 'added', contentChanged: true }],
      },
    ],
  },
}
const registrations: ReturnType<typeof registerLibraryIpc>[] = []

function setup() {
  const frame = { isDestroyed: vi.fn(() => false), url: 'file:///app/index.html' }
  const contents = Object.assign(new EventEmitter(), {
    isDestroyed: vi.fn(() => false),
    mainFrame: frame,
  })
  const window = {
    isDestroyed: vi.fn(() => false),
    webContents: contents,
  } as unknown as BrowserWindow
  const event = { senderFrame: frame, sender: contents } as unknown as IpcMainInvokeEvent
  const service: LibraryImportService = {
    preview: vi.fn(async () => ({ ok: true as const, value: preview })),
    commit: vi.fn(() => ({ ok: true as const, value: { revision: 1, summary: preview.summary } })),
    discard: vi.fn(() => ({ ok: true as const, value: null })),
    close: vi.fn(async () => {}),
    updateCategory: vi.fn(() => {}),
    listPracticePlans: vi.fn(() => []),
    changePracticePlan: vi.fn(() => {}),
    listQuestions: vi.fn(() => ({
      revision: 0,
      page: 1,
      pageSize: 20 as const,
      total: 0,
      tagOptions: [],
      categories: [],
      topics: [],
      questions: [],
    })),
    getQuestion: vi.fn(() => undefined),
    setFavorite: vi.fn((setting) => ({ ...setting })),
    getAnswer: vi.fn(() => undefined),
    readImage: vi.fn(() => undefined),
    listHistory: vi.fn(() => undefined),
    getHistoryEntry: vi.fn(() => undefined),
    readSettings: vi.fn(() => ({
      theme: 'system' as const,
      palette: 'forest' as const,
      fontSize: 17,
    })),
    saveSettings: vi.fn((settings) => ({ ...settings })),
    readLearningSummary: vi.fn((scope) => ({
      ...scope,
      category: scope.category ?? { kind: 'all' as const },
      categories: [],
      topics: [],
      total: 0,
      revealed: 0,
      rated: 0,
      favorites: 0,
      contentUpdated: 0,
      ratings: { 不会: 0, 不熟: 0, 掌握: 0 },
    })),
  }
  const report = vi.fn()
  const registration = registerLibraryIpc(window, frame.url, service, report)
  registrations.push(registration)
  const invoke = (name: string, ...args: unknown[]) => native.handlers.get(name)!(event, ...args)
  return { service, registration, invoke, frame, contents, event, report }
}
beforeEach(() => {
  native.handlers.clear()
  native.dialog.showOpenDialog
    .mockReset()
    .mockResolvedValue({ canceled: false, filePaths: [resolve('fixture.md')] })
  native.dialog.showSaveDialog.mockReset().mockResolvedValue({ canceled: true, filePath: '' })
  native.shell.openExternal.mockReset().mockResolvedValue(undefined)
  native.clipboard.writeText.mockReset()
})
afterEach(async () => {
  await Promise.all(registrations.splice(0).map((registration) => registration.close()))
})

describe('题库 IPC 的来源、参数与任务边界（受控原生能力）', () => {
  it('方案只读/写入重新校验来源和严格参数，恢复暂停与关闭不执行', async () => {
    const { service, invoke, frame, registration, event } = setup()
    const command = {
      kind: 'save',
      planId: randomUUID(),
      name: ' A ',
      options: {
        category: { kind: 'all' },
        topicId: null,
        mode: 'random',
        count: 20,
        filters: { ...EMPTY_QUESTION_FILTERS },
      },
    }
    expect(await invoke(PRACTICE_PLAN_CHANNELS.list)).toEqual({ ok: true, value: [] })
    expect(await invoke(PRACTICE_PLAN_CHANNELS.change, command)).toEqual({ ok: true, value: null })
    expect(service.changePracticePlan).toHaveBeenCalledExactlyOnceWith({ ...command, name: 'A' })
    expect(await invoke(PRACTICE_PLAN_CHANNELS.list, {})).toMatchObject({
      error: { code: 'INVALID_REQUEST' },
    })
    for (const args of [
      [],
      [{ ...command, sql: 'DELETE' }],
      [{ ...command, options: { ...command.options, filters: {} } }],
    ])
      expect(await invoke(PRACTICE_PLAN_CHANNELS.change, ...args)).toMatchObject({
        error: { code: 'INVALID_REQUEST' },
      })
    frame.url = 'https://example.com'
    expect(await invoke(PRACTICE_PLAN_CHANNELS.list)).toMatchObject({
      error: { code: 'FORBIDDEN' },
    })
    expect(await invoke(PRACTICE_PLAN_CHANNELS.change, command)).toMatchObject({
      error: { code: 'FORBIDDEN' },
    })
    frame.url = 'file:///app/index.html'
    await registration.pause()
    expect(await invoke(PRACTICE_PLAN_CHANNELS.change, command)).toMatchObject({
      error: { code: 'SERVICE_CLOSED' },
    })
    registration.resume()
    const handler = native.handlers.get(PRACTICE_PLAN_CHANNELS.change)!
    await registration.close()
    for (const channel of Object.values(PRACTICE_PLAN_CHANNELS))
      expect(native.handlers.has(channel)).toBe(false)
    expect(await handler(event, command)).toMatchObject({ error: { code: 'SERVICE_CLOSED' } })
    expect(service.changePracticePlan).toHaveBeenCalledTimes(1)
  })
  it('方案目标错误明确返回，未知异常不泄漏SQL或路径', async () => {
    const { service, invoke, report } = setup()
    const command = { kind: 'delete', planId: randomUUID() }
    vi.mocked(service.changePracticePlan).mockImplementationOnce(() => {
      throw new PracticePlanFault('NOT_FOUND', '目标已失效。')
    })
    expect(await invoke(PRACTICE_PLAN_CHANNELS.change, command)).toEqual({
      ok: false,
      error: { code: 'NOT_FOUND', message: '目标已失效。' },
    })
    expect(report).not.toHaveBeenCalled()
    vi.mocked(service.changePracticePlan).mockImplementationOnce(() => {
      throw new Error('private SQL and path')
    })
    const result = await invoke(PRACTICE_PLAN_CHANNELS.change, command)
    expect(result).toMatchObject({ error: { code: 'DATABASE_UNAVAILABLE' } })
    expect(JSON.stringify(result)).not.toContain('private')
    expect(report).toHaveBeenCalledOnce()
  })
  it('分类写入重新校验来源/参数，暂停与关闭后不写入', async () => {
    const { service, invoke, frame, registration, event } = setup()
    expect(await invoke(CATEGORY_CHANNEL, { kind: 'create', title: ' A ' })).toEqual({
      ok: true,
      value: null,
    })
    expect(service.updateCategory).toHaveBeenCalledExactlyOnceWith({ kind: 'create', title: 'A' })
    for (const args of [
      [],
      [{ kind: 'delete', categoryId: '../x' }],
      [{ kind: 'create', title: 'A', sql: 'DELETE' }],
    ])
      expect(await invoke(CATEGORY_CHANNEL, ...args)).toMatchObject({
        error: { code: 'INVALID_REQUEST' },
      })
    frame.url = 'https://example.com'
    expect(await invoke(CATEGORY_CHANNEL, { kind: 'create', title: 'A' })).toMatchObject({
      error: { code: 'FORBIDDEN' },
    })
    frame.url = 'file:///app/index.html'
    await registration.pause()
    expect(await invoke(CATEGORY_CHANNEL, { kind: 'create', title: 'A' })).toMatchObject({
      error: { code: 'SERVICE_CLOSED' },
    })
    registration.resume()
    const handler = native.handlers.get(CATEGORY_CHANNEL)!
    await registration.close()
    expect(native.handlers.has(CATEGORY_CHANNEL)).toBe(false)
    expect(await handler(event, { kind: 'create', title: 'A' })).toMatchObject({
      error: { code: 'SERVICE_CLOSED' },
    })
    expect(service.updateCategory).toHaveBeenCalledTimes(1)
  })
  it('分类目标错误明确返回，未知写入异常不泄露SQL或路径', async () => {
    const { service, invoke, report } = setup()
    vi.mocked(service.updateCategory).mockImplementationOnce(() => {
      throw new CategoryFault('NOT_FOUND', '分类已移除。')
    })
    expect(await invoke(CATEGORY_CHANNEL, { kind: 'rename', categoryId: 'a', title: 'B' })).toEqual(
      { ok: false, error: { code: 'NOT_FOUND', message: '分类已移除。' } },
    )
    expect(report).not.toHaveBeenCalled()
    vi.mocked(service.updateCategory).mockImplementationOnce(() => {
      throw new Error('private SQL and database path')
    })
    const result = await invoke(CATEGORY_CHANNEL, { kind: 'create', title: 'A' })
    expect(result).toMatchObject({ error: { code: 'DATABASE_UNAVAILABLE' } })
    expect(JSON.stringify(result)).not.toContain('private SQL')
    expect(report).toHaveBeenCalledOnce()
  })
  it('显示设置严格读取/保存完整目标，原样返回且来源与关闭态受控', async () => {
    const { service, invoke, frame, event, registration } = setup()
    expect(await invoke(SETTINGS_CHANNELS.read)).toEqual({
      ok: true,
      value: { theme: 'system', palette: 'forest', fontSize: 17 },
    })
    const target = { theme: 'dark', palette: 'ocean', fontSize: 22 }
    expect(await invoke(SETTINGS_CHANNELS.save, target)).toEqual({ ok: true, value: target })
    expect(service.saveSettings).toHaveBeenCalledExactlyOnceWith(target)
    expect(await invoke(SETTINGS_CHANNELS.read, {})).toMatchObject({
      error: { code: 'INVALID_REQUEST' },
    })
    for (const input of [
      { ...target, fontSize: 23 },
      { ...target, path: 'private' },
      { ...target, palette: 'custom' },
      { theme: 'dark', fontSize: 22 },
      { theme: 'dark' },
    ])
      expect(await invoke(SETTINGS_CHANNELS.save, input)).toMatchObject({
        error: { code: 'INVALID_REQUEST' },
      })
    frame.url = 'https://example.com'
    for (const name of Object.values(SETTINGS_CHANNELS))
      expect(
        await invoke(name, ...(name === SETTINGS_CHANNELS.save ? [target] : [])),
      ).toMatchObject({ error: { code: 'FORBIDDEN' } })
    frame.url = 'file:///app/index.html'
    const handler = native.handlers.get(SETTINGS_CHANNELS.save)!
    await registration.close()
    expect(await handler(event, target)).toMatchObject({ error: { code: 'SERVICE_CLOSED' } })
    expect(service.saveSettings).toHaveBeenCalledTimes(1)
    expect(native.handlers.size).toBe(0)
  })
  it('设置读取/保存异常及非法输出不返回默认成功，使用显示设置文案', async () => {
    const { service, invoke, report } = setup()
    vi.mocked(service.readSettings).mockReturnValueOnce({
      theme: 'system',
      palette: 'forest',
      fontSize: 99,
    })
    const read = await invoke(SETTINGS_CHANNELS.read)
    expect(read).toMatchObject({
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: '显示设置暂不可用，请重试或检查本地诊断日志。',
      },
    })
    expect(String(report.mock.calls[0]?.[0])).toBe('Error: 题库接口数据校验失败。')
    vi.mocked(service.saveSettings).mockImplementationOnce(() => {
      throw new Error('private database path')
    })
    const save = await invoke(SETTINGS_CHANNELS.save, {
      theme: 'light',
      palette: 'forest',
      fontSize: 15,
    })
    expect(save).toMatchObject({ error: { code: 'DATABASE_UNAVAILABLE' } })
    expect(JSON.stringify(save)).not.toContain('private database path')
  })
  it('总览只接受明确范围并验证可信来源，关闭后不再读取', async () => {
    const { service, invoke, frame, registration, event } = setup()
    const scope = { topicId: 'unit', archived: true }
    expect(await invoke(LEARNING_CHANNEL, scope)).toMatchObject({
      ok: true,
      value: { ...scope, total: 0 },
    })
    expect(service.readLearningSummary).toHaveBeenCalledExactlyOnceWith(scope)
    for (const args of [
      [],
      [scope, {}],
      [{ ...scope, sql: 'SELECT' }],
      [{ ...scope, archived: 1 }],
    ])
      expect(await invoke(LEARNING_CHANNEL, ...args)).toMatchObject({
        error: { code: 'INVALID_REQUEST' },
      })
    frame.url = 'https://example.com'
    expect(await invoke(LEARNING_CHANNEL, scope)).toMatchObject({ error: { code: 'FORBIDDEN' } })
    expect(service.readLearningSummary).toHaveBeenCalledTimes(1)
    const handler = native.handlers.get(LEARNING_CHANNEL)!
    frame.url = 'file:///app/index.html'
    await registration.close()
    expect(await handler(event, scope)).toMatchObject({
      error: { code: 'SERVICE_CLOSED' },
    })
    expect(native.handlers.has(LEARNING_CHANNEL)).toBe(false)
    expect(service.readLearningSummary).toHaveBeenCalledTimes(1)
  })
  it('总览异常与非法正文输出不伪造零成功，响应/诊断不泄露正文', async () => {
    const { service, invoke, report } = setup()
    const scope = { topicId: null, archived: false }
    const value = service.readLearningSummary(scope)
    vi.mocked(service.readLearningSummary).mockReturnValueOnce({
      ...value,
      answer: 'private-answer',
    } as typeof value)
    const invalid = await invoke(LEARNING_CHANNEL, scope)
    expect(invalid).toMatchObject({ error: { code: 'DATABASE_UNAVAILABLE' } })
    expect(JSON.stringify(invalid)).not.toContain('private-answer')
    expect(String(report.mock.calls[0]?.[0])).toBe('Error: 题库接口数据校验失败。')
    vi.mocked(service.readLearningSummary).mockImplementationOnce(() => {
      throw new Error('private database path')
    })
    const failed = await invoke(LEARNING_CHANNEL, scope)
    expect(failed).toMatchObject({ error: { code: 'DATABASE_UNAVAILABLE' } })
    expect(JSON.stringify(failed)).not.toContain('private database path')
  })
  it('历史查询只接受稳定身份/页码，缺失记录及不可信来源明确拒绝', async () => {
    const { service, invoke, frame } = setup()
    const request = { topicId: 'unit', questionId: 'q-1', page: 1, excludeSessionId: randomUUID() }
    const value = {
      topicId: 'unit',
      questionId: 'q-1',
      page: 1,
      pageSize: 20 as const,
      currentVersionId: 1,
      archived: false,
      total: 0,
      entries: [],
    }
    vi.mocked(service.listHistory).mockReturnValueOnce(value)
    expect(await invoke(HISTORY_CHANNELS.list, request)).toEqual({ ok: true, value })
    expect(service.listHistory).toHaveBeenCalledExactlyOnceWith(request)
    for (const invalid of [
      { ...request, page: 0 },
      { ...request, sql: 'SELECT' },
    ])
      expect(await invoke(HISTORY_CHANNELS.list, invalid)).toMatchObject({
        error: { code: 'INVALID_REQUEST' },
      })
    expect(service.listHistory).toHaveBeenCalledTimes(1)
    const entryRequest = {
      topicId: 'unit',
      questionId: 'q-1',
      sessionId: randomUUID(),
      position: 0,
    }
    expect(await invoke(HISTORY_CHANNELS.getEntry, entryRequest)).toMatchObject({
      error: { code: 'NOT_FOUND' },
    })
    expect(await invoke(HISTORY_CHANNELS.list, request)).toMatchObject({
      error: { code: 'NOT_FOUND' },
    })
    frame.url = 'https://example.com'
    for (const [channel, input] of [
      [HISTORY_CHANNELS.list, request],
      [HISTORY_CHANNELS.getEntry, entryRequest],
    ])
      expect(await invoke(channel as string, input)).toMatchObject({ error: { code: 'FORBIDDEN' } })
  })
  it('未揭晓历史无答案；错误输出的旧作答不进入响应或诊断', async () => {
    const { service, invoke, report } = setup()
    const now = '2026-10-21T00:00:00.000Z'
    const request = { topicId: 'unit', questionId: 'q-1', sessionId: randomUUID(), position: 0 }
    const body = { markdown: '历史题干', definitions: [], imageBindings: [] }
    const value = {
      sessionId: request.sessionId,
      position: 0,
      versionId: 1,
      versionSequence: 1,
      isCurrentVersion: true,
      title: '旧题',
      topicTitle: '旧专题',
      mode: 'sequential' as const,
      sessionStatus: 'ended' as const,
      createdAt: now,
      endedAt: now,
      revealedAt: null,
      rating: null,
      ratedAt: null,
      skippedAt: null,
      hasDraft: true,
      body,
      draft: { revision: 1, text: '历史不应泄漏的旧作答' },
    }
    vi.mocked(service.getHistoryEntry).mockReturnValueOnce(value)
    const good = await invoke(HISTORY_CHANNELS.getEntry, request)
    expect(good).toEqual({ ok: true, value })
    vi.mocked(service.getHistoryEntry).mockReturnValueOnce({ ...value, answer: body })
    const rejected = await invoke(HISTORY_CHANNELS.getEntry, request)
    expect(rejected).toMatchObject({ error: { code: 'DATABASE_UNAVAILABLE' } })
    expect(JSON.stringify(rejected)).not.toContain(value.draft.text)
    expect(String(report.mock.calls[0]?.[0])).toBe('Error: 题库接口数据校验失败。')
  })
  it('历史读取异常不返回内部路径或伪造空历史成功', async () => {
    const { service, invoke } = setup()
    vi.mocked(service.listHistory).mockImplementationOnce(() => {
      throw new Error('private database path')
    })
    const result = await invoke(HISTORY_CHANNELS.list, {
      topicId: 'unit',
      questionId: 'q-1',
      page: 1,
    })
    expect(result).toMatchObject({ error: { code: 'DATABASE_UNAVAILABLE' } })
    expect(JSON.stringify(result)).not.toContain('private database path')
  })
  it('收藏只允许稳定身份与明确布尔目标，失败不返回成功', async () => {
    const { service, invoke, frame } = setup()
    const setting = { topicId: 'unit', questionId: 'q-1', favorite: true }
    expect(await invoke(LIBRARY_CHANNELS.setFavorite, setting)).toEqual({
      ok: true,
      value: setting,
    })
    for (const invalid of [
      { ...setting, favorite: 'true' },
      { ...setting, sql: 'UPDATE' },
      { ...setting, versionId: 1 },
    ]) {
      expect(await invoke(LIBRARY_CHANNELS.setFavorite, invalid)).toMatchObject({
        error: { code: 'INVALID_REQUEST' },
      })
    }
    expect(service.setFavorite).toHaveBeenCalledTimes(1)
    vi.mocked(service.setFavorite).mockReturnValueOnce(undefined)
    expect(await invoke(LIBRARY_CHANNELS.setFavorite, setting)).toMatchObject({
      error: { code: 'NOT_FOUND' },
    })
    vi.mocked(service.setFavorite).mockImplementationOnce(() => {
      throw new Error('private database path')
    })
    const failed = await invoke(LIBRARY_CHANNELS.setFavorite, setting)
    expect(failed).toMatchObject({ error: { code: 'DATABASE_UNAVAILABLE' } })
    expect(JSON.stringify(failed)).not.toContain('private database path')
    frame.url = 'https://example.com'
    expect(await invoke(LIBRARY_CHANNELS.setFavorite, setting)).toMatchObject({
      error: { code: 'FORBIDDEN' },
    })
    expect(service.setFavorite).toHaveBeenCalledTimes(3)
  })
  it('筛选参数经过共享契约规范化后才交给服务', async () => {
    const { service, invoke } = setup()
    const request = {
      topicId: null,
      archived: false,
      page: 1,
      filters: {
        query: '  GPIO  ',
        tag: '   ',
        difficulty: null,
        mastery: 'unpracticed',
        favoritesOnly: true,
      },
    }
    expect(await invoke(LIBRARY_CHANNELS.listQuestions, request)).toMatchObject({ ok: true })
    expect(service.listQuestions).toHaveBeenCalledExactlyOnceWith({
      ...request,
      filters: { ...request.filters, query: 'GPIO', tag: null },
    })
    expect(
      await invoke(LIBRARY_CHANNELS.listQuestions, {
        ...request,
        filters: { ...request.filters, includeAnswer: true },
      }),
    ).toMatchObject({ error: { code: 'INVALID_REQUEST' } })
    expect(service.listQuestions).toHaveBeenCalledTimes(1)
  })
  it('代码复制仅允许限长字符串，不接受额外参数或对象', async () => {
    const { invoke } = setup()
    const code = '中文\nint value = 1;\n<script>text</script>'
    expect(await invoke(LIBRARY_CHANNELS.copyCode, code)).toEqual({ ok: true, value: null })
    expect(native.clipboard.writeText).toHaveBeenCalledExactlyOnceWith(code)
    for (const args of [[{ text: code }], [code, 'extra'], ['x'.repeat(1_048_577)]]) {
      expect(await invoke(LIBRARY_CHANNELS.copyCode, ...args)).toMatchObject({
        error: { code: 'INVALID_REQUEST' },
      })
    }
    expect(native.clipboard.writeText).toHaveBeenCalledTimes(1)
  })
  it('复制失败返回中文错误，不读取系统剪贴板', async () => {
    const { invoke } = setup()
    native.clipboard.writeText.mockImplementationOnce(() => {
      throw new Error('剪贴板暂不可用')
    })
    expect(await invoke(LIBRARY_CHANNELS.copyCode, '代码')).toMatchObject({
      error: { code: 'FILE_ERROR' },
    })
  })
  it('打开选择框而非接受窗口路径，确认只使用归属令牌', async () => {
    const { service, invoke } = setup()
    expect(await invoke(LIBRARY_CHANNELS.previewImport, ['C:/arbitrary.md'])).toMatchObject({
      error: { code: 'INVALID_REQUEST' },
    })
    expect(native.dialog.showOpenDialog).not.toHaveBeenCalled()
    expect(await invoke(LIBRARY_CHANNELS.commitImport, preview.token)).toMatchObject({
      error: { code: 'INVALID_TOKEN' },
    })
    expect(await invoke(LIBRARY_CHANNELS.previewImport)).toEqual({ ok: true, value: preview })
    expect(native.dialog.showOpenDialog).toHaveBeenCalledTimes(1)
    expect(await invoke(LIBRARY_CHANNELS.commitImport, preview.token)).toMatchObject({ ok: true })
    expect(service.commit).toHaveBeenCalledWith(preview.token)
  })
  it.each(['frame', 'sender', 'url', 'destroyed'])('拒绝不可信来源 %s', async (kind) => {
    const { event, frame, contents, invoke } = setup()
    if (kind === 'frame') Reflect.set(event, 'senderFrame', { ...frame })
    if (kind === 'sender') Reflect.set(event, 'sender', {})
    if (kind === 'url') frame.url = 'https://example.com'
    if (kind === 'destroyed') contents.isDestroyed.mockReturnValue(true)
    expect(await invoke(LIBRARY_CHANNELS.previewImport)).toMatchObject({
      error: { code: 'FORBIDDEN' },
    })
    expect(native.dialog.showOpenDialog).not.toHaveBeenCalled()
  })
  it('同一时间仅一个原生选择任务，取消后晚到选择不会读取来源', async () => {
    const { service, invoke } = setup()
    let resolveChoice!: (value: unknown) => void
    native.dialog.showOpenDialog.mockImplementation(
      () =>
        new Promise((resolveResult) => {
          resolveChoice = resolveResult
        }),
    )
    const pending = invoke(LIBRARY_CHANNELS.previewImport)
    expect(await invoke(LIBRARY_CHANNELS.previewImport)).toMatchObject({
      error: { code: 'IMPORT_BUSY' },
    })
    expect(await invoke(LIBRARY_CHANNELS.cancelImport)).toMatchObject({ ok: true })
    expect(await pending).toMatchObject({ error: { code: 'IMPORT_CANCELLED' } })
    resolveChoice({ canceled: false, filePaths: [resolve('later.md')] })
    await Promise.resolve()
    expect(service.preview).not.toHaveBeenCalled()
  })
  it('重载页面使预览令牌失效', async () => {
    const { invoke, contents, service } = setup()
    await invoke(LIBRARY_CHANNELS.previewImport)
    contents.emit('did-start-navigation', {}, 'file:///app/index.html', false, true)
    expect(service.discard).toHaveBeenCalledWith(preview.token)
    expect(await invoke(LIBRARY_CHANNELS.commitImport, preview.token)).toMatchObject({
      error: { code: 'INVALID_TOKEN' },
    })
  })
  it('关闭等待已经开始的准备结束，移除全部监听与入口', async () => {
    const { invoke, registration, service, contents } = setup()
    let resolvePreview!: (value: Awaited<ReturnType<LibraryImportService['preview']>>) => void
    vi.mocked(service.preview).mockImplementation(
      () =>
        new Promise((resolveResult) => {
          resolvePreview = resolveResult
        }),
    )
    const pending = invoke(LIBRARY_CHANNELS.previewImport)
    await vi.waitFor(() => expect(service.preview).toHaveBeenCalled())
    let finished = false
    const closing = registration.close().then(() => {
      finished = true
    })
    await Promise.resolve()
    expect(finished).toBe(false)
    resolvePreview({ ok: true, value: preview })
    expect(await pending).toMatchObject({ error: { code: 'IMPORT_CANCELLED' } })
    await closing
    expect(native.handlers.size).toBe(0)
    expect(contents.listenerCount('did-start-navigation')).toBe(0)
  })
  it('响应不合契约时返回统一错误，日志不包含响应正文', async () => {
    const { invoke, service, report } = setup()
    Reflect.set(service, 'listQuestions', () => ({ secret: 'private answer' }))
    expect(
      await invoke(LIBRARY_CHANNELS.listQuestions, { topicId: null, archived: false, page: 1 }),
    ).toMatchObject({ error: { code: 'DATABASE_UNAVAILABLE' } })
    expect(String(report.mock.calls[0]?.[0])).not.toContain('private answer')
  })
  it('外链重新验证，禁止文件/脚本，允许明确 HTTP 点击', async () => {
    const { invoke } = setup()
    expect(await invoke(LIBRARY_CHANNELS.openReference, 'file:///C:/private')).toMatchObject({
      error: { code: 'INVALID_REQUEST' },
    })
    expect(native.shell.openExternal).not.toHaveBeenCalled()
    expect(await invoke(LIBRARY_CHANNELS.openReference, 'https://example.com')).toMatchObject({
      ok: true,
    })
    expect(native.shell.openExternal).toHaveBeenCalledWith('https://example.com/')
  })
  it('模板通过保存框写入独立临时位置，与原模板逐字节一致', () =>
    withImportDirectory(async (directory) => {
      const { invoke } = setup()
      const target = join(directory, '导出模板.md')
      native.dialog.showSaveDialog.mockResolvedValue({ canceled: false, filePath: target })
      expect(await invoke(LIBRARY_CHANNELS.exportTemplate)).toEqual({ ok: true, value: null })
      expect(await readFile(target)).toEqual(
        await readFile(resolve('question-banks/templates/专题模板.md')),
      )
    }))
})

describe('受控图片协议', () => {
  function handler(
    read: (id: number, hash: string) => { mime: string; bytes: Uint8Array } | undefined,
  ) {
    let callback!: (request: Request) => Response
    const remove = vi.fn()
    const session = {
      protocol: {
        handle: (_scheme: string, fn: typeof callback) => {
          callback = fn
        },
        unhandle: remove,
      },
    } as unknown as Session
    const report = vi.fn()
    const close = registerImageProtocol(session, read, report)
    return { request: (url: string) => callback(new Request(url)), close, report, remove }
  }
  it('只返回已关联图片字节，固定 MIME 与响应保护', async () => {
    const read = vi.fn(() => ({ mime: 'image/png', bytes: new Uint8Array([1, 2, 3]) }))
    const instance = handler(read)
    const response = instance.request(imageResourceUrl(1, 'a'.repeat(64)))
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/png')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]))
    instance.close()
    expect(instance.remove).toHaveBeenCalledOnce()
  })
  it('不存在或非法 URL 不返回资源，数据库异常不泄露', async () => {
    const read = vi.fn((): { mime: string; bytes: Uint8Array } | undefined => undefined)
    const instance = handler(read)
    expect(instance.request('file:///C:/private').status).toBe(404)
    expect(read).not.toHaveBeenCalled()
    expect(instance.request(imageResourceUrl(1, 'b'.repeat(64))).status).toBe(404)
    read.mockImplementation(() => {
      throw new Error('internal database')
    })
    const response = instance.request(imageResourceUrl(1, 'b'.repeat(64)))
    expect(response.status).toBe(500)
    expect(await response.text()).toBe('')
    expect(instance.report).toHaveBeenCalledOnce()
    instance.close()
  })
})
