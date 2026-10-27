import { realpath } from 'node:fs/promises'
import { extname, isAbsolute, relative } from 'node:path'
import { TextDecoder } from 'node:util'
import type {
  ImageSnapshot,
  PrepareImportResult,
  TopicSnapshot,
} from '../../../shared/contracts/import-snapshot'
import {
  MAX_IMPORT_QUESTIONS,
  MAX_MARKDOWN_BYTES,
  type ParseIssue,
} from '../../../shared/contracts/question-bank'
import { readFileSnapshot, SourceFileError } from '../resources/read-file-snapshot'
import { readImageSnapshot, resolveImageSource } from '../resources/read-image'
import { ImportBudget } from './import-budget'
import { contentFingerprint } from './content-fingerprint'
import { parseQuestionBank } from './parse-question-bank'

// 保留 BOM 与原始换行；纯解析器自行处理 BOM，快照保存原文。
const utf8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true })

function failure(
  fileName: string,
  error: unknown,
  location = { line: 1, column: 1 },
): PrepareImportResult {
  const known = error instanceof SourceFileError
  return {
    ok: false,
    issues: [
      {
        code: known ? error.code : 'FILE_UNREADABLE',
        fileName,
        ...location,
        message: known ? error.message : '无法准备来源文件，请检查文件后重试。',
      },
    ],
  }
}

export async function prepareImport(filePaths: readonly string[]): Promise<PrepareImportResult> {
  if (filePaths.length === 0 || filePaths.length > MAX_IMPORT_QUESTIONS) {
    return failure(
      '导入批次',
      new SourceFileError(
        'LIMIT_EXCEEDED',
        '请选择 1～10,000 个 Markdown 文件；整批仍限 10,000 道题。',
      ),
    )
  }
  const budget = new ImportBudget()
  const topics: TopicSnapshot[] = []
  const topicIds = new Set<string>()
  const sourceFiles = new Set<string>()
  const imageSources = new Map<string, ImageSnapshot>()
  const resources = new Map<string, ImageSnapshot>()

  for (const filePath of [...filePaths]) {
    let location: Pick<ParseIssue, 'line' | 'column'> = { line: 1, column: 1 }
    try {
      if (!isAbsolute(filePath) || extname(filePath).toLowerCase() !== '.md') {
        throw new SourceFileError('FILE_UNREADABLE', '来源必须是 Markdown .md 文件的绝对路径。')
      }
      const canonicalPath = await realpath(filePath)
      if (sourceFiles.has(canonicalPath)) {
        throw new SourceFileError('DUPLICATE_ID', '本批重复选择了同一个 Markdown 来源文件。')
      }
      sourceFiles.add(canonicalPath)
      const bytes = await readFileSnapshot(
        canonicalPath,
        Math.min(MAX_MARKDOWN_BYTES, budget.remainingBytes),
      )
      if (relative(canonicalPath, await realpath(filePath)) !== '') {
        throw new SourceFileError('SOURCE_CHANGED', 'Markdown 来源路径发生变化，请重新准备导入。')
      }
      budget.addSource(bytes.length)
      let markdown: string
      try {
        markdown = utf8.decode(bytes)
      } catch (error) {
        throw new SourceFileError(
          'INVALID_ENCODING',
          'Markdown 必须是有效的 UTF-8 文件，不支持 UTF-16 或损坏的编码。',
          { cause: error },
        )
      }
      const parsed = parseQuestionBank(markdown, filePath)
      if (!parsed.ok) return parsed
      const topic = parsed.value
      if (topicIds.has(topic.topicId)) {
        throw new SourceFileError(
          'DUPLICATE_ID',
          `本批专题 ID“${topic.topicId}”重复，每个专题只能提供一个完整快照。`,
        )
      }
      topicIds.add(topic.topicId)
      budget.addQuestions(topic.questions.length)

      const bindings = new Map<string, string>()
      for (const question of topic.questions) {
        for (const image of question.images) {
          location = { line: image.line, column: image.column }
          const source = await resolveImageSource(canonicalPath, image.url)
          let snapshot = imageSources.get(source.filePath)
          if (snapshot === undefined) {
            snapshot = await readImageSnapshot(source, budget.remainingBytes)
            budget.addSource(snapshot.bytes.byteLength)
            // 同内容不同路径计入来源大小，但资源字节只保留一份。
            const existing = resources.get(snapshot.hash)
            if (existing !== undefined) snapshot = existing
            else resources.set(snapshot.hash, snapshot)
            imageSources.set(source.filePath, snapshot)
          }
          if (snapshot.format !== source.format) {
            throw new SourceFileError(
              'INVALID_IMAGE',
              '同一图片的引用扩展名与已校验内容类型不一致。',
            )
          }
          bindings.set(image.url, snapshot.hash)
        }
      }
      topics.push({
        topic,
        markdown,
        imageBindings: [...bindings].map(([url, hash]) => ({ url, hash })),
        contentHashes: topic.questions.map((question) => ({
          questionId: question.questionId,
          hash: contentFingerprint(question, bindings),
        })),
      })
    } catch (error) {
      return failure(filePath, error, location)
    }
  }

  return {
    ok: true,
    value: {
      topics,
      resources: [...resources.values()],
      sourceBytes: budget.sourceBytes,
      questionCount: budget.questionCount,
    },
  }
}
