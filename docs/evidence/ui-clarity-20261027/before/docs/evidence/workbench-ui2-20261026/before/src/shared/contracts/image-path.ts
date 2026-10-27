import type { ImageFormat } from './import-snapshot'

export function parseImagePath(
  url: string,
): { relativePath: string; format: ImageFormat } | undefined {
  let decoded: string
  try {
    decoded = decodeURIComponent(url)
  } catch {
    return undefined
  }

  if (!decoded.startsWith('assets/') || /[\\\u0000-\u001f\u007f?#:<>"|*]/u.test(decoded)) {
    return undefined
  }
  const segments = decoded.split('/')
  if (
    segments.some(
      (segment) =>
        segment === '' ||
        /[. ]$/.test(segment) ||
        /^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/iu.test(segment),
    )
  ) {
    return undefined
  }
  const extension = decoded.slice(decoded.lastIndexOf('.') + 1).toLowerCase()
  const format = extension === 'jpg' || extension === 'jpeg' ? 'jpeg' : extension
  if (format !== 'png' && format !== 'jpeg' && format !== 'webp') return undefined

  // 只解码一次；实际读取必须继续校验规范化后的真实路径。
  return { relativePath: decoded, format }
}
