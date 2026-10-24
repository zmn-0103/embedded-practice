import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { MAX_IMPORT_QUESTIONS } from '../../src/shared/contracts/question-bank'
import { parseQuestionBank } from '../../src/main/services/library/parse-question-bank'

const header = '---\nschema_version: 1\ntopic_id: structure-test\ntopic_title: 结构测试\n---\n\n'
const question = '## test-001 | 测试题\n\n### 题目\n\n完整题干。\n\n### 参考答案\n\n完整答案。\n'
const valid = header + question
const fixture = readFileSync('tests/fixtures/markdown/合法专题.md', 'utf8')

describe('Markdown 语法树分题与原文保留', () => {
  it('保留代码、表格、列表、四级标题，代码伪标题不会成为新题', () => {
    const result = parseQuestionBank(fixture, '合法专题.md')
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(JSON.stringify(result.issues))
    expect(result.value.questions.map((item) => item.questionId)).toEqual([
      'fixture-001',
      'fixture-002',
    ])
    const first = result.value.questions[0]
    expect(first?.title).toBe('代码、表格与图片 | 保留标题中的竖线')
    expect(first?.tags).toEqual(['GPIO', '代码'])
    expect(first?.questionMarkdown).toContain(
      '```c\n## fake-question | 这不是新题\n### 参考答案\n标签：代码里的标签',
    )
    expect(first?.questionMarkdown).toContain('const char *text = "<script>这只是代码</script>";')
    expect(first?.questionMarkdown).toContain('| PA8 | LED |')
    expect(first?.questionMarkdown).toContain('1. 外层列表\n   - 内层条件')
    expect(first?.answerMarkdown).toContain('#### 回答要点')
    expect(first?.images.map((image) => image.url)).toEqual([
      'assets/本地图片.PNG',
      'assets/接线图.webp',
    ])
    expect(result.value.questions[1]).toMatchObject({ tags: [], difficulty: '未分级' })
    expect(result.value.definitions).toEqual([
      { identifier: 'board', url: 'assets/接线图.webp', title: '测试接线图' },
    ])
  })

  it.each(['\n', '\r\n'])('支持 BOM 和换行 %j，保留首行代码缩进与行尾双空格', (newline) => {
    const questionBody = '    GPIOA->BSRR = GPIO_Pin_8;\n\n中文🙂  \n第二行'
    const answerBody = '解释。  \n\n```c\n  int value = 0;\n```'
    const source =
      '\uFEFF' +
      (
        header +
        `## test-001 | 原文测试\n\n### 题目\n\n${questionBody}\n\n### 参考答案\n\n${answerBody}\n\n`
      ).replaceAll('\n', newline)
    const result = parseQuestionBank(source, '原文.md')
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(JSON.stringify(result.issues))
    expect(result.value.questions[0]?.questionMarkdown).toBe(questionBody.replaceAll('\n', newline))
    expect(result.value.questions[0]?.answerMarkdown).toBe(answerBody.replaceAll('\n', newline))
    expect(result.value.questions[0]?.line).toBe(7)
  })

  it('接受 Markdown 标题的制表符分隔', () => {
    expect(parseQuestionBank(valid.replace('## test-001', '##\ttest-001'), '制表符.md').ok).toBe(
      true,
    )
  })

  it.each([
    ['没有题目', header],
    ['独立前言', header + '未归属任何题目的内容。\n\n' + question],
    ['一级标题', valid.replace('完整题干。', '# 错误层级\n\n正文。')],
    ['嵌套三级标题', valid.replace('完整题干。', '> ### 错误层级\n> 正文。')],
    ['嵌套二级标题', valid.replace('完整题干。', '> ## 错误层级\n> 正文。')],
    ['缺分隔符', valid.replace('test-001 | 测试题', 'test-001 测试题')],
    ['空 ID', valid.replace('test-001 | 测试题', '| 测试题')],
    ['非法 ID', valid.replace('test-001 | 测试题', 'GPIO_1 | 测试题')],
    ['空标题', valid.replace('test-001 | 测试题', 'test-001 |')],
    ['Setext 二级标题', valid.replace('## test-001 | 测试题', 'test-001 | 测试题\n---')],
    ['缺题干分区', valid.replace('### 题目\n', '')],
    ['缺答案分区', valid.replace('### 参考答案\n', '')],
    ['重复分区', valid + '\n### 参考答案\n\n第二份答案。'],
    ['未知三级标题', valid.replace('完整答案。', '完整答案。\n\n### 其他\n\n额外内容。')],
    ['顺序颠倒', header + '## test-001 | 错序\n\n### 参考答案\n\n答案。\n\n### 题目\n\n题目。'],
    ['空题干', valid.replace('完整题干。', '')],
    ['空答案', valid.replace('完整答案。', '')],
    ['题干只有小标题', valid.replace('完整题干。', '#### 只有标题')],
    ['答案只有分隔线', valid.replace('完整答案。', '---')],
    ['答案只有引用定义', valid.replace('完整答案。', '[ref]: https://example.com')],
    ['原始 HTML', valid.replace('完整题干。', '<div>不支持 HTML</div>')],
    ['嵌入脚本', valid.replace('完整答案。', '<script>alert(1)</script>')],
  ])('拒绝%s，失败结果不包含部分成功题库', (_name, source) => {
    const result = parseQuestionBank(source, '结构错误.md')
    expect(result.ok).toBe(false)
    expect(Object.hasOwn(result, 'value')).toBe(false)
    if (result.ok) throw new Error('无效结构未被拒绝。')
    expect(result.issues.length).toBeGreaterThan(0)
    expect(
      result.issues.every(
        (issue) => issue.fileName === '结构错误.md' && issue.line > 0 && issue.column > 0,
      ),
    ).toBe(true)
  })

  it('重复 ID 始终报告首次出现行，同时拒绝整个专题', () => {
    const result = parseQuestionBank(header + question.repeat(3), '重复.md')
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('重复 ID 未被拒绝。')
    const duplicates = result.issues.filter((issue) => issue.code === 'DUPLICATE_ID')
    expect(duplicates).toHaveLength(2)
    expect(duplicates.map((issue) => issue.line)).toEqual([16, 25])
    expect(duplicates.every((issue) => issue.message.includes('首次出现在第 7 行'))).toBe(true)
  })

  it('题目或答案变更、文件更名都不重新生成稳定 ID', () => {
    const before = parseQuestionBank(valid, '旧名.md')
    const after = parseQuestionBank(
      valid.replace('测试题', '新标题').replace('完整答案。', '补充后的答案。'),
      '新名.md',
    )
    expect(before).toMatchObject({
      ok: true,
      value: { topicId: 'structure-test', questions: [{ questionId: 'test-001' }] },
    })
    expect(after).toMatchObject({
      ok: true,
      value: {
        topicId: 'structure-test',
        questions: [{ questionId: 'test-001', title: '新标题', answerMarkdown: '补充后的答案。' }],
      },
    })
  })

  it('题量超过 10,000 时明确拒绝，不静默截断', () => {
    const source =
      header +
      Array.from({ length: MAX_IMPORT_QUESTIONS + 1 }, (_, index) =>
        question.replace('test-001', `test-${index}`),
      ).join('\n')
    expect(parseQuestionBank(source, '题量超限.md')).toMatchObject({
      ok: false,
      issues: [{ code: 'LIMIT_EXCEEDED' }],
    })
  }, 15_000)
})
