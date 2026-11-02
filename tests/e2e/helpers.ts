import { mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, isAbsolute, join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { _electron, test as base, type Page } from '@playwright/test'
import type { AppStatusResult, DesktopApi } from '../../src/shared/contracts/application'

export { expect } from '@playwright/test'

export const test = base.extend<{ testDataDirectory: string }>({
  testDataDirectory: async ({}, use) => {
    const directory = await mkdtemp(join(tmpdir(), 'embedded-practice-'))
    try {
      await use(directory)
    } finally {
      // 只清理由本测试创建的临时根目录，禁止递归删除任意传入路径。
      if (
        resolve(dirname(directory)) !== resolve(tmpdir()) ||
        !basename(directory).startsWith('embedded-practice-')
      ) {
        throw new Error('测试临时目录超出清理范围。')
      }
      await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
    }
  },
})

type PageName =
  | '学习总览'
  | '知识板块'
  | '开始练习'
  | '题库'
  | '学习记录'
  | '设置与数据'
  | '备份恢复'
  | '数据位置'

export async function launchApplication(
  directory: string,
  projectName: string,
  initialPage?: PageName,
) {
  const env: Record<string, string> = Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  )
  env['EMBEDDED_PRACTICE_TEST_DATA_DIR'] = directory
  delete env['ELECTRON_RUN_AS_NODE']
  delete env['ELECTRON_RENDERER_URL']
  const packaged = projectName === 'packaged'
  const executable = process.env['EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE']

  if (packaged) {
    if (!executable || !isAbsolute(executable))
      throw new Error('packaged 检查必须显式指定绝对路径 EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE。')
    if (!(await stat(executable)).isFile()) throw new Error('指定的打包 EXE 不是文件。')
    delete env['Path']
    delete env['PATH']
    const windowsDirectory = process.env['SystemRoot']
    if (!windowsDirectory) throw new Error('此打包验收需要 Windows SystemRoot。')
    env['PATH'] = join(windowsDirectory, 'System32')
  }

  const application = await _electron.launch({
    ...(packaged
      ? {
          executablePath: executable!,
          args: [],
        }
      : { args: [resolve('out/main/index.js')] }),
    env,
    timeout: 20_000,
  })

  try {
    const page = await application.firstWindow()
    // 同时操作列表和详情的既有场景使用明确宽窗；窄窗/缩放专项自行设置尺寸。
    const window = await application.browserWindow(page)
    await window.evaluate((window) => window.setContentSize(1440, 1000))
    await page.locator('.app-shell').waitFor()
    const actual = await application.evaluate(({ app }) => ({
      executable: app.getPath('exe'),
      directory: app.getPath('userData'),
      packaged: app.isPackaged,
      version: app.getVersion(),
    }))
    base.expect(actual.directory).toBe(directory)
    base.expect(actual.packaged).toBe(packaged)
    if (packaged)
      base.expect(resolve(actual.executable).toLowerCase()).toBe(resolve(executable!).toLowerCase())
    const status = await readAppStatus(page)
    let schemaVersion: number | null = null
    if (status.ok) {
      const database = new DatabaseSync(join(directory, 'practice.sqlite3'), { readOnly: true })
      try {
        schemaVersion = Number(database.prepare('PRAGMA user_version').get()!['user_version'])
      } finally {
        database.close()
      }
      base.expect(schemaVersion).toBe(17)
      await base.expect(page.locator('footer')).toContainText('20261030.1-v003-bank')
    }
    await base.info().attach('runtime-target.json', {
      body: JSON.stringify({
        ...actual,
        schemaVersion,
        databaseAvailable: status.ok,
        buildFooter: await page.locator('footer').innerText(),
      }),
      contentType: 'application/json',
    })
    if (initialPage) await openPage(page, initialPage)
    else if (status.ok) await openPage(page, '开始练习')
    return { application, page }
  } catch (error) {
    await application.close()
    throw error
  }
}

export function readAppStatus(page: Page): Promise<AppStatusResult> {
  return page.evaluate(() =>
    (globalThis as unknown as { desktop: DesktopApi }).desktop.getAppStatus(),
  )
}

export async function openPage(page: Page, name: PageName) {
  const section = name === '备份恢复' || name === '数据位置' ? name : undefined
  const target = section ? '设置与数据' : name
  const link = page
    .getByRole('navigation', { name: '主要页面', exact: true })
    .getByRole('link', { name: target, exact: true })
  await base.expect(link).toHaveAttribute('aria-disabled', 'false')
  await link.click()
  await base.expect(link).toHaveAttribute('aria-current', 'page')
  if (section || name === '设置与数据')
    await page.getByRole('tab', { name: section ?? '外观主题', exact: true }).click()
}
