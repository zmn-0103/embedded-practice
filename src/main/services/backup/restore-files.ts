import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import {
  copyFile,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
} from 'node:fs/promises'
import { basename, dirname, isAbsolute, join } from 'node:path'
import Database from 'better-sqlite3'
import { z } from 'zod'
import { BackupFault, readBackupHeader, readBackupSummary } from './validate-backup'

const suffixes = ['', '-wal', '-shm', '-journal'] as const
const digest = z.string().regex(/^[a-f0-9]{64}$/)
const journalSchema = z.strictObject({
  format: z.literal(1),
  phase: z.enum(['prepared', 'committed']),
  candidateHash: digest,
  originals: z
    .array(z.strictObject({ suffix: z.enum(suffixes), hash: digest }))
    .min(1)
    .max(4),
})
type Journal = z.infer<typeof journalSchema>

async function fileExists(path: string): Promise<boolean> {
  try {
    const entry = await lstat(path)
    if (!entry.isFile() || entry.isSymbolicLink()) throw new Error('恢复文件类型异常。')
    return true
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false
    throw error
  }
}
export async function hashBackupFile(path: string): Promise<string> {
  if (!(await fileExists(path))) throw new Error('恢复文件不存在。')
  const hash = createHash('sha256')
  for await (const bytes of createReadStream(path)) hash.update(bytes)
  return hash.digest('hex')
}
async function syncFile(path: string) {
  const handle = await open(path, 'r+')
  try {
    await handle.sync()
  } finally {
    await handle.close()
  }
}
async function paths(databasePath: string) {
  if (!isAbsolute(databasePath) || basename(databasePath) !== 'practice.sqlite3')
    throw new Error('恢复目标必须是应用数据目录中的 practice.sqlite3。')
  const database = join(await realpath(dirname(databasePath)), 'practice.sqlite3')
  return { database, directory: join(dirname(database), 'restore-transaction') }
}
async function checkDirectory(directory: string) {
  const entry = await lstat(directory)
  if (!entry.isDirectory() || entry.isSymbolicLink()) throw new Error('恢复事务目录异常。')
  const allowed = new Set([
    'record.json',
    'record.next',
    'candidate.sqlite3',
    'rejected.sqlite3',
    ...suffixes.map((suffix) => `original.sqlite3${suffix}`),
  ])
  for (const name of await readdir(directory)) {
    if (!allowed.has(name) || !(await fileExists(join(directory, name))))
      throw new Error('恢复事务包含未知文件，保留现场并停止。')
  }
}
async function writeJournal(directory: string, journal: Journal) {
  const next = join(directory, 'record.next')
  const handle = await open(next, 'wx')
  try {
    await handle.writeFile(JSON.stringify(journal), 'utf8')
    await handle.sync()
  } finally {
    await handle.close()
  }
  await rename(next, join(directory, 'record.json'))
}

// 日志发布前中断：原文件尚未移动、候选也未安装，只需清理本事务自己的文件。
// 出现原文件副本、回退副本或任何未知文件时无法证明数据库未被移动，一律保留现场。
async function discardUnpublishedTransaction(
  database: string,
  directory: string,
): Promise<boolean> {
  const names = await readdir(directory)
  const unpublished = new Set(['record.next', 'candidate.sqlite3'])
  if (names.some((name) => !unpublished.has(name))) return false
  if (names.length > 0 && !names.includes('record.next')) return false
  if (!(await fileExists(database))) return false
  await rm(directory, { recursive: true })
  return true
}

