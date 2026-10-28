import { randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { writeMaterial } from '../../src/main/services/study/write-material'
import { withImportDirectory } from '../helpers/import-directory'

test('明确外部目标原子替换，资源与Markdown同目录保留', async () =>
  withImportDirectory(async (directory) => {
    const data = join(directory, 'user-data')
    await mkdir(data)
    const file = join(directory, '复习.md')
    await writeFile(file, '原材料')
    const name = `${'a'.repeat(64)}.png`,
      bytes = Buffer.from('独立资源字节')
    const bundle = {
      count: 1,
      assetsName: `review-assets-${randomUUID()}`,
      markdown: '# 复习\n',
      images: [{ name, bytes }],
    }
    const result = await writeMaterial(bundle, file, data, new AbortController().signal, () => {})
    expect(result).toMatchObject({ filePath: file, questions: 1, images: 1 })
    expect(await readFile(file, 'utf8')).toBe('# 复习\n')
    expect(await readFile(join(result.assetsPath!, name))).toEqual(bytes)
    expect((await readdir(directory)).some((name) => name.endsWith('.tmp'))).toBe(false)
  }))
test('取消或写资源中途失败保持原目标，清理仅本次新资源，诊断异常不盖过错误', async () =>
  withImportDirectory(async (directory) => {
    const data = join(directory, 'data')
    await mkdir(data)
    const file = join(directory, '原材料.md')
    await writeFile(file, '原目标保持')
    const bundle = {
      count: 1,
      assetsName: `review-assets-${randomUUID()}`,
      markdown: '新内容',
      images: [{ name: '../越界', bytes: Buffer.from('样本') }],
    }
    const signal = new AbortController()
    signal.abort()
    await expect(writeMaterial(bundle, file, data, signal.signal, () => {})).rejects.toMatchObject({
      code: 'CANCELLED',
    })
    await expect(
      writeMaterial(bundle, file, data, new AbortController().signal, () => {
        throw new Error('诊断不可用')
      }),
    ).rejects.toMatchObject({ code: 'FILE_ERROR' })
    expect(await readFile(file, 'utf8')).toBe('原目标保持')
    expect((await readdir(directory)).sort()).toEqual(['data', '原材料.md'])
  }))
test('拒绝管理数据根及..notes子目录，也拒绝非md和已有同名资源目录', async () =>
  withImportDirectory(async (directory) => {
    const data = join(directory, 'data')
    await mkdir(join(data, '..notes'), { recursive: true })
    const bundle = {
      count: 1,
      assetsName: `review-assets-${randomUUID()}`,
      markdown: '新材料',
      images: [],
    }
    for (const file of [
      join(data, '复习.md'),
      join(data, '..notes', '复习.md'),
      join(directory, 'practice.sqlite3'),
    ])
      await expect(
        writeMaterial(bundle, file, data, new AbortController().signal, () => {}),
      ).rejects.toMatchObject({ code: 'INVALID_REQUEST' })
    await mkdir(join(directory, bundle.assetsName))
    const target = join(directory, '同名测试.md')
    await writeFile(target, '保持')
    await expect(
      writeMaterial(
        { ...bundle, images: [{ name: `${'a'.repeat(64)}.png`, bytes: Buffer.from('样本') }] },
        target,
        data,
        new AbortController().signal,
        () => {},
      ),
    ).rejects.toMatchObject({ code: 'FILE_ERROR' })
    expect(await readFile(target, 'utf8')).toBe('保持')
    expect(await readdir(join(directory, bundle.assetsName))).toEqual([])
  }))
