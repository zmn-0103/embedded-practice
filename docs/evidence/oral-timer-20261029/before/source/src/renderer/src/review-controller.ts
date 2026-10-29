import type { QuestionIdentity } from '../../shared/contracts/library-desktop'
import type {
  ReviewDesktopApi,
  ReviewDraft,
  ReviewTodo,
  SaveReview,
} from '../../shared/contracts/review-todos'

export const REVIEW_SAVE_DELAY_MS = 500
const emptyDraft = (): ReviewDraft => ({ state: 'pending', dueDate: null, reason: '' })
export interface ReviewEditorState {
  todo: ReviewTodo | null | undefined
  draft: ReviewDraft
  enabled: boolean
  loading: boolean
  saving: boolean
  pending: boolean
  conflict: boolean
  error: string
  confirmations: number
}
const draftEqual = (left: ReviewDraft, right: ReviewDraft) =>
  left.state === right.state && left.dueDate === right.dueDate && left.reason === right.reason
export function createReviewController(
  api: Pick<ReviewDesktopApi, 'read' | 'save'>,
  identity: QuestionIdentity,
) {
  let state: ReviewEditorState = {
    todo: undefined,
    draft: emptyDraft(),
    enabled: false,
    loading: false,
    saving: false,
    pending: false,
    conflict: false,
    error: '',
    confirmations: 0,
  }
  const listeners = new Set<() => void>()
  let timer: ReturnType<typeof setTimeout> | undefined
  let operation: Promise<boolean> | undefined
  let pending: SaveReview | undefined
  let disposed = false
  const dirty = () =>
    Boolean(
      pending ||
      (state.todo !== undefined &&
        (state.todo ? !draftEqual(state.todo, state.draft) : state.enabled)),
    )
  const update = (change: Partial<ReviewEditorState>) => {
    if (disposed) return
    state = { ...state, ...change }
    listeners.forEach((listener) => listener())
  }
  const clearTimer = () => {
    clearTimeout(timer)
    timer = undefined
  }
  const sameIdentity = (todo: ReviewTodo) =>
    todo.topicId === identity.topicId && todo.questionId === identity.questionId
  async function save(): Promise<boolean> {
    if (state.todo === undefined || state.conflict) return false
    const command = pending ?? {
      ...identity,
      ...state.draft,
      expectedRevision: state.todo?.revision ?? 0,
    }
    pending = command
    update({ saving: true, pending: true, error: '' })
    try {
      const result = await api.save(command)
      if (disposed) return false
      if (!result.ok) {
        if (result.error.code !== 'DATABASE_UNAVAILABLE') pending = undefined
        update({
          error: result.error.message,
          pending: Boolean(pending),
          conflict: result.error.code === 'CONFLICT',
        })
        return false
      }
      const todo = result.value
      if (
        !sameIdentity(todo) ||
        todo.revision !== command.expectedRevision + 1 ||
        !draftEqual(todo, command)
      )
        throw new Error('复习安排确认不匹配')
      pending = undefined
      update({
        todo,
        draft: { state: todo.state, dueDate: todo.dueDate, reason: todo.reason },
        enabled: true,
        pending: false,
        conflict: false,
        confirmations: state.confirmations + 1,
      })
      return true
    } catch {
      update({ error: '复习安排保存结果尚未确认，请保留输入并重试原操作。', pending: true })
      return false
    } finally {
      update({ saving: false })
    }
  }
  function flush(): Promise<boolean> {
    clearTimer()
    if (operation) return operation.then((saved) => (saved && dirty() ? flush() : saved))
    if (!dirty()) return Promise.resolve(!disposed)
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
    flush,
    async load(discard = false): Promise<boolean> {
      if (disposed || state.loading || state.saving || (!discard && dirty())) return false
      clearTimer()
      pending = undefined
      update({
        loading: true,
        todo: undefined,
        draft: emptyDraft(),
        enabled: false,
        pending: false,
        conflict: false,
        error: '',
      })
      try {
        const result = await api.read(identity)
        if (disposed) return false
        if (!result.ok) {
          update({ error: result.error.message })
          return false
        }
        const todo = result.value
        if (todo && !sameIdentity(todo)) throw new Error('复习安排身份不匹配')
        update({
          todo,
          enabled: Boolean(todo),
          draft: todo
            ? { state: todo.state, dueDate: todo.dueDate, reason: todo.reason }
            : emptyDraft(),
          confirmations: state.confirmations + (discard ? 1 : 0),
        })
        return true
      } catch {
        update({ error: '无法读取复习安排，请重试。' })
        return false
      } finally {
        update({ loading: false })
      }
    },
    edit(change: Partial<ReviewDraft>) {
      if (
        disposed ||
        state.todo === undefined ||
        state.loading ||
        state.saving ||
        pending ||
        state.conflict
      )
        return
      if (change.state === 'done' && !state.todo) {
        update({ error: '请先加入待复习，再明确完成。' })
        return
      }
      clearTimer()
      update({ draft: { ...state.draft, ...change }, enabled: true, error: '' })
      if (dirty())
        timer = setTimeout(() => {
          timer = undefined
          void flush()
        }, REVIEW_SAVE_DELAY_MS)
    },
    dispose() {
      disposed = true
      clearTimer()
      listeners.clear()
    },
  }
}
