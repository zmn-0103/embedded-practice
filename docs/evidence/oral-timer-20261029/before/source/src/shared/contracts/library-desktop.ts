import { z } from 'zod'
import { categoryScopeSchema, libraryNavigationSchema, type CategoryChange } from './categories'
import { commitReceiptSchema, importErrorCodeSchema, importPreviewSchema } from './library-import'
import { masteryRatingSchema, questionFiltersSchema } from './question-filters'
import {
  bankIdentifierSchema,
  parseIssueCodeSchema,
  questionDifficultySchema,
} from './question-bank'

export const LIBRARY_CHANNELS = {
  previewImport: 'library:preview-import',
  cancelImport: 'library:cancel-import',
  commitImport: 'library:commit-import',
  discardImport: 'library:discard-import',
  listQuestions: 'library:list-questions',
  getQuestion: 'library:get-question',
  getAnswer: 'library:get-answer',
  exportTemplate: 'library:export-template',
  openReference: 'library:open-reference',
  copyCode: 'library:copy-code',
  setFavorite: 'library:set-favorite',
} as const
export const PAGE_SIZE = 20
export const resourceHashSchema = z.string().regex(/^[a-f0-9]{64}$/)
export const identitySchema = z.strictObject({
  topicId: bankIdentifierSchema,
  questionId: bankIdentifierSchema,
})
export const versionIdentitySchema = identitySchema.extend({
  versionId: z.number().int().positive(),
})
export const favoriteRequestSchema = identitySchema.extend({ favorite: z.boolean() })
export const listRequestSchema = z.strictObject({
  topicId: bankIdentifierSchema.nullable(),
  category: categoryScopeSchema.optional(),
  archived: z.boolean(),
  page: z.number().int().positive(),
  filters: questionFiltersSchema.optional(),
  contentUpdatedOnly: z.boolean().optional(),
})
export const contentBodySchema = z.strictObject({
  markdown: z.string().min(1),
  definitions: z.array(
    z.strictObject({ identifier: z.string(), url: z.string(), title: z.string().nullable() }),
  ),
  imageBindings: z.array(z.strictObject({ url: z.string(), hash: resourceHashSchema })),
})
export const questionInfoSchema = versionIdentitySchema.extend({
  title: z.string().min(1),
  topicTitle: z.string().min(1),
  tags: z.array(z.string()),
  difficulty: questionDifficultySchema.or(z.literal('未分级')),
  archived: z.boolean(),
  favorite: z.boolean(),
  practiced: z.boolean(),
  contentUpdated: z.boolean(),
  currentRating: masteryRatingSchema.nullable(),
  lastPracticedAt: z.iso.datetime().nullable().optional(),
})
export const questionDetailSchema = questionInfoSchema.extend({ body: contentBodySchema })
export const libraryPageSchema = z.strictObject({
  revision: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.literal(PAGE_SIZE),
  // 候选覆盖所选分类、专题及归档范围，不随题目条件或分页收窄。
  tagOptions: z.array(z.string().min(1)),
  categories: libraryNavigationSchema.shape.categories,
  topics: libraryNavigationSchema.shape.topics,
  questions: z.array(questionInfoSchema).max(PAGE_SIZE),
})
const errorSchema = z.strictObject({
  code: importErrorCodeSchema.or(z.enum(['FORBIDDEN', 'NOT_FOUND', 'FILE_ERROR'])),
  message: z.string().min(1),
  issues: z
    .array(
      z.strictObject({
        code: parseIssueCodeSchema,
        fileName: z.string(),
        line: z.number().int().positive(),
        column: z.number().int().positive(),
        message: z.string(),
      }),
    )
    .optional(),
})
function resultSchema<T extends z.ZodType>(value: T) {
  return z.discriminatedUnion('ok', [
    z.strictObject({ ok: z.literal(true), value }),
    z.strictObject({ ok: z.literal(false), error: errorSchema }),
  ])
}
export const previewImportResultSchema = resultSchema(importPreviewSchema)
export const commitImportResultSchema = resultSchema(commitReceiptSchema)
export const emptyResultSchema = resultSchema(z.null())
export const listResultSchema = resultSchema(libraryPageSchema)
export const questionResultSchema = resultSchema(questionDetailSchema)
export const answerResultSchema = resultSchema(contentBodySchema)
export const favoriteResultSchema = resultSchema(favoriteRequestSchema)
export type DesktopError = z.infer<typeof errorSchema>
export type DesktopResult<T> = { ok: true; value: T } | { ok: false; error: DesktopError }
export type ListRequest = z.infer<typeof listRequestSchema>
export type QuestionIdentity = z.infer<typeof identitySchema>
export type VersionIdentity = z.infer<typeof versionIdentitySchema>
export type FavoriteSetting = z.infer<typeof favoriteRequestSchema>
export type ContentBody = z.infer<typeof contentBodySchema>
export type QuestionDetail = z.infer<typeof questionDetailSchema>
export type LibraryPage = z.infer<typeof libraryPageSchema>
export interface LibraryDesktopApi {
  updateCategory(change: CategoryChange): Promise<DesktopResult<null>>
  previewImport(): Promise<z.infer<typeof previewImportResultSchema>>
  cancelImport(): Promise<DesktopResult<null>>
  commitImport(token: string): Promise<z.infer<typeof commitImportResultSchema>>
  discardImport(token: string): Promise<DesktopResult<null>>
  listQuestions(request: ListRequest): Promise<DesktopResult<LibraryPage>>
  getQuestion(identity: QuestionIdentity): Promise<DesktopResult<QuestionDetail>>
  getAnswer(identity: VersionIdentity): Promise<DesktopResult<ContentBody>>
  exportTemplate(): Promise<DesktopResult<null>>
  openReference(url: string): Promise<DesktopResult<null>>
  copyCode(text: string): Promise<DesktopResult<null>>
  setFavorite(setting: FavoriteSetting): Promise<DesktopResult<FavoriteSetting>>
}
