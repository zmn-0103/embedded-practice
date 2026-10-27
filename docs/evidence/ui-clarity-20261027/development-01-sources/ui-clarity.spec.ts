import type { Page, TestInfo } from '@playwright/test'
import { BUILTIN_THEMES } from '../../src/shared/themes'
import { expect, openPage, test } from './helpers'
import { stop, withHistoryDatabase } from './history-helpers'
import { chooseTheme, verifyThemeTarget } from './theme-helpers'
import { noWorkbenchOverflow, prepareWorkbench, settleWorkbench } from './workbench-helpers'

async function capture(page: Page, info: TestInfo, name: string) {
  const path = info.outputPath(name)
  await page.screenshot({ path, fullPage: true })
  await info.attach(name, { path, contentType: 'image/png' })
}

function luminance(color: string) {
  const channels = color.match(/[\d.]+/g)?.map(Number)
  if (!channels || channels.length < 3) throw new Error(`无法解析实际颜色：${color}`)
  const linear = channels.slice(0, 3).map((channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return linear[0]! * 0.2126 + linear[1]! * 0.7152 + linear[2]! * 0.0722
}

for (const theme of BUILTIN_THEMES) {
  test(`占位提示：${theme.name}明暗两模式空白输入的实际对比度不少于4.5`, async ({
    testDataDirectory,
  }, info) => {
    const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
    try {
      const runtime = await verifyThemeTarget(
        application,
        page,
        testDataDirectory,
        info.project.name,
      )
      await chooseTheme(page, theme.name, 'system')
      await openPage(page, '开始练习')
      await page.getByRole('button', { name: '开始练习', exact: true }).click()
      const input = page.getByRole('textbox', { name: '我的答案', exact: true })
      const samples = []
      for (const mode of ['light', 'dark'] as const) {
        await page.emulateMedia({ colorScheme: mode })
        await expect(page.locator('html')).toHaveAttribute('data-theme', mode)
        await expect(input).toHaveValue('')
        const sample = await input.evaluate((element) => {
          const browser = globalThis as unknown as {
            getComputedStyle: (
              element: unknown,
              pseudo?: string,
            ) => {
              color: string
              backgroundColor: string
              opacity: string
              getPropertyValue: (property: string) => string
            }
          }
          const hint = browser.getComputedStyle(element, '::placeholder')
          const editor = browser.getComputedStyle(element)
          return {
            foreground: hint.color,
            background: editor.backgroundColor,
            opacity: hint.opacity,
            muted: editor.getPropertyValue('--muted').trim(),
            visible: element.matches(':placeholder-shown'),
          }
        })
        const foreground = luminance(sample.foreground)
        const background = luminance(sample.background)
        const ratio =
          (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05)
        expect(sample.visible).toBe(true)
        expect(sample.opacity).toBe('1')
        expect(ratio).toBeGreaterThanOrEqual(4.5)
        samples.push({ theme: theme.id, mode, ...sample, ratio })
        await capture(page, info, `${theme.id}-${mode}.png`)
      }
      await info.attach('contrast-and-runtime.json', {
        body: JSON.stringify({ runtime, samples }, null, 2),
        contentType: 'application/json',
      })
    } finally {
      await stop(application)
    }
  })
}

test('题库层级：草稿与生效条件分离，结果数/范围/清空集中且不创建练习', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  try {
    await page.getByLabel('专题', { exact: true }).selectOption('workbench-a')
    await expect(page.getByText('共 25 题', { exact: true })).toBeVisible()
    await expect(page.getByLabel('题库结果范围', { exact: true })).toContainText('工作台验收专题')
    const input = page.getByRole('searchbox', { name: '题库搜索', exact: true })
    const applied = page.getByLabel('题库生效条件', { exact: true })
    await input.fill('WORKBENCH-BODY-25')
    await expect(page.getByText('共 25 题', { exact: true })).toBeVisible()
    await expect(applied).not.toContainText('WORKBENCH-BODY-25')
    await expect(page.getByRole('status')).toContainText('条件已调整')
    await page.getByRole('button', { name: '筛选题库', exact: true }).click()
    await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
    await expect(applied).toHaveText('搜索：WORKBENCH-BODY-25')
    await capture(page, info, 'library-applied-1440.png')
    await input.fill('NO-MATCH-CLARITY')
    await expect(page.getByText('共 1 题', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: '筛选题库', exact: true }).click()
    await expect(page.getByText('共 0 题', { exact: true })).toBeVisible()
    await expect(applied).toHaveText('搜索：NO-MATCH-CLARITY')
    await expect(page.getByText('当前筛选没有匹配题目。', { exact: true })).toBeVisible()
    await expect(
      page.getByRole('button', { name: '清空题库筛选', exact: true }),
    ).toHaveAccessibleDescription('清空将恢复全部分类、全部专题和有效题目，并移除所有附加条件。')
    await page.getByRole('button', { name: '清空题库筛选', exact: true }).click()
    await expect(page.getByText('共 25 题', { exact: true })).toBeVisible()
    await expect(page.getByLabel('专题', { exact: true })).toHaveValue('')
    await expect(input).toHaveValue('')
    await expect(page.getByLabel('题库结果范围', { exact: true })).toHaveText(
      '全部分类 · 全部专题 · 有效题目',
    )
    expect(
      withHistoryDatabase(testDataDirectory, (db) =>
        db.prepare('SELECT count(*) AS total FROM practice_sessions').get(),
      ),
    ).toEqual({ total: 0 })
    for (const width of [1440, 900]) {
      await application.evaluate(
        ({ BrowserWindow }, width) => BrowserWindow.getAllWindows()[0]!.setContentSize(width, 900),
        width,
      )
      await settleWorkbench(page)
      await noWorkbenchOverflow(page)
      await capture(page, info, `library-clear-${width}.png`)
    }
  } finally {
    await stop(application)
  }
})

test('学习记录：清空列表筛选保留专题和归档范围，不改变上方统计', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  try {
    await openPage(page, '学习记录')
    await page.getByLabel('学习记录专题', { exact: true }).selectOption('workbench-a')
    await page.getByLabel('学习记录范围', { exact: true }).selectOption('archived')
    const summary = page.getByLabel('当前版本学习总览', { exact: true })
    await expect(page.getByText('共 0 题', { exact: true })).toBeVisible()
    const before = await summary.textContent()
    await expect(
      page.getByRole('button', { name: '清空题库筛选', exact: true }),
    ).toHaveAccessibleDescription('清空仅重置下方列表的附加条件，保留上方学习记录的范围。')
    await page.getByRole('button', { name: '清空题库筛选', exact: true }).click()
    await expect(page.getByLabel('题库结果范围', { exact: true })).toHaveText(
      '全部分类 · 工作台验收专题 · 归档题目',
    )
    await expect(page.getByLabel('学习记录专题', { exact: true })).toHaveValue('workbench-a')
    await expect(page.getByLabel('学习记录范围', { exact: true })).toHaveValue('archived')
    await expect(summary).toHaveText(before!)
  } finally {
    await stop(application)
  }
})

