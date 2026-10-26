const require_question_bank = require("./question-bank-DgNu3Pwr.js");
let node_path = require("node:path");
//#region src/shared/contracts/import-snapshot.ts
var MAX_IMAGE_BYTES = 10485760;
var MAX_IMPORT_BYTES = 209715200;
//#endregion
//#region src/main/workers/import-protocol.ts
var importWorkerRequestSchema = require_question_bank.strictObject({
	version: require_question_bank.literal(1),
	filePaths: require_question_bank.array(require_question_bank.string().refine((path) => (0, node_path.isAbsolute)(path) && (0, node_path.extname)(path).toLowerCase() === ".md")).min(1).max(require_question_bank.MAX_IMPORT_QUESTIONS)
});
var hashSchema = require_question_bank.string().regex(/^[a-f0-9]{64}$/);
var position = {
	line: require_question_bank.number().int().positive(),
	column: require_question_bank.number().int().positive()
};
var parsedTopicSchema = require_question_bank.strictObject({
	schemaVersion: require_question_bank.literal(1),
	topicId: require_question_bank.bankIdentifierSchema,
	topicTitle: require_question_bank.string().min(1),
	fileName: require_question_bank.string().min(1),
	definitions: require_question_bank.array(require_question_bank.strictObject({
		identifier: require_question_bank.string(),
		url: require_question_bank.string(),
		title: require_question_bank.string().nullable()
	})),
	questions: require_question_bank.array(require_question_bank.strictObject({
		questionId: require_question_bank.bankIdentifierSchema,
		title: require_question_bank.string().min(1),
		tags: require_question_bank.array(require_question_bank.string()),
		difficulty: require_question_bank.questionDifficultySchema.or(require_question_bank.literal("未分级")),
		questionMarkdown: require_question_bank.string().min(1),
		answerMarkdown: require_question_bank.string().min(1),
		definitions: require_question_bank.array(require_question_bank.strictObject({
			identifier: require_question_bank.string(),
			url: require_question_bank.string(),
			title: require_question_bank.string().nullable()
		})),
		images: require_question_bank.array(require_question_bank.strictObject({
			url: require_question_bank.string(),
			alt: require_question_bank.string(),
			...position
		})),
		line: position.line
	})).min(1).max(require_question_bank.MAX_IMPORT_QUESTIONS)
});
var snapshotSchema = require_question_bank.strictObject({
	topics: require_question_bank.array(require_question_bank.strictObject({
		topic: parsedTopicSchema,
		markdown: require_question_bank.string().min(1).max(require_question_bank.MAX_MARKDOWN_BYTES),
		imageBindings: require_question_bank.array(require_question_bank.strictObject({
			url: require_question_bank.string(),
			hash: hashSchema
		})),
		contentHashes: require_question_bank.array(require_question_bank.strictObject({
			questionId: require_question_bank.bankIdentifierSchema,
			hash: hashSchema
		}))
	})).min(1).max(require_question_bank.MAX_IMPORT_QUESTIONS),
	resources: require_question_bank.array(require_question_bank.strictObject({
		hash: hashSchema,
		format: require_question_bank._enum([
			"png",
			"jpeg",
			"webp"
		]),
		width: require_question_bank.number().int().positive(),
		height: require_question_bank.number().int().positive(),
		bytes: require_question_bank._instanceof(Uint8Array).refine((bytes) => bytes.byteLength > 0 && bytes.byteLength <= 10485760)
	})),
	sourceBytes: require_question_bank.number().int().nonnegative().max(MAX_IMPORT_BYTES),
	questionCount: require_question_bank.number().int().positive().max(require_question_bank.MAX_IMPORT_QUESTIONS)
}).superRefine((snapshot, context) => {
	const count = snapshot.topics.reduce((sum, item) => sum + item.topic.questions.length, 0);
	const resourceBytes = snapshot.resources.reduce((sum, item) => sum + item.bytes.byteLength, 0);
	const hashes = new Set(snapshot.resources.map((item) => item.hash));
	const markdownCharacters = snapshot.topics.reduce((sum, item) => sum + item.markdown.length, 0);
	if (count !== snapshot.questionCount || markdownCharacters + resourceBytes > snapshot.sourceBytes || hashes.size !== snapshot.resources.length || new Set(snapshot.topics.map((item) => item.topic.topicId)).size !== snapshot.topics.length) context.addIssue({
		code: "custom",
		message: "批次计数或资源列表不一致。"
	});
	if (snapshot.topics.some((topic) => {
		const urls = new Set(topic.imageBindings.map((binding) => binding.url));
		const questionIds = new Set(topic.topic.questions.map((question) => question.questionId));
		const contentIds = new Set(topic.contentHashes.map((item) => item.questionId));
		return urls.size !== topic.imageBindings.length || questionIds.size !== topic.topic.questions.length || contentIds.size !== topic.contentHashes.length || contentIds.size !== questionIds.size || topic.contentHashes.some((item) => !questionIds.has(item.questionId)) || topic.imageBindings.some((binding) => !hashes.has(binding.hash)) || topic.topic.questions.some((question) => question.images.some((image) => !urls.has(image.url)));
	})) context.addIssue({
		code: "custom",
		message: "题目指纹或图片绑定不一致。"
	});
});
var issueSchema = require_question_bank.strictObject({
	code: require_question_bank.parseIssueCodeSchema,
	fileName: require_question_bank.string().min(1),
	...position,
	message: require_question_bank.string().min(1)
});
var resultSchema = require_question_bank.discriminatedUnion("ok", [require_question_bank.strictObject({
	ok: require_question_bank.literal(true),
	value: snapshotSchema
}), require_question_bank.strictObject({
	ok: require_question_bank.literal(false),
	issues: require_question_bank.array(issueSchema).min(1)
})]);
var importWorkerReplySchema = require_question_bank.strictObject({
	version: require_question_bank.literal(1),
	threadId: require_question_bank.number().int().positive(),
	result: resultSchema
});
function workerFailure(code, message) {
	return {
		ok: false,
		issues: [{
			code,
			fileName: "导入批次",
			line: 1,
			column: 1,
			message
		}]
	};
}
//#endregion
Object.defineProperty(exports, "MAX_IMAGE_BYTES", {
	enumerable: true,
	get: function() {
		return MAX_IMAGE_BYTES;
	}
});
Object.defineProperty(exports, "MAX_IMPORT_BYTES", {
	enumerable: true,
	get: function() {
		return MAX_IMPORT_BYTES;
	}
});
Object.defineProperty(exports, "importWorkerReplySchema", {
	enumerable: true,
	get: function() {
		return importWorkerReplySchema;
	}
});
Object.defineProperty(exports, "importWorkerRequestSchema", {
	enumerable: true,
	get: function() {
		return importWorkerRequestSchema;
	}
});
Object.defineProperty(exports, "workerFailure", {
	enumerable: true,
	get: function() {
		return workerFailure;
	}
});
