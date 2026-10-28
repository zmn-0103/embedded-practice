import { describe, expect, it } from 'vitest'
import { parseQuestionBank } from '../../src/main/services/library/parse-question-bank'

function topic(body: string): string {
  return `---
schema_version: 1
topic_id: image-test
topic_title: 图片测试
---

## image-001 | 图片引用

### 题目

${body}

### 参考答案

完整答案。
`
}

describe('图片引用静态检查', () => {
  it.each(['assets/中文图.png', 'assets/子目录/图.JPEG', 'assets/encoded%20name.webp'])(
    '接受受支持的本地引用 %s，但不读取源文件',
    (url) => {
      expect(parseQuestionBank(topic(`![说明](${url})`), '不存在的目录/题库.md')).toMatchObject({
        ok: true,
        value: { questions: [{ images: [{ url, alt: '说明', line: 11, column: 1 }] }] },
      })
    },
  )

  it.each([
    'https://example.com/image.png',
    '//example.com/image.png',
    '/assets/image.png',
    'C:/assets/image.png',
    'data:image/png;base64,AAAA',
    'assets/../outside.png',
    'assets/%2e%2e/outside.png',
    'assets/%2E%2E%2Foutside.png',
    'assets/..%20/outside.png',
    'assets/folder./image.png',
    'assets/%5coutside.png',
    'assets/image.svg',
    'assets/image.png?size=10',
    'assets/image.png#fragment',
    'assets/image%3Fname.png',
    'assets/image%00.png',
    'assets/image%ZZ.png',
    'assets//image.png',
    '../assets/image.png',
  ])('拒绝不受支持的引用 %s，并定位到图片行', (url) => {
    const result = parseQuestionBank(topic(`![说明](${url})`), '图片错误.md')
    expect(result).toMatchObject({
      ok: false,
      issues: [{ code: 'UNSUPPORTED_CONTENT', fileName: '图片错误.md', line: 11, column: 1 }],
    })
    expect(Object.hasOwn(result, 'value')).toBe(false)
  })

  it('引用式图片使用首个定义，并按 Markdown 规则忽略标识大小写', () => {
    const body = '![接线][BoArD]\n\n[board]: assets/接线.png\n[BOARD]: assets/第二定义.svg'
    expect(parseQuestionBank(topic(body), '引用.md')).toMatchObject({
      ok: true,
      value: { questions: [{ images: [{ url: 'assets/接线.png' }] }] },
    })
  })

  it('对引用式远程图片应用相同限制', () => {
    const body = '![接线][board]\n\n[board]: https://example.com/image.png'
    expect(parseQuestionBank(topic(body), '引用.md')).toMatchObject({
      ok: false,
      issues: [{ code: 'UNSUPPORTED_CONTENT', line: 11 }],
    })
  })

  it('代码中的图片写法只是文本，普通外部参考链接不是远程图片', () => {
    const body =
      '```markdown\n![示例](https://example.com/image.svg)\n```\n\n[资料](https://example.com/reference)'
    expect(parseQuestionBank(topic(body), '代码.md')).toMatchObject({
      ok: true,
      value: { questions: [{ images: [] }] },
    })
  })
})
