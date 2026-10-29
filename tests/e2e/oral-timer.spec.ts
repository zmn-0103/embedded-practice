import type { ElectronApplication } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { LIBRARY_CHANNELS } from '../../src/shared/contracts/library-desktop'
import { STUDY_CHANNELS } from '../../src/shared/contracts/study'
import { REVIEW_CHANNELS } from '../../src/shared/contracts/review-todos'
import { KNOWLEDGE_CHANNELS } from '../../src/shared/contracts/knowledge'
import { HISTORY_CHANNELS } from '../../src/shared/contracts/history'
import { PRACTICE_CHANNELS } from '../../src/shared/contracts/practice-desktop'
import { expect, launchApplication, openPage, test } from './helpers'
import { captureHistory, stop, withHistoryDatabase } from './history-helpers'
import { controlRecords } from './practice-control-helpers'
import { closeNormally } from './study-helpers'
import { prepareOral, freezeOralClock } from './oral-timer-helpers'

test('切题已成功但坏回包时暂停，原命令重试后保留各题计时和固定队列', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareOral(testDataDirectory, info)
  try {
    await freezeOralClock(page)
    const panel = page.getByRole('region', { name: '口述计时', exact: true })
    await panel.getByRole('checkbox', { name: '启用口述计时（可选）', exact: true }).check()
    await panel.getByRole('button', { name: '开始计时', exact: true }).click()
    await page.clock.runFor(10000)
    await application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('practice:navigate')
      Reflect.set(globalThis, '__oralNavigate', [])
      ipcMain.removeHandler('practice:navigate')
      ipcMain.handle('practice:navigate', async (event, input) => {
        const calls = Reflect.get(globalThis, '__oralNavigate')
        calls.push(input)
        const result = await original(event, input)
        return calls.length === 1 ? { invalid: true } : result
      })
    })
    await page.getByRole('button', { name: '跳过本题', exact: true }).click()
    await expect(page.getByRole('button', { name: '重试原操作', exact: true })).toBeVisible()
    await page.clock.fastForward(300000)
    await expect(panel.getByRole('timer')).toHaveText('01:50')
    await expect(panel.getByRole('button', { name: '继续计时', exact: true })).toBeDisabled()
    expect(
      withHistoryDatabase(testDataDirectory, (db) =>
        db.prepare("SELECT position FROM practice_sessions WHERE status='active'").get(),
      ),
    ).toEqual({ position: 1 })
    await page.getByRole('button', { name: '重试原操作', exact: true }).click()
    await expect(page.getByRole('heading', { name: '组卷题 A 2', exact: true })).toBeVisible()
    await expect(panel.getByRole('timer')).toHaveText('02:00')
    const calls = await application.evaluate(() => Reflect.get(globalThis, '__oralNavigate'))
    expect(calls).toHaveLength(2)
    expect(calls[0]).toEqual(calls[1])
    const actual = await page.evaluate(() =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
    )
    expect(actual).toMatchObject({ ok: true, value: { session: { position: 1, total: 3 } } })
    await page.clock.runFor(600)
    await page.getByRole('button', { name: '上一题', exact: true }).click()
    await page.clock.runFor(600)
    await expect(panel.getByRole('timer')).toHaveText('01:50')
    await page.clock.resume()
    await captureHistory(application, page, info, 'oral-unknown-recovered.png')
  } finally {
    await stop(application)
  }
})

