import { z } from 'zod'
import {
  draftAckSchema,
  practiceAckSchema,
  practiceErrorCodeSchema,
  practiceIdSchema,
  practiceViewSchema,
  practiceOutlineSchema,
  type PracticeOutline,
  type NavigatePractice,
  type PracticeAck,
  type PracticeView,
  type RatePractice,
  type RevealPractice,
  type SaveDraft,
  type StartPractice,
  type DraftAck,
} from './practice'

export const PRACTICE_CHANNELS = {
  read: 'practice:read',
  outline: 'practice:outline',
  start: 'practice:start',
  saveDraft: 'practice:save-draft',
  reveal: 'practice:reveal',
  rateAndAdvance: 'practice:rate-and-advance',
  navigate: 'practice:navigate',
  end: 'practice:end',
  ready: 'practice:ready',
  finishClose: 'practice:finish-close',
  beforeClose: 'practice:before-close',
  closeCancelled: 'practice:close-cancelled',
  timerPause: 'practice:timer-pause',
} as const
const errorSchema = z.strictObject({
  code: practiceErrorCodeSchema.or(z.literal('FORBIDDEN')),
  message: z.string().min(1),
})
function resultSchema<T extends z.ZodType>(value: T) {
  return z.discriminatedUnion('ok', [
    z.strictObject({ ok: z.literal(true), value }),
    z.strictObject({ ok: z.literal(false), error: errorSchema }),
  ])
}
export const practiceReadResultSchema = resultSchema(practiceViewSchema.nullable())
export const practiceOutlineResultSchema = resultSchema(practiceOutlineSchema)
export const practiceCommandResultSchema = resultSchema(practiceAckSchema)
export const practiceDraftResultSchema = resultSchema(draftAckSchema)
export const practiceEmptyResultSchema = resultSchema(z.null())
export const closeRequestSchema = z.strictObject({ requestId: practiceIdSchema })
export const closeResponseSchema = closeRequestSchema.extend({ saved: z.boolean() })
export type CloseRequest = z.infer<typeof closeRequestSchema>
export type PracticeDesktopResult<T> =
  { ok: true; value: T } | { ok: false; error: z.infer<typeof errorSchema> }
export interface PracticeDesktopApi {
  read(input: { sessionId: string | null }): Promise<PracticeDesktopResult<PracticeView | null>>
  outline(input: {
    sessionId: string
    page: number
  }): Promise<PracticeDesktopResult<PracticeOutline>>
  start(input: StartPractice): Promise<PracticeDesktopResult<PracticeAck>>
  saveDraft(input: SaveDraft): Promise<PracticeDesktopResult<DraftAck>>
  reveal(input: RevealPractice): Promise<PracticeDesktopResult<PracticeAck>>
  rateAndAdvance(input: RatePractice): Promise<PracticeDesktopResult<PracticeAck>>
  navigate(input: NavigatePractice): Promise<PracticeDesktopResult<PracticeAck>>
  end(input: RevealPractice): Promise<PracticeDesktopResult<PracticeAck>>
  ready(): Promise<PracticeDesktopResult<null>>
  finishClose(input: CloseRequest & { saved: boolean }): Promise<PracticeDesktopResult<null>>
  onBeforeClose(listener: (request: CloseRequest) => void): () => void
  onCloseCancelled(listener: () => void): () => void
  onTimerPause(listener: () => void): () => void
}
