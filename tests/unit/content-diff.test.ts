import { expect, test } from 'vitest'
import { compareContentText } from '../../src/renderer/src/content-diff'

const normalize = (text: string) => text.replace(/\r\n?/g, '\n')
function expectPreserved(previous: string, current: string) {
  const result = compareContentText(previous, current)
  expect(
    result.chunks
      .filter((chunk) => chunk.kind !== 'added')
      .flatMap((chunk) => chunk.lines)
      .join('\n'),
  ).toBe(normalize(previous))
  expect(
    result.chunks
      .filter((chunk) => chunk.kind !== 'removed')
      .flatMap((chunk) => chunk.lines)
      .join('\n'),
  ).toBe(normalize(current))
  expect(
    result.chunks.every(
      (chunk, index) =>
        chunk.lines.length > 0 && (!index || chunk.kind !== result.chunks[index - 1]!.kind),
    ),
  ).toBe(true)
  return result
}

test.each(['', '同一题干\n\n```c\nint x = 1;\n```\n', 'a\r\nb\r\n'])(
  '全同/空内容不制造删除与新增：%j',
  (text) => {
    const diff = expectPreserved(text, text)
    expect(diff.coarse).toBe(false)
    expect(diff.chunks.map((chunk) => chunk.kind)).toEqual(['same'])
  },
)

test('多处改动保留中间未变行，新增/删除/尾行与中文代码分别呈现', () => {
  const diff = expectPreserved(
    '共同\n旧说明\n中间保留\nint a = 1;\n末尾',
    '共同\n新说明\n中间保留\nint a = 2;\n末尾\n',
  )
  expect(diff.coarse).toBe(false)
  expect(
    diff.chunks.filter((chunk) => chunk.kind === 'same').flatMap((chunk) => chunk.lines),
  ).toContain('中间保留')
  expect(
    diff.chunks.filter((chunk) => chunk.kind === 'removed').flatMap((chunk) => chunk.lines),
  ).toEqual(['旧说明', 'int a = 1;'])
  expect(
    diff.chunks.filter((chunk) => chunk.kind === 'added').flatMap((chunk) => chunk.lines),
  ).toEqual(['新说明', 'int a = 2;', ''])
})

test('单边插删、重复行重排和换行规范化均完整还原', () => {
  for (const [oldText, newText] of [
    ['a\nb', 'a\nx\nb'],
    ['a\nx\nb', 'a\nb'],
    ['a\nb\na', 'a\na\nb'],
    ['', '一行'],
    ['一行', ''],
    ['a\r\nb\r', 'a\nb\n'],
  ])
    expectPreserved(oldText!, newText!)
})

test('超预算明确整段对照，不丢首尾/中间/空行，不假称精确差异', () => {
  const previous =
    '相同首行\n' + Array.from({ length: 600 }, (_, i) => `旧${i}`).join('\n') + '\n相同尾行\n'
  const current =
    '相同首行\n' + Array.from({ length: 600 }, (_, i) => `新${i}`).join('\n') + '\n相同尾行\n'
  const diff = expectPreserved(previous, current)
  expect(diff.coarse).toBe(true)
  expect(diff.chunks.map((chunk) => chunk.kind)).toEqual(['same', 'removed', 'added', 'same'])
})

test('大量相同首尾先剥离，局部修改仍精确且单行1MiB不栈溢出', () => {
  const context = Array.from({ length: 10_000 }, (_, i) => `保留${i}`).join('\n')
  expect(expectPreserved(`${context}\nold\n${context}`, `${context}\nnew\n${context}`).coarse).toBe(
    false,
  )
  const line = 'x'.repeat(1_048_576)
  expect(expectPreserved(line, line + ';').coarse).toBe(false)
})

test('固定种子多种重复行/空行/Unicode输入，两个方向均可重建原内容', () => {
  let seed = 28
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed
  }
  const words = ['', 'GPIO', '中断🙂', '    return 0;', '```c', '重复', '重复']
  for (let sample = 0; sample < 160; sample++) {
    const text = () =>
      Array.from({ length: random() % 22 }, () => words[random() % words.length]).join('\n')
    expectPreserved(text(), text())
  }
})
