import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseQuestionBank } from '../../src/main/services/library/parse-question-bank'
import type { ParsedTopic } from '../../src/shared/contracts/question-bank'

const release = 'question-banks/releases/v000-20261024'
const before = 'docs/evidence/v000-personal-20261024/before'
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex')
const json = (path: string) => JSON.parse(readFileSync(resolve(path), 'utf8'))
const manifest = json(`${release}/全量题库清单.json`) as {
  files: {
    file: string
    topicId: string
    board: string
    count: number
    sha256: string
  }[]
  mappings: {
    sourceQuestionId: string
    topicId: string
    questionId: string
    questionSha256: string
    answerSha256: string
    difficulty: string
    tags: string[]
  }[]
}
function topic(path: string): ParsedTopic {
  const result = parseQuestionBank(readFileSync(resolve(path), 'utf8'), path)
  if (!result.ok) throw new Error(JSON.stringify(result.issues))
  return result.value
}
const topics = manifest.files.map((file) => topic(file.file))
const question = (topicId: string, questionId: string) =>
  topics
    .find((entry) => entry.topicId === topicId)
    ?.questions.find((q) => q.questionId === questionId)

describe('V0.0.0 全量个人题库', () => {
  it('生产解析器接受13份完整专题、419题且无身份冲突', () => {
    expect(topics).toHaveLength(13)
    expect(new Set(topics.map((entry) => entry.topicId)).size).toBe(13)
    expect(topics.reduce((sum, entry) => sum + entry.questions.length, 0)).toBe(419)
    for (const [index, entry] of topics.entries()) {
      const file = manifest.files[index]!
      expect(entry.topicId).toBe(file.topicId)
      expect(entry.questions).toHaveLength(file.count)
      expect(hash(readFileSync(file.file))).toBe(file.sha256)
      expect(new Set(entry.questions.map((q) => q.questionId)).size).toBe(file.count)
      for (const q of entry.questions) {
        expect(['基础', '进阶', '综合']).toContain(q.difficulty)
        expect(q.tags.length).toBeGreaterThan(0)
        expect(new Set(q.tags).size).toBe(q.tags.length)
      }
    }
  })

  it('8份原始快照逐字节保持，433个原题去向均对应实际题答和元数据', () => {
    const originals = json('question-banks/sources/general/原始资料清单.json')
    expect(originals.files).toHaveLength(8)
    for (const source of originals.files)
      expect(hash(readFileSync(resolve('question-banks/sources/general', source.snapshot)))).toBe(
        source.sha256,
      )
    const source = json('question-banks/sources/general/逐题处理清单.json')
    expect(manifest.mappings).toHaveLength(433)
    expect(new Set(manifest.mappings.map((m) => m.sourceQuestionId))).toEqual(
      new Set(source.questions.map((q: { sourceQuestionId: string }) => q.sourceQuestionId)),
    )
    for (const mapping of manifest.mappings) {
      const actual = question(mapping.topicId, mapping.questionId)!
      expect(actual, mapping.sourceQuestionId).toBeDefined()
      expect(hash(actual.questionMarkdown), mapping.sourceQuestionId).toBe(mapping.questionSha256)
      expect(hash(actual.answerMarkdown), mapping.sourceQuestionId).toBe(mapping.answerSha256)
      expect(actual.difficulty).toBe(mapping.difficulty)
      expect(actual.tags).toEqual(mapping.tags)
    }
  })

  it('GPIO78、UART30和通用10题的原组合身份均保留，十题原题答保持', () => {
    const oldFiles = manifest.files.filter(
      (file) =>
        ['stm32f103-gpio', 'm5-trial-uart-level-2'].includes(file.topicId) ||
        file.topicId.startsWith('general-'),
    )
    let count = 0
    for (const file of oldFiles) {
      const old = topic(`${before}/${file.file}`)
      count += old.questions.length
      for (const item of old.questions) {
        const actual = question(old.topicId, item.questionId)!
        expect(actual, `${old.topicId}/${item.questionId}`).toBeDefined()
        if (old.topicId.startsWith('general-')) {
          expect(actual.questionMarkdown).toBe(item.questionMarkdown)
          expect(actual.answerMarkdown).toBe(item.answerMarkdown)
        }
      }
    }
    expect(count).toBe(118)
    const mapping = manifest.mappings.find((m) => m.sourceQuestionId === 'uart-level2-040')!
    expect([mapping.topicId, mapping.questionId]).toEqual(['m5-trial-uart-level-2', 'uart2-040'])
  })
})
