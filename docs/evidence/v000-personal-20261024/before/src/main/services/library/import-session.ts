import { randomUUID } from 'node:crypto'
import type { ImportSnapshot } from '../../../shared/contracts/import-snapshot'
import {
  previewTokenSchema,
  type CommitReceipt,
  type ImportErrorCode,
  type ImportPreview,
  type ImportResult,
} from '../../../shared/contracts/library-import'
import {
  StalePreviewError,
  type LibraryRepository,
} from '../../database/repositories/library-repository'
import { compareImport } from './compare-import'
import type { ImportPreparationService } from './import-preparation'

interface PreviewState {
  token: string
  createdAt: number
  expiresAt: number
  revision: number
  snapshot?: ImportSnapshot
  committed?: CommitReceipt
}

export function createImportSession(
  repository: LibraryRepository,
  preparation: ImportPreparationService,
  reportError: (error: unknown) => void,
  options: { ttlMs?: number; now?: () => number } = {},
) {
  const ttlMs = options.ttlMs ?? 15 * 60_000
  const now = options.now ?? Date.now
  if (!Number.isSafeInteger(ttlMs) || ttlMs < 1 || ttlMs > 2_147_483_647)
    throw new Error('预览有效期必须是合法的正整毫秒。')
  let closed = false
  let state: PreviewState | undefined
  let expiredToken: string | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let active: Promise<ImportResult<ImportPreview>> | undefined
  let controller: AbortController | undefined
  let closing: Promise<void> | undefined

  function failure(code: ImportErrorCode, message: string): ImportResult<never> {
    return { ok: false, error: { code, message } }
  }
  function report(error: unknown): void {
    try {
      reportError(error)
    } catch {
      /* 诊断失败不改变业务结果。 */
    }
  }
  function release(): void {
    clearTimeout(timer)
    timer = undefined
    state = undefined
  }
  function expire(): void {
    expiredToken = state?.token
    release()
  }
  function authorize(token: unknown): ImportResult<PreviewState> {
    if (closed) return failure('SERVICE_CLOSED', '导入服务已关闭。')
    if (!previewTokenSchema.safeParse(token).success)
      return failure('INVALID_TOKEN', '预览令牌无效，请重新预览。')
    if (token === expiredToken) return failure('PREVIEW_EXPIRED', '预览已过期，请重新预览。')
    if (state === undefined || state.token !== token)
      return failure('INVALID_TOKEN', '预览已失效，请重新预览。')
    const current = now()
    if (current < state.createdAt || current >= state.expiresAt) {
      expire()
      return failure('PREVIEW_EXPIRED', '预览已过期，请重新预览。')
    }
    return { ok: true, value: state }
  }
  function success(preview: PreviewState, result: CommitReceipt): ImportResult<CommitReceipt> {
    preview.committed = result
    delete preview.snapshot
    return { ok: true, value: structuredClone(result) }
  }

  return {
    preview(
      filePaths: readonly string[],
      signal?: AbortSignal,
    ): Promise<ImportResult<ImportPreview>> {
      if (closed) return Promise.resolve(failure('SERVICE_CLOSED', '导入服务已关闭。'))
      if (active) return Promise.resolve(failure('IMPORT_BUSY', '已有文件准备任务，请等待或取消。'))
      release()
      expiredToken = undefined
      controller = new AbortController()
      const combined = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal
      const task = (async (): Promise<ImportResult<ImportPreview>> => {
        try {
          const prepared = await preparation.prepare(filePaths, combined)
          if (closed) return failure('SERVICE_CLOSED', '导入服务已关闭。')
          if (combined.aborted) return failure('IMPORT_CANCELLED', '已取消本次预览。')
          if (!prepared.ok)
            return {
              ok: false,
              error: {
                code: 'PREPARATION_FAILED',
                message: '文件准备未通过，请按错误定位修正后重试。',
                issues: prepared.issues,
              },
            }
          const baseline = repository.baseline(
            prepared.value.topics.map((item) => item.topic.topicId),
          )
          const summary = compareImport(prepared.value, baseline)
          const createdAt = now()
          const preview: PreviewState = {
            token: randomUUID(),
            createdAt,
            expiresAt: createdAt + ttlMs,
            revision: baseline.revision,
            snapshot: prepared.value,
          }
          state = preview
          timer = setTimeout(expire, ttlMs)
          timer.unref()
          return {
            ok: true,
            value: {
              token: preview.token,
              expiresAt: new Date(preview.expiresAt).toISOString(),
              summary: structuredClone(summary),
            },
          }
        } catch (error) {
          report(error)
          release()
          return failure('DATABASE_UNAVAILABLE', '无法建立导入预览，请检查本地诊断日志后重试。')
        }
      })()
      active = task
      void task.finally(() => {
        if (active === task) {
          active = undefined
          controller = undefined
        }
      })
      return task
    },
    commit(token: unknown): ImportResult<CommitReceipt> {
      const authorized = authorize(token)
      if (!authorized.ok) return authorized
      const preview = authorized.value
      if (preview.committed) return success(preview, preview.committed)
      if (!preview.snapshot) return failure('INVALID_TOKEN', '预览内容已释放，请重新预览。')
      try {
        return success(
          preview,
          repository.commit(preview.token, preview.snapshot, preview.revision),
        )
      } catch (error) {
        if (error instanceof StalePreviewError) {
          release()
          return failure('PREVIEW_STALE', '题库在预览后已变化，请重新预览再确认。')
        }
        report(error)
        try {
          // 先查同事务回执，避免把返回失败误当作未提交而重复写入。
          const receipt = repository.receipt(preview.token)
          if (receipt !== undefined) return success(preview, receipt)
        } catch (readError) {
          report(readError)
          release()
          return failure(
            'DATABASE_UNAVAILABLE',
            '无法确认提交结果，已停止本次写入；请重启并重新预览。',
          )
        }
        return failure('DATABASE_UNAVAILABLE', '本批未提交，预览仍保留；请检查本地诊断日志后重试。')
      }
    },
    discard(token: unknown): ImportResult<null> {
      const authorized = authorize(token)
      if (!authorized.ok) return authorized
      release()
      return { ok: true, value: null }
    },
    close(): Promise<void> {
      if (closing) return closing
      closed = true
      release()
      controller?.abort()
      closing = (async () => {
        try {
          await preparation.close()
        } finally {
          await active
        }
      })()
      return closing
    },
  }
}

export type ImportSession = ReturnType<typeof createImportSession>
