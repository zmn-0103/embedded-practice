import type Database from 'better-sqlite3'
import {
  MAX_PRACTICE_PLANS,
  practicePlanChangeSchema,
  practicePlanSchema,
  type PracticePlanChange,
} from '../../../shared/contracts/practice-plans'
import { matchesCategory } from '../../../shared/contracts/categories'

export class PracticePlanFault extends Error {
  constructor(
    readonly code: 'INVALID_REQUEST' | 'NOT_FOUND',
    message: string,
  ) {
    super(message)
  }
}

export function createPracticePlanRepository(database: Database.Database) {
  const rows = database.prepare(`SELECT plan_id AS planId,name,options_json AS options
    FROM practice_plans ORDER BY name COLLATE NOCASE,plan_id LIMIT ${MAX_PRACTICE_PLANS + 1}`)
  const find = database.prepare(
    'SELECT name,options_json AS options FROM practice_plans WHERE plan_id=?',
  )
  const findName = database.prepare('SELECT 1 FROM practice_plans WHERE name=?')
  const count = database.prepare('SELECT count(*) FROM practice_plans').pluck()
  const insert = database.prepare(
    'INSERT INTO practice_plans(plan_id,name,options_json) VALUES(?,?,?)',
  )
  const remove = database.prepare('DELETE FROM practice_plans WHERE plan_id=?')
  const category = database.prepare('SELECT 1 FROM categories WHERE category_id=?')
  const topic = database.prepare('SELECT category_id AS categoryId FROM topics WHERE topic_id=?')
  const change = database.transaction((input: PracticePlanChange) => {
    if (input.kind === 'delete') {
      remove.run(input.planId)
      return
    }
    const json = JSON.stringify(input.options)
    const previous = find.get(input.planId) as { name: string; options: string } | undefined
    if (previous) {
      if (previous.name !== input.name || previous.options !== json)
        throw new PracticePlanFault('INVALID_REQUEST', '方案ID已存在，不能覆盖不同的条件。')
      return // 同一ID、名称和条件重试，仍是原方案。
    }
    if (findName.get(input.name))
      throw new PracticePlanFault('INVALID_REQUEST', '方案名称已存在，请使用其他名称。')
    if ((count.get() as number) >= MAX_PRACTICE_PLANS)
      throw new PracticePlanFault('INVALID_REQUEST', `最多保存${MAX_PRACTICE_PLANS}份方案。`)
    const scope = input.options.category
    if (scope.kind === 'category' && !category.get(scope.categoryId))
      throw new PracticePlanFault('NOT_FOUND', '分类已移除，请重新选择后保存方案。')
    if (input.options.topicId !== null) {
      const selected = topic.get(input.options.topicId) as { categoryId: string | null } | undefined
      if (!selected || !matchesCategory(selected.categoryId, scope))
        throw new PracticePlanFault('NOT_FOUND', '专题已不在所选范围，请重新选择后保存方案。')
    }
    insert.run(input.planId, input.name, json)
  })
  return {
    listPracticePlans() {
      const found = rows.all() as { planId: string; name: string; options: string }[]
      if (found.length > MAX_PRACTICE_PLANS) throw new Error('方案数量超出支持范围。')
      return found.map((row) =>
        practicePlanSchema.parse({ ...row, options: JSON.parse(row.options) }),
      )
    },
    changePracticePlan(input: PracticePlanChange): void {
      const parsed = practicePlanChangeSchema.parse(input)
      if (database.inTransaction) throw new Error('方案写入不接受外层事务。')
      change.immediate(parsed)
    },
  }
}
