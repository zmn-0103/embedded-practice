import { z } from 'zod'
import { PAGE_SIZE, identitySchema, versionIdentitySchema } from './library-desktop'
import { bankIdentifierSchema } from './question-bank'
import { questionIdentitiesSchema } from './question-sets'

export const PLANNING_CHANNELS = {
  home: 'planning:home',
  month: 'planning:month',
  day: 'planning:day',
  progress: 'planning:progress',
  scope: 'planning:scope',
  quota: 'planning:quota',
  previewQuota: 'planning:preview-quota',
  change: 'planning:change',
} as const
export const ACTIVITY_LABELS = {
  rating: '成功自评',
  reveal: '练习揭晓',
  review: '完成复习待办',
  note: '保存笔记',
} as const
export function localDay(date = new Date()): string {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export const daySchema = z.iso.date()
export const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
  .refine((value) => daySchema.safeParse(`${value}-01`).success)
const revision = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const expectedRevision = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER - 1)
const count = z.number().int().nonnegative()
const target = count.max(500)
const name = z
  .string()
  .min(1)
  .max(60)
  .refine(
    (value) =>
      value === value.trim() &&
      !/[\u0000-\u001f\u007f]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(
        value,
      ),
  )
export const dailyDraftSchema = z.strictObject({
  day: daySchema,
  ratingTarget: target,
  reviewTarget: target,
})
export const dailyTargetSchema = dailyDraftSchema.extend({
  type: z.literal('daily'),
  revision,
  updatedAt: z.iso.datetime(),
})
const setIds = z
  .array(z.uuid())
  .min(1)
  .max(100)
  .refine((ids) => new Set(ids).size === ids.length)
export const examDraftSchema = z.strictObject({
  goalId: z.uuid(),
  name,
  deadline: daySchema.nullable(),
  setIds,
})
export const examGoalSchema = examDraftSchema.extend({
  type: z.literal('exam'),
  revision,
  updatedAt: z.iso.datetime(),
})
export const quotaRowSchema = z.strictObject({
  topicId: bankIdentifierSchema,
  count: z.number().int().min(1).max(500),
  priority: z.enum(['random', 'weak', 'oldest']),
})
export const quotaRowsSchema = z
  .array(quotaRowSchema)
  .min(1)
  .max(20)
  .refine(
    (rows) =>
      new Set(rows.map((row) => row.topicId)).size === rows.length &&
      rows.reduce((sum, row) => sum + row.count, 0) <= 500,
  )
