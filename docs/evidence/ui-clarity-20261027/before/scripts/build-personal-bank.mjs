import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import { toString } from 'mdast-util-to-string'
import { parse } from 'yaml'

// 只重建明确列出的题库与本批清单，不访问应用数据库，不修改原始快照。
const root = fileURLToPath(new URL('../', import.meta.url))
const folder = resolve(root, 'question-banks/releases/v000-20261024')
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'))
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const parser = unified().use(remarkParse).use(remarkFrontmatter, ['yaml'])
const sources = await readJson('question-banks/sources/general/逐题处理清单.json')
const originals = await readJson('question-banks/sources/general/原始资料清单.json')
const sampleMapping = await readJson('question-banks/sources/general/样题来源映射.json')
const config = await readJson('question-banks/releases/v000-20261024/专题配置.json')
assert.equal(sources.questions.length, 433)
assert.equal(originals.files.length, 8)
assert.equal(new Set(sources.questions.map((q) => q.sourceQuestionId)).size, 433)
for (const source of originals.files) {
  const bytes = await readFile(resolve(root, 'question-banks/sources/general', source.snapshot))
  assert.equal(hash(bytes), source.sha256, source.sourceId)
}

function readTopic(markdown) {
  const tree = parser.parse(markdown)
  const meta = parse(tree.children.find((node) => node.type === 'yaml').value)
  const headings = tree.children.filter((node) => node.type === 'heading' && node.depth === 2)
  const questions = headings.map((heading, index) => {
    const title = toString(heading)
    const match = /^([a-z0-9-]+) \| (.+)$/.exec(title)
    assert(match, title)
    const block = markdown
      .slice(
        heading.position.start.offset,
        headings[index + 1]?.position.start.offset ?? markdown.length,
      )
      .trim()
    const parts = parser
      .parse(block)
      .children.filter((node) => node.type === 'heading' && node.depth === 3)
    assert.deepEqual(
      parts.map((node) => toString(node)),
      ['题目', '参考答案'],
      match[1],
    )
    const q = block.slice(parts[0].position.end.offset, parts[1].position.start.offset).trim()
    const answer = block.slice(parts[1].position.end.offset).trim()
    assert(q && answer, match[1])
    const difficulty = /^难度：(.+)$/m.exec(block)?.[1]
    const tags = /^标签：(.+)$/m
      .exec(block)?.[1]
      .split(/[,，]/)
      .map((tag) => tag.trim())
    assert(difficulty && tags?.length, match[1])
    return {
      id: match[1],
      block,
      difficulty,
      tags,
      questionSha256: hash(q),
      answerSha256: hash(answer),
    }
  })
  return { meta, questions }
}

