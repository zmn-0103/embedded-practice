import { randomUUID } from 'node:crypto'
import { afterEach, expect, test, vi } from 'vitest'
import {
  knowledgeSearchSchema,
  relationChangeSchema,
  relationSchema,
  recentSearchSchema,
  recentSearchChangeSchema,
  type Relation,
  type RelationDraft,
  type KnowledgeDesktopApi,
} from '../../src/shared/contracts/knowledge'
import { createRelationController } from '../../src/renderer/src/relation-controller'

const draft: RelationDraft = {
  source: { topicId: 'uart', questionId: 'dma' },
  target: { topicId: 'uart', questionId: 'tc' },
  kind: 'confused',
  explanation: 'DMA完成不等于串口发送完成',
}
const record = (change: Partial<Relation> = {}): Relation => ({
  ...draft,
  relationId: randomUUID(),
  revision: 1,
  updatedAt: '2026-10-29T00:00:00.000Z',
  ...change,
})
const active: ReturnType<typeof createRelationController>[] = []
function setup() {
  const api: Pick<KnowledgeDesktopApi, 'changeRelation'> = {
    changeRelation: vi.fn(async (command) => ({
      ok: true as const,
      value:
        command.action === 'delete'
          ? null
          : record({ ...command, revision: command.expectedRevision + 1 }),
    })),
  }
  const controller = createRelationController(api)
  active.push(controller)
  return { api, controller }
}
afterEach(() => {
  active.splice(0).forEach((controller) => controller.dispose())
})
test('知识契约限制字面检索、来源/分页与纯文本说明，禁止自关联/非法修订和额外字段', () => {
  const search = {
    query: '  DMA%_  ',
    kind: 'all',
    archive: 'all',
    hasNotes: false,
    sort: 'notes',
    page: 1,
  }
  expect(knowledgeSearchSchema.parse(search).query).toBe('DMA%_')
  expect(knowledgeSearchSchema.safeParse({ ...search, query: '中'.repeat(129) }).success).toBe(
    false,
  )
  expect(knowledgeSearchSchema.safeParse({ ...search, kind: 'answer' }).success).toBe(false)
  expect(knowledgeSearchSchema.safeParse({ ...search, page: 0 }).success).toBe(false)
  const command = { action: 'save', ...draft, relationId: randomUUID(), expectedRevision: 0 }
  expect(relationChangeSchema.parse(command)).toEqual(command)
  for (const change of [
    { target: draft.source },
    { explanation: '中'.repeat(2001) },
    { explanation: '\uD800' },
    { expectedRevision: Number.MAX_SAFE_INTEGER },
    { expectedRevision: -1 },
    { sql: 'DELETE' },
  ])
    expect(relationChangeSchema.safeParse({ ...command, ...change }).success).toBe(false)
  expect(
    relationChangeSchema.safeParse({ ...command, explanation: '🧠'.repeat(1000) }).success,
  ).toBe(true)
  expect(relationSchema.safeParse({ ...record(), revision: 0 }).success).toBe(false)
})
test('最近搜索写入先规范化，存储数据不得为空/非规范/坏日期，清空无额外参数', () => {
  expect(recentSearchChangeSchema.parse({ kind: 'remember', query: '  DMA  ' })).toEqual({
    kind: 'remember',
    query: 'DMA',
  })
  expect(recentSearchChangeSchema.safeParse({ kind: 'remember', query: ' ' }).success).toBe(false)
  expect(recentSearchChangeSchema.safeParse({ kind: 'clear', query: 'anything' }).success).toBe(
    false,
  )
  for (const query of ['', ' DMA', 'DMA '])
    expect(
      recentSearchSchema.safeParse({ query, searchedAt: '2026-10-29T00:00:00Z' }).success,
    ).toBe(false)
})
test('明确创建/修改前保存守卫阻止离开，成功保存才清草稿；不会自动建关联', async () => {
  const { api, controller } = setup()
  expect(await controller.flush()).toBe(true)
  expect(api.changeRelation).not.toHaveBeenCalled()
  controller.begin(draft)
  expect(await controller.flush()).toBe(false)
  expect(controller.getState().draft).toEqual(draft)
  controller.edit({ explanation: '已补充完成条件' })
  expect(await controller.save()).toBe(true)
  expect(controller.hasPending()).toBe(false)
  expect(controller.getState()).toMatchObject({ confirmed: 1, message: '关联已保存。' })
})
test.each(['throw', 'bad-response', 'database'] as const)(
  '结果未知%s锁输入，严格重试原命令而不重复创建',
  async (kind) => {
    const { api, controller } = setup()
    controller.begin(draft)
    if (kind === 'throw') vi.mocked(api.changeRelation).mockRejectedValueOnce(new Error('响应丢失'))
    else if (kind === 'database')
      vi.mocked(api.changeRelation).mockResolvedValueOnce({
        ok: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: '结果未确认' },
      })
    else
      vi.mocked(api.changeRelation).mockResolvedValueOnce({
        ok: true,
        value: record({ explanation: '错误内容' }),
      })
    expect(await controller.save()).toBe(false)
    controller.edit({ explanation: '不接受后来的输入' })
    expect(controller.getState().draft).toEqual(draft)
    expect(await controller.flush()).toBe(false)
    expect(await controller.save()).toBe(true)
    const calls = vi.mocked(api.changeRelation).mock.calls
    expect(calls).toHaveLength(2)
    expect(calls[1]![0]).toEqual(calls[0]![0])
  },
)
test('冲突保留说明且不能盲重试，明确放弃后才解除保存守卫', async () => {
  const { api, controller } = setup(),
    existing = record()
  controller.begin(existing, existing)
  controller.edit({ explanation: '保留的本地说明' })
  vi.mocked(api.changeRelation).mockImplementationOnce(async (command) => {
    expect(relationChangeSchema.safeParse(command).success).toBe(true)
    return { ok: false, error: { code: 'CONFLICT', message: '已被其他编辑器修改' } }
  })
  expect(await controller.save()).toBe(false)
  expect(await controller.save()).toBe(false)
  expect(api.changeRelation).toHaveBeenCalledTimes(1)
  expect(controller.getState().draft?.explanation).toBe('保留的本地说明')
  controller.discard()
  expect(await controller.flush()).toBe(true)
})
test('在途保存/关闭共享一次请求，删除确认只能接受null，未知删除按原快照重试', async () => {
  const { api, controller } = setup()
  controller.begin(draft)
  let release!: (value: Awaited<ReturnType<typeof api.changeRelation>>) => void
  vi.mocked(api.changeRelation).mockReturnValueOnce(
    new Promise((resolve) => {
      release = resolve
    }),
  )
  const first = controller.save(),
    second = controller.flush(),
    command = vi.mocked(api.changeRelation).mock.calls[0]![0]
  if (command.action !== 'save') throw new Error('未创建')
  release({ ok: true, value: record({ ...command, revision: 1 }) })
  expect(await first).toBe(true)
  expect(await second).toBe(true)
  expect(api.changeRelation).toHaveBeenCalledTimes(1)
  const existing = record()
  vi.mocked(api.changeRelation).mockResolvedValueOnce({ ok: true, value: existing })
  expect(await controller.remove(existing)).toBe(false)
  expect(controller.hasPending()).toBe(true)
  expect(await controller.save()).toBe(true)
  const calls = vi.mocked(api.changeRelation).mock.calls
  expect(calls[2]![0]).toEqual(calls[1]![0])
})
