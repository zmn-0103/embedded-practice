import { Buffer } from 'node:buffer'
import type { Definition, Nodes, Root } from 'mdast'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { isMap, isScalar, LineCounter, parseDocument } from 'yaml'
import type { z } from 'zod'
import {
  MAX_MARKDOWN_BYTES,
  topicMetadataSchema,
  type ParseIssue,
} from '../../../shared/contracts/question-bank'

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkFrontmatter, ['yaml'])
  .freeze()

export interface MarkdownDocument {
  readonly source: string
  readonly fileName: string
  readonly tree: Root
  readonly metadata: z.infer<typeof topicMetadataSchema>
  readonly definitions: ReadonlyMap<string, Definition>
}

type DocumentResult = { ok: true; value: MarkdownDocument } | { ok: false; issues: ParseIssue[] }

export function issueAt(
  fileName: string,
  code: ParseIssue['code'],
  node: Nodes | undefined,
  message: string,
): ParseIssue {
  return {
    code,
    fileName,
    line: node?.position?.start.line ?? 1,
    column: node?.position?.start.column ?? 1,
    message,
  }
}

export function sourceOffset(node: Nodes, edge: 'start' | 'end'): number {
  const offset = node.position?.[edge].offset
  if (offset === undefined) throw new Error('Markdown 节点缺少原文位置。')
  return offset
}

export function readMarkdownDocument(input: string, fileName: string): DocumentResult {
  if (Buffer.byteLength(input, 'utf8') > MAX_MARKDOWN_BYTES) {
    return {
      ok: false,
      issues: [
        issueAt(fileName, 'LIMIT_EXCEEDED', undefined, '单个 Markdown 文件不能超过 20MiB。'),
      ],
    }
  }

  const source = input.startsWith('\uFEFF') ? input.slice(1) : input
  const tree = processor.parse(source)
  const header = tree.children[0]
  if (header?.type !== 'yaml') {
    return {
      ok: false,
      issues: [issueAt(fileName, 'INVALID_METADATA', header, '文件必须以 YAML 专题文件头开始。')],
    }
  }

  const lines = new LineCounter()
  const yaml = parseDocument(header.value, {
    lineCounter: lines,
    uniqueKeys: true,
    prettyErrors: false,
  })
  const headerLine = header.position?.start.line ?? 1
  const yamlIssues = [...yaml.errors, ...yaml.warnings].map((error): ParseIssue => {
    const location = lines.linePos(error.pos[0])
    return {
      code: 'INVALID_METADATA',
      fileName,
      line: headerLine + location.line,
      column: location.col,
      message: `YAML 文件头无效：${error.message}`,
    }
  })
  if (yamlIssues.length > 0) return { ok: false, issues: yamlIssues }

  let value: unknown
  try {
    // V1 文件头不需要别名展开，阻止别名放大内存占用。
    value = yaml.toJS({ maxAliasCount: 0 })
  } catch {
    return {
      ok: false,
      issues: [issueAt(fileName, 'INVALID_METADATA', header, 'YAML 文件头不支持别名引用。')],
    }
  }

  const metadata = topicMetadataSchema.safeParse(value)
  if (!metadata.success) {
    const descriptions: Record<string, string> = {
      schema_version: 'schema_version 必填且必须为数值 1，不支持其他格式版本。',
      topic_id: 'topic_id 必填，且只能包含小写字母、数字和连字符。',
      topic_title: 'topic_title 必填且不能是空白。',
    }
    return {
      ok: false,
      issues: metadata.error.issues.map((error) => {
        const field = String(error.path[0] ?? '')
        const key = isMap(yaml.contents)
          ? yaml.contents.items.find((item) => isScalar(item.key) && item.key.value === field)?.key
          : undefined
        const location = lines.linePos(isScalar(key) ? (key.range?.[0] ?? 0) : 0)
        return {
          code: 'INVALID_METADATA',
          fileName,
          line: headerLine + location.line,
          column: location.col,
          message: descriptions[field] ?? 'YAML 文件头必须是包含专题字段的映射。',
        }
      }),
    }
  }

  const issues: ParseIssue[] = []
  visit(tree, 'html', (node) => {
    issues.push(issueAt(fileName, 'UNSUPPORTED_CONTENT', node, 'V1 不支持原始 HTML 或嵌入脚本。'))
  })
  if (issues.length > 0) return { ok: false, issues }

  const definitions = new Map<string, Definition>()
  visit(tree, 'definition', (node) => {
    const identifier = node.identifier.toUpperCase()
    if (!definitions.has(identifier)) definitions.set(identifier, node)
  })

  return { ok: true, value: { source, fileName, tree, metadata: metadata.data, definitions } }
}
