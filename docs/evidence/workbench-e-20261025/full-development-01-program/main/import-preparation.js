Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_import_protocol = require("./import-protocol-CjaQDko1.js");
let node_worker_threads = require("node:worker_threads");
//#region ../../workers/import-worker?nodeWorker&importer=E:/My_Projects/embedded-practice/src/main/services/library/import-preparation.ts
function import_preparation_default(options) {
	return new node_worker_threads.Worker(new URL("./import-worker-Dm2sGFac.js", require("url").pathToFileURL(__filename).href), options);
}
//#endregion
//#region src/main/workers/import-task-runner.ts
function startTask(filePaths, spawn, reportError, timeoutMs, signal) {
	let resolveResult;
	const completion = new Promise((resolve) => {
		resolveResult = resolve;
	});
	let worker;
	let timer;
	let finishing = false;
	let stopFailed = false;
	function report(error) {
		try {
			reportError(error);
		} catch {}
	}
	async function finish(result) {
		if (finishing) return;
		finishing = true;
		clearTimeout(timer);
		signal?.removeEventListener("abort", cancel);
		try {
			if (worker) await worker.terminate();
		} catch (error) {
			stopFailed = true;
			report(error);
			result = require_import_protocol.workerFailure("WORKER_FAILED", "后台任务未能安全停止，请重新启动应用。");
			try {
				worker?.unref();
			} catch (unrefError) {
				report(unrefError);
			}
		} finally {
			worker?.removeListener("message", onMessage);
			worker?.removeListener("exit", onExit);
			if (!stopFailed) worker?.removeListener("error", onError);
			resolveResult(result);
		}
	}
	function cancel() {
		finish(require_import_protocol.workerFailure("WORKER_CANCELLED", "已取消本次文件准备。"));
	}
	function onError(error) {
		if (finishing) return;
		report(error);
		finish(require_import_protocol.workerFailure("WORKER_FAILED", "后台文件准备失败，请重试或检查本地诊断日志。"));
	}
	function onExit() {
		finish(require_import_protocol.workerFailure("WORKER_FAILED", "后台任务提前退出，未返回完整结果，请重试。"));
	}
	let expectedThreadId = -1;
	function onMessage(message) {
		if (finishing) return;
		try {
			const reply = require_import_protocol.importWorkerReplySchema.safeParse(message);
			if (!reply.success || reply.data.threadId !== expectedThreadId) {
				finish(require_import_protocol.workerFailure("WORKER_FAILED", "后台任务返回了无效结果，请重试。"));
				return;
			}
			finish(reply.data.result);
		} catch (error) {
			onError(error);
		}
	}
	if (signal?.aborted) cancel();
	else try {
		worker = spawn(filePaths);
		expectedThreadId = worker.threadId;
		worker.once("message", onMessage);
		worker.on("error", onError);
		worker.once("exit", onExit);
		timer = setTimeout(() => {
			finish(require_import_protocol.workerFailure("WORKER_TIMEOUT", "后台文件准备超时，请减少本批文件后重试。"));
		}, timeoutMs);
		signal?.addEventListener("abort", cancel, { once: true });
		if (signal?.aborted) cancel();
	} catch (error) {
		onError(error);
	}
	return {
		completion,
		cancel,
		get stopFailed() {
			return stopFailed;
		}
	};
}
function createImportTaskRunner(spawn, reportError, timeoutMs = 12e4) {
	if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2147483647) throw new Error("任务期限必须为 1～2147483647 的整毫秒。");
	let closed = false;
	let active;
	return {
		async prepare(filePaths, signal) {
			if (closed) return require_import_protocol.workerFailure("WORKER_CANCELLED", "文件准备服务已关闭。");
			if (active) return require_import_protocol.workerFailure("IMPORT_BUSY", "已有文件准备任务，请等待完成或先取消。");
			const request = require_import_protocol.importWorkerRequestSchema.safeParse({
				version: 1,
				filePaths
			});
			if (!request.success) return require_import_protocol.workerFailure("FILE_UNREADABLE", "请选择有效的 Markdown 绝对路径。");
			const task = startTask(request.data.filePaths, spawn, reportError, timeoutMs, signal);
			active = task;
			try {
				return await task.completion;
			} finally {
				if (task.stopFailed) closed = true;
				if (active === task) active = void 0;
			}
		},
		async close() {
			closed = true;
			const task = active;
			task?.cancel();
			await task?.completion;
		}
	};
}
//#endregion
//#region src/main/services/library/import-preparation.ts
function createImportPreparationService(reportError, timeoutMs = 12e4) {
	return createImportTaskRunner((filePaths) => import_preparation_default({
		workerData: {
			version: 1,
			filePaths
		},
		execArgv: [],
		trackUnmanagedFds: true,
		name: "import-preparation"
	}), reportError, timeoutMs);
}
//#endregion
exports.createImportPreparationService = createImportPreparationService;
