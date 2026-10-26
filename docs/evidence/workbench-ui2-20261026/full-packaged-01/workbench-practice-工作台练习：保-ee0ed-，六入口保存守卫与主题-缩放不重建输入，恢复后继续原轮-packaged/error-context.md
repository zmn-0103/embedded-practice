# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workbench-practice.spec.ts >> 工作台练习：保存失败保留输入并阻止返回，六入口保存守卫与主题/缩放不重建输入，恢复后继续原轮
- Location: tests\e2e\workbench-practice.spec.ts:7:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '保存并返回', exact: true })
    - locator resolved to <button type="button" class="primary">保存并返回</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <select aria-label="快捷主题选择">…</select> from <div class="workspace-heading">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <select aria-label="快捷主题选择">…</select> from <div class="workspace-heading">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    58 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <select aria-label="快捷主题选择">…</select> from <div class="workspace-heading">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms

```

# Test source

```ts
  1   | import { expect, openPage, test } from './helpers'
  2   | import { stop, withHistoryDatabase } from './history-helpers'
  3   | import { categoryList } from './category-helpers'
  4   | import { themeBusinessSnapshot } from './theme-helpers'
  5   | import { noWorkbenchOverflow, prepareWorkbench, settleWorkbench } from './workbench-helpers'
  6   | 
  7   | test('工作台练习：保存失败保留输入并阻止返回，六入口保存守卫与主题/缩放不重建输入，恢复后继续原轮', async ({
  8   |   testDataDirectory,
  9   | }, info) => {
  10  |   const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  11  |   let fault = false
  12  |   try {
  13  |     await openPage(page, '开始练习')
  14  |     await page.getByRole('button', { name: '开始练习', exact: true }).click()
  15  |     const input = page.getByRole('textbox', { name: '我的答案', exact: true })
  16  |     await input.evaluate((element) => Reflect.set(globalThis, '__workbenchInput', element))
  17  |     withHistoryDatabase(
  18  |       testDataDirectory,
  19  |       (db) =>
  20  |         db.exec(
  21  |           "CREATE TRIGGER workbench_draft_fault BEFORE UPDATE OF draft ON practice_items BEGIN SELECT RAISE(ABORT, '工作台保存失败注入'); END",
  22  |         ),
  23  |       false,
  24  |     )
  25  |     fault = true
  26  |     await input.fill('工作台保存失败必须保留的原输入\n    independent_thinking();')
  27  |     await expect(page.locator('.practice-save')).toHaveText('保存失败')
  28  |     await page.getByRole('button', { name: '保存并返回', exact: true }).click()
  29  |     await expect(input).toHaveValue('工作台保存失败必须保留的原输入\n    independent_thinking();')
  30  |     const links = page.getByRole('navigation', { name: '主要页面', exact: true }).getByRole('link')
  31  |     await expect(links).toHaveCount(6)
  32  |     for (const link of await links.all())
  33  |       await expect(link).toHaveAttribute('aria-disabled', 'true')
  34  |     await page.getByRole('link', { name: '学习总览', exact: true }).focus()
  35  |     await page.getByRole('link', { name: '学习总览', exact: true }).press('Enter')
  36  |     await expect(page.getByLabel('练习进度', { exact: true })).toContainText('第 1 / 20')
  37  |     await page.locator('.quick-appearance > summary').click()
  38  |     await page.getByLabel('快捷主题选择', { exact: true }).selectOption('builtin.claude')
  39  |     await page.getByRole('button', { name: '应用所选主题', exact: true }).click()
  40  |     await expect(page.locator('html')).toHaveAttribute('data-theme-id', 'builtin.claude')
  41  |     const before = themeBusinessSnapshot(testDataDirectory)
  42  |     for (const width of [1440, 1200, 900]) {
  43  |       await application.evaluate(
  44  |         ({ BrowserWindow }, width) => BrowserWindow.getAllWindows()[0]!.setContentSize(width, 1000),
  45  |         width,
  46  |       )
  47  |       await settleWorkbench(page)
  48  |       expect(
  49  |         await input.evaluate((element) => Reflect.get(globalThis, '__workbenchInput') === element),
  50  |       ).toBe(true)
  51  |       await expect(page.locator('.practice-save')).toHaveText('保存失败')
  52  |       await expect(page.getByRole('button', { name: '查看本题历史', exact: true })).toHaveCount(0)
  53  |       await expect(page.getByRole('button', { name: '掌握', exact: true })).toHaveCount(0)
  54  |       await noWorkbenchOverflow(page)
  55  |     }
  56  |     expect(themeBusinessSnapshot(testDataDirectory)).toEqual(before)
  57  |     withHistoryDatabase(
  58  |       testDataDirectory,
  59  |       (db) => db.exec('DROP TRIGGER workbench_draft_fault'),
  60  |       false,
  61  |     )
  62  |     fault = false
  63  |     await page.getByRole('button', { name: '重试保存', exact: true }).click()
  64  |     await expect(page.locator('.practice-save')).toHaveText('已保存')
> 65  |     await page.getByRole('button', { name: '保存并返回', exact: true }).click()
      |                                                                    ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
  66  |     await openPage(page, '学习总览')
  67  |     await page.getByRole('button', { name: '继续本轮', exact: true }).click()
  68  |     await expect(input).toHaveValue('工作台保存失败必须保留的原输入\n    independent_thinking();')
  69  |     await expect(page.getByLabel('练习进度', { exact: true })).toContainText('第 1 / 20')
  70  |   } finally {
  71  |     if (fault)
  72  |       withHistoryDatabase(
  73  |         testDataDirectory,
  74  |         (db) => db.exec('DROP TRIGGER workbench_draft_fault'),
  75  |         false,
  76  |       )
  77  |     await stop(application)
  78  |   }
  79  | })
  80  | 
  81  | test('工作台练习：收藏失败重试原目标且独立于自评，空输入揭晓后才挂载答案/历史和自评，新题重新隔离', async ({
  82  |   testDataDirectory,
  83  | }, info) => {
  84  |   const { application, page } = await prepareWorkbench(testDataDirectory, info.project.name)
  85  |   let fault = false
  86  |   try {
  87  |     await openPage(page, '开始练习')
  88  |     await page.getByRole('button', { name: '开始练习', exact: true }).click()
  89  |     const before = themeBusinessSnapshot(testDataDirectory)
  90  |     await page.getByRole('button', { name: '收藏本题', exact: true }).click()
  91  |     await expect(page.getByRole('button', { name: '取消收藏', exact: true })).toHaveAttribute(
  92  |       'aria-pressed',
  93  |       'true',
  94  |     )
  95  |     withHistoryDatabase(
  96  |       testDataDirectory,
  97  |       (db) =>
  98  |         db.exec(
  99  |           "CREATE TRIGGER workbench_favorite_fault BEFORE UPDATE OF favorite ON question_user_state BEGIN SELECT RAISE(ABORT, '工作台收藏失败注入'); END",
  100 |         ),
  101 |       false,
  102 |     )
  103 |     fault = true
  104 |     await page.getByRole('button', { name: '取消收藏', exact: true }).click()
  105 |     await expect(page.getByRole('button', { name: '重试收藏操作', exact: true })).toHaveAttribute(
  106 |       'aria-pressed',
  107 |       'true',
  108 |     )
  109 |     withHistoryDatabase(
  110 |       testDataDirectory,
  111 |       (db) => db.exec('DROP TRIGGER workbench_favorite_fault'),
  112 |       false,
  113 |     )
  114 |     fault = false
  115 |     await page.getByRole('button', { name: '重试收藏操作', exact: true }).click()
  116 |     await expect(page.getByRole('button', { name: '收藏本题', exact: true })).toHaveAttribute(
  117 |       'aria-pressed',
  118 |       'false',
  119 |     )
  120 |     const after = themeBusinessSnapshot(testDataDirectory)
  121 |     expect(after.sessions).toEqual(before.sessions)
  122 |     expect(after.items).toEqual(before.items)
  123 |     expect(after.receipts).toEqual(before.receipts)
  124 |     await page.getByRole('button', { name: '收藏本题', exact: true }).click()
  125 |     await expect(page.getByRole('button', { name: '取消收藏', exact: true })).toBeEnabled()
  126 |     await expect(page.getByRole('textbox', { name: '我的答案', exact: true })).toHaveValue('')
  127 |     await expect(page.locator('body')).not.toContainText('WORKBENCH-ANSWER-1')
  128 |     expect(await page.locator('body').ariaSnapshot()).not.toContain('WORKBENCH-ANSWER-1')
  129 |     await expect(page.getByRole('button', { name: '查看本题历史', exact: true })).toHaveCount(0)
  130 |     await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  131 |     await expect(page.getByLabel('练习参考答案', { exact: true })).toContainText(
  132 |       'WORKBENCH-ANSWER-1',
  133 |     )
  134 |     await expect(page.getByRole('button', { name: '查看本题历史', exact: true })).toBeVisible()
  135 |     await page.getByRole('button', { name: '不熟', exact: true }).click()
  136 |     await expect(page.getByLabel('练习进度', { exact: true })).toContainText('第 2 / 20')
  137 |     await expect(page.getByRole('button', { name: '收藏本题', exact: true })).toHaveAttribute(
  138 |       'aria-pressed',
  139 |       'false',
  140 |     )
  141 |     await expect(page.getByRole('button', { name: '查看本题历史', exact: true })).toHaveCount(0)
  142 |     await expect(page.locator('body')).not.toContainText('WORKBENCH-ANSWER-1')
  143 |     expect(await page.locator('body').ariaSnapshot()).not.toContain('WORKBENCH-ANSWER-1')
  144 |     const questions = (await categoryList(page)).questions
  145 |     expect(questions.find((question) => question.questionId === 'q-1')).toMatchObject({
  146 |       favorite: true,
  147 |       currentRating: '不熟',
  148 |     })
  149 |     expect(questions.find((question) => question.questionId === 'q-2')).toMatchObject({
  150 |       favorite: false,
  151 |       currentRating: null,
  152 |     })
  153 |   } finally {
  154 |     if (fault)
  155 |       withHistoryDatabase(
  156 |         testDataDirectory,
  157 |         (db) => db.exec('DROP TRIGGER workbench_favorite_fault'),
  158 |         false,
  159 |       )
  160 |     await stop(application)
  161 |   }
  162 | })
  163 | 
```