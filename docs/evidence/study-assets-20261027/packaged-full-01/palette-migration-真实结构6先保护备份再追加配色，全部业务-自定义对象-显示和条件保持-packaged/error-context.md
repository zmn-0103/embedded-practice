# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: palette-migration.spec.ts >> 真实结构6先保护备份再追加配色，全部业务/自定义对象/显示和条件保持
- Location: tests\e2e\palette-migration.spec.ts:87:5

# Error details

```
Error: expect(locator).toBeEnabled() failed

Locator: getByRole('button', { name: '继续练习', exact: true })
Expected: enabled
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeEnabled" getByRole('button', { name: '继续练习', exact: true }) with timeout 10000ms
  - waiting for getByRole('button', { name: '继续练习', exact: true })

```

```yaml
- banner:
  - heading "嵌入式刷题本" [level=1]
  - paragraph: 思考有迹，积累有序
- navigation "主要页面":
  - link "学习总览" [disabled]:
    - /url: "#overview"
  - link "知识板块" [disabled]:
    - /url: "#boards"
  - link "开始练习" [disabled]:
    - /url: "#practice"
  - link "题库" [disabled]:
    - /url: "#library"
  - link "学习记录" [disabled]:
    - /url: "#records"
  - link "设置与数据" [disabled]:
    - /url: "#settings"
- main:
  - text: 学习工作台
  - strong: 学习总览
  - text: 本地离线
  - alert:
    - paragraph: 显示设置暂不可用，请重试或检查本地诊断日志。
    - button "查看显示设置"
  - status:
    - paragraph: 本地数据暂不可用，请检查数据目录权限或诊断日志后重启。原数据库会保留。
    - button "重新检查"
  - region "数据位置":
    - heading "数据位置" [level=3]
    - paragraph: 这里显示本次运行使用的位置。保护备份保存在下方备份目录，导出的备份以你选择的保存位置为准。
    - term: 数据文件夹
    - definition:
      - code: C:\Users\pc\AppData\Local\Temp\embedded-practice-kaJgfq
    - definition:
      - button "打开数据文件夹"
    - term: 备份文件夹
    - definition:
      - code: C:\Users\pc\AppData\Local\Temp\embedded-practice-kaJgfq\backups
    - definition:
      - button "打开备份文件夹"
    - term: 日志文件夹
    - definition:
      - code: C:\Users\pc\AppData\Local\Temp\embedded-practice-kaJgfq\logs
    - definition:
      - button "打开日志文件夹"
    - paragraph:
      - text: 诊断日志：
      - code: C:\Users\pc\AppData\Local\Temp\embedded-practice-kaJgfq\logs\application.log
      - text: （发生诊断时生成）
- contentinfo: 离线使用 · 数据保存在本机 嵌入式刷题本
```

# Test source

