import { z } from 'zod'
import { bankIdentifierSchema } from './question-bank'

export const CATEGORY_CHANNEL = 'library:update-category'
export const categoryIdSchema = bankIdentifierSchema.max(100)
export const categoryTitleSchema = z
  .string()
  .min(1)
  .max(60)
  .refine((title) => title.trim() === title && !/[\u0000-\u001f\u007f]/u.test(title))
  .refine((title) => title !== '未分类' && title !== '全部分类')
export const categorySchema = z.strictObject({
  categoryId: categoryIdSchema,
  title: categoryTitleSchema,
})
export const categoryScopeSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('all') }),
  z.strictObject({ kind: z.literal('uncategorized') }),
  z.strictObject({ kind: z.literal('category'), categoryId: categoryIdSchema }),
])
// 名称与ID一同保存，分类改名或移除后仍能说明旧轮的创建范围。
export const categorySnapshotSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('all') }),
  z.strictObject({ kind: z.literal('uncategorized') }),
  categorySchema.extend({ kind: z.literal('category') }),
])
const inputTitle = z.string().trim().pipe(categoryTitleSchema)
export const categoryChangeSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('create'), title: inputTitle }),
  z.strictObject({ kind: z.literal('rename'), categoryId: categoryIdSchema, title: inputTitle }),
  z.strictObject({ kind: z.literal('delete'), categoryId: categoryIdSchema }),
  z.strictObject({
    kind: z.literal('assign'),
    topicId: bankIdentifierSchema,
    categoryId: categoryIdSchema.nullable(),
  }),
])
export const libraryNavigationSchema = z.strictObject({
  categories: z.array(categorySchema),
  topics: z.array(
    z.strictObject({
      topicId: bankIdentifierSchema,
      title: z.string().min(1),
      categoryId: categoryIdSchema.nullable(),
      activeCount: z.number().int().nonnegative(),
      archivedCount: z.number().int().nonnegative(),
    }),
  ),
})
export type CategoryScope = z.infer<typeof categoryScopeSchema>
export type CategorySnapshot = z.infer<typeof categorySnapshotSchema>
export type CategoryChange = z.infer<typeof categoryChangeSchema>
export type LibraryNavigation = z.infer<typeof libraryNavigationSchema>
export const ALL_CATEGORIES = { kind: 'all' } as const

export function matchesCategory(categoryId: string | null, scope: CategoryScope): boolean {
  return (
    scope.kind === 'all' ||
    (scope.kind === 'uncategorized' ? categoryId === null : categoryId === scope.categoryId)
  )
}

export function categorySnapshotLabel(snapshot: CategorySnapshot): string {
  return snapshot.kind === 'category'
    ? snapshot.title
    : snapshot.kind === 'uncategorized'
      ? '未分类'
      : '全部分类'
}
