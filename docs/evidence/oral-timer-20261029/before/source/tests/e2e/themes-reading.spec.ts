import { createHash } from 'node:crypto'
import { copyFile, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { Page } from '@playwright/test'
import { expect, openPage, test } from './helpers'
import { captureHistory, importHistoryFiles, prepareHistory, stop } from './history-helpers'
import { chooseTheme, installThemeFile, themeBusinessSnapshot } from './theme-helpers'

async function prepareReading(directory: string, project: string) {
  const initial = await prepareHistory(directory, project)
  try {
    const image = resolve(
      'docs/evidence/m5d/samples-01/input/中文 空格阅读样本/assets/大图 PNG.png',
    )
    expect(
      createHash('sha256')
        .update(await readFile(image))
        .digest('hex'),
    ).toBe('0460347fe10cf038090f321c96041b727cf361c45ee2bd540dfcbd7c6de15234')
    await copyFile(image, join(initial.folder, 'assets/theme-large.png'))
    const longCode = Array.from(
      { length: 183 },
      (_, index) => `uint32_t theme_${index} = ${index}; /* ${'WIDE_THEME_CODE_'.repeat(20)} */`,
    ).join('\n')
    const longAnswer = Array.from(
      { length: 60 },
      (_, index) => `第${index + 1}段阅读样本：${'长答案保持原顺序与可达操作。'.repeat(8)}`,
    ).join('\n\n')
    const source =
      `---\nschema_version: 1\ntopic_id: theme-many\ntopic_title: 主题长内容\n---\n\n` +
      Array.from({ length: 25 }, (_, index) => {
        const n = index + 1
        return `## q-${n} | 主题阅读 ${n}\n\n标签：主题样本\n难度：基础\n\n### 题目\n\nTHEME-QUESTION-${n}\n\n${n === 25 ? `\`\`\`c\n${longCode}\n\`\`\`\n\n![主题大图](assets/theme-large.png)\n\n` : ''}### 参考答案\n\n${n === 25 ? longAnswer + '\n\nTHEME-ANSWER-END' : `THEME-ANSWER-${n}`}\n\n`
      }).join('')
    const file = join(initial.folder, '主题长内容.md')
    await writeFile(file, source)
    await importHistoryFiles(initial.application, initial.page, [file])
    return initial
  } catch (error) {
    await stop(initial.application)
    throw error
  }
}
async function noDocumentOverflow(page: Page) {
  const dimensions = await page.locator('html').evaluate((element) => ({
    width: Number(Reflect.get(element, 'scrollWidth')),
    viewport: Number(Reflect.get(element, 'clientWidth')),
  }))
  expect(dimensions.width).toBe(dimensions.viewport)
}

