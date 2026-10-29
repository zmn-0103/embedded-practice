# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: planning-ui.spec.ts >> 备考目标界面去重范围，进入原确认再建固定队列，取消/删除目标不改历史
- Location: tests\e2e\planning-ui.spec.ts:113:5

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('.study-goals').getByRole('alert')
Expected: 0
Received: 1
Timeout:  10000ms

Call log:
  - Expect "toHaveCount" locator('.study-goals').getByRole('alert') with timeout 10000ms
  - waiting for locator('.study-goals').getByRole('alert')
    24 × locator resolved to 1 element
       - unexpected value "1"

```

# Test source

```ts
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
  152 |     await expect(page.getByRole('button', { name: '查看参考答案', exact: true })).toBeVisible()
  153 |     const session = withHistoryDatabase(testDataDirectory, (db) =>
  154 |       db.prepare("SELECT id FROM practice_sessions WHERE status='active'").get(),
  155 |     ) as { id: string }
  156 |     expect(
  157 |       flowQueue(testDataDirectory, session.id).map(
  158 |         (item) => (item as { questionId: string }).questionId,
  159 |       ),
  160 |     ).toEqual(['q-1', 'q-2', 'q-2'])
  161 |     await page.getByRole('button', { name: '保存并返回', exact: true }).click()
  162 |     await openPage(page, '学习总览')
  163 |     const deleting = page.locator('.study-goals')
  164 |     await deleting.locator(':scope > summary').click()
  165 |     await deleting.getByLabel('查看备考目标', { exact: true }).selectOption(goal.goalId)
  166 |     await expect(deleting.getByRole('region', { name: '备考目标进度', exact: true })).toBeVisible()
  167 |     const before = withHistoryDatabase(testDataDirectory, controlRecords)
  168 |     await deleting.getByRole('button', { name: '删除备考目标', exact: true }).click()
  169 |     await deleting.getByRole('button', { name: '确认删除备考目标', exact: true }).click()
  170 |     await expect(deleting.getByText('备考目标已删除。', { exact: true })).toBeVisible()
  171 |     await expect(
  172 |       deleting.getByLabel('查看备考目标', { exact: true }).locator('option'),
  173 |     ).toHaveCount(1)
  174 |     await expect(deleting.getByText('正在读取备考范围…', { exact: true })).toBeHidden()
