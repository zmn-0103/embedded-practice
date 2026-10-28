# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: category-tree.spec.ts >> 分类范围：分类/专题/标签/难度/归档交集与候选，重导入保留归属和稳定身份
- Location: tests\e2e\category-tree.spec.ts:76:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: '导入预览', exact: true })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: '导入预览', exact: true }) with timeout 10000ms
  - waiting for getByRole('heading', { name: '导入预览', exact: true })

```

```yaml
- banner:
  - heading "嵌入式刷题本" [level=1]
  - paragraph: 思考有迹，积累有序
  - button "收起导航" [expanded]: ‹
- navigation "主要页面":
  - link "学习总览":
    - /url: "#overview"
  - link "知识板块":
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
  - text: 学习工作台
  - strong: 题库
  - text: 本地离线
  - group: 外观
  - region "题库导入":
    - strong: 题库工具
    - button "导入题库"
    - button "导出题库模板"
    - dialog "导入与模板":
      - heading "导入与模板" [level=2]
      - button "关闭导入工作区"
      - list "导入步骤":
        - listitem: 1. 选择文件
        - listitem: 2. 检查预览
        - listitem: 3. 确认导入
      - paragraph: 每个专题文件是完整快照；遗漏的现有题目将归档，题目及学习记录保留。未参与导入的专题不受影响。请持续核对本次将归档数量。
      - alert:
        - paragraph: 文件准备未通过，请按错误定位修正后重试。
        - list:
          - listitem: C:\Users\pc\AppData\Local\Temp\embedded-practice-E1rMwz\分类 中文样本\cat-a.md · 第 1 行，第 1 列：无法准备来源文件，请检查文件后重试。
  - region "题库浏览":
    - group: 勾选组卷与题单（0题）
    - group: 管理分类
    - group "选择题库范围":
      - heading "1 · 选择范围" [level=3]
      - text: 专题
      - combobox "专题":
        - option "全部专题" [selected]
        - option "丙专题（1）"
        - option "乙专题（2）"
        - option "甲专题（2）"
      - checkbox "查看归档题目"
      - text: 查看归档题目
      - paragraph: 分类在“分类与专题”导航中选择；范围更改后立即更新结果。
    - group "设置题库条件":
      - heading "2 · 设置条件" [level=3]
      - text: 题库搜索
      - searchbox "题库搜索"
      - text: 标签
      - combobox "题库标签"
      - text: 难度
      - combobox "题库难度":
        - option "全部难度" [selected]
        - option "未分级"
        - option "易（基础）"
        - option "中（进阶）"
        - option "难（综合）"
      - text: 自评状态
      - combobox "题库自评状态":
        - option "全部状态" [selected]
        - option "未练习"
        - option "不会＋不熟"
        - option "不会"
        - option "不熟"
        - option "掌握"
      - checkbox "题库只看收藏"
      - text: 只看收藏
      - paragraph: 全部题目，未限定其他条件
      - checkbox "题库只看内容更新待复习"
      - text: 只看内容更新待复习
      - button "筛选题库"
    - group "题库生效筛选与结果":
      - heading "3 · 查看结果" [level=3]
      - strong: 共 5 题
      - button "清空题库筛选"
      - paragraph: 全部分类 · 全部专题 · 有效题目
      - paragraph: 全部题目，未限定其他条件
      - paragraph: 清空将恢复全部分类、全部专题和有效题目，并移除所有附加条件。
      - text: 已勾选 0 题
      - button "勾选本页有效题"
    - complementary "题库分类与专题导航":
      - group:
        - text: 分类与专题
        - navigation "题库分类导航":
          - text: 查找专题
          - searchbox "题库专题检索"
          - paragraph: 检索仅筛选导航；点击后应用范围。
          - button "全部分类（5题）" [pressed]
          - list:
            - listitem:
              - button "收起未分类" [expanded]
              - button "题库分类：未分类": 未分类（1题）
              - list:
                - listitem:
                  - button "题库专题：丙专题": 丙专题（1题）
            - listitem:
              - button "展开板块 A"
              - button "题库分类：板块 A": 板块 A（4题）
            - listitem:
              - button "展开板块 B"
              - button "题库分类：板块 B": 板块 B（0题）
    - complementary "题目列表":
      - list:
        - listitem:
          - checkbox "勾选题目：cat-c / q-1 cat-c 问题 1"
          - button "cat-c 问题 1 丙专题 · q-1 · 难度：易（基础） 尚未练习": cat-c 问题 1 丙专题 · q-1 · 易（基础） 尚未练习
        - listitem:
          - checkbox "勾选题目：cat-b / q-1 cat-b 问题 1"
          - button "cat-b 问题 1 乙专题 · q-1 · 难度：易（基础） 尚未练习": cat-b 问题 1 乙专题 · q-1 · 易（基础） 尚未练习
        - listitem:
          - checkbox "勾选题目：cat-b / q-2 cat-b 问题 2"
          - button "cat-b 问题 2 乙专题 · q-2 · 难度：中（进阶） 尚未练习": cat-b 问题 2 乙专题 · q-2 · 中（进阶） 尚未练习
        - listitem:
          - checkbox "勾选题目：cat-a / q-1 cat-a 问题 1"
          - button "cat-a 问题 1 甲专题 · q-1 · 难度：易（基础） 尚未练习": cat-a 问题 1 甲专题 · q-1 · 易（基础） 尚未练习
        - listitem:
          - checkbox "勾选题目：cat-a / q-2 cat-a 问题 2"
          - button "cat-a 问题 2 甲专题 · q-2 · 难度：中（进阶） 尚未练习": cat-a 问题 2 甲专题 · q-2 · 中（进阶） 尚未练习
      - navigation "题目分页":
        - button "上一页" [disabled]
        - text: 1 / 1
        - button "下一页" [disabled]
    - text: 选择一道题，检查导入后的内容。
    - paragraph: 需要作答时，切换到“开始练习”选择条件。
  - status:
    - paragraph: 本地数据已就绪
