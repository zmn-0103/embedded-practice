import type { ElectronApplication, Page } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import type { AppearanceSettings } from '../../src/shared/contracts/settings'
import { expect, launchApplication, openPage, test } from './helpers'
import {
  beginHistoryPractice,
  captureHistory,
  historySnapshot,
  prepareHistory,
  selectHistoryQuestion,
  stop,
  withHistoryDatabase,
} from './history-helpers'

const palettes = [
  { id: 'forest', name: '松间绿', light: 'rgb(245, 246, 244)', dark: 'rgb(20, 27, 24)' },
  { id: 'ocean', name: '晴空蓝', light: 'rgb(243, 245, 248)', dark: 'rgb(20, 27, 41)' },
  { id: 'sand', name: '暖沙金', light: 'rgb(247, 244, 238)', dark: 'rgb(36, 30, 22)' },
  { id: 'lilac', name: '暮山紫', light: 'rgb(245, 243, 248)', dark: 'rgb(33, 27, 41)' },
] as const

function stored(directory: string) {
  return withHistoryDatabase(directory, (database) =>
    database
      .prepare('SELECT theme,palette,font_size AS fontSize FROM appearance_settings WHERE id=1')
      .get(),
  )
}
async function choose(
  page: Page,
  name: string,
  theme: AppearanceSettings['theme'],
  fontSize: number,
) {
  await openPage(page, '设置与数据')
  await page.getByRole('radio', { name, exact: true }).check()
  await page.getByLabel('显示主题', { exact: true }).selectOption(theme)
  await page.getByLabel('正文字号', { exact: true }).selectOption(String(fontSize))
}
async function save(page: Page) {
  await page.getByRole('button', { name: '保存并应用', exact: true }).click()
  await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
}
async function closeNormally(application: ElectronApplication) {
  const closed = application.waitForEvent('close')
  await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.close())
  await closed
}
async function contrast(page: Page) {
  return page.evaluate(() => {
    const browser = globalThis as unknown as {
      document: { querySelector: (selector: string) => unknown }
      getComputedStyle: (element: unknown) => { color: string; backgroundColor: string }
    }
    const style = (selector: string) =>
      browser.getComputedStyle(browser.document.querySelector(selector))
    const luminance = (rgb: string) =>
      rgb
        .match(/[\d.]+/g)!
        .slice(0, 3)
        .map(Number)
        .map((value) => {
          const channel = value / 255
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
        })
        .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index]!, 0)
    const ratio = (a: string, b: string) => {
      const values = [luminance(a), luminance(b)].sort((left, right) => right - left)
      return (values[0]! + 0.05) / (values[1]! + 0.05)
    }
    const panel = style('.settings-pane'),
      description = style('.appearance-save-row .muted'),
      primary = style('.appearance-save-row button')
    return {
      body: ratio(panel.color, panel.backgroundColor),
      secondary: ratio(description.color, panel.backgroundColor),
      primary: ratio(primary.color, primary.backgroundColor),
    }
  })
}

for (const palette of palettes) {
  test(`${palette.name}明暗配色：局部预览、全局保存、阅读与对比度，不改变学习记录`, async ({
    testDataDirectory,
  }, info) => {
    const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
    try {
      const before = historySnapshot(testDataDirectory)
      const measurements = []
      for (const theme of ['light', 'dark'] as const) {
        const oldPalette = await page.locator('html').getAttribute('data-palette')
        const oldTheme = await page.locator('html').getAttribute('data-theme')
        const size = theme === 'light' ? 15 : 22
        await choose(page, palette.name, theme, size)
        await expect(page.locator('html')).toHaveAttribute('data-palette', oldPalette!)
        await expect(page.locator('html')).toHaveAttribute('data-theme', oldTheme!)
        await expect(page.getByLabel('显示设置局部预览', { exact: true })).toHaveCSS(
          'background-color',
          palette[theme],
        )
        const pageDescription = await page.locator('.brand-caption').evaluate(
          (element) =>
            (
              globalThis as unknown as {
                getComputedStyle: (element: unknown) => { color: string }
              }
            ).getComputedStyle(element).color,
        )
        await expect(page.locator('.appearance-save-row .muted')).toHaveCSS(
          'color',
          pageDescription,
        )
        await save(page)
        await expect(page.locator('html')).toHaveAttribute('data-palette', palette.id)
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        await expect(page.locator('html')).toHaveCSS('background-color', palette[theme])
        expect(stored(testDataDirectory)).toEqual({ theme, palette: palette.id, fontSize: size })
        const ratios = await contrast(page)
        for (const value of Object.values(ratios)) expect(value).toBeGreaterThanOrEqual(4.5)
        measurements.push({ theme, ratios })
        await page.getByRole('radio', { name: palette.name, exact: true }).scrollIntoViewIfNeeded()
        await captureHistory(application, page, info, `palette-${palette.id}-${theme}.png`)
        await selectHistoryQuestion(page)
        await page.getByRole('button', { name: '展开参考答案', exact: true }).click()
        await expect(page.locator('.question-reader pre code')).toHaveText('int value = 1;\n')
        await expect(page.locator('.question-reader pre code')).toHaveCSS('font-size', `${size}px`)
        await expect(page.locator('.question-reader img')).toHaveCSS('filter', 'none')
        await openPage(page, '学习记录')
        await expect(page.getByLabel('当前版本学习总览', { exact: true })).toBeVisible()
        await openPage(page, '开始练习')
        await expect(page.locator('html')).toHaveAttribute('data-palette', palette.id)
        expect(historySnapshot(testDataDirectory)).toEqual(before)
      }
      await info.attach(`palette-${palette.id}-contrast.json`, {
        body: JSON.stringify(measurements),
        contentType: 'application/json',
      })
    } finally {
      await stop(application)
    }
  })
}

