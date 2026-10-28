const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const asar = require('@electron/asar')
const release = path.resolve('release/V0.0.2-study-assets-20261027.5-r2')
const archive = path.join(release, 'win-unpacked/resources/app.asar')
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const files = root => fs.readdirSync(root, { withFileTypes: true }).flatMap(item => {
  const full = path.join(root, item.name)
  if (item.isSymbolicLink()) throw new Error('来源不能为符号链接: ' + full)
  return item.isDirectory() ? files(full) : [full]
})
const verified = files(path.resolve('out')).map(file => {
  const relative = path.relative(process.cwd(), file)
  const source = fs.readFileSync(file), built = asar.extractFile(archive, relative)
  if (!source.equals(built)) throw new Error('包内构建不同: ' + relative)
  return { path: relative, bytes: built.length, sha256: sha(built) }
})
const packaged = JSON.parse(asar.extractFile(archive, 'package.json').toString('utf8'))
if (packaged.version !== '0.0.2' || packaged.main !== './out/main/index.js') throw new Error('打包元数据不符')
const nativeRelative = path.join('node_modules','better-sqlite3','build','Release','better_sqlite3.node')
const native = fs.readFileSync(path.join(release,'win-unpacked/resources/app.asar.unpacked',nativeRelative))
if (!native.equals(fs.readFileSync(path.resolve(nativeRelative)))) throw new Error('原生SQLite与构建产物不符')
const previous = path.resolve('release/V0.0.2-practice-control-20261027.4')
const previousManifest = JSON.parse(fs.readFileSync(path.join(previous, '交付文件校验.json'), 'utf8'))
for (const file of previousManifest.files) {
  const bytes = fs.readFileSync(path.join(previous,file.path))
  if (bytes.length !== file.bytes || sha(bytes) !== file.sha256) throw new Error('前版文件变化: ' + file.path)
}
const output = { build:'20261027.5-study-assets', schemaVersion:13, archive,
  archiveSha256:sha(fs.readFileSync(archive)), exeSha256:sha(fs.readFileSync(path.join(release,'win-unpacked/embedded-practice.exe'))),
  packaged, outputFiles:verified, native:{path:nativeRelative,bytes:native.length,sha256:sha(native)}, previousDeliveryFilesUnchanged:previousManifest.files.length }
const evidence = path.resolve('docs/evidence/study-assets-20261027')
fs.writeFileSync(path.join(evidence,'package-source-verification.json'), JSON.stringify(output,null,2))
const sourceFiles = [...files('src'), ...files('tests'), ...['package.json','package-lock.json','electron.vite.config.ts','electron-builder.yml','playwright.config.ts','vitest.config.ts','tsconfig.node.json','tsconfig.web.json']]
const source = sourceFiles.map(file => { const bytes = fs.readFileSync(file); return {path:file,bytes:bytes.length,sha256:sha(bytes)} })
fs.writeFileSync(path.join(evidence,'source-at-pack.json'), JSON.stringify({ build:output.build,files:source },null,2))
process.stdout.write(JSON.stringify({ outputFiles:verified.length,sourceFiles:source.length,previousFilesUnchanged:previousManifest.files.length,archiveSha256:output.archiveSha256 }))
