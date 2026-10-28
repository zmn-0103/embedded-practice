import { EventEmitter } from 'node:events'
import { randomUUID } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
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
import { SETTINGS_CHANNELS, appearanceSchema } from '../../src/shared/contracts/settings'
import {
  THEME_CHANNELS,
  MAX_THEME_BYTES,
  themePreviewResultSchema,
} from '../../src/shared/contracts/themes'
import { BUILTIN_THEMES } from '../../src/shared/themes'
import { ThemeFault } from '../../src/main/database/repositories/theme-repository'
import { CATEGORY_CHANNEL } from '../../src/shared/contracts/categories'
import { CategoryFault } from '../../src/main/database/repositories/category-repository'
import { PRACTICE_PLAN_CHANNELS } from '../../src/shared/contracts/practice-plans'
import { PracticePlanFault } from '../../src/main/database/repositories/practice-plan-repository'
import { QUESTION_SET_CHANNELS } from '../../src/shared/contracts/question-sets'
import { QuestionSetFault } from '../../src/main/database/repositories/question-set-repository'
import { STUDY_CHANNELS } from '../../src/shared/contracts/study'
import { StudyFault } from '../../src/main/database/repositories/study-fault'
import { CONTENT_UPDATE_CHANNELS } from '../../src/shared/contracts/content-updates'
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
    listContentVersions: vi.fn(() => {
      throw new Error('本场景未模拟内容版本')
    }),
    compareContentVersions: vi.fn(() => {
      throw new Error('本场景未模拟内容差异')
    }),
    readNote: vi.fn(() => {
      throw new Error('本场景未模拟笔记读取')
    }),
    saveNote: vi.fn(() => {
      throw new Error('本场景未模拟笔记保存')
    }),
    listRounds: vi.fn(() => {
      throw new Error('本场景未模拟轮次读取')
    }),
    readRound: vi.fn(() => {
      throw new Error('本场景未模拟轮次清单')
    }),
    readRoundEntry: vi.fn(() => {
      throw new Error('本场景未模拟轮次详情')
    }),
    prepareMaterial: vi.fn(() => {
      throw new Error('本场景未模拟材料准备')
    }),
    writeMaterialBundle: vi.fn(async () => {
      throw new Error('本场景未模拟材料写入')
    }),
    listQuestionSets: vi.fn(() => []),
    readQuestionSet: vi.fn(() => {
      throw new Error('未请求此题单')
    }),
    previewQuestionSet: vi.fn(() => ({ definition: null, items: [] })),
    changeQuestionSet: vi.fn(() => {}),
    preview: vi.fn(async () => ({ ok: true as const, value: preview })),
    commit: vi.fn(() => ({ ok: true as const, value: { revision: 1, summary: preview.summary } })),
    discard: vi.fn(() => ({ ok: true as const, value: null })),
    close: vi.fn(async () => {}),
    updateCategory: vi.fn(() => {}),
    listPracticePlans: vi.fn(() => []),
    changePracticePlan: vi.fn(() => {}),
    listThemes: vi.fn(() => ({
      entries: BUILTIN_THEMES.map((definition) => ({ definition, builtIn: true })),
      issues: [],
    })),
    inspectTheme: vi.fn(() => ({ action: 'install' as const, previousVersion: null })),
    installTheme: vi.fn(() => ({
      entries: BUILTIN_THEMES.map((definition) => ({ definition, builtIn: true })),
      issues: [],
    })),
    removeTheme: vi.fn(() => ({
      entries: BUILTIN_THEMES.map((definition) => ({ definition, builtIn: true })),
      issues: [],
    })),
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
    readSettings: vi.fn(() =>
      appearanceSchema.parse({
        theme: 'system' as const,
        palette: 'forest' as const,
        fontSize: 17,
      }),
    ),
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
  it('内容版本/差异严格参数和来源、暂停关闭保护，元数据不自动查询正文', async () => {
    const { invoke, service, frame, registration, event } = setup()
    const request = { topicId: 'unit', questionId: 'q-1', versionId: 3, page: 1 }
    const metadata = { versionId: 3, sequence: 3, createdAt: '2026-10-28T00:00:00.000Z' }
    const value = {
      topicId: 'unit',
      questionId: 'q-1',
      target: metadata,
      page: 1,
      pageSize: 20 as const,
      total: 0,
      versions: [],
    }
    vi.mocked(service.listContentVersions).mockReturnValue(value)
    expect(await invoke(CONTENT_UPDATE_CHANNELS.versions, request)).toEqual({ ok: true, value })
    expect(service.compareContentVersions).not.toHaveBeenCalled()
    for (const bad of [
      { ...request, page: 0 },
      { ...request, part: 'answer' },
      { ...request, filePath: 'C:/private' },
    ])
      expect(await invoke(CONTENT_UPDATE_CHANNELS.versions, bad)).toMatchObject({
        error: { code: 'INVALID_REQUEST' },
      })
    expect(
      await invoke(CONTENT_UPDATE_CHANNELS.compare, {
        ...request,
        previousVersionId: 1,
        part: 'answer',
      }),
    ).toMatchObject({ error: { code: 'INVALID_REQUEST' } })
    frame.url = 'https://example.com'
    for (const channel of Object.values(CONTENT_UPDATE_CHANNELS))
      expect(await invoke(channel, {})).toMatchObject({ error: { code: 'FORBIDDEN' } })
    frame.url = 'file:///app/index.html'
    await registration.pause()
    for (const channel of Object.values(CONTENT_UPDATE_CHANNELS))
      expect(await invoke(channel, {})).toMatchObject({ error: { code: 'SERVICE_CLOSED' } })
    registration.resume()
    const handlers = Object.values(CONTENT_UPDATE_CHANNELS).map((channel) =>
      native.handlers.get(channel)!,
    )
    await registration.close()
    for (const handler of handlers)
      expect(await handler(event, {})).toMatchObject({ error: { code: 'SERVICE_CLOSED' } })
    for (const channel of Object.values(CONTENT_UPDATE_CHANNELS))
      expect(native.handlers.has(channel)).toBe(false)
  })
  it('内容分区明确传递；未知SQL异常/坏输出不泄漏，失效版本明确返回', async () => {
    const { invoke, service, report } = setup()
    const request = {
      topicId: 'unit',
      questionId: 'q-1',
      versionId: 3,
      previousVersionId: 1,
      part: 'question',
    }
    const body = { markdown: '只有题干', definitions: [], imageBindings: [] }
    const value = {
      topicId: 'unit',
      questionId: 'q-1',
      part: 'question' as const,
      previous: { versionId: 1, sequence: 1, createdAt: '2026-10-27T00:00:00.000Z', body },
      current: { versionId: 3, sequence: 3, createdAt: '2026-10-28T00:00:00.000Z', body },
    }
    vi.mocked(service.compareContentVersions).mockReturnValueOnce(value)
    expect(await invoke(CONTENT_UPDATE_CHANNELS.compare, request)).toEqual({ ok: true, value })
    expect(service.compareContentVersions).toHaveBeenLastCalledWith(request)
    vi.mocked(service.compareContentVersions).mockImplementationOnce(() => {
      throw new StudyFault('NOT_FOUND', '目标已更新，请刷新题库。')
    })
    expect(await invoke(CONTENT_UPDATE_CHANNELS.compare, request)).toMatchObject({
      error: { code: 'NOT_FOUND' },
    })
    vi.mocked(service.compareContentVersions).mockImplementationOnce(() => {
      throw new Error('private SQL path')
    })
    const failure = await invoke(CONTENT_UPDATE_CHANNELS.compare, request)
    expect(failure).toMatchObject({ error: { code: 'DATABASE_UNAVAILABLE' } })
    expect(JSON.stringify(failure)).not.toContain('private')
    vi.mocked(service.compareContentVersions).mockReturnValueOnce({
      ...value,
      previous: value.current,
    })
    expect(await invoke(CONTENT_UPDATE_CHANNELS.compare, request)).toMatchObject({
      error: { code: 'DATABASE_UNAVAILABLE' },
    })
    expect(report).toHaveBeenCalledTimes(2)
  })
  it('积累六接口严格来源/参数/暂停/关闭，笔记冲突明确且输出与异常不泄漏', async () => {
    const { invoke, service, frame, registration, event } = setup()
    const identity = { topicId: 'unit', questionId: 'q-1' }
    const note = { ...identity, revision: 0, text: '', updatedAt: null }
    vi.mocked(service.readNote).mockReturnValue(note)
    expect(await invoke(STUDY_CHANNELS.readNote, identity)).toEqual({ ok: true, value: note })
    for (const args of [[], [{ ...identity, path: 'C:/private' }], [identity, 'extra']])
      expect(await invoke(STUDY_CHANNELS.readNote, ...args)).toMatchObject({
        error: { code: 'INVALID_REQUEST' },
      })
    const save = { ...identity, expectedRevision: 0, text: '我的理解' }
    vi.mocked(service.saveNote).mockImplementationOnce(() => {
      throw new StudyFault('NOTE_CONFLICT', '请先核对已有笔记。')
    })
    expect(await invoke(STUDY_CHANNELS.saveNote, save)).toMatchObject({
      error: { code: 'NOTE_CONFLICT', message: '请先核对已有笔记。' },
    })
    vi.mocked(service.saveNote).mockImplementationOnce(() => {
      throw new Error('private SQL path')
    })
    const unknown = await invoke(STUDY_CHANNELS.saveNote, save)
    expect(unknown).toMatchObject({ error: { code: 'DATABASE_UNAVAILABLE' } })
    expect(JSON.stringify(unknown)).not.toContain('private')
    vi.mocked(service.readNote).mockReturnValueOnce({ ...note, text: 'bad revision zero' })
    expect(await invoke(STUDY_CHANNELS.readNote, identity)).toMatchObject({
      error: { code: 'DATABASE_UNAVAILABLE' },
    })
    expect(await invoke(STUDY_CHANNELS.listRounds, { topicId: null, page: 0 })).toMatchObject({
      error: { code: 'INVALID_REQUEST' },
    })
    expect(
      await invoke(STUDY_CHANNELS.readRound, { sessionId: randomUUID(), page: 1, answer: true }),
    ).toMatchObject({ error: { code: 'INVALID_REQUEST' } })
    expect(
      await invoke(STUDY_CHANNELS.readEntry, { sessionId: randomUUID(), position: -1 }),
    ).toMatchObject({ error: { code: 'INVALID_REQUEST' } })
    frame.url = 'https://example.com'
    for (const channel of Object.values(STUDY_CHANNELS))
      expect(await invoke(channel, {})).toMatchObject({ error: { code: 'FORBIDDEN' } })
    frame.url = 'file:///app/index.html'
    await registration.pause()
    for (const channel of Object.values(STUDY_CHANNELS))
      expect(await invoke(channel, {})).toMatchObject({ error: { code: 'SERVICE_CLOSED' } })
    registration.resume()
    const handlers = Object.values(STUDY_CHANNELS).map((channel) => native.handlers.get(channel)!)
    await registration.close()
    for (const handler of handlers)
      expect(await handler(event, {})).toMatchObject({ error: { code: 'SERVICE_CLOSED' } })
    expect(native.handlers.size).toBe(0)
    expect(service.prepareMaterial).not.toHaveBeenCalled()
  })
  it('材料只接收来源与模式，系统对话框选择后才调用绑定写入，取消不写入', async () => {
    const { invoke, service } = setup()
    const request = { source: { kind: 'set', setId: randomUUID() }, mode: 'questions' }
    const bundle = {
      markdown: '# 题目',
      count: 1,
      assetsName: `review-assets-${randomUUID()}`,
      images: [],
    }
    vi.mocked(service.prepareMaterial).mockReturnValue(bundle)
    for (const bad of [
      { ...request, filePath: 'C:/private' },
      { ...request, markdown: '# 伪造' },
      { ...request, source: { ...request.source, sessionId: randomUUID() } },
    ])
      expect(await invoke(STUDY_CHANNELS.exportMaterial, bad)).toMatchObject({
        error: { code: 'INVALID_REQUEST' },
      })
    expect(service.prepareMaterial).not.toHaveBeenCalled()
    expect(await invoke(STUDY_CHANNELS.exportMaterial, request)).toMatchObject({
      error: { code: 'CANCELLED' },
    })
    expect(service.writeMaterialBundle).not.toHaveBeenCalled()
    const target = resolve('chosen.md')
    native.dialog.showSaveDialog.mockResolvedValueOnce({ canceled: false, filePath: target })
    vi.mocked(service.writeMaterialBundle).mockResolvedValueOnce({
      filePath: target,
      assetsPath: null,
      questions: 1,
      images: 0,
    })
    expect(await invoke(STUDY_CHANNELS.exportMaterial, request)).toEqual({
      ok: true,
      value: { filePath: target, assetsPath: null, questions: 1, images: 0 },
    })
    expect(service.prepareMaterial).toHaveBeenLastCalledWith(request)
    expect(service.writeMaterialBundle).toHaveBeenCalledExactlyOnceWith(
      bundle,
      target,
      expect.any(AbortSignal),
    )
  })
  it('材料选择位置期间拒绝重复任务，关闭取消悬空对话框且不写入', async () => {
    const { invoke, service, registration } = setup()
    vi.mocked(service.prepareMaterial).mockReturnValue({
      markdown: '# 题目',
      count: 1,
      assetsName: `review-assets-${randomUUID()}`,
      images: [],
    })
    let finish!: (value: { canceled: boolean; filePath: string }) => void
    native.dialog.showSaveDialog.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const request = { source: { kind: 'set', setId: randomUUID() }, mode: 'personal' }
    const pending = invoke(STUDY_CHANNELS.exportMaterial, request)
    await vi.waitFor(() => expect(native.dialog.showSaveDialog).toHaveBeenCalledOnce())
    expect(await invoke(STUDY_CHANNELS.exportMaterial, request)).toMatchObject({
      error: { code: 'BUSY' },
    })
    await registration.close()
    expect(await pending).toMatchObject({ error: { code: 'CANCELLED' } })
    finish({ canceled: false, filePath: resolve('late.md') })
    await Promise.resolve()
    expect(service.writeMaterialBundle).not.toHaveBeenCalled()
    expect(service.prepareMaterial).toHaveBeenCalledOnce()
  })
  it('题单严格参数/来源/暂停/关闭受同一守卫保护，业务错误明确且异常不泄漏', async () => {
    const { invoke, registration, service, frame, event } = setup()
    const command = {
      kind: 'save',
      setId: randomUUID(),
      name: '  明确题单  ',
      items: [{ topicId: 'unit', questionId: 'q-1' }],
    }
    expect(await invoke(QUESTION_SET_CHANNELS.list)).toEqual({ ok: true, value: [] })
    expect(await invoke(QUESTION_SET_CHANNELS.preview, { items: [] })).toEqual({
      ok: true,
      value: { definition: null, items: [] },
    })
    expect(await invoke(QUESTION_SET_CHANNELS.change, command)).toEqual({ ok: true, value: null })
    expect(service.changeQuestionSet).toHaveBeenCalledExactlyOnceWith({
      ...command,
      name: '明确题单',
    })
    for (const bad of [
      { ...command, sql: 'DELETE' },
      { ...command, items: [] },
      { ...command, items: [command.items[0], command.items[0]] },
    ])
      expect(await invoke(QUESTION_SET_CHANNELS.change, bad)).toMatchObject({
        error: { code: 'INVALID_REQUEST' },
      })
    expect(
      await invoke(QUESTION_SET_CHANNELS.preview, { items: [], setId: command.setId }),
    ).toMatchObject({ error: { code: 'INVALID_REQUEST' } })
    vi.mocked(service.changeQuestionSet).mockImplementationOnce(() => {
      throw new QuestionSetFault('NOT_FOUND', '原题已失效。')
    })
    expect(await invoke(QUESTION_SET_CHANNELS.change, command)).toMatchObject({
      error: { code: 'NOT_FOUND', message: '原题已失效。' },
    })
    vi.mocked(service.changeQuestionSet).mockImplementationOnce(() => {
      throw new Error('private SQL secret path')
    })
    const failure = await invoke(QUESTION_SET_CHANNELS.change, command)
    expect(failure).toMatchObject({
      error: { code: 'DATABASE_UNAVAILABLE' },
    })
    expect(JSON.stringify(failure)).not.toContain('secret')
    frame.url = 'https://example.com'
    for (const channel of Object.values(QUESTION_SET_CHANNELS))
      expect(await invoke(channel, command)).toMatchObject({ error: { code: 'FORBIDDEN' } })
    frame.url = 'file:///app/index.html'
    await registration.pause()
    for (const channel of Object.values(QUESTION_SET_CHANNELS))
      expect(await invoke(channel)).toMatchObject({ error: { code: 'SERVICE_CLOSED' } })
    registration.resume()
    const handler = native.handlers.get(QUESTION_SET_CHANNELS.list)!
    await registration.close()
    expect(await handler(event)).toMatchObject({ error: { code: 'SERVICE_CLOSED' } })
    expect(native.handlers.size).toBe(0)
  })
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
      value: appearanceSchema.parse({ theme: 'system', palette: 'forest', fontSize: 17 }),
    })
    const target = appearanceSchema.parse({ theme: 'dark', palette: 'ocean', fontSize: 22 })
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
      ...appearanceSchema.parse({ theme: 'system', palette: 'forest', fontSize: 17 }),
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

