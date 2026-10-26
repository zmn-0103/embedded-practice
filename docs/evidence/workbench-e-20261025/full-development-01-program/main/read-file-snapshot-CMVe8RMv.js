let node_path = require("node:path");
let node_fs_promises = require("node:fs/promises");
let node_buffer = require("node:buffer");
//#region src/main/services/resources/read-file-snapshot.ts
var SourceFileError = class extends Error {
	code;
	constructor(code, message, options) {
		super(message, options);
		this.code = code;
		this.name = "SourceFileError";
	}
};
async function readFileSnapshot(filePath, limit) {
	if (!(0, node_path.isAbsolute)(filePath) || !Number.isSafeInteger(limit) || limit < 0) throw new SourceFileError("FILE_UNREADABLE", "需要有效的绝对文件路径和非负字节上限。");
	try {
		if (!(await (0, node_fs_promises.stat)(filePath)).isFile()) throw new SourceFileError("FILE_UNREADABLE", "来源必须是普通文件。");
		const file = await (0, node_fs_promises.open)(filePath, "r");
		try {
			const before = await file.stat({ bigint: true });
			if (!before.isFile()) throw new SourceFileError("FILE_UNREADABLE", "来源必须是普通文件。");
			if (before.size > BigInt(limit)) throw new SourceFileError("LIMIT_EXCEEDED", `来源文件超过本次允许的 ${limit} 字节上限。`);
			const buffer = node_buffer.Buffer.alloc(Number(before.size) + 1);
			let offset = 0;
			while (offset < buffer.length) {
				const { bytesRead } = await file.read(buffer, offset, buffer.length - offset, offset);
				if (bytesRead === 0) break;
				offset += bytesRead;
			}
			const after = await file.stat({ bigint: true });
			if (BigInt(offset) !== before.size || after.size !== before.size || after.mtimeNs !== before.mtimeNs || after.ctimeNs !== before.ctimeNs) throw new SourceFileError("SOURCE_CHANGED", "读取期间来源文件发生变化，请重新准备导入。");
			return buffer.subarray(0, offset);
		} finally {
			await file.close();
		}
	} catch (error) {
		if (error instanceof SourceFileError) throw error;
		throw new SourceFileError("FILE_UNREADABLE", "无法读取来源文件，请检查文件是否存在且具有读取权限。", { cause: error });
	}
}
//#endregion
Object.defineProperty(exports, "SourceFileError", {
	enumerable: true,
	get: function() {
		return SourceFileError;
	}
});
Object.defineProperty(exports, "readFileSnapshot", {
	enumerable: true,
	get: function() {
		return readFileSnapshot;
	}
});
