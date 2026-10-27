import { resolve } from 'node:path'
import type { Page } from '@playwright/test'
import { BUILTIN_THEMES } from '../../src/shared/themes'
import { expect, openPage, test } from './helpers'
import { captureHistory, prepareHistory, selectHistoryQuestion, stop } from './history-helpers'
import {
  chooseTheme,
  installThemeFile,
  readThemes,
  themeBusinessSnapshot,
  verifyThemeTarget,
} from './theme-helpers'

const choices = [
  ...BUILTIN_THEMES.map((definition) => ({ id: definition.id, name: definition.name, file: null })),
  { id: 'local.paper-ink', name: '纸页墨色', file: 'paper-ink' },
  { id: 'local.circuit-blue', name: '电路夜航', file: 'circuit-blue' },
]
function rgb(hex: string) {
  return `rgb(${[1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16)).join(', ')})`
}
async function noPageOverflow(page: Page) {
  const dimensions = await page.evaluate(() => {
    const element = (
      globalThis as unknown as {
        document: { documentElement: { scrollWidth: number; clientWidth: number } }
      }
    ).document.documentElement
    return { width: element.scrollWidth, viewport: element.clientWidth }
  })
  expect(dimensions.width).toBe(dimensions.viewport)
}
for (const choice of choices) {
  test(`${choice.name}：五页/明暗及跟随系统/15与22px/900与1440窗口/离线无远程资源`, async ({
    testDataDirectory,
  }, info) => {
    const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
    const remote: string[] = [],
      errors: string[] = []
    page.on('request', (request) => {
      if (/^https?:/i.test(request.url())) remote.push(request.url())
    })
    page.on('pageerror', (error) => errors.push(error.message))
    try {
      await verifyThemeTarget(application, page, testDataDirectory, info.project.name)
      if (choice.file)
        await installThemeFile(
          application,
          page,
          resolve(`themes/examples/${choice.file}.ep-theme.json`),
        )
      const definition = (await readThemes(page)).entries.find(
        (entry) => entry.definition.id === choice.id,
      )!.definition
      const before = themeBusinessSnapshot(testDataDirectory)
      await page.context().setOffline(true)
      for (const mode of ['light', 'dark', 'system'] as const) {
        const size = mode === 'light' ? 15 : 22
        await page.emulateMedia({ colorScheme: mode === 'dark' ? 'light' : 'dark' })
        await chooseTheme(page, choice.name, mode, size)
        const colors = definition[mode === 'system' ? 'dark' : mode]
        await expect(page.locator('html')).toHaveAttribute('data-theme-id', choice.id)
        await expect(page.locator('html')).toHaveCSS('background-color', rgb(colors.background))
        if (mode === 'system') {
          await page.emulateMedia({ colorScheme: 'light' })
          await expect(page.locator('html')).toHaveCSS(
            'background-color',
            rgb(definition.light.background),
          )
          await page.emulateMedia({ colorScheme: 'dark' })
          await expect(page.locator('html')).toHaveCSS(
            'background-color',
            rgb(definition.dark.background),
          )
        }
        for (const width of [1440, 900]) {
          await application.evaluate(
            ({ BrowserWindow }, width) =>
              BrowserWindow.getAllWindows()[0]!.setBounds({ width, height: 1000 }),
            width,
          )
          await openPage(page, '板块')
          await expect(page.getByRole('searchbox', { name: '搜索板块', exact: true })).toBeVisible()
          await noPageOverflow(page)
          await selectHistoryQuestion(page)
          const reader = page.getByRole('article', { name: '题目内容', exact: true })
          await expect(reader.getByText('HISTORY-BODY-OLD-history-a-1', { exact: true })).toHaveCSS(
            'font-size',
            `${size}px`,
          )
          const reveal = page.getByRole('button', { name: '展开参考答案', exact: true })
          if (await reveal.isVisible()) await reveal.click()
          await expect(reader.locator('pre code')).toHaveCSS('font-size', `${size}px`)
          await noPageOverflow(page)
          await openPage(page, '学习记录')
          await expect(page.getByLabel('当前版本学习总览', { exact: true })).toBeVisible()
          await noPageOverflow(page)
          await openPage(page, '开始练习')
          await expect(page.getByLabel('练习模式', { exact: true })).toBeVisible()
          await noPageOverflow(page)
          await openPage(page, '设置与数据')
          await expect(page.getByRole('radio', { name: choice.name, exact: true })).toBeChecked()
          await noPageOverflow(page)
          if ((choice.id === 'builtin.claude' || choice.file) && mode !== 'system' && width === 900)
            await captureHistory(application, page, info, `${choice.id}-${mode}-${width}.png`)
        }
        expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
      }
      expect(remote).toEqual([])
      expect(errors).toEqual([])
      await info.attach('theme-layout-target.json', {
        body: JSON.stringify({
          themeId: choice.id,
          definition,
          widths: [1440, 900],
          fontSizes: [15, 22],
          modes: ['light', 'dark', 'system'],
          remote,
          errors,
        }),
        contentType: 'application/json',
      })
    } finally {
      await stop(application)
    }
  })
}
