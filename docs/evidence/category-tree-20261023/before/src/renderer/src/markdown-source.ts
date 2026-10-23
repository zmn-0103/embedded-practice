import { toMarkdown } from 'mdast-util-to-markdown'
import type { ContentBody } from '../../shared/contracts/library-desktop'

export function markdownWithDefinitions(body: ContentBody): string {
  const definitions = toMarkdown({
    type: 'root',
    children: body.definitions.map((definition) => ({
      type: 'definition' as const,
      ...definition,
    })),
  })
  // 放在正文之前，保持原完整文档的首定义优先，不被正文中的重复定义覆盖。
  return `${definitions}\n${body.markdown}`
}
