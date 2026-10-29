import { createHash, randomUUID } from 'node:crypto'
import type Database from 'better-sqlite3'
import { contentBodySchema } from '../../../shared/contracts/library-desktop'
import { materialRequestSchema, type MaterialRequest } from '../../../shared/contracts/study'
import { createNoteRepository } from './note-repository'
import { createQuestionSetRepository, QuestionSetFault } from './question-set-repository'
import { createRoundReader } from './round-reader'
import { StudyFault } from './study-fault'
import { exportBody, literalBlock, markdownText } from '../../services/study/export-markdown'

export interface MaterialBundle {
  markdown: string
  count: number
  assetsName: string
  images: { name: string; bytes: Buffer }[]
}
interface MaterialRow {
  id: number
  topicId: string
  questionId: string
  versionId: number
  sequence: number
  title: string
  topicTitle: string
  markdown: string
  definitions: string
  imageBindings: string
  answerText: string | null
  text: string | null
}
export function createMaterialReader(database: Database.Database) {
  const sets = createQuestionSetRepository(database),
    rounds = createRoundReader(database),
    notes = createNoteRepository(database)
  const content = `q.id,q.topic_id AS topicId,q.question_id AS questionId,v.id AS versionId,v.sequence,
    v.question_markdown AS markdown,v.definitions_json AS definitions,v.image_bindings_json AS imageBindings,
    CASE WHEN @answers=1 THEN v.answer_markdown ELSE NULL END AS answerText`
  const current = database.prepare(`SELECT ${content},q.title,t.title AS topicTitle,NULL AS text
    FROM questions q JOIN topics t ON t.topic_id=q.topic_id
    JOIN question_versions v ON v.id=q.current_version_id AND v.question_id=q.id
    WHERE q.topic_id=@topicId AND q.question_id=@questionId AND q.archived=0`)
  const fixed = database.prepare(`SELECT ${content},i.title,i.topic_title AS topicTitle,
    CASE WHEN @personal=1 THEN i.draft ELSE NULL END AS text
    FROM practice_items i JOIN questions q ON q.id=i.question_id
    JOIN question_versions v ON v.id=i.version_id AND v.question_id=q.id
    WHERE i.session_id=@sessionId ORDER BY i.position LIMIT 501`)
  const own = database.prepare(`SELECT i.draft AS text FROM practice_items i
    JOIN practice_sessions s ON s.id=i.session_id WHERE i.question_id=? AND i.version_id=?
    AND s.status<>'active' AND (i.draft_revision>0 OR i.revealed_at IS NOT NULL OR i.skipped_at IS NOT NULL)
    ORDER BY s.created_at DESC,s.rowid DESC LIMIT 1`)
  const image = database.prepare(`SELECT r.bytes,r.format FROM image_resources r
    JOIN version_images v ON v.resource_hash=r.hash WHERE v.version_id=? AND r.hash=?`)
  const prepare = database.transaction((input: MaterialRequest): MaterialBundle => {
    const answers = Number(input.mode === 'answers'),
      personal = input.mode === 'personal'
    let label: string, rows: MaterialRow[]
    if (input.source.kind === 'set') {
      let definition
      try {
        definition = sets.readQuestionSet(input.source.setId)
      } catch (error) {
        if (error instanceof QuestionSetFault) throw new StudyFault(error.code, error.message)
        throw error
      }
      label = `固定题单：${definition.name}；采用导出时当前有效版本，按题单顺序。`
      rows = definition.items.map((item) => {
        const row = current.get({ ...item, answers }) as MaterialRow | undefined
        if (!row)
          throw new StudyFault(
            'NOT_FOUND',
            '题单包含归档/失效项，未导出或自动补题。请载入题单后明确处理。',
          )
        if (personal)
          row.text = (own.get(row.id, row.versionId) as { text: string } | undefined)?.text ?? null
        return row
      })
    } else {
      const round = rounds.readRound({ sessionId: input.source.sessionId, page: 1 }).session
      label = `练习轮次：${round.createdAt}；${round.selectionName ?? round.topicId ?? '全部专题'}；采用本轮固定版本和顺序。`
      rows = fixed.all({
        sessionId: input.source.sessionId,
        answers,
        personal: Number(personal),
      }) as MaterialRow[]
      if (round.total !== rows.length && round.total <= 500) throw new Error('轮次内容不完整。')
    }
    if (rows.length === 0 || rows.length > 500)
      throw new StudyFault('LIMIT_EXCEEDED', '每次导出须为1～500道题，未截断材料。')
    const assetsName = `review-assets-${randomUUID()}`
    const images = new Map<string, { name: string; bytes: Buffer }>()
    let imageBytes = 0
    const parts = [
      `# 复习材料\n\n${markdownText(label)}\n\n共${rows.length}题；内容：${{ questions: '仅题目', answers: '题目＋参考答案', personal: '题目＋自己的作答＋当前个人笔记' }[input.mode]}。\n`,
    ]
    if (personal)
      parts.push(
        '题单仅采用当前版本最近一次已结束轮次的实际作答；轮次采用本轮作答。笔记为导出时已保存的当前笔记，并非当时笔记快照。\n',
      )
    let textBytes = Buffer.byteLength(parts.join('\n'))
    rows.forEach((row, index) => {
      const body = contentBodySchema.parse({
        markdown: row.markdown,
        definitions: JSON.parse(row.definitions),
        imageBindings: JSON.parse(row.imageBindings),
      })
      const url = (hash: string) => {
        const resource = image.get(row.versionId, hash) as
          { bytes: Buffer; format: string } | undefined
        if (
          !resource ||
          !['png', 'jpeg', 'webp'].includes(resource.format) ||
          createHash('sha256').update(resource.bytes).digest('hex') !== hash
        )
          throw new StudyFault('FILE_ERROR', '入库图片缺失或损坏，材料未导出。')
        if (!images.has(hash)) {
          imageBytes += resource.bytes.length
          if (imageBytes > 100 * 1024 * 1024)
            throw new StudyFault('LIMIT_EXCEEDED', '图片累计超过100MiB，未截断导出。')
          images.set(hash, { name: `${hash}.${resource.format}`, bytes: resource.bytes })
        }
        return `${assetsName}/${images.get(hash)!.name}`
      }
      const section = [
        `## ${index + 1}. ${markdownText(row.title)}\n`,
        markdownText(
          `${row.topicTitle} · ${row.topicId}/${row.questionId} · 内容版本${row.sequence}`,
        ),
        '\n### 题目\n',
        exportBody(body, url),
      ]
      if (row.answerText !== null)
        section.push('\n### 参考答案\n', exportBody({ ...body, markdown: row.answerText }, url))
      if (personal) {
        section.push(
          '\n### 我的作答\n',
          row.text === null
            ? '当前版本尚无已结束轮次的实际作答。'
            : row.text === ''
              ? '该记录未填写答案。'
              : literalBlock(row.text),
        )
        const note = notes.readNote({ topicId: row.topicId, questionId: row.questionId })
        section.push('\n### 当前个人笔记\n', note.text ? literalBlock(note.text) : '尚无个人笔记。')
      }
      const text = section.join('\n')
      textBytes += Buffer.byteLength(text) + 2
      if (textBytes > 50 * 1024 * 1024)
        throw new StudyFault('LIMIT_EXCEEDED', '正文累计超过50MiB，未截断导出。')
      parts.push(text)
    })
    return {
      markdown: parts.join('\n\n') + '\n',
      count: rows.length,
      assetsName,
      images: [...images.values()],
    }
  })
  return {
    prepareMaterial: (input: MaterialRequest) =>
      prepare.deferred(materialRequestSchema.parse(input)),
  }
}