// 必须在打开任何业务连接之前调用；不完整/未知事务一律停止启动，绝不创建空库。
export async function recoverDatabaseReplacement(databasePath: string) {
  const { database, directory } = await paths(databasePath)
  try {
    await lstat(directory)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return 'none'
    throw error
  }
  await checkDirectory(directory)
  const journalPath = join(directory, 'record.json')
  if (!(await fileExists(journalPath))) {
    if (await discardUnpublishedTransaction(database, directory)) return 'none'
    throw new Error('恢复事务缺少日志且无法确认原文件未被移动，停止启动并保留全部原文件。')
  }
  const journal = journalSchema.parse(JSON.parse(await readFile(journalPath, 'utf8')))
  if (
    !journal.originals.some((file) => file.suffix === '') ||
    new Set(journal.originals.map((file) => file.suffix)).size !== journal.originals.length
  )
    throw new Error('恢复事务原文件清单异常。')
  if (journal.phase === 'committed') {
    if ((await hashBackupFile(database)) !== journal.candidateHash)
      throw new Error('已提交的恢复文件发生变化，保留现场并停止。')
    for (const suffix of suffixes) {
      if (suffix && (await fileExists(database + suffix)))
        throw new Error('已提交恢复的目标存在未知伴随文件，停止打开数据库。')
      const saved = join(directory, `original.sqlite3${suffix}`)
      if (await fileExists(saved)) {
        const original = journal.originals.find((file) => file.suffix === suffix)
        if (!original || (await hashBackupFile(saved)) !== original.hash)
          throw new Error('已提交恢复的原文件发生变化，保留现场并停止。')
      }
    }
  } else {
    // 先核对全部回退来源和现有目标，再移动任何文件；支持回退中再次中断。
    for (const suffix of suffixes) {
      const original = journal.originals.find((file) => file.suffix === suffix)
      const saved = join(directory, `original.sqlite3${suffix}`)
      const target = database + suffix
      const savedExists = await fileExists(saved)
      const targetExists = await fileExists(target)
      if (!original) {
        if (savedExists || targetExists) throw new Error('恢复目标存在未知伴随文件。')
        continue
      }
      if (savedExists && (await hashBackupFile(saved)) !== original.hash)
        throw new Error('回退原文件校验失败。')
      if (!savedExists && (!targetExists || (await hashBackupFile(target)) !== original.hash))
        throw new Error('回退所需原文件缺失或变化。')
      if (
        savedExists &&
        targetExists &&
        (suffix !== '' || (await hashBackupFile(target)) !== journal.candidateHash)
      )
        throw new Error('恢复目标发生未知变化，停止覆盖。')
    }
    for (const original of journal.originals) {
      const saved = join(directory, `original.sqlite3${original.suffix}`)
      if (!(await fileExists(saved))) continue
      const target = database + original.suffix
      if (await fileExists(target)) await rename(target, join(directory, 'rejected.sqlite3'))
      await rename(saved, target)
    }
  }
  await checkDirectory(directory)
  await rm(directory, { recursive: true })
  return journal.phase === 'committed' ? 'committed' : 'rolled-back'
}

// 调用者先保存、创建保护性备份并关闭全部连接；本模块只管理应用自己的固定文件。
export async function replaceDatabase(
  databasePath: string,
  candidatePath: string,
  candidateHash: string,
  reportError: (error: unknown) => void,
): Promise<void> {
  digest.parse(candidateHash)
  const { database, directory } = await paths(databasePath)
  await mkdir(directory) // 已有事务绝不覆盖，必须先由启动恢复检查处理。
  let armed = false
  let committed = false
  try {
    const candidate = join(directory, 'candidate.sqlite3')
    await copyFile(candidatePath, candidate)
    await syncFile(candidate)
    if ((await hashBackupFile(candidate)) !== candidateHash) throw new Error('预览副本发生变化。')
    const originals: Journal['originals'] = []
    for (const suffix of suffixes) {
      if (await fileExists(database + suffix))
        originals.push({ suffix, hash: await hashBackupFile(database + suffix) })
    }
    if (!originals.some((file) => file.suffix === '')) throw new Error('当前数据库缺失，停止恢复。')
    const journal: Journal = { format: 1, phase: 'prepared', candidateHash, originals }
    await writeJournal(directory, journal)
    armed = true
    for (const file of originals)
      await rename(database + file.suffix, join(directory, `original.sqlite3${file.suffix}`))
    await rename(candidate, database)
    const installed = new Database(database, { readonly: true, fileMustExist: true })
    try {
      readBackupSummary(installed, readBackupHeader(installed))
    } finally {
      installed.close()
    }
    if ((await hashBackupFile(database)) !== candidateHash) throw new Error('替换后文件校验失败。')
    await writeJournal(directory, { ...journal, phase: 'committed' })
    committed = true
  } catch {
    try {
      if (armed) await recoverDatabaseReplacement(database)
      else {
        await checkDirectory(directory)
        await rm(directory, { recursive: true })
      }
    } catch {
      throw new BackupFault(
        'RECOVERY_FAILED',
        '恢复和自动回退未能完成，已保留原文件与保护性备份。请退出并检查数据目录的恢复事务，勿删除原文件。',
      )
    }
    throw new BackupFault(
      'RESTORE_FAILED',
      '恢复未完成，原数据已保留或回退。重启后可继续使用原数据。',
    )
  }
  if (committed) {
    // 清理失败留给下次启动处理；提交已经确认，不能把成功恢复再改写为失败。
    try {
      await recoverDatabaseReplacement(database)
    } catch {
      reportError(new Error('已提交恢复事务的清理未完成，将在启动时重新检查。'))
    }
  }
}