for (const mode of ['light', 'dark'] as const) {
  test(`口述计时900宽150%/${mode}/22px可操作，无横向溢出且不遮挡输入/揭晓`, async ({
    testDataDirectory,
  }, info) => {
    const { application, page } = await prepareOral(testDataDirectory, info, mode)
    try {
      await application.evaluate(({ BrowserWindow }) => {
        const window = BrowserWindow.getAllWindows()[0]!
        window.setContentSize(900, 760)
        window.webContents.setZoomFactor(1.5)
        window.focus()
      })
      const panel = page.getByRole('region', { name: '口述计时', exact: true })
      await panel.getByRole('checkbox', { name: '启用口述计时（可选）', exact: true }).check()
      await panel.getByLabel('本题口述时长', { exact: true }).selectOption('60')
      await panel.getByRole('button', { name: '开始计时', exact: true }).click()
      await panel.getByRole('button', { name: '暂停计时', exact: true }).click()
      await panel.getByRole('button', { name: '重置本题计时', exact: true }).focus()
      await expect(panel.getByRole('button', { name: '重置本题计时', exact: true })).toBeFocused()
      const controls = await panel
        .getByRole('button', { name: '重置本题计时', exact: true })
        .boundingBox()
      const bar = await page.locator('.practice-actions').boundingBox()
      expect(controls).not.toBeNull()
      expect(bar).not.toBeNull()
      expect(controls!.y).toBeGreaterThanOrEqual(0)
      expect(controls!.y + controls!.height).toBeLessThanOrEqual(bar!.y)
      await captureHistory(application, page, info, `oral-narrow-${mode}.png`)
      const input = page.getByRole('textbox', { name: '我的答案', exact: true })
      await input.fill('中文口述 DMA / UART 代码与标点，计时不影响输入。')
      await expect(page.locator('.practice-input-save')).toHaveText('已保存')
      const sizes = await page.locator('html').evaluate((element) => ({
        scroll: Reflect.get(element, 'scrollWidth'),
        client: Reflect.get(element, 'clientWidth'),
      }))
      expect(sizes.scroll).toBeLessThanOrEqual(sizes.client + 1)
      await expect(page.getByRole('button', { name: '查看参考答案', exact: true })).toBeVisible()
      await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
      await expect(page.getByRole('region', { name: '练习参考答案', exact: true })).toContainText(
        'CONTROL-OLD-ANSWER-control-a-1',
      )
      await expect(panel.getByRole('button', { name: '继续计时', exact: true })).toBeDisabled()
      await expect(input).toHaveValue('中文口述 DMA / UART 代码与标点，计时不影响输入。')
    } finally {
      await stop(application)
    }
  })
}

