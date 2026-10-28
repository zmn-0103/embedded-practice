import type { QuestionIdentity } from '../../shared/contracts/library-desktop'
import type { PersonalNote, SaveNote, StudyDesktopApi } from '../../shared/contracts/study'

export const NOTE_SAVE_DELAY_MS = 500
export interface NoteEditorState {
  note: PersonalNote | undefined
  text: string
  loading: boolean
  saving: boolean
  pending: boolean
  conflict: boolean
  error: string
}
export function createNoteController(
  api: Pick<StudyDesktopApi, 'readNote' | 'saveNote'>,
  identity: QuestionIdentity,
) {
  let state: NoteEditorState = {
    note: undefined,
    text: '',
    loading: false,
    saving: false,
    pending: false,
    conflict: false,
    error: '',
  }
  const listeners = new Set<() => void>()
  let timer: ReturnType<typeof setTimeout> | undefined
  let operation: Promise<boolean> | undefined
  let pending: SaveNote | undefined
  let disposed = false
  const dirty = () => Boolean(pending || (state.note && state.text !== state.note.text))
  const update = (change: Partial<NoteEditorState>) => {
    if (disposed) return
    state = { ...state, ...change }
    listeners.forEach((listener) => listener())
  }
  const clearTimer = () => {
    clearTimeout(timer)
    timer = undefined
  }
  const sameIdentity = (note: PersonalNote) =>
    note.topicId === identity.topicId && note.questionId === identity.questionId
  async function save(): Promise<boolean> {
    while (!disposed && dirty()) {
      if (!state.note || state.conflict) return false
      const command = pending ?? {
        ...identity,
        expectedRevision: state.note.revision,
        text: state.text,
      }
      pending = command
      update({ saving: true, error: '' })
      try {
        const result = await api.saveNote(command)
        if (disposed) return false
        if (!result.ok) {
          if (result.error.code !== 'DATABASE_UNAVAILABLE') pending = undefined
          update({
            error: result.error.message,
            pending: Boolean(pending),
            conflict: result.error.code === 'NOTE_CONFLICT',
          })
          return false
        }
        const note = result.value
        if (
          !sameIdentity(note) ||
          note.revision !== command.expectedRevision + 1 ||
          note.text !== command.text
        )
          throw new Error('笔记确认不匹配')
        pending = undefined
        update({ note, pending: false, conflict: false })
      } catch {
        update({ error: '笔记保存结果尚未确认，请保留输入并重试原保存。', pending: true })
        return false
      } finally {
        update({ saving: false })
      }
    }
    return !disposed
  }
  function flush(): Promise<boolean> {
    clearTimer()
    if (operation) return operation.then((saved) => (saved && dirty() ? flush() : saved))
    if (!dirty()) return Promise.resolve(true)
    const job = save()
    operation = job
    return job.finally(() => {
      if (operation === job) operation = undefined
    })
  }
  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    hasPending: dirty,
    async load(discard = false): Promise<boolean> {
      if (disposed || state.loading || operation || (dirty() && !discard)) return false
      clearTimer()
      update({ loading: true, error: '' })
      try {
        const result = await api.readNote(identity)
        if (disposed) return false
        if (!result.ok) {
          update({ error: result.error.message })
          return false
        }
        if (!sameIdentity(result.value)) throw new Error('笔记身份不匹配')
        pending = undefined
        update({ note: result.value, text: result.value.text, pending: false, conflict: false })
        return true
      } catch {
        update({ error: '无法读取个人笔记，请重试；当前输入保持。' })
        return false
      } finally {
        update({ loading: false })
      }
    },
    edit(text: string) {
      if (disposed || !state.note || state.loading || state.pending || text === state.text) return
      update({ text, error: '' })
      clearTimer()
      if (!state.conflict)
        timer = setTimeout(() => {
          timer = undefined
          void flush()
        }, NOTE_SAVE_DELAY_MS)
    },
    flush,
    dispose() {
      disposed = true
      clearTimer()
      listeners.clear()
    },
  }
}
export type NoteController = ReturnType<typeof createNoteController>
