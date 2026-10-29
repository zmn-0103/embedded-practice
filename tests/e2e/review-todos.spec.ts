import { writeFile } from 'node:fs/promises'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { localDateString, reviewPresetDate } from '../../src/shared/contracts/review-todos'
import { expect, launchApplication, openPage, test } from './helpers'
import { captureHistory, importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
import { a, b, controlBank, prepareControl } from './practice-control-helpers'
import {
  arrangeReview,
  listReviews,
  openLibraryReview,
  openReviewEditor,
  readReview,
} from './review-helpers'
import { closeNormally, createStudyRound } from './study-helpers'
import { chooseTheme } from './theme-helpers'

test('题目复习安排：明确加入、日期快捷操作和原因自动保存，完成/重开与正常关闭重读', async ({
  testDataDirectory,
}, info) => {
  const initial = await prepareControl(testDataDirectory, info, 3)
  let reopened: Awaited<ReturnType<typeof launchApplication>> | undefined
  try {
    const editor = await openLibraryReview(initial.page)
    expect(await readReview(initial.page)).toEqual({ ok: true, value: null })
    await editor.getByRole('button', { name: '加入待复习', exact: true }).click()
    await expect(editor.getByText('复习安排已保存。', { exact: true })).toBeVisible()
    await editor.getByRole('button', { name: '明天复习', exact: true }).click()
    await expect(editor.getByLabel('复习日期', { exact: true })).toHaveValue(
      reviewPresetDate('tomorrow'),
    )
    await editor
      .getByRole('textbox', { name: '复习原因', exact: true })
      .fill('再口述TC与DMA完成的区别')
    await expect
      .poll(() => readReview(initial.page))
      .toMatchObject({
        ok: true,
        value: {
          state: 'pending',
          dueDate: reviewPresetDate('tomorrow'),
          reason: '再口述TC与DMA完成的区别',
        },
      })
    await editor.getByRole('button', { name: '本周末复习', exact: true }).click()
    await expect
      .poll(() => readReview(initial.page))
      .toMatchObject({ ok: true, value: { dueDate: reviewPresetDate('weekend') } })
    await editor.getByRole('button', { name: '不设复习日期', exact: true }).click()
    await expect
      .poll(() => readReview(initial.page))
      .toMatchObject({ ok: true, value: { dueDate: null } })
    await editor.getByRole('button', { name: '完成这条待办', exact: true }).click()
    await expect(editor.getByText('待办已完成。', { exact: true })).toBeVisible()
    expect((await listReviews(initial.page, { state: 'done' })).total).toBe(1)
    await editor.getByRole('button', { name: '重新加入待复习', exact: true }).click()
    await expect(editor.getByText('复习安排已保存。', { exact: true })).toBeVisible()
    await editor
      .getByRole('textbox', { name: '复习原因', exact: true })
      .fill('关闭前尚未等500ms的原因')
    await closeNormally(initial.application)
    reopened = await launchApplication(testDataDirectory, info.project.name)
    expect(await readReview(reopened.page)).toMatchObject({
      ok: true,
      value: { state: 'pending', completedAt: null, reason: '关闭前尚未等500ms的原因' },
    })
    await openLibraryReview(reopened.page)
    await captureHistory(reopened.application, reopened.page, info, 'review-editor-saved.png')
  } finally {
    await stop(initial.application)
    if (reopened) await stop(reopened.application)
  }
})

test('真实待办写失败阻止离开和正常关闭，输入保留；原操作重试及过期冲突明确重读', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info, 3)
  try {
    await arrangeReview(page)
    const editor = await openLibraryReview(page),
      text = editor.getByRole('textbox', { name: '复习原因', exact: true })
    await application.evaluate(({ dialog }) => {
      dialog.showMessageBox = async () => {
        Reflect.set(globalThis, '__reviewCloseRejected', true)
        return { response: 0, checkboxChecked: false }
      }
    })
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER fail_review_ui BEFORE UPDATE ON review_todos BEGIN SELECT RAISE(ABORT,'review ui failure'); END",
        ),
      false,
    )
    await text.fill('保存失败仍须保留的原因')
    await expect(editor.getByRole('alert')).toBeVisible()
    await expect(text).toHaveValue('保存失败仍须保留的原因')
    await expect(
      page
        .getByRole('navigation', { name: '主要页面', exact: true })
        .getByRole('link', { name: '学习总览', exact: true }),
    ).toHaveAttribute('aria-disabled', 'true')
    await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.close())
    await expect
      .poll(() => application.evaluate(() => Reflect.get(globalThis, '__reviewCloseRejected')))
      .toBe(true)
    expect(application.windows()).toHaveLength(1)
    expect(await readReview(page)).toMatchObject({ ok: true, value: { revision: 1 } })
    await captureHistory(application, page, info, 'review-save-failed.png')
    withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER fail_review_ui'), false)
    await editor.getByRole('button', { name: '重试原待办保存', exact: true }).click()
    await expect(text).toBeEditable()
    expect(await readReview(page)).toMatchObject({
      ok: true,
      value: { revision: 2, reason: '保存失败仍须保留的原因' },
    })
    expect(
      await page.evaluate(async () => {
        const api = (globalThis as unknown as { desktop: DesktopApi }).desktop.reviewTodos
        return api.save({
          ...{ topicId: 'control-a', questionId: 'q-1' },
          expectedRevision: 2,
          state: 'pending',
          dueDate: null,
          reason: '另一编辑器的新安排',
        })
      }),
    ).toMatchObject({ ok: true })
    await text.fill('本地较旧编辑器的输入')
    await expect(editor.getByRole('alert')).toContainText('复习安排已变化')
    await expect(text).toHaveValue('本地较旧编辑器的输入')
    await editor.getByRole('button', { name: '重新读取复习安排', exact: true }).click()
    await editor.getByRole('button', { name: '保留当前安排', exact: true }).click()
    await expect(text).toHaveValue('本地较旧编辑器的输入')
    await editor.getByRole('button', { name: '重新读取复习安排', exact: true }).click()
    await editor.getByRole('button', { name: '放弃本地修改并读取安排', exact: true }).click()
    await expect(text).toHaveValue('另一编辑器的新安排')
    await expect(text).toBeEditable()
  } finally {
    await stop(application)
  }
})

