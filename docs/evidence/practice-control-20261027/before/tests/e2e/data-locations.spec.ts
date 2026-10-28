import { mkdir, mkdtemp, readFile, readdir, rename, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import type { ElectronApplication, Page } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import type { DataLocations } from '../../src/shared/contracts/data-locations'
import { expect, launchApplication, openPage, readAppStatus, test } from './helpers'
import {
  beginHistoryPractice,
  captureHistory,
  historySnapshot,
  prepareHistory,
  stop,
  withHistoryDatabase,
} from './history-helpers'

async function directory<T>(work: (path: string) => Promise<T>): Promise<T> {
  const path = await mkdtemp(join(tmpdir(), 'embedded-practice-中文 数据位置-'))
  try {
    return await work(path)
  } finally {
    if (
      dirname(resolve(path)) !== resolve(tmpdir()) ||
      !basename(path).startsWith('embedded-practice-中文 数据位置-')
    )
      throw new Error('拒绝清理非本次位置测试目录。')
    await rm(path, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  }
}
function expectedLocations(root: string): DataLocations {
  return {
    dataDirectory: root,
    backupDirectory: join(root, 'backups'),
    logDirectory: join(root, 'logs'),
    logFile: join(root, 'logs', 'application.log'),
  }
}
async function nativeFolders(application: ElectronApplication, deferred = false) {
  await application.evaluate(({ shell }, deferred) => {
    const control = {
      paths: [] as string[],
      release: undefined as undefined | ((result: string) => void),
    }
    Reflect.set(globalThis, 'folderControl', control)
    shell.openPath = async (path) => {
      control.paths.push(path)
      return deferred
        ? new Promise<string>((done) => {
            control.release = done
          })
        : ''
    }
  }, deferred)
}
async function release(application: ElectronApplication) {
  await application
    .evaluate(() => Reflect.get(globalThis, 'folderControl')?.release?.(''))
    .catch(() => {})
}
async function folderPaths(application: ElectronApplication): Promise<string[]> {
  return application.evaluate(() => Reflect.get(globalThis, 'folderControl').paths)
}
async function readLocations(page: Page) {
  return page.evaluate(() =>
    (globalThis as unknown as { desktop: DesktopApi }).desktop.dataLocations.read(),
  )
}

test('设置显示实际中文空格数据位置，读取无副作用，三种文件夹打开不改变学习数据', async ({}, info) => {
  await directory(async (root) => {
    const { application, page } = await prepareHistory(root, info.project.name, 1)
    try {
      await beginHistoryPractice(page)
      await page
        .getByRole('textbox', { name: '我的答案', exact: true })
        .fill('位置检查草稿\nint keep = 3;')
      await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
      await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
      await openPage(page, '设置与数据')
      await page.getByLabel('显示主题', { exact: true }).selectOption('dark')
      await page.getByLabel('正文字号', { exact: true }).selectOption('22')
      await page.getByRole('button', { name: '保存并应用', exact: true }).click()
      await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
      await openPage(page, '数据位置')
      const before = historySnapshot(root),
        status = await readAppStatus(page)
      const settings = withHistoryDatabase(root, (db) =>
        db.prepare('SELECT * FROM appearance_settings').all(),
      )
      expect(await readLocations(page)).toEqual({ ok: true, value: expectedLocations(root) })
      const panel = page.getByRole('region', { name: '数据位置', exact: true })
      for (const path of Object.values(expectedLocations(root)))
        await expect(panel.getByText(path, { exact: true })).toBeVisible()
      expect(await readdir(root)).not.toContain('backups')
      expect(await readdir(root)).not.toContain('logs')
      await nativeFolders(application)
      for (const label of ['数据文件夹', '备份文件夹', '日志文件夹']) {
        await panel.getByRole('button', { name: `打开${label}`, exact: true }).click()
        await expect(panel.getByRole('status')).toHaveText(`已请求打开${label}。`)
      }
      expect(await folderPaths(application)).toEqual([
        root,
        join(root, 'backups'),
        join(root, 'logs'),
      ])
      expect(await readdir(join(root, 'backups'))).toEqual([])
      expect(await readdir(join(root, 'logs'))).toEqual([])
      expect(historySnapshot(root)).toEqual(before)
      expect(await readAppStatus(page)).toEqual(status)
      expect(
        withHistoryDatabase(root, (db) => db.prepare('SELECT * FROM appearance_settings').all()),
      ).toEqual(settings)
      await application.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0]!.setSize(760, 760),
      )
      await panel.evaluate((element) => element.scrollIntoView({ block: 'start' }))
      const overflow = await panel.evaluate((element) => ({
        width: element.clientWidth,
        content: element.scrollWidth,
      }))
      expect(overflow.content).toBeLessThanOrEqual(overflow.width)
      for (const label of ['数据文件夹', '备份文件夹', '日志文件夹']) {
        const button = panel.getByRole('button', { name: `打开${label}`, exact: true })
        await button.scrollIntoViewIfNeeded()
        await expect(button).toBeInViewport()
      }
      await panel.evaluate((element) => element.scrollIntoView({ block: 'start' }))
      await captureHistory(application, page, info, 'data-locations-dark-22.png')
      await info.attach('data-locations-preserved.json', {
        body: JSON.stringify({
          locations: expectedLocations(root),
          paths: await folderPaths(application),
          before,
          settings,
          overflow,
        }),
        contentType: 'application/json',
      })
    } finally {
      await stop(application)
    }
  })
})

