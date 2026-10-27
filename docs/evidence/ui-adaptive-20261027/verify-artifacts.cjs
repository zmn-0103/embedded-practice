const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
const { execFileSync } = require('node:child_process')
const asar = require('@electron/asar')

const root = path.resolve(__dirname, '../../..')
const trial = path.join(root, 'release/V0.0.2-ui-adaptive-20261027.2')
const previous = path.join(root, 'release/V0.0.2-ui-clarity-20261027.1')
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const fileInfo = (file) => {
  const bytes = fs.readFileSync(file)
  return { bytes: bytes.length, sha256: hash(bytes) }
}
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name)
    return entry.isDirectory() ? walk(file) : [file]
  })
}
const relative = (file) => path.relative(root, file).split(path.sep).join('/')
const oldManifest = readJson(path.join(previous, '交付文件校验.json'))
assert.equal(fileInfo(path.join(previous, '交付文件校验.json')).sha256,
  readJson(path.join(root, 'docs/evidence/ui-clarity-20261027/delivery-file-verification.json')).manifestSha256)
for (const entry of oldManifest.files)
  assert.deepEqual(fileInfo(path.join(previous, entry.path)), {
    bytes: entry.bytes,
    sha256: entry.sha256.toLowerCase(),
  })

const asarPath = path.join(trial, 'win-unpacked/resources/app.asar')
const sourceFiles = [
  ...walk(path.join(root, 'out')),
  ...walk(path.join(root, 'docs/licenses')),
]
const packageFiles = sourceFiles.map((file) => {
  const packaged = asar.extractFile(asarPath, path.relative(root, file))
  assert.equal(hash(packaged), fileInfo(file).sha256, relative(file))
  return { path: relative(file), bytes: packaged.length, sha256: hash(packaged) }
})
const packagedMetadata = asar.extractFile(asarPath, 'package.json')
const expectedMetadata = { ...readJson(path.join(root, 'package.json')) }
delete expectedMetadata.scripts
delete expectedMetadata.devDependencies
assert.deepEqual(JSON.parse(packagedMetadata.toString('utf8')), expectedMetadata)
assert.equal(
  hash(packagedMetadata),
  hash(asar.extractFile(path.join(previous, 'win-unpacked/resources/app.asar'), 'package.json')),
)
const nativePath = 'node_modules/better-sqlite3/build/Release/better_sqlite3.node'
assert.deepEqual(
  fileInfo(path.join(trial, 'win-unpacked/resources/app.asar.unpacked', nativePath)),
  fileInfo(path.join(root, nativePath)),
)
const before = readJson(path.join(__dirname, 'before.json'))
const sourceBefore = before.filter((entry) => /^(src|tests|scripts)\//.test(entry.path))
const changed = sourceBefore
  .filter((entry) => fileInfo(path.join(root, entry.path)).sha256 !== entry.sha256.toLowerCase())
  .map((entry) => entry.path)
  .sort()
assert.deepEqual(changed, [
  'src/renderer/src/App.tsx',
  'src/renderer/src/components/BoardEntrance.tsx',
  'src/renderer/src/components/LearningOverview.tsx',
  'src/renderer/src/components/LearningRecords.tsx',
  'src/renderer/src/components/PracticePane.tsx',
  'src/renderer/src/components/SettingsPane.tsx',
  'src/renderer/src/styles/workbench-pages.css',
  'tests/e2e/board-entry.spec.ts',
  'tests/e2e/personal-bank.spec.ts',
  'tests/e2e/theme-helpers.ts',
])
const oldPaths = new Set(sourceBefore.map((entry) => entry.path))
const notInSnapshot = ['src', 'tests', 'scripts']
  .flatMap((directory) => walk(path.join(root, directory)))
  .map(relative)
  .filter((file) => !oldPaths.has(file))
  .sort()
const tracked = new Set(
  execFileSync('git', ['ls-files', '-z', '--', 'src', 'tests', 'scripts'], { cwd: root })
    .toString('utf8')
    .split('\0')
    .filter(Boolean),
)
const recoveredBaseline = notInSnapshot.filter((file) => tracked.has(file))
for (const file of recoveredBaseline)
  assert.equal(hash(execFileSync('git', ['show', `HEAD:${file}`], { cwd: root })), fileInfo(path.join(root, file)).sha256)
const added = notInSnapshot.filter((file) => !tracked.has(file))
assert.deepEqual(added, ['tests/e2e/ui-adaptive.spec.ts', 'tests/e2e/ui-feedback.spec.ts'])
for (const name of ['package.json', 'package-lock.json', 'electron-builder.yml'])
  assert.equal(
    fileInfo(path.join(root, name)).sha256,
    fileInfo(path.join(__dirname, 'before', name)).sha256,
  )
const manifest = readJson(path.join(previous, '题库来源清单.json'))
for (const entry of manifest.files) {
  const source = path.join(previous, '题库', path.basename(entry.file ?? entry.path))
  const target = path.join(trial, '题库', path.basename(entry.file ?? entry.path))
  assert.deepEqual(fileInfo(target), fileInfo(source))
}
const result = {
  build: '20261027.2-ui-adaptive',
  schema: 10,
  oldDeliveryFilesVerified: oldManifest.files.length,
  packageFiles,
  packageMetadataSha256: hash(packagedMetadata),
  nativeModule: fileInfo(path.join(root, nativePath)),
  changed,
  added,
  recoveredBaseline,
  unchanged: sourceBefore.length - changed.length,
  bankFilesVerified: manifest.files.length,
}
fs.writeFileSync(path.join(__dirname, 'artifact-verification.json'), JSON.stringify(result, null, 2))
process.stdout.write(JSON.stringify(result, null, 2) + '\n')
