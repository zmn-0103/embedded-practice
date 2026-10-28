import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'
import { parseImagePath } from '../../../shared/contracts/image-path'
import type { ImageReference, ParseIssue } from '../../../shared/contracts/question-bank'
import { issueAt, type MarkdownDocument } from './markdown-document'

export function collectImageReferences(
  document: MarkdownDocument,
  children: Root['children'],
): { images: ImageReference[]; issues: ParseIssue[] } {
  const images: ImageReference[] = []
  const issues: ParseIssue[] = []
  const tree: Root = { type: 'root', children }

  visit(tree, (node) => {
    if (node.type !== 'image' && node.type !== 'imageReference') return
    const url =
      node.type === 'image'
        ? node.url
        : document.definitions.get(node.identifier.toUpperCase())?.url
    if (url === undefined || parseImagePath(url) === undefined) {
      issues.push(
        issueAt(
          document.fileName,
          'UNSUPPORTED_CONTENT',
          node,
          '图片必须引用 assets 目录内的 PNG、JPEG 或 WebP 文件，不支持远程、绝对、越界或带查询参数的路径。',
        ),
      )
      return
    }
    images.push({
      url,
      alt: node.alt ?? '',
      line: node.position?.start.line ?? 1,
      column: node.position?.start.column ?? 1,
    })
  })

  return { images, issues }
}
