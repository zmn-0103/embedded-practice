import { randomUUID } from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import Database from 'better-sqlite3'
import { librarySchema } from './library-schema'
import {
  practiceSchema,
  randomModeMigration,
  sessionFiltersMigration,
  repeatPracticeMigration,
} from './practice-schema'
import { paletteMigration, settingsSchema, themeMigration } from './settings-schema'
import { categoryMigration } from './category-schema'
import { practicePlanMigration } from './practice-plan-schema'
import { questionSetMigration } from './question-set-schema'
import { personalNoteMigration } from './note-schema'
import { personalTagMigration } from './personal-tag-schema'
import { reviewTodoMigration } from './review-schema'
import { knowledgeMigration } from './knowledge-schema'
import { planningMigration } from './planning-schema'

export const APPLICATION_ID = 0x45505231
export const SCHEMA_VERSION = 17

const startupSchema = `
  CREATE TABLE app_startup (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    launch_count INTEGER NOT NULL CHECK (launch_count > 0),
    last_started_at TEXT NOT NULL
  ) STRICT;
`

async function protectBeforeMigration(
  database: Database.Database,
  databasePath: string,
  version: number,
): Promise<void> {
  const directory = join(dirname(databasePath), 'backups')
  await mkdir(directory, { recursive: true })
  const destination = join(directory, `pre-migration-v${version}-${randomUUID()}.sqlite3`)
  await database.backup(destination)
  const backup = new Database(destination, { readonly: true, fileMustExist: true })
  try {
    if (
      backup.pragma('integrity_check', { simple: true }) !== 'ok' ||
      backup.pragma('application_id', { simple: true }) !== APPLICATION_ID ||
      backup.pragma('user_version', { simple: true }) !== version
    ) {
      throw new Error('迁移前备份校验失败，停止升级并保留原数据库。')
    }
  } finally {
    backup.close()
  }
}

export async function openPracticeDatabase(databasePath: string): Promise<Database.Database> {
  const database = new Database(databasePath)
  try {
    const applicationId = database.pragma('application_id', { simple: true })
    const version = database.pragma('user_version', { simple: true })
    database.pragma('foreign_keys = ON')
    // 同一文件由启动、题库、练习、备份多个连接共用；短暂的外部占用应等待而不是立即失败。
    database.pragma('busy_timeout = 5000')
    if (applicationId === 0 && version === 0) {
      const objects = database
        .prepare("SELECT name FROM sqlite_schema WHERE name NOT GLOB 'sqlite_*'")
        .all()
      if (objects.length > 0) throw new Error('数据库没有应用标识且并非空库，停止初始化。')
      database
        .transaction(() => {
          database.exec(
            startupSchema +
              librarySchema +
              practiceSchema +
              settingsSchema +
              sessionFiltersMigration +
              paletteMigration +
              categoryMigration +
              practicePlanMigration +
              themeMigration +
              repeatPracticeMigration +
              questionSetMigration +
              personalNoteMigration +
              personalTagMigration +
              reviewTodoMigration +
              knowledgeMigration +
              planningMigration,
          )
          database.pragma(`application_id = ${APPLICATION_ID}`)
          database.pragma(`user_version = ${SCHEMA_VERSION}`)
        })
        .immediate()
    } else if (
      applicationId === APPLICATION_ID &&
      typeof version === 'number' &&
      version >= 1 &&
      version < SCHEMA_VERSION
    ) {
      await protectBeforeMigration(database, databasePath, version)
      // SQLite 修改父表 CHECK 需替换表，外键开关必须在事务外操作。
      if (version === 3) database.pragma('foreign_keys = OFF')
      try {
        database
          .transaction(() => {
            if (
              database.pragma('user_version', { simple: true }) !== version ||
              database.pragma('application_id', { simple: true }) !== APPLICATION_ID
            ) {
              throw new Error('备份期间数据库结构已变化，停止升级。')
            }
            // 缺少旧表或已有同名新表会使事务失败，不自动修补未知结构。
            database.prepare('SELECT id, launch_count, last_started_at FROM app_startup').all()
            if (version === 1) database.exec(librarySchema)
            else {
              database.prepare('SELECT revision FROM library_meta WHERE id = 1').get()
              database.prepare('SELECT id, question_id FROM question_versions LIMIT 0').all()
            }
            if (version === 3) {
              const extra = database
                .prepare(
                  `SELECT name FROM sqlite_schema WHERE tbl_name = 'practice_sessions'
                  AND type IN ('index', 'trigger') AND name NOT IN
                  ('sqlite_autoindex_practice_sessions_1', 'practice_one_active')`,
                )
                .all()
              if (extra.length > 0)
                throw new Error('会话表存在未知索引或触发器，停止升级并保留原数据库。')
            }
            if (version < 4) database.exec(version === 3 ? randomModeMigration : practiceSchema)
            if (version < 5) database.exec(settingsSchema)
            if (version < 6) database.exec(sessionFiltersMigration)
            if (version < 7) database.exec(paletteMigration)
            if (version < 8) database.exec(categoryMigration)
            if (version < 9) database.exec(practicePlanMigration)
            if (version < 10) database.exec(themeMigration)
            if (version < 11) database.exec(repeatPracticeMigration)
            if (version < 12) database.exec(questionSetMigration)
            if (version < 13) database.exec(personalNoteMigration)
            if (version < 14) database.exec(personalTagMigration)
            if (version < 15) database.exec(reviewTodoMigration)
            if (version < 16) database.exec(knowledgeMigration)
            database.exec(planningMigration)
            const foreignKeys = database.pragma('foreign_key_check')
            if (!Array.isArray(foreignKeys) || foreignKeys.length > 0)
              throw new Error('迁移后外键校验失败，回滚升级并保留原数据库。')
            database.pragma(`user_version = ${SCHEMA_VERSION}`)
          })
          .immediate()
      } finally {
        if (version === 3) database.pragma('foreign_keys = ON')
      }
    } else if (applicationId !== APPLICATION_ID || version !== SCHEMA_VERSION) {
      throw new Error('数据库应用标识或结构版本不受支持，保留原文件。')
    }
    database.pragma('journal_mode = WAL')
    database.pragma('synchronous = FULL')
    return database
  } catch (error) {
    database.close()
    throw error
  }
}
