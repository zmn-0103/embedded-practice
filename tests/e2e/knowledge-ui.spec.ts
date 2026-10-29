import { writeFile } from 'node:fs/promises'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, openPage, test } from './helpers'
import { captureHistory, importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
import { a, b, controlBank, prepareControl } from './practice-control-helpers'
import {
  createRelation,
  openKnowledge,
  openQuestionRelations,
  relations,
} from './knowledge-helpers'
import { createStudyRound, readNote, saveNote } from './study-helpers'
import { chooseTheme } from './theme-helpers'

test('积累检索分类/最近词/跨页，详情返回保留条件/结果/滚动，保存笔记后明确刷新', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info)
  try {
    for (let n = 1; n <= 27; n++)
      expect(
        await saveNote(page, {
          ...a(n),
          expectedRevision: 0,
          text: `SEARCH-RECALL ${n} ORIGINAL 中文理解`,
        }),
      ).toMatchObject({ ok: true })
    const panel = await openKnowledge(page)
    await panel.getByLabel('积累排序', { exact: true }).selectOption('default')
    await panel.getByLabel('积累关键词', { exact: true }).fill('SEARCH-RECALL')
    await panel.getByRole('button', { name: '检索我的积累', exact: true }).click()
    await expect(panel.getByText(/^匹配 27 道题/)).toBeVisible()
    await panel
      .getByRole('navigation', { name: '积累检索分页', exact: true })
      .getByRole('button', { name: '下一页', exact: true })
      .click()
    await expect(
      panel.getByRole('navigation', { name: '积累检索分页', exact: true }),
    ).toContainText('2 / 2')
    const result = panel.getByRole('button', {
      name: '组卷题 A 25 · control-a / q-25',
      exact: true,
    })
    await result.scrollIntoViewIfNeeded()
    const scroll = await page.evaluate(() => Reflect.get(globalThis, 'scrollY'))
    const history = await page.evaluate(() =>
      (globalThis as unknown as { desktop: DesktopApi }).desktop.knowledge.recent(),
    )
    expect(history).toMatchObject({ ok: true, value: [{ query: 'SEARCH-RECALL' }] })
    await result.click()
    await expect(panel.getByRole('article', { name: '题目内容', exact: true })).toContainText(
      '组卷题 A 25',
    )
    await panel.locator('.personal-note > summary').click()
    await panel
      .getByRole('textbox', { name: '我的复习笔记', exact: true })
      .fill('SEARCH-RECALL 新理解 <script>notExecutable()</script>')
    await panel.getByRole('button', { name: '返回原检索结果', exact: true }).click()
    await expect(panel.getByLabel('积累关键词', { exact: true })).toHaveValue('SEARCH-RECALL')
    await expect(
      panel.getByRole('navigation', { name: '积累检索分页', exact: true }),
    ).toContainText('2 / 2')
    await expect
      .poll(async () =>
        Math.abs((await page.evaluate(() => Reflect.get(globalThis, 'scrollY'))) - scroll),
      )
      .toBeLessThanOrEqual(4)
    await expect(panel.locator('.knowledge-results')).toContainText('SEARCH-RECALL 25 ORIGINAL')
    expect(await readNote(page, a(25))).toMatchObject({
      ok: true,
      value: { revision: 2, text: 'SEARCH-RECALL 新理解 <script>notExecutable()</script>' },
    })
    await panel.getByRole('button', { name: '刷新当前检索', exact: true }).click()
    await expect(panel.locator('.knowledge-results')).toContainText(
      'SEARCH-RECALL 新理解 <script>notExecutable()</script>',
    )
    await expect(panel.locator('.knowledge-results script')).toHaveCount(0)
    expect(
      await page.evaluate(() =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.knowledge.recent(),
      ),
    ).toEqual(history)
    await captureHistory(application, page, info, 'knowledge-search-results.png')
    await panel.locator('.knowledge-recent > summary').click()
    await expect(
      panel
        .locator('.knowledge-recent')
        .getByRole('button', { name: 'SEARCH-RECALL', exact: true }),
    ).toBeVisible()
    await panel.getByRole('button', { name: '清空最近搜索', exact: true }).click()
    await expect(panel.getByText('尚无最近搜索。', { exact: true })).toBeVisible()
  } finally {
    await stop(application)
  }
})

