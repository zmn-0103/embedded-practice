# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: practice-window.spec.ts >> 窗口输入/纯思考、答案隐藏、自评修改/跳过/末题与新轮默认
- Location: tests\e2e\practice-window.spec.ts:119:5

# Error details

```
Error: expect(received).not.toContain(expected) // indexOf

Expected substring: not "M2-WINDOW-ANSWER-ONE 仅揭晓后显示"
Received string:        "<!DOCTYPE html><html lang=\"zh-CN\" data-theme=\"system\" data-palette=\"forest\" data-font-size=\"17\"><head>
    <meta charset=\"UTF-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
    <meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' practice-image:; font-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'\">
    <meta name=\"color-scheme\" content=\"light dark\">
    <title>嵌入式刷题本</title>
    <script type=\"module\" crossorigin=\"\" src=\"./assets/index-CZmIr026.js\"></script>
    <link rel=\"stylesheet\" crossorigin=\"\" href=\"./assets/index-Cik9gDwc.css\">
  </head>
  <body>
    <div id=\"root\"><div class=\"app-shell is-practicing\"><header class=\"app-header\"><div class=\"brand-mark\" aria-hidden=\"true\"><svg viewBox=\"0 0 32 32\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\"><rect x=\"8\" y=\"8\" width=\"16\" height=\"16\" rx=\"4\"></rect><path d=\"M12 3v5m8-5v5M12 24v5m8-5v5M3 12h5m-5 8h5m16-8h5m-5 8h5m-16-4 3 3 5-6\"></path></svg></div><div><h1>嵌入式刷题本</h1><p class=\"brand-caption\">思考有迹，积累有序</p></div></header><main id=\"main-content\"><div><section class=\"practice-workspace\" aria-label=\"顺序练习\"><div class=\"practice-heading\"><p aria-label=\"练习进度\">第 1 / 3 题 · 顺序练习</p><p class=\"muted\">练习窗口测试专题 · 基础 · 窗口验证</p><h2 tabindex=\"-1\">窗口练习 1</h2></div><div class=\"practice-reading\"><section aria-label=\"练习题干\"><div class=\"markdown-content\"><p>第 1 题题干。</p>
<div class=\"code-block\"><div class=\"code-toolbar\"><span>c</span><button type=\"button\">复制代码</button><span class=\"copy-notice\" aria-live=\"polite\"></span></div><pre><code class=\"language-c\"><span class=\"hljs-type\">int</span> value = <span class=\"hljs-number\">1</span>;
<span class=\"hljs-comment\">// &lt;script&gt;globalThis.practiceEvil = 1&lt;/script&gt;</span>
</code></pre></div>
<div class=\"code-block\"><div class=\"code-toolbar\"><span>cpp</span><button type=\"button\">复制代码</button><span class=\"copy-notice\" aria-live=\"polite\"></span></div><pre><code class=\"language-cpp\"><span class=\"hljs-keyword\">class</span> <span class=\"hljs-title class_\">Device</span> {};
</code></pre></div>
<div class=\"code-block\"><div class=\"code-toolbar\"><span>arm</span><button type=\"button\">复制代码</button><span class=\"copy-notice\" aria-live=\"polite\"></span></div><pre><code class=\"language-arm\"><span class=\"hljs-keyword\">MOV</span> <span class=\"hljs-built_in\">r0</span>, <span class=\"hljs-number\">#1</span>
<span class=\"hljs-keyword\">BX</span> <span class=\"hljs-built_in\">lr</span>
</code></pre></div>
<div class=\"code-block\"><div class=\"code-toolbar\"><span>unknown-language</span><button type=\"button\">复制代码</button><span class=\"copy-notice\" aria-live=\"polite\"></span></div><pre><code class=\"language-unknown-language\">保持原样 &lt;tag&gt;
</code></pre></div>
<table><thead><tr><th>项目</th><th class=\"align-right\">数值</th></tr></thead><tbody><tr><td>GPIO</td><td class=\"align-right\">1</td></tr></tbody></table>
<p><button type=\"button\" class=\"image-preview\" aria-label=\"放大查看：PNG\"><img alt=\"PNG\" loading=\"lazy\" decoding=\"async\" src=\"practice-image://resource/1/4bde795c8af51f0bdc1de0db1adc89ed741bf52e777a3b52ca38015ee1b16fad\"></button>
<button type=\"button\" class=\"image-preview\" aria-label=\"放大查看：JPEG\"><img alt=\"JPEG\" loading=\"lazy\" decoding=\"async\" src=\"practice-image://resource/1/200a7848eb435a30c8a06c9762b87732ec6971ca01fd384fe08aacf383b2d639\"></button>
<button type=\"button\" class=\"image-preview\" aria-label=\"放大查看：WebP\"><img alt=\"WebP\" loading=\"lazy\" decoding=\"async\" src=\"practice-image://resource/1/b1f3ff00ba1d62d206025ce07b1ed6cdf87e8c018608d8d1984fe463f4e6e534\"></button></p></div></section><details class=\"practice-input\" open=\"\"><summary>我的答案</summary><label for=\"practice-answer\" class=\"muted\">我的答案</label><textarea id=\"practice-answer\" rows=\"8\" placeholder=\"可以输入文字或代码，也可以先思考，再查看参考答案。\"></textarea></details><div class=\"question-history\"><button type=\"button\" aria-expanded=\"false\">查看本题历史</button></div></div><div class=\"practice-actions\"><div class=\"practice-save\" aria-live=\"polite\">已保存</div><div class=\"button-row\"><button type=\"button\" disabled=\"\">上一题</button><button type=\"button\" class=\"primary\">查看参考答案</button><button type=\"button\">跳过本题</button><button type=\"button\">返回首页</button><button type=\"button\">结束本轮</button></div></div></section></div><div hidden=\"\"><section class=\"import-panel\" aria-label=\"题库导入\"><div class=\"library-toolbar\"><div><p class=\"eyebrow\">你的题库</p><h2>在本地整理，随时查看</h2></div><div class=\"button-row\"><button type=\"button\" class=\"primary\">导入题库</button><button type=\"button\">导出题库模板</button></div></div><p class=\"operation-message\" aria-live=\"polite\">导入完成：新增 3，内容更新 0，信息变更 0，不变 0，归档 0，恢复 0。</p></section></div><div hidden=\"\"><section class=\"library-workspace\" aria-label=\"题库浏览\"><div class=\"library-filters question-filter-fields\"><label>题库搜索<input aria-label=\"题库搜索\" placeholder=\"标题、题干或标签\" maxlength=\"256\" type=\"search\" value=\"\"></label><div class=\"tag-picker\"><label for=\"_r_1_-input\">标签</label><div class=\"tag-picker-input\"><input id=\"_r_1_-input\" role=\"combobox\" aria-label=\"题库标签\" aria-autocomplete=\"list\" aria-expanded=\"false\" placeholder=\"搜索并选择标签，也可填写完整标签\" autocomplete=\"off\" type=\"text\" value=\"\"></div></div><label>难度<select aria-label=\"题库难度\"><option value=\"\">全部难度</option><option value=\"未分级\">未分级</option><option value=\"基础\">基础</option><option value=\"进阶\">进阶</option><option value=\"综合\">综合</option></select></label><label>自评状态<select aria-label=\"题库自评状态\"><option value=\"all\">全部状态</option><option value=\"unpracticed\">未练习</option><option value=\"不会\">不会</option><option value=\"不熟\">不熟</option><option value=\"掌握\">掌握</option></select></label><label><input aria-label=\"题库只看收藏\" type=\"checkbox\">只看收藏</label><p class=\"filter-summary\" aria-label=\"题库已选条件\">全部题目，未限定其他条件</p></div><div class=\"button-row\"><button type=\"button\">筛选题库</button><button type=\"button\">清空题库筛选</button></div><div class=\"library-filters\"><label>专题<select aria-label=\"专题\"><option value=\"\">全部专题</option><option value=\"practice-window\">练习窗口测试专题（3）</option></select></label><label><input type=\"checkbox\">查看归档题目</label><span class=\"muted\">共 3 题</span></div><div class=\"library-columns\"><aside class=\"question-list\" aria-label=\"题目列表\"><ul><li><button type=\"button\" aria-current=\"true\"><small>练习窗口测试专题 · window-1</small><span>窗口练习 1</span></button></li><li><button type=\"button\"><small>练习窗口测试专题 · window-2</small><span>窗口练习 2</span></button></li><li><button type=\"button\"><small>练习窗口测试专题 · window-3</small><span>窗口练习 3</span></button></li></ul><nav class=\"pagination\" aria-label=\"题目分页\"><button type=\"button\" disabled=\"\">上一页</button><span>1 / 1</span><button type=\"button\" disabled=\"\">下一页</button></nav></aside><article class=\"question-reader\" aria-label=\"题目内容\"><header><p class=\"eyebrow\">练习窗口测试专题 · window-1</p><h3>窗口练习 1</h3><p class=\"question-tags\">基础 · 窗口验证</p><p class=\"muted\">当前内容尚未练习</p><button type=\"button\" aria-pressed=\"false\">收藏本题</button></header><h4>题目</h4><div class=\"markdown-content\"><p>第 1 题题干。</p>
<div class=\"code-block\"><div class=\"code-toolbar\"><span>c</span><button type=\"button\">复制代码</button><span class=\"copy-notice\" aria-live=\"polite\"></span></div><pre><code class=\"language-c\"><span class=\"hljs-type\">int</span> value = <span class=\"hljs-number\">1</span>;
<span class=\"hljs-comment\">// &lt;script&gt;globalThis.practiceEvil = 1&lt;/script&gt;</span>
</code></pre></div>
<div class=\"code-block\"><div class=\"code-toolbar\"><span>cpp</span><button type=\"button\">复制代码</button><span class=\"copy-notice\" aria-live=\"polite\"></span></div><pre><code class=\"language-cpp\"><span class=\"hljs-keyword\">class</span> <span class=\"hljs-title class_\">Device</span> {};
</code></pre></div>
<div class=\"code-block\"><div class=\"code-toolbar\"><span>arm</span><button type=\"button\">复制代码</button><span class=\"copy-notice\" aria-live=\"polite\"></span></div><pre><code class=\"language-arm\"><span class=\"hljs-keyword\">MOV</span> <span class=\"hljs-built_in\">r0</span>, <span class=\"hljs-number\">#1</span>
<span class=\"hljs-keyword\">BX</span> <span class=\"hljs-built_in\">lr</span>
</code></pre></div>
<div class=\"code-block\"><div class=\"code-toolbar\"><span>unknown-language</span><button type=\"button\">复制代码</button><span class=\"copy-notice\" aria-live=\"polite\"></span></div><pre><code class=\"language-unknown-language\">保持原样 &lt;tag&gt;
</code></pre></div>
<table><thead><tr><th>项目</th><th class=\"align-right\">数值</th></tr></thead><tbody><tr><td>GPIO</td><td class=\"align-right\">1</td></tr></tbody></table>
<p><button type=\"button\" class=\"image-preview\" aria-label=\"放大查看：PNG\"><img alt=\"PNG\" loading=\"lazy\" decoding=\"async\" src=\"practice-image://resource/1/4bde795c8af51f0bdc1de0db1adc89ed741bf52e777a3b52ca38015ee1b16fad\"></button>
<button type=\"button\" class=\"image-preview\" aria-label=\"放大查看：JPEG\"><img alt=\"JPEG\" loading=\"lazy\" decoding=\"async\" src=\"practice-image://resource/1/200a7848eb435a30c8a06c9762b87732ec6971ca01fd384fe08aacf383b2d639\"></button>
<button type=\"button\" class=\"image-preview\" aria-label=\"放大查看：WebP\"><img alt=\"WebP\" loading=\"lazy\" decoding=\"async\" src=\"practice-image://resource/1/b1f3ff00ba1d62d206025ce07b1ed6cdf87e8c018608d8d1984fe463f4e6e534\"></button></p></div><div class=\"answer-control\"><button type=\"button\">收起参考答案</button></div><section class=\"reference-answer\" aria-label=\"参考答案\"><h4>参考答案</h4><div class=\"markdown-content\"><p>M2-WINDOW-ANSWER-ONE 仅揭晓后显示</p></div></section><div class=\"question-history\"><button type=\"button\" aria-expanded=\"false\">查看本题历史</button></div></article></div></section></div><section class=\"service-status status-ready\" role=\"status\"><span class=\"status-dot\" aria-hidden=\"true\"></span><p>本地数据已就绪</p></section></main><footer><span>离线使用 · 数据保存在本机</span><span>v42.11.15 · 构建 20261023.2-findability</span></footer></div></div>
  

</body></html>"
```

