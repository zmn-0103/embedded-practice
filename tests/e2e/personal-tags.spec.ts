import { randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import type { Locator, Page } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import type { PersonalTagChange } from '../../src/shared/contracts/personal-tags'
import { expect, openPage, test } from './helpers'
import { captureHistory, importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
import { a, b, controlBank, prepareControl } from './practice-control-helpers'
import { changePlan, planOptions, readPlans } from './practice-plan-helpers'
import { openLibraryNote, readNote } from './study-helpers'
import { chooseTheme } from './theme-helpers'
import { startFlow } from './practice-flow-helpers'

function changeTag(page: Page, input: PersonalTagChange) {
  return page.evaluate(
    (command) =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.personalTags.change(command),
    input,
  )
}
function assignments(directory: string) {
  return withHistoryDatabase(directory, (db) =>
    db
      .prepare('SELECT question_id,tag_id FROM question_personal_tags ORDER BY question_id,tag_id')
      .all(),
  )
}
async function expectTagMessage(panel: Locator, message: string) {
  await expect(panel.getByText('正在读取个人标签…', { exact: true })).toHaveCount(0)
  await expect(panel.getByRole('status')).toHaveText(message)
}

test('个人标签管理在900宽/150%缩放/暗色中可操作且浮层保持在视口内', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info, 3)
  try {
    await chooseTheme(page, '松间绿', 'dark')
    await openPage(page, '题库')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    const window = await application.browserWindow(page)
    await window.evaluate((window) => {
      window.setContentSize(900, 800)
      window.webContents.setZoomFactor(1.5)
    })
    const panel = page.locator('.personal-tags-panel')
    await panel.locator('summary').click()
    await panel
      .getByLabel('个人标签名称', { exact: true })
      .fill('能理解但讲不清，需要结合项目再口述一次')
    await panel.getByRole('button', { name: '创建个人标签', exact: true }).click()
    await expectTagMessage(panel, '个人标签已保存。')
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
        top: box.top,
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
    await captureHistory(application, page, info, 'personal-tags-narrow-dark.png')
  } finally {
    await stop(application)
  }
})

test('个人标签可创建/改名/跨专题批量添加移除并用于题库和方案', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info, 3)
  try {
    const panel = page
      .locator('details')
      .filter({ has: page.locator('summary', { hasText: /^个人标签（/ }) })
    await panel.locator('summary').click()
    await panel.getByLabel('个人标签名称', { exact: true }).fill('面试前必看')
    await panel.getByRole('button', { name: '创建个人标签', exact: true }).click()
    await expectTagMessage(panel, '个人标签已保存。')
    const result = await page.evaluate(() =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.personalTags.list(),
    )
    if (!result.ok) throw new Error(result.error.message)
    const tag = result.value[0]!
    await panel.getByLabel('操作的个人标签').selectOption(tag.tagId)
    await panel.locator('summary').click()
    await page
      .locator('.question-selection-row')
      .filter({ has: page.getByText('组卷题 A 1', { exact: true }) })
      .getByRole('checkbox')
      .check()
    await page
      .locator('.question-selection-row')
      .filter({ has: page.getByText('组卷题 B 2', { exact: true }) })
      .getByRole('checkbox')
      .check()
    await panel.locator('summary').click()
    await panel.getByRole('button', { name: '为勾选题目添加个人标签', exact: true }).click()
    await expectTagMessage(panel, '已为明确勾选的2题添加个人标签。')
    expect(assignments(testDataDirectory)).toHaveLength(2)
    await panel.locator('summary').click()
    await page.getByLabel('题库个人标签', { exact: true }).selectOption(tag.tagId)
    await page.getByRole('button', { name: '筛选题库', exact: true }).click()
    await expect(page.locator('.question-row')).toHaveCount(2)
    await captureHistory(application, page, info, 'personal-tag-filter.png')
    await panel.locator('summary').click()
    await captureHistory(application, page, info, 'personal-tag-management.png')
    await panel.getByLabel('个人标签名称', { exact: true }).fill('讲清楚再进面试')
    await panel.getByRole('button', { name: '重命名个人标签', exact: true }).click()
    await expectTagMessage(panel, '个人标签已保存。')
    await panel.locator('summary').click()
    await expect(page.getByLabel('题库个人标签').locator('option:checked')).toHaveText(
      '讲清楚再进面试',
    )
    const plan = {
      planId: randomUUID(),
      name: '按个人标签练',
      options: { ...planOptions, filters: { ...planOptions.filters, personalTagId: tag.tagId } },
    }
    expect(await changePlan(page, { kind: 'save', ...plan })).toMatchObject({ ok: true })
    expect((await readPlans(page))[0]).toMatchObject({
      ...plan,
      matchingCount: 2,
      personalTagMissing: false,
    })
    await panel.locator('summary').click()
    await panel.getByRole('button', { name: '从勾选题目移除个人标签', exact: true }).click()
    await expectTagMessage(panel, '已为明确勾选的2题移除个人标签。')
    await expect(page.locator('.question-row')).toHaveCount(0)
    expect(assignments(testDataDirectory)).toEqual([])
    await panel.getByRole('button', { name: '删除个人标签…', exact: true }).click()
    await panel.getByRole('button', { name: '取消删除个人标签', exact: true }).click()
    expect((await readPlans(page))[0]!.personalTagMissing).toBe(false)
    await panel.getByRole('button', { name: '删除个人标签…', exact: true }).click()
    await panel.getByRole('button', { name: '确认删除个人标签', exact: true }).click()
    await expectTagMessage(panel, '个人标签已删除，题目和笔记保留；引用该标签的方案需重新选条件。')
    expect((await readPlans(page))[0]).toMatchObject({ personalTagMissing: true, matchingCount: 0 })
  } finally {
    await stop(application)
  }
})

