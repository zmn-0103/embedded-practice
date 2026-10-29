import type {
  PlanningChange,
  PlanningDesktopApi,
  PlanningRecord,
} from '../../shared/contracts/planning'

export function createPlanningController(api: Pick<PlanningDesktopApi, 'change'>) {
  let state: {
    draft: PlanningChange | undefined
    pending: PlanningChange | undefined
    saving: boolean
    conflict: boolean
    error: string
    confirmed: number
  } = {
    draft: undefined,
    pending: undefined,
    saving: false,
    conflict: false,
    error: '',
    confirmed: 0,
  }
  const listeners = new Set<() => void>()
  let operation: Promise<boolean> | undefined,
    disposed = false
  const update = (value: Partial<typeof state>) => {
    if (!disposed) {
      state = { ...state, ...value }
      listeners.forEach((listener) => listener())
    }
  }
  const hasPending = () => Boolean(state.draft || state.pending)
  function matches(command: PlanningChange, value: PlanningRecord | null) {
    if (command.kind === 'exam-delete') return value === null
    if (
      !value ||
      value.type !== command.kind ||
      ![command.expectedRevision, command.expectedRevision + 1].includes(value.revision)
    )
      return false
    if (command.kind === 'daily' && value.type === 'daily')
      return (
        command.day === value.day &&
        command.ratingTarget === value.ratingTarget &&
        command.reviewTarget === value.reviewTarget
      )
    if (command.kind === 'exam' && value.type === 'exam')
      return (
        command.goalId === value.goalId &&
        command.name === value.name &&
        command.deadline === value.deadline &&
        JSON.stringify(command.setIds) === JSON.stringify(value.setIds)
      )
    return (
      command.kind === 'quota' &&
      value.type === 'quota' &&
      JSON.stringify(command.rows) === JSON.stringify(value.rows)
    )
  }
  async function run(command: PlanningChange) {
    update({ pending: command, saving: true, error: '' })
    try {
      const result = await api.change(command)
      if (disposed) return false
      if (!result.ok) {
        update({
          error: result.error.message,
          pending: result.error.code === 'DATABASE_UNAVAILABLE' ? command : undefined,
          conflict: result.error.code === 'CONFLICT',
        })
        return false
      }
      if (!matches(command, result.value)) throw new Error('设置确认不匹配')
      update({
        draft: undefined,
        pending: undefined,
        conflict: false,
        error: '',
        confirmed: state.confirmed + 1,
      })
      return true
    } catch {
      update({ error: '保存结果尚未确认，请保留输入并重试原操作。' })
      return false
    } finally {
      update({ saving: false })
    }
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
    begin(command: PlanningChange) {
      if (disposed || hasPending() || operation) return false
      update({ draft: structuredClone(command), error: '', conflict: false })
      return true
    },
    edit(command: PlanningChange) {
      if (!disposed && state.draft && !state.saving && !state.pending && !state.conflict)
        update({ draft: structuredClone(command), error: '' })
    },
    save(): Promise<boolean> {
      if (disposed || state.conflict) return Promise.resolve(false)
      if (operation) return operation
      const command = state.pending ?? state.draft
      if (!command) return Promise.resolve(true)
      const job = run(command)
      operation = job
      return job.finally(() => {
        if (operation === job) operation = undefined
      })
    },
    flush(): Promise<boolean> {
      if (operation) return operation
      if (hasPending()) {
        update({ error: '设置尚未确认，请先保存或明确放弃本地编辑。' })
        return Promise.resolve(false)
      }
      return Promise.resolve(!disposed)
    },
    discard() {
      if (!disposed && !state.saving)
        update({
          draft: undefined,
          pending: undefined,
          conflict: false,
          error: '',
          confirmed: state.confirmed + 1,
        })
    },
    dispose() {
      disposed = true
      listeners.clear()
    },
  }
}
