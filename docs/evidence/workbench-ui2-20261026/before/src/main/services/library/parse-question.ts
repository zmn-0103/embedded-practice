import type { Heading, Root, RootContent } from 'mdast'
import { toString } from 'mdast-util-to-string'
import { EXIT, SKIP, visit } from 'unist-util-visit'
import {
  bankIdentifierSchema,
  type MarkdownReferenceDefinition,
  type ParsedQuestion,
  type ParseIssue,
} from '../../../shared/contracts/question-bank'
import { collectImageReferences } from './image-references'
import { issueAt, sourceOffset, type MarkdownDocument } from './markdown-document'
import { readQuestionMetadata } from './question-metadata'

type QuestionResult = { ok: true; value: ParsedQuestion } | { ok: false; issues: ParseIssue[] }

function usedDefinitions(
  document: MarkdownDocument,
  children: RootContent[],
): MarkdownReferenceDefinition[] {
  const used = new Set<string>()
  const tree: Root = { type: 'root', children }
  visit(tree, (node) => {
    if (node.type === 'imageReference' || node.type === 'linkReference') {
      used.add(node.identifier.toUpperCase())
    }
  })
  return [...used].sort().flatMap((identifier) => {
    const definition = document.definitions.get(identifier)
    return definition ? [{ identifier, url: definition.url, title: definition.title ?? null }] : []
  })
}

function hasBodyContent(children: RootContent[]): boolean {
  let found = false
  const tree: Root = { type: 'root', children }
  visit(tree, (node) => {
    if (node.type === 'heading' || node.type === 'definition') return SKIP
    if (
      ((node.type === 'text' || node.type === 'code' || node.type === 'inlineCode') &&
        node.value.trim() !== '') ||
      node.type === 'image' ||
      node.type === 'imageReference'
    ) {
      found = true
      return EXIT
    }
  })
  return found
}

function bodyMarkdown(source: string, start: number, end: number): string {
  // 只去掉分区边界的空行，保留代码缩进、正文换行及行尾双空格。
  return source
    .slice(start, end)
    .replace(/^(?:[ \t]*\r?\n)+/, '')
    .replace(/(?:\r?\n[ \t]*)+$/, '')
}

export function parseQuestion(
  document: MarkdownDocument,
  heading: Heading,
  children: RootContent[],
  end: number,
): QuestionResult {
  const issues: ParseIssue[] = []
  const titleText = toString(heading)
  const separator = titleText.indexOf('|')
  const questionId = separator < 0 ? '' : titleText.slice(0, separator).trim()
  const title = separator < 0 ? '' : titleText.slice(separator + 1).trim()
  const start = sourceOffset(heading, 'start')
  if (
    !/^##[ \t]$/.test(document.source.slice(start, start + 3)) ||
    !bankIdentifierSchema.safeParse(questionId).success ||
    title === ''
  ) {
    issues.push(
      issueAt(
        document.fileName,
        'INVALID_QUESTION',
        heading,
        '题目标题必须为“## question-id | 非空标题”，ID 只能包含小写字母、数字和连字符。',
      ),
    )
  }

  const sections = children.filter(
    (node): node is Heading => node.type === 'heading' && node.depth === 3,
  )
  const [question, answer] = sections
  if (
    sections.length !== 2 ||
    question === undefined ||
    answer === undefined ||
    toString(question) !== '题目' ||
    toString(answer) !== '参考答案'
  ) {
    issues.push(
      issueAt(
        document.fileName,
        'INVALID_QUESTION',
        sections[0] ?? heading,
        '每题必须依次包含一次“### 题目”和一次“### 参考答案”，其他内部小标题须为四级及以下。',
      ),
    )
    return { ok: false, issues }
  }

  const questionIndex = children.indexOf(question)
  const answerIndex = children.indexOf(answer)
  const questionNodes = children.slice(questionIndex + 1, answerIndex)
  const answerNodes = children.slice(answerIndex + 1)
  if (!hasBodyContent(questionNodes)) {
    issues.push(
      issueAt(
        document.fileName,
        'INVALID_QUESTION',
        question,
        '题目正文不能为空，也不能只包含标题、分隔线或引用定义。',
      ),
    )
  }
  if (!hasBodyContent(answerNodes)) {
    issues.push(
      issueAt(
        document.fileName,
        'INVALID_QUESTION',
        answer,
        '参考答案正文不能为空，也不能只包含标题、分隔线或引用定义。',
      ),
    )
  }
  const metadata = readQuestionMetadata(document, heading, sourceOffset(question, 'start'))
  const images = collectImageReferences(document, [...questionNodes, ...answerNodes])
  issues.push(...metadata.issues, ...images.issues)
  if (issues.length > 0) return { ok: false, issues }

  return {
    ok: true,
    value: {
      questionId,
      title,
      tags: metadata.tags,
      difficulty: metadata.difficulty,
      questionMarkdown: bodyMarkdown(
        document.source,
        sourceOffset(question, 'end'),
        sourceOffset(answer, 'start'),
      ),
      answerMarkdown: bodyMarkdown(document.source, sourceOffset(answer, 'end'), end),
      definitions: usedDefinitions(document, [...questionNodes, ...answerNodes]),
      images: images.images,
      line: heading.position?.start.line ?? 1,
    },
  }
}
