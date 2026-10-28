import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, openPage, test } from './helpers'
import { historySnapshot, stop, withHistoryDatabase } from './history-helpers'
import { prepareControl } from './practice-control-helpers'

test('清单查看不揭晓不写库，跳题保存失败原位保留，重试后可回看原输入', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info)
  try {
    await openPage(page, '开始练习')
    await page.getByLabel('练习专题', { exact: true }).selectOption('control-a')
    await page.getByLabel('本轮题数', { exact: true }).selectOption('all')
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    const before = historySnapshot(testDataDirectory)
    await page.locator('.practice-outline > summary').click()
    const outline = page.locator('.practice-outline')
    await expect(outline.getByRole('button', { name: /^7\. 组卷题 A 7 / })).toBeEnabled()
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    await expect(page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER outline_save_failure BEFORE UPDATE OF draft ON practice_items BEGIN SELECT RAISE(ABORT,'injected outline save'); END",
        ),
      false,
    )
    const input = page.getByRole('textbox', { name: '我的答案', exact: true })
    await input.fill('跳题前不能丢失的回答\n    code();')
    await outline.getByRole('button', { name: /^7\. 组卷题 A 7 / }).click()
    await expect(page.locator('.practice-save')).toHaveText('保存失败')
    await expect(page.getByLabel('练习进度')).toHaveText('第 1 / 27 题 · 顺序练习')
    await expect(input).toHaveValue('跳题前不能丢失的回答\n    code();')
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    withHistoryDatabase(
      testDataDirectory,
      (db) => db.exec('DROP TRIGGER outline_save_failure'),
      false,
    )
    await outline.getByRole('button', { name: /^7\. 组卷题 A 7 / }).click()
    await expect(page.getByLabel('练习进度')).toHaveText('第 7 / 27 题 · 顺序练习')
    await expect(input).toHaveValue('')
    await expect(page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
    await outline.locator('summary').click()
    await outline.getByRole('button', { name: /^1\. 组卷题 A 1 / }).click()
    await expect(input).toHaveValue('跳题前不能丢失的回答\n    code();')
    await page.getByRole('button', { name: '跳过本题', exact: true }).click()
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await page.getByRole('button', { name: '暂不评价，下一题', exact: true }).click()
    await outline.locator('summary').click()
    await expect(outline.getByRole('button', { name: /^1\. 组卷题 A 1 / })).toContainText(
      '尚未揭晓 · 曾跳过',
    )
    await expect(outline.getByRole('button', { name: /^2\. 组卷题 A 2 / })).toContainText(
      '已揭晓、未自评',
    )
    await expect(outline.getByRole('button', { name: /^3\. 组卷题 A 3 / })).toContainText(
      '当前位置',
    )
    await info.attach('practice-outline-states.png', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
  } finally {
    await stop(application)
  }
})

test('清单跳题已提交响应未知，只能重试原目标，界面与数据库恢复一致', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info)
  try {
    await openPage(page, '开始练习')
    await page.getByLabel('练习专题', { exact: true }).selectOption('control-a')
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    await page.locator('.practice-outline > summary').click()
    await application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('practice:navigate')
      const commands: unknown[] = []
      Reflect.set(globalThis, '__jumpCommands', commands)
      let drop = true
      ipcMain.removeHandler('practice:navigate')
      ipcMain.handle('practice:navigate', async (event, command) => {
        commands.push(structuredClone(command))
        const result = await original(event, command)
        if (drop) {
          drop = false
          return { ok: true, value: null }
        }
        return result
      })
    })
    await page.getByRole('textbox', { name: '我的答案', exact: true }).fill('跳题响应未知仍保留')
    await page
      .locator('.practice-outline')
      .getByRole('button', { name: /^9\. 组卷题 A 9 / })
      .click()
    await expect(page.getByRole('alert')).toContainText('操作结果尚未确认')
    await expect(page.getByLabel('练习进度')).toHaveText('第 1 / 20 题 · 顺序练习')
    await expect(
      page.locator('.practice-outline').getByRole('button', { name: /^8\. 组卷题 A 8 / }),
    ).toBeDisabled()
    await page.getByRole('button', { name: '重试原操作', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toHaveText('第 9 / 20 题 · 顺序练习')
    const commands = await application.evaluate(() => Reflect.get(globalThis, '__jumpCommands'))
    expect(commands).toHaveLength(2)
    expect(commands[1]).toEqual(commands[0])
    expect(commands[0]).toMatchObject({
      direction: 'jump',
      targetPosition: 8,
      draft: { text: '跳题响应未知仍保留' },
    })
    await expect(page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
  } finally {
    await stop(application)
  }
})

test('清单读取失败可重试，52题分页和定位当前题不会改变固定队列', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info, 52)
  try {
    await openPage(page, '开始练习')
    await page.getByLabel('练习专题', { exact: true }).selectOption('control-a')
    await page.getByLabel('本轮题数', { exact: true }).selectOption('all')
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    await application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('practice:outline')
      let fail = true
      ipcMain.removeHandler('practice:outline')
      ipcMain.handle('practice:outline', (event, command) => {
        if (fail) {
          fail = false
          return { ok: false, error: { code: 'DATABASE_UNAVAILABLE', message: '清单定向读取失败' } }
        }
        return original(event, command)
      })
    })
    const before = historySnapshot(testDataDirectory)
    const outline = page.locator('.practice-outline')
    await outline.locator('summary').click()
    await expect(outline.getByRole('alert')).toContainText('清单定向读取失败')
    await outline.getByRole('button', { name: '重试读取本轮清单', exact: true }).click()
    await expect(outline.locator('li')).toHaveCount(50)
    await outline.getByRole('button', { name: '清单下一页', exact: true }).click()
    await expect(outline.locator('li')).toHaveCount(2)
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    await outline.getByRole('button', { name: /^52\. 组卷题 A 52 / }).click()
    await expect(page.getByLabel('练习进度')).toHaveText('第 52 / 52 题 · 顺序练习')
    await outline.locator('summary').click()
    await outline.getByRole('button', { name: '清单上一页', exact: true }).click()
    await expect(outline.locator('li')).toHaveCount(50)
    await outline.getByRole('button', { name: '定位当前题', exact: true }).click()
    await expect(outline.locator('li')).toHaveCount(2)
    await expect(outline.getByRole('button', { name: /^52\. 组卷题 A 52 / })).toHaveAttribute(
      'aria-current',
      'step',
    )
    const actual = await page.evaluate(() =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
    )
    expect(actual).toMatchObject({ ok: true, value: { item: { revealed: false } } })
  } finally {
    await stop(application)
  }
})
