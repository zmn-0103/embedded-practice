import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { parseQuestionBank } from '../../src/main/services/library/parse-question-bank'

const sourceRoot = 'question-banks/sources/STM32F103RCT6-GPIO-'
const original = readFileSync(`${sourceRoot}原始自测题.txt`, 'utf8')
const mapping = z
  .array(
    z.object({
      id: z.string(),
      section: z.string(),
      indexInSection: z.number().int().positive(),
      question: z.string().min(1),
      originalAnswer: z.string().min(1),
      supplemented: z.boolean(),
    }),
  )
  .parse(JSON.parse(readFileSync(`${sourceRoot}题答对应.json`, 'utf8')) as unknown)
const parsed = parseQuestionBank(
  readFileSync('question-banks/STM32F103RCT6-GPIO阶段自测题.md', 'utf8'),
  'STM32F103RCT6-GPIO阶段自测题.md',
)
if (!parsed.ok) throw new Error(`真实题库未通过结构校验：${JSON.stringify(parsed.issues)}`)
const { questions } = parsed.value

// 这里只读取原始纯文本的七章段落，与应用 Markdown AST 解析器相互独立。
function originalEntries(paragraphs: string[]): { section: string; text: string }[] {
  const entries: { section: string; text: string }[] = []
  let section = ''
  for (const paragraph of paragraphs) {
    if (/^[一二三四五六七]、/u.test(paragraph)) section = paragraph
    else if (section !== '') entries.push({ section, text: paragraph })
  }
  return entries
}

describe('用户 GPIO 初始题库完整对应', () => {
  it('题答对应表与保留的原始纯文本逐条一致，七章均有覆盖', () => {
    const paragraphs = original
      .split(/\r?\n(?:[ \t]*\r?\n)+/u)
      .map((item) => item.trim())
      .filter(Boolean)
    const boundary = paragraphs.indexOf('参考答案')
    expect(boundary).toBeGreaterThan(0)
    const originalQuestions = originalEntries(paragraphs.slice(0, boundary))
    const originalAnswers = originalEntries(paragraphs.slice(boundary + 1))
    expect(mapping.map((item) => ({ section: item.section, text: item.question }))).toEqual(
      originalQuestions,
    )
    expect(mapping.map((item) => ({ section: item.section, text: item.originalAnswer }))).toEqual(
      originalAnswers,
    )
    expect(mapping).toHaveLength(78)
    const counts = new Map<string, number>()
    for (const item of mapping) {
      const next = (counts.get(item.section) ?? 0) + 1
      expect(item.indexInSection).toBe(next)
      counts.set(item.section, next)
    }
    expect([...counts.values()]).toEqual([10, 8, 12, 15, 13, 10, 10])
    expect(questions).toHaveLength(mapping.length)
    expect(parsed.value.topicId).toBe('stm32f103-gpio')
  })

  it.each(mapping)('$id 保留原题、原参考答案和章节条件', (item) => {
    const index = mapping.indexOf(item)
    const question = questions[index]
    expect(item.id).toBe(`gpio-${String(index + 1).padStart(3, '0')}`)
    expect(question?.questionId).toBe(item.id)
    expect(question?.title).toBe(item.question)
    expect(question?.questionMarkdown.replaceAll('\r\n', '\n').split('\n\n')[0]).toBe(item.question)
    expect(question?.answerMarkdown.replaceAll('\r\n', '\n').split('\n\n')[0]).toBe(
      item.originalAnswer,
    )
    expect(question?.tags).toEqual(['STM32F103RCT6', 'GPIO', item.section.split('、')[1]])
    expect(question?.difficulty).toBe(item.section === '五、寄存器推导题' ? '进阶' : '基础')
    if (item.supplemented) expect(question?.answerMarkdown).toContain('#### 补充说明')
  })

  it('硬件题显式注明接线来自用户，条件不泛化为全部 STM32F103 板卡', () => {
    for (const question of questions.slice(58, 68)) {
      expect(question.questionMarkdown).toContain('用户描述的 STM32F103RCT6 实验接线')
      expect(question.answerMarkdown).toContain('没有进行原理图核验或板上验证')
    }
    for (const id of [
      'gpio-061',
      'gpio-062',
      'gpio-063',
      'gpio-064',
      'gpio-066',
      'gpio-067',
      'gpio-068',
      'gpio-074',
    ]) {
      const body = questions.find((question) => question.questionId === id)?.questionMarkdown
      expect(body).toContain('LED0 接 PA8，低电平点亮')
      expect(body).toContain('KEY0 接 PC1，按下接地为低电平')
    }
  })

  it('结构体作用、位域进制与消抖约定有完整说明', () => {
    expect(questions[10]?.answerMarkdown).toContain('| GPIO_Pin |')
    expect(questions[10]?.answerMarkdown).toContain('| GPIO_Mode |')
    expect(questions[10]?.answerMarkdown).toContain('| GPIO_Speed |')
    for (const index of [26, 27, 28, 29, 45, 46, 47, 48, 49, 50, 51, 52]) {
      expect(questions[index]?.questionMarkdown).toContain('二进制')
    }
    expect(questions[72]?.answerMarkdown).toContain('这是本实验的处理约定')
    expect(questions[75]?.answerMarkdown).toContain('RTOS')
  })
})