# Test source

```ts
  30  |           (n) =>
  31  |             `## window-${n} | 窗口练习 ${n}\n\n标签：窗口验证\n难度：基础\n\n### 题目\n\n第 ${n} 题题干。\n\n${
  32  |               n === 1
  33  |                 ? '```c\n' +
  34  |                   code +
  35  |                   '```\n\n```cpp\nclass Device {};\n```\n\n```arm\nMOV r0, #1\nBX lr\n```\n\n```unknown-language\n保持原样 <tag>\n```\n\n| 项目 | 数值 |\n| :--- | ---: |\n| GPIO | 1 |\n\n![PNG](assets/small.png)\n![JPEG](assets/small.jpg)\n![WebP](assets/small.webp)\n\n'
  36  |                 : ''
  37  |             }${options.longQuestions ? Array.from({ length: 60 }, (_, index) => `第 ${n} 题第 ${index + 1} 段长题干，核对切题时阅读入口与操作位置。`).join('\n\n') + '\n\n' : ''}### 参考答案\n\n${n === 1 ? secret : `M2-ANSWER-${n}`}\n\n${options.longAnswer && n === 1 ? Array.from({ length: 60 }, (_, index) => `第 ${index + 1} 段长答案，用来核对操作按钮在长内容下仍可见。`).join('\n\n') + '\n\n' : ''}`,
  38  |         )
  39  |         .join(''),
  40  |   )
  41  |   return { file, code }
  42  | }
  43  | async function prepare(directory: string, project: string, options: FixtureOptions = {}) {
  44  |   const source = await fixture(directory, options)
  45  |   const launched = await launchApplication(directory, project, '题库')
  46  |   await launched.application.evaluate(({ dialog }, file) => {
  47  |     dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [file] })
  48  |   }, source.file)
  49  |   await launched.page.getByRole('button', { name: '导入题库', exact: true }).click()
  50  |   await launched.page.getByRole('heading', { name: '导入预览', exact: true }).waitFor()
  51  |   await launched.page.getByRole('button', { name: '确认导入', exact: true }).click()
  52  |   await expect(launched.page.getByText(/^导入完成：/)).toBeVisible()
  53  |   await openPage(launched.page, '开始练习')
  54  |   await expect(launched.page.getByRole('button', { name: '开始练习', exact: true })).toBeEnabled()
  55  |   return { ...launched, ...source }
  56  | }
  57  | async function begin(page: Page) {
  58  |   await page.getByRole('button', { name: '开始练习', exact: true }).click()
  59  |   await expect(page.getByLabel('练习进度')).toHaveText('第 1 / 3 题 · 顺序练习')
  60  | }
  61  | function databasePath(directory: string) {
  62  |   if (
  63  |     dirname(resolve(directory)) !== resolve(tmpdir()) ||
  64  |     !basename(directory).startsWith('embedded-practice-')
  65  |   )
  66  |     throw new Error('拒绝访问非测试数据目录。')
  67  |   return join(directory, 'practice.sqlite3')
  68  | }
  69  | function stored(directory: string) {
  70  |   const database = new DatabaseSync(databasePath(directory), { readOnly: true })
  71  |   try {
  72  |     return {
  73  |       sessions: database
  74  |         .prepare('SELECT id, status, position, revision FROM practice_sessions ORDER BY rowid')
  75  |         .all() as unknown as { id: string; status: string; position: number; revision: number }[],
  76  |       items: database
  77  |         .prepare(
  78  |           `SELECT session_id AS sessionId, position, draft, draft_revision AS draftRevision,
  79  |         revealed_at AS revealedAt, rating, skipped_at AS skippedAt FROM practice_items ORDER BY rowid`,
  80  |         )
  81  |         .all() as unknown as {
  82  |         sessionId: string
  83  |         position: number
  84  |         draft: string
  85  |         draftRevision: number
  86  |         revealedAt: string | null
  87  |         rating: string | null
  88  |         skippedAt: string | null
  89  |       }[],
  90  |       receipts: database.prepare('SELECT request_id FROM practice_receipts ORDER BY rowid').all(),
  91  |       foreignKeys: database.prepare('PRAGMA foreign_key_check').all(),
  92  |     }
  93  |   } finally {
  94  |     database.close()
  95  |   }
  96  | }
  97  | function change(directory: string, sql: string) {
  98  |   const database = new DatabaseSync(databasePath(directory))
  99  |   try {
  100 |     database.exec(sql)
  101 |   } finally {
  102 |     database.close()
  103 |   }
  104 | }
  105 | async function stop(application: ElectronApplication) {
  106 |   // 失败场景也能清理测试进程；此清理不作为正常关闭验证证据。
  107 |   if (closedApplications.has(application)) return
  108 |   await application.evaluate(({ app }) => app.exit(0)).catch(() => {})
  109 |   await application.close().catch(() => {})
  110 |   closedApplications.add(application)
  111 | }
  112 | async function closeWindow(application: ElectronApplication) {
  113 |   const closed = application.waitForEvent('close')
  114 |   await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.close())
  115 |   await closed
  116 |   closedApplications.add(application)
  117 | }
  118 | 
  119 | test('窗口输入/纯思考、答案隐藏、自评修改/跳过/末题与新轮默认', async ({
  120 |   testDataDirectory,
  121 | }, info) => {
  122 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  123 |   try {
  124 |     await openPage(page, '题库')
  125 |     await page.getByRole('button', { name: /window-1/ }).click()
  126 |     await page.getByRole('button', { name: '展开参考答案' }).click()
  127 |     await expect(page.getByText(secret, { exact: true })).toBeVisible()
  128 |     await openPage(page, '开始练习')
  129 |     await begin(page)
> 130 |     expect(await page.content()).not.toContain(secret)
      |                                      ^ Error: expect(received).not.toContain(expected) // indexOf
  131 |     expect(await page.locator('body').ariaSnapshot()).not.toContain(secret)
  132 |     expect(await page.getByRole('button', { name: '导入题库', exact: true }).count()).toBe(0)
  133 |     expect(await page.getByRole('button', { name: '掌握', exact: true }).count()).toBe(0)
  134 |     const input = page.getByRole('textbox', { name: '我的答案', exact: true })
  135 |     await input.fill('中文输入\nint answer = 1;')
  136 |     await expect(page.locator('.practice-save')).toHaveText('已保存')
  137 |     expect(stored(testDataDirectory).items[0]?.draft).toBe('中文输入\nint answer = 1;')
  138 |     await page.getByRole('button', { name: '查看参考答案', exact: true }).dblclick({ delay: 100 })
  139 |     await expect(page.getByRole('region', { name: '练习参考答案', exact: true })).toContainText(
  140 |       secret,
  141 |     )
  142 |     const firstTime = stored(testDataDirectory).items[0]?.revealedAt
  143 |     await page.getByRole('button', { name: '掌握', exact: true }).dblclick({ delay: 100 })
  144 |     await expect(page.getByLabel('练习进度')).toHaveText('第 2 / 3 题 · 顺序练习')
  145 |     expect(await page.content()).not.toContain(secret)
  146 |     await expect(input).toHaveValue('')
  147 |     await page.getByRole('button', { name: '跳过本题' }).click()
  148 |     await expect(page.getByLabel('练习进度')).toContainText('第 3 / 3')
  149 |     await page.getByRole('button', { name: '上一题', exact: true }).click()
  150 |     await expect(page.getByLabel('练习进度')).toContainText('第 2 / 3')
  151 |     await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  152 |     await expect(page.getByRole('region', { name: '练习参考答案' })).toContainText('M2-ANSWER-2')
  153 |     await page.getByRole('button', { name: '暂不评价，下一题' }).click()
  154 |     await page.getByRole('button', { name: '上一题', exact: true }).click()
  155 |     await expect(page.getByRole('region', { name: '练习参考答案' })).toContainText('M2-ANSWER-2')
  156 |     await page.getByRole('button', { name: '上一题', exact: true }).click()
  157 |     await expect(input).toHaveValue('中文输入\nint answer = 1;')
  158 |     await expect(page.getByRole('region', { name: '练习参考答案' })).toContainText(secret)
  159 |     await page.getByRole('button', { name: '不会', exact: true }).click()
  160 |     await page.getByRole('button', { name: '暂不评价，下一题' }).click()
  161 |     await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  162 |     await page.getByRole('button', { name: '暂不评价，下一题' }).click()
  163 |     await expect(page.getByRole('heading', { name: '本轮已完成' })).toBeVisible()
  164 |     const completed = stored(testDataDirectory)
  165 |     expect(completed.sessions).toMatchObject([{ status: 'finished', position: 3 }])
  166 |     expect(completed.items).toHaveLength(3)
  167 |     expect(completed.items.map((item) => item.rating)).toEqual(['不会', null, null])
  168 |     expect(completed.items[0]?.revealedAt).toBe(firstTime)
  169 |     expect(completed.foreignKeys).toEqual([])
  170 |     await page.getByRole('button', { name: '返回首页', exact: true }).click()
  171 |     await begin(page)
  172 |     await expect(input).toHaveValue('')
  173 |     expect(await page.content()).not.toContain(secret)
  174 |     const fresh = stored(testDataDirectory)
  175 |     expect(fresh.sessions).toHaveLength(2)
  176 |     expect(
  177 |       fresh.items
  178 |         .slice(3)
  179 |         .every((item) => item.draft === '' && item.revealedAt === null && item.rating === null),
  180 |     ).toBe(true)
  181 |     await info.attach('practice-window-roundtrip.json', {
  182 |       body: JSON.stringify({ completed, fresh }),
  183 |       contentType: 'application/json',
  184 |     })
  185 |   } finally {
  186 |     await stop(application)
  187 |   }
  188 | })
  189 | 
  190 | test('写入失败保留输入/阻止切题，自评推进失败按原操作重试', async ({ testDataDirectory }, info) => {
  191 |   const { application, page } = await prepare(testDataDirectory, info.project.name)
  192 |   try {
  193 |     await begin(page)
  194 |     change(
  195 |       testDataDirectory,
  196 |       `CREATE TRIGGER fail_window_draft BEFORE UPDATE OF draft ON practice_items BEGIN SELECT RAISE(ABORT, '主动注入窗口草稿失败'); END`,
  197 |     )
  198 |     const input = page.getByRole('textbox', { name: '我的答案', exact: true })
  199 |     await input.fill('保存失败仍必须保留')
  200 |     await expect(page.locator('.practice-save')).toHaveText('保存失败')
  201 |     await page.getByRole('button', { name: '跳过本题' }).click()
  202 |     await expect(page.getByLabel('练习进度')).toContainText('第 1 / 3')
  203 |     await expect(input).toHaveValue('保存失败仍必须保留')
  204 |     expect(stored(testDataDirectory).items[0]?.draft).toBe('')
  205 |     change(testDataDirectory, 'DROP TRIGGER fail_window_draft')
  206 |     await page.getByRole('button', { name: '重试保存' }).click()
  207 |     await expect(page.locator('.practice-save')).toHaveText('已保存')
  208 |     await input.fill('揭晓前立即保存的最新输入')
  209 |     await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  210 |     await expect(page.getByRole('region', { name: '练习参考答案' })).toBeVisible()
  211 |     expect(stored(testDataDirectory).items[0]?.draft).toBe('揭晓前立即保存的最新输入')
  212 |     change(
  213 |       testDataDirectory,
  214 |       `CREATE TRIGGER fail_window_rate BEFORE UPDATE ON practice_sessions WHEN NEW.position <> OLD.position BEGIN SELECT RAISE(ABORT, '主动注入窗口推进失败'); END`,
  215 |     )
  216 |     const before = stored(testDataDirectory)
  217 |     await page.getByRole('button', { name: '掌握', exact: true }).click()
  218 |     await expect(page.getByRole('button', { name: '重试原操作' })).toBeVisible()
  219 |     await expect(page.getByLabel('练习进度')).toContainText('第 1 / 3')
  220 |     expect(stored(testDataDirectory)).toEqual(before)
  221 |     change(testDataDirectory, 'DROP TRIGGER fail_window_rate')
  222 |     await page.getByRole('button', { name: '重试原操作' }).click()
  223 |     await expect(page.getByLabel('练习进度')).toContainText('第 2 / 3')
  224 |     const after = stored(testDataDirectory)
  225 |     expect(after.items.filter((item) => item.rating !== null)).toHaveLength(1)
  226 |     await info.attach('practice-window-failures.json', {
  227 |       body: JSON.stringify({ before, after }),
  228 |       contentType: 'application/json',
  229 |     })
  230 |   } finally {
```