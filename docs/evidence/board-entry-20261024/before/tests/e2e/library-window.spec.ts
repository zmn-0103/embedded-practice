import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import type { Worker, WorkerOptions } from 'node:worker_threads'
import type { ElectronApplication, Page } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { imageResourceUrl } from '../../src/shared/contracts/content-urls'
import { expect, launchApplication, test } from './helpers'

const secret = 'UI-ANSWER-ONE 仅展开后出现'
function bank(count = 2, update = false, omitSecond = false): string {
  return (
    `---\nschema_version: 1\ntopic_id: ui-fixture\ntopic_title: 窗口验证样本\n---\n\n[manual]: https://example.com/manual "参考资料"\n\n` +
    Array.from({ length: count }, (_, index) => {
      const n = index + 1
      if (omitSecond && n === 2) return ''
      const body =
        n === 1
          ? '检查下列代码与表格。\n\n```c\nint value = 1;\n// <script>globalThis.evil = 1</script>\n```\n\n| 项目 | 值 |\n| :--- | ---: |\n| GPIO | 1 |\n\n![PNG 图](assets/中文图.png)\n![JPEG 图](assets/带%20空格.jpg)\n![WebP 图](assets/test.webp)\n\n[参考手册][manual] 和 [不支持的文件链接](file:///C:/private.txt)'
          : `第 ${n} 题题干`
      const answer =
        n === 1
          ? `${update ? '更新后的答案' : secret}\n\n![答案图](assets/中文图.png)`
          : n === 2
            ? 'UI-ANSWER-TWO\n\n![损坏图](assets/header-only.png)'
            : `第 ${n} 题答案`
      return `## ui-${String(n).padStart(3, '0')} | ${n === 1 ? '代码与表格检查' : `窗口题 ${n}`}\n\n标签：测试夹具\n难度：基础\n\n### 题目\n\n${body}\n\n### 参考答案\n\n${answer}\n\n`
    }).join('')
  )
}
async function prepare(directory: string, count = 2) {
  const sources = join(directory, 'sources')
  const assets = join(sources, 'assets')
  await mkdir(assets, { recursive: true })
  await copyFile(resolve('tests/fixtures/images/small.png'), join(assets, '中文图.png'))
  await copyFile(resolve('tests/fixtures/images/small.jpg'), join(assets, '带 空格.jpg'))
  await copyFile(resolve('tests/fixtures/images/small.webp'), join(assets, 'test.webp'))
  // 有意只保留 PNG 头部：准备器可识别尺寸，但真实像素解码应失败并提示。
  await writeFile(
    join(assets, 'header-only.png'),
    (await readFile(resolve('tests/fixtures/images/small.png'))).subarray(0, 33),
  )
  const file = join(sources, '窗口样本.md')
  await writeFile(file, bank(count))
  return { sources, file }
}
async function choose(application: ElectronApplication, filePaths: string[], canceled = false) {
  await application.evaluate(
    ({ dialog }, selected) => {
      dialog.showOpenDialog = async () => ({
        canceled: selected.canceled,
        filePaths: selected.filePaths,
      })
    },
    { filePaths, canceled },
  )
}
async function importThroughWindow(application: ElectronApplication, page: Page, paths: string[]) {
  await choose(application, paths)
  await page.getByRole('button', { name: '导入题库', exact: true }).click()
  await expect(page.getByRole('heading', { name: '导入预览', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '确认导入', exact: true }).click()
  await expect(page.getByText(/^导入完成：/)).toBeVisible()
}
async function expectImages(page: Page) {
  const images = page.locator('.question-reader img')
  await expect(images).toHaveCount(3)
  for (let index = 0; index < 3; index++) {
    const image = images.nth(index)
    await image.scrollIntoViewIfNeeded()
    await expect
      .poll(() =>
        image.evaluate((element) => (element as unknown as { naturalWidth: number }).naturalWidth),
      )
      .toBe(2)
    expect(await image.getAttribute('src')).toMatch(
      /^practice-image:\/\/resource\/[1-9]\d*\/[a-f0-9]{64}$/,
    )
  }
}

test('窗口预览确认、三种图片解码、移动来源后独立进程重开', async ({ testDataDirectory }, info) => {
  const { sources, file } = await prepare(testDataDirectory)
  const { application, page } = await launchApplication(
    testDataDirectory,
    info.project.name,
    '题库',
  )
  try {
    await choose(application, [file])
    await page.getByRole('button', { name: '导入题库', exact: true }).dblclick()
    await expect(page.getByRole('heading', { name: '导入预览', exact: true })).toBeVisible()
    await expect(page.locator('.count-grid dd')).toHaveText(['2', '0', '0', '0', '0', '0'])
    const moved = resolve(testDataDirectory, 'sources-moved')
    if (
      dirname(resolve(sources)) !== resolve(testDataDirectory) ||
      dirname(moved) !== resolve(testDataDirectory) ||
      dirname(resolve(testDataDirectory)) !== resolve(tmpdir()) ||
      !basename(testDataDirectory).startsWith('embedded-practice-')
    )
      throw new Error('拒绝移动非测试目录')
    await rename(sources, moved)
    await page.getByRole('button', { name: '确认导入', exact: true }).dblclick()
    await expect(page.getByText(/^导入完成：/)).toBeVisible()
    await page.getByRole('button', { name: /ui-001/ }).click()
    await expect(page.locator('.question-reader pre code')).toContainText('int value = 1;')
    await expect(page.locator('.question-reader table')).toContainText('GPIO')
    expect(await page.content()).not.toContain(secret)
    expect(await page.locator('body').ariaSnapshot()).not.toContain(secret)
    await expectImages(page)
    await page.screenshot({ path: info.outputPath('library-question-light.png'), fullPage: true })
    await page.getByRole('button', { name: '展开参考答案' }).click()
    await expect(page.getByRole('region', { name: '参考答案', exact: true })).toContainText(secret)
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.screenshot({ path: info.outputPath('library-answer-dark.png'), fullPage: true })
    await page.getByRole('button', { name: /ui-002/ }).click()
    await expect(page.locator('.question-reader')).toContainText('第 2 题题干')
    expect(await page.content()).not.toContain(secret)
    expect(await page.content()).not.toContain('UI-ANSWER-TWO')
    await page.getByRole('button', { name: '展开参考答案' }).click()
    await expect(page.locator('.image-error')).toContainText('图片无法解码或读取')
  } finally {
    await application.close()
  }
  const reopened = await launchApplication(testDataDirectory, info.project.name, '题库')
  try {
    await reopened.page.getByRole('button', { name: /ui-001/ }).click()
    await expectImages(reopened.page)
    expect(await reopened.page.content()).not.toContain(secret)
    await reopened.page.getByRole('button', { name: '展开参考答案' }).click()
    await expect(
      reopened.page.getByRole('region', { name: '参考答案', exact: true }),
    ).toContainText(secret)
  } finally {
    await reopened.application.close()
  }
})

test('窗口取消、错误定位、放弃预览、重载与非法请求保护', async ({ testDataDirectory }, info) => {
  const { file, sources } = await prepare(testDataDirectory)
  const { application, page } = await launchApplication(
    testDataDirectory,
    info.project.name,
    '题库',
  )
  try {
    await choose(application, [], true)
    await page.getByRole('button', { name: '导入题库', exact: true }).click()
    await expect(page.getByText('已取消本次导入。')).toBeVisible()
    const invalid = join(sources, '错误题库.md')
    await writeFile(invalid, bank().replace('### 参考答案', '### 错误分区'))
    await choose(application, [invalid])
    await page.getByRole('button', { name: '导入题库', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('错误题库.md')
    await expect(page.getByRole('alert')).toContainText('第')
    await expect(page.getByRole('button', { name: '确认导入', exact: true })).toHaveCount(0)
    await choose(application, [file])
    await page.getByRole('button', { name: '导入题库', exact: true }).click()
    await expect(page.getByRole('heading', { name: '导入预览', exact: true })).toBeVisible()
    await page.getByRole('button', { name: '放弃预览' }).click()
    await expect(page.getByRole('heading', { name: '题库尚未导入' })).toBeVisible()
    const preview = await page.evaluate(() =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.library.previewImport(),
    )
    if (!preview.ok) throw new Error(preview.error.message)
    await page.reload()
    await expect(page.getByRole('status')).toHaveText('本地数据已就绪')
    const result = await page.evaluate(
      (token) =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.library.commitImport(token),
      preview.value.token,
    )
    expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_TOKEN' } })
    const invalidRequest = await page.evaluate(() =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.library.getQuestion({
        topicId: 'ui-fixture',
        questionId: 'ui-001',
        path: 'C:/private',
      } as never),
    )
    expect(invalidRequest).toMatchObject({ error: { code: 'INVALID_REQUEST' } })
  } finally {
    await application.close()
  }
})

test('分页与归档视图、窗口更新摘要及相同身份恢复', async ({ testDataDirectory }, info) => {
  const { file } = await prepare(testDataDirectory, 25)
  const { application, page } = await launchApplication(
    testDataDirectory,
    info.project.name,
    '题库',
  )
  try {
    await importThroughWindow(application, page, [file])
    await expect(page.locator('.question-list li')).toHaveCount(20)
    await page.getByRole('button', { name: '下一页', exact: true }).click()
    await expect(page.locator('.question-list li')).toHaveCount(5)
    await page.getByRole('button', { name: /ui-021/ }).click()
    await expect(page.locator('.question-reader')).toContainText('第 21 题题干')
    await writeFile(file, bank(25, true, true))
    await choose(application, [file])
    await page.getByRole('button', { name: '导入题库', exact: true }).click()
    await expect(page.getByRole('heading', { name: '导入预览', exact: true })).toBeVisible()
    await expect(page.locator('.count-grid dd').nth(1)).toHaveText('1')
    await expect(page.locator('.count-grid dd').nth(4)).toHaveText('1')
    await page.getByRole('button', { name: '确认导入', exact: true }).click()
    await expect(page.getByText(/^导入完成：/)).toBeVisible()
    await page.getByLabel('查看归档题目').check()
    await expect(page.locator('.question-list li')).toHaveCount(1)
    await page.getByRole('button', { name: /ui-002/ }).click()
    await expect(page.locator('.question-reader')).toContainText('已归档')
    await writeFile(file, bank(25, true))
    await importThroughWindow(application, page, [file])
    await expect(page.getByText(/^导入完成：/)).toContainText('恢复 1')
    await expect(page.locator('.question-list li')).toHaveCount(0)
    await page.getByLabel('查看归档题目').uncheck()
    await expect(page.locator('.question-list li')).toHaveCount(20)
  } finally {
    await application.close()
  }
})

test('受控外链与资源关联、严格 CSP、模板导出', async ({ testDataDirectory }, info) => {
  const { file } = await prepare(testDataDirectory)
  const { application, page } = await launchApplication(
    testDataDirectory,
    info.project.name,
    '题库',
  )
  try {
    await importThroughWindow(application, page, [file])
    await page.getByRole('button', { name: /ui-001/ }).click()
    await expect(page.getByRole('link', { name: '参考手册' })).toHaveAttribute(
      'href',
      'https://example.com/manual',
    )
    await expect(page.getByRole('link', { name: '不支持的文件链接' })).toHaveCount(0)
    expect(
      await page.evaluate(() => (globalThis as unknown as { evil?: unknown }).evil),
    ).toBeUndefined()
    await application.evaluate(({ shell }) => {
      const intercepted = shell as typeof shell & { testUrls?: string[] }
      intercepted.testUrls = []
      shell.openExternal = async (url) => {
        intercepted.testUrls!.push(url)
      }
    })
    await page.getByRole('link', { name: '参考手册' }).click()
    expect(
      await application.evaluate(
        ({ shell }) => (shell as typeof shell & { testUrls?: string[] }).testUrls,
      ),
    ).toEqual(['https://example.com/manual'])
    const detail = await page.evaluate(() =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.library.getQuestion({
        topicId: 'ui-fixture',
        questionId: 'ui-001',
      }),
    )
    if (!detail.ok) throw new Error(detail.error.message)
    expect(JSON.stringify(detail)).not.toContain(secret)
    const firstHash = detail.value.body.imageBindings[0]!.hash
    const forbiddenUrl = imageResourceUrl(999999, firstHash)
    const loaded = await page.evaluate(
      (url) =>
        new Promise<boolean>((resolveResult) => {
          const ImageConstructor = (
            globalThis as unknown as {
              Image: new () => {
                src: string
                onload: (() => void) | null
                onerror: (() => void) | null
              }
            }
          ).Image
          const image = new ImageConstructor()
          image.onload = () => resolveResult(true)
          image.onerror = () => resolveResult(false)
          image.src = url
        }),
      forbiddenUrl,
    )
    expect(loaded).toBe(false)
    const output = join(testDataDirectory, '导出模板.md')
    await application.evaluate(({ dialog }, filePath) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath })
    }, output)
    await page.getByRole('button', { name: '导出题库模板' }).click()
    await expect(page.getByText('题库模板已导出，请在程序外填写后导入。')).toBeVisible()
    expect(await readFile(output)).toEqual(
      await readFile(resolve('question-banks/templates/专题模板.md')),
    )
    const policy = await page
      .locator('meta[http-equiv="Content-Security-Policy"]')
      .getAttribute('content')
    expect(policy).toContain("connect-src 'none'")
    expect(policy).not.toContain('unsafe-inline')
  } finally {
    await application.close()
  }
})

