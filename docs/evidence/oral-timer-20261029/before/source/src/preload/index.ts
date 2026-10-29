import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import {
  PLANNING_CHANNELS,
  planningHomeResultSchema,
  planningMonthResultSchema,
  planningDayResultSchema,
  goalProgressResultSchema,
  planningScopeResultSchema,
  quotaSettingResultSchema,
  quotaPreviewResultSchema,
  planningChangeResultSchema,
} from '../shared/contracts/planning'
import { CATEGORY_CHANNEL } from '../shared/contracts/categories'
import {
  KNOWLEDGE_CHANNELS,
  knowledgeSearchResultSchema,
  recentSearchResultSchema,
  knowledgeEmptyResultSchema,
  relationListResultSchema,
  relationChangeResultSchema,
} from '../shared/contracts/knowledge'
import {
  REVIEW_CHANNELS,
  readReviewResultSchema,
  saveReviewResultSchema,
  reviewListResultSchema,
} from '../shared/contracts/review-todos'
import {
  PERSONAL_TAG_CHANNELS,
  personalTagListResultSchema,
  personalTagChangeResultSchema,
} from '../shared/contracts/personal-tags'
import {
  CONTENT_UPDATE_CHANNELS,
  contentVersionsResultSchema,
  contentComparisonResultSchema,
} from '../shared/contracts/content-updates'
import {
  STUDY_CHANNELS,
  readNoteResultSchema,
  saveNoteResultSchema,
  roundListResultSchema,
  roundPageResultSchema,
  roundEntryResultSchema,
  exportMaterialResultSchema,
} from '../shared/contracts/study'
import {
  QUESTION_SET_CHANNELS,
  questionSetListResultSchema,
  questionSetPreviewResultSchema,
  questionSetChangeResultSchema,
} from '../shared/contracts/question-sets'
import {
  PRACTICE_PLAN_CHANNELS,
  practicePlansResultSchema,
  practicePlanChangeResultSchema,
} from '../shared/contracts/practice-plans'
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
  practiceOutlineResultSchema,
} from '../shared/contracts/practice-desktop'
import {
  HISTORY_CHANNELS,
  historyEntryResultSchema,
  historyListResultSchema,
} from '../shared/contracts/history'
import { LEARNING_CHANNEL, learningResultSchema } from '../shared/contracts/learning'
import { SETTINGS_CHANNELS, settingsResultSchema } from '../shared/contracts/settings'
import {
  THEME_CHANNELS,
  themeCatalogResultSchema,
  themePreviewResultSchema,
} from '../shared/contracts/themes'
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
  planning: {
    home: async (input) =>
      planningHomeResultSchema.parse(await ipcRenderer.invoke(PLANNING_CHANNELS.home, input)),
    month: async (input) =>
      planningMonthResultSchema.parse(await ipcRenderer.invoke(PLANNING_CHANNELS.month, input)),
    day: async (input) =>
      planningDayResultSchema.parse(await ipcRenderer.invoke(PLANNING_CHANNELS.day, input)),
    progress: async (input) =>
      goalProgressResultSchema.parse(await ipcRenderer.invoke(PLANNING_CHANNELS.progress, input)),
    scope: async (input) =>
      planningScopeResultSchema.parse(await ipcRenderer.invoke(PLANNING_CHANNELS.scope, input)),
    quota: async () =>
      quotaSettingResultSchema.parse(await ipcRenderer.invoke(PLANNING_CHANNELS.quota)),
    previewQuota: async (input) =>
      quotaPreviewResultSchema.parse(
        await ipcRenderer.invoke(PLANNING_CHANNELS.previewQuota, input),
      ),
    change: async (input) =>
      planningChangeResultSchema.parse(await ipcRenderer.invoke(PLANNING_CHANNELS.change, input)),
  },
  knowledge: {
    search: async (input) =>
      knowledgeSearchResultSchema.parse(await ipcRenderer.invoke(KNOWLEDGE_CHANNELS.search, input)),
    recent: async () =>
      recentSearchResultSchema.parse(await ipcRenderer.invoke(KNOWLEDGE_CHANNELS.recent)),
    changeRecent: async (input) =>
      knowledgeEmptyResultSchema.parse(
        await ipcRenderer.invoke(KNOWLEDGE_CHANNELS.changeRecent, input),
      ),
    relations: async (input) =>
      relationListResultSchema.parse(await ipcRenderer.invoke(KNOWLEDGE_CHANNELS.relations, input)),
    changeRelation: async (input) =>
      relationChangeResultSchema.parse(
        await ipcRenderer.invoke(KNOWLEDGE_CHANNELS.changeRelation, input),
      ),
  },
  reviewTodos: {
    read: async (input) =>
      readReviewResultSchema.parse(await ipcRenderer.invoke(REVIEW_CHANNELS.read, input)),
    save: async (input) =>
      saveReviewResultSchema.parse(await ipcRenderer.invoke(REVIEW_CHANNELS.save, input)),
    list: async (input) =>
      reviewListResultSchema.parse(await ipcRenderer.invoke(REVIEW_CHANNELS.list, input)),
  },
  personalTags: {
    list: async () =>
      personalTagListResultSchema.parse(await ipcRenderer.invoke(PERSONAL_TAG_CHANNELS.list)),
    change: async (input) =>
      personalTagChangeResultSchema.parse(
        await ipcRenderer.invoke(PERSONAL_TAG_CHANNELS.change, input),
      ),
  },
  getAppStatus: async () =>
    appStatusResultSchema.parse(await ipcRenderer.invoke(APP_STATUS_CHANNEL)),
  library: {
    updateCategory: async (change) =>
      emptyResultSchema.parse(await ipcRenderer.invoke(CATEGORY_CHANNEL, change)),
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
  contentUpdates: {
    versions: async (input) =>
      contentVersionsResultSchema.parse(
        await ipcRenderer.invoke(CONTENT_UPDATE_CHANNELS.versions, input),
      ),
    compare: async (input) =>
      contentComparisonResultSchema.parse(
        await ipcRenderer.invoke(CONTENT_UPDATE_CHANNELS.compare, input),
      ),
  },
  practicePlans: {
    list: async () =>
      practicePlansResultSchema.parse(await ipcRenderer.invoke(PRACTICE_PLAN_CHANNELS.list)),
    change: async (change) =>
      practicePlanChangeResultSchema.parse(
        await ipcRenderer.invoke(PRACTICE_PLAN_CHANNELS.change, change),
      ),
  },
  questionSets: {
    list: async () =>
      questionSetListResultSchema.parse(await ipcRenderer.invoke(QUESTION_SET_CHANNELS.list)),
    preview: async (input) =>
      questionSetPreviewResultSchema.parse(
        await ipcRenderer.invoke(QUESTION_SET_CHANNELS.preview, input),
      ),
    change: async (input) =>
      questionSetChangeResultSchema.parse(
        await ipcRenderer.invoke(QUESTION_SET_CHANNELS.change, input),
      ),
  },
  study: {
    readNote: async (input) =>
      readNoteResultSchema.parse(await ipcRenderer.invoke(STUDY_CHANNELS.readNote, input)),
    saveNote: async (input) =>
      saveNoteResultSchema.parse(await ipcRenderer.invoke(STUDY_CHANNELS.saveNote, input)),
    listRounds: async (input) =>
      roundListResultSchema.parse(await ipcRenderer.invoke(STUDY_CHANNELS.listRounds, input)),
    readRound: async (input) =>
      roundPageResultSchema.parse(await ipcRenderer.invoke(STUDY_CHANNELS.readRound, input)),
    readEntry: async (input) =>
      roundEntryResultSchema.parse(await ipcRenderer.invoke(STUDY_CHANNELS.readEntry, input)),
    exportMaterial: async (input) =>
      exportMaterialResultSchema.parse(
        await ipcRenderer.invoke(STUDY_CHANNELS.exportMaterial, input),
      ),
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
  themes: {
    list: async () => themeCatalogResultSchema.parse(await ipcRenderer.invoke(THEME_CHANNELS.list)),
    preview: async () =>
      themePreviewResultSchema.parse(await ipcRenderer.invoke(THEME_CHANNELS.preview)),
    install: async (input) =>
      themeCatalogResultSchema.parse(await ipcRenderer.invoke(THEME_CHANNELS.install, input)),
    uninstall: async (input) =>
      themeCatalogResultSchema.parse(await ipcRenderer.invoke(THEME_CHANNELS.uninstall, input)),
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
    outline: async (input) =>
      practiceOutlineResultSchema.parse(await ipcRenderer.invoke(PRACTICE_CHANNELS.outline, input)),
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
