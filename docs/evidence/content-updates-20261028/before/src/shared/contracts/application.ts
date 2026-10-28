import { z } from 'zod'
import type { LibraryDesktopApi } from './library-desktop'
import type { PracticeDesktopApi } from './practice-desktop'
import type { HistoryDesktopApi } from './history'
import type { LearningDesktopApi } from './learning'
import type { SettingsDesktopApi } from './settings'
import type { BackupDesktopApi } from './backup'
import type { DataLocationsDesktopApi } from './data-locations'
import type { PracticePlansDesktopApi } from './practice-plans'
import type { ThemesDesktopApi } from './themes'
import type { QuestionSetsDesktopApi } from './question-sets'
import type { StudyDesktopApi } from './study'

export const APP_STATUS_CHANNEL = 'app:get-status'

export const startupRecordSchema = z.strictObject({
  launchCount: z.number().int().positive(),
  lastStartedAt: z.iso.datetime(),
})

export const appStatusSchema = startupRecordSchema.extend({
  appVersion: z.string().min(1),
})

export const appStatusResultSchema = z.discriminatedUnion('ok', [
  z.strictObject({ ok: z.literal(true), value: appStatusSchema }),
  z.strictObject({
    ok: z.literal(false),
    error: z.strictObject({
      code: z.enum(['DATABASE_UNAVAILABLE', 'INVALID_REQUEST', 'FORBIDDEN']),
      message: z.string().min(1),
    }),
  }),
])

export type StartupRecord = z.infer<typeof startupRecordSchema>
export type AppStatusResult = z.infer<typeof appStatusResultSchema>

export interface DesktopApi {
  getAppStatus(): Promise<AppStatusResult>
  readonly library: LibraryDesktopApi
  readonly practicePlans: PracticePlansDesktopApi
  readonly questionSets: QuestionSetsDesktopApi
  readonly study: StudyDesktopApi
  readonly practice: PracticeDesktopApi
  readonly history: HistoryDesktopApi
  readonly learning: LearningDesktopApi
  readonly settings: SettingsDesktopApi
  readonly themes: ThemesDesktopApi
  readonly backup: BackupDesktopApi
  readonly dataLocations: DataLocationsDesktopApi
}
