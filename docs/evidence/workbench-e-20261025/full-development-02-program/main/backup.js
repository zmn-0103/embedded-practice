Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_rolldown_runtime = require("./rolldown-runtime-Dbql6lyJ.js");
const require_open_database = require("./open-database-DNSfFm_L.js");
const require_restore_files = require("./restore-files.js");
let node_path = require("node:path");
let node_crypto = require("node:crypto");
let node_fs_promises = require("node:fs/promises");
let better_sqlite3 = require("better-sqlite3");
better_sqlite3 = require_rolldown_runtime.__toESM(better_sqlite3);
//#region src/main/services/backup/backup.ts
function missing(error) {
	return error instanceof Error && "code" in error && error.code === "ENOENT";
}
function inside(directory, path) {
	const part = (0, node_path.relative)(directory, path);
	return part === "" || !(0, node_path.isAbsolute)(part) && part !== ".." && !part.startsWith(`..${node_path.sep}`);
}
async function openBackupService(databasePath, appVersion, reportError) {
	if (!(0, node_path.isAbsolute)(databasePath)) throw new Error("备份服务需要绝对数据库路径。");
	const dataDirectory = await (0, node_fs_promises.realpath)((0, node_path.dirname)(databasePath));
	const source = new better_sqlite3.default(databasePath, {
		readonly: true,
		fileMustExist: true
	});
	let closed = false;
	let active;
	let closing;
	let preview;
	function reportCleanup(error) {
		try {
			reportError(error);
		} catch {}
	}
	async function removeStage(directory) {
		await (0, node_fs_promises.rm)(directory, {
			recursive: true,
			force: true
		}).catch(reportCleanup);
	}
	async function discardPreview() {
		const previous = preview;
		preview = void 0;
		if (previous) await removeStage(previous.directory);
	}
	async function destinationFor(path, reading = false) {
		if (!(0, node_path.isAbsolute)(path)) throw new require_restore_files.BackupFault("FILE_ERROR", "请选择有效的绝对文件路径。");
		const destination = (0, node_path.join)(await (0, node_fs_promises.realpath)((0, node_path.dirname)(path)), (0, node_path.basename)(path));
		if (inside(dataDirectory, destination) && !(reading && (0, node_path.relative)((0, node_path.join)(dataDirectory, "backups"), (0, node_path.dirname)(destination)) === "")) throw new require_restore_files.BackupFault("FILE_ERROR", "请选择运行数据目录以外的位置，避免覆盖正在使用的数据。");
		const target = await (0, node_fs_promises.lstat)(destination).catch((error) => {
			if (!missing(error)) throw error;
		});
		if (target && (!target.isFile() || target.isSymbolicLink())) throw new require_restore_files.BackupFault("FILE_ERROR", "备份目标必须是普通文件，不能使用目录或链接。");
		for (const suffix of [
			"-wal",
			"-shm",
			"-journal"
		]) if (await (0, node_fs_promises.lstat)(destination + suffix).catch((error) => {
			if (!missing(error)) throw error;
		})) throw new require_restore_files.BackupFault("FILE_ERROR", "目标仍有数据库伴随文件，请选择独立的备份文件位置。");
		if (target) for (const suffix of [
			"",
			"-wal",
			"-shm",
			"-journal"
		]) {
			const running = await (0, node_fs_promises.stat)(databasePath + suffix).catch((error) => {
				if (!missing(error)) throw error;
			});
			if (running && running.dev === target.dev && running.ino === target.ino) throw new require_restore_files.BackupFault("FILE_ERROR", "不能覆盖当前数据库或其伴随文件的别名。");
		}
		return destination;
	}
	function run(work) {
		if (closed) return Promise.reject(new require_restore_files.BackupFault("SERVICE_CLOSED", "备份服务已关闭。"));
		if (active) return Promise.reject(new require_restore_files.BackupFault("BACKUP_BUSY", "备份任务正在进行，请等待完成。"));
		const job = work();
		active = job;
		return job.finally(() => {
			if (active === job) active = void 0;
		});
	}
	async function writeSnapshot(destination, checkDestination) {
		const directory = await (0, node_fs_promises.mkdtemp)((0, node_path.join)((0, node_path.dirname)(destination), ".embedded-practice-export-"));
		const staged = (0, node_path.join)(directory, "backup.sqlite3");
		try {
			if (source.pragma("application_id", { simple: true }) !== 1162891825 || source.pragma("user_version", { simple: true }) !== 10) throw new require_restore_files.BackupFault("EXPORT_FAILED", "当前数据库结构异常，停止导出并保留原数据。");
			await source.backup(staged);
			const backup = new better_sqlite3.default(staged, { fileMustExist: true });
			let summary;
			try {
				if (backup.prepare("SELECT 1 FROM sqlite_schema WHERE name = 'backup_manifest'").get()) require_restore_files.readBackupHeader(backup);
				backup.pragma("journal_mode = DELETE");
				backup.pragma("synchronous = FULL");
				backup.pragma("trusted_schema = OFF");
				backup.transaction(() => {
					backup.exec(`DROP TABLE IF EXISTS backup_manifest;
                CREATE TABLE backup_manifest (
                  id INTEGER PRIMARY KEY CHECK (id = 1),
                  format_version INTEGER NOT NULL, created_at TEXT NOT NULL,
                  app_version TEXT NOT NULL, schema_version INTEGER NOT NULL
                ) STRICT;`);
					backup.prepare("INSERT INTO backup_manifest VALUES (1, ?, ?, ?, ?)").run(1, (/* @__PURE__ */ new Date()).toISOString(), appVersion, 10);
				})();
				summary = require_restore_files.readBackupSummary(backup, require_restore_files.readBackupHeader(backup));
			} finally {
				backup.close();
			}
			if (checkDestination && await checkDestination() !== destination) throw new require_restore_files.BackupFault("FILE_ERROR", "目标目录发生变化，请重新选择导出位置。");
			await (0, node_fs_promises.rename)(staged, destination);
			return {
				filePath: destination,
				summary
			};
		} finally {
			await removeStage(directory);
		}
	}
	return {
		discardPreview,
		export(path) {
			return run(async () => {
				await discardPreview();
				return writeSnapshot(await destinationFor(path), () => destinationFor(path));
			});
		},
		preview(path) {
			return run(async () => {
				await discardPreview();
				if (!(0, node_path.isAbsolute)(path)) throw new require_restore_files.BackupFault("FILE_ERROR", "请选择有效的备份文件路径。");
				const original = await (0, node_fs_promises.realpath)(path);
				await destinationFor(original, true);
				const before = await (0, node_fs_promises.stat)(original, { bigint: true });
				if (!before.isFile()) throw new require_restore_files.BackupFault("FILE_ERROR", "请选择普通备份文件。");
				const stagingRoot = (0, node_path.join)(dataDirectory, "backup-staging");
				await (0, node_fs_promises.mkdir)(stagingRoot, { recursive: true });
				if ((await (0, node_fs_promises.lstat)(stagingRoot)).isSymbolicLink() || (0, node_path.relative)(stagingRoot, await (0, node_fs_promises.realpath)(stagingRoot)) !== "") throw new require_restore_files.BackupFault("FILE_ERROR", "恢复暂存目录异常，请检查数据目录。");
				const directory = await (0, node_fs_promises.mkdtemp)((0, node_path.join)(stagingRoot, "preview-"));
				const staged = (0, node_path.join)(directory, "backup.sqlite3");
				let retained = false;
				try {
					await (0, node_fs_promises.copyFile)(original, staged);
					const after = await (0, node_fs_promises.stat)(original, { bigint: true });
					if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs || await (0, node_fs_promises.realpath)(path) !== original) throw new require_restore_files.BackupFault("FILE_ERROR", "读取期间备份文件发生变化，请重新选择。");
					const snapshot = new better_sqlite3.default(staged, {
						readonly: true,
						fileMustExist: true
					});
					let header;
					try {
						header = require_restore_files.readBackupHeader(snapshot);
					} finally {
						snapshot.close();
					}
					const compatible = await require_open_database.openPracticeDatabase(staged);
					let summary;
					try {
						summary = require_restore_files.readBackupSummary(compatible, header);
						if (header.metadata) compatible.prepare("UPDATE backup_manifest SET schema_version = ? WHERE id = 1").run(10);
						compatible.pragma("journal_mode = DELETE");
					} finally {
						compatible.close();
					}
					const value = {
						filePath: path,
						summary,
						token: (0, node_crypto.randomUUID)()
					};
					preview = {
						directory,
						path: staged,
						hash: await require_restore_files.hashBackupFile(staged),
						value
					};
					retained = true;
					return value;
				} finally {
					if (!retained) await removeStage(directory);
				}
			});
		},
		prepareRestore(token) {
			return run(async () => {
				const selected = preview;
				if (!selected || selected.value.token !== token) throw new require_restore_files.BackupFault("PREVIEW_EXPIRED", "恢复预览已失效，请重新选择备份并校验。");
				preview = void 0;
				try {
					if (await require_restore_files.hashBackupFile(selected.path) !== selected.hash) throw new require_restore_files.BackupFault("PREVIEW_EXPIRED", "恢复副本发生变化，请重新预览。");
					const checked = new better_sqlite3.default(selected.path, {
						readonly: true,
						fileMustExist: true
					});
					try {
						require_restore_files.readBackupSummary(checked, require_restore_files.readBackupHeader(checked));
					} finally {
						checked.close();
					}
					const backups = (0, node_path.join)(dataDirectory, "backups");
					await (0, node_fs_promises.mkdir)(backups, { recursive: true });
					if ((await (0, node_fs_promises.lstat)(backups)).isSymbolicLink() || (0, node_path.relative)(backups, await (0, node_fs_promises.realpath)(backups)) !== "") throw new require_restore_files.BackupFault("FILE_ERROR", "保护性备份目录异常，停止恢复。");
					const protection = await writeSnapshot((0, node_path.join)(backups, `before-restore-${(0, node_crypto.randomUUID)()}.sqlite3`));
					return {
						candidatePath: selected.path,
						candidateHash: selected.hash,
						protectionPath: protection.filePath,
						release: () => removeStage(selected.directory)
					};
				} catch (error) {
					await removeStage(selected.directory);
					throw error;
				}
			});
		},
		close() {
			closed = true;
			closing ??= (async () => {
				await active?.catch(() => {});
				source.close();
				await discardPreview();
			})();
			return closing;
		}
	};
}
//#endregion
exports.openBackupService = openBackupService;
