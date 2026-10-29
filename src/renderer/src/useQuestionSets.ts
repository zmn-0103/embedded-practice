import { useCallback, useEffect, useRef, useState } from 'react'
import type { QuestionSetChange, QuestionSetPreview } from '../../shared/contracts/question-sets'

export function useQuestionSets(
  refresh: number,
  onBlocked: (value: boolean) => void,
  onOperation: (work: Promise<boolean>) => void,
) {
  const api = window.desktop.questionSets
  const [sets, setSets] = useState<
    {
      setId: string
      name: string
      count: number
      pinned?: boolean | undefined
      lastUsedAt?: string | null | undefined
    }[]
  >([])
  const [pending, setPending] = useState<QuestionSetChange>()
  const [confirmed, setConfirmed] = useState<QuestionSetChange>()
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [readError, setReadError] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const mounted = useRef(false)
  const running = useRef(false)
  const generation = useRef(0)
  const reload = useCallback(async () => {
    const epoch = ++generation.current
    setLoading(true)
    setReadError('')
    try {
      const result = await api.list()
      if (!mounted.current || epoch !== generation.current) return
      if (result.ok) setSets(result.value)
      else setReadError(result.error.message)
    } catch {
      if (mounted.current && epoch === generation.current)
        setReadError('无法读取固定题单，请重试。')
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
  function perform(change: QuestionSetChange) {
    if (running.current) return
    const command = pending ?? structuredClone(change)
    running.current = true
    setBusy(true)
    setError('')
    setMessage('')
    setPending(command)
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
        setConfirmed(command)
        setMessage(
          command.kind === 'pin'
            ? command.pinned
              ? '题单已置顶。'
              : '题单已取消置顶。'
            : command.kind === 'delete'
              ? '题单已删除，题目和练习记录保留。'
              : '固定题单已保存。',
        )
        return true
      } catch {
        if (mounted.current) setError('题单操作结果尚未确认，请按原操作重试或停止重试后核对。')
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
    return job
  }
  function load(setId: string) {
    if (running.current || pending) return
    running.current = true
    setBusy(true)
    setError('')
    setMessage('')
    onBlocked(true)
    const job = (async (): Promise<QuestionSetPreview | undefined> => {
      try {
        const result = await api.preview({ setId })
        if (!mounted.current) return
        if (!result.ok) {
          setError(result.error.message)
          return
        }
        if (result.value.definition?.setId !== setId) throw new Error('题单身份不匹配')
        return result.value
      } catch {
        if (mounted.current) setError('无法确认题单内容，请重试载入。')
        return
      } finally {
        running.current = false
        if (mounted.current) {
          setBusy(false)
          onBlocked(false)
        }
      }
    })()
    onOperation(job.then((value) => Boolean(value)))
    return job
  }
  function abandon() {
    if (running.current) return
    release()
    setError('')
    setMessage('已停止重试，请核对实际题单列表；已保存题单不会被删除。')
    void reload()
  }
  return {
    sets,
    pending,
    confirmed,
    busy,
    loading,
    readError,
    error,
    message,
    reload,
    perform,
    load,
    abandon,
  }
}