test('关联UI真实失败/退出保护、提交后坏回包原命令重试，过期冲突保留后明确放弃及删除', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info, 3)
  try {
    const panel = await openQuestionRelations(page)
    await panel.getByLabel('查找关联题', { exact: true }).fill('组卷题 B 2')
    await panel.getByRole('button', { name: '查找关联目标题', exact: true }).click()
    await panel
      .getByRole('button', { name: '关联到：组卷题 B 2 · control-b / q-2', exact: true })
      .click()
    await panel.getByLabel('关联类型', { exact: true }).selectOption('prerequisite')
    const text = panel.getByRole('textbox', { name: '关联对比说明', exact: true })
    await text.fill('失败与未知结果时保留这段对比说明')
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER fail_relation_ui BEFORE INSERT ON question_relations BEGIN SELECT RAISE(ABORT,'relation ui insert'); END",
        ),
      false,
    )
    await panel.getByRole('button', { name: '保存关联', exact: true }).click()
    await expect(panel.getByRole('alert')).toBeVisible()
    await expect(text).toHaveValue('失败与未知结果时保留这段对比说明')
    await expect(
      page
        .getByRole('navigation', { name: '主要页面', exact: true })
        .getByRole('link', { name: '学习总览', exact: true }),
    ).toHaveAttribute('aria-disabled', 'true')
    await application.evaluate(({ dialog }) => {
      dialog.showMessageBox = async () => {
        Reflect.set(globalThis, '__knowledgeCloseRejected', true)
        return { response: 0, checkboxChecked: false }
      }
    })
    await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.close())
    await expect
      .poll(() => application.evaluate(() => Reflect.get(globalThis, '__knowledgeCloseRejected')))
      .toBe(true)
    expect(application.windows()).toHaveLength(1)
    withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER fail_relation_ui'), false)
    await application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('knowledge:change-relation')
      Reflect.set(globalThis, '__knowledgeCommands', [])
      ipcMain.removeHandler('knowledge:change-relation')
      ipcMain.handle('knowledge:change-relation', async (event, input) => {
        const calls = Reflect.get(globalThis, '__knowledgeCommands')
        calls.push(input)
        const result = await original(event, input)
        return calls.length === 1 ? { invalid: true } : result
      })
    })
    await panel.getByRole('button', { name: '重试原关联保存', exact: true }).click()
    await expect(panel.getByRole('alert')).toContainText('尚未确认')
    await panel.getByRole('button', { name: '重试原关联保存', exact: true }).click()
    await expect(panel.getByText('关联已保存。', { exact: true })).toBeVisible()
    await expect(panel.getByText('正在读取题目关联…', { exact: true })).toBeHidden()
    const calls = await application.evaluate(() => Reflect.get(globalThis, '__knowledgeCommands'))
    expect(calls).toHaveLength(2)
    expect(calls[1]).toEqual(calls[0])
    const saved = (await relations(page)).items[0]!
    expect(saved).toMatchObject({ revision: 1, kind: 'prerequisite', target: b(2) })
    await panel.getByRole('button', { name: '编辑这条关联', exact: true }).click()
    await panel
      .getByRole('textbox', { name: '关联对比说明', exact: true })
      .fill('本地过期说明必须保留')
    const changed = await page.evaluate(
      (input) =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.knowledge.changeRelation(input),
      {
        action: 'save' as const,
        relationId: saved.relationId,
        expectedRevision: 1,
        source: saved.source,
        target: saved.target,
        kind: saved.kind,
        explanation: '另一编辑器的新说明',
      },
    )
    expect(changed.ok).toBe(true)
    await panel.getByRole('button', { name: '保存关联', exact: true }).click()
    await expect(panel.getByRole('alert')).toContainText('关联已变化')
    await expect(panel.getByRole('textbox', { name: '关联对比说明', exact: true })).toHaveValue(
      '本地过期说明必须保留',
    )
    await panel.getByRole('button', { name: '放弃本地关联编辑…', exact: true }).click()
    await panel.getByRole('button', { name: '保留关联输入', exact: true }).click()
    await expect(panel.getByRole('textbox', { name: '关联对比说明', exact: true })).toHaveValue(
      '本地过期说明必须保留',
    )
    await panel.getByRole('button', { name: '放弃本地关联编辑…', exact: true }).click()
    await panel.getByRole('button', { name: '放弃本地并刷新关联', exact: true }).click()
    await expect(panel.locator('.relation-list')).toContainText('另一编辑器的新说明')
    await panel.getByRole('button', { name: '删除这条关联…', exact: true }).click()
    await panel.getByRole('button', { name: '取消删除关联', exact: true }).click()
    expect((await relations(page)).total).toBe(1)
    await panel.getByRole('button', { name: '删除这条关联…', exact: true }).click()
    await panel.getByRole('button', { name: '确认删除关联', exact: true }).click()
    await expect(panel.getByText('关联已删除。', { exact: true })).toBeVisible()
    expect((await relations(page)).total).toBe(0)
    await captureHistory(application, page, info, 'knowledge-relation-saved.png')
  } finally {
    await stop(application)
  }
})

