import { Buffer } from 'node:buffer'
import { open, readFile, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { readFileSnapshot } from '../../src/main/services/resources/read-file-snapshot'
import { withImportDirectory } from '../helpers/import-directory'

vi.mock('node:fs/promises', async () => {
  const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises')
  return { ...actual, open: vi.fn(actual.open) }
})

describe('有界只读文件快照', () => {
  it('精确接受字节上限，返回独立内容且不改写来源', () =>
    withImportDirectory(async (directory) => {
      const path = join(directory, '中文来源.txt')
      const original = Buffer.from('中文🙂\r\n')
      await writeFile(path, original)
      const snapshot = await readFileSnapshot(path, original.length)
      expect(snapshot).toEqual(original)
      expect(await readFile(path)).toEqual(original)
      await writeFile(path, '修改后的内容')
      expect(snapshot).toEqual(original)
    }))

  it('空文件可在零剩余预算内读取，非空文件不能突破上限', () =>
    withImportDirectory(async (directory) => {
      const path = join(directory, 'file.txt')
      await writeFile(path, '')
      expect(await readFileSnapshot(path, 0)).toEqual(Buffer.alloc(0))
      await writeFile(path, 'x')
      await expect(readFileSnapshot(path, 0)).rejects.toMatchObject({ code: 'LIMIT_EXCEEDED' })
    }))

  it('拒绝缺文件、目录、相对路径和非法预算', () =>
    withImportDirectory(async (directory) => {
      await expect(readFileSnapshot(join(directory, '不存在'), 10)).rejects.toMatchObject({
        code: 'FILE_UNREADABLE',
      })
      await expect(readFileSnapshot(directory, 10)).rejects.toMatchObject({
        code: 'FILE_UNREADABLE',
      })
      await expect(readFileSnapshot('relative.txt', 10)).rejects.toMatchObject({
        code: 'FILE_UNREADABLE',
      })
      await expect(readFileSnapshot(directory, -1)).rejects.toMatchObject({
        code: 'FILE_UNREADABLE',
      })
    }))

  it('模拟来源时间变化时拒绝快照并关闭实际句柄', () =>
    withImportDirectory(async (directory) => {
      const path = join(directory, 'changed.txt')
      await writeFile(path, 'abc')
      const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises')
      const handle = await actual.open(path, 'r')
      const before = await stat(path, { bigint: true })
      const changed = await stat(path, { bigint: true })
      changed.mtimeNs += 1n
      const close = vi.spyOn(handle, 'close')
      vi.spyOn(handle, 'stat').mockResolvedValueOnce(before).mockResolvedValueOnce(changed)
      vi.mocked(open).mockResolvedValueOnce(handle)
      try {
        await expect(readFileSnapshot(path, 3)).rejects.toMatchObject({ code: 'SOURCE_CHANGED' })
        expect(close).toHaveBeenCalledOnce()
        expect(handle.fd).toBe(-1)
      } finally {
        if (handle.fd !== -1) await handle.close()
      }
    }))

  it('读取异常仍关闭句柄，原始系统错误只保留为内部 cause', () =>
    withImportDirectory(async (directory) => {
      const path = join(directory, 'read-error.txt')
      await writeFile(path, 'abc')
      const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises')
      const handle = await actual.open(path, 'r')
      const failure = new Error('用于模拟底层读取失败')
      vi.spyOn(handle, 'read').mockRejectedValueOnce(failure)
      const close = vi.spyOn(handle, 'close')
      vi.mocked(open).mockResolvedValueOnce(handle)
      try {
        await expect(readFileSnapshot(path, 3)).rejects.toMatchObject({
          code: 'FILE_UNREADABLE',
          cause: failure,
        })
        expect(close).toHaveBeenCalledOnce()
        expect(handle.fd).toBe(-1)
      } finally {
        if (handle.fd !== -1) await handle.close()
      }
    }))
})
