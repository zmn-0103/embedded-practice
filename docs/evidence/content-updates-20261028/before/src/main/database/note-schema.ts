import { MAX_DRAFT_BYTES } from '../../shared/contracts/practice'

export const personalNoteMigration = `
  CREATE TABLE personal_notes (
    question_id INTEGER PRIMARY KEY REFERENCES questions(id),
    revision INTEGER NOT NULL CHECK (revision BETWEEN 1 AND 9007199254740991),
    text TEXT NOT NULL CHECK (length(CAST(text AS BLOB)) <= ${MAX_DRAFT_BYTES}),
    updated_at TEXT NOT NULL
  ) STRICT;
`
