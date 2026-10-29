import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { ElectronApplication, Page } from '@playwright/test'
import type { PracticeService } from '../../src/main/services/practice/practice'
import { expect, launchApplication, openPage, test } from './helpers'

const secret = 'M2-WINDOW-ANSWER-ONE 仅揭晓后显示'
const closedApplications = new WeakSet<ElectronApplication>()
interface FixtureOptions {
  longAnswer?: boolean
  longQuestions?: boolean
}
async function fixture(directory: string, options: FixtureOptions = {}) {
  const root = join(directory, 'sources')
  await mkdir(join(root, 'assets'), { recursive: true })
  for (const extension of ['png', 'jpg', 'webp'])
    await copyFile(
      resolve(`tests/fixtures/images/small.${extension}`),
      join(root, `assets/small.${extension}`),
    )
  const file = join(root, '练习窗口.md')
  const code = 'int value = 1;\n// <script>globalThis.practiceEvil = 1</script>\n'
  await writeFile(
    file,
    `---\nschema_version: 1\ntopic_id: practice-window\ntopic_title: 练习窗口测试专题\n---\n\n` +
      [1, 2, 3]
        .map(
          (n) =>
            `## window-${n} | 窗口练习 ${n}\n\n标签：窗口验证\n难度：基础\n\n### 题目\n\n第 ${n} 题题干。\n\n${
              n === 1
                ? '```c\n' +
                  code +
                  '```\n\n```cpp\nclass Device {};\n```\n\n```arm\nMOV r0, #1\nBX lr\n```\n\n```unknown-language\n保持原样 <tag>\n```\n\n| 项目 | 数值 |\n| :--- | ---: |\n| GPIO | 1 |\n\n![PNG](assets/small.png)\n![JPEG](assets/small.jpg)\n![WebP](assets/small.webp)\n\n'
                : ''
            }${options.longQuestions ? Array.from({ length: 60 }, (_, index) => `第 ${n} 题第 ${index + 1} 段长题干，核对切题时阅读入口与操作位置。`).join('\n\n') + '\n\n' : ''}### 参考答案\n\n${n === 1 ? secret : `M2-ANSWER-${n}`}\n\n${options.longAnswer && n === 1 ? Array.from({ length: 60 }, (_, index) => `第 ${index + 1} 段长答案，用来核对操作按钮在长内容下仍可见。`).join('\n\n') + '\n\n' : ''}`,
        )
        .join(''),
  )
  return { file, code }
}
async function prepare(directory: string, project: string, options: FixtureOptions = {}) {
  const source = await fixture(directory, options)
  const launched = await launchApplication(directory, project, '题库')
  await launched.application.evaluate(({ dialog }, file) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [file] })
  }, source.file)
  await launched.page.getByRole('button', { name: '导入题库', exact: true }).click()
  await launched.page.getByRole('heading', { name: '导入预览', exact: true }).waitFor()
  await launched.page.getByRole('button', { name: '确认导入', exact: true }).click()
  await expect(launched.page.getByText(/^导入完成：/)).toBeVisible()
  await launched.page.getByRole('button', { name: '关闭导入工作区', exact: true }).click()
  await openPage(launched.page, '开始练习')
  await expect(launched.page.getByRole('button', { name: '开始练习', exact: true })).toBeEnabled()
  return { ...launched, ...source }
}
async function begin(page: Page) {
  await page.getByRole('button', { name: '开始练习', exact: true }).click()
  await expect(page.getByLabel('练习进度')).toHaveText('第 1 / 3 题 · 顺序练习')
}
function databasePath(directory: string) {
  if (
    dirname(resolve(directory)) !== resolve(tmpdir()) ||
    !basename(directory).startsWith('embedded-practice-')
  )
    throw new Error('拒绝访问非测试数据目录。')
  return join(directory, 'practice.sqlite3')
}
function stored(directory: string) {
  const database = new DatabaseSync(databasePath(directory), { readOnly: true })
  try {
    return {
      sessions: database
        .prepare('SELECT id, status, position, revision FROM practice_sessions ORDER BY rowid')
        .all() as unknown as { id: string; status: string; position: number; revision: number }[],
      items: database
        .prepare(
          `SELECT session_id AS sessionId, position, draft, draft_revision AS draftRevision,
        revealed_at AS revealedAt, rating, skipped_at AS skippedAt FROM practice_items ORDER BY rowid`,
        )
        .all() as unknown as {
        sessionId: string
        position: number
        draft: string
        draftRevision: number
        revealedAt: string | null
        rating: string | null
        skippedAt: string | null
      }[],
      receipts: database.prepare('SELECT request_id FROM practice_receipts ORDER BY rowid').all(),
      foreignKeys: database.prepare('PRAGMA foreign_key_check').all(),
    }
  } finally {
    database.close()
  }
}
function change(directory: string, sql: string) {
  const database = new DatabaseSync(databasePath(directory))
  try {
    database.exec(sql)
  } finally {
    database.close()
  }
}
async function stop(application: ElectronApplication) {
  // 失败场景也能清理测试进程；此清理不作为正常关闭验证证据。
  if (closedApplications.has(application)) return
  await application.evaluate(({ app }) => app.exit(0)).catch(() => {})
  await application.close().catch(() => {})
  closedApplications.add(application)
}
async function closeWindow(application: ElectronApplication) {
  const closed = application.waitForEvent('close')
  await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.close())
  await closed
  closedApplications.add(application)
}

