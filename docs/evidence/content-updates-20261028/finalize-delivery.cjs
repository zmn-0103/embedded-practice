const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const evidence = path.resolve('docs/evidence/content-updates-20261028')
const release = path.resolve('release/V0.0.2-content-updates-20261028.1')
const read = name => JSON.parse(fs.readFileSync(path.join(evidence, name), 'utf8'))
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const full = read('packaged-full-02.json'), first = read('packaged-full-01.json'), unit = read('unit-all-01.json')
const source = read('source-at-pack.json'), packed = read('package-source-verification.json')
const compatibility = read('previous-v13-01.json')
const specs = suite => [...(suite.specs || []), ...(suite.suites || []).flatMap(specs)]
const allSpecs = specs(full), tests = allSpecs.flatMap(spec => spec.tests)
if (full.stats.expected !== 342 || full.stats.unexpected || full.stats.skipped || full.stats.flaky || tests.length !== 342 || tests.some(test => test.results.length !== 1 || test.results[0].status !== 'passed' || test.results[0].retry !== 0)) throw new Error('实际EXE完整回归未单轮全部通过')
if (!unit.success || unit.numPassedTests !== 724 || unit.numFailedTests || unit.testResults.length !== 42) throw new Error('单元结果不符')
if (!compatibility.completed || !compatibility.dataUnchanged || compatibility.schemaVersion !== 13) throw new Error('旧结构13兼容证据未完成')
for (const file of source.files) {
  const bytes = fs.readFileSync(file.path)
  if (bytes.length !== file.bytes || sha(bytes) !== file.sha256) throw new Error('打包后来源变化: ' + file.path)
}
if (sha(fs.readFileSync(packed.archive)) !== packed.archiveSha256 || sha(fs.readFileSync(packed.exe.path)) !== packed.exe.sha256) throw new Error('包或EXE变化')
const before = read('before.json'), originalPlan = fs.readFileSync(path.join(evidence, 'before/计划书.md'))
if (!fs.readFileSync('计划书.md').subarray(0, originalPlan.length).equals(originalPlan)) throw new Error('原计划前缀变化')
const previousManifestPath = path.join(packed.previousRelease, '交付文件校验.json')
if (sha(fs.readFileSync(previousManifestPath)) !== packed.previousManifestSha256) throw new Error('原交付清单变化')
const previousManifest = JSON.parse(fs.readFileSync(previousManifestPath, 'utf8'))
for (const file of previousManifest.files) {
  const bytes = fs.readFileSync(path.join(packed.previousRelease, file.path))
  if (bytes.length !== file.bytes || sha(bytes) !== file.sha256) throw new Error('原交付变化: ' + file.path)
}
const assets = previousManifest.files.filter(file => /^(题库|主题示例)[\\/]/.test(file.path) || ['题库来源清单.json', '主题包格式与使用.md'].includes(file.path))
if (assets.length !== 17) throw new Error('原素材数不符')
for (const file of assets) if (sha(fs.readFileSync(path.join(release, file.path))) !== file.sha256) throw new Error('素材变化')
const launcher = fs.readFileSync(path.join(release, '安全试用内容更新复习.cmd'))
if (launcher.some(byte => byte > 127) || !launcher.toString().includes('%LOCALAPPDATA%\\embedded-practice-content-updates-trial-20261028.1') || launcher.toString().split('\r\n').filter(Boolean).length !== 9) throw new Error('安全入口不符')
const manifestPath = path.join(release, '交付文件校验.json'), previews = path.join(release, '界面预览')
if (fs.existsSync(manifestPath) || fs.existsSync(previews) || fs.existsSync(path.join(evidence, 'result-summary.json'))) throw new Error('最终证据已存在，不覆盖')
const rules = [
  ['1440px/100%', 'content-updates-layout-question.png', '01-题干差异-宽窗浅色.png'],
  ['1440px/100%', 'content-updates-layout-selection.png', '02-更新复习确认-宽窗.png'],
  ['900px/125%', 'content-updates-layout-question.png', '03-题干差异-小窗深色.png'],
  ['900px/125%', 'content-updates-layout-selection.png', '04-更新复习确认-小窗.png'],
  ['1200px/150%', 'content-updates-layout-question.png', '05-题干差异-大字号缩放.png'],
  ['1200px/150%', 'content-updates-layout-selection.png', '06-更新复习确认-缩放.png'],
  ['差异主动打开才读题干', 'question-differences.png', '07-版本选择与题干差异.png'],
  ['差异主动打开才读题干', 'answer-differences.png', '08-主动查看答案差异.png'],
  ['仅图片变化', 'image-differences.png', '09-仅图片变化对照.png'],
  ['更新筛选跨页勾选', 'updated-selection-unavailable.png', '10-混选不可用项提示.png'],
]
const images = rules.map(([title, name, target]) => {
  const spec = allSpecs.find(spec => spec.title.includes(title))
  const attachment = spec?.tests[0].results[0].attachments.find(item => item.name === name)
  if (!attachment) throw new Error('缺少本EXE截图: ' + title + '/' + name)
  const bytes = attachment.body ? Buffer.from(attachment.body, 'base64') : fs.readFileSync(attachment.path)
  if (!bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) throw new Error('非PNG截图')
  return { file: '界面预览/' + target, scenario: spec.title, attachment: name, capture: 'Electron capturePage实际窗口', bytes: bytes.length, sha256: sha(bytes), data: bytes }
})
fs.mkdirSync(previews)
for (const image of images) fs.writeFileSync(path.join(release, image.file), image.data)
fs.writeFileSync(path.join(previews, '说明.md'), '# 本版实际窗口\n\n10张均来自当前EXE完整回归packaged-full-02的Electron capturePage。题目、作答和笔记为独立TEMP合成样例；900/1200/1440宽、22px及100/125/150%为程序窗口与缩放，不代表Windows系统DPI/IME验收。\n\n' + images.map(image => '- ' + path.basename(image.file) + '：' + image.scenario).join('\n') + '\n')
const summary = {
  build: packed.build, schemaVersion: 13, release, exe: packed.exe.path,
  unit: { files: 42, passed: 724, failed: 0 }, firstPackaged: first.stats, packaged: full.stats, scenarios: tests.length, newScenarios: 13, retries: 0,
  sourceFilesPreserved: source.files.length, productionFiles: source.files.filter(file => /^src[\\/]/.test(file.path)).length,
  testFiles: source.files.filter(file => /^tests[\\/]/.test(file.path)).length, configurationFilesUnchanged: 8,
  beforeFiles: before.files.length, originalPlanPrefixBytes: originalPlan.length,
  previousDeliveryFilesUnchanged: previousManifest.files.length, originalAssetsUnchanged: assets.length,
  compatibility: { completed: true, dataUnchanged: true, previousExe: compatibility.previousExe },
  archiveSha256: packed.archiveSha256, exeSha256: packed.exe.sha256,
  images: images.map(({ data, ...metadata }) => metadata),
}
fs.writeFileSync(path.join(evidence, 'result-summary.json'), JSON.stringify(summary, null, 2))
fs.writeFileSync(path.join(release, '检查结果.md'), `# 第四批实际检查\n\n产品0.0.2 · 构建${packed.build} · 结构13 · Windows x64。\n\n类型/格式check-01、源码build-02、本地解包pack-01通过。单元42文件724/724；本EXE单轮完整342/342，${(full.stats.duration / 1000).toFixed(3)}秒，零失败/跳过/flaky/自动重试，含本批13场景。\n\n首轮packaged-full-01为341/342，739.782秒；既有分类范围测试在第二次导入的来源准备阶段返回泛化失败，没有进入提交。原测试/生产程序保持，同一EXE定向category-investigation-01为1/1，第二轮全量另存。本次缺少足以定位首轮底层异常的信息，原因仍未知，不宣称修复或改写历史失败。\n\n覆盖元数据20条分页、同题旧新版本校验、题干/答案分区隔离及晚响应、仅答案/仅图片变化和来源移走、差异查看只读、混选显式处理、建轮前已复习/更新/归档拒绝、真实插入失败回滚、未知结果原请求重试、固定队列/版本/草稿重开及完整备份恢复，以及既有导入/练习/再练/题单/笔记/复盘/导出/主题/恢复等回归。系统文件对话框使用明确替身。\n\n开发首次失败保留：typecheck-01缺服务替身、typecheck-03图片URL类型；development-02解析阶段发现测试括号问题、development-03图片renderer fetch被原CSP限制、development-05使用不存在的按钮文案。修正测试类型/定位和从主进程net.fetch核对图片字节，生产CSP保持；development-04/06/07/08分别3/4/1/3通过，非同轮不累计。development-04～07仅保留文本与必要失败上下文，未另存JSON；最终完整JSON使用正确输出参数。\n\n${packed.outputFiles.length}份包内构建与out逐字节一致，原生SQLite/元数据匹配。${source.files.length}份生产/测试/配置冻结保持，8配置及历史SQL不变，原计划${originalPlan.length}字节前缀保持，上一版${previousManifest.files.length}交付文件及17素材保持。本版10张实际窗口及完整文件路径/大小/SHA256清单随附，清单不包含自身，无数据库或运行目录混入。\n\n沿用结构13，另以第三批r3旧EXE在新TEMP中读取本版完整备份副本，固定旧内容/来源/草稿及逐表数据保持，原备份字节保持；此项仅为旧结构13兼容检查。结构12及更早程序不能打开。原个人桌面/正式库保持，使用安全试用内容更新复习.cmd独立试用。入口静态核对，桌面运行用显式EXE/新TEMP。本批未提交/合并/推送。\n\n未制作/安装NSIS，真实断网人工、全部Windows系统DPI/IME、多屏、硬件、长期/性能及完整人工验收未执行，既有VMware跳过保持。方案置顶/最近使用排序仍是后续目标。\n\n原始报告见../../docs/evidence/content-updates-20261028/，行为见../../docs/内容更新差异与集中复习行为.md。\n`)
const walk = root => fs.readdirSync(root, { withFileTypes: true }).flatMap(item => {
  const file = path.join(root, item.name)
  if (item.isSymbolicLink()) throw new Error('交付符号链接')
  return item.isDirectory() ? walk(file) : [file]
})
const files = walk(release).sort().map(file => {
  const relative = path.relative(release, file).replaceAll('\\', '/')
  if (/\.(sqlite3|db)(-(wal|shm|journal))?$|(^|\/)(Logs|Backups|Backup-Staging|test-results)(\/|$)/i.test(relative)) throw new Error('交付混入运行数据')
  const bytes = fs.readFileSync(file)
  return { path: relative, bytes: bytes.length, sha256: sha(bytes) }
})
const manifest = { build: packed.build, schemaVersion: 13, applicationVersion: '0.0.2', createdAt: new Date().toISOString(), exclusions: ['交付文件校验.json'], totalBytes: files.reduce((sum, file) => sum + file.bytes, 0), files }
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
process.stdout.write(JSON.stringify({ scenarios: tests.length, files: files.length, bytes: manifest.totalBytes, images: images.length, archiveSha256: packed.archiveSha256 }))
