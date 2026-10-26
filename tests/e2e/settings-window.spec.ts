import { writeFile } from 'node:fs/promises'
import type { ElectronApplication, Page } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import type { AppearanceSettings } from '../../src/shared/contracts/settings'
import { expect, launchApplication, openPage, test } from './helpers'
import {
  beginHistoryPractice,
  captureHistory,
  historyBank,
  historySnapshot,
  importHistoryFiles,
  prepareHistory,
  selectHistoryQuestion,
  stop,
  withHistoryDatabase,
} from './history-helpers'

function stored(directory: string) {
  return withHistoryDatabase(directory, (db) =>
    db.prepare('SELECT id, theme, font_size, palette FROM appearance_settings ORDER BY id').all(),
  )
}
async function save(page: Page, theme: AppearanceSettings['theme'], fontSize: number) {
  await openPage(page, '设置与数据')
  await page.getByLabel('显示主题', { exact: true }).selectOption(theme)
  await page.getByLabel('正文字号', { exact: true }).selectOption(String(fontSize))
  await page.getByRole('button', { name: '保存并应用', exact: true }).click()
  await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
  await expect(page.locator('html')).toHaveAttribute('data-font-size', String(fontSize))
}
async function normalClose(application: ElectronApplication) {
  const finished = application.waitForEvent('close')
  await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.close())
  await finished
}
async function colors(page: Page, dark: boolean) {
  await expect(page.locator('html')).toHaveCSS(
    'background-color',
    dark ? 'rgb(20, 27, 24)' : 'rgb(245, 246, 244)',
  )
  await expect(page.locator('body')).toHaveCSS(
    'color',
    dark ? 'rgb(228, 237, 231)' : 'rgb(32, 51, 45)',
  )
}

test('四入口初始空库、独立页面、地址与显示默认值保持', async ({ testDataDirectory }, info) => {
  const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  try {
    const url = page.url()
    await openPage(page, '开始练习')
    await expect(page.getByRole('heading', { name: '开始一轮练习' })).toBeVisible()
    await expect(page.getByRole('button', { name: '开始练习', exact: true })).toBeDisabled()
    await expect(page.getByRole('button', { name: '导入题库', exact: true })).not.toBeVisible()
    await openPage(page, '题库')
    await expect(page.getByRole('button', { name: '导入题库', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: '开始一轮练习' })).not.toBeVisible()
    await openPage(page, '学习记录')
    await expect(page.getByLabel('当前版本学习总览', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: '导入题库', exact: true })).not.toBeVisible()
    await openPage(page, '设置与数据')
    await expect(page.getByLabel('显示主题', { exact: true })).toHaveValue('system')
    await expect(page.getByLabel('正文字号', { exact: true })).toHaveValue('17')
    expect(stored(testDataDirectory)).toEqual([
      { id: 1, theme: 'system', font_size: 17, palette: 'forest' },
    ])
    expect(page.url()).toBe(url)
    await openPage(page, '备份恢复')
    await expect(page.getByRole('button', { name: '导出完整备份', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: '选择备份并预览', exact: true })).toBeVisible()
    expect(
      await page
        .getByLabel('完整备份与恢复预览', { exact: true })
        .getByRole('button', { name: /备份|恢复/ })
        .count(),
    ).toBe(2)
    expect(historySnapshot(testDataDirectory).questions).toEqual([])
    await captureHistory(application, page, info, 'settings-default.png')
  } finally {
    await stop(application)
  }
})