test('数据位置拒绝任意路径及文件或 junction 目标，修正后可重试', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await launchApplication(
    testDataDirectory,
    info.project.name,
    '数据位置',
  )
  try {
    await nativeFolders(application)
    const results = await application.evaluate(async ({ ipcMain, BrowserWindow }) => {
      const window = BrowserWindow.getAllWindows()[0]!,
        frame = window.webContents.mainFrame
      const event = { sender: window.webContents, senderFrame: frame }
      const handlers = Reflect.get(ipcMain, '_invokeHandlers')
      return Promise.all([
        handlers.get('data-locations:read')(event, 'C:/任意'),
        handlers.get('data-locations:open')(event, 'C:/任意'),
        handlers.get('data-locations:open')(event, { target: 'data', path: 'C:/任意' }),
        handlers.get('data-locations:open')({ ...event, senderFrame: null }, 'data'),
      ])
    })
    expect(results).toMatchObject([
      { error: { code: 'INVALID_REQUEST' } },
      { error: { code: 'INVALID_REQUEST' } },
      { error: { code: 'INVALID_REQUEST' } },
      { error: { code: 'FORBIDDEN' } },
    ])
    const before = historySnapshot(testDataDirectory)
    const backups = join(testDataDirectory, 'backups')
    await writeFile(backups, '不能作为文件夹打开')
    expect(
      await page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.dataLocations.open('backups'),
      ),
    ).toMatchObject({ error: { code: 'FILE_ERROR' } })
    await rename(backups, join(testDataDirectory, 'retained-file.txt'))
    const other = join(testDataDirectory, '其他自建目录')
    await mkdir(other)
    await writeFile(join(other, 'retained.txt'), '保留')
    await symlink(other, backups, 'junction')
    expect(
      await page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.dataLocations.open('backups'),
      ),
    ).toMatchObject({ error: { code: 'FILE_ERROR' } })
    expect(await folderPaths(application)).toEqual([])
    await rename(backups, join(testDataDirectory, 'retained-junction'))
    expect(
      await page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.dataLocations.open('backups'),
      ),
    ).toEqual({ ok: true, value: null })
    expect(await folderPaths(application)).toEqual([backups])
    expect(await readFile(join(other, 'retained.txt'), 'utf8')).toBe('保留')
    expect(historySnapshot(testDataDirectory)).toEqual(before)
  } finally {
    await stop(application)
  }
})

