import { startupRecordSchema, type StartupRecord } from '../../shared/contracts/application'
import { copyFile, lstat, mkdtemp, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import Database from 'better-sqlite3'
import { APPLICATION_ID, SCHEMA_VERSION, openPracticeDatabase } from './open-database'

// 先在私有副本上检查：即使打开失败，SQLite 也可能处理 WAL/SHM，不能先碰故障原件。
async function checkStartupCopy(databasePath: string): Promise<void> {
  const files: string[] = []
  for (const suffix of ['', '-wal', '-shm', '-journal']) {
    try {
      const entry = await lstat(databasePath + suffix)
      if (!entry.isFile() || entry.isSymbolicLink()) throw new Error('数据库文件类型异常。')
      files.push(suffix)
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error
    }
  }
  if (!files.includes('')) {
    if (files.length) throw new Error('数据库缺失但仍有伴随文件，停止初始化并保留现场。')
    return
  }
  const directory = await mkdtemp(join(dirname(databasePath), '.startup-check-'))
  try {
    const staged = join(directory, 'practice.sqlite3')
    for (const suffix of files) await copyFile(databasePath + suffix, staged + suffix)
    const checked = new Database(staged)
    try {
      const applicationId = checked.pragma('application_id', { simple: true })
      const version = checked.pragma('user_version', { simple: true })
      const empty =
        applicationId === 0 &&
        version === 0 &&
        !checked.prepare("SELECT 1 FROM sqlite_schema WHERE name NOT GLOB 'sqlite_*' LIMIT 1").get()
      if (empty && files.length > 1) throw new Error('空数据库仍有伴随文件，停止初始化并保留现场。')
      if (
        !empty &&
        (applicationId !== APPLICATION_ID ||
          typeof version !== 'number' ||
          version < 1 ||
          version > SCHEMA_VERSION)
      )
        throw new Error('数据库应用标识或结构版本不受支持，保留原文件。')
      if (
        checked.pragma('integrity_check', { simple: true }) !== 'ok' ||
        (checked.pragma('foreign_key_check') as unknown[]).length
      )
        throw new Error('数据库完整性或关联检查失败，保留原文件。')
      if (!empty)
        checked.prepare('SELECT id, launch_count, last_started_at FROM app_startup LIMIT 0').all()
    } finally {
      checked.close()
    }
  } finally {
    // 只删除本函数 mkdtemp 创建的副本；从未移动或修改原数据库。
    await rm(directory, { recursive: true, force: true })
  }
}

export interface StartupStore {
  recordLaunch(): StartupRecord
  read(): StartupRecord
  close(): void
}

export async function openStartupStore(databasePath: string): Promise<StartupStore> {
  await checkStartupCopy(databasePath)
  const database = await openPracticeDatabase(databasePath)
  try {
    const read = database.prepare(`
      SELECT launch_count AS launchCount, last_started_at AS lastStartedAt
      FROM app_startup WHERE id = 1
    `)
    const write = database.prepare(`
      INSERT INTO app_startup (id, launch_count, last_started_at) VALUES (1, 1, ?)
      ON CONFLICT(id) DO UPDATE SET
        launch_count = app_startup.launch_count + 1,
        last_started_at = excluded.last_started_at
      RETURNING launch_count AS launchCount, last_started_at AS lastStartedAt
    `)
    const recordLaunch = database.transaction(() =>
      startupRecordSchema.parse(write.get(new Date().toISOString())),
    )

    return {
      recordLaunch,
      read: () => startupRecordSchema.parse(read.get()),
      close: () => {
        if (database.open) database.close()
      },
    }
  } catch (error) {
    database.close()
    throw error
  }
}
