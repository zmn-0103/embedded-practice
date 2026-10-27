import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ElectronApplication, Locator, Page, TestInfo } from '@playwright/test'
import { expect, launchApplication, openPage, test } from './helpers'
import { stop, withHistoryDatabase } from './history-helpers'
import { chooseTheme, readAppearance, themeBusinessSnapshot } from './theme-helpers'
import { noWorkbenchOverflow, prepareWorkbench, settleWorkbench } from './workbench-helpers'

async function size(application: ElectronApplication, width = 1440) {
  await application.evaluate(
    ({ BrowserWindow }, width) => BrowserWindow.getAllWindows()[0]!.setContentSize(width, 900),
    width,
  )
}

async function inView(locator: Locator) {
  await expect(locator).toBeInViewport({ ratio: 1 })
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.y).toBeGreaterThanOrEqual(0)
}

async function screenshot(page: Page, info: TestInfo, name: string) {
  await settleWorkbench(page)
  await info.attach(name, { body: await page.screenshot(), contentType: 'image/png' })
}

test('第二轮画面：第1/10/20项详情均在视口，列表不回顶，分页/主题/字号和窄窗返回保持上下文', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  try {
    await size(application)
    await chooseTheme(page, '晴空蓝')
    await openPage(page, '题库')
    const before = themeBusinessSnapshot(testDataDirectory)
    const list = page.locator('.question-list-scroll')
    for (const index of [0, 9, 19]) {
      const row = page.locator('.question-row').nth(index)
      await row.scrollIntoViewIfNeeded()
      const position = await list.evaluate((element) => element.scrollTop)
      const windowTop = await page.evaluate(
        () => (globalThis as unknown as { scrollY: number }).scrollY,
      )
      await row.click()
      const title = page
        .getByRole('article', { name: '题目内容', exact: true })
        .getByRole('heading', { name: `工作台题目 ${index + 1}`, exact: true })
      await inView(title)
      expect(await list.evaluate((element) => element.scrollTop)).toBe(position)
      expect(
        await page.evaluate(() => (globalThis as unknown as { scrollY: number }).scrollY),
      ).toBe(windowTop)
      if (index === 19) expect(position).toBeGreaterThan(0)
    }
    await screenshot(page, info, 'library-row20-1440-17.png')
    const paging = page.getByRole('navigation', { name: '题目分页', exact: true })
    await inView(paging)
    const previous = await paging.getByRole('button', { name: '上一页' }).boundingBox()
    const next = await paging.getByRole('button', { name: '下一页' }).boundingBox()
    expect(previous!.y).toBe(next!.y)
    await paging.getByRole('button', { name: '下一页' }).click()
    await expect(page.locator('.question-row')).toHaveCount(5)
    await page.locator('.question-row').last().click()
    await inView(page.getByRole('heading', { name: '工作台题目 25', exact: true }))
    await chooseTheme(page, 'Claude 风格', 'dark', 22)
    await openPage(page, '题库')
    await inView(page.getByRole('heading', { name: '工作台题目 25', exact: true }))
    await size(application, 900)
    await page.getByRole('button', { name: '返回题目列表', exact: true }).click()
    await expect(paging).toContainText('2 / 2')
    await expect(page.locator('.question-row[aria-current="true"]')).toBeFocused()
    await page.locator('.question-row').last().click()
    await inView(page.getByRole('heading', { name: '工作台题目 25', exact: true }))
    await noWorkbenchOverflow(page)
    expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
  } finally {
    await stop(application)
  }
})

