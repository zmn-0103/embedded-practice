import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { ElectronApplication, Page, TestInfo } from '@playwright/test'
import { expect, launchApplication, openPage, test } from './helpers'
import { addCategory, assignTopic, categoryList } from './category-helpers'
import {
  captureHistory,
  historySnapshot,
  importHistoryFiles,
  stop,
  withHistoryDatabase,
} from './history-helpers'

const board = (page: Page, title: string) =>
  page.getByRole('article', { name: `板块：${title}`, exact: true })

function bank(topic: string, title: string, count: number, omitFirst = false) {
  return (
    `---\nschema_version: 1\ntopic_id: ${topic}\ntopic_title: ${title}\n---\n\n` +
    Array.from({ length: count }, (_, i) => i + 1)
      .filter((n) => !omitFirst || n !== 1)
      .map((n) => {
        const difficulty = (['基础', '进阶', '综合', null] as const)[(n - 1) % 4]
        return `## q-${n} | 入口题 ${n}\n\n标签：板块样本\n${difficulty ? `难度：${difficulty}\n` : ''}\n### 题目\n\nBOARD-BODY-${topic}-${n}\n\n### 参考答案\n\nBOARD-ANSWER-${topic}-${n}\n\n`
      })
      .join('')
  )
}

async function runtime(
  application: ElectronApplication,
  page: Page,
  directory: string,
  info: TestInfo,
) {
  const actual = await application.evaluate(({ app }) => ({
    executable: process.execPath,
    appPath: app.getAppPath(),
    packaged: app.isPackaged,
    userData: app.getPath('userData'),
    electron: process.versions.electron,
    node: process.versions.node,
  }))
  expect(actual.userData).toBe(directory)
  expect(actual.packaged).toBe(info.project.name === 'packaged')
  expect(actual.electron).toBe('42.11.15')
  if (actual.packaged)
    expect(resolve(actual.executable)).toBe(
      resolve(process.env['EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE']!),
    )
  else expect(resolve(actual.appPath)).toBe(resolve('.'))
  await expect(page.locator('footer')).toContainText('20261024.2-boards')
  const schema = withHistoryDatabase(directory, (db) => db.prepare('PRAGMA user_version').get())
  expect(schema).toEqual({ user_version: 9 })
  await info.attach('runtime.json', {
    body: JSON.stringify({ ...actual, schema, build: '20261024.2-boards' }, null, 2),
    contentType: 'application/json',
  })
}

async function prepare(directory: string, project: string) {
  const source = join(directory, '板块独立样本')
  await mkdir(source)
  const paths = ['board-a', 'board-b', 'board-c'].map((id) => join(source, `${id}.md`))
  await writeFile(paths[0]!, bank('board-a', 'UART板块测试', 23))
  await writeFile(paths[1]!, bank('board-b', '自定义专题', 3))
  await writeFile(paths[2]!, bank('board-c', '未归属专题', 1))
  const instance = await launchApplication(directory, project, '题库')
  try {
    await importHistoryFiles(instance.application, instance.page, paths)
    const communication = await addCategory(instance.page, '通信协议')
    const personal = await addCategory(instance.page, '我的重点')
    await addCategory(instance.page, '空分类')
    await assignTopic(instance.page, 'board-a', communication)
    await assignTopic(instance.page, 'board-b', personal)
    return { ...instance, communication, personal, paths }
  } catch (error) {
    await stop(instance.application)
    throw error
  }
}

