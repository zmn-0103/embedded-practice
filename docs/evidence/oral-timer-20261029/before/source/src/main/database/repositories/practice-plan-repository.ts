import type Database from 'better-sqlite3'
import {
  MAX_PRACTICE_PLANS,
  practicePlanChangeSchema,
  practicePlanOptionsSchema,
  practicePlanSchema,
  practicePlanSummarySchema,
  type PracticePlanChange,
} from '../../../shared/contracts/practice-plans'
import { matchesCategory } from '../../../shared/contracts/categories'
import {
  questionSelectionFrom,
  questionSelectionWhere,
  questionSelectionParameters,
} from './question-selection'

export class PracticePlanFault extends Error {
  constructor(
    readonly code: 'INVALID_REQUEST' | 'NOT_FOUND',
    message: string,
  ) {
    super(message)
  }
}

export function createPracticePlanRepository(database: Database.Database) {
  const rows =
    database.prepare(`SELECT plan_id AS planId,name,options_json AS options,pinned,last_used_at AS lastUsedAt
    FROM practice_plans ORDER BY pinned DESC,last_used_at DESC,name COLLATE NOCASE,plan_id LIMIT ${MAX_PRACTICE_PLANS + 1}`)
  const matching = database
    .prepare(`SELECT count(*) ${questionSelectionFrom} WHERE ${questionSelectionWhere}`)
    .pluck()
  const tag = database.prepare('SELECT 1 FROM personal_tags WHERE tag_id=?')
  const pin = database.prepare('UPDATE practice_plans SET pinned=? WHERE plan_id=?')
  const find = database.prepare(
    'SELECT name,options_json AS options FROM practice_plans WHERE plan_id=?',
  )
  const findName = database.prepare('SELECT 1 FROM practice_plans WHERE name=? AND plan_id<>?')
  const count = database.prepare('SELECT count(*) FROM practice_plans').pluck()
  const insert = database.prepare(
    'INSERT INTO practice_plans(plan_id,name,options_json) VALUES(?,?,?)',
  )
  const remove = database.prepare('DELETE FROM practice_plans WHERE plan_id=?')
  const update = database.prepare('UPDATE practice_plans SET name=?,options_json=? WHERE plan_id=?')
  const category = database.prepare('SELECT 1 FROM categories WHERE category_id=?')
  const topic = database.prepare('SELECT category_id AS categoryId FROM topics WHERE topic_id=?')
  const change = database.transaction((input: PracticePlanChange) => {
    if (input.kind === 'pin') {
      if (!pin.run(Number(input.pinned), input.planId).changes)
        throw new PracticePlanFault('NOT_FOUND', '方案已删除，请重新读取。')
      return
    }
    if (input.kind === 'delete') {
      remove.run(input.planId)
      return
    }
    const json = JSON.stringify(input.options)
    const previous = find.get(input.planId) as { name: string; options: string } | undefined
    const previousJson = previous
      ? JSON.stringify(practicePlanOptionsSchema.parse(JSON.parse(previous.options)))
      : undefined
    if (previous?.name === input.name && previousJson === json) return
    if (input.kind === 'update') {
      if (!previous) throw new PracticePlanFault('NOT_FOUND', '方案已删除，请重新读取后选择。')
      if (
        previous.name !== input.expected.name ||
        previousJson !== JSON.stringify(input.expected.options)
      )
        throw new PracticePlanFault('INVALID_REQUEST', '方案已变化，请重新读取后再编辑。')
    } else if (previous)
      throw new PracticePlanFault('INVALID_REQUEST', '方案ID已存在，不能覆盖不同的条件。')
    if (findName.get(input.name, input.planId))
      throw new PracticePlanFault('INVALID_REQUEST', '方案名称已存在，请使用其他名称。')
    if (input.kind === 'save' && (count.get() as number) >= MAX_PRACTICE_PLANS)
      throw new PracticePlanFault('INVALID_REQUEST', `最多保存${MAX_PRACTICE_PLANS}份方案。`)
    // 只改名称时保留原失效条件；实际替换条件必须重新确认范围有效。
    if (input.kind === 'update' && previousJson === json) {
      update.run(input.name, json, input.planId)
      return
    }
    const scope = input.options.category
    if (input.options.filters.personalTagId && !tag.get(input.options.filters.personalTagId))
      throw new PracticePlanFault('NOT_FOUND', '个人标签已删除，请重新选择后保存方案。')
    if (scope.kind === 'category' && !category.get(scope.categoryId))
      throw new PracticePlanFault('NOT_FOUND', '分类已移除，请重新选择后保存方案。')
    if (input.options.topicId !== null) {
      const selected = topic.get(input.options.topicId) as { categoryId: string | null } | undefined
      if (!selected || !matchesCategory(selected.categoryId, scope))
        throw new PracticePlanFault('NOT_FOUND', '专题已不在所选范围，请重新选择后保存方案。')
    }
    if (input.kind === 'update') update.run(input.name, json, input.planId)
    else insert.run(input.planId, input.name, json)
  })
  return {
    listPracticePlans() {
      const found = rows.all() as {
        planId: string
        name: string
        options: string
        pinned: number
        lastUsedAt: string | null
      }[]
      if (found.length > MAX_PRACTICE_PLANS) throw new Error('方案数量超出支持范围。')
      return found.map((row) => {
        const plan = practicePlanSchema.parse({
          planId: row.planId,
          name: row.name,
          options: JSON.parse(row.options),
        })
        return practicePlanSummarySchema.parse({
          ...plan,
          pinned: Boolean(row.pinned),
          lastUsedAt: row.lastUsedAt,
          matchingCount: matching.get(questionSelectionParameters(plan.options)),
          personalTagMissing: Boolean(
            plan.options.filters.personalTagId && !tag.get(plan.options.filters.personalTagId),
          ),
        })
      })
    },
    changePracticePlan(input: PracticePlanChange): void {
      const parsed = practicePlanChangeSchema.parse(input)
      if (database.inTransaction) throw new Error('方案写入不接受外层事务。')
      change.immediate(parsed)
    },
  }
}
