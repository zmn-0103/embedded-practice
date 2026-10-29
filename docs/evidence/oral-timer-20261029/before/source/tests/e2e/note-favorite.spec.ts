import type { Page } from '@playwright/test'
import type { DesktopApi } from '../../src/shared/contracts/application'
import { expect, openPage, test } from './helpers'
import { captureHistory, stop, withHistoryDatabase } from './history-helpers'
import { a, openLibraryNote, prepareStudy, readNote, saveNote } from './study-helpers'

async function openFavorite(page: Page, entry: '学习记录' | '题库', filtered = true) {
  expect(
    await saveNote(page, { ...a(1), expectedRevision: 0, text: '原已保存笔记' }),
  ).toMatchObject({ ok: true })
  expect(
    await page.evaluate(
      (identity) =>
        (globalThis as unknown as { desktop: DesktopApi }).desktop.library.setFavorite({
          ...identity,
          favorite: true,
        }),
      a(1),
    ),
  ).toMatchObject({ ok: true })
  await openPage(page, entry)
  if (entry === '题库' && filtered) {
    await page.getByRole('checkbox', { name: '题库只看收藏', exact: true }).check()
    await page.getByRole('button', { name: '筛选题库', exact: true }).click()
  }
  return openLibraryNote(page)
}

for (const entry of ['学习记录', '题库'] as const) {
  test(`${entry}收藏：保存已有输入后锁住收藏等待与刷新全段，不能接受将被卸载的新输入`, async ({
    testDataDirectory,
  }, info) => {
    const { application, page } = await prepareStudy(testDataDirectory, info)
    try {
      const note = await openFavorite(page, entry)
      const editor = note.getByRole('textbox', { name: '我的复习笔记', exact: true })
      await application.evaluate(({ ipcMain }) => {
        const handlers = Reflect.get(ipcMain, '_invokeHandlers')
        const favorite = handlers.get('library:set-favorite'),
          list = handlers.get('library:list-questions')
        let holdList = false
        const waiting: (() => void)[] = []
        ipcMain.removeHandler('library:set-favorite')
        ipcMain.handle('library:set-favorite', async (event, input) => {
          const result = await favorite(event, input)
          if (result.ok) {
            holdList = true
            await new Promise<void>((resolve) =>
              Reflect.set(globalThis, '__releaseFavoriteNote', resolve),
            )
          }
          return result
        })
        ipcMain.removeHandler('library:list-questions')
        ipcMain.handle('library:list-questions', async (event, input) => {
          const result = await list(event, input)
          if (holdList && input.filters?.favoritesOnly) {
            await new Promise<void>((resolve) => {
              waiting.push(resolve)
              Reflect.set(globalThis, '__releaseFavoriteList', () => {
                holdList = false
                for (const release of waiting.splice(0)) release()
              })
            })
          }
          return result
        })
      })
      const text = '点击取消收藏前尚未到自动保存时限的笔记'
      await editor.fill(text)
      await page.getByRole('button', { name: '取消收藏', exact: true }).click()
      await expect
        .poll(() =>
          application.evaluate(() => typeof Reflect.get(globalThis, '__releaseFavoriteNote')),
        )
        .toBe('function')
      await expect(editor).not.toBeEditable()
      await expect(note.getByRole('status')).toHaveText('正在保存更改并更新列表，笔记暂时只读。')
      await editor.focus()
      await page.keyboard.type('LATE-INPUT')
      await expect(editor).toHaveValue(text)
      expect(await readNote(page)).toMatchObject({ ok: true, value: { revision: 2, text } })
      await editor.scrollIntoViewIfNeeded()
      await captureHistory(application, page, info, 'favorite-note-readonly.png')
      await application.evaluate(() => Reflect.get(globalThis, '__releaseFavoriteNote')())
      await expect
        .poll(() =>
          application.evaluate(() => typeof Reflect.get(globalThis, '__releaseFavoriteList')),
        )
        .toBe('function')
      const retainedEditor = page.locator(
        '.question-reader .personal-note textarea[aria-label="我的复习笔记"]',
      )
      await expect(retainedEditor).toHaveCount(1)
      await expect(retainedEditor).toHaveAttribute('readonly', '')
      await application.evaluate(() => Reflect.get(globalThis, '__releaseFavoriteList')())
      await expect(retainedEditor).toHaveCount(0)
      expect(await readNote(page)).toMatchObject({ ok: true, value: { revision: 2, text } })
      const favorite = await page.evaluate(
        (identity) =>
          (globalThis as unknown as { desktop: DesktopApi }).desktop.library.getQuestion(identity),
        a(1),
      )
      expect(favorite).toMatchObject({ ok: true, value: { favorite: false } })
    } finally {
      await stop(application)
    }
  })

  test(`${entry}收藏：真实笔记保存失败保留编辑器和输入，不发送取消收藏，原保存重试后可继续`, async ({
    testDataDirectory,
  }, info) => {
    const { application, page } = await prepareStudy(testDataDirectory, info)
    try {
      const note = await openFavorite(page, entry)
      const editor = note.getByRole('textbox', { name: '我的复习笔记', exact: true })
      await application.evaluate(({ ipcMain }) => {
        const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:set-favorite')
        Reflect.set(globalThis, '__favoriteNoteCalls', 0)
        ipcMain.removeHandler('library:set-favorite')
        ipcMain.handle('library:set-favorite', (event, input) => {
          Reflect.set(
            globalThis,
            '__favoriteNoteCalls',
            Reflect.get(globalThis, '__favoriteNoteCalls') + 1,
          )
          return original(event, input)
        })
      })
      withHistoryDatabase(
        testDataDirectory,
        (db) =>
          db.exec(
            "CREATE TRIGGER note_favorite_failure BEFORE UPDATE ON personal_notes BEGIN SELECT RAISE(ABORT,'injected note write failure'); END",
          ),
        false,
      )
      const text = '写入失败必须留在当前编辑器的笔记'
      await editor.fill(text)
      await page.getByRole('button', { name: '取消收藏', exact: true }).click()
      await expect(note.getByRole('alert')).toBeVisible()
      await expect(editor).toBeVisible()
      await expect(editor).toHaveValue(text)
      await expect(page.getByRole('button', { name: '取消收藏', exact: true })).toBeEnabled()
      expect(await application.evaluate(() => Reflect.get(globalThis, '__favoriteNoteCalls'))).toBe(
        0,
      )
      expect(await readNote(page)).toMatchObject({
        ok: true,
        value: { revision: 1, text: '原已保存笔记' },
      })
      await editor.scrollIntoViewIfNeeded()
      await captureHistory(application, page, info, 'favorite-note-save-failed.png')
      withHistoryDatabase(
        testDataDirectory,
        (db) => db.exec('DROP TRIGGER note_favorite_failure'),
        false,
      )
      await note.getByRole('button', { name: '重试原笔记保存', exact: true }).click()
      await expect(editor).toBeEditable()
      expect(await readNote(page)).toMatchObject({ ok: true, value: { revision: 2, text } })
      await page.getByRole('button', { name: '取消收藏', exact: true }).click()
      await expect(editor).toHaveCount(0)
      expect(await readNote(page)).toMatchObject({ ok: true, value: { revision: 2, text } })
    } finally {
      await stop(application)
    }
  })
}

