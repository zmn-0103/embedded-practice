import { z } from 'zod'
import { identitySchema, PAGE_SIZE } from './library-desktop'
import { bankIdentifierSchema } from './question-bank'
import { draftSchema, practiceIdSchema, practiceSessionSummarySchema } from './practice'
import { historyEntrySchema, historySummarySchema } from './history'

const revision = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const page = z.number().int().positive()
export const STUDY_CHANNELS = {
  readNote: 'study:read-note',
  saveNote: 'study:save-note',
  listRounds: 'study:list-rounds',
  readRound: 'study:read-round',
  readEntry: 'study:read-entry',
  exportMaterial: 'study:export-material',
} as const
export const noteSchema = identitySchema
  .extend({
    revision,
    text: draftSchema.shape.text,
    updatedAt: z.iso.datetime().nullable(),
  })
  .refine((note) =>
    note.revision === 0 ? note.text === '' && note.updatedAt === null : note.updatedAt !== null,
  )
export const saveNoteSchema = identitySchema.extend({
  expectedRevision: revision.max(Number.MAX_SAFE_INTEGER - 1),
  text: draftSchema.shape.text,
})
export const roundListRequestSchema = z.strictObject({
  topicId: bankIdentifierSchema.nullable(),
  page,
})
export const roundRequestSchema = z.strictObject({ sessionId: practiceIdSchema, page })
export const roundEntryRequestSchema = z.strictObject({
  sessionId: practiceIdSchema,
  position: revision,
})
export const closedRoundSchema = practiceSessionSummarySchema.refine(
  (session) => session.status !== 'active',
)
export const roundListSchema = z.strictObject({
  topicId: bankIdentifierSchema.nullable(),
  page,
  pageSize: z.literal(PAGE_SIZE),
  total: revision,
  rounds: z.array(closedRoundSchema).max(PAGE_SIZE),
})
export const roundItemSchema = historySummarySchema.safeExtend({
  topicId: bankIdentifierSchema,
  questionId: bankIdentifierSchema,
})
export const roundPageSchema = z
  .strictObject({
    session: closedRoundSchema,
    page,
    pageSize: z.literal(PAGE_SIZE),
    items: z.array(roundItemSchema).max(PAGE_SIZE),
  })
  .refine(({ session, page, items }) => {
    const offset = (page - 1) * PAGE_SIZE
    return (
      offset < session.total &&
      items.length === Math.min(PAGE_SIZE, session.total - offset) &&
      items.every((item, i) => item.sessionId === session.sessionId && item.position === offset + i)
    )
  })
export const roundEntrySchema = historyEntrySchema
  .safeExtend({
    topicId: bankIdentifierSchema,
    questionId: bankIdentifierSchema,
  })
  .refine((item) => item.sessionStatus !== 'active')
export const materialSourceSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('set'), setId: z.uuid() }),
  z.strictObject({ kind: z.literal('round'), sessionId: practiceIdSchema }),
])
export const materialRequestSchema = z.strictObject({
  source: materialSourceSchema,
  mode: z.enum(['questions', 'answers', 'personal']),
})
export const materialResultSchema = z.strictObject({
  filePath: z.string().min(1),
  assetsPath: z.string().min(1).nullable(),
  questions: z.number().int().min(1).max(500),
  images: revision,
})
export const studyErrorSchema = z.strictObject({
  code: z.enum([
    'FORBIDDEN',
    'INVALID_REQUEST',
    'SERVICE_CLOSED',
    'DATABASE_UNAVAILABLE',
    'NOT_FOUND',
    'NOTE_CONFLICT',
    'CANCELLED',
    'FILE_ERROR',
    'BUSY',
    'LIMIT_EXCEEDED',
  ]),
  message: z.string().min(1),
})
export const studyResultSchema = <T extends z.ZodType>(value: T) =>
  z.discriminatedUnion('ok', [
    z.strictObject({ ok: z.literal(true), value }),
    z.strictObject({ ok: z.literal(false), error: studyErrorSchema }),
  ])
export const readNoteResultSchema = studyResultSchema(noteSchema)
export const saveNoteResultSchema = readNoteResultSchema
export const roundListResultSchema = studyResultSchema(roundListSchema)
export const roundPageResultSchema = studyResultSchema(roundPageSchema)
export const roundEntryResultSchema = studyResultSchema(roundEntrySchema)
export const exportMaterialResultSchema = studyResultSchema(materialResultSchema)
export type PersonalNote = z.infer<typeof noteSchema>
export type SaveNote = z.infer<typeof saveNoteSchema>
export type RoundList = z.infer<typeof roundListSchema>
export type RoundPage = z.infer<typeof roundPageSchema>
export type RoundEntry = z.infer<typeof roundEntrySchema>
export type MaterialSource = z.infer<typeof materialSourceSchema>
export type MaterialRequest = z.infer<typeof materialRequestSchema>
export type StudyError = z.infer<typeof studyErrorSchema>
export interface StudyDesktopApi {
  readNote(input: z.infer<typeof identitySchema>): Promise<z.infer<typeof readNoteResultSchema>>
  saveNote(input: SaveNote): Promise<z.infer<typeof saveNoteResultSchema>>
  listRounds(
    input: z.infer<typeof roundListRequestSchema>,
  ): Promise<z.infer<typeof roundListResultSchema>>
  readRound(
    input: z.infer<typeof roundRequestSchema>,
  ): Promise<z.infer<typeof roundPageResultSchema>>
  readEntry(
    input: z.infer<typeof roundEntryRequestSchema>,
  ): Promise<z.infer<typeof roundEntryResultSchema>>
  exportMaterial(input: MaterialRequest): Promise<z.infer<typeof exportMaterialResultSchema>>
}
