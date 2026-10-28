const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const asar = require('@electron/asar')
const evidence = path.resolve('docs/evidence/note-favorite-fix-20261028')
const release = path.resolve('release/V0.0.2-note-favorite-fix-20261028.2')
const previous = path.resolve('release/V0.0.2-content-updates-20261028.1')
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'))
const walk = root => fs.readdirSync(root, { withFileTypes: true }).flatMap(item => {
  if (item.isSymbolicLink()) throw new Error('拒绝符号链接')
  const file = path.join(root, item.name)
  return item.isDirectory() ? walk(file) : [file]
})
const record = file => { const bytes = fs.readFileSync(file); return { path: file, bytes: bytes.length, sha256: sha(bytes) } }
const report = read(path.join(evidence, 'packaged-targeted-01.json')), unit = read(path.join(evidence, 'unit-01.json'))
const specs = suite => [...(suite.specs || []), ...(suite.suites || []).flatMap(specs)]
const allSpecs = specs(report), tests = allSpecs.flatMap(spec => spec.tests)
if (tests.length !== 27 || report.stats.expected !== 27 || report.stats.unexpected || report.stats.skipped || report.stats.flaky || tests.some(test => test.results.length !== 1 || test.results[0].status !== 'passed' || test.results[0].retry !== 0)) throw new Error('定向检查不完整')
if (!unit.success || unit.numPassedTests !== 724 || unit.numFailedTests) throw new Error('单元结果不符')
const archive = path.join(release, 'win-unpacked/resources/app.asar')
const output = walk('out').map(file => {
  const bytes = fs.readFileSync(file)
  if (!bytes.equals(asar.extractFile(archive, path.normalize(file)))) throw new Error('包内构建不同: ' + file)
  return record(file)
})
const metadata = JSON.parse(asar.extractFile(archive, 'package.json').toString('utf8'))
if (metadata.version !== '0.0.2' || metadata.main !== './out/main/index.js') throw new Error('产品元数据不同')
const native = 'node_modules/better-sqlite3/build/Release/better_sqlite3.node'
if (!fs.readFileSync(native).equals(fs.readFileSync(path.join(release, 'win-unpacked/resources/app.asar.unpacked', native)))) throw new Error('SQLite原生文件不同')
const oldSources = read('docs/evidence/content-updates-20261028/source-at-pack.json')
for (const file of oldSources.files.filter(file => !/^(src|tests)[\\/]/.test(file.path))) if (record(file.path).sha256 !== file.sha256) throw new Error('配置变化')
const previousManifest = read(path.join(previous, '交付文件校验.json'))
for (const file of previousManifest.files) { const bytes = fs.readFileSync(path.join(previous, file.path)); if (bytes.length !== file.bytes || sha(bytes) !== file.sha256) throw new Error('旧交付变化') }
const source = [...walk('src'), ...walk('tests'), ...oldSources.files.filter(file => !/^(src|tests)[\\/]/.test(file.path)).map(file => file.path)].map(record)
const manifestPath = path.join(release, '交付文件校验.json'), previews = path.join(release, '界面预览')
if (fs.existsSync(manifestPath) || fs.existsSync(previews) || fs.existsSync(path.join(evidence, 'verification.json'))) throw new Error('最终证据已存在，不覆盖')
const images = []
for (const entry of ['学习记录', '题库']) for (const [name, suffix] of [['favorite-note-readonly.png', '等待时只读'], ['favorite-note-save-failed.png', '保存失败保留输入']]) {
  const spec = allSpecs.find(spec => spec.title.startsWith(entry + '收藏：') && spec.tests[0].results[0].attachments.some(item => item.name === name))
  const attachment = spec?.tests[0].results[0].attachments.find(item => item.name === name)
  if (!attachment) throw new Error('缺少实际窗口截图')
  images.push({ file: entry + '-' + suffix + '.png', scenario: spec.title, source: attachment.path, bytes: fs.readFileSync(attachment.path) })
}
fs.mkdirSync(previews)
for (const image of images) fs.writeFileSync(path.join(previews, image.file), image.bytes)
fs.writeFileSync(path.join(previews, '说明.md'), '# 修复版实际窗口\n\n四张均来自本EXE定向27项检查的Electron capturePage；题目和笔记均为独立TEMP样例。截图反映只读提示与失败保留输入，不能代替系统DPI/IME或完整人工验收。\n')
fs.writeFileSync(path.join(release, '检查结果.md'), `# 本修复实际检查\n\n产品0.0.2，构建20261028.2-note-favorite-fix，结构13。check-02类型/格式、build-01、pack-01通过；42文件724/724单元；新EXE定向27/27、${(report.stats.duration / 1000).toFixed(3)}秒，零失败/跳过/flaky/自动重试。\n\n新增5项覆盖两收藏入口的真实响应延迟、列表延迟、等待期只读、未保存文本先持久化、真实笔记写失败保留/零收藏调用/原保存重试，以及普通题库收藏失败和成功后的编辑恢复。另覆盖原笔记/收藏/正常关闭重开/主题/练习保存。文件框使用明确替身。\n\n开发首两轮均3/5，列表屏障只暂停首个请求，其他列表请求可以先结束；先更换DOM读取并未解决该探针问题，随后将屏障限定为收藏范围的全部真实响应，保留DOM/readonly/卸载断言，development-03为5/5。未改生产CSP、旧断言或超时，所有首次失败保留。\n\n本轮未重新运行完整桌面套件。原独立复查338/342、原样重跑4/4及两次笔记丢失记录保持；四项原始异常原因仍未知，不因本次定向通过标为修复。\n\n包内${output.length}份out逐字节一致、产品/SQLite匹配，302份来源冻结，8配置不变，原156交付保持，原17题库/主题素材随附。完整路径/大小/SHA256清单排自身，不含数据库/运行目录；四张实际窗口附带。安全入口静态核对，应用检查使用显式EXE和新TEMP。\n\n未访问原个人库/替换桌面、未提交推送，未制作/安装NSIS、系统DPI/IME、多屏/长期/硬件和完整人工验收，VMware原跳过保持。\n`)
const delivery = walk(release).sort().map(file => {
  const relative = path.relative(release, file).replaceAll('\\', '/')
  if (/\.(sqlite3|db)(-(wal|shm|journal))?$|(^|\/)(Logs|Backups|Backup-Staging|test-results)(\/|$)/i.test(relative)) throw new Error('交付含运行数据')
  return { ...record(file), path: relative }
})
const manifest = { build: '20261028.2-note-favorite-fix', applicationVersion: '0.0.2', schemaVersion: 13, exclusions: ['交付文件校验.json'], totalBytes: delivery.reduce((sum, file) => sum + file.bytes, 0), files: delivery }
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
const result = { build: manifest.build, unit: { files: unit.testResults.length, passed: unit.numPassedTests }, targeted: report.stats, output, archiveSha256: sha(fs.readFileSync(archive)), sourceFiles: source.length, previousDeliveryFilesUnchanged: previousManifest.files.length, deliveryFiles: delivery.length, deliveryBytes: manifest.totalBytes, images: images.map(image => ({ file: image.file, scenario: image.scenario, sha256: sha(image.bytes) })) }
fs.writeFileSync(path.join(evidence, 'source-at-pack.json'), JSON.stringify({ build: result.build, files: source }, null, 2))
fs.writeFileSync(path.join(evidence, 'verification.json'), JSON.stringify(result, null, 2))
process.stdout.write(JSON.stringify({ sourceFiles: source.length, deliveryFiles: delivery.length, bytes: manifest.totalBytes, targetedPassed: 27, images: images.length, archiveSha256: result.archiveSha256 }))
