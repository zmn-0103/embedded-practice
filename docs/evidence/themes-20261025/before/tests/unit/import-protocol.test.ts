import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { prepareImport } from '../../src/main/services/library/prepare-import'
import {
  importWorkerReplySchema,
  importWorkerRequestSchema,
  workerFailure,
} from '../../src/main/workers/import-protocol'

const paths = [resolve('question-banks/examples/格式示例.md')]
const prepared = await prepareImport(paths)
if (!prepared.ok) throw new Error('工作线程协议测试的真实示例准备失败。')
const value = prepared.value
const validReply = { version: 1, threadId: 7, result: prepared }

describe('导入工作线程协议', () => {
  it('接受绝对路径并复制选择数组，后续修改不影响请求', () => {
    const selected = [...paths]
    const request = importWorkerRequestSchema.parse({ version: 1, filePaths: selected })
    selected.push('后来追加.md')
    expect(request.filePaths).toEqual(paths)
  })

  it.each([
    { version: 2, filePaths: paths },
    { version: 1, filePaths: [] },
    { version: 1, filePaths: ['relative.md'] },
    { version: 1, filePaths: [resolve('source.ts')] },
    { version: 1, filePaths: Array.from({ length: 10_001 }, () => paths[0]) },
    { version: 1, filePaths: paths, script: '任意脚本不能进入协议' },
  ])('拒绝无效或越权请求 %#', (request) => {
    expect(importWorkerRequestSchema.safeParse(request).success).toBe(false)
  })

  it('接受真实图片快照经结构化克隆后的 Uint8Array，并保留哈希和引用', () => {
    const wire = structuredClone(validReply)
    const reply = importWorkerReplySchema.parse(wire)
    expect(reply.threadId).toBe(7)
    expect(reply.result.ok).toBe(true)
    if (!reply.result.ok) throw new Error('快照被意外拒绝。')
    expect(reply.result.value.questionCount).toBe(2)
    expect(reply.result.value.resources.map((image) => image.hash)).toEqual(
      value.resources.map((image) => image.hash),
    )
    expect(reply.result.value.resources[0]?.bytes).toEqual(
      new Uint8Array(value.resources[0]?.bytes ?? []),
    )
    expect(reply.result.value.topics[0]?.imageBindings).toEqual(value.topics[0]?.imageBindings)
    expect(reply.result.value.topics[0]?.contentHashes).toEqual(value.topics[0]?.contentHashes)
    expect(reply.result.value.topics[0]?.topic.questions[0]?.definitions).toEqual(
      value.topics[0]?.topic.questions[0]?.definitions,
    )
  })

  it.each([
    ['题量不符', { ...value, questionCount: 1 }],
    ['来源大小不符', { ...value, sourceBytes: 0 }],
    ['丢失资源', { ...value, resources: [] }],
    [
      '丢失指纹',
      { ...value, topics: value.topics.map((topic) => ({ ...topic, contentHashes: [] })) },
    ],
    [
      '重复指纹',
      {
        ...value,
        topics: value.topics.map((topic) => ({
          ...topic,
          contentHashes: [...topic.contentHashes, topic.contentHashes[0]!],
        })),
      },
    ],
    [
      '指纹指向其他题',
      {
        ...value,
        topics: value.topics.map((topic) => ({
          ...topic,
          contentHashes: topic.contentHashes.map((item) => ({ ...item, questionId: 'unknown' })),
        })),
      },
    ],
    [
      '无效指纹',
      {
        ...value,
        topics: value.topics.map((topic) => ({
          ...topic,
          contentHashes: topic.contentHashes.map((item) => ({ ...item, hash: 'invalid' })),
        })),
      },
    ],
    [
      '重复图片绑定',
      {
        ...value,
        topics: value.topics.map((topic) => ({
          ...topic,
          imageBindings: [...topic.imageBindings, ...topic.imageBindings],
        })),
      },
    ],
    ['重复资源', { ...value, resources: [...value.resources, ...value.resources] }],
    ['重复专题', { ...value, topics: [...value.topics, ...value.topics], questionCount: 4 }],
    [
      '丢失图片绑定',
      { ...value, topics: value.topics.map((topic) => ({ ...topic, imageBindings: [] })) },
    ],
    [
      '无效图片尺寸',
      { ...value, resources: value.resources.map((image) => ({ ...image, width: 0 })) },
    ],
    [
      '空图片字节',
      {
        ...value,
        resources: value.resources.map((image) => ({ ...image, bytes: new Uint8Array(0) })),
      },
    ],
  ])('拒绝结构或关联被损坏的完整结果：%s', (_name, snapshot) => {
    expect(
      importWorkerReplySchema.safeParse({ ...validReply, result: { ok: true, value: snapshot } })
        .success,
    ).toBe(false)
  })

  it('来源字节须同时覆盖文本与图片，不能只覆盖两者中较大的一项', () => {
    const characters = value.topics.reduce((sum, topic) => sum + topic.markdown.length, 0)
    const imageBytes = value.resources.reduce((sum, image) => sum + image.bytes.byteLength, 0)
    const snapshot = { ...value, sourceBytes: Math.max(characters, imageBytes) }
    expect(characters).toBeGreaterThan(0)
    expect(imageBytes).toBeGreaterThan(0)
    expect(
      importWorkerReplySchema.safeParse({ ...validReply, result: { ok: true, value: snapshot } })
        .success,
    ).toBe(false)
  })

  it.each([
    { ...validReply, version: 2 },
    { ...validReply, threadId: 0 },
    { ...validReply, stack: '不允许额外字段' },
    { version: 1, threadId: 7, result: { ok: false, issues: [] } },
    { version: 1, threadId: 7, result: { ok: true } },
  ])('拒绝无效回复包 %#', (reply) => {
    expect(importWorkerReplySchema.safeParse(reply).success).toBe(false)
  })

  it('工作线程失败结果不携带堆栈或异常对象', () => {
    const result = workerFailure('WORKER_FAILED', '后台任务失败，请重试。')
    expect(importWorkerReplySchema.safeParse({ version: 1, threadId: 7, result }).success).toBe(
      true,
    )
    if (result.ok) throw new Error('应当返回失败。')
    expect(Object.keys(result.issues[0] ?? {}).sort()).toEqual([
      'code',
      'column',
      'fileName',
      'line',
      'message',
    ])
    const issue = result.issues[0]
    expect(
      importWorkerReplySchema.safeParse({
        version: 1,
        threadId: 7,
        result: { ok: false, issues: [{ ...issue, stack: '禁止字段' }] },
      }).success,
    ).toBe(false)
  })
})