test('数据位置读取与系统打开失败保留真实状态，重试成功且诊断不含系统原始内容', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  try {
    await application.evaluate(({ ipcMain, shell }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('data-locations:read')
      let reads = 0,
        opens = 0
      ipcMain.removeHandler('data-locations:read')
      ipcMain.handle('data-locations:read', (...args) =>
        ++reads === 1 ? { ok: true, value: { wrong: '不得当作默认位置' } } : original(...args),
      )
      shell.openPath = async () => (++opens === 1 ? 'PRIVATE-SYSTEM-CONTENT' : '')
    })
    await openPage(page, '数据位置')
    const panel = page.getByRole('region', { name: '数据位置', exact: true })
    await expect(panel.getByRole('alert')).toContainText('数据位置尚未读取成功')
    await expect(panel.getByRole('button', { name: '打开数据文件夹', exact: true })).toHaveCount(0)
    await panel.getByRole('button', { name: '重试读取数据位置', exact: true }).click()
    await expect(panel.getByText(testDataDirectory, { exact: true })).toBeVisible()
    const before = historySnapshot(testDataDirectory)
    await panel.getByRole('button', { name: '打开日志文件夹', exact: true }).click()
    await expect(panel.getByRole('alert')).toContainText('无法打开文件夹')
    const log = await readFile(join(testDataDirectory, 'logs/application.log'), 'utf8')
    expect(log).toContain('本地数据位置操作失败')
    expect(log).not.toContain('PRIVATE-SYSTEM-CONTENT')
    await panel.getByRole('button', { name: '打开日志文件夹', exact: true }).click()
    await expect(panel.getByRole('status')).toHaveText('已请求打开日志文件夹。')
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    await info.attach('data-location-failures.json', {
      body: JSON.stringify({ locations: await readLocations(page), log }),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})

test('数据库不可用时仍能查看数据位置并打开日志文件夹，原坏文件字节保持', async ({
  testDataDirectory,
}, info) => {
  const path = join(testDataDirectory, 'practice.sqlite3')
  await writeFile(path, 'INTENTIONALLY-INVALID-DATABASE')
  const bytes = await readFile(path)
  const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  try {
    await expect(page.locator('.service-status')).toContainText('本地数据暂不可用')
    const panel = page.getByRole('region', { name: '数据位置', exact: true })
    await expect(panel.getByText(testDataDirectory, { exact: true })).toBeVisible()
    expect(await readLocations(page)).toEqual({
      ok: true,
      value: expectedLocations(testDataDirectory),
    })
    await nativeFolders(application)
    await panel.getByRole('button', { name: '打开日志文件夹', exact: true }).click()
    await expect(panel.getByRole('status')).toHaveText('已请求打开日志文件夹。')
    expect(await folderPaths(application)).toEqual([join(testDataDirectory, 'logs')])
    expect((await readAppStatus(page)).ok).toBe(false)
    expect(await readFile(path)).toEqual(bytes)
    await info.attach('unavailable-database-locations.json', {
      body: JSON.stringify(await readLocations(page)),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})

test('目录打开处理中锁定设置备份导航，正常关闭等待在途打开响应', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await launchApplication(
    testDataDirectory,
    info.project.name,
    '数据位置',
  )
  try {
    await nativeFolders(application, true)
    await page
      .getByRole('region', { name: '数据位置', exact: true })
      .getByRole('button', { name: '打开日志文件夹', exact: true })
      .click()
    await expect.poll(() => folderPaths(application)).toEqual([join(testDataDirectory, 'logs')])
    await expect(page.getByRole('tab', { name: '外观主题', exact: true })).toBeDisabled()
    await expect(page.getByRole('tab', { name: '备份恢复', exact: true })).toBeDisabled()
    await expect(
      page
        .getByRole('navigation', { name: '主要页面' })
        .getByRole('link', { name: '题库', exact: true }),
    ).toHaveAttribute('aria-disabled', 'true')
    const busy = await page.evaluate(() =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.dataLocations.open('data'),
    )
    expect(busy).toMatchObject({ error: { code: 'LOCATION_BUSY' } })
    const exited = application.waitForEvent('close')
    await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.close())
    await expect
      .poll(() =>
        application.evaluate(({ ipcMain }) =>
          Reflect.get(ipcMain, '_invokeHandlers').has('data-locations:read'),
        ),
      )
      .toBe(false)
    expect(await readFile(join(testDataDirectory, 'practice.sqlite3'))).not.toHaveLength(0)
    await release(application)
    await exited
  } finally {
    await release(application)
    await stop(application)
  }
})

test('恢复先暂停并等待目录打开，结算后才创建保护备份和替换', async ({
  testDataDirectory,
}, info) => {
  await directory(async (output) => {
    const { application, page } = await launchApplication(
      testDataDirectory,
      info.project.name,
      '数据位置',
    )
    try {
      const path = join(output, '位置检查 备份.sqlite3')
      await application.evaluate(({ app, dialog }, path) => {
        dialog.showSaveDialog = async () => ({ canceled: false, filePath: path })
        dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
        dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false })
        app.relaunch = () => {} // 真正自动重启由既有 M4 场景验证，本项验证新增暂停次序。
      }, path)
      expect(
        (
          await page.evaluate(() =>
            (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.export(),
          )
        ).ok,
      ).toBe(true)
      const preview = await page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
      )
      if (!preview.ok) throw new Error(preview.error.code)
      await nativeFolders(application, true)
      const opening = page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.dataLocations.open('logs'),
      )
      void opening.catch(() => {})
      await expect.poll(() => folderPaths(application)).toHaveLength(1)
      const exited = application.waitForEvent('close')
      const restoring = page.evaluate(
        (token) =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.restore({ token }),
        preview.value.token,
      )
      void restoring.catch(() => {})
      await expect
        .poll(() => readLocations(page))
        .toMatchObject({ error: { code: 'SERVICE_CLOSED' } })
      expect(await readdir(testDataDirectory)).not.toContain('backups')
      await release(application)
      expect(await opening).toMatchObject({ error: { code: 'SERVICE_CLOSED' } })
      const restored = await restoring
      expect(restored.ok).toBe(true)
      await exited
      expect(
        (await readdir(join(testDataDirectory, 'backups'))).filter((name) =>
          name.startsWith('before-restore-'),
        ),
      ).toHaveLength(1)
      await info.attach('directory-restore-order.json', {
        body: JSON.stringify({ restored }),
        contentType: 'application/json',
      })
    } finally {
      await release(application)
      await stop(application)
    }
  })
})

