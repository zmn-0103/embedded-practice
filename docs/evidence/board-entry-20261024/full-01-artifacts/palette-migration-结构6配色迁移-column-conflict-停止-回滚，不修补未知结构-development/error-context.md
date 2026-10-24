# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: palette-migration.spec.ts >> 结构6配色迁移 column-conflict 停止/回滚，不修补未知结构
- Location: tests\e2e\palette-migration.spec.ts:159:7

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  getByRole('navigation', { name: '主要页面', exact: true }).getByRole('link', { name: '开始练习', exact: true })
Expected: "false"
Received: "true"
Timeout:  10000ms

Call log:
  - Expect "toHaveAttribute" getByRole('navigation', { name: '主要页面', exact: true }).getByRole('link', { name: '开始练习', exact: true }) with timeout 10000ms
  - waiting for getByRole('navigation', { name: '主要页面', exact: true }).getByRole('link', { name: '开始练习', exact: true })
    24 × locator resolved to <a href="#practice" aria-disabled="true">…</a>
       - unexpected value "true"

```

```yaml
- link "开始练习" [disabled]:
  - /url: "#practice"
```

# Test source

```ts
  1  | import { mkdtemp, rm } from 'node:fs/promises'
  2  | import { tmpdir } from 'node:os'
  3  | import { basename, dirname, join, resolve } from 'node:path'
  4  | import { _electron, test as base, type Page } from '@playwright/test'
  5  | import type { AppStatusResult, DesktopApi } from '../../src/shared/contracts/application'
  6  | 
  7  | export { expect } from '@playwright/test'
  8  | 
  9  | export const test = base.extend<{ testDataDirectory: string }>({
  10 |   testDataDirectory: async ({}, use) => {
  11 |     const directory = await mkdtemp(join(tmpdir(), 'embedded-practice-'))
  12 |     try {
  13 |       await use(directory)
  14 |     } finally {
  15 |       // 只清理由本测试创建的临时根目录，禁止递归删除任意传入路径。
  16 |       if (
  17 |         resolve(dirname(directory)) !== resolve(tmpdir()) ||
  18 |         !basename(directory).startsWith('embedded-practice-')
  19 |       ) {
  20 |         throw new Error('测试临时目录超出清理范围。')
  21 |       }
  22 |       await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  23 |     }
  24 |   },
  25 | })
  26 | 
  27 | type PageName = '板块' | '开始练习' | '题库' | '学习记录' | '设置与数据'
  28 | 
  29 | export async function launchApplication(
  30 |   directory: string,
  31 |   projectName: string,
  32 |   initialPage: PageName = '开始练习',
  33 | ) {
  34 |   const env: Record<string, string> = Object.fromEntries(
  35 |     Object.entries(process.env).filter(
  36 |       (entry): entry is [string, string] => entry[1] !== undefined,
  37 |     ),
  38 |   )
  39 |   env['EMBEDDED_PRACTICE_TEST_DATA_DIR'] = directory
  40 |   delete env['ELECTRON_RUN_AS_NODE']
  41 |   delete env['ELECTRON_RENDERER_URL']
  42 |   const packaged = projectName === 'packaged'
  43 | 
  44 |   if (packaged) {
  45 |     delete env['Path']
  46 |     delete env['PATH']
  47 |     const windowsDirectory = process.env['SystemRoot']
  48 |     if (!windowsDirectory) throw new Error('此打包验收需要 Windows SystemRoot。')
  49 |     env['PATH'] = join(windowsDirectory, 'System32')
  50 |   }
  51 | 
  52 |   const application = await _electron.launch({
  53 |     ...(packaged
  54 |       ? {
  55 |           executablePath: resolve(
  56 |             process.env['EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE'] ??
  57 |               'release/win-unpacked/embedded-practice.exe',
  58 |           ),
  59 |           args: [],
  60 |         }
  61 |       : { args: [resolve('out/main/index.js')] }),
  62 |     env,
  63 |     timeout: 20_000,
  64 |   })
  65 | 
  66 |   try {
  67 |     const page = await application.firstWindow()
  68 |     await page.getByRole('heading', { name: '嵌入式刷题本', exact: true }).waitFor()
  69 |     if (initialPage) await openPage(page, initialPage)
  70 |     return { application, page }
  71 |   } catch (error) {
  72 |     await application.close()
  73 |     throw error
  74 |   }
  75 | }
  76 | 
  77 | export function readAppStatus(page: Page): Promise<AppStatusResult> {
  78 |   return page.evaluate(() =>
  79 |     (globalThis as unknown as { desktop: DesktopApi }).desktop.getAppStatus(),
  80 |   )
  81 | }
  82 | 
  83 | export async function openPage(page: Page, name: PageName) {
  84 |   const link = page
  85 |     .getByRole('navigation', { name: '主要页面', exact: true })
  86 |     .getByRole('link', { name, exact: true })
> 87 |   await base.expect(link).toHaveAttribute('aria-disabled', 'false')
     |                           ^ Error: expect(locator).toHaveAttribute(expected) failed
  88 |   await link.click()
  89 |   await base.expect(link).toHaveAttribute('aria-current', 'page')
  90 | }
  91 | 
```