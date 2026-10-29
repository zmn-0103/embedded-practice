import { useEffect, useRef, useState } from 'react'
import type { MaterialRequest, MaterialSource } from '../../../shared/contracts/study'
import { useNoteSaves } from '../note-saves'

export function MaterialExport({
  source,
  label,
  count,
  disabled = false,
  onBusy,
  onOperation,
}: {
  source: MaterialSource
  label: string
  count: number
  disabled?: boolean
  onBusy: (busy: boolean) => void
  onOperation: (work: Promise<boolean>) => void
}) {
  const saves = useNoteSaves()
  const [mode, setMode] = useState<MaterialRequest['mode']>('questions')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const mounted = useRef(false),
    running = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  function perform() {
    if (running.current || disabled || count < 1 || count > 500) return
    running.current = true
    setBusy(true)
    setError('')
    setMessage('')
    onBusy(true)
    const request = structuredClone({ source, mode })
    const job = (async () => {
      try {
        if (!(await saves.flush())) {
          if (mounted.current) setError('个人笔记尚未确认保存，未导出。请保留输入并处理保存状态。')
          return false
        }
        const result = await window.desktop.study.exportMaterial(request)
        if (!mounted.current) return false
        if (!result.ok) {
          setError(result.error.message)
          return false
        }
        setMessage(
          `已导出${result.value.questions}题、${result.value.images}张图片：${result.value.filePath}${result.value.assetsPath ? '。请将同目录资源文件夹一起保留。' : ''}`,
        )
        return true
      } catch {
        if (mounted.current)
          setError(
            '导出结果尚未确认，请先核对所选位置。重新导出会再次选择文件，不会自动覆盖其他材料。',
          )
        return false
      } finally {
        running.current = false
        onBusy(false)
        if (mounted.current) setBusy(false)
      }
    })()
    onOperation(job)
  }
  return (
    <details className="material-export">
      <summary>导出Markdown复习材料</summary>
      <p>
        范围：{label} · 共{count}题。每次最多500题，不补题或截断。
      </p>
      <p className="muted">
        {source.kind === 'set'
          ? '采用所选已保存题单的当前有效版本；临时勾选/未更新修改不包含，归档或失效会拒绝整批。'
          : '采用本轮当时保存的题目版本和顺序。'}
      </p>
      <label>
        包含内容
        <select
          aria-label="复习材料包含内容"
          value={mode}
          disabled={disabled || busy}
          onChange={(event) => setMode(event.currentTarget.value as MaterialRequest['mode'])}
        >
          <option value="questions">仅题目</option>
          <option value="answers">题目＋参考答案</option>
          <option value="personal">题目＋自己的作答＋个人笔记</option>
        </select>
      </label>
      {mode === 'answers' && <p>将明确导出参考答案；导出不会改变程序内的揭晓或复习状态。</p>}
      {mode === 'personal' && (
        <p>
          {source.kind === 'set'
            ? '作答仅取当前版本最近一次已结束轮次的实际记录，无记录会明确留空。'
            : '作答采用本轮记录。'}
          个人笔记为导出时已保存内容，并非本轮当时快照。
        </p>
      )}
      <p className="muted">
        保存前会确认笔记。图片随材料复制至同目录独立资源文件夹；不会读取来源文件或网络。
      </p>
      <button
        type="button"
        disabled={disabled || busy || count < 1 || count > 500}
        onClick={perform}
      >
        {busy ? '正在导出复习材料…' : '确认范围与内容并选择保存位置…'}
      </button>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
    </details>
  )
}
