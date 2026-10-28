const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const crypto = require('node:crypto')
const assert = require('node:assert/strict')
const { DatabaseSync } = require('node:sqlite')
const { _electron } = require('@playwright/test')
const reportPath = path.resolve('docs/evidence/content-updates-20261028/previous-v13-01.json')
const previousExe = path.resolve('release/V0.0.2-study-assets-20261027.5-r3/win-unpacked/embedded-practice.exe')
const report = JSON.parse(fs.readFileSync('docs/evidence/content-updates-20261028/packaged-full-01.json', 'utf8'))
const specs = suite => [...(suite.specs || []), ...(suite.suites || []).flatMap(specs)]
const specification = specs(report).find(item => item.title.startsWith('更新复习重开及完整备份恢复'))
assert.equal(specification.tests[0].results[0].status, 'passed')
// 完整备份由当前真实EXE的专项生成；仅在该批产物目录内定位，不能指向个人库。
const walk = root => fs.readdirSync(root, { withFileTypes: true }).flatMap(item => {
  const file = path.join(root, item.name)
  if (item.isSymbolicLink()) throw new Error('拒绝符号链接')
  return item.isDirectory() ? walk(file) : [file]
})
const backups = walk(path.resolve('test-results/content-updates-packaged-full-01')).filter(file => path.basename(file) === '更新复习完整备份.sqlite3')
assert.equal(backups.length, 1)
const original = fs.readFileSync(backups[0])
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
function snapshot(file) {
  const db = new DatabaseSync(file, { readOnly: true })
  try {
    assert.equal(db.prepare('PRAGMA user_version').get().user_version, 13)
    const tables = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT GLOB 'sqlite_*' AND name NOT IN ('app_startup','backup_manifest') ORDER BY name").all()
    return Object.fromEntries(tables.map(({ name }) => [name, db.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}" ORDER BY rowid`).all()]))
  } finally { db.close() }
}
async function run() {
  if (fs.existsSync(reportPath)) throw new Error('兼容报告已存在')
  assert.ok(fs.existsSync(previousExe))
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'embedded-practice-content-updates-old-v13-'))
  const copy = path.join(temporary, 'practice.sqlite3')
  fs.writeFileSync(copy, original)
  const before = snapshot(copy)
  let application, completed = false
  try {
    const env = Object.fromEntries(Object.entries(process.env).filter(([key, value]) => value !== undefined && !['PATH', 'ELECTRON_RUN_AS_NODE', 'ELECTRON_RENDERER_URL'].includes(key.toUpperCase())))
    env.PATH = path.join(process.env.SystemRoot, 'System32')
    env.EMBEDDED_PRACTICE_TEST_DATA_DIR = temporary
    application = await _electron.launch({ executablePath: previousExe, args: [], env })
    const page = await application.firstWindow()
    await page.locator('.app-shell').waitFor()
    const runtime = await application.evaluate(({ app }) => ({ exe: process.execPath, userData: app.getPath('userData'), packaged: app.isPackaged, version: app.getVersion() }))
    assert.equal(runtime.exe.toLowerCase(), previousExe.toLowerCase())
    assert.equal(runtime.userData, temporary)
    assert.equal(runtime.packaged, true)
    assert.equal(runtime.version, '0.0.2')
    const footer = await page.locator('footer').innerText()
    assert.ok(footer.includes('20261027.5-study-assets'))
    const result = await page.evaluate(() => window.desktop.practice.read({ sessionId: null }))
    assert.equal(result.ok, true)
    assert.equal(result.value.session.total, 2)
    assert.equal(result.value.session.selectionName, '内容更新复习：测试勾选')
    assert.equal(result.value.item.draft.text, '更新第二版独立草稿')
    assert.ok(result.value.item.body.markdown.includes('UPDATES-BODY-2-1'))
    assert.equal('answer' in result.value.item, false)
    const closing = application.waitForEvent('close')
    await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].close())
    await closing
    assert.deepEqual(snapshot(copy), before)
    assert.deepEqual(fs.readFileSync(backups[0]), original)
    fs.writeFileSync(reportPath, JSON.stringify({ purpose: '第三批结构13程序读取第四批完整备份副本，非当前版功能验收', previousExe, runtime, footer, originalBackup: backups[0], originalSha256: sha(original), dataUnchanged: true, schemaVersion: 13, session: result.value.session, completed: true }, null, 2))
    completed = true
  } finally {
    if (application) await application.close().catch(() => {})
    assert.equal(path.resolve(path.dirname(temporary)), path.resolve(os.tmpdir()))
    assert.ok(path.basename(temporary).startsWith('embedded-practice-content-updates-old-v13-'))
    if (completed) fs.rmSync(temporary, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
    else process.stderr.write('兼容失败临时目录保留: ' + temporary + '\n')
  }
}
run().catch(error => { process.stderr.write(error.stack + '\n'); process.exitCode = 1 })
