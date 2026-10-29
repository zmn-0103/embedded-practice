export const knowledgeMigration = `
  CREATE TABLE question_relations (
    relation_id TEXT PRIMARY KEY CHECK (length(relation_id)=36),
    source_question_id INTEGER NOT NULL REFERENCES questions(id),
    target_question_id INTEGER NOT NULL REFERENCES questions(id),
    kind TEXT NOT NULL CHECK (kind IN ('confused','prerequisite','scenario')),
    explanation TEXT NOT NULL CHECK (length(explanation)<=2000),
    revision INTEGER NOT NULL CHECK (revision BETWEEN 1 AND 9007199254740991),
    updated_at TEXT NOT NULL,
    CHECK (source_question_id<>target_question_id)
  ) STRICT;
  CREATE UNIQUE INDEX relation_pair_kind ON question_relations(
    min(source_question_id,target_question_id),max(source_question_id,target_question_id),kind);
  CREATE INDEX relations_source ON question_relations(source_question_id,updated_at);
  CREATE INDEX relations_target ON question_relations(target_question_id,updated_at);
  CREATE TABLE recent_knowledge_searches (
    query TEXT PRIMARY KEY CHECK (length(query) BETWEEN 1 AND 128 AND query=trim(query)),
    searched_at TEXT NOT NULL
  ) STRICT;
`
