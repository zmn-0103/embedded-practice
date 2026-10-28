import { expect, test } from 'vitest'
import {
  historyEntryRequestSchema,
  historyEntryResultSchema,
  historyEntrySchema,
  historyListRequestSchema,
  historyPageSchema,
  historySummarySchema,
} from '../../src/shared/contracts/history'
import { questionInfoSchema } from '../../src/shared/contracts/library-desktop'

const identity = { topicId: 'unit-topic', questionId: 'q-1' }
const sessionId = '11111111-1111-4111-8111-111111111111'
const now = '2026-10-21T00:00:00.000Z'
const body = { markdown: '历史题干', definitions: [], imageBindings: [] }
const summary = {
  sessionId,
  position: 0,
  versionId: 1,
  versionSequence: 1,
  isCurrentVersion: false,
  title: '当时标题',
  topicTitle: '当时专题',
  mode: 'sequential',
  sessionStatus: 'ended',
  createdAt: now,
  endedAt: now,
  revealedAt: null,
  rating: null,
  ratedAt: null,
  skippedAt: now,
  hasDraft: false,
}
const page = {
  ...identity,
  currentVersionId: 2,
  archived: false,
  total: 1,
  page: 1,
  pageSize: 20,
  entries: [summary],
}

test('历史请求保留稳定身份、本轮排除与精确位置', () => {
  const list = { ...identity, page: 2, excludeSessionId: sessionId }
  expect(historyListRequestSchema.parse(list)).toEqual(list)
  expect(historyListRequestSchema.parse({ ...identity, page: 1 })).not.toHaveProperty(
    'excludeSessionId',
  )
  const entry = { ...identity, sessionId, position: 0 }
  expect(historyEntryRequestSchema.parse(entry)).toEqual(entry)
})
test.each([0, -1, 0.5, Number.MAX_SAFE_INTEGER + 1, '1', null])('历史拒绝非法页码 %j', (value) => {
  expect(historyListRequestSchema.safeParse({ ...identity, page: value }).success).toBe(false)
})
test.each([{ path: 'C:/private' }, { sql: 'SELECT *' }, { includeAnswer: true }])(
  '历史拒绝额外能力 %j',
  (extra) => {
    expect(historyListRequestSchema.safeParse({ ...identity, page: 1, ...extra }).success).toBe(
      false,
    )
    expect(
      historyEntryRequestSchema.safeParse({ ...identity, sessionId, position: 0, ...extra })
        .success,
    ).toBe(false)
  },
)
test('历史拒绝非法身份、UUID 与越界位置', () => {
  expect(
    historyListRequestSchema.safeParse({ ...identity, topicId: '../topic', page: 1 }).success,
  ).toBe(false)
  expect(
    historyListRequestSchema.safeParse({ ...identity, page: 1, excludeSessionId: 'latest' })
      .success,
  ).toBe(false)
  expect(
    historyEntryRequestSchema.safeParse({ ...identity, sessionId: 'latest', position: 0 }).success,
  ).toBe(false)
  expect(
    historyEntryRequestSchema.safeParse({ ...identity, sessionId, position: -1 }).success,
  ).toBe(false)
})
test.each([{ draft: '旧作答' }, { answer: body }, { body }])('历史列表拒绝正文泄露 %j', (extra) => {
  expect(historySummarySchema.safeParse({ ...summary, ...extra }).success).toBe(false)
})
test('历史分页最多 20 条，归档与版本信息可表达', () => {
  expect(historyPageSchema.parse(page)).toEqual(page)
  expect(
    historyPageSchema.safeParse({ ...page, entries: Array.from({ length: 21 }, () => summary) })
      .success,
  ).toBe(false)
  expect(historyPageSchema.safeParse({ ...page, archived: true }).success).toBe(true)
})
test('未揭晓历史详情不接受参考答案', () => {
  const entry = {
    ...summary,
    body,
    draft: { revision: 1, text: '中文\r\n<script>literal</script>' },
  }
  expect(historyEntrySchema.parse(entry)).not.toHaveProperty('answer')
  expect(historyEntrySchema.safeParse({ ...entry, answer: body }).success).toBe(false)
})
test('已揭晓详情必须有对应答案，自评时间与状态一致', () => {
  const entry = {
    ...summary,
    revealedAt: now,
    rating: '掌握',
    ratedAt: now,
    body,
    draft: { revision: 1, text: '' },
    answer: body,
  }
  expect(historyEntrySchema.safeParse(entry).success).toBe(true)
  expect(historyEntrySchema.safeParse({ ...entry, answer: undefined }).success).toBe(false)
  expect(historyEntrySchema.safeParse({ ...entry, ratedAt: null }).success).toBe(false)
  expect(historyEntrySchema.safeParse({ ...entry, revealedAt: null }).success).toBe(false)
  expect(historySummarySchema.safeParse({ ...summary, sessionStatus: 'active' }).success).toBe(
    false,
  )
})
test('历史响应错误不携带作答或堆栈', () => {
  expect(
    historyEntryResultSchema.safeParse({
      ok: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: '读取失败', stack: 'private' },
    }).success,
  ).toBe(false)
})
test('内容更新状态是必需布尔值，不混用自评或隐式缺省', () => {
  const question = {
    ...identity,
    versionId: 2,
    title: '标题',
    topicTitle: '专题',
    tags: [],
    difficulty: '基础',
    archived: false,
    favorite: false,
    practiced: false,
    currentRating: null,
    contentUpdated: true,
  }
  expect(questionInfoSchema.parse(question).contentUpdated).toBe(true)
  expect(questionInfoSchema.safeParse({ ...question, contentUpdated: 'true' }).success).toBe(false)
  expect(questionInfoSchema.safeParse({ ...question, contentUpdated: undefined }).success).toBe(
    false,
  )
})
