import { Children, isValidElement, useEffect, useMemo, useState, type ReactNode } from 'react'
import { common, createLowlight } from 'lowlight'
import armasm from 'highlight.js/lib/languages/armasm'

const highlighter = createLowlight(common)
highlighter.register({ armasm })
type Tokens = ReturnType<typeof highlighter.highlight>['children']
function renderTokens(nodes: Tokens): ReactNode {
  return nodes.map((node, index) => {
    if (node.type === 'text') return node.value
    if (node.type !== 'element' || node.tagName !== 'span') return null
    const classes = node.properties.className
    return (
      <span
        key={index}
        className={
          Array.isArray(classes)
            ? classes
                .filter((value) => typeof value === 'string' && /^[a-zA-Z0-9_-]+$/.test(value))
                .join(' ')
            : undefined
        }
      >
        {renderTokens(node.children)}
      </span>
    )
  })
}

export function CodeBlock({ children }: { children?: ReactNode }) {
  const child = Children.toArray(children)[0]
  const props = isValidElement<{ children?: ReactNode; className?: string }>(child)
    ? child.props
    : undefined
  const text = typeof props?.children === 'string' ? props.children : undefined
  const language = /(?:^|\s)language-([a-z0-9_+-]+)/i
    .exec(props?.className ?? '')?.[1]
    ?.toLowerCase()
  const [notice, setNotice] = useState('')
  useEffect(() => {
    setNotice('')
  }, [text])
  const highlighted = useMemo(() => {
    if (
      text === undefined ||
      text.length > 32_768 ||
      !language ||
      !highlighter.registered(language)
    )
      return text
    try {
      return renderTokens(highlighter.highlight(language, text).children)
    } catch {
      return text
    }
  }, [text, language])
  if (text === undefined) return <pre>{children}</pre>
  return (
    <div className="code-block">
      <div className="code-toolbar">
        <span>{language ?? '代码'}</span>
        <button
          type="button"
          onClick={() => {
            void window.desktop.library
              .copyCode(text)
              .then((result) => setNotice(result.ok ? '已复制' : result.error.message))
              .catch(() => setNotice('复制失败，请选择文字后手动复制。'))
          }}
        >
          复制代码
        </button>
        <span aria-live="polite">{notice}</span>
      </div>
      <pre>
        <code className={props?.className}>{highlighted}</code>
      </pre>
    </div>
  )
}
