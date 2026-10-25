import type { BrowserWindow, IpcMainInvokeEvent } from 'electron'

export function isTrustedRequest(
  event: IpcMainInvokeEvent,
  window: BrowserWindow,
  rendererUrl: string,
): boolean {
  try {
    const frame = event.senderFrame
    return (
      !window.isDestroyed() &&
      !window.webContents.isDestroyed() &&
      frame !== null &&
      !frame.isDestroyed() &&
      event.sender === window.webContents &&
      frame === window.webContents.mainFrame &&
      frame.url === rendererUrl
    )
  } catch {
    return false
  }
}