test('准备期间关闭应用，真实工作线程退出后正常结束', async ({ testDataDirectory }, info) => {
  const { file } = await prepare(testDataDirectory, 5000)
  const { application, page } = await launchApplication(
    testDataDirectory,
    info.project.name,
    '题库',
  )
  let closed = false
  try {
    await application.evaluate(({ app }) => {
      const threads: { Worker: typeof Worker } = process.getBuiltinModule('node:worker_threads')
      const files = process.getBuiltinModule('node:fs')
      const path = process.getBuiltinModule('node:path')
      const original = threads.Worker
      const created: number[] = []
      const exited: number[] = []
      const target = path.join(app.getPath('userData'), 'worker-exit-proof.json')
      const save = () => files.writeFileSync(target, JSON.stringify({ created, exited }))
      threads.Worker = class extends original {
        constructor(filename: string | URL, options?: WorkerOptions) {
          super(filename, options)
          const id = this.threadId
          created.push(id)
          save()
          this.once('exit', () => {
            exited.push(id)
            save()
          })
        }
      }
    })
    await choose(application, [file])
    await page.getByRole('button', { name: '导入题库', exact: true }).click()
    const proof = join(testDataDirectory, 'worker-exit-proof.json')
    await expect
      .poll(async () => {
        try {
          return JSON.parse(await readFile(proof, 'utf8')).created.length as number
        } catch {
          return 0
        }
      })
      .toBe(1)
    await application.close()
    closed = true
    const report = JSON.parse(await readFile(proof, 'utf8')) as {
      created: number[]
      exited: number[]
    }
    expect(report.exited).toEqual(report.created)
    expect(report.created.every((id) => id > 0)).toBe(true)
    await info.attach('window-worker-exit.json', {
      body: JSON.stringify(report),
      contentType: 'application/json',
    })
  } finally {
    if (!closed) await application.close()
  }
})
