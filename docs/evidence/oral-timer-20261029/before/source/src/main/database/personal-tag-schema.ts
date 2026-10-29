export const personalTagMigration = `
  CREATE TABLE personal_tags (
    tag_id TEXT PRIMARY KEY CHECK (length(tag_id) = 36),
    name TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK (length(name) BETWEEN 1 AND 60)
  ) STRICT;
  CREATE TABLE question_personal_tags (
    question_id INTEGER NOT NULL REFERENCES questions(id),
    tag_id TEXT NOT NULL REFERENCES personal_tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, tag_id)
  ) STRICT;
  CREATE INDEX personal_tag_questions ON question_personal_tags(tag_id, question_id);
  ALTER TABLE practice_plans ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0,1));
  ALTER TABLE practice_plans ADD COLUMN last_used_at TEXT;
  ALTER TABLE question_sets ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0,1));
  ALTER TABLE question_sets ADD COLUMN last_used_at TEXT;
`
