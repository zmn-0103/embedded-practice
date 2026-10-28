# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: review.spec.ts >> 取消收藏等待响应时新增笔记不得因列表移除而丢失
- Location: output\review-four-batches-20261028\review.spec.ts:5:5

# Error details

```
Error: expect(received).toMatchObject(expected)

- Expected  - 1
+ Received  + 1

  Object {
    "ok": true,
    "value": Object {
-     "text": "取消收藏响应期间继续输入的新增笔记",
+     "text": "已保存的原笔记",
    },
  }
```

# Test source

```ts
  1  | import { test, expect, openPage } from '../../tests/e2e/helpers'
  2  | import { prepareStudy, a, openLibraryNote, readNote } from '../../tests/e2e/study-helpers'
  3  | import { stop } from '../../tests/e2e/history-helpers'
  4  | 
  5  | test('取消收藏等待响应时新增笔记不得因列表移除而丢失', async ({ testDataDirectory }, info) => {
  6  |   const { application, page } = await prepareStudy(testDataDirectory, info)
  7  |   try {
  8  |     const favorite = await page.evaluate((identity) =>
  9  |       window.desktop.library.setFavorite({ ...identity, favorite: true }), a(1))
  10 |     expect(favorite.ok).toBe(true)
  11 |     await openPage(page, '学习记录')
  12 |     const note = await openLibraryNote(page)
  13 |     const editor = note.getByRole('textbox', { name: '我的复习笔记', exact: true })
  14 |     await editor.fill('已保存的原笔记')
  15 |     await note.getByRole('button', { name: '立即保存笔记', exact: true }).click()
  16 |     await expect.poll(() => readNote(page)).toMatchObject({ ok: true, value: { text: '已保存的原笔记' } })
  17 | 
  18 |     // 仅延迟真实收藏操作的响应；底层保存、刷新和笔记自动保存均使用实际实现。
  19 |     await application.evaluate(({ ipcMain }) => {
  20 |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('library:set-favorite')
  21 |       ipcMain.removeHandler('library:set-favorite')
  22 |       ipcMain.handle('library:set-favorite', async (event, input) => {
  23 |         const result = await original(event, input)
  24 |         await new Promise<void>((resolve) => Reflect.set(globalThis, '__reviewReleaseFavorite', resolve))
  25 |         return result
  26 |       })
  27 |     })
  28 |     await page.getByRole('button', { name: '取消收藏', exact: true }).click()
  29 |     await expect.poll(() => application.evaluate(() =>
  30 |       typeof Reflect.get(globalThis, '__reviewReleaseFavorite'))).toBe('function')
  31 |     await expect(editor).toBeEditable()
  32 |     const text = '取消收藏响应期间继续输入的新增笔记'
  33 |     await editor.fill(text)
  34 |     await expect(editor).toHaveValue(text)
  35 |     const editedAt = Date.now()
  36 |     await application.evaluate(() => Reflect.get(globalThis, '__reviewReleaseFavorite')())
  37 |     await expect(editor).toHaveCount(0)
  38 |     const removedAfterMs = Date.now() - editedAt
  39 |     // 等待超过自动保存间隔，再通过真实 API 核对持久化结果。
  40 |     await page.waitForTimeout(700)
  41 |     const saved = await readNote(page)
  42 |     await info.attach('note-loss-observation', {
  43 |       body: JSON.stringify({ expected: text, saved, removedAfterMs, dataDirectory: testDataDirectory }, null, 2),
  44 |       contentType: 'application/json',
  45 |     })
  46 |     await info.attach('after-favorite-removal', {
  47 |       body: await page.screenshot(), contentType: 'image/png',
  48 |     })
> 49 |     expect(saved).toMatchObject({ ok: true, value: { text } })
     |                   ^ Error: expect(received).toMatchObject(expected)
  50 |   } finally {
  51 |     await stop(application)
  52 |   }
  53 | })
  54 | 
```