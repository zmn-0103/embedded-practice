import { writeFile } from 'node:fs/promises'
import { expect, launchApplication, openPage, test } from './helpers'
import { historySnapshot, importHistoryFiles, stop, withHistoryDatabase } from './history-helpers'
import { controlBank } from './practice-control-helpers'
import {
  a,
  prepareStudy,
  readNote,
  saveNote,
  openLibraryNote,
  closeNormally,
} from './study-helpers'

test('个人笔记CAS/幂等/清空修订，重导入和归档不覆盖，学习记录逐行保持', async ({
  testDataDirectory,
}, info) => {
  const { application, page, file } = await prepareStudy(testDataDirectory, info)
  try {
    const before = historySnapshot(testDataDirectory)
    expect(await readNote(page)).toMatchObject({
      ok: true,
      value: { ...a(1), revision: 0, text: '', updatedAt: null },
    })
    const command = { ...a(1), expectedRevision: 0, text: 'DMA完成≠UART完成\n  wait_tc();' }
    const saved = await saveNote(page, command)
    expect(saved).toMatchObject({ ok: true, value: { revision: 1, text: command.text } })
    expect(await saveNote(page, command)).toEqual(saved)
    expect(await saveNote(page, { ...command, text: '过期覆盖' })).toMatchObject({
      ok: false,
      error: { code: 'NOTE_CONFLICT' },
    })
    expect(await saveNote(page, { ...command, expectedRevision: 1, text: '' })).toMatchObject({
      ok: true,
      value: { revision: 2, text: '' },
    })
    expect(
      withHistoryDatabase(testDataDirectory, (db) =>
        db.prepare('SELECT revision,text FROM personal_notes').all(),
      ),
    ).toEqual([{ revision: 2, text: '' }])
    expect(historySnapshot(testDataDirectory)).toEqual(before)
    expect(await saveNote(page, { ...command, expectedRevision: 2 })).toMatchObject({
      ok: true,
      value: { revision: 3 },
    })
    await writeFile(file, controlBank('control-a', 27, true, 1))
    await importHistoryFiles(application, page, [file])
    expect(await readNote(page)).toMatchObject({
      ok: true,
      value: { revision: 3, text: command.text },
    })
    expect(
      await saveNote(page, { ...command, expectedRevision: 3, text: '归档后仍可整理笔记' }),
    ).toMatchObject({ ok: true, value: { revision: 4 } })
    expect(await saveNote(page, { ...command, questionId: 'q-missing' })).toMatchObject({
      ok: false,
      error: { code: 'NOT_FOUND' },
    })
    expect(await saveNote(page, { ...command, text: '中'.repeat(350_000) })).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    })
  } finally {
    await stop(application)
  }
})

test('笔记主动读取，独立作答揭晓前零请求，跨页同步/切题/正常重开保留', async ({
  testDataDirectory,
}, info) => {
  const prepared = await prepareStudy(testDataDirectory, info)
  let instance = { application: prepared.application, page: prepared.page }
  try {
    await instance.application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('study:read-note')
      Reflect.set(globalThis, '__noteReads', 0)
      ipcMain.removeHandler('study:read-note')
      ipcMain.handle('study:read-note', (event, input) => {
        Reflect.set(globalThis, '__noteReads', Reflect.get(globalThis, '__noteReads') + 1)
        return original(event, input)
      })
    })
    expect(await instance.application.evaluate(() => Reflect.get(globalThis, '__noteReads'))).toBe(
      0,
    )
    const note = await openLibraryNote(instance.page)
    await note
      .getByRole('textbox', { name: '我的复习笔记', exact: true })
      .fill('OLD-PERSONAL-NOTE\n  explain();')
    await expect
      .poll(() =>
        withHistoryDatabase(testDataDirectory, (db) =>
          db.prepare('SELECT text FROM personal_notes').get(),
        ),
      )
      .toEqual({ text: 'OLD-PERSONAL-NOTE\n  explain();' })
    await openPage(instance.page, '开始练习')
    await instance.page.getByLabel('练习专题', { exact: true }).selectOption('control-a')
    await instance.page.getByLabel('本轮题数', { exact: true }).selectOption('all')
    const reads = await instance.application.evaluate(() => Reflect.get(globalThis, '__noteReads'))
    await instance.page.getByRole('button', { name: '开始练习', exact: true }).click()
    await expect(instance.page.locator('.practice-reference-column .personal-note')).toHaveCount(0)
    expect(await instance.application.evaluate(() => Reflect.get(globalThis, '__noteReads'))).toBe(
      reads,
    )
    await instance.page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    const practiceNote = instance.page.locator('.practice-reference-column .personal-note')
    await expect(practiceNote).not.toHaveAttribute('open')
    expect(await instance.application.evaluate(() => Reflect.get(globalThis, '__noteReads'))).toBe(
      reads,
    )
    await practiceNote.locator('summary').click()
    await expect(
      practiceNote.getByRole('textbox', { name: '我的复习笔记', exact: true }),
    ).toHaveValue('OLD-PERSONAL-NOTE\n  explain();')
    await practiceNote
      .getByRole('textbox', { name: '我的复习笔记', exact: true })
      .fill('NEW-PERSONAL-NOTE\n  improved();')
    await instance.page.locator('.practice-outline > summary').click()
    await instance.page
      .locator('.practice-outline')
      .getByRole('button', { name: /^7\. 组卷题 A 7 / })
      .click()
    await expect(instance.page.getByLabel('练习进度')).toHaveText('第 7 / 27 题 · 顺序练习')
    await expect(instance.page.locator('.practice-reference-column .personal-note')).toHaveCount(0)
    await instance.page.getByRole('button', { name: '保存并返回', exact: true }).click()
    await openPage(instance.page, '题库')
    await expect(
      instance.page.getByRole('textbox', { name: '我的复习笔记', exact: true }),
    ).toHaveValue('NEW-PERSONAL-NOTE\n  improved();')
    await info.attach('personal-note-library.png', {
      body: await instance.page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
    await closeNormally(instance.application)
    instance = await launchApplication(testDataDirectory, info.project.name, '题库')
    const reopened = await openLibraryNote(instance.page)
    await expect(reopened.getByRole('textbox', { name: '我的复习笔记', exact: true })).toHaveValue(
      'NEW-PERSONAL-NOTE\n  improved();',
    )
  } finally {
    await stop(instance.application)
  }
})

