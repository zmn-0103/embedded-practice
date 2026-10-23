import { Buffer } from 'node:buffer'
import { open, stat } from 'node:fs/promises'
import { isAbsolute } from 'node:path'
import type { ParseIssue } from '../../../shared/contracts/question-bank'

export class SourceFileError extends Error {
  constructor(
    readonly code: ParseIssue['code'],
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'SourceFileError'
  }
}

export async function readFileSnapshot(filePath: string, limit: number): Promise<Buffer> {
  if (!isAbsolute(filePath) || !Number.isSafeInteger(limit) || limit < 0) {
    throw new SourceFileError('FILE_UNREADABLE', '需要有效的绝对文件路径和非负字节上限。')
  }

  try {
    // 打开前排除目录和设备；读取后仍以句柄检查为准。
    if (!(await stat(filePath)).isFile()) {
      throw new SourceFileError('FILE_UNREADABLE', '来源必须是普通文件。')
    }
    const file = await open(filePath, 'r')
    try {
      const before = await file.stat({ bigint: true })
      if (!before.isFile()) throw new SourceFileError('FILE_UNREADABLE', '来源必须是普通文件。')
      if (before.size > BigInt(limit)) {
        throw new SourceFileError('LIMIT_EXCEEDED', `来源文件超过本次允许的 ${limit} 字节上限。`)
      }

      // 只多读一个字节，识别增长而不让变化中的文件突破内存上限。
      const buffer = Buffer.alloc(Number(before.size) + 1)
      let offset = 0
      while (offset < buffer.length) {
        const { bytesRead } = await file.read(buffer, offset, buffer.length - offset, offset)
        if (bytesRead === 0) break
        offset += bytesRead
      }
      const after = await file.stat({ bigint: true })
      if (
        BigInt(offset) !== before.size ||
        after.size !== before.size ||
        after.mtimeNs !== before.mtimeNs ||
        after.ctimeNs !== before.ctimeNs
      ) {
        throw new SourceFileError('SOURCE_CHANGED', '读取期间来源文件发生变化，请重新准备导入。')
      }
      return buffer.subarray(0, offset)
    } finally {
      await file.close()
    }
  } catch (error) {
    if (error instanceof SourceFileError) throw error
    throw new SourceFileError(
      'FILE_UNREADABLE',
      '无法读取来源文件，请检查文件是否存在且具有读取权限。',
      { cause: error },
    )
  }
}