test('双向前置/对照笔记先保存，从关联题进入原确认并采用固定当前版本', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info, 3)
  try {
    const original = await createRelation(page, a(1), b(2))
    expect(
      await page.evaluate(
        (input) =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.knowledge.changeRelation(
            input,
          ),
        {
          action: 'save' as const,
          relationId: original.relationId,
          expectedRevision: 1,
          source: a(1),
          target: b(2),
          kind: 'prerequisite' as const,
          explanation: 'B是A的前置，需对照口述',
        },
      ),
    ).toMatchObject({ ok: true })
    const panel = await openQuestionRelations(page, b(2))
    await expect(panel.locator('.relation-list')).toContainText(
      '后续知识（以本题为前置） · 组卷题 A 1',
    )
    await panel.getByRole('button', { name: '对照这两题', exact: true }).click()
    const compare = panel.getByRole('region', { name: '关联题对照', exact: true })
    await expect(compare.getByRole('article', { name: '关联来源题', exact: true })).toContainText(
      'CONTROL-OLD-BODY-control-a-1',
    )
    await expect(compare.getByRole('article', { name: '关联目标题', exact: true })).toContainText(
      'CONTROL-OLD-BODY-control-b-2',
    )
    await expect(compare).not.toContainText('CONTROL-OLD-ANSWER')
    const sourceNote = compare
      .getByRole('article', { name: '关联来源题', exact: true })
      .locator('.personal-note')
    await sourceNote.locator('summary').click()
    await sourceNote
      .getByRole('textbox', { name: '我的复习笔记', exact: true })
      .fill('关闭对照前先保存：DMA完成与TC区别')
    await captureHistory(application, page, info, 'knowledge-pair-comparison.png')
    await panel.getByRole('button', { name: '关闭关联题对照', exact: true }).click()
    expect(await readNote(page)).toMatchObject({
      ok: true,
      value: { text: '关闭对照前先保存：DMA完成与TC区别' },
    })
    await panel.getByRole('checkbox', { name: '勾选关联题：control-a / q-1', exact: true }).check()
    await panel.getByRole('button', { name: '确认当前题与勾选关联题并练习…', exact: true }).click()
    const preview = page.getByRole('region', { name: '确认勾选组卷', exact: true })
    await expect(
      preview.getByRole('heading', { name: '关联题对照练习', exact: true }),
    ).toBeVisible()
    await preview.getByRole('button', { name: '返回条件选题', exact: true }).click()
    const explorer = await openKnowledge(page)
    await explorer
      .getByRole('button', { name: '组卷题 A 1 · control-a / q-1', exact: true })
      .click()
    await explorer.locator('.question-relations > summary').click()
    await explorer
      .getByRole('checkbox', { name: '勾选关联题：control-b / q-2', exact: true })
      .check()
    await explorer
      .getByRole('button', { name: '确认当前题与勾选关联题并练习…', exact: true })
      .click()
    await expect(
      preview.getByRole('heading', { name: '关联题对照练习', exact: true }),
    ).toBeVisible()
    await preview.getByRole('button', { name: '确认开始组卷（2题）', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toHaveText('第 1 / 2 题 · 顺序练习')
    expect(
      withHistoryDatabase(testDataDirectory, (db) =>
        db
          .prepare(
            'SELECT q.topic_id,q.question_id FROM practice_items p JOIN questions q ON q.id=p.question_id ORDER BY p.position',
          )
          .all(),
      ),
    ).toEqual([
      { topic_id: 'control-a', question_id: 'q-1' },
      { topic_id: 'control-b', question_id: 'q-2' },
    ])
  } finally {
    await stop(application)
  }
})

