// 只在初始化或受保护的升级事务内追加；未知同名对象使整个事务失败。
export const categoryMigration = `
  CREATE TABLE categories (
    category_id TEXT PRIMARY KEY CHECK (length(category_id) BETWEEN 1 AND 100),
    title TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK (length(title) BETWEEN 1 AND 60)
  ) STRICT;
  ALTER TABLE topics ADD COLUMN category_id TEXT
    REFERENCES categories(category_id) ON DELETE SET NULL;
  CREATE INDEX topics_category ON topics(category_id);
  ALTER TABLE practice_sessions ADD COLUMN category_scope_json TEXT NOT NULL
    DEFAULT '{"kind":"all"}' CHECK (json_valid(category_scope_json));
`
