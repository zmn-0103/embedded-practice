import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  hashBackupFile,
  preserveUnavailableDatabase,
  recoverDatabaseReplacement,
  replaceDatabase,
} from '../../src/main/services/backup/restore-files'
import { withImportDirectory } from '../helpers/import-directory'

// 恢复检查只做文件操作；原生绑定按 Electron ABI 构建，单元测试不加载它。
vi.mock('better-sqlite3', () => ({ default: class {} }))

describe('启动时的恢复事务检查', () => {
  it('故障原件及全部伴随文件逐字节保护并记录哈希，不冒充 SQLite 健康备份', () =>
    withImportDirectory(async (root) => {
      const databasePath = join(root, 'practice.sqlite3')
      const backups = join(root, 'backups')
      await mkdir(backups)
      for (const suffix of ['', '-wal', '-shm', '-journal'])
        await writeFile(databasePath + suffix, `故障原件${suffix}`)
      const protection = await preserveUnavailableDatabase(databasePath, backups)
      for (const file of protection.originalHashes) {
        expect(
          await readFile(join(protection.protectionPath, `practice.sqlite3${file.suffix}`)),
        ).toEqual(await readFile(databasePath + file.suffix))
        expect(await hashBackupFile(databasePath + file.suffix)).toBe(file.hash)
      }
      expect(
        JSON.parse(await readFile(join(protection.protectionPath, 'files.json'), 'utf8')),
      ).toMatchObject({ kind: 'unavailable-database', originals: protection.originalHashes })
    }))

  it('保护后原库变化拒绝替换，保留变化后的原件和先前现场', () =>
    withImportDirectory(async (root) => {
      const databasePath = join(root, 'practice.sqlite3')
      const candidate = join(root, 'candidate.sqlite3')
      await mkdir(join(root, 'backups'))
      await writeFile(databasePath, '保护时的故障原件')
      await writeFile(candidate, '候选内容，尚不进入 SQLite 打开')
      const protection = await preserveUnavailableDatabase(databasePath, join(root, 'backups'))
      await writeFile(databasePath, '保护后被其他程序改变')
      await expect(
        replaceDatabase(
          databasePath,
          candidate,
          await hashBackupFile(candidate),
          () => {},
          protection.originalHashes,
        ),
      ).rejects.toMatchObject({ code: 'RESTORE_FAILED' })
      expect(await readFile(databasePath, 'utf8')).toBe('保护后被其他程序改变')
      expect(await readFile(join(protection.protectionPath, 'practice.sqlite3'), 'utf8')).toBe(
        '保护时的故障原件',
      )
    }))

  it('故障伴随文件类型异常时拒绝保护，不移动原数据库', () =>
    withImportDirectory(async (root) => {
      const databasePath = join(root, 'practice.sqlite3')
      await writeFile(databasePath, '故障原件')
      await mkdir(databasePath + '-wal')
      await expect(preserveUnavailableDatabase(databasePath, root)).rejects.toThrow('文件类型异常')
      expect(await readFile(databasePath, 'utf8')).toBe('故障原件')
    }))

  it('日志尚未发布时清理未开始的恢复事务并保留原数据库', () =>
    withImportDirectory(async (root) => {
      const databasePath = join(root, 'practice.sqlite3')
      const directory = join(root, 'restore-transaction')
      await writeFile(databasePath, '原数据库内容')
      await mkdir(directory)
      await writeFile(join(directory, 'candidate.sqlite3'), '候选副本')
      await writeFile(join(directory, 'record.next'), '{"format":1,"phase":"prepared"')

      await expect(recoverDatabaseReplacement(databasePath)).resolves.toBe('none')

      expect(await readFile(databasePath, 'utf8')).toBe('原数据库内容')
      await expect(readdir(directory)).rejects.toMatchObject({ code: 'ENOENT' })
    }))

  it('只剩空事务目录时按未开始清理', () =>
    withImportDirectory(async (root) => {
      const databasePath = join(root, 'practice.sqlite3')
      const directory = join(root, 'restore-transaction')
      await writeFile(databasePath, '原数据库内容')
      await mkdir(directory)

      await expect(recoverDatabaseReplacement(databasePath)).resolves.toBe('none')

      expect(await readFile(databasePath, 'utf8')).toBe('原数据库内容')
      await expect(readdir(directory)).rejects.toMatchObject({ code: 'ENOENT' })
    }))

  it('只复制到候选副本、日志尚未创建时按未开始清理', () =>
    withImportDirectory(async (root) => {
      const databasePath = join(root, 'practice.sqlite3')
      const directory = join(root, 'restore-transaction')
      await writeFile(databasePath, '原数据库内容')
      await mkdir(directory)
      // 复制候选发生在写日志之前；复制中断留下不完整副本同样属于该状态。
      await writeFile(join(directory, 'candidate.sqlite3'), '候选副本（可被截断）')

      await expect(recoverDatabaseReplacement(databasePath)).resolves.toBe('none')

      expect(await readFile(databasePath, 'utf8')).toBe('原数据库内容')
      await expect(readdir(directory)).rejects.toMatchObject({ code: 'ENOENT' })
    }))

  it('候选副本存在但原库缺失时保留现场并停止启动', () =>
    withImportDirectory(async (root) => {
      const directory = join(root, 'restore-transaction')
      await mkdir(directory)
      await writeFile(join(directory, 'candidate.sqlite3'), '候选副本')

      await expect(recoverDatabaseReplacement(join(root, 'practice.sqlite3'))).rejects.toThrow(
        '恢复事务缺少日志',
      )

      expect(await readdir(directory)).toEqual(['candidate.sqlite3'])
    }))

  it('缺少日志但存在原文件副本时保留现场并停止启动', () =>
    withImportDirectory(async (root) => {
      const databasePath = join(root, 'practice.sqlite3')
      const directory = join(root, 'restore-transaction')
      await writeFile(databasePath, '原数据库内容')
      await mkdir(directory)
      await writeFile(join(directory, 'original.sqlite3'), '旧数据库')

      await expect(recoverDatabaseReplacement(databasePath)).rejects.toThrow('恢复事务缺少日志')

      expect(await readdir(directory)).toEqual(['original.sqlite3'])
      expect(await readFile(databasePath, 'utf8')).toBe('原数据库内容')
    }))
})