test('口述计时默认关闭/单调截止/暂停，到时不揭晓评价/读取旧内容/写学习记录', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareOral(testDataDirectory, info)
  try {
    await page.getByRole('textbox', { name: '我的答案', exact: true }).fill('独立口述草稿保留')
    await expect(page.locator('.practice-input-save')).toHaveText('已保存')
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    await application.evaluate(
      ({ ipcMain }, channels) => {
        Reflect.set(globalThis, '__oralCalls', [])
        for (const channel of channels) {
          const original = Reflect.get(ipcMain, '_invokeHandlers').get(channel)
          ipcMain.removeHandler(channel)
          ipcMain.handle(channel, async (event, ...args) => {
            Reflect.get(globalThis, '__oralCalls').push(channel)
            return original(event, ...args)
          })
        }
      },
      [
        LIBRARY_CHANNELS.getAnswer,
        STUDY_CHANNELS.readNote,
        REVIEW_CHANNELS.read,
        KNOWLEDGE_CHANNELS.relations,
        HISTORY_CHANNELS.list,
        HISTORY_CHANNELS.getEntry,
        PRACTICE_CHANNELS.reveal,
        PRACTICE_CHANNELS.rateAndAdvance,
        PRACTICE_CHANNELS.navigate,
        PRACTICE_CHANNELS.end,
      ],
    )
    await freezeOralClock(page)
    const panel = page.getByRole('region', { name: '口述计时', exact: true }),
      toggle = panel.getByRole('checkbox', { name: '启用口述计时（可选）', exact: true })
    await expect(toggle).not.toBeChecked()
    await expect(panel.getByRole('timer')).toHaveCount(0)
    await page.clock.fastForward(300000)
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
    await toggle.check()
    await expect(panel.getByRole('timer')).toHaveText('02:00')
    await panel.getByRole('button', { name: '开始计时', exact: true }).click()
    await page.clock.runFor(1500)
    await expect(panel.getByRole('timer')).toHaveText('01:59')
    await panel.getByRole('button', { name: '暂停计时', exact: true }).click()
    await page.clock.fastForward(600000)
    await expect(panel.getByRole('timer')).toHaveText('01:59')
    await page.clock.setSystemTime(new Date('2030-01-01T00:00:00Z'))
    await expect(panel.getByRole('timer')).toHaveText('01:59')
    await panel.getByRole('button', { name: '继续计时', exact: true }).click()
    await page.getByRole('textbox', { name: '我的答案', exact: true }).focus()
    await page.clock.fastForward(200000)
    await expect(panel.getByRole('timer')).toHaveText('00:00')
    await expect(panel.getByRole('status')).toContainText('本题口述计时已到')
    await expect(page.getByRole('heading', { name: '组卷题 A 1', exact: true })).toBeVisible()
    await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toBeEditable()
    await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toBeFocused()
    await expect(
      page.locator('.reference-answer,.personal-note,.review-editor,.question-relations'),
    ).toHaveCount(0)
    expect(await application.evaluate(() => Reflect.get(globalThis, '__oralCalls'))).toEqual([])
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
    await page.clock.resume()
    await panel.scrollIntoViewIfNeeded()
    await captureHistory(application, page, info, 'oral-expired.png')
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await expect(page.getByRole('region', { name: '练习参考答案', exact: true })).toContainText(
      'CONTROL-OLD-ANSWER-control-a-1',
    )
    await expect(panel.getByRole('button', { name: '重置本题计时', exact: true })).toBeDisabled()
    expect(await application.evaluate(() => Reflect.get(globalThis, '__oralCalls'))).toContain(
      PRACTICE_CHANNELS.reveal,
    )
    expect(
      withHistoryDatabase(testDataDirectory, (db) =>
        db.prepare('SELECT kind FROM learning_activities ORDER BY rowid').all(),
      ),
    ).toEqual([{ kind: 'reveal' }])
  } finally {
    await stop(application)
  }
})

test('计时分题保留和本题时长/重置，保存返回后暂停继续，关闭重开只重置计时', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareOral(testDataDirectory, info),
    opened: ElectronApplication[] = [application]
  try {
    await freezeOralClock(page)
    let panel = page.getByRole('region', { name: '口述计时', exact: true })
    await panel.getByRole('checkbox', { name: '启用口述计时（可选）', exact: true }).check()
    await panel.getByRole('button', { name: '开始计时', exact: true }).click()
    await page.clock.runFor(10000)
    await page.getByRole('button', { name: '跳过本题', exact: true }).click()
    await page.clock.runFor(600)
    await expect(page.getByRole('heading', { name: '组卷题 A 2', exact: true })).toBeVisible()
    await expect(panel.getByRole('timer')).toHaveText('02:00')
    await panel.getByLabel('本题口述时长', { exact: true }).selectOption('180')
    await panel.getByRole('button', { name: '开始计时', exact: true }).click()
    await page.clock.runFor(5000)
    await page.getByRole('button', { name: '上一题', exact: true }).click()
    await page.clock.runFor(600)
    await expect(panel.getByRole('timer')).toHaveText('01:50')
    await expect(panel.getByLabel('本题口述时长', { exact: true })).toHaveValue('120')
    await page.getByRole('button', { name: '保存并返回', exact: true }).click()
    await page.clock.fastForward(600000)
    await openPage(page, '学习总览')
    await openPage(page, '开始练习')
    await page.getByRole('button', { name: '继续练习', exact: true }).click()
    panel = page.getByRole('region', { name: '口述计时', exact: true })
    await expect(panel.getByRole('timer')).toHaveText('01:50')
    await expect(panel.getByRole('button', { name: '继续计时', exact: true })).toBeEnabled()
    await panel.getByRole('button', { name: '重置本题计时', exact: true }).click()
    await expect(panel.getByRole('timer')).toHaveText('02:00')
    await expect(panel.getByRole('button', { name: '开始计时', exact: true })).toBeEnabled()
    await page.clock.resume()
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    await closeNormally(application)
    const reopened = await launchApplication(testDataDirectory, info.project.name, '开始练习')
    opened.push(reopened.application)
    await reopened.page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(
      reopened.page.getByRole('heading', { name: '组卷题 A 1', exact: true }),
    ).toBeVisible()
    await expect(
      reopened.page.getByRole('checkbox', { name: '启用口述计时（可选）', exact: true }),
    ).not.toBeChecked()
    await expect(reopened.page.getByRole('timer')).toHaveCount(0)
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
  } finally {
    for (const app of opened) await stop(app)
  }
})

