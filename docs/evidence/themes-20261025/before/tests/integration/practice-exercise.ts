import type Database from 'better-sqlite3'
import type { PracticeService } from '../../src/main/services/practice/practice'
import type {
  PracticeAck,
  PracticeCursor,
  PracticeResult,
  PracticeView,
} from '../../src/shared/contracts/practice'

interface ExerciseInput {
  mode: 'lifecycle' | 'reopen' | 'versions' | 'rollback' | 'durability' | 'limits'
  directory: string
  filePaths: string[]
  updatedPaths?: string[]
}

// 完整函数由 Playwright 在真实 Electron 主进程执行；没有生产测试接口。
export async function exercisePractice(
  { app }: Pick<typeof import('electron'), 'app'>,
  input: ExerciseInput,
) {
  const path = process.getBuiltinModule('node:path')
  const fs = process.getBuiltinModule('node:fs')
  const crypto = process.getBuiltinModule('node:crypto')
  const root = path.resolve(input.directory)
  if (
    path.dirname(root) !== path.resolve(process.getBuiltinModule('node:os').tmpdir()) ||
    !path.basename(root).startsWith('embedded-practice-') ||
    root !== app.getPath('userData')
  )
    throw new Error('拒绝访问非本次测试目录。')
  for (const file of [...input.filePaths, ...(input.updatedPaths ?? [])]) {
    const relative = path.relative(root, path.resolve(file))
    if (relative.startsWith('..') || path.isAbsolute(relative))
      throw new Error('来源超出测试目录。')
  }
  const load = process
    .getBuiltinModule('node:module')
    .createRequire(path.join(app.getAppPath(), 'practice-test.cjs'))
  function entry(name: string) {
    const found = [
      path.join(app.getAppPath(), 'out/main', name),
      path.join(app.getAppPath(), name),
    ].find((f) => fs.existsSync(f))
    if (!found) throw new Error('缺少构建后的内部服务。')
    return found
  }
  const built = load(
    entry('practice.js'),
  ) as typeof import('../../src/main/services/practice/practice')
  const libraryBuilt = load(
    entry('library-import.js'),
  ) as typeof import('../../src/main/services/library/library-import')
  const databasePath = path.join(root, 'practice.sqlite3')
  const services: PracticeService[] = []
  const connections: Database.Database[] = []
  const errors: string[] = []
  const reportError = (error: unknown) =>
    errors.push(error instanceof Error ? error.message : String(error))
  function value<T>(result: PracticeResult<T>): T {
    if (!result.ok) throw new Error('非预期练习错误：' + result.error.code)
    return result.value
  }
  function cursor(ack: PracticeAck): PracticeCursor {
    return { sessionId: ack.sessionId, position: ack.position, revision: ack.revision }
  }
  const id = () => crypto.randomUUID()
  const empty = { revision: 0, text: '' }
  async function open() {
    const service = await built.openPracticeService(databasePath, reportError)
    services.push(service)
    return service
  }
  async function connection() {
    const database = await built.openPracticeDatabase(databasePath)
    connections.push(database)
    return database
  }
  async function importFiles(paths: string[]) {
    const library = await libraryBuilt.openLibraryImportService(databasePath, reportError)
    try {
      const preview = library.preview(paths)
      const result = await preview
      if (!result.ok) throw new Error('测试题库准备失败：' + result.error.code)
      const committed = library.commit(result.value.token)
      if (!committed.ok) throw new Error('测试题库入库失败：' + committed.error.code)
      return committed.value.summary
    } finally {
      await library.close()
    }
  }
  function active(service: PracticeService): PracticeView {
    const view = value(service.read({ sessionId: null }))
    if (!view?.item) throw new Error('缺少活动练习。')
    return view
  }
  function start(
    service: PracticeService,
    topicId: string | null = 'practice-fixture',
    count: 10 | 20 | 50 | 'all' = 'all',
  ) {
    return value(service.start({ requestId: id(), topicId, count, replace: null }))
  }
  function command(
    service: PracticeService,
    method: 'reveal' | 'end',
    ack: PracticeAck,
    draft = empty,
  ) {
    return value(service[method]({ requestId: id(), cursor: cursor(ack), draft }))
  }
  function navigate(
    service: PracticeService,
    ack: PracticeAck,
    direction: 'previous' | 'next' | 'skip',
    draft = empty,
  ) {
    return value(service.navigate({ requestId: id(), cursor: cursor(ack), draft, direction }))
  }
  function rows(database: Database.Database) {
    return {
      sessions: database.prepare('SELECT * FROM practice_sessions ORDER BY rowid').all(),
      items: database.prepare('SELECT * FROM practice_items ORDER BY session_id, position').all(),
      states: database.prepare('SELECT * FROM question_user_state ORDER BY question_id').all(),
      receipts: database.prepare('SELECT * FROM practice_receipts ORDER BY rowid').all(),
    }
  }
  try {
    if (input.mode !== 'reopen') await importFiles(input.filePaths)
    const service = await open()
    const database = await connection()
    if (input.mode === 'reopen') {
      const view = active(service)
      return { view, foreignKeys: database.pragma('foreign_key_check'), errors }
    }
    if (input.mode === 'lifecycle') {
      const noActive = value(service.read({ sessionId: null }))
      const noMatch = service.start({
        requestId: id(),
        topicId: 'missing-topic',
        count: 'all',
        replace: null,
      })
      const emptyCount = database.prepare('SELECT count(*) AS count FROM practice_sessions').get()
      const request = { requestId: id(), topicId: 'practice-fixture', count: 10, replace: null }
      let ack = value(service.start(request))
      const duplicateStart = value(service.start(request))
      const requestConflict = service.start({ ...request, count: 20 })
      const activeConflict = service.start({ ...request, requestId: id() })
      const queue = database
        .prepare(
          `SELECT q.question_id AS id FROM practice_items i JOIN questions q ON q.id = i.question_id
        WHERE i.session_id = ? ORDER BY i.position`,
        )
        .all(ack.sessionId)
      const first = active(service)
      const draft = { revision: 2, text: '中文草稿\r\n  int value = 1;\n' }
      const saved = value(service.saveDraft({ sessionId: ack.sessionId, position: 0, draft }))
      const savedAgain = value(service.saveDraft({ sessionId: ack.sessionId, position: 0, draft }))
      const staleDraft = service.saveDraft({
        sessionId: ack.sessionId,
        position: 0,
        draft: { revision: 1, text: '旧' },
      })
      const conflictingDraft = service.saveDraft({
        sessionId: ack.sessionId,
        position: 0,
        draft: { revision: 2, text: '不同' },
      })
      const beforeReveal = active(service)
      const ratingHidden = service.rateAndAdvance({
        requestId: id(),
        cursor: cursor(ack),
        draft,
        rating: '掌握',
      })
      const nextHidden = service.navigate({
        requestId: id(),
        cursor: cursor(ack),
        draft,
        direction: 'next',
      })
      const firstBoundary = service.navigate({
        requestId: id(),
        cursor: cursor(ack),
        draft,
        direction: 'previous',
      })
      const staleSnapshot = JSON.stringify(rows(database))
      const staleInput = {
        requestId: id(),
        cursor: cursor(ack),
        draft: { revision: 1, text: '迟到草稿' },
      }
      const staleTransitions = [
        service.reveal(staleInput),
        service.navigate({ ...staleInput, requestId: id(), direction: 'skip' }),
        service.end({ ...staleInput, requestId: id() }),
      ]
      const staleTransitionsUnchanged = JSON.stringify(rows(database)) === staleSnapshot
      const reveal = { requestId: id(), cursor: cursor(ack), draft }
      ack = value(service.reveal(reveal))
      const revealAgain = value(service.reveal(reveal))
      const revealed = active(service)
      ack = command(service, 'reveal', ack, draft)
      const firstTimeRetained = active(service).item?.revealedAt === revealed.item?.revealedAt
      const staleRatingSnapshot = JSON.stringify(rows(database))
      const staleRatingDraft = service.rateAndAdvance({
        ...staleInput,
        requestId: id(),
        cursor: cursor(ack),
        rating: '掌握',
      })
      const staleRatingUnchanged = JSON.stringify(rows(database)) === staleRatingSnapshot
      database
        .prepare(
          `UPDATE question_user_state SET favorite = 1 WHERE question_id =
        (SELECT question_id FROM practice_items WHERE session_id = ? AND position = 0)`,
        )
        .run(ack.sessionId)
      const rate = { requestId: id(), cursor: cursor(ack), draft, rating: '掌握' }
      ack = value(service.rateAndAdvance(rate))
      const duplicateRate = value(service.rateAndAdvance(rate))
      const staleRate = service.rateAndAdvance({ ...rate, requestId: id() })
      const second = active(service)
      ack = navigate(service, ack, 'skip')
      const skipped = active(service)
      ack = navigate(service, ack, 'previous')
      const skippedReturned = active(service)
      ack = command(service, 'reveal', ack)
      const pureThinking = active(service)
      ack = value(
        service.rateAndAdvance({
          requestId: id(),
          cursor: cursor(ack),
          draft: empty,
          rating: null,
        }),
      )
      const unrated = active(service)
      ack = navigate(service, ack, 'previous')
      const answerRetained = active(service)
      ack = navigate(service, ack, 'previous')
      const draftRetained = active(service)
      ack = value(
        service.rateAndAdvance({ requestId: id(), cursor: cursor(ack), draft, rating: '不会' }),
      )
      const changedRating = active(service)
      ack = navigate(service, ack, 'next')
      const ended = command(service, 'end', ack)
      const endedView = value(service.read({ sessionId: ended.sessionId }))
      const state = database
        .prepare(
          `SELECT s.favorite, s.last_rating AS rating FROM question_user_state s
        JOIN practice_items i ON i.question_id = s.question_id WHERE i.session_id = ? AND i.position = 0`,
        )
        .get(ended.sessionId)
      let small = start(service, 'alpha-fixture')
      const fresh = active(service)
      small = command(service, 'reveal', small)
      small = value(
        service.rateAndAdvance({
          requestId: id(),
          cursor: cursor(small),
          draft: empty,
          rating: null,
        }),
      )
      small = navigate(service, small, 'skip')
      const finished = value(service.read({ sessionId: small.sessionId }))
      const all = start(service, null)
      const allOrder = database
        .prepare(
          `SELECT q.topic_id AS topicId, q.question_id AS questionId
        FROM practice_items i JOIN questions q ON q.id = i.question_id WHERE i.session_id = ? ORDER BY i.position`,
        )
        .all(all.sessionId)
      const failedReplace = service.start({
        requestId: id(),
        topicId: 'missing-topic',
        count: 'all',
        replace: cursor(all),
      })
      const preservedAfterEmpty = active(service).session
      const staleReplace = service.start({
        requestId: id(),
        topicId: null,
        count: 20,
        replace: { ...cursor(all), revision: 9 },
      })
      const replaced = value(
        service.start({
          requestId: id(),
          topicId: 'practice-fixture',
          count: 20,
          replace: cursor(all),
        }),
      )
      const priorEnded = value(service.read({ sessionId: all.sessionId }))?.session
      const newRound = active(service)
      value(
        service.saveDraft({
          sessionId: replaced.sessionId,
          position: 0,
          draft: { revision: 1, text: '跨进程保留的草稿' },
        }),
      )
      const persistent = active(service)
      service.close()
      service.close()
      const closed = service.read({ sessionId: null })
      return {
        noActive,
        noMatch,
        emptyCount,
        started: duplicateStart,
        requestConflict,
        activeConflict,
        queue,
        first,
        saved,
        savedAgain,
        staleDraft,
        conflictingDraft,
        beforeReveal,
        ratingHidden,
        nextHidden,
        firstBoundary,
        staleTransitions,
        staleTransitionsUnchanged,
        staleRatingDraft,
        staleRatingUnchanged,
        revealed,
        revealAgain,
        firstTimeRetained,
        duplicateRate,
        staleRate,
        second,
        skipped,
        skippedReturned,
        pureThinking,
        unrated,
        answerRetained,
        draftRetained,
        changedRating,
        endedView,
        state,
        fresh,
        finished,
        all,
        allOrder,
        failedReplace,
        preservedAfterEmpty,
        staleReplace,
        replaced,
        priorEnded,
        newRound,
        persistent,
        closed,
        foreignKeys: database.pragma('foreign_key_check'),
        errors,
      }
    }
    if (input.mode === 'versions') {
      let ack = start(service)
      const original = active(service)
      ack = command(service, 'reveal', ack, { revision: 1, text: '旧版本作答' })
      const before = active(service)
      database
        .prepare(
          `UPDATE question_user_state SET favorite = 1 WHERE question_id =
        (SELECT question_id FROM practice_items WHERE session_id = ? AND position = 0)`,
        )
        .run(ack.sessionId)
      const update = await importFiles(input.updatedPaths ?? [])
      const after = active(service)
      ack = value(
        service.rateAndAdvance({
          requestId: id(),
          cursor: cursor(ack),
          draft: { revision: 1, text: '旧版本作答' },
          rating: '掌握',
        }),
      )
      const oldSecond = active(service)
      const state = database
        .prepare(
          `SELECT s.favorite, s.last_rated_version_id AS ratedVersion, q.current_version_id AS currentVersion
        FROM question_user_state s JOIN questions q ON q.id = s.question_id WHERE q.topic_id = 'practice-fixture' AND q.question_id = 'practice-001'`,
        )
        .get()
      ack = command(service, 'reveal', ack)
      ack = value(
        service.rateAndAdvance({
          requestId: id(),
          cursor: cursor(ack),
          draft: empty,
          rating: null,
        }),
      )
      const completed = value(service.read({ sessionId: ack.sessionId }))
      const next = start(service)
      const fresh = active(service)
      const history = database
        .prepare(
          `SELECT i.draft, i.rating, i.version_id AS versionId, v.answer_markdown AS answer,
        (SELECT count(*) FROM version_images WHERE version_id = i.version_id) AS imageCount
        FROM practice_items i JOIN question_versions v ON v.id = i.version_id WHERE i.session_id = ? ORDER BY i.position`,
        )
        .all(ack.sessionId)
      return {
        original,
        before,
        update,
        after,
        oldSecond,
        state,
        completed,
        next,
        fresh,
        history,
        foreignKeys: database.pragma('foreign_key_check'),
        errors,
      }
    }
    if (input.mode === 'rollback') {
      let ack = start(service)
      ack = command(service, 'reveal', ack, { revision: 1, text: '已保存草稿' })
      const request = {
        requestId: id(),
        cursor: cursor(ack),
        draft: { revision: 2, text: '失败时必须保留的输入' },
        rating: '不会',
      }
      database.exec(`CREATE TRIGGER inject_advance BEFORE UPDATE ON practice_sessions WHEN NEW.position <> OLD.position
        BEGIN SELECT RAISE(ABORT, '主动注入推进失败'); END`)
      const before = rows(database)
      const failed = service.rateAndAdvance(request)
      const after = rows(database)
      database.exec('DROP TRIGGER inject_advance')
      ack = value(service.rateAndAdvance(request))
      const retry = value(service.rateAndAdvance(request))
      const afterRetry = active(service)
      database.exec(`CREATE TRIGGER inject_receipt BEFORE INSERT ON practice_receipts
        BEGIN SELECT RAISE(ABORT, '主动注入回执失败'); END`)
      const endRequest = {
        requestId: id(),
        cursor: cursor(ack),
        draft: { revision: 1, text: '结束前输入' },
      }
      const beforeEnd = rows(database)
      const endFailed = service.end(endRequest)
      const afterEnd = rows(database)
      database.exec('DROP TRIGGER inject_receipt')
      database.exec(`CREATE TRIGGER inject_draft BEFORE UPDATE OF draft ON practice_items
        BEGIN SELECT RAISE(ABORT, '主动注入草稿失败'); END`)
      const draftRequest = {
        sessionId: ack.sessionId,
        position: ack.position,
        draft: { revision: 1, text: '单独保存草稿' },
      }
      const beforeDraft = rows(database)
      const draftFailed = service.saveDraft(draftRequest)
      const afterDraft = rows(database)
      database.exec('DROP TRIGGER inject_draft')
      const saved = value(service.saveDraft(draftRequest))
      const reveal = { requestId: id(), cursor: cursor(ack), draft: draftRequest.draft }
      database.exec(`CREATE TRIGGER inject_reveal BEFORE UPDATE OF revealed_at ON practice_items
        BEGIN SELECT RAISE(ABORT, '主动注入揭晓失败'); END`)
      const beforeReveal = rows(database)
      const revealFailed = service.reveal(reveal)
      const afterReveal = rows(database)
      database.exec('DROP TRIGGER inject_reveal')
      ack = value(service.reveal(reveal))
      const ended = command(service, 'end', ack, draftRequest.draft)
      return {
        failed,
        unchanged: JSON.stringify(before) === JSON.stringify(after),
        retry,
        afterRetry,
        endFailed,
        endUnchanged: JSON.stringify(beforeEnd) === JSON.stringify(afterEnd),
        draftFailed,
        draftUnchanged: JSON.stringify(beforeDraft) === JSON.stringify(afterDraft),
        saved,
        revealFailed,
        revealUnchanged: JSON.stringify(beforeReveal) === JSON.stringify(afterReveal),
        ended,
        foreignKeys: database.pragma('foreign_key_check'),
        errors,
      }
    }
    if (input.mode === 'durability') {
      function loseResponse(db: Database.Database) {
        const original = db.transaction.bind(db)
        let armed = false,
          close = false
        db.transaction = ((work: (...args: unknown[]) => unknown) => {
          const tx = original(work)
          const immediate = tx.immediate.bind(tx)
          const wrappedImmediate = (...args: unknown[]) => {
            const result = immediate(...args)
            if (armed) {
              armed = false
              if (close) db.close()
              throw new Error('提交后主动注入响应异常')
            }
            return result
          }
          return Object.assign((...args: unknown[]) => tx(...args), {
            default: tx.default,
            deferred: tx.deferred,
            exclusive: tx.exclusive,
            database: db,
            immediate: wrappedImmediate,
          })
        }) as typeof db.transaction
        return (closeConnection = false) => {
          armed = true
          close = closeConnection
        }
      }
      function failure(work: () => unknown) {
        try {
          work()
          return '未抛出'
        } catch (error) {
          return error && typeof error === 'object' && 'code' in error ? error.code : String(error)
        }
      }
      const lose = loseResponse(database)
      const repository = built.createPracticeRepository(database)
      database.exec('BEGIN')
      const outer = failure(() =>
        repository.start({ requestId: id(), topicId: null, count: 20, replace: null }),
      )
      database.exec('ROLLBACK')
      const startRequest = {
        requestId: id(),
        topicId: 'practice-fixture',
        count: 'all' as const,
        replace: null,
      }
      lose()
      let ack = repository.start(startRequest)
      const started = repository.start(startRequest)
      const draft = { revision: 1, text: '确认已持久化的草稿' }
      lose()
      const saved = repository.saveDraft({ sessionId: ack.sessionId, position: 0, draft })
      lose()
      ack = repository.reveal({ requestId: id(), cursor: cursor(ack), draft })
      const rate = { requestId: id(), cursor: cursor(ack), draft, rating: '掌握' as const }
      lose()
      ack = repository.rateAndAdvance(rate)
      const rated = repository.rateAndAdvance(rate)
      const other = await connection()
      const loseAndClose = loseResponse(other)
      const uncertainRepository = built.createPracticeRepository(other)
      const last = {
        requestId: id(),
        cursor: cursor(ack),
        draft: empty,
        direction: 'skip' as const,
      }
      loseAndClose(true)
      const unknown = failure(() => uncertainRepository.navigate(last))
      const blocked = failure(() => uncertainRepository.start(startRequest))
      const reopenedConnection = await connection()
      const reopened = built.createPracticeRepository(reopenedConnection)
      const recovered = reopened.read(ack.sessionId)
      const recoveredReceipt = reopened.navigate(last)
      const next = reopened.start({ ...startRequest, requestId: id() })
      const draftConnection = await connection()
      const loseDraft = loseResponse(draftConnection)
      const draftRepository = built.createPracticeRepository(draftConnection)
      const draftRequest = {
        sessionId: next.sessionId,
        position: 0,
        draft: { revision: 1, text: '关闭连接后仍已入库' },
      }
      loseDraft(true)
      const draftUnknown = failure(() => draftRepository.saveDraft(draftRequest))
      const draftBlocked = failure(() => draftRepository.saveDraft(draftRequest))
      const final = built.createPracticeRepository(await connection())
      const draftRecovered = final.read(next.sessionId)
      const draftConfirmed = final.saveDraft(draftRequest)
      return {
        outer,
        started,
        saved,
        rated,
        unknown,
        blocked,
        recovered,
        recoveredReceipt,
        draftUnknown,
        draftBlocked,
        draftRecovered,
        draftConfirmed,
        foreignKeys: database.pragma('foreign_key_check'),
        errors,
      }
    }
    const ack = start(service)
    const invalid = [
      service.start({ requestId: id(), topicId: null, count: 1, replace: null }),
      service.saveDraft({
        sessionId: ack.sessionId,
        position: 0,
        draft: { revision: 1, text: '\ud800' },
      }),
      service.saveDraft({
        sessionId: ack.sessionId,
        position: 0,
        draft: { revision: -1, text: '' },
      }),
      service.read({ sessionId: null, sql: 'SELECT *' }),
    ]
    const text = '中'.repeat(Math.floor(1048576 / 3)) + 'x'
    const saved = value(
      service.saveDraft({ sessionId: ack.sessionId, position: 0, draft: { revision: 1, text } }),
    )
    const oversized = service.saveDraft({
      sessionId: ack.sessionId,
      position: 0,
      draft: { revision: 2, text: text + '中' },
    })
    const persisted = active(service).item?.draft.text
    const missing = service.read({ sessionId: id() })
    const badPosition = service.saveDraft({ sessionId: ack.sessionId, position: 99, draft: empty })
    const constraints: string[] = []
    for (const [label, work] of [
      [
        'singleActive',
        () =>
          database
            .prepare(
              `INSERT INTO practice_sessions
                (id, mode, topic_id, status, position, revision, created_at, ended_at)
                VALUES (?, 'sequential', NULL, 'active', 0, 0, ?, NULL)`,
            )
            .run(id(), new Date().toISOString()),
      ],
      [
        'versionOwner',
        () =>
          database.exec(
            `UPDATE practice_items SET version_id = (SELECT max(id) FROM question_versions) WHERE position = 0`,
          ),
      ],
      [
        'ratingBeforeReveal',
        () =>
          database.exec(
            `UPDATE practice_items SET rating = '掌握', rated_at = '2026-10-20' WHERE position = 0`,
          ),
      ],
      [
        'byteLimit',
        () =>
          database
            .prepare('UPDATE practice_items SET draft = ? WHERE position = 0')
            .run(text + '中'),
      ],
      [
        'uniqueQuestion',
        () =>
          database.exec(`INSERT INTO practice_items (session_id, position, question_id, version_id, title, topic_title, tags_json, difficulty)
        SELECT session_id, 99, question_id, version_id, title, topic_title, tags_json, difficulty FROM practice_items WHERE position = 0`),
      ],
    ] as const) {
      try {
        work()
        throw new Error('数据库未拒绝约束：' + label)
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes('constraint failed')) throw error
        constraints.push(label)
      }
    }
    return {
      invalid,
      saved,
      oversized,
      exact: persisted === text,
      bytes: Buffer.byteLength(persisted ?? '', 'utf8'),
      missing,
      badPosition,
      constraints,
      foreignKeys: database.pragma('foreign_key_check'),
      errors,
    }
  } finally {
    for (const service of services) service.close()
    for (const database of connections) if (database.open) database.close()
  }
}
