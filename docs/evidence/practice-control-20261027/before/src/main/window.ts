import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { app, BrowserWindow } from 'electron'

export function createMainWindow(): { window: BrowserWindow; rendererUrl: string } {
  const developmentUrl = !app.isPackaged ? process.env['ELECTRON_RENDERER_URL'] : undefined
  const renderer = developmentUrl
    ? new URL(developmentUrl)
    : pathToFileURL(join(__dirname, '../renderer/index.html'))

  if (developmentUrl && (renderer.protocol !== 'http:' || renderer.hostname !== '127.0.0.1')) {
    throw new Error('开发页面只允许使用本机回环 HTTP 地址。')
  }
  const rendererUrl = renderer.href

  const window = new BrowserWindow({
    width: 1140,
    height: 780,
    minWidth: 900,
    minHeight: 620,
    show: false,
    backgroundColor: '#f6f7fb',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  })

  window.removeMenu()
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.webContents.on('will-navigate', (event, destination) => {
    if (destination !== rendererUrl) event.preventDefault()
  })
  window.webContents.on('will-attach-webview', (event) => event.preventDefault())
  window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => {
    callback(false)
  })
  window.webContents.session.setPermissionCheckHandler(() => false)
  window.once('ready-to-show', () => window.show())

  return { window, rendererUrl }
}
