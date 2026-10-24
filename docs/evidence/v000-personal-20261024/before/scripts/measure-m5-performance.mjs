import { readFile, stat } from 'node:fs/promises'
import {
  assert,
  close,
  createRun,
  expect,
  hash,
  importBank,
  join,
  launch,
  measureAction,
  openPage,
  snapshotDatabase,
  summarize,
} from './m5-desktop-harness.mjs'

assert(
  process.argv[2] && process.argv[3],
  '用法：node scripts/measure-m5-performance.mjs 样本清单.json 新证据目录',
)
const run = await createRun(process.argv[2], process.argv[3], 'performance')
let instance
try {
  instance = await launch(run)
  run.report.emptyStartupMs = instance.startupMs
  const requests = new Set()
  instance.page.on('request', (request) => {
    if (request.url().startsWith('practice-image:')) requests.add(request.url())
  })
  const imported = await importBank(
    instance,
    run.samples.stress.file,
    run,
    '5000题与500张图真实导入',
  )
  assert.deepEqual(imported.counts, ['5000', '0', '0', '0', '0', '0'])
  const snapshot = await snapshotDatabase(run.dataDirectory)
  assert.equal(snapshot.counts.questions, 5000)
  assert.equal(snapshot.counts.question_versions, 5000)
  assert.equal(snapshot.counts.image_resources, 500)
  assert.equal(snapshot.integrity[0].integrity_check, 'ok')
  assert.deepEqual(snapshot.foreignKeys, [])
  const expectedImages = run.samples.stress.images.map((image) => image.sha256).sort()
  assert.deepEqual(
    snapshot.images.map((image) => image.hash),
    expectedImages,
  )
  const sourceImageBytes = run.samples.stress.imageBytes
  run.report.data = {
    counts: snapshot.counts,
    markdownBytes: run.samples.stress.markdownBytes,
    sourceImageBytes,
    sourceTotalBytes: run.samples.stress.markdownBytes + sourceImageBytes,
    imageHashesMatchSource: true,
  }
  run.report.lazyContent = {
    listItems: await instance.page.locator('.question-list li').count(),
    mountedImagesBeforeSelection: await instance.page.locator('.question-reader img').count(),
    answerMountedInList: (await instance.page.content()).includes('PERF-ANSWER-'),
  }
  assert.equal(run.report.lazyContent.listItems, 20)
  assert.equal(run.report.lazyContent.mountedImagesBeforeSelection, 0)
  assert.equal(run.report.lazyContent.answerMountedInList, false)
  await instance.page.screenshot({
    path: join(run.output, '5000-question-library.png'),
    fullPage: true,
  })

  // 相邻查询的结果总数或首项必须不同，测量 helper 会拒绝旧结果提前满足。
  const cases = [
    { query: 'GPIO', total: 1250, firstId: 'perf-00001' },
    { query: 'UART', total: 1250, firstId: 'perf-00002' },
    { query: 'SPI', total: 1250, firstId: 'perf-00003' },
    { query: 'I2C', total: 1250, firstId: 'perf-00004' },
    { query: '00499', total: 1, firstId: 'perf-00499' },
    { query: '生成题', total: 5000, firstId: 'perf-00001' },
    { query: '不存在的性能样本关键字', total: 0, firstId: null },
    { query: '压力样本', total: 5000, firstId: 'perf-00001' },
    { query: '05000', total: 1, firstId: 'perf-05000' },
    { query: '00001', total: 1, firstId: 'perf-00001' },
  ]
  run.report.search = []
  for (let round = 0; round < 3; round++) {
    for (const query of cases) {
      await instance.page
        .getByRole('searchbox', { name: '题库搜索', exact: true })
        .fill(query.query)
      const result = await measureAction(
        instance.page,
        instance.page.getByRole('button', { name: '筛选题库', exact: true }),
        { kind: 'search', ...query },
      )
      run.report.search.push({ round: round + 1, ...result })
    }
    await run.save()
  }
  await openPage(instance.page, '开始练习')
  await instance.page.getByLabel('本轮题数', { exact: true }).selectOption('50')
  await instance.page.getByRole('button', { name: '开始练习', exact: true }).click()
  await expect(instance.page.getByLabel('练习进度', { exact: true })).toContainText('第 1 / 50')
  run.report.switches = []
  for (let number = 2; number <= 31; number++) {
    const result = await measureAction(
      instance.page,
      instance.page.getByRole('button', { name: '跳过本题', exact: true }),
      { kind: 'switch', number: String(number).padStart(5, '0') },
    )
    run.report.switches.push(result)
  }
  run.report.imageRequests = [...requests]
  await instance.page.screenshot({
    path: join(run.output, 'practice-after-30-switches.png'),
    fullPage: true,
  })
  await close(instance)
  instance = undefined
  await run.save()

  run.report.normalStartup = []
  for (let count = 1; count <= 5; count++) {
    instance = await launch(run)
    await expect(instance.page.getByRole('button', { name: '继续练习', exact: true })).toBeEnabled()
    run.report.normalStartup.push({ launch: count, milliseconds: instance.startupMs })
    await close(instance)
    instance = undefined
    await run.save()
  }
  const final = await snapshotDatabase(run.dataDirectory)
  assert.equal(final.counts.questions, 5000)
  assert.equal(final.counts.image_resources, 500)
  assert.equal(final.integrity[0].integrity_check, 'ok')
  assert.deepEqual(final.foreignKeys, [])
  run.report.finalDatabaseBytes = final.bytes
  run.report.finalDataFiles = []
  for (const name of ['practice.sqlite3', 'practice.sqlite3-wal', 'practice.sqlite3-shm']) {
    try {
      run.report.finalDataFiles.push({
        name,
        bytes: (await stat(join(run.dataDirectory, name))).size,
      })
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }
  run.report.statistics = {
    searchPaintMs: summarize(run.report.search.map((sample) => sample.paintMs)),
    switchPaintMs: summarize(run.report.switches.map((sample) => sample.paintMs)),
    switchActionReadyMs: summarize(
      run.report.switches.map((sample) => sample.actionEnabledAfterMs),
    ),
    normalStartupMs: summarize(run.report.normalStartup.map((sample) => sample.milliseconds)),
  }
  run.report.targets = {
    searchUnder500ms: run.report.search.every((sample) => sample.paintMs < 500),
    contentSwitchUnder200ms: run.report.switches.every((sample) => sample.paintMs < 200),
    normalStartupUnder3000ms: run.report.normalStartup.every(
      (sample) => sample.milliseconds < 3000,
    ),
    preparingFeedbackObserved: imported.preparing.messages.some((message) =>
      message.includes('正在选择并检查'),
    ),
    committingFeedbackObserved: imported.committing.messages.some((message) =>
      message.includes('正在保存整批题库'),
    ),
  }
  run.report.measurementBoundary =
    'Windows x64 unpacked executable; process launch call to UI ready includes Playwright debugging connection and two frames; repeated startups with existing OS cache, not forced cold starts. Search/switch from actual click to correct DOM and images plus two frames. Existing 500ms repeated-action guard measured separately. Import elapsed includes automation waits; 20ms renderer heartbeat does not certify all native window operations.'
  run.report.completed = true
} catch (error) {
  run.report.errors.push({ phase: 'run', message: error.stack ?? String(error) })
  if (instance)
    await instance.page
      .screenshot({ path: join(run.output, 'failure.png'), fullPage: true })
      .catch(() => {})
  process.exitCode = 1
} finally {
  if (instance)
    await close(instance).catch((error) =>
      run.report.errors.push({ phase: 'cleanup', message: String(error) }),
    )
  run.report.finishedAt = new Date().toISOString()
  run.report.inputManifestSha256 = hash(await readFile(process.argv[2]))
  if (run.report.errors.length > 0) {
    run.report.completed = false
    process.exitCode = 1
  }
  await run.save()
  console.log(
    JSON.stringify(
      {
        output: run.output,
        completed: run.report.completed ?? false,
        statistics: run.report.statistics,
        targets: run.report.targets,
        errors: run.report.errors,
      },
      null,
      2,
    ),
  )
}
