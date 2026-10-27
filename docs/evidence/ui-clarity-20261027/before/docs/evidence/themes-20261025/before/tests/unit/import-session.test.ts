import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PrepareImportResult } from '../../src/shared/contracts/import-snapshot'
import type { CommitReceipt } from '../../src/shared/contracts/library-import'
import { StalePreviewError } from '../../src/main/database/repositories/library-repository'
import { compareImport } from '../../src/main/services/library/compare-import'
import {
  createImportSession,
  type ImportSession,
} from '../../src/main/services/library/import-session'
import { prepareImport } from '../../src/main/services/library/prepare-import'

const prepared = await prepareImport([resolve('question-banks/examples/格式示例.md')])
if (!prepared.ok) throw new Error('会话测试来源准备失败。')
const snapshot = prepared.value
const baseline = { revision: 0, topics: [] }
const receipt: CommitReceipt = { revision: 1, summary: compareImport(snapshot, baseline) }
const sessions: ImportSession[] = []

function setup(ttlMs = 100) {
  const repository = {
    baseline: vi.fn(() => baseline),
    receipt: vi.fn((_token: string): CommitReceipt | undefined => undefined),
    commit: vi.fn(() => structuredClone(receipt)),
  }
  const preparation = {
    prepare: vi.fn(
      async (_paths: readonly string[], _signal?: AbortSignal): Promise<PrepareImportResult> => ({
        ok: true,
        value: structuredClone(snapshot),
      }),
    ),
    close: vi.fn(async () => {}),
  }
  const report = vi.fn()
  const session = createImportSession(repository, preparation, report, { ttlMs })
  sessions.push(session)
  return { session, repository, preparation, report }
}

async function token(session: ImportSession): Promise<string> {
  const result = await session.preview([])
  if (!result.ok) throw new Error(JSON.stringify(result.error))
  return result.value.token
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-20T00:00:00Z'))
})
afterEach(async () => {
  await Promise.all(sessions.splice(0).map((session) => session.close()))
  vi.useRealTimers()
})