test('跨主题保留题库筛选/分页/选中与阅读组件，183行代码/60段答案/大图弹窗在宽窄窗口可用', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareReading(testDataDirectory, info.project.name)
  try {
    await installThemeFile(application, page, resolve('themes/examples/paper-ink.ep-theme.json'))
    await openPage(page, '题库')
    await page.getByLabel('专题', { exact: true }).selectOption('theme-many')
    await page.getByRole('searchbox', { name: '题库搜索', exact: true }).fill('主题阅读')
    await page.getByLabel('题库难度', { exact: true }).selectOption('基础')
    await page.getByRole('button', { name: '筛选题库', exact: true }).click()
    const pagination = page.getByRole('navigation', { name: '题目分页', exact: true })
    await pagination.getByRole('button', { name: '下一页', exact: true }).click()
    const selected = page
      .getByRole('complementary', { name: '题目列表', exact: true })
      .getByRole('button', { name: / · q-25(?:\s|$)/ })
    await selected.click()
    const reader = page.getByRole('article', { name: '题目内容', exact: true })
    await reader.evaluate((element) => Reflect.set(element, 'themeReaderProbe', 'same-reader'))
    const before = themeBusinessSnapshot(testDataDirectory)
    for (const [name, mode, width] of [
      ['Claude 风格', 'light', 1440],
      ['Claude 风格', 'dark', 900],
      ['纸页墨色', 'dark', 900],
    ] as const) {
      await chooseTheme(page, name, mode, 22)
      await application.evaluate(
        ({ BrowserWindow }, width) =>
          BrowserWindow.getAllWindows()[0]!.setBounds({ width, height: 1000 }),
        width,
      )
      await openPage(page, '题库')
      const returnToList = page.getByRole('button', { name: '返回题目列表', exact: true })
      const narrow = await returnToList.isVisible()
      if (narrow) await returnToList.click()
      await expect(page.getByRole('searchbox', { name: '题库搜索', exact: true })).toHaveValue(
        '主题阅读',
      )
      await expect(page.getByLabel('题库难度', { exact: true })).toHaveValue('基础')
      await expect(pagination).toContainText('2 / 2')
      await expect(selected).toHaveAttribute('aria-current', 'true')
      if (narrow) await selected.click()
      expect(await reader.evaluate((element) => Reflect.get(element, 'themeReaderProbe'))).toBe(
        'same-reader',
      )
      const code = reader.locator('.code-block pre').first()
      const overflow = await code.evaluate(
        (element) =>
          Number(Reflect.get(element, 'scrollWidth')) > Number(Reflect.get(element, 'clientWidth')),
      )
      expect(overflow).toBe(true)
      await code.evaluate((element) => Reflect.set(element, 'scrollLeft', 500))
      expect(
        await code.evaluate((element) => Number(Reflect.get(element, 'scrollLeft'))),
      ).toBeGreaterThan(0)
      const image = reader.getByRole('button', { name: '放大查看：主题大图', exact: true })
      await image.click()
      const dialog = page.getByRole('dialog', { name: '图片预览：主题大图', exact: true })
      await expect(dialog).toBeVisible()
      await expect
        .poll(() =>
          dialog
            .getByRole('img')
            .evaluate((element) => Number(Reflect.get(element, 'naturalWidth'))),
        )
        .toBe(2560)
      await dialog.getByRole('button', { name: '放大图片', exact: true }).click()
      await expect(dialog).toContainText('150%')
      await dialog.getByRole('button', { name: '关闭图片', exact: true }).click()
      await expect(image).toBeFocused()
      const reveal = reader.getByRole('button', { name: '展开参考答案', exact: true })
      if (await reveal.isVisible()) await reveal.click()
      await reader.getByText('THEME-ANSWER-END', { exact: true }).scrollIntoViewIfNeeded()
      await expect(reader.getByText('THEME-ANSWER-END', { exact: true })).toBeVisible()
      await noDocumentOverflow(page)
      expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
    }
    const returnToList = page.getByRole('button', { name: '返回题目列表', exact: true })
    if (await returnToList.isVisible()) await returnToList.click()
    await page.getByRole('searchbox', { name: '题库搜索', exact: true }).fill('没有匹配的主题样本')
    await page.getByRole('button', { name: '筛选题库', exact: true }).click()
    await expect(page.getByText('当前筛选没有匹配题目。', { exact: true })).toBeVisible()
    await chooseTheme(page, 'Claude 风格', 'dark', 22)
    await openPage(page, '题库')
    await expect(page.getByRole('searchbox', { name: '题库搜索', exact: true })).toHaveValue(
      '没有匹配的主题样本',
    )
    await expect(page.getByText('当前筛选没有匹配题目。', { exact: true })).toBeVisible()
  } finally {
    await stop(application)
  }
})

