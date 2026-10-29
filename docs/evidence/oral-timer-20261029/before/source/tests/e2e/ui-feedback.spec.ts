import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Page, TestInfo } from '@playwright/test'
import { expect, launchApplication, openPage, test } from './helpers'
import { categoryChange, categoryList } from './category-helpers'
import { importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
import { themeBusinessSnapshot, verifyThemeTarget } from './theme-helpers'
import { prepareWorkbench, settleWorkbench, workbenchBank } from './workbench-helpers'

async function capture(page: Page, info: TestInfo, name: string) {
  await settleWorkbench(page)
  const path = info.outputPath(name)
  await page.screenshot({ path, fullPage: true })
  await info.attach(name, { path, contentType: 'image/png' })
}

test('第二批概览：首次导入、有题无活动轮、继续原轮各有明确下一步，配置不提前建轮', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await launchApplication(
    testDataDirectory,
    info.project.name,
    '学习总览',
  )
  try {
    await verifyThemeTarget(application, page, testDataDirectory, info.project.name)
    const overview = page.getByLabel('当前练习概况', { exact: true })
    await expect(overview.getByRole('button', { name: '导入题库', exact: true })).toBeVisible()
    await expect(overview.getByRole('button', { name: '开始新练习', exact: true })).toHaveCount(0)
    await capture(page, info, 'overview-first-use.png')
    const file = join(testDataDirectory, '概览独立样本.md')
    await writeFile(file, workbenchBank())
    await openPage(page, '题库')
    await importHistoryFiles(application, page, [file])
    await openPage(page, '学习总览')
    await expect(overview.getByRole('button', { name: '开始新练习', exact: true })).toHaveClass(
      /primary/,
    )
    const before = themeBusinessSnapshot(testDataDirectory)
    await capture(page, info, 'overview-ready.png')
    await overview.getByRole('button', { name: '开始新练习', exact: true }).click()
    expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    await page
      .getByRole('textbox', { name: '我的答案', exact: true })
      .fill('概览继续原轮的独立草稿')
    await page.getByRole('button', { name: '保存并返回', exact: true }).click()
    await openPage(page, '学习总览')
    await expect(overview.getByRole('button', { name: '继续本轮', exact: true })).toHaveClass(
      /primary/,
    )
    await expect(overview.getByRole('button', { name: '开始新练习', exact: true })).not.toHaveClass(
      /primary/,
    )
    await capture(page, info, 'overview-resume.png')
    await overview.getByRole('button', { name: '继续本轮', exact: true }).click()
    await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      '概览继续原轮的独立草稿',
    )
    await expect(page.getByLabel('练习进度', { exact: true })).toContainText('第 1 / 20 题')
  } finally {
    await stop(application)
  }
})

test('第二批板块：可练习、规划中、归档和空分类状态明确，无匹配可清空且不改变数据', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  try {
    const file = join(testDataDirectory, '独立归档样本.md')
    await writeFile(
      file,
      workbenchBank()
        .replace('workbench-a', 'adaptive-archived')
        .replace('工作台验收专题', '独立归档样本'),
    )
    await importHistoryFiles(application, page, [file])
    for (const title of ['C语言', '归档样本分类', '独立空分类'])
      await categoryChange(page, { kind: 'create', title })
    const navigation = await categoryList(page)
    for (const [topicId, title] of [
      ['workbench-a', 'C语言'],
      ['adaptive-archived', '归档样本分类'],
    ] as const) {
      const category = navigation.categories.find((item) => item.title === title)!
      await categoryChange(page, {
        kind: 'assign',
        topicId,
        categoryId: category.categoryId,
      })
    }
    // 仅在本场景临时库设置“只有归档”的确定性展示夹具。
    withHistoryDatabase(
      testDataDirectory,
      (db) => {
        const result = db
          .prepare('UPDATE questions SET archived = 1 WHERE topic_id = ?')
          .run('adaptive-archived')
        expect(result.changes).toBe(25)
      },
      false,
    )
    await openPage(page, '知识板块')
    const available = page.getByRole('article', { name: '板块：C语言', exact: true })
    await expect(available).toHaveAttribute('data-availability', 'available')
    await expect(available.locator('.board-status')).toHaveText('可练习')
    await expect(
      available.getByRole('button', { name: '进入板块：C语言', exact: true }),
    ).toBeEnabled()
    const planned = page.locator('.board-card[data-availability="planned"]').first()
    await expect(planned.locator('.board-status')).toHaveText('规划中')
    await expect(planned.getByRole('button')).toBeDisabled()
    await planned.getByText('查看建设规划', { exact: true }).click()
    await expect(planned.getByText('建设规划，尚不代表已导入', { exact: true })).toBeVisible()
    const empty = page.getByRole('article', { name: '板块：独立空分类', exact: true })
    await expect(empty).toHaveAttribute('data-availability', 'empty')
    await expect(empty.locator('.board-status')).toHaveText('暂无内容')
    const archived = page.getByRole('article', { name: '板块：归档样本分类', exact: true })
    await expect(archived).toHaveAttribute('data-availability', 'archived')
    await expect(archived.locator('.board-status')).toHaveText('仅有归档')
    await archived.getByRole('button', { name: '查看归档：归档样本分类', exact: true }).click()
    await expect(page.getByRole('checkbox', { name: '查看归档题目', exact: true })).toBeChecked()
    await expect(page.getByText('共 25 题', { exact: true })).toBeVisible()
    await openPage(page, '知识板块')
    const before = themeBusinessSnapshot(testDataDirectory)
    await page.getByRole('searchbox', { name: '搜索板块', exact: true }).fill('独立无匹配条件')
    await expect(page.getByRole('button', { name: '清空板块筛选', exact: true })).toBeVisible()
    await page.getByRole('button', { name: '清空板块筛选', exact: true }).click()
    await expect(page.getByRole('searchbox', { name: '搜索板块', exact: true })).toHaveValue('')
    await expect(available).toBeVisible()
    expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
    await capture(page, info, 'board-states.png')
  } finally {
    await stop(application)
  }
})

