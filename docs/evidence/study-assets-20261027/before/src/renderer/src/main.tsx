import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles/global.css'
import './styles/themes.css'
import './styles/workbench-shell.css'
import './styles/workbench-pages.css'
import { DEFAULT_THEME_ID, themeVariables } from '../../shared/contracts/themes'
import { builtinTheme } from '../../shared/themes'

// 首次读库完成前也使用同一注册源，避免CSS再维护一份默认配色。
for (const [name, value] of Object.entries(themeVariables(builtinTheme(DEFAULT_THEME_ID)!))) {
  document.documentElement.style.setProperty(name, value)
}

const root = document.getElementById('root')
if (!root) throw new Error('界面根节点不存在。')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