> 175 |     await expect(deleting.getByRole('alert')).toHaveCount(0)
      |                                               ^ Error: expect(locator).toHaveCount(expected) failed
  176 |     const after = withHistoryDatabase(testDataDirectory, controlRecords)
  177 |     expect({ ...after, study_goals: before['study_goals'] }).toEqual(before)
  178 |   } finally {
  179 |     await stop(application)
  180 |   }
  181 | })
  182 | 
  183 | test('配额界面显示缺额，不替换活动轮，确认完整范围后只练明确题目', async ({
  184 |   testDataDirectory,
  185 | }, info) => {
  186 |   const { application, page } = await prepareControl(testDataDirectory, info, 3)
  187 |   try {
  188 |     const selected = await selectForPractice(page, [a(3)], '原活动轮'),
  189 |       started = await startFlow(page, {
  190 |         requestId: randomUUID(),
  191 |         topicId: null,
  192 |         count: 'all',
  193 |         replace: null,
  194 |         selected,
  195 |       })
  196 |     if (!started.ok) throw Error(started.error.message)
  197 |     await page.reload()
  198 |     await openPage(page, '开始练习')
  199 |     const panel = page.locator('.quota-composer')
  200 |     await panel.locator(':scope > summary').click()
  201 |     await panel.getByRole('button', { name: '设置专题配额', exact: true }).click()
  202 |     await panel.getByLabel('配额题数 1', { exact: true }).fill('2')
  203 |     await panel.getByRole('button', { name: '增加配额专题', exact: true }).click()
  204 |     await panel.getByLabel('配额题数 2', { exact: true }).fill('4')
  205 |     await panel.getByLabel('配额优先方式 1', { exact: true }).selectOption('weak')
  206 |     await panel.getByRole('button', { name: '保存并预览配额组卷', exact: true }).click()
  207 |     await expect(panel.getByRole('region', { name: '配额组卷预览', exact: true })).toContainText(
  208 |       '需要 4 题 / 可用 3 题 · 缺 1 题',
  209 |     )
  210 |     await expect(
  211 |       panel.getByRole('button', { name: '核对这批配额题目', exact: true }),
  212 |     ).toBeDisabled()
  213 |     const original = flowQueue(testDataDirectory, started.value.sessionId)
  214 |     expect(original).toHaveLength(1)
  215 |     await panel.getByRole('button', { name: '编辑配额设置', exact: true }).click()
  216 |     await panel.getByLabel('配额题数 2', { exact: true }).fill('2')
  217 |     await panel.getByLabel('配额优先方式 2', { exact: true }).selectOption('oldest')
  218 |     await panel.getByRole('button', { name: '保存并预览配额组卷', exact: true }).click()
  219 |     await expect(panel.getByRole('button', { name: '核对这批配额题目', exact: true })).toBeEnabled()
  220 |     await captureHistory(application, page, info, 'goals-quota-preview.png')
  221 |     await panel.getByRole('button', { name: '核对这批配额题目', exact: true }).click()
  222 |     await expect(page.locator('.selected-question-list li')).toHaveCount(4)
  223 |     expect(flowQueue(testDataDirectory, started.value.sessionId)).toEqual(original)
  224 |     await page.getByRole('button', { name: '结束原轮并开始组卷（4题）', exact: true }).click()
  225 |     await expect(page.getByRole('button', { name: '查看参考答案', exact: true })).toBeVisible()
  226 |     const sessions = withHistoryDatabase(testDataDirectory, (db) =>
  227 |       db.prepare('SELECT id,status,selection_name FROM practice_sessions ORDER BY rowid').all(),
  228 |     ) as { id: string; status: string; selection_name: string }[]
  229 |     expect(sessions[0]?.status).toBe('ended')
  230 |     expect(sessions[1]?.selection_name).toBe('分专题配额组卷 · 2专题 4题')
  231 |     expect(
  232 |       flowQueue(testDataDirectory, sessions[1]!.id).map(
  233 |         (item) => (item as { questionId: string }).questionId,
  234 |       ),
  235 |     ).toEqual(['q-1', 'q-2', 'q-1', 'q-2'])
  236 |   } finally {
  237 |     await stop(application)
  238 |   }
  239 | })
  240 | 
  241 | test('日历日期可看活动分页与原轮作答笔记，旧日期零事件有明确说明', async ({
  242 |   testDataDirectory,
  243 | }, info) => {
  244 |   const { application, page } = await prepareControl(testDataDirectory, info)
  245 |   try {
  246 |     await createStudyRound(page, '日历原作答', [a(1)])
  247 |     for (let n = 1; n <= 27; n++)
  248 |       await saveNote(page, { ...a(n), expectedRevision: 0, text: `日历个人理解 ${n}` })
  249 |     await openPage(page, '学习总览')
  250 |     const panel = page.locator('.learning-calendar')
  251 |     await panel.locator(':scope > summary').click()
  252 |     await panel.getByRole('button', { name: `查看 ${localDay()} 的学习记录`, exact: true }).click()
  253 |     await expect(panel.getByRole('region', { name: '当日学习记录', exact: true })).toContainText(
  254 |       '活动 29 条 · 关联轮次 1 轮',
  255 |     )
  256 |     await expect(panel.locator('.calendar-events li')).toHaveCount(20)
  257 |     await panel.locator('.calendar-grid').scrollIntoViewIfNeeded()
  258 |     await captureHistory(application, page, info, 'goals-calendar-month.png')
  259 |     await panel.getByRole('button', { name: '下一页活动', exact: true }).click()
  260 |     await expect(panel.locator('.calendar-events li')).toHaveCount(9)
  261 |     await panel.getByRole('button', { name: '回看此轮', exact: true }).click()
  262 |     await panel.getByRole('button', { name: '查看本轮第1题', exact: true }).click()
  263 |     await expect(panel.locator('.round-entry')).toContainText('日历原作答')
  264 |     await captureHistory(application, page, info, 'goals-calendar-round.png')
  265 |     await panel.getByRole('button', { name: '收起当日轮次复盘', exact: true }).click()
  266 |     await panel.getByLabel('日历月份', { exact: true }).fill('2000-02')
  267 |     await panel.getByRole('button', { name: '查看 2000-02-29 的学习记录', exact: true }).click()
  268 |     await expect(panel.getByRole('region', { name: '当日学习记录', exact: true })).toContainText(
  269 |       '这一天没有本版记录的学习活动。',
  270 |     )
  271 |   } finally {
  272 |     await stop(application)
  273 |   }
  274 | })
  275 | 
```