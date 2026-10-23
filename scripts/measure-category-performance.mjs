import { cp, mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises'
import { cpus, release, tmpdir, totalmem } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import {
  assert,
  close,
  expect,
  hash,
  launch,
  measureAction,
  openPage,
  snapshotDatabase,
  summarize,
} from './m5-desktop-harness.mjs'

assert(process.argv[2] && process.argv[3], '用法：新证据目录 完整程序EXE')
const output = resolve(process.argv[2])
const executable = resolve(process.argv[3])
assert.equal(basename(executable), 'embedded-practice.exe')
await stat(join(dirname(executable), 'resources/app.asar'))
await mkdir(output)
const source = JSON.parse(
  await readFile('docs/evidence/findability-20261023/performance-01/result.json', 'utf8'),
)
assert.equal(source.completed, true)
assert.equal(source.samples.questions, 5000)
const root = await mkdtemp(join(tmpdir(), 'embedded-practice-m5b-categories-'))
const dataDirectory = join(root, '独立 数据')
await mkdir(dataDirectory)
const samples = join(root, '仅生成样本')
await mkdir(samples)
const files = []
for (const original of source.samples.files) {
  assert.equal(hash(await readFile(original.file)), original.sha256)
  const target = join(samples, basename(original.file))
  await cp(original.file, target, { force: false, errorOnExist: true })
  files.push(target)
}
await cp(join(dirname(source.samples.files[0].file), 'assets'), join(samples, 'assets'), {
  recursive: true,
  force: false,
  errorOnExist: true,
})
const report = {
  startedAt: new Date().toISOString(),
  executable,
  dataDirectory,
  samples: { ...source.samples, files },
  environment: { windows: release(), cpu: cpus()[0]?.model, memoryBytes: totalmem() },
  scope: '新解包程序；显式临时库；仅5000生成题/500小图、无学习历史；选择文件为替身。',
  events: [],
  errors: [],
}
const run = {
  executable,
  dataDirectory,
  output,
  report,
  save: () => writeFile(join(output, 'result.json'), JSON.stringify(report, null, 2) + '\n'),
}
await run.save()
let instance
try {
  instance = await launch(run)
  await expect(instance.page.locator('footer')).toContainText('20261023.4-categories')
  await openPage(instance.page, '题库')
  await instance.application.evaluate(({ dialog }, paths) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: paths })
  }, files)
  await instance.page.getByRole('button', { name: '导入题库', exact: true }).click()
  await expect(instance.page.getByRole('button', { name: '确认导入', exact: true })).toBeVisible({
    timeout: 120_000,
  })
  await instance.page.getByRole('button', { name: '确认导入', exact: true }).click()
  await expect(instance.page.getByText(/^导入完成：/)).toBeVisible({ timeout: 120_000 })
  report.imported = await snapshotDatabase(dataDirectory)
  assert.equal(report.imported.counts.questions, 5000)
  assert.equal(report.imported.counts.image_resources, 500)
  assert.deepEqual(report.imported.foreignKeys, [])
  // 通过生产白名单命令建立测试分类，保持原生成题、图片与导入格式。
  report.navigation = await instance.page.evaluate(async () => {
    const value = (result) => {
      if (!result.ok) throw new Error(result.error.code)
      return result.value
    }
    const api = globalThis.desktop.library
    for (const title of ['性能板块 A', '性能板块 B'])
      value(await api.updateCategory({ kind: 'create', title }))
    const navigation = value(await api.listQuestions({ topicId: null, archived: false, page: 1 }))
    for (const [index, topic] of navigation.topics.entries())
      value(
        await api.updateCategory({
          kind: 'assign',
          topicId: topic.topicId,
          categoryId: navigation.categories[index < 5 ? 0 : 1].categoryId,
        }),
      )
    return value(await api.listQuestions({ topicId: null, archived: false, page: 1 }))
  })
  assert.equal(report.navigation.total, 5000)
  assert.equal(report.navigation.categories.length, 2)
  assert.equal(report.navigation.topics.length, 10)
  await instance.page.reload()
  await openPage(instance.page, '题库')
  const navigation = instance.page.getByRole('navigation', { name: '题库分类导航', exact: true })
  report.transitions = []
  for (let index = 0; index < 30; index++) {
    const kind = index % 3
    const title = kind === 2 ? '全部分类（5000题）' : `题库分类：性能板块 ${kind ? 'B' : 'A'}`
    report.transitions.push(
      await measureAction(
        instance.page,
        navigation.getByRole('button', { name: title, exact: true }),
        {
          kind: 'search',
          total: kind === 2 ? 5000 : 2500,
          firstId: kind === 1 ? 'perf-02501' : 'perf-00001',
        },
      ),
    )
  }
  report.switchPaintMs = summarize(report.transitions.map((item) => item.paintMs))
  const manager = instance.page.locator('.category-manager')
  await manager.locator('summary').click()
  report.screens = []
  for (const width of [1440, 900]) {
    await instance.application.evaluate(({ BrowserWindow }, width) => {
      BrowserWindow.getAllWindows()[0].setSize(width, 900)
    }, width)
    await navigation.getByLabel('题库专题检索', { exact: true }).fill('性能')
    await expect(
      navigation.getByRole('button', { name: '题库专题：01 仅性能验收专题' }),
    ).toBeVisible()
    const state = await instance.page.evaluate(async () => {
      await document.fonts.ready
      await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
      return { viewport: innerWidth, content: document.documentElement.scrollWidth }
    })
    assert(state.content <= state.viewport, '分类页面出现横向溢出')
    const image = await instance.application.evaluate(async ({ BrowserWindow }) =>
      (await BrowserWindow.getAllWindows()[0].webContents.capturePage()).toPNG().toString('base64'),
    )
    await writeFile(join(output, `category-${width}.png`), Buffer.from(image, 'base64'))
    report.screens.push({ width, ...state })
  }
  await close(instance)
  instance = undefined
  report.completed = true
} catch (error) {
  report.errors.push({ phase: 'measurement', message: String(error), stack: error?.stack })
  if (instance)
    await instance.page.screenshot({ path: join(output, 'failure.png') }).catch(() => {})
  process.exitCode = 1
} finally {
  if (instance)
    await close(instance).catch((error) => {
      report.errors.push({ phase: 'close', message: String(error) })
      process.exitCode = 1
    })
  report.finishedAt = new Date().toISOString()
  await run.save()
}
