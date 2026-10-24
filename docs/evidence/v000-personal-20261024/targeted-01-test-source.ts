import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { ElectronApplication, Page, TestInfo } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, launchApplication, openPage, test } from './helpers'
import { addCategory, assignTopic, categoryList } from './category-helpers'
import { historySnapshot, importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
import { readPlans, savePlan } from './practice-plan-helpers'

const release = resolve('question-banks/releases/v000-20261024')
const before = resolve('docs/evidence/v000-personal-20261024/before')
const manifest = JSON.parse(readFileSync(join(release, '全量题库清单.json'), 'utf8')) as {
  files: {
    file: string
    topicId: string
    board: string
    count: number
    questions: {
      questionId: string
      questionSha256: string
      answerSha256: string
      difficulty: string
      tags: string[]
    }[]
  }[]
}
const files = manifest.files.map((file) => resolve(file.file))
const hash = (text: string) => createHash('sha256').update(text).digest('hex')

async function runtime(
  application: ElectronApplication,
  page: Page,
  directory: string,
  info: TestInfo,
) {
  const actual = await application.evaluate(({ app }) => ({
    executable: process.execPath,
    appPath: app.getAppPath(),
    name: app.getName(),
    version: app.getVersion(),
    packaged: app.isPackaged,
    userData: app.getPath('userData'),
    electron: process.versions.electron,
  }))
  expect(actual.userData).toBe(directory)
  expect(actual.packaged).toBe(info.project.name === 'packaged')
  expect(actual.name).toBe('embedded-practice')
  expect(actual.electron).toBe('42.11.15')
  expect(actual.version).toBe('0.0.0')
  if (actual.packaged)
    expect(resolve(actual.executable)).toBe(
      resolve(process.env['EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE']!),
    )
  else expect(resolve(actual.appPath)).toBe(resolve('out/main'))
  await expect(page.locator('footer span').last()).toHaveText(
    'V0.0.0 测试版 · 构建 20261024.4-v000',
  )
  expect(withHistoryDatabase(directory, (db) => db.prepare('PRAGMA user_version').get())).toEqual({
    user_version: 9,
  })
  await info.attach('runtime.json', {
    body: JSON.stringify(actual),
    contentType: 'application/json',
  })
}
async function importExact(
  application: ElectronApplication,
  page: Page,
  paths: string[],
  counts: string,
) {
  await importHistoryFiles(application, page, paths)
  await expect(page.getByText(/^导入完成：/)).toHaveText(counts)
}
function verifyAll(directory: string) {
  const rows = withHistoryDatabase(directory, (db) => {
    expect(db.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }])
    expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
    return db
      .prepare(
        `SELECT q.topic_id,q.question_id,q.difficulty,q.tags_json,
      v.question_markdown,v.answer_markdown FROM questions q
      JOIN question_versions v ON v.id=q.current_version_id WHERE q.archived=0`,
      )
      .all()
  }) as unknown as {
    topic_id: string
    question_id: string
    difficulty: string
    tags_json: string
    question_markdown: string
    answer_markdown: string
  }[]
  expect(rows).toHaveLength(419)
  for (const file of manifest.files)
    for (const q of file.questions) {
      const actual = rows.find(
        (row) => row.topic_id === file.topicId && row.question_id === q.questionId,
      )!
      expect(actual).toBeDefined()
      expect(hash(actual.question_markdown)).toBe(q.questionSha256)
      expect(hash(actual.answer_markdown)).toBe(q.answerSha256)
      expect(actual.difficulty).toBe(q.difficulty)
      expect(JSON.parse(actual.tags_json)).toEqual(q.tags)
    }
}
async function normalClose(application: ElectronApplication) {
  const closed = application.waitForEvent('close')
  await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.close())
  await closed
}
async function current(page: Page) {
  const result = await page.evaluate(() =>
    (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
  )
  if (!result.ok || !result.value) throw new Error('测试活动轮读取失败')
  return result.value
}
function completeState(directory: string) {
  return withHistoryDatabase(directory, (db) =>
    Object.fromEntries(
      [
        'library_meta',
        'categories',
        'practice_plans',
        'topics',
        'questions',
        'question_versions',
        'question_user_state',
        'import_receipts',
        'practice_sessions',
        'practice_items',
        'practice_receipts',
        'appearance_settings',
      ].map((table) => [table, db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()]),
    ),
  )
}

test('全量419题首次/重复导入、13专题归属、板块计数和三级难度筛选', async ({
  testDataDirectory,
}, info) => {
  test.setTimeout(120_000)
  const instance = await launchApplication(testDataDirectory, info.project.name, '题库')
  const { application, page } = instance
  try {
    await runtime(application, page, testDataDirectory, info)
    await importExact(
      application,
      page,
      files,
      '导入完成：新增 419，内容更新 0，信息变更 0，不变 0，归档 0，恢复 0。',
    )
    verifyAll(testDataDirectory)
    const categories = new Map<string, string>()
    for (const file of manifest.files) {
      if (!categories.has(file.board))
        categories.set(file.board, await addCategory(page, file.board))
      await assignTopic(page, file.topicId, categories.get(file.board)!)
    }
    const navigation = await categoryList(page)
    expect(navigation.topics).toHaveLength(13)
    for (const file of manifest.files)
      expect(navigation.topics.find((topic) => topic.topicId === file.topicId)).toMatchObject({
        categoryId: categories.get(file.board),
        activeCount: file.count,
        archivedCount: 0,
      })
    for (const difficulty of ['基础', '进阶', '综合'] as const) {
      await page.getByLabel('题库难度', { exact: true }).selectOption(difficulty)
      await page.getByRole('button', { name: '筛选题库', exact: true }).click()
      const count = manifest.files
        .flatMap((file) => file.questions)
        .filter((q) => q.difficulty === difficulty).length
      await expect(page.getByText(`共 ${count} 题`, { exact: true })).toBeVisible()
      expect(
        (
          await categoryList(page, {
            filters: { query: '', tag: null, difficulty, mastery: 'all', favoritesOnly: false },
          })
        ).total,
      ).toBe(count)
    }
    await page.getByLabel('题库难度', { exact: true }).selectOption('')
    await page.getByRole('button', { name: '筛选题库', exact: true }).click()
    await importExact(
      application,
      page,
      files,
      '导入完成：新增 0，内容更新 0，信息变更 0，不变 419，归档 0，恢复 0。',
    )
    verifyAll(testDataDirectory)
    await openPage(page, '板块')
    for (const [title] of categories) {
      const count = manifest.files
        .filter((file) => file.board === title)
        .reduce((sum, file) => sum + file.count, 0)
      await expect(
        page.getByRole('article', { name: `板块：${title}`, exact: true }),
      ).toContainText(`${count}`)
    }
    await info.attach('419-topic-navigation.json', {
      body: JSON.stringify(navigation),
      contentType: 'application/json',
    })
    await page.screenshot({ path: info.outputPath('419-boards.png'), fullPage: true })
  } finally {
    await stop(application)
  }
})

test('旧118题学习记录保护、更新后旧轮/新轮、正常重开与419题完整备份恢复', async ({
  testDataDirectory,
}, info) => {
  test.setTimeout(120_000)
  let { application, page } = await launchApplication(testDataDirectory, info.project.name, '题库')
  try {
    await runtime(application, page, testDataDirectory, info)
    const oldFiles = manifest.files
      .filter(
        (file) =>
          file.topicId.startsWith('general-') ||
          ['stm32f103-gpio', 'm5-trial-uart-level-2'].includes(file.topicId),
      )
      .map((file) => join(before, file.file))
    await importExact(
      application,
      page,
      oldFiles,
      '导入完成：新增 118，内容更新 0，信息变更 0，不变 0，归档 0，恢复 0。',
    )
    const category = await addCategory(page, 'STM32')
    await assignTopic(page, 'stm32f103-gpio', category)
    await openPage(page, '开始练习')
    await page.getByLabel('练习专题', { exact: true }).selectOption('stm32f103-gpio')
    await page.getByLabel('本轮题数', { exact: true }).selectOption('all')
    await savePlan(page, '原GPIO顺序方案')
    const plans = await readPlans(page)
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await page.getByRole('button', { name: '掌握', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toContainText('第 2 / 78')
    const input = page.getByRole('textbox', { name: '我的答案', exact: true })
    await input.fill('V0个人测试合成草稿\n保留旧版本与固定队列')
    await normalClose(application)
    ;({ application, page } = await launchApplication(testDataDirectory, info.project.name))
    await page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      'V0个人测试合成草稿\n保留旧版本与固定队列',
    )
    const oldView = await current(page)
    const protectedBefore = historySnapshot(testDataDirectory)
    await page.getByRole('button', { name: '返回首页', exact: true }).click()
    await importExact(
      application,
      page,
      files,
      '导入完成：新增 301，内容更新 108，信息变更 0，不变 10，归档 0，恢复 0。',
    )
    verifyAll(testDataDirectory)
    const after = historySnapshot(testDataDirectory)
    for (const key of ['sessions', 'items', 'states', 'receipts'] as const)
      expect(after[key]).toEqual(protectedBefore[key])
    expect(after.versions).toEqual(expect.arrayContaining(protectedBefore.versions))
    expect(await readPlans(page)).toEqual(plans)
    expect(
      (await categoryList(page)).topics.find((topic) => topic.topicId === 'stm32f103-gpio')
        ?.categoryId,
    ).toBe(category)
    await importExact(
      application,
      page,
      files,
      '导入完成：新增 0，内容更新 0，信息变更 0，不变 419，归档 0，恢复 0。',
    )
    const backup = join(testDataDirectory, '419题完整备份.sqlite3')
    await application.evaluate(({ app, dialog }, path) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: path })
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
      dialog.showMessageBox = (async () => ({
        response: 1,
        checkboxChecked: false,
      })) as typeof dialog.showMessageBox
      // 真实文件恢复；本专项由测试重新连接新进程，自动relaunch另由既有完整回归验证。
      app.relaunch = () => {}
    }, backup)
    const saved = completeState(testDataDirectory)
    await openPage(page, '设置与数据')
    await page.getByRole('button', { name: '导出完整备份', exact: true }).click()
    await expect(page.getByText('完整备份已导出并校验。', { exact: true })).toBeVisible()
    const favorite = await page.evaluate(() =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.library.setFavorite({
        topicId: 'stm32f103-gpio',
        questionId: 'gpio-001',
        favorite: true,
      }),
    )
    expect(favorite.ok).toBe(true)
    expect(completeState(testDataDirectory)).not.toEqual(saved)
    await page.getByRole('button', { name: '选择备份并预览', exact: true }).click()
    await expect(page.getByRole('region', { name: '恢复预览摘要', exact: true })).toContainText(
      '419',
    )
    const closed = application.waitForEvent('close')
    await page.getByRole('button', { name: '恢复此备份…', exact: true }).click()
    await closed
    ;({ application, page } = await launchApplication(testDataDirectory, info.project.name))
    expect(completeState(testDataDirectory)).toEqual(saved)
    verifyAll(testDataDirectory)
    await page.getByRole('button', { name: '继续练习', exact: true }).click()
    const resumed = await current(page)
    expect(resumed).toEqual(oldView)
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    const revealed = await current(page)
    expect(revealed.item?.revealed).toBe(true)
    if (revealed.item?.revealed) expect(revealed.item.answer.markdown).not.toContain('核心结论：')
    await page.getByRole('button', { name: '结束本轮', exact: true }).click()
    await page.getByRole('button', { name: '返回首页', exact: true }).click()
    await openPage(page, '开始练习')
    await page.getByLabel('练习专题', { exact: true }).selectOption('stm32f103-gpio')
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    expect((await current(page)).item?.revealed).toBe(false)
    await expect(page.getByRole('region', { name: '练习参考答案', exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await expect(
      page.getByRole('region', { name: '练习参考答案', exact: true }).locator('strong').first(),
    ).toHaveText('核心结论：')
    await info.attach('old-learning-protection.json', {
      body: JSON.stringify({ protectedBefore, after, plans }),
      contentType: 'application/json',
    })
    await page.screenshot({ path: info.outputPath('v000-practice.png'), fullPage: true })
  } finally {
    await stop(application)
  }
})
