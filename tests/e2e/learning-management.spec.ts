import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { ElectronApplication, Page } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import type { ListRequest } from '../../src/shared/contracts/library-desktop'
import type { PracticeCursor } from '../../src/shared/contracts/practice'
import {
  EMPTY_QUESTION_FILTERS,
  type QuestionFilters,
} from '../../src/shared/contracts/question-filters'
import { expect, launchApplication, openPage, test } from './helpers'

const secret = 'M3-ANSWER-SECRET-ONLY'
const closed = new WeakSet<ElectronApplication>()
function bank(topic = 'm3-a', changed = false, omitted = false, metadata = false) {
  return (
    `---\nschema_version: 1\ntopic_id: ${topic}\ntopic_title: ${topic === 'm3-a' ? 'A 筛选专题' : 'B 交集专题'}\n---\n\n` +
    Array.from({ length: topic === 'm3-a' ? 24 : 3 }, (_, i) => {
      const n = i + 1
      if (omitted && n === 1) return ''
      return (
        `## q-${String(n).padStart(2, '0')} | ${topic === 'm3-a' && n === 1 ? 'GpioTitleMarker' : `外设问题 ${n}`}\n\n` +
        `标签：共同, ${n === 3 ? 'OnlyTagMarker, ARM Cortex' : n % 2 === 0 ? '筛选标签' : '奇数'}${metadata && n === 1 ? ', 新标签' : ''}\n` +
        (n === 24 ? '' : `难度：${n % 2 === 0 ? '基础' : '进阶'}\n`) +
        `\n### 题目\n\n${topic === 'm3-a' && n === 2 ? "BodyMarker percent%_quote' backslash\\" : `第 ${n} 题内容`}\n\n` +
        `### 参考答案\n\n${secret}-${topic}-${n}${changed && n === 1 ? ' 更新答案' : ''}\n\n`
      )
    }).join('')
  )
}
async function importFiles(application: ElectronApplication, page: Page, files: string[]) {
  await openPage(page, '题库')
  // 仅替换系统文件选择边界，解析、预览、提交均走真实程序。
  await application.evaluate(({ dialog }, paths) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: paths })
  }, files)
  await page.getByRole('button', { name: '导入题库', exact: true }).click()
  await expect(page.getByRole('heading', { name: '导入预览', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '确认导入', exact: true }).click()
  await expect(page.getByText(/^导入完成：/)).toBeVisible()
  await page.getByRole('button', { name: '关闭导入工作区', exact: true }).click()
  await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
}
async function prepare(directory: string, project: string) {
  const sources = join(directory, 'sources')
  await mkdir(sources)
  const file = join(sources, 'A.md')
  const other = join(sources, 'B.md')
  await writeFile(file, bank())
  await writeFile(other, bank('m3-b'))
  const launched = await launchApplication(directory, project, '题库')
  await importFiles(launched.application, launched.page, [file, other])
  await expect(launched.page.getByText('共 27 题', { exact: true })).toBeVisible()
  return { ...launched, file }
}
function openDatabase(directory: string, readOnly = true) {
  if (
    dirname(resolve(directory)) !== resolve(tmpdir()) ||
    !basename(directory).startsWith('embedded-practice-')
  )
    throw new Error('拒绝访问非测试目录。')
  return new DatabaseSync(join(directory, 'practice.sqlite3'), { readOnly })
}
function snapshot(directory: string) {
  const db = openDatabase(directory)
  try {
    return {
      queue: db
        .prepare(
          `SELECT i.session_id AS sessionId, i.position, q.topic_id AS topicId,
        q.question_id AS questionId, i.version_id AS versionId, i.rating, i.revealed_at AS revealedAt,
        i.skipped_at AS skippedAt FROM practice_items i JOIN questions q ON q.id=i.question_id ORDER BY i.rowid`,
        )
        .all(),
      states: db
        .prepare(
          `SELECT q.topic_id AS topicId, q.question_id AS questionId, s.favorite,
        s.last_rating AS rating, s.last_rated_version_id AS ratedVersion, q.current_version_id AS currentVersion
        FROM question_user_state s JOIN questions q ON q.id=s.question_id ORDER BY q.id`,
        )
        .all(),
      sessions: db
        .prepare('SELECT id, position, revision, status FROM practice_sessions ORDER BY rowid')
        .all(),
      receipts: db.prepare('SELECT request_id FROM practice_receipts ORDER BY rowid').all(),
      revision: db.prepare('SELECT revision FROM library_meta').get(),
      integrity: db.prepare('PRAGMA quick_check').all(),
      foreignKeys: db.prepare('PRAGMA foreign_key_check').all(),
    }
  } finally {
    db.close()
  }
}
function change(directory: string, sql: string) {
  const db = openDatabase(directory, false)
  try {
    db.exec(sql)
  } finally {
    db.close()
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
async function list(
  page: Page,
  filters: Partial<QuestionFilters> = {},
  options: Partial<ListRequest> = {},
) {
  const result = await page.evaluate(
    (request) =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.library.listQuestions(request),
    {
      topicId: null,
      archived: false,
      page: 1,
      filters: { ...EMPTY_QUESTION_FILTERS, ...filters },
      ...options,
    },
  )
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}
async function current(page: Page) {
  const result = await page.evaluate(() =>
    (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
  )
  if (!result.ok || !result.value) throw new Error('测试轮不存在。')
  return result.value
}
function cursor(value: Awaited<ReturnType<typeof current>>): PracticeCursor {
  return {
    sessionId: value.session.sessionId,
    position: value.session.position,
    revision: value.session.revision,
  }
}
async function favorite(page: Page, questionId: string, value: boolean) {
  const result = await page.evaluate(
    (setting) =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.library.setFavorite(setting),
    { topicId: 'm3-a', questionId, favorite: value },
  )
  expect(result).toMatchObject({ ok: true, value: { favorite: value } })
}
async function applyLibrary(page: Page, query: string, expected: number) {
  await page.getByRole('searchbox', { name: '题库搜索', exact: true }).fill(query)
  await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  await expect(page.getByText(`共 ${expected} 题`, { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
}

async function holdFavoriteResponse(application: ElectronApplication) {
  await application.evaluate(({ ipcMain }) => {
    const handlers = Reflect.get(ipcMain, '_invokeHandlers') as Map<
      string,
      (...args: unknown[]) => Promise<unknown>
    >
    const favoriteHandler = handlers.get('library:set-favorite')
    const readyHandler = handlers.get('practice:ready')
    if (!favoriteHandler || !readyHandler) throw new Error('测试所需 handler 不存在。')
    const control = {
      written: false,
      readyCount: 0,
      release: undefined as (() => void) | undefined,
    }
    Reflect.set(globalThis, 'favoriteResponseControl', control)
    ipcMain.removeHandler('library:set-favorite')
    ipcMain.handle('library:set-favorite', async (...args) => {
      const result = await favoriteHandler(...args)
      if (!control.written && (result as { ok: boolean }).ok) {
        control.written = true
        await new Promise<void>((resolve) => {
          control.release = resolve
        })
      }
      return result
    })
    ipcMain.removeHandler('practice:ready')
    ipcMain.handle('practice:ready', async (...args) => {
      const result = await readyHandler(...args)
      control.readyCount++
      return result
    })
  })
}
async function favoriteResponseState(application: ElectronApplication, release = false) {
  return application.evaluate((_electron, shouldRelease) => {
    const control = Reflect.get(globalThis, 'favoriteResponseControl') as {
      written: boolean
      readyCount: number
      release?: () => void
    }
    if (shouldRelease) control.release?.()
    return { written: control.written, readyCount: control.readyCount }
  }, release)
}

for (const initialFavorite of [false, true]) {
  test(`M3 修复：旧收藏响应晚于新操作，最终${initialFavorite ? '已收藏' : '未收藏'}保持一致`, async ({
    testDataDirectory,
  }, info) => {
    const { application, page } = await prepare(testDataDirectory, info.project.name)
    try {
      const first = page.getByRole('button', { name: /A 筛选专题.*q-01/ })
      await first.click()
      // 题库详情必须持续挂载；只读取仍挂载的开始页就绪状态，不在竞态中切页。
      if (initialFavorite) {
        await page.getByRole('button', { name: '收藏本题', exact: true }).click()
        await expect(page.getByRole('button', { name: '取消收藏', exact: true })).toBeEnabled()
        await expect(
          page.getByRole('button', { name: '开始练习', exact: true, includeHidden: true }),
        ).toBeEnabled()
      }
      await holdFavoriteResponse(application)
      await page
        .getByRole('button', { name: initialFavorite ? '取消收藏' : '收藏本题', exact: true })
        .click()
      await expect.poll(async () => (await favoriteResponseState(application)).written).toBe(true)
      await page.getByRole('button', { name: /A 筛选专题.*q-02/ }).click()
      await expect(page.getByRole('heading', { name: '外设问题 2', exact: true })).toBeVisible()
      await first.click()
      await page
        .getByRole('button', { name: initialFavorite ? '收藏本题' : '取消收藏', exact: true })
        .click()
      const currentButton = page.getByRole('button', {
        name: initialFavorite ? '取消收藏' : '收藏本题',
        exact: true,
      })
      await expect(currentButton).toHaveAttribute('aria-pressed', String(initialFavorite))
      await expect(
        page.getByRole('button', { name: '开始练习', exact: true, includeHidden: true }),
      ).toBeEnabled()
      await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
      await page.getByRole('button', { name: '展开参考答案', exact: true }).click()
      const before = snapshot(testDataDirectory)
      const barrier = await favoriteResponseState(application, true)
      // 首页刷新说明旧回调已被页面消费，避免在旧响应到达前就通过否定断言。
      await expect
        .poll(async () => (await favoriteResponseState(application)).readyCount)
        .toBeGreaterThan(barrier.readyCount)
      await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
      const observed = {
        initialFavorite,
        list: await first.innerText(),
        detail: await currentButton.getAttribute('aria-pressed'),
        database: snapshot(testDataDirectory),
      }
      await info.attach('favorite-out-of-order.json', {
        body: JSON.stringify(observed),
        contentType: 'application/json',
      })
      expect(observed.list.includes('已收藏')).toBe(initialFavorite)
      expect(observed.detail).toBe(String(initialFavorite))
      expect(observed.database).toEqual(before)
      await expect(page.getByRole('region', { name: '参考答案', exact: true })).toContainText(
        `${secret}-m3-a-1`,
      )
    } finally {
      await stop(application)
    }
  })
}

test('M3 修复：切到其他题后晚到收藏成功仍刷新最新列表与匹配数', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name)
  try {
    await openPage(page, '开始练习')
    await page.getByText('筛选练习题目', { exact: true }).click()
    await page.getByRole('checkbox', { name: '练习只看收藏' }).check()
    await expect(page.getByText('匹配 0 题', { exact: true })).toBeVisible()
    await openPage(page, '题库')
    await page.getByRole('button', { name: /A 筛选专题.*q-01/ }).click()
    await holdFavoriteResponse(application)
    await page.getByRole('button', { name: '收藏本题', exact: true }).click()
    await expect.poll(async () => (await favoriteResponseState(application)).written).toBe(true)
    await page.getByRole('button', { name: /A 筛选专题.*q-02/ }).click()
    await expect(page.getByRole('heading', { name: '外设问题 2', exact: true })).toBeVisible()
    const before = snapshot(testDataDirectory)
    const barrier = await favoriteResponseState(application, true)
    await expect
      .poll(async () => (await favoriteResponseState(application)).readyCount)
      .toBeGreaterThan(barrier.readyCount)
    await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
    await expect(page.getByRole('button', { name: /A 筛选专题.*q-01/ })).toContainText('已收藏')
    await expect(page.getByRole('heading', { name: '外设问题 2', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: '收藏本题', exact: true })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(snapshot(testDataDirectory)).toEqual(before)
    await openPage(page, '开始练习')
    await expect(page.getByText('匹配 1 题', { exact: true })).toBeVisible()
  } finally {
    await stop(application)
  }
})

test('M3 第一批：搜索标题/题干/标签、字面字符、交集、分页与答案边界', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name)
  try {
    await page.getByRole('button', { name: '下一页', exact: true }).click()
    await expect(page.getByRole('navigation', { name: '题目分页' })).toContainText('2 / 2')
    await expect(
      page.getByRole('complementary', { name: '题目列表' }).getByRole('button'),
    ).toHaveCount(9)
    // 该 aside 同时含两个分页按钮：7 道题加 2 个分页按钮。
    for (const [query, count] of [
      ['gpiotitlemarker', 1],
      ['bodymarker', 1],
      ['onlytagmarker', 2],
      ['%', 1],
      ["_quote'", 1],
      ['backslash\\', 1],
      ["' OR 1=1 --", 0],
      [secret, 0],
    ] as const)
      await applyLibrary(page, query, count)
    await page.getByRole('button', { name: '清空题库筛选' }).click()
    await expect(page.getByText('共 27 题', { exact: true })).toBeVisible()
    await page.getByRole('combobox', { name: '专题', exact: true }).selectOption('m3-a')
    await expect(page.getByText('共 24 题', { exact: true })).toBeVisible()
    await page.getByRole('combobox', { name: '题库标签', exact: true }).fill('筛选标签')
    await page.getByRole('combobox', { name: '题库难度' }).selectOption('基础')
    await applyLibrary(page, '', 11)
    await page.getByRole('combobox', { name: '题库难度' }).selectOption('未分级')
    await applyLibrary(page, '', 1)
    await page.getByRole('button', { name: /q-24/ }).click()
    expect(await page.content()).not.toContain(secret)
    expect(await page.locator('body').ariaSnapshot()).not.toContain(secret)
    const response = await list(page, { query: 'BodyMarker' })
    expect(response.questions).toHaveLength(1)
    expect(Object.keys(response.questions[0]!).sort()).toEqual(
      [
        'archived',
        'contentUpdated',
        'currentRating',
        'difficulty',
        'favorite',
        'practiced',
        'questionId',
        'tags',
        'title',
        'topicId',
        'topicTitle',
        'versionId',
      ].sort(),
    )
    expect(JSON.stringify(response)).not.toContain(secret)
    const clamped = await list(page, { tag: 'ARM Cortex' }, { page: 999 })
    expect(clamped).toMatchObject({ total: 2, page: 1 })
    await info.attach('search-boundaries.json', {
      body: JSON.stringify({ response, clamped }),
      contentType: 'application/json',
    })
    await page.screenshot({ path: info.outputPath('search-filter.png'), fullPage: true })
  } finally {
    await stop(application)
  }
})

test('M3 第一批：收藏快速重复、练习数量同步、正常关闭重开持久化', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name)
  let reopened: ElectronApplication | undefined
  try {
    await openPage(page, '开始练习')
    await page.getByText('筛选练习题目', { exact: true }).click()
    await page.getByRole('checkbox', { name: '练习只看收藏' }).check()
    await expect(page.getByText('匹配 0 题', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: '开始练习', exact: true })).toBeDisabled()
    await openPage(page, '题库')
    await page
      .getByRole('button', { name: /m3-a|A 筛选专题.*q-01/ })
      .first()
      .click()
    const revision = snapshot(testDataDirectory).revision
    await page.getByRole('button', { name: '收藏本题', exact: true }).dblclick({ delay: 100 })
    await expect(page.getByRole('button', { name: '取消收藏', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await openPage(page, '开始练习')
    await expect(page.getByText('匹配 1 题', { exact: true })).toBeVisible()
    await favorite(page, 'q-01', true)
    await favorite(page, 'q-01', true)
    expect(snapshot(testDataDirectory).revision).toEqual(revision)
    expect((await list(page, { favoritesOnly: true })).questions).toMatchObject([
      { questionId: 'q-01', currentRating: null, practiced: false },
    ])
    expect(await page.content()).not.toContain(secret)
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toHaveText('第 1 / 1 题 · 顺序练习')
    expect(snapshot(testDataDirectory).queue).toMatchObject([
      { questionId: 'q-01', topicId: 'm3-a' },
    ])
    await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
    await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
    await closeWindow(application)
    const next = await launchApplication(testDataDirectory, info.project.name)
    reopened = next.application
    await openPage(next.page, '题库')
    await next.page.getByRole('button', { name: /A 筛选专题.*q-01/ }).click()
    await expect(next.page.getByRole('button', { name: '取消收藏', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await openPage(next.page, '开始练习')
    await expect(next.page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
    await info.attach('favorite-reopened.json', {
      body: JSON.stringify(snapshot(testDataDirectory)),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
    if (reopened) await stop(reopened)
  }
})

test('M3 第一批：收藏写入失败与响应丢失重试、收藏页取消后收敛', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name)
  try {
    await page.getByRole('button', { name: /A 筛选专题.*q-01/ }).click()
    const before = snapshot(testDataDirectory)
    change(
      testDataDirectory,
      `CREATE TRIGGER fail_m3_favorite BEFORE UPDATE OF favorite ON question_user_state BEGIN SELECT RAISE(ABORT, '测试收藏失败'); END`,
    )
    await page.getByRole('button', { name: '收藏本题', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('收藏保存尚未确认')
    await expect(page.getByRole('button', { name: '收藏本题', exact: true })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(snapshot(testDataDirectory)).toEqual(before)
    change(testDataDirectory, 'DROP TRIGGER fail_m3_favorite')
    // 第一次真实写入后丢弃成功响应；重试必须仍设置 true，不能再次切换。
    await application.evaluate(({ ipcMain }) => {
      const handlers = Reflect.get(ipcMain, '_invokeHandlers') as Map<
        string,
        (...args: unknown[]) => Promise<unknown>
      >
      const original = handlers.get('library:set-favorite')
      if (!original) throw new Error('收藏 handler 不存在。')
      ipcMain.removeHandler('library:set-favorite')
      let lost = false
      ipcMain.handle('library:set-favorite', async (...args) => {
        const result = await original(...args)
        if (!lost) {
          lost = true
          throw new Error('测试成功响应丢失')
        }
        return result
      })
    })
    await page.getByRole('button', { name: '收藏本题', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('收藏保存尚未确认')
    expect((await list(page, { favoritesOnly: true })).total).toBe(1)
    await page.getByRole('button', { name: '收藏本题', exact: true }).click()
    await expect(page.getByRole('button', { name: '取消收藏', exact: true })).toBeEnabled()
    await page.getByRole('checkbox', { name: '题库只看收藏' }).check()
    await applyLibrary(page, '', 1)
    await page.getByRole('button', { name: /A 筛选专题.*q-01/ }).click()
    await page.getByRole('button', { name: '取消收藏', exact: true }).click()
    await expect(page.getByText('共 0 题', { exact: true })).toBeVisible()
    await expect(page.getByRole('navigation', { name: '题目分页' })).toContainText('1 / 1')
    expect((await list(page, { favoritesOnly: true })).total).toBe(0)
    expect(snapshot(testDataDirectory).revision).toEqual(before.revision)
    await info.attach('favorite-failure-retry.json', {
      body: JSON.stringify(snapshot(testDataDirectory)),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})

test('M3 第一批：筛选固定队列、真实自评/未练习区分、无匹配保留旧轮', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepare(testDataDirectory, info.project.name)
  try {
    for (const id of ['q-02', 'q-04', 'q-24']) await favorite(page, id, true)
    const filters = {
      ...EMPTY_QUESTION_FILTERS,
      tag: '筛选标签',
      difficulty: '基础' as const,
      favoritesOnly: true,
    }
    const matches = await list(page, filters, { topicId: 'm3-a' })
    expect(matches.questions.map((q) => q.questionId)).toEqual(['q-02', 'q-04'])
    await openPage(page, '开始练习')
    await page.getByRole('combobox', { name: '练习专题' }).selectOption('m3-a')
    await page.getByText('筛选练习题目', { exact: true }).click()
    await page.getByRole('combobox', { name: '练习标签' }).fill('筛选标签')
    await page.getByRole('combobox', { name: '练习难度' }).selectOption('基础')
    await page.getByRole('checkbox', { name: '练习只看收藏' }).check()
    await expect(page.getByText('匹配 2 题', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toContainText('第 1 / 2')
    const initial = snapshot(testDataDirectory)
    expect(initial.queue.map((q) => q['questionId'])).toEqual(
      matches.questions.map((q) => q.questionId),
    )
    expect((await list(page, { mastery: 'unpracticed' })).total).toBe(27)
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    expect((await list(page, { mastery: 'unpracticed' })).total).toBe(26)
    expect((await list(page, { query: 'BodyMarker' })).questions[0]).toMatchObject({
      practiced: true,
      currentRating: null,
      favorite: true,
    })
    await page.getByRole('button', { name: '掌握', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toContainText('第 2 / 2')
    expect(
      (await list(page, { mastery: '掌握', favoritesOnly: true })).questions.map(
        (q) => q.questionId,
      ),
    ).toEqual(['q-02'])
    await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
    await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
    await page.getByText('筛选练习题目', { exact: true }).click()
    await page.getByRole('searchbox', { name: '练习搜索' }).fill('没有匹配的题目')
    await expect(page.getByText('匹配 0 题', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: '结束本轮并开始新练习' })).toBeDisabled()
    const prior = snapshot(testDataDirectory)
    const old = await current(page)
    const rejected = await page.evaluate(
      (input) => (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.start(input),
      {
        requestId: randomUUID(),
        topicId: null,
        count: 'all' as const,
        replace: cursor(old),
        filters: { ...EMPTY_QUESTION_FILTERS, query: '没有匹配的题目' },
      },
    )
    expect(rejected).toMatchObject({ error: { code: 'NO_QUESTIONS' } })
    expect(snapshot(testDataDirectory)).toEqual(prior)
    await favorite(page, 'q-04', false)
    await page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toContainText('第 2 / 2')
    await page.getByRole('button', { name: '跳过本题' }).click()
    await expect(page.getByRole('heading', { name: '本轮已完成' })).toBeVisible()
    expect((await list(page, { mastery: 'unpracticed' })).total).toBe(26)
    expect(
      (await list(page, { tag: '筛选标签' }, { topicId: 'm3-a' })).questions.find(
        (q) => q.questionId === 'q-04',
      ),
    ).toMatchObject({ practiced: false, currentRating: null, favorite: false })
    expect(snapshot(testDataDirectory).queue.map((q) => q['versionId'])).toEqual(
      initial.queue.map((q) => q['versionId']),
    )
    await info.attach('filtered-queue-state.json', {
      body: JSON.stringify(snapshot(testDataDirectory)),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})

test('M3 第一批：旧版本自评排除、元数据保持、归档恢复收藏和历史', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepare(testDataDirectory, info.project.name)
  try {
    await page.getByRole('button', { name: /A 筛选专题.*q-01/ }).click()
    await page.getByRole('button', { name: '收藏本题', exact: true }).click()
    await expect(page.getByRole('button', { name: '取消收藏', exact: true })).toBeEnabled()
    await openPage(page, '开始练习')
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await page.getByRole('button', { name: '不熟', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toContainText('第 2 / 20')
    await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
    await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
    const before = snapshot(testDataDirectory)
    await writeFile(file, bank('m3-a', false, false, true))
    await importFiles(application, page, [file])
    expect((await list(page, { mastery: '不熟', favoritesOnly: true })).total).toBe(1)
    await writeFile(file, bank('m3-a', true))
    await importFiles(application, page, [file])
    expect((await list(page, { mastery: '不熟' })).total).toBe(0)
    expect(
      (await list(page, { query: 'gpiotitlemarker', mastery: 'unpracticed', favoritesOnly: true }))
        .total,
    ).toBe(1)
    expect(snapshot(testDataDirectory).queue).toEqual(before.queue)
    await writeFile(file, bank('m3-a', true, true))
    await importFiles(application, page, [file])
    expect((await list(page, { favoritesOnly: true })).total).toBe(0)
    expect((await list(page, { favoritesOnly: true }, { archived: true })).total).toBe(1)
    await writeFile(file, bank('m3-a', true))
    await importFiles(application, page, [file])
    const restored = await list(page, { query: 'gpiotitlemarker' })
    expect(restored.questions[0]).toMatchObject({
      favorite: true,
      currentRating: null,
      practiced: false,
    })
    await openPage(page, '开始练习')
    await page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toContainText('第 2 / 20')
    await page.getByRole('button', { name: '上一题', exact: true }).click()
    await expect(page.getByRole('region', { name: '练习参考答案' })).toContainText(
      `${secret}-m3-a-1`,
    )
    await expect(page.getByRole('region', { name: '练习参考答案' })).not.toContainText('更新答案')
    expect(snapshot(testDataDirectory).queue).toEqual(before.queue)
    expect(snapshot(testDataDirectory).foreignKeys).toEqual([])
    await info.attach('version-archive-restore.json', {
      body: JSON.stringify({ before, after: snapshot(testDataDirectory), restored }),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})
