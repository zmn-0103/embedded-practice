import { randomUUID } from 'node:crypto'
import { lstat, mkdir, open, realpath, rename, rm } from 'node:fs/promises'
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import type { MaterialBundle } from '../../database/repositories/material-reader'
import { StudyFault } from '../../database/repositories/study-fault'

export async function writeMaterial(
  bundle: MaterialBundle,
  selectedPath: string,
  dataDirectory: string,
  signal: AbortSignal,
  reportError: (error: unknown) => void,
) {
  const report = (error: unknown) => {
    try {
      reportError(error)
    } catch {
      /* 诊断不覆盖业务结果。 */
    }
  }
  const cancelled = () => {
    if (signal.aborted) throw new StudyFault('CANCELLED', '已取消材料导出。')
  }
  if (
    !isAbsolute(selectedPath) ||
    extname(selectedPath).toLowerCase() !== '.md' ||
    !/^review-assets-[a-f0-9-]{36}$/.test(bundle.assetsName)
  )
    throw new StudyFault('INVALID_REQUEST', '请选择有效的Markdown保存位置。')
  let parent: string, data: string
  try {
    parent = await realpath(dirname(selectedPath))
    data = await realpath(dataDirectory)
  } catch (error) {
    report(error)
    throw new StudyFault('FILE_ERROR', '保存目录不可用，请重新选择。')
  }
  const inside = relative(data, parent)
  if (inside === '' || (inside !== '..' && !inside.startsWith(`..${sep}`) && !isAbsolute(inside)))
    throw new StudyFault('INVALID_REQUEST', '请在应用数据目录之外保存复习材料。')
  const target = join(parent, basename(selectedPath)),
    assets = join(parent, bundle.assetsName)
  const temporary = join(parent, `.review-${randomUUID()}.tmp`)
  let assetsCreated = false,
    temporaryCreated = false,
    published = false
  try {
    cancelled()
    const existing = await lstat(target).catch((error) => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
      throw error
    })
    if (existing && (!existing.isFile() || existing.isSymbolicLink()))
      throw new StudyFault('INVALID_REQUEST', '目标不是普通文件，请选择其他位置。')
    if (bundle.images.length) {
      await mkdir(assets)
      assetsCreated = true
      for (const image of bundle.images) {
        cancelled()
        if (!/^[a-f0-9]{64}\.(png|jpeg|webp)$/.test(image.name)) throw new Error('资源名不合法。')
        const file = await open(join(assets, image.name), 'wx')
        try {
          await file.writeFile(image.bytes)
          await file.sync()
        } finally {
          await file.close()
        }
      }
    }
    cancelled()
    const file = await open(temporary, 'wx')
    temporaryCreated = true
    try {
      await file.writeFile(bundle.markdown, 'utf8')
      await file.sync()
    } finally {
      await file.close()
    }
    cancelled()
    await rename(temporary, target)
    published = true
    return {
      filePath: target,
      assetsPath: assetsCreated ? assets : null,
      questions: bundle.count,
      images: bundle.images.length,
    }
  } catch (error) {
    if (error instanceof StudyFault) throw error
    report(error)
    throw new StudyFault('FILE_ERROR', '材料未导出，原目标文件保持。请检查保存位置后重试。')
  } finally {
    if (!published) {
      if (temporaryCreated) await rm(temporary, { force: true }).catch(report)
      if (assetsCreated) {
        // 只清理本次成功创建且仍位于明确目标父目录的随机资源目录。
        if (dirname(resolve(assets)) !== resolve(parent) || basename(assets) !== bundle.assetsName)
          throw new Error('拒绝清理越界资源目录。')
        await rm(assets, { recursive: true, force: true }).catch(report)
      }
    }
  }
}
