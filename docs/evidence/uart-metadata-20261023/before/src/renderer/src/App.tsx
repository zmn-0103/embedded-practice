import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ImportPanel } from './components/ImportPanel'
import { LibraryBrowser } from './components/LibraryBrowser'
import { PracticeWorkspace } from './components/PracticeWorkspace'
import { LearningRecords } from './components/LearningRecords'
import { SettingsPane } from './components/SettingsPane'
import { DataLocationsPanel } from './components/DataLocationsPanel'
import { useAppearance } from './useAppearance'

type ViewState =
  | { status: 'loading' }
  | { status: 'ready'; appVersion: string }
  | { status: 'error'; message: string }

const pages = [
  { id: 'practice', label: '开始练习', path: 'm9 5 10 7-10 7V5Z' },
  { id: 'library', label: '题库', path: 'M4 4h6l2 2 2-2h6v15h-6l-2 2-2-2H4V4Zm8 2v15' },
  { id: 'records', label: '学习记录', path: 'M5 20V4m0 16h15M9 16v-5m5 5V7m5 9v-3' },
  { id: 'settings', label: '设置与数据', path: 'M4 7h16M4 17h16M9 4v6m6 4v6' },
] as const
type PageId = (typeof pages)[number]['id']
const BUILD_LABEL = '20261023.3-findability'

export function App() {
  const [state, setState] = useState<ViewState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [refresh, setRefresh] = useState(0)
  const [selectionRefresh, setSelectionRefresh] = useState(0)
  const [practicing, setPracticing] = useState(false)
  const [dataBusy, setDataBusy] = useState(false)
  const [page, setPage] = useState<PageId>('practice')
  const [libraryVisited, setLibraryVisited] = useState(false)
  const scrollPositions = useRef<Record<PageId, number>>({
    practice: 0,
    library: 0,
    records: 0,
    settings: 0,
  })
  const appearance = useAppearance()

  function changePage(target: PageId) {
    if (target === page) return
    scrollPositions.current[page] = window.scrollY
    if (target === 'library') setLibraryVisited(true)
    setPage(target)
  }
  useLayoutEffect(() => {
    if (practicing) return
    const frame = requestAnimationFrame(() => window.scrollTo(0, scrollPositions.current[page]))
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
    <div className={`app-shell${practicing ? ' is-practicing' : ''}`}>
      <header className="app-header">
        <div className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="8" y="8" width="16" height="16" rx="4" />
            <path d="M12 3v5m8-5v5M12 24v5m8-5v5M3 12h5m-5 8h5m16-8h5m-5 8h5m-16-4 3 3 5-6" />
          </svg>
        </div>
        <div>
          <h1>嵌入式刷题本</h1>
          <p className="brand-caption">思考有迹，积累有序</p>
        </div>
      </header>

      {!practicing && (
        <nav className="page-navigation" aria-label="主要页面">
          {pages.map(({ id: target, label, path }) => (
            <a
              href={`#${target}`}
              key={target}
              aria-disabled={state.status !== 'ready' || appearance.busy || dataBusy}
              aria-current={page === target ? 'page' : undefined}
              onClick={(event) => {
                event.preventDefault()
                if (state.status !== 'ready' || appearance.busy || dataBusy) return
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
              {label}
            </a>
          ))}
        </nav>
      )}

      <main id="main-content">
        {!practicing && (
          <div className="workspace-heading">
            <span>{pages.find((item) => item.id === page)?.label}</span>
            <span className="local-indicator">
              <span aria-hidden="true" />
              离线工作台
            </span>
          </div>
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
        {!practicing && page === 'practice' && (
          <section className="welcome">
            <div className="welcome-copy">
              <h2>从一道题，接着积累。</h2>
              <p>先思考，再对照答案；继续上次的位置，或选一组需要复习的题。</p>
              <button
                type="button"
                disabled={appearance.busy || dataBusy || state.status !== 'ready'}
                onClick={() => changePage('library')}
              >
                前往题库
              </button>
            </div>
            <svg className="welcome-circuit" viewBox="0 0 280 210" fill="none" aria-hidden="true">
              <g stroke="currentColor" strokeWidth="1.5">
                <path d="M0 47h55l27 27h24m-106 98h45l31-31h30M280 40h-47l-32 34h-25m104 99h-51l-28-32h-25M140 0v49m0 112v49" />
                <rect x="106" y="65" width="70" height="80" rx="12" />
                <path d="M119 49v16m21-16v16m21-16v16m-42 80v16m21-16v16m21-16v16m-71-75h16m-16 20h16m-16 20h16m70-40h16m-16 20h16m-16 20h16" />
                <circle cx="55" cy="47" r="4" />
                <circle cx="45" cy="172" r="4" />
                <circle cx="233" cy="40" r="4" />
                <circle cx="229" cy="173" r="4" />
              </g>
              <path
                d="m128 106 9 9 18-22"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </section>
        )}

        {state.status === 'ready' && (
          <div hidden={!practicing && page !== 'practice'}>
            <PracticeWorkspace
              refresh={refresh + selectionRefresh}
              beforeClose={appearance.waitForSave}
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
            enabled={state.status === 'ready'}
            onCommitted={() => {
              scrollPositions.current.library = 0
              setRefresh((value) => value + 1)
            }}
          />
        </div>
        {libraryVisited && state.status === 'ready' && (
          <div hidden={practicing || page !== 'library'}>
            <LibraryBrowser
              refresh={refresh}
              visible={!practicing && page === 'library'}
              invalidation={selectionRefresh}
              onFavoriteSaved={() => setSelectionRefresh((value) => value + 1)}
            />
          </div>
        )}
        {!practicing && page === 'records' && state.status === 'ready' && (
          <LearningRecords
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
          {state.status === 'ready' ? `v${state.appVersion} · 构建 ${BUILD_LABEL}` : '嵌入式刷题本'}
        </span>
      </footer>
    </div>
  )
}
