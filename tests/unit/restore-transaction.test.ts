import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { recoverDatabaseReplacement } from '../../src/main/services/backup/restore-files'
import { withImportDirectory } from '../helpers/import-directory'

// 恢复检查只做文件操作；原生绑定按 Electron ABI 构建，单元测试不加载它。
vi.mock('better-sqlite3', () => ({ default: class {} }))

describe('启动时的恢复事务检查', () => {
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
