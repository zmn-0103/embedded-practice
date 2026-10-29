import { createHash } from 'node:crypto'
import type Database from 'better-sqlite3'
import { z } from 'zod'
import {
  backupSummarySchema,
  type BackupError,
  type BackupSummary,
} from '../../../shared/contracts/backup'
import { createSettingsRepository } from '../../database/repositories/settings-repository'
import { createThemeRepository } from '../../database/repositories/theme-repository'
import { questionFiltersSchema } from '../../../shared/contracts/question-filters'
import { repeatPracticeSchema } from '../../../shared/contracts/practice'
import { contentBodySchema } from '../../../shared/contracts/library-desktop'
import { categorySchema, categorySnapshotSchema } from '../../../shared/contracts/categories'
import { MAX_PRACTICE_PLANS, practicePlanSchema } from '../../../shared/contracts/practice-plans'
import { APPLICATION_ID, SCHEMA_VERSION } from '../../database/open-database'
import { createQuestionSetRepository } from '../../database/repositories/question-set-repository'
import { noteSchema } from '../../../shared/contracts/study'
import { MAX_PERSONAL_TAGS, personalTagSchema } from '../../../shared/contracts/personal-tags'
import { reviewTodoSchema } from '../../../shared/contracts/review-todos'
import { relationSchema, recentSearchSchema } from '../../../shared/contracts/knowledge'
import {
  dailyTargetSchema,
  examGoalSchema,
  quotaSettingSchema,
  daySchema,
} from '../../../shared/contracts/planning'

export const BACKUP_FORMAT_VERSION = 1
export class BackupFault extends Error {
  constructor(
    readonly code: BackupError['code'],
    message: string,
  ) {
    super(message)
    this.name = 'BackupFault'
  }
}
const metadataSchema = z.strictObject({
  formatVersion: z.literal(BACKUP_FORMAT_VERSION),
  createdAt: z.iso.datetime(),
  appVersion: z.string().min(1).max(100),
  schemaVersion: z.number().int().positive(),
})
export interface BackupHeader {
  schemaVersion: number
  metadata: z.infer<typeof metadataSchema> | null
}

export function checkIntegrity(database: Database.Database): void {
  const integrity = database.pragma('integrity_check') as Record<string, unknown>[]
  if (integrity.length !== 1 || integrity[0]?.['integrity_check'] !== 'ok')
    throw new BackupFault('INVALID_BACKUP', '备份完整性检查失败，请选择完好的备份。')
  const foreignKeys = database.pragma('foreign_key_check') as unknown[]
  if (foreignKeys.length !== 0)
    throw new BackupFault('INVALID_BACKUP', '备份中的数据关联损坏，请选择其他备份。')
}

const manifestColumns = 'id,format_version,created_at,app_version,schema_version'

/**
 * 只校验 backup_manifest 的形状，不比较其中的结构版本。
 * 导出时该表会被整体重写，因此运行库中残留的历史版本元数据不能阻断导出；
 * 真正安装备份前的版本一致性由 readBackupHeader 负责。
 */
export function assertBackupManifestShape(database: Database.Database): boolean {
  database.pragma('trusted_schema = OFF')
  const manifest = database
    .prepare("SELECT type FROM sqlite_schema WHERE name = 'backup_manifest'")
    .get() as { type: string } | undefined
  if (!manifest) return false
  if (manifest.type !== 'table')
    throw new BackupFault('INVALID_BACKUP', '备份时间信息损坏，请选择其他备份。')
  const columns = database.pragma('table_info(backup_manifest)') as { name: string }[]
  if (columns.map((column) => column.name).join(',') !== manifestColumns)
    throw new BackupFault(
      'INVALID_BACKUP',
      '备份元数据结构无法识别，请保留来源文件并选择兼容备份。',
    )
  return true
}

