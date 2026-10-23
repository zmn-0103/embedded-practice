import { useEffect, useState } from 'react'
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

export function App() {
  const [state, setState] = useState<ViewState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [refresh, setRefresh] = useState(0)
  const [selectionRefresh, setSelectionRefresh] = useState(0)
  const [practicing, setPracticing] = useState(false)
  const [dataBusy, setDataBusy] = useState(false)
  const [page, setPage] = useState<'practice' | 'library' | 'records' | 'settings'>('practice')
  const appearance = useAppearance()

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
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-mark" aria-hidden="true">
          练
        </div>
        <div>
          <p className="eyebrow">离线 · 专注 · 积累</p>
          <h1>嵌入式刷题本</h1>
        </div>
        <span className="stage-badge">本地题库</span>
      </header>

      {!practicing && (
        <nav className="page-navigation" aria-label="主要页面">
          {(
            [
              ['practice', '开始练习'],
              ['library', '题库'],
              ['records', '学习记录'],
              ['settings', '设置与数据'],
            ] as const
          ).map(([target, label]) => (
            <a
              href={`#${target}`}
              key={target}
              aria-disabled={state.status !== 'ready' || appearance.busy || dataBusy}
              aria-current={page === target ? 'page' : undefined}
              onClick={(event) => {
                event.preventDefault()
                if (state.status !== 'ready' || appearance.busy || dataBusy) return
                setPage(target)
                window.scrollTo(0, 0)
              }}
            >
              {label}
            </a>
          ))}
        </nav>
      )}

      <main>
        {appearance.error && page !== 'settings' && (
          <div role="alert" className="error-message">
            <p>{appearance.error}</p>
            <button
              type="button"
              disabled={appearance.busy || practicing}
              onClick={() => setPage('settings')}
            >
              查看显示设置
            </button>
          </div>
        )}
        {!practicing && page === 'practice' && (
          <section className="welcome">
            <p className="eyebrow">每一轮练习，从认真思考开始</p>
            <h2>让知识，慢慢成为自己的。</h2>
            <p>用 Markdown 整理专题，核对变更后，保存到自己的本地题库。</p>
            <button
              type="button"
              disabled={appearance.busy || state.status !== 'ready'}
              onClick={() => setPage('library')}
            >
              前往题库
            </button>
          </section>
        )}

        {state.status === 'ready' && (
          <div hidden={!practicing && page !== 'practice'}>
            <PracticeWorkspace
              refresh={refresh + selectionRefresh}
              beforeClose={appearance.waitForSave}
              onActiveChange={(active) => {
                setPracticing(active)
                setPage('practice')
              }}
            />
          </div>
        )}
        {!practicing && (
          <div hidden={page !== 'library'}>
            <ImportPanel
              enabled={state.status === 'ready'}
              onCommitted={() => setRefresh((value) => value + 1)}
            />
          </div>
        )}
        {!practicing && page === 'library' && state.status === 'ready' && (
          <LibraryBrowser
            refresh={refresh}
            onFavoriteSaved={() => setSelectionRefresh((value) => value + 1)}
          />
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
        <span>{state.status === 'ready' ? `v${state.appVersion}` : '嵌入式刷题本'}</span>
      </footer>
    </div>
  )
}
