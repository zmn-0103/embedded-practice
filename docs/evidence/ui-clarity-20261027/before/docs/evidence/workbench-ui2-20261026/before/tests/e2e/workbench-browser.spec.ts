import { writeFile } from 'node:fs/promises'
import { expect, openPage, test } from './helpers'
import { importHistoryFiles, stop } from './history-helpers'
import { categoryList } from './category-helpers'
import { themeBusinessSnapshot } from './theme-helpers'
import {
  noWorkbenchOverflow,
  prepareWorkbench,
  settleWorkbench,
  workbenchBank,
} from './workbench-helpers'

test('工作台题库：内容更新筛选按当前版本和范围真实计数，标签候选保持，练习仍使用原选题规则', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareWorkbench(testDataDirectory, info.project.name)
  try {
    await writeFile(file, workbenchBank(true))
    await importHistoryFiles(application, page, [file])
    await openPage(page, '学习总览')
    await expect(page.getByLabel('复习筛选入口', { exact: true })).toContainText('1 题 · 去筛选')
    const before = themeBusinessSnapshot(testDataDirectory)
    await page
      .getByLabel('复习筛选入口', { exact: true })
      .getByRole('button', { name: /^内容更新待复习/ })
      .click()
    await expect(page.getByLabel('题库只看内容更新待复习', { exact: true })).toBeChecked()
    await expect(page.getByLabel('题库结果范围', { exact: true })).toContainText('仅内容更新待复习')
    await expect(page.locator('.question-list li')).toHaveCount(1)
    const selected = await categoryList(page, { contentUpdatedOnly: true })
    expect(selected.questions.map((question) => question.questionId)).toEqual(['q-1'])
    expect(selected.tagOptions).toEqual(['分组0', '分组1', '工作台'])
    expect(
      (
        await categoryList(page, {
          contentUpdatedOnly: true,
          filters: {
            query: '',
            tag: '分组0',
            difficulty: null,
            mastery: 'all',
            favoritesOnly: false,
          },
        })
      ).total,
    ).toBe(0)
    expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
    await openPage(page, '开始练习')
    await expect(page.getByText('匹配 25 题', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await expect(page.getByLabel('练习参考答案', { exact: true })).toContainText(
      'WORKBENCH-ANSWER-1-NEW',
    )
    await page.getByRole('button', { name: '保存并返回', exact: true }).click()
    await openPage(page, '题库')
    await expect(page.locator('.question-list li')).toHaveCount(0)
    expect((await categoryList(page, { contentUpdatedOnly: true })).total).toBe(0)
  } finally {
    await stop(application)
  }
})

test('工作台题库：宽窗三栏与窄窗详情返回保留筛选、页码、选中、已展开内容和同一阅读节点', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  try {
    const manager = page.locator('.library-management-tools .category-manager')
    const managementToggle = manager.locator('summary')
    await managementToggle.click()
    await settleWorkbench(page)
    const fields = manager.locator('fieldset')
    await expect(fields).toHaveCount(3)
    const wideFields = await Promise.all([0, 1, 2].map((index) => fields.nth(index).boundingBox()))
    expect(wideFields.every((box) => box && box.width > 200)).toBe(true)
    expect(wideFields[0]!.x + wideFields[0]!.width).toBeLessThan(wideFields[1]!.x)
    expect(wideFields[1]!.x + wideFields[1]!.width).toBeLessThan(wideFields[2]!.x)
    await managementToggle.click()
    await page.getByRole('searchbox', { name: '题库搜索', exact: true }).fill('工作台题目')
    await page.getByRole('button', { name: '筛选题库', exact: true }).click()
    await expect(page.locator('.question-list li')).toHaveCount(20)
    await page.getByRole('button', { name: '下一页', exact: true }).click()
    await expect(page.locator('.question-list li')).toHaveCount(5)
    const row = page
      .getByRole('complementary', { name: '题目列表', exact: true })
      .getByRole('button', { name: / · q-25(?:\s|$)/ })
    await row.click()
    const reader = page.getByRole('article', { name: '题目内容', exact: true })
    await expect(reader.getByRole('heading', { name: '工作台题目 25', exact: true })).toBeVisible()
    await reader.getByRole('button', { name: '展开参考答案', exact: true }).click()
    await expect(reader).toContainText('WORKBENCH-ANSWER-25')
    await reader.evaluate((element) => Reflect.set(globalThis, '__workbenchReader', element))
    const regions = await Promise.all(
      ['.library-navigation', '.library-results', '.library-reader-pane'].map((selector) =>
        page.locator(selector).boundingBox(),
      ),
    )
    expect(regions.every(Boolean)).toBe(true)
    expect(regions[0]!.x + regions[0]!.width).toBeLessThan(regions[1]!.x)
    expect(regions[1]!.x + regions[1]!.width).toBeLessThan(regions[2]!.x)
    const before = themeBusinessSnapshot(testDataDirectory)
    for (const width of [1200, 900]) {
      await application.evaluate(
        ({ BrowserWindow }, width) => BrowserWindow.getAllWindows()[0]!.setContentSize(width, 1000),
        width,
      )
      await settleWorkbench(page)
      if (width === 900) {
        await managementToggle.click()
        await settleWorkbench(page)
        const narrowFields = await Promise.all(
          [0, 1, 2].map((index) => fields.nth(index).boundingBox()),
        )
        expect(narrowFields[0]!.x).toBe(narrowFields[1]!.x)
        expect(narrowFields[1]!.x).toBe(narrowFields[2]!.x)
        expect(narrowFields[0]!.y + narrowFields[0]!.height).toBeLessThan(narrowFields[1]!.y)
        expect(narrowFields[1]!.y + narrowFields[1]!.height).toBeLessThan(narrowFields[2]!.y)
        await managementToggle.click()
      }
      await expect(reader).toBeVisible()
      await page.getByRole('button', { name: '返回题目列表', exact: true }).click()
      await expect(row).toBeFocused()
      await expect(row).toHaveAttribute('aria-current', 'true')
      await expect(page.getByRole('searchbox', { name: '题库搜索', exact: true })).toHaveValue(
        '工作台题目',
      )
      await expect(page.getByLabel('题目分页', { exact: true })).toContainText('2 / 2')
      await row.click()
      await expect(reader).toContainText('WORKBENCH-ANSWER-25')
      expect(
        await reader.evaluate(
          (element) => Reflect.get(globalThis, '__workbenchReader') === element,
        ),
      ).toBe(true)
      await noWorkbenchOverflow(page)
    }
    expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
  } finally {
    await stop(application)
  }
})
