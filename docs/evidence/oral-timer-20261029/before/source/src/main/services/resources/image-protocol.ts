import type { Session } from 'electron'
import { IMAGE_SCHEME, parseImageResourceUrl } from '../../../shared/contracts/content-urls'

type ReadImage = (
  versionId: number,
  hash: string,
) => { mime: string; bytes: Uint8Array } | undefined

export function registerImageProtocol(
  session: Session,
  read: ReadImage,
  reportError: (error: unknown) => void,
): () => void {
  session.protocol.handle(IMAGE_SCHEME, (request) => {
    const identity = parseImageResourceUrl(request.url)
    if (request.method !== 'GET' || !identity) return new Response(null, { status: 404 })
    try {
      const image = read(identity.versionId, identity.hash)
      if (!image) return new Response(null, { status: 404 })
      return new Response(new Uint8Array(image.bytes).buffer, {
        headers: {
          'Content-Type': image.mime,
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-store',
        },
      })
    } catch (error) {
      try {
        reportError(error)
      } catch {
        /* 诊断失败不返回数据库细节。 */
      }
      return new Response(null, { status: 500 })
    }
  })
  return () => session.protocol.unhandle(IMAGE_SCHEME)
}
