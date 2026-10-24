import { randomUUID } from 'node:crypto'
import type Database from 'better-sqlite3'
import { categoryChangeSchema, type CategoryChange } from '../../../shared/contracts/categories'

export class CategoryFault extends Error {
  constructor(
    readonly code: 'INVALID_REQUEST' | 'NOT_FOUND' | 'DATABASE_UNAVAILABLE',
    message: string,
  ) {
    super(message)
  }
}

export function createCategoryRepository(database: Database.Database) {
  const findId = database.prepare('SELECT title FROM categories WHERE category_id = ?')
  const findTitle = database.prepare(
    'SELECT category_id AS categoryId FROM categories WHERE title = ?',
  )
  const topic = database.prepare('SELECT category_id AS categoryId FROM topics WHERE topic_id = ?')
  const create = database.prepare('INSERT INTO categories (category_id, title) VALUES (?, ?)')
  const rename = database.prepare('UPDATE categories SET title = ? WHERE category_id = ?')
  const remove = database.prepare('DELETE FROM categories WHERE category_id = ?')
  const assign = database.prepare('UPDATE topics SET category_id = ? WHERE topic_id = ?')
  const revision = database.prepare(`UPDATE library_meta SET revision = revision + 1
    WHERE id = 1 AND revision < 9007199254740991`)

  function requireCategory(id: string) {
    const found = findId.get(id) as { title: string } | undefined
    if (!found) throw new CategoryFault('NOT_FOUND', '分类已移除，请刷新后重新选择。')
    return found
  }
  const update = database.transaction((change: CategoryChange) => {
    let changed = false
    switch (change.kind) {
      case 'create': {
        // 名称唯一且创建幂等，响应丢失后重试不会再生成一个分类。
        if (!findTitle.get(change.title)) {
          create.run(randomUUID(), change.title)
          changed = true
        }
        break
      }
      case 'rename': {
        const current = requireCategory(change.categoryId)
        const sameName = findTitle.get(change.title) as { categoryId: string } | undefined
        if (sameName && sameName.categoryId !== change.categoryId)
          throw new CategoryFault('INVALID_REQUEST', '分类名称已存在，请使用其他名称。')
        if (current.title !== change.title) {
          rename.run(change.title, change.categoryId)
          changed = true
        }
        break
      }
      case 'delete':
        // 外键使原专题变为未分类，题目、版本及历史不删除；重复移除保持幂等。
        changed = remove.run(change.categoryId).changes > 0
        break
      case 'assign': {
        const current = topic.get(change.topicId) as { categoryId: string | null } | undefined
        if (!current) throw new CategoryFault('NOT_FOUND', '专题不存在，请刷新后重新选择。')
        if (change.categoryId !== null) requireCategory(change.categoryId)
        if (current.categoryId !== change.categoryId) {
          assign.run(change.categoryId, change.topicId)
          changed = true
        }
        break
      }
    }
    if (changed && revision.run().changes !== 1)
      throw new CategoryFault('DATABASE_UNAVAILABLE', '题库修订号无效，本次分类变更已回滚。')
  })
  return {
    updateCategory(input: CategoryChange): void {
      const change = categoryChangeSchema.parse(input)
      if (database.inTransaction) throw new Error('分类写入不接受外层事务。')
      update.immediate(change)
    },
  }
}
