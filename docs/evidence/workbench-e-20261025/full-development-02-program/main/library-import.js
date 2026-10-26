Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_question_bank = require("./question-bank-DgNu3Pwr.js");
const require_open_database = require("./open-database-DNSfFm_L.js");
const require_settings_repository = require("./settings-repository-7fSO8Sq5.js");
require("./import-protocol-CjaQDko1.js");
const require_question_selection = require("./question-selection-CPQCo8n4.js");
const require_import_preparation = require("./import-preparation.js");
let node_path = require("node:path");
let node_crypto = require("node:crypto");
//#region src/shared/contracts/history.ts
var HISTORY_CHANNELS = {
	list: "history:list",
	getEntry: "history:get-entry"
};
var counter$1 = require_question_bank.number().int().nonnegative();
var historyListRequestSchema = require_open_database.identitySchema.extend({
	page: require_question_bank.number().int().positive(),
	excludeSessionId: require_open_database.practiceIdSchema.optional()
});
var historyEntryRequestSchema = require_open_database.identitySchema.extend({
	sessionId: require_open_database.practiceIdSchema,
	position: counter$1
});
var historySummarySchema = require_question_bank.strictObject({
	sessionId: require_open_database.practiceIdSchema,
	position: counter$1,
	versionId: require_question_bank.number().int().positive(),
	versionSequence: require_question_bank.number().int().positive(),
	isCurrentVersion: require_question_bank.boolean(),
	title: require_question_bank.string().min(1),
	topicTitle: require_question_bank.string().min(1),
	mode: require_open_database.practiceModeSchema,
	sessionStatus: require_question_bank._enum([
		"active",
		"finished",
		"ended"
	]),
	createdAt: require_open_database.datetime(),
	endedAt: require_open_database.datetime().nullable(),
	revealedAt: require_open_database.datetime().nullable(),
	rating: require_open_database.ratingSchema.nullable(),
	ratedAt: require_open_database.datetime().nullable(),
	skippedAt: require_open_database.datetime().nullable(),
	hasDraft: require_question_bank.boolean()
}).refine((item) => item.sessionStatus === "active" === (item.endedAt === null) && item.rating === null === (item.ratedAt === null) && (item.rating === null || item.revealedAt !== null));
var historyEntrySchema = historySummarySchema.safeExtend({
	body: require_open_database.contentBodySchema,
	draft: require_open_database.draftSchema,
	answer: require_open_database.contentBodySchema.optional()
}).refine((entry) => entry.revealedAt !== null === (entry.answer !== void 0));
var historyPageSchema = require_open_database.identitySchema.extend({
	currentVersionId: require_question_bank.number().int().positive(),
	archived: require_question_bank.boolean(),
	total: counter$1,
	page: require_question_bank.number().int().positive(),
	pageSize: require_question_bank.literal(20),
	entries: require_question_bank.array(historySummarySchema).max(20)
});
var errorSchema = require_question_bank.strictObject({
	code: require_question_bank._enum([
		"FORBIDDEN",
		"INVALID_REQUEST",
		"SERVICE_CLOSED",
		"DATABASE_UNAVAILABLE",
		"NOT_FOUND"
	]),
	message: require_question_bank.string().min(1)
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
var historyListResultSchema = resultSchema(historyPageSchema);
var historyEntryResultSchema = resultSchema(historyEntrySchema);
//#endregion
//#region src/shared/contracts/learning.ts
var LEARNING_CHANNEL = "learning:read";
var learningScopeSchema = require_open_database.listRequestSchema.pick({
	topicId: true,
	archived: true,
	category: true
});
var counter = require_question_bank.number().int().nonnegative();
var learningSummarySchema = learningScopeSchema.extend({
	category: require_open_database.categoryScopeSchema,
	categories: require_open_database.libraryPageSchema.shape.categories,
	topics: require_open_database.libraryPageSchema.shape.topics,
	total: counter,
	revealed: counter,
	rated: counter,
	favorites: counter,
	contentUpdated: counter,
	ratings: require_question_bank.strictObject({
		不会: counter,
		不熟: counter,
		掌握: counter
	})
}).refine((value) => [
	value.revealed,
	value.rated,
	value.favorites,
	value.contentUpdated
].every((count) => count <= value.total) && value.rated === value.ratings.不会 + value.ratings.不熟 + value.ratings.掌握);
var learningResultSchema = require_question_bank.discriminatedUnion("ok", [require_question_bank.strictObject({
	ok: require_question_bank.literal(true),
	value: learningSummarySchema
}), require_question_bank.strictObject({
	ok: require_question_bank.literal(false),
	error: require_question_bank.strictObject({
		code: require_question_bank._enum([
			"FORBIDDEN",
			"INVALID_REQUEST",
			"SERVICE_CLOSED",
			"DATABASE_UNAVAILABLE"
		]),
		message: require_question_bank.string().min(1)
	})
})]);
//#endregion
//#region src/main/database/repositories/category-repository.ts
var CategoryFault = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.code = code;
	}
};
function createCategoryRepository(database) {
	const findId = database.prepare("SELECT title FROM categories WHERE category_id = ?");
	const findTitle = database.prepare("SELECT category_id AS categoryId FROM categories WHERE title = ?");
	const topic = database.prepare("SELECT category_id AS categoryId FROM topics WHERE topic_id = ?");
	const create = database.prepare("INSERT INTO categories (category_id, title) VALUES (?, ?)");
	const rename = database.prepare("UPDATE categories SET title = ? WHERE category_id = ?");
	const remove = database.prepare("DELETE FROM categories WHERE category_id = ?");
	const assign = database.prepare("UPDATE topics SET category_id = ? WHERE topic_id = ?");
	const revision = database.prepare(`UPDATE library_meta SET revision = revision + 1
    WHERE id = 1 AND revision < 9007199254740991`);
	function requireCategory(id) {
		const found = findId.get(id);
		if (!found) throw new CategoryFault("NOT_FOUND", "分类已移除，请刷新后重新选择。");
		return found;
	}
	const update = database.transaction((change) => {
		let changed = false;
		switch (change.kind) {
			case "create":
				if (!findTitle.get(change.title)) {
					create.run((0, node_crypto.randomUUID)(), change.title);
					changed = true;
				}
				break;
			case "rename": {
				const current = requireCategory(change.categoryId);
				const sameName = findTitle.get(change.title);
				if (sameName && sameName.categoryId !== change.categoryId) throw new CategoryFault("INVALID_REQUEST", "分类名称已存在，请使用其他名称。");
				if (current.title !== change.title) {
					rename.run(change.title, change.categoryId);
					changed = true;
				}
				break;
			}
			case "delete":
				changed = remove.run(change.categoryId).changes > 0;
				break;
			case "assign": {
				const current = topic.get(change.topicId);
				if (!current) throw new CategoryFault("NOT_FOUND", "专题不存在，请刷新后重新选择。");
				if (change.categoryId !== null) requireCategory(change.categoryId);
				if (current.categoryId !== change.categoryId) {
					assign.run(change.categoryId, change.topicId);
					changed = true;
				}
				break;
			}
		}
		if (changed && revision.run().changes !== 1) throw new CategoryFault("DATABASE_UNAVAILABLE", "题库修订号无效，本次分类变更已回滚。");
	});
	return { updateCategory(input) {
		const change = require_open_database.categoryChangeSchema.parse(input);
		if (database.inTransaction) throw new Error("分类写入不接受外层事务。");
		update.immediate(change);
	} };
}
//#endregion
//#region src/main/database/repositories/practice-plan-repository.ts
var PracticePlanFault = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.code = code;
	}
};
function createPracticePlanRepository(database) {
	const rows = database.prepare(`SELECT plan_id AS planId,name,options_json AS options
    FROM practice_plans ORDER BY name COLLATE NOCASE,plan_id LIMIT 101`);
	const find = database.prepare("SELECT name,options_json AS options FROM practice_plans WHERE plan_id=?");
	const findName = database.prepare("SELECT 1 FROM practice_plans WHERE name=?");
	const count = database.prepare("SELECT count(*) FROM practice_plans").pluck();
	const insert = database.prepare("INSERT INTO practice_plans(plan_id,name,options_json) VALUES(?,?,?)");
	const remove = database.prepare("DELETE FROM practice_plans WHERE plan_id=?");
	const category = database.prepare("SELECT 1 FROM categories WHERE category_id=?");
	const topic = database.prepare("SELECT category_id AS categoryId FROM topics WHERE topic_id=?");
	const change = database.transaction((input) => {
		if (input.kind === "delete") {
			remove.run(input.planId);
			return;
		}
		const json = JSON.stringify(input.options);
		const previous = find.get(input.planId);
		if (previous) {
			if (previous.name !== input.name || previous.options !== json) throw new PracticePlanFault("INVALID_REQUEST", "方案ID已存在，不能覆盖不同的条件。");
			return;
		}
		if (findName.get(input.name)) throw new PracticePlanFault("INVALID_REQUEST", "方案名称已存在，请使用其他名称。");
		if (count.get() >= 100) throw new PracticePlanFault("INVALID_REQUEST", `最多保存100份方案。`);
		const scope = input.options.category;
		if (scope.kind === "category" && !category.get(scope.categoryId)) throw new PracticePlanFault("NOT_FOUND", "分类已移除，请重新选择后保存方案。");
		if (input.options.topicId !== null) {
			const selected = topic.get(input.options.topicId);
			if (!selected || !require_open_database.matchesCategory(selected.categoryId, scope)) throw new PracticePlanFault("NOT_FOUND", "专题已不在所选范围，请重新选择后保存方案。");
		}
		insert.run(input.planId, input.name, json);
	});
	return {
		listPracticePlans() {
			const found = rows.all();
			if (found.length > 100) throw new Error("方案数量超出支持范围。");
			return found.map((row) => require_settings_repository.practicePlanSchema.parse({
				...row,
				options: JSON.parse(row.options)
			}));
		},
		changePracticePlan(input) {
			const parsed = require_settings_repository.practicePlanChangeSchema.parse(input);
			if (database.inTransaction) throw new Error("方案写入不接受外层事务。");
			change.immediate(parsed);
		}
	};
}
//#endregion
//#region src/main/services/library/compare-import.ts
function emptyCounts() {
	return {
		added: 0,
		updated: 0,
		metadata: 0,
		unchanged: 0,
		archived: 0,
		restored: 0,
		newVersions: 0
	};
}
function compareImport(snapshot, baseline) {
	const previousTopics = new Map(baseline.topics.map((topic) => [topic.topicId, topic]));
	const total = emptyCounts();
	return {
		counts: total,
		topics: snapshot.topics.map((incoming) => {
			const { topic } = incoming;
			const previous = previousTopics.get(topic.topicId);
			const questions = new Map(previous?.questions.map((question) => [question.questionId, question]));
			const hashes = new Map(incoming.contentHashes.map((item) => [item.questionId, item.hash]));
			const counts = emptyCounts();
			const changes = topic.questions.map((question, position) => {
				const old = questions.get(question.questionId);
				const hash = hashes.get(question.questionId);
				if (hash === void 0) throw new Error("导入快照缺少题目内容指纹。");
				const contentChanged = old === void 0 || old.contentHash !== hash;
				const metadataChanged = old !== void 0 && (old.title !== question.title || old.difficulty !== question.difficulty || old.position !== position || JSON.stringify(old.tags) !== JSON.stringify(question.tags));
				const kind = old === void 0 ? "added" : old.archived ? "restored" : contentChanged ? "updated" : metadataChanged ? "metadata" : "unchanged";
				counts[kind]++;
				if (contentChanged) counts.newVersions++;
				questions.delete(question.questionId);
				return {
					questionId: question.questionId,
					kind,
					contentChanged
				};
			});
			for (const old of questions.values()) if (!old.archived) {
				changes.push({
					questionId: old.questionId,
					kind: "archived",
					contentChanged: false
				});
				counts.archived++;
			}
			for (const key of Object.keys(total)) total[key] += counts[key];
			return {
				topicId: topic.topicId,
				topicTitle: topic.topicTitle,
				metadataChanged: previous === void 0 || previous.title !== topic.topicTitle || previous.fileName !== topic.fileName,
				counts,
				questions: changes
			};
		})
	};
}
//#endregion
//#region src/main/database/repositories/library-repository.ts
var StalePreviewError = class extends Error {};
function createLibraryRepository(database) {
	const revisionQuery = database.prepare("SELECT revision FROM library_meta WHERE id = 1");
	const topicQuery = database.prepare("SELECT topic_id AS topicId, title, source_name AS fileName FROM topics WHERE topic_id = ?");
	const questionQuery = database.prepare(`
    SELECT q.question_id AS questionId, q.title, q.tags_json AS tags, q.difficulty,
      q.position, q.archived, v.content_hash AS contentHash
    FROM questions q LEFT JOIN question_versions v ON v.id = q.current_version_id
    WHERE q.topic_id = ? ORDER BY q.position, q.id
  `);
	const receiptQuery = database.prepare("SELECT result_json AS result FROM import_receipts WHERE token = ?");
	function receipt(token) {
		const row = receiptQuery.get(token);
		return row === void 0 ? void 0 : require_open_database.commitReceiptSchema.parse(JSON.parse(row.result));
	}
	function readBaseline(topicIds) {
		return {
			revision: require_question_bank.number().int().nonnegative().parse(revisionQuery.get()?.revision),
			topics: topicIds.flatMap((topicId) => {
				const topic = topicQuery.get(topicId);
				if (topic === void 0) return [];
				const questions = questionQuery.all(topicId).map((question) => {
					if (question.contentHash === null) throw new Error("题目缺少当前版本，停止导入。");
					return {
						...question,
						tags: require_question_bank.array(require_question_bank.string()).parse(JSON.parse(question.tags)),
						difficulty: require_question_bank.questionDifficultySchema.or(require_question_bank.literal("未分级")).parse(question.difficulty),
						archived: question.archived === 1,
						contentHash: question.contentHash
					};
				});
				return [{
					...topic,
					questions
				}];
			})
		};
	}
	const identityQuery = database.prepare("SELECT id, current_version_id AS currentVersionId FROM questions WHERE topic_id = ? AND question_id = ?");
	const insertTopic = database.prepare(`INSERT INTO topics (topic_id, title, source_name) VALUES (?, ?, ?)
    ON CONFLICT(topic_id) DO UPDATE SET title = excluded.title, source_name = excluded.source_name`);
	const insertQuestion = database.prepare(`INSERT INTO questions
    (topic_id, question_id, title, tags_json, difficulty, position, archived) VALUES (?, ?, ?, ?, ?, ?, 0)`);
	const updateQuestion = database.prepare(`UPDATE questions SET title = ?, tags_json = ?, difficulty = ?,
    position = ?, archived = 0, current_version_id = ? WHERE id = ?`);
	const insertState = database.prepare("INSERT INTO question_user_state (question_id) VALUES (?)");
	const sequenceQuery = database.prepare("SELECT COALESCE(MAX(sequence), 0) + 1 AS sequence FROM question_versions WHERE question_id = ?");
	const insertVersion = database.prepare(`INSERT INTO question_versions
    (question_id, sequence, title, question_markdown, answer_markdown, definitions_json, image_bindings_json, content_hash, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
	const insertImage = database.prepare("INSERT INTO image_resources VALUES (?, ?, ?, ?, ?) ON CONFLICT(hash) DO NOTHING");
	const insertReference = database.prepare("INSERT INTO version_images VALUES (?, ?)");
	const archiveQuestion = database.prepare("UPDATE questions SET archived = 1 WHERE topic_id = ? AND question_id = ?");
	const bumpRevision = database.prepare("UPDATE library_meta SET revision = revision + 1 WHERE id = 1");
	const insertReceipt = database.prepare("INSERT INTO import_receipts VALUES (?, ?, ?)");
	const commit = database.transaction((token, snapshot, expectedRevision) => {
		const previousReceipt = receipt(token);
		if (previousReceipt !== void 0) return previousReceipt;
		const before = readBaseline(snapshot.topics.map((item) => item.topic.topicId));
		if (before.revision !== expectedRevision) throw new StalePreviewError("题库已变化，请重新预览。");
		const summary = compareImport(snapshot, before);
		const changed = summary.topics.some((topic) => topic.metadataChanged || topic.questions.some((q) => q.kind !== "unchanged"));
		const now = (/* @__PURE__ */ new Date()).toISOString();
		if (changed) {
			for (const image of snapshot.resources) insertImage.run(image.hash, image.format, image.width, image.height, image.bytes);
			for (const [index, incoming] of snapshot.topics.entries()) {
				const { topic } = incoming;
				const changes = summary.topics[index].questions;
				const contentChanges = new Set(changes.filter((q) => q.contentChanged).map((q) => q.questionId));
				const bindings = new Map(incoming.imageBindings.map((binding) => [binding.url, binding.hash]));
				const hashes = new Map(incoming.contentHashes.map((item) => [item.questionId, item.hash]));
				insertTopic.run(topic.topicId, topic.topicTitle, topic.fileName);
				for (const [position, question] of topic.questions.entries()) {
					let identity = identityQuery.get(topic.topicId, question.questionId);
					if (identity === void 0) {
						const created = insertQuestion.run(topic.topicId, question.questionId, question.title, JSON.stringify(question.tags), question.difficulty, position);
						identity = {
							id: Number(created.lastInsertRowid),
							currentVersionId: null
						};
						insertState.run(identity.id);
					}
					let versionId = identity.currentVersionId;
					if (contentChanges.has(question.questionId)) {
						const { sequence } = sequenceQuery.get(identity.id);
						const imageBindings = [...new Set(question.images.map((image) => image.url))].map((url) => {
							const hash = bindings.get(url);
							if (hash === void 0) throw new Error("版本缺少图片绑定，停止提交。");
							return {
								url,
								hash
							};
						});
						const hash = hashes.get(question.questionId);
						if (hash === void 0) throw new Error("版本缺少内容指纹，停止提交。");
						versionId = Number(insertVersion.run(identity.id, sequence, question.title, question.questionMarkdown, question.answerMarkdown, JSON.stringify(question.definitions), JSON.stringify(imageBindings), hash, now).lastInsertRowid);
						for (const resourceHash of new Set(imageBindings.map((image) => image.hash))) insertReference.run(versionId, resourceHash);
					}
					if (versionId === null) throw new Error("题目没有可用版本，停止提交。");
					updateQuestion.run(question.title, JSON.stringify(question.tags), question.difficulty, position, versionId, identity.id);
				}
				for (const change of changes) if (change.kind === "archived") archiveQuestion.run(topic.topicId, change.questionId);
			}
			bumpRevision.run();
		}
		const result = require_open_database.commitReceiptSchema.parse({
			revision: before.revision + (changed ? 1 : 0),
			summary
		});
		insertReceipt.run(token, now, JSON.stringify(result));
		return result;
	});
	const baseline = database.transaction(readBaseline);
	return {
		baseline: (ids) => baseline.deferred(ids),
		receipt: (token) => {
			if (database.inTransaction) throw new Error("数据库事务尚未结束，不能确认持久化回执。");
			return receipt(token);
		},
		commit: (token, snapshot, revision) => commit.immediate(token, snapshot, revision)
	};
}
//#endregion
//#region src/main/database/repositories/topic-navigation.ts
function createTopicNavigationReader(database) {
	const categories = database.prepare(`SELECT category_id AS categoryId, title
    FROM categories ORDER BY title, category_id`);
	const topics = database.prepare(`SELECT t.topic_id AS topicId, t.title,
    t.category_id AS categoryId,
    SUM(CASE WHEN q.archived = 0 THEN 1 ELSE 0 END) AS activeCount,
    SUM(CASE WHEN q.archived = 1 THEN 1 ELSE 0 END) AS archivedCount
    FROM topics t LEFT JOIN questions q ON q.topic_id = t.topic_id
    GROUP BY t.topic_id ORDER BY t.title, t.topic_id`);
	return () => require_open_database.libraryNavigationSchema.parse({
		categories: categories.all(),
		topics: topics.all()
	});
}
//#endregion
//#region src/main/database/repositories/library-reader.ts
function createLibraryReader(database) {
	const navigation = createTopicNavigationReader(database);
	const listWhere = `${require_question_selection.questionSelectionWhere}
    AND (@contentUpdatedOnly = 0 OR (v.sequence > 1 AND (${require_question_selection.practicedSql}) = 0))`;
	const total = database.prepare(`SELECT count(*) AS total ${require_question_selection.questionSelectionFrom}
    WHERE ${listWhere}`);
	const infoColumns = `q.topic_id AS topicId, q.question_id AS questionId, q.current_version_id AS versionId,
    q.title, t.title AS topicTitle, q.tags_json AS tags, q.difficulty, q.archived,
    COALESCE(s.favorite, 0) AS favorite, ${require_question_selection.practicedSql} AS practiced,
    ${require_question_selection.currentRatingSql} AS currentRating,
    CASE WHEN v.sequence > 1 AND (${require_question_selection.practicedSql}) = 0 THEN 1 ELSE 0 END AS contentUpdated`;
	const pageQuery = database.prepare(`SELECT ${infoColumns} ${require_question_selection.questionSelectionFrom}
    WHERE ${listWhere} ORDER BY ${require_question_selection.questionOrderSql} LIMIT @limit OFFSET @offset`);
	const detailQuery = database.prepare(`SELECT ${infoColumns}, v.question_markdown AS markdown,
    v.definitions_json AS definitions, v.image_bindings_json AS imageBindings ${require_question_selection.questionSelectionFrom}
    WHERE q.topic_id = ? AND q.question_id = ?`);
	const answerQuery = database.prepare(`SELECT v.answer_markdown AS markdown, v.definitions_json AS definitions,
    v.image_bindings_json AS imageBindings FROM question_versions v JOIN questions q ON q.id = v.question_id
    WHERE q.topic_id = ? AND q.question_id = ? AND v.id = ?`);
	const imageQuery = database.prepare(`SELECT r.format, r.bytes FROM image_resources r WHERE r.hash = ?
    AND EXISTS (SELECT 1 FROM version_images vi WHERE vi.version_id = ? AND vi.resource_hash = r.hash)`);
	const revision = database.prepare("SELECT revision FROM library_meta WHERE id = 1");
	const tagQuery = database.prepare(`SELECT DISTINCT tag.value AS tag
    FROM questions q JOIN topics t ON t.topic_id = q.topic_id, json_each(q.tags_json) tag
    WHERE q.archived = @archived AND (@topicId IS NULL OR q.topic_id = @topicId)
    AND ${require_question_selection.categorySelectionWhere}
    ORDER BY tag.value`);
	let tagCache;
	function info(row) {
		return {
			topicId: row.topicId,
			questionId: row.questionId,
			versionId: row.versionId,
			title: row.title,
			topicTitle: row.topicTitle,
			tags: JSON.parse(row.tags),
			difficulty: row.difficulty,
			archived: row.archived === 1,
			favorite: row.favorite === 1,
			practiced: row.practiced === 1,
			contentUpdated: row.contentUpdated === 1,
			currentRating: row.currentRating
		};
	}
	function body(row) {
		return require_open_database.contentBodySchema.parse({
			markdown: row.markdown,
			definitions: JSON.parse(row.definitions),
			imageBindings: JSON.parse(row.imageBindings)
		});
	}
	const list = database.transaction((request) => {
		const parameters = {
			...require_question_selection.questionSelectionParameters(request),
			contentUpdatedOnly: Number(request.contentUpdatedOnly ?? false)
		};
		const currentRevision = revision.get().revision;
		const tagScope = JSON.stringify([
			request.category ?? { kind: "all" },
			request.topicId,
			request.archived
		]);
		if (tagCache?.revision !== currentRevision || tagCache.scope !== tagScope) tagCache = {
			revision: currentRevision,
			scope: tagScope,
			tags: tagQuery.all({
				...require_question_selection.categorySelectionParameters(request.category),
				topicId: request.topicId,
				archived: parameters.archived
			}).map((row) => row.tag)
		};
		const count = total.get(parameters).total;
		const page = Math.min(request.page, Math.max(1, Math.ceil(count / 20)));
		const rows = pageQuery.all({
			...parameters,
			limit: 20,
			offset: (page - 1) * 20
		});
		return require_open_database.libraryPageSchema.parse({
			revision: currentRevision,
			total: count,
			page,
			pageSize: 20,
			tagOptions: tagCache.tags,
			...navigation(),
			questions: rows.map(info)
		});
	});
	return {
		listQuestions: (request) => list.deferred(request),
		getQuestion(identity) {
			const row = detailQuery.get(identity.topicId, identity.questionId);
			return row === void 0 ? void 0 : require_open_database.questionDetailSchema.parse({
				...info(row),
				body: body(row)
			});
		},
		getAnswer(identity) {
			const row = answerQuery.get(identity.topicId, identity.questionId, identity.versionId);
			return row === void 0 ? void 0 : body(row);
		},
		readImage(versionId, hash) {
			const row = imageQuery.get(hash, versionId);
			if (row === void 0) return void 0;
			if (![
				"png",
				"jpeg",
				"webp"
			].includes(row.format) || row.bytes.byteLength < 1 || row.bytes.byteLength > 10485760) throw new Error("数据库图片类型或大小无效。");
			return {
				mime: `image/${row.format}`,
				bytes: new Uint8Array(row.bytes)
			};
		}
	};
}
//#endregion
//#region src/main/database/repositories/favorite-repository.ts
function createFavoriteRepository(database) {
	const set = database.prepare(`INSERT INTO question_user_state (question_id, favorite)
    SELECT id, @favorite FROM questions WHERE topic_id = @topicId AND question_id = @questionId
    ON CONFLICT(question_id) DO UPDATE SET favorite = excluded.favorite`);
	return { setFavorite(setting) {
		return set.run({
			topicId: setting.topicId,
			questionId: setting.questionId,
			favorite: Number(setting.favorite)
		}).changes === 0 ? void 0 : { ...setting };
	} };
}
//#endregion
//#region src/main/database/repositories/history-reader.ts
function createHistoryReader(database) {
	const identityQuery = database.prepare(`SELECT current_version_id AS currentVersionId, archived
    FROM questions WHERE topic_id = ? AND question_id = ?`);
	const from = `FROM practice_items i JOIN practice_sessions s ON s.id = i.session_id
    JOIN questions q ON q.id = i.question_id
    JOIN question_versions v ON v.id = i.version_id AND v.question_id = q.id`;
	const where = `q.topic_id = @topicId AND q.question_id = @questionId
    AND (i.draft_revision > 0 OR i.revealed_at IS NOT NULL OR i.skipped_at IS NOT NULL)`;
	const summaryColumns = `i.session_id AS sessionId, i.position, i.version_id AS versionId,
    v.sequence AS versionSequence, CASE WHEN i.version_id = q.current_version_id THEN 1 ELSE 0 END AS isCurrentVersion,
    i.title, i.topic_title AS topicTitle, s.mode, s.status AS sessionStatus,
    s.created_at AS createdAt, s.ended_at AS endedAt, i.revealed_at AS revealedAt,
    i.rating, i.rated_at AS ratedAt, i.skipped_at AS skippedAt,
    CASE WHEN length(CAST(i.draft AS BLOB)) > 0 THEN 1 ELSE 0 END AS hasDraft`;
	const countQuery = database.prepare(`SELECT count(*) AS total ${from} WHERE ${where}
    AND (@excludeSessionId IS NULL OR i.session_id != @excludeSessionId)`);
	const listQuery = database.prepare(`SELECT ${summaryColumns} ${from} WHERE ${where}
    AND (@excludeSessionId IS NULL OR i.session_id != @excludeSessionId)
    ORDER BY s.created_at DESC, s.rowid DESC, i.position LIMIT @limit OFFSET @offset`);
	const entryQuery = database.prepare(`SELECT ${summaryColumns}, i.draft,
    i.draft_revision AS draftRevision, v.question_markdown AS markdown,
    v.definitions_json AS definitions, v.image_bindings_json AS imageBindings,
    CASE WHEN i.revealed_at IS NOT NULL THEN v.answer_markdown ELSE NULL END AS answer
    ${from} WHERE ${where} AND i.session_id = @sessionId AND i.position = @position`);
	function summary(row) {
		return historySummarySchema.parse({
			sessionId: row.sessionId,
			position: row.position,
			versionId: row.versionId,
			versionSequence: row.versionSequence,
			isCurrentVersion: row.isCurrentVersion === 1,
			title: row.title,
			topicTitle: row.topicTitle,
			mode: row.mode,
			sessionStatus: row.sessionStatus,
			createdAt: row.createdAt,
			endedAt: row.endedAt,
			revealedAt: row.revealedAt,
			rating: row.rating,
			ratedAt: row.ratedAt,
			skippedAt: row.skippedAt,
			hasDraft: row.hasDraft === 1
		});
	}
	const list = database.transaction((request) => {
		const identity = identityQuery.get(request.topicId, request.questionId);
		if (!identity) return void 0;
		const parameters = {
			topicId: request.topicId,
			questionId: request.questionId,
			excludeSessionId: request.excludeSessionId ?? null
		};
		const { total } = countQuery.get(parameters);
		const page = Math.min(request.page, Math.max(1, Math.ceil(total / 20)));
		const rows = listQuery.all({
			...parameters,
			limit: 20,
			offset: (page - 1) * 20
		});
		return historyPageSchema.parse({
			topicId: request.topicId,
			questionId: request.questionId,
			currentVersionId: identity.currentVersionId,
			archived: identity.archived === 1,
			total,
			page,
			pageSize: 20,
			entries: rows.map(summary)
		});
	});
	return {
		listHistory: (request) => list.deferred(request),
		getHistoryEntry(request) {
			const row = entryQuery.get(request);
			if (!row) return void 0;
			const body = require_open_database.contentBodySchema.parse({
				markdown: row.markdown,
				definitions: JSON.parse(row.definitions),
				imageBindings: JSON.parse(row.imageBindings)
			});
			return historyEntrySchema.parse({
				...summary(row),
				body,
				draft: {
					revision: row.draftRevision,
					text: row.draft
				},
				...row.answer === null ? {} : { answer: {
					...body,
					markdown: row.answer
				} }
			});
		}
	};
}
//#endregion
//#region src/main/database/repositories/learning-reader.ts
function createLearningReader(database) {
	const navigation = createTopicNavigationReader(database);
	const counts = database.prepare(`SELECT count(*) AS total,
    COALESCE(sum(revealed), 0) AS revealed, count(currentRating) AS rated,
    COALESCE(sum(favorite), 0) AS favorites,
    count(CASE WHEN sequence > 1 AND practiced = 0 THEN 1 END) AS contentUpdated,
    count(CASE WHEN currentRating = '不会' THEN 1 END) AS unknownCount,
    count(CASE WHEN currentRating = '不熟' THEN 1 END) AS learningCount,
    count(CASE WHEN currentRating = '掌握' THEN 1 END) AS masteredCount
    FROM (SELECT v.sequence, COALESCE(s.favorite, 0) AS favorite,
      ${require_question_selection.currentRatingSql} AS currentRating, ${require_question_selection.practicedSql} AS practiced,
      CASE WHEN EXISTS (SELECT 1 FROM practice_items p
        WHERE p.question_id = q.id AND p.version_id = q.current_version_id
        AND p.revealed_at IS NOT NULL) THEN 1 ELSE 0 END AS revealed
      ${require_question_selection.questionSelectionFrom}
      WHERE q.archived = @archived AND (@topicId IS NULL OR q.topic_id = @topicId)
      AND ${require_question_selection.categorySelectionWhere})`);
	const read = database.transaction((scope) => {
		const row = counts.get({
			...require_question_selection.categorySelectionParameters(scope.category),
			topicId: scope.topicId,
			archived: Number(scope.archived)
		});
		return learningSummarySchema.parse({
			...scope,
			category: scope.category ?? { kind: "all" },
			...navigation(),
			total: row.total,
			revealed: row.revealed,
			rated: row.rated,
			favorites: row.favorites,
			contentUpdated: row.contentUpdated,
			ratings: {
				不会: row.unknownCount,
				不熟: row.learningCount,
				掌握: row.masteredCount
			}
		});
	});
	return { readLearningSummary: (scope) => read.deferred(scope) };
}
//#endregion
//#region src/main/services/library/import-session.ts
function createImportSession(repository, preparation, reportError, options = {}) {
	const ttlMs = options.ttlMs ?? 9e5;
	const now = options.now ?? Date.now;
	if (!Number.isSafeInteger(ttlMs) || ttlMs < 1 || ttlMs > 2147483647) throw new Error("预览有效期必须是合法的正整毫秒。");
	let closed = false;
	let state;
	let expiredToken;
	let timer;
	let active;
	let controller;
	let closing;
	function failure(code, message) {
		return {
			ok: false,
			error: {
				code,
				message
			}
		};
	}
	function report(error) {
		try {
			reportError(error);
		} catch {}
	}
	function release() {
		clearTimeout(timer);
		timer = void 0;
		state = void 0;
	}
	function expire() {
		expiredToken = state?.token;
		release();
	}
	function authorize(token) {
		if (closed) return failure("SERVICE_CLOSED", "导入服务已关闭。");
		if (!require_open_database.previewTokenSchema.safeParse(token).success) return failure("INVALID_TOKEN", "预览令牌无效，请重新预览。");
		if (token === expiredToken) return failure("PREVIEW_EXPIRED", "预览已过期，请重新预览。");
		if (state === void 0 || state.token !== token) return failure("INVALID_TOKEN", "预览已失效，请重新预览。");
		const current = now();
		if (current < state.createdAt || current >= state.expiresAt) {
			expire();
			return failure("PREVIEW_EXPIRED", "预览已过期，请重新预览。");
		}
		return {
			ok: true,
			value: state
		};
	}
	function success(preview, result) {
		preview.committed = result;
		delete preview.snapshot;
		return {
			ok: true,
			value: structuredClone(result)
		};
	}
	return {
		preview(filePaths, signal) {
			if (closed) return Promise.resolve(failure("SERVICE_CLOSED", "导入服务已关闭。"));
			if (active) return Promise.resolve(failure("IMPORT_BUSY", "已有文件准备任务，请等待或取消。"));
			release();
			expiredToken = void 0;
			controller = new AbortController();
			const combined = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
			const task = (async () => {
				try {
					const prepared = await preparation.prepare(filePaths, combined);
					if (closed) return failure("SERVICE_CLOSED", "导入服务已关闭。");
					if (combined.aborted) return failure("IMPORT_CANCELLED", "已取消本次预览。");
					if (!prepared.ok) return {
						ok: false,
						error: {
							code: "PREPARATION_FAILED",
							message: "文件准备未通过，请按错误定位修正后重试。",
							issues: prepared.issues
						}
					};
					const baseline = repository.baseline(prepared.value.topics.map((item) => item.topic.topicId));
					const summary = compareImport(prepared.value, baseline);
					const createdAt = now();
					const preview = {
						token: (0, node_crypto.randomUUID)(),
						createdAt,
						expiresAt: createdAt + ttlMs,
						revision: baseline.revision,
						snapshot: prepared.value
					};
					state = preview;
					timer = setTimeout(expire, ttlMs);
					timer.unref();
					return {
						ok: true,
						value: {
							token: preview.token,
							expiresAt: new Date(preview.expiresAt).toISOString(),
							summary: structuredClone(summary)
						}
					};
				} catch (error) {
					report(error);
					release();
					return failure("DATABASE_UNAVAILABLE", "无法建立导入预览，请检查本地诊断日志后重试。");
				}
			})();
			active = task;
			task.finally(() => {
				if (active === task) {
					active = void 0;
					controller = void 0;
				}
			});
			return task;
		},
		commit(token) {
			const authorized = authorize(token);
			if (!authorized.ok) return authorized;
			const preview = authorized.value;
			if (preview.committed) return success(preview, preview.committed);
			if (!preview.snapshot) return failure("INVALID_TOKEN", "预览内容已释放，请重新预览。");
			try {
				return success(preview, repository.commit(preview.token, preview.snapshot, preview.revision));
			} catch (error) {
				if (error instanceof StalePreviewError) {
					release();
					return failure("PREVIEW_STALE", "题库在预览后已变化，请重新预览再确认。");
				}
				report(error);
				try {
					const receipt = repository.receipt(preview.token);
					if (receipt !== void 0) return success(preview, receipt);
				} catch (readError) {
					report(readError);
					release();
					return failure("DATABASE_UNAVAILABLE", "无法确认提交结果，已停止本次写入；请重启并重新预览。");
				}
				return failure("DATABASE_UNAVAILABLE", "本批未提交，预览仍保留；请检查本地诊断日志后重试。");
			}
		},
		discard(token) {
			const authorized = authorize(token);
			if (!authorized.ok) return authorized;
			release();
			return {
				ok: true,
				value: null
			};
		},
		close() {
			if (closing) return closing;
			closed = true;
			release();
			controller?.abort();
			closing = (async () => {
				try {
					await preparation.close();
				} finally {
					await active;
				}
			})();
			return closing;
		}
	};
}
//#endregion
//#region src/main/services/library/library-import.ts
async function openLibraryImportService(databasePath, reportError) {
	if (!(0, node_path.isAbsolute)(databasePath)) throw new Error("导入数据库必须使用绝对路径。");
	const database = await require_open_database.openPracticeDatabase(databasePath);
	try {
		const reader = createLibraryReader(database);
		const favorites = createFavoriteRepository(database);
		const history = createHistoryReader(database);
		const learning = createLearningReader(database);
		const settings = require_settings_repository.createSettingsRepository(database);
		const categories = createCategoryRepository(database);
		const plans = createPracticePlanRepository(database);
		const themes = require_settings_repository.createThemeRepository(database);
		const session = createImportSession(createLibraryRepository(database), require_import_preparation.createImportPreparationService(reportError), reportError);
		let closing;
		return {
			...reader,
			...favorites,
			...history,
			...learning,
			...settings,
			...categories,
			...plans,
			...themes,
			preview: session.preview,
			commit: session.commit,
			discard: session.discard,
			close() {
				closing ??= session.close().finally(() => database.close());
				return closing;
			}
		};
	} catch (error) {
		database.close();
		throw error;
	}
}
//#endregion
exports.CategoryFault = CategoryFault;
exports.HISTORY_CHANNELS = HISTORY_CHANNELS;
exports.LEARNING_CHANNEL = LEARNING_CHANNEL;
exports.PracticePlanFault = PracticePlanFault;
exports.createImportSession = createImportSession;
exports.createLibraryRepository = createLibraryRepository;
exports.historyEntryRequestSchema = historyEntryRequestSchema;
exports.historyEntryResultSchema = historyEntryResultSchema;
exports.historyListRequestSchema = historyListRequestSchema;
exports.historyListResultSchema = historyListResultSchema;
exports.learningResultSchema = learningResultSchema;
exports.learningScopeSchema = learningScopeSchema;
exports.openLibraryImportService = openLibraryImportService;
exports.openPracticeDatabase = require_open_database.openPracticeDatabase;