test('窗口输入/纯思考、答案隐藏、自评修改/跳过/末题与新轮默认', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name)
  try {
    await openPage(page, '题库')
    await page.getByRole('button', { name: /window-1/ }).click()
    await page.getByRole('button', { name: '展开参考答案' }).click()
    await expect(page.getByText(secret, { exact: true })).toBeVisible()
    await openPage(page, '开始练习')
    await begin(page)
    expect(await page.content()).not.toContain(secret)
    expect(await page.locator('body').ariaSnapshot()).not.toContain(secret)
    expect(await page.getByRole('button', { name: '导入题库', exact: true }).count()).toBe(0)
    expect(await page.getByRole('button', { name: '掌握', exact: true }).count()).toBe(0)
    const input = page.getByRole('textbox', { name: '我的答案', exact: true })
    await input.fill('中文输入\nint answer = 1;')
    await expect(page.locator('.practice-save')).toHaveText('已保存')
    expect(stored(testDataDirectory).items[0]?.draft).toBe('中文输入\nint answer = 1;')
    await page.getByRole('button', { name: '查看参考答案', exact: true }).dblclick({ delay: 100 })
    await expect(page.getByRole('region', { name: '练习参考答案', exact: true })).toContainText(
      secret,
    )
    const firstTime = stored(testDataDirectory).items[0]?.revealedAt
    await page.getByRole('button', { name: '掌握', exact: true }).dblclick({ delay: 100 })
    await expect(page.getByLabel('练习进度')).toHaveText('第 2 / 3 题 · 顺序练习')
    expect(await page.content()).not.toContain(secret)
    await expect(input).toHaveValue('')
    await page.getByRole('button', { name: '跳过本题' }).click()
    await expect(page.getByLabel('练习进度')).toContainText('第 3 / 3')
    await page.getByRole('button', { name: '上一题', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toContainText('第 2 / 3')
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await expect(page.getByRole('region', { name: '练习参考答案' })).toContainText('M2-ANSWER-2')
    await page.getByRole('button', { name: '暂不评价，下一题' }).click()
    await page.getByRole('button', { name: '上一题', exact: true }).click()
    await expect(page.getByRole('region', { name: '练习参考答案' })).toContainText('M2-ANSWER-2')
    await page.getByRole('button', { name: '上一题', exact: true }).click()
    await expect(input).toHaveValue('中文输入\nint answer = 1;')
    await expect(page.getByRole('region', { name: '练习参考答案' })).toContainText(secret)
    await page.getByRole('button', { name: '不会', exact: true }).click()
    await page.getByRole('button', { name: '暂不评价，下一题' }).click()
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await page.getByRole('button', { name: '暂不评价，下一题' }).click()
    await expect(page.getByRole('heading', { name: '本轮已完成' })).toBeVisible()
    const completed = stored(testDataDirectory)
    expect(completed.sessions).toMatchObject([{ status: 'finished', position: 3 }])
    expect(completed.items).toHaveLength(3)
    expect(completed.items.map((item) => item.rating)).toEqual(['不会', null, null])
    expect(completed.items[0]?.revealedAt).toBe(firstTime)
    expect(completed.foreignKeys).toEqual([])
    await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
    await begin(page)
    await expect(input).toHaveValue('')
    expect(await page.content()).not.toContain(secret)
    const fresh = stored(testDataDirectory)
    expect(fresh.sessions).toHaveLength(2)
    expect(
      fresh.items
        .slice(3)
        .every((item) => item.draft === '' && item.revealedAt === null && item.rating === null),
    ).toBe(true)
    await info.attach('practice-window-roundtrip.json', {
      body: JSON.stringify({ completed, fresh }),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})

test('写入失败保留输入/阻止切题，自评推进失败按原操作重试', async ({ testDataDirectory }, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name)
  try {
    await begin(page)
    change(
      testDataDirectory,
      `CREATE TRIGGER fail_window_draft BEFORE UPDATE OF draft ON practice_items BEGIN SELECT RAISE(ABORT, '主动注入窗口草稿失败'); END`,
    )
    const input = page.getByRole('textbox', { name: '我的答案', exact: true })
    await input.fill('保存失败仍必须保留')
    await expect(page.locator('.practice-save')).toHaveText('保存失败')
    await page.getByRole('button', { name: '跳过本题' }).click()
    await expect(page.getByLabel('练习进度')).toContainText('第 1 / 3')
    await expect(input).toHaveValue('保存失败仍必须保留')
    expect(stored(testDataDirectory).items[0]?.draft).toBe('')
    change(testDataDirectory, 'DROP TRIGGER fail_window_draft')
    await page.getByRole('button', { name: '重试保存' }).click()
    await expect(page.locator('.practice-save')).toHaveText('已保存')
    await input.fill('揭晓前立即保存的最新输入')
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await expect(page.getByRole('region', { name: '练习参考答案' })).toBeVisible()
    expect(stored(testDataDirectory).items[0]?.draft).toBe('揭晓前立即保存的最新输入')
    change(
      testDataDirectory,
      `CREATE TRIGGER fail_window_rate BEFORE UPDATE ON practice_sessions WHEN NEW.position <> OLD.position BEGIN SELECT RAISE(ABORT, '主动注入窗口推进失败'); END`,
    )
    const before = stored(testDataDirectory)
    await page.getByRole('button', { name: '掌握', exact: true }).click()
    await expect(page.getByRole('button', { name: '重试原操作' })).toBeVisible()
    await expect(page.getByLabel('练习进度')).toContainText('第 1 / 3')
    expect(stored(testDataDirectory)).toEqual(before)
    change(testDataDirectory, 'DROP TRIGGER fail_window_rate')
    await page.getByRole('button', { name: '重试原操作' }).click()
    await expect(page.getByLabel('练习进度')).toContainText('第 2 / 3')
    const after = stored(testDataDirectory)
    expect(after.items.filter((item) => item.rating !== null)).toHaveLength(1)
    await info.attach('practice-window-failures.json', {
      body: JSON.stringify({ before, after }),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})

test('返回首页和正常关窗立即保存，独立进程继续原题与草稿', async ({ testDataDirectory }, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name)
  try {
    await begin(page)
    const input = page.getByRole('textbox', { name: '我的答案', exact: true })
    await input.fill('返回首页前的输入')
    await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
    await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
    expect(stored(testDataDirectory).items[0]?.draft).toBe('返回首页前的输入')
    await page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(input).toHaveValue('返回首页前的输入')
    await input.fill('正常关窗前尚未等到定时保存的输入')
    await closeWindow(application)
    expect(stored(testDataDirectory).items[0]?.draft).toBe('正常关窗前尚未等到定时保存的输入')
  } finally {
    await stop(application)
  }
  const reopened = await launchApplication(testDataDirectory, info.project.name)
  try {
    await reopened.page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(reopened.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      '正常关窗前尚未等到定时保存的输入',
    )
    expect(await reopened.page.content()).not.toContain(secret)
    await info.attach('practice-window-reopened.json', {
      body: JSON.stringify(stored(testDataDirectory)),
      contentType: 'application/json',
    })
  } finally {
    await stop(reopened.application)
  }
})

test('关闭保存失败返回窗口保留输入，修复后可正常关闭', async ({ testDataDirectory }, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name)
  try {
    await application.evaluate(({ dialog }) => {
      Reflect.set(globalThis, 'practiceCloseChoices', 0)
      dialog.showMessageBox = async () => {
        Reflect.set(
          globalThis,
          'practiceCloseChoices',
          Number(Reflect.get(globalThis, 'practiceCloseChoices')) + 1,
        )
        return { response: 0, checkboxChecked: false }
      }
    })
    await begin(page)
    change(
      testDataDirectory,
      `CREATE TRIGGER fail_close_draft BEFORE UPDATE OF draft ON practice_items BEGIN SELECT RAISE(ABORT, '主动注入关闭保存失败'); END`,
    )
    const input = page.getByRole('textbox', { name: '我的答案', exact: true })
    await input.fill('关闭失败仍留在页面')
    await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.close())
    await expect
      .poll(() => application.evaluate(() => Reflect.get(globalThis, 'practiceCloseChoices')))
      .toBe(1)
    await expect(input).toHaveValue('关闭失败仍留在页面')
    expect(application.process().exitCode).toBeNull()
    expect(stored(testDataDirectory).items[0]?.draft).toBe('')
    change(testDataDirectory, 'DROP TRIGGER fail_close_draft')
    await page.getByRole('button', { name: '重试保存' }).click()
    await expect(page.locator('.practice-save')).toHaveText('已保存')
    await closeWindow(application)
    expect(stored(testDataDirectory).items[0]?.draft).toBe('关闭失败仍留在页面')
  } finally {
    await stop(application)
  }
})

test('只有明确选择放弃时允许未保存退出', async ({ testDataDirectory }, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name)
  try {
    await application.evaluate(({ dialog }) => {
      dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false })
    })
    await begin(page)
    const input = page.getByRole('textbox', { name: '我的答案', exact: true })
    await input.fill('已确认保存')
    await expect(page.locator('.practice-save')).toHaveText('已保存')
    change(
      testDataDirectory,
      `CREATE TRIGGER fail_discard_draft BEFORE UPDATE OF draft ON practice_items BEGIN SELECT RAISE(ABORT, '主动注入明确放弃场景'); END`,
    )
    await input.fill('用户明确放弃的未保存内容')
    await closeWindow(application)
    expect(stored(testDataDirectory).items[0]?.draft).toBe('已确认保存')
  } finally {
    await stop(application)
  }
})

