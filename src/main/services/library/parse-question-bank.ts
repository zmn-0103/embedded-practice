import { visit } from 'unist-util-visit'
import {
  MAX_IMPORT_QUESTIONS,
  type ParsedQuestion,
  type ParseIssue,
  type ParseTopicResult,
} from '../../../shared/contracts/question-bank'
import {
  issueAt,
  readMarkdownDocument,
  sourceOffset,
  type MarkdownDocument,
} from './markdown-document'
import { parseQuestion } from './parse-question'

function parseQuestions(document: MarkdownDocument): ParseTopicResult {
  const { children } = document.tree
  const headings = children.flatMap((node, index) =>
    node.type === 'heading' && node.depth === 2 ? [{ node, index }] : [],
  )
  const first = headings[0]
  if (first === undefined || headings.length > MAX_IMPORT_QUESTIONS) {
    return {
      ok: false,
      issues: [
        issueAt(
          document.fileName,
          first ? 'LIMIT_EXCEEDED' : 'INVALID_QUESTION',
          first?.node,
          first ? '单批题目不能超过 10,000 道。' : '专题至少需要一道以二级标题定义的题目。',
        ),
      ],
    }
  }

  const issues: ParseIssue[] = []
  for (const node of children.slice(1, first.index)) {
    if (node.type !== 'definition') {
      issues.push(
        issueAt(
          document.fileName,
          'INVALID_QUESTION',
          node,
          '专题文件头后应直接开始二级题目标题，不支持独立前言或额外标题。',
        ),
      )
    }
  }
  visit(document.tree, 'heading', (node, _index, parent) => {
    if (node.depth === 1 || (node.depth <= 3 && parent?.type !== 'root')) {
      issues.push(
        issueAt(
          document.fileName,
          'INVALID_QUESTION',
          node,
          '二级标题用于题目，三级标题用于分区；正文内部小标题须为四级及以下。',
        ),
      )
    }
  })

  const questions: ParsedQuestion[] = []
  const seen = new Map<string, number>()
  for (const [index, current] of headings.entries()) {
    const next = headings[index + 1]
    const heading = current.node
    const parsed = parseQuestion(
      document,
      heading,
      children.slice(current.index + 1, next?.index ?? children.length),
      next ? sourceOffset(next.node, 'start') : document.source.length,
    )
    if (!parsed.ok) {
      issues.push(...parsed.issues)
      continue
    }
    const previous = seen.get(parsed.value.questionId)
    if (previous !== undefined) {
      issues.push(
        issueAt(
          document.fileName,
          'DUPLICATE_ID',
          heading,
          `题目 ID“${parsed.value.questionId}”重复，首次出现在第 ${previous} 行。`,
        ),
      )
    }
    if (previous === undefined) seen.set(parsed.value.questionId, parsed.value.line)
    questions.push(parsed.value)
  }
  if (issues.length > 0) return { ok: false, issues }

  return {
    ok: true,
    value: {
      schemaVersion: document.metadata.schema_version,
      topicId: document.metadata.topic_id,
      topicTitle: document.metadata.topic_title,
      fileName: document.fileName,
      definitions: [...document.definitions.values()].map((definition) => ({
        identifier: definition.identifier,
        url: definition.url,
        title: definition.title ?? null,
      })),
      questions,
    },
  }
}

export function parseQuestionBank(input: string, fileName: string): ParseTopicResult {
  try {
    const document = readMarkdownDocument(input, fileName)
    return document.ok ? parseQuestions(document.value) : document
  } catch {
    return {
      ok: false,
      issues: [
        issueAt(
          fileName,
          'INVALID_QUESTION',
          undefined,
          'Markdown 解析未完成，请检查文件结构；本文件未产生导入数据。',
        ),
      ],
    }
  }
}
