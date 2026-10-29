import { expect, test } from 'vitest'
import { exportBody, literalBlock } from '../../src/main/services/study/export-markdown'
import {
  materialRequestSchema,
  noteSchema,
  roundListRequestSchema,
} from '../../src/shared/contracts/study'

test('三种导出模式来源严格，禁止页面传任意正文/路径', () => {
  const input = {
    source: { kind: 'set', setId: 'dd45b633-a051-48ab-bb59-c9fd08f66c1d' },
    mode: 'questions',
  }
  expect(materialRequestSchema.parse(input)).toEqual(input)
  for (const change of [
    { filePath: 'C:/private.md' },
    { markdown: '伪造' },
    { mode: 'all' },
    { source: { kind: 'library' } },
  ])
    expect(materialRequestSchema.safeParse({ ...input, ...change }).success).toBe(false)
  expect(roundListRequestSchema.safeParse({ topicId: null, page: 0 }).success).toBe(false)
})
test('笔记按1MiB字节和有效Unicode校验，空初始与清空后修订分开', () => {
  const note = { topicId: 'notes', questionId: 'q-1', revision: 0, text: '', updatedAt: null }
  expect(noteSchema.parse(note)).toEqual(note)
  expect(noteSchema.safeParse({ ...note, text: '不该有未持久化内容' }).success).toBe(false)
  expect(
    noteSchema.parse({ ...note, revision: 1, updatedAt: '2026-10-27T00:00:00.000Z' }).text,
  ).toBe('')
  for (const text of ['中'.repeat(350_000), '\ud800'])
    expect(
      noteSchema.safeParse({ ...note, revision: 1, text, updatedAt: '2026-10-27T00:00:00.000Z' })
        .success,
    ).toBe(false)
})
test('代码围栏不被笔记中的Markdown或多段反引号突破', () => {
  const text = '```\n<script>unsafe</script>\n```\n自己的理解'
  expect(literalBlock(text)).toBe(`\`\`\`\`text\n${text}\n\`\`\`\`\n`)
  const many = '`a'.repeat(300_000)
  expect(literalBlock(many)).toContain(many)
})
test('导出保留GFM表格/代码，去HTML，引用按每题单独解析', () => {
  const body = {
    markdown:
      '|位置|说明|\n|---|---|\n|DMA|内存|\n\n```c\nint n=1;\n```\n\n[参考][same]\n\n<script>hidden</script>',
    definitions: [{ identifier: 'same', url: 'https://example.com/first', title: null }],
    imageBindings: [],
  }
  const first = exportBody(body, () => {
    throw new Error('没有图片')
  })
  expect(first).toContain('| DMA')
  expect(first).toContain('int n=1;')
  expect(first).toContain('https://example.com/first')
  expect(first).not.toContain('<script>')
  const next = exportBody(
    { ...body, definitions: [{ ...body.definitions[0]!, url: 'https://example.com/second' }] },
    () => '',
  )
  expect(next).toContain('https://example.com/second')
  expect(next).not.toContain('https://example.com/first')
})
test('引用图片只映射实际使用的入库哈希，未使用绑定不泄露或读取', () => {
  const hash = 'a'.repeat(64)
  const requested: string[] = []
  const text = exportBody(
    {
      markdown: '![波形][img]',
      definitions: [{ identifier: 'img', url: 'assets/%E6%B3%A2%E5%BD%A2.png', title: null }],
      imageBindings: [
        { url: 'assets/波形.png', hash },
        { url: 'assets/answer.png', hash: 'b'.repeat(64) },
      ],
    },
    (value) => {
      requested.push(value)
      return `files/${value}.png`
    },
  )
  expect(text).toContain(`files/${hash}.png`)
  expect(requested).toEqual([hash])
  expect(text).not.toContain('assets/')
})
