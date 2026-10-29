import type Database from 'better-sqlite3'
import {
  MAX_PERSONAL_TAGS,
  personalTagChangeSchema,
  personalTagSchema,
  type PersonalTagChange,
} from '../../../shared/contracts/personal-tags'

export class PersonalTagFault extends Error {
  constructor(
    readonly code: 'INVALID_REQUEST' | 'NOT_FOUND',
    message: string,
  ) {
    super(message)
  }
}

export function createPersonalTagRepository(database: Database.Database) {
  const list = database.prepare(`SELECT tag_id AS tagId,name FROM personal_tags
    ORDER BY name COLLATE NOCASE,tag_id LIMIT ${MAX_PERSONAL_TAGS + 1}`)
  const find = database.prepare('SELECT name FROM personal_tags WHERE tag_id=?')
  const duplicate = database.prepare('SELECT 1 FROM personal_tags WHERE name=? AND tag_id<>?')
  const count = database.prepare('SELECT count(*) FROM personal_tags').pluck()
  const insert = database.prepare('INSERT INTO personal_tags(tag_id,name) VALUES(?,?)')
  const rename = database.prepare('UPDATE personal_tags SET name=? WHERE tag_id=?')
  const remove = database.prepare('DELETE FROM personal_tags WHERE tag_id=?')
  const question = database
    .prepare('SELECT id FROM questions WHERE topic_id=? AND question_id=?')
    .pluck()
  const assign = database.prepare(`INSERT INTO question_personal_tags(question_id,tag_id)
    VALUES(?,?) ON CONFLICT DO NOTHING`)
  const unassign = database.prepare(
    'DELETE FROM question_personal_tags WHERE question_id=? AND tag_id=?',
  )
  const change = database.transaction((input: PersonalTagChange) => {
    const previous = find.get(input.tagId) as { name: string } | undefined
    if (input.kind === 'save') {
      if (previous?.name === input.name) return
      if (previous) throw new PersonalTagFault('INVALID_REQUEST', '标签身份已存在，请核对列表。')
      if ((count.get() as number) >= MAX_PERSONAL_TAGS)
        throw new PersonalTagFault('INVALID_REQUEST', `最多创建${MAX_PERSONAL_TAGS}个个人标签。`)
    } else {
      if (!previous) {
        if (input.kind === 'delete') return
        throw new PersonalTagFault('NOT_FOUND', '个人标签已删除，请重新读取。')
      }
      if (input.kind === 'rename' && previous.name === input.name) return
      if ('expectedName' in input && previous.name !== input.expectedName)
        throw new PersonalTagFault('INVALID_REQUEST', '标签已经改名，请重新读取后操作。')
      if (input.kind === 'delete') {
        remove.run(input.tagId)
        return
      }
      if (input.kind === 'assign') {
        for (const item of input.items) {
          const questionId = question.get(item.topicId, item.questionId)
          if (typeof questionId !== 'number')
            throw new PersonalTagFault(
              'NOT_FOUND',
              '勾选中有失效题目，本批标签未作更改，请重新核对。',
            )
          if (input.present) assign.run(questionId, input.tagId)
          else unassign.run(questionId, input.tagId)
        }
        return
      }
    }
    if (duplicate.get(input.name, input.tagId))
      throw new PersonalTagFault('INVALID_REQUEST', '个人标签名称已存在，请使用其他名称。')
    if (input.kind === 'save') insert.run(input.tagId, input.name)
    else rename.run(input.name, input.tagId)
  })
  return {
    listPersonalTags() {
      const rows = list.all()
      if (rows.length > MAX_PERSONAL_TAGS) throw new Error('个人标签数量超出支持范围。')
      return rows.map((row) => personalTagSchema.parse(row))
    },
    changePersonalTag(input: PersonalTagChange) {
      if (database.inTransaction) throw new Error('标签写入不接受外层事务。')
      change.immediate(personalTagChangeSchema.parse(input))
    },
  }
}
