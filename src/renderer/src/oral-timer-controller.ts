export const ORAL_DURATIONS = [60, 120, 180, 300] as const
export type OralDuration = (typeof ORAL_DURATIONS)[number]
type Timer = {
  duration: OralDuration
  remaining: number
  status: 'idle' | 'running' | 'paused' | 'expired'
  reason: string
}
export function createOralTimerController(now = () => performance.now()) {
  const timers = new Map<number, Timer>(),
    listeners = new Set<() => void>()
  let state: {
    sessionId: string | null
    position: number | null
    available: boolean
    enabled: boolean
    timer: Timer | null
  } = { sessionId: null, position: null, available: false, enabled: false, timer: null }
  let deadline = 0,
    disposed = false
  const current = () => (state.position === null ? undefined : timers.get(state.position))
  const publish = () => {
    if (disposed) return
    const timer = current()
    state = { ...state, timer: timer ? { ...timer } : null }
    listeners.forEach((listener) => listener())
  }
  function settle(reason: string, pause: boolean) {
    const timer = current()
    if (!timer || timer.status !== 'running') return
    timer.remaining = Math.max(0, deadline - now())
    if (timer.remaining === 0) {
      timer.status = 'expired'
      timer.reason = '计时已到'
    } else if (pause) {
      timer.status = 'paused'
      timer.reason = reason
    }
  }
  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    select(sessionId: string | null, position: number | null, available: boolean, reason: string) {
      if (disposed) return
      const changed = sessionId !== state.sessionId || position !== state.position
      if (changed || !available) settle(reason, true)
      if (sessionId !== state.sessionId) {
        timers.clear()
        state = { ...state, enabled: false }
      }
      state = { ...state, sessionId, position, available }
      if (sessionId !== null && position !== null && !timers.has(position))
        timers.set(position, { duration: 120, remaining: 120000, status: 'idle', reason: '' })
      publish()
    },
    enable(enabled: boolean) {
      if (disposed || !current() || (enabled && !state.available)) return
      if (!enabled) settle('已关闭计时', true)
      state = { ...state, enabled }
      publish()
    },
    start() {
      const timer = current()
      if (
        disposed ||
        !state.enabled ||
        !state.available ||
        !timer ||
        timer.status === 'running' ||
        timer.status === 'expired'
      )
        return
      deadline = now() + timer.remaining
      timer.status = 'running'
      timer.reason = ''
      publish()
    },
    pause(reason = '手动暂停') {
      if (disposed || current()?.status !== 'running') return
      settle(reason, true)
      publish()
    },
    reset(duration: OralDuration = current()?.duration ?? 120) {
      if (!ORAL_DURATIONS.includes(duration)) throw new RangeError('口述计时时长无效')
      if (disposed || !state.enabled || !state.available || state.position === null) return
      timers.set(state.position, {
        duration,
        remaining: duration * 1000,
        status: 'idle',
        reason: '',
      })
      publish()
    },
    tick() {
      if (disposed || current()?.status !== 'running') return
      settle('', false)
      publish()
    },
    dispose() {
      disposed = true
      timers.clear()
      listeners.clear()
    },
  }
}
export type OralTimerController = ReturnType<typeof createOralTimerController>