test('配色真实写失败/丢响应保留选择，键盘切换后正常重开保留草稿', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  let reopened: ElectronApplication | undefined
  try {
    await beginHistoryPractice(page)
    await page
      .getByRole('textbox', { name: '我的答案', exact: true })
      .fill('主题切换不能改变草稿\n    int kept = 7;')
    await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
    const before = historySnapshot(testDataDirectory)
    withHistoryDatabase(
      testDataDirectory,
      (database) =>
        database.exec(
          "CREATE TRIGGER fail_palette BEFORE UPDATE ON appearance_settings BEGIN SELECT RAISE(ABORT,'配色写入失败'); END",
        ),
      false,
    )
    await choose(page, '晴空蓝', 'dark', 22)
    await page.getByRole('button', { name: '保存并应用', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('显示设置暂不可用')
    await expect(page.getByRole('radio', { name: '晴空蓝', exact: true })).toBeChecked()
    await expect(page.locator('html')).toHaveAttribute('data-palette', 'forest')
    expect(stored(testDataDirectory)).toEqual({ theme: 'system', palette: 'forest', fontSize: 17 })
    withHistoryDatabase(
      testDataDirectory,
      (database) => database.exec('DROP TRIGGER fail_palette'),
      false,
    )
    await application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('settings:save')
      let lost = false
      ipcMain.removeHandler('settings:save')
      ipcMain.handle('settings:save', async (...args) => {
        const result = await original(...args)
        if (!lost && result.ok) {
          lost = true
          return undefined
        }
        return result
      })
    })
    await page.getByRole('button', { name: '重试保存并应用', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('显示设置保存结果尚未确认')
    expect(stored(testDataDirectory)).toEqual({ theme: 'dark', palette: 'ocean', fontSize: 22 })
    await expect(page.locator('html')).toHaveAttribute('data-palette', 'forest')
    await page.getByRole('button', { name: '重试保存并应用', exact: true }).click()
    await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
    const ocean = page.getByRole('radio', { name: '晴空蓝', exact: true })
    await ocean.focus()
    await ocean.press('ArrowRight')
    await expect(page.getByRole('radio', { name: '暖沙金', exact: true })).toBeChecked()
    await expect(page.locator('html')).toHaveAttribute('data-palette', 'ocean')
    await save(page)
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    await closeNormally(application)
    const next = await launchApplication(testDataDirectory, info.project.name)
    reopened = next.application
    await expect(next.page.locator('html')).toHaveAttribute('data-palette', 'sand')
    await expect(next.page.locator('html')).toHaveAttribute('data-theme', 'dark')
    expect(stored(testDataDirectory)).toEqual({ theme: 'dark', palette: 'sand', fontSize: 22 })
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    await next.page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(next.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      '主题切换不能改变草稿\n    int kept = 7;',
    )
  } finally {
    await stop(application)
    if (reopened) await stop(reopened)
  }
})

test('损坏配色明确报错且不伪造默认成功，修复重读保持学习数据', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  try {
    const before = historySnapshot(testDataDirectory)
    const rejected = await page.evaluate(() =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.settings.save({
        theme: 'light',
        palette: 'custom' as 'forest',
        fontSize: 17,
      }),
    )
    expect(rejected).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } })
    withHistoryDatabase(
      testDataDirectory,
      (database) =>
        database.exec(
          "PRAGMA ignore_check_constraints=ON; UPDATE appearance_settings SET palette='custom'",
        ),
      false,
    )
    await page.reload()
    await expect(page.getByRole('alert')).toContainText('显示设置暂不可用')
    await openPage(page, '设置与数据')
    await expect(page.getByRole('radio')).toHaveCount(0)
    await expect(page.getByRole('button', { name: '保存并应用', exact: true })).toHaveCount(0)
    expect(stored(testDataDirectory)).toEqual({ theme: 'system', palette: 'custom', fontSize: 17 })
    withHistoryDatabase(
      testDataDirectory,
      (database) =>
        database.exec("UPDATE appearance_settings SET palette='lilac',theme_id='builtin.lilac'"),
      false,
    )
    await page.getByRole('button', { name: '重试读取显示设置', exact: true }).click()
    await expect(page.getByRole('radio', { name: '暮山紫', exact: true })).toBeChecked()
    await expect(page.locator('html')).toHaveAttribute('data-palette', 'lilac')
    expect(historySnapshot(testDataDirectory)).toEqual(before)
  } finally {
    await stop(application)
  }
})

