import { createHash } from 'node:crypto'
import { copyFile, cp, readFile, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { expect, launchApplication, readAppStatus, test } from './helpers'
import { exerciseImportWorker } from './import-worker-exercise'

type WorkerReport = Awaited<ReturnType<typeof exerciseImportWorker>> & Record<string, unknown>

async function prepareSources(directory: string): Promise<string[]> {
  const sources = join(directory, 'sources')
  await cp(resolve('question-banks/examples'), sources, { recursive: true })
  await copyFile(
    resolve('question-banks/STM32F103RCT6-GPIO阶段自测题.md'),
    join(sources, 'GPIO.md'),
  )
  return [join(sources, 'GPIO.md'), join(sources, '格式示例.md')]
}

function expectStopped(
  report: {
    createdThreadIds: number[]
    exitedThreadIds: number[]
    mainThreadId: number
    errors: string[]
  },
  count: number,
): void {
  expect(report.mainThreadId).toBe(0)
  expect(report.createdThreadIds).toHaveLength(count)
  expect(new Set(report.createdThreadIds).size).toBe(count)
  expect(report.createdThreadIds.every((id) => id > 0)).toBe(true)
  expect([...report.exitedThreadIds].sort((a, b) => a - b)).toEqual(
    [...report.createdThreadIds].sort((a, b) => a - b),
  )
  expect(report.errors).toEqual([])
}

test('真实线程准备题库与三种图片，停止后来源可移动', async ({ testDataDirectory }, testInfo) => {
  const filePaths = await prepareSources(testDataDirectory)
  const expectedResources = await Promise.all(
    [
      { name: 'small.png', format: 'png', byteLength: 80 },
      { name: 'small.jpg', format: 'jpeg', byteLength: 661 },
      { name: 'small.webp', format: 'webp', byteLength: 48 },
    ].map(async ({ name, ...image }) => {
      const hash = createHash('sha256')
        .update(await readFile(resolve('tests/fixtures/images', name)))
        .digest('hex')
      return { ...image, hash, actualHash: hash, width: 2, height: 3, isUint8Array: true }
    }),
  )
  const { application, page } = await launchApplication(testDataDirectory, testInfo.project.name)
  try {
    const report: WorkerReport = await application.evaluate(exerciseImportWorker, {
      mode: 'snapshot' as const,
      directory: testDataDirectory,
      filePaths,
    })
    await testInfo.attach('worker-snapshot.json', {
      body: JSON.stringify(report, null, 2),
      contentType: 'application/json',
    })
    expect(report).toMatchObject({ questionCount: 80, topicCount: 2 })
    expect(report['resources']).toHaveLength(3)
    expect(report['resources']).toEqual(expect.arrayContaining(expectedResources))
    // 只证明主循环继续执行；不把计数或本例耗时作为性能指标。
    expect(report['mainThreadPulses']).toBeGreaterThan(0)
    expectStopped(report, 1)
    expect((await stat(join(testDataDirectory, 'sources-moved'))).isDirectory()).toBe(true)
    await expect(stat(join(testDataDirectory, 'sources'))).rejects.toMatchObject({
      code: 'ENOENT',
    })
    expect(await readAppStatus(page)).toMatchObject({ ok: true, value: { launchCount: 1 } })
  } finally {
    await application.close()
  }
})

test('真实线程支持忙碌、失败后重试、取消与期限', async ({ testDataDirectory }, testInfo) => {
  const filePaths = await prepareSources(testDataDirectory)
  const { application } = await launchApplication(testDataDirectory, testInfo.project.name)
  try {
    const report: WorkerReport = await application.evaluate(exerciseImportWorker, {
      mode: 'controls' as const,
      directory: testDataDirectory,
      filePaths,
    })
    await testInfo.attach('worker-controls.json', {
      body: JSON.stringify(report, null, 2),
      contentType: 'application/json',
    })
    expect(report).toMatchObject({
      busy: 'IMPORT_BUSY',
      missing: 'FILE_UNREADABLE',
      recoveredQuestions: 80,
      cancelled: 'WORKER_CANCELLED',
      timedOut: 'WORKER_TIMEOUT',
    })
    expectStopped(report, 4)
  } finally {
    await application.close()
  }
})

test('关闭服务等待真实线程停止并拒绝新任务', async ({ testDataDirectory }, testInfo) => {
  const filePaths = await prepareSources(testDataDirectory)
  const { application } = await launchApplication(testDataDirectory, testInfo.project.name)
  try {
    const report: WorkerReport = await application.evaluate(exerciseImportWorker, {
      mode: 'shutdown' as const,
      directory: testDataDirectory,
      filePaths,
    })
    await testInfo.attach('worker-shutdown.json', {
      body: JSON.stringify(report, null, 2),
      contentType: 'application/json',
    })
    expect(report).toMatchObject({ cancelled: 'WORKER_CANCELLED', afterClose: 'WORKER_CANCELLED' })
    expectStopped(report, 1)
  } finally {
    await application.close()
  }
})
