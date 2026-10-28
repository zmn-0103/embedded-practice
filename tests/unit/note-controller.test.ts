import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import {
  createNoteController,
  NOTE_SAVE_DELAY_MS,
  type NoteController,
} from '../../src/renderer/src/note-controller'
import type { PersonalNote, SaveNote, StudyDesktopApi } from '../../src/shared/contracts/study'

const identity = { topicId: 'note-topic', questionId: 'q-1' }
const note = (revision = 0, text = ''): PersonalNote => ({
  ...identity,
  revision,
  text,
  updatedAt: revision ? '2026-10-27T00:00:00.000Z' : null,
})
const active: NoteController[] = []
function setup() {
  const api: Pick<StudyDesktopApi, 'readNote' | 'saveNote'> = {
    readNote: vi.fn(async () => ({ ok: true as const, value: note() })),
    saveNote: vi.fn(async (input: SaveNote) => ({
      ok: true as const,
      value: note(input.expectedRevision + 1, input.text),
    })),
  }
  const controller = createNoteController(api, identity)
  active.push(controller)
  return { api, controller }
}
beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  active.splice(0).forEach((controller) => controller.dispose())
  vi.useRealTimers()
})

test('构造不读取旧笔记，主动载入后500ms保存，保留中文和代码', async () => {
  const { api, controller } = setup()
  expect(api.readNote).not.toHaveBeenCalled()
  await controller.load()
  controller.edit('DMA完成不等于UART完成\n  wait_tc();')
  await vi.advanceTimersByTimeAsync(NOTE_SAVE_DELAY_MS - 1)
  expect(api.saveNote).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(1)
  expect(api.saveNote).toHaveBeenCalledExactlyOnceWith({
    ...identity,
    expectedRevision: 0,
    text: 'DMA完成不等于UART完成\n  wait_tc();',
  })
  expect(controller.hasPending()).toBe(false)
})

test('离开立即保存并取消计时，不重复写入；清空也是独立修订', async () => {
  const { api, controller } = setup()
  await controller.load()
  controller.edit('原内容')
  expect(await controller.flush()).toBe(true)
  await vi.advanceTimersByTimeAsync(1000)
  expect(api.saveNote).toHaveBeenCalledTimes(1)
  controller.edit('')
  expect(await controller.flush()).toBe(true)
  expect(controller.getState().note).toMatchObject({ text: '', revision: 2 })
})

test('在途旧保存后仍保存较新输入，返回前两份均确认', async () => {
  const { api, controller } = setup()
  await controller.load()
  let release!: (result: Awaited<ReturnType<typeof api.saveNote>>) => void
  vi.mocked(api.saveNote).mockReturnValueOnce(
    new Promise((resolve) => {
      release = resolve
    }),
  )
  controller.edit('先输入')
  const saving = controller.flush()
  controller.edit('后来补充')
  release({ ok: true, value: note(1, '先输入') })
  expect(await saving).toBe(true)
  expect(controller.getState()).toMatchObject({
    text: '后来补充',
    note: { text: '后来补充', revision: 2 },
  })
  expect(vi.mocked(api.saveNote).mock.calls[1]?.[0]).toEqual({
    ...identity,
    expectedRevision: 1,
    text: '后来补充',
  })
})

test.each(['throw', 'database'] as const)(
  '响应未知%s保留原文本/原修订重试并锁编辑',
  async (kind) => {
    const { api, controller } = setup()
    await controller.load()
    if (kind === 'throw') vi.mocked(api.saveNote).mockRejectedValueOnce(new Error('提交后响应丢失'))
    else
      vi.mocked(api.saveNote).mockResolvedValueOnce({
        ok: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: '失败' },
      })
    controller.edit('不能丢失')
    expect(await controller.flush()).toBe(false)
    controller.edit('不能覆盖原输入')
    expect(controller.getState()).toMatchObject({ pending: true, text: '不能丢失' })
    expect(await controller.flush()).toBe(true)
    const calls = vi.mocked(api.saveNote).mock.calls
    expect(calls[1]?.[0]).toEqual(calls[0]?.[0])
    expect(controller.hasPending()).toBe(false)
  },
)

test('过期编辑不盲重试，读取失败不覆盖输入，明确丢弃后读实际笔记', async () => {
  const { api, controller } = setup()
  await controller.load()
  vi.mocked(api.saveNote).mockResolvedValueOnce({
    ok: false,
    error: { code: 'NOTE_CONFLICT', message: '较新笔记已存在' },
  })
  controller.edit('本地输入')
  expect(await controller.flush()).toBe(false)
  expect(await controller.load()).toBe(false)
  expect(await controller.flush()).toBe(false)
  expect(api.saveNote).toHaveBeenCalledTimes(1)
  vi.mocked(api.readNote).mockRejectedValueOnce(new Error('读取中断'))
  expect(await controller.load(true)).toBe(false)
  expect(controller.getState().text).toBe('本地输入')
  vi.mocked(api.readNote).mockResolvedValueOnce({ ok: true, value: note(5, '实际已保存') })
  expect(await controller.load(true)).toBe(true)
  expect(controller.getState().text).toBe('实际已保存')
  expect(controller.hasPending()).toBe(false)
})

test('错误身份/修订的确认不能显示保存成功，释放后计时器不再写', async () => {
  const { api, controller } = setup()
  await controller.load()
  controller.edit('原输入')
  vi.mocked(api.saveNote).mockResolvedValueOnce({
    ok: true,
    value: { ...note(1, '原输入'), questionId: 'q-2' },
  })
  expect(await controller.flush()).toBe(false)
  expect(controller.getState().pending).toBe(true)
  controller.dispose()
  await vi.advanceTimersByTimeAsync(1000)
  expect(api.saveNote).toHaveBeenCalledTimes(1)
})
