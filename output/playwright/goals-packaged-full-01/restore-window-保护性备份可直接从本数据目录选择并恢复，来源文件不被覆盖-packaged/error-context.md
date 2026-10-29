# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: restore-window.spec.ts >> 保护性备份可直接从本数据目录选择并恢复，来源文件不被覆盖
- Location: tests\e2e\restore-window.spec.ts:741:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 16
Received: 17
```

# Test source

```ts
  673 |           .createRequire(p.join(app.getAppPath(), 'restore-pause-test.cjs'))
  674 |         const Database = load('better-sqlite3') as typeof import('better-sqlite3')
  675 |         const original = Database.prototype.backup
  676 |         Database.prototype.backup = async function (...args: Parameters<typeof original>) {
  677 |           Database.prototype.backup = original
  678 |           Reflect.set(globalThis, 'protectionStarted', true)
  679 |           const result = await original.apply(this, args)
  680 |           await new Promise<void>((done) => setTimeout(done, 750))
  681 |           return result
  682 |         }
  683 |       })
  684 |       await page
  685 |         .getByRole('textbox', { name: '我的答案', exact: true })
  686 |         .fill('输入后立刻恢复\n中文保存握手')
  687 |       const exited = application.waitForEvent('close')
  688 |       const restoring = restore(page, selected.token)
  689 |       await expect
  690 |         .poll(() => application.evaluate(() => Reflect.get(globalThis, 'protectionStarted')))
  691 |         .toBe(true)
  692 |       const protectedState = withHistoryDatabase(testDataDirectory, records)
  693 |       expect(protectedState['practice_items']).toEqual(
  694 |         expect.arrayContaining([
  695 |           expect.objectContaining({ draft: '输入后立刻恢复\n中文保存握手' }),
  696 |         ]),
  697 |       )
  698 |       const blocked = await page.evaluate(async () => {
  699 |         const api = (globalThis as unknown as { desktop: DesktopApi }).desktop
  700 |         return [
  701 |           await api.settings.save({ theme: 'light', palette: 'forest', fontSize: 15 }),
  702 |           await api.library.setFavorite({
  703 |             topicId: 'history-a',
  704 |             questionId: 'q-1',
  705 |             favorite: true,
  706 |           }),
  707 |           await api.practice.start({
  708 |             requestId: crypto.randomUUID(),
  709 |             topicId: null,
  710 |             mode: 'random',
  711 |             count: 20,
  712 |             replace: null,
  713 |           }),
  714 |           await api.backup.restore({ token: '93dc94ba-210c-4e71-97f3-6b7251ca655a' }),
  715 |         ]
  716 |       })
  717 |       expect(blocked).toMatchObject([
  718 |         { error: { code: 'SERVICE_CLOSED' } },
  719 |         { error: { code: 'SERVICE_CLOSED' } },
  720 |         { error: { code: 'SERVICE_CLOSED' } },
  721 |         { error: { code: 'BACKUP_BUSY' } },
  722 |       ])
  723 |       expect(await restoring).toMatchObject({ ok: true })
  724 |       await exited
  725 |       expect(saved(join(testDataDirectory, 'practice.sqlite3'))).toEqual(expected)
  726 |       const protection = (await readdir(join(testDataDirectory, 'backups'))).filter((name) =>
  727 |         name.startsWith('before-restore-'),
  728 |       )
  729 |       expect(protection).toHaveLength(1)
  730 |       expect(saved(join(testDataDirectory, 'backups', protection[0]!))).toEqual(protectedState)
  731 |       await info.attach('restore-save-and-pause.json', {
  732 |         body: JSON.stringify({ blocked, protectedState }),
  733 |         contentType: 'application/json',
  734 |       })
  735 |     } finally {
  736 |       await stop(application)
  737 |     }
  738 |   })
  739 | })
  740 | 
  741 | test('保护性备份可直接从本数据目录选择并恢复，来源文件不被覆盖', async ({
  742 |   testDataDirectory,
  743 | }, info) => {
  744 |   await temporary(async (root) => {
  745 |     const initial = await prepareHistory(testDataDirectory, info.project.name, 1)
  746 |     let reopened: ElectronApplication | undefined
  747 |     try {
  748 |       const path = join(root, '首次恢复.sqlite3')
  749 |       await exportBackup(initial.application, initial.page, path)
  750 |       expect(
  751 |         (
  752 |           await initial.page.evaluate(() =>
  753 |             (globalThis as unknown as { desktop: DesktopApi }).desktop.settings.save({
  754 |               theme: 'dark',
  755 |               palette: 'forest',
  756 |               fontSize: 21,
  757 |             }),
  758 |           )
  759 |         ).ok,
  760 |       ).toBe(true)
  761 |       const expected = withHistoryDatabase(testDataDirectory, records)
  762 |       const selected = await preview(initial.application, initial.page, path)
  763 |       let exited = initial.application.waitForEvent('close')
  764 |       const first = await restore(initial.page, selected.token)
  765 |       expect(first.ok).toBe(true)
  766 |       if (!first.ok) throw new Error(first.error.code)
  767 |       await exited
  768 |       const bytes = await readFile(first.value.protectionPath)
  769 |       expect(saved(first.value.protectionPath)).toEqual(expected)
  770 |       const launched = await launchApplication(testDataDirectory, info.project.name, '备份恢复')
  771 |       reopened = launched.application
  772 |       const protection = await preview(reopened, launched.page, first.value.protectionPath)
> 773 |       expect(protection.summary.schemaVersion).toBe(16)
      |                                                ^ Error: expect(received).toBe(expected) // Object.is equality
  774 |       exited = reopened.waitForEvent('close')
  775 |       const second = await restore(launched.page, protection.token)
  776 |       expect(second.ok).toBe(true)
  777 |       if (!second.ok) throw new Error(second.error.code)
  778 |       await exited
  779 |       expect(second.value.protectionPath).not.toBe(first.value.protectionPath)
  780 |       expect(saved(join(testDataDirectory, 'practice.sqlite3'))).toEqual(expected)
  781 |       expect(await readFile(first.value.protectionPath)).toEqual(bytes)
  782 |       const final = await launchApplication(testDataDirectory, info.project.name, '备份恢复')
  783 |       reopened = final.application
  784 |       await expect(final.page.getByLabel('显示主题', { exact: true })).toHaveValue('dark')
  785 |       await expect(final.page.getByLabel('正文字号', { exact: true })).toHaveValue('21')
  786 |       await info.attach('protective-backup-restored.json', {
  787 |         body: JSON.stringify({ first, second, expected }),
  788 |         contentType: 'application/json',
  789 |       })
  790 |     } finally {
  791 |       if (reopened) await stop(reopened)
  792 |       await stop(initial.application)
  793 |     }
  794 |   })
  795 | })
  796 | 
```