import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { copyFile, mkdir, open, readFile, rename, symlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MAX_IMAGE_BYTES } from '../../src/shared/contracts/import-snapshot'
import { parseImagePath } from '../../src/shared/contracts/image-path'
import { readImageSnapshot, resolveImageSource } from '../../src/main/services/resources/read-image'
import { withImportDirectory } from '../helpers/import-directory'

async function arrange(directory: string, fixture = 'small.png', name = '接线 图.png') {
  const markdown = join(directory, '专题.md')
  const assets = join(directory, 'assets')
  await mkdir(assets)
  await writeFile(markdown, '仅用于定位资源目录，不解析此文件')
  const image = join(assets, name)
  await copyFile(join('tests/fixtures/images', fixture), image)
  return { markdown, assets, image }
}

describe('真实图片读取与路径限制', () => {
  it.each([
    ['small.png', 'png'],
    ['small.jpg', 'jpeg'],
    ['small.webp', 'webp'],
  ])('读取 %s 的实际尺寸、字节和内容哈希', (fixture, format) =>
    withImportDirectory(async (directory) => {
      const { markdown, image } = await arrange(directory, fixture, fixture)
      const source = await resolveImageSource(markdown, `assets/${fixture}`)
      const snapshot = await readImageSnapshot(source)
      const original = await readFile(image)
      expect(snapshot).toMatchObject({
        format,
        width: 2,
        height: 3,
        hash: createHash('sha256').update(original).digest('hex'),
      })
      expect(snapshot.bytes).toEqual(original)
    }),
  )

  it('中文和编码空格路径可读取，来源移走后快照不丢失', () =>
    withImportDirectory(async (directory) => {
      const { markdown, image } = await arrange(directory)
      const source = await resolveImageSource(markdown, 'assets/接线%20图.png')
      const snapshot = await readImageSnapshot(source)
      const original = await readFile(image)
      await rename(image, join(directory, '移走.png'))
      expect(snapshot.bytes).toEqual(original)
      expect(snapshot.hash).toBe(createHash('sha256').update(original).digest('hex'))
    }))

  it('缺图或目录不能充当图片', () =>
    withImportDirectory(async (directory) => {
      const { markdown, assets } = await arrange(directory)
      await expect(resolveImageSource(markdown, 'assets/缺图.png')).rejects.toMatchObject({
        code: 'FILE_UNREADABLE',
      })
      await mkdir(join(assets, '目录.png'))
      const source = await resolveImageSource(markdown, 'assets/目录.png')
      await expect(readImageSnapshot(source)).rejects.toMatchObject({ code: 'FILE_UNREADABLE' })
    }))

  it.each([
    Buffer.alloc(0),
    Buffer.from('<svg width="2" height="3"></svg>'),
    Buffer.from('89504e470d0a1a0a', 'hex'),
  ])('拒绝空、伪装或截断图片头部', (content) =>
    withImportDirectory(async (directory) => {
      const { markdown, image } = await arrange(directory)
      await writeFile(image, content)
      await expect(
        readImageSnapshot(await resolveImageSource(markdown, 'assets/接线%20图.png')),
      ).rejects.toMatchObject({ code: 'INVALID_IMAGE' })
    }),
  )

  it('扩展名必须与真实类型一致，WebP 的 RIFF 长度必须有效', () =>
    withImportDirectory(async (directory) => {
      const { markdown, assets } = await arrange(directory, 'small.jpg', '伪装.png')
      await expect(
        readImageSnapshot(await resolveImageSource(markdown, 'assets/伪装.png')),
      ).rejects.toMatchObject({ code: 'INVALID_IMAGE' })
      const webp = await readFile('tests/fixtures/images/small.webp')
      webp.writeUInt32LE(0, 4)
      await writeFile(join(assets, '损坏.webp'), webp)
      await expect(
        readImageSnapshot(await resolveImageSource(markdown, 'assets/损坏.webp')),
      ).rejects.toMatchObject({ code: 'INVALID_IMAGE' })
    }))

  it('超出 10MiB 或本批剩余预算时在读取前拒绝', () =>
    withImportDirectory(async (directory) => {
      const { markdown, image } = await arrange(directory)
      const source = await resolveImageSource(markdown, 'assets/接线%20图.png')
      await expect(readImageSnapshot(source, 1)).rejects.toMatchObject({ code: 'LIMIT_EXCEEDED' })
      const file = await open(image, 'r+')
      try {
        await file.truncate(MAX_IMAGE_BYTES + 1)
      } finally {
        await file.close()
      }
      await expect(readImageSnapshot(source)).rejects.toMatchObject({ code: 'LIMIT_EXCEEDED' })
    }))

  it('拒绝经 assets 子目录链接逃逸，允许指向 assets 内的目录链接', () =>
    withImportDirectory(async (directory) => {
      const { markdown, assets } = await arrange(directory)
      const outside = join(directory, 'assets-同前缀')
      await mkdir(outside)
      await copyFile('tests/fixtures/images/small.png', join(outside, '图.png'))
      await symlink(
        outside,
        join(assets, '越界'),
        process.platform === 'win32' ? 'junction' : 'dir',
      )
      await expect(resolveImageSource(markdown, 'assets/越界/图.png')).rejects.toMatchObject({
        code: 'UNSAFE_PATH',
      })
      await symlink(assets, join(assets, '内部'), process.platform === 'win32' ? 'junction' : 'dir')
      expect(
        (await readImageSnapshot(await resolveImageSource(markdown, 'assets/内部/接线%20图.png')))
          .width,
      ).toBe(2)
    }))

  it('拒绝整个 assets 根目录经链接指向其他位置', () =>
    withImportDirectory(async (directory) => {
      const { markdown, assets } = await arrange(directory)
      const resolvedBeforeChange = await resolveImageSource(markdown, 'assets/接线%20图.png')
      const elsewhere = join(directory, '被指向目录')
      await rename(assets, elsewhere)
      await symlink(elsewhere, assets, process.platform === 'win32' ? 'junction' : 'dir')
      await expect(resolveImageSource(markdown, 'assets/接线%20图.png')).rejects.toMatchObject({
        code: 'UNSAFE_PATH',
      })
      await expect(readImageSnapshot(resolvedBeforeChange)).rejects.toMatchObject({
        code: 'UNSAFE_PATH',
      })
    }))

  it.each([
    'assets/NUL.png',
    'assets/COM1/图.png',
    'assets/COM¹.png',
    'assets/图*.png',
    'assets/图|.png',
    'assets/图%3A.png',
  ])('统一拒绝 Windows 特殊路径 %s', (url) => {
    expect(parseImagePath(url)).toBeUndefined()
  })
})
