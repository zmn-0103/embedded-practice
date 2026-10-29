# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: planning-ui.spec.ts >> 备考目标界面去重范围，进入原确认再建固定队列，取消/删除目标不改历史
- Location: tests\e2e\planning-ui.spec.ts:113:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: '揭晓答案', exact: true })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button', { name: '揭晓答案', exact: true }) with timeout 10000ms
  - waiting for getByRole('button', { name: '揭晓答案', exact: true })

```

```yaml
- banner:
  - heading "嵌入式刷题本" [level=1]
  - paragraph: 思考有迹，积累有序
  - button "收起导航" [expanded]: ‹
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
  - paragraph: 练习中请用“保存并返回”离开。
- main:
  - text: 学习工作台
  - strong: 专注练习
  - text: 本地离线
  - button "隐藏辅助面板" [expanded]
  - group: 外观
  - region "顺序练习":
    - button "保存并返回"
    - button "收藏本题"
    - paragraph: 第 1 / 3 题 · 顺序练习
    - paragraph: 组卷专题 A · 易（基础） · 组卷样本
    - heading "组卷题 A 1" [level=2]
    - group: 本轮题目清单（3题）
    - complementary "练习辅助面板":
      - term: 已揭晓
      - definition: 0 题
      - term: 已自评
      - definition: 0 题
    - region "练习题干":
      - heading "题干" [level=3]
      - paragraph: CONTROL-OLD-BODY-control-a-1
    - group:
      - text: 我的答案
      - textbox "我的答案":
        - /placeholder: 写下思路或代码，也可以先思考再揭晓。
      - paragraph: 已保存
    - region "参考答案未揭晓":
      - heading "参考答案" [level=3]
      - paragraph: 先尝试回忆，再查看参考答案
      - paragraph: 允许空输入，揭晓后自行评价。
    - paragraph:
      - strong: 思考与作答
      - text: 查看参考答案后，再自行评价
    - text: 已保存
    - button "查看参考答案"
    - button "跳过本题"
    - button "保存后返回"
    - button "上一题" [disabled]
    - button "结束本轮"
  - status:
    - paragraph: 本地数据已就绪