test('真实提交后坏响应原操作重试不重复；独立作答前不读取/展示旧原因，揭晓和练习不会完成待办', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info, 3)
  try {
    await application.evaluate(({ ipcMain }) => {
      const handlers = Reflect.get(ipcMain, '_invokeHandlers'),
        save = handlers.get('review:save'),
        read = handlers.get('review:read')
      Reflect.set(globalThis, '__reviewCommands', [])
      Reflect.set(globalThis, '__reviewReads', 0)
      ipcMain.removeHandler('review:save')
      ipcMain.handle('review:save', async (event, input) => {
        const commands = Reflect.get(globalThis, '__reviewCommands')
        commands.push(input)
        const result = await save(event, input)
        return commands.length === 1 ? { invalid: true } : result
      })
      ipcMain.removeHandler('review:read')
      ipcMain.handle('review:read', (event, input) => {
        Reflect.set(globalThis, '__reviewReads', Reflect.get(globalThis, '__reviewReads') + 1)
        return read(event, input)
      })
    })
    const editor = await openLibraryReview(page)
    await editor
      .getByRole('textbox', { name: '复习原因', exact: true })
      .fill('PRIVATE-REVIEW-REASON-TC-DMA')
    await expect(editor.getByRole('alert')).toContainText('尚未确认')
    await editor.getByRole('button', { name: '重试原待办保存', exact: true }).click()
    await expect(editor.getByText('复习安排已保存。', { exact: true })).toBeVisible()
    const commands = await application.evaluate(() => Reflect.get(globalThis, '__reviewCommands'))
    expect(commands).toHaveLength(2)
    expect(commands[1]).toEqual(commands[0])
    expect(await readReview(page)).toMatchObject({ ok: true, value: { revision: 1 } })
    await openPage(page, '开始练习')
    await page.getByLabel('练习专题', { exact: true }).selectOption('control-a')
    await page.getByLabel('本轮题数', { exact: true }).selectOption('all')
    const reads = await application.evaluate(() => Reflect.get(globalThis, '__reviewReads'))
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    await expect(page.locator('.practice-reference-column .review-editor')).toHaveCount(0)
    await expect(page.getByText('PRIVATE-REVIEW-REASON-TC-DMA', { exact: true })).toHaveCount(0)
    expect(await application.evaluate(() => Reflect.get(globalThis, '__reviewReads'))).toBe(reads)
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    const revealed = page.locator('.practice-reference-column .review-editor')
    await expect(revealed).not.toHaveAttribute('open')
    expect(await application.evaluate(() => Reflect.get(globalThis, '__reviewReads'))).toBe(reads)
    await openReviewEditor(revealed)
    await expect(revealed.getByRole('textbox', { name: '复习原因', exact: true })).toHaveValue(
      'PRIVATE-REVIEW-REASON-TC-DMA',
    )
    expect(await readReview(page)).toMatchObject({
      ok: true,
      value: { state: 'pending', completedAt: null, revision: 1 },
    })
    await revealed
      .getByRole('textbox', { name: '复习原因', exact: true })
      .fill('自评切题前保存，仍保留待办')
    await page.getByRole('button', { name: '掌握', exact: true }).click()
    expect(await readReview(page)).toMatchObject({
      ok: true,
      value: { state: 'pending', revision: 2, reason: '自评切题前保存，仍保留待办' },
    })
    await expect(page.locator('.practice-reference-column .review-editor')).toHaveCount(0)
  } finally {
    await stop(application)
  }
})