test('板块入口：空库默认页可搜索和键盘浏览22份规划，不种分类或启动空练习', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await launchApplication(
    testDataDirectory,
    info.project.name,
    '板块',
  )
  try {
    await page.reload()
    await expect(page.getByRole('link', { name: '板块', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(page.locator('.board-card')).toHaveCount(17)
    await runtime(application, page, testDataDirectory, info)
    const c = board(page, 'C语言')
    await expect(c.locator('.board-count')).toHaveText('0 题 · 待补题')
    await expect(c.getByRole('button', { name: '进入板块：C语言', exact: true })).toBeDisabled()
    await c.locator('summary').focus()
    await c.locator('summary').press('Enter')
    await expect(c.getByText('数据类型与表达式', { exact: true })).toBeVisible()
    await page.getByLabel('显示拓展方向', { exact: true }).check()
    await expect(page.locator('.board-card')).toHaveCount(24)
    await page.getByLabel('显示拓展方向', { exact: true }).uncheck()
    const search = page.getByRole('searchbox', { name: '搜索板块', exact: true })
    await search.fill('Linux')
    await expect(page.locator('.board-card')).toHaveCount(2)
    await search.fill('Verilog')
    await expect(board(page, 'FPGA与数字设计')).toBeVisible()
    await search.fill('不存在的规划方向')
    await expect(page.getByText('没有匹配板块，请调整或清空搜索。', { exact: true })).toBeVisible()
    await search.fill('')
    await captureHistory(application, page, info, 'boards-empty.png')
    await page.getByRole('button', { name: '按条件开始练习', exact: true }).focus()
    await page.getByRole('button', { name: '按条件开始练习', exact: true }).press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()
    await expect(page.getByRole('button', { name: '开始练习', exact: true })).toBeDisabled()
    expect(historySnapshot(testDataDirectory).sessions).toEqual([])
    expect((await categoryList(page)).categories).toEqual([])
    await page.context().setOffline(true)
    await page.reload()
    await expect(board(page, 'C语言')).toBeVisible()
    await expect(page.getByRole('status')).toHaveText('本地数据已就绪')
  } finally {
    await stop(application)
  }
})

test('板块入口：实际数量/分页/归档一致，自定义与未分类可达，易中难筛选沿用原值', async ({
  testDataDirectory,
}, info) => {
  const { application, page, paths } = await prepare(testDataDirectory, info.project.name)
  try {
    await runtime(application, page, testDataDirectory, info)
    await openPage(page, '板块')
    await expect(board(page, '通信协议').locator('.board-count')).toHaveText('23 题')
    await expect(board(page, '我的重点').locator('.board-count')).toHaveText('3 题')
    await expect(board(page, '未分类').locator('.board-count')).toHaveText('1 题')
    await expect(board(page, '全部题库').locator('.board-count')).toHaveText('27 题')
    await expect(
      board(page, '空分类').getByRole('button', { name: '进入板块：空分类', exact: true }),
    ).toBeDisabled()
    const enter = board(page, '通信协议').getByRole('button', {
      name: '进入板块：通信协议',
      exact: true,
    })
    await enter.focus()
    await enter.press('Enter')
    await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
    await expect(page.getByLabel('题库浏览', { exact: true })).toBeFocused()
    await expect(page.locator('.question-list li')).toHaveCount(20)
    await expect(page.locator('.question-list .difficulty-badge')).toHaveCount(20)
    await page.getByRole('button', { name: '下一页', exact: true }).click()
    await expect(page.locator('.question-list li')).toHaveCount(3)
    for (const [value, label, count] of [
      ['基础', '易（基础）', 6],
      ['进阶', '中（进阶）', 6],
      ['综合', '难（综合）', 6],
      ['未分级', '未分级', 5],
    ] as const) {
      await page.getByLabel('题库难度', { exact: true }).selectOption({ label })
      await expect(page.getByLabel('题库难度', { exact: true })).toHaveValue(value)
      await page.getByRole('button', { name: '筛选题库', exact: true }).click()
      await expect(page.getByText(`共 ${count} 题`, { exact: true })).toBeVisible()
      await expect(
        page.locator('.question-list').getByLabel(`难度：${label}`, { exact: true }),
      ).toHaveCount(count)
    }
    await page.getByLabel('题库搜索', { exact: true }).fill('不会匹配')
    await page.getByLabel('题库只看收藏', { exact: true }).check()
    await page.getByRole('button', { name: '筛选题库', exact: true }).click()
    await expect(page.getByText('共 0 题', { exact: true })).toBeVisible()
    await openPage(page, '板块')
    await board(page, '通信协议')
      .getByRole('button', { name: '进入板块：通信协议', exact: true })
      .click()
    await expect(page.getByText('共 23 题', { exact: true })).toBeVisible()
    await expect(page.getByLabel('题库搜索', { exact: true })).toHaveValue('')
    await expect(page.getByLabel('题库难度', { exact: true })).toHaveValue('')
    await expect(page.getByLabel('题库只看收藏', { exact: true })).not.toBeChecked()
    await expect(page.getByRole('navigation', { name: '题目分页', exact: true })).toContainText(
      '1 / 2',
    )
    await page.locator('.question-list li > button').first().click()
    await expect(
      page
        .getByRole('article', { name: '题目内容', exact: true })
        .getByLabel('难度：易（基础）', { exact: true }),
    ).toBeVisible()
    for (const [title, count] of [
      ['我的重点', 3],
      ['未分类', 1],
      ['全部题库', 27],
    ] as const) {
      await openPage(page, '板块')
      await board(page, title)
        .getByRole('button', { name: `进入板块：${title}`, exact: true })
        .click()
      await expect(page.getByText(`共 ${count} 题`, { exact: true })).toBeVisible()
    }
    await writeFile(paths[0]!, bank('board-a', 'UART板块测试', 23, true))
    await importHistoryFiles(application, page, [paths[0]!])
    await openPage(page, '板块')
    await expect(board(page, '通信协议').locator('.board-count')).toHaveText('22 题')
    await board(page, '通信协议')
      .getByRole('button', { name: '查看归档：通信协议', exact: true })
      .click()
    await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
    await expect(page.getByLabel('查看归档题目', { exact: true })).toBeChecked()
    await expect(page.locator('.question-list li')).toHaveCount(1)
  } finally {
    await stop(application)
  }
})
