import type { Heading } from 'mdast'
import {
  questionDifficultySchema,
  type ParseIssue,
  type QuestionDifficulty,
} from '../../../shared/contracts/question-bank'
import { sourceOffset, type MarkdownDocument } from './markdown-document'

export function readQuestionMetadata(
  document: MarkdownDocument,
  heading: Heading,
  bodyStart: number,
): { tags: string[]; difficulty: QuestionDifficulty; issues: ParseIssue[] } {
  const tags = new Set<string>()
  let difficulty: QuestionDifficulty = '未分级'
  const seen = new Set<string>()
  const issues: ParseIssue[] = []
  const source = document.source.slice(sourceOffset(heading, 'end'), bodyStart)
  const firstLine = heading.position?.end.line ?? 1

  for (const [index, originalLine] of source.split(/\r?\n/).entries()) {
    const line = originalLine.trim()
    if (line === '') continue
    const fail = (message: string): void => {
      issues.push({
        code: 'INVALID_QUESTION',
        fileName: document.fileName,
        line: firstLine + index,
        column: originalLine.length - originalLine.trimStart().length + 1,
        message,
      })
    }
    const match = /^(标签|难度)\s*[:：]\s*(.*)$/u.exec(line)
    if (!match) {
      fail('题目标题与“### 题目”之间只允许标签、难度及空行。')
      continue
    }
    const name = line.startsWith('标签') ? '标签' : '难度'
    const value = match[2]?.trim() ?? ''
    if (seen.has(name)) {
      fail(`${name}不能重复声明。`)
      continue
    }
    seen.add(name)
    if (name === '标签') {
      for (const tag of value.split(/[,，]/u)) {
        const normalized = tag.trim()
        if (normalized !== '') tags.add(normalized)
      }
    } else {
      const parsed = questionDifficultySchema.safeParse(value)
      if (parsed.success) difficulty = parsed.data
      else fail('难度仅允许“基础”“进阶”“综合”；省略时默认为“未分级”。')
    }
  }

  return { tags: [...tags], difficulty, issues }
}
