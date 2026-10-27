import { startupRecordSchema, type StartupRecord } from '../../shared/contracts/application'
import { openPracticeDatabase } from './open-database'

export interface StartupStore {
  recordLaunch(): StartupRecord
  read(): StartupRecord
  close(): void
}

export async function openStartupStore(databasePath: string): Promise<StartupStore> {
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