test('旧轮复盘编辑当前复习计划，切题先保存，明确完成不改轮次/版本/自评', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareControl(testDataDirectory, info, 3)
  try {
    const round = await createStudyRound(page, '旧轮原作答')
    await arrangeReview(page)
    await writeFile(file, controlBank('control-a', 3, true))
    await importHistoryFiles(application, page, [file])
    const history = withHistoryDatabase(testDataDirectory, (db) => ({
      sessions: db.prepare('SELECT * FROM practice_sessions').all(),
      items: db.prepare('SELECT * FROM practice_items').all(),
      state: db.prepare('SELECT * FROM question_user_state').all(),
      versions: db.prepare('SELECT * FROM question_versions').all(),
    }))
    await openPage(page, '学习记录')
    await page.getByRole('tab', { name: '按轮次复盘', exact: true }).click()
    await page
      .locator(`.round-list [data-session-id="${round.sessionId}"]`)
      .getByRole('button', { name: '查看这一轮', exact: true })
      .click()
    const detail = page.getByLabel('按轮次复盘详情', { exact: true })
    await detail.getByRole('button', { name: '查看本轮第1题', exact: true }).click()
    await expect(detail).toContainText('这条记录采用旧题目版本')
    const editor = await openReviewEditor(detail.locator('.review-editor'))
    await editor
      .getByRole('textbox', { name: '复习原因', exact: true })
      .fill('旧版理解对照新版再口述')
    await detail.getByRole('button', { name: '查看本轮第2题', exact: true }).click()
    expect(await readReview(page)).toMatchObject({
      ok: true,
      value: { revision: 2, reason: '旧版理解对照新版再口述' },
    })
    await detail.getByRole('button', { name: '查看本轮第1题', exact: true }).click()
    const again = await openReviewEditor(detail.locator('.review-editor'))
    await again.getByRole('button', { name: '完成这条待办', exact: true }).click()
    await expect(again.getByText('待办已完成。', { exact: true })).toBeVisible()
    expect(
      withHistoryDatabase(testDataDirectory, (db) => ({
        sessions: db.prepare('SELECT * FROM practice_sessions').all(),
        items: db.prepare('SELECT * FROM practice_items').all(),
        state: db.prepare('SELECT * FROM question_user_state').all(),
        versions: db.prepare('SELECT * FROM question_versions').all(),
      })),
    ).toEqual(history)
    await captureHistory(application, page, info, 'review-round-current-plan.png')
  } finally {
    await stop(application)
  }
})

