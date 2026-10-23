import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ElectronApplication } from '@playwright/test'
import {
  beginHistoryPractice,
  captureHistory,
  historySnapshot,
  prepareHistory,
  readHistory,
  readHistoryEntry,
  selectHistoryQuestion,
  stop,
  withHistoryDatabase,
} from './history-helpers'
import { expect, test } from './helpers'

async function counts(application: ElectronApplication) {
  return application.evaluate(
    () => Reflect.get(globalThis, 'historyCalls') as { list: number; entry: number },
  )
}
test('历史默认不读/不挂载，主动回看与自动保存保持，新题新轮重新关闭', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
  try {
    await application.evaluate(({ ipcMain }) => {
      const handlers = Reflect.get(ipcMain, '_invokeHandlers') as Map<
        string,
        (...args: unknown[]) => Promise<unknown>
      >
      const state = { list: 0, entry: 0 }
      Reflect.set(globalThis, 'historyCalls', state)
      for (const [channel, key] of [
        ['history:list', 'list'],
        ['history:get-entry', 'entry'],
      ] as const) {
        const original = handlers.get(channel)
        if (!original) throw new Error('缺少历史接口。')
        ipcMain.removeHandler(channel)
        ipcMain.handle(channel, async (...args) => {
          state[key]++
          return original(...args)
        })
      }
    })
    await beginHistoryPractice(page)
    expect(await counts(application)).toEqual({ list: 0, entry: 0 })
    expect(await page.content()).not.toMatch(/HISTORY-DRAFT|HISTORY-ANSWER/)
    expect(await page.locator('body').ariaSnapshot()).not.toMatch(/HISTORY-DRAFT|HISTORY-ANSWER/)
    expect(await page.getByRole('region', { name: '本题历史', exact: true }).count()).toBe(0)
    const before = historySnapshot(testDataDirectory)
    await page.getByRole('button', { name: '查看本题历史', exact: true }).click()
    const history = page.getByRole('region', { name: '本题历史', exact: true })
    await expect(history).toContainText('共 3 条历史记录')
    expect(await page.content()).not.toMatch(/HISTORY-DRAFT|HISTORY-ANSWER/)
    expect((await counts(application)).entry).toBe(0)
    await history.getByRole('button', { name: '展开本次记录', exact: true }).last().click()
    await expect(history.getByRole('region', { name: '历史作答', exact: true })).toContainText(
      'HISTORY-DRAFT-0',
    )
    await expect(history.locator('pre.history-draft')).toContainText('<script>literal</script>')
    expect(await history.locator('script').count()).toBe(0)
    await expect(history.getByRole('region', { name: '历史参考答案', exact: true })).toContainText(
      'HISTORY-ANSWER-OLD-history-a-1',
    )
    expect(await page.getByRole('region', { name: '练习参考答案', exact: true }).count()).toBe(0)
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    const requests = await counts(application)
    const input = page.getByRole('textbox', { name: '我的答案', exact: true })
    await input.fill('当前轮草稿，回看历史后继续输入')
    const geometry = () =>
      page.evaluate(() => {
        const browser = globalThis as unknown as {
          scrollY: number
          document: { activeElement: { id: string } | null }
        }
        return { scroll: browser.scrollY, active: browser.document.activeElement?.id }
      })
    const editing = await geometry()
    await expect(page.locator('.practice-save')).toHaveText('已保存')
    expect(
      withHistoryDatabase(
        testDataDirectory,
        (database) =>
          database
            .prepare(
              `SELECT i.draft
      FROM practice_items i JOIN practice_sessions s ON s.id=i.session_id
      WHERE s.status='active' AND i.position=s.position`,
            )
            .get()?.draft,
      ),
    ).toBe('当前轮草稿，回看历史后继续输入')
    expect(await geometry()).toEqual(editing)
    expect(await counts(application)).toEqual(requests)
    await expect(history.getByRole('button', { name: '收起本次记录', exact: true })).toBeVisible()
    await history.locator('pre.history-draft').scrollIntoViewIfNeeded()
    await expect(history.locator('pre.history-draft')).toBeInViewport()
    await captureHistory(application, page, info, 'history-expanded.png')
    await page.getByRole('button', { name: '跳过本题', exact: true }).click()
    await expect(page.getByLabel('练习进度')).toHaveText('第 2 / 2 题 · 顺序练习')
    expect(await page.getByRole('region', { name: '本题历史', exact: true }).count()).toBe(0)
    expect(await page.content()).not.toMatch(/HISTORY-DRAFT|HISTORY-ANSWER/)
    await page.getByRole('button', { name: '跳过本题', exact: true }).click()
    await page.getByRole('button', { name: '返回首页', exact: true }).click()
    await beginHistoryPractice(page)
    expect(await page.getByRole('region', { name: '本题历史', exact: true }).count()).toBe(0)
    expect(await page.content()).not.toMatch(/HISTORY-DRAFT|HISTORY-ANSWER/)
    await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue('')
    expect(await counts(application)).toEqual(requests)
    await info.attach('history-default-readonly-autosave.json', {
      body: JSON.stringify({
        before,
        requests,
        editing,
        final: historySnapshot(testDataDirectory),
      }),
      contentType: 'application/json',
    })
  } finally {
    await stop(application)
  }
})