test('窗口提交后响应丢失，重试原请求不再次推进', async ({ testDataDirectory }, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name)
  try {
    await begin(page)
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await expect(page.getByRole('region', { name: '练习参考答案' })).toBeVisible()
    await application.evaluate(async ({ app, ipcMain }) => {
      const path = process.getBuiltinModule('node:path'),
        fs = process.getBuiltinModule('node:fs')
      const load = process
        .getBuiltinModule('node:module')
        .createRequire(path.join(app.getAppPath(), 'window-fault.cjs'))
      const entry = [
        path.join(app.getAppPath(), 'out/main/practice.js'),
        path.join(app.getAppPath(), 'practice.js'),
      ].find((file) => fs.existsSync(file))
      if (!entry) throw new Error('缺少实际练习构建')
      const built = load(entry) as typeof import('../../src/main/services/practice/practice')
      const service: PracticeService = await built.openPracticeService(
        path.join(app.getPath('userData'), 'practice.sqlite3'),
        () => {},
      )
      app.once('will-quit', () => service.close())
      let lost = true
      ipcMain.removeHandler('practice:rate-and-advance')
      ipcMain.handle('practice:rate-and-advance', (_event, input: unknown) => {
        const result = service.rateAndAdvance(input)
        if (lost) {
          lost = false
          throw new Error('主动注入提交后响应丢失')
        }
        return result
      })
    })
    await page.getByRole('button', { name: '掌握', exact: true }).click()
    await expect(page.getByRole('button', { name: '重试原操作' })).toBeVisible()
    expect(stored(testDataDirectory).sessions[0]?.position).toBe(1)
    await page.getByRole('button', { name: '重试原操作' }).click()
    await expect(page.getByLabel('练习进度')).toContainText('第 2 / 3')
    const result = stored(testDataDirectory)
    expect(result.sessions[0]?.position).toBe(1)
    expect(result.items.filter((item) => item.rating !== null)).toHaveLength(1)
    await info.attach('practice-window-retry.json', {
      body: JSON.stringify(result),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})

test('真实代码 token/复制调用、图片模态缩放与长答案操作区', async ({ testDataDirectory }, info) => {
  const { application, page, code } = await prepare(testDataDirectory, info.project.name, {
    longAnswer: true,
  })
  try {
    await begin(page)
    const firstCode = page.locator('.practice-reading .code-block').first()
    await expect(firstCode.locator('.hljs-type, .hljs-keyword').first()).toBeVisible()
    await expect(firstCode.locator('code')).toHaveText(code)
    await expect(page.locator('code.language-cpp .hljs-keyword').first()).toHaveText('class')
    await expect(page.locator('code.language-arm .hljs-keyword').first()).toHaveText('MOV')
    await expect(page.locator('code.language-unknown-language')).toHaveText('保持原样 <tag>\n')
    await expect(page.locator('code.language-unknown-language span')).toHaveCount(0)
    expect(await page.evaluate(() => Reflect.get(globalThis, 'practiceEvil'))).toBeUndefined()
    await application.evaluate(({ clipboard }) => {
      clipboard.writeText = (text) => {
        Reflect.set(globalThis, 'copiedPracticeCode', text)
      }
    })
    await firstCode.getByRole('button', { name: '复制代码', exact: true }).click()
    await expect(firstCode.getByText('已复制', { exact: true })).toBeVisible()
    expect(await application.evaluate(() => Reflect.get(globalThis, 'copiedPracticeCode'))).toBe(
      code,
    )
    const image = page.getByRole('button', { name: '放大查看：PNG', exact: true })
    await image.click()
    const dialog = page.getByRole('dialog', { name: '图片预览：PNG', exact: true })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: '放大图片', exact: true }).click()
    await expect(dialog.getByText('150%', { exact: true })).toBeVisible()
    await expect(dialog.locator('img')).toHaveAttribute('width', '3')
    await page.screenshot({ path: info.outputPath('practice-image-zoom.png') })
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(image).toBeFocused()
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await expect(page.getByRole('region', { name: '练习参考答案' })).toContainText('第 60 段长答案')
    const button = page.getByRole('button', { name: '掌握', exact: true })
    await expect(page.locator('.practice-actions')).toHaveCSS('position', 'fixed')
    await button.scrollIntoViewIfNeeded()
    await expect(button).toBeInViewport()
    await page.screenshot({ path: info.outputPath('practice-light.png') })
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.screenshot({ path: info.outputPath('practice-dark.png') })
  } finally {
    await stop(application)
  }
})

