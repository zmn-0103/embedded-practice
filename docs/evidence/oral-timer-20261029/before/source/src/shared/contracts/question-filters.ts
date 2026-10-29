import { z } from 'zod'
import { questionDifficultySchema } from './question-bank'

export const masteryRatingSchema = z.enum(['不会', '不熟', '掌握'])
export const RECENCY_LABELS = {
  all: '不限最近练习',
  never: '当前版本从未练习',
  '7d': '最近7天未练',
  '30d': '最近30天未练',
} as const
export const questionFiltersSchema = z.strictObject({
  query: z.string().trim().max(256),
  tag: z
    .string()
    .trim()
    .transform((value) => value || null)
    .nullable(),
  difficulty: questionDifficultySchema.or(z.literal('未分级')).nullable(),
  mastery: z.enum(['all', 'unpracticed', '不会', '不熟', '掌握', '不会＋不熟']),
  favoritesOnly: z.boolean(),
  personalTagId: z.uuid().nullable().optional(),
  practiceRecency: z.enum(['all', 'never', '7d', '30d']).optional(),
  practiceOrder: z.enum(['default', 'oldest']).optional(),
})

export type QuestionFilters = z.infer<typeof questionFiltersSchema>
export const EMPTY_QUESTION_FILTERS: Readonly<QuestionFilters> = Object.freeze({
  query: '',
  tag: null,
  difficulty: null,
  mastery: 'all',
  favoritesOnly: false,
})
