import { describe, expect, it } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { visit } from 'unist-util-visit'
import {
  imageResourceUrl,
  parseImageResourceUrl,
  externalHttpUrl,
} from '../../src/shared/contracts/content-urls'
import {
  identitySchema,
  listRequestSchema,
  previewImportResultSchema,
  versionIdentitySchema,
} from '../../src/shared/contracts/library-desktop'
import { markdownWithDefinitions } from '../../src/renderer/src/markdown-source'

const hash = 'a'.repeat(64)
describe('桌面内容访问契约', () => {
  it('图片 URL 只承载版本与资源身份', () => {
    const url = imageResourceUrl(7, hash)
    expect(parseImageResourceUrl(url)).toEqual({ versionId: 7, hash })
    expect(() => imageResourceUrl(Number.MAX_SAFE_INTEGER + 1, hash)).toThrow()
    expect(() => imageResourceUrl(7, '../file')).toThrow()
  })
  it.each([
    `practice-image://resource/0/${hash}`,
    `practice-image://resource/01/${hash}`,
    `practice-image://resource/9007199254740992/${hash}`,
    `practice-image://other/7/${hash}`,
    `practice-image://user@resource/7/${hash}`,
    `practice-image://resource/7/${hash}?x=1`,
    `practice-image://resource/7/${hash}#x`,
    `practice-image://resource/../7/${hash}`,
    `file:///7/${hash}`,
    'practice-image://resource/7/not-a-hash',
  ])('拒绝任意/歧义图片入口 %s', (url) => {
    expect(parseImageResourceUrl(url)).toBeUndefined()
  })
  it.each([
    'file:///C:/private.txt',
    'javascript:alert(1)',
    'data:text/html,test',
    'https://user:pass@example.com',
    'https:example.com',
    ' https://example.com',
    'https://example.com\n',
    'https://example.com\u0000',
  ])('拒绝非允许外链 %s', (url) => {
    expect(externalHttpUrl(url)).toBeUndefined()
  })
  it('允许规范 HTTP/HTTPS 并编码路径', () => {
    expect(externalHttpUrl('https://example.com/中文 路径')).toBe(
      'https://example.com/%E4%B8%AD%E6%96%87%20%E8%B7%AF%E5%BE%84',
    )
    expect(externalHttpUrl('http://example.com')).toBe('http://example.com/')
  })
  it('请求拒绝额外路径/SQL、越界页码与错版本', () => {
    expect(
      listRequestSchema.safeParse({ topicId: null, archived: false, page: 1, sql: 'select' })
        .success,
    ).toBe(false)
    expect(listRequestSchema.safeParse({ topicId: null, archived: false, page: 0 }).success).toBe(
      false,
    )
    expect(
      identitySchema.safeParse({ topicId: 'topic', questionId: 'q-1', path: 'C:/file' }).success,
    ).toBe(false)
    expect(
      versionIdentitySchema.safeParse({ topicId: 'topic', questionId: 'q-1', versionId: -1 })
        .success,
    ).toBe(false)
  })
  it('预览错误不允许携带异常堆栈', () => {
    expect(
      previewImportResultSchema.safeParse({
        ok: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: '失败', stack: 'secret' },
      }).success,
    ).toBe(false)
  })
  it('标准定义序列化保留首定义优先、引号和特殊 URL', () => {
    const url = 'https://example.com/a?query="word"&x=1'
    const source = markdownWithDefinitions({
      markdown: '[手册][ref]\n\n[ref]: https://example.com/wrong',
      definitions: [{ identifier: 'REF', url, title: '带 "引号" 的标题' }],
      imageBindings: [],
    })
    const tree = unified().use(remarkParse).parse(source)
    const definitions: { url: string; title: string | null }[] = []
    let references = 0
    visit(tree, (node) => {
      if (node.type === 'definition') definitions.push({ url: node.url, title: node.title ?? null })
      if (node.type === 'linkReference') references++
    })
    expect(definitions[0]).toEqual({ url, title: '带 "引号" 的标题' })
    expect(references).toBe(1)
  })
})