for (const interval of [50, 100, 250]) {
  test(`快速重复：${interval}ms 双击跳过和上一题只移动一题`, async ({
    testDataDirectory,
  }, info) => {
    const { application, page } = await prepare(testDataDirectory, info.project.name)
    try {
      await begin(page)
      const before = stored(testDataDirectory)
      const skip = page.getByRole('button', { name: '跳过本题', exact: true })
      await skip.dblclick({ delay: interval })
      await expect(page.getByLabel('练习进度')).toHaveText('第 2 / 3 题 · 顺序练习')
      const afterSkip = stored(testDataDirectory)
      await info.attach('repeat-skip.json', {
        body: JSON.stringify({ interval, before, afterSkip }),
        contentType: 'application/json',
      })
      expect(afterSkip.sessions[0]?.position).toBe(1)
      expect(afterSkip.sessions[0]?.revision).toBe((before.sessions[0]?.revision ?? -1) + 1)
      expect(afterSkip.items).toHaveLength(3)
      expect(afterSkip.items.filter((item) => item.skippedAt !== null)).toHaveLength(1)
      expect(afterSkip.receipts).toHaveLength(before.receipts.length + 1)
      // 等待按钮恢复后，用户可以明确进行下一次单步操作。
      await expect(skip).toBeEnabled()
      await skip.click()
      await expect(page.getByLabel('练习进度')).toHaveText('第 3 / 3 题 · 顺序练习')
      const previous = page.getByRole('button', { name: '上一题', exact: true })
      await expect(previous).toBeEnabled()
      const beforePrevious = stored(testDataDirectory)
      await previous.dblclick({ delay: interval })
      await expect(page.getByLabel('练习进度')).toHaveText('第 2 / 3 题 · 顺序练习')
      const afterPrevious = stored(testDataDirectory)
      expect(afterPrevious.sessions[0]?.position).toBe(1)
      expect(afterPrevious.sessions[0]?.revision).toBe(
        (beforePrevious.sessions[0]?.revision ?? -1) + 1,
      )
      expect(afterPrevious.items).toEqual(beforePrevious.items)
      expect(afterPrevious.receipts).toHaveLength(beforePrevious.receipts.length + 1)
      expect(afterPrevious.foreignKeys).toEqual([])
      await info.attach('repeat-previous.json', {
        body: JSON.stringify({ interval, beforePrevious, afterPrevious }),
        contentType: 'application/json',
      })
    } finally {
      await stop(application)
    }
  })
}

