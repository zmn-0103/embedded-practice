const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const asar = require('@electron/asar')
const evidence = path.resolve('docs/evidence/content-updates-20261028')
const release = path.resolve('release/V0.0.2-content-updates-20261028.1')
const previous = path.resolve('release/V0.0.2-study-assets-20261027.5-r3')
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const walk = root => fs.readdirSync(root, { withFileTypes: true }).flatMap(item => {
  const file = path.join(root, item.name)
  if (item.isSymbolicLink()) throw new Error('拒绝符号链接: ' + file)
  return item.isDirectory() ? walk(file) : [file]
})
const record = file => {
  const bytes = fs.readFileSync(file)
  return { path: file, bytes: bytes.length, sha256: sha(bytes) }
}
const archive = path.join(release, 'win-unpacked/resources/app.asar')
const outputFiles = walk(path.resolve('out')).map(file => {
  const relative = path.relative(process.cwd(), file)
  const source = fs.readFileSync(file), packaged = asar.extractFile(archive, relative)
  if (!source.equals(packaged)) throw new Error('包内构建不同: ' + relative)
  return { path: relative, bytes: packaged.length, sha256: sha(packaged) }
})
const metadata = JSON.parse(asar.extractFile(archive, 'package.json').toString('utf8'))
if (metadata.version !== '0.0.2' || metadata.main !== './out/main/index.js') throw new Error('包内元数据不符')
const nativePath = 'node_modules/better-sqlite3/build/Release/better_sqlite3.node'
const native = fs.readFileSync(path.join(release, 'win-unpacked/resources/app.asar.unpacked', nativePath))
if (!native.equals(fs.readFileSync(nativePath))) throw new Error('原生SQLite不同')
const previousManifestPath = path.join(previous, '交付文件校验.json')
const previousManifest = JSON.parse(fs.readFileSync(previousManifestPath, 'utf8'))
for (const file of previousManifest.files) {
  const bytes = fs.readFileSync(path.join(previous, file.path))
  if (bytes.length !== file.bytes || sha(bytes) !== file.sha256) throw new Error('上一版交付变化: ' + file.path)
}
const configuration = ['package.json', 'package-lock.json', 'electron.vite.config.ts', 'electron-builder.yml', 'playwright.config.ts', 'vitest.config.ts', 'tsconfig.node.json', 'tsconfig.web.json']
const before = JSON.parse(fs.readFileSync(path.join(evidence, 'before.json'), 'utf8'))
for (const file of configuration) {
  const original = before.files.find(item => item.path.replaceAll('\\', '/') === file)
  if (!original || original.sha256 !== record(file).sha256) throw new Error('配置变化: ' + file)
}
for (const file of before.files.filter(item => /^tests[\\/]fixtures[\\/]schema-v\d+\.sql$/.test(item.path))) {
  if (record(file.path).sha256 !== file.sha256) throw new Error('历史夹具变化: ' + file.path)
}
const sourceFiles = [...walk('src'), ...walk('tests'), ...configuration].map(record)
const result = {
  build: '20261028.1-content-updates', schemaVersion: 13, release, archive,
  archiveSha256: sha(fs.readFileSync(archive)), exe: record(path.join(release, 'win-unpacked/embedded-practice.exe')),
  metadata, native: { path: nativePath, bytes: native.length, sha256: sha(native) }, outputFiles,
  previousRelease: previous, previousManifestSha256: sha(fs.readFileSync(previousManifestPath)),
  previousDeliveryFilesUnchanged: previousManifest.files.length, configurationFilesUnchanged: configuration.length,
}
for (const file of ['package-source-verification.json', 'source-at-pack.json']) {
  if (fs.existsSync(path.join(evidence, file))) throw new Error('证据已存在: ' + file)
}
fs.writeFileSync(path.join(evidence, 'package-source-verification.json'), JSON.stringify(result, null, 2))
fs.writeFileSync(path.join(evidence, 'source-at-pack.json'), JSON.stringify({ build: result.build, files: sourceFiles }, null, 2))
process.stdout.write(JSON.stringify({ outputFiles: outputFiles.length, sourceFiles: sourceFiles.length, previousDeliveryFilesUnchanged: result.previousDeliveryFilesUnchanged, archiveSha256: result.archiveSha256 }))
