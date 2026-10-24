# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: personal-bank.spec.ts >> 旧118题学习记录保护、更新后旧轮/新轮、正常重开与419题完整备份恢复
- Location: tests\e2e\personal-bank.spec.ts:213:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('完整备份已导出并校验。', { exact: true })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('完整备份已导出并校验。', { exact: true }) with timeout 10000ms
  - waiting for getByText('完整备份已导出并校验。', { exact: true })

```

```yaml
- banner:
  - heading "嵌入式刷题本" [level=1]
  - paragraph: 思考有迹，积累有序
- navigation "主要页面":
  - link "板块":
    - /url: "#boards"
  - link "开始练习":
    - /url: "#practice"
  - link "题库":
    - /url: "#library"
  - link "学习记录":
    - /url: "#records"
  - link "设置与数据":
    - /url: "#settings"
- main:
  - text: 设置与数据 离线工作台
  - region "设置与数据":
    - heading "设置与数据" [level=2]
    - paragraph: 选一套喜欢的配色，让每一次阅读都舒服一些。
    - group "显示设置":
      - text: 显示设置
      - group "配色主题":
        - text: 配色主题
        - radio "松间绿" [checked]
        - text: 松间绿 自然清爽，沉静专注
        - radio "晴空蓝"
        - text: 晴空蓝 清晰冷静，轻盈通透
        - radio "暖沙金"
        - text: 暖沙金 温暖柔和，纸页质感
        - radio "暮山紫"
        - text: 暮山紫 低饱和紫，柔和舒展
      - text: 明暗模式
      - combobox "显示主题":
        - option "跟随系统" [selected]
        - option "明色"
        - option "暗色"
      - text: 正文字号
      - combobox "正文字号":
        - option "15px"
        - option "16px"
        - option "17px" [selected]
        - option "18px"
        - option "19px"
        - option "20px"
        - option "21px"
        - option "22px"
      - complementary "显示设置局部预览":
        - text: 阅读预览
        - heading "把思考留在题目旁" [level=3]
        - paragraph: 先回忆原理，再对照参考答案。清晰的文字与留白，让注意力回到内容。
        - code: uint8_t received = 0; // 记录你的理解
      - paragraph: 预览仅在此处显示，保存后应用到所有页面，重开后保留。
      - button "保存显示设置"
    - region "数据位置":
      - heading "数据位置" [level=3]
      - paragraph: 这里显示本次运行使用的位置。保护备份保存在下方备份目录，导出的备份以你选择的保存位置为准。
      - term: 数据文件夹
      - definition:
        - code: C:\Users\pc\AppData\Local\Temp\embedded-practice-0TPJiB
      - definition:
        - button "打开数据文件夹"
      - term: 备份文件夹
      - definition:
        - code: C:\Users\pc\AppData\Local\Temp\embedded-practice-0TPJiB\backups
      - definition:
        - button "打开备份文件夹"
      - term: 日志文件夹
      - definition:
        - code: C:\Users\pc\AppData\Local\Temp\embedded-practice-0TPJiB\logs
      - definition:
        - button "打开日志文件夹"
      - paragraph:
        - text: 诊断日志：
        - code: C:\Users\pc\AppData\Local\Temp\embedded-practice-0TPJiB\logs\application.log
        - text: （发生诊断时生成）
    - region "完整备份与恢复预览":
      - heading "本地数据" [level=3]
      - paragraph: 完整备份包含题库、历史版本、图片、学习记录、收藏、练习进度及显示设置。 备份仅包含已经保存的数据；调整显示后请先保存，再导出。
      - button "导出完整备份"
      - button "选择备份并预览"
      - paragraph: 恢复将替换当前全部数据并重启。请先预览核对；程序会先保存待保存内容并创建当前数据的保护性备份，保护失败时停止恢复。
      - alert: 请选择运行数据目录以外的位置，避免覆盖正在使用的数据。
  - status:
    - paragraph: 本地数据已就绪
