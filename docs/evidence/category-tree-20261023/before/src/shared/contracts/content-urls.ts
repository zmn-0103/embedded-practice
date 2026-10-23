import { resourceHashSchema } from './library-desktop'

export const IMAGE_SCHEME = 'practice-image'

export function imageResourceUrl(versionId: number, hash: string): string {
  if (
    !Number.isSafeInteger(versionId) ||
    versionId < 1 ||
    !resourceHashSchema.safeParse(hash).success
  )
    throw new Error('图片资源身份无效。')
  return `${IMAGE_SCHEME}://resource/${versionId}/${hash}`
}

export function parseImageResourceUrl(
  input: string,
): { versionId: number; hash: string } | undefined {
  try {
    const url = new URL(input)
    const match = /^\/([1-9]\d*)\/([a-f0-9]{64})$/.exec(url.pathname)
    if (
      url.protocol !== `${IMAGE_SCHEME}:` ||
      url.host !== 'resource' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !match
    )
      return undefined
    const versionId = Number(match[1])
    if (!Number.isSafeInteger(versionId)) return undefined
    const hash = match[2]!
    if (input !== imageResourceUrl(versionId, hash)) return undefined
    return { versionId, hash }
  } catch {
    return undefined
  }
}

export function externalHttpUrl(input: string): string | undefined {
  if (
    input.length > 4096 ||
    input.trim() !== input ||
    /[\u0000-\u001f\u007f]/u.test(input) ||
    !/^https?:\/\//i.test(input)
  )
    return undefined
  try {
    const url = new URL(input)
    return (url.protocol === 'http:' || url.protocol === 'https:') &&
      url.hostname !== '' &&
      url.username === '' &&
      url.password === ''
      ? url.href
      : undefined
  } catch {
    return undefined
  }
}