test('Claude长内容练习：宽屏右侧属性/窄屏可展开辅助、输入首行与底部操作可达，答案严格揭晓', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareReading(testDataDirectory, info.project.name)
  try {
    await chooseTheme(page, 'Claude 风格', 'dark', 22)
    await openPage(page, '开始练习')
    await page.getByLabel('练习专题', { exact: true }).selectOption('theme-many')
    await page.locator('.practice-filter-options > summary').click()
    await page.getByRole('searchbox', { name: '练习搜索', exact: true }).fill('主题阅读 25')
    await expect(page.getByText('匹配 1 题', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    for (const width of [1440, 900]) {
      await application.evaluate(
        ({ BrowserWindow }, width) =>
          BrowserWindow.getAllWindows()[0]!.setBounds({ width, height: 1000 }),
        width,
      )
      await expect(page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
      const auxiliary = page.getByLabel('练习辅助面板', { exact: true })
      await expect(page.locator('.practice-heading')).toContainText('主题长内容')
      await expect(auxiliary).toContainText('已揭晓')
      if (width === 900) {
        await page.getByRole('button', { name: '隐藏辅助面板', exact: true }).click()
        await expect(auxiliary).toBeHidden()
        await page.getByRole('button', { name: '显示辅助面板', exact: true }).click()
        await expect(auxiliary).toBeVisible()
      }
      await page.locator('.practice-heading').scrollIntoViewIfNeeded()
      await captureHistory(application, page, info, `claude-practice-${width}.png`)
      const input = page.getByRole('textbox', { name: '我的答案', exact: true })
      const imagesBeforeFocus = await page
        .locator('.practice-reading img')
        .evaluateAll((elements) =>
          elements.map((element) => ({
            complete: Reflect.get(element, 'complete'),
            width: Reflect.get(element, 'naturalWidth'),
            height: Reflect.get(element, 'clientHeight'),
          })),
        )
      await input.focus()
      await page
        .locator('.practice-reading img')
        .evaluateAll((elements) =>
          Promise.all(
            elements.map((element) =>
              (element as unknown as { decode: () => Promise<void> }).decode(),
            ),
          ),
        )
      await page.evaluate(
        () =>
          new Promise<void>((done) =>
            (
              globalThis as unknown as { requestAnimationFrame: (callback: () => void) => number }
            ).requestAnimationFrame(() =>
              (
                globalThis as unknown as { requestAnimationFrame: (callback: () => void) => number }
              ).requestAnimationFrame(() => done()),
            ),
          ),
      )
      const inputBounds = await input.boundingBox(),
        actions = await page.locator('.practice-actions').boundingBox()
      await info.attach(`focus-geometry-${width}.json`, {
        body: JSON.stringify({
          inputBounds,
          actions,
          imagesBeforeFocus,
          imagesAfterFocus: await page.locator('.practice-reading img').evaluateAll((elements) =>
            elements.map((element) => ({
              complete: Reflect.get(element, 'complete'),
              width: Reflect.get(element, 'naturalWidth'),
              height: Reflect.get(element, 'clientHeight'),
            })),
          ),
          focused: await input.evaluate((element) => Reflect.get(element, 'id')),
        }),
        contentType: 'application/json',
      })
      expect(inputBounds).not.toBeNull()
      expect(actions).not.toBeNull()
      expect(inputBounds!.y).toBeGreaterThanOrEqual(0)
      expect(inputBounds!.y + 50).toBeLessThan(actions!.y)
      await expect(page.getByRole('button', { name: '查看参考答案', exact: true })).toBeVisible()
      await noDocumentOverflow(page)
    }
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await page.getByText('THEME-ANSWER-END', { exact: true }).scrollIntoViewIfNeeded()
    await expect(page.getByRole('button', { name: '掌握', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ })).toBeVisible()
    const finalActions = await page.locator('.practice-actions').boundingBox()
    const viewportHeight = await page
      .locator('html')
      .evaluate((element) => Number(Reflect.get(element, 'clientHeight')))
    expect(finalActions!.y).toBeGreaterThanOrEqual(0)
    expect(finalActions!.y + finalActions!.height).toBeLessThanOrEqual(viewportHeight)
  } finally {
    await stop(application)
  }
})