test('配色跟随系统、窄窗口、双环输入焦点和减少动态效果保持可操作', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  try {
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
    await choose(page, '暮山紫', 'system', 22)
    await save(page)
    await expect(page.locator('html')).toHaveCSS('background-color', palettes[3].dark)
    await expect(page.locator('body')).toHaveCSS('font-weight', '360')
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
    await expect(page.locator('html')).toHaveCSS('background-color', palettes[3].light)
    await expect(page.locator('body')).toHaveCSS('font-weight', '400')
    await application.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]?.setSize(900, 620),
    )
    await expect(page.locator('.page-navigation')).toHaveCSS('flex-direction', 'column')
    const geometry = await page.evaluate(() => {
      const browser = globalThis as unknown as {
        document: { documentElement: { scrollWidth: number; clientWidth: number } }
      }
      return {
        content: browser.document.documentElement.scrollWidth,
        viewport: browser.document.documentElement.clientWidth,
      }
    })
    expect(geometry.content).toBeLessThanOrEqual(geometry.viewport)
    await beginHistoryPractice(page)
    const input = page.getByRole('textbox', { name: '我的答案', exact: true })
    await input.focus()
    await input.fill('窄窗口输入仍然可见')
    await expect(input).toHaveCSS('outline-style', 'none')
    await expect(input).not.toHaveCSS('box-shadow', 'none')
    await expect(page.locator('.practice-save')).toHaveText('已保存')
    await page.getByRole('button', { name: '查看参考答案', exact: true }).scrollIntoViewIfNeeded()
    await expect(page.getByRole('button', { name: '查看参考答案', exact: true })).toBeInViewport()
    await captureHistory(application, page, info, 'palette-narrow-input.png')
    await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
    await page.getByText('筛选练习题目', { exact: true }).click()
    await expect(page.getByLabel('练习搜索', { exact: true })).toBeVisible()
    await page.getByText('筛选练习题目', { exact: true }).click()
    await expect(page.getByLabel('练习搜索', { exact: true })).not.toBeVisible()
  } finally {
    await stop(application)
  }
})

test('复制成功反馈2.5秒自熄，重复复制重置、错误保留且切题拒绝晚到响应', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  try {
    await selectHistoryQuestion(page)
    await page.getByRole('button', { name: '展开参考答案', exact: true }).click()
    const block = page.locator('.question-reader .code-block').first()
    await application.evaluate(({ clipboard }) => {
      clipboard.writeText = (text) => Reflect.set(globalThis, 'paletteCopied', text)
    })
    const copy = block.getByRole('button', { name: '复制代码', exact: true })
    await copy.click()
    await expect(block.getByText('已复制', { exact: true })).toBeVisible()
    await copy.click()
    await expect(block.locator('.copy-feedback[data-success=true]')).toHaveCount(1)
    expect(await application.evaluate(() => Reflect.get(globalThis, 'paletteCopied'))).toBe(
      'int value = 1;\n',
    )
    await expect(block.locator('.copy-feedback')).toHaveCount(0, { timeout: 4000 })
    await application.evaluate(({ clipboard }) => {
      clipboard.writeText = () => {
        throw new Error('测试复制失败')
      }
    })
    await copy.click()
    await expect(block.locator('.copy-feedback[data-success=false]')).toBeVisible()
    // 此等待验证错误不会被成功自熄计时清除，不用于等待业务状态。
    await page.waitForTimeout(2700)
    await expect(block.locator('.copy-feedback[data-success=false]')).toBeVisible()
    await application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:copy-code')
      ipcMain.removeHandler('library:copy-code')
      ipcMain.handle(
        'library:copy-code',
        (...args) =>
          new Promise((resolve) =>
            Reflect.set(globalThis, 'releasePaletteCopy', async () =>
              resolve(await original(...args)),
            ),
          ),
      )
    })
    await copy.click()
    await expect
      .poll(() => application.evaluate(() => typeof Reflect.get(globalThis, 'releasePaletteCopy')))
      .toBe('function')
    await page.getByRole('button', { name: '收起参考答案', exact: true }).click()
    await application.evaluate(() => Reflect.get(globalThis, 'releasePaletteCopy')())
    await page.getByRole('button', { name: '展开参考答案', exact: true }).click()
    await expect(block.locator('.copy-feedback')).toHaveCount(0)
  } finally {
    await stop(application)
  }
})
