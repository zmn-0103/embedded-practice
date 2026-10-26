// 冻结自 M3 第二批改动前 practice-schema.ts；不从新结构反推旧库。
// 原文件 SHA-256 见本批 before-manifest.json。旧草稿限额为 1048576 字节。
export const legacyV3PracticeSchema = `
  CREATE TABLE practice_sessions (
    id TEXT PRIMARY KEY,
    mode TEXT NOT NULL CHECK (mode = 'sequential'),
    topic_id TEXT REFERENCES topics(topic_id),
    status TEXT NOT NULL CHECK (status IN ('active', 'finished', 'ended')),
    position INTEGER NOT NULL CHECK (position BETWEEN 0 AND 9007199254740991),
    revision INTEGER NOT NULL CHECK (revision BETWEEN 0 AND 9007199254740991),
    created_at TEXT NOT NULL,
    ended_at TEXT,
    CHECK ((status = 'active') = (ended_at IS NULL))
  ) STRICT;
  CREATE UNIQUE INDEX practice_one_active ON practice_sessions(status) WHERE status = 'active';
  CREATE TABLE practice_items (
    session_id TEXT NOT NULL REFERENCES practice_sessions(id),
    position INTEGER NOT NULL CHECK (position BETWEEN 0 AND 9007199254740991),
    question_id INTEGER NOT NULL REFERENCES questions(id),
    version_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    topic_title TEXT NOT NULL,
    tags_json TEXT NOT NULL CHECK (json_valid(tags_json)),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('未分级', '基础', '进阶', '综合')),
    draft TEXT NOT NULL DEFAULT '' CHECK (length(CAST(draft AS BLOB)) <= 1048576),
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
