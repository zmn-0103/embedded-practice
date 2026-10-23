# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: session-filters-migration.spec.ts >> v5 筛选迁移 backup-blocked 停止或回滚，原库保留
- Location: tests\e2e\session-filters-migration.spec.ts:231:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('status')
Expected substring: "本地数据暂不可用"
Error: strict mode violation: getByRole('status') resolved to 2 elements:
    1) <section role="status" class="service-status status-error">…</section> aka getByText('本地数据暂不可用，请检查数据目录权限或诊断日志后重启。原数据库会保留。重新检查')
    2) <p role="status">正在读取数据位置…</p> aka getByText('正在读取数据位置…')

Call log:
  - Expect "toContainText" getByRole('status') with timeout 10000ms
  - waiting for getByRole('status')

```

# Test source

```ts
  150 |   const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  151 |   try {
  152 |     await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
  153 |     withHistoryDatabase(testDataDirectory, (database) => {
  154 |       expect(records(database)).toEqual(expected)
  155 |       expect(database.prepare('PRAGMA user_version').get()).toEqual({ user_version: 6 })
  156 |       expect(database.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }])
  157 |       expect(database.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  158 |       expect(
  159 |         database
  160 |           .prepare(
  161 |             "SELECT name FROM sqlite_schema WHERE name IN ('original_filter_mode','original_filter_probe') ORDER BY name",
  162 |           )
  163 |           .all(),
  164 |       ).toEqual([{ name: 'original_filter_mode' }, { name: 'original_filter_probe' }])
  165 |     })
  166 |     const read = await page.evaluate(() =>
  167 |       (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.read({ sessionId: null }),
  168 |     )
  169 |     expect(read).toMatchObject({
  170 |       ok: true,
  171 |       value: {
  172 |         session: { sessionId: original.sessionId, mode: 'random', position: 1, filters: null },
  173 |         item: { draft: { text: '旧草稿\r\nint retained = 5;' }, revealed: false },
  174 |       },
  175 |     })
  176 |     expect(
  177 |       await page.evaluate(
  178 |         (input) => (globalThis as unknown as { desktop: DesktopApi }).desktop.practice.start(input),
  179 |         original.input,
  180 |       ),
  181 |     ).toEqual({ ok: true, value: original.receipt })
  182 |     const conditions = page.getByLabel('本轮创建条件', { exact: true })
  183 |     await conditions.getByText('本轮创建条件', { exact: true }).click()
  184 |     await expect(conditions).toContainText('此旧会话未保存筛选条件，原条件未知。')
  185 |     expect(await conditions.locator('dd').count()).toBe(0)
  186 |     await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  187 |     await expect(page.locator('html')).toHaveAttribute('data-font-size', '20')
  188 |     withHistoryDatabase(testDataDirectory, (database) =>
  189 |       expect(records(database)).toEqual(expected),
  190 |     )
  191 |   } finally {
  192 |     await stop(application)
  193 |   }
  194 |   const backups = await readdir(join(testDataDirectory, 'backups'))
  195 |   expect(backups).toHaveLength(1)
  196 |   expect(backups[0]).toMatch(/^pre-migration-v5-/)
  197 |   const backup = new DatabaseSync(join(testDataDirectory, 'backups', backups[0]!), {
  198 |     readOnly: true,
  199 |   })
  200 |   try {
  201 |     expect(records(backup)).toEqual(original.before)
  202 |     expect(backup.prepare('PRAGMA user_version').get()).toEqual({ user_version: 5 })
  203 |     expect(backup.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }])
  204 |     expect(backup.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  205 |     expect(
  206 |       backup
  207 |         .prepare('PRAGMA table_info(practice_sessions)')
  208 |         .all()
  209 |         .map((x) => x.name),
  210 |     ).not.toContain('filters_json')
  211 |   } finally {
  212 |     backup.close()
  213 |   }
  214 |   const reopened = await launchApplication(testDataDirectory, info.project.name)
  215 |   try {
  216 |     await expect(reopened.page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
  217 |     withHistoryDatabase(testDataDirectory, (database) =>
  218 |       expect(records(database)).toEqual(expected),
  219 |     )
  220 |     expect(await readdir(join(testDataDirectory, 'backups'))).toEqual(backups)
  221 |     await info.attach('filters-v5-preserved.json', {
  222 |       body: JSON.stringify({ original, expected, backups }),
  223 |       contentType: 'application/json',
  224 |     })
  225 |   } finally {
  226 |     await stop(reopened.application)
  227 |   }
  228 | })
  229 | 
  230 | for (const fault of ['backup-blocked', 'column-conflict', 'foreign-key'] as const) {
  231 |   test(`v5 筛选迁移 ${fault} 停止或回滚，原库保留`, async ({ testDataDirectory }, info) => {
  232 |     await legacy(testDataDirectory)
  233 |     if (fault === 'backup-blocked')
  234 |       await writeFile(join(testDataDirectory, 'backups'), '阻断保护备份目录')
  235 |     else
  236 |       withHistoryDatabase(
  237 |         testDataDirectory,
  238 |         (database) =>
  239 |           database.exec(
  240 |             fault === 'column-conflict'
  241 |               ? 'ALTER TABLE practice_sessions ADD COLUMN filters_json TEXT; UPDATE practice_sessions SET filters_json=\'{"retained":"旧冲突列"}\';'
  242 |               : 'PRAGMA foreign_keys=OFF; UPDATE question_user_state SET last_rated_version_id=999999 WHERE question_id=1;',
  243 |           ),
  244 |         false,
  245 |       )
  246 |     const before = withHistoryDatabase(testDataDirectory, records)
  247 |     const bytes = await readFile(join(testDataDirectory, 'practice.sqlite3'))
  248 |     const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  249 |     try {
> 250 |       await expect(page.getByRole('status')).toContainText('本地数据暂不可用')
      |                                              ^ Error: expect(locator).toContainText(expected) failed
  251 |       withHistoryDatabase(testDataDirectory, (database) => {
  252 |         expect(records(database)).toEqual(before)
  253 |         expect(database.prepare('PRAGMA user_version').get()).toEqual({ user_version: 5 })
  254 |       })
  255 |     } finally {
  256 |       await stop(application)
  257 |     }
  258 |     if (fault === 'backup-blocked')
  259 |       expect(await readFile(join(testDataDirectory, 'practice.sqlite3'))).toEqual(bytes)
  260 |     else {
  261 |       const names = await readdir(join(testDataDirectory, 'backups'))
  262 |       expect(names).toHaveLength(1)
  263 |       const backup = new DatabaseSync(join(testDataDirectory, 'backups', names[0]!), {
  264 |         readOnly: true,
  265 |       })
  266 |       try {
  267 |         expect(records(backup)).toEqual(before)
  268 |         expect(backup.prepare('PRAGMA user_version').get()).toEqual({ user_version: 5 })
  269 |       } finally {
  270 |         backup.close()
  271 |       }
  272 |     }
  273 |     await info.attach(`filters-v5-${fault}.json`, {
  274 |       body: JSON.stringify({ before, after: withHistoryDatabase(testDataDirectory, records) }),
  275 |       contentType: 'application/json',
  276 |     })
  277 |   })
  278 | }
  279 | 
```