test('练习层级：揭晓是主要操作，自评提示说明自动保存推进，返回保存与恢复仍走原轮', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  try {
    await openPage(page, '开始练习')
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    await expect(page.locator('.practice-stage')).toHaveText('思考与作答查看参考答案后，再自行评价')
    await expect(page.locator('.practice-actions button.primary')).toHaveText('查看参考答案')
    await expect(page.getByRole('button', { name: '保存并返回', exact: true })).not.toHaveClass(
      /primary/,
    )
    await expect(page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
    const input = page.getByRole('textbox', { name: '我的答案', exact: true })
    await input.fill('UI层级验证的独立草稿\n    keep_original_queue();')
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await expect(page.locator('.practice-stage')).toContainText('选择自评后保存并进入下一题')
    await expect(page.locator('.practice-evaluation button[data-rating]')).toHaveCount(3)
    await capture(page, info, 'practice-revealed-1440.png')
    await page.getByRole('button', { name: '掌握', exact: true }).click()
    await expect(page.getByLabel('练习进度', { exact: true })).toContainText('第 2 / 20 题')
    await expect(page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: '上一题', exact: true }).click()
    await expect(input).toHaveValue('UI层级验证的独立草稿\n    keep_original_queue();')
    await expect(
      page.getByText('本轮自评：掌握，再次自评会更新本轮记录。', { exact: true }),
    ).toBeVisible()
    await page.getByRole('button', { name: '保存后返回', exact: true }).click()
    await page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(input).toHaveValue('UI层级验证的独立草稿\n    keep_original_queue();')
    await noWorkbenchOverflow(page)
  } finally {
    await stop(application)
  }
})
