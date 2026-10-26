import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { expect, launchApplication, readAppStatus, test } from './helpers'

const invalidDatabases = [
  { name: '损坏文件', sql: undefined },
  {
    name: '无应用标识的非空库',
    sql: "CREATE TABLE sqlitex_private (value TEXT); INSERT INTO sqlitex_private VALUES ('retain');",
  },
  {
    name: '不受支持的结构版本',
    sql: `
      PRAGMA application_id = 0x45505231;
      PRAGMA user_version = 999;
      CREATE TABLE retained (value TEXT);
      INSERT INTO retained VALUES ('retain');
    `,
  },
]

for (const scenario of invalidDatabases) {
  test(`${scenario.name}报错且原文件不变`, async ({ testDataDirectory }, testInfo) => {
    const databasePath = join(testDataDirectory, 'practice.sqlite3')
    if (scenario.sql) {
      const database = new DatabaseSync(databasePath)
      try {
        database.exec(scenario.sql)
      } finally {
        database.close()
      }
    } else {
      await writeFile(databasePath, 'This is intentionally not a SQLite database.')
    }
    const before = await readFile(databasePath)

    const { application, page } = await launchApplication(testDataDirectory, testInfo.project.name)
    try {
      await expect(page.locator('.service-status')).toContainText('本地数据暂不可用')
      const status = await readAppStatus(page)
      expect(status.ok).toBe(false)
      if (status.ok) throw new Error('无效数据库被误判为可用。')
      expect(status.error.code).toBe('DATABASE_UNAVAILABLE')
      await page.getByRole('button', { name: '重新检查' }).click()
      await expect(page.locator('.service-status')).toContainText('本地数据暂不可用')
    } finally {
      await application.close()
    }

    expect(await readFile(databasePath)).toEqual(before)
  })
}
