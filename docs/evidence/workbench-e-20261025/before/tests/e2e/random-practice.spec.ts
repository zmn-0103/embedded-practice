import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { ElectronApplication, Page, TestInfo } from '@playwright/test'
import { exerciseRandomPractice } from '../integration/random-practice-exercise'
import { expect, launchApplication, openPage, test } from './helpers'

const secret = 'M3-RANDOM-SECRET'
const closed = new WeakSet<ElectronApplication>()
function bank(updated = false, omitted = '', topic = 'random-fixture', count = 24) {
  return (
    `---\nschema_version: 1\ntopic_id: ${topic}\ntopic_title: ${updated ? '更新' : '原始'}随机专题\n---\n\n` +
    Array.from({ length: count }, (_, i) => {
      const n = i + 1
      const id = `q-${String(n).padStart(2, '0')}`
      if (id === omitted) return ''
      return `## ${id} | ${updated ? '更新' : '原始'}随机题 ${n}\n\n标签：共同, ${n % 2 === 0 ? '偶数' : '奇数'}\n难度：${n % 2 === 0 ? '基础' : '进阶'}\n\n### 题目\n\n${updated ? '更新' : '原始'}第 ${n} 题题干\n\n### 参考答案\n\n${secret}-${updated ? 'NEW' : 'OLD'}-${n}\n\n`
    }).join('')
  )
}
async function importFiles(application: ElectronApplication, page: Page, paths: string[]) {
  await openPage(page, '题库')
  // 只替换系统文件框；解析、预览、事务和窗口均走真实程序。
  await application.evaluate(({ dialog }, files) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: files })
  }, paths)
  await page.getByRole('button', { name: '导入题库', exact: true }).click()
  await expect(page.getByRole('heading', { name: '导入预览', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '确认导入', exact: true }).click()
  await expect(page.getByText(/^导入完成：/)).toBeVisible()
  await openPage(page, '开始练习')
  await expect(
    page.getByRole('button', { name: /^(开始练习|结束本轮并开始新练习)$/ }),
  ).toBeEnabled()
}
async function prepare(directory: string, project: string) {
  const folder = join(directory, '随机 中文路径')
  await mkdir(folder)
  const file = join(folder, '随机练习.md')
  const other = join(folder, '另一专题.md')
  await writeFile(file, bank())
  await writeFile(other, bank(false, '', 'other-random', 3))
  const launched = await launchApplication(directory, project)
  try {
    await importFiles(launched.application, launched.page, [file, other])
    return { ...launched, file }
  } catch (error) {
    await stop(launched.application)
    throw error
  }
}
async function stop(application: ElectronApplication) {
  if (closed.has(application)) return
  await application.evaluate(({ app }) => app.exit(0)).catch(() => {})
  await application.close().catch(() => {})
  closed.add(application)
}
async function closeWindow(application: ElectronApplication) {
  const finished = application.waitForEvent('close')
  await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.close())
  await finished
  closed.add(application)
}
function snapshot(directory: string) {
  if (
    dirname(resolve(directory)) !== resolve(tmpdir()) ||
    !basename(directory).startsWith('embedded-practice-')
  )
    throw new Error('拒绝访问非测试数据库。')
  const database = new DatabaseSync(join(directory, 'practice.sqlite3'), { readOnly: true })
  try {
    return {
      sessions: database.prepare('SELECT * FROM practice_sessions ORDER BY rowid').all(),
      queue: database
        .prepare(
          `SELECT i.*, q.topic_id AS topicId, q.question_id AS questionId,
        v.question_markdown AS body, v.answer_markdown AS answer FROM practice_items i
        JOIN questions q ON q.id=i.question_id JOIN question_versions v ON v.id=i.version_id
        ORDER BY i.rowid`,
        )
        .all() as unknown as {
        session_id: string
        position: number
        topicId: string
        questionId: string
        version_id: number
        title: string
        draft: string
        rating: string | null
        revealed_at: string | null
        body: string
        answer: string
      }[],
      receipts: database.prepare('SELECT * FROM practice_receipts ORDER BY rowid').all(),
      states: database.prepare('SELECT * FROM question_user_state ORDER BY rowid').all(),
      catalog: database
        .prepare(
          'SELECT question_id AS id, current_version_id AS version, archived FROM questions WHERE topic_id = ? ORDER BY position',
        )
        .all('random-fixture') as unknown as { id: string; version: number; archived: number }[],
      foreignKeys: database.prepare('PRAGMA foreign_key_check').all(),
      integrity: database.prepare('PRAGMA quick_check').all(),
    }
  } finally {
    database.close()
  }
}
function ids(rows: unknown[]) {
  return rows.map((row) => (row as { id: string }).id)
}
async function start(page: Page, count = '10') {
  await expect(page.getByRole('combobox', { name: '练习模式', exact: true })).toHaveValue(
    'sequential',
  )
  await page.getByRole('combobox', { name: '练习模式', exact: true }).selectOption('random')
  await page.getByRole('combobox', { name: '练习专题', exact: true }).selectOption('random-fixture')
  await page.getByRole('combobox', { name: '本轮题数', exact: true }).selectOption(count)
  await expect(page.getByText('匹配 24 题', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '开始练习', exact: true }).click()
  await expect(page.getByLabel('练习进度')).toHaveText(
    `第 1 / ${count === 'all' ? '24' : count} 题 · 随机练习`,
  )
}
async function hidden(page: Page) {
  expect(await page.content()).not.toContain(secret)
  expect(await page.locator('body').ariaSnapshot()).not.toContain(secret)
  expect(await page.getByRole('region', { name: '练习参考答案', exact: true }).count()).toBe(0)
}
async function capture(application: ElectronApplication, page: Page, info: TestInfo, name: string) {
  await page.evaluate(async () => {
    const browser = globalThis as unknown as {
      document: { fonts: { ready: Promise<unknown> } }
      requestAnimationFrame: (callback: () => void) => void
    }
    await browser.document.fonts.ready
    await new Promise<void>((done) =>
      browser.requestAnimationFrame(() => browser.requestAnimationFrame(() => done())),
    )
  })
  const png = await application.evaluate(async ({ BrowserWindow }) => {
    const window = BrowserWindow.getAllWindows()[0]
    if (!window) throw new Error('测试窗口不存在。')
    return (await window.webContents.capturePage()).toPNG().toString('base64')
  })
  const path = info.outputPath(name)
  await writeFile(path, Buffer.from(png, 'base64'))
  await info.attach(name, { path, contentType: 'image/png' })
}

