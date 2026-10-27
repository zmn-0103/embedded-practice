import { createHash } from 'node:crypto'
import type Database from 'better-sqlite3'
import { z } from 'zod'
import {
  backupSummarySchema,
  type BackupError,
  type BackupSummary,
} from '../../../shared/contracts/backup'
import { appearanceSchema } from '../../../shared/contracts/settings'
import { questionFiltersSchema } from '../../../shared/contracts/question-filters'
import { contentBodySchema } from '../../../shared/contracts/library-desktop'
import { categorySchema, categorySnapshotSchema } from '../../../shared/contracts/categories'
import { MAX_PRACTICE_PLANS, practicePlanSchema } from '../../../shared/contracts/practice-plans'
import { APPLICATION_ID, SCHEMA_VERSION } from '../../database/open-database'

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

export function readBackupHeader(database: Database.Database): BackupHeader {
  database.pragma('trusted_schema = OFF')
  if (database.pragma('application_id', { simple: true }) !== APPLICATION_ID)
    throw new BackupFault('INVALID_BACKUP', '所选文件不是本应用的数据备份。')
  const version = database.pragma('user_version', { simple: true })
  if (typeof version !== 'number' || version < 1 || version > SCHEMA_VERSION)
    throw new BackupFault('UNSUPPORTED_BACKUP', '备份结构版本不受支持，请使用兼容版本的程序。')
  checkIntegrity(database)
  const manifest = database
    .prepare("SELECT type FROM sqlite_schema WHERE name = 'backup_manifest'")
    .get() as { type: string } | undefined
  if (!manifest) return { schemaVersion: version, metadata: null }
  if (manifest.type !== 'table')
    throw new BackupFault('INVALID_BACKUP', '备份时间信息损坏，请选择其他备份。')
  const columns = database.pragma('table_info(backup_manifest)') as { name: string }[]
  if (
    columns.map((column) => column.name).join(',') !==
    'id,format_version,created_at,app_version,schema_version'
  )
    throw new BackupFault(
      'INVALID_BACKUP',
      '备份元数据结构无法识别，请保留来源文件并选择兼容备份。',
    )
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
  practice_plans: 'plan_id, name, options_json',
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
    'id, mode, topic_id, status, position, revision, created_at, ended_at, filters_json, category_scope_json',
  practice_items:
    'session_id, position, question_id, version_id, title, topic_title, tags_json, difficulty, draft, draft_revision, revealed_at, rating, rated_at, skipped_at',
  practice_receipts: 'request_id, payload_hash, result_json, created_at',
  appearance_settings: 'id, theme, font_size, palette',
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
  const settings = database
    .prepare('SELECT theme, palette, font_size AS fontSize FROM appearance_settings WHERE id = 1')
    .get()
  if (!appearanceSchema.safeParse(settings).success)
    throw new BackupFault('INVALID_BACKUP', '备份中的显示设置无效，请选择其他备份。')
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
      'SELECT filters_json AS filters, category_scope_json AS category FROM practice_sessions',
    )
    .iterate() as Iterable<{ filters: string | null; category: string }>) {
    if (row.filters !== null) questionFiltersSchema.parse(JSON.parse(row.filters))
    categorySnapshotSchema.parse(JSON.parse(row.category))
  }
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
