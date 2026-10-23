import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import {
  APP_STATUS_CHANNEL,
  appStatusResultSchema,
  type DesktopApi,
} from '../shared/contracts/application'
import {
  answerResultSchema,
  commitImportResultSchema,
  emptyResultSchema,
  favoriteResultSchema,
  LIBRARY_CHANNELS,
  listResultSchema,
  previewImportResultSchema,
  questionResultSchema,
} from '../shared/contracts/library-desktop'
import {
  closeRequestSchema,
  PRACTICE_CHANNELS,
  practiceCommandResultSchema,
  practiceDraftResultSchema,
  practiceEmptyResultSchema,
  practiceReadResultSchema,
} from '../shared/contracts/practice-desktop'
import {
  HISTORY_CHANNELS,
  historyEntryResultSchema,
  historyListResultSchema,
} from '../shared/contracts/history'
import { LEARNING_CHANNEL, learningResultSchema } from '../shared/contracts/learning'
import { SETTINGS_CHANNELS, settingsResultSchema } from '../shared/contracts/settings'
import {
  BACKUP_CHANNELS,
  backupResultSchema,
  backupPreviewResultSchema,
  restoreResultSchema,
} from '../shared/contracts/backup'
import {
  DATA_LOCATION_CHANNELS,
  dataLocationsResultSchema,
  directoryOpenResultSchema,
} from '../shared/contracts/data-locations'

const desktopApi: DesktopApi = {
  getAppStatus: async () =>
    appStatusResultSchema.parse(await ipcRenderer.invoke(APP_STATUS_CHANNEL)),
  library: {
    previewImport: async () =>
      previewImportResultSchema.parse(await ipcRenderer.invoke(LIBRARY_CHANNELS.previewImport)),
    cancelImport: async () =>
      emptyResultSchema.parse(await ipcRenderer.invoke(LIBRARY_CHANNELS.cancelImport)),
    commitImport: async (token) =>
      commitImportResultSchema.parse(
        await ipcRenderer.invoke(LIBRARY_CHANNELS.commitImport, token),
      ),
    discardImport: async (token) =>
      emptyResultSchema.parse(await ipcRenderer.invoke(LIBRARY_CHANNELS.discardImport, token)),
    listQuestions: async (request) =>
      listResultSchema.parse(await ipcRenderer.invoke(LIBRARY_CHANNELS.listQuestions, request)),
    getQuestion: async (identity) =>
      questionResultSchema.parse(await ipcRenderer.invoke(LIBRARY_CHANNELS.getQuestion, identity)),
    getAnswer: async (identity) =>
      answerResultSchema.parse(await ipcRenderer.invoke(LIBRARY_CHANNELS.getAnswer, identity)),
    exportTemplate: async () =>
      emptyResultSchema.parse(await ipcRenderer.invoke(LIBRARY_CHANNELS.exportTemplate)),
    openReference: async (url) =>
      emptyResultSchema.parse(await ipcRenderer.invoke(LIBRARY_CHANNELS.openReference, url)),
    copyCode: async (text) =>
      emptyResultSchema.parse(await ipcRenderer.invoke(LIBRARY_CHANNELS.copyCode, text)),
    setFavorite: async (setting) =>
      favoriteResultSchema.parse(await ipcRenderer.invoke(LIBRARY_CHANNELS.setFavorite, setting)),
  },
  history: {
    list: async (request) =>
      historyListResultSchema.parse(await ipcRenderer.invoke(HISTORY_CHANNELS.list, request)),
    getEntry: async (request) =>
      historyEntryResultSchema.parse(await ipcRenderer.invoke(HISTORY_CHANNELS.getEntry, request)),
  },
  learning: {
    read: async (scope) =>
      learningResultSchema.parse(await ipcRenderer.invoke(LEARNING_CHANNEL, scope)),
  },
  settings: {
    read: async () => settingsResultSchema.parse(await ipcRenderer.invoke(SETTINGS_CHANNELS.read)),
    save: async (settings) =>
      settingsResultSchema.parse(await ipcRenderer.invoke(SETTINGS_CHANNELS.save, settings)),
  },
  backup: {
    export: async () => backupResultSchema.parse(await ipcRenderer.invoke(BACKUP_CHANNELS.export)),
    preview: async () =>
      backupPreviewResultSchema.parse(await ipcRenderer.invoke(BACKUP_CHANNELS.preview)),
    restore: async (input) =>
      restoreResultSchema.parse(await ipcRenderer.invoke(BACKUP_CHANNELS.restore, input)),
  },
  dataLocations: {
    read: async () =>
      dataLocationsResultSchema.parse(await ipcRenderer.invoke(DATA_LOCATION_CHANNELS.read)),
    open: async (target) =>
      directoryOpenResultSchema.parse(
        await ipcRenderer.invoke(DATA_LOCATION_CHANNELS.open, target),
      ),
  },
  practice: {
    read: async (input) =>
      practiceReadResultSchema.parse(await ipcRenderer.invoke(PRACTICE_CHANNELS.read, input)),
    start: async (input) =>
      practiceCommandResultSchema.parse(await ipcRenderer.invoke(PRACTICE_CHANNELS.start, input)),
    saveDraft: async (input) =>
      practiceDraftResultSchema.parse(await ipcRenderer.invoke(PRACTICE_CHANNELS.saveDraft, input)),
    reveal: async (input) =>
      practiceCommandResultSchema.parse(await ipcRenderer.invoke(PRACTICE_CHANNELS.reveal, input)),
    rateAndAdvance: async (input) =>
      practiceCommandResultSchema.parse(
        await ipcRenderer.invoke(PRACTICE_CHANNELS.rateAndAdvance, input),
      ),
    navigate: async (input) =>
      practiceCommandResultSchema.parse(
        await ipcRenderer.invoke(PRACTICE_CHANNELS.navigate, input),
      ),
    end: async (input) =>
      practiceCommandResultSchema.parse(await ipcRenderer.invoke(PRACTICE_CHANNELS.end, input)),
    ready: async () =>
      practiceEmptyResultSchema.parse(await ipcRenderer.invoke(PRACTICE_CHANNELS.ready)),
    finishClose: async (input) =>
      practiceEmptyResultSchema.parse(
        await ipcRenderer.invoke(PRACTICE_CHANNELS.finishClose, input),
      ),
    onBeforeClose: (listener) => {
      const receive = (_event: IpcRendererEvent, input: unknown) => {
        const request = closeRequestSchema.safeParse(input)
        if (request.success) listener(request.data)
      }
      ipcRenderer.on(PRACTICE_CHANNELS.beforeClose, receive)
      return () => {
        ipcRenderer.removeListener(PRACTICE_CHANNELS.beforeClose, receive)
      }
    },
    onCloseCancelled: (listener) => {
      const receive = () => listener()
      ipcRenderer.on(PRACTICE_CHANNELS.closeCancelled, receive)
      return () => ipcRenderer.removeListener(PRACTICE_CHANNELS.closeCancelled, receive)
    },
  },
}

contextBridge.exposeInMainWorld('desktop', desktopApi)
