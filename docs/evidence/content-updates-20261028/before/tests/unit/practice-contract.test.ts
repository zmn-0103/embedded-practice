import { describe, expect, test } from 'vitest'
import {
  cursorSchema,
  draftSchema,
  MAX_DRAFT_BYTES,
  navigatePracticeSchema,
  practiceAckSchema,
  practiceViewSchema,
  ratePracticeSchema,
  readPracticeSchema,
  revealPracticeSchema,
  saveDraftSchema,
  startPracticeSchema,
} from '../../src/shared/contracts/practice'
import { EMPTY_QUESTION_FILTERS } from '../../src/shared/contracts/question-filters'

const id = '11111111-1111-4111-8111-111111111111'
const cursor = { sessionId: id, position: 0, revision: 0 }
const draft = { revision: 0, text: '' }
const command = { requestId: id, cursor, draft }
const body = { markdown: '测试正文', definitions: [], imageBindings: [] }
function hiddenView() {
  return {
    session: {
      sessionId: id,
      mode: 'sequential',
      topicId: null,
      filters: null,
      category: { kind: 'all' },
      status: 'active',
      position: 0,
      revision: 0,
      total: 1,
      createdAt: '2026-10-20T00:00:00.000Z',
      endedAt: null,
      counts: {
        revealed: 0,
        rated: 0,
        unrated: 0,
        skipped: 0,
        ratings: { 不会: 0, 不熟: 0, 掌握: 0 },
      },
    },
    item: {
      position: 0,
      topicId: 'topic',
      questionId: 'q-1',
      versionId: 1,
      title: '标题',
      topicTitle: '专题',
      tags: [],
      difficulty: '基础',
      body,
      draft,
      revealed: false,
      revealedAt: null,
      rating: null,
      skippedAt: null,
    },
  }
}

describe('练习请求边界', () => {
  test.each(['sequential', 'random'])('接受模式 %s，读取仍隐藏答案', (mode) => {
    const input = { requestId: id, topicId: null, count: 20, replace: null, mode }
    expect(startPracticeSchema.parse(input)).toEqual(input)
    const view = hiddenView()
    const result = practiceViewSchema.parse({ ...view, session: { ...view.session, mode } })
    expect(result.session.mode).toBe(mode)
    expect(result.item).not.toHaveProperty('answer')
  })
  test('省略模式的旧请求不补默认字段，保持原回执哈希输入', () => {
    const input = { requestId: id, topicId: null, count: 20, replace: null }
    expect(JSON.stringify(startPracticeSchema.parse(input))).toBe(JSON.stringify(input))
    expect(startPracticeSchema.parse(input)).not.toHaveProperty('mode')
    expect(startPracticeSchema.parse(input)).not.toHaveProperty('filters')
  })
  test.each(['shuffle', '', null, 0, true, {}])('拒绝非法模式 %j', (mode) => {
    expect(
      startPracticeSchema.safeParse({
        requestId: id,
        topicId: null,
        count: 20,
        replace: null,
        mode,
      }).success,
    ).toBe(false)
    const view = hiddenView()
    expect(
      practiceViewSchema.safeParse({ ...view, session: { ...view.session, mode } }).success,
    ).toBe(false)
  })
  test.each([10, 20, 50, 'all'])('数量 %s 与空输入揭晓合法', (count) => {
    expect(
      startPracticeSchema.safeParse({ requestId: id, topicId: null, count, replace: null }).success,
    ).toBe(true)
    expect(revealPracticeSchema.safeParse(command).success).toBe(true)
  })
  test.each([0, 1, -1, 100, '20', null])('拒绝未定义数量 %s', (count) => {
    expect(
      startPracticeSchema.safeParse({ requestId: id, topicId: null, count, replace: null }).success,
    ).toBe(false)
  })
  test.each([-1, 0.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, '1'])(
    '拒绝非法游标 %s',
    (position) => {
      expect(cursorSchema.safeParse({ ...cursor, position }).success).toBe(false)
      expect(draftSchema.safeParse({ revision: position, text: '' }).success).toBe(false)
    },
  )
  test('最大安全修订可表达，UUID 和额外路径严格检查', () => {
    expect(cursorSchema.safeParse({ ...cursor, revision: Number.MAX_SAFE_INTEGER }).success).toBe(
      true,
    )
    expect(cursorSchema.safeParse({ ...cursor, sessionId: '123' }).success).toBe(false)
    expect(
      readPracticeSchema.safeParse({ sessionId: null, databasePath: 'C:/private' }).success,
    ).toBe(false)
    expect(
      saveDraftSchema.safeParse({ sessionId: id, position: 0, draft, sql: 'DROP TABLE' }).success,
    ).toBe(false)
    expect(revealPracticeSchema.safeParse({ ...command, answer: body }).success).toBe(false)
  })
  test.each(['不会', '不熟', '掌握', null])('允许主观自评 %s', (rating) => {
    expect(ratePracticeSchema.safeParse({ ...command, rating }).success).toBe(true)
  })
  test.each(['正确', '错误', 1, undefined])('拒绝未定义评分 %s', (rating) => {
    expect(ratePracticeSchema.safeParse({ ...command, rating }).success).toBe(false)
  })
  test('跳过与普通切题是不同输入', () => {
    for (const direction of ['previous', 'next', 'skip']) {
      expect(navigatePracticeSchema.safeParse({ ...command, direction }).success).toBe(true)
    }
    expect(navigatePracticeSchema.safeParse({ ...command, direction: 'random' }).success).toBe(
      false,
    )
  })
})

