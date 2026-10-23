import type { ParsedTopic, ParseIssue } from './question-bank'

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const MAX_IMPORT_BYTES = 200 * 1024 * 1024
export type ImageFormat = 'png' | 'jpeg' | 'webp'

export interface ImageSnapshot {
  readonly hash: string
  readonly format: ImageFormat
  readonly width: number
  readonly height: number
  readonly bytes: Uint8Array
}

export interface TopicSnapshot {
  readonly topic: ParsedTopic
  readonly markdown: string
  readonly imageBindings: readonly { readonly url: string; readonly hash: string }[]
  readonly contentHashes: readonly { readonly questionId: string; readonly hash: string }[]
}

export interface ImportSnapshot {
  readonly topics: readonly TopicSnapshot[]
  readonly resources: readonly ImageSnapshot[]
  readonly sourceBytes: number
  readonly questionCount: number
}

export type PrepareImportResult =
  | { readonly ok: true; readonly value: ImportSnapshot }
  | { readonly ok: false; readonly issues: readonly ParseIssue[] }
