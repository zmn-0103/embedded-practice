import { extname, isAbsolute } from 'node:path'
import { z } from 'zod'
import {
  MAX_IMAGE_BYTES,
  MAX_IMPORT_BYTES,
  type ImportSnapshot,
  type PrepareImportResult,
} from '../../shared/contracts/import-snapshot'
import {
  bankIdentifierSchema,
  MAX_IMPORT_QUESTIONS,
  MAX_MARKDOWN_BYTES,
  parseIssueCodeSchema,
  questionDifficultySchema,
  type ParsedTopic,
  type ParseIssue,
} from '../../shared/contracts/question-bank'

export const importWorkerRequestSchema = z.strictObject({
  version: z.literal(1),
  filePaths: z
    .array(z.string().refine((path) => isAbsolute(path) && extname(path).toLowerCase() === '.md'))
    .min(1)
    .max(MAX_IMPORT_QUESTIONS),
})

const hashSchema = z.string().regex(/^[a-f0-9]{64}$/)
const position = { line: z.number().int().positive(), column: z.number().int().positive() }
const parsedTopicSchema: z.ZodType<ParsedTopic> = z.strictObject({
  schemaVersion: z.literal(1),
  topicId: bankIdentifierSchema,
  topicTitle: z.string().min(1),
  fileName: z.string().min(1),
  definitions: z.array(
    z.strictObject({ identifier: z.string(), url: z.string(), title: z.string().nullable() }),
  ),
  questions: z
    .array(
      z.strictObject({
        questionId: bankIdentifierSchema,
        title: z.string().min(1),
        tags: z.array(z.string()),
        difficulty: questionDifficultySchema.or(z.literal('未分级')),
        questionMarkdown: z.string().min(1),
        answerMarkdown: z.string().min(1),
        definitions: z.array(
          z.strictObject({ identifier: z.string(), url: z.string(), title: z.string().nullable() }),
        ),
        images: z.array(z.strictObject({ url: z.string(), alt: z.string(), ...position })),
        line: position.line,
      }),
    )
    .min(1)
    .max(MAX_IMPORT_QUESTIONS),
})

const snapshotSchema: z.ZodType<ImportSnapshot> = z
  .strictObject({
    topics: z
      .array(
        z.strictObject({
          topic: parsedTopicSchema,
          markdown: z.string().min(1).max(MAX_MARKDOWN_BYTES),
          imageBindings: z.array(z.strictObject({ url: z.string(), hash: hashSchema })),
          contentHashes: z.array(
            z.strictObject({ questionId: bankIdentifierSchema, hash: hashSchema }),
          ),
        }),
      )
      .min(1)
      .max(MAX_IMPORT_QUESTIONS),
    resources: z.array(
      z.strictObject({
        hash: hashSchema,
        format: z.enum(['png', 'jpeg', 'webp']),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        bytes: z
          .instanceof(Uint8Array)
          .refine((bytes) => bytes.byteLength > 0 && bytes.byteLength <= MAX_IMAGE_BYTES),
      }),
    ),
    sourceBytes: z.number().int().nonnegative().max(MAX_IMPORT_BYTES),
    questionCount: z.number().int().positive().max(MAX_IMPORT_QUESTIONS),
  })
  .superRefine((snapshot, context) => {
    const count = snapshot.topics.reduce((sum, item) => sum + item.topic.questions.length, 0)
    const resourceBytes = snapshot.resources.reduce((sum, item) => sum + item.bytes.byteLength, 0)
    const hashes = new Set(snapshot.resources.map((item) => item.hash))
    const markdownCharacters = snapshot.topics.reduce((sum, item) => sum + item.markdown.length, 0)
    if (
      count !== snapshot.questionCount ||
      markdownCharacters + resourceBytes > snapshot.sourceBytes ||
      hashes.size !== snapshot.resources.length ||
      new Set(snapshot.topics.map((item) => item.topic.topicId)).size !== snapshot.topics.length
    ) {
      context.addIssue({ code: 'custom', message: '批次计数或资源列表不一致。' })
    }
    if (
      snapshot.topics.some((topic) => {
        const urls = new Set(topic.imageBindings.map((binding) => binding.url))
        const questionIds = new Set(topic.topic.questions.map((question) => question.questionId))
        const contentIds = new Set(topic.contentHashes.map((item) => item.questionId))
        return (
          urls.size !== topic.imageBindings.length ||
          questionIds.size !== topic.topic.questions.length ||
          contentIds.size !== topic.contentHashes.length ||
          contentIds.size !== questionIds.size ||
          topic.contentHashes.some((item) => !questionIds.has(item.questionId)) ||
          topic.imageBindings.some((binding) => !hashes.has(binding.hash)) ||
          topic.topic.questions.some((question) =>
            question.images.some((image) => !urls.has(image.url)),
          )
        )
      })
    ) {
      context.addIssue({ code: 'custom', message: '题目指纹或图片绑定不一致。' })
    }
  })

const issueSchema: z.ZodType<ParseIssue> = z.strictObject({
  code: parseIssueCodeSchema,
  fileName: z.string().min(1),
  ...position,
  message: z.string().min(1),
})
const resultSchema: z.ZodType<PrepareImportResult> = z.discriminatedUnion('ok', [
  z.strictObject({ ok: z.literal(true), value: snapshotSchema }),
  z.strictObject({ ok: z.literal(false), issues: z.array(issueSchema).min(1) }),
])

export const importWorkerReplySchema = z.strictObject({
  version: z.literal(1),
  threadId: z.number().int().positive(),
  result: resultSchema,
})
export type ImportWorkerRequest = z.infer<typeof importWorkerRequestSchema>
export type ImportWorkerReply = z.infer<typeof importWorkerReplySchema>

export function workerFailure(code: ParseIssue['code'], message: string): PrepareImportResult {
  return { ok: false, issues: [{ code, fileName: '导入批次', line: 1, column: 1, message }] }
}
