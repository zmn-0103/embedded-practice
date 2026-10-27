import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises'
import { tmpdir, cpus, totalmem, freemem, release } from 'node:os'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { _electron, expect } from '@playwright/test'

export { assert, expect, join }
export const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
export async function createRun(samplesFile, outputDirectory, label) {
  const samples = JSON.parse(await readFile(resolve(samplesFile), 'utf8'))
  const root = resolve(samples.root)
  assert.equal(relative(resolve(tmpdir()), dirname(root)), '')
  assert(basename(root).startsWith('embedded-practice-m5b-'))
  await mkdir(resolve(outputDirectory))
  const run = await mkdtemp(join(root, `${label}-`))
  const dataDirectory = join(run, '中文 数据')
  await mkdir(dataDirectory)
  const report = {
    label,
    startedAt: new Date().toISOString(),
    samplesFile: resolve(samplesFile),
    dataDirectory,
    environment: {
      windows: release(),
      cpu: cpus()[0]?.model,
      memoryBytes: totalmem(),
      freeMemoryBytes: freemem(),
      node: process.version,
    },
    dialogSelection:
      'explicit test replacement; worker, SQLite, renderer and executable remain real',
    events: [],
    errors: [],
  }
  const output = resolve(outputDirectory)
  async function save() {
    await writeFile(join(output, 'result.json'), JSON.stringify(report, null, 2) + '\n')
  }
  await save()
  return { samples, dataDirectory, report, output, save }
}

export async function launch(run) {
  const executable = resolve(
    run.executable ??
      process.env.EMBEDDED_PRACTICE_PACKAGED_EXECUTABLE ??
      'release/win-unpacked/embedded-practice.exe',
  )
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([, value]) => value !== undefined),
  )
  delete env.ELECTRON_RUN_AS_NODE
  delete env.ELECTRON_RENDERER_URL
  delete env.Path
  delete env.PATH
  assert(process.env.SystemRoot, '缺少 Windows SystemRoot')
  env.PATH = join(process.env.SystemRoot, 'System32')
  env.EMBEDDED_PRACTICE_TEST_DATA_DIR = run.dataDirectory
  const start = performance.now()
  const application = await _electron.launch({
    executablePath: executable,
    args: [],
    env,
    timeout: 30_000,
  })
  let page
  try {
    page = await application.firstWindow()
    page.setDefaultTimeout(20_000)
    await expect(page.locator('.service-status')).toHaveText('本地数据已就绪')
    await expect(page.getByLabel('练习专题', { exact: true })).toBeEnabled()
    await expect(page.getByRole('link', { name: '题库', exact: true })).toHaveAttribute(
      'aria-disabled',
      'false',
    )
    await page.evaluate(
      () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
    )
    const startupMs = performance.now() - start
    const actual = await application.evaluate(({ app, BrowserWindow }) => {
      const window = BrowserWindow.getAllWindows()[0]
      window.show()
      window.focus()
      return {
        userData: app.getPath('userData'),
        packaged: app.isPackaged,
        versions: process.versions,
        size: window.getSize(),
      }
    })
    assert.equal(relative(resolve(actual.userData), resolve(run.dataDirectory)), '')
    assert.equal(actual.packaged, true)
    page.on('pageerror', (error) =>
      run.report.errors.push({ phase: 'renderer', message: String(error) }),
    )
    run.report.runtime ??= { executable, sha256: hash(await readFile(executable)), ...actual }
    return { application, page, startupMs }
  } catch (error) {
    run.report.errors.push({ phase: 'launch', message: String(error) })
    if (page)
      await page.screenshot({ path: join(run.output, 'launch-failure.png') }).catch(() => {})
    await application
      .close()
      .catch((closeError) =>
        run.report.errors.push({ phase: 'launch cleanup', message: String(closeError) }),
      )
    throw error
  }
}

export async function close(instance) {
  await instance.application.close()
}

export async function openPage(page, name) {
  const link = page
    .getByRole('navigation', { name: '主要页面', exact: true })
    .getByRole('link', { name, exact: true })
  await expect(link).toHaveAttribute('aria-disabled', 'false')
  await link.click()
  await expect(link).toHaveAttribute('aria-current', 'page')
}

async function activity(page, work) {
  await page.evaluate(() => {
    const state = { start: performance.now(), last: performance.now(), gaps: [], messages: [] }
    globalThis.__m5Activity = state
    state.timer = setInterval(() => {
      const now = performance.now()
      state.gaps.push(now - state.last)
      state.last = now
      for (const element of document.querySelectorAll('[aria-live]')) {
        const text = element.textContent.trim()
        if (text && !state.messages.includes(text)) state.messages.push(text)
      }
    }, 20)
  })
  try {
    await work()
  } finally {
    // 失败仍停止探针，防止后续阶段复用旧定时器。
    await page.evaluate(() => clearInterval(globalThis.__m5Activity.timer)).catch(() => {})
  }
  return page.evaluate(() => {
    const state = globalThis.__m5Activity
    state.gaps.push(performance.now() - state.last)
    return {
      elapsedMs: performance.now() - state.start,
      timerTicks: state.gaps.length - 1,
      maxTimerGapMs: Math.max(...state.gaps),
      messages: state.messages,
    }
  })
}