- contentinfo: 离线使用 · 数据保存在本机 V42.11.15 测试版 · 构建 20261029.3-study-goals
```

# Test source

```ts
  52  |       dialog.showMessageBox = async () => {
  53  |         Reflect.set(globalThis, '__dailyCloseRejected', true)
  54  |         return { response: 0, checkboxChecked: false }
  55  |       }
  56  |     })
  57  |     await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.close())
  58  |     await expect
  59  |       .poll(() => application.evaluate(() => Reflect.get(globalThis, '__dailyCloseRejected')))
  60  |       .toBe(true)
  61  |     expect(application.windows()).toHaveLength(1)
  62  |     withHistoryDatabase(testDataDirectory, (db) => db.exec('DROP TRIGGER fail_daily'), false)
  63  |     await application.evaluate(({ ipcMain }) => {
  64  |       const original = Reflect.get(ipcMain, '_invokeHandlers').get('planning:change')
  65  |       Reflect.set(globalThis, '__dailyCommands', [])
  66  |       ipcMain.removeHandler('planning:change')
  67  |       ipcMain.handle('planning:change', async (event, input) => {
  68  |         const calls = Reflect.get(globalThis, '__dailyCommands')
  69  |         calls.push(input)
  70  |         const result = await original(event, input)
  71  |         return calls.length === 1 ? { invalid: true } : result
  72  |       })
  73  |     })
  74  |     await panel.getByRole('button', { name: '重试原目标保存', exact: true }).click()
  75  |     await expect(panel.getByRole('alert')).toContainText('尚未确认')
  76  |     await panel.getByRole('button', { name: '重试原目标保存', exact: true }).click()
  77  |     await expect(panel.getByText('今日目标已保存。', { exact: true })).toBeVisible()
  78  |     const calls = await application.evaluate(() => Reflect.get(globalThis, '__dailyCommands'))
  79  |     expect(calls).toHaveLength(2)
  80  |     expect(calls[0]).toEqual(calls[1])
  81  |     expect((await planningHome(page)).daily).toMatchObject({ ratingTarget: 12, revision: 1 })
  82  |     await panel.getByRole('button', { name: '编辑今日目标', exact: true }).click()
  83  |     await panel.getByLabel('目标自评不同题数', { exact: true }).fill('20')
  84  |     expect(
  85  |       await changePlanning(page, {
  86  |         kind: 'daily',
  87  |         day: localDay(),
  88  |         ratingTarget: 30,
  89  |         reviewTarget: 1,
  90  |         expectedRevision: 1,
  91  |       }),
  92  |     ).toMatchObject({ ok: true })
  93  |     await panel.getByRole('button', { name: '保存今日目标', exact: true }).click()
  94  |     await expect(panel.getByRole('alert')).toContainText('设置已变化')
  95  |     await expect(panel.getByLabel('目标自评不同题数', { exact: true })).toHaveValue('20')
  96  |     await panel.getByRole('button', { name: '放弃目标编辑', exact: true }).click()
  97  |     await panel.getByRole('button', { name: '保留目标输入', exact: true }).click()
  98  |     await expect(panel.getByLabel('目标自评不同题数', { exact: true })).toHaveValue('20')
  99  |     await panel.getByRole('button', { name: '放弃目标编辑', exact: true }).click()
  100 |     await panel.getByRole('button', { name: '确认放弃目标设置', exact: true }).click()
  101 |     await expect(panel.locator('.daily-goal-summary')).toContainText('/ 30 题')
  102 |     await panel.getByRole('button', { name: '沿用 2026-01-01 的目标', exact: true }).click()
  103 |     await expect(panel.getByLabel('目标自评不同题数', { exact: true })).toHaveValue('7')
  104 |     await panel.getByRole('button', { name: '保存今日目标', exact: true }).click()
  105 |     await expect(panel.locator('.daily-goal-summary')).toContainText('/ 7 题')
  106 |     await panel.scrollIntoViewIfNeeded()
  107 |     await captureHistory(application, page, info, 'goals-daily-saved.png')
  108 |   } finally {
  109 |     await stop(application)
  110 |   }
  111 | })
  112 | 
  113 | test('备考目标界面去重范围，进入原确认再建固定队列，取消/删除目标不改历史', async ({
  114 |   testDataDirectory,
  115 | }, info) => {
  116 |   const { application, page } = await prepareControl(testDataDirectory, info, 3)
  117 |   try {
  118 |     const one = randomUUID(),
  119 |       two = randomUUID()
  120 |     await changeSet(page, { kind: 'save', setId: one, name: 'C与驱动', items: [a(1), a(2)] })
  121 |     await changeSet(page, { kind: 'save', setId: two, name: 'RTOS与通信', items: [a(2), b(2)] })
  122 |     await openPage(page, '学习总览')
  123 |     const panel = page.locator('.study-goals')
  124 |     await panel.locator(':scope > summary').click()
  125 |     await panel.getByRole('button', { name: '新建备考目标', exact: true }).click()
  126 |     await panel.getByLabel('备考目标名称', { exact: true }).fill('嵌入式实习面试')
  127 |     await panel.getByLabel('备考截止日期', { exact: true }).fill('2026-11-30')
  128 |     await panel.getByRole('checkbox', { name: 'C与驱动 · 2题', exact: true }).check()
  129 |     await panel.getByRole('checkbox', { name: 'RTOS与通信 · 2题', exact: true }).check()
  130 |     await panel.getByRole('button', { name: '保存备考目标', exact: true }).click()
  131 |     await expect(panel.getByText('备考目标已保存。', { exact: true })).toBeVisible()
  132 |     const goal = (await planningHome(page)).goals[0]!
  133 |     await panel.getByLabel('查看备考目标', { exact: true }).selectOption(goal.goalId)
  134 |     await expect(panel.getByRole('region', { name: '备考目标进度', exact: true })).toContainText(
  135 |       '已知范围去重 3 题',
  136 |     )
  137 |     await captureHistory(application, page, info, 'goals-exam-progress.png')
  138 |     await panel.getByRole('button', { name: '核对整个目标的题目', exact: true }).click()
  139 |     await expect(page.locator('.selected-question-list li')).toHaveCount(3)
  140 |     expect(
  141 |       withHistoryDatabase(testDataDirectory, (db) =>
  142 |         db.prepare('SELECT count(*) AS count FROM practice_sessions').get(),
  143 |       ),
  144 |     ).toEqual({ count: 0 })
  145 |     await page.getByRole('button', { name: '返回条件选题', exact: true }).click()
  146 |     await openPage(page, '学习总览')
  147 |     const again = page.locator('.study-goals')
  148 |     await again.locator(':scope > summary').click()
  149 |     await again.getByLabel('查看备考目标', { exact: true }).selectOption(goal.goalId)
  150 |     await again.getByRole('button', { name: '核对整个目标的题目', exact: true }).click()
  151 |     await page.getByRole('button', { name: '确认开始组卷（3题）', exact: true }).click()
> 152 |     await expect(page.getByRole('button', { name: '揭晓答案', exact: true })).toBeVisible()
      |                                                                           ^ Error: expect(locator).toBeVisible() failed
  153 |     const session = withHistoryDatabase(testDataDirectory, (db) =>
  154 |       db.prepare("SELECT id FROM practice_sessions WHERE status='active'").get(),
  155 |     ) as { id: string }
  156 |     expect(
  157 |       flowQueue(testDataDirectory, session.id).map(
  158 |         (item) => (item as { questionId: string }).questionId,
  159 |       ),
  160 |     ).toEqual(['q-1', 'q-2', 'q-2'])
  161 |     const before = withHistoryDatabase(testDataDirectory, controlRecords)
  162 |     expect(await changePlanning(page, { kind: 'exam-delete', expected: goal })).toMatchObject({
  163 |       ok: true,
  164 |       value: null,
  165 |     })
  166 |     const after = withHistoryDatabase(testDataDirectory, controlRecords)
  167 |     expect({ ...after, study_goals: before['study_goals'] }).toEqual(before)
  168 |   } finally {
  169 |     await stop(application)
  170 |   }
  171 | })
  172 | 
  173 | test('配额界面显示缺额，不替换活动轮，确认完整范围后只练明确题目', async ({
  174 |   testDataDirectory,
  175 | }, info) => {
  176 |   const { application, page } = await prepareControl(testDataDirectory, info, 3)
  177 |   try {
  178 |     const selected = await selectForPractice(page, [a(3)], '原活动轮'),
  179 |       started = await startFlow(page, {
  180 |         requestId: randomUUID(),
  181 |         topicId: null,
  182 |         count: 'all',
  183 |         replace: null,
  184 |         selected,
  185 |       })
  186 |     if (!started.ok) throw Error(started.error.message)
  187 |     await page.reload()
  188 |     await openPage(page, '开始练习')
  189 |     const panel = page.locator('.quota-composer')
  190 |     await panel.locator(':scope > summary').click()
  191 |     await panel.getByRole('button', { name: '设置专题配额', exact: true }).click()
  192 |     await panel.getByLabel('配额题数 1', { exact: true }).fill('2')
  193 |     await panel.getByRole('button', { name: '增加配额专题', exact: true }).click()
  194 |     await panel.getByLabel('配额题数 2', { exact: true }).fill('4')
  195 |     await panel.getByLabel('配额优先方式 1', { exact: true }).selectOption('weak')
  196 |     await panel.getByRole('button', { name: '保存并预览配额组卷', exact: true }).click()
  197 |     await expect(panel.getByRole('region', { name: '配额组卷预览', exact: true })).toContainText(
  198 |       '需要 4 题 / 可用 3 题 · 缺 1 题',
  199 |     )
  200 |     await expect(
  201 |       panel.getByRole('button', { name: '核对这批配额题目', exact: true }),
  202 |     ).toBeDisabled()
  203 |     const original = flowQueue(testDataDirectory, started.value.sessionId)
  204 |     expect(original).toHaveLength(1)
  205 |     await panel.getByRole('button', { name: '编辑配额设置', exact: true }).click()
  206 |     await panel.getByLabel('配额题数 2', { exact: true }).fill('2')
  207 |     await panel.getByLabel('配额优先方式 2', { exact: true }).selectOption('oldest')
  208 |     await panel.getByRole('button', { name: '保存并预览配额组卷', exact: true }).click()
  209 |     await expect(panel.getByRole('button', { name: '核对这批配额题目', exact: true })).toBeEnabled()
  210 |     await captureHistory(application, page, info, 'goals-quota-preview.png')
  211 |     await panel.getByRole('button', { name: '核对这批配额题目', exact: true }).click()
  212 |     await expect(page.locator('.selected-question-list li')).toHaveCount(4)
  213 |     expect(flowQueue(testDataDirectory, started.value.sessionId)).toEqual(original)
  214 |     await page.getByRole('button', { name: '结束原轮并开始组卷（4题）', exact: true }).click()
  215 |     await expect(page.getByRole('button', { name: '揭晓答案', exact: true })).toBeVisible()
  216 |     const sessions = withHistoryDatabase(testDataDirectory, (db) =>
  217 |       db.prepare('SELECT id,status,selection_name FROM practice_sessions ORDER BY rowid').all(),
  218 |     ) as { id: string; status: string; selection_name: string }[]
  219 |     expect(sessions[0]?.status).toBe('ended')
  220 |     expect(sessions[1]?.selection_name).toBe('分专题配额组卷 · 2专题 4题')
  221 |     expect(
  222 |       flowQueue(testDataDirectory, sessions[1]!.id).map(
  223 |         (item) => (item as { questionId: string }).questionId,
  224 |       ),
  225 |     ).toEqual(['q-1', 'q-2', 'q-1', 'q-2'])
  226 |   } finally {
  227 |     await stop(application)
  228 |   }
  229 | })
  230 | 
  231 | test('日历日期可看活动分页与原轮作答笔记，旧日期零事件有明确说明', async ({
  232 |   testDataDirectory,
  233 | }, info) => {
  234 |   const { application, page } = await prepareControl(testDataDirectory, info)
  235 |   try {
  236 |     await createStudyRound(page, '日历原作答', [a(1)])
  237 |     for (let n = 1; n <= 27; n++)
  238 |       await saveNote(page, { ...a(n), expectedRevision: 0, text: `日历个人理解 ${n}` })
  239 |     await openPage(page, '学习总览')
  240 |     const panel = page.locator('.learning-calendar')
  241 |     await panel.locator(':scope > summary').click()
  242 |     await panel.getByRole('button', { name: `查看 ${localDay()} 的学习记录`, exact: true }).click()
  243 |     await expect(panel.getByRole('region', { name: '当日学习记录', exact: true })).toContainText(
  244 |       '活动 29 条 · 关联轮次 1 轮',
  245 |     )
  246 |     await expect(panel.locator('.calendar-events li')).toHaveCount(20)
  247 |     await panel.getByRole('button', { name: '下一页活动', exact: true }).click()
  248 |     await expect(panel.locator('.calendar-events li')).toHaveCount(9)
  249 |     await panel.getByRole('button', { name: '回看此轮', exact: true }).click()
  250 |     await panel.getByRole('button', { name: '查看本轮第1题', exact: true }).click()
  251 |     await expect(panel.locator('.round-entry')).toContainText('日历原作答')
  252 |     await captureHistory(application, page, info, 'goals-calendar-round.png')
```