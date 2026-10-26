import { expect, launchApplication, openPage, test } from './helpers'
import { stop, withHistoryDatabase } from './history-helpers'
import { themeBusinessSnapshot, verifyThemeTarget } from './theme-helpers'
import { noWorkbenchOverflow, prepareWorkbench } from './workbench-helpers'

test('工作台总览：空库默认六入口、真实零统计与导入模板入口，不自动建轮或混入样例', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await launchApplication(
    testDataDirectory,
    info.project.name,
    '学习总览',
  )
  try {
    await page.reload()
    await expect(page.getByRole('link', { name: '学习总览', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await verifyThemeTarget(application, page, testDataDirectory, info.project.name)
    expect(
      await page
        .getByRole('navigation', { name: '主要页面', exact: true })
        .getByRole('link')
        .evaluateAll((elements) => elements.map((element) => element.getAttribute('aria-label'))),
    ).toEqual(['学习总览', '知识板块', '开始练习', '题库', '学习记录', '设置与数据'])
    await expect(page.locator('.overview-counts dd')).toHaveText(['0', '0', '0', '0'])
    const before = themeBusinessSnapshot(testDataDirectory)
    await page.getByRole('button', { name: '导入题库或导出模板', exact: true }).click()
    await expect(page.getByRole('button', { name: '导出题库模板', exact: true })).toBeVisible()
    await openPage(page, '开始练习')
    await expect(page.getByRole('button', { name: '开始练习', exact: true })).toBeDisabled()
    expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
    await noWorkbenchOverflow(page)
  } finally {
    await stop(application)
  }
})

test('工作台总览：当前位置与揭晓自评分列，快捷筛选不建轮，继续本轮保持原队列与草稿', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  try {
    await openPage(page, '开始练习')
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await page.getByRole('button', { name: '不会', exact: true }).click()
    await expect(page.getByLabel('练习进度', { exact: true })).toContainText('第 2 / 20')
    await page.getByRole('button', { name: '跳过本题', exact: true }).click()
    await expect(page.getByLabel('练习进度', { exact: true })).toContainText('第 3 / 20')
    await page.getByRole('textbox', { name: '我的答案', exact: true }).fill('工作台总览原队列草稿')
    await page.getByRole('button', { name: '保存并返回', exact: true }).click()
    await openPage(page, '学习总览')
    const current = page.getByLabel('当前练习概况', { exact: true })
    await expect(current).toContainText('当前位置 3 / 20 题')
    await expect(current).toContainText('已揭晓 1 题 · 已自评 1 题')
    await expect(page.locator('.overview-counts dd')).toHaveText(['25', '1', '1', '0'])
    const before = themeBusinessSnapshot(testDataDirectory)
    await page
      .getByLabel('复习筛选入口', { exact: true })
      .getByRole('button', { name: /^不会/ })
      .click()
    await expect(page.getByLabel('题库自评状态', { exact: true })).toHaveValue('不会')
    await expect(page.locator('.question-list li')).toHaveCount(1)
    expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
    await openPage(page, '学习总览')
    await page.getByRole('button', { name: '继续本轮', exact: true }).click()
    await expect(page.getByLabel('练习进度', { exact: true })).toContainText('第 3 / 20')
    await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      '工作台总览原队列草稿',
    )
    await expect(page.getByRole('button', { name: '查看本题历史', exact: true })).toHaveCount(0)
    await expect(page.locator('body')).not.toContainText('WORKBENCH-ANSWER-1')
    expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
  } finally {
    await stop(application)
  }
})

test('工作台总览：统计读取失败保持错误和重试，不伪装成空库或显示旧数字', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  let renamed = false
  try {
    withHistoryDatabase(
      testDataDirectory,
      (db) => db.exec('ALTER TABLE practice_items RENAME TO workbench_fault_items'),
      false,
    )
    renamed = true
    await openPage(page, '学习总览')
    await expect(page.getByRole('button', { name: '重试读取总览', exact: true })).toBeVisible()
    await expect(page.locator('.overview-counts')).toHaveCount(0)
    await expect(
      page.getByRole('heading', { name: '从导入你的题库开始', exact: true }),
    ).toHaveCount(0)
    withHistoryDatabase(
      testDataDirectory,
      (db) => db.exec('ALTER TABLE workbench_fault_items RENAME TO practice_items'),
      false,
    )
    renamed = false
    await page.getByRole('button', { name: '重试读取总览', exact: true }).click()
    await expect(page.locator('.overview-counts dd')).toHaveText(['25', '0', '0', '0'])
  } finally {
    if (renamed)
      withHistoryDatabase(
        testDataDirectory,
        (db) => db.exec('ALTER TABLE workbench_fault_items RENAME TO practice_items'),
        false,
      )
    await stop(application)
  }
})
