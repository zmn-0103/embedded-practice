import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseQuestionBank } from '../../src/main/services/library/parse-question-bank'
import type { ParsedTopic } from '../../src/shared/contracts/question-bank'

const folder = 'question-banks/releases/v003-20261030'
const manifest = JSON.parse(readFileSync(`${folder}/manifest.json`, 'utf8')) as {
  questionCount: number
  files: { file: string; topicId: string; count: number; sha256: string }[]
  sourceMappings: {
    file: string
    number: number
    targets: { topicId: string; questionId: string }[]
  }[]
}
const topics = manifest.files.map((file): ParsedTopic => {
  const markdown = readFileSync(file.file, 'utf8')
  const result = parseQuestionBank(markdown, file.file)
  if (!result.ok) throw new Error(JSON.stringify(result.issues))
  return result.value
})
const allQuestions = topics.flatMap((topic) => topic.questions)

describe('V0.0.3 库无关完整题库', () => {
  it('全部完整专题通过生产解析器，实际题数和文件内容与交付清单相符', () => {
    expect(allQuestions.length).toBe(manifest.questionCount)
    expect(new Set(topics.map((topic) => topic.topicId)).size).toBe(topics.length)
    for (const [index, topic] of topics.entries()) {
      const file = manifest.files[index]!
      expect(topic.topicId).toBe(file.topicId)
      expect(topic.questions.length).toBe(file.count)
      expect(createHash('sha256').update(readFileSync(file.file)).digest('hex')).toBe(file.sha256)
    }
  })

  it('随机练习题干不依赖原文件导航或库 API，芯片前提随题干提供', () => {
    for (const question of allQuestions) {
      expect(question.questionMarkdown).not.toMatch(/本开发板|上一题|前述|上文|\[\[/)
      expect(question.questionMarkdown).not.toMatch(
        /\b(?:HAL_\w+|GPIO_Init\w*|CAN_Init\w*|DMA_Init\w*|RCC_\w*Cmd|\w+_GetFlagStatus)\s*\(/,
      )
      if (question.tags.some((tag) => tag.startsWith('STM32F103')))
        expect(question.questionMarkdown).toMatch(/STM32F103(?:RCT6|C8T6)/)
      expect(question.answerMarkdown).toMatch(/https:\/\//)
    }
  })

  it('SPI 纯数据阶段的计算与 CAN 16 位过滤器的关键边界得到保留', () => {
    const source = manifest.sourceMappings.find(
      (item) => item.file === '80-SPI/00-通用知识/SPI 通用知识 自测题.md' && item.number === 15,
    )!
    expect(source).toBeDefined()
    const spiAnswers = source.targets
      .flatMap((target) =>
        topics
          .find((topic) => topic.topicId === target.topicId)!
          .questions.filter((question) => question.questionId === target.questionId),
      )
      .map((question) => question.answerMarkdown)
      .join('\n')
    expect(spiAnswers).toContain('256')
    const filter = topics
      .find((topic) => topic.topicId === 'stm32f103-can')!
      .questions.find((question) => question.questionId === 'can-r-010')!
    expect(filter.answerMarkdown).toContain('不能拼成同一扩展 ID')
  })
})
