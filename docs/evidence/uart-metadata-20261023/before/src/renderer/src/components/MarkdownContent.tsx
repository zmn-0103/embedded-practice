import { useMemo, useState } from 'react'
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ContentBody } from '../../../shared/contracts/library-desktop'
import { externalHttpUrl, imageResourceUrl } from '../../../shared/contracts/content-urls'
import { parseImagePath } from '../../../shared/contracts/image-path'
import { markdownWithDefinitions } from '../markdown-source'
import { CodeBlock } from './CodeBlock'
import { ResourceImage } from './ResourceImage'

export function MarkdownContent({ body, versionId }: { body: ContentBody; versionId: number }) {
  const [notice, setNotice] = useState('')
  // 保存状态更新不能重建组件类型，否则图片预览和代码复制状态会被卸载。
  const components = useMemo<Components>(() => {
    const images = new Map(
      body.imageBindings.flatMap((binding) => {
        const path = parseImagePath(binding.url)
        return path ? [[path.relativePath, binding.hash] as const] : []
      }),
    )
    return {
      pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
      th: ({ children, style }) => (
        <th
          className={
            style?.textAlign === 'center'
              ? 'align-center'
              : style?.textAlign === 'right'
                ? 'align-right'
                : undefined
          }
        >
          {children}
        </th>
      ),
      td: ({ children, style }) => (
        <td
          className={
            style?.textAlign === 'center'
              ? 'align-center'
              : style?.textAlign === 'right'
                ? 'align-right'
                : undefined
          }
        >
          {children}
        </td>
      ),
      img: ({ src, alt }) => {
        const path = src ? parseImagePath(src) : undefined
        const hash = path ? images.get(path.relativePath) : undefined
        return hash ? (
          <ResourceImage key={hash} src={imageResourceUrl(versionId, hash)} alt={alt ?? ''} />
        ) : (
          <span className="image-error">图片资源不可用：{alt}</span>
        )
      },
      a: ({ href, children }) => {
        const url = href ? externalHttpUrl(href) : undefined
        return url ? (
          <a
            href={url}
            onClick={(event) => {
              event.preventDefault()
              void window.desktop.library
                .openReference(url)
                .then((result) => {
                  if (!result.ok) setNotice(result.error.message)
                })
                .catch(() => setNotice('无法打开参考链接，请检查本地服务。'))
            }}
          >
            {children}
          </a>
        ) : (
          <span>{children}</span>
        )
      },
    }
  }, [body.imageBindings, versionId])
  return (
    <div className="markdown-content">
      <Markdown skipHtml remarkPlugins={[remarkGfm]} components={components}>
        {markdownWithDefinitions(body)}
      </Markdown>
      {notice && (
        <p className="error-message" aria-live="polite">
          {notice}
        </p>
      )}
    </div>
  )
}
