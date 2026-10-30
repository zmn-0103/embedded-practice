import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import { toString } from 'mdast-util-to-string'
import { parse } from 'yaml'

// 汇总当前编辑稿与来源去向，不复制原库、不接触应用数据库。
const root = fileURLToPath(new URL('../', import.meta.url))
const folder = resolve(root, 'question-banks/releases/v003-20261030')
const sourceRoot = resolve(root, '../嵌入式软件开发学习')
const parser = unified().use(remarkParse).use(remarkFrontmatter, ['yaml'])
const hash = (value) => createHash('sha256').update(value).digest('hex')
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))
const key = (value) => `${value.topicId}/${value.questionId}`
const editors = await Promise.all(
  ['a', 'b', 'c', 'root'].map((group) => readJson(resolve(folder, `editorial-${group}.json`))),
)
const topics = editors.flatMap((editor) => editor.topics)
const sourceMappings = editors.flatMap((editor) => editor.sourceMappings)
const legacyMappings = editors.flatMap((editor) => editor.legacyMappings)
const files = []
const identities = new Set()
assert.equal(new Set(topics.map((topic) => topic.topicId)).size, topics.length)

for (const topic of topics) {
  const path = resolve(root, topic.file)
  assert.equal(dirname(path), resolve(folder, 'topics'), '输出专题必须位于本批 topics 目录')
  const markdown = await readFile(path, 'utf8')
  const document = parser.parse(markdown)
  const metadata = parse(document.children[0].value)
  assert.equal(metadata.schema_version, 1)
  assert.equal(metadata.topic_id, topic.topicId)
  assert.equal(metadata.topic_title, topic.title)
  const headings = document.children.filter((node) => node.type === 'heading' && node.depth === 2)
  assert(headings.length > 0, topic.file)
  const questions = headings.map((heading, index) => {
    const match = /^([a-z0-9-]+) \| (.+)$/.exec(toString(heading))
    assert(match, `${topic.file}: 非法题目标题`)
    const identity = `${topic.topicId}/${match[1]}`
    assert(!identities.has(identity), identity)
    identities.add(identity)
    const block = markdown.slice(
      heading.position.start.offset,
      headings[index + 1]?.position.start.offset ?? markdown.length,
    )
    const parts = parser
      .parse(block)
      .children.filter((node) => node.type === 'heading' && node.depth === 3)
    assert.deepEqual(
      parts.map((node) => toString(node)),
      ['题目', '参考答案'],
      identity,
    )
    const question = block
      .slice(parts[0].position.end.offset, parts[1].position.start.offset)
      .trim()
    const answer = block.slice(parts[1].position.end.offset).trim()
    assert(question && answer, identity)
    assert(!/\[\[|!\[\[/.test(block), `${identity}: 不允许残留 Obsidian 双链`)
    assert(
      !/\b(?:HAL_\w+|GPIO_Init\w*|CAN_Init\w*|DMA_Init\w*|RCC_\w*Cmd|\w+_GetFlagStatus)\s*\(/.test(
        question,
      ),
      `${identity}: 题干残留库 API`,
    )
    assert(!/本开发板|上一题|前述|上文/.test(question), `${identity}: 题干依赖外部上下文`)
    const difficulty = /^难度：(.+)$/m.exec(block)?.[1]
    const tags = /^标签：(.+)$/m
      .exec(block)?.[1]
      .split(/[,，]/)
      .map((tag) => tag.trim())
    assert(['基础', '进阶', '综合'].includes(difficulty), identity)
    assert(tags?.length && tags.every(Boolean) && new Set(tags).size === tags.length, identity)
    return {
      questionId: match[1],
      title: match[2],
      difficulty,
      tags,
      questionSha256: hash(question),
      answerSha256: hash(answer),
    }
  })
  files.push({ ...topic, count: questions.length, sha256: hash(markdown), questions })
}

const sources = []
const sourceKeys = new Set()
for (const theme of (await readdir(sourceRoot, { withFileTypes: true })).filter(
  (entry) => /^\d{2}-/.test(entry.name) && entry.name !== '99-模板',
)) {
  for (const layer of ['00-通用知识', '第一层-库函数', '第二层-寄存器']) {
    const directory = resolve(sourceRoot, theme.name, layer)
    const names = (await readdir(directory)).filter((name) => name.endsWith(' 自测题.md'))
    assert.equal(names.length, 1, directory)
    const path = resolve(directory, names[0])
    const markdown = await readFile(path, 'utf8')
    const file = relative(sourceRoot, path).replaceAll('\\', '/')
    const first = markdown.split(/^## 第一部分.*$/m)[1]?.split(/^## 第二部分.*$/m)[0]
    assert(first, `${file}: 无法定位题目区`)
    const numbers = [...first.matchAll(/^(\d+)\.\s+/gm)].map((match) => Number(match[1]))
    assert.equal(new Set(numbers).size, numbers.length, file)
    for (const number of numbers) sourceKeys.add(`${file}#${number}`)
    sources.push({ file, sha256: hash(markdown), count: numbers.length })
  }
}
assert.equal(sources.length, 30)
assert.equal(sourceKeys.size, 595)
assert.equal(sourceMappings.length, sourceKeys.size)
assert.equal(
  new Set(sourceMappings.map((item) => `${item.file}#${item.number}`)).size,
  sourceKeys.size,
)
for (const mapping of sourceMappings) {
  assert(sourceKeys.has(`${mapping.file}#${mapping.number}`), JSON.stringify(mapping))
  assert(['保留', '改写', '合并', '不纳入'].includes(mapping.action), JSON.stringify(mapping))
  assert(
    mapping.reason && (mapping.action === '不纳入' || mapping.targets.length),
    JSON.stringify(mapping),
  )
  for (const target of mapping.targets) assert(identities.has(key(target)), key(target))
}

const legacy = await readJson(
  resolve(root, 'question-banks/releases/v000-20261024/全量题库清单.json'),
)
const oldKeys = new Set(
  legacy.files.flatMap((file) => file.questions.map((q) => `${file.topicId}/${q.questionId}`)),
)
assert.equal(oldKeys.size, 419)
assert.equal(legacyMappings.length, oldKeys.size)
assert.equal(new Set(legacyMappings.map(key)).size, oldKeys.size)
for (const mapping of legacyMappings) {
  assert(oldKeys.has(key(mapping)), key(mapping))
  assert(['保留', '更新', '归档'].includes(mapping.action), key(mapping))
  assert(mapping.reason, key(mapping))
  assert.equal(
    identities.has(key(mapping)),
    mapping.action !== '归档',
    `${key(mapping)}: 归档与实际完整快照不符`,
  )
  for (const target of mapping.targets) assert(identities.has(key(target)), key(target))
}
for (const file of legacy.files)
  assert(
    topics.some((topic) => topic.topicId === file.topicId),
    `缺少旧专题完整快照：${file.topicId}`,
  )

files.sort(
  (a, b) => a.board.localeCompare(b.board, 'zh-CN') || a.title.localeCompare(b.title, 'zh-CN'),
)
const manifest = {
  bankVersion: 'bank-20261030.1-library-independent',
  sourceRoot,
  sourceFiles: sources,
  sourceCount: sourceKeys.size,
  topicCount: files.length,
  questionCount: identities.size,
  files,
  sourceMappings,
  legacyMappings,
  review: editors.flatMap((editor) => editor.review),
  limits: '来源和格式已核对；AI技术整理不替代用户逐题审阅、真实板卡和仪器验证。',
}
await writeFile(resolve(folder, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8')
const oldTitles = new Map()
for (const file of legacy.files) {
  const document = parser.parse(await readFile(resolve(root, file.file), 'utf8'))
  for (const node of document.children.filter(
    (item) => item.type === 'heading' && item.depth === 2,
  )) {
    const match = /^([a-z0-9-]+) \| (.+)$/.exec(toString(node))
    assert(match, file.file)
    oldTitles.set(`${file.topicId}/${match[1]}`, match[2])
  }
}
const archived = legacyMappings.filter((item) => item.action === '归档')
const tableCell = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ')
const archiveRows = (items) =>
  items
    .map((item) => {
      const targets =
        item.targets
          .map((target) => {
            const file = files.find((candidate) => candidate.topicId === target.topicId)
            const question = file.questions.find(
              (candidate) => candidate.questionId === target.questionId,
            )
            return `[${tableCell(question.title)}](${relative(folder, resolve(root, file.file)).replaceAll('\\', '/')})（${key(target)}）`
          })
          .join('；') || '本版不单独收录'
      return `| ${tableCell(oldTitles.get(key(item)))} | ${key(item)} | ${targets} | ${tableCell(item.reason)} |`
    })
    .join('\n')
await writeFile(
  resolve(folder, '旧题归档对照.md'),
  `# 276道旧题归档对照\n\n旧419题中143题沿用身份更新，276题归档；其中${archived.filter((item) => item.targets.length).length}题已有新版对应考点，${archived.filter((item) => !item.targets.length).length}题不再单独收录。归档只停止参加新练习，保留旧题、收藏、历史作答与原轮版本；不自动把旧自评转为新题掌握。另新增239个身份，当前23专题382道活动题。\n\n` +
    `## 不再单独收录的旧题\n\n| 旧题标题 | 旧身份 | 新版去向 | 原因 |\n| --- | --- | --- | --- |\n${archiveRows(archived.filter((item) => !item.targets.length))}\n\n` +
    `## 已有新版对应考点的旧题\n\n| 旧题标题 | 旧身份 | 新版去向 | 原因 |\n| --- | --- | --- | --- |\n${archiveRows(archived.filter((item) => item.targets.length))}\n`,
  'utf8',
)
const rows = files
  .map(
    (file) =>
      `| ${file.board} | [${file.title}](${relative(folder, resolve(root, file.file)).replaceAll('\\', '/')}) | ${file.count} |`,
  )
  .join('\n')
const disposition = (items) =>
  Object.fromEntries(
    [...new Set(items.map((item) => item.action))].map((action) => [
      action,
      items.filter((item) => item.action === action).length,
    ]),
  )
await writeFile(
  resolve(folder, 'README.md'),
  `# V0.0.3 库无关嵌入式题库\n\n题库版本：${manifest.bankVersion}。全量处理10主题30份自测资料的595个源编号，整理为 **${files.length}专题、${identities.size}题**；逐条来源和旧419身份去向见[manifest.json](manifest.json)，可阅读[276道旧题归档对照](旧题归档对照.md)。原始学习笔记未修改，不复制原始资料或生成备份。\n\n` +
    `每个 topics/*.md 都是完整专题快照，一次选择全部${files.length}份导入；不要选择说明或 editorial JSON。相同考点保留身份，API与重复题归档，旧历史和收藏继续保留，原活动轮使用原版本。旧13专题均有完整快照，不能把局部题目文件覆盖旧专题。\n\n` +
    `| 推荐板块 | 完整专题 | 题数 |\n| --- | --- | ---: |\n${rows}\n\n` +
    `源条目去向：${JSON.stringify(disposition(sourceMappings))}；旧题身份处理：${JSON.stringify(disposition(legacyMappings))}。合并是多来源指向同一主要考点，不代表原题无说明丢弃。\n\n` +
    `题库以概念、原因、边界和轻量情境分析为主。芯片题在题干写明型号/外设，器件题明确器件与时序前提；不要求背诵HAL/SPL函数或结构体成员。寄存器位域计算给定必要布局；参考答案区提供核心回答、要点、易混点和来源。\n\n` +
    `来源保持理论整理边界；技术资料、AI核对、格式与程序运行分别证明对应事实，未代签用户逐题技术审阅、实验和硬件验证。软件仍离线、自评，不自动判分。\n`,
  'utf8',
)
console.log(
  JSON.stringify({
    topics: files.length,
    questions: identities.size,
    sources: sourceKeys.size,
    legacy: oldKeys.size,
    sourceDisposition: disposition(sourceMappings),
    legacyDisposition: disposition(legacyMappings),
  }),
)