export async function importBank(instance, file, run, label) {
  await openPage(instance.page, '题库')
  await instance.application.evaluate(({ dialog }, path) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
  }, file)
  const preparing = await activity(instance.page, async () => {
    await instance.page.getByRole('button', { name: '导入题库', exact: true }).click()
    await instance.page
      .getByRole('heading', { name: '导入预览', exact: true })
      .waitFor({ timeout: 120_000 })
  })
  const counts = await instance.page.locator('.count-grid dd').allTextContents()
  const committing = await activity(instance.page, async () => {
    await instance.page.getByRole('button', { name: '确认导入', exact: true }).click()
    await expect(instance.page.getByText(/^导入完成：/)).toBeVisible({ timeout: 120_000 })
  })
  const value = { label, file, preparing, committing, counts }
  run.report.events.push(value)
  await run.save()
  return value
}

// 起点是实际 click 事件，终点是目标 DOM/图片就绪后的两帧；不计定位与防连击等待。
export async function measureAction(page, button, target) {
  await expect(button).toBeEnabled()
  await button.evaluate((element, expected) => {
    if (expected.kind === 'search') {
      const workspace = document.querySelector('[aria-label="题库浏览"]')
      const first = workspace?.querySelector('.question-list li button small')?.textContent ?? ''
      const sameResult =
        workspace?.textContent.includes(`共 ${expected.total} 题`) &&
        (expected.firstId
          ? first.includes(expected.firstId)
          : !workspace?.querySelector('.question-list li'))
      if (sameResult)
        throw new Error('搜索测量要求与上一结果的总数或首项不同，避免旧结果提前满足。')
    }
    const state = { done: false, error: null, start: null, paintMs: null, enabledAfterMs: null }
    globalThis.__m5Transition = state
    const timeout = setTimeout(() => {
      state.error = '目标页面未在20秒内就绪'
      state.done = true
    }, 20_000)
    element.addEventListener(
      'click',
      () => {
        state.start = performance.now()
        function ready() {
          if (expected.kind === 'search') {
            const workspace = document.querySelector('[aria-label="题库浏览"]')
            const first =
              workspace?.querySelector('.question-list li button small')?.textContent ?? ''
            return (
              !element.disabled &&
              workspace?.textContent.includes(`共 ${expected.total} 题`) &&
              (expected.firstId
                ? first.includes(expected.firstId)
                : !workspace?.querySelector('.question-list li'))
            )
          }
          const heading = document.querySelector('.practice-heading h2')?.textContent ?? ''
          const images = [...document.querySelectorAll('.practice-reading img')]
          return (
            heading.includes(expected.number) &&
            images.every((image) => image.complete && image.naturalWidth > 0)
          )
        }
        function check() {
          if (state.done) return
          if (state.paintMs === null && ready()) {
            state.paintMs = -1
            requestAnimationFrame(() =>
              requestAnimationFrame(() => {
                state.paintMs = performance.now() - state.start
              }),
            )
          }
          const next = [...document.querySelectorAll('.practice-actions button')].find(
            (candidate) => candidate.textContent.trim() === '跳过本题',
          )
          const enabled = expected.kind === 'search' || (next && !next.disabled)
          if (state.paintMs > 0 && enabled) {
            state.enabledAfterMs = performance.now() - state.start
            state.done = true
            clearTimeout(timeout)
          } else requestAnimationFrame(check)
        }
        requestAnimationFrame(check)
      },
      { once: true, capture: true },
    )
  }, target)
  await button.click()
  await page.waitForFunction(() => globalThis.__m5Transition.done, null, { timeout: 25_000 })
  const value = await page.evaluate(() => globalThis.__m5Transition)
  assert.equal(value.error, null)
  return { ...target, paintMs: value.paintMs, actionEnabledAfterMs: value.enabledAfterMs }
}

export function summarize(samples) {
  assert(samples.length > 0 && samples.every((value) => Number.isFinite(value) && value >= 0))
  const sorted = samples.toSorted((a, b) => a - b)
  return {
    count: sorted.length,
    min: sorted[0],
    median:
      (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.floor(sorted.length / 2)]) / 2,
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
    max: sorted.at(-1),
  }
}

export async function snapshotDatabase(directory) {
  const local = relative(resolve(tmpdir()), resolve(directory))
  assert(local.split(sep)[0].startsWith('embedded-practice-m5b-'), '拒绝读取本批临时根以外的数据库')
  const dbPath = join(directory, 'practice.sqlite3')
  const db = new DatabaseSync(dbPath, { readOnly: true })
  try {
    db.exec('BEGIN')
    const counts = Object.fromEntries(
      [
        'topics',
        'questions',
        'question_versions',
        'image_resources',
        'practice_sessions',
        'practice_items',
      ].map((table) => [table, db.prepare(`SELECT count(*) AS count FROM ${table}`).get().count]),
    )
    const images = db.prepare('SELECT hash, bytes FROM image_resources ORDER BY hash').all()
    assert(images.every((image) => hash(image.bytes) === image.hash))
    return {
      bytes: (await stat(dbPath)).size,
      counts,
      integrity: db.prepare('PRAGMA integrity_check').all(),
      foreignKeys: db.prepare('PRAGMA foreign_key_check').all(),
      images: images.map((image) => ({ hash: image.hash, bytes: image.bytes.length })),
      versions: db
        .prepare(
          'SELECT q.question_id AS questionId, v.id AS versionId, v.sequence, v.question_markdown AS question, v.answer_markdown AS answer FROM questions q JOIN question_versions v ON v.id=q.current_version_id ORDER BY q.question_id',
        )
        .all(),
    }
  } finally {
    db.close()
  }
}