test('第二轮画面：短题首屏包含题干/输入/揭晓/返回，22px保存失败在当前操作附近且预留高度', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  let fault = false
  try {
    await size(application)
    await chooseTheme(page, '晴空蓝')
    await openPage(page, '开始练习')
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    const input = page.getByRole('textbox', { name: '我的答案', exact: true })
    for (const locator of [
      page.getByLabel('练习题干', { exact: true }),
      input,
      page.getByRole('button', { name: '查看参考答案', exact: true }),
      page.getByRole('button', { name: '保存并返回', exact: true }),
    ])
      await inView(locator)
    await screenshot(page, info, 'practice-short-1440-17.png')
    await page.getByRole('button', { name: '保存并返回', exact: true }).click()
    await chooseTheme(page, '晴空蓝', 'light', 22)
    await size(application, 900)
    await openPage(page, '开始练习')
    await page.getByRole('button', { name: '继续练习', exact: true }).click()
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER ui2_draft_fault BEFORE UPDATE OF draft ON practice_items BEGIN SELECT RAISE(ABORT, '第二轮保存失败'); END",
        ),
      false,
    )
    fault = true
    await input.fill(
      Array.from({ length: 120 }, (_, index) => `必须保留的长答案 ${index}`).join('\n'),
    )
    await expect(page.locator('.practice-save')).toHaveText('保存失败')
    const retry = page.getByRole('button', { name: '重试保存', exact: true })
    await inView(retry)
    await inView(page.locator('.practice-actions [role="alert"]'))
    await input.focus()
    await page.evaluate(() =>
      (globalThis as unknown as { scrollTo: (x: number, y: number) => void }).scrollTo(0, 100000),
    )
    await settleWorkbench(page)
    const editor = await input.boundingBox()
    const actions = await page.locator('.practice-actions').boundingBox()
    expect(editor!.y + editor!.height).toBeLessThanOrEqual(actions!.y)
    expect(
      await page
        .locator('.practice-action-reserve')
        .evaluate((element) => element.getBoundingClientRect().height),
    ).toBeGreaterThanOrEqual(actions!.height)
    await screenshot(page, info, 'practice-failed-900-22.png')
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await expect(page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
    withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER ui2_draft_fault'), false)
    fault = false
    await page.getByRole('button', { name: /重试保存|重试原操作/, exact: true }).click()
    await expect(page.locator('.practice-save')).toHaveText('已保存')
    await expect(input).toHaveValue(/必须保留的长答案 119/)
    await noWorkbenchOverflow(page)
  } finally {
    if (fault)
      withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER ui2_draft_fault'), false)
    await stop(application)
  }
})

