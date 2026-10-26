const require_question_bank = require("./question-bank-DgNu3Pwr.js");
const require_open_database = require("./open-database-DNSfFm_L.js");
const require_settings_repository = require("./settings-repository-7fSO8Sq5.js");
const require_read_file_snapshot = require("./read-file-snapshot-CMVe8RMv.js");
const require_restore_files = require("./restore-files.js");
const require_backup = require("./backup.js");
const require_library_import = require("./library-import.js");
const require_practice = require("./practice.js");
let node_fs = require("node:fs");
let node_path = require("node:path");
let electron = require("electron");
let node_crypto = require("node:crypto");
let node_fs_promises = require("node:fs/promises");
let node_url = require("node:url");
//#region src/shared/contracts/content-urls.ts
var IMAGE_SCHEME = "practice-image";
function imageResourceUrl(versionId, hash) {
	if (!Number.isSafeInteger(versionId) || versionId < 1 || !require_open_database.resourceHashSchema.safeParse(hash).success) throw new Error("图片资源身份无效。");
	return `${IMAGE_SCHEME}://resource/${versionId}/${hash}`;
}
function parseImageResourceUrl(input) {
	try {
		const url = new URL(input);
		const match = /^\/([1-9]\d*)\/([a-f0-9]{64})$/.exec(url.pathname);
		if (url.protocol !== `practice-image:` || url.host !== "resource" || url.username || url.password || url.search || url.hash || !match) return void 0;
		const versionId = Number(match[1]);
		if (!Number.isSafeInteger(versionId)) return void 0;
		const hash = match[2];
		if (input !== imageResourceUrl(versionId, hash)) return void 0;
		return {
			versionId,
			hash
		};
	} catch {
		return;
	}
}
function externalHttpUrl(input) {
	if (input.length > 4096 || input.trim() !== input || /[\u0000-\u001f\u007f]/u.test(input) || !/^https?:\/\//i.test(input)) return void 0;
	try {
		const url = new URL(input);
		return (url.protocol === "http:" || url.protocol === "https:") && url.hostname !== "" && url.username === "" && url.password === "" ? url.href : void 0;
	} catch {
		return;
	}
}
//#endregion
//#region src/shared/contracts/application.ts
var APP_STATUS_CHANNEL = "app:get-status";
var startupRecordSchema = require_question_bank.strictObject({
	launchCount: require_question_bank.number().int().positive(),
	lastStartedAt: require_open_database.datetime()
});
var appStatusSchema = startupRecordSchema.extend({ appVersion: require_question_bank.string().min(1) });
var appStatusResultSchema = require_question_bank.discriminatedUnion("ok", [require_question_bank.strictObject({
	ok: require_question_bank.literal(true),
	value: appStatusSchema
}), require_question_bank.strictObject({
	ok: require_question_bank.literal(false),
	error: require_question_bank.strictObject({
		code: require_question_bank._enum([
			"DATABASE_UNAVAILABLE",
			"INVALID_REQUEST",
			"FORBIDDEN"
		]),
		message: require_question_bank.string().min(1)
	})
})]);
//#endregion
//#region src/main/database/startup-store.ts
async function openStartupStore(databasePath) {
	const database = await require_open_database.openPracticeDatabase(databasePath);
	try {
		const read = database.prepare(`
      SELECT launch_count AS launchCount, last_started_at AS lastStartedAt
      FROM app_startup WHERE id = 1
    `);
		const write = database.prepare(`
      INSERT INTO app_startup (id, launch_count, last_started_at) VALUES (1, 1, ?)
      ON CONFLICT(id) DO UPDATE SET
        launch_count = app_startup.launch_count + 1,
        last_started_at = excluded.last_started_at
      RETURNING launch_count AS launchCount, last_started_at AS lastStartedAt
    `);
		return {
			recordLaunch: database.transaction(() => startupRecordSchema.parse(write.get((/* @__PURE__ */ new Date()).toISOString()))),
			read: () => startupRecordSchema.parse(read.get()),
			close: () => {
				if (database.open) database.close();
			}
		};
	} catch (error) {
		database.close();
		throw error;
	}
}
//#endregion
//#region src/main/ipc/trusted-sender.ts
function isTrustedRequest(event, window, rendererUrl) {
	try {
		const frame = event.senderFrame;
		return !window.isDestroyed() && !window.webContents.isDestroyed() && frame !== null && !frame.isDestroyed() && event.sender === window.webContents && frame === window.webContents.mainFrame && frame.url === rendererUrl;
	} catch {
		return false;
	}
}
//#endregion
//#region src/main/ipc/application.ts
var noArgumentsSchema = require_question_bank.tuple([]);
function registerApplicationIpc(window, rendererUrl, readStatus, reportError) {
	electron.ipcMain.handle(APP_STATUS_CHANNEL, (event, ...args) => {
		if (!isTrustedRequest(event, window, rendererUrl)) return {
			ok: false,
			error: {
				code: "FORBIDDEN",
				message: "请求来源不受信任。"
			}
		};
		if (!noArgumentsSchema.safeParse(args).success) return {
			ok: false,
			error: {
				code: "INVALID_REQUEST",
				message: "此请求不接受参数。"
			}
		};
		try {
			return appStatusResultSchema.parse(readStatus());
		} catch (error) {
			reportError(error);
			return {
				ok: false,
				error: {
					code: "DATABASE_UNAVAILABLE",
					message: "无法读取本地数据，请检查数据目录权限或诊断日志后重新启动。"
				}
			};
		}
	});
	return () => electron.ipcMain.removeHandler(APP_STATUS_CHANNEL);
}
//#endregion
//#region question-banks/templates/专题模板.md?raw
var 专题模板_default = "---\nschema_version: 1\ntopic_id: your-topic\ntopic_title: 请填写专题名称\n---\n\n## question-001 | 请填写题目标题\n\n标签：请填写标签\n难度：基础\n\n### 题目\n\n请填写完整题目，包含必要背景、约束、数据或代码；不要只写章节名称。\n\n### 参考答案\n\n请填写与题目要求逐项对应的参考答案；这段占位文字不是真实参考答案。\n\n#### 适用条件与来源\n\n请按实际情况填写芯片、库版本、文档或实验条件。新增题目使用新 ID，修改已有题目时保留其 ID。\n";
//#endregion
//#region src/main/ipc/library.ts
function registerLibraryIpc(window, rendererUrl, service, reportError) {
	const contents = window.webContents;
	let closed = false;
	let paused = false;
	let lastToken;
	let themePreview;
	let operation;
	let closing;
	const channels = [
		...Object.values(require_open_database.LIBRARY_CHANNELS),
		...Object.values(require_library_import.HISTORY_CHANNELS),
		require_library_import.LEARNING_CHANNEL,
		...Object.values(require_settings_repository.SETTINGS_CHANNELS),
		require_open_database.CATEGORY_CHANNEL,
		...Object.values(require_settings_repository.PRACTICE_PLAN_CHANNELS),
		...Object.values(require_settings_repository.THEME_CHANNELS)
	];
	const noArguments = require_question_bank.tuple([]);
	function fail(code, message) {
		return {
			ok: false,
			error: {
				code,
				message
			}
		};
	}
	const unavailable = () => fail("DATABASE_UNAVAILABLE", "题库服务暂不可用，请检查本地诊断日志后重启。");
	const cancelled = () => fail("IMPORT_CANCELLED", "已取消本次操作。");
	function report(error) {
		try {
			reportError(error instanceof require_question_bank.ZodError ? /* @__PURE__ */ new Error("题库接口数据校验失败。") : error);
		} catch {}
	}
	function forgetPreview() {
		if (lastToken) service?.discard(lastToken);
		lastToken = void 0;
	}
	function invalidate() {
		operation?.controller.abort();
		forgetPreview();
		themePreview = void 0;
	}
	async function abortableDialog(open, signal, fallback) {
		let onAbort;
		const aborted = new Promise((resolve) => {
			onAbort = () => resolve(fallback);
		});
		signal.addEventListener("abort", onAbort, { once: true });
		try {
			if (signal.aborted) return fallback;
			return await Promise.race([open(), aborted]);
		} finally {
			signal.removeEventListener("abort", onAbort);
		}
	}
	async function runOperation(work) {
		if (operation) return fail("IMPORT_BUSY", "已有文件选择或准备任务，请等待或取消。");
		const job = {
			controller: new AbortController(),
			completion: Promise.resolve(null)
		};
		operation = job;
		job.completion = work(job.controller.signal);
		try {
			return await job.completion;
		} finally {
			if (operation === job) operation = void 0;
		}
	}
	function handle(channel, input, output, action, failureMessage) {
		electron.ipcMain.handle(channel, async (event, ...args) => {
			if (!isTrustedRequest(event, window, rendererUrl)) return fail("FORBIDDEN", "请求来源不受信任。");
			if (closed) return fail("SERVICE_CLOSED", "题库服务已关闭。");
			if (paused) return fail("SERVICE_CLOSED", "正在准备恢复数据，请等待完成。");
			const parsed = input.safeParse(args);
			if (!parsed.success) return fail("INVALID_REQUEST", "请求参数无效，请刷新页面后重试。");
			try {
				return output.parse(await action(parsed.data, event));
			} catch (error) {
				if (error instanceof require_settings_repository.ThemeFault) return fail(error.code, error.message);
				report(error);
				return failureMessage ? fail("DATABASE_UNAVAILABLE", failureMessage) : unavailable();
			}
		});
	}
	const settingsUnavailable = "显示设置暂不可用，请重试或检查本地诊断日志。";
	handle(require_settings_repository.THEME_CHANNELS.list, noArguments, require_settings_repository.themeCatalogResultSchema, () => service ? {
		ok: true,
		value: service.listThemes()
	} : unavailable());
	handle(require_settings_repository.THEME_CHANNELS.preview, noArguments, require_settings_repository.themePreviewResultSchema, () => {
		if (!service) return unavailable();
		if (operation) return fail("THEME_BUSY", "已有文件选择或准备任务，请等待完成。");
		themePreview = void 0;
		return runOperation(async (signal) => {
			const selected = await abortableDialog(() => electron.dialog.showOpenDialog(window, {
				title: "安装或更新本地主题",
				filters: [{
					name: "刷题本主题包",
					extensions: ["ep-theme.json"]
				}],
				properties: ["openFile"]
			}), signal, {
				canceled: true,
				filePaths: []
			});
			if (signal.aborted || selected.canceled || !selected.filePaths[0]) return fail("CANCELLED", "已取消主题导入。");
			const filePath = selected.filePaths[0];
			if (!/\.ep-theme\.json$/i.test(filePath)) return fail("INVALID_THEME", "请选择扩展名为 .ep-theme.json 的主题包。");
			let definition;
			try {
				const bytes = await require_read_file_snapshot.readFileSnapshot(filePath, require_settings_repository.MAX_THEME_BYTES);
				definition = require_settings_repository.themeDefinitionSchema.parse(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
			} catch (error) {
				if (error instanceof require_read_file_snapshot.SourceFileError) return fail("FILE_ERROR", error.code === "LIMIT_EXCEEDED" ? "主题文件超过 256 KiB 上限。" : "无法稳定读取主题文件，请检查文件后重新选择。");
				return fail("INVALID_THEME", "主题包不是受支持的 UTF-8 JSON 配置，或包含未知字段、格式版本、非法颜色或布局参数。");
			}
			if (signal.aborted) return fail("CANCELLED", "主题导入已取消。");
			themePreview = {
				token: (0, node_crypto.randomUUID)(),
				expiresAt: new Date(Date.now() + 6e5).toISOString(),
				definition,
				...service.inspectTheme(definition)
			};
			return {
				ok: true,
				value: themePreview
			};
		});
	});
	handle(require_settings_repository.THEME_CHANNELS.install, require_question_bank.tuple([require_settings_repository.themeTokenSchema]), require_settings_repository.themeCatalogResultSchema, ([{ token }]) => {
		if (!service) return unavailable();
		if (operation) return fail("THEME_BUSY", "请等待文件准备完成。");
		if (!themePreview || token !== themePreview.token || Date.parse(themePreview.expiresAt) <= Date.now()) return fail("PREVIEW_EXPIRED", "主题预览已失效，请重新选择文件。");
		return {
			ok: true,
			value: service.installTheme(themePreview.definition)
		};
	});
	handle(require_settings_repository.THEME_CHANNELS.uninstall, require_question_bank.tuple([require_settings_repository.themeRemoveSchema]), require_settings_repository.themeCatalogResultSchema, ([{ themeId }]) => {
		if (!service) return unavailable();
		if (operation) return fail("THEME_BUSY", "请等待文件准备完成。");
		return {
			ok: true,
			value: service.removeTheme(themeId)
		};
	});
	handle(require_settings_repository.PRACTICE_PLAN_CHANNELS.list, noArguments, require_settings_repository.practicePlansResultSchema, () => service ? {
		ok: true,
		value: service.listPracticePlans()
	} : unavailable());
	handle(require_settings_repository.PRACTICE_PLAN_CHANNELS.change, require_question_bank.tuple([require_settings_repository.practicePlanChangeSchema]), require_settings_repository.practicePlanChangeResultSchema, ([change]) => {
		if (!service) return unavailable();
		try {
			service.changePracticePlan(change);
			return {
				ok: true,
				value: null
			};
		} catch (error) {
			if (error instanceof require_library_import.PracticePlanFault) return fail(error.code, error.message);
			throw error;
		}
	});
	handle(require_open_database.CATEGORY_CHANNEL, require_question_bank.tuple([require_open_database.categoryChangeSchema]), require_open_database.emptyResultSchema, ([change]) => {
		if (!service) return unavailable();
		try {
			service.updateCategory(change);
			return {
				ok: true,
				value: null
			};
		} catch (error) {
			if (error instanceof require_library_import.CategoryFault) return fail(error.code, error.message);
			throw error;
		}
	});
	handle(require_settings_repository.SETTINGS_CHANNELS.read, noArguments, require_settings_repository.settingsResultSchema, () => service ? {
		ok: true,
		value: service.readSettings()
	} : fail("DATABASE_UNAVAILABLE", settingsUnavailable), settingsUnavailable);
	handle(require_settings_repository.SETTINGS_CHANNELS.save, require_question_bank.tuple([require_settings_repository.appearanceSchema]), require_settings_repository.settingsResultSchema, ([settings]) => service ? {
		ok: true,
		value: service.saveSettings(settings)
	} : fail("DATABASE_UNAVAILABLE", settingsUnavailable), settingsUnavailable);
	handle(require_open_database.LIBRARY_CHANNELS.previewImport, noArguments, require_open_database.previewImportResultSchema, (_args, event) => {
		if (!service) return unavailable();
		if (operation) return fail("IMPORT_BUSY", "已有文件选择或准备任务。");
		forgetPreview();
		return runOperation(async (signal) => {
			const selected = await abortableDialog(() => electron.dialog.showOpenDialog(window, {
				title: "选择题库 Markdown",
				filters: [{
					name: "Markdown 题库",
					extensions: ["md"]
				}],
				properties: ["openFile", "multiSelections"]
			}), signal, {
				canceled: true,
				filePaths: []
			});
			if (signal.aborted || selected.canceled || !isTrustedRequest(event, window, rendererUrl)) return cancelled();
			const result = await service.preview(selected.filePaths, signal);
			if (signal.aborted || !isTrustedRequest(event, window, rendererUrl)) {
				if (result.ok) service.discard(result.value.token);
				return cancelled();
			}
			if (result.ok) lastToken = result.value.token;
			return result;
		});
	});
	handle(require_open_database.LIBRARY_CHANNELS.cancelImport, noArguments, require_open_database.emptyResultSchema, () => {
		invalidate();
		return {
			ok: true,
			value: null
		};
	});
	handle(require_open_database.LIBRARY_CHANNELS.commitImport, require_question_bank.tuple([require_open_database.previewTokenSchema]), require_open_database.commitImportResultSchema, ([token]) => {
		if (!service) return unavailable();
		if (operation) return fail("IMPORT_BUSY", "请等待文件准备完成。");
		if (token !== lastToken) return fail("INVALID_TOKEN", "预览已失效，请重新预览。");
		return service.commit(token);
	});
	handle(require_open_database.LIBRARY_CHANNELS.discardImport, require_question_bank.tuple([require_open_database.previewTokenSchema]), require_open_database.emptyResultSchema, ([token]) => {
		if (!service) return unavailable();
		if (token !== lastToken) return fail("INVALID_TOKEN", "预览已失效。");
		const result = service.discard(token);
		lastToken = void 0;
		return result;
	});
	handle(require_open_database.LIBRARY_CHANNELS.listQuestions, require_question_bank.tuple([require_open_database.listRequestSchema]), require_open_database.listResultSchema, ([request]) => service ? {
		ok: true,
		value: service.listQuestions(request)
	} : unavailable());
	handle(require_library_import.LEARNING_CHANNEL, require_question_bank.tuple([require_library_import.learningScopeSchema]), require_library_import.learningResultSchema, ([scope]) => service ? {
		ok: true,
		value: service.readLearningSummary(scope)
	} : unavailable());
	handle(require_library_import.HISTORY_CHANNELS.list, require_question_bank.tuple([require_library_import.historyListRequestSchema]), require_library_import.historyListResultSchema, ([request]) => {
		if (!service) return unavailable();
		const value = service.listHistory(request);
		return value ? {
			ok: true,
			value
		} : fail("NOT_FOUND", "题目不存在，无法读取历史。");
	});
	handle(require_library_import.HISTORY_CHANNELS.getEntry, require_question_bank.tuple([require_library_import.historyEntryRequestSchema]), require_library_import.historyEntryResultSchema, ([request]) => {
		if (!service) return unavailable();
		const value = service.getHistoryEntry(request);
		return value ? {
			ok: true,
			value
		} : fail("NOT_FOUND", "历史记录不存在，请重新读取。");
	});
	handle(require_open_database.LIBRARY_CHANNELS.setFavorite, require_question_bank.tuple([require_open_database.favoriteRequestSchema]), require_open_database.favoriteResultSchema, ([setting]) => {
		if (!service) return unavailable();
		const value = service.setFavorite(setting);
		return value ? {
			ok: true,
			value
		} : fail("NOT_FOUND", "题目不存在，请刷新题库。");
	});
	handle(require_open_database.LIBRARY_CHANNELS.getQuestion, require_question_bank.tuple([require_open_database.identitySchema]), require_open_database.questionResultSchema, ([identity]) => {
		if (!service) return unavailable();
		const value = service.getQuestion(identity);
		return value ? {
			ok: true,
			value
		} : fail("NOT_FOUND", "题目不存在，请刷新题库。");
	});
	handle(require_open_database.LIBRARY_CHANNELS.getAnswer, require_question_bank.tuple([require_open_database.versionIdentitySchema]), require_open_database.answerResultSchema, ([identity]) => {
		if (!service) return unavailable();
		const value = service.getAnswer(identity);
		return value ? {
			ok: true,
			value
		} : fail("NOT_FOUND", "题目版本不存在，请重新选择题目。");
	});
	handle(require_open_database.LIBRARY_CHANNELS.exportTemplate, noArguments, require_open_database.emptyResultSchema, () => runOperation(async (signal) => {
		const selected = await abortableDialog(() => electron.dialog.showSaveDialog(window, {
			title: "导出题库模板",
			defaultPath: "专题模板.md",
			filters: [{
				name: "Markdown",
				extensions: ["md"]
			}]
		}), signal, {
			canceled: true,
			filePath: ""
		});
		if (signal.aborted || selected.canceled) return cancelled();
		if (!selected.filePath || !(0, node_path.isAbsolute)(selected.filePath)) return fail("FILE_ERROR", "请选择有效的模板保存位置。");
		try {
			await (0, node_fs_promises.writeFile)(selected.filePath, 专题模板_default, "utf8");
			return {
				ok: true,
				value: null
			};
		} catch (error) {
			report(error);
			return fail("FILE_ERROR", "模板保存失败，请检查目标目录权限后重试。");
		}
	}));
	handle(require_open_database.LIBRARY_CHANNELS.openReference, require_question_bank.tuple([require_question_bank.string().max(4096)]), require_open_database.emptyResultSchema, async ([input]) => {
		const url = externalHttpUrl(input);
		if (!url) return fail("INVALID_REQUEST", "仅支持无登录凭据的 HTTP/HTTPS 参考链接。");
		await electron.shell.openExternal(url);
		return {
			ok: true,
			value: null
		};
	});
	handle(require_open_database.LIBRARY_CHANNELS.copyCode, require_question_bank.tuple([require_question_bank.string().max(1048576)]), require_open_database.emptyResultSchema, ([text]) => {
		try {
			electron.clipboard.writeText(text);
			return {
				ok: true,
				value: null
			};
		} catch (error) {
			report(error);
			return fail("FILE_ERROR", "代码复制失败，请重新选择文字后复制。");
		}
	});
	function onNavigation(_event, _url, _inPlace, isMainFrame) {
		if (isMainFrame) invalidate();
	}
	contents.on("did-start-navigation", onNavigation);
	contents.on("render-process-gone", invalidate);
	contents.once("destroyed", invalidate);
	return {
		async pause() {
			paused = true;
			invalidate();
			await operation?.completion;
		},
		resume() {
			if (!closed) paused = false;
		},
		close() {
			if (closing) return closing;
			closed = true;
			invalidate();
			for (const channel of channels) electron.ipcMain.removeHandler(channel);
			contents.removeListener("did-start-navigation", onNavigation);
			contents.removeListener("render-process-gone", invalidate);
			contents.removeListener("destroyed", invalidate);
			closing = Promise.resolve(operation?.completion).then(() => {}, report);
			return closing;
		}
	};
}
//#endregion
//#region src/shared/contracts/practice-desktop.ts
var PRACTICE_CHANNELS = {
	read: "practice:read",
	start: "practice:start",
	saveDraft: "practice:save-draft",
	reveal: "practice:reveal",
	rateAndAdvance: "practice:rate-and-advance",
	navigate: "practice:navigate",
	end: "practice:end",
	ready: "practice:ready",
	finishClose: "practice:finish-close",
	beforeClose: "practice:before-close",
	closeCancelled: "practice:close-cancelled"
};
var errorSchema = require_question_bank.strictObject({
	code: require_open_database.practiceErrorCodeSchema.or(require_question_bank.literal("FORBIDDEN")),
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
var practiceReadResultSchema = resultSchema(require_open_database.practiceViewSchema.nullable());
var practiceCommandResultSchema = resultSchema(require_open_database.practiceAckSchema);
var practiceDraftResultSchema = resultSchema(require_open_database.draftAckSchema);
var practiceEmptyResultSchema = resultSchema(require_question_bank._null());
var closeResponseSchema = require_question_bank.strictObject({ requestId: require_open_database.practiceIdSchema }).extend({ saved: require_question_bank.boolean() });
//#endregion
//#region src/main/ipc/practice.ts
function registerPracticeIpc(window, rendererUrl, service, reportError, closeTimeoutMs = 1e4) {
	const contents = window.webContents;
	let closed = false;
	let ready = false;
	let paused = false;
	let pending;
	const handled = [];
	const fail = (code, message) => ({
		ok: false,
		error: {
			code,
			message
		}
	});
	function report(error) {
		try {
			reportError(error instanceof require_question_bank.ZodError ? /* @__PURE__ */ new Error("练习桌面接口校验失败。") : error);
		} catch {}
	}
	function settle(saved) {
		if (!pending) return;
		const job = pending;
		pending = void 0;
		clearTimeout(job.timer);
		job.resolve(saved);
	}
	function handle(channel, input, output, work) {
		electron.ipcMain.handle(channel, async (event, ...args) => {
			if (!isTrustedRequest(event, window, rendererUrl)) return fail("FORBIDDEN", "请求来源不受信任。");
			if (closed) return fail("SERVICE_CLOSED", "练习服务已关闭。");
			const parsed = input.safeParse(args);
			if (!parsed.success) return fail("INVALID_REQUEST", "练习请求参数无效，请保留输入并重新读取。");
			try {
				return output.parse(await work(parsed.data));
			} catch (error) {
				report(error);
				return fail("DATABASE_UNAVAILABLE", "无法确认练习请求结果，请保留输入并重试原操作。");
			}
		});
		handled.push(channel);
	}
	function business(channel, input, output, work) {
		handle(channel, require_question_bank.tuple([input]), output, ([request]) => paused ? fail("SERVICE_CLOSED", "正在准备恢复数据，请等待完成。") : work ? work(request) : fail("DATABASE_UNAVAILABLE", "练习服务暂不可用，请检查诊断日志后重启。"));
	}
	business(PRACTICE_CHANNELS.read, require_open_database.readPracticeSchema, practiceReadResultSchema, service?.read);
	business(PRACTICE_CHANNELS.start, require_open_database.startPracticeSchema, practiceCommandResultSchema, service?.start);
	business(PRACTICE_CHANNELS.saveDraft, require_open_database.saveDraftSchema, practiceDraftResultSchema, service?.saveDraft);
	business(PRACTICE_CHANNELS.reveal, require_open_database.revealPracticeSchema, practiceCommandResultSchema, service?.reveal);
	business(PRACTICE_CHANNELS.rateAndAdvance, require_open_database.ratePracticeSchema, practiceCommandResultSchema, service?.rateAndAdvance);
	business(PRACTICE_CHANNELS.navigate, require_open_database.navigatePracticeSchema, practiceCommandResultSchema, service?.navigate);
	business(PRACTICE_CHANNELS.end, require_open_database.endPracticeSchema, practiceCommandResultSchema, service?.end);
	handle(PRACTICE_CHANNELS.ready, require_question_bank.tuple([]), practiceEmptyResultSchema, () => {
		ready = true;
		return {
			ok: true,
			value: null
		};
	});
	handle(PRACTICE_CHANNELS.finishClose, require_question_bank.tuple([closeResponseSchema]), practiceEmptyResultSchema, ([response]) => {
		if (!pending || response.requestId !== pending.requestId) return fail("INVALID_REQUEST", "关闭保存请求已失效。");
		settle(response.saved);
		return {
			ok: true,
			value: null
		};
	});
	function invalidate() {
		ready = false;
		settle(false);
	}
	function onNavigation(_event, _url, _inPlace, isMainFrame) {
		if (isMainFrame) invalidate();
	}
	contents.on("did-start-navigation", onNavigation);
	contents.on("render-process-gone", invalidate);
	contents.once("destroyed", invalidate);
	return {
		pause() {
			paused = true;
		},
		resume() {
			paused = false;
			if (!closed && !contents.isDestroyed()) contents.send(PRACTICE_CHANNELS.closeCancelled);
		},
		requestClose() {
			if (pending) return pending.promise;
			if (closed) return Promise.resolve(false);
			if (!ready || contents.isDestroyed()) return Promise.resolve(true);
			let resolve;
			const promise = new Promise((done) => {
				resolve = done;
			});
			const requestId = (0, node_crypto.randomUUID)();
			pending = {
				requestId,
				promise,
				resolve,
				timer: setTimeout(() => settle(false), closeTimeoutMs)
			};
			try {
				contents.send(PRACTICE_CHANNELS.beforeClose, { requestId });
			} catch (error) {
				report(error);
				settle(false);
			}
			return promise;
		},
		close() {
			if (closed) return;
			closed = true;
			settle(false);
			for (const channel of handled) electron.ipcMain.removeHandler(channel);
			contents.removeListener("did-start-navigation", onNavigation);
			contents.removeListener("render-process-gone", invalidate);
			contents.removeListener("destroyed", invalidate);
		}
	};
}
//#endregion
//#region src/main/ipc/backup.ts
function registerBackupIpc(window, rendererUrl, service, reportError, restore) {
	const contents = window.webContents;
	const noArguments = require_question_bank.tuple([]);
	let closed = false;
	let pending;
	let lastPreview;
	let generation = 0;
	let selection;
	let closing;
	const fail = (code, message) => ({
		ok: false,
		error: {
			code,
			message
		}
	});
	const cancelled = () => fail("CANCELLED", "已取消本次备份操作。");
	async function choose(work, fallback) {
		const controller = new AbortController();
		selection = controller;
		let abort;
		const stopped = new Promise((resolve) => {
			abort = () => resolve(fallback);
		});
		controller.signal.addEventListener("abort", abort, { once: true });
		try {
			return await Promise.race([work(), stopped]);
		} finally {
			controller.signal.removeEventListener("abort", abort);
			if (selection === controller) selection = void 0;
		}
	}
	for (const operation of [
		"export",
		"preview",
		"restore"
	]) electron.ipcMain.handle(require_restore_files.BACKUP_CHANNELS[operation], (event, ...args) => {
		if (!isTrustedRequest(event, window, rendererUrl)) return fail("FORBIDDEN", "请求来源不受信任。");
		if (closed) return fail("SERVICE_CLOSED", "备份服务已关闭。");
		const request = operation === "restore" ? require_question_bank.tuple([require_restore_files.restoreRequestSchema]).safeParse(args) : void 0;
		if (operation === "restore" ? !request?.success : !noArguments.safeParse(args).success) return fail("INVALID_REQUEST", "备份操作不接受路径或其他参数，请从窗口选择文件。");
		if (!service) return fail("DATABASE_UNAVAILABLE", "本地数据不可用，无法执行备份操作。");
		if (pending) return fail("BACKUP_BUSY", "已有备份操作，请等待完成或取消文件选择。");
		const epoch = generation;
		const job = (async () => {
			try {
				if (operation === "restore") {
					const token = request?.success ? request.data[0].token : "";
					if (!restore || !lastPreview || token !== lastPreview.token) return fail("PREVIEW_EXPIRED", "恢复预览已失效，请重新选择备份并校验。");
					const selected = lastPreview;
					if ((await choose(() => electron.dialog.showMessageBox(window, {
						type: "warning",
						title: "确认恢复完整备份",
						message: "恢复将替换当前题库、学习记录、练习进度和显示设置，并重启应用。",
						detail: `备份：${selected.filePath}\n题目：${selected.summary.questions}，图片：${selected.summary.images}\n备份时间：${selected.summary.createdAt ?? "未知（旧备份）"}\n程序将先保存待保存内容并创建当前数据的保护性备份。保护失败时停止恢复。`,
						buttons: ["取消", "创建保护备份并恢复"],
						defaultId: 0,
						cancelId: 0,
						noLink: true
					}), {
						response: 0,
						checkboxChecked: false
					})).response !== 1 || closed || epoch !== generation || !isTrustedRequest(event, window, rendererUrl)) return cancelled();
					const value = await restore(token);
					lastPreview = void 0;
					return require_restore_files.restoreResultSchema.parse({
						ok: true,
						value
					});
				}
				lastPreview = void 0;
				await service.discardPreview();
				if (closed || epoch !== generation || !isTrustedRequest(event, window, rendererUrl)) return cancelled();
				let path;
				if (operation === "export") {
					const chosen = await choose(() => electron.dialog.showSaveDialog(window, {
						title: "导出完整备份",
						defaultPath: `嵌入式刷题本-备份-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}.sqlite3`,
						filters: [{
							name: "完整数据备份",
							extensions: ["sqlite3"]
						}]
					}), {
						canceled: true,
						filePath: ""
					});
					if (chosen.canceled) return cancelled();
					path = chosen.filePath;
				} else {
					const chosen = await choose(() => electron.dialog.showOpenDialog(window, {
						title: "选择备份并预览",
						filters: [{
							name: "数据备份",
							extensions: [
								"sqlite3",
								"sqlite",
								"db"
							]
						}],
						properties: ["openFile"]
					}), {
						canceled: true,
						filePaths: []
					});
					if (chosen.canceled || chosen.filePaths.length !== 1) return cancelled();
					path = chosen.filePaths[0];
				}
				if (closed || !isTrustedRequest(event, window, rendererUrl)) return cancelled();
				if (!path || !(0, node_path.isAbsolute)(path)) return fail("FILE_ERROR", "请选择有效的备份文件位置。");
				const value = await service[operation](path);
				if (operation === "preview") {
					if (closed || epoch !== generation || !isTrustedRequest(event, window, rendererUrl)) {
						await service.discardPreview();
						return cancelled();
					}
					const result = require_restore_files.backupPreviewResultSchema.parse({
						ok: true,
						value
					});
					if (result.ok) lastPreview = result.value;
					return result;
				}
				return require_restore_files.backupResultSchema.parse({
					ok: true,
					value
				});
			} catch (error) {
				if (error instanceof require_restore_files.BackupFault) return fail(error.code, error.message);
				try {
					reportError(/* @__PURE__ */ new Error(`备份操作 ${operation} 失败。`));
				} catch {}
				if (operation === "restore") return fail("RESTORE_FAILED", "恢复未完成，原数据保留。请重新预览并检查保护性备份。");
				return operation === "export" ? fail("EXPORT_FAILED", "备份导出失败。请检查目标目录权限和磁盘空间后重试，原数据及已有备份保留。") : fail("INVALID_BACKUP", "无法读取完整备份。请检查文件权限、文件完整性及结构兼容性后重新选择。");
			}
		})();
		pending = job;
		return job.finally(() => {
			if (pending === job) pending = void 0;
		});
	});
	function invalidate() {
		generation++;
		lastPreview = void 0;
		selection?.abort();
		service?.discardPreview().catch(() => {});
	}
	function onNavigation(_event, _url, _inPlace, isMainFrame) {
		if (isMainFrame) invalidate();
	}
	contents.on("did-start-navigation", onNavigation);
	contents.on("render-process-gone", invalidate);
	contents.once("destroyed", invalidate);
	return { close() {
		closed = true;
		invalidate();
		closing ??= (async () => {
			for (const channel of Object.values(require_restore_files.BACKUP_CHANNELS)) electron.ipcMain.removeHandler(channel);
			contents.removeListener("did-start-navigation", onNavigation);
			contents.removeListener("render-process-gone", invalidate);
			contents.removeListener("destroyed", invalidate);
			await pending;
		})();
		return closing;
	} };
}
//#endregion
//#region src/shared/contracts/data-locations.ts
var DATA_LOCATION_CHANNELS = {
	read: "data-locations:read",
	open: "data-locations:open"
};
var directoryTargetSchema = require_question_bank._enum([
	"data",
	"backups",
	"logs"
]);
var location = require_question_bank.string().min(1).max(32767).refine((value) => !value.includes("\0"));
var dataLocationsSchema = require_question_bank.strictObject({
	dataDirectory: location,
	backupDirectory: location,
	logDirectory: location,
	logFile: location
});
var dataLocationErrorSchema = require_question_bank.strictObject({
	code: require_question_bank._enum([
		"FORBIDDEN",
		"INVALID_REQUEST",
		"SERVICE_CLOSED",
		"LOCATION_BUSY",
		"FILE_ERROR"
	]),
	message: require_question_bank.string().min(1)
});
function result(value) {
	return require_question_bank.discriminatedUnion("ok", [require_question_bank.strictObject({
		ok: require_question_bank.literal(true),
		value
	}), require_question_bank.strictObject({
		ok: require_question_bank.literal(false),
		error: dataLocationErrorSchema
	})]);
}
var dataLocationsResultSchema = result(dataLocationsSchema);
result(require_question_bank._null());
//#endregion
//#region src/main/ipc/data-locations.ts
function registerDataLocationsIpc(window, rendererUrl, dataDirectory, reportError) {
	if (!(0, node_path.isAbsolute)(dataDirectory)) throw new Error("数据位置需要绝对目录。");
	const directory = (0, node_path.resolve)(dataDirectory);
	const contents = window.webContents;
	const locations = {
		dataDirectory: directory,
		backupDirectory: (0, node_path.join)(directory, "backups"),
		logDirectory: (0, node_path.join)(directory, "logs"),
		logFile: (0, node_path.join)(directory, "logs", "application.log")
	};
	let closed = false;
	let paused = false;
	let generation = 0;
	let pending;
	let closing;
	const fail = (code, message) => ({
		ok: false,
		error: {
			code,
			message
		}
	});
	const unavailable = () => fail("SERVICE_CLOSED", "数据位置操作已停止，请等待恢复完成或重新打开页面。");
	function report() {
		try {
			reportError(/* @__PURE__ */ new Error("本地数据位置操作失败。"));
		} catch {}
	}
	function allowed(event, epoch) {
		return !closed && !paused && generation === epoch && isTrustedRequest(event, window, rendererUrl);
	}
	electron.ipcMain.handle(DATA_LOCATION_CHANNELS.read, (event, ...args) => {
		if (!isTrustedRequest(event, window, rendererUrl)) return fail("FORBIDDEN", "请求来源不受信任。");
		if (closed || paused) return unavailable();
		if (!require_question_bank.tuple([]).safeParse(args).success) return fail("INVALID_REQUEST", "读取数据位置不接受参数。");
		try {
			return dataLocationsResultSchema.parse({
				ok: true,
				value: locations
			});
		} catch {
			report();
			return fail("FILE_ERROR", "无法读取数据位置，请重试或检查本地诊断日志。");
		}
	});
	electron.ipcMain.handle(DATA_LOCATION_CHANNELS.open, (event, ...args) => {
		if (!isTrustedRequest(event, window, rendererUrl)) return fail("FORBIDDEN", "请求来源不受信任。");
		if (closed || paused) return unavailable();
		const input = require_question_bank.tuple([directoryTargetSchema]).safeParse(args);
		if (!input.success) return fail("INVALID_REQUEST", "只能打开固定的数据、备份或日志文件夹。");
		if (pending) return fail("LOCATION_BUSY", "正在打开文件夹，请等待完成。");
		const epoch = generation;
		const target = input.data[0];
		const job = (async () => {
			try {
				const root = await (0, node_fs_promises.realpath)(directory);
				if (!allowed(event, epoch)) return unavailable();
				const folder = target === "data" ? root : (0, node_path.join)(root, target);
				if (target !== "data") {
					await (0, node_fs_promises.mkdir)(folder).catch((error) => {
						if (!(error instanceof Error && "code" in error && error.code === "EEXIST")) throw error;
					});
					if (!allowed(event, epoch)) return unavailable();
				}
				const entry = await (0, node_fs_promises.lstat)(folder);
				if (!allowed(event, epoch)) return unavailable();
				if (!entry.isDirectory() || entry.isSymbolicLink()) throw new Error("目标不是独立文件夹。");
				const actual = await (0, node_fs_promises.realpath)(folder);
				if ((0, node_path.relative)(folder, actual) !== "") throw new Error("文件夹位置发生变化。");
				if (!allowed(event, epoch)) return unavailable();
				const error = await electron.shell.openPath(actual);
				if (!allowed(event, epoch)) return unavailable();
				if (error !== "") throw new Error("系统未能打开文件夹。");
				return {
					ok: true,
					value: null
				};
			} catch {
				if (!allowed(event, epoch)) return unavailable();
				report();
				return fail("FILE_ERROR", "无法打开文件夹，请检查目录是否可用及访问权限后重试。");
			}
		})();
		pending = job;
		return job.finally(() => {
			if (pending === job) pending = void 0;
		});
	});
	function invalidate() {
		generation++;
	}
	function onNavigation(_event, _url, _inPlace, isMainFrame) {
		if (isMainFrame) invalidate();
	}
	contents.on("did-start-navigation", onNavigation);
	contents.on("render-process-gone", invalidate);
	contents.once("destroyed", invalidate);
	return {
		async pause() {
			paused = true;
			invalidate();
			await pending;
		},
		resume() {
			if (!closed) paused = false;
		},
		close() {
			closed = true;
			invalidate();
			closing ??= (async () => {
				for (const channel of Object.values(DATA_LOCATION_CHANNELS)) electron.ipcMain.removeHandler(channel);
				contents.removeListener("did-start-navigation", onNavigation);
				contents.removeListener("render-process-gone", invalidate);
				contents.removeListener("destroyed", invalidate);
				await pending;
			})();
			return closing;
		}
	};
}
//#endregion
//#region src/main/services/resources/image-protocol.ts
function registerImageProtocol(session, read, reportError) {
	session.protocol.handle(IMAGE_SCHEME, (request) => {
		const identity = parseImageResourceUrl(request.url);
		if (request.method !== "GET" || !identity) return new Response(null, { status: 404 });
		try {
			const image = read(identity.versionId, identity.hash);
			if (!image) return new Response(null, { status: 404 });
			return new Response(new Uint8Array(image.bytes).buffer, { headers: {
				"Content-Type": image.mime,
				"X-Content-Type-Options": "nosniff",
				"Cache-Control": "no-store"
			} });
		} catch (error) {
			try {
				reportError(error);
			} catch {}
			return new Response(null, { status: 500 });
		}
	});
	return () => session.protocol.unhandle(IMAGE_SCHEME);
}
//#endregion
//#region src/main/window.ts
function createMainWindow() {
	const developmentUrl = !electron.app.isPackaged ? process.env["ELECTRON_RENDERER_URL"] : void 0;
	const renderer = developmentUrl ? new URL(developmentUrl) : (0, node_url.pathToFileURL)((0, node_path.join)(__dirname, "../renderer/index.html"));
	if (developmentUrl && (renderer.protocol !== "http:" || renderer.hostname !== "127.0.0.1")) throw new Error("开发页面只允许使用本机回环 HTTP 地址。");
	const rendererUrl = renderer.href;
	const window = new electron.BrowserWindow({
		width: 1140,
		height: 780,
		minWidth: 900,
		minHeight: 620,
		show: false,
		backgroundColor: "#f6f7fb",
		webPreferences: {
			preload: (0, node_path.join)(__dirname, "../preload/index.js"),
			contextIsolation: true,
			sandbox: true,
			nodeIntegration: false,
			webSecurity: true
		}
	});
	window.removeMenu();
	window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
	window.webContents.on("will-navigate", (event, destination) => {
		if (destination !== rendererUrl) event.preventDefault();
	});
	window.webContents.on("will-attach-webview", (event) => event.preventDefault());
	window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => {
		callback(false);
	});
	window.webContents.session.setPermissionCheckHandler(() => false);
	window.once("ready-to-show", () => window.show());
	return {
		window,
		rendererUrl
	};
}
//#endregion
//#region src/main/index.ts
var store;
var unregisterIpc;
var library;
var libraryIpc;
var unregisterImages;
var practice;
var practiceIpc;
var backup;
var backupIpc;
var dataLocationsIpc;
var closeAttempt;
var stopping = false;
var quitAllowed = false;
var cleanup;
var starting;
var restoring = false;
electron.protocol.registerSchemesAsPrivileged([{
	scheme: IMAGE_SCHEME,
	privileges: {
		standard: true,
		secure: true
	}
}]);
function reportError(error) {
	try {
		const logDirectory = (0, node_path.join)(electron.app.getPath("userData"), "logs");
		(0, node_fs.mkdirSync)(logDirectory, { recursive: true });
		const detail = error instanceof Error ? error.stack ?? error.message : String(error);
		(0, node_fs.appendFileSync)((0, node_path.join)(logDirectory, "application.log"), `${(/* @__PURE__ */ new Date()).toISOString()} ${detail}\n`);
	} catch {
		console.error("无法写入本地诊断日志，请检查数据目录权限。");
	}
}
async function closeDataResources() {
	const failures = [];
	for (const release of [
		async () => {
			await dataLocationsIpc?.close();
			dataLocationsIpc = void 0;
		},
		() => {
			unregisterIpc?.();
			unregisterIpc = void 0;
		},
		async () => {
			await backup?.close();
			backup = void 0;
		},
		() => {
			practiceIpc?.close();
			practiceIpc = void 0;
		},
		() => {
			practice?.close();
			practice = void 0;
		},
		async () => {
			await libraryIpc?.close();
			libraryIpc = void 0;
		},
		() => {
			unregisterImages?.();
			unregisterImages = void 0;
		},
		async () => {
			await library?.close();
			library = void 0;
		},
		() => {
			store?.close();
			store = void 0;
		}
	]) try {
		await release();
	} catch (error) {
		reportError(error);
		failures.push(error);
	}
	if (failures.length) throw new Error("数据库连接未全部确认关闭，停止替换。");
}
function closeResources() {
	cleanup ??= (async () => {
		await starting?.catch(() => {});
		await backupIpc?.close().catch(reportError);
		backupIpc = void 0;
		await closeDataResources().catch(reportError);
	})();
	return cleanup;
}
function requestQuit() {
	if (closeAttempt || quitAllowed || restoring) return;
	closeAttempt = (async () => {
		if (!(await practiceIpc?.requestClose() ?? true)) {
			const window = electron.BrowserWindow.getAllWindows()[0];
			if (window && !window.isDestroyed()) {
				if ((await electron.dialog.showMessageBox(window, {
					type: "warning",
					title: "尚未确认保存",
					message: "本次保存未完成或结果无法确认。返回窗口可保留输入并重试。",
					buttons: ["返回窗口", "放弃未保存内容并退出"],
					defaultId: 0,
					cancelId: 0,
					noLink: true
				})).response !== 1) return;
			}
		}
		stopping = true;
		await closeResources();
		quitAllowed = true;
		electron.app.quit();
	})().catch(reportError).finally(() => {
		closeAttempt = void 0;
	});
}
function restartApplication() {
	const args = process.argv.slice(1).filter((argument) => !/^--(?:inspect(?:-brk)?|remote-debugging-port)(?:=|$)/.test(argument));
	setTimeout(() => {
		try {
			electron.app.relaunch({ args });
		} catch {
			electron.dialog.showErrorBox("请重新启动应用", "数据已经安全关闭，请手动重新启动嵌入式刷题本。");
		}
		quitAllowed = true;
		electron.app.exit(0);
	}, 100);
}
async function restoreBackup(token) {
	if (restoring || closeAttempt || stopping) throw new require_restore_files.BackupFault("BACKUP_BUSY", "应用正在关闭或恢复，请等待完成。");
	if (!backup || !library || !practice || !store || !practiceIpc || !libraryIpc) throw new require_restore_files.BackupFault("DATABASE_UNAVAILABLE", "本地数据服务不完整，请重启后再恢复。");
	restoring = true;
	let plan;
	let closingStarted = false;
	try {
		if (!await practiceIpc?.requestClose()) throw new require_restore_files.BackupFault("SAVE_FAILED", "待保存内容尚未确认，已停止恢复。请返回练习或显示设置重试保存。");
		practiceIpc.pause();
		await dataLocationsIpc?.pause();
		await libraryIpc?.pause();
		plan = await backup.prepareRestore(token);
		closingStarted = true;
		stopping = true;
		await closeDataResources();
		await require_restore_files.replaceDatabase((0, node_path.join)(electron.app.getPath("userData"), "practice.sqlite3"), plan.candidatePath, plan.candidateHash, reportError);
		restartApplication();
		return { protectionPath: plan.protectionPath };
	} catch (error) {
		if (closingStarted) {
			const fatal = error instanceof require_restore_files.BackupFault && error.code === "RECOVERY_FAILED";
			await electron.dialog.showMessageBox({
				type: "error",
				title: fatal ? "恢复需要人工检查" : "恢复未完成",
				message: fatal ? error.message : "原数据已保留或回退。应用将重启，请重新选择备份。",
				detail: `保护性备份：${plan?.protectionPath ?? "未创建"}${fatal ? "\n请保留恢复事务目录及所有原文件，检查诊断日志。" : ""}`,
				buttons: [fatal ? "退出并保留数据" : "重启应用"],
				noLink: true
			});
			if (fatal) setTimeout(() => electron.app.exit(1), 100);
			else restartApplication();
		} else {
			practiceIpc?.resume();
			libraryIpc?.resume();
			dataLocationsIpc?.resume();
		}
		if (error instanceof require_restore_files.BackupFault) throw error;
		reportError(/* @__PURE__ */ new Error("恢复准备或连接关闭失败，未继续替换。"));
		throw new require_restore_files.BackupFault("RESTORE_FAILED", "恢复未完成，原数据保留。请检查保护性备份及本地诊断日志后重试。");
	} finally {
		await plan?.release();
		if (!closingStarted) restoring = false;
	}
}
async function startApplication() {
	const dataDirectory = process.env["EMBEDDED_PRACTICE_TEST_DATA_DIR"] ?? (0, node_path.join)(electron.app.getPath("appData"), electron.app.isPackaged ? "embedded-practice" : "embedded-practice-dev");
	if (!(0, node_path.isAbsolute)(dataDirectory)) throw new Error("数据目录必须是绝对路径。");
	(0, node_fs.mkdirSync)((0, node_path.join)(dataDirectory, "session"), { recursive: true });
	electron.app.setPath("userData", dataDirectory);
	electron.app.setPath("sessionData", (0, node_path.join)(dataDirectory, "session"));
	if (!electron.app.requestSingleInstanceLock()) {
		electron.app.quit();
		return;
	}
	electron.app.on("second-instance", () => {
		const window = electron.BrowserWindow.getAllWindows()[0];
		if (!window) return;
		if (window.isMinimized()) window.restore();
		window.show();
		window.focus();
	});
	await electron.app.whenReady();
	if (stopping) return;
	electron.app.setAppUserModelId("local.embeddedPractice");
	await require_restore_files.recoverDatabaseReplacement((0, node_path.join)(dataDirectory, "practice.sqlite3"));
	try {
		const opened = await openStartupStore((0, node_path.join)(dataDirectory, "practice.sqlite3"));
		if (stopping) {
			opened.close();
			return;
		}
		store = opened;
		store.recordLaunch();
	} catch (error) {
		reportError(error);
		store?.close();
		store = void 0;
	}
	if (store) try {
		const opened = await require_library_import.openLibraryImportService((0, node_path.join)(dataDirectory, "practice.sqlite3"), reportError);
		if (stopping) {
			await opened.close();
			return;
		}
		library = opened;
	} catch (error) {
		reportError(error);
	}
	if (stopping) return;
	if (store) try {
		const opened = await require_practice.openPracticeService((0, node_path.join)(dataDirectory, "practice.sqlite3"), reportError);
		if (stopping) {
			opened.close();
			return;
		}
		practice = opened;
	} catch (error) {
		reportError(error);
	}
	if (stopping) return;
	if (store) try {
		const opened = await require_backup.openBackupService((0, node_path.join)(dataDirectory, "practice.sqlite3"), electron.app.getVersion(), reportError);
		if (stopping) {
			await opened.close();
			return;
		}
		backup = opened;
	} catch (error) {
		reportError(error);
	}
	if (stopping) return;
	const { window, rendererUrl } = createMainWindow();
	window.on("close", (event) => {
		if (quitAllowed) return;
		event.preventDefault();
		requestQuit();
	});
	unregisterIpc = registerApplicationIpc(window, rendererUrl, () => store ? {
		ok: true,
		value: {
			appVersion: electron.app.getVersion(),
			...store.read()
		}
	} : {
		ok: false,
		error: {
			code: "DATABASE_UNAVAILABLE",
			message: "本地数据暂不可用，请检查数据目录权限或诊断日志后重启。原数据库会保留。"
		}
	}, reportError);
	libraryIpc = registerLibraryIpc(window, rendererUrl, library, reportError);
	practiceIpc = registerPracticeIpc(window, rendererUrl, practice, reportError);
	dataLocationsIpc = registerDataLocationsIpc(window, rendererUrl, electron.app.getPath("userData"), reportError);
	backupIpc = registerBackupIpc(window, rendererUrl, backup, reportError, restoreBackup);
	unregisterImages = registerImageProtocol(window.webContents.session, (versionId, hash) => library?.readImage(versionId, hash), reportError);
	await window.loadURL(rendererUrl);
}
electron.app.on("window-all-closed", () => electron.app.quit());
electron.app.on("before-quit", (event) => {
	if (quitAllowed) return;
	event.preventDefault();
	requestQuit();
});
starting = startApplication();
starting.catch(async (error) => {
	reportError(error);
	stopping = true;
	await closeResources();
	const reason = error instanceof Error && error.message !== "" ? `\n失败原因：${error.message}` : "";
	electron.dialog.showErrorBox("嵌入式刷题本无法启动", `请检查数据目录权限或本地诊断日志后重新启动。${reason}\n数据目录：${electron.app.getPath("userData")}\n诊断日志：${(0, node_path.join)(electron.app.getPath("userData"), "logs", "application.log")}`);
	electron.app.exit(1);
});
//#endregion
