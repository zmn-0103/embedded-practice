import createImportWorker from '../../workers/import-worker?nodeWorker'
import { createImportTaskRunner } from '../../workers/import-task-runner'

export function createImportPreparationService(
  reportError: (error: unknown) => void,
  timeoutMs = 120_000,
) {
  return createImportTaskRunner(
    (filePaths) =>
      createImportWorker({
        workerData: { version: 1, filePaths },
        execArgv: [],
        trackUnmanagedFds: true,
        name: 'import-preparation',
      }),
    reportError,
    timeoutMs,
  )
}

export type ImportPreparationService = ReturnType<typeof createImportPreparationService>
