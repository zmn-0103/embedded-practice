import { useEffect, useState } from 'react'
import type { RoundEntry, RoundPage } from '../../../shared/contracts/study'
import { questionFilterSummary } from './QuestionFilterFields'
import { HistoryEntryContent } from './QuestionHistory'
import { PersonalNote } from './PersonalNote'
import { ReviewTodoEditor } from './ReviewTodoEditor'
import { QuestionRelations } from './QuestionRelations'
import { MaterialExport } from './MaterialExport'
import { useNoteSaves } from '../note-saves'

function RoundEntryView({ sessionId, position }: { sessionId: string; position: number }) {
  const [entry, setEntry] = useState<RoundEntry>()
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let current = true
    setEntry(undefined)
    setError('')
    void window.desktop.study
      .readEntry({ sessionId, position })
      .then((result) => {
        if (!current) return
        if (result.ok) setEntry(result.value)
        else setError(result.error.message)
      })
      .catch(() => {
        if (current) setError('无法读取本轮作答，请重试。')
      })
    return () => {
      current = false
    }
  }, [sessionId, position, attempt])
  if (error)
    return (
      <div role="alert">
        <p>{error}</p>
        <button type="button" onClick={() => setAttempt(attempt + 1)}>
          重试读取本轮作答
        </button>
      </div>
    )
  if (!entry) return <p role="status">正在读取本轮作答…</p>
  return (
    <div className="round-entry" aria-label="本轮单题复盘">
      {!entry.isCurrentVersion && <p>这条记录采用旧题目版本；下方个人笔记为此题当前保存的笔记。</p>}
      <HistoryEntryContent entry={entry} />
      <PersonalNote identity={{ topicId: entry.topicId, questionId: entry.questionId }} />
      <p className="muted">复习安排为此题当前计划，与本轮保存的历史内容分开。</p>
      <ReviewTodoEditor identity={{ topicId: entry.topicId, questionId: entry.questionId }} />
      <QuestionRelations identity={{ topicId: entry.topicId, questionId: entry.questionId }} />
    </div>
  )
}

export function RoundDetail({
  sessionId,
  onBusy,
  onOperation,
}: {
  sessionId: string
  onBusy: (busy: boolean) => void
  onOperation: (work: Promise<boolean>) => void
}) {
  const saves = useNoteSaves()
  const [data, setData] = useState<RoundPage>()
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<number>()
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState('')
  const [exportBusy, setExportBusy] = useState(false)
  useEffect(() => {
    let current = true
    setData(undefined)
    setError('')
    void window.desktop.study
      .readRound({ sessionId, page })
      .then((result) => {
        if (!current) return
        if (result.ok) setData(result.value)
        else setError(result.error.message)
      })
      .catch(() => {
        if (current) setError('无法读取本轮题目，请重试。')
      })
    return () => {
      current = false
    }
  }, [sessionId, page, attempt])
  const change = (work: () => void) => {
    void saves.flush().then((saved) => {
      if (saved) work()
    })
  }
  if (error)
    return (
      <div role="alert">
        <p>{error}</p>
        <button type="button" onClick={() => setAttempt(attempt + 1)}>
          重试读取本轮题目
        </button>
      </div>
    )
  if (!data) return <p role="status">正在读取本轮题目…</p>
  const { session } = data
  return (
    <section className="round-detail" aria-label="按轮次复盘详情">
      <p>
        当时范围：
        {session.selectionName ?? (session.topicId ? data.items[0]?.topicTitle : '全部专题')} ·{' '}
        {session.category.kind === 'category'
          ? session.category.title
          : session.category.kind === 'all'
            ? '全部分类'
            : '未分类'}{' '}
        · {session.mode === 'random' ? '随机练习' : '顺序练习'}
      </p>
      <p className="muted">
        {session.filters
          ? questionFilterSummary(session.filters)
          : session.selectionName
            ? '明确题目组卷，未叠加条件筛选'
            : '旧轮未记录筛选条件'}
        {session.repeat ? '；本轮为再练，沿用来源轮内容快照。' : ''}
      </p>
      <p>
        共{session.total}题 · 已揭晓{session.counts.revealed} · 不会{session.counts.ratings.不会} ·
        不熟{session.counts.ratings.不熟} · 掌握{session.counts.ratings.掌握} · 揭晓未评
        {session.counts.unrated} · 仍未揭晓的跳过{session.counts.skipped}
      </p>
      <MaterialExport
        source={{ kind: 'round', sessionId }}
        label={`本轮：${new Date(session.createdAt).toLocaleString('zh-CN')}`}
        count={session.total}
        onBusy={(value) => {
          setExportBusy(value)
          onBusy(value)
        }}
        onOperation={onOperation}
      />
      <ol className="round-item-list" start={(data.page - 1) * data.pageSize + 1}>
        {data.items.map((item) => (
          <li key={item.position}>
            <strong>{item.title}</strong>
            <p>
              {item.topicTitle} · 内容版本{item.versionSequence} ·{' '}
              {item.revealedAt ? (item.rating ?? '已揭晓、未自评') : '尚未揭晓'}
              {item.skippedAt ? ' · 曾跳过' : ''} · {item.hasDraft ? '有文字作答' : '无文字作答'}
            </p>
            <button
              type="button"
              aria-label={`查看本轮第${item.position + 1}题`}
              disabled={exportBusy || saves.flushing}
              onClick={() =>
                change(() => setSelected(selected === item.position ? undefined : item.position))
              }
            >
              {selected === item.position ? '收起本题记录' : '查看本题记录'}
            </button>
            {selected === item.position && (
              <RoundEntryView
                key={`${sessionId}/${item.position}`}
                sessionId={sessionId}
                position={item.position}
              />
            )}
          </li>
        ))}
      </ol>
      <nav className="pagination" aria-label="轮次题目分页">
        <button
          type="button"
          disabled={data.page <= 1 || exportBusy || saves.flushing}
          onClick={() =>
            change(() => {
              setSelected(undefined)
              setPage(data.page - 1)
            })
          }
        >
          上一页
        </button>
        <span>
          {data.page} / {Math.ceil(session.total / data.pageSize)}
        </span>
        <button
          type="button"
          disabled={data.page * data.pageSize >= session.total || exportBusy || saves.flushing}
          onClick={() =>
            change(() => {
              setSelected(undefined)
              setPage(data.page + 1)
            })
          }
        >
          下一页
        </button>
      </nav>
    </section>
  )
}