test('真实笔记写失败阻止切题和正常退出，原输入保留并可按原修订重试', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareStudy(testDataDirectory, info)
  try {
    const note = await openLibraryNote(page)
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER note_failure BEFORE INSERT ON personal_notes BEGIN SELECT RAISE(ABORT,'injected note write'); END",
        ),
      false,
    )
    const input = note.getByRole('textbox', { name: '我的复习笔记', exact: true })
    await input.fill('失败仍保留的笔记')
    await page
      .locator('.question-row')
      .filter({ has: page.getByText('组卷题 A 2', { exact: true }) })
      .click()
    await expect(note.getByRole('alert')).toBeVisible()
    await expect(input).toHaveValue('失败仍保留的笔记')
    await expect(page.getByRole('heading', { name: '组卷题 A 1', exact: true })).toBeVisible()
    await application.evaluate(({ dialog }) => {
      dialog.showMessageBox = (async () => {
        Reflect.set(globalThis, '__noteCloseReturned', true)
        return { response: 0, checkboxChecked: false }
      }) as typeof dialog.showMessageBox
    })
    await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.close())
    await expect
      .poll(() => application.evaluate(() => Reflect.get(globalThis, '__noteCloseReturned')))
      .toBe(true)
    expect(application.process().exitCode).toBeNull()
    expect(
      withHistoryDatabase(testDataDirectory, (db) =>
        db.prepare('SELECT * FROM personal_notes').all(),
      ),
    ).toEqual([])
    withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER note_failure'), false)
    await note.getByRole('button', { name: '重试原笔记保存', exact: true }).click()
    await expect
      .poll(() =>
        withHistoryDatabase(testDataDirectory, (db) =>
          db.prepare('SELECT revision,text FROM personal_notes').all(),
        ),
      )
      .toEqual([{ revision: 1, text: '失败仍保留的笔记' }])
    await page
      .locator('.question-row')
      .filter({ has: page.getByText('组卷题 A 2', { exact: true }) })
      .click()
    await expect(page.getByRole('heading', { name: '组卷题 A 2', exact: true })).toBeVisible()
  } finally {
    await stop(application)
  }
})

test('笔记已提交但响应丢失，原请求重试不增修订或改时间', async ({ testDataDirectory }, info) => {
  const { application, page } = await prepareStudy(testDataDirectory, info)
  try {
    const note = await openLibraryNote(page)
    await application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('study:save-note'),
        commands: unknown[] = []
      Reflect.set(globalThis, '__noteCommands', commands)
      let drop = true
      ipcMain.removeHandler('study:save-note')
      ipcMain.handle('study:save-note', async (event, input) => {
        commands.push(structuredClone(input))
        const result = await original(event, input)
        if (drop) {
          drop = false
          return { ok: true, value: null }
        }
        return result
      })
    })
    await note.getByRole('textbox', { name: '我的复习笔记', exact: true }).fill('已写入仍等待确认')
    await note.getByRole('button', { name: '立即保存笔记', exact: true }).click()
    await expect(note.getByRole('alert')).toContainText('结果尚未确认')
    const before = withHistoryDatabase(testDataDirectory, (db) =>
      db.prepare('SELECT * FROM personal_notes').all(),
    )
    await note.getByRole('button', { name: '重试原笔记保存', exact: true }).click()
    await expect(note.locator('summary')).toContainText('已保存')
    expect(
      withHistoryDatabase(testDataDirectory, (db) =>
        db.prepare('SELECT * FROM personal_notes').all(),
      ),
    ).toEqual(before)
    const commands = await application.evaluate(() => Reflect.get(globalThis, '__noteCommands'))
    expect(commands).toHaveLength(2)
    expect(commands[1]).toEqual(commands[0])
  } finally {
    await stop(application)
  }
})