test('待办跨页/状态勾选进入原组卷确认，归档阻止开始；当前版本固定且练习不自动完成', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareControl(testDataDirectory, info)
  try {
    for (let n = 1; n <= 27; n++) await arrangeReview(page, a(n))
    await arrangeReview(page, b(1), '2000-01-01')
    await writeFile(file, controlBank('control-a', 27, true, 1))
    await importHistoryFiles(application, page, [file])
    const panel = page.locator('.review-todos-panel')
    await panel.locator('summary').click()
    await expect(panel.getByText('本次匹配 28 条复习待办。', { exact: true })).toBeVisible()
    await panel.getByRole('checkbox', { name: '勾选待办：control-a / q-1', exact: true }).check()
    await panel.getByRole('button', { name: '下一页', exact: true }).click()
    await panel.getByRole('checkbox', { name: '勾选待办：control-a / q-27', exact: true }).check()
    await panel.getByLabel('待办日期范围', { exact: true }).selectOption('due')
    await expect(panel.getByText('本次匹配 1 条复习待办。', { exact: true })).toBeVisible()
    await panel.getByRole('checkbox', { name: '勾选待办：control-b / q-1', exact: true }).check()
    await panel.getByLabel('待办状态', { exact: true }).selectOption('done')
    await expect(panel.getByText('本次匹配 0 条复习待办。', { exact: true })).toBeVisible()
    await expect(panel.getByText(/^已勾选 3 题/)).toBeVisible()
    await panel.getByRole('button', { name: '确认勾选的待办并练习…', exact: true }).click()
    const preview = page.getByRole('region', { name: '确认勾选组卷', exact: true })
    await expect(preview.getByRole('heading', { name: '复习待办', exact: true })).toBeVisible()
    await expect(preview.getByText('组卷专题 A · 已归档', { exact: true })).toBeVisible()
    await expect(
      preview.getByRole('button', { name: '确认开始组卷（3题）', exact: true }),
    ).toBeDisabled()
    await preview.getByRole('button', { name: '从本轮移除不可用项', exact: true }).click()
    await preview.getByRole('button', { name: '确认开始组卷（2题）', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toHaveText('第 1 / 2 题 · 顺序练习')
    const data = withHistoryDatabase(testDataDirectory, (db) => ({
      queue: db
        .prepare(
          'SELECT q.topic_id AS topicId,q.question_id AS questionId,v.sequence FROM practice_items p JOIN questions q ON q.id=p.question_id JOIN question_versions v ON v.id=p.version_id ORDER BY p.position',
        )
        .all(),
      reviews: db.prepare("SELECT count(*) AS total FROM review_todos WHERE state='pending'").get(),
    }))
    expect(data.queue).toEqual([
      { ...a(27), sequence: 2 },
      { ...b(1), sequence: 1 },
    ])
    expect(data.reviews).toEqual({ total: 28 })
    await captureHistory(application, page, info, 'review-selected-practice.png')
  } finally {
    await stop(application)
  }
})

test('复习待办在900宽/150%缩放/暗色中可编辑、筛选且浮层在视口内', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info, 3)
  try {
    await arrangeReview(page, a(1), localDateString())
    await chooseTheme(page, '松间绿', 'dark')
    await openPage(page, '题库')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    const window = await application.browserWindow(page)
    await window.evaluate((window) => {
      window.setContentSize(900, 800)
      window.webContents.setZoomFactor(1.5)
    })
    const panel = page.locator('.review-todos-panel')
    await panel.locator('summary').click()
    await expect(panel.getByText('本次匹配 1 条复习待办。', { exact: true })).toBeVisible()
    const editor = await openReviewEditor(panel.locator('.review-editor'))
    await editor
      .getByRole('textbox', { name: '复习原因', exact: true })
      .fill('窄窗下仍可填写的复习原因：再口述一次')
    await expect(editor.getByText('复习安排已保存。', { exact: true })).toBeVisible()
    await panel.getByLabel('待办日期范围', { exact: true }).selectOption('due')
    await expect(panel.getByText('本次匹配 1 条复习待办。', { exact: true })).toBeVisible()
    const bounds = await panel.evaluate((element) => {
      const browser = globalThis as unknown as {
        innerWidth: number
        innerHeight: number
        document: { documentElement: { scrollWidth: number } }
      }
      const box = element.getBoundingClientRect()
      return {
        left: box.left,
        right: box.right,
        bottom: box.bottom,
        width: browser.innerWidth,
        height: browser.innerHeight,
        scrollWidth: browser.document.documentElement.scrollWidth,
      }
    })
    expect(bounds.left).toBeGreaterThanOrEqual(0)
    expect(bounds.right).toBeLessThanOrEqual(bounds.width + 1)
    expect(bounds.bottom).toBeLessThanOrEqual(bounds.height + 1)
    expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.width + 1)
    await captureHistory(application, page, info, 'review-todos-narrow-dark.png')
  } finally {
    await stop(application)
  }
})
