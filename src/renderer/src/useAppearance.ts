import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppearanceSettings } from '../../shared/contracts/settings'
import {
  DEFAULT_THEME_ID,
  themeVariables,
  type ThemeCatalog,
  type ThemeDefinition,
} from '../../shared/contracts/themes'
import { builtinTheme } from '../../shared/themes'

function resolveTheme(catalog: ThemeCatalog, themeId: string): ThemeDefinition {
  return (
    catalog.entries.find((entry) => entry.definition.id === themeId)?.definition ??
    builtinTheme(DEFAULT_THEME_ID)!
  )
}

export function useAppearance() {
  const [value, setValue] = useState<AppearanceSettings>()
  const [catalog, setCatalog] = useState<ThemeCatalog>()
  const [definition, setDefinition] = useState<ThemeDefinition>()
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const generation = useRef(0)
  const mounted = useRef(false)
  const pending = useRef<Promise<boolean> | undefined>(undefined)
  const saveFocus = useRef<HTMLElement | undefined>(undefined)
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
    void Promise.all([window.desktop.settings.read(), window.desktop.themes.list()])
      .then(([result, themes]) => {
        if (!mounted.current || epoch !== generation.current) return
        if (result.ok && themes.ok) {
          setValue(result.value)
          setCatalog(themes.value)
          setDefinition(resolveTheme(themes.value, result.value.themeId))
        } else setError(!result.ok ? result.error.message : !themes.ok ? themes.error.message : '')
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
    if (!value || !definition) return
    const root = document.documentElement
    for (const [name, cssValue] of Object.entries(themeVariables(definition)))
      root.style.setProperty(name, cssValue)
    document.documentElement.dataset.theme = value.theme
    document.documentElement.dataset.palette = value.palette
    document.documentElement.dataset.fontSize = String(value.fontSize)
    root.dataset.themeId = definition.id
    root.dataset.layout = definition.presentation.layout
    root.dataset.navigationCollapsed = String(value.navigationCollapsed)
    root.dataset.auxiliaryHidden = String(value.auxiliaryHidden)
  }, [value, definition])
  useEffect(() => {
    if (busy) return
    const target = saveFocus.current
    saveFocus.current = undefined
    // 保存期间disabled会让浏览器退回body；仅在用户尚未聚焦别处时恢复原控件。
    if (
      target?.isConnected &&
      !target.matches(':disabled') &&
      (document.activeElement === document.body || document.activeElement === target)
    ) {
      target.focus({ preventScroll: true })
      const box = target.getBoundingClientRect()
      if (box.top < 0 || box.bottom > window.innerHeight)
        target.scrollIntoView({ block: 'nearest' })
    }
  }, [busy, value, definition])
  async function acceptCatalog(next: ThemeCatalog): Promise<boolean> {
    const result = await window.desktop.settings.read()
    if (!mounted.current) return false
    if (!result.ok) {
      setError(result.error.message)
      return false
    }
    setError('')
    setCatalog(next)
    // 安装与更新只修改目录；当前渲染快照保留到明确保存应用。卸载当前主题则同步事务中的默认选择。
    if (!value || result.value.themeId !== value.themeId)
      setDefinition(resolveTheme(next, result.value.themeId))
    setValue((previous) =>
      JSON.stringify(previous) === JSON.stringify(result.value) ? previous : result.value,
    )
    return true
  }
  async function save(settings: AppearanceSettings): Promise<boolean> {
    if (pending.current || busy) return false
    saveFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : undefined
    const epoch = ++generation.current
    setBusy(true)
    setError('')
    // 完整目标由本次调用捕获；响应丢失时保留表单，可重试相同目标。
    const target = { ...settings }
    const job = window.desktop.settings
      .save(target)
      .then((result) => {
        if (mounted.current && epoch === generation.current) {
          if (result.ok) {
            setValue(result.value)
            if (catalog) setDefinition(resolveTheme(catalog, result.value.themeId))
          } else setError(result.error.message)
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
    catalog,
    definition,
    acceptCatalog,
    warning:
      value && catalog && !catalog.entries.some((entry) => entry.definition.id === value.themeId)
        ? `已保存的主题 ${value.themeId} 缺失或损坏，当前临时使用松间绿。原选择已保留，请在设置中修复或重新选择。`
        : '',
    busy,
    error,
    save,
    waitForSave,
    reload: () => {
      if (!pending.current && !busy) setAttempt((previous) => previous + 1)
    },
  }
}
