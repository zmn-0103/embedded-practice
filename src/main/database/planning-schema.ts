export const planningMigration = `
  CREATE TABLE daily_targets (
    day TEXT PRIMARY KEY,
    rating_target INTEGER NOT NULL CHECK (rating_target BETWEEN 0 AND 500),
    review_target INTEGER NOT NULL CHECK (review_target BETWEEN 0 AND 500),
    revision INTEGER NOT NULL CHECK (revision BETWEEN 1 AND 9007199254740991),
    updated_at TEXT NOT NULL
  ) STRICT;
  CREATE TABLE study_goals (
    goal_id TEXT PRIMARY KEY CHECK (length(goal_id)=36),
    name TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK (length(name) BETWEEN 1 AND 60),
    deadline TEXT,
    set_ids_json TEXT NOT NULL CHECK (json_valid(set_ids_json)),
    revision INTEGER NOT NULL CHECK (revision BETWEEN 1 AND 9007199254740991),
    updated_at TEXT NOT NULL
  ) STRICT;
  CREATE TABLE quota_settings (
    id INTEGER PRIMARY KEY CHECK (id=1),
    rows_json TEXT NOT NULL CHECK (json_valid(rows_json)),
    revision INTEGER NOT NULL CHECK (revision BETWEEN 1 AND 9007199254740991),
    updated_at TEXT NOT NULL
  ) STRICT;
  CREATE TABLE learning_activities (
    activity_id TEXT PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('rating','reveal','review','note')),
    question_id INTEGER NOT NULL REFERENCES questions(id),
    session_id TEXT,
    position INTEGER,
    occurred_at TEXT NOT NULL,
    day TEXT NOT NULL,
    FOREIGN KEY (session_id,position) REFERENCES practice_items(session_id,position),
    CHECK ((kind IN ('rating','reveal') AND session_id IS NOT NULL AND position IS NOT NULL)
      OR (kind IN ('review','note') AND session_id IS NULL AND position IS NULL))
  ) STRICT;
  CREATE INDEX learning_activities_day ON learning_activities(day,kind,question_id);
  CREATE INDEX learning_activities_session ON learning_activities(session_id,day);
`