test('个人标签已提交但响应丢失时锁定表单，重试原操作不重复创建', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info, 3)
  try {
    const panel = page.locator('.personal-tags-panel')
    await panel.locator('summary').click()
    await application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('personal-tags:change')
      let drop = true
      Reflect.set(globalThis, '__tagRequests', [])
      ipcMain.removeHandler('personal-tags:change')
      ipcMain.handle('personal-tags:change', async (event, input) => {
        Reflect.get(globalThis, '__tagRequests').push(structuredClone(input))
        const result = await original(event, input)
        if (drop) {
          drop = false
          return { ok: true, value: 'invalid-reply' }
        }
        return result
      })
    })
    await panel.getByLabel('个人标签名称', { exact: true }).fill('需要再口述')
    await panel.getByRole('button', { name: '创建个人标签', exact: true }).click()
    await expect(panel.getByRole('alert')).toContainText('结果尚未确认')
    await expect(panel.getByLabel('个人标签名称', { exact: true })).toBeDisabled()
    await panel.getByRole('button', { name: '重试原标签操作', exact: true }).click()
    await expectTagMessage(panel, '个人标签已保存。')
    const requests = await application.evaluate(() => Reflect.get(globalThis, '__tagRequests'))
    expect(requests).toHaveLength(2)
    expect(requests[1]).toEqual(requests[0])
    const tags = await page.evaluate(() =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.personalTags.list(),
    )
    expect(tags).toMatchObject({ ok: true, value: [{ name: '需要再口述' }] })
    if (!tags.ok) throw new Error(tags.error.message)
    expect(tags.value).toHaveLength(1)
  } finally {
    await stop(application)
  }
})

test('个人标签重导入/归档保留，失效成员或真实写失败整批回滚，删除不扩大方案', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareControl(testDataDirectory, info, 3)
  try {
    const tagId = randomUUID()
    expect(await changeTag(page, { kind: 'save', tagId, name: 'Project' })).toMatchObject({
      ok: true,
    })
    expect(
      await changeTag(page, { kind: 'save', tagId: randomUUID(), name: 'pROJECT' }),
    ).toMatchObject({ ok: false, error: { code: 'INVALID_REQUEST' } })
    const assign = { kind: 'assign' as const, tagId, present: true, items: [a(1), b(2)] }
    expect(await changeTag(page, assign)).toMatchObject({ ok: true })
    expect(await changeTag(page, assign)).toMatchObject({ ok: true })
    const before = assignments(testDataDirectory)
    expect(
      await changeTag(page, {
        ...assign,
        items: [a(2), { topicId: 'missing', questionId: 'q-1' }],
      }),
    ).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } })
    expect(assignments(testDataDirectory)).toEqual(before)
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER tag_failure BEFORE INSERT ON question_personal_tags WHEN NEW.question_id=(SELECT id FROM questions WHERE topic_id='control-b' AND question_id='q-3') BEGIN SELECT RAISE(ABORT,'tag write'); END",
        ),
      false,
    )
    expect(await changeTag(page, { ...assign, items: [a(2), b(3)] })).toMatchObject({
      ok: false,
      error: { code: 'DATABASE_UNAVAILABLE' },
    })
    expect(assignments(testDataDirectory)).toEqual(before)
    withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER tag_failure'), false)
    await writeFile(file, controlBank('control-a', 3, true, 1))
    await importHistoryFiles(application, page, [file])
    expect(assignments(testDataDirectory)).toEqual(before)
    const options = { ...planOptions, filters: { ...planOptions.filters, personalTagId: tagId } }
    const planId = randomUUID()
    expect(
      await changePlan(page, { kind: 'save', planId, name: '标签条件', options }),
    ).toMatchObject({ ok: true })
    expect(
      await changeTag(page, { kind: 'rename', tagId, expectedName: 'Project', name: '项目用过' }),
    ).toMatchObject({ ok: true })
    expect((await readPlans(page))[0]).toMatchObject({
      personalTagMissing: false,
      matchingCount: 1,
    })
    const started = await startFlow(page, {
      ...options,
      requestId: randomUUID(),
      replace: null,
      sourcePlanId: planId,
    })
    if (!started.ok) throw new Error(started.error.message)
    expect(started.value.total).toBe(1)
    const queue = () =>
      withHistoryDatabase(testDataDirectory, (db) =>
        db
          .prepare(
            `SELECT q.topic_id AS topicId,q.question_id AS questionId FROM practice_items i JOIN questions q ON q.id=i.question_id WHERE i.session_id=? ORDER BY i.position`,
          )
          .all(started.value.sessionId),
      )
    expect(queue()).toEqual([b(2)])
    expect(await changeTag(page, { kind: 'delete', tagId, expectedName: 'Project' })).toMatchObject(
      { ok: false },
    )
    expect(
      await changeTag(page, { kind: 'delete', tagId, expectedName: '项目用过' }),
    ).toMatchObject({ ok: true })
    expect((await readPlans(page))[0]).toMatchObject({
      options,
      personalTagMissing: true,
      matchingCount: 0,
    })
    const selected = await page.evaluate(
      (filters) =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.library.listQuestions({
          topicId: null,
          archived: false,
          page: 1,
          filters,
        }),
      options.filters,
    )
    expect(selected).toMatchObject({ ok: true, value: { total: 0, questions: [] } })
    const { sessionId, position, revision } = started.value
    expect(
      await startFlow(page, {
        ...options,
        requestId: randomUUID(),
        replace: { sessionId, position, revision },
        sourcePlanId: planId,
      }),
    ).toMatchObject({ ok: false, error: { code: 'NO_QUESTIONS' } })
    expect(queue()).toEqual([b(2)])
  } finally {
    await stop(application)
  }
})

