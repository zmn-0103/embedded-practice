-- 来源：20261024.4-v000 Windows x64 解包程序在独立临时目录实际创建的结构9。
PRAGMA application_id = 1162891825;
PRAGMA user_version = 9;
CREATE TABLE app_startup (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    launch_count INTEGER NOT NULL CHECK (launch_count > 0),
    last_started_at TEXT NOT NULL
  ) STRICT;
CREATE TABLE library_meta (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    revision INTEGER NOT NULL CHECK (revision BETWEEN 0 AND 9007199254740991)
  ) STRICT;
CREATE TABLE topics (
    topic_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    source_name TEXT NOT NULL
  , category_id TEXT
    REFERENCES categories(category_id) ON DELETE SET NULL) STRICT;
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
CREATE TABLE practice_sessions (
    id TEXT PRIMARY KEY,
    mode TEXT NOT NULL CHECK (mode IN ('sequential', 'random')),
    topic_id TEXT REFERENCES topics(topic_id),
    status TEXT NOT NULL CHECK (status IN ('active', 'finished', 'ended')),
    position INTEGER NOT NULL CHECK (position BETWEEN 0 AND 9007199254740991),
    revision INTEGER NOT NULL CHECK (revision BETWEEN 0 AND 9007199254740991),
    created_at TEXT NOT NULL,
    ended_at TEXT, filters_json TEXT
    CHECK (filters_json IS NULL OR (json_valid(filters_json) AND json_type(filters_json) = 'object')), category_scope_json TEXT NOT NULL
    DEFAULT '{"kind":"all"}' CHECK (json_valid(category_scope_json)),
    CHECK ((status = 'active') = (ended_at IS NULL))
  ) STRICT;
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
CREATE TABLE appearance_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    theme TEXT NOT NULL CHECK (theme IN ('system', 'light', 'dark')),
    font_size INTEGER NOT NULL CHECK (font_size BETWEEN 15 AND 22)
  , palette TEXT NOT NULL DEFAULT 'forest'
    CHECK (palette IN ('forest', 'ocean', 'sand', 'lilac'))) STRICT;
CREATE TABLE categories (
    category_id TEXT PRIMARY KEY CHECK (length(category_id) BETWEEN 1 AND 100),
    title TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK (length(title) BETWEEN 1 AND 60)
  ) STRICT;
CREATE TABLE practice_plans (
    plan_id TEXT PRIMARY KEY CHECK (length(plan_id) = 36),
    name TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK (length(name) BETWEEN 1 AND 60),
    options_json TEXT NOT NULL CHECK (json_valid(options_json))
  ) STRICT;
INSERT INTO "app_startup" VALUES (1,1,'2026-10-25T05:11:47.630Z');
INSERT INTO "library_meta" VALUES (1,0);
INSERT INTO "appearance_settings" VALUES (1,'system',17,'forest');
CREATE INDEX questions_topic_order ON questions(topic_id, archived, position);
CREATE UNIQUE INDEX practice_one_active
  ON practice_sessions(status) WHERE status = 'active';
CREATE INDEX practice_items_version ON practice_items(version_id);
CREATE INDEX topics_category ON topics(category_id);