- contentinfo: 离线使用 · 数据保存在本机 V42.11.15 测试版 · 构建 20261024.4-v000
```

# Test source

```ts
  203 |     await info.attach('419-topic-navigation.json', {
  204 |       body: JSON.stringify(navigation),
  205 |       contentType: 'application/json',
  206 |     })
  207 |     await page.screenshot({ path: info.outputPath('419-boards.png'), fullPage: true })
  208 |   } finally {
  209 |     await stop(application)
  210 |   }
  211 | })
  212 | 
  213 | test('旧118题学习记录保护、更新后旧轮/新轮、正常重开与419题完整备份恢复', async ({
  214 |   testDataDirectory,
  215 | }, info) => {
  216 |   test.setTimeout(120_000)
  217 |   let { application, page } = await launchApplication(testDataDirectory, info.project.name, '题库')
  218 |   try {
  219 |     await runtime(application, page, testDataDirectory, info)
  220 |     const oldFiles = manifest.files
  221 |       .filter(
  222 |         (file) =>
  223 |           file.topicId.startsWith('general-') ||
  224 |           ['stm32f103-gpio', 'm5-trial-uart-level-2'].includes(file.topicId),
  225 |       )
  226 |       .map((file) => join(before, file.file))
  227 |     await importExact(
  228 |       application,
  229 |       page,
  230 |       oldFiles,
  231 |       '导入完成：新增 118，内容更新 0，信息变更 0，不变 0，归档 0，恢复 0。',
  232 |     )
  233 |     const category = await addCategory(page, 'STM32')
  234 |     await assignTopic(page, 'stm32f103-gpio', category)
  235 |     await openPage(page, '开始练习')
  236 |     await page.getByLabel('练习专题', { exact: true }).selectOption('stm32f103-gpio')
  237 |     await page.getByLabel('本轮题数', { exact: true }).selectOption('all')
  238 |     await savePlan(page, '原GPIO顺序方案')
  239 |     const plans = await readPlans(page)
  240 |     await page.getByRole('button', { name: '开始练习', exact: true }).click()
  241 |     await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  242 |     await page.getByRole('button', { name: '掌握', exact: true }).click()
  243 |     await expect(page.getByLabel('练习进度')).toContainText('第 2 / 78')
  244 |     const input = page.getByRole('textbox', { name: '我的答案', exact: true })
  245 |     await input.fill('V0个人测试合成草稿\n保留旧版本与固定队列')
  246 |     await normalClose(application)
  247 |     ;({ application, page } = await launchApplication(testDataDirectory, info.project.name))
  248 |     await page.getByRole('button', { name: '继续练习', exact: true }).click()
  249 |     await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue(
  250 |       'V0个人测试合成草稿\n保留旧版本与固定队列',
  251 |     )
  252 |     const oldView = await current(page)
  253 |     const protectedBefore = historySnapshot(testDataDirectory)
  254 |     await page.getByRole('button', { name: '返回首页', exact: true }).click()
  255 |     await importExact(
  256 |       application,
  257 |       page,
  258 |       files,
  259 |       '导入完成：新增 301，内容更新 108，信息变更 0，不变 10，归档 0，恢复 0。',
  260 |     )
  261 |     verifyAll(testDataDirectory)
  262 |     const after = historySnapshot(testDataDirectory)
  263 |     for (const key of ['sessions', 'items', 'receipts'] as const)
  264 |       expect(after[key]).toEqual(protectedBefore[key])
  265 |     const oldQuestions = new Set(protectedBefore.states.map((row) => row['question_id']))
  266 |     expect(after.states.filter((row) => oldQuestions.has(row['question_id']))).toEqual(
  267 |       protectedBefore.states,
  268 |     )
  269 |     const newStates = after.states.filter((row) => !oldQuestions.has(row['question_id']))
  270 |     expect(newStates).toHaveLength(301)
  271 |     for (const row of newStates)
  272 |       expect(row).toMatchObject({
  273 |         favorite: 0,
  274 |         last_rating: null,
  275 |         last_rated_version_id: null,
  276 |       })
  277 |     expect(after.versions).toEqual(expect.arrayContaining(protectedBefore.versions))
  278 |     expect(await readPlans(page)).toEqual(plans)
  279 |     expect(
  280 |       (await categoryList(page)).topics.find((topic) => topic.topicId === 'stm32f103-gpio')
  281 |         ?.categoryId,
  282 |     ).toBe(category)
  283 |     await importExact(
  284 |       application,
  285 |       page,
  286 |       files,
  287 |       '导入完成：新增 0，内容更新 0，信息变更 0，不变 419，归档 0，恢复 0。',
  288 |     )
  289 |     const backup = join(testDataDirectory, '419题完整备份.sqlite3')
  290 |     await application.evaluate(({ app, dialog }, path) => {
  291 |       dialog.showSaveDialog = async () => ({ canceled: false, filePath: path })
  292 |       dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
  293 |       dialog.showMessageBox = (async () => ({
  294 |         response: 1,
  295 |         checkboxChecked: false,
  296 |       })) as typeof dialog.showMessageBox
  297 |       // 真实文件恢复；本专项由测试重新连接新进程，自动relaunch另由既有完整回归验证。
  298 |       app.relaunch = () => {}
  299 |     }, backup)
  300 |     const saved = completeState(testDataDirectory)
  301 |     await openPage(page, '设置与数据')
  302 |     await page.getByRole('button', { name: '导出完整备份', exact: true }).click()
> 303 |     await expect(page.getByText('完整备份已导出并校验。', { exact: true })).toBeVisible()
      |                                                                  ^ Error: expect(locator).toBeVisible() failed
  304 |     const favorite = await page.evaluate(() =>
  305 |       (globalThis as unknown as { desktop: DesktopApi }).desktop.library.setFavorite({
  306 |         topicId: 'stm32f103-gpio',
  307 |         questionId: 'gpio-001',
  308 |         favorite: true,
  309 |       }),
  310 |     )
  311 |     expect(favorite.ok).toBe(true)
  312 |     expect(completeState(testDataDirectory)).not.toEqual(saved)
  313 |     await page.getByRole('button', { name: '选择备份并预览', exact: true }).click()
  314 |     await expect(page.getByRole('region', { name: '恢复预览摘要', exact: true })).toContainText(
  315 |       '419',
  316 |     )
  317 |     const closed = application.waitForEvent('close')
  318 |     await page.getByRole('button', { name: '恢复此备份…', exact: true }).click()
  319 |     await closed
  320 |     ;({ application, page } = await launchApplication(testDataDirectory, info.project.name))
  321 |     expect(completeState(testDataDirectory)).toEqual(saved)
  322 |     verifyAll(testDataDirectory)
  323 |     await page.getByRole('button', { name: '继续练习', exact: true }).click()
  324 |     const resumed = await current(page)
  325 |     expect(resumed).toEqual(oldView)
  326 |     await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  327 |     const revealed = await current(page)
  328 |     expect(revealed.item?.revealed).toBe(true)
  329 |     if (revealed.item?.revealed) expect(revealed.item.answer.markdown).not.toContain('核心结论：')
  330 |     await page.getByRole('button', { name: '结束本轮', exact: true }).click()
  331 |     await page.getByRole('button', { name: '返回首页', exact: true }).click()
  332 |     await openPage(page, '开始练习')
  333 |     await page.getByLabel('练习专题', { exact: true }).selectOption('stm32f103-gpio')
  334 |     await page.getByRole('button', { name: '开始练习', exact: true }).click()
  335 |     expect((await current(page)).item?.revealed).toBe(false)
  336 |     await expect(page.getByRole('region', { name: '练习参考答案', exact: true })).toHaveCount(0)
  337 |     await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  338 |     await expect(
  339 |       page.getByRole('region', { name: '练习参考答案', exact: true }).locator('strong').first(),
  340 |     ).toHaveText('核心结论：')
  341 |     await info.attach('old-learning-protection.json', {
  342 |       body: JSON.stringify({ protectedBefore, after, plans }),
  343 |       contentType: 'application/json',
  344 |     })
  345 |     await page.screenshot({ path: info.outputPath('v000-practice.png'), fullPage: true })
  346 |   } finally {
  347 |     await stop(application)
  348 |   }
  349 | })
  350 | 
```