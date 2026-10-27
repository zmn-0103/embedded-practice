import type {
  Draft,
  NavigatePractice,
  PracticeAck,
  PracticeView,
  RatePractice,
  RevealPractice,
} from '../../shared/contracts/practice'
import type {
  PracticeDesktopApi,
  PracticeDesktopResult,
} from '../../shared/contracts/practice-desktop'

export const DRAFT_SAVE_DELAY_MS = 500
export type PracticeAction =
  | { kind: 'reveal' }
  | { kind: 'rate'; rating: RatePractice['rating'] }
  | { kind: 'navigate'; direction: NavigatePractice['direction'] }
  | { kind: 'end' }
type PendingCommand = (
  | { method: 'reveal' | 'end'; input: RevealPractice }
  | { method: 'rateAndAdvance'; input: RatePractice }
  | { method: 'navigate'; input: NavigatePractice }
) & { ack?: PracticeAck }
export interface PracticeEditorState {
  view: PracticeView | null
  draft: Draft
  savedRevision: number
  saveStatus: 'saved' | 'dirty' | 'saving' | 'failed'
  busy: boolean
  closing: boolean
  pending: boolean
  error: string
}

export function createPracticeController(api: PracticeDesktopApi) {
  let state: PracticeEditorState = {
    view: null,
    draft: { revision: 0, text: '' },
    savedRevision: 0,
    saveStatus: 'saved',
    busy: false,
    closing: false,
    pending: false,
    error: '',
  }
  let disposed = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let lastEdit = 0
  let saving: Promise<boolean> | undefined
  let operation: Promise<boolean> | undefined
  let pending: PendingCommand | undefined
  let closeJob: Promise<boolean> | undefined
  const listeners = new Set<() => void>()
  function update(patch: Partial<PracticeEditorState>) {
    if (disposed) return
    state = { ...state, ...patch }
    for (const listener of listeners) listener()
  }
  function clearTimer() {
    if (timer) clearTimeout(timer)
    timer = undefined
  }
  function schedule() {
    clearTimer()
    timer = setTimeout(() => {
      timer = undefined
      void saveLatest(false)
    }, DRAFT_SAVE_DELAY_MS)
  }
  function applyView(view: PracticeView) {
    clearTimer()
    const draft = view.item?.draft ?? { revision: 0, text: '' }
    update({
      view,
      draft: { ...draft },
      savedRevision: draft.revision,
      saveStatus: 'saved',
      error: '',
      pending: false,
    })
  }
  async function saveLatest(immediate: boolean): Promise<boolean> {
    while (saving) {
      const prior = saving
      const success = await prior
      if (saving === prior) saving = undefined
      if (!success) return false
    }
    if (disposed) return false
    if (!state.view?.item || state.savedRevision === state.draft.revision) return true
    if (!immediate && Date.now() - lastEdit < DRAFT_SAVE_DELAY_MS) {
      schedule()
      return false
    }
    const snapshot = { ...state.draft }
    const sessionId = state.view.session.sessionId,
      position = state.view.item.position
    update({ saveStatus: 'saving', error: '' })
    const job = (async () => {
      try {
        const result = await api.saveDraft({ sessionId, position, draft: snapshot })
        if (disposed) return false
        if (!result.ok) {
          update({ saveStatus: 'failed', error: result.error.message })
          return false
        }
        if (
          result.value.sessionId !== sessionId ||
          result.value.position !== position ||
          result.value.draftRevision !== snapshot.revision
        )
          throw new Error('草稿确认不匹配')
        update({
          savedRevision: snapshot.revision,
          saveStatus: snapshot.revision === state.draft.revision ? 'saved' : 'dirty',
        })
        return true
      } catch {
        update({ saveStatus: 'failed', error: '尚未确认草稿保存，请保留输入并重试。' })
        return false
      }
    })()
    saving = job
    let success: boolean
    try {
      success = await job
    } finally {
      if (saving === job) saving = undefined
    }
    if (success && immediate && state.savedRevision !== state.draft.revision)
      return saveLatest(true)
    return success
  }
  async function executePending(): Promise<boolean> {
    const job = pending
    if (!job) return false
    try {
      if (!job.ack) {
        let result: PracticeDesktopResult<PracticeAck>
        if (job.method === 'rateAndAdvance') result = await api.rateAndAdvance(job.input)
        else if (job.method === 'navigate') result = await api.navigate(job.input)
        else result = await api[job.method](job.input)
        if (disposed) return false
        if (!result.ok) {
          if (
            !['WRITE_FAILED', 'DATABASE_UNAVAILABLE', 'OUTCOME_UNKNOWN'].includes(result.error.code)
          )
            pending = undefined
          update({ error: result.error.message, pending: Boolean(pending) })
          return false
        }
        if (result.value.sessionId !== job.input.cursor.sessionId) throw new Error('练习确认不匹配')
        job.ack = result.value
      }
      const result = await api.read({ sessionId: job.ack.sessionId })
      if (disposed) return false
      if (!result.ok || !result.value || result.value.session.sessionId !== job.ack.sessionId) {
        update({ error: '操作已保存，当前题目读取失败，请重试读取。' })
        return false
      }
      pending = undefined
      applyView(result.value)
      return true
    } catch {
      update({
        error: job.ack
          ? '操作已保存，当前题目读取失败，请重试读取。'
          : '操作结果尚未确认，请重试原操作。',
      })
      return false
    }
  }
  function locked(work: () => Promise<boolean>, forClose = false): Promise<boolean> {
    if (disposed || state.busy || (state.closing && !forClose)) return Promise.resolve(false)
    update({ busy: true, error: '' })
    clearTimer()
    const job = work()
    operation = job
    return job.finally(() => {
      if (operation === job) operation = undefined
      update({ busy: false })
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
    open(view: PracticeView): boolean {
      if (
        disposed ||
        state.busy ||
        state.closing ||
        pending ||
        saving ||
        state.savedRevision !== state.draft.revision
      )
        return false
      applyView(view)
      return true
    },
    edit(text: string) {
      if (
        disposed ||
        state.busy ||
        state.closing ||
        pending ||
        !state.view?.item ||
        text === state.draft.text
      )
        return
      if (state.draft.revision === Number.MAX_SAFE_INTEGER) {
        update({ error: '草稿修订已达上限，请先保存并重新打开练习。' })
        return
      }
      lastEdit = Date.now()
      update({
        draft: { revision: state.draft.revision + 1, text },
        saveStatus: saving ? 'saving' : 'dirty',
        error: '',
      })
      schedule()
    },
    perform(action: PracticeAction): Promise<boolean> {
      if (pending || !state.view?.item) return Promise.resolve(false)
      return locked(async () => {
        if (!(await saveLatest(true)) || !state.view?.item || disposed) return false
        const session = state.view.session
        const input: RevealPractice = {
          requestId: globalThis.crypto.randomUUID(),
          cursor: {
            sessionId: session.sessionId,
            position: session.position,
            revision: session.revision,
          },
          draft: { ...state.draft },
        }
        if (action.kind === 'rate')
          pending = { method: 'rateAndAdvance', input: { ...input, rating: action.rating } }
        else if (action.kind === 'navigate')
          pending = { method: 'navigate', input: { ...input, direction: action.direction } }
        else pending = { method: action.kind, input }
        update({ pending: true })
        return executePending()
      })
    },
    retry: () => locked(() => (pending ? executePending() : saveLatest(true))),
    async flushForLeave(): Promise<boolean> {
      if (operation) await operation
      if (disposed || pending) return false
      return locked(() => saveLatest(true))
    },
    prepareClose(): Promise<boolean> {
      if (closeJob) return closeJob
      update({ closing: true })
      closeJob = (async () => {
        if (operation) await operation
        if (disposed || pending) {
          update({ closing: false })
          return false
        }
        const saved = await locked(() => saveLatest(true), true)
        if (!saved) update({ closing: false })
        return saved
      })().finally(() => {
        closeJob = undefined
      })
      return closeJob
    },
    cancelClose() {
      update({ closing: false })
    },
    dispose() {
      disposed = true
      clearTimer()
      listeners.clear()
    },
  }
}

export type PracticeController = ReturnType<typeof createPracticeController>
