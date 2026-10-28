import { createHash } from 'node:crypto'
import { realpath } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, sep } from 'node:path'
import { imageSize } from 'image-size'
import { parseImagePath } from '../../../shared/contracts/image-path'
import {
  MAX_IMAGE_BYTES,
  type ImageFormat,
  type ImageSnapshot,
} from '../../../shared/contracts/import-snapshot'
import { readFileSnapshot, SourceFileError } from './read-file-snapshot'

export interface ImageSource {
  readonly filePath: string
  readonly assetsRoot: string
  readonly format: ImageFormat
}

function isWithin(root: string, filePath: string): boolean {
  const path = relative(root, filePath)
  return path !== '' && path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path)
}

export async function resolveImageSource(markdownPath: string, url: string): Promise<ImageSource> {
  const parsed = parseImagePath(url)
  if (!isAbsolute(markdownPath) || !parsed) {
    throw new SourceFileError(
      'UNSAFE_PATH',
      '图片需要有效的 Markdown 绝对路径和 assets 内的相对引用。',
    )
  }
  try {
    const markdown = await realpath(markdownPath)
    const expectedRoot = join(dirname(markdown), 'assets')
    const assetsRoot = await realpath(expectedRoot)
    if (relative(expectedRoot, assetsRoot) !== '') {
      throw new SourceFileError('UNSAFE_PATH', 'assets 目录不能通过目录链接指向其他位置。')
    }
    const filePath = await realpath(join(assetsRoot, parsed.relativePath.slice('assets/'.length)))
    if (!isWithin(assetsRoot, filePath)) {
      throw new SourceFileError('UNSAFE_PATH', '图片的真实路径越出了该 Markdown 旁的 assets 目录。')
    }
    return { filePath, assetsRoot, format: parsed.format }
  } catch (error) {
    if (error instanceof SourceFileError) throw error
    throw new SourceFileError(
      'FILE_UNREADABLE',
      '无法找到图片，请检查 assets 目录、文件名和读取权限。',
      { cause: error },
    )
  }
}

async function checkSourcePath(source: ImageSource): Promise<void> {
  const root = await realpath(source.assetsRoot)
  const filePath = await realpath(source.filePath)
  if (relative(source.assetsRoot, root) !== '' || !isWithin(root, filePath)) {
    throw new SourceFileError('UNSAFE_PATH', '读取图片时真实路径已越出原 assets 目录。')
  }
  if (relative(source.filePath, filePath) !== '') {
    throw new SourceFileError('SOURCE_CHANGED', '图片路径发生变化，请重新准备导入。')
  }
}

export async function readImageSnapshot(
  source: ImageSource,
  remainingBytes = MAX_IMAGE_BYTES,
): Promise<ImageSnapshot> {
  try {
    await checkSourcePath(source)
    const bytes = await readFileSnapshot(source.filePath, Math.min(MAX_IMAGE_BYTES, remainingBytes))
    await checkSourcePath(source)

    const hasSignature =
      source.format === 'png'
        ? bytes.toString('hex', 0, 8) === '89504e470d0a1a0a'
        : source.format === 'jpeg'
          ? bytes.toString('hex', 0, 3) === 'ffd8ff'
          : bytes.length >= 12 &&
            bytes.toString('latin1', 0, 4) === 'RIFF' &&
            bytes.toString('latin1', 8, 12) === 'WEBP' &&
            bytes.readUInt32LE(4) + 8 === bytes.length
    if (!hasSignature) {
      throw new SourceFileError('INVALID_IMAGE', '图片文件签名与扩展名不符或文件不完整。')
    }

    let dimensions: ReturnType<typeof imageSize>
    try {
      dimensions = imageSize(bytes)
    } catch (error) {
      throw new SourceFileError('INVALID_IMAGE', '图片头部无效或不完整，无法读取类型与尺寸。', {
        cause: error,
      })
    }
    const format = dimensions.type === 'jpg' ? 'jpeg' : dimensions.type
    if (
      format !== source.format ||
      !Number.isSafeInteger(dimensions.width) ||
      dimensions.width <= 0 ||
      !Number.isSafeInteger(dimensions.height) ||
      dimensions.height <= 0
    ) {
      throw new SourceFileError(
        'INVALID_IMAGE',
        '图片内容类型与扩展名不符，或尺寸无效；只支持 PNG、JPEG 和 WebP。',
      )
    }

    return {
      hash: createHash('sha256').update(bytes).digest('hex'),
      format: source.format,
      width: dimensions.width,
      height: dimensions.height,
      bytes,
    }
  } catch (error) {
    if (error instanceof SourceFileError) throw error
    throw new SourceFileError('FILE_UNREADABLE', '无法稳定读取图片，请检查来源后重试。', {
      cause: error,
    })
  }
}
