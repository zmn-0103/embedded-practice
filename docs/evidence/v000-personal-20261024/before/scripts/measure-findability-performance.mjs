import { cp, mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises'
import { cpus, freemem, release, tmpdir, totalmem } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
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

assert(
  process.argv[2] && process.argv[3] && process.argv[4],
  '用法：node scripts/measure-findability-performance.mjs 原5000题样本清单 新证据目录 完整程序EXE',
)
const source = JSON.parse(await readFile(resolve(process.argv[2]), 'utf8'))
const executable = resolve(process.argv[4])
assert.equal(basename(executable), 'embedded-practice.exe')
await stat(join(dirname(executable), 'resources', 'app.asar'))
const markdown = await readFile(source.stress.file)
assert.equal(hash(markdown), source.stress.markdownSha256)
const text = markdown.toString('utf8')
const headings = unified()
  .use(remarkParse)
  .use(remarkFrontmatter, ['yaml'])
  .parse(text)
  .children.filter((node) => node.type === 'heading' && node.depth === 2)
assert.equal(headings.length, 5000)
const root = await mkdtemp(join(tmpdir(), 'embedded-practice-m5b-findability-'))
const samplesDirectory = join(root, '多专题 生成样本')
const dataDirectory = join(root, '独立 数据')
const output = resolve(process.argv[3])
await mkdir(output)
await mkdir(samplesDirectory)
await mkdir(dataDirectory)
const report = {
  startedAt: new Date().toISOString(),
  sourceSamples: resolve(process.argv[2]),
  root,
  dataDirectory,
  executable,
  environment: {
    windows: release(),
    cpu: cpus()[0]?.model,
    memoryBytes: totalmem(),
    freeMemoryBytes: freemem(),
    node: process.version,
  },
  scope: '真实解包程序；文件选择为替身；仅生成样本，非个人学习数据；页面缩放不等于系统DPI',
  events: [],
  errors: [],
}
const run = {
  output,
  dataDirectory,
  executable,
  report,
  async save() {
    await writeFile(join(output, 'result.json'), JSON.stringify(report, null, 2) + '\n')
  },
}
await run.save()
let instance
try {
  await mkdir(join(samplesDirectory, 'assets'))
  for (const image of source.stress.images) {
    assert.equal(basename(image.name), image.name)
    const original = join(dirname(source.stress.file), 'assets', image.name)
    assert.equal(hash(await readFile(original)), image.sha256)
    await cp(original, join(samplesDirectory, 'assets', image.name), {
      errorOnExist: true,
      force: false,
    })
  }
  const files = []
  for (let topic = 0; topic < 10; topic++) {
    let bank = `---\nschema_version: 1\ntopic_id: perf-topic-${String(topic + 1).padStart(2, '0')}\ntopic_title: ${String(topic + 1).padStart(2, '0')} 仅性能验收专题\n---\n\n`
    for (let index = topic * 500; index < (topic + 1) * 500; index++) {
      bank += text.slice(
        headings[index].position.start.offset,
        headings[index + 1]?.position.start.offset ?? text.length,
      )
      if (index === 0)
        bank +=
          '\n\n' +
          Array.from(
            { length: 60 },
            (_, number) => `第 ${number + 1} 段长答案。仅检验滚动和阅读，不作为技术题库。\n\n`,
          ).join('')
    }
    const file = join(samplesDirectory, `专题 ${topic + 1}.md`)
    await writeFile(file, bank, { flag: 'wx' })
    files.push(file)
  }
  report.samples = {
    topics: 10,
    questions: 5000,
    images: source.stress.images.length,
    markdownBytes: (await Promise.all(files.map((file) => stat(file)))).reduce(
      (sum, file) => sum + file.size,
      0,
    ),
    imageBytes: source.stress.imageBytes,
    files: await Promise.all(
      files.map(async (file) => ({ file, sha256: hash(await readFile(file)) })),
    ),
  }
  instance = await launch(run)
  report.display = await instance.application.evaluate(({ BrowserWindow, screen }) => {
    const window = BrowserWindow.getAllWindows()[0]
    return {
      bounds: window.getBounds(),
      display: screen.getDisplayMatching(window.getBounds()),
      zoomFactor: window.webContents.getZoomFactor(),
    }
  })
  await expect(instance.page.locator('footer')).toContainText('20261023.3-findability')
  await openPage(instance.page, '题库')
  await instance.application.evaluate(({ dialog }, paths) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: paths })
  }, files)
  const importingAt = performance.now()
  await instance.page.getByRole('button', { name: '导入题库', exact: true }).click()
  await expect(instance.page.getByRole('button', { name: '确认导入', exact: true })).toBeVisible({
    timeout: 120_000,
  })
  report.prepareMs = performance.now() - importingAt
  const committingAt = performance.now()
  await instance.page.getByRole('button', { name: '确认导入', exact: true }).click()
  await expect(instance.page.getByText(/^导入完成：/)).toBeVisible({ timeout: 120_000 })
  report.commitMs = performance.now() - committingAt
  const imported = await snapshotDatabase(dataDirectory)
  assert.equal(imported.counts.questions, 5000)
  assert.equal(imported.counts.topics, 10)
  assert.equal(imported.counts.image_resources, 500)
  assert.deepEqual(
    imported.images.map((image) => image.hash),
    source.stress.images.map((image) => image.sha256).sort(),
  )
  report.imported = { counts: imported.counts, bytes: imported.bytes }
  await run.save()
  console.log('多专题真实导入完成，准备历史样本。')

  // 通过当前程序中的生产练习服务建立1万条真实记录；夹具生成耗时不计入交互计时。
  report.history = await instance.application.evaluate(async ({ app }, expectedRoot) => {
    const path = process.getBuiltinModule('node:path')
    if (
      path.resolve(app.getPath('userData')) !== path.resolve(expectedRoot) ||
      !path.basename(path.dirname(expectedRoot)).startsWith('embedded-practice-m5b-findability-')
    )
      throw new Error('拒绝访问非本轮临时目录。')
    const require = process
      .getBuiltinModule('node:module')
      .createRequire(path.join(app.getAppPath(), 'performance-fixture.cjs'))
    const { openPracticeService } = require(path.join(app.getAppPath(), 'out/main/practice.js'))
    const failures = []
    const service = await openPracticeService(
      path.join(expectedRoot, 'practice.sqlite3'),
      (error) => failures.push(String(error)),
    )
    const id = () => process.getBuiltinModule('node:crypto').randomUUID()
    const value = (result) => {
      if (!result.ok) throw new Error(result.error.code)
      return result.value
    }
    const cursor = (ack) => ({
      sessionId: ack.sessionId,
      position: ack.position,
      revision: ack.revision,
    })
    let records = 0
    try {
      for (let round = 0; round < 20; round++) {
        let ack = value(
          service.start({
            requestId: id(),
            topicId: 'perf-topic-01',
            count: 'all',
            replace: null,
            mode: 'sequential',
          }),
        )
        while (ack.status === 'active') {
          const draft = { revision: 1, text: `GENERATED-HISTORY-${round}-${ack.position}` }
          ack = value(service.reveal({ requestId: id(), cursor: cursor(ack), draft }))
          ack = value(
            service.rateAndAdvance({
              requestId: id(),
              cursor: cursor(ack),
              draft,
              rating: ['不会', '不熟', '掌握'][records % 3],
            }),
          )
          records++
        }
      }
      return {
        rounds: 20,
        records,
        topicId: 'perf-topic-01',
        generatedViaProductionService: true,
        failures,
      }
    } finally {
      service.close()
    }
  }, dataDirectory)
  assert.equal(report.history.records, 10000)
  assert.deepEqual(report.history.failures, [])
  const historySnapshot = await snapshotDatabase(dataDirectory)
  assert.equal(historySnapshot.counts.practice_items, 10000)
  report.history.databaseBytes = historySnapshot.bytes
  await run.save()
  console.log('1万条历史已建立，开始搜索与连续切题计时。')
  const cases = [
    { query: 'GPIO', total: 1250, firstId: 'perf-00001' },
    { query: 'UART', total: 1250, firstId: 'perf-00002' },
    { query: 'SPI', total: 1250, firstId: 'perf-00003' },
    { query: 'I2C', total: 1250, firstId: 'perf-00004' },
    { query: '00499', total: 1, firstId: 'perf-00499' },
    { query: '生成题', total: 5000, firstId: 'perf-00001' },
    { query: '无匹配性能关键字', total: 0, firstId: null },
    { query: '压力样本', total: 5000, firstId: 'perf-00001' },
    { query: '05000', total: 1, firstId: 'perf-05000' },
    { query: '00001', total: 1, firstId: 'perf-00001' },
  ]
  report.search = []
  for (let round = 0; round < 3; round++) {
    for (const query of cases) {
      await instance.page
        .getByRole('searchbox', { name: '题库搜索', exact: true })
        .fill(query.query)
      report.search.push(
        await measureAction(
          instance.page,
          instance.page.getByRole('button', { name: '筛选题库', exact: true }),
          { kind: 'search', ...query },
        ),
      )
    }
    await run.save()
  }
  const memory = async (position) => ({
    position,
    metrics: await instance.application.evaluate(({ app }) =>
      app.getAppMetrics().map(({ pid, type, memory }) => ({ pid, type, memory })),
    ),
    rendererHeap: await instance.page.evaluate(() =>
      performance.memory
        ? { used: performance.memory.usedJSHeapSize, total: performance.memory.totalJSHeapSize }
        : null,
    ),
  })
  await openPage(instance.page, '开始练习')
  await instance.page.getByLabel('本轮题数', { exact: true }).selectOption('all')
  await instance.page.getByRole('button', { name: '开始练习', exact: true }).click()
  await expect(instance.page.getByLabel('练习进度')).toContainText('第 1 / 5000')
  report.memory = [await memory(1)]
  report.switches = []
  for (let number = 2; number <= 121; number++) {
    report.switches.push(
      await measureAction(
        instance.page,
        instance.page.getByRole('button', { name: '跳过本题', exact: true }),
        { kind: 'switch', number: String(number).padStart(5, '0') },
      ),
    )
    if ((number - 1) % 30 === 0) {
      report.memory.push(await memory(number))
      await run.save()
      console.log(`连续切题已测 ${number - 1} / 120 次。`)
    }
  }
  await instance.page.getByRole('button', { name: '返回首页', exact: true }).click()
  await instance.page.getByText('筛选练习题目', { exact: true }).click()
  await instance.page.getByRole('searchbox', { name: '练习搜索', exact: true }).fill('00001')
  await expect(instance.page.getByText('匹配 1 题', { exact: true })).toBeVisible()
  await instance.page.getByRole('button', { name: '结束本轮并开始新练习', exact: true }).click()
  await instance.page.getByRole('button', { name: '查看参考答案', exact: true }).click()
  await expect(instance.page.getByRole('region', { name: '练习参考答案' })).toContainText(
    '第 60 段长答案',
  )
  report.scrolling = []
  for (const zoom of [1, 1.25, 1.5]) {
    await instance.application.evaluate(
      ({ BrowserWindow }, factor) =>
        BrowserWindow.getAllWindows()[0].webContents.setZoomFactor(factor),
      zoom,
    )
    const result = await instance.page.evaluate(async () => {
      await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
      const gaps = []
      let last = performance.now()
      const limit = Math.max(0, document.documentElement.scrollHeight - innerHeight)
      for (let frame = 0; frame < 120; frame++) {
        scrollTo(0, limit * (frame < 60 ? frame / 59 : (119 - frame) / 59))
        await new Promise(requestAnimationFrame)
        const now = performance.now()
        gaps.push(now - last)
        last = now
      }
      return {
        gaps,
        limit,
        dpr: devicePixelRatio,
        viewport: { width: innerWidth, height: innerHeight },
        reachedTop: scrollY === 0,
      }
    })
    report.scrolling.push({ zoom, ...result, frameIntervalsMs: summarize(result.gaps) })
    await instance.page.screenshot({
      path: join(output, `long-answer-zoom-${zoom}.png`),
      fullPage: false,
    })
  }
  await instance.application.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].webContents.setZoomFactor(1),
  )
  await close(instance)
  instance = undefined
  report.startups = []
  for (let number = 0; number < 5; number++) {
    instance = await launch(run)
    await expect(instance.page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
    report.startups.push(instance.startupMs)
    await close(instance)
    instance = undefined
  }
  const final = await snapshotDatabase(dataDirectory)
  assert.equal(final.counts.questions, 5000)
  assert.equal(final.counts.image_resources, 500)
  assert.equal(final.integrity[0].integrity_check, 'ok')
  assert.deepEqual(final.foreignKeys, [])
  const database = new DatabaseSync(join(dataDirectory, 'practice.sqlite3'), { readOnly: true })
  try {
    report.finalSchema = database.prepare('PRAGMA user_version').get().user_version
  } finally {
    database.close()
  }
  assert.equal(report.finalSchema, 7)
  report.final = {
    counts: final.counts,
    bytes: final.bytes,
    integrity: final.integrity,
    foreignKeys: final.foreignKeys,
  }
  report.statistics = {
    searchMs: summarize(report.search.map((sample) => sample.paintMs)),
    switchPaintMs: summarize(report.switches.map((sample) => sample.paintMs)),
    switchEnabledMs: summarize(report.switches.map((sample) => sample.actionEnabledAfterMs)),
    startupMs: summarize(report.startups),
  }
  report.targets = {
    searchUnder500ms: report.statistics.searchMs.max < 500,
    switchUnder200ms: report.statistics.switchPaintMs.max < 200,
    startupUnder3000ms: report.statistics.startupMs.max < 3000,
  }
  assert(Object.values(report.targets).every(Boolean), '存在未达到计划目标的计时。')
  report.completed = true
} catch (error) {
  report.errors.push({ message: String(error), stack: error.stack })
  process.exitCode = 1
  if (instance)
    await instance.page.screenshot({ path: join(output, 'failure.png') }).catch(() => {})
} finally {
  if (instance)
    await close(instance).catch((error) =>
      report.errors.push({ phase: 'close', message: String(error) }),
    )
  report.finishedAt = new Date().toISOString()
  if (report.errors.length > 0) {
    report.completed = false
    process.exitCode = 1
  }
  await run.save()
  console.log(
    JSON.stringify(
      {
        completed: report.completed ?? false,
        output,
        statistics: report.statistics,
        targets: report.targets,
        errors: report.errors,
      },
      null,
      2,
    ),
  )
}
