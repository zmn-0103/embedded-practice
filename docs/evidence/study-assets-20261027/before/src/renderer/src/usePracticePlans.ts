import { useCallback, useEffect, useRef, useState } from 'react'
import type { PracticePlan, PracticePlanChange } from '../../shared/contracts/practice-plans'

export function usePracticePlans(
  refresh: number,
  onBlocked: (blocked: boolean) => void,
  onOperation: (work: Promise<boolean>) => void,
) {
  const api = window.desktop.practicePlans
  const [plans, setPlans] = useState<PracticePlan[]>([])
  const [pending, setPending] = useState<PracticePlanChange>()
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [readError, setReadError] = useState('')
  const [message, setMessage] = useState('')
  const mounted = useRef(false)
  const generation = useRef(0)
  const running = useRef(false)
  const reload = useCallback(async () => {
    const epoch = ++generation.current
    setLoading(true)
    setReadError('')
    try {
      const result = await api.list()
      if (!mounted.current || epoch !== generation.current) return
      if (result.ok) setPlans(result.value)
      else setReadError(result.error.message)
    } catch {
      if (mounted.current && epoch === generation.current)
        setReadError('无法读取练习方案，请重试。')
    } finally {
      if (mounted.current && epoch === generation.current) setLoading(false)
    }
  }, [api])
  useEffect(() => {
    mounted.current = true
    void reload()
    return () => {
      mounted.current = false
      generation.current++
    }
  }, [reload, refresh])

  function release() {
    setPending(undefined)
    onBlocked(false)
  }
  function perform(change: PracticePlanChange) {
    if (running.current) return
    const command = pending ?? change
    running.current = true
    setBusy(true)
    setPending(command)
    setError('')
    setMessage('')
    onBlocked(true)
    const job = (async () => {
      try {
        const result = await api.change(command)
        if (!mounted.current) return false
        if (!result.ok) {
          setError(result.error.message)
          if (result.error.code !== 'DATABASE_UNAVAILABLE') release()
          return false
        }
        release()
        setMessage(
          command.kind === 'save'
            ? '练习方案已保存。'
            : command.kind === 'update'
              ? '练习方案已更新，当前练习保持。'
              : '练习方案已删除，练习记录保持。',
        )
        return true
      } catch {
        if (mounted.current) setError('方案操作结果尚未确认，请按原操作重试或停止重试后核对列表。')
        return false
      } finally {
        running.current = false
        if (mounted.current) {
          setBusy(false)
          void reload()
        }
      }
    })()
    onOperation(job)
  }
  function abandon() {
    if (running.current) return
    release()
    setError('')
    setMessage('已停止重试；请核对实际方案列表，此操作不会删除已保存方案。')
    void reload()
  }
  return { plans, pending, busy, loading, error, readError, message, reload, perform, abandon }
}
