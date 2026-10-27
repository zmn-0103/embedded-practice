import { open, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MAX_IMPORT_QUESTIONS, MAX_MARKDOWN_BYTES } from '../../src/shared/contracts/question-bank'
import { prepareImport } from '../../src/main/services/library/prepare-import'
import { withImportDirectory } from '../helpers/import-directory'

function topic(id: string, count: number): string {
  const header = `---\nschema_version: 1\ntopic_id: ${id}\ntopic_title: 限额测试\n---\n\n`
  return (
    header +
    Array.from(
      { length: count },
      (_, index) => `## q-${index} | 题目\n\n### 题目\n\n题干。\n\n### 参考答案\n\n答案。\n`,
    ).join('\n')
  )
}

describe('批次限额实际文件链路', () => {
  it('20MiB 以上的真实 Markdown 文件在解码与解析前拒绝', () =>
    withImportDirectory(async (directory) => {
      const path = join(directory, '超大.md')
      const file = await open(path, 'w')
      try {
        await file.truncate(MAX_MARKDOWN_BYTES + 1)
      } finally {
        await file.close()
      }
      expect(await prepareImport([path])).toMatchObject({
        ok: false,
        issues: [{ code: 'LIMIT_EXCEEDED', fileName: path }],
      })
    }))

  it(
    '两个合法专题合计 10,001 题时拒绝整个批次',
    () =>
      withImportDirectory(async (directory) => {
        const first = join(directory, '甲.md')
        const second = join(directory, '乙.md')
        await writeFile(first, topic('first-limit', 5001))
        await writeFile(second, topic('second-limit', 5000))
        const result = await prepareImport([first, second])
        expect(result).toMatchObject({
          ok: false,
          issues: [
            {
              code: 'LIMIT_EXCEEDED',
              fileName: second,
              message: '本批题目总数不能超过 10,000 道。',
            },
          ],
        })
        expect(Object.hasOwn(result, 'value')).toBe(false)
      }),
    20_000,
  )

  it('选择文件数超过可容纳题量时不尝试逐个读取', async () => {
    const paths = Array.from({ length: MAX_IMPORT_QUESTIONS + 1 }, () => '未读取的路径.md')
    expect(await prepareImport(paths)).toMatchObject({
      ok: false,
      issues: [{ code: 'LIMIT_EXCEEDED', fileName: '导入批次' }],
    })
  })
})
