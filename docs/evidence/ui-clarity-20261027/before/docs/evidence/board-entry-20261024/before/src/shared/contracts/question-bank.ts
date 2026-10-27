import { z } from 'zod'

export const MAX_MARKDOWN_BYTES = 20 * 1024 * 1024
export const MAX_IMPORT_QUESTIONS = 10_000

export const bankIdentifierSchema = z.string().regex(/^[a-z0-9-]+$/)
export const topicMetadataSchema = z.object({
  schema_version: z.literal(1),
  topic_id: bankIdentifierSchema,
  topic_title: z.string().trim().min(1),
})
export const questionDifficultySchema = z.enum(['基础', '进阶', '综合'])
export type QuestionDifficulty = z.infer<typeof questionDifficultySchema> | '未分级'

export interface ImageReference {
  readonly url: string
  readonly alt: string
  readonly line: number
  readonly column: number
}

export interface MarkdownReferenceDefinition {
  readonly identifier: string
  readonly url: string
  readonly title: string | null
}

export interface ParsedQuestion {
  readonly questionId: string
  readonly title: string
  readonly tags: readonly string[]
  readonly difficulty: QuestionDifficulty
  readonly questionMarkdown: string
  readonly answerMarkdown: string
  readonly definitions: readonly MarkdownReferenceDefinition[]
  readonly images: readonly ImageReference[]
  readonly line: number
}

export interface ParsedTopic {
  readonly schemaVersion: 1
  readonly topicId: string
  readonly topicTitle: string
  readonly fileName: string
  readonly definitions: readonly MarkdownReferenceDefinition[]
  readonly questions: readonly ParsedQuestion[]
}

export const parseIssueCodeSchema = z.enum([
  'INVALID_METADATA',
  'INVALID_QUESTION',
  'DUPLICATE_ID',
  'UNSUPPORTED_CONTENT',
  'LIMIT_EXCEEDED',
  'FILE_UNREADABLE',
  'SOURCE_CHANGED',
  'INVALID_ENCODING',
  'INVALID_IMAGE',
  'UNSAFE_PATH',
  'IMPORT_BUSY',
  'WORKER_FAILED',
  'WORKER_CANCELLED',
  'WORKER_TIMEOUT',
])

export interface ParseIssue {
  readonly code: z.infer<typeof parseIssueCodeSchema>
  readonly fileName: string
  readonly line: number
  readonly column: number
  readonly message: string
}

export type ParseTopicResult =
  | { readonly ok: true; readonly value: ParsedTopic }
  | { readonly ok: false; readonly issues: readonly ParseIssue[] }