```ts
  17  |       name,
  18  |       database
  19  |         .prepare(
  20  |           name === 'image_resources'
  21  |             ? 'SELECT hash,format,width,height,hex(bytes) AS bytes FROM image_resources ORDER BY hash'
  22  |             : `SELECT * FROM "${name.replaceAll('"', '""')}" ORDER BY rowid`,
  23  |         )
  24  |         .all(),
  25  |     ]),
  26  |   )
  27  | }
  28  | 
  29  | async function legacy(directory: string) {
  30  |   const sql = await readFile(resolve('tests/fixtures/schema-v6.sql'), 'utf8')
  31  |   const source = JSON.parse(
  32  |     await readFile(resolve('docs/evidence/ui-themes-20261023/schema-v6-source.json'), 'utf8'),
  33  |   )
  34  |   expect(createHash('sha256').update(sql).digest('hex')).toBe(source.sha256)
  35  |   const database = new DatabaseSync(join(directory, 'practice.sqlite3'))
  36  |   try {
  37  |     database.exec(`PRAGMA application_id=0x45505231; PRAGMA user_version=6; ${sql}`)
  38  |     database.exec(`INSERT INTO app_startup VALUES(1,7,'2026-10-22T00:00:00.000Z');
  39  |       INSERT INTO topics VALUES('palette-legacy','旧配色专题','旧配色.md');
  40  |       INSERT INTO questions VALUES(1,'palette-legacy','q-1','旧题','[]','基础',0,0,NULL);
  41  |       UPDATE appearance_settings SET theme='dark',font_size=20;
  42  |       CREATE TABLE personal_notes(id INTEGER PRIMARY KEY, note TEXT) STRICT;
  43  |       INSERT INTO personal_notes VALUES(1,'结构六的额外表必须保留');
  44  |       CREATE INDEX legacy_theme ON appearance_settings(theme);
  45  |       CREATE TRIGGER legacy_theme_probe AFTER UPDATE ON appearance_settings BEGIN SELECT 1; END;`)
  46  |     const bytes = await readFile(resolve('tests/fixtures/images/small.png'))
  47  |     const hash = createHash('sha256').update(bytes).digest('hex')
  48  |     database.prepare("INSERT INTO image_resources VALUES(?,'png',2,3,?)").run(hash, bytes)
  49  |     database
  50  |       .prepare(
  51  |         "INSERT INTO question_versions VALUES(1,1,1,'旧标题','旧题干','旧答案','[]',?,?,'2026-10-22T00:00:00.000Z')",
  52  |       )
  53  |       .run(JSON.stringify([{ url: 'assets/old.png', hash }]), 'a'.repeat(64))
  54  |     database.exec(
  55  |       'UPDATE questions SET current_version_id=1; INSERT INTO question_user_state VALUES(1,1,NULL,NULL)',
  56  |     )
  57  |     database.prepare('INSERT INTO version_images VALUES(1,?)').run(hash)
  58  |     const sessionId = randomUUID()
  59  |     database
  60  |       .prepare(
  61  |         "INSERT INTO practice_sessions VALUES(?,'random','palette-legacy','active',0,0,'2026-10-22T00:00:00.000Z',NULL,?)",
  62  |       )
  63  |       .run(
  64  |         sessionId,
  65  |         JSON.stringify({
  66  |           query: '旧条件',
  67  |           tag: null,
  68  |           difficulty: null,
  69  |           mastery: 'all',
  70  |           favoritesOnly: false,
  71  |         }),
  72  |       )
  73  |     database
  74  |       .prepare(
  75  |         "INSERT INTO practice_items VALUES(?,0,1,1,'旧题','旧专题','[]','基础',?,1,NULL,NULL,NULL,NULL)",
  76  |       )
  77  |       .run(sessionId, '结构六草稿\r\n    int kept = 6;')
  78  |     database
  79  |       .prepare('INSERT INTO practice_receipts VALUES(?,?,?,?)')
  80  |       .run(randomUUID(), 'b'.repeat(64), '{}', '2026-10-22T00:00:00.000Z')
  81  |     return records(database)
  82  |   } finally {
  83  |     database.close()
  84  |   }
  85  | }
  86  | 
  87  | test('真实结构6先保护备份再追加配色，全部业务/自定义对象/显示和条件保持', async ({
  88  |   testDataDirectory,
  89  | }, info) => {
  90  |   const before = await legacy(testDataDirectory)
  91  |   const expected = {
  92  |     ...before,
  93  |     categories: [],
  94  |     practice_plans: [],
  95  |     installed_themes: [],
  96  |     question_sets: [],
  97  |     question_set_items: [],
  98  |     personal_notes: [],
  99  |     topics: before.topics!.map((row) => ({ ...row, category_id: null })),
  100 |     practice_sessions: before.practice_sessions!.map((row) => ({
  101 |       ...row,
  102 |       repeat_source_id: null,
  103 |       repeat_selection: null,
  104 |       selection_name: null,
  105 |       category_scope_json: '{"kind":"all"}',
  106 |     })),
  107 |     appearance_settings: before.appearance_settings!.map((row) => ({
  108 |       ...row,
  109 |       palette: 'forest',
  110 |       theme_id: 'builtin.forest',
  111 |       navigation_collapsed: 0,
  112 |       auxiliary_hidden: 0,
  113 |     })),
  114 |   }
  115 |   const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  116 |   try {
> 117 |     await expect(page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
      |                                                                           ^ Error: expect(locator).toBeEnabled() failed
  118 |     withHistoryDatabase(testDataDirectory, (database) => {
  119 |       expect(records(database)).toEqual(expected)
  120 |       expect(database.prepare('PRAGMA user_version').get()).toEqual({ user_version: 13 })
  121 |       expect(database.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  122 |       expect(
  123 |         database
  124 |           .prepare(
  125 |             "SELECT name FROM sqlite_schema WHERE name IN ('legacy_theme','legacy_theme_probe') ORDER BY name",
  126 |           )
  127 |           .all(),
  128 |       ).toEqual([{ name: 'legacy_theme' }, { name: 'legacy_theme_probe' }])
  129 |     })
  130 |     await expect(page.locator('html')).toHaveAttribute('data-palette', 'forest')
  131 |     await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  132 |     await expect(page.locator('html')).toHaveAttribute('data-font-size', '20')
  133 |     expect(
  134 |       await page.evaluate(() =>
  135 |         (globalThis as unknown as { desktop: DesktopApi }).desktop.settings.read(),
  136 |       ),
  137 |     ).toEqual({
  138 |       ok: true,
  139 |       value: {
  140 |         theme: 'dark',
  141 |         palette: 'forest',
  142 |         fontSize: 20,
  143 |         themeId: 'builtin.forest',
  144 |         navigationCollapsed: false,
  145 |         auxiliaryHidden: false,
  146 |       },
  147 |     })
  148 |     await page.getByRole('button', { name: '继续练习', exact: true }).click()
  149 |     await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  150 |       '结构六草稿\r\n    int kept = 6;'.replaceAll('\r\n', '\n'),
  151 |     )
  152 |   } finally {
  153 |     await stop(application)
  154 |   }
  155 |   const backups = await readdir(join(testDataDirectory, 'backups'))
  156 |   expect(backups).toHaveLength(1)
  157 |   expect(backups[0]).toMatch(/^pre-migration-v6-/)
  158 |   const backup = new DatabaseSync(join(testDataDirectory, 'backups', backups[0]!), {
  159 |     readOnly: true,
  160 |   })
  161 |   try {
  162 |     expect(backup.prepare('PRAGMA user_version').get()).toEqual({ user_version: 6 })
  163 |     expect(backup.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }])
  164 |     expect(records(backup)).toEqual(before)
  165 |   } finally {
  166 |     backup.close()
  167 |   }
  168 |   const next = await launchApplication(testDataDirectory, info.project.name)
  169 |   try {
  170 |     expect(withHistoryDatabase(testDataDirectory, records)).toEqual(expected)
  171 |     expect(await readdir(join(testDataDirectory, 'backups'))).toEqual(backups)
  172 |     await info.attach('palette-v6-preserved.json', {
  173 |       body: JSON.stringify({ before, after: expected, backups }),
  174 |       contentType: 'application/json',
  175 |     })
  176 |   } finally {
  177 |     await stop(next.application)
  178 |   }
  179 | })
  180 | 
  181 | for (const failure of ['backup-blocked', 'column-conflict', 'foreign-key'] as const) {
  182 |   test(`结构6配色迁移 ${failure} 停止/回滚，不修补未知结构`, async ({
  183 |     testDataDirectory,
  184 |   }, info) => {
  185 |     await legacy(testDataDirectory)
  186 |     if (failure === 'backup-blocked')
  187 |       await writeFile(join(testDataDirectory, 'backups'), '阻止保护备份')
  188 |     else
  189 |       withHistoryDatabase(
  190 |         testDataDirectory,
  191 |         (database) =>
  192 |           database.exec(
  193 |             failure === 'column-conflict'
  194 |               ? 'ALTER TABLE appearance_settings ADD COLUMN palette TEXT'
  195 |               : "PRAGMA foreign_keys=OFF; UPDATE question_user_state SET last_rating='掌握',last_rated_version_id=999999",
  196 |           ),
  197 |         false,
  198 |       )
  199 |     const before = withHistoryDatabase(testDataDirectory, records)
  200 |     const bytes = await readFile(join(testDataDirectory, 'practice.sqlite3'))
  201 |     const { application, page } = await launchApplication(testDataDirectory, info.project.name)
  202 |     try {
  203 |       await expect(page.locator('.service-status')).toContainText('本地数据暂不可用')
  204 |       expect(withHistoryDatabase(testDataDirectory, records)).toEqual(before)
  205 |       withHistoryDatabase(testDataDirectory, (database) => {
  206 |         expect(database.prepare('PRAGMA user_version').get()).toEqual({ user_version: 6 })
  207 |         const columns = database.prepare('PRAGMA table_info(appearance_settings)').all() as {
  208 |           name: string
  209 |         }[]
  210 |         expect(columns.some((column) => column.name === 'palette')).toBe(
  211 |           failure === 'column-conflict',
  212 |         )
  213 |       })
  214 |     } finally {
  215 |       await stop(application)
  216 |     }
  217 |     if (failure === 'backup-blocked')
```