describe('私有预览与令牌生命周期', () => {
  it('只返回令牌/期限/摘要，输出修改不会改动提交结果', async () => {
    const { session, repository } = setup()
    const result = await session.preview([])
    if (!result.ok) throw new Error('预览失败')
    expect(Object.keys(result.value).sort()).toEqual(['expiresAt', 'summary', 'token'])
    expect(JSON.stringify(result)).not.toContain('answerMarkdown')
    result.value.summary.counts.added = 999
    expect(session.commit(result.value.token)).toMatchObject({ ok: true, value: receipt })
    expect(repository.commit).toHaveBeenCalledTimes(1)
  })
  it('新预览和显式放弃使旧令牌失效', async () => {
    const { session } = setup()
    const first = await token(session)
    const second = await token(session)
    expect(session.commit(first)).toMatchObject({ ok: false, error: { code: 'INVALID_TOKEN' } })
    expect(session.discard(second)).toEqual({ ok: true, value: null })
    expect(session.commit(second).ok).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })
  it('新准备失败也不允许再确认旧预览，错误保留定位', async () => {
    const { session, preparation } = setup()
    const old = await token(session)
    preparation.prepare.mockResolvedValue({
      ok: false,
      issues: [{ code: 'INVALID_IMAGE', fileName: '题库.md', line: 7, column: 1, message: '缺图' }],
    })
    expect(await session.preview([])).toMatchObject({
      ok: false,
      error: { code: 'PREPARATION_FAILED', issues: [{ line: 7 }] },
    })
    expect(session.commit(old).ok).toBe(false)
  })
  it('有效期边界自动释放，过期后不调用仓储', async () => {
    const { session, repository } = setup()
    const value = await token(session)
    await vi.advanceTimersByTimeAsync(100)
    expect(session.commit(value)).toMatchObject({ ok: false, error: { code: 'PREVIEW_EXPIRED' } })
    expect(repository.commit).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('到期前允许确认，系统时钟倒退则拒绝旧预览', async () => {
    const { session } = setup()
    const first = await token(session)
    await vi.advanceTimersByTimeAsync(99)
    expect(session.commit(first).ok).toBe(true)
    const second = await token(session)
    vi.setSystemTime(new Date('2026-10-19T00:00:00Z'))
    expect(session.commit(second)).toMatchObject({ error: { code: 'PREVIEW_EXPIRED' } })
  })
  it('重复确认只提交一次，返回副本不污染回执', async () => {
    const { session, repository } = setup()
    const value = await token(session)
    const first = session.commit(value)
    if (!first.ok) throw new Error('确认失败')
    first.value.summary.counts.added = 999
    expect(session.commit(value)).toEqual({ ok: true, value: receipt })
    expect(repository.commit).toHaveBeenCalledTimes(1)
  })
  it('数据库基线变化拒绝并回收旧预览', async () => {
    const { session, repository } = setup()
    const value = await token(session)
    repository.commit.mockImplementation(() => {
      throw new StalePreviewError()
    })
    expect(session.commit(value)).toMatchObject({ error: { code: 'PREVIEW_STALE' } })
    expect(session.commit(value)).toMatchObject({ error: { code: 'INVALID_TOKEN' } })
  })
  it('数据库错误且确认无回执后保留快照，允许明确重试', async () => {
    const { session, repository, report } = setup()
    const value = await token(session)
    repository.commit.mockImplementationOnce(() => {
      throw new Error('injected write failure')
    })
    expect(session.commit(value)).toMatchObject({ error: { code: 'DATABASE_UNAVAILABLE' } })
    expect(repository.receipt).toHaveBeenCalledWith(value)
    expect(session.commit(value)).toEqual({ ok: true, value: receipt })
    expect(report).toHaveBeenCalledTimes(1)
  })
  it('提交已成功但返回异常时通过持久化回执确认，不重复写入', async () => {
    const { session, repository } = setup()
    const value = await token(session)
    repository.commit.mockImplementation(() => {
      throw new Error('result delivery failure')
    })
    repository.receipt.mockReturnValue(receipt)
    expect(session.commit(value)).toEqual({ ok: true, value: receipt })
    expect(session.commit(value)).toEqual({ ok: true, value: receipt })
    expect(repository.commit).toHaveBeenCalledTimes(1)
  })
  it('提交结果无法读取时封闭令牌，禁止盲重试', async () => {
    const { session, repository } = setup()
    const value = await token(session)
    repository.commit.mockImplementation(() => {
      throw new Error('write failure')
    })
    repository.receipt.mockImplementation(() => {
      throw new Error('read failure')
    })
    expect(session.commit(value)).toMatchObject({ error: { code: 'DATABASE_UNAVAILABLE' } })
    expect(session.commit(value)).toMatchObject({ error: { code: 'INVALID_TOKEN' } })
    expect(repository.commit).toHaveBeenCalledTimes(1)
  })
  it('准备期间拒绝第二个请求，关闭等待准备退出且不发布快照', async () => {
    const { session, preparation, repository } = setup()
    let complete!: (value: PrepareImportResult) => void
    preparation.prepare.mockImplementation(
      () =>
        new Promise((resolveResult) => {
          complete = resolveResult
        }),
    )
    const pending = session.preview([])
    expect(await session.preview([])).toMatchObject({ error: { code: 'IMPORT_BUSY' } })
    let closed = false
    const closing = session.close().then(() => {
      closed = true
    })
    await Promise.resolve()
    expect(closed).toBe(false)
    complete({ ok: true, value: snapshot })
    expect(await pending).toMatchObject({ error: { code: 'SERVICE_CLOSED' } })
    await closing
    await session.close()
    expect(repository.baseline).not.toHaveBeenCalled()
    expect(preparation.close).toHaveBeenCalledTimes(1)
  })
  it('取消准备后不发布令牌，关闭后拒绝预览与确认', async () => {
    const { session } = setup()
    const controller = new AbortController()
    const pending = session.preview([], controller.signal)
    controller.abort()
    expect(await pending).toMatchObject({ error: { code: 'IMPORT_CANCELLED' } })
    await session.close()
    expect(await session.preview([])).toMatchObject({ error: { code: 'SERVICE_CLOSED' } })
    expect(session.commit('invalid')).toMatchObject({ error: { code: 'SERVICE_CLOSED' } })
  })
  it('非法令牌不触发数据库，诊断函数异常也不泄露堆栈', async () => {
    const { session, preparation, report, repository } = setup()
    expect(session.commit({ token: 'wrong' })).toMatchObject({ error: { code: 'INVALID_TOKEN' } })
    preparation.prepare.mockRejectedValue(new Error('secret stack'))
    report.mockImplementation(() => {
      throw new Error('logger failed')
    })
    const result = await session.preview([])
    expect(result.ok).toBe(false)
    expect(JSON.stringify(result)).not.toContain('secret stack')
    expect(repository.commit).not.toHaveBeenCalled()
  })
  it.each([0, -1, 1.5, NaN, Infinity, 2_147_483_648])('拒绝非法期限 %s', (ttlMs) => {
    expect(() => setup(ttlMs)).toThrow('预览有效期')
  })
})
