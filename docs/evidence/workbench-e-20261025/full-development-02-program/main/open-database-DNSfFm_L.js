const require_rolldown_runtime = require("./rolldown-runtime-Dbql6lyJ.js");
const require_question_bank = require("./question-bank-DgNu3Pwr.js");
let node_path = require("node:path");
let node_crypto = require("node:crypto");
let node_fs_promises = require("node:fs/promises");
let better_sqlite3 = require("better-sqlite3");
better_sqlite3 = require_rolldown_runtime.__toESM(better_sqlite3);
//#region node_modules/zod/v4/classic/iso.js
function datetime(params) {
	return require_question_bank._isoDateTime(require_question_bank.ZodISODateTime, params);
}
//#endregion
//#region src/shared/contracts/categories.ts
var CATEGORY_CHANNEL = "library:update-category";
var categoryIdSchema = require_question_bank.bankIdentifierSchema.max(100);
var categoryTitleSchema = require_question_bank.string().min(1).max(60).refine((title) => title.trim() === title && !/[\u0000-\u001f\u007f]/u.test(title)).refine((title) => title !== "未分类" && title !== "全部分类");
var categorySchema = require_question_bank.strictObject({
	categoryId: categoryIdSchema,
	title: categoryTitleSchema
});
var categoryScopeSchema = require_question_bank.discriminatedUnion("kind", [
	require_question_bank.strictObject({ kind: require_question_bank.literal("all") }),
	require_question_bank.strictObject({ kind: require_question_bank.literal("uncategorized") }),
	require_question_bank.strictObject({
		kind: require_question_bank.literal("category"),
		categoryId: categoryIdSchema
	})
]);
var categorySnapshotSchema = require_question_bank.discriminatedUnion("kind", [
	require_question_bank.strictObject({ kind: require_question_bank.literal("all") }),
	require_question_bank.strictObject({ kind: require_question_bank.literal("uncategorized") }),
	categorySchema.extend({ kind: require_question_bank.literal("category") })
]);
var inputTitle = require_question_bank.string().trim().pipe(categoryTitleSchema);
var categoryChangeSchema = require_question_bank.discriminatedUnion("kind", [
	require_question_bank.strictObject({
		kind: require_question_bank.literal("create"),
		title: inputTitle
	}),
	require_question_bank.strictObject({
		kind: require_question_bank.literal("rename"),
		categoryId: categoryIdSchema,
		title: inputTitle
	}),
	require_question_bank.strictObject({
		kind: require_question_bank.literal("delete"),
		categoryId: categoryIdSchema
	}),
	require_question_bank.strictObject({
		kind: require_question_bank.literal("assign"),
		topicId: require_question_bank.bankIdentifierSchema,
		categoryId: categoryIdSchema.nullable()
	})
]);
var libraryNavigationSchema = require_question_bank.strictObject({
	categories: require_question_bank.array(categorySchema),
	topics: require_question_bank.array(require_question_bank.strictObject({
		topicId: require_question_bank.bankIdentifierSchema,
		title: require_question_bank.string().min(1),
		categoryId: categoryIdSchema.nullable(),
		activeCount: require_question_bank.number().int().nonnegative(),
		archivedCount: require_question_bank.number().int().nonnegative()
	}))
});
function matchesCategory(categoryId, scope) {
	return scope.kind === "all" || (scope.kind === "uncategorized" ? categoryId === null : categoryId === scope.categoryId);
}
//#endregion
//#region src/shared/contracts/library-import.ts
var previewTokenSchema = require_question_bank.uuid();
var importCountsSchema = require_question_bank.strictObject({
	added: require_question_bank.number().int().nonnegative(),
	updated: require_question_bank.number().int().nonnegative(),
	metadata: require_question_bank.number().int().nonnegative(),
	unchanged: require_question_bank.number().int().nonnegative(),
	archived: require_question_bank.number().int().nonnegative(),
	restored: require_question_bank.number().int().nonnegative(),
	newVersions: require_question_bank.number().int().nonnegative()
});
var importSummarySchema = require_question_bank.strictObject({
	counts: importCountsSchema,
	topics: require_question_bank.array(require_question_bank.strictObject({
		topicId: require_question_bank.bankIdentifierSchema,
		topicTitle: require_question_bank.string().min(1),
		metadataChanged: require_question_bank.boolean(),
		counts: importCountsSchema,
		questions: require_question_bank.array(require_question_bank.strictObject({
			questionId: require_question_bank.bankIdentifierSchema,
			kind: require_question_bank._enum([
				"added",
				"updated",
				"metadata",
				"unchanged",
				"archived",
				"restored"
			]),
			contentChanged: require_question_bank.boolean()
		}))
	}))
});
var commitReceiptSchema = require_question_bank.strictObject({
	revision: require_question_bank.number().int().nonnegative(),
	summary: importSummarySchema
});
var importPreviewSchema = require_question_bank.strictObject({
	token: previewTokenSchema,
	expiresAt: datetime(),
	summary: importSummarySchema
});
var importErrorCodeSchema = require_question_bank._enum([
	"INVALID_REQUEST",
	"INVALID_TOKEN",
	"PREVIEW_EXPIRED",
	"PREVIEW_STALE",
	"IMPORT_BUSY",
	"PREPARATION_FAILED",
	"IMPORT_CANCELLED",
	"SERVICE_CLOSED",
	"DATABASE_UNAVAILABLE"
]);
//#endregion
//#region src/shared/contracts/question-filters.ts
var masteryRatingSchema = require_question_bank._enum([
	"不会",
	"不熟",
	"掌握"
]);
var questionFiltersSchema = require_question_bank.strictObject({
	query: require_question_bank.string().trim().max(256),
	tag: require_question_bank.string().trim().transform((value) => value || null).nullable(),
	difficulty: require_question_bank.questionDifficultySchema.or(require_question_bank.literal("未分级")).nullable(),
	mastery: require_question_bank._enum([
		"all",
		"unpracticed",
		"不会",
		"不熟",
		"掌握"
	]),
	favoritesOnly: require_question_bank.boolean()
});
var EMPTY_QUESTION_FILTERS = Object.freeze({
	query: "",
	tag: null,
	difficulty: null,
	mastery: "all",
	favoritesOnly: false
});
//#endregion
//#region src/shared/contracts/library-desktop.ts
var LIBRARY_CHANNELS = {
	previewImport: "library:preview-import",
	cancelImport: "library:cancel-import",
	commitImport: "library:commit-import",
	discardImport: "library:discard-import",
	listQuestions: "library:list-questions",
	getQuestion: "library:get-question",
	getAnswer: "library:get-answer",
	exportTemplate: "library:export-template",
	openReference: "library:open-reference",
	copyCode: "library:copy-code",
	setFavorite: "library:set-favorite"
};
var resourceHashSchema = require_question_bank.string().regex(/^[a-f0-9]{64}$/);
var identitySchema = require_question_bank.strictObject({
	topicId: require_question_bank.bankIdentifierSchema,
	questionId: require_question_bank.bankIdentifierSchema
});
var versionIdentitySchema = identitySchema.extend({ versionId: require_question_bank.number().int().positive() });
var favoriteRequestSchema = identitySchema.extend({ favorite: require_question_bank.boolean() });
var listRequestSchema = require_question_bank.strictObject({
	topicId: require_question_bank.bankIdentifierSchema.nullable(),
	category: categoryScopeSchema.optional(),
	archived: require_question_bank.boolean(),
	page: require_question_bank.number().int().positive(),
	filters: questionFiltersSchema.optional(),
	contentUpdatedOnly: require_question_bank.boolean().optional()
});
var contentBodySchema = require_question_bank.strictObject({
	markdown: require_question_bank.string().min(1),
	definitions: require_question_bank.array(require_question_bank.strictObject({
		identifier: require_question_bank.string(),
		url: require_question_bank.string(),
		title: require_question_bank.string().nullable()
	})),
	imageBindings: require_question_bank.array(require_question_bank.strictObject({
		url: require_question_bank.string(),
		hash: resourceHashSchema
	}))
});
var questionInfoSchema = versionIdentitySchema.extend({
	title: require_question_bank.string().min(1),
	topicTitle: require_question_bank.string().min(1),
	tags: require_question_bank.array(require_question_bank.string()),
	difficulty: require_question_bank.questionDifficultySchema.or(require_question_bank.literal("未分级")),
	archived: require_question_bank.boolean(),
	favorite: require_question_bank.boolean(),
	practiced: require_question_bank.boolean(),
	contentUpdated: require_question_bank.boolean(),
	currentRating: masteryRatingSchema.nullable()
});
var questionDetailSchema = questionInfoSchema.extend({ body: contentBodySchema });
var libraryPageSchema = require_question_bank.strictObject({
	revision: require_question_bank.number().int().nonnegative(),
	total: require_question_bank.number().int().nonnegative(),
	page: require_question_bank.number().int().positive(),
	pageSize: require_question_bank.literal(20),
	tagOptions: require_question_bank.array(require_question_bank.string().min(1)),
	categories: libraryNavigationSchema.shape.categories,
	topics: libraryNavigationSchema.shape.topics,
	questions: require_question_bank.array(questionInfoSchema).max(20)
});
var errorSchema = require_question_bank.strictObject({
	code: importErrorCodeSchema.or(require_question_bank._enum([
		"FORBIDDEN",
		"NOT_FOUND",
		"FILE_ERROR"
	])),
	message: require_question_bank.string().min(1),
	issues: require_question_bank.array(require_question_bank.strictObject({
		code: require_question_bank.parseIssueCodeSchema,
		fileName: require_question_bank.string(),
		line: require_question_bank.number().int().positive(),
		column: require_question_bank.number().int().positive(),
		message: require_question_bank.string()
	})).optional()
});
function resultSchema(value) {
	return require_question_bank.discriminatedUnion("ok", [require_question_bank.strictObject({
		ok: require_question_bank.literal(true),
		value
	}), require_question_bank.strictObject({
		ok: require_question_bank.literal(false),
		error: errorSchema
	})]);
}
var previewImportResultSchema = resultSchema(importPreviewSchema);
var commitImportResultSchema = resultSchema(commitReceiptSchema);
var emptyResultSchema = resultSchema(require_question_bank._null());
var listResultSchema = resultSchema(libraryPageSchema);
var questionResultSchema = resultSchema(questionDetailSchema);
var answerResultSchema = resultSchema(contentBodySchema);
var favoriteResultSchema = resultSchema(favoriteRequestSchema);
//#endregion
//#region src/main/database/library-schema.ts
var librarySchema = `
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
`;
//#endregion
//#region src/shared/contracts/practice.ts
var MAX_DRAFT_BYTES = 1048576;
var counter = require_question_bank.number().int().nonnegative();
var practiceIdSchema = require_question_bank.uuid();
var ratingSchema = masteryRatingSchema;
var practiceModeSchema = require_question_bank._enum(["sequential", "random"]);
var draftSchema = require_question_bank.strictObject({
	revision: counter,
	text: require_question_bank.string().max(MAX_DRAFT_BYTES).refine((text) => !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(text)).refine((text) => new TextEncoder().encode(text).byteLength <= MAX_DRAFT_BYTES)
});
var cursorSchema = require_question_bank.strictObject({
	sessionId: practiceIdSchema,
	position: counter,
	revision: counter
});
var startPracticeSchema = require_question_bank.strictObject({
	requestId: practiceIdSchema,
	topicId: require_question_bank.bankIdentifierSchema.nullable(),
	category: categoryScopeSchema.optional(),
	count: require_question_bank.union([
		require_question_bank.literal(10),
		require_question_bank.literal(20),
		require_question_bank.literal(50),
		require_question_bank.literal("all")
	]),
	replace: cursorSchema.nullable(),
	filters: questionFiltersSchema.optional(),
	mode: practiceModeSchema.optional()
});
var readPracticeSchema = require_question_bank.strictObject({ sessionId: practiceIdSchema.nullable() });
var saveDraftSchema = require_question_bank.strictObject({
	sessionId: practiceIdSchema,
	position: counter,
	draft: draftSchema
});
var revealPracticeSchema = require_question_bank.strictObject({
	requestId: practiceIdSchema,
	cursor: cursorSchema,
	draft: draftSchema
});
var ratePracticeSchema = revealPracticeSchema.extend({ rating: ratingSchema.nullable() });
var navigatePracticeSchema = revealPracticeSchema.extend({ direction: require_question_bank._enum([
	"previous",
	"next",
	"skip"
]) });
var endPracticeSchema = revealPracticeSchema;
var practiceAckSchema = require_question_bank.strictObject({
	sessionId: practiceIdSchema,
	status: require_question_bank._enum([
		"active",
		"finished",
		"ended"
	]),
	position: counter,
	revision: counter,
	total: require_question_bank.number().int().positive()
}).refine((value) => value.status === "finished" ? value.position === value.total : value.position < value.total);
var draftAckSchema = require_question_bank.strictObject({
	sessionId: practiceIdSchema,
	position: counter,
	draftRevision: counter
});
var summarySchema = practiceAckSchema.safeExtend({
	mode: practiceModeSchema,
	topicId: require_question_bank.bankIdentifierSchema.nullable(),
	category: categorySnapshotSchema,
	filters: questionFiltersSchema.nullable(),
	createdAt: datetime(),
	endedAt: datetime().nullable(),
	counts: require_question_bank.strictObject({
		revealed: counter,
		rated: counter,
		unrated: counter,
		skipped: counter,
		ratings: require_question_bank.strictObject({
			不会: counter,
			不熟: counter,
			掌握: counter
		})
	})
}).refine(({ status, endedAt, counts, total }) => status === "active" === (endedAt === null) && counts.rated + counts.unrated === counts.revealed && counts.revealed + counts.skipped <= total && counts.rated === counts.ratings.不会 + counts.ratings.不熟 + counts.ratings.掌握);
var itemSchema = require_question_bank.strictObject({
	position: counter,
	topicId: require_question_bank.bankIdentifierSchema,
	questionId: require_question_bank.bankIdentifierSchema,
	versionId: require_question_bank.number().int().positive(),
	title: require_question_bank.string().min(1),
	topicTitle: require_question_bank.string().min(1),
	tags: require_question_bank.array(require_question_bank.string()),
	difficulty: require_question_bank.questionDifficultySchema.or(require_question_bank.literal("未分级")),
	body: contentBodySchema,
	draft: draftSchema,
	rating: ratingSchema.nullable(),
	skippedAt: datetime().nullable()
});
var practiceItemSchema = require_question_bank.discriminatedUnion("revealed", [itemSchema.extend({
	revealed: require_question_bank.literal(false),
	revealedAt: require_question_bank._null(),
	rating: require_question_bank._null()
}), itemSchema.extend({
	revealed: require_question_bank.literal(true),
	revealedAt: datetime(),
	answer: contentBodySchema
})]);
var practiceViewSchema = require_question_bank.strictObject({
	session: summarySchema,
	item: practiceItemSchema.nullable()
}).refine(({ session, item }) => session.status === "active" ? item !== null && item.position === session.position : item === null);
var practiceErrorCodeSchema = require_question_bank._enum([
	"INVALID_REQUEST",
	"NO_QUESTIONS",
	"ACTIVE_SESSION_EXISTS",
	"SESSION_CONFLICT",
	"SESSION_NOT_FOUND",
	"DRAFT_STALE",
	"DRAFT_CONFLICT",
	"REVEAL_REQUIRED",
	"BOUNDARY",
	"REQUEST_CONFLICT",
	"WRITE_FAILED",
	"OUTCOME_UNKNOWN",
	"SERVICE_CLOSED",
	"DATABASE_UNAVAILABLE"
]);
//#endregion
//#region src/main/database/practice-schema.ts
var sessionColumns = `(
    id TEXT PRIMARY KEY,
    mode TEXT NOT NULL CHECK (mode IN ('sequential', 'random')),
    topic_id TEXT REFERENCES topics(topic_id),
    status TEXT NOT NULL CHECK (status IN ('active', 'finished', 'ended')),
    position INTEGER NOT NULL CHECK (position BETWEEN 0 AND 9007199254740991),
    revision INTEGER NOT NULL CHECK (revision BETWEEN 0 AND 9007199254740991),
    created_at TEXT NOT NULL,
    ended_at TEXT,
    CHECK ((status = 'active') = (ended_at IS NULL))
  ) STRICT`;