export function readBackupHeader(database: Database.Database): BackupHeader {
  database.pragma('trusted_schema = OFF')
  if (database.pragma('application_id', { simple: true }) !== APPLICATION_ID)
    throw new BackupFault('INVALID_BACKUP', '所选文件不是本应用的数据备份。')
  const version = database.pragma('user_version', { simple: true })
  if (typeof version !== 'number' || version < 1 || version > SCHEMA_VERSION)
    throw new BackupFault('UNSUPPORTED_BACKUP', '备份结构版本不受支持，请使用兼容版本的程序。')
  checkIntegrity(database)
  if (!assertBackupManifestShape(database)) return { schemaVersion: version, metadata: null }
  const rows = database
    .prepare(
      `SELECT format_version AS formatVersion, created_at AS createdAt,
      app_version AS appVersion, schema_version AS schemaVersion FROM backup_manifest`,
    )
    .all()
  const metadata = metadataSchema.safeParse(rows[0])
  if (rows.length !== 1 || !metadata.success || metadata.data.schemaVersion !== version)
    throw new BackupFault('INVALID_BACKUP', '备份格式或时间信息无效，请选择兼容的完整备份。')
  return { schemaVersion: version, metadata: metadata.data }
}

// 检查所有业务列，拒绝只伪造应用标识或缺失业务表的文件；旧结构先在副本中迁移。
const requiredColumns = {
  app_startup: 'id, launch_count, last_started_at',
  library_meta: 'id, revision',
  categories: 'category_id, title',
  practice_plans: 'plan_id, name, options_json, pinned, last_used_at',
  question_sets: 'set_id, name, pinned, last_used_at',
  personal_tags: 'tag_id, name',
  question_personal_tags: 'question_id, tag_id',
  review_todos: 'question_id, revision, state, due_date, reason, updated_at, completed_at',
  question_relations:
    'relation_id, source_question_id, target_question_id, kind, explanation, revision, updated_at',
  recent_knowledge_searches: 'rowid, query, searched_at',
  daily_targets: 'day, rating_target, review_target, revision, updated_at',
  study_goals: 'goal_id, name, deadline, set_ids_json, revision, updated_at',
  quota_settings: 'id, rows_json, revision, updated_at',
  learning_activities: 'activity_id, kind, question_id, session_id, position, occurred_at, day',
  question_set_items: 'set_id, position, topic_id, question_id',
  personal_notes: 'question_id, revision, text, updated_at',
  topics: 'topic_id, title, source_name, category_id',
  questions:
    'id, topic_id, question_id, title, tags_json, difficulty, position, archived, current_version_id',
  question_versions:
    'id, question_id, sequence, title, question_markdown, answer_markdown, definitions_json, image_bindings_json, content_hash, created_at',
  image_resources: 'hash, format, width, height, bytes',
  version_images: 'version_id, resource_hash',
  question_user_state: 'question_id, favorite, last_rating, last_rated_version_id',
  import_receipts: 'token, committed_at, result_json',
  practice_sessions:
    'id, mode, topic_id, status, position, revision, created_at, ended_at, filters_json, category_scope_json, repeat_source_id, repeat_selection, selection_name',
  practice_items:
    'session_id, position, question_id, version_id, title, topic_title, tags_json, difficulty, draft, draft_revision, revealed_at, rating, rated_at, skipped_at',
  practice_receipts: 'request_id, payload_hash, result_json, created_at',
  appearance_settings:
    'id, theme, font_size, palette, theme_id, navigation_collapsed, auxiliary_hidden',
  installed_themes: 'theme_id, version, config_json, content_hash',
} as const

