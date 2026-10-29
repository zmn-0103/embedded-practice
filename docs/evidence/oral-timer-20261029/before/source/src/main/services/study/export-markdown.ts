import type { Definition, Link, Image } from 'mdast'
import { toMarkdown, type Options } from 'mdast-util-to-markdown'
import { toString } from 'mdast-util-to-string'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { visit, SKIP } from 'unist-util-visit'
import type { ContentBody } from '../../../shared/contracts/library-desktop'
import { externalHttpUrl } from '../../../shared/contracts/content-urls'
import { parseImagePath } from '../../../shared/contracts/image-path'
import { StudyFault } from '../../database/repositories/study-fault'

const processor = unified().use(remarkParse).use(remarkGfm).freeze()
export function markdownText(text: string) {
  return toMarkdown({
    type: 'root',
    children: [{ type: 'paragraph', children: [{ type: 'text', value: text }] }],
  }).trimEnd()
}
export function literalBlock(text: string) {
  let length = 3
  for (const match of text.matchAll(/`+/g)) length = Math.max(length, match[0].length + 1)
  const fence = '`'.repeat(length)
  return `${fence}text\n${text}${text.endsWith('\n') ? '' : '\n'}${fence}\n`
}
export function exportBody(body: ContentBody, imageUrl: (hash: string) => string) {
  const prefix = toMarkdown({
    type: 'root',
    children: body.definitions.map((definition) => ({
      type: 'definition' as const,
      ...definition,
    })),
  })
  const tree = processor.parse(`${prefix}\n${body.markdown}`)
  const definitions = new Map<string, Definition>()
  visit(tree, 'definition', (definition) => {
    const key = definition.identifier.toUpperCase()
    if (!definitions.has(key)) definitions.set(key, definition)
  })
  visit(tree, (node, index, parent) => {
    if (
      (node.type !== 'imageReference' && node.type !== 'linkReference') ||
      index === undefined ||
      !parent
    )
      return
    const definition = definitions.get(node.identifier.toUpperCase())
    if (!definition) throw new StudyFault('FILE_ERROR', '引用定义不完整，材料未导出。')
    const converted: Image | Link =
      node.type === 'imageReference'
        ? { type: 'image', url: definition.url, title: definition.title, alt: node.alt }
        : { type: 'link', url: definition.url, title: definition.title, children: node.children }
    parent.children[index] = converted
  })
  const images = new Map(
    body.imageBindings.map((binding) => [parseImagePath(binding.url)?.relativePath, binding.hash]),
  )
  visit(tree, 'image', (node) => {
    const parsed = parseImagePath(node.url),
      hash = parsed ? images.get(parsed.relativePath) : undefined
    if (!hash) throw new StudyFault('FILE_ERROR', '题目图片关联不完整，材料未导出。')
    node.url = imageUrl(hash)
  })
  visit(tree, (node, index, parent) => {
    if (index === undefined || !parent) return
    if (node.type === 'html' || node.type === 'definition') {
      parent.children.splice(index, 1)
      return [SKIP, index]
    }
    if (node.type === 'link') {
      const url = externalHttpUrl(node.url)
      if (url) node.url = url
      else {
        parent.children[index] = { type: 'text', value: toString(node) }
        return SKIP
      }
    }
  })
  const data = processor.data() as { toMarkdownExtensions?: Options['extensions'] }
  return toMarkdown(tree, { extensions: data.toMarkdownExtensions }).trimEnd()
}
