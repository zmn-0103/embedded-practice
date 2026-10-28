import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ImportPanel } from './components/ImportPanel'
import { LibraryBrowser, type LibraryEntry } from './components/LibraryBrowser'
import { BoardEntrance } from './components/BoardEntrance'
import { PracticeWorkspace } from './components/PracticeWorkspace'
import { LearningRecords } from './components/LearningRecords'
import { SettingsPane } from './components/SettingsPane'
import { DataLocationsPanel } from './components/DataLocationsPanel'
import { useAppearance } from './useAppearance'
import { AppearanceSwitcher } from './components/AppearanceSwitcher'
import { LearningOverview } from './components/LearningOverview'
import type { SelectedPracticeIntent } from './components/SelectedPractice'
import { NoteSaveContext, useNoteSaveCoordinator } from './note-saves'

type ViewState =
  | { status: 'loading' }
  | { status: 'ready'; appVersion: string }
  | { status: 'error'; message: string }

const pages = [
  { id: 'overview', label: '学习总览', path: 'm3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10' },
  {
    id: 'boards',
    label: '知识板块',
    path: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z',
  },
  { id: 'practice', label: '开始练习', path: 'm9 5 10 7-10 7V5Z' },
  { id: 'library', label: '题库', path: 'M4 4h6l2 2 2-2h6v15h-6l-2 2-2-2H4V4Zm8 2v15' },
  { id: 'records', label: '学习记录', path: 'M5 20V4m0 16h15M9 16v-5m5 5V7m5 9v-3' },
  { id: 'settings', label: '设置与数据', path: 'M4 7h16M4 17h16M9 4v6m6 4v6' },
] as const
type PageId = (typeof pages)[number]['id']
const BUILD_LABEL = '20261028.1-content-updates'

