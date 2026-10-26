import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'

export async function withImportDirectory<T>(run: (directory: string) => Promise<T>): Promise<T> {
  const directory = await mkdtemp(join(tmpdir(), 'embedded-practice-import-'))
  try {
    return await run(directory)
  } finally {
    if (
      resolve(dirname(directory)) !== resolve(tmpdir()) ||
      !basename(directory).startsWith('embedded-practice-import-')
    ) {
      throw new Error('拒绝清理不属于本次导入测试的目录。')
    }
    await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
}