test('普通题库：收藏写入失败恢复编辑，成功刷新保留详情并恢复笔记编辑', async ({
  testDataDirectory,
}, info) => {
  const { application, page } = await prepareStudy(testDataDirectory, info)
  try {
    const note = await openFavorite(page, '题库', false)
    const editor = note.getByRole('textbox', { name: '我的复习笔记', exact: true })
    withHistoryDatabase(
      testDataDirectory,
      (db) =>
        db.exec(
          "CREATE TRIGGER favorite_note_failure BEFORE UPDATE ON question_user_state BEGIN SELECT RAISE(ABORT,'injected favorite write failure'); END",
        ),
      false,
    )
    await page.getByRole('button', { name: '取消收藏', exact: true }).click()
    await expect(page.getByLabel('题目内容').getByRole('alert')).toContainText('收藏保存尚未确认')
    await expect(editor).toBeEditable()
    await editor.fill('收藏失败后继续保留的笔记')
    await note.getByRole('button', { name: '立即保存笔记', exact: true }).click()
    await expect(note.locator('summary')).toContainText('已保存')
    withHistoryDatabase(
      testDataDirectory,
      (db) => db.exec('DROP TRIGGER favorite_note_failure'),
      false,
    )
    await page.getByRole('button', { name: '取消收藏', exact: true }).click()
    await expect(page.getByRole('button', { name: '收藏本题', exact: true })).toBeEnabled()
    await expect(editor).toBeEditable()
    await editor.fill('取消收藏成功但普通列表继续编辑的笔记')
    await note.getByRole('button', { name: '立即保存笔记', exact: true }).click()
    await expect(note.locator('summary')).toContainText('已保存')
    expect(await readNote(page)).toMatchObject({
      ok: true,
      value: { text: '取消收藏成功但普通列表继续编辑的笔记' },
    })
  } finally {
    await stop(application)
  }
})
