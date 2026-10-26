const { _electron, expect } = require('@playwright/test')
const { mkdtemp, mkdir, writeFile } = require('node:fs/promises')
const { tmpdir } = require('node:os')
const { join, resolve } = require('node:path')
const { DatabaseSync } = require('node:sqlite')

async function main() {
  const target = process.env.EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE
  if (!target) throw new Error('需要本轮明确的解包EXE目标。')
  const evidence = resolve(__dirname)
  const images = join(evidence, 'final-screens-r5')
  await mkdir(images)
  const directory = await mkdtemp(join(tmpdir(), 'embedded-practice-ui2-final-'))
  const env = { ...process.env, EMBEDDED_PRACTICE_TEST_DATA_DIR: directory }
  delete env.ELECTRON_RUN_AS_NODE
  delete env.ELECTRON_RENDERER_URL
  const application = await _electron.launch({ executablePath: resolve(target), args: [], env })
  try {
    const page = await application.firstWindow()
    await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(1440, 900))
    await page.locator('.app-shell').waitFor()
    const runtime = await application.evaluate(({ app }) => ({ exe: app.getPath('exe'), userData: app.getPath('userData'), packaged: app.isPackaged, version: app.getVersion() }))
    if (runtime.userData !== directory || runtime.exe.toLowerCase() !== resolve(target).toLowerCase() || !runtime.packaged) throw new Error('运行对象或独立数据目录不匹配。')
    await expect(page.locator('footer')).toContainText('20261026.1-workbench-e-ui2')
    const nav = async (name) => {
      const link = page.getByRole('navigation', { name: '主要页面', exact: true }).getByRole('link', { name, exact: true })
      await expect(link).toHaveAttribute('aria-disabled', 'false')
      await link.click()
    }
    const capture = async (name) => {
      await page.evaluate(() => scrollTo(0, 0))
      await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))))
      await page.screenshot({ path: join(images, name) })
    }
    await nav('设置与数据')
    await page.getByRole('radio', { name: '晴空蓝', exact: true }).check()
    await page.getByLabel('显示主题', { exact: true }).selectOption('light')
    await page.getByRole('button', { name: '保存并应用', exact: true }).click()
    await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
    await nav('学习总览')
    await expect(page.getByRole('button', { name: '导入题库', exact: true })).toBeVisible()
    await capture('overview-empty-1440-17.png')
    const file = join(directory, 'ui2-sample.md')
    await writeFile(file, '---\nschema_version: 1\ntopic_id: ui2-sample\ntopic_title: 第二轮布局验收\n---\n\n' + Array.from({ length: 25 }, (_, index) => `## q-${index + 1} | 第 ${index + 1} 题：简短原理说明\n\n标签：工作台, 布局\n难度：基础\n\n### 题目\n\n请说明这一条基础原理，并给出适用条件。\n\n### 参考答案\n\n先说明原理，再说明边界与验证方法。\n\n`).join(''))
    await nav('题库')
    await application.evaluate(({ dialog }, file) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [file] }) }, file)
    await page.getByRole('button', { name: '导入题库', exact: true }).click()
    await page.getByRole('heading', { name: '导入预览', exact: true }).waitFor()
    await page.getByRole('button', { name: '确认导入', exact: true }).click()
    await expect(page.getByText(/^导入完成：/)).toBeVisible()
    await page.getByRole('button', { name: '关闭导入工作区', exact: true }).click()
    const measurements = []
    for (const index of [0, 9, 19]) {
      const row = page.locator('.question-row').nth(index)
      await row.scrollIntoViewIfNeeded()
      const beforeScroll = await page.locator('.question-list-scroll').evaluate((element) => element.scrollTop)
      await row.click()
      const title = page.getByRole('article', { name: '题目内容', exact: true }).locator('h3')
      await expect(title).toHaveText(`第 ${index + 1} 题：简短原理说明`)
      await expect(title).toBeInViewport({ ratio: 1 })
      const afterScroll = await page.locator('.question-list-scroll').evaluate((element) => element.scrollTop)
      expect(afterScroll).toBe(beforeScroll)
      measurements.push({ row: index + 1, title: await title.boundingBox(), listBefore: beforeScroll, listAfter: afterScroll, documentScroll: await page.evaluate(() => scrollY) })
    }
    await capture('library-row20-1440-17.png')
    await nav('学习记录')
    await page.getByLabel('题库只看收藏', { exact: true }).uncheck()
    await page.getByRole('button', { name: '筛选题库', exact: true }).click()
    await expect(page.locator('.question-row')).toHaveCount(20)
    await expect(page.locator('.question-row').nth(2)).toBeInViewport({ ratio: 1 })
    await capture('records-1440-17.png')
    await nav('知识板块')
    await expect(page.locator('.board-card')).toHaveCount(15)
    await capture('boards-1440-17.png')
    await nav('设置与数据')
    await capture('settings-appearance-1440-17.png')
    await page.getByRole('tab', { name: '备份恢复', exact: true }).click()
    await capture('settings-backup-1440-17.png')
    await nav('开始练习')
    await capture('configuration-1440-17.png')
    await page.getByRole('button', { name: '开始练习', exact: true }).click()
    await page.getByRole('textbox', { name: '我的答案', exact: true }).waitFor()
    await capture('practice-1440-17.png')
    await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(900, 900))
    await capture('practice-900-17.png')
    const database = new DatabaseSync(join(directory, 'practice.sqlite3'), { readOnly: true })
    let schema
    try { schema = database.prepare('PRAGMA user_version').get() } finally { database.close() }
    expect(schema).toEqual({ user_version: 10 })
    await writeFile(join(evidence, 'final-runtime-and-geometry-r5.json'), JSON.stringify({ runtime, schema, theme: 'builtin.ocean', fontSize: 17, window: [1440, 900], sample: '25题独立布局验收，与改前相同内容', measurements }, null, 2))
    console.log(JSON.stringify({ runtime, schema, measurements }))
  } finally {
    await application.evaluate(({ app }) => app.exit(0)).catch(() => {})
    await application.close().catch(() => {})
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
