import { createHash } from 'node:crypto'
import type { ParsedQuestion } from '../../../shared/contracts/question-bank'

export function contentFingerprint(
  question: ParsedQuestion,
  imageBindings: ReadonlyMap<string, string>,
): string {
  const images = question.images.map(({ url }) => {
    const hash = imageBindings.get(url)
    if (hash === undefined) throw new Error('内容指纹缺少已校验的图片绑定。')
    return { url, hash }
  })
  // 仅统一换行，不裁剪行尾空格或代码缩进；原正文仍原样保存。
  const content = {
    question: question.questionMarkdown.replace(/\r\n/g, '\n'),
    answer: question.answerMarkdown.replace(/\r\n/g, '\n'),
    definitions: [...question.definitions].sort((a, b) =>
      a.identifier < b.identifier ? -1 : a.identifier > b.identifier ? 1 : 0,
    ),
    images,
  }
  return createHash('sha256').update(JSON.stringify(content)).digest('hex')
}
