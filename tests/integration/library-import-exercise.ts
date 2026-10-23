import type { LibraryImportService } from '../../src/main/services/library/library-import'
import type { CommitReceipt, ImportResult } from '../../src/shared/contracts/library-import'

interface ExerciseInput {
  mode: 'roundtrip' | 'inspect' | 'changes' | 'rollback'
  directory: string
  filePaths: string[]
  oldToken?: string
}

// 整个函数在 Electron 主进程执行，所有文件/SQL 仅限测试创建的临时目录。
export async function exerciseLibraryImport(
  { app }: Pick<typeof import('electron'), 'app'>,
  input: ExerciseInput,
) {
  const path = process.getBuiltinModule('node:path')
  const fs = process.getBuiltinModule('node:fs')
  const files = process.getBuiltinModule('node:fs/promises')
  const crypto = process.getBuiltinModule('node:crypto')
  const root = path.resolve(input.directory)
  if (
    path.dirname(root) !== path.resolve(process.getBuiltinModule('node:os').tmpdir()) ||
    !path.basename(root).startsWith('embedded-practice-') ||
    root !== app.getPath('userData')
  ) {
    throw new Error('拒绝操作非本次测试数据目录。')
  }
  const load = process
    .getBuiltinModule('node:module')
    .createRequire(path.join(app.getAppPath(), 'library-test.cjs'))
  const entry = [
    path.join(app.getAppPath(), 'out/main/library-import.js'),
    path.join(app.getAppPath(), 'library-import.js'),
  ].find((file) => fs.existsSync(file))
  if (!entry) throw new Error('缺少已构建的题库导入服务。')
  const built = load(entry) as typeof import('../../src/main/services/library/library-import')
  const databasePath = path.join(root, 'practice.sqlite3')
  const errors: string[] = []
  const services: LibraryImportService[] = []
  async function open() {
    const service = await built.openLibraryImportService(databasePath, (error) =>
      errors.push(error instanceof Error ? error.message : String(error)),
    )
    services.push(service)
    return service
  }
  function value<T>(result: ImportResult<T>): T {
    if (!result.ok) throw new Error(JSON.stringify(result.error))
    return result.value
  }
  async function submit(service: LibraryImportService, paths: string[]): Promise<CommitReceipt> {
    return value(service.commit(value(await service.preview(paths)).token))
  }
  const database = await built.openPracticeDatabase(databasePath)
  function counts() {
    return Object.fromEntries(
      [
        'topics',
        'questions',
        'question_versions',
        'image_resources',
        'version_images',
        'import_receipts',
      ].map((table) => [
        table,
        (database.prepare(`SELECT count(*) AS count FROM ${table}`).get() as { count: number })
          .count,
      ]),
    )
  }
  function revision() {
    return (database.prepare('SELECT revision FROM library_meta').get() as { revision: number })
      .revision
  }
  function bank(
    id: string,
    questions: { id: string; title?: string; answer: string; tags?: string; difficulty?: string }[],
    title = id,
  ) {
    return (
      `---\nschema_version: 1\ntopic_id: ${id}\ntopic_title: ${title}\n---\n` +
      questions
        .map(
          (q) =>
            `\n## ${q.id} | ${q.title ?? q.id}\n标签：${q.tags ?? '测试'}\n难度：${q.difficulty ?? '基础'}\n### 题目\n题干 ${q.id}\n### 参考答案\n${q.answer}\n`,
        )
        .join('')
    )
  }
  const sources = path.join(root, 'sources')
  const asset = path.join(sources, 'assets', 'small.png')
  // 在现有自建 PNG 的 IEND 前插入带合法 CRC 的 tEXt 块，改变字节而保留原像素。
  function alternatePng(original: Buffer, text: string): Buffer {
    const data = Buffer.from(`note\0${text}`)
    const chunk = Buffer.concat([Buffer.alloc(4), Buffer.from('tEXt'), data, Buffer.alloc(4)])
    chunk.writeUInt32BE(data.length, 0)
    let crc = 0xffffffff
    for (const byte of chunk.subarray(4, chunk.length - 4)) {
      crc ^= byte
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
    chunk.writeUInt32BE((crc ^ 0xffffffff) >>> 0, chunk.length - 4)
    return Buffer.concat([
      original.subarray(0, original.length - 12),
      chunk,
      original.subarray(original.length - 12),
    ])
  }
  try {
    if (input.mode === 'roundtrip') {
      const service = await open()
      const preview = value(await service.preview(input.filePaths))
      await files.rename(sources, path.join(root, 'sources-moved'))
      const first = value(service.commit(preview.token))
      const repeated = value(service.commit(preview.token))
      return { preview, first, repeated, counts: counts(), revision: revision(), errors }
    }
    if (input.mode === 'inspect') {
      const service = await open()
      const rows = database
        .prepare(
          `SELECT t.topic_id AS topicId, q.question_id AS questionId, q.title,
        v.question_markdown AS question, v.answer_markdown AS answer, v.definitions_json AS definitions,
        v.content_hash AS contentHash FROM questions q JOIN topics t ON t.topic_id = q.topic_id
        JOIN question_versions v ON v.id = q.current_version_id ORDER BY t.topic_id, q.question_id`,
        )
        .all() as {
        topicId: string
        questionId: string
        title: string
        question: string
        answer: string
        definitions: string
        contentHash: string
      }[]
      const resources = database
        .prepare('SELECT hash, bytes, format, width, height FROM image_resources ORDER BY hash')
        .all() as { hash: string; bytes: Buffer; format: string; width: number; height: number }[]
      return {
        counts: counts(),
        revision: revision(),
        schemaVersion: database.pragma('user_version', { simple: true }),
        questions: rows.map(({ question, answer, definitions, ...row }) => ({
          ...row,
          questionHash: crypto.createHash('sha256').update(question).digest('hex'),
          answerHash: crypto.createHash('sha256').update(answer).digest('hex'),
          definitions: JSON.parse(definitions) as unknown,
        })),
        resources: resources.map(({ bytes, ...image }) => ({
          ...image,
          actualHash: crypto.createHash('sha256').update(bytes).digest('hex'),
          byteLength: bytes.length,
        })),
        oldToken: service.commit(input.oldToken),
        foreignKeys: database.pragma('foreign_key_check'),
        errors,
      }
    }
    if (input.mode === 'changes') {
      const service = await open()
      const a = path.join(sources, 'a.md')
      const b = path.join(sources, 'b.md')
      const originalPng = await files.readFile(asset)
      const firstQuestion = { id: 'a-1', answer: '原答案\n![图](assets/small.png)' }
      const secondQuestion = { id: 'a-2', answer: '第二题答案' }
      await files.writeFile(a, bank('topic-a', [firstQuestion, secondQuestion]))
      await files.writeFile(b, bank('topic-b', [{ id: 'b-1', answer: '其他专题' }]))
      const first = await submit(service, [a, b])
      const identity = database
        .prepare(
          "SELECT id, current_version_id AS version FROM questions WHERE question_id = 'a-1'",
        )
        .get() as { id: number; version: number }
      database
        .prepare(
          "UPDATE question_user_state SET favorite = 1, last_rating = '掌握', last_rated_version_id = ? WHERE question_id = ?",
        )
        .run(identity.version, identity.id)
      // 测试专用历史引用夹具，验证导入不删除旧版本；不是练习历史功能实现。
      database.exec(
        'CREATE TABLE test_retained_history (version_id INTEGER REFERENCES question_versions(id), note TEXT) STRICT',
      )
      database
        .prepare("INSERT INTO test_retained_history VALUES (?, 'retain')")
        .run(identity.version)
      const metadataQuestions = [
        secondQuestion,
        { ...firstQuestion, title: '新标题', tags: '新标签', difficulty: '综合' },
      ]
      await files.writeFile(a, bank('topic-a', metadataQuestions, '专题新名称'))
      const metadata = await submit(service, [a])
      const metadataState = database
        .prepare(
          'SELECT last_rated_version_id = q.current_version_id AS valid FROM question_user_state s JOIN questions q ON q.id = s.question_id WHERE q.id = ?',
        )
        .get(identity.id)
      await files.writeFile(asset, alternatePng(originalPng, 'changed'))
      const imageUpdate = await submit(service, [a])
      const updatedQuestions = [
        secondQuestion,
        { ...firstQuestion, answer: '新答案\n![图](assets/small.png)' },
      ]
      await files.writeFile(a, bank('topic-a', updatedQuestions))
      const answerUpdate = await submit(service, [a])
      await files.writeFile(a, bank('topic-a', [secondQuestion]))
      const archive = await submit(service, [a])
      const archived = database
        .prepare('SELECT archived FROM questions WHERE id = ?')
        .get(identity.id)
      await files.writeFile(a, bank('topic-a', updatedQuestions))
      const restore = await submit(service, [a])
      await files.writeFile(a, bank('topic-a', [secondQuestion]))
      await submit(service, [a])
      await files.writeFile(
        a,
        bank('topic-a', [
          secondQuestion,
          { ...firstQuestion, answer: '归档期间新答案\n![图](assets/small.png)' },
        ]),
      )
      const restoredChanged = await submit(service, [a])
      const beforeRepeat = { counts: counts(), revision: revision() }
      const same = await submit(service, [a])
      const afterRepeat = { counts: counts(), revision: revision() }
      const pending = value(await service.preview([a]))
      const other = await open()
      await files.writeFile(b, bank('topic-b', [{ id: 'b-1', answer: '其他专题', tags: '变化' }]))
      await submit(other, [b])
      const stale = service.commit(pending.token)
      let wrongVersionRejected = false
      const otherVersion = database
        .prepare("SELECT current_version_id AS version FROM questions WHERE question_id = 'b-1'")
        .get() as { version: number }
      try {
        database
          .prepare('UPDATE question_user_state SET last_rated_version_id = ? WHERE question_id = ?')
          .run(otherVersion.version, identity.id)
      } catch {
        wrongVersionRejected = true
      }
      const state = database
        .prepare(
          `SELECT q.id, q.archived, s.favorite, s.last_rating AS rating,
        s.last_rated_version_id AS ratedVersion, q.current_version_id AS currentVersion,
        s.last_rated_version_id = q.current_version_id AS valid FROM questions q JOIN question_user_state s ON s.question_id = q.id WHERE q.id = ?`,
        )
        .get(identity.id)
      return {
        first,
        metadata,
        metadataState,
        imageUpdate,
        answerUpdate,
        archive,
        archived,
        restore,
        restoredChanged,
        same,
        beforeRepeat,
        afterRepeat,
        stale,
        state,
        identity,
        wrongVersionRejected,
        history: database.prepare('SELECT * FROM test_retained_history').all(),
        versions: database
          .prepare('SELECT question_id, sequence FROM question_versions ORDER BY id')
          .all(),
        counts: counts(),
        foreignKeys: database.pragma('foreign_key_check'),
        errors,
      }
    }
    const service = await open()
    const a = path.join(sources, 'rollback-a.md')
    const b = path.join(sources, 'rollback-b.md')
    await files.writeFile(
      a,
      bank('rollback-a', [{ id: 'r-1', answer: '首题快照\n![图](assets/small.png)' }]),
    )
    await files.writeFile(b, bank('rollback-b', [{ id: 'r-2', answer: 'FAIL_COMMIT' }]))
    const preview = value(await service.preview([a, b]))
    database.exec(
      "CREATE TRIGGER test_fail_version BEFORE INSERT ON question_versions WHEN NEW.answer_markdown = 'FAIL_COMMIT' BEGIN SELECT RAISE(ABORT, 'injected batch failure'); END",
    )
    const before = { counts: counts(), revision: revision() }
    const failed = service.commit(preview.token)
    const after = { counts: counts(), revision: revision() }
    database.exec('DROP TRIGGER test_fail_version')
    await files.writeFile(a, bank('rollback-a', [{ id: 'r-1', answer: '来源后改，不应提交' }]))
    const retried = value(service.commit(preview.token))
    const repository = built.createLibraryRepository(database)
    const storedReceipt = repository.receipt(preview.token)
    let transactionReceiptRejected = false
    database.exec('BEGIN')
    try {
      repository.receipt(preview.token)
    } catch {
      transactionReceiptRejected = true
    } finally {
      database.exec('ROLLBACK')
    }
    return {
      preview,
      failed,
      before,
      after,
      retried,
      storedReceipt,
      transactionReceiptRejected,
      answers: database
        .prepare('SELECT answer_markdown AS answer FROM question_versions ORDER BY id')
        .all(),
      counts: counts(),
      foreignKeys: database.pragma('foreign_key_check'),
      errors,
    }
  } finally {
    try {
      await Promise.all(services.map((service) => service.close()))
    } finally {
      database.close()
    }
  }
}
