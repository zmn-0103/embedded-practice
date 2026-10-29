export type ContentDiffKind = 'same' | 'removed' | 'added'
export interface ContentDiffChunk {
  kind: ContentDiffKind
  lines: string[]
}
export const MAX_CONTENT_DIFF_CELLS = 250_000

// 只比较文字行。图片/引用仍由各自版本的内容预览呈现，不推断技术语义。
export function compareContentText(previous: string, current: string) {
  const oldLines = previous.replace(/\r\n?/g, '\n').split('\n')
  const newLines = current.replace(/\r\n?/g, '\n').split('\n')
  let prefix = 0,
    suffix = 0
  while (
    prefix < oldLines.length &&
    prefix < newLines.length &&
    oldLines[prefix] === newLines[prefix]
  )
    prefix++
  while (
    suffix < oldLines.length - prefix &&
    suffix < newLines.length - prefix &&
    oldLines[oldLines.length - suffix - 1] === newLines[newLines.length - suffix - 1]
  )
    suffix++
  const oldEnd = oldLines.length - suffix,
    newEnd = newLines.length - suffix
  const rows = oldEnd - prefix,
    columns = newEnd - prefix
  const chunks: ContentDiffChunk[] = []
  function append(kind: ContentDiffKind, line: string) {
    let chunk = chunks.at(-1)
    if (chunk?.kind !== kind) {
      chunk = { kind, lines: [] }
      chunks.push(chunk)
    }
    chunk.lines.push(line)
  }
  for (let i = 0; i < prefix; i++) append('same', oldLines[i]!)
  const coarse = rows > 0 && columns > 0 && (rows + 1) * (columns + 1) > MAX_CONTENT_DIFF_CELLS
  if (coarse || !rows || !columns) {
    for (let i = prefix; i < oldEnd; i++) append('removed', oldLines[i]!)
    for (let i = prefix; i < newEnd; i++) append('added', newLines[i]!)
  } else {
    const width = columns + 1
    const lengths = new Uint32Array((rows + 1) * width)
    for (let i = rows - 1; i >= 0; i--)
      for (let j = columns - 1; j >= 0; j--)
        lengths[i * width + j] =
          oldLines[prefix + i] === newLines[prefix + j]
            ? lengths[(i + 1) * width + j + 1]! + 1
            : Math.max(lengths[(i + 1) * width + j]!, lengths[i * width + j + 1]!)
    let i = 0,
      j = 0
    while (i < rows || j < columns) {
      if (i < rows && j < columns && oldLines[prefix + i] === newLines[prefix + j]) {
        append('same', oldLines[prefix + i]!)
        i++
        j++
      } else if (
        i < rows &&
        (j === columns || lengths[(i + 1) * width + j]! >= lengths[i * width + j + 1]!)
      ) {
        append('removed', oldLines[prefix + i++]!)
      } else append('added', newLines[prefix + j++]!)
    }
  }
  for (let i = oldEnd; i < oldLines.length; i++) append('same', oldLines[i]!)
  return { chunks, coarse }
}
