import { isAbsolute } from 'node:path'
import { openPracticeDatabase } from '../../database/open-database'
import { createLibraryRepository } from '../../database/repositories/library-repository'
import { createLibraryReader } from '../../database/repositories/library-reader'
import { createFavoriteRepository } from '../../database/repositories/favorite-repository'
import { createHistoryReader } from '../../database/repositories/history-reader'
import { createLearningReader } from '../../database/repositories/learning-reader'
import { createSettingsRepository } from '../../database/repositories/settings-repository'
import { createCategoryRepository } from '../../database/repositories/category-repository'
import { createPracticePlanRepository } from '../../database/repositories/practice-plan-repository'
import { createImportPreparationService } from './import-preparation'
import { createImportSession } from './import-session'

// 主进程内部入口；数据位置由应用选择，窗口不能传入数据库路径。
export async function openLibraryImportService(
  databasePath: string,
  reportError: (error: unknown) => void,
) {
  if (!isAbsolute(databasePath)) throw new Error('导入数据库必须使用绝对路径。')
  const database = await openPracticeDatabase(databasePath)
  try {
    const reader = createLibraryReader(database)
    const favorites = createFavoriteRepository(database)
    const history = createHistoryReader(database)
    const learning = createLearningReader(database)
    const settings = createSettingsRepository(database)
    const categories = createCategoryRepository(database)
    const plans = createPracticePlanRepository(database)
    const session = createImportSession(
      createLibraryRepository(database),
      createImportPreparationService(reportError),
      reportError,
    )
    let closing: Promise<void> | undefined
    return {
      ...reader,
      ...favorites,
      ...history,
      ...learning,
      ...settings,
      ...categories,
      ...plans,
      preview: session.preview,
      commit: session.commit,
      discard: session.discard,
      close(): Promise<void> {
        closing ??= session.close().finally(() => database.close())
        return closing
      },
    }
  } catch (error) {
    database.close()
    throw error
  }
}

export type LibraryImportService = Awaited<ReturnType<typeof openLibraryImportService>>

// 保持固定的内部入口，供数据库集成测试加载同一实现，不进入预加载 API。
export { openPracticeDatabase } from '../../database/open-database'
export { createLibraryRepository } from '../../database/repositories/library-repository'
export { createImportSession } from './import-session'