test('随机 SQL 从全部匹配题取样，数量/交集/同键去重/幂等及失败回滚', async ({
  testDataDirectory,
}, info) => {
  const { application } = await prepare(testDataDirectory, info.project.name)
  try {
    const result = await application.evaluate(exerciseRandomPractice, testDataDirectory)
    expect(result.sequentialMode).toBe('sequential')
    expect(ids(result.sequentialQueue)).toEqual(
      Array.from({ length: 10 }, (_, i) => `q-${String(i + 1).padStart(2, '0')}`),
    )
    expect(result.callsAfterStart).toBe(24)
    expect(ids(result.randomQueue)).toEqual(Array.from({ length: 10 }, (_, i) => `q-${24 - i}`))
    expect(result.callsAfterDuplicate).toBe(result.callsAfterStart)
    expect(result.duplicate).toMatchObject({
      status: 'active',
      position: 0,
      revision: 0,
      total: 10,
    })
    expect(result.conflict.code).toBe('REQUEST_CONFLICT')
    expect(result.noMatch.code).toBe('NO_QUESTIONS')
    expect(result.protectedAfterErrors).toBe(true)
    expect(result.writeFailure.code).toBe('SQLITE_CONSTRAINT_TRIGGER')
    expect(result.rollbackPreserved).toBe(true)
    expect(new Set(ids(result.retriedQueue)).size).toBe(24)
    for (const entry of result.quantities) {
      const expected = entry.count === 20 ? 20 : 24
      expect(entry.ack.total).toBe(expected)
      expect(entry.queue).toHaveLength(expected)
      expect(new Set(ids(entry.queue)).size).toBe(expected)
    }
    expect(ids(result.filteredQueue).sort()).toEqual(['q-08', 'q-12', 'q-16', 'q-20'])
    expect(ids(result.singleQueue)).toEqual(['q-12'])
    expect(result.singleView?.session).toMatchObject({ mode: 'random', total: 1 })
    expect(result.singleView?.item).not.toHaveProperty('answer')
    expect(result.answerSearch.code).toBe('NO_QUESTIONS')
    expect(result.answerSearchPreserved).toBe(true)
    expect(new Set(ids(result.tiesQueue)).size).toBe(23)
    expect(result.tiesQueue).toHaveLength(23)
    expect(result.foreignKeys).toEqual([])
    expect(result.integrity).toEqual([{ quick_check: 'ok' }])
    await info.attach('random-controlled-sql.json', {
      body: JSON.stringify(result),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})

for (const forced of [false, true]) {
  test(`随机窗口保存/自评后${forced ? '真实强制终止' : '正常关窗'}，独立进程恢复完整原队列`, async ({
    testDataDirectory,
  }, info) => {
    const { application, page } = await prepare(testDataDirectory, info.project.name)
    let confirmed: ReturnType<typeof snapshot>
    const enteredDraft = '随机第二题已确认草稿\r\nint second = 2;'
    let displayedDraft = ''
    let assignedDraft = ''
    try {
      await start(page)
      await hidden(page)
      await page
        .getByRole('textbox', { name: '我的答案', exact: true })
        .fill('随机第一题\nint first = 1;')
      await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
      await page.getByRole('button', { name: '掌握', exact: true }).click()
      await expect(page.getByLabel('练习进度')).toHaveText('第 2 / 10 题 · 随机练习')
      await hidden(page)
      await page.getByRole('textbox', { name: '我的答案', exact: true }).fill(enteredDraft)
      await expect(page.locator('.practice-save')).toHaveText('已保存')
      displayedDraft = await page
        .getByRole('textbox', { name: '我的答案', exact: true })
        .inputValue()
      expect(displayedDraft).toBe(enteredDraft)
      // Chromium 编辑插入与 value 赋值的换行表示不同；用同环境原生控件实测赋值基准。
      assignedDraft = await page.evaluate((text) => {
        const browser = globalThis as unknown as {
          document: { createElement: (tag: 'textarea') => { value: string } }
        }
        const input = browser.document.createElement('textarea')
        input.value = text
        return input.value
      }, enteredDraft)
      expect(assignedDraft).toBe(enteredDraft.replace(/\r\n/g, '\n'))
      confirmed = snapshot(testDataDirectory)
      expect(confirmed.queue[1]!.draft).toBe(enteredDraft)
      expect(confirmed.queue).toHaveLength(10)
      expect(new Set(confirmed.queue.map((row) => `${row.topicId}/${row.questionId}`)).size).toBe(
        10,
      )
      expect(confirmed.queue.every((row) => row.topicId === 'random-fixture')).toBe(true)
      expect(confirmed.queue[0]).toMatchObject({
        draft: '随机第一题\nint first = 1;',
        rating: '掌握',
      })
      expect(confirmed.sessions).toMatchObject([{ mode: 'random', position: 1, status: 'active' }])
      await capture(application, page, info, 'random-saved.png')
      await info.attach('random-before-close.json', {
        body: JSON.stringify({ forced, enteredDraft, displayedDraft, assignedDraft, confirmed }),
        contentType: 'application/json',
      })
      if (forced) {
        const target = await application.evaluate(({ app }) => ({
          pid: process.pid,
          directory: app.getPath('userData'),
        }))
        if (resolve(target.directory) !== resolve(testDataDirectory))
          throw new Error('拒绝终止非测试进程。')
        const finished = application.waitForEvent('close')
        if (!process.kill(target.pid, 'SIGKILL')) throw new Error('未能终止测试进程。')
        await finished
        closed.add(application)
      } else await closeWindow(application)
      expect(snapshot(testDataDirectory)).toEqual(confirmed)
    } finally {
      await stop(application)
    }
    const reopened = await launchApplication(testDataDirectory, info.project.name)
    try {
      await expect(reopened.page.getByText('上轮为随机练习', { exact: false })).toBeVisible()
      await reopened.page
        .getByRole('combobox', { name: '练习模式', exact: true })
        .selectOption('sequential')
      await reopened.page.getByText('筛选练习题目', { exact: true }).click()
      await reopened.page
        .getByRole('searchbox', { name: '练习搜索', exact: true })
        .fill('没有匹配的随机题')
      await expect(reopened.page.getByText('匹配 0 题', { exact: true })).toBeVisible()
      await reopened.page.getByRole('button', { name: '继续练习', exact: true }).click()
      await expect(reopened.page.getByLabel('练习进度')).toHaveText('第 2 / 10 题 · 随机练习')
      await hidden(reopened.page)
      await expect(
        reopened.page.getByRole('textbox', { name: '我的答案', exact: true }),
      ).toHaveValue(assignedDraft)
      expect(snapshot(testDataDirectory)).toEqual(confirmed)
      await reopened.page.getByRole('button', { name: '上一题', exact: true }).click()
      await expect(
        reopened.page.getByRole('region', { name: '练习参考答案', exact: true }),
      ).toContainText(confirmed.queue[0]!.answer)
      await expect(
        reopened.page.getByRole('textbox', { name: '我的答案', exact: true }),
      ).toHaveValue(confirmed.queue[0]!.draft)
      await expect(
        reopened.page.getByText('本轮自评：掌握，再次自评会更新本轮记录。', { exact: true }),
      ).toBeVisible()
      await info.attach('random-recovery.json', {
        body: JSON.stringify({
          forced,
          enteredDraft,
          displayedDraft,
          assignedDraft,
          confirmed,
          after: snapshot(testDataDirectory),
        }),
        contentType: 'application/json',
      })
    } finally {
      await stop(reopened.application)
    }
  })
}

test('随机本轮不受更新/归档影响，新轮使用最新版本并重新隐藏作答', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepare(testDataDirectory, info.project.name)
  try {
    await start(page, 'all')
    const before = snapshot(testDataDirectory)
    const first = before.queue[0]!
    const second = before.queue[1]!
    await page.getByRole('textbox', { name: '我的答案', exact: true }).fill('旧版本随机作答')
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await page.getByRole('button', { name: '返回首页', exact: true }).click()
    const saved = snapshot(testDataDirectory)
    await writeFile(file, bank(true, second.questionId))
    await importFiles(application, page, [file])
    const updated = snapshot(testDataDirectory)
    expect(updated.queue).toEqual(saved.queue)
    expect(updated.catalog.find((row) => row.id === second.questionId)?.archived).toBe(1)
    expect(updated.catalog.find((row) => row.id === first.questionId)?.version).not.toBe(
      first.version_id,
    )
    await page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(page.getByRole('heading', { name: first.title, exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: '练习参考答案', exact: true })).toContainText(
      first.answer,
    )
    await page.getByRole('button', { name: '暂不评价，下一题', exact: true }).click()
    await expect(page.getByRole('heading', { name: second.title, exact: true })).toBeVisible()
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await expect(page.getByRole('region', { name: '练习参考答案', exact: true })).toContainText(
      second.answer,
    )
    await page.getByRole('button', { name: '结束本轮', exact: true }).click()
    await page.getByRole('button', { name: '返回首页', exact: true }).click()
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toHaveText('第 1 / 23 题 · 随机练习')
    await hidden(page)
    await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue('')
    const after = snapshot(testDataDirectory)
    const fresh = after.queue.filter((row) => row.session_id !== first.session_id)
    expect(fresh).toHaveLength(23)
    expect(new Set(fresh.map((row) => row.questionId)).size).toBe(23)
    expect(fresh.some((row) => row.questionId === second.questionId)).toBe(false)
    expect(fresh.every((row) => row.title.startsWith('更新') && row.answer.includes('-NEW-'))).toBe(
      true,
    )
    expect(fresh.every((row) => !row.revealed_at && row.draft === '' && row.rating === null)).toBe(
      true,
    )
    expect(after.foreignKeys).toEqual([])
    await info.attach('random-fixed-versions.json', {
      body: JSON.stringify({ saved, updated, after }),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})

test('随机开始成功响应丢失后锁定原选择，重试只恢复原轮而不再次抽题', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name)
  try {
    await application.evaluate(({ ipcMain }) => {
      const handlers = Reflect.get(ipcMain, '_invokeHandlers') as Map<
        string,
        (...args: unknown[]) => Promise<unknown>
      >
      const original = handlers.get('practice:start')
      if (!original) throw new Error('缺少开始接口。')
      let dropped = false
      ipcMain.removeHandler('practice:start')
      ipcMain.handle('practice:start', async (...args) => {
        const result = await original(...args)
        if (!dropped && (result as { ok: boolean }).ok) {
          dropped = true
          return {
            ok: false,
            error: { code: 'DATABASE_UNAVAILABLE', message: '本测试丢弃已提交的开始响应。' },
          }
        }
        return result
      })
    })
    await page.getByRole('combobox', { name: '练习模式', exact: true }).selectOption('random')
    await page
      .getByRole('combobox', { name: '练习专题', exact: true })
      .selectOption('random-fixture')
    await page.getByRole('combobox', { name: '本轮题数', exact: true }).selectOption('10')
    await expect(page.getByText('匹配 24 题', { exact: true })).toBeVisible()
    await page.getByRole('combobox', { name: '练习模式', exact: true }).scrollIntoViewIfNeeded()
    await expect(page.getByRole('combobox', { name: '练习模式', exact: true })).toBeInViewport()
    await capture(application, page, info, 'random-start.png')
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('本测试丢弃已提交的开始响应。')
    for (const name of ['练习模式', '练习专题', '本轮题数'])
      await expect(page.getByRole('combobox', { name, exact: true })).toBeDisabled()
    const before = snapshot(testDataDirectory)
    expect(before.sessions).toMatchObject([{ mode: 'random', status: 'active' }])
    expect(before.queue).toHaveLength(10)
    expect(before.receipts).toHaveLength(1)
    await page.getByRole('button', { name: '重试开始本轮', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toHaveText('第 1 / 10 题 · 随机练习')
    await expect(
      page.getByRole('heading', { name: before.queue[0]!.title, exact: true }),
    ).toBeVisible()
    await hidden(page)
    expect(snapshot(testDataDirectory)).toEqual(before)
    await info.attach('random-start-retry.json', {
      body: JSON.stringify(before),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})
