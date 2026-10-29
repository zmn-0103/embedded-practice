import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { QuestionIdentity } from '../../../shared/contracts/library-desktop'
import {
  RELATION_LABELS,
  type KnowledgePage,
  type Relation,
  type RelationDraft,
  type RelationItem,
  type RelationPage,
} from '../../../shared/contracts/knowledge'
import {
  questionIdentityKey,
  MAX_QUESTION_SET_ITEMS,
} from '../../../shared/contracts/question-sets'
import { createRelationController } from '../relation-controller'
import { useNoteSaves } from '../note-saves'
import { QuestionComparison } from './QuestionComparison'

function Panel({
  identity,
  readOnly,
  onPractice,
}: {
  identity: QuestionIdentity
  readOnly: boolean
  onPractice?: ((items: QuestionIdentity[], name: string) => void) | undefined
}) {
  const saves = useNoteSaves(),
    [controller] = useState(() => createRelationController(window.desktop.knowledge))
  const state = useSyncExternalStore(controller.subscribe, controller.getState),
    lifecycle = useRef(0)
  const [open, setOpen] = useState(false),
    [page, setPage] = useState(1),
    [attempt, setAttempt] = useState(0),
    [data, setData] = useState<RelationPage>()
  const [loading, setLoading] = useState(false),
    [error, setError] = useState(''),
    [query, setQuery] = useState(''),
    [lookup, setLookup] = useState({ query: '', page: 1 }),
    [found, setFound] = useState<KnowledgePage>()
  const [searching, setSearching] = useState(false),
    [searchError, setSearchError] = useState(''),
    [searched, setSearched] = useState(false)
  const [deleting, setDeleting] = useState<Relation>(),
    [discard, setDiscard] = useState(false),
    [comparison, setComparison] = useState<Relation>()
  const [picked, setPicked] = useState<QuestionIdentity[]>([]),
    [pickError, setPickError] = useState('')
  useEffect(() => {
    const epoch = ++lifecycle.current,
      unregister = saves.registerGuard(controller)
    return () => {
      unregister()
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
    void window.desktop.knowledge
      .relations({ identity, page })
      .then((result) => {
        if (!current) return
        if (result.ok) setData(result.value)
        else setError(result.error.message)
      })
      .catch(() => {
        if (current) setError('无法读取题目关联，请刷新。')
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [open, page, attempt, state.confirmed, identity.topicId, identity.questionId])
  useEffect(() => {
    if (!searched) return
    let current = true
    setSearching(true)
    setSearchError('')
    void window.desktop.knowledge
      .search({ ...lookup, kind: 'question', archive: 'all', hasNotes: false, sort: 'default' })
      .then((result) => {
        if (!current) return
        if (result.ok) setFound(result.value)
        else setSearchError(result.error.message)
      })
      .catch(() => {
        if (current) setSearchError('无法查找关联目标题。')
      })
      .finally(() => {
        if (current) setSearching(false)
      })
    return () => {
      current = false
    }
  }, [lookup, searched])
  const busy = readOnly || state.saving || saves.flushing,
    locked = busy || controller.hasPending() || loading
  function change(work: () => void) {
    void saves.flush().then((saved) => {
      if (saved) work()
    })
  }
  function base(item: RelationItem): Relation {
    const { source, target, relationId, kind, explanation, revision, updatedAt } = item
    return { source, target, relationId, kind, explanation, revision, updatedAt }
  }
  function togglePick(item: QuestionIdentity, checked: boolean) {
    const next = picked.filter((value) => questionIdentityKey(value) !== questionIdentityKey(item))
    if (checked) next.push(item)
    if (next.length >= MAX_QUESTION_SET_ITEMS) {
      setPickError('当前题也计入组卷，最多合计500题，请分批选择。')
      return
    }
    setPickError('')
    setPicked(next)
  }
  return (
    <details
      className="question-relations"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>易混点与关联题</summary>
      <p className="muted">
        人工整理当前题之间的联系；前置知识表示“目标题是来源题的前置”。两端都能找到同一记录，旧轮保持。
      </p>
      {loading && <p role="status">正在读取题目关联…</p>}
      {error && <p role="alert">{error}</p>}
      <button
        type="button"
        disabled={locked}
        onClick={() => change(() => setAttempt((value) => value + 1))}
      >
        刷新题目关联
      </button>
      {data && (
        <>
          <p>共 {data.total} 条关联。</p>
          <ol className="relation-list">
            {data.items.map((item) => {
              const currentSource =
                  questionIdentityKey(item.source) === questionIdentityKey(identity),
                other = currentSource ? item.target : item.source,
                record = base(item)
              const label =
                item.kind === 'prerequisite' && !currentSource
                  ? '后续知识（以本题为前置）'
                  : RELATION_LABELS[item.kind]
              return (
                <li key={item.relationId}>
                  <label>
                    <input
                      type="checkbox"
                      aria-label={`勾选关联题：${other.topicId} / ${other.questionId}`}
                      disabled={locked}
                      checked={picked.some(
                        (value) => questionIdentityKey(value) === questionIdentityKey(other),
                      )}
                      onChange={(event) => togglePick(other, event.currentTarget.checked)}
                    />
                    {label} · {currentSource ? item.targetTitle : item.sourceTitle}
                  </label>
                  <p className="muted">
                    {other.topicId} / {other.questionId}
                    {(currentSource ? item.targetArchived : item.sourceArchived) ? ' · 已归档' : ''}
                  </p>
                  <p className="relation-explanation">{item.explanation || '尚未填写对比说明'}</p>
                  <div className="button-row">
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => change(() => setComparison(record))}
                    >
                      对照这两题
                    </button>
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => change(() => controller.begin(record, record))}
                    >
                      编辑这条关联
                    </button>
                    <button type="button" disabled={locked} onClick={() => setDeleting(record)}>
                      删除这条关联…
                    </button>
                  </div>
                </li>
              )
            })}
          </ol>
          <nav className="pagination" aria-label="关联分页">
            <button
              type="button"
              disabled={locked || data.page <= 1}
              onClick={() => change(() => setPage(data.page - 1))}
            >
              上一页
            </button>
            <span>
              {data.page} / {Math.max(1, Math.ceil(data.total / data.pageSize))}
            </span>
            <button
              type="button"
              disabled={locked || data.page * data.pageSize >= data.total}
              onClick={() => change(() => setPage(data.page + 1))}
            >
              下一页
            </button>
          </nav>
        </>
      )}
      <p>已勾选 {picked.length} 道关联题，跨页保留；组卷会加上当前题。</p>
      {pickError && <p role="alert">{pickError}</p>}
      {onPractice ? (
        <button
          type="button"
          disabled={locked || !picked.length}
          onClick={() => change(() => onPractice([identity, ...picked], '关联题对照练习'))}
        >
          确认当前题与勾选关联题并练习…
        </button>
      ) : (
        <p className="muted">可从题库或“我的积累”将关联题一起组卷。</p>
      )}
      <button type="button" disabled={locked || !picked.length} onClick={() => setPicked([])}>
        清空关联题勾选
      </button>
      <fieldset disabled={locked || searching}>
        <legend>新增关联：先查找另一道题</legend>
        <label>
          查找关联题
          <input
            type="search"
            aria-label="查找关联题"
            maxLength={128}
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setSearched(true)
            setLookup({ query, page: 1 })
          }}
        >
          查找关联目标题
        </button>
        {searchError && <p role="alert">{searchError}</p>}
        {found && (
          <>
            <p>匹配 {found.total} 题，当前题不能关联自身。</p>
            {found.items.map((item) => (
              <button
                type="button"
                key={questionIdentityKey(item)}
                disabled={questionIdentityKey(item) === questionIdentityKey(identity)}
                onClick={() =>
                  change(() =>
                    controller.begin({
                      source: identity,
                      target: { topicId: item.topicId, questionId: item.questionId },
                      kind: 'confused',
                      explanation: '',
                    }),
                  )
                }
              >
                关联到：{item.title} · {item.topicId} / {item.questionId}
                {item.archived ? '（归档）' : ''}
              </button>
            ))}
            <div className="button-row">
              <button
                type="button"
                disabled={found.page <= 1}
                onClick={() => setLookup({ ...lookup, page: found.page - 1 })}
              >
                目标题上一页
              </button>
              <button
                type="button"
                disabled={found.page * found.pageSize >= found.total}
                onClick={() => setLookup({ ...lookup, page: found.page + 1 })}
              >
                目标题下一页
              </button>
            </div>
          </>
        )}
      </fieldset>
      {state.draft && (
        <fieldset disabled={busy || Boolean(state.pending) || state.conflict}>
          <legend>关联编辑</legend>
          <p>
            {state.draft.source.topicId} / {state.draft.source.questionId} →{' '}
            {state.draft.target.topicId} / {state.draft.target.questionId}
          </p>
          <label>
            关联类型
            <select
              aria-label="关联类型"
              value={state.draft.kind}
              onChange={(event) =>
                controller.edit({ kind: event.currentTarget.value as RelationDraft['kind'] })
              }
            >
              {Object.entries(RELATION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            对比说明
            <textarea
              aria-label="关联对比说明"
              rows={4}
              maxLength={2000}
              value={state.draft.explanation}
              onChange={(event) => controller.edit({ explanation: event.currentTarget.value })}
            />
          </label>
          <button type="button" onClick={() => void controller.save()}>
            保存关联
          </button>
        </fieldset>
      )}
      {state.pending && !state.saving && !state.conflict && (
        <button type="button" disabled={busy} onClick={() => void controller.save()}>
          重试原关联保存
        </button>
      )}
      {controller.hasPending() && (
        <button type="button" disabled={busy} onClick={() => setDiscard(true)}>
          放弃本地关联编辑…
        </button>
      )}
      {state.error && <p role="alert">{state.error}</p>}
      {state.message && <p role="status">{state.message}</p>}
      {discard && (
        <div role="alertdialog" aria-label="确认放弃关联编辑">
          <p>请先保留需要的说明。放弃本地编辑后重新读取实际记录，不撤销已提交的关联。</p>
          <button type="button" autoFocus disabled={busy} onClick={() => setDiscard(false)}>
            保留关联输入
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              controller.discard()
              setDiscard(false)
            }}
          >
            放弃本地并刷新关联
          </button>
        </div>
      )}
      {deleting && (
        <div role="alertdialog" aria-label="确认删除关联">
          <p>只删除这一条联系，保留题目、笔记与学习记录。</p>
          <button type="button" autoFocus disabled={busy} onClick={() => setDeleting(undefined)}>
            取消删除关联
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              change(() => {
                void controller.remove(deleting)
                setDeleting(undefined)
              })
            }
          >
            确认删除关联
          </button>
        </div>
      )}
      {comparison && (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => change(() => setComparison(undefined))}
          >
            关闭关联题对照
          </button>
          <QuestionComparison source={comparison.source} target={comparison.target} />
        </>
      )}
    </details>
  )
}
export function QuestionRelations({
  identity,
  readOnly = false,
  onPractice,
}: {
  identity: QuestionIdentity
  readOnly?: boolean
  onPractice?: ((items: QuestionIdentity[], name: string) => void) | undefined
}) {
  return (
    <Panel
      key={questionIdentityKey(identity)}
      identity={identity}
      readOnly={readOnly}
      onPractice={onPractice}
    />
  )
}
