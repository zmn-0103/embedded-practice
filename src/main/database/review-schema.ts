export const reviewTodoMigration = `
  CREATE TABLE review_todos (
    question_id INTEGER PRIMARY KEY REFERENCES questions(id),
    revision INTEGER NOT NULL CHECK (revision BETWEEN 1 AND 9007199254740991),
    state TEXT NOT NULL CHECK (state IN ('pending','done')),
    due_date TEXT,
    reason TEXT NOT NULL CHECK (length(reason) <= 500),
    updated_at TEXT NOT NULL,
    completed_at TEXT,
    CHECK ((state='done') = (completed_at IS NOT NULL))
  ) STRICT;
  CREATE INDEX review_todos_state_due ON review_todos(state,due_date,question_id);
`
