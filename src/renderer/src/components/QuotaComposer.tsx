import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { LibraryPage } from '../../../shared/contracts/library-desktop'
import type { QuotaPreview, QuotaSetting, PlanningScope } from '../../../shared/contracts/planning'
import { createPlanningController } from '../planning-controller'
import { useNoteSaves } from '../note-saves'

export function QuotaComposer({
  topics,
  refresh,
  disabled,
  onChoose,
  onBlocked,
}: {
  topics: LibraryPage['topics']
  refresh: number
  disabled: boolean
  onChoose: (scope: PlanningScope) => void
  onBlocked: (busy: boolean) => void
}) {
  const saves = useNoteSaves(),
    [controller] = useState(() => createPlanningController(window.desktop.planning))
  const state = useSyncExternalStore(controller.subscribe, controller.getState),
    lifecycle = useRef(0),
    mounted = useRef(false),
    report = useRef(onBlocked)
  report.current = onBlocked
  const [open, setOpen] = useState(false),
    [setting, setSetting] = useState<QuotaSetting | null>(null),
    [preview, setPreview] = useState<QuotaPreview>(),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false),
    [attempt, setAttempt] = useState(0),
    [discard, setDiscard] = useState(false)
  useEffect(() => {
    mounted.current = true
    const epoch = ++lifecycle.current,
      unregister = saves.registerGuard(controller)
    return () => {
      mounted.current = false
      unregister()
      report.current(false)
      queueMicrotask(() => {
        if (epoch === lifecycle.current) controller.dispose()
      })
    }
  }, [controller, saves.registerGuard])
  useEffect(() => {
    if (!open) return
    let current = true
    setLoading(true)
    setError('')
    setPreview(undefined)
    void window.desktop.planning
      .quota()
      .then((result) => {
        if (current) {
          if (result.ok) setSetting(result.value)
          else setError(result.error.message)
        }
      })
      .catch(() => {
        if (current) setError('无法读取配额设置。')
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [open, refresh, attempt])
  const own = controller.hasPending()
  useEffect(() => {
    report.current(own || loading)
  }, [own, loading])
  const busy = state.saving || saves.flushing || loading || (disabled && !own),
    locked = busy || own
  const draft = state.draft?.kind === 'quota' ? state.draft : undefined
  const total = draft?.rows.reduce((sum, row) => sum + row.count, 0) ?? 0
  // 服务端按合计 ≤500 校验；这里先拦住，避免用户只看到“请求参数无效”而不知道原因。
  const overLimit = total > 500
  async function readPreview(rows: QuotaSetting['rows']) {
    setLoading(true)
    setError('')
    setPreview(undefined)
    try {
      const result = await window.desktop.planning.previewQuota({ rows })
      if (mounted.current) {
        if (result.ok) setPreview(result.value)
        else setError(result.error.message)
      }
    } catch {
      if (mounted.current) setError('无法预览配额，请重试；尚未开始练习。')
    } finally {
      if (mounted.current) setLoading(false)
    }
  }
  async function save() {
    if (!(await controller.save()) || !mounted.current) return
    setLoading(true)
    try {
      const result = await window.desktop.planning.quota()
      if (!mounted.current) return
      if (!result.ok) {
        setError(result.error.message)
        return
      }
      setSetting(result.value)
      if (result.value) await readPreview(result.value.rows)
    } catch {
      if (mounted.current) setError('设置已确认，但重新读取失败，请刷新配额。')
    } finally {
      if (mounted.current) setLoading(false)
    }
  }
  function edit() {
    setPreview(undefined)
    controller.begin({
      kind: 'quota',
      rows:
        setting?.rows ??
        (topics[0] ? [{ topicId: topics[0].topicId, count: 3, priority: 'random' }] : []),
      expectedRevision: setting?.revision ?? 0,
    })
  }
  return (
    <details
      className="quota-composer"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>分专题配额组卷</summary>
      <p className="muted">
        保存一套题数结构，每次先预览实际题目。专题不得重复，合计最多500题；不足明确提示，确认前不会结束当前轮。
      </p>
      {!own && (
        <div className="button-row">
          <button type="button" disabled={locked || topics.length === 0} onClick={edit}>
            {setting ? '编辑配额设置' : '设置专题配额'}
          </button>
          <button
            type="button"
            disabled={locked || !setting}
            onClick={() => {
              if (setting) void readPreview(setting.rows)
            }}
          >
            重新预览配额组卷
          </button>
          <button type="button" disabled={locked} onClick={() => setAttempt((v) => v + 1)}>
            刷新配额设置
          </button>
        </div>
      )}
      {draft && (
        <form
          aria-label="专题配额设置"
          onSubmit={(event) => {
            event.preventDefault()
            void save()
          }}
        >
          <fieldset disabled={busy || Boolean(state.pending) || state.conflict}>
            <legend>各专题的题数与优先方式</legend>
            {draft.rows.map((row, index) => (
              <div className="quota-row" key={index}>
                <label>
                  专题 {index + 1}
                  <select
                    aria-label={`配额专题 ${index + 1}`}
                    value={row.topicId}
                    onChange={(event) => {
                      controller.edit({
                        ...draft,
                        rows: draft.rows.map((item, i) =>
                          i === index ? { ...item, topicId: event.currentTarget.value } : item,
                        ),
                      })
                      setPreview(undefined)
                    }}
                  >
                    {!topics.some((topic) => topic.topicId === row.topicId) && (
                      <option value={row.topicId}>失效/无可练题：{row.topicId}</option>
                    )}
                    {topics.map((topic) => (
                      <option
                        key={topic.topicId}
                        value={topic.topicId}
                        disabled={draft.rows.some(
                          (item, i) => i !== index && item.topicId === topic.topicId,
                        )}
                      >
                        {topic.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  题数
                  <input
                    aria-label={`配额题数 ${index + 1}`}
                    type="number"
                    min={1}
                    max={500}
                    step={1}
                    required
                    value={row.count}
                    onChange={(event) => {
                      const count = event.currentTarget.valueAsNumber
                      controller.edit({
                        ...draft,
                        rows: draft.rows.map((item, i) =>
                          i === index
                            ? { ...item, count: Number.isFinite(count) ? count : 1 }
                            : item,
                        ),
                      })
                    }}
                  />
                </label>
                <label>
                  优先方式
                  <select
                    aria-label={`配额优先方式 ${index + 1}`}
                    value={row.priority}
                    onChange={(event) =>
                      controller.edit({
                        ...draft,
                        rows: draft.rows.map((item, i) =>
                          i === index
                            ? {
                                ...item,
                                priority: event.currentTarget.value as typeof row.priority,
                              }
                            : item,
                        ),
                      })
                    }
                  >
                    <option value="random">随机</option>
                    <option value="weak">不会/不熟优先</option>
                    <option value="oldest">最久未练优先</option>
                  </select>
                </label>
                <button
                  type="button"
                  disabled={draft.rows.length <= 1}
                  onClick={() =>
                    controller.edit({ ...draft, rows: draft.rows.filter((_, i) => i !== index) })
                  }
                >
                  移除专题 {index + 1}
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={
                draft.rows.length >= 20 ||
                !topics.some((topic) => !draft.rows.some((row) => row.topicId === topic.topicId))
              }
              onClick={() => {
                const topic = topics.find(
                  (topic) => !draft.rows.some((row) => row.topicId === topic.topicId),
                )
                if (topic)
                  controller.edit({
                    ...draft,
                    rows: [...draft.rows, { topicId: topic.topicId, count: 3, priority: 'random' }],
                  })
              }}
            >
              增加配额专题
            </button>
            <p
              role={overLimit ? 'alert' : undefined}
              className={overLimit ? 'error-message' : undefined}
            >
              合计 {total} 题 / 500{overLimit ? '，请减少题数后再保存。' : ''}
            </p>
          </fieldset>
          <div className="button-row">
            <button type="submit" disabled={busy || state.conflict || overLimit}>
              {state.pending ? '重试原配额保存' : '保存并预览配额组卷'}
            </button>
            <button type="button" disabled={state.saving} onClick={() => setDiscard(true)}>
              放弃配额编辑
            </button>
          </div>
          {discard && (
            <div className="inline-confirm">
              <p>确认放弃尚未确认的本地配额设置？</p>
              <button
                type="button"
                disabled={state.saving}
                onClick={() => {
                  controller.discard()
                  setDiscard(false)
                  setAttempt((v) => v + 1)
                }}
              >
                确认放弃配额设置
              </button>
              <button type="button" onClick={() => setDiscard(false)}>
                保留配额输入
              </button>
            </div>
          )}
        </form>
      )}
      {!draft && setting && !preview && (
        <ul>
          {setting.rows.map((row) => (
            <li key={row.topicId}>
              {topics.find((topic) => topic.topicId === row.topicId)?.title ?? row.topicId} ·{' '}
              {row.count}题 ·{' '}
              {row.priority === 'weak'
                ? '不会/不熟优先'
                : row.priority === 'oldest'
                  ? '最久未练优先'
                  : '随机'}
            </li>
          ))}
        </ul>
      )}
      {loading && <p role="status">正在读取配额范围…</p>}
      {preview && (
        <section aria-label="配额组卷预览">
          <h4>本次实际候选</h4>
          {preview.rows.map((row) => (
            <div key={row.topicId}>
              <p>
                <strong>{row.topicTitle ?? `失效专题 ${row.topicId}`}</strong> · 需要 {row.count} 题
                / 可用 {row.available} 题{row.deficit > 0 ? ` · 缺 ${row.deficit} 题` : ''}
              </p>
              <ol>
                {row.items.map((item) => (
                  <li key={item.questionId}>
                    {item.questionId} · {item.title}
                  </li>
                ))}
              </ol>
            </div>
          ))}
          {!preview.ready && (
            <p role="alert">
              题目不足或专题失效，请编辑配额或重新导入后再预览；不会从其他专题补题。
            </p>
          )}
          <button
            type="button"
            disabled={locked || !preview.ready}
            onClick={() => {
              if (preview.ready)
                onChoose({
                  sourceName: `分专题配额组卷 · ${preview.rows.length}专题 ${preview.rows.reduce((sum, row) => sum + row.items.length, 0)}题`,
                  items: preview.rows.flatMap((row) =>
                    row.items.map(({ topicId, questionId }) => ({ topicId, questionId })),
                  ),
                })
            }}
          >
            核对这批配额题目
          </button>
        </section>
      )}
      {(error || state.error) && <p role="alert">{state.error || error}</p>}
    </details>
  )
}
