import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppearanceSettings } from '../../shared/contracts/settings'

export function useAppearance() {
  const [value, setValue] = useState<AppearanceSettings>()
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const generation = useRef(0)
  const mounted = useRef(false)
  const pending = useRef<Promise<boolean> | undefined>(undefined)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      generation.current++
    }
  }, [])
  useEffect(() => {
    const epoch = ++generation.current
    setBusy(true)
    setError('')
    void window.desktop.settings
      .read()
      .then((result) => {
        if (!mounted.current || epoch !== generation.current) return
        if (result.ok) setValue(result.value)
        else setError(result.error.message)
      })
      .catch(() => {
        if (mounted.current && epoch === generation.current) setError('显示设置读取失败，请重试。')
      })
      .finally(() => {
        if (mounted.current && epoch === generation.current) setBusy(false)
      })
    return () => {
      if (epoch === generation.current) generation.current++
    }
  }, [attempt])
  useEffect(() => {
    if (!value) return
    document.documentElement.dataset.theme = value.theme
    document.documentElement.dataset.palette = value.palette
    document.documentElement.dataset.fontSize = String(value.fontSize)
  }, [value])
  async function save(settings: AppearanceSettings): Promise<boolean> {
    if (pending.current || busy) return false
    const epoch = ++generation.current
    setBusy(true)
    setError('')
    // 完整目标由本次调用捕获；响应丢失时保留表单，可重试相同目标。
    const target = { ...settings }
    const job = window.desktop.settings
      .save(target)
      .then((result) => {
        if (mounted.current && epoch === generation.current) {
          if (result.ok) setValue(result.value)
          else setError(result.error.message)
        }
        return result.ok
      })
      .catch(() => {
        if (mounted.current && epoch === generation.current)
          setError('显示设置保存结果尚未确认，请重试保存。')
        return false
      })
      .finally(() => {
        if (pending.current === job) pending.current = undefined
        if (mounted.current && epoch === generation.current) setBusy(false)
      })
    pending.current = job
    return job
  }
  const waitForSave = useCallback(() => pending.current ?? Promise.resolve(true), [])
  return {
    value,
    busy,
    error,
    save,
    waitForSave,
    reload: () => {
      if (!pending.current && !busy) setAttempt((previous) => previous + 1)
    },
  }
}
