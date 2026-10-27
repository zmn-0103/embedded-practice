import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
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

type PageName = '板块' | '开始练习' | '题库' | '学习记录' | '设置与数据'

export async function launchApplication(
  directory: string,
  projectName: string,
  initialPage: PageName = '开始练习',
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

  if (packaged) {
    delete env['Path']
    delete env['PATH']
    const windowsDirectory = process.env['SystemRoot']
    if (!windowsDirectory) throw new Error('此打包验收需要 Windows SystemRoot。')
    env['PATH'] = join(windowsDirectory, 'System32')
  }

  const application = await _electron.launch({
    ...(packaged
      ? {
          executablePath: resolve(
            process.env['EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE'] ??
              'release/win-unpacked/embedded-practice.exe',
          ),
          args: [],
        }
      : { args: [resolve('out/main/index.js')] }),
    env,
    timeout: 20_000,
  })

  try {
    const page = await application.firstWindow()
    await page.getByRole('heading', { name: '嵌入式刷题本', exact: true }).waitFor()
    if (initialPage) await openPage(page, initialPage)
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
  const link = page
    .getByRole('navigation', { name: '主要页面', exact: true })
    .getByRole('link', { name, exact: true })
  await base.expect(link).toHaveAttribute('aria-disabled', 'false')
  await link.click()
  await base.expect(link).toHaveAttribute('aria-current', 'page')
}
