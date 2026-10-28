import { test, expect, openPage } from '../../tests/e2e/helpers'
import { prepareStudy, a, openLibraryNote, readNote } from '../../tests/e2e/study-helpers'
import { stop } from '../../tests/e2e/history-helpers'

test('取消收藏等待响应时新增笔记不得因列表移除而丢失', async ({ testDataDirectory }, info) => {
  const { application, page } = await prepareStudy(testDataDirectory, info)
  try {
    const favorite = await page.evaluate((identity) =>
      window.desktop.library.setFavorite({ ...identity, favorite: true }), a(1))
    expect(favorite.ok).toBe(true)
    await openPage(page, '学习记录')
    const note = await openLibraryNote(page)
    const editor = note.getByRole('textbox', { name: '我的复习笔记', exact: true })
    await editor.fill('已保存的原笔记')
    await note.getByRole('button', { name: '立即保存笔记', exact: true }).click()
    await expect.poll(() => readNote(page)).toMatchObject({ ok: true, value: { text: '已保存的原笔记' } })

    // 仅延迟真实收藏操作的响应；底层保存、刷新和笔记自动保存均使用实际实现。
    await application.evaluate(({ ipcMain }) => {
      const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:set-favorite')
      ipcMain.removeHandler('library:set-favorite')
      ipcMain.handle('library:set-favorite', async (event, input) => {
        const result = await original(event, input)
        await new Promise<void>((resolve) => Reflect.set(globalThis, '__reviewReleaseFavorite', resolve))
        return result
      })
    })
    await page.getByRole('button', { name: '取消收藏', exact: true }).click()
    await expect.poll(() => application.evaluate(() =>
      typeof Reflect.get(globalThis, '__reviewReleaseFavorite'))).toBe('function')
    await expect(editor).toBeEditable()
    const text = '取消收藏响应期间继续输入的新增笔记'
    await editor.fill(text)
    await expect(editor).toHaveValue(text)
    const editedAt = Date.now()
    await application.evaluate(() => Reflect.get(globalThis, '__reviewReleaseFavorite')())
    await expect(editor).toHaveCount(0)
    const removedAfterMs = Date.now() - editedAt
    // 等待超过自动保存间隔，再通过真实 API 核对持久化结果。
    await page.waitForTimeout(700)
    const saved = await readNote(page)
    await info.attach('note-loss-observation', {
      body: JSON.stringify({ expected: text, saved, removedAfterMs, dataDirectory: testDataDirectory }, null, 2),
      contentType: 'application/json',
    })
    await info.attach('after-favorite-removal', {
      body: await page.screenshot(), contentType: 'image/png',
    })
    expect(saved).toMatchObject({ ok: true, value: { text } })
  } finally {
    await stop(application)
  }
})
