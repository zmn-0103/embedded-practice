import { MAX_QUESTION_SET_ITEMS } from '../../shared/contracts/question-sets'

// 题单保留稳定身份；归档/失效关联不级联删除，由预览明确处理。
export const questionSetMigration = `
  CREATE TABLE question_sets (
    set_id TEXT PRIMARY KEY CHECK (length(set_id) = 36),
    name TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK (length(name) BETWEEN 1 AND 60)
  ) STRICT;
  CREATE TABLE question_set_items (
    set_id TEXT NOT NULL REFERENCES question_sets(set_id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position BETWEEN 0 AND ${MAX_QUESTION_SET_ITEMS - 1}),
    topic_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    PRIMARY KEY (set_id, position),
    UNIQUE (set_id, topic_id, question_id)
  ) STRICT;
  ALTER TABLE practice_sessions ADD COLUMN selection_name TEXT
    CHECK (selection_name IS NULL OR length(selection_name) BETWEEN 1 AND 80);
`
