const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const evidence = path.resolve('docs/evidence/study-assets-20261027')
const release = path.resolve('release/V0.0.2-study-assets-20261027.5-r3')
const read = file => JSON.parse(fs.readFileSync(path.join(evidence,file),'utf8'))
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const full = read('packaged-full-02.json'), first = read('packaged-full-01.json')
const unit = read('unit-all-02.json'), source = read('source-final-at-pack.json')
const packed = read('package-final-source-verification.json'), before = read('before.json')
const specs = suite => [...(suite.specs ?? []), ...(suite.suites ?? []).flatMap(specs)]
const allSpecs = full.suites.flatMap(specs)
const tests = allSpecs.flatMap(spec => spec.tests)
if (full.stats.expected !== 329 || full.stats.unexpected || full.stats.skipped || full.stats.flaky ||
    tests.length !== 329 || tests.some(test => test.results.length !== 1 || test.results[0].status !== 'passed' || test.results[0].retry !== 0))
  throw new Error('最终完整回归未全部单次通过，不能生成交付完成记录')
if (!unit.success || unit.numPassedTests !== 709 || unit.numFailedTests || unit.testResults.length !== 40) throw new Error('单元结果不符')
const preservedSources = source.files.map(file => {
  const bytes = fs.readFileSync(file.path)
  if (bytes.length !== file.bytes || sha(bytes) !== file.sha256) throw new Error('打包后来源变化: ' + file.path)
  return file.path
})
for (const file of source.files.filter(file => !/^(src|tests)[\\/]/.test(file.path))) {
  const original = before.files.find(entry => entry.path.replaceAll('\\','/') === file.path.replaceAll('\\','/'))
  if (!original || original.sha256 !== file.sha256) throw new Error('配置变化: ' + file.path)
}
const originalPlan = fs.readFileSync(path.join(evidence,'before/计划书.md'))
if (!originalPlan.equals(fs.readFileSync('计划书.md').subarray(0,originalPlan.length))) throw new Error('原计划字节前缀不同')
const fixture = read('schema-v12-source.json')
if (sha(fs.readFileSync(fixture.fixture)) !== fixture.fixtureSha256) throw new Error('历史v12夹具变化')
if (sha(fs.readFileSync(packed.archive)) !== packed.archiveSha256) throw new Error('最终ASAR变化')
const oldRoot = path.resolve('release/V0.0.2-practice-control-20261027.4')
const oldManifest = JSON.parse(fs.readFileSync(path.join(oldRoot,'交付文件校验.json'),'utf8'))
for (const file of oldManifest.files) {
  const bytes = fs.readFileSync(path.join(oldRoot,file.path))
  if (bytes.length !== file.bytes || sha(bytes) !== file.sha256) throw new Error('旧交付变化: ' + file.path)
}
const assets = oldManifest.files.filter(file => /^(题库|主题示例)[\\/]/.test(file.path) || ['题库来源清单.json','主题包格式与使用.md'].includes(file.path))
if (assets.length !== 17) throw new Error('素材数不同')
for (const file of assets) if (sha(fs.readFileSync(path.join(release,file.path))) !== file.sha256) throw new Error('素材变化: ' + file.path)
const launcher = fs.readFileSync(path.join(release,'安全试用个人积累.cmd'))
if (launcher.some(byte => byte > 127) || !launcher.toString().includes('%LOCALAPPDATA%\\embedded-practice-study-assets-trial-20261027.5') ||
    launcher.toString().split('\r\n').filter(Boolean).length !== 9) throw new Error('安全入口不符')
const manifestPath = path.join(release,'交付文件校验.json')
if (fs.existsSync(manifestPath)) throw new Error('交付清单已存在，保留原证据')
const previews = path.join(release,'界面预览')
fs.mkdirSync(previews)
const screenshotRules = [
  ['1440px/100%', 'study-note.png', '01-笔记-宽窗.png'],
  ['1440px/100%', 'study-comparison.png', '02-作答对照-宽窗窄栏.png'],
  ['1440px/100%', 'study-round-export.png', '03-按轮导出-浅色.png'],
  ['900px/125%', 'study-note.png', '04-笔记-小窗深色.png'],
  ['900px/125%', 'study-comparison.png', '05-作答对照-小窗.png'],
  ['900px/125%', 'study-round-export.png', '06-按轮导出-小窗.png'],
  ['1200px/150%', 'study-note.png', '07-笔记-大字号缩放.png'],
  ['1200px/150%', 'study-comparison.png', '08-作答对照-缩放.png'],
  ['1200px/150%', 'study-round-export.png', '09-按轮导出-缩放.png'],
  ['学习记录按轮查看原范围', 'round-review.png', '10-单题轮次复盘.png'],
  ['同题两次作答主动确认', 'answer-comparison.png', '11-不同版本作答对照.png'],
  ['题单主动选择三类材料', 'material-export.png', '12-固定题单导出.png'],
]
const images = screenshotRules.map(([title, name, target]) => {
  const spec = allSpecs.find(spec => spec.title.includes(title))
  const attachment = spec?.tests[0]?.results[0]?.attachments.find(item => item.name === name)
  if (!attachment) throw new Error('缺少最终截图: ' + title + '/' + name)
  const bytes = attachment.body ? Buffer.from(attachment.body, 'base64') : fs.readFileSync(attachment.path)
  if (!bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))) throw new Error('截图不是PNG')
  fs.writeFileSync(path.join(previews,target),bytes)
  return { title:spec.title, attachment:name, file:'界面预览/' + target,
    capture:['round-review.png','answer-comparison.png'].includes(name) ? 'Electron页面内容长图' : 'Electron capturePage窗口',
    bytes:bytes.length, sha256:sha(bytes) }
})
fs.writeFileSync(path.join(previews,'说明.md'), '# 本版程序截图\n\n以下12张均来自最终r3 EXE单轮完整回归packaged-full-02：10张capturePage实际窗口、2张Electron页面内容长图（10、11）。题目、笔记、作答为独立TEMP合成样例，不代表个人真实记录。900/1200/1440窗口、22px与100/125/150%均为程序缩放，未验证Windows系统DPI/IME。\n\n' + images.map(image => `- ${image.file.split('/').at(-1)}：${image.capture}；${image.title}`).join('\n') + '\n')
const summary = { build:packed.build,schemaVersion:13,release,exe:path.join(release,'win-unpacked/embedded-practice.exe'),
  finalUnit:{files:40,passed:709,failed:0},firstPackaged:first.stats,finalPackaged:full.stats,
  finalScenarios:tests.length,retries:0,sourceFilesPreserved:preservedSources.length,configurationFilesUnchanged:8,
  originalPlanPrefixBytes:originalPlan.length,previousDeliveryFilesUnchanged:oldManifest.files.length,
  originalAssetsUnchanged:assets.length,images,archiveSha256:packed.archiveSha256,exeSha256:packed.exeSha256 }
