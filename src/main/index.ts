import { appendFileSync, mkdirSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { app, BrowserWindow, dialog, protocol } from 'electron'
import { IMAGE_SCHEME } from '../shared/contracts/content-urls'
import { openStartupStore, type StartupStore } from './database/startup-store'
import { registerApplicationIpc } from './ipc/application'
import { registerLibraryIpc } from './ipc/library'
import { registerPracticeIpc } from './ipc/practice'
import { registerBackupIpc } from './ipc/backup'
import { registerDataLocationsIpc } from './ipc/data-locations'
import { openBackupService, type BackupService } from './services/backup/backup'
import { recoverDatabaseReplacement, replaceDatabase } from './services/backup/restore-files'
import { BackupFault } from './services/backup/validate-backup'
import {
  openLibraryImportService,
  type LibraryImportService,
} from './services/library/library-import'
import { registerImageProtocol } from './services/resources/image-protocol'
import { openPracticeService, type PracticeService } from './services/practice/practice'
import { createMainWindow } from './window'

let store: StartupStore | undefined
let unregisterIpc: (() => void) | undefined
let library: LibraryImportService | undefined
let libraryIpc: ReturnType<typeof registerLibraryIpc> | undefined
let unregisterImages: (() => void) | undefined
let practice: PracticeService | undefined
let practiceIpc: ReturnType<typeof registerPracticeIpc> | undefined
let backup: BackupService | undefined
let backupIpc: ReturnType<typeof registerBackupIpc> | undefined
let dataLocationsIpc: ReturnType<typeof registerDataLocationsIpc> | undefined
let closeAttempt: Promise<void> | undefined
let stopping = false
let quitAllowed = false
let cleanup: Promise<void> | undefined
let starting: Promise<void> | undefined
let restoring = false

protocol.registerSchemesAsPrivileged([
  { scheme: IMAGE_SCHEME, privileges: { standard: true, secure: true } },
])

function reportError(error: unknown): void {
  try {
    const logDirectory = join(app.getPath('userData'), 'logs')
    mkdirSync(logDirectory, { recursive: true })
    const detail = error instanceof Error ? (error.stack ?? error.message) : String(error)
    appendFileSync(join(logDirectory, 'application.log'), `${new Date().toISOString()} ${detail}\n`)
  } catch {
    console.error('无法写入本地诊断日志，请检查数据目录权限。')
  }
}

async function closeDataResources(): Promise<void> {
  const failures: unknown[] = []
  for (const release of [
    async () => {
      await dataLocationsIpc?.close()
      dataLocationsIpc = undefined
    },
    () => {
      unregisterIpc?.()
      unregisterIpc = undefined
    },
    async () => {
      await backup?.close()
      backup = undefined
    },
    () => {
      practiceIpc?.close()
      practiceIpc = undefined
    },
    () => {
      practice?.close()
      practice = undefined
    },
    async () => {
      await libraryIpc?.close()
      libraryIpc = undefined
    },
    () => {
      unregisterImages?.()
      unregisterImages = undefined
    },
    async () => {
      await library?.close()
      library = undefined
    },
    () => {
      store?.close()
      store = undefined
    },
  ]) {
    try {
      await release()
    } catch (error) {
      reportError(error)
      failures.push(error)
    }
  }
  if (failures.length) throw new Error('数据库连接未全部确认关闭，停止替换。')
}

function closeResources(): Promise<void> {
  cleanup ??= (async () => {
    await starting?.catch(() => {})
    await backupIpc?.close().catch(reportError)
    backupIpc = undefined
    await closeDataResources().catch(reportError)
  })()
  return cleanup
}

function requestQuit(): void {
  if (closeAttempt || quitAllowed || restoring) return
  closeAttempt = (async () => {
    const saved = (await practiceIpc?.requestClose()) ?? true
    if (!saved) {
      const window = BrowserWindow.getAllWindows()[0]
      if (window && !window.isDestroyed()) {
        const choice = await dialog.showMessageBox(window, {
          type: 'warning',
          title: '尚未确认保存',
          message: '本次保存未完成或结果无法确认。返回窗口可保留输入并重试。',
          buttons: ['返回窗口', '放弃未保存内容并退出'],
          defaultId: 0,
          cancelId: 0,
          noLink: true,
        })
        if (choice.response !== 1) return
      }
    }
    stopping = true
    await closeResources()
    quitAllowed = true
    app.quit()
  })()
    .catch(reportError)
    .finally(() => {
      closeAttempt = undefined
    })
}

function restartApplication(): void {
  // 开发调试端口属于原进程；重启保留应用参数，避免再次绑定已退出的调试会话。
  const args = process.argv
    .slice(1)
    .filter((argument) => !/^--(?:inspect(?:-brk)?|remote-debugging-port)(?:=|$)/.test(argument))
  setTimeout(() => {
    try {
      app.relaunch({ args })
    } catch {
      dialog.showErrorBox('请重新启动应用', '数据已经安全关闭，请手动重新启动嵌入式刷题本。')
    }
    quitAllowed = true
    app.exit(0)
  }, 100)
}

async function restoreBackup(token: string): Promise<{ protectionPath: string }> {
  if (restoring || closeAttempt || stopping)
    throw new BackupFault('BACKUP_BUSY', '应用正在关闭或恢复，请等待完成。')
  if (!backup || !library || !practice || !store || !practiceIpc || !libraryIpc)
    throw new BackupFault('DATABASE_UNAVAILABLE', '本地数据服务不完整，请重启后再恢复。')
  restoring = true
  let plan: Awaited<ReturnType<BackupService['prepareRestore']>> | undefined
  let closingStarted = false
  try {
    if (!(await practiceIpc?.requestClose()))
      throw new BackupFault(
        'SAVE_FAILED',
        '待保存内容尚未确认，已停止恢复。请返回练习或显示设置重试保存。',
      )
    practiceIpc.pause()
    await dataLocationsIpc?.pause()
    await libraryIpc?.pause()
    plan = await backup.prepareRestore(token)
    // 从此处起所有失败均需重新启动，不能让窗口继续访问已关闭的连接。
    closingStarted = true
    stopping = true
    await closeDataResources()
    await replaceDatabase(
      join(app.getPath('userData'), 'practice.sqlite3'),
      plan.candidatePath,
      plan.candidateHash,
      reportError,
    )
    restartApplication()
    return { protectionPath: plan.protectionPath }
  } catch (error) {
    if (closingStarted) {
      const fatal = error instanceof BackupFault && error.code === 'RECOVERY_FAILED'
      await dialog.showMessageBox({
        type: 'error',
        title: fatal ? '恢复需要人工检查' : '恢复未完成',
        message: fatal ? error.message : '原数据已保留或回退。应用将重启，请重新选择备份。',
        detail: `保护性备份：${plan?.protectionPath ?? '未创建'}${fatal ? '\n请保留恢复事务目录及所有原文件，检查诊断日志。' : ''}`,
        buttons: [fatal ? '退出并保留数据' : '重启应用'],
        noLink: true,
      })
      if (fatal) setTimeout(() => app.exit(1), 100)
      else restartApplication()
    } else {
      practiceIpc?.resume()
      libraryIpc?.resume()
      dataLocationsIpc?.resume()
    }
    if (error instanceof BackupFault) throw error
    // 记录真实原因；写死文案会掩盖恢复目录权限或磁盘空间问题。
    reportError(error)
    throw new BackupFault(
      'RESTORE_FAILED',
      '恢复未完成，原数据保留。请检查保护性备份及本地诊断日志后重试。',
    )
  } finally {
    await plan?.release()
    if (!closingStarted) restoring = false
  }
}

async function startApplication(): Promise<void> {
  // 开发版与正式数据默认隔离；自动化测试继续显式传入独立临时目录。
  const dataDirectory =
    process.env['EMBEDDED_PRACTICE_TEST_DATA_DIR'] ??
    join(app.getPath('appData'), app.isPackaged ? 'embedded-practice' : 'embedded-practice-dev')
  if (!isAbsolute(dataDirectory)) throw new Error('数据目录必须是绝对路径。')
  mkdirSync(join(dataDirectory, 'session'), { recursive: true })
  app.setPath('userData', dataDirectory)
  app.setPath('sessionData', join(dataDirectory, 'session'))

  if (!app.requestSingleInstanceLock()) {
    app.quit()
    return
  }

  app.on('second-instance', () => {
    const window = BrowserWindow.getAllWindows()[0]
    if (!window) return
    if (window.isMinimized()) window.restore()
    window.show()
    window.focus()
  })

  await app.whenReady()
  if (stopping) return
  app.setAppUserModelId('local.embeddedPractice')
  await recoverDatabaseReplacement(join(dataDirectory, 'practice.sqlite3'))

  try {
    const opened = await openStartupStore(join(dataDirectory, 'practice.sqlite3'))
    if (stopping) {
      opened.close()
      return
    }
    store = opened
  } catch (error) {
    reportError(error)
    store = undefined
  }
  if (store) {
    try {
      store.recordLaunch()
    } catch (error) {
      // 启动计数只是诊断信息；写入失败不能连带关闭已成功打开的连接、降级全部服务。
      reportError(error)
    }
  }

  if (store) {
    try {
      const opened = await openLibraryImportService(
        join(dataDirectory, 'practice.sqlite3'),
        reportError,
      )
      if (stopping) {
        await opened.close()
        return
      }
      library = opened
    } catch (error) {
      reportError(error)
    }
  }
  if (stopping) return

  if (store) {
    try {
      const opened = await openPracticeService(join(dataDirectory, 'practice.sqlite3'), reportError)
      if (stopping) {
        opened.close()
        return
      }
      practice = opened
    } catch (error) {
      reportError(error)
    }
  }
  if (stopping) return
  if (store) {
    try {
      const opened = await openBackupService(
        join(dataDirectory, 'practice.sqlite3'),
        app.getVersion(),
        reportError,
      )
      if (stopping) {
        await opened.close()
        return
      }
      backup = opened
    } catch (error) {
      reportError(error)
    }
  }
  if (stopping) return
  const { window, rendererUrl } = createMainWindow()
  window.on('close', (event) => {
    if (quitAllowed) return
    event.preventDefault()
    requestQuit()
  })
  unregisterIpc = registerApplicationIpc(
    window,
    rendererUrl,
    () =>
      store
        ? { ok: true, value: { appVersion: app.getVersion(), ...store.read() } }
        : {
            ok: false,
            error: {
              code: 'DATABASE_UNAVAILABLE',
              message: '本地数据暂不可用，请检查数据目录权限或诊断日志后重启。原数据库会保留。',
            },
          },
    reportError,
  )
  libraryIpc = registerLibraryIpc(window, rendererUrl, library, reportError)
  practiceIpc = registerPracticeIpc(window, rendererUrl, practice, reportError)
  dataLocationsIpc = registerDataLocationsIpc(
    window,
    rendererUrl,
    app.getPath('userData'),
    reportError,
  )
  backupIpc = registerBackupIpc(window, rendererUrl, backup, reportError, restoreBackup)
  unregisterImages = registerImageProtocol(
    window.webContents.session,
    (versionId, hash) => library?.readImage(versionId, hash),
    reportError,
  )
  await window.loadURL(rendererUrl)
}

app.on('window-all-closed', () => app.quit())
app.on('before-quit', (event) => {
  if (quitAllowed) return
  event.preventDefault()
  requestQuit()
})

starting = startApplication()
void starting.catch(async (error: unknown) => {
  reportError(error)
  // 用户在页面加载完成前主动关窗会被记为启动失败，这里不能再弹「无法启动」错误框。
  if (quitAllowed || stopping) return
  stopping = true
  await closeResources()
  // 恢复事务、数据库结构与权限失败的处置方式不同，界面须给出实际原因。
  const reason =
    error instanceof Error && error.message !== '' ? `\n失败原因：${error.message}` : ''
  dialog.showErrorBox(
    '嵌入式刷题本无法启动',
    `请检查数据目录权限或本地诊断日志后重新启动。${reason}\n数据目录：${app.getPath('userData')}\n诊断日志：${join(app.getPath('userData'), 'logs', 'application.log')}`,
  )
  app.exit(1)
})
