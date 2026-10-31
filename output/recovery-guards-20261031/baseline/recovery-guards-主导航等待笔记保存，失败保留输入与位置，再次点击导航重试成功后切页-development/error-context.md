# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: recovery-guards.spec.ts >> 主导航等待笔记保存，失败保留输入与位置，再次点击导航重试成功后切页
- Location: tests\e2e\recovery-guards.spec.ts:208:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('navigation', { name: '主要页面' }).getByRole('link', { name: '学习记录', exact: true })
    - locator resolved to <a title="学习记录" href="#records" aria-label="学习记录" aria-disabled="true">…</a>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    58 × waiting for element to be visible, enabled and stable
       - element is not enabled
     - retrying click action
       - waiting 500ms

```

# Test source

```ts
  127 |       expect((await readAppStatus(launched.page)).ok).toBe(false)
  128 |       await expect(
  129 |         launched.page.getByRole('button', { name: '选择备份并预览', exact: true }),
  130 |       ).toBeVisible()
  131 |       await choose(current, path, false)
  132 |       await launched.page.getByRole('button', { name: '选择备份并预览', exact: true }).click()
  133 |       await expect(
  134 |         launched.page.getByRole('heading', { name: '恢复预览', exact: true }),
  135 |       ).toBeVisible()
  136 |       await info.attach('recovery-preview.png', {
  137 |         body: await launched.page.screenshot(),
  138 |         contentType: 'image/png',
  139 |       })
  140 |       await launched.page.getByRole('button', { name: '恢复此备份…', exact: true }).click()
  141 |       await expect(launched.page.getByRole('status').filter({ hasText: '已取消' })).toBeVisible()
  142 |       expect(
  143 |         await Promise.all(['', '-wal', '-shm'].map((s) => readFile(databasePath + s))),
  144 |       ).toEqual(originals)
  145 |       await choose(current, path)
  146 |       if (kind === '保护失败') {
  147 |         await current.evaluate(() => {
  148 |           const fs = process.getBuiltinModule('node:fs/promises')
  149 |           const original = fs.copyFile
  150 |           fs.copyFile = (async (...args: Parameters<typeof fs.copyFile>) => {
  151 |             if (String(args[1]).includes('before-recovery-'))
  152 |               throw new Error('injected protection failure')
  153 |             return original(...args)
  154 |           }) as typeof fs.copyFile
  155 |         })
  156 |       }
  157 |       if (kind === '替换失败') {
  158 |         await current.evaluate(() => {
  159 |           const fs = process.getBuiltinModule('node:fs/promises')
  160 |           const original = fs.rename
  161 |           fs.rename = (async (...args: Parameters<typeof fs.rename>) => {
  162 |             if (
  163 |               String(args[0]).endsWith('candidate.sqlite3') &&
  164 |               String(args[1]).endsWith('practice.sqlite3')
  165 |             )
  166 |               throw new Error('injected replace failure')
  167 |             return original(...args)
  168 |           }) as typeof fs.rename
  169 |         })
  170 |       }
  171 |       const exited = kind === '保护失败' ? undefined : current.waitForEvent('close')
  172 |       await launched.page.getByRole('button', { name: '恢复此备份…', exact: true }).click()
  173 |       if (kind === '保护失败') {
  174 |         await expect(launched.page.locator('#backup-section [role=alert]')).toBeVisible()
  175 |         expect(current.process().exitCode).toBeNull()
  176 |       } else await exited
  177 |       if (kind === '保护失败' || kind === '替换失败') {
  178 |         expect(
  179 |           await Promise.all(['', '-wal', '-shm'].map((s) => readFile(databasePath + s))),
  180 |         ).toEqual(originals)
  181 |       } else {
  182 |         const directories = (await readdir(join(testDataDirectory, 'backups'))).filter((name) =>
  183 |           name.startsWith('before-recovery-'),
  184 |         )
  185 |         expect(directories).toHaveLength(1)
  186 |         const protection = join(testDataDirectory, 'backups', directories[0]!)
  187 |         expect(
  188 |           await Promise.all(
  189 |             ['', '-wal', '-shm'].map((s) => readFile(join(protection, 'practice.sqlite3' + s))),
  190 |           ),
  191 |         ).toEqual(originals)
  192 |         const reopened = await launchApplication(testDataDirectory, info.project.name)
  193 |         current = reopened.application
  194 |         expect((await readAppStatus(reopened.page)).ok).toBe(true)
  195 |         expect(
  196 |           withHistoryDatabase(testDataDirectory, (db) =>
  197 |             db.prepare('SELECT count(*) AS total FROM questions').get(),
  198 |           ),
  199 |         ).toEqual({ total: 3 })
  200 |       }
  201 |     } finally {
  202 |       await stop(current)
  203 |       await unlink(path)
  204 |     }
  205 |   })
  206 | }
  207 | 
  208 | test('主导航等待笔记保存，失败保留输入与位置，再次点击导航重试成功后切页', async ({
  209 |   testDataDirectory,
  210 | }, info) => {
  211 |   const { application, page } = await prepareStudy(testDataDirectory, info)
  212 |   try {
  213 |     const note = await openLibraryNote(page)
  214 |     const input = note.getByRole('textbox', { name: '我的复习笔记', exact: true })
  215 |     withHistoryDatabase(
  216 |       testDataDirectory,
  217 |       (db) =>
  218 |         db.exec(
  219 |           "CREATE TRIGGER navigation_note_failure BEFORE INSERT ON personal_notes BEGIN SELECT RAISE(ABORT,'injected navigation note failure'); END",
  220 |         ),
  221 |       false,
  222 |     )
  223 |     await input.fill('导航必须先保存的输入')
  224 |     const link = page
  225 |       .getByRole('navigation', { name: '主要页面' })
  226 |       .getByRole('link', { name: '学习记录', exact: true })
> 227 |     await link.click()
      |                ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
  228 |     await expect(note.getByRole('alert')).toBeVisible()
  229 |     await expect(input).toHaveValue('导航必须先保存的输入')
  230 |     await expect(page.locator('.app-shell')).toHaveAttribute('data-page', 'library')
  231 |     const scroll = await page.evaluate(() => Reflect.get(globalThis, 'scrollY'))
  232 |     await link.click()
  233 |     await expect(input).toHaveValue('导航必须先保存的输入')
  234 |     expect(await page.evaluate(() => Reflect.get(globalThis, 'scrollY'))).toBe(scroll)
  235 |     withHistoryDatabase(
  236 |       testDataDirectory,
  237 |       (db) => db.exec('DROP TRIGGER navigation_note_failure'),
  238 |       false,
  239 |     )
  240 |     await link.click()
  241 |     await expect(page.locator('.app-shell')).toHaveAttribute('data-page', 'records')
  242 |     expect(
  243 |       withHistoryDatabase(testDataDirectory, (db) =>
  244 |         db.prepare('SELECT text,revision FROM personal_notes').all(),
  245 |       ),
  246 |     ).toEqual([{ text: '导航必须先保存的输入', revision: 1 }])
  247 |     await openPage(page, '题库')
  248 |     await expect(input).toHaveValue('导航必须先保存的输入')
  249 |   } finally {
  250 |     await stop(application)
  251 |   }
  252 | })
  253 | 
```