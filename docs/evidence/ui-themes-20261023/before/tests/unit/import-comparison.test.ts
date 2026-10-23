import { describe, expect, it } from 'vitest'
import type { ImportSnapshot } from '../../src/shared/contracts/import-snapshot'
import { compareImport, type LibraryBaseline } from '../../src/main/services/library/compare-import'
import { contentFingerprint } from '../../src/main/services/library/content-fingerprint'
import { parseQuestionBank } from '../../src/main/services/library/parse-question-bank'

function source(answer = '原答案', header = ''): string {
  return `---
schema_version: 1
topic_id: compare-test
topic_title: 比较测试
---
${header}
## q-1 | 原标题
标签：C, GPIO
难度：基础
### 题目
原题干
### 参考答案
${answer}
`
}

function snapshot(markdown = source(), imageHash = 'a'.repeat(64)): ImportSnapshot {
  const parsed = parseQuestionBank(markdown, '测试.md')
  if (!parsed.ok) throw new Error(JSON.stringify(parsed.issues))
  const topic = parsed.value
  const bindings = new Map(topic.questions.flatMap((q) => q.images.map((i) => [i.url, imageHash])))
  return {
    topics: [
      {
        topic,
        markdown,
        imageBindings: [...bindings].map(([url, hash]) => ({ url, hash })),
        contentHashes: topic.questions.map((q) => ({
          questionId: q.questionId,
          hash: contentFingerprint(q, bindings),
        })),
      },
    ],
    resources: [],
    sourceBytes: Buffer.byteLength(markdown),
    questionCount: topic.questions.length,
  }
}

function baseline(value = snapshot()): LibraryBaseline {
  return {
    revision: 1,
    topics: value.topics.map(({ topic, contentHashes }) => ({
      topicId: topic.topicId,
      title: topic.topicTitle,
      fileName: topic.fileName,
      questions: topic.questions.map((q, position) => ({
        questionId: q.questionId,
        title: q.title,
        tags: q.tags,
        difficulty: q.difficulty,
        position,
        archived: false,
        contentHash: contentHashes.find((c) => c.questionId === q.questionId)!.hash,
      })),
    })),
  }
}

const fingerprint = (value: ImportSnapshot) => value.topics[0]?.contentHashes[0]?.hash

describe('导入内容与变更比较', () => {
  it('首次新增与重复导入保持可区分', () => {
    expect(compareImport(snapshot(), { revision: 0, topics: [] }).counts).toMatchObject({
      added: 1,
      newVersions: 1,
    })
    expect(compareImport(snapshot(), baseline()).counts).toMatchObject({
      unchanged: 1,
      newVersions: 0,
    })
  })
  it.each([
    ['标题', source().replace('原标题', '新标题')],
    ['标签', source().replace('C, GPIO', 'GPIO, C, 新标签')],
    ['难度', source().replace('基础', '综合')],
  ])('仅修改%s不生成内容版本', (_field, markdown) => {
    const changed = snapshot(markdown)
    expect(fingerprint(changed)).toBe(fingerprint(snapshot()))
    expect(compareImport(changed, baseline()).counts).toMatchObject({ metadata: 1, newVersions: 0 })
  })
  it('专题改名、文件改名不改变题目身份或内容版本', () => {
    const prepared = snapshot(source().replace('比较测试', '专题新名'))
    const value = {
      ...prepared,
      topics: prepared.topics.map((item) => ({
        ...item,
        topic: { ...item.topic, fileName: '新文件.md' },
      })),
    }
    const summary = compareImport(value, baseline())
    expect(summary.counts).toMatchObject({ unchanged: 1, added: 0, newVersions: 0 })
    expect(summary.topics[0]?.metadataChanged).toBe(true)
  })
  it.each(['补充答案', '![图](assets/图.png)'])('答案变化生成新版本：%s', (answer) => {
    expect(compareImport(snapshot(source(answer)), baseline()).counts).toMatchObject({
      updated: 1,
      newVersions: 1,
    })
  })
  it('同一路径图片的字节哈希变化使内容更新', () => {
    const markdown = source('![图](assets/图.png)')
    const old = snapshot(markdown)
    const changed = snapshot(markdown, 'b'.repeat(64))
    expect(compareImport(changed, baseline(old)).counts.updated).toBe(1)
  })
  it('仅 CRLF/LF 变化不生成版本，有意义空白变化仍被识别', () => {
    const markdown = source('```c\n  x++;  \n```')
    expect(fingerprint(snapshot(markdown.replace(/\n/g, '\r\n')))).toBe(
      fingerprint(snapshot(markdown)),
    )
    expect(fingerprint(snapshot(markdown.replace('  x++;  ', 'x++;')))).not.toBe(
      fingerprint(snapshot(markdown)),
    )
  })
  it('保存并比较本题实际使用的文外引用，忽略其他题使用的定义', () => {
    const markdown = source(
      '[手册][ref]',
      '[ref]: https://example.com/old\n[other]: https://example.com/a',
    )
    const value = snapshot(markdown)
    expect(value.topics[0]?.topic.questions[0]?.definitions).toEqual([
      { identifier: 'REF', url: 'https://example.com/old', title: null },
    ])
    expect(fingerprint(snapshot(markdown.replace('/old', '/new')))).not.toBe(fingerprint(value))
    expect(fingerprint(snapshot(markdown.replace('com/a', 'com/b')))).toBe(fingerprint(value))
  })
  it('代码中的引用标记不引入引用定义', () => {
    const value = snapshot(source('```text\n[手册][ref]\n```', '[ref]: https://example.com/old'))
    expect(value.topics[0]?.topic.questions[0]?.definitions).toEqual([])
  })
  it('缺题只归档活动题，重复缺失不再次归档', () => {
    const old = baseline()
    const original = old.topics[0]!.questions[0]!
    const incoming = snapshot(source().replace('q-1 |', 'q-2 |'))
    expect(compareImport(incoming, old).counts).toMatchObject({ added: 1, archived: 1 })
    const archived = {
      ...old,
      topics: [{ ...old.topics[0]!, questions: [{ ...original, archived: true }] }],
    }
    expect(compareImport(incoming, archived).counts.archived).toBe(0)
    expect(compareImport(snapshot(), archived).counts).toMatchObject({
      restored: 1,
      newVersions: 0,
    })
    expect(compareImport(snapshot(source('新答案')), archived).counts).toMatchObject({
      restored: 1,
      newVersions: 1,
      updated: 0,
    })
  })
  it('顺序变更只更新元数据，其他专题不受本批影响', () => {
    const old = baseline()
    const withOrder = {
      ...old,
      topics: [
        {
          ...old.topics[0]!,
          questions: old.topics[0]!.questions.map((q) => ({ ...q, position: 9 })),
        },
        { ...old.topics[0]!, topicId: 'other-topic' },
      ],
    }
    const result = compareImport(snapshot(), withOrder)
    expect(result.counts).toMatchObject({ metadata: 1, archived: 0, newVersions: 0 })
    expect(result.topics).toHaveLength(1)
  })
})
