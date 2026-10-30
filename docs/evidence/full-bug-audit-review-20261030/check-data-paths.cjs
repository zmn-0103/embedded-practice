// 只在新建的系统临时目录运行，直接检查本轮构建的生产服务；不启动个人应用。
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const root = path.resolve(__dirname, '../../..')
const { openPracticeDatabase, createPracticeRepository } = require(path.join(root, 'out/main/practice.js'))
const { openBackupService } = require(path.join(root, 'out/main/backup.js'))
const Database = require(path.join(root, 'node_modules/better-sqlite3'))

async function main() {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'embedded-practice-audit-review-'))
  const data = path.join(temporary, 'data')
  await fs.mkdir(data)
  const dbPath = path.join(data, 'practice.sqlite3')
  const database = await openPracticeDatabase(dbPath)
  const results = []
  let backup
  try {
    assert.equal(database.pragma('user_version', { simple: true }), 17)
    assert.equal(database.pragma('busy_timeout', { simple: true }), 5000)
    database.exec(`
      INSERT INTO topics(topic_id,title,source_name) VALUES('audit','复查样例','独立生成');
      INSERT INTO questions(id,topic_id,question_id,title,tags_json,difficulty,position,archived)
        VALUES(1,'audit','q-1','复查样例','[]','基础',0,0);
      INSERT INTO question_versions VALUES(1,1,1,'复查样例','题干','答案','[]','[]',
        '${'a'.repeat(64)}','2026-10-30T00:00:00.000Z');
      UPDATE questions SET current_version_id=1;
      CREATE TABLE backup_manifest(id INTEGER PRIMARY KEY CHECK(id=1),format_version INTEGER NOT NULL,
        created_at TEXT NOT NULL,app_version TEXT NOT NULL,schema_version INTEGER NOT NULL) STRICT;
      INSERT INTO backup_manifest VALUES(1,1,'2026-10-29T00:00:00.000Z','0.0.2',16);
    `)
    backup = await openBackupService(dbPath, '0.0.2', () => {})
    const exported = path.join(temporary, 'exported.sqlite3')
    const result = await backup.export(exported)
    assert.equal(result.summary.schemaVersion, 17)
    assert.equal(result.summary.questions, 1)
    assert.equal(database.prepare('SELECT schema_version FROM backup_manifest').get().schema_version, 16)
    let copy = new Database(exported)
    assert.equal(copy.prepare('SELECT schema_version FROM backup_manifest').get().schema_version, 17)
    copy.close()
    await backup.preview(exported)
    results.push('过期元数据运行库可导出并预览；导出结构17、原库元数据16保持')

    const stale = path.join(temporary, 'stale.sqlite3')
    await fs.copyFile(exported, stale)
    copy = new Database(stale)
    copy.exec('UPDATE backup_manifest SET schema_version=16')
    copy.close()
    await assert.rejects(backup.preview(stale), { code: 'INVALID_BACKUP' })
    results.push('安装入口仍拒绝元数据版本不一致的备份')

    const missing = path.join(temporary, 'missing-meta.sqlite3')
    await fs.copyFile(exported, missing)
    copy = new Database(missing)
    copy.exec('DELETE FROM library_meta')
    copy.close()
    await assert.rejects(backup.preview(missing), { code: 'INVALID_BACKUP' })
    results.push('缺少library_meta单例行的备份被拒绝')

    database.exec('ALTER TABLE backup_manifest ADD COLUMN unknown_user_column TEXT')
    await assert.rejects(backup.export(path.join(temporary, 'unknown.sqlite3')), { code: 'INVALID_BACKUP' })
    assert.ok(database.pragma('table_info(backup_manifest)').some(c => c.name === 'unknown_user_column'))
    results.push('未知元数据列阻止导出，原库未知列保持')

    const repository = createPracticeRepository(database)
    const session = repository.start({ requestId: randomUUID(), topicId: 'audit', count: 'all', replace: null })
    const input = (revision, text) => ({ sessionId: session.sessionId, position: 0, draft: { revision, text } })
    repository.saveDraft(input(3, '已保存的较新草稿'))
    const transaction = database.transaction
    function failedWrite(work) {
      // 模拟事务入口SQL失败，读回与后续重试仍使用真实SQLite及生产仓储。
      database.transaction = () => ({ immediate() { throw new Error('injected transaction failure') } })
      try { return work() } finally { database.transaction = transaction }
    }
    assert.throws(() => failedWrite(() => repository.saveDraft(input(2, '旧草稿'))), { code: 'DRAFT_STALE' })
    repository.saveDraft(input(4, '冲突之后仍可保存'))
    results.push('SQL失败后读回较新修订返回DRAFT_STALE；后续保存正常')
    assert.throws(() => failedWrite(() => repository.saveDraft(input(4, '同修订不同文字'))), { code: 'DRAFT_CONFLICT' })
    repository.saveDraft(input(5, '第二次冲突之后仍可保存'))
    results.push('SQL失败后读回同修订不同文本返回DRAFT_CONFLICT；后续保存正常')
    assert.equal(failedWrite(() => repository.saveDraft(input(5, '第二次冲突之后仍可保存'))).draftRevision, 5)
    results.push('SQL失败后读回相同修订与内容返回成功回执')
    assert.throws(() => failedWrite(() => repository.saveDraft(input(6, '未提交内容'))), /injected transaction failure/)
    repository.saveDraft(input(6, '原请求重试成功'))
    assert.equal(database.prepare('SELECT draft FROM practice_items').get().draft, '原请求重试成功')
    results.push('SQL失败后读回旧修订保留原写入错误；原请求可重试')
    console.log(JSON.stringify({ temporary, schemaVersion: 17, executable: process.execPath,
      entry: path.join(root, 'out/main/practice.js'), results, passed: results.length }, null, 2))
  } finally {
    await backup?.close()
    database.close()
    assert.equal(path.dirname(temporary), path.resolve(os.tmpdir()))
    assert.ok(path.basename(temporary).startsWith('embedded-practice-audit-review-'))
    await fs.rm(temporary, { recursive: true, force: true })
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