describe('主题IPC的文件与快照边界', () => {
  const external = { ...BUILTIN_THEMES[0]!, id: 'local.unit', name: '单元主题' }
  it('预览后来源变化仍安装同一已校验快照，保留凭据支持重复核对', () =>
    withImportDirectory(async (directory) => {
      const { invoke, service } = setup()
      const path = join(directory, '单元.ep-theme.json')
      await writeFile(path, JSON.stringify(external))
      native.dialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [path] })
      const result = themePreviewResultSchema.parse(await invoke(THEME_CHANNELS.preview))
      expect(result.ok).toBe(true)
      if (!result.ok) throw new Error('需要成功预览')
      await writeFile(path, '{"changed":true}')
      for (let i = 0; i < 2; i++)
        expect(await invoke(THEME_CHANNELS.install, { token: result.value.token })).toMatchObject({
          ok: true,
        })
      expect(service.installTheme).toHaveBeenNthCalledWith(1, external)
      expect(service.installTheme).toHaveBeenNthCalledWith(2, external)
      expect(await invoke(THEME_CHANNELS.install, { token: randomUUID() })).toMatchObject({
        error: { code: 'PREVIEW_EXPIRED' },
      })
    }))
  it.each([
    ['损坏JSON', Buffer.from('{bad'), 'INVALID_THEME'],
    ['未知格式', Buffer.from(JSON.stringify({ ...external, formatVersion: 2 })), 'INVALID_THEME'],
    ['携带脚本', Buffer.from(JSON.stringify({ ...external, script: 'alert(1)' })), 'INVALID_THEME'],
    ['UTF8损坏', Buffer.from([0xff, 0xfe]), 'INVALID_THEME'],
    ['超过上限', Buffer.alloc(MAX_THEME_BYTES + 1, 32), 'FILE_ERROR'],
  ])('%s不进入安装仓储', (_name, content, code) =>
    withImportDirectory(async (directory) => {
      const { invoke, service } = setup()
      const path = join(directory, '拒绝.ep-theme.json')
      await writeFile(path, content)
      native.dialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [path] })
      expect(await invoke(THEME_CHANNELS.preview)).toMatchObject({ ok: false, error: { code } })
      expect(service.inspectTheme).not.toHaveBeenCalled()
      expect(service.installTheme).not.toHaveBeenCalled()
    }),
  )
  it('来源/参数/取消/冲突/恢复暂停与关闭态不绕过边界', async () => {
    const { invoke, service, registration, frame, event } = setup()
    expect(await invoke(THEME_CHANNELS.preview, { path: 'private' })).toMatchObject({
      error: { code: 'INVALID_REQUEST' },
    })
    expect(native.dialog.showOpenDialog).not.toHaveBeenCalled()
    frame.url = 'https://example.com'
    for (const channel of Object.values(THEME_CHANNELS))
      expect(await invoke(channel)).toMatchObject({ error: { code: 'FORBIDDEN' } })
    frame.url = 'file:///app/index.html'
    native.dialog.showOpenDialog.mockResolvedValueOnce({ canceled: true, filePaths: [] })
    expect(await invoke(THEME_CHANNELS.preview)).toMatchObject({ error: { code: 'CANCELLED' } })
    vi.mocked(service.removeTheme).mockImplementationOnce(() => {
      throw new ThemeFault('THEME_CONFLICT', '内置主题不能卸载。')
    })
    expect(await invoke(THEME_CHANNELS.uninstall, { themeId: 'builtin.forest' })).toMatchObject({
      error: { code: 'THEME_CONFLICT' },
    })
    await registration.pause()
    for (const channel of Object.values(THEME_CHANNELS))
      expect(await invoke(channel)).toMatchObject({ error: { code: 'SERVICE_CLOSED' } })
    const handler = native.handlers.get(THEME_CHANNELS.list)!
    await registration.close()
    expect(await handler(event)).toMatchObject({ error: { code: 'SERVICE_CLOSED' } })
    expect(native.handlers.size).toBe(0)
  })
  it('未完成主题选择在关闭时取消并等待，不写入主题', async () => {
    const { invoke, registration, service } = setup()
    native.dialog.showOpenDialog.mockReturnValueOnce(new Promise(() => {}))
    const waiting = invoke(THEME_CHANNELS.preview)
    expect(await invoke(THEME_CHANNELS.preview)).toMatchObject({ error: { code: 'THEME_BUSY' } })
    await registration.close()
    expect(await waiting).toMatchObject({ error: { code: 'CANCELLED' } })
    expect(service.installTheme).not.toHaveBeenCalled()
  })
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
