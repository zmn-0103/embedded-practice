import { useRef, useState } from 'react'
import type { BackupFile, BackupPreview } from '../../../shared/contracts/backup'
import { backupPreviewSchema } from '../../../shared/contracts/backup'

export function BackupPanel({
  disabled,
  onBusyChange,
}: {
  disabled: boolean
  onBusyChange: (busy: boolean) => void
}) {
  const running = useRef(false)
  const [busy, setBusy] = useState<'export' | 'preview' | 'restore'>()
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  const [result, setResult] = useState<
    { kind: 'export'; file: BackupFile } | { kind: 'preview'; file: BackupPreview }
  >()
  async function perform(kind: 'export' | 'preview') {
    if (disabled || running.current) return
    running.current = true
    setBusy(kind)
    onBusyChange(true)
    setResult(undefined)
    setMessage('')
    setFailed(false)
    try {
      const response =
        kind === 'export'
          ? await window.desktop.backup.export()
          : await window.desktop.backup.preview()
      if (response.ok) {
        setResult(
          kind === 'preview'
            ? { kind: 'preview', file: backupPreviewSchema.parse(response.value) }
            : { kind: 'export', file: response.value },
        )
        setMessage(
          kind === 'export' ? '完整备份已导出并校验。' : '备份预览校验通过。当前数据保持原状。',
        )
      } else {
        setMessage(response.error.message)
        setFailed(response.error.code !== 'CANCELLED')
      }
    } catch {
      setMessage('备份操作结果尚未确认，请检查目标文件后重试。')
      setFailed(true)
    } finally {
      running.current = false
      setBusy(undefined)
      onBusyChange(false)
    }
  }
  async function restore() {
    if (disabled || running.current || result?.kind !== 'preview') return
    const token = result.file.token
    running.current = true
    setBusy('restore')
    onBusyChange(true)
    setMessage('正在确认并准备恢复，请等待保存和保护性备份完成…')
    setFailed(false)
    let restarting = false
    try {
      const response = await window.desktop.backup.restore({ token })
      if (response.ok) {
        restarting = true
        setMessage(`恢复已完成，正在重启。原数据保护性备份：${response.value.protectionPath}`)
      } else {
        setMessage(response.error.message)
        setFailed(response.error.code !== 'CANCELLED')
        if (response.error.code !== 'CANCELLED') setResult(undefined)
      }
    } catch {
      setMessage('恢复结果尚未确认。请等待应用重启；如未重启，请退出后重新启动并检查数据。')
      setFailed(true)
      setResult(undefined)
    } finally {
      if (!restarting) {
        running.current = false
        setBusy(undefined)
        onBusyChange(false)
      }
    }
  }
  const summary = result?.file.summary
  return (
    <section id="backup-section" tabIndex={-1} aria-label="完整备份与恢复预览">
      <h3>备份与恢复</h3>
      <p>
        完整备份包含题库、历史版本、图片、学习记录、收藏、练习进度、已安装主题及显示布局设置。
        备份仅包含已经保存的数据；调整显示后请先保存，再导出。
      </p>
      <div className="import-actions">
        <button type="button" disabled={disabled || !!busy} onClick={() => void perform('export')}>
          {busy === 'export' ? '正在导出完整备份…' : '导出完整备份'}
        </button>
        <button type="button" disabled={disabled || !!busy} onClick={() => void perform('preview')}>
          {busy === 'preview' ? '正在校验备份…' : '选择备份并预览'}
        </button>
      </div>
      <p className="muted">
        恢复将替换当前全部数据并重启。请先预览核对；程序会先保存待保存内容并创建当前数据的保护性备份，保护失败时停止恢复。
      </p>
      {message && (
        <p
          className={failed ? 'error-message' : 'operation-message'}
          role={failed ? 'alert' : 'status'}
        >
          {message}
        </p>
      )}
      {summary && (
        <section aria-label={result.kind === 'export' ? '已导出备份摘要' : '恢复预览摘要'}>
          <h4>{result.kind === 'export' ? '已导出备份' : '恢复预览'}</h4>
          <p className="muted">{result.file.filePath}</p>
          <p>
            备份时间：
            {summary.createdAt
              ? new Date(summary.createdAt).toLocaleString('zh-CN')
              : '未知（旧备份未记录时间）'}
          </p>
          {result.kind === 'preview' && (
            <button type="button" disabled={disabled || !!busy} onClick={() => void restore()}>
              {busy === 'restore' ? '正在准备恢复并重启…' : '恢复此备份…'}
            </button>
          )}
          <p>
            数据结构版本：{summary.schemaVersion}
            {summary.requiresMigration ? '（恢复时需要升级，兼容性已在副本中检查）' : ''}
          </p>
          <dl className="count-grid">
            {(
              [
                ['分类', summary.categories],
                ['练习方案', summary.practicePlans],
                ['已安装主题', summary.installedThemes],
                ['专题', summary.topics],
                ['题目总数', summary.questions],
                ['归档题目', summary.archivedQuestions],
                ['内容版本', summary.versions],
                ['图片', summary.images],
                ['练习轮次', summary.sessions],
                ['非空草稿', summary.drafts],
                ['收藏', summary.favorites],
                ['自评记录', summary.ratings],
              ] as const
            ).map(([label, count]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{count}</dd>
              </div>
            ))}
          </dl>
          <p className="muted">
            当前主题：{summary.appearance.themeId} ·{' '}
            {summary.appearance.theme === 'system'
              ? '跟随系统'
              : summary.appearance.theme === 'dark'
                ? '暗色'
                : '明色'}{' '}
            · {summary.appearance.fontSize}px
            {' · '}
            {summary.appearance.navigationCollapsed ? '导航收起' : '导航展开'}
            {' · '}
            {summary.appearance.auxiliaryHidden ? '辅助面板隐藏' : '辅助面板显示'}
          </p>
          <p>
            {summary.activeSession
              ? '包含可继续的练习轮次及固定队列。'
              : '没有可继续的活动练习轮次。'}
          </p>
        </section>
      )}
    </section>
  )
}
