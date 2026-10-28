const { _electron } = require('@playwright/test')
const { mkdtemp, readFile, writeFile } = require('node:fs/promises')
const { tmpdir } = require('node:os')
const { resolve, join } = require('node:path')
const { DatabaseSync } = require('node:sqlite')
const { createHash } = require('node:crypto')
;(async () => {
  const sourceExe = resolve('release/V0.0.2-practice-control-20261027.4/win-unpacked/embedded-practice.exe')
  const directory = await mkdtemp(join(tmpdir(), 'embedded-practice-fixture-v12-'))
  const env = { ...process.env, EMBEDDED_PRACTICE_TEST_DATA_DIR: directory }
  delete env.ELECTRON_RUN_AS_NODE
  delete env.ELECTRON_RENDERER_URL
  const app = await _electron.launch({ executablePath: sourceExe, args: [], env })
  let identity, footer
  try {
    const page = await app.firstWindow()
    await page.locator('.app-shell').waitFor()
    identity = await app.evaluate(({ app }) => ({ exe: process.execPath, data: app.getPath('userData'), packaged: app.isPackaged }))
    footer = await page.locator('footer').innerText()
    if (identity.exe.toLowerCase() !== sourceExe.toLowerCase() || identity.data !== directory || !identity.packaged || !footer.includes('20261027.4-practice-control')) throw new Error('旧程序身份不匹配')
    const closed = app.waitForEvent('close')
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].close())
    await closed
  } finally { await app.close().catch(() => {}) }
  const db = new DatabaseSync(join(directory, 'practice.sqlite3'), { readOnly: true })
  let sql, objects
  try {
    if (db.prepare('PRAGMA user_version').get().user_version !== 12) throw new Error('不是结构12')
    objects = db.prepare("SELECT sql FROM sqlite_schema WHERE sql IS NOT NULL AND name NOT GLOB 'sqlite_*' ORDER BY rowid").all()
    sql = '-- 来源：20261027.4-practice-control真实新临时空库；详见study-assets-20261027/schema-v12-source.json\nPRAGMA application_id=0x45505231;\nPRAGMA user_version=12;\n' + objects.map(x => x.sql + ';\n').join('')
    const quote = value => value === null ? 'NULL' : typeof value === 'number' ? String(value) : "'" + value.replaceAll("'", "''") + "'"
    for (const table of ['app_startup', 'library_meta', 'appearance_settings']) for (const row of db.prepare(`SELECT * FROM ${table}`).all()) sql += `INSERT INTO "${table}" (${Object.keys(row).map(k => '"' + k + '"').join(',')}) VALUES (${Object.values(row).map(quote).join(',')});\n`
  } finally { db.close() }
  const fixture = 'tests/fixtures/schema-v12.sql'
  await writeFile(fixture, sql)
  const sha = bytes => createHash('sha256').update(bytes).digest('hex')
  await writeFile('docs/evidence/study-assets-20261027/schema-v12-source.json', JSON.stringify({ identity, footer, directory, schema: 12, sourceExe, sourceAsarSha256: sha(await readFile(resolve(sourceExe, '../resources/app.asar'))), fixture, fixtureSha256: sha(Buffer.from(sql)), bytes: Buffer.byteLength(sql), objects: objects.length }, null, 2))
  process.stdout.write(JSON.stringify({ fixture, sha256: sha(Buffer.from(sql)), bytes: Buffer.byteLength(sql), directory }))
})().catch(error => { process.stderr.write(String(error)); process.exitCode = 1 })
