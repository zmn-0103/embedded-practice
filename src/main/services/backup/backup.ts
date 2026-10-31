import { randomUUID } from 'node:crypto'
import { copyFile, lstat, mkdir, mkdtemp, realpath, rename, rm, stat } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, relative, sep } from 'node:path'
import Database from 'better-sqlite3'
import type { BackupFile, BackupPreview } from '../../../shared/contracts/backup'
import {
  hashBackupFile,
  preserveUnavailableDatabase,
  type DatabaseFileHashes,
} from './restore-files'
import { APPLICATION_ID, openPracticeDatabase, SCHEMA_VERSION } from '../../database/open-database'
import {
  assertBackupManifestShape,
  BACKUP_FORMAT_VERSION,
  BackupFault,
  readBackupHeader,
  readBackupSummary,
} from './validate-backup'

function missing(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}
function inside(directory: string, path: string): boolean {
  const part = relative(directory, path)
  return part === '' || (!isAbsolute(part) && part !== '..' && !part.startsWith(`..${sep}`))
}

// 正常模式只读当前库；仅恢复模式不打开故障库。预览始终只处理独立副本。
export async function openBackupService(
  databasePath: string,
  appVersion: string,
  reportError: (error: unknown) => void,
  recoveryOnly = false,
) {
  if (!isAbsolute(databasePath)) throw new Error('备份服务需要绝对数据库路径。')
  const dataDirectory = await realpath(dirname(databasePath))
  const source = recoveryOnly
    ? undefined
    : new Database(databasePath, { readonly: true, fileMustExist: true })
  let closed = false
  let active: Promise<unknown> | undefined
  let closing: Promise<void> | undefined
  let preview: { directory: string; path: string; hash: string; value: BackupPreview } | undefined
  function reportCleanup(error: unknown) {
    try {
      reportError(error)
    } catch {
      /* 清理诊断不覆盖已经确认的业务结果。 */
    }
  }
  async function removeStage(directory: string) {
    // directory 只能由本模块的 mkdtemp 产生，不递归删除用户选择的路径。
    await rm(directory, { recursive: true, force: true }).catch(reportCleanup)
  }
  async function discardPreview() {
    const previous = preview
    preview = undefined
    if (previous) await removeStage(previous.directory)
  }
  async function destinationFor(path: string, reading = false): Promise<string> {
    if (!isAbsolute(path)) throw new BackupFault('FILE_ERROR', '请选择有效的绝对文件路径。')
    const destination = join(await realpath(dirname(path)), basename(path))
    if (
      inside(dataDirectory, destination) &&
      !(reading && relative(join(dataDirectory, 'backups'), dirname(destination)) === '')
    )
      throw new BackupFault('FILE_ERROR', '请选择运行数据目录以外的位置，避免覆盖正在使用的数据。')
    // Windows文件编号可能超过Number精度；用精确整数区分独立文件与真实硬链接。
    const target = await lstat(destination, { bigint: true }).catch((error: unknown) => {
      if (!missing(error)) throw error
      return undefined
    })
    if (target && (!target.isFile() || target.isSymbolicLink()))
      throw new BackupFault('FILE_ERROR', '备份目标必须是普通文件，不能使用目录或链接。')
    for (const suffix of ['-wal', '-shm', '-journal']) {
      const companion = await lstat(destination + suffix).catch((error: unknown) => {
        if (!missing(error)) throw error
        return undefined
      })
      if (companion)
        throw new BackupFault('FILE_ERROR', '目标仍有数据库伴随文件，请选择独立的备份文件位置。')
    }
    if (target) {
      for (const suffix of ['', '-wal', '-shm', '-journal']) {
        const running = await stat(databasePath + suffix, { bigint: true }).catch(
          (error: unknown) => {
            if (!missing(error)) throw error
            return undefined
          },
        )
        if (running && running.dev === target.dev && running.ino === target.ino)
          throw new BackupFault('FILE_ERROR', '不能覆盖当前数据库或其伴随文件的别名。')
      }
    }
    return destination
  }
  function run<T>(work: () => Promise<T>): Promise<T> {
    if (closed) return Promise.reject(new BackupFault('SERVICE_CLOSED', '备份服务已关闭。'))
    if (active)
      return Promise.reject(new BackupFault('BACKUP_BUSY', '备份任务正在进行，请等待完成。'))
    const job = work()
    active = job
    return job.finally(() => {
      if (active === job) active = undefined
    })
  }
  async function writeSnapshot(
    destination: string,
    checkDestination?: () => Promise<string>,
  ): Promise<BackupFile> {
    const directory = await mkdtemp(join(dirname(destination), '.embedded-practice-export-'))
    const staged = join(directory, 'backup.sqlite3')
    try {
      if (!source)
        throw new BackupFault('DATABASE_UNAVAILABLE', '当前处于仅恢复模式，无法导出健康备份。')
      if (
        source.pragma('application_id', { simple: true }) !== APPLICATION_ID ||
        source.pragma('user_version', { simple: true }) !== SCHEMA_VERSION
      )
        throw new BackupFault('EXPORT_FAILED', '当前数据库结构异常，停止导出并保留原数据。')
      await source.backup(staged)
      const backup = new Database(staged, { fileMustExist: true })
      let summary: BackupFile['summary']
      try {
        // 已存在的同名表只有明确属于本备份格式时才可更新，未知表原样保护。
        // 这里只校验形状：运行库可能残留旧结构版本的元数据，导出会整体重写，不能据此拒绝导出。
        assertBackupManifestShape(backup)
        backup.pragma('journal_mode = DELETE')
        backup.pragma('synchronous = FULL')
        backup.pragma('trusted_schema = OFF')
        backup.transaction(() => {
          backup.exec(`DROP TABLE IF EXISTS backup_manifest;
                CREATE TABLE backup_manifest (
                  id INTEGER PRIMARY KEY CHECK (id = 1),
                  format_version INTEGER NOT NULL, created_at TEXT NOT NULL,
                  app_version TEXT NOT NULL, schema_version INTEGER NOT NULL
                ) STRICT;`)
          backup
            .prepare('INSERT INTO backup_manifest VALUES (1, ?, ?, ?, ?)')
            .run(BACKUP_FORMAT_VERSION, new Date().toISOString(), appVersion, SCHEMA_VERSION)
        })()
        summary = readBackupSummary(backup, readBackupHeader(backup))
      } finally {
        backup.close()
      }
      // 在同一目标卷校验后发布；失败不先删除或截断已有备份。
      if (checkDestination && (await checkDestination()) !== destination)
        throw new BackupFault('FILE_ERROR', '目标目录发生变化，请重新选择导出位置。')
      await rename(staged, destination)
      return { filePath: destination, summary }
    } finally {
      await removeStage(directory)
    }
  }
  return {
    discardPreview,
    export(path: string): Promise<BackupFile> {
      return run(async () => {
        await discardPreview()
        return writeSnapshot(await destinationFor(path), () => destinationFor(path))
      })
    },
    preview(path: string): Promise<BackupPreview> {
      return run(async () => {
        await discardPreview()
        if (!isAbsolute(path)) throw new BackupFault('FILE_ERROR', '请选择有效的备份文件路径。')
        const original = await realpath(path)
        await destinationFor(original, true)
        const before = await stat(original, { bigint: true })
        if (!before.isFile()) throw new BackupFault('FILE_ERROR', '请选择普通备份文件。')
        const stagingRoot = join(dataDirectory, 'backup-staging')
        await mkdir(stagingRoot, { recursive: true })
        if (
          (await lstat(stagingRoot)).isSymbolicLink() ||
          relative(stagingRoot, await realpath(stagingRoot)) !== ''
        )
          throw new BackupFault('FILE_ERROR', '恢复暂存目录异常，请检查数据目录。')
        const directory = await mkdtemp(join(stagingRoot, 'preview-'))
        const staged = join(directory, 'backup.sqlite3')
        let retained = false
        try {
          await copyFile(original, staged)
          const after = await stat(original, { bigint: true })
          if (
            before.dev !== after.dev ||
            before.ino !== after.ino ||
            before.size !== after.size ||
            before.mtimeNs !== after.mtimeNs ||
            before.ctimeNs !== after.ctimeNs ||
            (await realpath(path)) !== original
          )
            throw new BackupFault('FILE_ERROR', '读取期间备份文件发生变化，请重新选择。')
          const snapshot = new Database(staged, { readonly: true, fileMustExist: true })
          let header: ReturnType<typeof readBackupHeader>
          try {
            header = readBackupHeader(snapshot)
          } finally {
            snapshot.close()
          }
          // 使用原有迁移，但只迁移暂存副本，原备份及当前库均不改变。
          const compatible = await openPracticeDatabase(staged)
          let summary: BackupFile['summary']
          try {
            summary = readBackupSummary(compatible, header)
            // 副本已经升级；保留原备份时间，只同步副本结构元数据。
            if (header.metadata)
              compatible
                .prepare('UPDATE backup_manifest SET schema_version = ? WHERE id = 1')
                .run(SCHEMA_VERSION)
            compatible.pragma('journal_mode = DELETE')
          } finally {
            compatible.close()
          }
          const value = { filePath: path, summary, token: randomUUID() }
          preview = { directory, path: staged, hash: await hashBackupFile(staged), value }
          retained = true
          return value
        } finally {
          if (!retained) await removeStage(directory)
        }
      })
    },
    prepareRestore(token: string) {
      return run(async () => {
        const selected = preview
        if (!selected || selected.value.token !== token)
          throw new BackupFault('PREVIEW_EXPIRED', '恢复预览已失效，请重新选择备份并校验。')
        // 凭据只消费一次；接管后导航/关闭不再删除正在使用的副本。
        preview = undefined
        try {
          if ((await hashBackupFile(selected.path)) !== selected.hash)
            throw new BackupFault('PREVIEW_EXPIRED', '恢复副本发生变化，请重新预览。')
          const checked = new Database(selected.path, { readonly: true, fileMustExist: true })
          try {
            readBackupSummary(checked, readBackupHeader(checked))
          } finally {
            checked.close()
          }
          const backups = join(dataDirectory, 'backups')
          await mkdir(backups, { recursive: true })
          if (
            (await lstat(backups)).isSymbolicLink() ||
            relative(backups, await realpath(backups)) !== ''
          )
            throw new BackupFault('FILE_ERROR', '保护性备份目录异常，停止恢复。')
          let protectionPath: string
          let originalHashes: DatabaseFileHashes | undefined
          if (recoveryOnly) {
            const protection = await preserveUnavailableDatabase(databasePath, backups)
            protectionPath = protection.protectionPath
            originalHashes = protection.originalHashes
          } else {
            const protection = await writeSnapshot(
              join(backups, `before-restore-${randomUUID()}.sqlite3`),
            )
            protectionPath = protection.filePath
          }
          return {
            candidatePath: selected.path,
            candidateHash: selected.hash,
            protectionPath,
            originalHashes,
            release: () => removeStage(selected.directory),
          }
        } catch (error) {
          await removeStage(selected.directory)
          throw error
        }
      })
    },
    close(): Promise<void> {
      closed = true
      closing ??= (async () => {
        await active?.catch(() => {})
        source?.close()
        await discardPreview()
      })()
      return closing
    },
  }
}
export type BackupService = Awaited<ReturnType<typeof openBackupService>>
