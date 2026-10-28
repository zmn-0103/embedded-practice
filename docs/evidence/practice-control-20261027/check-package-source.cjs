const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const asar = require('@electron/asar')
const release = path.resolve('release/V0.0.2-practice-control-20261027.4')
const archive = path.join(release, 'win-unpacked/resources/app.asar')
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const files = []
const visit = dir => { for (const item of fs.readdirSync(dir, { withFileTypes: true })) { const full = path.join(dir, item.name); if (item.isDirectory()) visit(full); else files.push(full) } }
visit(path.resolve('out'))
const verified = files.map(file => {
  const relative = path.relative(process.cwd(), file)
  const source = fs.readFileSync(file)
  const built = asar.extractFile(archive, relative)
  if (!source.equals(built)) throw new Error('包内构建不同: ' + relative)
  return { path: relative, bytes: built.length, sha256: sha(built) }
})
const packaged = JSON.parse(asar.extractFile(archive, 'package.json').toString('utf8'))
if (packaged.version !== '0.0.2' || packaged.main !== './out/main/index.js') throw new Error('打包元数据不符')
const nativeRelative = path.join('node_modules','better-sqlite3','build','Release','better_sqlite3.node')
const native = fs.readFileSync(path.join(release,'win-unpacked/resources/app.asar.unpacked',nativeRelative))
if (!native.equals(fs.readFileSync(path.resolve(nativeRelative)))) throw new Error('原生SQLite与重建产物不一致')
const old = path.resolve('release/V0.0.2-practice-flow-20261027.3-r2')
const oldManifest = JSON.parse(fs.readFileSync(path.join(old,'交付文件校验.json'),'utf8'))
for (const file of oldManifest.files) {
 const bytes = fs.readFileSync(path.join(old,file.path))
 if (bytes.length !== file.bytes || sha(bytes) !== file.sha256) throw new Error('第一批程序文件变化: '+file.path)
}
const output = { build:'20261027.4-practice-control',schemaVersion:12,archive, archiveSha256:sha(fs.readFileSync(archive)), exeSha256:sha(fs.readFileSync(path.join(release,'win-unpacked/embedded-practice.exe'))), packaged, outputFiles:verified, native:{ path:nativeRelative, bytes:native.length,sha256:sha(native)}, previousDeliveryFilesUnchanged:oldManifest.files.length }
fs.writeFileSync('docs/evidence/practice-control-20261027/package-source-verification.json', JSON.stringify(output,null,2))
process.stdout.write(JSON.stringify({ outputFiles:verified.length,previousFilesUnchanged:oldManifest.files.length,archiveSha256:output.archiveSha256 }))
