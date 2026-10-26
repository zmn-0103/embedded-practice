import { useEffect, useRef, useState } from 'react'
import type { DataLocations, DirectoryTarget } from '../../../shared/contracts/data-locations'

export function DataLocationsPanel({
  disabled,
  onBusyChange,
}: {
  disabled: boolean
  onBusyChange: (busy: boolean) => void
}) {
  const [locations, setLocations] = useState<DataLocations>()
  const [loading, setLoading] = useState(true)
  const [readError, setReadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [opening, setOpening] = useState<DirectoryTarget>()
  const [notice, setNotice] = useState('')
  const [failed, setFailed] = useState(false)
  const mounted = useRef(false)
  const running = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  useEffect(() => {
    let current = true
    setLoading(true)
    setReadError('')
    void window.desktop.dataLocations
      .read()
      .then((result) => {
        if (!current) return
        if (result.ok) setLocations(result.value)
        else setReadError(result.error.message)
      })
      .catch(() => {
        if (current) setReadError('数据位置尚未读取成功，请重试。')
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [attempt])
  async function open(target: DirectoryTarget, label: string) {
    if (disabled || running.current || !locations) return
    running.current = true
    setOpening(target)
    setNotice('')
    setFailed(false)
    onBusyChange(true)
    try {
      const result = await window.desktop.dataLocations.open(target)
      if (!mounted.current) return
      setNotice(result.ok ? `已请求打开${label}。` : result.error.message)
      setFailed(!result.ok)
    } catch {
      if (mounted.current) {
        setNotice('文件夹打开结果尚未确认，请检查后重试。')
        setFailed(true)
      }
    } finally {
      running.current = false
      if (mounted.current) setOpening(undefined)
      onBusyChange(false)
    }
  }
  return (
    <section
      id="data-location-section"
      tabIndex={-1}
      className="data-locations"
      aria-label="数据位置"
    >
      <h3>数据位置</h3>
      <p>
        这里显示本次运行使用的位置。保护备份保存在下方备份目录，导出的备份以你选择的保存位置为准。
      </p>
      {loading && <p role="status">正在读取数据位置…</p>}
      {readError && (
        <div className="error-message" role="alert">
          <p>{readError}</p>
          <button
            type="button"
            disabled={disabled || loading || !!opening}
            onClick={() => setAttempt((value) => value + 1)}
          >
            重试读取数据位置
          </button>
        </div>
      )}
      {locations && (
        <>
          <dl>
            {(
              [
                ['data', '数据文件夹', locations.dataDirectory],
                ['backups', '备份文件夹', locations.backupDirectory],
                ['logs', '日志文件夹', locations.logDirectory],
              ] as const
            ).map(([target, label, path]) => (
              <div key={target}>
                <dt>{label}</dt>
                <dd>
                  <code>{path}</code>
                </dd>
                <dd>
                  <button
                    type="button"
                    disabled={disabled || !!opening || loading}
                    onClick={() => void open(target, label)}
                  >
                    {opening === target ? '正在打开文件夹…' : `打开${label}`}
                  </button>
                </dd>
              </div>
            ))}
          </dl>
          <p className="muted">
            诊断日志：<code>{locations.logFile}</code>（发生诊断时生成）
          </p>
        </>
      )}
      {notice && (
        <p
          role={failed ? 'alert' : 'status'}
          className={failed ? 'error-message' : 'operation-message'}
        >
          {notice}
        </p>
      )}
    </section>
  )
}