- contentinfo: 离线使用 · 数据保存在本机 V0.0.2 测试版 · 构建 20261028.1-content-updates
```

# Test source

```ts
  1   | import { copyFile, mkdir, writeFile } from 'node:fs/promises'
  2   | import { tmpdir } from 'node:os'
  3   | import { basename, dirname, join, resolve } from 'node:path'
  4   | import { DatabaseSync } from 'node:sqlite'
  5   | import type { ElectronApplication, Page, TestInfo } from '@playwright/test'
  6   | import type { DesktopApi } from '../../src/shared/contracts/application'
  7   | import type { HistoryListRequest, HistorySummary } from '../../src/shared/contracts/history'
  8   | import { seedHistory } from '../integration/history-seed'
  9   | import { expect, launchApplication, openPage } from './helpers'
  10  | 
  11  | export function historyBank(
  12  |   changed = false,
  13  |   metadata = false,
  14  |   omitted = false,
  15  |   topic = 'history-a',
  16  | ) {
  17  |   return (
  18  |     `---\nschema_version: 1\ntopic_id: ${topic}\ntopic_title: ${metadata ? '元数据专题' : topic === 'history-a' ? '历史专题 A' : '历史专题 B'}\n---\n\n` +
  19  |     (topic === 'history-b' ? [1] : metadata ? [2, 1] : [1, 2])
  20  |       .filter((n) => !omitted || n !== 1)
  21  |       .map(
  22  |         (n) =>
  23  |           `## q-${n} | ${metadata ? '元数据题' : topic === 'history-a' ? '历史题' : '异专题题'} ${n}\n\n标签：历史样本${metadata ? ', 新标签' : ''}\n难度：基础\n\n### 题目\n\nHISTORY-BODY-${changed ? 'NEW' : 'OLD'}-${topic}-${n}\n\n${n === 1 ? '![历史图](assets/history.png)\n\n' : ''}### 参考答案\n\nHISTORY-ANSWER-${changed ? 'NEW' : 'OLD'}-${topic}-${n}\n\n\`\`\`c\nint value = ${changed ? 2 : 1};\n\`\`\`\n\n`,
  24  |       )
  25  |       .join('')
  26  |   )
  27  | }
  28  | // 自建 3×2 RGBA PNG：标准库 zlib/CRC 生成，区别于原 2×3 夹具。
  29  | export const alternatePng = Buffer.from(
  30  |   'iVBORw0KGgoAAAANSUhEUgAAAAMAAAACCAYAAACddGYaAAAAEUlEQVR4nGO4Y2T0H4YZkDkArhENe6mq6B4AAAAASUVORK5CYII=',
  31  |   'base64',
  32  | )
  33  | const closed = new WeakSet<ElectronApplication>()
  34  | export async function stop(application: ElectronApplication) {
  35  |   if (closed.has(application)) return
  36  |   // 窗口创建早于页面加载完成；诊断/清理过早 app.exit 会误触发启动加载失败。
  37  |   await Promise.all(
  38  |     application
  39  |       .windows()
  40  |       .map((page) => page.waitForLoadState('load', { timeout: 3000 }).catch(() => {})),
  41  |   )
  42  |   await application.evaluate(({ app }) => app.exit(0)).catch(() => {})
  43  |   await application.close().catch(() => {})
  44  |   closed.add(application)
  45  | }
  46  | export async function importHistoryFiles(
  47  |   application: ElectronApplication,
  48  |   page: Page,
  49  |   paths: string[],
  50  | ) {
  51  |   await openPage(page, '题库')
  52  |   await application.evaluate(({ dialog }, selected) => {
  53  |     dialog.showOpenDialog = async () => ({ canceled: false, filePaths: selected })
  54  |   }, paths)
  55  |   await page.getByRole('button', { name: '导入题库', exact: true }).click()
> 56  |   await expect(page.getByRole('heading', { name: '导入预览', exact: true })).toBeVisible()
      |                                                                          ^ Error: expect(locator).toBeVisible() failed
  57  |   await page.getByRole('button', { name: '确认导入', exact: true }).click()
  58  |   await expect(page.getByText(/^导入完成：/)).toBeVisible()
  59  |   await page.getByRole('button', { name: '关闭导入工作区', exact: true }).click()
  60  | }
  61  | export async function prepareHistory(directory: string, project: string, rounds = 3) {
  62  |   const folder = join(directory, '历史 中文来源')
  63  |   await mkdir(join(folder, 'assets'), { recursive: true })
  64  |   await copyFile(resolve('tests/fixtures/images/small.png'), join(folder, 'assets/history.png'))
  65  |   const file = join(folder, '历史.md')
  66  |   const other = join(folder, '异专题.md')
  67  |   await writeFile(file, historyBank())
  68  |   await writeFile(other, historyBank(false, false, false, 'history-b'))
  69  |   const launched = await launchApplication(directory, project)
  70  |   try {
  71  |     await importHistoryFiles(launched.application, launched.page, [file, other])
  72  |     const seed = await launched.application.evaluate(seedHistory, { directory, rounds })
  73  |     expect(seed.errors).toEqual([])
  74  |     return { ...launched, seed, folder, file }
  75  |   } catch (error) {
  76  |     await stop(launched.application)
  77  |     throw error
  78  |   }
  79  | }
  80  | export function withHistoryDatabase<T>(
  81  |   directory: string,
  82  |   work: (database: DatabaseSync) => T,
  83  |   readOnly = true,
  84  | ): T {
  85  |   if (
  86  |     dirname(resolve(directory)) !== resolve(tmpdir()) ||
  87  |     !basename(directory).startsWith('embedded-practice-')
  88  |   )
  89  |     throw new Error('拒绝访问非本次测试库。')
  90  |   const database = new DatabaseSync(join(directory, 'practice.sqlite3'), { readOnly })
  91  |   try {
  92  |     return work(database)
  93  |   } finally {
  94  |     database.close()
  95  |   }
  96  | }
  97  | export function historySnapshot(directory: string) {
  98  |   return withHistoryDatabase(directory, (database) => ({
  99  |     sessions: database.prepare('SELECT * FROM practice_sessions ORDER BY rowid').all(),
  100 |     items: database.prepare('SELECT * FROM practice_items ORDER BY rowid').all(),
  101 |     states: database.prepare('SELECT * FROM question_user_state ORDER BY rowid').all(),
  102 |     receipts: database.prepare('SELECT * FROM practice_receipts ORDER BY rowid').all(),
  103 |     versions: database.prepare('SELECT * FROM question_versions ORDER BY id').all(),
  104 |     questions: database.prepare('SELECT * FROM questions ORDER BY id').all(),
  105 |     resources: database
  106 |       .prepare('SELECT hash, width, height, hex(bytes) AS bytes FROM image_resources ORDER BY hash')
  107 |       .all(),
  108 |     foreignKeys: database.prepare('PRAGMA foreign_key_check').all(),
  109 |     integrity: database.prepare('PRAGMA quick_check').all(),
  110 |     schema: database.prepare('PRAGMA user_version').get(),
  111 |   }))
  112 | }
  113 | export async function readHistory(page: Page, options: Partial<HistoryListRequest> = {}) {
  114 |   const result = await page.evaluate(
  115 |     (request) => (globalThis as unknown as { desktop: DesktopApi }).desktop.history.list(request),
  116 |     { topicId: 'history-a', questionId: 'q-1', page: 1, ...options },
  117 |   )
  118 |   if (!result.ok) throw new Error('历史读取失败：' + result.error.code)
  119 |   return result.value
  120 | }
  121 | export async function readHistoryEntry(
  122 |   page: Page,
  123 |   entry: Pick<HistorySummary, 'sessionId' | 'position'>,
  124 |   topicId = 'history-a',
  125 |   questionId = 'q-1',
  126 | ) {
  127 |   const result = await page.evaluate(
  128 |     (request) =>
  129 |       (globalThis as unknown as { desktop: DesktopApi }).desktop.history.getEntry(request),
  130 |     { topicId, questionId, sessionId: entry.sessionId, position: entry.position },
  131 |   )
  132 |   if (!result.ok) throw new Error('历史详情失败：' + result.error.code)
  133 |   return result.value
  134 | }
  135 | export async function selectHistoryQuestion(page: Page, questionId = 'q-1') {
  136 |   await openPage(page, '题库')
  137 |   const returnToList = page.getByRole('button', { name: '返回题目列表', exact: true })
  138 |   if (await returnToList.isVisible()) await returnToList.click()
  139 |   await page.getByRole('combobox', { name: '专题', exact: true }).selectOption('history-a')
  140 |   await expect(page.getByRole('button', { name: '筛选题库', exact: true })).toBeEnabled()
  141 |   await page
  142 |     .getByRole('complementary', { name: '题目列表' })
  143 |     .getByRole('button', { name: new RegExp(` · ${questionId}(?:\\s|$)`) })
  144 |     .click()
  145 |   await expect(page.getByRole('article', { name: '题目内容' })).toBeVisible()
  146 | }
  147 | export async function beginHistoryPractice(page: Page) {
  148 |   await openPage(page, '开始练习')
  149 |   await page.getByRole('combobox', { name: '练习专题', exact: true }).selectOption('history-a')
  150 |   await expect(page.getByText('匹配 2 题', { exact: true })).toBeVisible()
  151 |   await page.getByRole('button', { name: '开始练习', exact: true }).click()
  152 |   await expect(page.getByLabel('练习进度')).toHaveText('第 1 / 2 题 · 顺序练习')
  153 | }
  154 | export async function captureHistory(
  155 |   application: ElectronApplication,
  156 |   page: Page,
```