describe('草稿原文与字节限额', () => {
  test.each(['', '中文\r\n  int a = 1;\n', '😀', '\0'])('保留文字 %j', (text) => {
    expect(draftSchema.parse({ revision: 1, text }).text).toBe(text)
  })
  test.each(['\ud800', '\udc00', 'a\ud800b', '\ud800\ud800\udc00'])(
    '拒绝无法无损 UTF-8 保存的代理项 %j',
    (text) => {
      expect(draftSchema.safeParse({ revision: 1, text }).success).toBe(false)
    },
  )
  test('ASCII 精确边界接受，超限不截断', () => {
    const text = 'x'.repeat(MAX_DRAFT_BYTES)
    expect(draftSchema.parse({ revision: 1, text }).text).toBe(text)
    expect(draftSchema.safeParse({ revision: 1, text: text + 'x' }).success).toBe(false)
  })
  test('中文按 UTF-8 字节而非字符串长度限额', () => {
    const text = '中'.repeat(Math.floor(MAX_DRAFT_BYTES / 3)) + 'x'
    expect(new TextEncoder().encode(text)).toHaveLength(MAX_DRAFT_BYTES)
    expect(draftSchema.safeParse({ revision: 1, text }).success).toBe(true)
    expect(draftSchema.safeParse({ revision: 1, text: text + '中' }).success).toBe(false)
  })
})

describe('练习读取与统计契约', () => {
  test.each([
    null,
    EMPTY_QUESTION_FILTERS,
    { query: '串口', tag: '通信', difficulty: '基础', mastery: 'unpracticed', favoritesOnly: true },
  ])('会话返回完整创建条件或显式旧轮未知 %j', (filters) => {
    const view = hiddenView()
    expect(
      practiceViewSchema.parse({ ...view, session: { ...view.session, filters } }).session.filters,
    ).toEqual(filters)
  })
  test.each([
    undefined,
    {},
    [],
    '{}',
    false,
    { ...EMPTY_QUESTION_FILTERS, favoritesOnly: 1 },
    { ...EMPTY_QUESTION_FILTERS, mastery: '正确' },
    { ...EMPTY_QUESTION_FILTERS, sql: 'SELECT *' },
  ])('拒绝缺失或无效筛选快照，不默认伪造 %j', (filters) => {
    const view = hiddenView()
    expect(
      practiceViewSchema.safeParse({ ...view, session: { ...view.session, filters } }).success,
    ).toBe(false)
  })
  test('未揭晓结构拒绝答案和旧自评，不能靠隐藏样式代替缺字段', () => {
    const view = hiddenView()
    expect(practiceViewSchema.parse(view).item).not.toHaveProperty('answer')
    expect(
      practiceViewSchema.safeParse({ ...view, item: { ...view.item, answer: body } }).success,
    ).toBe(false)
    expect(
      practiceViewSchema.safeParse({ ...view, item: { ...view.item, rating: '掌握' } }).success,
    ).toBe(false)
  })
  test('活动会话必须有当前位置；完成会话不能混入题目', () => {
    const view = hiddenView()
    expect(practiceViewSchema.safeParse({ ...view, item: null }).success).toBe(false)
    expect(
      practiceViewSchema.safeParse({ ...view, item: { ...view.item, position: 1 } }).success,
    ).toBe(false)
    const session = {
      ...view.session,
      position: 1,
      status: 'finished',
      endedAt: view.session.createdAt,
    }
    expect(practiceViewSchema.safeParse({ session, item: null }).success).toBe(true)
    expect(practiceViewSchema.safeParse({ session, item: view.item }).success).toBe(false)
  })
  test('揭晓/未评价/自评数量不可混算为正确率', () => {
    const view = hiddenView()
    const counts = { ...view.session.counts, rated: 1 }
    expect(
      practiceViewSchema.safeParse({ ...view, session: { ...view.session, counts } }).success,
    ).toBe(false)
    expect(
      practiceViewSchema.safeParse({ ...view, session: { ...view.session, accuracy: 1 } }).success,
    ).toBe(false)
  })
  test('回执限定非空轮次与合法终点', () => {
    const { session } = hiddenView()
    const receipt = { sessionId: id, status: 'active', position: 0, revision: 0, total: 1 }
    expect(practiceAckSchema.safeParse(receipt).success).toBe(true)
    expect(practiceAckSchema.safeParse({ ...receipt, total: 0 }).success).toBe(false)
    expect(practiceAckSchema.safeParse({ ...receipt, position: 1 }).success).toBe(false)
    expect(
      practiceAckSchema.safeParse({ ...receipt, status: 'finished', position: 0 }).success,
    ).toBe(false)
    expect(practiceAckSchema.safeParse(session).success).toBe(false)
  })
})