fs.writeFileSync(path.join(evidence,'result-summary.json'), JSON.stringify(summary,null,2))
fs.writeFileSync(path.join(release,'检查结果.md'), `# 第三批实际检查\n\n产品0.0.2 · 构建20261027.5-study-assets · 结构13 · 最终r3 · Windows x64。\n\n类型/格式check-03、源码build-07、本地解包pack-03通过。单元40文件709/709；最终本EXE单轮完整329/329，${(full.stats.duration/1000).toFixed(3)}秒，零失败/跳过/flaky/自动重试。开发修正回归development-07为19/19、最终development-08为17/17，重复场景不相加。\n\n覆盖笔记保存/冲突/重试/重开/揭晓前零读取、按轮分页/只读/两次作答版本提示、三种Markdown内容/图片字节/失败旧文件保护、结构12升级和失败回滚/笔记完整备份恢复，以及既有导入/练习/恢复/主题/阅读/题单等场景。保存对话框使用明确替身，不声称手动操作通过。\n\nr2首轮325/328、三个失败和各次调查全部保留：返回阅读位置在列表刷新收起正文后被夹回，r3等正文恢复再还原；旧夹具人为自定义表与新笔记表同名，成功用例改自定义名并新增同名冲突专例确认保护停止/完整回滚；记录页标题与查看方式并排/窄窗换行，保留首屏至少三条完整记录。原精确断言、历史SQL及原报告未删除或覆盖。\n\n19份包内构建与out逐字节一致，原生SQLite/元数据匹配。139生产/8配置/140测试夹具共287份打包后来源保持；原计划${originalPlan.length}字节前缀保持。上一版155份交付文件、附带原题库/主题17文件哈希保持。本版12张截图（10张窗口、2张内容长图）及完整文件路径/大小/SHA256清单随附，清单不包含自身。\n\n试用请用安全试用个人积累.cmd，数据独立于原个人程序。安全入口仅静态核对，桌面自动化通过明确EXE/新TEMP运行。结构13不能交给旧程序；带入进度先在原程序导出完整备份，再在本版主动预览确认恢复。原个人桌面/正式库未迁移，本批未提交/合并/推送。\n\n未制作/安装NSIS，真实断网人工、全部系统DPI/IME、多屏、长期/性能、硬件与完整人工验收未执行，既有VMware跳过保持。第四批内容差异/更新题集中复习与方案置顶/最近使用仍是后续目标。\n\n原始报告见../../docs/evidence/study-assets-20261027/，详细行为见../../docs/个人积累与复盘导出行为.md。\n`)
const walkFiles = root => fs.readdirSync(root,{withFileTypes:true}).flatMap(item => {
  const fullPath = path.join(root,item.name)
  if (item.isSymbolicLink()) throw new Error('交付出现符号链接')
  return item.isDirectory() ? walkFiles(fullPath) : [fullPath]
})
const deliveryFiles = walkFiles(release).sort().map(file => {
  const relative = path.relative(release,file).replaceAll('\\','/')
  if (/\.(sqlite3|db)(-(wal|shm|journal))?$|(^|\/)(Logs|Backups|Backup-Staging|test-results)(\/|$)/i.test(relative)) throw new Error('交付混入运行数据: ' + relative)
  const bytes = fs.readFileSync(file)
  return {path:relative,bytes:bytes.length,sha256:sha(bytes)}
})
const manifest = {build:packed.build,schemaVersion:13,applicationVersion:'0.0.2',createdAt:new Date().toISOString(),
  exclusions:['交付文件校验.json'],totalBytes:deliveryFiles.reduce((sum,file) => sum+file.bytes,0),files:deliveryFiles}
fs.writeFileSync(manifestPath, JSON.stringify(manifest,null,2))
process.stdout.write(JSON.stringify({scenarios:tests.length,files:deliveryFiles.length,bytes:manifest.totalBytes,images:images.length,archiveSha256:packed.archiveSha256}))
