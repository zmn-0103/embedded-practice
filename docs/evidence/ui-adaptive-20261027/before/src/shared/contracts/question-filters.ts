import { z } from 'zod'
import { questionDifficultySchema } from './question-bank'

export const masteryRatingSchema = z.enum(['不会', '不熟', '掌握'])
export const questionFiltersSchema = z.strictObject({
  query: z.string().trim().max(256),
  tag: z
    .string()
    .trim()
    .transform((value) => value || null)
    .nullable(),
  difficulty: questionDifficultySchema.or(z.literal('未分级')).nullable(),
  mastery: z.enum(['all', 'unpracticed', '不会', '不熟', '掌握']),
  favoritesOnly: z.boolean(),
})

export type QuestionFilters = z.infer<typeof questionFiltersSchema>
export const EMPTY_QUESTION_FILTERS: Readonly<QuestionFilters> = Object.freeze({
  query: '',
  tag: null,
  difficulty: null,
  mastery: 'all',
  favoritesOnly: false,
})
