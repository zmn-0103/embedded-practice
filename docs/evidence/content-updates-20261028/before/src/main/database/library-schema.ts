// 只由受控初始化/迁移事务执行；不使用 IF NOT EXISTS 掩盖不完整结构。
export const librarySchema = `
  CREATE TABLE library_meta (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    revision INTEGER NOT NULL CHECK (revision BETWEEN 0 AND 9007199254740991)
  ) STRICT;
  INSERT INTO library_meta VALUES (1, 0);
  CREATE TABLE topics (
    topic_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    source_name TEXT NOT NULL
  ) STRICT;
  CREATE TABLE questions (
    id INTEGER PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES topics(topic_id),
    question_id TEXT NOT NULL,
    title TEXT NOT NULL,
    tags_json TEXT NOT NULL CHECK (json_valid(tags_json)),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('未分级', '基础', '进阶', '综合')),
    position INTEGER NOT NULL CHECK (position >= 0),
    archived INTEGER NOT NULL CHECK (archived IN (0, 1)),
    current_version_id INTEGER,
    UNIQUE (topic_id, question_id),
    FOREIGN KEY (current_version_id, id) REFERENCES question_versions(id, question_id)
  ) STRICT;
  CREATE TABLE question_versions (
    id INTEGER PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES questions(id),
    sequence INTEGER NOT NULL CHECK (sequence > 0),
    title TEXT NOT NULL,
    question_markdown TEXT NOT NULL,
    answer_markdown TEXT NOT NULL,
    definitions_json TEXT NOT NULL CHECK (json_valid(definitions_json)),
    image_bindings_json TEXT NOT NULL CHECK (json_valid(image_bindings_json)),
    content_hash TEXT NOT NULL CHECK (length(content_hash) = 64),
    created_at TEXT NOT NULL,
    UNIQUE (question_id, sequence),
    UNIQUE (id, question_id)
  ) STRICT;
  CREATE TABLE image_resources (
    hash TEXT PRIMARY KEY CHECK (length(hash) = 64),
    format TEXT NOT NULL CHECK (format IN ('png', 'jpeg', 'webp')),
    width INTEGER NOT NULL CHECK (width > 0),
    height INTEGER NOT NULL CHECK (height > 0),
    bytes BLOB NOT NULL CHECK (length(bytes) BETWEEN 1 AND 10485760)
  ) STRICT;
  CREATE TABLE version_images (
    version_id INTEGER NOT NULL REFERENCES question_versions(id),
    resource_hash TEXT NOT NULL REFERENCES image_resources(hash),
    PRIMARY KEY (version_id, resource_hash)
  ) STRICT;
  CREATE TABLE question_user_state (
    question_id INTEGER PRIMARY KEY REFERENCES questions(id),
    favorite INTEGER NOT NULL DEFAULT 0 CHECK (favorite IN (0, 1)),
    last_rating TEXT CHECK (last_rating IN ('不会', '不熟', '掌握')),
    last_rated_version_id INTEGER,
    CHECK ((last_rating IS NULL) = (last_rated_version_id IS NULL)),
    FOREIGN KEY (last_rated_version_id, question_id) REFERENCES question_versions(id, question_id)
  ) STRICT;
  CREATE TABLE import_receipts (
    token TEXT PRIMARY KEY,
    committed_at TEXT NOT NULL,
    result_json TEXT NOT NULL CHECK (json_valid(result_json))
  ) STRICT;
  CREATE INDEX questions_topic_order ON questions(topic_id, archived, position);
`
