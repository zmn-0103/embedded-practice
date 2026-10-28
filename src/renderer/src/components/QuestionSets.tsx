import { useEffect, useState } from 'react'
import type { QuestionIdentity } from '../../../shared/contracts/library-desktop'
import {
  MAX_QUESTION_SET_ITEMS,
  questionIdentityKey,
  type QuestionSet,
  type QuestionSetChange,
  type QuestionSetPreview,
} from '../../../shared/contracts/question-sets'
import { useQuestionSets } from '../useQuestionSets'
import { MaterialExport } from './MaterialExport'

const fold = (value: string) => value.replace(/[A-Z]/g, (letter) => letter.toLowerCase())
export function QuestionSets({
  items,
  refresh,
  disabled,
  onChange,
  onPractice,
  onBlocked,
  onOperation,
}: {
  items: QuestionIdentity[]
  refresh: number
  disabled: boolean
  onChange: (items: QuestionIdentity[]) => void
  onPractice: (items: QuestionIdentity[], sourceName: string, contentUpdatedOnly?: boolean) => void
  onBlocked: (value: boolean) => void
  onOperation: (work: Promise<boolean>) => void
}) {
  const model = useQuestionSets(refresh, onBlocked, onOperation)
  const [name, setName] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [loaded, setLoaded] = useState<QuestionSet>()
  const [preview, setPreview] = useState<QuestionSetPreview>()
  const [previewError, setPreviewError] = useState('')
  const [previewBusy, setPreviewBusy] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [confirmation, setConfirmation] = useState<QuestionSetChange>()
  const [exportBusy, setExportBusy] = useState(false)
  useEffect(() => {
    const command = model.confirmed
    if (!command) return
    if (command.kind === 'delete')
      setLoaded((previous) => (previous?.setId === command.setId ? undefined : previous))
    else setLoaded({ setId: command.setId, name: command.name, items: command.items })
  }, [model.confirmed])
  useEffect(() => {
    let current = true
    setPreview(undefined)
    setPreviewBusy(true)
    setPreviewError('')
    void window.desktop.questionSets
      .preview({ items })
      .then((result) => {
        if (!current) return
        if (!result.ok) {
          setPreviewError(result.error.message)
          return
        }
        if (
          JSON.stringify(result.value.items.map(questionIdentityKey)) !==
          JSON.stringify(items.map(questionIdentityKey))
        )
          throw new Error('题目预览不匹配')
        setPreview(result.value)
      })
      .catch(() => {
        if (current) setPreviewError('无法读取勾选题目，请重试。')
      })
      .finally(() => {
        if (current) setPreviewBusy(false)
      })
    return () => {
      current = false
    }
  }, [items, refresh, attempt])
  const locked =
    disabled ||
    exportBusy ||
    model.busy ||
    model.loading ||
    Boolean(model.pending) ||
    Boolean(model.readError)
  const selected = model.sets.find((set) => set.setId === selectedId)
  const duplicate = model.sets.some((set) => fold(set.name) === fold(name.trim()))
  const updateDuplicate = model.sets.some(
    (set) => set.setId !== loaded?.setId && fold(set.name) === fold(name.trim()),
  )
  const unavailable = preview?.items.filter((item) => item.status !== 'available') ?? []
  const sourceName =
    loaded && JSON.stringify(loaded.items) === JSON.stringify(items)
      ? `题单：${loaded.name}`
      : '勾选题目'
  return (
    <section className="question-sets" aria-label="勾选组卷与固定题单">
      <p className="muted">
        勾选跨专题、分页和筛选保持；题单保存明确身份，条件方案保存筛选。每份最多
        {MAX_QUESTION_SET_ITEMS}题。临时勾选在关闭程序后清空，保存题单可反复使用。
      </p>
      <fieldset disabled={locked || Boolean(confirmation)}>
        <legend>当前勾选（{items.length}题）</legend>
        <div className="button-row">
          <button
            type="button"
            disabled={!items.length || previewBusy || Boolean(previewError)}
            onClick={() => onPractice(structuredClone(items), sourceName)}
          >
            确认这批题目并练习…
          </button>
          <button
            type="button"
            disabled={!items.length || previewBusy || Boolean(previewError)}
            onClick={() => onPractice(structuredClone(items), `内容更新复习：${sourceName}`, true)}
          >
            复习勾选中的更新题…
          </button>
          <button type="button" disabled={!items.length} onClick={() => onChange([])}>
            清空临时勾选
          </button>
          <button type="button" disabled={previewBusy} onClick={() => setAttempt(attempt + 1)}>
            重新读取勾选题目
          </button>
        </div>
        {preview && (
          <ol className="selected-question-list">
            {preview.items.map((item) => (
              <li key={questionIdentityKey(item)}>
                <span>{item.title ?? `${item.topicId} / ${item.questionId}`}</span>
                <span className="muted">
                  {item.topicTitle ?? '专题已失效'} ·{' '}
                  {item.status === 'available'
                    ? '可练习'
                    : item.status === 'archived'
                      ? '已归档'
                      : item.status === 'not-pending'
                        ? '不属于更新待复习'
                        : '已失效'}
                </span>
                <button
                  type="button"
                  aria-label={`移出勾选：${item.topicId} / ${item.questionId}`}
                  onClick={() =>
                    onChange(
                      items.filter(
                        (value) => questionIdentityKey(value) !== questionIdentityKey(item),
                      ),
                    )
                  }
                >
                  移出
                </button>
              </li>
            ))}
          </ol>
        )}
        {unavailable.length > 0 && (
          <p role="alert">
            有{unavailable.length}项归档或失效。确认页面会逐项列出，移除由你决定，不会自动补题。
          </p>
        )}
        <form
          className="library-filters"
          onSubmit={(event) => {
            event.preventDefault()
            if (locked || confirmation || !items.length || duplicate) return
            model.perform({
              kind: 'save',
              setId: crypto.randomUUID(),
              name,
              items: structuredClone(items),
            })
          }}
        >
          <label>
            题单名称
            <input
              type="text"
              aria-label="题单名称"
              maxLength={60}
              required
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
            />
          </label>
          <button type="submit" disabled={!name.trim() || !items.length || duplicate}>
            保存为新题单
          </button>
          {loaded && (
            <button
              type="button"
              disabled={!name.trim() || !items.length || updateDuplicate}
              onClick={() =>
                setConfirmation({
                  kind: 'update',
                  setId: loaded.setId,
                  name: name.trim(),
                  items: structuredClone(items),
                  expected: { name: loaded.name, items: loaded.items },
                })
              }
            >
              更新已载入题单…
            </button>
          )}
        </form>
        {loaded && (
          <p className="muted">编辑基线：{loaded.name}。修改勾选不会自动修改保存的题单。</p>
        )}
        <label>
          选用固定题单
          <select
            aria-label="选用固定题单"
            value={selectedId}
            onChange={(event) => setSelectedId(event.currentTarget.value)}
          >
            <option value="">请选择题单</option>
            {selectedId && !selected && (
              <option value={selectedId} disabled>
                题单已删除
              </option>
            )}
            {model.sets.map((set) => (
              <option key={set.setId} value={set.setId}>
                {set.name}（{set.count}题）
              </option>
            ))}
          </select>
        </label>
        <div className="button-row">
          <button
            type="button"
            disabled={!selected}
            onClick={() => {
              if (!selected) return
              void model.load(selected.setId)?.then((value) => {
                if (!value?.definition) return
                setLoaded(value.definition)
                setName(value.definition.name)
                onChange(structuredClone(value.definition.items))
              })
            }}
          >
            载入题单并替换当前勾选
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={() => selected && setConfirmation({ kind: 'delete', setId: selected.setId })}
          >
            删除所选题单…
          </button>
        </div>
        {!model.sets.length && !model.loading && (
          <p className="muted">尚无固定题单，可从列表勾选后保存。</p>
        )}
      </fieldset>
      {selected && (
        <MaterialExport
          key={selected.setId}
          source={{ kind: 'set', setId: selected.setId }}
          label={`所选已保存题单：${selected.name}`}
          count={selected.count}
          disabled={
            disabled ||
            model.busy ||
            model.loading ||
            Boolean(model.pending) ||
            Boolean(model.readError)
          }
          onBusy={(value) => {
            setExportBusy(value)
            onBlocked(value)
          }}
          onOperation={onOperation}
        />
      )}
      {confirmation && (
        <div role="alertdialog" aria-label="确认题单操作" className="practice-plan-confirmation">
          <p>
            {confirmation.kind === 'delete'
              ? '只删除题单定义，题目、原勾选和练习记录保留。'
              : `将“${loaded?.name ?? '原题单'}”更新为“${'name' in confirmation ? confirmation.name : ''}”，包含${'items' in confirmation ? confirmation.items.length : 0}题。`}
          </p>
          <button
            type="button"
            autoFocus
            disabled={locked}
            onClick={() => setConfirmation(undefined)}
          >
            取消题单操作
          </button>
          <button
            type="button"
            disabled={locked}
            onClick={() => {
              model.perform(confirmation)
              setConfirmation(undefined)
            }}
          >
            确认题单操作
          </button>
        </div>
      )}
      {previewBusy && <p role="status">正在读取勾选题目…</p>}
      {previewError && <p role="alert">{previewError}</p>}
      {model.readError && (
        <div role="alert">
          <p>{model.readError}</p>
          <button
            type="button"
            disabled={disabled || model.busy || model.loading}
            onClick={() => void model.reload()}
          >
            重试读取固定题单
          </button>
        </div>
      )}
      {model.error && <p role="alert">{model.error}</p>}
      {model.pending && !model.busy && (
        <div>
          <p>待确认的题单操作会按原身份、原名称和原题目重试。</p>
          <button
            type="button"
            disabled={disabled}
            onClick={() => model.pending && model.perform(model.pending)}
          >
            重试原题单操作
          </button>
          <button type="button" disabled={disabled} onClick={model.abandon}>
            停止题单重试并核对
          </button>
        </div>
      )}
      {model.message && <p role="status">{model.message}</p>}
    </section>
  )
}