test('切页期间晚到的位置读取不能覆盖新面板的实际位置', async ({ testDataDirectory }, info) => {
  const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  try {
    await application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('data-locations:read')
      let calls = 0
      ipcMain.removeHandler('data-locations:read')
      ipcMain.handle('data-locations:read', (...args) => {
        if (++calls !== 1) return original(...args)
        return new Promise((done) =>
          Reflect.set(globalThis, 'releaseLocationRead', () =>
            done({
              ok: true,
              value: {
                dataDirectory: 'C:/STALE',
                backupDirectory: 'C:/STALE/backups',
                logDirectory: 'C:/STALE/logs',
                logFile: 'C:/STALE/logs/application.log',
              },
            }),
          ),
        )
      })
    })
    await openPage(page, '数据位置')
    await expect(page.getByText('正在读取数据位置…', { exact: true })).toBeVisible()
    await openPage(page, '题库')
    await openPage(page, '数据位置')
    const panel = page.getByRole('region', { name: '数据位置', exact: true })
    await expect(panel.getByText(testDataDirectory, { exact: true })).toBeVisible()
    await application.evaluate(() => Reflect.get(globalThis, 'releaseLocationRead')())
    await expect(panel).not.toContainText('STALE')
    expect(await readLocations(page)).toEqual({
      ok: true,
      value: expectedLocations(testDataDirectory),
    })
  } finally {
    await stop(application)
  }
})

test('Windows 已有 Logs Backups 和 Backup-Staging 目录可正常打开并完成保护恢复', async ({
  testDataDirectory,
}, info) => {
  await directory(async (output) => {
    for (const folder of ['Logs', 'Backups', 'Backup-Staging'])
      await mkdir(join(testDataDirectory, folder))
    const { application, page } = await launchApplication(
      testDataDirectory,
      info.project.name,
      '数据位置',
    )
    let reopened: ElectronApplication | undefined
    try {
      await nativeFolders(application)
      for (const target of ['logs', 'backups'] as const)
        expect(
          await page.evaluate(
            (target) =>
              (globalThis as unknown as { desktop: DesktopApi }).desktop.dataLocations.open(target),
            target,
          ),
        ).toEqual({ ok: true, value: null })
      expect(await folderPaths(application)).toEqual([
        join(testDataDirectory, 'Logs'),
        join(testDataDirectory, 'Backups'),
      ])
      const exportedPath = join(output, '已确认快照.sqlite3')
      await application.evaluate(({ app, dialog }, path) => {
        dialog.showSaveDialog = async () => ({ canceled: false, filePath: path })
        dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false })
        app.relaunch = () => {}
      }, exportedPath)
      const exported = await page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.export(),
      )
      expect(exported.ok).toBe(true)
      // 复制的是已关闭、已校验导出文件，不复制写入中的当前数据库。
      const selectedPath = join(testDataDirectory, 'Backups', '独立备份.sqlite3')
      const bytes = await readFile(exportedPath)
      await writeFile(selectedPath, bytes)
      const changed = await page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.settings.save({
          theme: 'dark',
          palette: 'forest',
          fontSize: 21,
        }),
      )
      expect(changed.ok).toBe(true)
      await application.evaluate(({ dialog }, path) => {
        dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
      }, selectedPath)
      const selected = await page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.preview(),
      )
      expect(selected.ok).toBe(true)
      if (!selected.ok) throw new Error(selected.error.code)
      const exited = application.waitForEvent('close')
      const restored = await page.evaluate(
        (token) =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.backup.restore({ token }),
        selected.value.token,
      )
      expect(restored.ok).toBe(true)
      await exited
      const protections = (await readdir(join(testDataDirectory, 'Backups'))).filter((name) =>
        name.startsWith('before-restore-'),
      )
      expect(protections).toHaveLength(1)
      expect(await readFile(selectedPath)).toEqual(bytes)
      const launched = await launchApplication(testDataDirectory, info.project.name, '数据位置')
      reopened = launched.application
      await expect(launched.page.getByLabel('显示主题', { exact: true })).toHaveValue('system')
      await expect(launched.page.getByLabel('正文字号', { exact: true })).toHaveValue('17')
      await nativeFolders(reopened)
      expect(
        await launched.page.evaluate(() =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.dataLocations.open('backups'),
        ),
      ).toEqual({ ok: true, value: null })
      expect(await folderPaths(reopened)).toEqual([join(testDataDirectory, 'Backups')])
      await info.attach('windows-directory-case-restored.json', {
        body: JSON.stringify({ restored, protections, selectedPath }),
        contentType: 'application/json',
      })
    } finally {
      if (reopened) await stop(reopened)
      await stop(application)
    }
  })
})