test('真实短时间倒数，窗口隐藏/失焦暂停，恢复焦点不自动继续', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareOral(testDataDirectory, info)
  try {
    const panel = page.getByRole('region', { name: '口述计时', exact: true }),
      before = withHistoryDatabase(testDataDirectory, controlRecords)
    await panel.getByRole('checkbox', { name: '启用口述计时（可选）', exact: true }).check()
    await panel.getByRole('button', { name: '开始计时', exact: true }).click()
    await expect(panel.getByRole('timer')).not.toHaveText('02:00')
    const frozen = await panel.getByRole('timer').innerText(),
      startedAt = Date.now()
    await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.minimize())
    await expect
      .poll(() =>
        application.evaluate(({ BrowserWindow }) =>
          BrowserWindow.getAllWindows()[0]!.isMinimized(),
        ),
      )
      .toBe(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    await application.evaluate(({ BrowserWindow }) => {
      const window = BrowserWindow.getAllWindows()[0]!
      window.restore()
      window.focus()
    })
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(1500)
    await expect(panel.getByRole('timer')).toHaveText(frozen)
    await expect(panel.getByRole('button', { name: '继续计时', exact: true })).toBeEnabled()
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
  } finally {
    await stop(application)
  }
})

test('保存失败暂停且保留输入/余时，重试保存后明确切题不重置旧题计时', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareOral(testDataDirectory, info)
  try {
    await freezeOralClock(page)
    const panel = page.getByRole('region', { name: '口述计时', exact: true })
    await panel.getByRole('checkbox', { name: '启用口述计时（可选）', exact: true }).check()
    await panel.getByRole('button', { name: '开始计时', exact: true }).click()
    await page.clock.runFor(10000)
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER fail_oral BEFORE UPDATE ON practice_items BEGIN SELECT RAISE(ABORT,'oral draft'); END",
        ),
      false,
    )
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    await page
      .getByRole('textbox', { name: '我的答案', exact: true })
      .fill('失败时保留独立口述草稿')
    await page.getByRole('button', { name: '跳过本题', exact: true }).click()
    await expect(page.locator('.practice-actions [role="alert"]')).toBeVisible()
    await page.clock.fastForward(300000)
    await expect(page.getByRole('heading', { name: '组卷题 A 1', exact: true })).toBeVisible()
    await expect(panel.getByRole('timer')).toHaveText('01:50')
    await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      '失败时保留独立口述草稿',
    )
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
    withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER fail_oral'), false)
    await page.getByRole('button', { name: '重试保存', exact: true }).click()
    await expect(page.locator('.practice-input-save')).toHaveText('已保存')
    await expect(page.getByRole('heading', { name: '组卷题 A 1', exact: true })).toBeVisible()
    await expect(panel.getByRole('timer')).toHaveText('01:50')
    await page.getByRole('button', { name: '跳过本题', exact: true }).click()
    await expect(page.getByRole('heading', { name: '组卷题 A 2', exact: true })).toBeVisible()
    await page.clock.runFor(600)
    await page.getByRole('button', { name: '上一题', exact: true }).click()
    await page.clock.runFor(600)
    await expect(panel.getByRole('timer')).toHaveText('01:50')
    await page.clock.resume()
    await captureHistory(application, page, info, 'oral-save-recovered.png')
  } finally {
    await stop(application)
  }
})