test('标签等待真实响应期间先保存笔记并锁定新增输入，刷新移除详情后文字保留', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info, 3)
  try {
    const panel = page
      .locator('details')
      .filter({ has: page.locator('summary', { hasText: /^个人标签（/ }) })
    await panel.locator('summary').click()
    await panel.getByLabel('个人标签名称', { exact: true }).fill('待讲清')
    await panel.getByRole('button', { name: '创建个人标签', exact: true }).click()
    await expectTagMessage(panel, '个人标签已保存。')
    const catalog = await page.evaluate(() =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.personalTags.list(),
    )
    if (!catalog.ok) throw new Error(catalog.error.message)
    const tagId = catalog.value[0]!.tagId
    await panel.getByLabel('操作的个人标签').selectOption(tagId)
    await panel.locator('summary').click()
    await changeTag(page, { kind: 'assign', tagId, present: true, items: [a(1)] })
    await openPage(page, '学习总览')
    await openPage(page, '题库')
    // 重新读取目录后使用真实筛选和明确勾选。
    await page
      .getByLabel('题库个人标签')
      .locator('option')
      .filter({ hasText: '待讲清' })
      .waitFor({ state: 'attached' })
    await page.getByLabel('题库个人标签').selectOption(tagId)
    await page.getByRole('button', { name: '筛选题库', exact: true }).click()
    await expect(page.locator('.question-row')).toHaveCount(1)
    await page.locator('.question-selection-row').getByRole('checkbox').check()
    const note = await openLibraryNote(page)
    const editor = note.getByRole('textbox', { name: '我的复习笔记', exact: true })
    await application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('personal-tags:change')
      ipcMain.removeHandler('personal-tags:change')
      ipcMain.handle('personal-tags:change', async (event, input) => {
        const result = await original(event, input)
        await new Promise<void>((resolve) => Reflect.set(globalThis, '__releaseTag', resolve))
        return result
      })
    })
    const text = 'DMA完成不等于串口发送完成，等待期间应保存这段理解'
    await editor.fill(text)
    await panel.locator('summary').click()
    await panel.getByRole('button', { name: '从勾选题目移除个人标签', exact: true }).click()
    await expect
      .poll(() => application.evaluate(() => typeof Reflect.get(globalThis, '__releaseTag')))
      .toBe('function')
    await expect(editor).not.toBeEditable()
    await editor.focus()
    await page.keyboard.type('LATE-INPUT')
    await expect(editor).toHaveValue(text)
    expect(await readNote(page)).toMatchObject({ ok: true, value: { text } })
    await application.evaluate(() => Reflect.get(globalThis, '__releaseTag')())
    await expect(page.locator('.question-row')).toHaveCount(0)
    expect(await readNote(page)).toMatchObject({ ok: true, value: { text } })
  } finally {
    await stop(application)
  }
})