test('系统与手动主题、15/17/22px 实际正文代码表格输入框及隐藏答案', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareHistory(testDataDirectory, info.project.name)
  try {
    await writeFile(
      file,
      historyBank().replace(
        'HISTORY-BODY-OLD-history-a-1',
        'HISTORY-BODY-OLD-history-a-1\n\n| 项目 | 内容 |\n| --- | --- |\n| 字号 | SETTINGS-TABLE |',
      ),
    )
    await importHistoryFiles(application, page, [file])
    await page.emulateMedia({ colorScheme: 'dark' })
    await colors(page, true)
    await page.emulateMedia({ colorScheme: 'light' })
    await colors(page, false)
    let active = false
    for (const [theme, size, systemDark] of [
      ['light', 15, true],
      ['system', 17, false],
      ['dark', 22, false],
    ] as const) {
      const before = historySnapshot(testDataDirectory)
      await page.emulateMedia({ colorScheme: systemDark ? 'dark' : 'light' })
      await save(page, theme, size)
      await colors(page, theme === 'dark')
      expect(historySnapshot(testDataDirectory)).toEqual(before)
      await captureHistory(application, page, info, `settings-${theme}-${size}.png`)
      await selectHistoryQuestion(page)
      const body = page.getByRole('article', { name: '题目内容' })
      await expect(body.getByText('HISTORY-BODY-OLD-history-a-1', { exact: true })).toHaveCSS(
        'font-size',
        `${size}px`,
      )
      await expect(body.getByRole('table')).toHaveCSS('font-size', `${size}px`)
      await page.getByRole('button', { name: '展开参考答案', exact: true }).click()
      await expect(body.locator('pre code')).toHaveCSS('font-size', `${size}px`)
      await expect(body.locator('.hljs-type').first()).toHaveCSS(
        'color',
        theme === 'dark' ? 'rgb(212, 181, 255)' : 'rgb(129, 85, 187)',
      )
      await body.getByRole('table').scrollIntoViewIfNeeded()
      await captureHistory(application, page, info, `reading-${theme}-${size}.png`)
      if (active) {
        await openPage(page, '开始练习')
        await page.getByRole('button', { name: '继续练习', exact: true }).click()
      } else {
        await beginHistoryPractice(page)
        active = true
      }
      const input = page.getByRole('textbox', { name: '我的答案', exact: true })
      await expect(input).toHaveCSS('font-size', `${size}px`)
      expect(await page.locator('body').ariaSnapshot()).not.toContain('HISTORY-ANSWER')
      const navigation = page.getByRole('navigation', { name: '主要页面', exact: true })
      await expect(navigation).toBeVisible()
      await expect(navigation.getByRole('link')).toHaveCount(6)
      for (const link of await navigation.getByRole('link').all())
        await expect(link).toHaveAttribute('aria-disabled', 'true')
      await input.scrollIntoViewIfNeeded()
      await captureHistory(application, page, info, `practice-${theme}-${size}.png`)
      await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
    }
    await info.attach('appearance-rendering.json', {
      body: JSON.stringify({
        settings: stored(testDataDirectory),
        state: historySnapshot(testDataDirectory),
      }),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})

test('显示设置正常关闭独立重开，保留草稿位置自评收藏与历史', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  let reopened: ElectronApplication | undefined
  try {
    const favorite = await page.evaluate(() =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.library.setFavorite({
        topicId: 'history-a',
        questionId: 'q-1',
        favorite: true,
      }),
    )
    expect(favorite.ok).toBe(true)
    await beginHistoryPractice(page)
    await page.getByRole('textbox', { name: '我的答案', exact: true }).fill('第一题真实作答')
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await page.getByRole('button', { name: '掌握', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toContainText('第 2 / 2')
    const draft = '设置重开草稿\nint saved = 22;'
    await page.getByRole('textbox', { name: '我的答案', exact: true }).fill(draft)
    await page.getByRole('button', { name: /^(?:保存并返回|返回首页)$/ }).click()
    await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
    const before = historySnapshot(testDataDirectory)
    await save(page, 'dark', 22)
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    await normalClose(application)
    const next = await launchApplication(testDataDirectory, info.project.name)
    reopened = next.application
    await expect(next.page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(next.page.locator('html')).toHaveAttribute('data-font-size', '22')
    expect(stored(testDataDirectory)).toEqual([
      { id: 1, theme: 'dark', font_size: 22, palette: 'forest' },
    ])
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    await next.page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(next.page.getByLabel('练习进度')).toHaveText('第 2 / 2 题 · 顺序练习')
    await expect(next.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      draft,
    )
    expect(await next.page.locator('body').ariaSnapshot()).not.toContain('HISTORY-ANSWER')
    await info.attach('appearance-reopened.json', {
      body: JSON.stringify({
        settings: stored(testDataDirectory),
        before,
        after: historySnapshot(testDataDirectory),
      }),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
    if (reopened) await stop(reopened)
  }
})

test('真实设置写入失败及提交后响应丢失，原目标重试不改变学习数据', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  try {
    const before = historySnapshot(testDataDirectory)
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER fail_appearance BEFORE UPDATE ON appearance_settings BEGIN SELECT RAISE(ABORT, '显示设置测试写入失败'); END",
        ),
      false,
    )
    await openPage(page, '设置与数据')
    await page.getByLabel('显示主题', { exact: true }).selectOption('dark')
    await page.getByLabel('正文字号', { exact: true }).selectOption('22')
    await page.getByRole('button', { name: '保存并应用', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('显示设置暂不可用')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'system')
    await expect(page.locator('html')).toHaveAttribute('data-font-size', '17')
    await expect(page.getByLabel('显示主题', { exact: true })).toHaveValue('dark')
    await expect(page.getByLabel('正文字号', { exact: true })).toHaveValue('22')
    expect(stored(testDataDirectory)).toEqual([
      { id: 1, theme: 'system', font_size: 17, palette: 'forest' },
    ])
    withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER fail_appearance'), false)
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
    expect(stored(testDataDirectory)).toEqual([
      { id: 1, theme: 'dark', font_size: 22, palette: 'forest' },
    ])
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'system')
    await page.getByRole('button', { name: '重试保存并应用', exact: true }).click()
    await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    expect(stored(testDataDirectory)).toEqual([
      { id: 1, theme: 'dark', font_size: 22, palette: 'forest' },
    ])
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    await info.attach('appearance-write-retries.json', {
      body: JSON.stringify({ settings: stored(testDataDirectory), before, unchanged: true }),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})

test('损坏设置读取报错且不伪造默认成功，修复重读保留业务数据', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  try {
    const before = historySnapshot(testDataDirectory)
    // 只在受限临时库构造坏行；关闭连接后 PRAGMA 不影响应用连接。
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec('PRAGMA ignore_check_constraints=ON; UPDATE appearance_settings SET font_size=99'),
      false,
    )
    await page.reload()
    await expect(page.getByRole('alert')).toContainText('显示设置暂不可用')
    await openPage(page, '设置与数据')
    await expect(page.getByText('尚未读取到已保存的显示设置。', { exact: true })).toBeVisible()
    expect(await page.getByLabel('显示主题', { exact: true }).count()).toBe(0)
    expect(await page.getByRole('button', { name: '保存并应用', exact: true }).count()).toBe(0)
    expect(stored(testDataDirectory)).toEqual([
      { id: 1, theme: 'system', font_size: 99, palette: 'forest' },
    ])
    withHistoryDatabase(
      testDataDirectory,
      (db) => db.exec("UPDATE appearance_settings SET theme='light', font_size=16"),
      false,
    )
    await page.getByRole('button', { name: '重试读取显示设置', exact: true }).click()
    await expect(page.getByLabel('显示主题', { exact: true })).toHaveValue('light')
    await expect(page.locator('html')).toHaveAttribute('data-font-size', '16')
    expect(historySnapshot(testDataDirectory)).toEqual(before)
  } finally {
    await stop(application)
  }
})

for (const fail of [false, true]) {
  test(`设置保存处理中正常关闭等待结果，${fail ? '失败返回窗口后重试' : '成功关闭独立重开'}`, async ({
    testDataDirectory,
  }, info) => {
    const { application, page } = await launchApplication(
      testDataDirectory,
      info.project.name,
      '设置与数据',
    )
    let reopened: ElectronApplication | undefined
    try {
      await application.evaluate(({ ipcMain, BrowserWindow, dialog }, rejectSave) => {
        const handlers = Reflect.get(ipcMain, '_invokeHandlers')
        const original = handlers.get('settings:save')
        const finish = handlers.get('practice:finish-close')
        const control = {
          started: 0,
          finish: 0,
          dialogs: 0,
          closeEvents: 0,
          saved: undefined as boolean | undefined,
          release: undefined as (() => void) | undefined,
        }
        Reflect.set(globalThis, 'settingsCloseControl', control)
        ipcMain.removeHandler('settings:save')
        ipcMain.handle('settings:save', async (...args) => {
          control.started++
          if (control.started === 1) {
            const result = rejectSave
              ? {
                  ok: false,
                  error: { code: 'DATABASE_UNAVAILABLE', message: '显示设置测试保存失败。' },
                }
              : await original(...args)
            await new Promise<void>((done) => {
              control.release = done
            })
            return result
          }
          return original(...args)
        })
        ipcMain.removeHandler('practice:finish-close')
        ipcMain.handle('practice:finish-close', async (...args) => {
          control.finish++
          control.saved = args[1].saved
          return finish(...args)
        })
        dialog.showMessageBox = async () => {
          control.dialogs++
          return { response: 0, checkboxChecked: false }
        }
        BrowserWindow.getAllWindows()[0]!.on('close', () => {
          control.closeEvents++
        })
      }, fail)
      const state = () =>
        application.evaluate(() => {
          const { started, finish, dialogs, saved, closeEvents } = Reflect.get(
            globalThis,
            'settingsCloseControl',
          )
          return { started, finish, dialogs, saved, closeEvents }
        })
      await page.getByLabel('显示主题', { exact: true }).selectOption('dark')
      await page.getByLabel('正文字号', { exact: true }).selectOption('21')
      await page.getByRole('button', { name: '保存并应用', exact: true }).click()
      await expect.poll(async () => (await state()).started).toBe(1)
      await expect(page.getByLabel('显示主题', { exact: true })).toBeDisabled()
      const link = page
        .getByRole('navigation', { name: '主要页面' })
        .getByRole('link', { name: '题库', exact: true })
      await expect(link).toHaveAttribute('aria-disabled', 'true')
      await link.focus()
      await link.press('Enter')
      await expect(page.getByRole('heading', { name: '设置与数据', exact: true })).toBeVisible()
      const finished = fail ? undefined : application.waitForEvent('close')
      await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.close())
      // 真实关闭事件及两个绘制帧已完成，仍无完成回执，保存尚在受控等待。
      await page.evaluate(
        () =>
          new Promise<void>((done) => {
            const browser = globalThis as unknown as {
              requestAnimationFrame: (fn: () => void) => void
            }
            browser.requestAnimationFrame(() => browser.requestAnimationFrame(done))
          }),
      )
      expect((await state()).closeEvents).toBe(1)
      expect((await state()).finish).toBe(0)
      expect(application.process().exitCode).toBeNull()
      await application.evaluate(() => Reflect.get(globalThis, 'settingsCloseControl').release())
      if (fail) {
        await expect.poll(async () => (await state()).dialogs).toBe(1)
        expect(await state()).toMatchObject({ started: 1, finish: 1, saved: false })
        await expect(page.getByRole('alert')).toContainText('显示设置测试保存失败')
        await expect(page.getByLabel('显示主题', { exact: true })).toHaveValue('dark')
        expect(stored(testDataDirectory)).toEqual([
          { id: 1, theme: 'system', font_size: 17, palette: 'forest' },
        ])
        await page.getByRole('button', { name: '重试保存并应用', exact: true }).click()
        await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
        await openPage(page, '开始练习')
        await expect(page.getByLabel('练习模式', { exact: true })).toBeEnabled()
        await normalClose(application)
      } else await finished
      expect(stored(testDataDirectory)).toEqual([
        { id: 1, theme: 'dark', font_size: 21, palette: 'forest' },
      ])
      const next = await launchApplication(testDataDirectory, info.project.name)
      reopened = next.application
      await expect(next.page.locator('html')).toHaveAttribute('data-theme', 'dark')
      await expect(next.page.locator('html')).toHaveAttribute('data-font-size', '21')
    } finally {
      await stop(application)
      if (reopened) await stop(reopened)
    }
  })
}
