import { describe, expect, it } from 'vitest'
import { MAX_MARKDOWN_BYTES } from '../../src/shared/contracts/question-bank'
import { parseQuestionBank } from '../../src/main/services/library/parse-question-bank'

const valid = [
  '---',
  'schema_version: 1',
  'topic_id: fixture-gpio',
  'topic_title: 测试专题',
  '---',
  '',
  '## fixture-001 | 测试题',
  '',
  '### 题目',
  '',
  '完整题干。',
  '',
  '### 参考答案',
  '',
  '完整答案。',
].join('\n')

describe('专题文件头与题目元数据', () => {
  it('返回完整专题，省略标签与难度时使用规定的默认值', () => {
    const result = parseQuestionBank(valid, '中文题库.md')
    expect(result).toMatchObject({
      ok: true,
      value: {
        schemaVersion: 1,
        topicId: 'fixture-gpio',
        topicTitle: '测试专题',
        fileName: '中文题库.md',
        questions: [{ questionId: 'fixture-001', tags: [], difficulty: '未分级' }],
      },
    })
  })

  it.each([
    ['缺文件头', valid.slice(valid.indexOf('##'))],
    ['未知版本', valid.replace('schema_version: 1', 'schema_version: 2')],
    ['字符串版本', valid.replace('schema_version: 1', 'schema_version: "1"')],
    ['缺版本', valid.replace('schema_version: 1\n', '')],
    ['缺专题 ID', valid.replace('topic_id: fixture-gpio\n', '')],
    ['非法专题 ID', valid.replace('fixture-gpio', 'GPIO_test')],
    ['缺专题标题', valid.replace('topic_title: 测试专题\n', '')],
    ['空白标题', valid.replace('topic_title: 测试专题', 'topic_title: "   "')],
    ['非字符串标题', valid.replace('topic_title: 测试专题', 'topic_title: 123')],
    ['重复 YAML 键', valid.replace('schema_version: 1', 'schema_version: 1\nschema_version: 1')],
    ['无效 YAML', valid.replace('topic_title: 测试专题', 'topic_title: [未闭合')],
    [
      '别名引用',
      valid.replace('topic_title: 测试专题', 'topic_title: &title 测试专题\nextra: *title'),
    ],
    [
      '非映射文件头',
      valid.replace(/schema_version: 1\ntopic_id: fixture-gpio\ntopic_title: 测试专题/u, '- 列表'),
    ],
  ])('拒绝%s，并返回文件名、位置与原因', (_name, source) => {
    const result = parseQuestionBank(source, '错误专题.md')
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('应当拒绝文件头。')
    expect(Object.hasOwn(result, 'value')).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
    for (const issue of result.issues) {
      expect(issue.code).toBe('INVALID_METADATA')
      expect(issue.fileName).toBe('错误专题.md')
      expect(issue.line).toBeGreaterThanOrEqual(1)
      expect(issue.column).toBeGreaterThanOrEqual(1)
      expect(issue.message.length).toBeGreaterThan(0)
    }
  })

  it('准确定位重复 YAML 键的原始行', () => {
    const source = valid.replace(
      'topic_title: 测试专题',
      'topic_title: 测试专题\ntopic_title: 重复',
    )
    const result = parseQuestionBank(source, '定位.md')
    expect(result).toMatchObject({ ok: false, issues: [{ line: 5, column: 1 }] })
  })

  it('接受中文逗号、英文冒号并合并重复标签', () => {
    const source = valid.replace('### 题目', '标签: GPIO, STM32，GPIO\n难度：综合\n\n### 题目')
    const result = parseQuestionBank(source, '标签.md')
    expect(result).toMatchObject({
      ok: true,
      value: { questions: [{ tags: ['GPIO', 'STM32'], difficulty: '综合' }] },
    })
  })

  it.each([
    '难度：简单',
    '难度：未分级',
    '难度：',
    '难度：基础\n难度：基础',
    '标签：GPIO\n标签：GPIO',
    '额外前言',
  ])('拒绝无效或重复的元数据：%s', (metadata) => {
    const result = parseQuestionBank(
      valid.replace('### 题目', `${metadata}\n\n### 题目`),
      '元数据.md',
    )
    expect(result).toMatchObject({
      ok: false,
      issues: [expect.objectContaining({ code: 'INVALID_QUESTION', line: expect.any(Number) })],
    })
  })

  it('无效难度定位到该行，而不是题目标题', () => {
    const result = parseQuestionBank(valid.replace('### 题目', '难度：简单\n\n### 题目'), '难度.md')
    expect(result).toMatchObject({ ok: false, issues: [{ line: 9, column: 1 }] })
  })

  it('按 UTF-8 字节而不是字符数检查 20MiB 限制', () => {
    const source = '中'.repeat(Math.floor(MAX_MARKDOWN_BYTES / 3) + 1)
    expect(source.length).toBeLessThan(MAX_MARKDOWN_BYTES)
    expect(parseQuestionBank(source, '超限.md')).toMatchObject({
      ok: false,
      issues: [{ code: 'LIMIT_EXCEEDED', fileName: '超限.md', line: 1 }],
    })
  })
})
