# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: practice-window.spec.ts >> M2 第四批：100% 页面缩放下键盘输入不被操作区遮挡
- Location: tests\e2e\practice-window.spec.ts:741:7

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 3
+ Received  + 3

  Object {
    "hitId": "practice-answer",
-   "scrollY": 874,
-   "x": 92,
-   "y": 222.45,
+   "scrollY": 864.6666870117188,
+   "x": 91.00000287646485,
+   "y": 227.51251050585935,
  }
```

# Test source

```ts
  704 |       contentType: 'application/json',
  705 |     })
  706 |   } finally {
  707 |     await stop(application)
  708 |   }
  709 |   const reopened = await launchApplication(testDataDirectory, info.project.name)
  710 |   try {
  711 |     await reopened.page.getByRole('button', { name: '继续练习', exact: true }).click()
  712 |     await expect(reopened.page.getByLabel('练习进度')).toHaveText('第 2 / 3 题 · 顺序练习')
  713 |     await expect(reopened.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  714 |       '第二题已经确认保存的草稿',
  715 |     )
  716 |     expect(await reopened.page.content()).not.toContain('M2-ANSWER-2')
  717 |     const recovered = stored(testDataDirectory)
  718 |     expect(recovered).toEqual(confirmed)
  719 |     const database = new DatabaseSync(databasePath(testDataDirectory), { readOnly: true })
  720 |     try {
  721 |       expect(database.prepare('PRAGMA quick_check').all()).toEqual([{ quick_check: 'ok' }])
  722 |     } finally {
  723 |       database.close()
  724 |     }
  725 |     await reopened.page.getByRole('button', { name: '上一题', exact: true }).click()
  726 |     await expect(reopened.page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  727 |       '第一题已经确认保存\nint answer = 1;',
  728 |     )
  729 |     await expect(reopened.page.getByRole('region', { name: '练习参考答案' })).toContainText(secret)
  730 |     expect(recovered.foreignKeys).toEqual([])
  731 |     await info.attach('forced-stop-recovered.json', {
  732 |       body: JSON.stringify(recovered),
  733 |       contentType: 'application/json',
  734 |     })
  735 |   } finally {
  736 |     await stop(reopened.application)
  737 |   }
  738 | })
  739 | 
  740 | for (const zoomFactor of [1, 1.25, 1.5]) {
  741 |   test(`M2 第四批：${zoomFactor * 100}% 页面缩放下键盘输入不被操作区遮挡`, async ({
  742 |     testDataDirectory,
  743 |   }, info) => {
  744 |     const { application, page } = await prepare(testDataDirectory, info.project.name)
  745 |     try {
  746 |       await application.evaluate(({ BrowserWindow }, factor) => {
  747 |         BrowserWindow.getAllWindows()[0]?.webContents.setZoomFactor(factor)
  748 |       }, zoomFactor)
  749 |       await begin(page)
  750 |       const summary = page.locator('.practice-input summary')
  751 |       const input = page.getByRole('textbox', { name: '我的答案', exact: true })
  752 |       await summary.focus()
  753 |       const editorBox = await input.boundingBox()
  754 |       const panelBox = await page.locator('.practice-actions').boundingBox()
  755 |       if (!editorBox || !panelBox) throw new Error('测试输入框或操作区不存在。')
  756 |       // 复现原生窗口中的阅读位置：折叠标题可见，输入框顶部落在悬浮操作区内。
  757 |       await page.evaluate(
  758 |         (offset) => Reflect.get(globalThis, 'scrollBy')(0, offset),
  759 |         editorBox.y - panelBox.y,
  760 |       )
  761 |       await expect(summary).toBeFocused()
  762 |       await page.keyboard.press('Tab')
  763 |       await expect(input).toBeFocused()
  764 |       const firstLine = () =>
  765 |         input.evaluate((element) => {
  766 |           const document = Reflect.get(globalThis, 'document')
  767 |           const style = Reflect.get(globalThis, 'getComputedStyle')(element)
  768 |           const box = element.getBoundingClientRect()
  769 |           const x =
  770 |             box.left +
  771 |             Number.parseFloat(style.borderLeftWidth) +
  772 |             Number.parseFloat(style.paddingLeft) +
  773 |             1
  774 |           const y =
  775 |             box.top +
  776 |             Number.parseFloat(style.borderTopWidth) +
  777 |             Number.parseFloat(style.paddingTop) +
  778 |             Number.parseFloat(style.lineHeight) / 2
  779 |           return {
  780 |             x,
  781 |             y,
  782 |             hitId: document.elementFromPoint(x, y)?.id ?? null,
  783 |             scrollY: Number(Reflect.get(globalThis, 'scrollY')),
  784 |           }
  785 |         })
  786 |       const focused = await firstLine()
  787 |       await info.attach('keyboard-input-focus.json', {
  788 |         body: JSON.stringify({ zoomFactor, focused, editorBox, panelBox }),
  789 |         contentType: 'application/json',
  790 |       })
  791 |       const screenshot = await application.evaluate(async ({ BrowserWindow }) => {
  792 |         const window = BrowserWindow.getAllWindows()[0]
  793 |         if (!window) throw new Error('测试窗口已经关闭。')
  794 |         return (await window.webContents.capturePage()).toPNG().toString('base64')
  795 |       })
  796 |       await writeFile(
  797 |         info.outputPath('keyboard-input-focus.png'),
  798 |         Buffer.from(screenshot, 'base64'),
  799 |       )
  800 |       expect(focused.hitId).toBe('practice-answer')
  801 |       await page.keyboard.insertText('键盘进入后的可见输入\nint visible = 1;')
  802 |       await expect(page.locator('.practice-save')).toHaveText('已保存')
  803 |       await expect(input).toBeFocused()
> 804 |       expect(await firstLine()).toEqual(focused)
      |                                 ^ Error: expect(received).toEqual(expected) // deep equality
  805 |       expect(stored(testDataDirectory).items[0]?.draft).toBe(
  806 |         '键盘进入后的可见输入\nint visible = 1;',
  807 |       )
  808 |       await input.evaluate((element) => element.blur())
  809 |       await input.evaluate((element) => element.focus({ preventScroll: true }))
  810 |       expect(await firstLine()).toEqual(focused)
  811 |       await page.keyboard.press('Shift+Tab')
  812 |       await expect(summary).toBeFocused()
  813 |       await page.keyboard.press('Tab')
  814 |       await expect(input).toBeFocused()
  815 |       // 返回 summary 的默认聚焦可正常滚动；再次进入只要求输入可见，不禁止浏览器滚动。
  816 |       expect((await firstLine()).hitId).toBe('practice-answer')
  817 |       await expect(input).toHaveValue('键盘进入后的可见输入\nint visible = 1;')
  818 |     } finally {
  819 |       await stop(application)
  820 |     }
  821 |   })
  822 | }
  823 | 
```