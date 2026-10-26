const require_question_bank = require("./question-bank-DgNu3Pwr.js");
const require_open_database = require("./open-database-DNSfFm_L.js");
let node_crypto = require("node:crypto");
var PRACTICE_PLAN_CHANNELS = {
	list: "practice-plans:list",
	change: "practice-plans:change"
};
var nameSchema = require_question_bank.string().min(1).max(60).refine((name) => name === name.trim() && !/[\u0000-\u001f\u007f]/u.test(name));
var practicePlanOptionsSchema = require_question_bank.strictObject({
	category: require_open_database.categoryScopeSchema,
	topicId: require_open_database.startPracticeSchema.shape.topicId,
	mode: require_open_database.practiceModeSchema,
	count: require_open_database.startPracticeSchema.shape.count,
	filters: require_open_database.questionFiltersSchema
});
var practicePlanSchema = require_question_bank.strictObject({
	planId: require_question_bank.uuid(),
	name: nameSchema,
	options: practicePlanOptionsSchema
});
var practicePlanChangeSchema = require_question_bank.discriminatedUnion("kind", [practicePlanSchema.extend({
	kind: require_question_bank.literal("save"),
	name: require_question_bank.string().trim().pipe(nameSchema)
}), require_question_bank.strictObject({
	kind: require_question_bank.literal("delete"),
	planId: require_question_bank.uuid()
})]);
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
var result$1 = (value) => require_question_bank.discriminatedUnion("ok", [require_question_bank.strictObject({
	ok: require_question_bank.literal(true),
	value
}), require_question_bank.strictObject({
	ok: require_question_bank.literal(false),
	error: errorSchema
})]);
var practicePlansResultSchema = result$1(require_question_bank.array(practicePlanSchema).max(100));
var practicePlanChangeResultSchema = result$1(require_question_bank._null());
//#endregion
//#region src/shared/contracts/themes.ts
var MAX_THEME_BYTES = 262144;
var DEFAULT_THEME_ID = "builtin.forest";
var themeIdSchema = require_question_bank.string().min(1).max(64).regex(/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/);
var themeVersionSchema = require_question_bank.string().regex(/^(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})$/);
var label = (max) => require_question_bank.string().min(1).max(max).regex(/^[^\u0000-\u001f\u007f]+$/);
var color = require_question_bank.string().regex(/^#[0-9a-fA-F]{6}$/);
var themeColorsSchema = require_question_bank.strictObject({
	background: color,
	surface: color,
	sidebar: color,
	text: color,
	muted: color,
	line: color,
	accent: color,
	accentSoft: color,
	accentInk: color,
	codeBackground: color,
	error: color,
	errorSoft: color,
	codeKeyword: color,
	codeValue: color,
	focus: color,
	success: color
});
var themeDefinitionSchema = require_question_bank.strictObject({
	formatVersion: require_question_bank.literal(1),
	id: themeIdSchema,
	name: label(60),
	version: themeVersionSchema,
	author: label(100),
	description: label(300),
	license: label(200),
	light: themeColorsSchema,
	dark: themeColorsSchema,
	presentation: require_question_bank.strictObject({
		font: require_question_bank._enum(["system", "serif"]),
		radius: require_question_bank._enum([
			"square",
			"soft",
			"rounded"
		]),
		density: require_question_bank._enum(["compact", "comfortable"]),
		layout: require_question_bank._enum(["classic", "study"])
	})
});
function compareThemeVersions(left, right) {
	const a = themeVersionSchema.parse(left).split(".").map(Number);
	const b = themeVersionSchema.parse(right).split(".").map(Number);
	for (let i = 0; i < 3; i++) {
		const difference = a[i] - b[i];
		if (difference) return Math.sign(difference);
	}
	return 0;
}
var THEME_CHANNELS = {
	list: "themes:list",
	preview: "themes:preview",
	install: "themes:install",
	uninstall: "themes:uninstall"
};
var themeCatalogSchema = require_question_bank.strictObject({
	entries: require_question_bank.array(require_question_bank.strictObject({
		definition: themeDefinitionSchema,
		builtIn: require_question_bank.boolean()
	})).max(105),
	issues: require_question_bank.array(require_question_bank.strictObject({
		id: themeIdSchema,
		message: require_question_bank.string().min(1).max(300)
	})).max(100)
});
var themePreviewSchema = require_question_bank.strictObject({
	token: require_question_bank.uuid(),
	expiresAt: require_open_database.datetime(),
	definition: themeDefinitionSchema,
	action: require_question_bank._enum([
		"install",
		"update",
		"installed"
	]),
	previousVersion: themeVersionSchema.nullable()
});
var themeTokenSchema = require_question_bank.strictObject({ token: require_question_bank.uuid() });
var themeRemoveSchema = require_question_bank.strictObject({ themeId: themeIdSchema });
var themeErrorSchema = require_question_bank.strictObject({
	code: require_question_bank._enum([
		"FORBIDDEN",
		"INVALID_REQUEST",
		"SERVICE_CLOSED",
		"DATABASE_UNAVAILABLE",
		"CANCELLED",
		"THEME_BUSY",
		"INVALID_THEME",
		"THEME_CONFLICT",
		"THEME_LIMIT",
		"PREVIEW_EXPIRED",
		"FILE_ERROR"
	]),
	message: require_question_bank.string().min(1)
});
var result = (value) => require_question_bank.discriminatedUnion("ok", [require_question_bank.strictObject({
	ok: require_question_bank.literal(true),
	value
}), require_question_bank.strictObject({
	ok: require_question_bank.literal(false),
	error: themeErrorSchema
})]);
var themeCatalogResultSchema = result(themeCatalogSchema);
var themePreviewResultSchema = result(themePreviewSchema);
//#endregion
//#region src/shared/contracts/settings.ts
var SETTINGS_CHANNELS = {
	read: "settings:read",
	save: "settings:save"
};
var appearanceSchema = require_question_bank.strictObject({
	theme: require_question_bank._enum([
		"system",
		"light",
		"dark"
	]),
	palette: require_question_bank._enum([
		"forest",
		"ocean",
		"sand",
		"lilac"
	]),
	fontSize: require_question_bank.number().int().min(15).max(22),
	themeId: themeIdSchema.optional(),
	navigationCollapsed: require_question_bank.boolean().default(false),
	auxiliaryHidden: require_question_bank.boolean().default(false)
}).transform((settings) => ({
	...settings,
	themeId: settings.themeId ?? `builtin.${settings.palette}`
}));
var settingsResultSchema = require_question_bank.discriminatedUnion("ok", [require_question_bank.strictObject({
	ok: require_question_bank.literal(true),
	value: appearanceSchema
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
//#region src/shared/themes.ts
var forestLight = {
	background: "#f5f6f4",
	surface: "#fcfdfb",
	sidebar: "#edefec",
	text: "#20332d",
	muted: "#5d7067",
	line: "#d5e1da",
	accent: "#216b52",
	accentSoft: "#e7f1ec",
	accentInk: "#ffffff",
	codeBackground: "#f3f6f5",
	error: "#ac352e",
	errorSoft: "#fff1ee",
	codeKeyword: "#8155bb",
	codeValue: "#277d58",
	focus: "#216b52",
	success: "#216b52"
};
var forestDark = {
	background: "#141b18",
	surface: "#1b2420",
	sidebar: "#17201c",
	text: "#e4ede7",
	muted: "#acbdb2",
	line: "#384b3e",
	accent: "#97d7b6",
	accentSoft: "#2a4134",
	accentInk: "#14251c",
	codeBackground: "#111b16",
	error: "#ffb4a8",
	errorSoft: "#3e2925",
	codeKeyword: "#d4b5ff",
	codeValue: "#9bd6b4",
	focus: "#97d7b6",
	success: "#97d7b6"
};
function classic(id, name, description, light = {}, dark = {}) {
	return themeDefinitionSchema.parse({
		formatVersion: 1,
		id: `builtin.${id}`,
		name,
		version: "1.0.0",
		author: "嵌入式刷题本",
		description,
		license: "应用内置视觉预设",
		light: {
			...forestLight,
			...light,
			focus: light.accent ?? forestLight.accent
		},
		dark: {
			...forestDark,
			...dark,
			focus: dark.accent ?? forestDark.accent
		},
		presentation: {
			font: "system",
			radius: "rounded",
			density: "comfortable",
			layout: "classic"
		}
	});
}
var BUILTIN_THEMES = [
	classic("forest", "松间绿", "自然清爽，沉静专注"),
	classic("ocean", "晴空蓝", "清晰冷静，轻盈通透", {
		background: "#f3f5f8",
		surface: "#fafcfe",
		sidebar: "#e9eef7",
		text: "#24334b",
		muted: "#5c6d85",
		line: "#d5dfed",
		accent: "#285fc1",
		accentSoft: "#e7effd",
		codeBackground: "#f1f5fc",
		codeValue: "#1b746c"
	}, {
		background: "#141b29",
		surface: "#1e2735",
		sidebar: "#182133",
		text: "#e3ebfa",
		muted: "#aabbd5",
		line: "#374c69",
		accent: "#a0c2ff",
		accentSoft: "#2a3e61",
		codeBackground: "#131d30",
		codeValue: "#86d7cf"
	}),
	classic("sand", "暖沙金", "温暖柔和，纸页质感", {
		background: "#f7f4ee",
		surface: "#fdfaf4",
		sidebar: "#f0ebe0",
		text: "#413725",
		muted: "#786747",
		line: "#e5dac5",
		accent: "#91601e",
		accentSoft: "#f5ead2",
		codeBackground: "#f7f1e5",
		codeValue: "#377152"
	}, {
		background: "#241e16",
		surface: "#2e271e",
		sidebar: "#2a241b",
		text: "#f1e7d5",
		muted: "#c8b99b",
		line: "#534631",
		accent: "#ebc47e",
		accentSoft: "#4a3c23",
		codeBackground: "#241e15",
		codeValue: "#a4d0ad"
	}),
	classic("lilac", "暮山紫", "低饱和紫，柔和舒展", {
		background: "#f5f3f8",
		surface: "#fcfafd",
		sidebar: "#eee9f4",
		text: "#382e47",
		muted: "#71617f",
		line: "#e0d7e9",
		accent: "#77519e",
		accentSoft: "#efe6f8",
		codeBackground: "#f5f0fa",
		codeValue: "#2d7664"
	}, {
		background: "#211b29",
		surface: "#2b2334",
		sidebar: "#261f30",
		text: "#ede5f6",
		muted: "#bfafcf",
		line: "#4c3e5c",
		accent: "#d0b3f0",
		accentSoft: "#443253",
		codeBackground: "#211929",
		codeValue: "#9bd8bf"
	}),
	themeDefinitionSchema.parse({
		formatVersion: 1,
		id: "builtin.claude",
		name: "Claude 风格",
		version: "1.0.0",
		author: "嵌入式刷题本",
		description: "非官方视觉预设 · 暖中性色与专注学习工作区",
		license: "应用内置视觉预设，无官方品牌素材",
		light: {
			background: "#f7f6f2",
			sidebar: "#f0eee8",
			surface: "#ffffff",
			line: "#e3dfd7",
			text: "#292724",
			muted: "#746e65",
			accent: "#a84d35",
			accentSoft: "#f7e9e2",
			accentInk: "#ffffff",
			codeBackground: "#f4f2ed",
			error: "#a12f29",
			errorSoft: "#fff0ed",
			codeKeyword: "#7651a1",
			codeValue: "#386b4b",
			focus: "#a84d35",
			success: "#386b4b"
		},
		dark: {
			background: "#1e1c19",
			sidebar: "#22201d",
			surface: "#272420",
			line: "#49433b",
			text: "#ede8df",
			muted: "#b9b0a3",
			accent: "#e2a088",
			accentSoft: "#463127",
			accentInk: "#281c16",
			codeBackground: "#191715",
			error: "#ffb4a8",
			errorSoft: "#422824",
			codeKeyword: "#d1b5f0",
			codeValue: "#a7c5a5",
			focus: "#e2a088",
			success: "#a7c5a5"
		},
		presentation: {
			font: "system",
			radius: "soft",
			density: "comfortable",
			layout: "study"
		}
	})
];
function builtinTheme(id) {
	return BUILTIN_THEMES.find((theme) => theme.id === id);
}
//#endregion
//#region src/main/database/repositories/theme-repository.ts
var ThemeFault = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.code = code;
		this.name = "ThemeFault";
	}
};
var hash = (content) => (0, node_crypto.createHash)("sha256").update(content).digest("hex");
function decodeThemeRow(row) {
	if (Buffer.byteLength(row.config_json, "utf8") > 262144 || hash(row.config_json) !== row.content_hash) throw new Error("主题配置大小或哈希无效。");
	const definition = themeDefinitionSchema.parse(JSON.parse(row.config_json));
	if (definition.id !== row.theme_id || definition.version !== row.version || definition.id.startsWith("builtin.")) throw new Error("主题配置与索引不一致。");
	return definition;
}
function createThemeRepository(database) {
	const find = database.prepare("SELECT theme_id, version, config_json, content_hash FROM installed_themes WHERE theme_id = ?");
	function listThemes() {
		const rows = database.prepare(`SELECT theme_id, version, config_json, content_hash FROM installed_themes ORDER BY theme_id LIMIT 101`).all();
		if (rows.length > 100) throw new Error("主题数量超过支持上限。");
		if (new Set(rows.map((row) => row.theme_id)).size !== rows.length) throw new Error("主题标识重复，数据库结构或备份无效。");
		const entries = BUILTIN_THEMES.map((definition) => ({
			definition,
			builtIn: true
		}));
		const issues = [];
		for (const row of rows) {
			themeIdSchema.parse(row.theme_id);
			try {
				entries.push({
					definition: decodeThemeRow(row),
					builtIn: false
				});
			} catch {
				issues.push({
					id: row.theme_id,
					message: "主题配置损坏，已暂时停用。请卸载后重新安装。"
				});
			}
		}
		return themeCatalogSchema.parse({
			entries,
			issues
		});
	}
	function inspectTheme(input) {
		const definition = themeDefinitionSchema.parse(input);
		if (definition.id.startsWith("builtin.")) throw new ThemeFault("THEME_CONFLICT", "内置主题 ID 为保留标识，外部包不能覆盖。");
		const row = find.get(definition.id);
		if (!row) {
			if (database.prepare("SELECT count(*) FROM installed_themes").pluck().get() >= 100) throw new ThemeFault("THEME_LIMIT", "最多安装 100 个外部主题，请先卸载一个主题。");
			return {
				action: "install",
				previousVersion: null
			};
		}
		let current;
		try {
			current = decodeThemeRow(row);
		} catch {
			throw new ThemeFault("THEME_CONFLICT", "同 ID 的已安装主题损坏，请先卸载后重新安装。");
		}
		const order = compareThemeVersions(definition.version, current.version);
		if (order < 0) throw new ThemeFault("THEME_CONFLICT", "不支持降级安装，请选择更高版本。");
		if (order === 0) {
			if (JSON.stringify(definition) !== row.config_json) throw new ThemeFault("THEME_CONFLICT", "同一主题 ID 和版本的内容不同，已拒绝覆盖。请提升主题版本。");
			return {
				action: "installed",
				previousVersion: current.version
			};
		}
		return {
			action: "update",
			previousVersion: current.version
		};
	}
	const install = database.transaction((input) => {
		const definition = themeDefinitionSchema.parse(input);
		if (inspectTheme(definition).action !== "installed") {
			const content = JSON.stringify(definition);
			database.prepare(`INSERT INTO installed_themes(theme_id,version,config_json,content_hash) VALUES(?,?,?,?)
        ON CONFLICT(theme_id) DO UPDATE SET version=excluded.version,config_json=excluded.config_json,content_hash=excluded.content_hash`).run(definition.id, definition.version, content, hash(content));
		}
		return listThemes();
	});
	const remove = database.transaction((themeId) => {
		themeIdSchema.parse(themeId);
		if (themeId.startsWith("builtin.")) throw new ThemeFault("THEME_CONFLICT", "内置主题不能卸载。");
		database.prepare("UPDATE appearance_settings SET theme_id = ?, palette = 'forest' WHERE id = 1 AND theme_id = ?").run(DEFAULT_THEME_ID, themeId);
		database.prepare("DELETE FROM installed_themes WHERE theme_id = ?").run(themeId);
		return listThemes();
	});
	return {
		listThemes,
		inspectTheme,
		installTheme: (definition) => install.immediate(definition),
		removeTheme: (themeId) => remove.immediate(themeId)
	};
}
//#endregion
//#region src/main/database/repositories/settings-repository.ts
function createSettingsRepository(database) {
	const read = database.prepare(`SELECT theme, palette, font_size AS fontSize, theme_id AS themeId,
      navigation_collapsed AS navigationCollapsed, auxiliary_hidden AS auxiliaryHidden
      FROM appearance_settings WHERE id = 1`);
	const themes = createThemeRepository(database);
	const update = database.prepare(`UPDATE appearance_settings
    SET theme = @theme, palette = @palette, font_size = @fontSize, theme_id = @themeId,
      navigation_collapsed = @navigationCollapsed, auxiliary_hidden = @auxiliaryHidden
    WHERE id = 1`);
	function readSettings() {
		const row = read.get();
		if (!row || ![0, 1].includes(row["navigationCollapsed"]) || ![0, 1].includes(row["auxiliaryHidden"])) throw new Error("显示设置或布局偏好损坏。");
		return appearanceSchema.parse({
			...row,
			navigationCollapsed: row["navigationCollapsed"] === 1,
			auxiliaryHidden: row["auxiliaryHidden"] === 1
		});
	}
	const save = database.transaction((settings) => {
		if (!builtinTheme(settings.themeId) && !themes.listThemes().entries.some((entry) => entry.definition.id === settings.themeId)) throw new Error("所选主题缺失或损坏，请重新选择已安装主题。");
		const legacy = settings.themeId.startsWith("builtin.") ? settings.themeId.slice(8) : "";
		update.run({
			...settings,
			palette: [
				"forest",
				"ocean",
				"sand",
				"lilac"
			].includes(legacy) ? legacy : readSettings().palette,
			navigationCollapsed: Number(settings.navigationCollapsed),
			auxiliaryHidden: Number(settings.auxiliaryHidden)
		});
		return readSettings();
	});
	return {
		readSettings,
		saveSettings: (settings) => save.immediate(appearanceSchema.parse(settings))
	};
}
//#endregion
Object.defineProperty(exports, "MAX_THEME_BYTES", {
	enumerable: true,
	get: function() {
		return MAX_THEME_BYTES;
	}
});
Object.defineProperty(exports, "PRACTICE_PLAN_CHANNELS", {
	enumerable: true,
	get: function() {
		return PRACTICE_PLAN_CHANNELS;
	}
});
Object.defineProperty(exports, "SETTINGS_CHANNELS", {
	enumerable: true,
	get: function() {
		return SETTINGS_CHANNELS;
	}
});
Object.defineProperty(exports, "THEME_CHANNELS", {
	enumerable: true,
	get: function() {
		return THEME_CHANNELS;
	}
});
Object.defineProperty(exports, "ThemeFault", {
	enumerable: true,
	get: function() {
		return ThemeFault;
	}
});
Object.defineProperty(exports, "appearanceSchema", {
	enumerable: true,
	get: function() {
		return appearanceSchema;
	}
});
Object.defineProperty(exports, "createSettingsRepository", {
	enumerable: true,
	get: function() {
		return createSettingsRepository;
	}
});
Object.defineProperty(exports, "createThemeRepository", {
	enumerable: true,
	get: function() {
		return createThemeRepository;
	}
});
Object.defineProperty(exports, "practicePlanChangeResultSchema", {
	enumerable: true,
	get: function() {
		return practicePlanChangeResultSchema;
	}
});
Object.defineProperty(exports, "practicePlanChangeSchema", {
	enumerable: true,
	get: function() {
		return practicePlanChangeSchema;
	}
});
Object.defineProperty(exports, "practicePlanSchema", {
	enumerable: true,
	get: function() {
		return practicePlanSchema;
	}
});
Object.defineProperty(exports, "practicePlansResultSchema", {
	enumerable: true,
	get: function() {
		return practicePlansResultSchema;
	}
});
Object.defineProperty(exports, "settingsResultSchema", {
	enumerable: true,
	get: function() {
		return settingsResultSchema;
	}
});
Object.defineProperty(exports, "themeCatalogResultSchema", {
	enumerable: true,
	get: function() {
		return themeCatalogResultSchema;
	}
});
Object.defineProperty(exports, "themeDefinitionSchema", {
	enumerable: true,
	get: function() {
		return themeDefinitionSchema;
	}
});
Object.defineProperty(exports, "themePreviewResultSchema", {
	enumerable: true,
	get: function() {
		return themePreviewResultSchema;
	}
});
Object.defineProperty(exports, "themeRemoveSchema", {
	enumerable: true,
	get: function() {
		return themeRemoveSchema;
	}
});
Object.defineProperty(exports, "themeTokenSchema", {
	enumerable: true,
	get: function() {
		return themeTokenSchema;
	}
});
