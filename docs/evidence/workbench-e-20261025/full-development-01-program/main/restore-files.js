Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_rolldown_runtime = require("./rolldown-runtime-Dbql6lyJ.js");
const require_question_bank = require("./question-bank-DgNu3Pwr.js");
const require_open_database = require("./open-database-DNSfFm_L.js");
const require_settings_repository = require("./settings-repository-7fSO8Sq5.js");
let node_fs = require("node:fs");
let node_path = require("node:path");
let node_crypto = require("node:crypto");
let node_fs_promises = require("node:fs/promises");
let better_sqlite3 = require("better-sqlite3");
better_sqlite3 = require_rolldown_runtime.__toESM(better_sqlite3);
//#region src/shared/contracts/backup.ts
var BACKUP_CHANNELS = {
	export: "backup:export",
	preview: "backup:preview",
	restore: "backup:restore"
};
var count = require_question_bank.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
var backupSummarySchema = require_question_bank.strictObject({
	createdAt: require_open_database.datetime().nullable(),
	appVersion: require_question_bank.string().min(1).nullable(),
	schemaVersion: require_question_bank.number().int().positive(),
	requiresMigration: require_question_bank.boolean(),
	categories: count,
	practicePlans: count,
	installedThemes: count.max(100),
	appearance: require_settings_repository.appearanceSchema,
	topics: count,
	questions: count,
	archivedQuestions: count,
	versions: count,
	images: count,
	sessions: count,
	drafts: count,
	favorites: count,
	ratings: count,
	activeSession: require_question_bank.boolean()
});
var backupFileSchema = require_question_bank.strictObject({
	filePath: require_question_bank.string().min(1),
	summary: backupSummarySchema
});
var backupPreviewSchema = backupFileSchema.extend({ token: require_question_bank.uuid() });
var restoreRequestSchema = require_question_bank.strictObject({ token: require_question_bank.uuid() });
var backupErrorSchema = require_question_bank.strictObject({
	code: require_question_bank._enum([
		"FORBIDDEN",
		"INVALID_REQUEST",
		"SERVICE_CLOSED",
		"DATABASE_UNAVAILABLE",
		"CANCELLED",
		"BACKUP_BUSY",
		"EXPORT_FAILED",
		"INVALID_BACKUP",
		"UNSUPPORTED_BACKUP",
		"FILE_ERROR",
		"PREVIEW_EXPIRED",
		"SAVE_FAILED",
		"RESTORE_FAILED",
		"RECOVERY_FAILED"
	]),
	message: require_question_bank.string().min(1)
});
var backupResultSchema = require_question_bank.discriminatedUnion("ok", [require_question_bank.strictObject({
	ok: require_question_bank.literal(true),
	value: backupFileSchema
}), require_question_bank.strictObject({
	ok: require_question_bank.literal(false),
	error: backupErrorSchema
})]);
var backupPreviewResultSchema = require_question_bank.discriminatedUnion("ok", [require_question_bank.strictObject({
	ok: require_question_bank.literal(true),
	value: backupPreviewSchema
}), require_question_bank.strictObject({
	ok: require_question_bank.literal(false),
	error: backupErrorSchema
})]);
var restoreResultSchema = require_question_bank.discriminatedUnion("ok", [require_question_bank.strictObject({
	ok: require_question_bank.literal(true),
	value: require_question_bank.strictObject({ protectionPath: require_question_bank.string().min(1) })
}), require_question_bank.strictObject({
	ok: require_question_bank.literal(false),
	error: backupErrorSchema
})]);
var BackupFault = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.code = code;
		this.name = "BackupFault";
	}
};
var metadataSchema = require_question_bank.strictObject({
	formatVersion: require_question_bank.literal(1),
	createdAt: require_open_database.datetime(),
	appVersion: require_question_bank.string().min(1).max(100),
	schemaVersion: require_question_bank.number().int().positive()
});
function checkIntegrity(database) {
	const integrity = database.pragma("integrity_check");
	if (integrity.length !== 1 || integrity[0]?.["integrity_check"] !== "ok") throw new BackupFault("INVALID_BACKUP", "备份完整性检查失败，请选择完好的备份。");
	if (database.pragma("foreign_key_check").length !== 0) throw new BackupFault("INVALID_BACKUP", "备份中的数据关联损坏，请选择其他备份。");
}
function readBackupHeader(database) {
	database.pragma("trusted_schema = OFF");
	if (database.pragma("application_id", { simple: true }) !== 1162891825) throw new BackupFault("INVALID_BACKUP", "所选文件不是本应用的数据备份。");
	const version = database.pragma("user_version", { simple: true });
	if (typeof version !== "number" || version < 1 || version > 10) throw new BackupFault("UNSUPPORTED_BACKUP", "备份结构版本不受支持，请使用兼容版本的程序。");
	checkIntegrity(database);
	const manifest = database.prepare("SELECT type FROM sqlite_schema WHERE name = 'backup_manifest'").get();
	if (!manifest) return {
		schemaVersion: version,
		metadata: null
	};
	if (manifest.type !== "table") throw new BackupFault("INVALID_BACKUP", "备份时间信息损坏，请选择其他备份。");
	if (database.pragma("table_info(backup_manifest)").map((column) => column.name).join(",") !== "id,format_version,created_at,app_version,schema_version") throw new BackupFault("INVALID_BACKUP", "备份元数据结构无法识别，请保留来源文件并选择兼容备份。");
	const rows = database.prepare(`SELECT format_version AS formatVersion, created_at AS createdAt,
      app_version AS appVersion, schema_version AS schemaVersion FROM backup_manifest`).all();
	const metadata = metadataSchema.safeParse(rows[0]);
	if (rows.length !== 1 || !metadata.success || metadata.data.schemaVersion !== version) throw new BackupFault("INVALID_BACKUP", "备份格式或时间信息无效，请选择兼容的完整备份。");
	return {
		schemaVersion: version,
		metadata: metadata.data
	};
}
var requiredColumns = {
	app_startup: "id, launch_count, last_started_at",
	library_meta: "id, revision",
	categories: "category_id, title",
	practice_plans: "plan_id, name, options_json",
	topics: "topic_id, title, source_name, category_id",
	questions: "id, topic_id, question_id, title, tags_json, difficulty, position, archived, current_version_id",
	question_versions: "id, question_id, sequence, title, question_markdown, answer_markdown, definitions_json, image_bindings_json, content_hash, created_at",
	image_resources: "hash, format, width, height, bytes",
	version_images: "version_id, resource_hash",
	question_user_state: "question_id, favorite, last_rating, last_rated_version_id",
	import_receipts: "token, committed_at, result_json",
	practice_sessions: "id, mode, topic_id, status, position, revision, created_at, ended_at, filters_json, category_scope_json",
	practice_items: "session_id, position, question_id, version_id, title, topic_title, tags_json, difficulty, draft, draft_revision, revealed_at, rating, rated_at, skipped_at",
	practice_receipts: "request_id, payload_hash, result_json, created_at",
	appearance_settings: "id, theme, font_size, palette, theme_id, navigation_collapsed, auxiliary_hidden",
	installed_themes: "theme_id, version, config_json, content_hash"
};
function readBackupSummary(database, header) {
	checkIntegrity(database);
	for (const [table, columns] of Object.entries(requiredColumns)) {
		if (database.prepare("SELECT type FROM sqlite_schema WHERE name = ?").get(table)?.type !== "table") throw new BackupFault("INVALID_BACKUP", "备份缺少必要的数据表，请选择完整备份。");
		database.prepare(`SELECT ${columns} FROM ${table} LIMIT 0`).all();
	}
	const settings = require_settings_repository.createSettingsRepository(database).readSettings();
	const themes = require_settings_repository.createThemeRepository(database).listThemes();
	if (themes.issues.length || !themes.entries.some((entry) => entry.definition.id === settings.themeId)) throw new BackupFault("INVALID_BACKUP", "备份中的主题配置损坏或当前主题缺失，请选择其他备份。");
	const plans = database.prepare(`SELECT plan_id AS planId,name,options_json AS options FROM practice_plans LIMIT 101`).all();
	if (plans.length > 100 || database.prepare("SELECT 1 FROM practice_plans GROUP BY plan_id HAVING count(*)>1 LIMIT 1").get() || database.prepare("SELECT 1 FROM practice_plans GROUP BY lower(name) HAVING count(*)>1 LIMIT 1").get()) throw new BackupFault("INVALID_BACKUP", "备份中的练习方案数量或唯一性无效。");
	for (const row of plans) require_settings_repository.practicePlanSchema.parse({
		...row,
		options: JSON.parse(row.options)
	});
	for (const row of database.prepare("SELECT category_id AS categoryId, title FROM categories").iterate()) require_open_database.categorySchema.parse(row);
	if (database.prepare("SELECT 1 FROM categories GROUP BY category_id HAVING count(*) > 1 LIMIT 1").get() || database.prepare("SELECT 1 FROM categories GROUP BY lower(title) HAVING count(*) > 1 LIMIT 1").get() || database.prepare(`SELECT 1 FROM topics t WHERE t.category_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM categories c WHERE c.category_id = t.category_id) LIMIT 1`).get()) throw new BackupFault("INVALID_BACKUP", "备份中的分类或专题归属无效，请选择其他备份。");
	for (const row of database.prepare("SELECT filters_json AS filters, category_scope_json AS category FROM practice_sessions").iterate()) {
		if (row.filters !== null) require_open_database.questionFiltersSchema.parse(JSON.parse(row.filters));
		require_open_database.categorySnapshotSchema.parse(JSON.parse(row.category));
	}
	for (const row of database.prepare(`SELECT question_markdown AS question, answer_markdown AS answer,
      definitions_json AS definitions, image_bindings_json AS bindings FROM question_versions`).iterate()) {
		const content = {
			definitions: JSON.parse(row.definitions),
			imageBindings: JSON.parse(row.bindings)
		};
		require_open_database.contentBodySchema.parse({
			...content,
			markdown: row.question
		});
		require_open_database.contentBodySchema.parse({
			...content,
			markdown: row.answer
		});
	}
	for (const row of database.prepare("SELECT hash, bytes FROM image_resources").iterate()) if ((0, node_crypto.createHash)("sha256").update(row.bytes).digest("hex") !== row.hash) throw new BackupFault("INVALID_BACKUP", "备份中的图片内容校验失败，请选择其他备份。");
	function count(table, condition = "") {
		return database.prepare(`SELECT count(*) FROM ${table} ${condition}`).pluck().get();
	}
	const activeSessions = count("practice_sessions", "WHERE status = 'active'");
	if (activeSessions > 1) throw new BackupFault("INVALID_BACKUP", "备份包含多个活动练习轮次，数据状态无效。");
	return backupSummarySchema.parse({
		createdAt: header.metadata?.createdAt ?? null,
		appVersion: header.metadata?.appVersion ?? null,
		schemaVersion: header.schemaVersion,
		requiresMigration: header.schemaVersion < 10,
		categories: count("categories"),
		practicePlans: plans.length,
		installedThemes: themes.entries.filter((entry) => !entry.builtIn).length,
		appearance: settings,
		topics: count("topics"),
		questions: count("questions"),
		archivedQuestions: count("questions", "WHERE archived = 1"),
		versions: count("question_versions"),
		images: count("image_resources"),
		sessions: count("practice_sessions"),
		drafts: count("practice_items", "WHERE draft <> ''"),
		favorites: count("question_user_state", "WHERE favorite = 1"),
		ratings: count("practice_items", "WHERE rating IS NOT NULL"),
		activeSession: activeSessions === 1
	});
}
//#endregion
//#region src/main/services/backup/restore-files.ts
var suffixes = [
	"",
	"-wal",
	"-shm",
	"-journal"
];
var digest = require_question_bank.string().regex(/^[a-f0-9]{64}$/);
var journalSchema = require_question_bank.strictObject({
	format: require_question_bank.literal(1),
	phase: require_question_bank._enum(["prepared", "committed"]),
	candidateHash: digest,
	originals: require_question_bank.array(require_question_bank.strictObject({
		suffix: require_question_bank._enum(suffixes),
		hash: digest
	})).min(1).max(4)
});
async function fileExists(path) {
	try {
		const entry = await (0, node_fs_promises.lstat)(path);
		if (!entry.isFile() || entry.isSymbolicLink()) throw new Error("恢复文件类型异常。");
		return true;
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;
		throw error;
	}
}
async function hashBackupFile(path) {
	if (!await fileExists(path)) throw new Error("恢复文件不存在。");
	const hash = (0, node_crypto.createHash)("sha256");
	for await (const bytes of (0, node_fs.createReadStream)(path)) hash.update(bytes);
	return hash.digest("hex");
}
async function syncFile(path) {
	const handle = await (0, node_fs_promises.open)(path, "r+");
	try {
		await handle.sync();
	} finally {
		await handle.close();
	}
}
async function paths(databasePath) {
	if (!(0, node_path.isAbsolute)(databasePath) || (0, node_path.basename)(databasePath) !== "practice.sqlite3") throw new Error("恢复目标必须是应用数据目录中的 practice.sqlite3。");
	const database = (0, node_path.join)(await (0, node_fs_promises.realpath)((0, node_path.dirname)(databasePath)), "practice.sqlite3");
	return {
		database,
		directory: (0, node_path.join)((0, node_path.dirname)(database), "restore-transaction")
	};
}
async function checkDirectory(directory) {
	const entry = await (0, node_fs_promises.lstat)(directory);
	if (!entry.isDirectory() || entry.isSymbolicLink()) throw new Error("恢复事务目录异常。");
	const allowed = /* @__PURE__ */ new Set([
		"record.json",
		"record.next",
		"candidate.sqlite3",
		"rejected.sqlite3",
		...suffixes.map((suffix) => `original.sqlite3${suffix}`)
	]);
	for (const name of await (0, node_fs_promises.readdir)(directory)) if (!allowed.has(name) || !await fileExists((0, node_path.join)(directory, name))) throw new Error("恢复事务包含未知文件，保留现场并停止。");
}
async function writeJournal(directory, journal) {
	const next = (0, node_path.join)(directory, "record.next");
	const handle = await (0, node_fs_promises.open)(next, "wx");
	try {
		await handle.writeFile(JSON.stringify(journal), "utf8");
		await handle.sync();
	} finally {
		await handle.close();
	}
	await (0, node_fs_promises.rename)(next, (0, node_path.join)(directory, "record.json"));
}
async function discardUnpublishedTransaction(database, directory) {
	const names = await (0, node_fs_promises.readdir)(directory);
	const unpublished = /* @__PURE__ */ new Set(["record.next", "candidate.sqlite3"]);
	if (names.some((name) => !unpublished.has(name))) return false;
	if (!await fileExists(database)) return false;
	await (0, node_fs_promises.rm)(directory, { recursive: true });
	return true;
}
async function recoverDatabaseReplacement(databasePath) {
	const { database, directory } = await paths(databasePath);
	try {
		await (0, node_fs_promises.lstat)(directory);
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") return "none";
		throw error;
	}
	await checkDirectory(directory);
	const journalPath = (0, node_path.join)(directory, "record.json");
	if (!await fileExists(journalPath)) {
		if (await discardUnpublishedTransaction(database, directory)) return "none";
		throw new Error("恢复事务缺少日志且无法确认原文件未被移动，停止启动并保留全部原文件。");
	}
	const journal = journalSchema.parse(JSON.parse(await (0, node_fs_promises.readFile)(journalPath, "utf8")));
	if (!journal.originals.some((file) => file.suffix === "") || new Set(journal.originals.map((file) => file.suffix)).size !== journal.originals.length) throw new Error("恢复事务原文件清单异常。");
	if (journal.phase === "committed") {
		if (await hashBackupFile(database) !== journal.candidateHash) throw new Error("已提交的恢复文件发生变化，保留现场并停止。");
		for (const suffix of suffixes) {
			if (suffix && await fileExists(database + suffix)) throw new Error("已提交恢复的目标存在未知伴随文件，停止打开数据库。");
			const saved = (0, node_path.join)(directory, `original.sqlite3${suffix}`);
			if (await fileExists(saved)) {
				const original = journal.originals.find((file) => file.suffix === suffix);
				if (!original || await hashBackupFile(saved) !== original.hash) throw new Error("已提交恢复的原文件发生变化，保留现场并停止。");
			}
		}
	} else {
		for (const suffix of suffixes) {
			const original = journal.originals.find((file) => file.suffix === suffix);
			const saved = (0, node_path.join)(directory, `original.sqlite3${suffix}`);
			const target = database + suffix;
			const savedExists = await fileExists(saved);
			const targetExists = await fileExists(target);
			if (!original) {
				if (savedExists || targetExists) throw new Error("恢复目标存在未知伴随文件。");
				continue;
			}
			if (savedExists && await hashBackupFile(saved) !== original.hash) throw new Error("回退原文件校验失败。");
			if (!savedExists && (!targetExists || await hashBackupFile(target) !== original.hash)) throw new Error("回退所需原文件缺失或变化。");
			if (savedExists && targetExists && (suffix !== "" || await hashBackupFile(target) !== journal.candidateHash)) throw new Error("恢复目标发生未知变化，停止覆盖。");
		}
		for (const original of journal.originals) {
			const saved = (0, node_path.join)(directory, `original.sqlite3${original.suffix}`);
			if (!await fileExists(saved)) continue;
			const target = database + original.suffix;
			if (await fileExists(target)) await (0, node_fs_promises.rename)(target, (0, node_path.join)(directory, "rejected.sqlite3"));
			await (0, node_fs_promises.rename)(saved, target);
		}
	}
	await checkDirectory(directory);
	await (0, node_fs_promises.rm)(directory, { recursive: true });
	return journal.phase === "committed" ? "committed" : "rolled-back";
}
async function replaceDatabase(databasePath, candidatePath, candidateHash, reportError) {
	digest.parse(candidateHash);
	const { database, directory } = await paths(databasePath);
	await (0, node_fs_promises.mkdir)(directory);
	let armed = false;
	let committed = false;
	try {
		const candidate = (0, node_path.join)(directory, "candidate.sqlite3");
		await (0, node_fs_promises.copyFile)(candidatePath, candidate);
		await syncFile(candidate);
		if (await hashBackupFile(candidate) !== candidateHash) throw new Error("预览副本发生变化。");
		const originals = [];
		for (const suffix of suffixes) if (await fileExists(database + suffix)) originals.push({
			suffix,
			hash: await hashBackupFile(database + suffix)
		});
		if (!originals.some((file) => file.suffix === "")) throw new Error("当前数据库缺失，停止恢复。");
		const journal = {
			format: 1,
			phase: "prepared",
			candidateHash,
			originals
		};
		await writeJournal(directory, journal);
		armed = true;
		for (const file of originals) await (0, node_fs_promises.rename)(database + file.suffix, (0, node_path.join)(directory, `original.sqlite3${file.suffix}`));
		await (0, node_fs_promises.rename)(candidate, database);
		const installed = new better_sqlite3.default(database, {
			readonly: true,
			fileMustExist: true
		});
		try {
			readBackupSummary(installed, readBackupHeader(installed));
		} finally {
			installed.close();
		}
		if (await hashBackupFile(database) !== candidateHash) throw new Error("替换后文件校验失败。");
		await writeJournal(directory, {
			...journal,
			phase: "committed"
		});
		committed = true;
	} catch {
		try {
			if (armed) await recoverDatabaseReplacement(database);
			else {
				await checkDirectory(directory);
				await (0, node_fs_promises.rm)(directory, { recursive: true });
			}
		} catch {
			throw new BackupFault("RECOVERY_FAILED", "恢复和自动回退未能完成，已保留原文件与保护性备份。请退出并检查数据目录的恢复事务，勿删除原文件。");
		}
		throw new BackupFault("RESTORE_FAILED", "恢复未完成，原数据已保留或回退。重启后可继续使用原数据。");
	}
	if (committed) try {
		await recoverDatabaseReplacement(database);
	} catch {
		reportError(/* @__PURE__ */ new Error("已提交恢复事务的清理未完成，将在启动时重新检查。"));
	}
}
//#endregion
exports.BACKUP_CHANNELS = BACKUP_CHANNELS;
exports.BackupFault = BackupFault;
exports.backupPreviewResultSchema = backupPreviewResultSchema;
exports.backupResultSchema = backupResultSchema;
exports.hashBackupFile = hashBackupFile;
exports.readBackupHeader = readBackupHeader;
exports.readBackupSummary = readBackupSummary;
exports.recoverDatabaseReplacement = recoverDatabaseReplacement;
exports.replaceDatabase = replaceDatabase;
exports.restoreRequestSchema = restoreRequestSchema;
exports.restoreResultSchema = restoreResultSchema;
