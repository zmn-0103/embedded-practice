import type { PracticeAck, StartPractice } from '../../src/shared/contracts/practice'

// 在真实 Electron/SQLite 中执行；仅本测试连接覆盖 random()，不改变生产连接。
export async function exerciseRandomPractice(
  { app }: Pick<typeof import('electron'), 'app'>,
  directory: string,
) {
  const path = process.getBuiltinModule('node:path')
  const root = path.resolve(directory)
  if (
    path.dirname(root) !== path.resolve(process.getBuiltinModule('node:os').tmpdir()) ||
    !path.basename(root).startsWith('embedded-practice-') ||
    root !== app.getPath('userData')
  )
    throw new Error('拒绝访问非本次测试目录。')
  const load = process
    .getBuiltinModule('node:module')
    .createRequire(path.join(app.getAppPath(), 'random-test.cjs'))
  const entry = [
    path.join(app.getAppPath(), 'out/main/practice.js'),
    path.join(app.getAppPath(), 'practice.js'),
  ].find((file) => process.getBuiltinModule('node:fs').existsSync(file))
  if (!entry) throw new Error('缺少构建后的练习服务。')
  const built = load(entry) as typeof import('../../src/main/services/practice/practice')
  const database = await built.openPracticeDatabase(path.join(root, 'practice.sqlite3'))
  const id = () => process.getBuiltinModule('node:crypto').randomUUID()
  try {
    const repository = built.createPracticeRepository(database)
    let calls = 0
    database.function('random', () => -++calls)
    const cursor = (ack: PracticeAck) => ({
      sessionId: ack.sessionId,
      position: ack.position,
      revision: ack.revision,
    })
    const queue = (ack: PracticeAck) =>
      database
        .prepare(
          `SELECT i.position, q.question_id AS id,
      i.version_id AS versionId FROM practice_items i JOIN questions q ON q.id=i.question_id
      WHERE i.session_id = ? ORDER BY i.position`,
        )
        .all(ack.sessionId)
    const rows = () => ({
      sessions: database.prepare('SELECT * FROM practice_sessions ORDER BY rowid').all(),
      items: database.prepare('SELECT * FROM practice_items ORDER BY rowid').all(),
      receipts: database.prepare('SELECT * FROM practice_receipts ORDER BY rowid').all(),
      states: database.prepare('SELECT * FROM question_user_state ORDER BY rowid').all(),
    })
    function failure(input: StartPractice) {
      try {
        repository.start(input)
        return { code: 'UNEXPECTED_SUCCESS', message: '' }
      } catch (error) {
        if (!(error instanceof Error)) throw error
        return {
          code: 'code' in error && typeof error.code === 'string' ? error.code : null,
          message: error.message,
        }
      }
    }
    const base = { topicId: 'random-fixture', count: 10 as const, replace: null }
    const sequential = repository.start({ ...base, requestId: id() })
    const sequentialQueue = queue(sequential)
    const sequentialMode = repository.read(null)?.session.mode
    const request: StartPractice = {
      requestId: id(),
      topicId: base.topicId,
      count: 10,
      replace: cursor(sequential),
      mode: 'random',
    }
    let ack = repository.start(request)
    const randomQueue = queue(ack)
    const callsAfterStart = calls
    const afterStart = JSON.stringify(rows())
    const duplicate = repository.start(request)
    const callsAfterDuplicate = calls
    const conflict = failure({ ...request, mode: 'sequential' })
    const noMatch = failure({
      ...request,
      requestId: id(),
      topicId: 'missing',
      replace: cursor(ack),
    })
    const protectedAfterErrors = JSON.stringify(rows()) === afterStart
    const failedInput: StartPractice = {
      ...request,
      requestId: id(),
      count: 'all',
      replace: cursor(ack),
    }
    database.exec(`CREATE TRIGGER test_random_insert BEFORE INSERT ON practice_items
      WHEN NEW.position = 2 BEGIN SELECT RAISE(ABORT, '本测试注入随机队列写入失败'); END`)
    const writeFailure = failure(failedInput)
    const rollbackPreserved = JSON.stringify(rows()) === afterStart
    database.exec('DROP TRIGGER test_random_insert')
    ack = repository.start(failedInput)
    const retriedQueue = queue(ack)
    const quantities = []
    for (const count of [20, 50, 'all'] as const) {
      ack = repository.start({ ...request, requestId: id(), count, replace: cursor(ack) })
      quantities.push({ count, ack, queue: queue(ack) })
    }
    database.exec(`INSERT INTO question_user_state (question_id, favorite)
      SELECT id, 1 FROM questions WHERE topic_id = 'random-fixture'
        AND CAST(substr(question_id, 3) AS INTEGER) % 4 = 0
      ON CONFLICT(question_id) DO UPDATE SET favorite = 1;
      UPDATE question_user_state SET last_rating = '掌握', last_rated_version_id =
        (SELECT current_version_id FROM questions WHERE topic_id = 'random-fixture' AND question_id = 'q-04')
        WHERE question_id = (SELECT id FROM questions WHERE topic_id = 'random-fixture' AND question_id = 'q-04');
      UPDATE questions SET archived = 1 WHERE topic_id = 'random-fixture' AND question_id = 'q-24';`)
    const filters = {
      query: '第 ',
      tag: '偶数',
      difficulty: '基础' as const,
      mastery: 'unpracticed' as const,
      favoritesOnly: true,
    }
    ack = repository.start({
      ...request,
      requestId: id(),
      count: 'all',
      filters,
      replace: cursor(ack),
    })
    const filteredQueue = queue(ack)
    const oneFilter = { ...filters, query: '第 12 题' }
    ack = repository.start({
      ...request,
      requestId: id(),
      count: 50,
      filters: oneFilter,
      replace: cursor(ack),
    })
    const singleQueue = queue(ack)
    const singleView = repository.read(null)
    const singleSnapshot = JSON.stringify(rows())
    const answerSearch = failure({
      ...request,
      requestId: id(),
      replace: cursor(ack),
      filters: { ...filters, query: 'M3-RANDOM-SECRET' },
    })
    const answerSearchPreserved = JSON.stringify(rows()) === singleSnapshot
    database.function('random', () => 0)
    ack = repository.start({ ...request, requestId: id(), count: 'all', replace: cursor(ack) })
    const tiesQueue = queue(ack)
    return {
      sequentialQueue,
      sequentialMode,
      randomQueue,
      callsAfterStart,
      callsAfterDuplicate,
      duplicate,
      randomSessionId: duplicate.sessionId,
      conflict,
      noMatch,
      protectedAfterErrors,
      writeFailure,
      rollbackPreserved,
      retriedQueue,
      quantities,
      filteredQueue,
      singleQueue,
      singleView,
      answerSearch,
      answerSearchPreserved,
      tiesQueue,
      foreignKeys: database.pragma('foreign_key_check'),
      integrity: database.pragma('quick_check'),
      final: rows(),
    }
  } finally {
    database.close()
  }
}