for (const key of ['Enter', 'Space']) {
  test(`快速重复：100ms 两次 ${key} 激活跳过只移动一题`, async ({ testDataDirectory }, info) => {
    const { application, page } = await prepare(testDataDirectory, info.project.name)
    try {
      await begin(page)
      const before = stored(testDataDirectory)
      const skip = page.getByRole('button', { name: '跳过本题', exact: true })
      await skip.focus()
      await page.keyboard.press(key)
      // 真实按键间隔用于复现前次请求已完成后再次激活的窗口。
      await page.waitForTimeout(100)
      await page.keyboard.press(key)
      await expect(page.getByLabel('练习进度')).toHaveText('第 2 / 3 题 · 顺序练习')
      const result = stored(testDataDirectory)
      expect(result.sessions[0]?.position).toBe(1)
      expect(result.items.filter((item) => item.skippedAt !== null)).toHaveLength(1)
      expect(result.receipts).toHaveLength(before.receipts.length + 1)
      await expect(skip).toBeEnabled()
      await skip.focus()
      await page.keyboard.press(key)
      await expect(page.getByLabel('练习进度')).toHaveText('第 3 / 3 题 · 顺序练习')
      await info.attach('repeat-keyboard.json', {
        body: JSON.stringify({ key, before, result, deliberateNext: stored(testDataDirectory) }),
        contentType: 'application/json',
      })
    } finally {
      await stop(application)
    }
  })
}