test('练习揭晓前不读关联/搜索，旧轮复盘对照当前题干且不改旧轮次', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareControl(testDataDirectory, info, 3)
  try {
    await createRelation(page)
    const round = await createStudyRound(page, '旧轮回答保持')
    await application.evaluate(({ ipcMain }) => {
      const handlers = Reflect.get(ipcMain, '_invokeHandlers')
      Reflect.set(globalThis, '__knowledgeReads', { relations: 0, search: 0 })
      for (const [channel, key] of [
        ['knowledge:relations', 'relations'],
        ['knowledge:search', 'search'],
      ] as const) {
        const original = handlers.get(channel)
        ipcMain.removeHandler(channel)
        ipcMain.handle(channel, (event, input) => {
          Reflect.get(globalThis, '__knowledgeReads')[key]++
          return original(event, input)
        })
      }
    })
    await openPage(page, '开始练习')
    await page.getByLabel('练习专题', { exact: true }).selectOption('control-a')
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    await expect(page.locator('.practice-reference-column .question-relations')).toHaveCount(0)
    expect(await application.evaluate(() => Reflect.get(globalThis, '__knowledgeReads'))).toEqual({
      relations: 0,
      search: 0,
    })
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    const panel = page.locator('.practice-reference-column .question-relations')
    await expect(panel).not.toHaveAttribute('open')
    expect(await application.evaluate(() => Reflect.get(globalThis, '__knowledgeReads'))).toEqual({
      relations: 0,
      search: 0,
    })
    await panel.locator(':scope > summary').click()
    await expect(panel).toContainText('DMA完成不等于UART完成')
    await page.getByRole('button', { name: '保存并返回', exact: true }).click()
    await writeFile(file, controlBank('control-a', 3, true))
    await importHistoryFiles(application, page, [file])
    const before = withHistoryDatabase(testDataDirectory, (db) =>
      db.prepare('SELECT * FROM practice_items ORDER BY rowid').all(),
    )
    await openPage(page, '学习记录')
    await page.getByRole('tab', { name: '按轮次复盘', exact: true }).click()
    await page
      .locator(`.round-list [data-session-id="${round.sessionId}"]`)
      .getByRole('button', { name: '查看这一轮', exact: true })
      .click()
    const detail = page.getByLabel('按轮次复盘详情', { exact: true })
    await detail.getByRole('button', { name: '查看本轮第1题', exact: true }).click()
    await detail.locator('.question-relations > summary').click()
    await detail.getByRole('button', { name: '对照这两题', exact: true }).click()
    await expect(detail.getByRole('region', { name: '关联题对照', exact: true })).toContainText(
      'CONTROL-NEW-BODY-control-a-1',
    )
    expect(
      withHistoryDatabase(testDataDirectory, (db) =>
        db.prepare('SELECT * FROM practice_items ORDER BY rowid').all(),
      ),
    ).toEqual(before)
  } finally {
    await stop(application)
  }
})

test('我的积累与关联对照在900宽/150%暗色可操作、中文混排不横向溢出', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareControl(testDataDirectory, info, 3)
  try {
    await saveNote(page, {
      ...a(1),
      expectedRevision: 0,
      text: 'DMA完成不等于UART完成，需对照说明',
    })
    await createRelation(page)
    await chooseTheme(page, '松间绿', 'dark')
    const window = await application.browserWindow(page)
    await window.evaluate((window) => {
      window.setContentSize(900, 800)
      window.webContents.setZoomFactor(1.5)
    })
    const panel = await openKnowledge(page)
    await panel.getByLabel('积累关键词', { exact: true }).fill('DMA')
    await panel.getByRole('button', { name: '检索我的积累', exact: true }).click()
    await expect(panel.getByText(/^匹配 1 道题/)).toBeVisible()
    await captureHistory(application, page, info, 'knowledge-narrow-dark-search.png')
    await panel.getByRole('button', { name: '组卷题 A 1 · control-a / q-1', exact: true }).click()
    await panel.locator('.question-relations > summary').click()
    await panel.getByRole('button', { name: '对照这两题', exact: true }).click()
    await expect(panel.getByRole('region', { name: '关联题对照', exact: true })).toContainText(
      'CONTROL-OLD-BODY-control-b-1',
    )
    const sizes = await page.locator('html').evaluate((element) => ({
      scroll: Reflect.get(element, 'scrollWidth'),
      client: Reflect.get(element, 'clientWidth'),
    }))
    expect(sizes.scroll).toBeLessThanOrEqual(sizes.client + 1)
    await captureHistory(application, page, info, 'knowledge-narrow-dark-comparison.png')
    await panel.getByRole('button', { name: '返回原检索结果', exact: true }).click()
    await expect(panel.getByLabel('积累关键词', { exact: true })).toHaveValue('DMA')
  } finally {
    await stop(application)
  }
})