export function readBackupSummary(
  database: Database.Database,
  header: BackupHeader,
): BackupSummary {
  checkIntegrity(database)
  for (const [table, columns] of Object.entries(requiredColumns)) {
    const object = database.prepare('SELECT type FROM sqlite_schema WHERE name = ?').get(table) as
      { type: string } | undefined
    if (object?.type !== 'table')
      throw new BackupFault('INVALID_BACKUP', '备份缺少必要的数据表，请选择完整备份。')
    database.prepare(`SELECT ${columns} FROM ${table} LIMIT 0`).all()
  }
  // 列存在不代表单例行可用：缺少 library_meta 行或修订号类型错误的备份装上后，
  // 题库列表会持续失败，而恢复流程已报告成功。这里提前拒绝。
  const meta = database.prepare('SELECT revision FROM library_meta WHERE id = 1').get() as
    { revision: unknown } | undefined
  if (
    typeof meta?.revision !== 'number' ||
    !Number.isSafeInteger(meta.revision) ||
    meta.revision < 0
  )
    throw new BackupFault('INVALID_BACKUP', '备份缺少题库元数据，请选择完整备份。')
  const settings = createSettingsRepository(database).readSettings()
  for (const [table, key] of [
    ['daily_targets', 'day'],
    ['study_goals', 'goal_id'],
    ['study_goals', 'lower(name)'],
    ['learning_activities', 'activity_id'],
  ] as const)
    if (database.prepare(`SELECT 1 FROM ${table} GROUP BY ${key} HAVING count(*)>1 LIMIT 1`).get())
      throw new BackupFault('INVALID_BACKUP', '备份中的目标或活动身份重复。')
  for (const row of database
    .prepare(
      'SELECT day,rating_target AS ratingTarget,review_target AS reviewTarget,revision,updated_at AS updatedAt FROM daily_targets',
    )
    .iterate())
    dailyTargetSchema.parse({ type: 'daily', ...(row as object) })
  const goals = database
    .prepare(
      'SELECT goal_id AS goalId,name,deadline,set_ids_json AS setIdsJson,revision,updated_at AS updatedAt FROM study_goals LIMIT 21',
    )
    .all() as Record<string, unknown>[]
  if (goals.length > 20) throw new BackupFault('INVALID_BACKUP', '备考目标数量超出上限。')
  for (const { setIdsJson, ...row } of goals)
    examGoalSchema.parse({ type: 'exam', ...row, setIds: JSON.parse(setIdsJson as string) })
  const quotas = database
    .prepare(
      'SELECT id,rows_json AS rowsJson,revision,updated_at AS updatedAt FROM quota_settings LIMIT 2',
    )
    .all() as Record<string, unknown>[]
  if (quotas.length > 1 || quotas.some((row) => row.id !== 1))
    throw new BackupFault('INVALID_BACKUP', '配额设置身份无效。')
  for (const { rowsJson, ...row } of quotas)
    quotaSettingSchema.parse({
      type: 'quota',
      rows: JSON.parse(rowsJson as string),
      revision: row.revision,
      updatedAt: row.updatedAt,
    })
  const activityRow = z.strictObject({
    activityId: z.string().min(1),
    kind: z.enum(['rating', 'reveal', 'review', 'note']),
    questionId: z.number().int().positive(),
    sessionId: z.uuid().nullable(),
    position: z.number().int().nonnegative().nullable(),
    occurredAt: z.iso.datetime(),
    day: daySchema,
    existingQuestionId: z.number().int().positive(),
    itemQuestionId: z.number().int().positive().nullable(),
    revealedAt: z.string().nullable(),
    rating: z.string().nullable(),
  })
  for (const raw of database
    .prepare(
      `SELECT a.activity_id AS activityId,a.kind,a.question_id AS questionId,a.session_id AS sessionId,a.position,a.occurred_at AS occurredAt,a.day,q.id AS existingQuestionId,i.question_id AS itemQuestionId,i.revealed_at AS revealedAt,i.rating FROM learning_activities a LEFT JOIN questions q ON q.id=a.question_id LEFT JOIN practice_items i ON i.session_id=a.session_id AND i.position=a.position`,
    )
    .iterate()) {
    const row = activityRow.parse(raw)
    if (row.kind === 'rating' || row.kind === 'reveal') {
      if (
        row.sessionId === null ||
        row.position === null ||
        row.itemQuestionId !== row.questionId ||
        row.revealedAt === null ||
        (row.kind === 'rating' && row.rating === null) ||
        !z.uuid().safeParse(row.activityId.slice(row.kind.length + 1)).success ||
        !row.activityId.startsWith(`${row.kind}:`)
      )
        throw new BackupFault('INVALID_BACKUP', '练习活动关联或身份无效。')
    } else {
      const prefix = `${row.kind}:${row.questionId}:`,
        revisionText = row.activityId.slice(prefix.length),
        revision = Number(revisionText)
      if (
        row.sessionId !== null ||
        row.position !== null ||
        !row.activityId.startsWith(prefix) ||
        !/^[1-9][0-9]*$/.test(revisionText) ||
        !Number.isSafeInteger(revision)
      )
        throw new BackupFault('INVALID_BACKUP', '学习活动关联或身份无效。')
    }
  }
  if (
    database
      .prepare('SELECT 1 FROM question_relations GROUP BY relation_id HAVING count(*)>1 LIMIT 1')
      .get() ||
    database
      .prepare(
        'SELECT 1 FROM question_relations GROUP BY min(source_question_id,target_question_id),max(source_question_id,target_question_id),kind HAVING count(*)>1 LIMIT 1',
      )
      .get()
  )
    throw new BackupFault('INVALID_BACKUP', '备份中的题目关联身份或题目对重复。')
  for (const row of database
    .prepare(
      `SELECT r.relation_id AS relationId,r.kind,r.explanation,r.revision,r.updated_at AS updatedAt,
    s.topic_id AS sourceTopicId,s.question_id AS sourceQuestionId,t.topic_id AS targetTopicId,t.question_id AS targetQuestionId
    FROM question_relations r LEFT JOIN questions s ON s.id=r.source_question_id LEFT JOIN questions t ON t.id=r.target_question_id`,
    )
    .iterate() as Iterable<Record<string, unknown>>) {
    const { sourceTopicId, sourceQuestionId, targetTopicId, targetQuestionId, ...rest } = row
    relationSchema.parse({
      ...rest,
      source: { topicId: sourceTopicId, questionId: sourceQuestionId },
      target: { topicId: targetTopicId, questionId: targetQuestionId },
    })
  }
  const searches = database
    .prepare('SELECT query,searched_at AS searchedAt FROM recent_knowledge_searches LIMIT 11')
    .all()
  if (
    searches.length > 10 ||
    database
      .prepare('SELECT 1 FROM recent_knowledge_searches GROUP BY query HAVING count(*)>1 LIMIT 1')
      .get()
  )
    throw new BackupFault('INVALID_BACKUP', '备份中的最近搜索数量或身份无效。')
  searches.forEach((row) => recentSearchSchema.parse(row))
  const tags = database
    .prepare(`SELECT tag_id AS tagId,name FROM personal_tags LIMIT ${MAX_PERSONAL_TAGS + 1}`)
    .all()
  if (
    tags.length > MAX_PERSONAL_TAGS ||
    database
      .prepare('SELECT 1 FROM personal_tags GROUP BY tag_id HAVING count(*)>1 LIMIT 1')
      .get() ||
    database
      .prepare('SELECT 1 FROM personal_tags GROUP BY lower(name) HAVING count(*)>1 LIMIT 1')
      .get()
  )
    throw new BackupFault('INVALID_BACKUP', '备份中的个人标签数量或名称无效。')
  for (const tag of tags) personalTagSchema.parse(tag)
  if (
    database
      .prepare('SELECT 1 FROM review_todos GROUP BY question_id HAVING count(*)>1 LIMIT 1')
      .get()
  )
    throw new BackupFault('INVALID_BACKUP', '备份包含重复复习待办。')
  for (const row of database
    .prepare(
      `SELECT q.topic_id AS topicId,q.question_id AS questionId,
    r.revision,r.state,r.due_date AS dueDate,r.reason,r.updated_at AS updatedAt,r.completed_at AS completedAt
    FROM review_todos r LEFT JOIN questions q ON q.id=r.question_id`,
    )
    .iterate())
    reviewTodoSchema.parse(row)
  if (
    database
      .prepare(
        `SELECT 1 FROM question_personal_tags i LEFT JOIN questions q ON q.id=i.question_id
    LEFT JOIN personal_tags t ON t.tag_id=i.tag_id WHERE q.id IS NULL OR t.tag_id IS NULL LIMIT 1`,
      )
      .get() ||
    database
      .prepare(
        'SELECT 1 FROM question_personal_tags GROUP BY question_id,tag_id HAVING count(*)>1 LIMIT 1',
      )
      .get()
  )
    throw new BackupFault('INVALID_BACKUP', '备份中的个人标签题目关联损坏或重复。')
  const shortcuts = database.prepare(`SELECT pinned,last_used_at AS lastUsedAt FROM practice_plans
    UNION ALL SELECT pinned,last_used_at AS lastUsedAt FROM question_sets`)
  const shortcutSchema = z.strictObject({
    pinned: z.union([z.literal(0), z.literal(1)]),
    lastUsedAt: z.iso.datetime().nullable(),
  })
  for (const row of shortcuts.iterate()) shortcutSchema.parse(row)
  const themes = createThemeRepository(database).listThemes()
  if (
    themes.issues.length ||
    !themes.entries.some((entry) => entry.definition.id === settings.themeId)
  )
    throw new BackupFault('INVALID_BACKUP', '备份中的主题配置损坏或当前主题缺失，请选择其他备份。')
  const plans = database
    .prepare(
      `SELECT plan_id AS planId,name,options_json AS options FROM practice_plans LIMIT ${MAX_PRACTICE_PLANS + 1}`,
    )
    .all() as { planId: string; name: string; options: string }[]
  if (
    plans.length > MAX_PRACTICE_PLANS ||
    database
      .prepare('SELECT 1 FROM practice_plans GROUP BY plan_id HAVING count(*)>1 LIMIT 1')
      .get() ||
    database
      .prepare('SELECT 1 FROM practice_plans GROUP BY lower(name) HAVING count(*)>1 LIMIT 1')
      .get()
  )
    throw new BackupFault('INVALID_BACKUP', '备份中的练习方案数量或唯一性无效。')
  for (const row of plans) practicePlanSchema.parse({ ...row, options: JSON.parse(row.options) })
  if (
    database
      .prepare('SELECT 1 FROM question_sets GROUP BY set_id HAVING count(*)>1 LIMIT 1')
      .get() ||
    database
      .prepare('SELECT 1 FROM question_sets GROUP BY lower(name) HAVING count(*)>1 LIMIT 1')
      .get() ||
    database
      .prepare(
        'SELECT 1 FROM question_set_items i WHERE NOT EXISTS (SELECT 1 FROM question_sets s WHERE s.set_id=i.set_id) LIMIT 1',
      )
      .get()
  )
    throw new BackupFault('INVALID_BACKUP', '备份中的固定题单身份、名称或成员关联无效。')
  const sets = createQuestionSetRepository(database)
  const questionSets = sets.listQuestionSets()
  for (const item of questionSets) sets.readQuestionSet(item.setId)
  if (
    database
      .prepare('SELECT 1 FROM personal_notes GROUP BY question_id HAVING count(*)>1 LIMIT 1')
      .get()
  )
    throw new BackupFault('INVALID_BACKUP', '备份包含重复个人笔记。')
  for (const row of database
    .prepare(
      `SELECT q.topic_id AS topicId,q.question_id AS questionId,
    n.revision,n.text,n.updated_at AS updatedAt FROM personal_notes n LEFT JOIN questions q ON q.id=n.question_id`,
    )
    .iterate())
    noteSchema.refine((note) => note.revision > 0).parse(row)
  for (const row of database
    .prepare('SELECT category_id AS categoryId, title FROM categories')
    .iterate()) {
    categorySchema.parse(row)
  }
  if (
    database
      .prepare('SELECT 1 FROM categories GROUP BY category_id HAVING count(*) > 1 LIMIT 1')
      .get() ||
    database
      .prepare('SELECT 1 FROM categories GROUP BY lower(title) HAVING count(*) > 1 LIMIT 1')
      .get() ||
    database
      .prepare(
        `SELECT 1 FROM topics t WHERE t.category_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM categories c WHERE c.category_id = t.category_id) LIMIT 1`,
      )
      .get()
  )
    throw new BackupFault('INVALID_BACKUP', '备份中的分类或专题归属无效，请选择其他备份。')
  for (const row of database
    .prepare(
      `SELECT filters_json AS filters, category_scope_json AS category,
        repeat_source_id AS sourceId, repeat_selection AS selection,
        selection_name AS selectionName FROM practice_sessions`,
    )
    .iterate() as Iterable<{
    filters: string | null
    category: string
    sourceId: string | null
    selection: string | null
    selectionName: string | null
  }>) {
    if (row.filters !== null) questionFiltersSchema.parse(JSON.parse(row.filters))
    categorySnapshotSchema.parse(JSON.parse(row.category))
    if (row.selectionName !== null)
      z.string()
        .min(1)
        .max(80)
        .refine((name) => name === name.trim() && !/[\u0000-\u001f\u007f]/u.test(name))
        .parse(row.selectionName)
    if (row.sourceId !== null || row.selection !== null)
      repeatPracticeSchema.parse({ sessionId: row.sourceId, selection: row.selection })
  }
  if (
    database
      .prepare(
        `SELECT 1 FROM practice_sessions s
        JOIN practice_sessions source ON source.id = s.repeat_source_id
        WHERE source.status = 'active' OR source.id = s.id LIMIT 1`,
      )
      .get()
  )
    throw new BackupFault('INVALID_BACKUP', '备份中的再练来源无效，请选择完整备份。')
  for (const row of database
    .prepare(
      `SELECT question_markdown AS question, answer_markdown AS answer,
      definitions_json AS definitions, image_bindings_json AS bindings FROM question_versions`,
    )
    .iterate() as Iterable<{
    question: string
    answer: string
    definitions: string
    bindings: string
  }>) {
    const content = {
      definitions: JSON.parse(row.definitions),
      imageBindings: JSON.parse(row.bindings),
    }
    contentBodySchema.parse({ ...content, markdown: row.question })
    contentBodySchema.parse({ ...content, markdown: row.answer })
  }
  for (const row of database
    .prepare('SELECT hash, bytes FROM image_resources')
    .iterate() as Iterable<{
    hash: string
    bytes: Buffer
  }>) {
    if (createHash('sha256').update(row.bytes).digest('hex') !== row.hash)
      throw new BackupFault('INVALID_BACKUP', '备份中的图片内容校验失败，请选择其他备份。')
  }
  function count(table: keyof typeof requiredColumns, condition = ''): number {
    return database.prepare(`SELECT count(*) FROM ${table} ${condition}`).pluck().get() as number
  }
  const activeSessions = count('practice_sessions', "WHERE status = 'active'")
  if (activeSessions > 1)
    throw new BackupFault('INVALID_BACKUP', '备份包含多个活动练习轮次，数据状态无效。')
  return backupSummarySchema.parse({
    createdAt: header.metadata?.createdAt ?? null,
    appVersion: header.metadata?.appVersion ?? null,
    schemaVersion: header.schemaVersion,
    requiresMigration: header.schemaVersion < SCHEMA_VERSION,
    categories: count('categories'),
    practicePlans: plans.length,
    questionSets: questionSets.length,
    personalNotes: count('personal_notes', 'WHERE length(CAST(text AS BLOB))>0'),
    installedThemes: themes.entries.filter((entry) => !entry.builtIn).length,
    appearance: settings,
    topics: count('topics'),
    questions: count('questions'),
    archivedQuestions: count('questions', 'WHERE archived = 1'),
    versions: count('question_versions'),
    images: count('image_resources'),
    sessions: count('practice_sessions'),
    drafts: count('practice_items', "WHERE draft <> ''"),
    favorites: count('question_user_state', 'WHERE favorite = 1'),
    ratings: count('practice_items', 'WHERE rating IS NOT NULL'),
    activeSession: activeSessions === 1,
  })
}
