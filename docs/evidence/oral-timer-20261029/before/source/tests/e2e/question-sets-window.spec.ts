import { randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, openPage, test } from './helpers'
import { historySnapshot, importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
import {
  a,
  b,
  changeSet,
  controlBank,
  prepareControl,
  previewSet,
  readSets,
} from './practice-control-helpers'

test('跨专题/分页/页面保持勾选，题单改名更新后只填入确认，开始才建立指定顺序', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info)
  try {
    const before = historySnapshot(testDataDirectory)
    await page.getByLabel('专题', { exact: true }).selectOption('control-a')
    await page.getByRole('checkbox', { name: /^勾选题目：control-a \/ q-1 / }).check()
    await page.getByLabel('专题', { exact: true }).selectOption('control-b')
    await page.getByRole('checkbox', { name: /^勾选题目：control-b \/ q-2 / }).check()
    await openPage(page, '学习总览')
    await openPage(page, '题库')
    await page.getByLabel('专题', { exact: true }).selectOption('control-a')
    await expect(page.getByRole('checkbox', { name: /^勾选题目：control-a \/ q-1 / })).toBeChecked()
    await page
      .getByRole('navigation', { name: '题目分页', exact: true })
      .getByRole('button', { name: '下一页', exact: true })
      .click()
    await page.getByRole('checkbox', { name: /^勾选题目：control-a \/ q-27 / }).check()
    await page.locator('.question-selection-panel > summary').click()
    const panel = page.getByLabel('勾选组卷与固定题单', { exact: true })
    await panel.getByLabel('题单名称', { exact: true }).fill('中断与DMA准备')
    await panel.getByRole('button', { name: '保存为新题单', exact: true }).click()
    await expect(panel.getByRole('status')).toHaveText('固定题单已保存。')
    const saved = (await readSets(page))[0]!
    expect((await previewSet(page, { setId: saved.setId })).definition?.items).toEqual([
      a(1),
      b(2),
      a(27),
    ])
    await panel.getByLabel('题单名称', { exact: true }).fill('面试精选')
    await panel.getByRole('button', { name: '更新已载入题单…', exact: true }).click()
    await expect(panel.getByRole('alertdialog')).toContainText('包含3题')
    await panel.getByRole('button', { name: '确认题单操作', exact: true }).click()
    await expect.poll(async () => (await readSets(page))[0]?.name).toBe('面试精选')
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    await info.attach('question-sets-wide.png', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
    await panel.getByRole('button', { name: '确认这批题目并练习…', exact: true }).click()
    const confirm = page.getByLabel('确认勾选组卷', { exact: true })
    await expect(confirm).toContainText('题单：面试精选')
    await expect(
      confirm.getByRole('button', { name: '确认开始组卷（3题）', exact: true }),
    ).toBeEnabled()
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    await info.attach('selected-practice-confirm.png', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
    await confirm.getByRole('button', { name: '确认开始组卷（3题）', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toHaveText('第 1 / 3 题 · 顺序练习')
    expect(
      withHistoryDatabase(testDataDirectory, (db) =>
        db
          .prepare(
            'SELECT q.topic_id AS topicId,q.question_id AS questionId FROM practice_items i JOIN questions q ON q.id=i.question_id ORDER BY i.position',
          )
          .all(),
      ),
    ).toEqual([a(1), b(2), a(27)])
    await expect(page.getByLabel('练习参考答案', { exact: true })).toHaveCount(0)
  } finally {
    await stop(application)
  }
})

test('本页批量勾选去重且不替换之前页，清空勾选保留已保存题单', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info)
  try {
    await page.getByLabel('专题', { exact: true }).selectOption('control-a')
    await page.getByRole('checkbox', { name: /^勾选题目：control-a \/ q-1 / }).check()
    await page.getByRole('button', { name: '勾选本页有效题', exact: true }).click()
    await expect(page.getByText('已勾选 20 题', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: '勾选本页有效题', exact: true }).click()
    await expect(page.getByText('已勾选 20 题', { exact: true })).toBeVisible()
    await page
      .getByRole('navigation', { name: '题目分页', exact: true })
      .getByRole('button', { name: '下一页', exact: true })
      .click()
    await expect(
      page.getByRole('checkbox', { name: /^勾选题目：control-a \/ q-27 / }),
    ).toBeVisible()
    await page.getByRole('button', { name: '勾选本页有效题', exact: true }).click()
    await expect(page.getByText('已勾选 27 题', { exact: true })).toBeVisible()
    await page.locator('.question-selection-panel > summary').click()
    const panel = page.getByLabel('勾选组卷与固定题单', { exact: true })
    await panel.getByLabel('题单名称', { exact: true }).fill('全专题明确题单')
    await panel.getByRole('button', { name: '保存为新题单', exact: true }).click()
    await expect(panel.getByRole('status')).toHaveText('固定题单已保存。')
    await panel.getByRole('button', { name: '清空临时勾选', exact: true }).click()
    await expect(
      panel.getByRole('button', { name: '确认这批题目并练习…', exact: true }),
    ).toBeDisabled()
    expect((await readSets(page))[0]?.count).toBe(27)
  } finally {
    await stop(application)
  }
})

test('固定题单载入明确显示归档与失效，移除仅本轮且不补题', async ({ testDataDirectory }, info) => {
  const { application, page, file } = await prepareControl(testDataDirectory, info)
  try {
    const definition = { setId: randomUUID(), name: '保留失效题单', items: [a(1), a(2), b(2)] }
    expect(await changeSet(page, { ...definition, kind: 'save' })).toMatchObject({ ok: true })
    await writeFile(file, controlBank('control-a', 27, true, 2))
    await importHistoryFiles(application, page, [file])
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db
          .prepare('UPDATE question_set_items SET question_id=? WHERE set_id=? AND position=2')
          .run('q-missing', definition.setId),
      false,
    )
    await page.reload()
    await openPage(page, '题库')
    await page.locator('.question-selection-panel > summary').click()
    const panel = page.getByLabel('勾选组卷与固定题单', { exact: true })
    await panel.getByLabel('选用固定题单', { exact: true }).selectOption(definition.setId)
    await panel.getByRole('button', { name: '载入题单并替换当前勾选', exact: true }).click()
    await expect(panel).toContainText('有2项归档或失效')
    await panel.getByRole('button', { name: '确认这批题目并练习…', exact: true }).click()
    const confirm = page.getByLabel('确认勾选组卷', { exact: true })
    await expect(
      confirm.getByRole('button', { name: '确认开始组卷（3题）', exact: true }),
    ).toBeDisabled()
    await expect(confirm).toContainText('已归档')
    await expect(confirm).toContainText('已失效')
    await info.attach('selected-practice-unavailable.png', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
    await confirm.getByRole('button', { name: '从本轮移除不可用项', exact: true }).click()
    await expect(
      confirm.getByRole('button', { name: '确认开始组卷（1题）', exact: true }),
    ).toBeEnabled()
    await confirm.getByRole('button', { name: '确认开始组卷（1题）', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toHaveText('第 1 / 1 题 · 顺序练习')
    expect((await previewSet(page, { setId: definition.setId })).definition?.items).toHaveLength(3)
  } finally {
    await stop(application)
  }
})

test('题单已写入但响应丢失，正常关闭返回窗口，原UUID重试不重复保存', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info)
  try {
    await page.getByRole('checkbox', { name: /^勾选题目：control-a \/ q-1 / }).check()
    await page.locator('.question-selection-panel > summary').click()
    const panel = page.getByLabel('勾选组卷与固定题单', { exact: true })
    await application.evaluate(({ ipcMain, dialog }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('question-sets:change')
      const commands: unknown[] = []
      Reflect.set(globalThis, '__setCommands', commands)
      let drop = true
      ipcMain.removeHandler('question-sets:change')
      ipcMain.handle('question-sets:change', async (event, command) => {
        commands.push(structuredClone(command))
        const result = await original(event, command)
        if (drop) {
          drop = false
          return { ok: true, value: 'invalid reply' }
        }
        return result
      })
      dialog.showMessageBox = (async () => {
        Reflect.set(globalThis, '__setCloseSeen', true)
        return { response: 0, checkboxChecked: false }
      }) as typeof dialog.showMessageBox
    })
    await panel.getByLabel('题单名称', { exact: true }).fill('响应未知题单')
    await panel.getByRole('button', { name: '保存为新题单', exact: true }).click()
    await expect(panel.getByRole('alert')).toContainText('结果尚未确认')
    await expect(panel.getByLabel('题单名称', { exact: true })).toBeDisabled()
    await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.close())
    await expect
      .poll(() => application.evaluate(() => Reflect.get(globalThis, '__setCloseSeen')))
      .toBe(true)
    expect(application.process().exitCode).toBeNull()
    await panel.getByRole('button', { name: '重试原题单操作', exact: true }).click()
    await expect(panel.getByRole('status')).toHaveText('固定题单已保存。')
    const commands = await application.evaluate(() => Reflect.get(globalThis, '__setCommands'))
    expect(commands).toHaveLength(2)
    expect(commands[1]).toEqual(commands[0])
    expect(await readSets(page)).toHaveLength(1)
    await expect(page.getByRole('link', { name: '设置与数据', exact: true })).toHaveAttribute(
      'aria-disabled',
      'false',
    )
    // 停止重试为用户显式解锁路径，不删除已经成功保存的定义。
    const current = await page.evaluate(() =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
    )
    expect(current).toEqual({ ok: true, value: null })
  } finally {
    await stop(application)
  }
})
