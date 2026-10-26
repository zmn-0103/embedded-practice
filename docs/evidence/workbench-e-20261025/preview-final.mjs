import { _electron, expect } from '@playwright/test'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { join, resolve, dirname, basename } from 'node:path'
import { tmpdir } from 'node:os'
import { DatabaseSync } from 'node:sqlite'

const output = resolve('docs/evidence/workbench-e-20261025/final-preview-02')
const executable = process.env.EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE
if (!executable) throw new Error('必须明确本轮新EXE')
await mkdir(output)
const data = await mkdtemp(join(tmpdir(), 'embedded-practice-workbench-final-preview-'))
const env = { ...process.env, EMBEDDED_PRACTICE_TEST_DATA_DIR: data }
delete env.ELECTRON_RUN_AS_NODE
delete env.ELECTRON_RENDERER_URL
let application
const record = { build: '20261025.3-workbench-e', data, shots: [], remoteRequests: [] }
try {
  application = await _electron.launch({ executablePath: resolve(executable), args: [], env })
  const page = await application.firstWindow()
  page.on('request', (r) => {
    if (/^https?:/i.test(r.url())) record.remoteRequests.push(r.url())
  })
  const window = await application.browserWindow(page)
  await window.evaluate((w) => w.setContentSize(1440, 1000))
  await expect(page.locator('footer')).toContainText(record.build)
  record.actual = await application.evaluate(({ app }) => ({
    exe: app.getPath('exe'),
    userData: app.getPath('userData'),
    packaged: app.isPackaged,
    version: app.getVersion(),
  }))
  expect(record.actual).toEqual({
    exe: resolve(executable),
    userData: data,
    packaged: true,
    version: '0.0.1',
  })
  const nav = async (name) => {
    const link = page
      .getByRole('navigation', { name: '主要页面', exact: true })
      .getByRole('link', { name, exact: true })
    await expect(link).toHaveAttribute('aria-disabled', 'false')
    await link.click()
    await expect(link).toHaveAttribute('aria-current', 'page')
  }
  const shot = async (name, top = true) => {
    if (top) await page.evaluate(() => scrollTo(0, 0))
    await page.evaluate(
      () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
    )
    const png = await window.evaluate(async (w) =>
      (await w.capturePage()).toPNG().toString('base64'),
    )
    await writeFile(join(output, name + '.png'), Buffer.from(png, 'base64'))
    record.shots.push({
      file: name + '.png',
      viewport: await page.evaluate(() => ({ width: innerWidth, height: innerHeight })),
    })
  }
  await expect(page.getByText('从导入你的题库开始', { exact: true })).toBeVisible()
  await shot('13-空库真实状态')
  await nav('设置与数据')
  await page.getByRole('radio', { name: '晴空蓝', exact: true }).check()
  await page.getByLabel('显示主题', { exact: true }).selectOption('light')
  await page.getByRole('button', { name: '保存并应用', exact: true }).click()
  const manifest = JSON.parse(await readFile('release/V0.0.1-20261025.2/交付题库清单.json', 'utf8'))
  const paths = manifest.files.map((f) => resolve('release/V0.0.1-20261025.2', f.file))
  await application.evaluate(({ dialog }, files) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: files })
  }, paths)
  const importBank = async () => {
    await nav('题库')
    await page.getByRole('button', { name: '导入题库', exact: true }).click()
    await page.getByRole('button', { name: '确认导入', exact: true }).click()
    await expect(page.getByText(/^导入完成：/)).toBeVisible()
  }
  await importBank()
  await page.evaluate(async (files) => {
    const api = window.desktop
    for (const title of new Set(files.map((f) => f.board))) {
      const r = await api.library.updateCategory({ kind: 'create', title })
      if (!r.ok) throw new Error(r.error.message)
    }
    const result = await api.library.listQuestions({ topicId: null, archived: false, page: 1 })
    if (!result.ok) throw new Error(result.error.message)
    for (const f of files) {
      const categoryId = result.value.categories.find((c) => c.title === f.board).categoryId
      const r = await api.library.updateCategory({ kind: 'assign', topicId: f.topicId, categoryId })
      if (!r.ok) throw new Error(r.error.message)
    }
  }, manifest.files)
  await importBank()
  await nav('知识板块')
  await shot('02-知识板块')
  await nav('题库')
  await page.getByLabel('专题', { exact: true }).selectOption('stm32f103-gpio')
  await page.locator('.question-list li button').first().click()
  await expect(page.getByRole('article', { name: '题目内容', exact: true })).toBeVisible()
  await shot('03-题库三栏')
  const management = page.locator('.library-management-tools .category-manager > summary')
  await management.click()
  await shot('09-全宽分类与专题管理')
  await management.click()
  await page.getByRole('button', { name: '导入题库', exact: true }).click()
  await expect(page.getByRole('heading', { name: '导入预览', exact: true })).toBeVisible()
  await shot('08-真实导入预览')
  await page.getByRole('button', { name: '放弃预览', exact: true }).click()
  await nav('设置与数据')
  await shot('10-外观与本地主题')
  await page.getByRole('button', { name: '备份恢复', exact: true }).click()
  await shot('11-备份恢复与数据位置', false)
  await nav('开始练习')
  await page.getByLabel('练习专题', { exact: true }).selectOption('stm32f103-gpio')
  await page.getByLabel('本轮题数', { exact: true }).selectOption('20')
  await page.locator('.practice-plans > summary').click()
  await shot('04-练习配置与方案')
  await page.getByRole('button', { name: '开始练习', exact: true }).click()
  for (const name of ['不会', '不熟', '掌握']) {
    await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
    await page.getByRole('button', { name, exact: true }).click()
  }
  await page
    .getByRole('textbox', { name: '我的答案', exact: true })
    .fill('先说明配置步骤，再核对寄存器与电平。此处为隔离演示作答。')
  await page.getByRole('button', { name: '收藏本题', exact: true }).click()
  await expect(page.getByRole('button', { name: '查看参考答案', exact: true })).toBeEnabled()
  await shot('05-练习未揭晓')
  await page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  await expect(page.getByRole('button', { name: '掌握', exact: true })).toBeEnabled()
  await shot('06-揭晓与自评')
  await page.getByRole('button', { name: '保存并返回', exact: true }).click()
  await nav('学习总览')
  await expect(page.getByLabel('有效题目当前版本统计')).toContainText('419')
  await expect(page.getByRole('button', { name: '继续本轮', exact: true })).toBeVisible()
  await shot('01-学习总览')
  await nav('学习记录')
  await expect(page.getByLabel('当前版本学习总览', { exact: true })).toContainText('419')
  await shot('07-学习记录与收藏')
  await nav('设置与数据')
  await page.getByRole('radio', { name: 'Claude 风格', exact: true }).check()
  await page.getByLabel('显示主题', { exact: true }).selectOption('dark')
  await page.getByRole('button', { name: '保存并应用', exact: true }).click()
  await expect(page.getByText('显示设置已保存。', { exact: true })).toBeVisible()
  await nav('学习总览')
  await window.evaluate((w) => w.setContentSize(900, 900))
  await shot('12-深色窄窗口')
  const db = new DatabaseSync(join(data, 'practice.sqlite3'), { readOnly: true })
  try {
    record.schema = db.prepare('PRAGMA user_version').get().user_version
  } finally {
    db.close()
  }
  expect(record.schema).toBe(10)
  record.scope = '真实生产API、13专题419题、5个演示分类与隔离作答；未访问个人库'
  record.complete = true
} finally {
  await writeFile(join(output, 'runtime.json'), JSON.stringify(record, null, 2) + '\n')
  if (application) await application.close().catch(() => {})
  if (
    resolve(dirname(data)) !== resolve(tmpdir()) ||
    !basename(data).startsWith('embedded-practice-workbench-final-preview-')
  )
    throw new Error('临时目录清理越界')
  await rm(data, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
}
console.log(`完整截图${record.shots.length}张，运行对象已核对。`)
