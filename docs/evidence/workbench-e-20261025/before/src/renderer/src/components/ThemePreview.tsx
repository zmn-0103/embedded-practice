import type { CSSProperties } from 'react'
import type { AppearanceSettings } from '../../../shared/contracts/settings'
import { themeVariables, type ThemeDefinition } from '../../../shared/contracts/themes'

export function themePreviewStyle(definition: ThemeDefinition, fontSize?: number): CSSProperties {
  return {
    ...themeVariables(definition),
    ...(fontSize ? { fontSize: `${fontSize}px` } : {}),
    fontFamily: 'var(--theme-font)',
  }
}

export function ThemePreview({
  definition,
  mode,
  fontSize,
  label = '显示设置局部预览',
}: {
  definition: ThemeDefinition
  mode: AppearanceSettings['theme']
  fontSize: number
  label?: string
}) {
  return (
    <aside
      className="appearance-preview"
      data-theme={mode}
      data-layout={definition.presentation.layout}
      aria-label={label}
      style={themePreviewStyle(definition, fontSize)}
    >
      <span className="preview-label">
        {definition.name} · {definition.presentation.layout === 'study' ? '学习工作区' : '经典布局'}
        预览
      </span>
      <div className="theme-demo">
        <div className="demo-sidebar" aria-label="导航预览">
          <span>板块</span>
          <strong>开始练习</strong>
          <span>题库</span>
          <span>学习记录</span>
        </div>
        <div className="demo-body">
          <h3>把思考留在题目旁</h3>
          <p>先回忆原理，再对照参考答案。清晰的文字与留白，让注意力回到内容。</p>
          <pre>
            <code>
              <span style={{ color: 'var(--code-keyword)' }}>uint8_t</span>
              {' received = '}
              <span style={{ color: 'var(--code-value)' }}>0</span>
              {';\n// 记录你的理解'}
            </code>
          </pre>
          <label className="demo-input-label">
            作答区
            <input aria-label="主题预览输入框" readOnly value="写下思考过程…" />
          </label>
          <button type="button" className="preview-action primary">
            查看参考答案（预览）
          </button>
          <p className="demo-error">错误提示预览：请保留输入并重试。</p>
        </div>
        <div className="demo-aux">
          <strong>题目属性</strong>
          <span>基础 · 通信协议</span>
          <span>本轮进度 1 / 20</span>
        </div>
      </div>
      <p className="muted">此处为演示内容，未应用到其他页面。</p>
    </aside>
  )
}
