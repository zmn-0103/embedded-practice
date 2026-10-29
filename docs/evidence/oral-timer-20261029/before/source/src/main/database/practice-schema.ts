import { MAX_DRAFT_BYTES } from '../../shared/contracts/practice'

const sessionColumns = `(
    id TEXT PRIMARY KEY,
    mode TEXT NOT NULL CHECK (mode IN ('sequential', 'random')),
    topic_id TEXT REFERENCES topics(topic_id),
    status TEXT NOT NULL CHECK (status IN ('active', 'finished', 'ended')),
    position INTEGER NOT NULL CHECK (position BETWEEN 0 AND 9007199254740991),
    revision INTEGER NOT NULL CHECK (revision BETWEEN 0 AND 9007199254740991),
    created_at TEXT NOT NULL,
    ended_at TEXT,
    CHECK ((status = 'active') = (ended_at IS NULL))
  ) STRICT`
const activeSessionIndex = `CREATE UNIQUE INDEX practice_one_active
  ON practice_sessions(status) WHERE status = 'active';`

// 由初始化/迁移事务统一执行；队列身份和内容版本创建后不由练习服务修改。
export const practiceSchema = `
  CREATE TABLE practice_sessions ${sessionColumns};
  ${activeSessionIndex}
  CREATE TABLE practice_items (
    session_id TEXT NOT NULL REFERENCES practice_sessions(id),
    position INTEGER NOT NULL CHECK (position BETWEEN 0 AND 9007199254740991),
    question_id INTEGER NOT NULL REFERENCES questions(id),
    version_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    topic_title TEXT NOT NULL,
    tags_json TEXT NOT NULL CHECK (json_valid(tags_json)),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('未分级', '基础', '进阶', '综合')),
    draft TEXT NOT NULL DEFAULT '' CHECK (length(CAST(draft AS BLOB)) <= ${MAX_DRAFT_BYTES}),
    draft_revision INTEGER NOT NULL DEFAULT 0 CHECK (draft_revision BETWEEN 0 AND 9007199254740991),
    revealed_at TEXT,
    rating TEXT CHECK (rating IN ('不会', '不熟', '掌握')),
    rated_at TEXT,
    skipped_at TEXT,
    PRIMARY KEY (session_id, position),
    UNIQUE (session_id, question_id),
    FOREIGN KEY (version_id, question_id) REFERENCES question_versions(id, question_id),
    CHECK ((rating IS NULL) = (rated_at IS NULL)),
    CHECK (rating IS NULL OR revealed_at IS NOT NULL)
  ) STRICT;
  CREATE TABLE practice_receipts (
    request_id TEXT PRIMARY KEY,
    payload_hash TEXT NOT NULL CHECK (length(payload_hash) = 64),
    result_json TEXT NOT NULL CHECK (json_valid(result_json)),
    created_at TEXT NOT NULL
  ) STRICT;
  CREATE INDEX practice_items_version ON practice_items(version_id);
`

// 调用方须在事务外关闭外键执行，替换后在提交前检查外键，结束后恢复执行。
export const randomModeMigration = `
  CREATE TABLE practice_sessions_v4 ${sessionColumns};
  INSERT INTO practice_sessions_v4
    (id, mode, topic_id, status, position, revision, created_at, ended_at)
    SELECT id, mode, topic_id, status, position, revision, created_at, ended_at
    FROM practice_sessions ORDER BY rowid;
  DROP TABLE practice_sessions;
  ALTER TABLE practice_sessions_v4 RENAME TO practice_sessions;
  ${activeSessionIndex}
`

// 新库和旧库均在初始化/迁移事务末尾执行；旧轮条件无法还原，保留 NULL。
export const sessionFiltersMigration = `
  ALTER TABLE practice_sessions ADD COLUMN filters_json TEXT
    CHECK (filters_json IS NULL OR (json_valid(filters_json) AND json_type(filters_json) = 'object'));
`

// 新语义使用独立结构版本；来源轮与选择范围随完整备份保留。
export const repeatPracticeMigration = `
  ALTER TABLE practice_sessions ADD COLUMN repeat_source_id TEXT REFERENCES practice_sessions(id);
  ALTER TABLE practice_sessions ADD COLUMN repeat_selection TEXT
    CHECK (repeat_selection IN ('unknown', 'weak', 'skipped', 'unrated', 'all'))
    CHECK ((repeat_source_id IS NULL) = (repeat_selection IS NULL));
`
