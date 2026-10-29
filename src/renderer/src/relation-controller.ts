import type {
  KnowledgeDesktopApi,
  Relation,
  RelationDraft,
  RelationChange,
} from '../../shared/contracts/knowledge'

export function createRelationController(api: Pick<KnowledgeDesktopApi, 'changeRelation'>) {
  let state: {
    draft: RelationDraft | undefined
    relationId: string
    expectedRevision: number
    pending: RelationChange | undefined
    saving: boolean
    conflict: boolean
    error: string
    message: string
    confirmed: number
  } = {
    draft: undefined,
    relationId: '',
    expectedRevision: 0,
    pending: undefined,
    saving: false,
    conflict: false,
    error: '',
    message: '',
    confirmed: 0,
  }
  const listeners = new Set<() => void>()
  let operation: Promise<boolean> | undefined,
    disposed = false
  const update = (change: Partial<typeof state>) => {
    if (!disposed) {
      state = { ...state, ...change }
      listeners.forEach((listener) => listener())
    }
  }
  const hasPending = () => Boolean(state.draft || state.pending)
  async function run(command: RelationChange): Promise<boolean> {
    update({ pending: command, saving: true, error: '', message: '' })
    try {
      const result = await api.changeRelation(command)
      if (disposed) return false
      if (!result.ok) {
        update({
          error: result.error.message,
          pending: result.error.code === 'DATABASE_UNAVAILABLE' ? command : undefined,
          conflict: result.error.code === 'CONFLICT',
        })
        return false
      }
      const value = result.value
      if (
        command.action === 'delete'
          ? value !== null
          : !value ||
            value.relationId !== command.relationId ||
            ![command.expectedRevision, command.expectedRevision + 1].includes(value.revision) ||
            JSON.stringify([value.source, value.target, value.kind, value.explanation]) !==
              JSON.stringify([command.source, command.target, command.kind, command.explanation])
      )
        throw new Error('关联确认不匹配')
      update({
        draft: undefined,
        pending: undefined,
        conflict: false,
        error: '',
        message: command.action === 'delete' ? '关联已删除。' : '关联已保存。',
        confirmed: state.confirmed + 1,
      })
      return true
    } catch {
      update({ error: '关联保存结果尚未确认，请保留输入并重试原操作。' })
      return false
    } finally {
      update({ saving: false })
    }
  }
  function submit(command: RelationChange): Promise<boolean> {
    if (operation) return operation
    const job = run(command)
    operation = job
    return job.finally(() => {
      if (operation === job) operation = undefined
    })
  }
  return {
    getState: () => state,
    hasPending,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    flush(): Promise<boolean> {
      if (operation) return operation
      if (hasPending()) {
        update({ error: '关联尚未确认，请先保存或明确放弃本地编辑。' })
        return Promise.resolve(false)
      }
      return Promise.resolve(!disposed)
    },
    begin(draft: RelationDraft, existing?: Relation) {
      if (disposed || state.saving || hasPending()) return false
      update({
        draft: {
          source: draft.source,
          target: draft.target,
          kind: draft.kind,
          explanation: draft.explanation,
        },
        relationId: existing?.relationId ?? crypto.randomUUID(),
        expectedRevision: existing?.revision ?? 0,
        error: '',
        message: '',
        conflict: false,
      })
      return true
    },
    edit(change: Partial<RelationDraft>) {
      if (!disposed && state.draft && !state.pending && !state.saving && !state.conflict)
        update({ draft: { ...state.draft, ...change }, error: '' })
    },
    save() {
      if (disposed || state.conflict) return Promise.resolve(false)
      if (state.pending) return submit(state.pending)
      if (!state.draft) return Promise.resolve(true)
      return submit({
        action: 'save',
        ...state.draft,
        relationId: state.relationId,
        expectedRevision: state.expectedRevision,
      })
    },
    remove(expected: Relation) {
      if (disposed || hasPending()) return Promise.resolve(false)
      return submit({ action: 'delete', expected })
    },
    discard() {
      if (disposed || state.saving) return
      update({
        draft: undefined,
        pending: undefined,
        conflict: false,
        error: '',
        message: '本地编辑已放弃，请核对重新读取的关联。',
        confirmed: state.confirmed + 1,
      })
    },
    dispose() {
      disposed = true
      listeners.clear()
    },
  }
}
