import type Database from 'better-sqlite3'
import { createActivityWriter } from './activity-writer'
import { identitySchema, type QuestionIdentity } from '../../../shared/contracts/library-desktop'
import { noteSchema, saveNoteSchema, type SaveNote } from '../../../shared/contracts/study'
import { StudyFault } from './study-fault'

export function createNoteRepository(database: Database.Database) {
  const recordActivity = createActivityWriter(database)
  const find = database.prepare('SELECT id FROM questions WHERE topic_id=? AND question_id=?')
  const get = database.prepare(
    'SELECT revision,text,updated_at AS updatedAt FROM personal_notes WHERE question_id=?',
  )
  const insert = database.prepare('INSERT INTO personal_notes VALUES(?,?,?,?)')
  const update = database.prepare(
    'UPDATE personal_notes SET revision=?,text=?,updated_at=? WHERE question_id=?',
  )
  function question(identity: QuestionIdentity) {
    const row = find.get(identity.topicId, identity.questionId) as { id: number } | undefined
    if (!row) throw new StudyFault('NOT_FOUND', '题目已失效，未修改个人笔记。')
    return row.id
  }
  function read(identity: QuestionIdentity, id: number) {
    const row = get.get(id) as { revision: number; text: string; updatedAt: string } | undefined
    return noteSchema.parse({ ...identity, ...(row ?? { revision: 0, text: '', updatedAt: null }) })
  }
  const readTransaction = database.transaction((input: QuestionIdentity) =>
    read(input, question(input)),
  )
  const saveTransaction = database.transaction((input: SaveNote) => {
    const identity = { topicId: input.topicId, questionId: input.questionId }
    const id = question(identity),
      previous = read(identity, id)
    if (previous.revision === input.expectedRevision + 1 && previous.text === input.text)
      return previous
    if (previous.revision !== input.expectedRevision)
      throw new StudyFault(
        'NOTE_CONFLICT',
        '笔记已被其他编辑更新。当前输入保留，请核对后明确重新读取，不能覆盖较新内容。',
      )
    if (previous.text === input.text) return previous
    const next = noteSchema.parse({
      ...identity,
      revision: previous.revision + 1,
      text: input.text,
      updatedAt: new Date().toISOString(),
    })
    if (previous.revision === 0) insert.run(id, next.revision, next.text, next.updatedAt)
    else update.run(next.revision, next.text, next.updatedAt, id)
    recordActivity(`note:${id}:${next.revision}`, 'note', id, next.updatedAt!)
    return next
  })
  return {
    readNote(input: QuestionIdentity) {
      return readTransaction.deferred(identitySchema.parse(input))
    },
    saveNote(input: SaveNote) {
      if (database.inTransaction) throw new Error('笔记写入不接受外层事务。')
      return saveTransaction.immediate(saveNoteSchema.parse(input))
    },
  }
}
