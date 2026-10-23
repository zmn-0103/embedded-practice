import { isAbsolute } from 'node:path'
import { z } from 'zod'
import {
  endPracticeSchema,
  navigatePracticeSchema,
  ratePracticeSchema,
  readPracticeSchema,
  revealPracticeSchema,
  saveDraftSchema,
  startPracticeSchema,
  type PracticeError,
  type PracticeResult,
} from '../../../shared/contracts/practice'
import { openPracticeDatabase } from '../../database/open-database'
import {
  createPracticeRepository,
  PracticeFault,
} from '../../database/repositories/practice-repository'

// 内部服务持有独立连接；没有新增预加载、任意 SQL 或文件能力。
export async function openPracticeService(
  databasePath: string,
  reportError: (error: unknown) => void,
) {
  if (!isAbsolute(databasePath)) throw new Error('练习数据库必须使用绝对路径。')
  const database = await openPracticeDatabase(databasePath)
  try {
    const repository = createPracticeRepository(database)
    let closed = false
    function invoke<T extends z.ZodType, R>(
      schema: T,
      input: unknown,
      work: (request: z.output<T>) => R,
      failure: PracticeError,
    ): PracticeResult<R> {
      if (closed)
        return { ok: false, error: { code: 'SERVICE_CLOSED', message: '练习服务已关闭。' } }
      const request = schema.safeParse(input)
      if (!request.success)
        return {
          ok: false,
          error: {
            code: 'INVALID_REQUEST',
            message: '练习请求无效，请保留输入后重新读取；草稿须为有效文字且不超过 1MiB。',
          },
        }
      try {
        return { ok: true, value: work(request.data) }
      } catch (error) {
        if (error instanceof PracticeFault)
          return { ok: false, error: { code: error.code, message: error.message } }
        try {
          reportError(error instanceof z.ZodError ? new Error('练习数据校验失败。') : error)
        } catch {
          /* 诊断失败不覆盖业务结果，也不自动重试写入。 */
        }
        return { ok: false, error: failure }
      }
    }
    const writeError: PracticeError = {
      code: 'WRITE_FAILED',
      message: '本次保存未提交，已保留原状态；请保留输入并使用同一请求重试。',
    }
    return {
      read: (input: unknown) =>
        invoke(readPracticeSchema, input, ({ sessionId }) => repository.read(sessionId), {
          code: 'DATABASE_UNAVAILABLE',
          message: '无法读取练习，请检查本地诊断日志后重试。',
        }),
      start: (input: unknown) => invoke(startPracticeSchema, input, repository.start, writeError),
      saveDraft: (input: unknown) =>
        invoke(saveDraftSchema, input, repository.saveDraft, writeError),
      reveal: (input: unknown) =>
        invoke(revealPracticeSchema, input, repository.reveal, writeError),
      rateAndAdvance: (input: unknown) =>
        invoke(ratePracticeSchema, input, repository.rateAndAdvance, writeError),
      navigate: (input: unknown) =>
        invoke(navigatePracticeSchema, input, repository.navigate, writeError),
      end: (input: unknown) => invoke(endPracticeSchema, input, repository.end, writeError),
      close() {
        if (closed) return
        closed = true
        database.close()
      },
    }
  } catch (error) {
    database.close()
    throw error
  }
}

export type PracticeService = Awaited<ReturnType<typeof openPracticeService>>
export { createPracticeRepository } from '../../database/repositories/practice-repository'
export { openPracticeDatabase } from '../../database/open-database'
