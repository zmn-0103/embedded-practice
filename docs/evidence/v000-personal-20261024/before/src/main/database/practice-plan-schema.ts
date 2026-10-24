// 方案只存选题条件；不设分类/专题外键，失效方案保留原条件供用户确认。
export const practicePlanMigration = `
  CREATE TABLE practice_plans (
    plan_id TEXT PRIMARY KEY CHECK (length(plan_id) = 36),
    name TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK (length(name) BETWEEN 1 AND 60),
    options_json TEXT NOT NULL CHECK (json_valid(options_json))
  ) STRICT;
`