test('第二批设置：预览待应用、切页保留、失败未确认与重试成功分别反馈，恢复默认立即生效', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  let fault = false
  try {
    await openPage(page, '设置与数据')
    const status = page.locator('.appearance-apply-status')
    await expect(status).toContainText('当前外观已应用')
    const before = themeBusinessSnapshot(testDataDirectory)
    await page.getByRole('radio', { name: '晴空蓝', exact: true }).check()
    await expect(status).toContainText('外观选择尚未应用')
    await expect(page.locator('html')).toHaveAttribute('data-theme-id', 'builtin.forest')
    await page.getByRole('tab', { name: '备份恢复', exact: true }).click()
    await page.getByRole('tab', { name: '外观主题', exact: true }).click()
    await expect(status).toContainText('外观选择尚未应用')
    await capture(page, info, 'settings-pending.png')
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER adaptive_settings_fault BEFORE UPDATE ON appearance_settings BEGIN SELECT RAISE(ABORT, '独立设置写入失败'); END",
        ),
      false,
    )
    fault = true
    await page.getByRole('button', { name: '保存并应用', exact: true }).click()
    await expect(status).toContainText('外观应用未确认')
    await expect(page.getByRole('radio', { name: '晴空蓝', exact: true })).toBeChecked()
    await expect(page.locator('html')).toHaveAttribute('data-theme-id', 'builtin.forest')
    withHistoryDatabase(
      testDataDirectory,
      (db) => db.exec('DROP TRIGGER adaptive_settings_fault'),
      false,
    )
    fault = false
    await page.getByRole('button', { name: '重试保存并应用', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme-id', 'builtin.ocean')
    await expect(status).toContainText('当前外观已应用')
    await page.getByRole('button', { name: '恢复默认外观', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme-id', 'builtin.forest')
    await expect(status).toContainText('当前外观已应用')
    expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
  } finally {
    if (fault)
      withHistoryDatabase(
        testDataDirectory,
        (db) => db.exec('DROP TRIGGER adaptive_settings_fault'),
        false,
      )
    await stop(application)
  }
})

test('第二批记录：空范围可重置为全部有效题目，统计/列表作用范围明确且不删除学习数据', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  try {
    await openPage(page, '学习记录')
    const before = themeBusinessSnapshot(testDataDirectory)
    await page.getByLabel('学习记录专题', { exact: true }).selectOption('workbench-a')
    await page.getByLabel('学习记录范围', { exact: true }).selectOption('archived')
    await expect(
      page.getByText('此范围暂无题目，可切换范围或返回题库导入。', { exact: true }),
    ).toBeVisible()
    await page.getByRole('button', { name: '重置记录范围', exact: true }).click()
    await expect(page.getByLabel('学习记录专题', { exact: true })).toHaveValue('')
    await expect(page.getByLabel('学习记录范围', { exact: true })).toHaveValue('active')
    await expect(page.locator('.learning-counts dd').first()).toHaveText('25')
    await expect(page.getByRole('button', { name: '重置记录范围', exact: true })).toBeDisabled()
    await page.getByRole('button', { name: '清空题库筛选', exact: true }).click()
    await expect(page.getByText('共 25 题', { exact: true })).toBeVisible()
    expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
    await capture(page, info, 'records-reset.png')
  } finally {
    await stop(application)
  }
})