function questionText(original) {
  let text = original.trim().replace(/\n\s*---\s*$/, '')
  text = text
    .replace(/^#{1,3}\s+第\s*\d+\s*题[：:]?\s*/, '')
    .replace(/^#{1,3}\s+\d+[.、]\s*/, '')
    .replace(/^\*\*(?:第\s*)?\d+\s*(?:题[：:]?|[.、])\s*/, '')
    .replace(/^\d+[.、]\s*/, '')
    .replace(/^\*\*\s+/, '')
  const firstLineEnd = text.indexOf('\n')
  if (firstLineEnd < 0) text = text.replace(/\*\*$/, '')
  else text = text.slice(0, firstLineEnd).replace(/\*\*$/, '') + text.slice(firstLineEnd)
  // 原笔记的小节提升到四级，避免与导入格式的固定分区冲突。
  return text.replace(/^#{1,3}\s+/gm, '#### ').trim()
}

const buckets = new Map()
for (const topic of config.topics) {
  assert(!buckets.has(topic.key), topic.key)
  const questions = new Map()
  if (topic.baseFile) {
    const old = readTopic(await readFile(resolve(root, topic.baseFile), 'utf8'))
    assert.equal(old.meta.topic_id, topic.topicId)
    for (const item of old.questions) questions.set(item.id, item)
  }
  buckets.set(topic.key, { topic, questions })
}
const mappings = []
const covered = new Set()
for (const source of originals.files) {
  // 每行：原题号、专题键、难度、标题、知识点标签、核心结论、必要解释。
  const rows = await readJson(
    `question-banks/releases/v000-20261024/editorial/${source.sourceId}.json`,
  )
  assert.equal(rows.length, source.questionCount, source.sourceId)
  for (const row of rows) {
    assert.equal(row.length, 7, `${source.sourceId}: ${row[0]}`)
    const [number, key, difficulty, title, tags, conclusion, explanation] = row
    assert(
      Number.isInteger(number) && number >= 1 && number <= source.questionCount,
      `${source.sourceId}: 非法原题号`,
    )
    const sourceQuestionId = `${source.sourceId}-${String(number).padStart(3, '0')}`
    assert(!covered.has(sourceQuestionId), sourceQuestionId)
    covered.add(sourceQuestionId)
    const original = sources.questions.find((q) => q.sourceQuestionId === sourceQuestionId)
    assert(original, sourceQuestionId)
    const merge = config.merges[sourceQuestionId]
    const bucket = buckets.get(merge?.topicKey ?? key)
    assert(bucket, key)
    assert(['基础', '进阶', '综合'].includes(difficulty), sourceQuestionId)
    assert(title && conclusion && explanation && tags.length > 0, sourceQuestionId)
    assert.equal(new Set(tags).size, tags.length, sourceQuestionId)
    const questionId =
      merge?.questionId ??
      config.identityOverrides[sourceQuestionId] ??
      `${config.prefixes[source.sourceId]}-${String(number).padStart(3, '0')}`
    let question =
      config.questionOverrides[sourceQuestionId] ?? questionText(original.originalQuestionMarkdown)
    if (bucket.topic.questionContext) question = `${bucket.topic.questionContext}\n\n${question}`
    const pending = config.pending[sourceQuestionId]
    const answer =
      `**核心结论：** ${conclusion}\n\n**必要解释：** ${explanation}\n\n` +
      `**适用条件与依据：** ${bucket.topic.conditions}\n\n` +
      bucket.topic.references.map((ref) => `[${ref.title}](${ref.url})`).join('；') +
      '。' +
      (pending ? `\n\n**待核实：** ${pending}` : '')
    const block =
      `## ${questionId} | ${title}\n\n标签：${tags.join(', ')}\n难度：${difficulty}\n\n` +
      `### 题目\n\n${question}\n\n### 参考答案\n\n${answer}`
    if (!merge) bucket.questions.set(questionId, { id: questionId, block })
    mappings.push({
      sourceQuestionId,
      sourceId: source.sourceId,
      number,
      originalQuestionSha256: original.questionSha256,
      originalLines: [original.startLine, original.endLine],
      topicId: bucket.topic.topicId,
      questionId,
      board: bucket.topic.board,
      difficulty,
      tags,
      disposition: merge
        ? `合并同考点：${merge.reason}`
        : config.identityOverrides[sourceQuestionId]
          ? '优化已有题目，保留身份'
          : '整理原考点并补充条件与解释',
      technicalReview: '已按列明依据作AI内容核对；用户审阅与硬件验证未完成',
      pending: config.pending[sourceQuestionId] ?? null,
    })
  }
}
assert.equal(covered.size, 433)
const files = []
for (const { topic, questions } of buckets.values()) {
  const markdown =
    `---\nschema_version: 1\ntopic_id: ${topic.topicId}\ntopic_title: ${topic.title}\n---\n\n` +
    [...questions.values()].map((item) => item.block).join('\n\n') +
    '\n'
  const actual = readTopic(markdown)
  assert.equal(actual.questions.length, questions.size, topic.key)
  assert.equal(new Set(actual.questions.map((item) => item.id)).size, questions.size, topic.key)
  for (const item of actual.questions) {
    for (const mapping of mappings.filter(
      (m) => m.topicId === topic.topicId && m.questionId === item.id,
    )) {
      mapping.questionSha256 = item.questionSha256
      mapping.answerSha256 = item.answerSha256
      mapping.difficulty = item.difficulty
      mapping.tags = item.tags
    }
  }
  const path = resolve(root, topic.file)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, markdown, 'utf8')
  files.push({
    file: topic.file,
    topicId: topic.topicId,
    board: topic.board,
    count: questions.size,
    sha256: hash(markdown),
    questions: actual.questions.map(({ id, difficulty, tags, questionSha256, answerSha256 }) => ({
      questionId: id,
      difficulty,
      tags,
      questionSha256,
      answerSha256,
    })),
  })
}
for (const mapping of mappings) {
  assert(
    mapping.questionSha256 && mapping.answerSha256,
    `来源题没有实际落地结果：${mapping.sourceQuestionId}`,
  )
}
// 十道既有样题的多来源关系继续保留，不能把它们当作额外原题。
const manifest = {
  bankVersion: config.bankVersion,
  sourceCount: 8,
  originalQuestionCount: 433,
  sources: originals.files,
  coverageCount: mappings.length,
  finalQuestionCount: files.reduce((sum, file) => sum + file.count, 0),
  reviewBoundary: '个人测试候选题库；保留逐题待核实及用户审阅边界，不是硬件验收。',
  files,
  mappings,
  existingSampleRelations: sampleMapping.questions,
}
await writeFile(resolve(folder, '全量题库清单.json'), JSON.stringify(manifest, null, 2) + '\n')
const rows = mappings.map(
  (m) =>
    `| ${m.sourceQuestionId} | ${m.topicId} / ${m.questionId} | ` +
    `${m.board} | ${m.difficulty} | ${m.disposition}${m.pending ? `；待核实：${m.pending}` : ''} |`,
)
await writeFile(
  resolve(folder, '433题最终去向.md'),
  '# 433道原题最终去向\n\n' +
    `题库版本 ${config.bankVersion}；${mappings.length}/433 道原题均有结果；` +
    `最终 ${manifest.finalQuestionCount} 题（含保留的10道通用样题）。完整专题快照见同目录清单。\n\n` +
    '| 原题身份 | 最终专题 / 题目身份 | 板块 | 难度 | 处理说明 |\n|---|---|---|---|---|\n' +
    rows.join('\n') +
    '\n',
)
console.log(
  JSON.stringify({
    sourceCount: 8,
    coverage: covered.size,
    topics: files.length,
    questions: manifest.finalQuestionCount,
  }),
)