test('历史真实读取失败与坏记录可重试，保留已存数据且诊断不包含旧作答', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareHistory(testDataDirectory, info.project.name, 1)
  let renamed = false
  let definition: { versionId: number; value: string } | undefined
  try {
    await selectHistoryQuestion(page)
    const before = historySnapshot(testDataDirectory)
    withHistoryDatabase(
      testDataDirectory,
      (database) => database.exec('ALTER TABLE practice_items RENAME TO history_fault_items'),
      false,
    )
    renamed = true
    await page.getByRole('button', { name: '查看本题历史', exact: true }).click()
    const history = page.getByRole('region', { name: '本题历史', exact: true })
    await expect(history.getByRole('alert')).toContainText('题库服务暂不可用')
    expect(await history.getByText('尚无历史记录。', { exact: true }).count()).toBe(0)
    withHistoryDatabase(
      testDataDirectory,
      (database) => database.exec('ALTER TABLE history_fault_items RENAME TO practice_items'),
      false,
    )
    renamed = false
    await history.getByRole('button', { name: '重试读取历史', exact: true }).click()
    await expect(history).toContainText('共 1 条历史记录')
    const record = (await readHistory(page)).entries[0]!
    definition = withHistoryDatabase(testDataDirectory, (database) => ({
      versionId: record.versionId,
      value: String(
        database
          .prepare('SELECT definitions_json AS value FROM question_versions WHERE id = ?')
          .get(record.versionId)?.value,
      ),
    }))
    withHistoryDatabase(
      testDataDirectory,
      (database) =>
        database
          .prepare('UPDATE question_versions SET definitions_json = ? WHERE id = ?')
          .run('{"invalid":"HISTORY-DRAFT-SENSITIVE"}', record.versionId),
      false,
    )
    await history.getByRole('button', { name: '展开本次记录', exact: true }).click()
    await expect(history.getByRole('alert')).toContainText('题库服务暂不可用')
    withHistoryDatabase(
      testDataDirectory,
      (database) =>
        database
          .prepare('UPDATE question_versions SET definitions_json = ? WHERE id = ?')
          .run(definition!.value, definition!.versionId),
      false,
    )
    definition = undefined
    await history.getByRole('button', { name: '重试读取本次记录', exact: true }).click()
    await expect(history.getByRole('region', { name: '历史作答', exact: true })).toContainText(
      'HISTORY-DRAFT-0',
    )
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    const log = await readFile(join(testDataDirectory, 'logs/application.log'), 'utf8')
    expect(log).toContain('题库接口数据校验失败。')
    expect(log).not.toMatch(/HISTORY-DRAFT-SENSITIVE|HISTORY-DRAFT-0|literal/)
    await info.attach('history-read-failure-retry.json', {
      body: JSON.stringify({
        before,
        after: historySnapshot(testDataDirectory),
        diagnosticSanitized: true,
      }),
      contentType: 'application/json',
    })
  } finally {
    try {
      if (renamed)
        withHistoryDatabase(
          testDataDirectory,
          (database) => database.exec('ALTER TABLE history_fault_items RENAME TO practice_items'),
          false,
        )
      if (definition)
        withHistoryDatabase(
          testDataDirectory,
          (database) =>
            database
              .prepare('UPDATE question_versions SET definitions_json = ? WHERE id = ?')
              .run(definition!.value, definition!.versionId),
          false,
        )
    } finally {
      await stop(application)
    }
  }
})

