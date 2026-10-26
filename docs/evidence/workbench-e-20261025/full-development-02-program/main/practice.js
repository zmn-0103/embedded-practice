Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_question_bank = require("./question-bank-DgNu3Pwr.js");
const require_open_database = require("./open-database-DNSfFm_L.js");
const require_question_selection = require("./question-selection-CPQCo8n4.js");
let node_path = require("node:path");
let node_crypto = require("node:crypto");
//#region src/main/database/repositories/practice-repository.ts
var PracticeFault = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.code = code;
	}
};
function createPracticeRepository(database) {
	let writeBlocked = false;
	const sessionQuery = database.prepare(`SELECT s.id, s.mode, s.topic_id AS topicId, s.status,
    s.position, s.revision, s.created_at AS createdAt, s.ended_at AS endedAt, s.filters_json AS filtersJson,
    s.category_scope_json AS categoryJson,
    (SELECT count(*) FROM practice_items i WHERE i.session_id = s.id) AS total
    FROM practice_sessions s WHERE s.id = ?`);
	const activeQuery = database.prepare("SELECT id FROM practice_sessions WHERE status = 'active'");
	const categoryQuery = database.prepare("SELECT title FROM categories WHERE category_id = ?");
	const itemQuery = database.prepare(`SELECT question_id AS questionId, version_id AS versionId,
    draft, draft_revision AS draftRevision, revealed_at AS revealedAt, rating, skipped_at AS skippedAt
    FROM practice_items WHERE session_id = ? AND position = ?`);
	const receiptQuery = database.prepare("SELECT payload_hash AS hash, result_json AS result FROM practice_receipts WHERE request_id = ?");
	const insertReceipt = database.prepare("INSERT INTO practice_receipts VALUES (?, ?, ?, ?)");
	const updateDraft = database.prepare("UPDATE practice_items SET draft = ?, draft_revision = ? WHERE session_id = ? AND position = ?");
	const updateCursor = database.prepare(`UPDATE practice_sessions
    SET position = ?, revision = revision + 1, status = ?, ended_at = ? WHERE id = ?`);
	const queueSql = `SELECT q.id AS questionId, q.current_version_id AS versionId,
    q.title, t.title AS topicTitle, q.tags_json AS tags, q.difficulty
    ${require_question_selection.questionSelectionFrom} WHERE ${require_question_selection.questionSelectionWhere}`;
	const queueQuery = database.prepare(`${queueSql} ORDER BY ${require_question_selection.questionOrderSql} LIMIT @limit`);
	const randomQueueQuery = database.prepare(`${queueSql} ORDER BY random(), q.id LIMIT @limit`);
	const insertSession = database.prepare(`INSERT INTO practice_sessions
    (id, mode, topic_id, status, position, revision, created_at, filters_json, category_scope_json)
    VALUES (?, ?, ?, 'active', 0, 0, ?, ?, ?)`);
	const insertItem = database.prepare(`INSERT INTO practice_items
    (session_id, position, question_id, version_id, title, topic_title, tags_json, difficulty)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
	const revealItem = database.prepare(`UPDATE practice_items SET revealed_at = COALESCE(revealed_at, ?)
    WHERE session_id = ? AND position = ?`);
	const rateItem = database.prepare(`UPDATE practice_items SET rating = ?, rated_at = ?
    WHERE session_id = ? AND position = ?`);
	const rateState = database.prepare(`INSERT INTO question_user_state (question_id, last_rating, last_rated_version_id)
    VALUES (?, ?, ?) ON CONFLICT(question_id) DO UPDATE
    SET last_rating = excluded.last_rating, last_rated_version_id = excluded.last_rated_version_id`);
	const skipItem = database.prepare(`UPDATE practice_items SET skipped_at = COALESCE(skipped_at, ?)
    WHERE session_id = ? AND position = ?`);
	const countsQuery = database.prepare(`SELECT
    count(revealed_at) AS revealed, count(rating) AS rated,
    count(CASE WHEN revealed_at IS NOT NULL AND rating IS NULL THEN 1 END) AS unrated,
    count(CASE WHEN skipped_at IS NOT NULL AND revealed_at IS NULL THEN 1 END) AS skipped,
    count(CASE WHEN rating = '不会' THEN 1 END) AS unknownCount,
    count(CASE WHEN rating = '不熟' THEN 1 END) AS learningCount,
    count(CASE WHEN rating = '掌握' THEN 1 END) AS masteredCount
    FROM practice_items WHERE session_id = ?`);
	const detailQuery = database.prepare(`SELECT q.topic_id AS topicId, q.question_id AS questionId,
    i.position, i.version_id AS versionId, i.title, i.topic_title AS topicTitle, i.tags_json AS tags,
    i.difficulty, v.question_markdown AS markdown, v.definitions_json AS definitions,
    v.image_bindings_json AS imageBindings FROM practice_items i
    JOIN questions q ON q.id = i.question_id JOIN question_versions v ON v.id = i.version_id
    WHERE i.session_id = ? AND i.position = ?`);
	const answerQuery = database.prepare("SELECT answer_markdown AS markdown FROM question_versions WHERE id = ?");
	function session(id) {
		const row = sessionQuery.get(id);
		if (!row) throw new PracticeFault("SESSION_NOT_FOUND", "练习会话不存在，请重新读取当前练习。");
		return row;
	}
	function item(id, position) {
		const row = itemQuery.get(id, position);
		if (!row) throw new PracticeFault("SESSION_CONFLICT", "练习题目位置无效，请重新读取当前练习。");
		return row;
	}
	function ack(row) {
		return require_open_database.practiceAckSchema.parse({
			sessionId: row.id,
			status: row.status,
			position: row.position,
			revision: row.revision,
			total: row.total
		});
	}
	function current(cursor) {
		const row = session(cursor.sessionId);
		if (row.status !== "active" || row.position !== cursor.position || row.revision !== cursor.revision || row.revision === Number.MAX_SAFE_INTEGER) throw new PracticeFault("SESSION_CONFLICT", "练习位置已变化，请重新读取当前练习，勿重复切题。");
		return row;
	}
	function save(id, position, draft) {
		const saved = item(id, position);
		if (draft.revision < saved.draftRevision) throw new PracticeFault("DRAFT_STALE", "草稿修订已过期，请读取已保存内容后重新提交。");
		if (draft.revision === saved.draftRevision && draft.text !== saved.draft) throw new PracticeFault("DRAFT_CONFLICT", "相同修订包含不同草稿，请保留输入并核对已保存内容。");
		if (draft.revision > saved.draftRevision) updateDraft.run(draft.text, draft.revision, id, position);
		return require_open_database.draftAckSchema.parse({
			sessionId: id,
			position,
			draftRevision: draft.revision
		});
	}
	function ensureWritable() {
		if (writeBlocked) throw new PracticeFault("OUTCOME_UNKNOWN", "此前保存结果无法确认，已停止写入，请重启后核对。");
		if (database.inTransaction) throw new PracticeFault("WRITE_FAILED", "练习保存不接受外层事务，请在独立事务边界重试。");
	}
	function uncertain() {
		writeBlocked = true;
		throw new PracticeFault("OUTCOME_UNKNOWN", "保存结果无法确认，已停止写入，请重启后核对，勿假定未保存。");
	}
	function receipt(requestId, hash) {
		const row = receiptQuery.get(requestId);
		if (!row) return void 0;
		if (row.hash !== hash) throw new PracticeFault("REQUEST_CONFLICT", "同一请求标识不能用于不同操作。");
		return require_open_database.practiceAckSchema.parse(JSON.parse(row.result));
	}
	function command(action, input, work) {
		ensureWritable();
		const hash = (0, node_crypto.createHash)("sha256").update(JSON.stringify({
			action,
			input
		})).digest("hex");
		try {
			return database.transaction(() => {
				const prior = receipt(input.requestId, hash);
				if (prior) return prior;
				const result = require_open_database.practiceAckSchema.parse(work());
				insertReceipt.run(input.requestId, hash, JSON.stringify(result), (/* @__PURE__ */ new Date()).toISOString());
				return result;
			}).immediate();
		} catch (error) {
			if (error instanceof PracticeFault) throw error;
			let prior;
			try {
				if (database.inTransaction) return uncertain();
				prior = receipt(input.requestId, hash);
			} catch {
				return uncertain();
			}
			if (prior) return prior;
			throw error;
		}
	}
	function move(row, position) {
		const finished = position === row.total;
		updateCursor.run(position, finished ? "finished" : "active", finished ? (/* @__PURE__ */ new Date()).toISOString() : null, row.id);
		return ack(session(row.id));
	}
	const readTransaction = database.transaction((id) => {
		const selected = id ?? activeQuery.get()?.id;
		if (!selected) return null;
		const row = session(selected);
		const counts = countsQuery.get(selected);
		const summary = {
			...ack(row),
			mode: row.mode,
			category: require_open_database.categorySnapshotSchema.parse(JSON.parse(row.categoryJson)),
			topicId: row.topicId,
			filters: row.filtersJson === null ? null : require_open_database.questionFiltersSchema.parse(JSON.parse(row.filtersJson)),
			createdAt: row.createdAt,
			endedAt: row.endedAt,
			counts: {
				revealed: counts.revealed,
				rated: counts.rated,
				unrated: counts.unrated,
				skipped: counts.skipped,
				ratings: {
					不会: counts.unknownCount,
					不熟: counts.learningCount,
					掌握: counts.masteredCount
				}
			}
		};
		if (row.status !== "active") return require_open_database.practiceViewSchema.parse({
			session: summary,
			item: null
		});
		const state = item(row.id, row.position);
		const detail = detailQuery.get(row.id, row.position);
		if (!detail) throw new Error("练习队列缺少固定版本。");
		const body = require_open_database.contentBodySchema.parse({
			markdown: detail.markdown,
			definitions: JSON.parse(detail.definitions),
			imageBindings: JSON.parse(detail.imageBindings)
		});
		const info = {
			position: detail.position,
			topicId: detail.topicId,
			questionId: detail.questionId,
			versionId: detail.versionId,
			title: detail.title,
			topicTitle: detail.topicTitle,
			tags: JSON.parse(detail.tags),
			difficulty: detail.difficulty,
			body,
			draft: {
				revision: state.draftRevision,
				text: state.draft
			},
			rating: state.rating,
			skippedAt: state.skippedAt
		};
		return require_open_database.practiceViewSchema.parse({
			session: summary,
			item: state.revealedAt === null ? {
				...info,
				revealed: false,
				revealedAt: null
			} : {
				...info,
				revealed: true,
				revealedAt: state.revealedAt,
				answer: {
					...body,
					...answerQuery.get(state.versionId)
				}
			}
		});
	});
	return {
		read: (id) => readTransaction.deferred(id),
		start(input) {
			return command("start", input, () => {
				const active = activeQuery.get();
				if (active && !input.replace) throw new PracticeFault("ACTIVE_SESSION_EXISTS", "已有活动练习，请继续或明确结束原练习后新建。");
				if (input.replace && input.replace.sessionId !== active?.id) throw new PracticeFault("SESSION_CONFLICT", "活动练习已变化，请重新读取后决定是否结束。");
				const old = input.replace ? current(input.replace) : void 0;
				const mode = input.mode ?? "sequential";
				const filters = require_open_database.questionFiltersSchema.parse(input.filters ?? require_open_database.EMPTY_QUESTION_FILTERS);
				const category = require_open_database.categoryScopeSchema.parse(input.category ?? { kind: "all" });
				const namedCategory = category.kind === "category" ? categoryQuery.get(category.categoryId) : void 0;
				if (category.kind === "category" && !namedCategory) throw new PracticeFault("NO_QUESTIONS", "分类已移除，请重新选择；原练习已保留。");
				const categorySnapshot = require_open_database.categorySnapshotSchema.parse(category.kind === "category" ? {
					...category,
					title: namedCategory.title
				} : category);
				const queue = (mode === "random" ? randomQueueQuery : queueQuery).all({
					...require_question_selection.questionSelectionParameters({
						...input,
						filters,
						category
					}),
					limit: input.count === "all" ? -1 : input.count
				});
				if (!queue.length) throw new PracticeFault("NO_QUESTIONS", "没有匹配的活动题目，不创建空练习。");
				const now = (/* @__PURE__ */ new Date()).toISOString();
				if (old) updateCursor.run(old.position, "ended", now, old.id);
				const id = (0, node_crypto.randomUUID)();
				insertSession.run(id, mode, input.topicId, now, JSON.stringify(filters), JSON.stringify(categorySnapshot));
				queue.forEach((question, position) => insertItem.run(id, position, question.questionId, question.versionId, question.title, question.topicTitle, question.tags, question.difficulty));
				return ack(session(id));
			});
		},
		saveDraft(input) {
			ensureWritable();
			try {
				return database.transaction(() => {
					if (session(input.sessionId).status !== "active") throw new PracticeFault("SESSION_CONFLICT", "练习已结束，不能写入旧轮草稿。");
					return save(input.sessionId, input.position, input.draft);
				}).immediate();
			} catch (error) {
				if (error instanceof PracticeFault) throw error;
				try {
					if (database.inTransaction) return uncertain();
					const saved = item(input.sessionId, input.position);
					if (saved.draftRevision === input.draft.revision && saved.draft === input.draft.text) return require_open_database.draftAckSchema.parse({
						sessionId: input.sessionId,
						position: input.position,
						draftRevision: saved.draftRevision
					});
					if (saved.draftRevision >= input.draft.revision) return uncertain();
				} catch {
					return uncertain();
				}
				throw error;
			}
		},
		reveal(input) {
			return command("reveal", input, () => {
				const row = current(input.cursor);
				save(row.id, row.position, input.draft);
				revealItem.run((/* @__PURE__ */ new Date()).toISOString(), row.id, row.position);
				return move(row, row.position);
			});
		},
		rateAndAdvance(input) {
			return command("rate", input, () => {
				const row = current(input.cursor);
				const question = item(row.id, row.position);
				if (!question.revealedAt) throw new PracticeFault("REVEAL_REQUIRED", "请先揭晓参考答案，再自评或暂不评价。");
				save(row.id, row.position, input.draft);
				if (input.rating !== null) {
					rateItem.run(input.rating, (/* @__PURE__ */ new Date()).toISOString(), row.id, row.position);
					rateState.run(question.questionId, input.rating, question.versionId);
				}
				return move(row, row.position + 1);
			});
		},
		navigate(input) {
			return command("navigate", input, () => {
				const row = current(input.cursor);
				const question = item(row.id, row.position);
				if (input.direction === "previous" && row.position === 0) throw new PracticeFault("BOUNDARY", "当前已经是第一题。");
				if (input.direction === "next" && !question.revealedAt) throw new PracticeFault("REVEAL_REQUIRED", "请先揭晓，或选择跳过本题。");
				if (input.direction === "skip" && question.revealedAt) throw new PracticeFault("REVEAL_REQUIRED", "本题已经揭晓，请选择下一题或暂不评价。");
				save(row.id, row.position, input.draft);
				if (input.direction === "skip") skipItem.run((/* @__PURE__ */ new Date()).toISOString(), row.id, row.position);
				return move(row, row.position + (input.direction === "previous" ? -1 : 1));
			});
		},
		end(input) {
			return command("end", input, () => {
				const row = current(input.cursor);
				save(row.id, row.position, input.draft);
				updateCursor.run(row.position, "ended", (/* @__PURE__ */ new Date()).toISOString(), row.id);
				return ack(session(row.id));
			});
		}
	};
}
//#endregion
//#region src/main/services/practice/practice.ts
async function openPracticeService(databasePath, reportError) {
	if (!(0, node_path.isAbsolute)(databasePath)) throw new Error("练习数据库必须使用绝对路径。");
	const database = await require_open_database.openPracticeDatabase(databasePath);
	try {
		const repository = createPracticeRepository(database);
		let closed = false;
		function invoke(schema, input, work, failure) {
			if (closed) return {
				ok: false,
				error: {
					code: "SERVICE_CLOSED",
					message: "练习服务已关闭。"
				}
			};
			const request = schema.safeParse(input);
			if (!request.success) return {
				ok: false,
				error: {
					code: "INVALID_REQUEST",
					message: "练习请求无效，请保留输入后重新读取；草稿须为有效文字且不超过 1MiB。"
				}
			};
			try {
				return {
					ok: true,
					value: work(request.data)
				};
			} catch (error) {
				if (error instanceof PracticeFault) return {
					ok: false,
					error: {
						code: error.code,
						message: error.message
					}
				};
				try {
					reportError(error instanceof require_question_bank.ZodError ? /* @__PURE__ */ new Error("练习数据校验失败。") : error);
				} catch {}
				return {
					ok: false,
					error: failure
				};
			}
		}
		const writeError = {
			code: "WRITE_FAILED",
			message: "本次保存未提交，已保留原状态；请保留输入并使用同一请求重试。"
		};
		return {
			read: (input) => invoke(require_open_database.readPracticeSchema, input, ({ sessionId }) => repository.read(sessionId), {
				code: "DATABASE_UNAVAILABLE",
				message: "无法读取练习，请检查本地诊断日志后重试。"
			}),
			start: (input) => invoke(require_open_database.startPracticeSchema, input, repository.start, writeError),
			saveDraft: (input) => invoke(require_open_database.saveDraftSchema, input, repository.saveDraft, writeError),
			reveal: (input) => invoke(require_open_database.revealPracticeSchema, input, repository.reveal, writeError),
			rateAndAdvance: (input) => invoke(require_open_database.ratePracticeSchema, input, repository.rateAndAdvance, writeError),
			navigate: (input) => invoke(require_open_database.navigatePracticeSchema, input, repository.navigate, writeError),
			end: (input) => invoke(require_open_database.endPracticeSchema, input, repository.end, writeError),
			close() {
				if (closed) return;
				closed = true;
				database.close();
			}
		};
	} catch (error) {
		database.close();
		throw error;
	}
}
//#endregion
exports.createPracticeRepository = createPracticeRepository;
exports.openPracticeDatabase = require_open_database.openPracticeDatabase;
exports.openPracticeService = openPracticeService;
