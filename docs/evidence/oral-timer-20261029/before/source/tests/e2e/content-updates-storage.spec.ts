import { randomUUID } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, launchApplication, openPage, test } from './helpers'
import { importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
import { changeSet, controlBank, controlRecords } from './practice-control-helpers'
import { startFlow } from './practice-flow-helpers'
import { closeNormally, readNote, saveNote } from './study-helpers'
import {
  a,
  b,
  currentVersion,
  prepareUpdates,
  readUpdateRound,
  updatesBank,
  updatesSelection,
} from './content-updates-helpers'

test('更新复习重开及完整备份恢复保留原队列/版本/草稿/笔记，后续更新归档不替换旧轮', async ({
  testDataDirectory,
}, info) => {
  const prepared = await prepareUpdates(testDataDirectory, info)
  const destination = await mkdtemp(join(tmpdir(), 'embedded-practice-updates-restore-'))
  const opened = [prepared.application]
  let completed = false
  try {
    expect(
      await saveNote(prepared.page, { ...a(1), expectedRevision: 0, text: '更新后的理解仍须保留' }),
    ).toMatchObject({ ok: true })
    expect(
      await changeSet(prepared.page, {
        kind: 'save',
        setId: randomUUID(),
        name: '待更新复习题单',
        items: [a(1), b(1)],
      }),
    ).toMatchObject({ ok: true })
    const selected = await updatesSelection(prepared.page)
    const started = await startFlow(prepared.page, {
      requestId: randomUUID(),
      topicId: null,
      count: 'all',
      replace: null,
      selected,
    })
    if (!started.ok) throw new Error(started.error.message)
    expect(
      await prepared.page.evaluate(
        (sessionId) =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.saveDraft({
            sessionId,
            position: 0,
            draft: { revision: 1, text: '更新第二版独立草稿' },
          }),
        started.value.sessionId,
      ),
    ).toMatchObject({ ok: true })
    await writeFile(prepared.file, updatesBank(3))
    await writeFile(prepared.other, controlBank('control-b', 3, true, 1))
    await importHistoryFiles(prepared.application, prepared.page, [prepared.file, prepared.other])
    const before = withHistoryDatabase(testDataDirectory, controlRecords)
    await closeNormally(prepared.application)
    const reopened = await launchApplication(testDataDirectory, info.project.name)
    opened.push(reopened.application)
    expect(withHistoryDatabase(testDataDirectory, controlRecords)).toEqual(before)
    const round = await readUpdateRound(reopened.page)
    expect(round.item).toMatchObject({
      ...a(1),
      versionId: selected.items[0]!.versionId,
      revealed: false,
      body: { markdown: expect.stringContaining('UPDATES-BODY-2-1') },
      draft: { text: '更新第二版独立草稿' },
    })
    expect(round.item).not.toHaveProperty('answer')
    expect(round.session.selectionName).toBe(selected.sourceName)
    expect((await currentVersion(reopened.page)).versionId).not.toBe(round.item!.versionId)
    const backup = info.outputPath('更新复习完整备份.sqlite3')
    await openPage(reopened.page, '备份恢复')
    await reopened.application.evaluate(({ dialog }, filePath) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath })
    }, backup)
    await reopened.page.getByRole('button', { name: '导出完整备份', exact: true }).click()
    await expect(reopened.page.getByText('完整备份已导出并校验。', { exact: true })).toBeVisible()
    const bytes = await readFile(backup)
    const empty = await launchApplication(destination, info.project.name, '备份恢复')
    opened.push(empty.application)
    await empty.application.evaluate(({ app, dialog }, path) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
      dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false })
      app.relaunch = () => {}
    }, backup)
    await empty.page.getByRole('button', { name: '选择备份并预览', exact: true }).click()
    await expect(empty.page.getByLabel('恢复预览摘要', { exact: true })).toContainText('个人笔记')
    const closing = empty.application.waitForEvent('close')
    await empty.page.getByRole('button', { name: '恢复此备份…', exact: true }).click()
    await closing
    const restored = await launchApplication(destination, info.project.name)
    opened.push(restored.application)
    expect(withHistoryDatabase(destination, controlRecords)).toEqual(before)
    expect(await readUpdateRound(restored.page)).toEqual(round)
    expect(await readNote(restored.page)).toMatchObject({
      ok: true,
      value: { revision: 1, text: '更新后的理解仍须保留' },
    })
    expect(await readFile(backup)).toEqual(bytes)
    await restored.page.getByRole('button', { name: '继续练习', exact: true }).click()
    await expect(restored.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
      '更新第二版独立草稿',
    )
    await expect(restored.page.locator('.practice-reference-column .personal-note')).toHaveCount(0)
    completed = true
  } finally {
    for (const app of opened) await stop(app)
    if (
      dirname(resolve(destination)) !== resolve(tmpdir()) ||
      !basename(destination).startsWith('embedded-practice-updates-restore-')
    )
      throw new Error('拒绝清理非本次恢复目录')
    if (completed)
      await rm(destination, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
    else
      await info.attach('updates-restore-failed-directory', {
        body: destination,
        contentType: 'text/plain',
      })
  }
})