for (const channel of ['history:list', 'history:get-entry']) {
  test(`切题后晚到的 ${channel} 不覆盖另一题或泄露旧内容`, async ({ testDataDirectory }, info) => {
    const { application, page } = await prepareHistory(testDataDirectory, info.project.name)
    try {
      await selectHistoryQuestion(page)
      const before = historySnapshot(testDataDirectory)
      await application.evaluate(({ ipcMain }, name) => {
        const handlers = Reflect.get(ipcMain, '_invokeHandlers') as Map<
          string,
          (...args: unknown[]) => Promise<unknown>
        >
        const original = handlers.get(name)
        if (!original) throw new Error('缺少历史接口。')
        const control = { started: 0, returned: 0, hold: true, releases: [] as (() => void)[] }
        Reflect.set(globalThis, 'historyResponseControl', control)
        ipcMain.removeHandler(name)
        ipcMain.handle(name, async (...args) => {
          const result = await original(...args)
          const request = args[1] as { topicId: string; questionId: string }
          if (control.hold && request.topicId === 'history-a' && request.questionId === 'q-1') {
            control.started++
            await new Promise<void>((done) => control.releases.push(done))
            control.returned++
          }
          return result
        })
      }, channel)
      await page.getByRole('button', { name: '查看本题历史', exact: true }).click()
      if (channel === 'history:get-entry') {
        const history = page.getByRole('region', { name: '本题历史', exact: true })
        await expect(history).toContainText('共 3 条历史记录')
        await history.getByRole('button', { name: '展开本次记录', exact: true }).last().click()
      }
      const state = () =>
        application.evaluate(() => {
          const control = Reflect.get(globalThis, 'historyResponseControl') as {
            started: number
            returned: number
          }
          return { started: control.started, returned: control.returned }
        })
      await expect.poll(async () => (await state()).started).toBeGreaterThan(0)
      await selectHistoryQuestion(page, 'q-2')
      expect(await page.getByRole('region', { name: '本题历史', exact: true }).count()).toBe(0)
      await page.getByRole('button', { name: '查看本题历史', exact: true }).click()
      const target = await readHistory(page, { questionId: 'q-2' })
      const history = page.getByRole('region', { name: '本题历史', exact: true })
      await expect(history).toContainText(`共 ${target.total} 条历史记录`)
      await history.getByRole('button', { name: '展开本次记录', exact: true }).first().click()
      await expect(history).toContainText('本次尚未揭晓参考答案。')
      const held = (await state()).started
      await application.evaluate(() => {
        const control = Reflect.get(globalThis, 'historyResponseControl') as {
          hold: boolean
          releases: (() => void)[]
        }
        control.hold = false
        control.releases.splice(0).forEach((done) => done())
      })
      await expect.poll(async () => (await state()).returned).toBe(held)
      if (channel === 'history:list') await readHistory(page, { questionId: 'q-2' })
      else await readHistoryEntry(page, target.entries[0]!, 'history-a', 'q-2')
      await page.evaluate(
        () =>
          new Promise<void>((done) => {
            const browser = globalThis as unknown as {
              requestAnimationFrame: (callback: () => void) => void
            }
            browser.requestAnimationFrame(() => browser.requestAnimationFrame(() => done()))
          }),
      )
      await expect(history.getByRole('heading', { name: '历史题 1', exact: true })).toHaveCount(0)
      expect(await history.textContent()).not.toMatch(/HISTORY-DRAFT|HISTORY-ANSWER/)
      await expect(history.getByRole('heading', { name: '历史题 2', exact: true })).toHaveCount(
        target.total,
      )
      expect(historySnapshot(testDataDirectory)).toEqual(before)
      await info.attach('history-late-response.json', {
        body: JSON.stringify({ channel, held, returned: await state(), target, unchanged: true }),
        contentType: 'application/json',
      })
    } finally {
      await stop(application)
    }
  })
}