test('第二轮画面：1440→900→1440导航按钮声明对应画面，窄窗不写宽窗偏好', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  try {
    await size(application)
    const before = await readAppearance(page)
    await expect(page.getByRole('button', { name: '收起导航', exact: true })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    await size(application, 900)
    await expect(page.locator('.navigation-toggle')).toBeHidden()
    await expect(page.locator('.brand-mark')).toBeVisible()
    await expect(page.locator('.navigation-label').first()).toBeHidden()
    expect(await readAppearance(page)).toEqual(before)
    await size(application)
    await expect(page.getByRole('button', { name: '收起导航', exact: true })).toBeVisible()
    await page.getByRole('button', { name: '收起导航', exact: true }).click()
    await expect(page.getByRole('button', { name: '展开导航', exact: true })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    await expect(page.locator('.navigation-label').first()).toBeHidden()
    const collapsed = await readAppearance(page)
    await size(application, 900)
    await expect(page.locator('.navigation-toggle')).toBeHidden()
    await size(application)
    expect(await readAppearance(page)).toEqual(collapsed)
    await expect(page.getByRole('button', { name: '展开导航', exact: true })).toBeVisible()
  } finally {
    await stop(application)
  }
})

test('第二轮画面：设置真正切区，导航/标题在视口，未应用外观保留且不自动保存', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  try {
    await size(application)
    await chooseTheme(page, '晴空蓝')
    const saved = await readAppearance(page)
    await page.getByRole('radio', { name: '暮山紫', exact: true }).check()
    const tabs = page.getByRole('tablist', { name: '设置分区', exact: true })
    await page.getByRole('tab', { name: '备份恢复', exact: true }).click()
    await inView(tabs)
    await inView(page.getByRole('heading', { name: '备份与恢复', exact: true }))
    await expect(page.getByRole('tab', { name: '备份恢复', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(page.getByRole('radio', { name: '暮山紫', exact: true })).toHaveCount(0)
    await screenshot(page, info, 'settings-backup-1440-17.png')
    await page.getByRole('tab', { name: '数据位置', exact: true }).click()
    await inView(page.getByRole('heading', { name: '数据位置', exact: true }))
    await page.getByRole('tab', { name: '外观主题', exact: true }).click()
    await expect(page.getByRole('radio', { name: '暮山紫', exact: true })).toBeChecked()
    expect(await readAppearance(page)).toEqual(saved)
    await inView(page.getByRole('button', { name: '保存并应用', exact: true }))
    await screenshot(page, info, 'settings-appearance-1440-17.png')
  } finally {
    await stop(application)
  }
})

test('第二轮画面：学习记录首屏可读至少3条，列表筛选不改变范围统计', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  try {
    await size(application)
    await chooseTheme(page, '晴空蓝')
    await page.evaluate(async () => {
      const api = (
        globalThis as unknown as {
          desktop: import('../../src/shared/contracts/application').DesktopApi
        }
      ).desktop
      for (let index = 1; index <= 6; index++) {
        const result = await api.library.setFavorite({
          topicId: 'workbench-a',
          questionId: `q-${index}`,
          favorite: true,
        })
        if (!result.ok) throw new Error(result.error.message)
      }
    })
    await openPage(page, '学习记录')
    await expect(page.locator('.question-row')).toHaveCount(6)
    const counts = await page.getByLabel('当前版本学习总览', { exact: true }).innerText()
    await inView(page.locator('.question-row').nth(2))
    await screenshot(page, info, 'records-1440-17.png')
    await page.getByRole('searchbox', { name: '题库搜索', exact: true }).fill('不存在的记录')
    await page.getByRole('button', { name: '筛选题库', exact: true }).click()
    await expect(page.locator('.question-row')).toHaveCount(0)
    expect(await page.getByLabel('当前版本学习总览', { exact: true }).innerText()).toBe(counts)
  } finally {
    await stop(application)
  }
})

test('第二轮画面：13专题导入预览风险/确认可达，关闭后回原题库筛选和选中位置', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  try {
    await size(application)
    await page.locator('.question-row').nth(19).click()
    const position = await page
      .locator('.question-list-scroll')
      .evaluate((element) => element.scrollTop)
    const paths = []
    for (let index = 1; index <= 13; index++) {
      const file = join(testDataDirectory, `独立导入${index}.md`)
      await writeFile(
        file,
        `---\nschema_version: 1\ntopic_id: ui2-import-${index}\ntopic_title: 导入专题${index}\n---\n\n## q-1 | 导入题${index}\n\n### 题目\n\n独立样本题干。\n\n### 参考答案\n\n独立样本参考。\n`,
      )
      paths.push(file)
    }
    await application.evaluate(({ dialog }, paths) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: paths })
    }, paths)
    await page.getByRole('button', { name: '导入题库', exact: true }).click()
    await expect(
      page.getByRole('table', { name: '分专题变更摘要', exact: true }).locator('tbody tr'),
    ).toHaveCount(13)
    await inView(page.locator('.import-snapshot-warning'))
    await inView(page.getByRole('button', { name: '确认导入', exact: true }))
    await expect(page.locator('.import-workspace')).toContainText('遗漏的现有题目将归档')
    await screenshot(page, info, 'import-13-topics-1440-17.png')
    await page.getByRole('button', { name: '关闭导入工作区', exact: true }).click()
    await expect(page.locator('.question-row[aria-current="true"]')).toContainText('工作台题目 20')
    expect(
      await page.locator('.question-list-scroll').evaluate((element) => element.scrollTop),
    ).toBe(position)
    await inView(page.getByRole('heading', { name: '工作台题目 20', exact: true }))
    await page.locator('.category-manager > summary').click()
    await page.getByRole('button', { name: '新增分类', exact: true }).click()
    await page.getByLabel('新分类名称', { exact: true }).fill('仅查看，不保存')
    await page.getByRole('button', { name: '关闭分类管理', exact: true }).click()
    expect(
      await page.locator('.question-list-scroll').evaluate((element) => element.scrollTop),
    ).toBe(position)
    await inView(page.getByRole('heading', { name: '工作台题目 20', exact: true }))
  } finally {
    await stop(application)
  }
})

test('第二轮画面：空库主操作为导入，板块分组和配置摘要可见，主题字号守原范围', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await launchApplication(
    testDataDirectory,
    info.project.name,
    '学习总览',
  )
  try {
    await size(application)
    await inView(page.getByRole('button', { name: '导入题库', exact: true }))
    await expect(page.getByRole('button', { name: '配置一轮练习', exact: true })).toHaveCount(0)
    await openPage(page, '知识板块')
    await expect(page.getByLabel('题库快捷入口', { exact: true })).toBeVisible()
    await expect(
      page.getByRole('region', { name: '基础方向', exact: true }).locator('.board-card'),
    ).toHaveCount(15)
    await screenshot(page, info, 'boards-empty-1440-17.png')
    await openPage(page, '开始练习')
    await page.getByRole('button', { name: '练不会', exact: true }).click()
    await expect(page.getByLabel('当前练习筛选摘要', { exact: true })).toContainText('自评：不会')
    await expect(page.getByRole('button', { name: '填入条件', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: '开始练习', exact: true })).toBeDisabled()
    await screenshot(page, info, 'configuration-empty-1440-17.png')
  } finally {
    await stop(application)
  }
})