export function App() {
  const [state, setState] = useState<ViewState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [refresh, setRefresh] = useState(0)
  const [selectionRefresh, setSelectionRefresh] = useState(0)
  const [practicing, setPracticing] = useState(false)
  const [dataOperationBusy, setDataBusy] = useState(false)
  const notes = useNoteSaveCoordinator()
  const dataBusy = dataOperationBusy || notes.blocked
  const learningDataBusyRef = useRef(false)
  function reportLearningDataBusy(value: boolean) {
    learningDataBusyRef.current = value
    setDataBusy(value)
  }
  const [page, setPage] = useState<PageId>('overview')
  const [libraryVisited, setLibraryVisited] = useState(false)
  const [libraryEntry, setLibraryEntry] = useState<LibraryEntry>()
  const [practiceSelection, setPracticeSelection] = useState<SelectedPracticeIntent>()
  const [importAction, setImportAction] = useState<{ id: number; kind: 'import' | 'template' }>()
  const focusPage = useRef(false)
  const scrollPositions = useRef<Record<PageId, number>>({
    overview: 0,
    boards: 0,
    practice: 0,
    library: 0,
    records: 0,
    settings: 0,
  })
  const resumeLibraryReading = useCallback(() => {
    window.scrollTo(0, scrollPositions.current.library)
  }, [])
  const appearance = useAppearance()
  const dataWork = useRef<Promise<boolean> | undefined>(undefined)
  const waitForSaves = useCallback(async () => {
    if (!(await notes.flush())) return false
    const pending = dataWork.current
    if (pending && !(await pending)) return false
    // 恢复自身会请求保存检查；只阻止仍未确认的学习数据操作，不能等待恢复自己结束。
    if (learningDataBusyRef.current) return false
    return appearance.waitForSave()
  }, [appearance.waitForSave, notes.flush])
  function trackDataOperation(job: Promise<boolean>) {
    dataWork.current = job
    const forget = () => {
      if (dataWork.current === job) dataWork.current = undefined
    }
    void job.then(forget, forget)
  }

  function changePage(target: PageId) {
    if (target === page) return
    if (notes.hasPending()) {
      void notes.flush().then((saved) => {
        if (saved) changePage(target)
      })
      return
    }
    scrollPositions.current[page] = window.scrollY
    if (target === 'library') setLibraryVisited(true)
    setPage(target)
  }
  useLayoutEffect(() => {
    if (practicing) return
    const frame = requestAnimationFrame(() => {
      if (focusPage.current) {
        focusPage.current = false
        document.getElementById('main-content')?.focus({ preventScroll: true })
      }
      window.scrollTo(0, scrollPositions.current[page])
    })
    return () => cancelAnimationFrame(frame)
  }, [page, practicing])

  useEffect(() => {
    let active = true

    async function loadStatus(): Promise<void> {
      try {
        const result = await window.desktop.getAppStatus()
        if (!active) return
        setState(
          result.ok
            ? { status: 'ready', appVersion: result.value.appVersion }
            : { status: 'error', message: result.error.message },
        )
      } catch {
        if (active) {
          setState({
            status: 'error',
            message: '无法连接本地服务，请重新启动程序；问题仍存在时检查诊断日志。',
          })
        }
      }
    }

    void loadStatus()
    return () => {
      active = false
    }
  }, [attempt])

  return (
    <NoteSaveContext.Provider value={notes}>
      <div className={`app-shell workbench${practicing ? ' is-practicing' : ''}`} data-page={page}>
        <header className="app-header">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="8" y="8" width="16" height="16" rx="4" />
              <path d="M12 3v5m8-5v5M12 24v5m8-5v5M3 12h5m-5 8h5m16-8h5m-5 8h5m-16-4 3 3 5-6" />
            </svg>
          </div>
          <div className="brand-copy">
            <h1>嵌入式刷题本</h1>
            <p className="brand-caption">思考有迹，积累有序</p>
          </div>
          {appearance.value && (
            <button
              className="navigation-toggle"
              type="button"
              aria-label={appearance.value.navigationCollapsed ? '展开导航' : '收起导航'}
              aria-expanded={!appearance.value.navigationCollapsed}
              aria-controls="main-navigation"
              disabled={appearance.busy || dataBusy}
              onClick={() => {
                if (appearance.value)
                  void appearance.save({
                    ...appearance.value,
                    navigationCollapsed: !appearance.value.navigationCollapsed,
                  })
              }}
            >
              {appearance.value.navigationCollapsed ? '›' : '‹'}
            </button>
          )}
        </header>

        <nav id="main-navigation" className="page-navigation" aria-label="主要页面">
          {pages.map(({ id: target, label, path }) => (
            <a
              href={`#${target}`}
              key={target}
              aria-disabled={state.status !== 'ready' || appearance.busy || dataBusy || practicing}
              aria-label={label}
              title={label}
              aria-current={page === target ? 'page' : undefined}
              onClick={(event) => {
                event.preventDefault()
                if (state.status !== 'ready' || appearance.busy || dataBusy || practicing) return
                changePage(target)
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden="true"
              >
                <path d={path} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="navigation-label">{label}</span>
            </a>
          ))}
          {practicing && <p className="navigation-practice-note">练习中请用“保存并返回”离开。</p>}
        </nav>

        <main id="main-content" tabIndex={-1}>
          <div className="workspace-heading">
            <div className="workspace-location">
              <span>学习工作台</span>
              <strong>
                {practicing ? '专注练习' : pages.find((item) => item.id === page)?.label}
              </strong>
            </div>
            <div className="workspace-tools">
              <span className="local-indicator">
                <span aria-hidden="true" />
                本地离线
              </span>
              {practicing && appearance.value && (
                <button
                  type="button"
                  disabled={appearance.busy || dataBusy}
                  aria-controls="practice-context"
                  aria-expanded={!appearance.value.auxiliaryHidden}
                  onClick={() => {
                    if (appearance.value)
                      void appearance.save({
                        ...appearance.value,
                        auxiliaryHidden: !appearance.value.auxiliaryHidden,
                      })
                  }}
                >
                  {appearance.value.auxiliaryHidden ? '显示辅助面板' : '隐藏辅助面板'}
                </button>
              )}

              {appearance.value && appearance.catalog && (
                <AppearanceSwitcher
                  value={appearance.value}
                  catalog={appearance.catalog}
                  disabled={appearance.busy || dataBusy}
                  onSave={appearance.save}
                />
              )}
            </div>
          </div>
          {appearance.warning && (
            <p role="alert" className="error-message">
              {appearance.warning}
            </p>
          )}
          {appearance.error && page !== 'settings' && (
            <div role="alert" className="error-message">
              <p>{appearance.error}</p>
              <button
                type="button"
                disabled={appearance.busy || practicing}
                onClick={() => changePage('settings')}
              >
                查看显示设置
              </button>
            </div>
          )}
          {state.status === 'ready' && (
            <div
              hidden={
                !practicing && page !== 'practice' && page !== 'boards' && page !== 'overview'
              }
            >
              <PracticeWorkspace
                selectionRequest={practiceSelection}
                onSelectQuestions={() => changePage('library')}
                refresh={refresh + selectionRefresh}
                beforeClose={waitForSaves}
                onDataBusy={reportLearningDataBusy}
                onDataOperation={trackDataOperation}
                showResume={page !== 'overview'}
                homeLabel={page === 'overview' ? '学习总览工作区' : '板块与继续练习'}
                homeContent={
                  page === 'overview' && !practicing ? (
                    (practice) => (
                      <LearningOverview
                        refresh={refresh + selectionRefresh}
                        practice={practice}
                        disabled={appearance.busy || dataBusy}
                        onConfigure={() => changePage('practice')}
                        onBoards={() => changePage('boards')}
                        onImport={(kind) => {
                          setImportAction((previous) => ({ id: (previous?.id ?? 0) + 1, kind }))
                          changePage('library')
                        }}
                        onBrowse={(
                          filters,
                          category = { kind: 'all' },
                          contentUpdatedOnly = false,
                        ) => {
                          scrollPositions.current.library = 0
                          setLibraryEntry((previous) => ({
                            id: (previous?.id ?? 0) + 1,
                            category,
                            archived: false,
                            filters,
                            contentUpdatedOnly,
                          }))
                          changePage('library')
                        }}
                      />
                    )
                  ) : page === 'boards' && !practicing ? (
                    <BoardEntrance
                      refresh={refresh}
                      disabled={appearance.busy || dataBusy}
                      onBrowse={(category, archived) => {
                        scrollPositions.current.library = 0
                        setLibraryEntry((previous) => ({
                          id: (previous?.id ?? 0) + 1,
                          category,
                          archived,
                        }))
                        changePage('library')
                      }}
                      onPractice={() => {
                        focusPage.current = true
                        changePage('practice')
                      }}
                    />
                  ) : undefined
                }
                onActiveChange={(active) => {
                  setPracticing(active)
                  scrollPositions.current.practice = 0
                  if (!active) setSelectionRefresh((value) => value + 1)
                  setPage('practice')
                }}
              />
            </div>
          )}
          <div hidden={practicing || page !== 'library'}>
            <ImportPanel
              action={importAction}
              enabled={state.status === 'ready' && !appearance.busy && !dataBusy}
              onCommitted={() => {
                scrollPositions.current.library = 0
                setRefresh((value) => value + 1)
              }}
            />
          </div>
          {libraryVisited && state.status === 'ready' && (
            <div hidden={practicing || page !== 'library'}>
              <LibraryBrowser
                onPracticeQuestions={(items, sourceName, contentUpdatedOnly) => {
                  setPracticeSelection((previous) => ({
                    id: (previous?.id ?? 0) + 1,
                    items: structuredClone(items),
                    sourceName,
                    ...(contentUpdatedOnly ? { contentUpdatedOnly: true } : {}),
                  }))
                  focusPage.current = true
                  changePage('practice')
                }}
                onResumeReady={resumeLibraryReading}
                refresh={refresh}
                visible={!practicing && page === 'library'}
                invalidation={selectionRefresh}
                entry={libraryEntry}
                categoryDisabled={appearance.busy || dataBusy}
                onCategoryChanged={() => setRefresh((value) => value + 1)}
                onCategoryBusy={reportLearningDataBusy}
                onCategoryOperation={trackDataOperation}
                onFavoriteSaved={() => setSelectionRefresh((value) => value + 1)}
              />
            </div>
          )}
          {!practicing && page === 'records' && state.status === 'ready' && (
            <LearningRecords
              disabled={dataBusy}
              onBusy={reportLearningDataBusy}
              onOperation={trackDataOperation}
              refresh={refresh}
              onFavoriteSaved={() => setSelectionRefresh((value) => value + 1)}
            />
          )}
          {!practicing && page === 'settings' && state.status === 'ready' && (
            <SettingsPane
              value={appearance.value}
              busy={appearance.busy}
              error={appearance.error}
              onSave={appearance.save}
              onReload={appearance.reload}
              dataBusy={dataBusy}
              onDataBusyChange={setDataBusy}
              catalog={appearance.catalog}
              onThemesChanged={appearance.acceptCatalog}
              onDataOperation={trackDataOperation}
            />
          )}

          <section className={`service-status status-${state.status}`} role="status">
            <span className="status-dot" aria-hidden="true" />
            <p>
              {state.status === 'loading' && '正在连接本地数据…'}
              {state.status === 'ready' && '本地数据已就绪'}
              {state.status === 'error' && state.message}
            </p>
            {state.status === 'error' && (
              <button
                type="button"
                onClick={() => {
                  setState({ status: 'loading' })
                  setAttempt((previous) => previous + 1)
                }}
              >
                重新检查
              </button>
            )}
          </section>
          {state.status === 'error' && (
            <DataLocationsPanel disabled={dataBusy} onBusyChange={setDataBusy} />
          )}
        </main>

        <footer>
          <span>离线使用 · 数据保存在本机</span>
          <span>
            {state.status === 'ready'
              ? `V${state.appVersion} 测试版 · 构建 ${BUILD_LABEL}`
              : '嵌入式刷题本'}
          </span>
        </footer>
      </div>
    </NoteSaveContext.Provider>
  )
}