export const quotaSettingSchema = z.strictObject({
  type: z.literal('quota'),
  rows: quotaRowsSchema,
  revision,
  updatedAt: z.iso.datetime(),
})
export const planningRecordSchema = z.discriminatedUnion('type', [
  dailyTargetSchema,
  examGoalSchema,
  quotaSettingSchema,
])
export const planningChangeSchema = z.discriminatedUnion('kind', [
  dailyDraftSchema.extend({ kind: z.literal('daily'), expectedRevision }),
  examDraftSchema.extend({ kind: z.literal('exam'), expectedRevision }),
  z.strictObject({ kind: z.literal('exam-delete'), expected: examGoalSchema }),
  z.strictObject({ kind: z.literal('quota'), rows: quotaRowsSchema, expectedRevision }),
])
export const activityCountsSchema = z.strictObject({
  ratingQuestions: count,
  ratingAttempts: count,
  reviewQuestions: count,
  reviewAttempts: count,
  reveals: count,
  noteSaves: count,
})
export const planningHomeRequestSchema = z.strictObject({ day: daySchema })
export const planningHomeSchema = z.strictObject({
  day: daySchema,
  daily: dailyTargetSchema.nullable(),
  previous: dailyTargetSchema.nullable(),
  counts: activityCountsSchema,
  goals: z.array(examGoalSchema).max(20),
  sets: z.array(z.strictObject({ setId: z.uuid(), name: z.string().min(1), count })).max(100),
})
export const planningMonthRequestSchema = z.strictObject({ month: monthSchema })
export const planningMonthSchema = z.strictObject({
  month: monthSchema,
  days: z.array(z.strictObject({ day: daySchema, activities: count, rounds: count })).max(31),
})
export const planningDayRequestSchema = z.strictObject({
  day: daySchema,
  eventPage: z.number().int().positive(),
  roundPage: z.number().int().positive(),
})
export const activitySchema = identitySchema.extend({
  activityId: z.string().min(1),
  kind: z.enum(['rating', 'reveal', 'review', 'note']),
  occurredAt: z.iso.datetime(),
  day: daySchema,
  title: z.string().min(1),
  topicTitle: z.string().min(1),
  sessionId: z.uuid().nullable(),
})
export const calendarRoundSchema = z.strictObject({
  sessionId: z.uuid(),
  status: z.enum(['active', 'finished', 'ended']),
  title: z.string().min(1),
  createdAt: z.iso.datetime(),
  endedAt: z.iso.datetime().nullable(),
  total: count,
})
export const planningDaySchema = z.strictObject({
  day: daySchema,
  eventPage: z.number().int().positive(),
  eventTotal: count,
  roundPage: z.number().int().positive(),
  roundTotal: count,
  pageSize: z.literal(PAGE_SIZE),
  events: z.array(activitySchema).max(PAGE_SIZE),
  rounds: z.array(calendarRoundSchema).max(PAGE_SIZE),
})
export const planningGoalRequestSchema = z.strictObject({ goalId: z.uuid() })
export const goalProgressSchema = z.strictObject({
  goalId: z.uuid(),
  total: count,
  active: count,
  archived: count,
  missing: count,
  practiced: count,
  rated: count,
  mastered: count,
  sets: z
    .array(
      z.strictObject({ setId: z.uuid(), name: z.string().nullable(), count: count.nullable() }),
    )
    .max(100),
})
export const planningScopeRequestSchema = planningGoalRequestSchema.extend({
  setId: z.uuid().optional(),
})
export const planningScopeSchema = z.strictObject({
  items: questionIdentitiesSchema,
  sourceName: z.string().min(1).max(80),
  sourceSetId: z.uuid().optional(),
})
const quotaQuestion = versionIdentitySchema.extend({
  title: z.string().min(1),
  topicTitle: z.string().min(1),
})
export const quotaPreviewRequestSchema = z.strictObject({ rows: quotaRowsSchema })
export const quotaPreviewSchema = z.strictObject({
  ready: z.boolean(),
  rows: z
    .array(
      quotaRowSchema.extend({
        topicTitle: z.string().nullable(),
        available: count,
        deficit: count,
        items: z.array(quotaQuestion).max(500),
      }),
    )
    .min(1)
    .max(20),
})
const result = <T extends z.ZodType>(value: T) =>
  z.discriminatedUnion('ok', [
    z.strictObject({ ok: z.literal(true), value }),
    z.strictObject({
      ok: z.literal(false),
      error: z.strictObject({
        code: z.enum([
          'FORBIDDEN',
          'INVALID_REQUEST',
          'NOT_FOUND',
          'CONFLICT',
          'LIMIT_EXCEEDED',
          'SERVICE_CLOSED',
          'DATABASE_UNAVAILABLE',
        ]),
        message: z.string().min(1),
      }),
    }),
  ])
export const planningHomeResultSchema = result(planningHomeSchema)
export const planningMonthResultSchema = result(planningMonthSchema)
export const planningDayResultSchema = result(planningDaySchema)
export const goalProgressResultSchema = result(goalProgressSchema)
export const planningScopeResultSchema = result(planningScopeSchema)
export const quotaSettingResultSchema = result(quotaSettingSchema.nullable())
export const quotaPreviewResultSchema = result(quotaPreviewSchema)
export const planningChangeResultSchema = result(planningRecordSchema.nullable())
export type DailyTarget = z.infer<typeof dailyTargetSchema>
export type ExamGoal = z.infer<typeof examGoalSchema>
export type QuotaSetting = z.infer<typeof quotaSettingSchema>
export type QuotaRow = z.infer<typeof quotaRowSchema>
export type PlanningChange = z.infer<typeof planningChangeSchema>
export type PlanningRecord = z.infer<typeof planningRecordSchema>
export type PlanningHome = z.infer<typeof planningHomeSchema>
export type PlanningDay = z.infer<typeof planningDaySchema>
export type PlanningMonth = z.infer<typeof planningMonthSchema>
export type GoalProgress = z.infer<typeof goalProgressSchema>
export type PlanningScope = z.infer<typeof planningScopeSchema>
export type QuotaPreview = z.infer<typeof quotaPreviewSchema>
export interface PlanningDesktopApi {
  home(
    input: z.infer<typeof planningHomeRequestSchema>,
  ): Promise<z.infer<typeof planningHomeResultSchema>>
  month(
    input: z.infer<typeof planningMonthRequestSchema>,
  ): Promise<z.infer<typeof planningMonthResultSchema>>
  day(
    input: z.infer<typeof planningDayRequestSchema>,
  ): Promise<z.infer<typeof planningDayResultSchema>>
  progress(
    input: z.infer<typeof planningGoalRequestSchema>,
  ): Promise<z.infer<typeof goalProgressResultSchema>>
  scope(
    input: z.infer<typeof planningScopeRequestSchema>,
  ): Promise<z.infer<typeof planningScopeResultSchema>>
  quota(): Promise<z.infer<typeof quotaSettingResultSchema>>
  previewQuota(
    input: z.infer<typeof quotaPreviewRequestSchema>,
  ): Promise<z.infer<typeof quotaPreviewResultSchema>>
  change(input: PlanningChange): Promise<z.infer<typeof planningChangeResultSchema>>
}
