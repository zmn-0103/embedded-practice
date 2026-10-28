import { randomUUID } from 'node:crypto'
import { expect, test } from 'vitest'
import {
  contentComparisonRequestSchema,
  contentComparisonSchema,
  contentVersionsRequestSchema,
  contentVersionsSchema,
} from '../../src/shared/contracts/content-updates'
import {
  questionSetPreviewRequestSchema,
  questionSetPreviewSchema,
  questionSetSchema,
  selectedPracticeSchema,
} from '../../src/shared/contracts/question-sets'
import { startPracticeSchema } from '../../src/shared/contracts/practice'

const identity = { topicId: 'updates', questionId: 'q-1' }
const version = (n: number) => ({
  versionId: n,
  sequence: n,
  createdAt: '2026-10-28T00:00:00.000Z',
})
const list = {
  ...identity,
  target: version(3),
  page: 1,
  pageSize: 20,
  total: 2,
  versions: [version(2), version(1)],
}
const request = { ...identity, versionId: 3, previousVersionId: 1, part: 'question' as const }
const body = { markdown: '单独正文', definitions: [], imageBindings: [] }

test('版本元数据允许零旧版，页序完整/先后明确且不能夹带正文', () => {
  expect(contentVersionsSchema.parse({ ...list, total: 0, versions: [] }).versions).toEqual([])
  expect(contentVersionsSchema.parse(list)).toEqual(list)
  for (const invalid of [
    { ...list, versions: [version(1), version(2)] },
    { ...list, versions: [version(2), version(2)] },
    { ...list, versions: [version(3), version(1)] },
    { ...list, page: 2 },
    { ...list, total: 3 },
    { ...list, versions: [{ ...version(2), body }, version(1)] },
  ])
    expect(contentVersionsSchema.safeParse(invalid).success).toBe(false)
})

test('两个只读请求严格限定身份/版本/分页或分区，不接受路径/内容和相同版本', () => {
  expect(contentVersionsRequestSchema.parse({ ...identity, versionId: 3, page: 1 })).toBeTruthy()
  expect(contentComparisonRequestSchema.parse(request)).toEqual(request)
  for (const invalid of [
    { ...request, previousVersionId: 3 },
    { ...request, part: 'all' },
    { ...request, answer: true },
    { ...request, filePath: 'C:/private' },
  ])
    expect(contentComparisonRequestSchema.safeParse(invalid).success).toBe(false)
  expect(
    contentVersionsRequestSchema.safeParse({ ...identity, versionId: 3, page: 0 }).success,
  ).toBe(false)
  expect(
    contentVersionsRequestSchema.safeParse({ ...identity, versionId: 3, page: 1, part: 'answer' })
      .success,
  ).toBe(false)
})

test('比较结果必须两份不同且先旧后新，不在题干结果增加答案字段', () => {
  const comparison = {
    ...identity,
    part: 'question',
    previous: { ...version(1), body },
    current: { ...version(3), body },
  }
  expect(contentComparisonSchema.parse(comparison)).toEqual(comparison)
  expect(
    contentComparisonSchema.safeParse({ ...comparison, previous: comparison.current }).success,
  ).toBe(false)
  expect(contentComparisonSchema.safeParse({ ...comparison, answer: '不能附带答案' }).success).toBe(
    false,
  )
})

test('更新限定只用于预览和明确组卷，不写进保存题单或条件方案', () => {
  const items = [{ ...identity, versionId: 3 }]
  const selected = { sourceName: '内容更新复习：勾选题目', items, contentUpdatedOnly: true }
  expect(
    questionSetPreviewRequestSchema.parse({ items: [identity], contentUpdatedOnly: true }),
  ).toMatchObject({ contentUpdatedOnly: true })
  expect(selectedPracticeSchema.parse(selected)).toEqual(selected)
  expect(
    startPracticeSchema.parse({
      requestId: randomUUID(),
      topicId: null,
      count: 'all',
      replace: null,
      selected,
    }),
  ).toMatchObject({ selected })
  expect(
    questionSetSchema.safeParse({
      setId: randomUUID(),
      name: '题单',
      items: [identity],
      contentUpdatedOnly: true,
    }).success,
  ).toBe(false)
  expect(
    selectedPracticeSchema.safeParse({ ...selected, contentUpdatedOnly: 'true' }).success,
  ).toBe(false)
})

test('不再待复习项在预览保留身份/版本，但不能将该状态直接作为建轮项', () => {
  const item = {
    ...identity,
    versionId: 3,
    title: '旧题',
    topicTitle: '专题',
    status: 'not-pending',
  }
  expect(questionSetPreviewSchema.parse({ definition: null, items: [item] }).items).toEqual([item])
  expect(
    selectedPracticeSchema.safeParse({
      sourceName: '复习',
      items: [item],
      contentUpdatedOnly: true,
    }).success,
  ).toBe(false)
})