var activeSessionIndex = `CREATE UNIQUE INDEX practice_one_active
  ON practice_sessions(status) WHERE status = 'active';`;
var practiceSchema = `
  CREATE TABLE practice_sessions ${sessionColumns};
  ${activeSessionIndex}
  CREATE TABLE practice_items (
    session_id TEXT NOT NULL REFERENCES practice_sessions(id),
    position INTEGER NOT NULL CHECK (position BETWEEN 0 AND 9007199254740991),
    question_id INTEGER NOT NULL REFERENCES questions(id),
    version_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    topic_title TEXT NOT NULL,
    tags_json TEXT NOT NULL CHECK (json_valid(tags_json)),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('未分级', '基础', '进阶', '综合')),
    draft TEXT NOT NULL DEFAULT '' CHECK (length(CAST(draft AS BLOB)) <= ${MAX_DRAFT_BYTES}),
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
  CREATE INDEX practice_items_version ON practice_items(version_id);
`;
var randomModeMigration = `
  CREATE TABLE practice_sessions_v4 ${sessionColumns};
  INSERT INTO practice_sessions_v4
    (id, mode, topic_id, status, position, revision, created_at, ended_at)
    SELECT id, mode, topic_id, status, position, revision, created_at, ended_at
    FROM practice_sessions ORDER BY rowid;
  DROP TABLE practice_sessions;
  ALTER TABLE practice_sessions_v4 RENAME TO practice_sessions;
  ${activeSessionIndex}
`;
var sessionFiltersMigration = `
  ALTER TABLE practice_sessions ADD COLUMN filters_json TEXT
    CHECK (filters_json IS NULL OR (json_valid(filters_json) AND json_type(filters_json) = 'object'));
`;
//#endregion
//#region src/main/database/settings-schema.ts
var settingsSchema = `
  CREATE TABLE appearance_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    theme TEXT NOT NULL CHECK (theme IN ('system', 'light', 'dark')),
    font_size INTEGER NOT NULL CHECK (font_size BETWEEN 15 AND 22)
  ) STRICT;
  INSERT INTO appearance_settings VALUES (1, 'system', 17);
`;
var paletteMigration = `
  ALTER TABLE appearance_settings ADD COLUMN palette TEXT NOT NULL DEFAULT 'forest'
    CHECK (palette IN ('forest', 'ocean', 'sand', 'lilac'));
`;
var themeMigration = `
  CREATE TABLE installed_themes (
    theme_id TEXT PRIMARY KEY NOT NULL CHECK (theme_id NOT GLOB 'builtin.*'),
    version TEXT NOT NULL,
    config_json TEXT NOT NULL CHECK (length(CAST(config_json AS BLOB)) <= 262144),
    content_hash TEXT NOT NULL CHECK (length(content_hash) = 64)
  ) STRICT;
  ALTER TABLE appearance_settings ADD COLUMN theme_id TEXT NOT NULL DEFAULT 'builtin.forest';
  UPDATE appearance_settings SET theme_id = 'builtin.' || palette;
  ALTER TABLE appearance_settings ADD COLUMN navigation_collapsed INTEGER NOT NULL DEFAULT 0
    CHECK (navigation_collapsed IN (0, 1));
  ALTER TABLE appearance_settings ADD COLUMN auxiliary_hidden INTEGER NOT NULL DEFAULT 0
    CHECK (auxiliary_hidden IN (0, 1));
`;
//#endregion
//#region src/main/database/category-schema.ts
var categoryMigration = `
  CREATE TABLE categories (
    category_id TEXT PRIMARY KEY CHECK (length(category_id) BETWEEN 1 AND 100),
    title TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK (length(title) BETWEEN 1 AND 60)
  ) STRICT;
  ALTER TABLE topics ADD COLUMN category_id TEXT
    REFERENCES categories(category_id) ON DELETE SET NULL;
  CREATE INDEX topics_category ON topics(category_id);
  ALTER TABLE practice_sessions ADD COLUMN category_scope_json TEXT NOT NULL
    DEFAULT '{"kind":"all"}' CHECK (json_valid(category_scope_json));
`;
//#endregion
//#region src/main/database/practice-plan-schema.ts
var practicePlanMigration = `
  CREATE TABLE practice_plans (
    plan_id TEXT PRIMARY KEY CHECK (length(plan_id) = 36),
    name TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK (length(name) BETWEEN 1 AND 60),
    options_json TEXT NOT NULL CHECK (json_valid(options_json))
  ) STRICT;
`;
//#endregion
//#region src/main/database/open-database.ts
var APPLICATION_ID = 1162891825;
var startupSchema = `
  CREATE TABLE app_startup (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    launch_count INTEGER NOT NULL CHECK (launch_count > 0),
    last_started_at TEXT NOT NULL
  ) STRICT;
`;
async function protectBeforeMigration(database, databasePath, version) {
	const directory = (0, node_path.join)((0, node_path.dirname)(databasePath), "backups");
	await (0, node_fs_promises.mkdir)(directory, { recursive: true });
	const destination = (0, node_path.join)(directory, `pre-migration-v${version}-${(0, node_crypto.randomUUID)()}.sqlite3`);
	await database.backup(destination);
	const backup = new better_sqlite3.default(destination, {
		readonly: true,
		fileMustExist: true
	});
	try {
		if (backup.pragma("integrity_check", { simple: true }) !== "ok" || backup.pragma("application_id", { simple: true }) !== 1162891825 || backup.pragma("user_version", { simple: true }) !== version) throw new Error("迁移前备份校验失败，停止升级并保留原数据库。");
	} finally {
		backup.close();
	}
}
async function openPracticeDatabase(databasePath) {
	const database = new better_sqlite3.default(databasePath);
	try {
		const applicationId = database.pragma("application_id", { simple: true });
		const version = database.pragma("user_version", { simple: true });
		database.pragma("foreign_keys = ON");
		if (applicationId === 0 && version === 0) {
			if (database.prepare("SELECT name FROM sqlite_schema WHERE name NOT GLOB 'sqlite_*'").all().length > 0) throw new Error("数据库没有应用标识且并非空库，停止初始化。");
			database.transaction(() => {
				database.exec(startupSchema + librarySchema + practiceSchema + settingsSchema + sessionFiltersMigration + paletteMigration + categoryMigration + practicePlanMigration + themeMigration);
				database.pragma(`application_id = ${APPLICATION_ID}`);
				database.pragma(`user_version = 10`);
			}).immediate();
		} else if (applicationId === 1162891825 && (version === 1 || version === 2 || version === 3 || version === 4 || version === 5 || version === 6 || version === 7 || version === 8 || version === 9)) {
			await protectBeforeMigration(database, databasePath, version);
			if (version === 3) database.pragma("foreign_keys = OFF");
			try {
				database.transaction(() => {
					if (database.pragma("user_version", { simple: true }) !== version || database.pragma("application_id", { simple: true }) !== 1162891825) throw new Error("备份期间数据库结构已变化，停止升级。");
					database.prepare("SELECT id, launch_count, last_started_at FROM app_startup").all();
					if (version === 1) database.exec(librarySchema);
					else {
						database.prepare("SELECT revision FROM library_meta WHERE id = 1").get();
						database.prepare("SELECT id, question_id FROM question_versions LIMIT 0").all();
					}
					if (version === 3) {
						if (database.prepare(`SELECT name FROM sqlite_schema WHERE tbl_name = 'practice_sessions'
                  AND type IN ('index', 'trigger') AND name NOT IN
                  ('sqlite_autoindex_practice_sessions_1', 'practice_one_active')`).all().length > 0) throw new Error("会话表存在未知索引或触发器，停止升级并保留原数据库。");
					}
					if (version < 4) database.exec(version === 3 ? randomModeMigration : practiceSchema);
					if (version < 5) database.exec(settingsSchema);
					if (version < 6) database.exec(sessionFiltersMigration);
					if (version < 7) database.exec(paletteMigration);
					if (version < 8) database.exec(categoryMigration);
					if (version < 9) database.exec(practicePlanMigration);
					database.exec(themeMigration);
					const foreignKeys = database.pragma("foreign_key_check");
					if (!Array.isArray(foreignKeys) || foreignKeys.length > 0) throw new Error("迁移后外键校验失败，回滚升级并保留原数据库。");
					database.pragma(`user_version = 10`);
				}).immediate();
			} finally {
				if (version === 3) database.pragma("foreign_keys = ON");
			}
		} else if (applicationId !== 1162891825 || version !== 10) throw new Error("数据库应用标识或结构版本不受支持，保留原文件。");
		database.pragma("journal_mode = WAL");
		database.pragma("synchronous = FULL");
		return database;
	} catch (error) {
		database.close();
		throw error;
	}
}
//#endregion
Object.defineProperty(exports, "APPLICATION_ID", {
	enumerable: true,
	get: function() {
		return APPLICATION_ID;
	}
});
Object.defineProperty(exports, "CATEGORY_CHANNEL", {
	enumerable: true,
	get: function() {
		return CATEGORY_CHANNEL;
	}
});
Object.defineProperty(exports, "EMPTY_QUESTION_FILTERS", {
	enumerable: true,
	get: function() {
		return EMPTY_QUESTION_FILTERS;
	}
});
Object.defineProperty(exports, "LIBRARY_CHANNELS", {
	enumerable: true,
	get: function() {
		return LIBRARY_CHANNELS;
	}
});
Object.defineProperty(exports, "answerResultSchema", {
	enumerable: true,
	get: function() {
		return answerResultSchema;
	}
});
Object.defineProperty(exports, "categoryChangeSchema", {
	enumerable: true,
	get: function() {
		return categoryChangeSchema;
	}
});
Object.defineProperty(exports, "categorySchema", {
	enumerable: true,
	get: function() {
		return categorySchema;
	}
});
Object.defineProperty(exports, "categoryScopeSchema", {
	enumerable: true,
	get: function() {
		return categoryScopeSchema;
	}
});
Object.defineProperty(exports, "categorySnapshotSchema", {
	enumerable: true,
	get: function() {
		return categorySnapshotSchema;
	}
});
Object.defineProperty(exports, "commitImportResultSchema", {
	enumerable: true,
	get: function() {
		return commitImportResultSchema;
	}
});
Object.defineProperty(exports, "commitReceiptSchema", {
	enumerable: true,
	get: function() {
		return commitReceiptSchema;
	}
});
Object.defineProperty(exports, "contentBodySchema", {
	enumerable: true,
	get: function() {
		return contentBodySchema;
	}
});
Object.defineProperty(exports, "datetime", {
	enumerable: true,
	get: function() {
		return datetime;
	}
});
Object.defineProperty(exports, "draftAckSchema", {
	enumerable: true,
	get: function() {
		return draftAckSchema;
	}
});
Object.defineProperty(exports, "draftSchema", {
	enumerable: true,
	get: function() {
		return draftSchema;
	}
});
Object.defineProperty(exports, "emptyResultSchema", {
	enumerable: true,
	get: function() {
		return emptyResultSchema;
	}
});
Object.defineProperty(exports, "endPracticeSchema", {
	enumerable: true,
	get: function() {
		return endPracticeSchema;
	}
});
Object.defineProperty(exports, "favoriteRequestSchema", {
	enumerable: true,
	get: function() {
		return favoriteRequestSchema;
	}
});
Object.defineProperty(exports, "favoriteResultSchema", {
	enumerable: true,
	get: function() {
		return favoriteResultSchema;
	}
});
Object.defineProperty(exports, "identitySchema", {
	enumerable: true,
	get: function() {
		return identitySchema;
	}
});
Object.defineProperty(exports, "libraryNavigationSchema", {
	enumerable: true,
	get: function() {
		return libraryNavigationSchema;
	}
});
Object.defineProperty(exports, "libraryPageSchema", {
	enumerable: true,
	get: function() {
		return libraryPageSchema;
	}
});
Object.defineProperty(exports, "listRequestSchema", {
	enumerable: true,
	get: function() {
		return listRequestSchema;
	}
});
Object.defineProperty(exports, "listResultSchema", {
	enumerable: true,
	get: function() {
		return listResultSchema;
	}
});
Object.defineProperty(exports, "matchesCategory", {
	enumerable: true,
	get: function() {
		return matchesCategory;
	}
});
Object.defineProperty(exports, "navigatePracticeSchema", {
	enumerable: true,
	get: function() {
		return navigatePracticeSchema;
	}
});
Object.defineProperty(exports, "openPracticeDatabase", {
	enumerable: true,
	get: function() {
		return openPracticeDatabase;
	}
});
Object.defineProperty(exports, "practiceAckSchema", {
	enumerable: true,
	get: function() {
		return practiceAckSchema;
	}
});
Object.defineProperty(exports, "practiceErrorCodeSchema", {
	enumerable: true,
	get: function() {
		return practiceErrorCodeSchema;
	}
});
Object.defineProperty(exports, "practiceIdSchema", {
	enumerable: true,
	get: function() {
		return practiceIdSchema;
	}
});
Object.defineProperty(exports, "practiceModeSchema", {
	enumerable: true,
	get: function() {
		return practiceModeSchema;
	}
});
Object.defineProperty(exports, "practiceViewSchema", {
	enumerable: true,
	get: function() {
		return practiceViewSchema;
	}
});
Object.defineProperty(exports, "previewImportResultSchema", {
	enumerable: true,
	get: function() {
		return previewImportResultSchema;
	}
});
Object.defineProperty(exports, "previewTokenSchema", {
	enumerable: true,
	get: function() {
		return previewTokenSchema;
	}
});
Object.defineProperty(exports, "questionDetailSchema", {
	enumerable: true,
	get: function() {
		return questionDetailSchema;
	}
});
Object.defineProperty(exports, "questionFiltersSchema", {
	enumerable: true,
	get: function() {
		return questionFiltersSchema;
	}
});
Object.defineProperty(exports, "questionResultSchema", {
	enumerable: true,
	get: function() {
		return questionResultSchema;
	}
});
Object.defineProperty(exports, "ratePracticeSchema", {
	enumerable: true,
	get: function() {
		return ratePracticeSchema;
	}
});
Object.defineProperty(exports, "ratingSchema", {
	enumerable: true,
	get: function() {
		return ratingSchema;
	}
});
Object.defineProperty(exports, "readPracticeSchema", {
	enumerable: true,
	get: function() {
		return readPracticeSchema;
	}
});
Object.defineProperty(exports, "resourceHashSchema", {
	enumerable: true,
	get: function() {
		return resourceHashSchema;
	}
});
Object.defineProperty(exports, "revealPracticeSchema", {
	enumerable: true,
	get: function() {
		return revealPracticeSchema;
	}
});
Object.defineProperty(exports, "saveDraftSchema", {
	enumerable: true,
	get: function() {
		return saveDraftSchema;
	}
});
Object.defineProperty(exports, "startPracticeSchema", {
	enumerable: true,
	get: function() {
		return startPracticeSchema;
	}
});
Object.defineProperty(exports, "versionIdentitySchema", {
	enumerable: true,
	get: function() {
		return versionIdentitySchema;
	}
});
