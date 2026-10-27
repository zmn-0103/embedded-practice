import { Buffer } from 'node:buffer'
import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { prepareImport } from '../../src/main/services/library/prepare-import'
import { withImportDirectory } from '../helpers/import-directory'

function markdown(topicId: string, body = '完整题干。'): string {
  return `---\nschema_version: 1\ntopic_id: ${topicId}\ntopic_title: 测试专题\n---\n\n## q-001 | 测试题\n\n### 题目\n\n${body}\n\n### 参考答案\n\n完整答案。\n`
}

describe('文件到完整批次快照', () => {
  it('真实示例覆盖文本、代码、表格、三种图片和引用定义', async () => {
    const result = await prepareImport([resolve('question-banks/examples/格式示例.md')])
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(JSON.stringify(result.issues))
    expect(result.value.questionCount).toBe(2)
    expect(result.value.resources.map((resource) => resource.format)).toEqual([
      'png',
      'jpeg',
      'webp',
    ])
    expect(result.value.topics[0]?.imageBindings).toHaveLength(3)
    expect(result.value.topics[0]?.topic.questions[0]?.questionMarkdown).toContain(
      '## fake-question | 不是新题',
    )
    expect(result.value.resources.every((image) => image.width === 2 && image.height === 3)).toBe(
      true,
    )
  })

  it('用户 GPIO 题库可从磁盘完整准备，模板结构有效但仍是占位内容', async () => {
    const result = await prepareImport([
      resolve('question-banks/STM32F103RCT6-GPIO阶段自测题.md'),
      resolve('question-banks/templates/专题模板.md'),
    ])
    expect(result).toMatchObject({ ok: true, value: { questionCount: 79, resources: [] } })
    if (!result.ok) throw new Error(JSON.stringify(result.issues))
    expect(result.value.topics[0]?.topic.questions).toHaveLength(78)
    expect(result.value.topics[1]?.topic.topicId).toBe('your-topic')
  })

  it('同图重复引用只计一次，相同内容的不同路径只保留一份资源', () =>
    withImportDirectory(async (directory) => {
      await mkdir(join(directory, 'assets'))
      await copyFile('tests/fixtures/images/small.png', join(directory, 'assets/a.png'))
      await copyFile('tests/fixtures/images/small.png', join(directory, 'assets/b.png'))
      const first = markdown('first', '![一](assets/a.png)\n\n![重复](assets/a.png)')
      const second = markdown('second', '![二](assets/b.png)')
      const firstPath = join(directory, '一.md')
      const secondPath = join(directory, '二.md')
      await writeFile(firstPath, first)
      await writeFile(secondPath, second)
      const originalImage = await readFile(join(directory, 'assets/a.png'))
      const result = await prepareImport([firstPath, secondPath])
      expect(result.ok).toBe(true)
      if (!result.ok) throw new Error(JSON.stringify(result.issues))
      expect(result.value.resources).toHaveLength(1)
      expect(result.value.topics.map((topic) => topic.imageBindings.length)).toEqual([1, 1])
      expect(result.value.sourceBytes).toBe(
        Buffer.byteLength(first) + Buffer.byteLength(second) + originalImage.length * 2,
      )
      await writeFile(firstPath, markdown('changed'))
      await rename(join(directory, 'assets'), join(directory, '图片已移走'))
      expect(result.value.topics[0]?.markdown).toBe(first)
      expect(result.value.resources[0]?.bytes).toEqual(originalImage)
      expect(await readFile(secondPath, 'utf8')).toBe(second)
    }))

  it('UTF-8 BOM 与 CRLF 保留在原文快照中', () =>
    withImportDirectory(async (directory) => {
      const source = '\uFEFF' + markdown('bom-test').replaceAll('\n', '\r\n')
      const file = join(directory, 'BOM.md')
      await writeFile(file, source)
      expect(await prepareImport([file])).toMatchObject({
        ok: true,
        value: { topics: [{ markdown: source }] },
      })
    }))

  it.each([Buffer.from([0xff, 0xfe, 0x61, 0]), Buffer.from([0xc3, 0x28])])(
    '严格拒绝 UTF-16 或损坏 UTF-8',
    (bytes) =>
      withImportDirectory(async (directory) => {
        const file = join(directory, '编码.md')
        await writeFile(file, bytes)
        expect(await prepareImport([file])).toMatchObject({
          ok: false,
          issues: [{ code: 'INVALID_ENCODING', fileName: file, line: 1, column: 1 }],
        })
      }),
  )

  it('同批重复专题或重复选择来源均拒绝，不返回部分成功数据', () =>
    withImportDirectory(async (directory) => {
      const first = join(directory, '一.md')
      const second = join(directory, '二.md')
      await writeFile(first, markdown('same-topic'))
      await writeFile(second, markdown('same-topic'))
      for (const paths of [
        [first, second],
        [first, first],
      ]) {
        const result = await prepareImport(paths)
        expect(result).toMatchObject({ ok: false, issues: [{ code: 'DUPLICATE_ID' }] })
        expect(Object.hasOwn(result, 'value')).toBe(false)
      }
    }))

  it('有效文件后遇到缺图时整批失败，错误只含契约字段和图片行列', () =>
    withImportDirectory(async (directory) => {
      const valid = join(directory, '有效.md')
      const broken = join(directory, '缺图.md')
      await writeFile(valid, markdown('valid-topic'))
      await writeFile(
        broken,
        markdown('broken-topic', '![不应进入错误对象的图片说明](assets/missing.png)'),
      )
      const result = await prepareImport([valid, broken])
      expect(result).toMatchObject({
        ok: false,
        issues: [{ code: 'FILE_UNREADABLE', fileName: broken, line: 11, column: 1 }],
      })
      expect(Object.hasOwn(result, 'value')).toBe(false)
      if (result.ok) throw new Error('缺图未拒绝。')
      expect(Object.keys(result.issues[0] ?? {}).sort()).toEqual([
        'code',
        'column',
        'fileName',
        'line',
        'message',
      ])
    }))

  it('结构错误沿用纯解析器定位，并且不修改原文件', () =>
    withImportDirectory(async (directory) => {
      const file = join(directory, '结构.md')
      const source = markdown('broken').replace('### 参考答案', '### 未知分区')
      await writeFile(file, source)
      expect(await prepareImport([file])).toMatchObject({
        ok: false,
        issues: [{ code: 'INVALID_QUESTION', fileName: file }],
      })
      expect(await readFile(file, 'utf8')).toBe(source)
    }))

  it('空选择、相对路径、错误扩展名和缺文件均明确失败', async () => {
    for (const paths of [[], ['relative.md'], [resolve('不存在.txt')], [resolve('不存在.md')]]) {
      expect((await prepareImport(paths)).ok).toBe(false)
    }
  })

  it('开始准备后调用方改变选择列表，不会追加未经本次选择的文件', () =>
    withImportDirectory(async (directory) => {
      const path = join(directory, '选定.md')
      await writeFile(path, markdown('selected-topic'))
      const selected = [path]
      const pending = prepareImport(selected)
      selected.push(join(directory, '后来追加的缺文件.md'))
      expect(await pending).toMatchObject({ ok: true, value: { questionCount: 1 } })
    }))
})
