import { expect, openPage, test } from './helpers'
import { stop, withHistoryDatabase } from './history-helpers'
import { categoryList } from './category-helpers'
import { themeBusinessSnapshot } from './theme-helpers'
import { noWorkbenchOverflow, prepareWorkbench, settleWorkbench } from './workbench-helpers'

test('工作台练习：保存失败保留输入并阻止返回，六入口保存守卫与主题/缩放不重建输入，恢复后继续原轮', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  let fault = false
  try {
    await openPage(page, '开始练习')
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    const input = page.getByRole('textbox', { name: '我的答案', exact: true })
    await input.evaluate((element) => Reflect.set(globalThis, '__workbenchInput', element))
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER workbench_draft_fault BEFORE UPDATE OF draft ON practice_items BEGIN SELECT RAISE(ABORT, '工作台保存失败注入'); END",
        ),
      false,
    )
    fault = true
    await input.fill('工作台保存失败必须保留的原输入\n    independent_thinking();')
    await expect(page.locator('.practice-save')).toHaveText('保存失败')
    await page.getByRole('button', { name: '保存并返回', exact: true }).click()
    await expect(input).toHaveValue('工作台保存失败必须保留的原输入\n    independent_thinking();')
    const links = page.getByRole('navigation', { name: '主要页面', exact: true }).getByRole('link')
    await expect(links).toHaveCount(6)
    for (const link of await links.all())
      await expect(link).toHaveAttribute('aria-disabled', 'true')
    await page.getByRole('link', { name: '学习总览', exact: true }).focus()
    await page.getByRole('link', { name: '学习总览', exact: true }).press('Enter')
    await expect(page.getByLabel('练习进度', { exact: true })).toContainText('第 1 / 20')
    await page.locator('.quick-appearance > summary').click()
    await page.getByLabel('快捷主题选择', { exact: true }).selectOption('builtin.claude')
    await page.getByRole('button', { name: '应用所选主题', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme-id', 'builtin.claude')
    const before = themeBusinessSnapshot(testDataDirectory)
    for (const width of [1440, 1200, 900]) {
      await application.evaluate(
        ({ BrowserWindow }, width) => BrowserWindow.getAllWindows()[0]!.setContentSize(width, 1000),
        width,
      )
      await settleWorkbench(page)
      expect(
        await input.evaluate((element) => Reflect.get(globalThis, '__workbenchInput') === element),
      ).toBe(true)
      await expect(page.locator('.practice-save')).toHaveText('保存失败')
      await expect(page.getByRole('button', { name: '查看本题历史', exact: true })).toHaveCount(0)
      await expect(page.getByRole('button', { name: '掌握', exact: true })).toHaveCount(0)
      await noWorkbenchOverflow(page)
    }
    expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
    withHistoryDatabase(
      testDataDirectory,
      (db) => db.exec('DROP TRIGGER workbench_draft_fault'),
      false,
    )
    fault = false
    await page.getByRole('button', { name: '重试保存', exact: true }).click()
    await expect(page.locator('.practice-save')).toHaveText('已保存')
    await page.getByRole('button', { name: '保存并返回', exact: true }).click()
    await openPage(page, '学习总览')
    await page.getByRole('button', { name: '继续本轮', exact: true }).click()
    await expect(input).toHaveValue('工作台保存失败必须保留的原输入\n    independent_thinking();')
    await expect(page.getByLabel('练习进度', { exact: true })).toContainText('第 1 / 20')
  } finally {
    if (fault)
      withHistoryDatabase(
        testDataDirectory,
        (db) => db.exec('DROP TRIGGER workbench_draft_fault'),
        false,
      )
    await stop(application)
  }
})

test('工作台练习：收藏失败重试原目标且独立于自评，空输入揭晓后才挂载答案/历史和自评，新题重新隔离', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  let fault = false
  try {
    await openPage(page, '开始练习')
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    const before = themeBusinessSnapshot(testDataDirectory)
    await page.getByRole('button', { name: '收藏本题', exact: true }).click()
    await expect(page.getByRole('button', { name: '取消收藏', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER workbench_favorite_fault BEFORE UPDATE OF favorite ON question_user_state BEGIN SELECT RAISE(ABORT, '工作台收藏失败注入'); END",
        ),
      false,
    )
    fault = true
    await page.getByRole('button', { name: '取消收藏', exact: true }).click()
    await expect(page.getByRole('button', { name: '重试收藏操作', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    withHistoryDatabase(
      testDataDirectory,
      (db) => db.exec('DROP TRIGGER workbench_favorite_fault'),
      false,
    )
    fault = false
    await page.getByRole('button', { name: '重试收藏操作', exact: true }).click()
    await expect(page.getByRole('button', { name: '收藏本题', exact: true })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    const after = themeBusinessSnapshot(testDataDirectory)
    expect(after.sessions).toEqual(before.sessions)
    expect(after.items).toEqual(before.items)
    expect(after.receipts).toEqual(before.receipts)
    await page.getByRole('button', { name: '收藏本题', exact: true }).click()
    await expect(page.getByRole('button', { name: '取消收藏', exact: true })).toBeEnabled()
    await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue('')
    await expect(page.locator('body')).not.toContainText('WORKBENCH-ANSWER-1')
    expect(await page.locator('body').ariaSnapshot()).not.toContain('WORKBENCH-ANSWER-1')
    await expect(page.getByRole('button', { name: '查看本题历史', exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await expect(page.getByLabel('练习参考答案', { exact: true })).toContainText(
      'WORKBENCH-ANSWER-1',
    )
    await expect(page.getByRole('button', { name: '查看本题历史', exact: true })).toBeVisible()
    await page.getByRole('button', { name: '不熟', exact: true }).click()
    await expect(page.getByLabel('练习进度', { exact: true })).toContainText('第 2 / 20')
    await expect(page.getByRole('button', { name: '收藏本题', exact: true })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    await expect(page.getByRole('button', { name: '查看本题历史', exact: true })).toHaveCount(0)
    await expect(page.locator('body')).not.toContainText('WORKBENCH-ANSWER-1')
    expect(await page.locator('body').ariaSnapshot()).not.toContain('WORKBENCH-ANSWER-1')
    const questions = (await categoryList(page)).questions
    expect(questions.find((question) => question.questionId === 'q-1')).toMatchObject({
      favorite: true,
      currentRating: '不熟',
    })
    expect(questions.find((question) => question.questionId === 'q-2')).toMatchObject({
      favorite: false,
      currentRating: null,
    })
  } finally {
    if (fault)
      withHistoryDatabase(
        testDataDirectory,
        (db) => db.exec('DROP TRIGGER workbench_favorite_fault'),
        false,
      )
    await stop(application)
  }
})