test('快速重复：持续按住 Enter 不会在操作恢复后再次跳过', async ({ testDataDirectory }, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name)
  try {
    await begin(page)
    const before = stored(testDataDirectory)
    const skip = page.getByRole('button', { name: '跳过本题', exact: true })
    await skip.focus()
    await page.keyboard.down('Enter')
    await expect(page.getByLabel('练习进度')).toHaveText('第 2 / 3 题 · 顺序练习')
    await expect(skip).toBeEnabled()
    await skip.focus()
    // 第二次 down 沿用同一次按住状态，浏览器会标记为 repeat。
    await page.keyboard.down('Enter')
    await page.keyboard.up('Enter')
    await expect(page.getByLabel('练习进度')).toHaveText('第 2 / 3 题 · 顺序练习')
    const result = stored(testDataDirectory)
    expect(result.sessions[0]?.position).toBe(1)
    expect(result.receipts).toHaveLength(before.receipts.length + 1)
    await info.attach('repeat-held-key.json', {
      body: JSON.stringify({ before, result }),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})

test('图片自动保存：放大窗口与缩放状态在草稿保存后保留', async ({ testDataDirectory }, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name)
  try {
    await begin(page)
    const input = page.getByRole('textbox', { name: '我的答案', exact: true })
    const image = page.getByRole('button', { name: '放大查看：PNG', exact: true })
    await input.fill('图片打开期间自动保存的草稿')
    await image.click()
    const dialog = page.getByRole('dialog', { name: '图片预览：PNG', exact: true })
    await expect(dialog).toBeVisible()
    await expect(page.locator('.practice-save')).toHaveText('待保存')
    await dialog.getByRole('button', { name: '放大图片', exact: true }).click()
    await expect(dialog.getByText('150%', { exact: true })).toBeVisible()
    await expect(page.locator('.practice-save')).toHaveText('已保存')
    expect(stored(testDataDirectory).items[0]?.draft).toBe('图片打开期间自动保存的草稿')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('150%', { exact: true })).toBeVisible()
    await expect(dialog.locator('img')).toHaveAttribute('width', '3')
    await page.screenshot({ path: info.outputPath('image-after-autosave.png') })
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(image).toBeFocused()
    await image.click()
    await expect(dialog.getByText('100%', { exact: true })).toBeVisible()
    await dialog.getByRole('button', { name: '关闭图片', exact: true }).click()
    await expect(dialog).toHaveCount(0)
    await info.attach('image-autosave.json', {
      body: JSON.stringify(stored(testDataDirectory)),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})

for (const zoomFactor of [1, 1.25, 1.5]) {
  test(`M2 第三批：${zoomFactor * 100}% 页面缩放下长内容切题回到题首`, async ({
    testDataDirectory,
  }, info) => {
    const { application, page } = await prepare(testDataDirectory, info.project.name, {
      longAnswer: true,
      longQuestions: true,
    })
    try {
      await application.evaluate(({ BrowserWindow }, factor) => {
        BrowserWindow.getAllWindows()[0]?.webContents.setZoomFactor(factor)
      }, zoomFactor)
      await begin(page)
      const input = page.getByRole('textbox', { name: '我的答案', exact: true })
      await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
      await input.fill('长答案阅读时自动保存，不抢焦点和阅读位置')
      await page
        .getByText('第 60 段长答案，用来核对操作按钮在长内容下仍可见。', { exact: true })
        .scrollIntoViewIfNeeded()
      const beforeSaveScroll = await page.evaluate(() => Number(Reflect.get(globalThis, 'scrollY')))
      expect(beforeSaveScroll).toBeGreaterThan(1000)
      await expect(page.locator('.practice-save')).toHaveText('已保存')
      expect(await page.evaluate(() => Number(Reflect.get(globalThis, 'scrollY')))).toBe(
        beforeSaveScroll,
      )
      await expect(input).toBeFocused()
      await page.getByRole('button', { name: '掌握', exact: true }).click()
      await expect(page.getByLabel('练习进度')).toHaveText('第 2 / 3 题 · 顺序练习')
      const secondTitle = page.getByRole('heading', { name: '窗口练习 2', exact: true })
      const afterAdvance = {
        zoomFactor,
        scrollY: await page.evaluate(() => Number(Reflect.get(globalThis, 'scrollY'))),
        titleBox: await secondTitle.boundingBox(),
        stored: stored(testDataDirectory),
      }
      await info.attach('long-content-advance.json', {
        body: JSON.stringify(afterAdvance),
        contentType: 'application/json',
      })
      await expect(secondTitle).toBeInViewport({ ratio: 1 })
      await expect(secondTitle).toBeFocused()
      await expect(page.getByLabel('练习进度')).toBeInViewport({ ratio: 1 })
      await expect(page.locator('.practice-actions')).toHaveCSS('position', 'fixed')
      await page.getByRole('button', { name: '跳过本题', exact: true }).scrollIntoViewIfNeeded()
      await expect(page.getByRole('button', { name: '跳过本题', exact: true })).toBeInViewport()
      // 页面缩放时浏览器截图可能按 CSS 尺寸裁切；从 Electron 捕获完整可视区域。
      const screenshot = await application.evaluate(async ({ BrowserWindow }) => {
        const window = BrowserWindow.getAllWindows()[0]
        if (!window) throw new Error('测试窗口已经关闭。')
        return (await window.webContents.capturePage()).toPNG().toString('base64')
      })
      await writeFile(info.outputPath('long-content-next.png'), Buffer.from(screenshot, 'base64'))
      await page
        .getByText('第 2 题第 60 段长题干，核对切题时阅读入口与操作位置。', { exact: true })
        .scrollIntoViewIfNeeded()
      await page.getByRole('button', { name: '上一题', exact: true }).click()
      const firstTitle = page.getByRole('heading', { name: '窗口练习 1', exact: true })
      await expect(firstTitle).toBeInViewport({ ratio: 1 })
      await expect(firstTitle).toBeFocused()
      await expect(input).toHaveValue('长答案阅读时自动保存，不抢焦点和阅读位置')
      await expect(page.getByRole('region', { name: '练习参考答案' })).toContainText(secret)
      await page
        .getByText('第 60 段长答案，用来核对操作按钮在长内容下仍可见。', { exact: true })
        .scrollIntoViewIfNeeded()
      await page.getByRole('button', { name: '结束本轮', exact: true }).click()
      const resultTitle = page.getByRole('heading', { name: '本轮已结束', exact: true })
      await expect(resultTitle).toBeInViewport({ ratio: 1 })
      await expect(resultTitle).toBeFocused()
      expect(stored(testDataDirectory).sessions[0]?.status).toBe('ended')
    } finally {
      await stop(application)
    }
  })
}

test('M2 第三批：长题干末题完成后展示并聚焦结果标题', async ({ testDataDirectory }, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name, {
    longQuestions: true,
  })
  try {
    await begin(page)
    const skip = page.getByRole('button', { name: '跳过本题', exact: true })
    await skip.click()
    await expect(page.getByLabel('练习进度')).toContainText('第 2 / 3')
    await skip.click()
    await expect(page.getByLabel('练习进度')).toContainText('第 3 / 3')
    await page
      .getByText('第 3 题第 60 段长题干，核对切题时阅读入口与操作位置。', { exact: true })
      .scrollIntoViewIfNeeded()
    await skip.click()
    const title = page.getByRole('heading', { name: '本轮已完成', exact: true })
    await expect(title).toBeInViewport({ ratio: 1 })
    await expect(title).toBeFocused()
    const result = stored(testDataDirectory)
    expect(result.sessions[0]).toMatchObject({ status: 'finished', position: 3 })
    expect(result.items.filter((item) => item.skippedAt !== null)).toHaveLength(3)
    await info.attach('long-content-finished.json', {
      body: JSON.stringify(result),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})

test('M2 第三批：强制终止后恢复已确认草稿、原位置与自评', async ({ testDataDirectory }, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name)
  let confirmed: ReturnType<typeof stored>
  try {
    await begin(page)
    const input = page.getByRole('textbox', { name: '我的答案', exact: true })
    await input.fill('第一题已经确认保存\nint answer = 1;')
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await page.getByRole('button', { name: '不熟', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toHaveText('第 2 / 3 题 · 顺序练习')
    await input.fill('第二题已经确认保存的草稿')
    await expect(page.locator('.practice-save')).toHaveText('已保存')
    confirmed = stored(testDataDirectory)
    expect(confirmed.sessions[0]?.position).toBe(1)
    expect(confirmed.items[0]?.rating).toBe('不熟')
    expect(confirmed.items[1]?.draft).toBe('第二题已经确认保存的草稿')
    await input.fill('第二题已经确认保存的草稿 + 尚未提交尾部')
    await expect(page.locator('.practice-save')).toHaveText('待保存')
    expect(stored(testDataDirectory)).toEqual(confirmed)
    // Windows 下 process() 可能是启动外壳；校验数据目录后只终止实际 Electron 主进程。
    const target = await application.evaluate(({ app }) => ({
      pid: process.pid,
      directory: app.getPath('userData'),
    }))
    if (resolve(target.directory) !== resolve(testDataDirectory))
      throw new Error('拒绝终止不属于本场景数据目录的进程。')
    const closed = application.waitForEvent('close')
    if (!process.kill(target.pid, 'SIGKILL')) throw new Error('未能终止本场景的测试进程。')
    await closed
    closedApplications.add(application)
    expect(stored(testDataDirectory)).toEqual(confirmed)
    await info.attach('forced-stop-confirmed.json', {
      body: JSON.stringify({
        pid: target.pid,
        confirmed,
        afterStop: stored(testDataDirectory),
      }),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
  const reopened = await launchApplication(testDataDirectory, info.project.name)
  try {
    await reopened.page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(reopened.page.getByLabel('练习进度')).toHaveText('第 2 / 3 题 · 顺序练习')
    await expect(reopened.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      '第二题已经确认保存的草稿',
    )
    expect(await reopened.page.content()).not.toContain('M2-ANSWER-2')
    const recovered = stored(testDataDirectory)
    expect(recovered).toEqual(confirmed)
    const database = new DatabaseSync(databasePath(testDataDirectory), { readOnly: true })
    try {
      expect(database.prepare('PRAGMA quick_check').all()).toEqual([{ quick_check: 'ok' }])
    } finally {
      database.close()
    }
    await reopened.page.getByRole('button', { name: '上一题', exact: true }).click()
    await expect(reopened.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      '第一题已经确认保存\nint answer = 1;',
    )
    await expect(reopened.page.getByRole('region', { name: '练习参考答案' })).toContainText(secret)
    expect(recovered.foreignKeys).toEqual([])
    await info.attach('forced-stop-recovered.json', {
      body: JSON.stringify(recovered),
      contentType: 'application/json',
    })
  } finally {
    await stop(reopened.application)
  }
})

for (const zoomFactor of [1, 1.25, 1.5]) {
  test(`M2 第四批：${zoomFactor * 100}% 页面缩放下键盘输入不被操作区遮挡`, async ({
    testDataDirectory,
  }, info) => {
    const { application, page } = await prepare(testDataDirectory, info.project.name)
    try {
      await application.evaluate(({ BrowserWindow }, factor) => {
        BrowserWindow.getAllWindows()[0]?.webContents.setZoomFactor(factor)
      }, zoomFactor)
      await begin(page)
      const desktopGeometry = () =>
        application.evaluate(({ BrowserWindow, screen }) => {
          const window = BrowserWindow.getAllWindows()[0]
          if (!window) throw new Error('测试窗口已经关闭。')
          return {
            zoomFactor: window.webContents.getZoomFactor(),
            visible: window.isVisible(),
            bounds: window.getBounds(),
            contentBounds: window.getContentBounds(),
            displayScale: screen.getDisplayMatching(window.getBounds()).scaleFactor,
          }
        })
      await expect.poll(desktopGeometry).toMatchObject({ zoomFactor, visible: true })
      await page.evaluate(async () => {
        const document = Reflect.get(globalThis, 'document')
        await document.fonts.ready
        const frame = Reflect.get(globalThis, 'requestAnimationFrame')
        await new Promise<void>((resolve) => frame(() => frame(() => resolve())))
        const trace: unknown[] = []
        Reflect.set(globalThis, 'keyboardViewportTrace', trace)
        for (const type of ['resize', 'scroll'])
          Reflect.get(globalThis, 'addEventListener')(type, () => {
            if (trace.length < 64)
              trace.push({
                type,
                time: Date.now(),
                scrollY: Reflect.get(globalThis, 'scrollY'),
                width: Reflect.get(globalThis, 'innerWidth'),
                height: Reflect.get(globalThis, 'innerHeight'),
                dpr: Reflect.get(globalThis, 'devicePixelRatio'),
              })
          })
      })
      const summary = page.locator('.practice-input summary')
      const input = page.getByRole('textbox', { name: '我的答案', exact: true })
      await summary.focus()
      const editorBox = await input.boundingBox()
      const panelBox = await page.locator('.practice-actions').boundingBox()
      if (!editorBox || !panelBox) throw new Error('测试输入框或操作区不存在。')
      // 复现原生窗口中的阅读位置：折叠标题可见，输入框顶部落在悬浮操作区内。
      await page.evaluate(
        (offset) => Reflect.get(globalThis, 'scrollBy')(0, offset),
        editorBox.y - panelBox.y,
      )
      await expect(summary).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(input).toBeFocused()
      const painted = () =>
        input.evaluate(async () => {
          const frame = Reflect.get(globalThis, 'requestAnimationFrame')
          await new Promise<void>((resolve) => frame(() => frame(() => resolve())))
        })
      // 聚焦滚动可能已更新 DOM，但尚未进入截图表面；先完成绘制再取基准。
      await painted()
      const firstLine = () =>
        input.evaluate((element) => {
          const document = Reflect.get(globalThis, 'document')
          const style = Reflect.get(globalThis, 'getComputedStyle')(element)
          const box = element.getBoundingClientRect()
          const x =
            box.left +
            Number.parseFloat(style.borderLeftWidth) +
            Number.parseFloat(style.paddingLeft) +
            1
          const y =
            box.top +
            Number.parseFloat(style.borderTopWidth) +
            Number.parseFloat(style.paddingTop) +
            Number.parseFloat(style.lineHeight) / 2
          return {
            x,
            y,
            hitId: document.elementFromPoint(x, y)?.id ?? null,
            scrollY: Number(Reflect.get(globalThis, 'scrollY')),
          }
        })
      const focused = await firstLine()
      const focusedDesktop = await desktopGeometry()
      const rendererGeometry = () =>
        input.evaluate((element) => ({
          viewport: {
            width: Reflect.get(globalThis, 'innerWidth'),
            height: Reflect.get(globalThis, 'innerHeight'),
            dpr: Reflect.get(globalThis, 'devicePixelRatio'),
          },
          style: {
            border: Reflect.get(globalThis, 'getComputedStyle')(element).borderLeftWidth,
            font: Reflect.get(globalThis, 'getComputedStyle')(element).font,
          },
          trace: Reflect.get(globalThis, 'keyboardViewportTrace'),
        }))
      const focusedRenderer = await rendererGeometry()
      await info.attach('keyboard-input-focus.json', {
        body: JSON.stringify({
          zoomFactor,
          focused,
          focusedDesktop,
          focusedRenderer,
          editorBox,
          panelBox,
        }),
        contentType: 'application/json',
      })
      const capture = async (name: string) => {
        await painted()
        const screenshot = await application.evaluate(async ({ BrowserWindow }) => {
          const window = BrowserWindow.getAllWindows()[0]
          if (!window) throw new Error('测试窗口已经关闭。')
          return (await window.webContents.capturePage()).toPNG().toString('base64')
        })
        await writeFile(info.outputPath(name), Buffer.from(screenshot, 'base64'))
      }
      await capture('keyboard-input-focus.png')
      expect(focused.hitId).toBe('practice-answer')
      await page.keyboard.insertText('键盘进入后的可见输入\nint visible = 1;')
      await expect(page.locator('.practice-save')).toHaveText('已保存')
      await expect(input).toBeFocused()
      const saved = await firstLine()
      const savedDesktop = await desktopGeometry()
      await info.attach('keyboard-input-saved.json', {
        body: JSON.stringify({
          zoomFactor,
          focused,
          saved,
          focusedDesktop,
          savedDesktop,
          focusedRenderer,
          savedRenderer: await rendererGeometry(),
        }),
        contentType: 'application/json',
      })
      await capture('keyboard-input-saved.png')
      // 环境改变与应用主动滚动分别报错；原来的精确坐标/命中断言保持。
      expect(savedDesktop).toEqual(focusedDesktop)
      expect(saved).toEqual(focused)
      expect(stored(testDataDirectory).items[0]?.draft).toBe(
        '键盘进入后的可见输入\nint visible = 1;',
      )
      await input.evaluate((element) => element.blur())
      await input.evaluate((element) => element.focus({ preventScroll: true }))
      expect(await firstLine()).toEqual(focused)
      await page.keyboard.press('Shift+Tab')
      await expect(summary).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(input).toBeFocused()
      // 返回 summary 的默认聚焦可正常滚动；再次进入只要求输入可见，不禁止浏览器滚动。
      expect((await firstLine()).hitId).toBe('practice-answer')
      await expect(input).toHaveValue('键盘进入后的可见输入\nint visible = 1;')
    } finally {
      await stop(application)
    }
  })
}
