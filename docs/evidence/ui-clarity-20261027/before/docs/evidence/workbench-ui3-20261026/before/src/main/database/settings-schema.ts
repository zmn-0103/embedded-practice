// 与新库初始化/旧库迁移共用；同名未知结构必须报错，不自动修补。
export const settingsSchema = `
  CREATE TABLE appearance_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    theme TEXT NOT NULL CHECK (theme IN ('system', 'light', 'dark')),
    font_size INTEGER NOT NULL CHECK (font_size BETWEEN 15 AND 22)
  ) STRICT;
  INSERT INTO appearance_settings VALUES (1, 'system', 17);
`

// 只追加配色；旧明暗模式、字号和用户自定义索引/触发器保持。
export const paletteMigration = `
  ALTER TABLE appearance_settings ADD COLUMN palette TEXT NOT NULL DEFAULT 'forest'
    CHECK (palette IN ('forest', 'ocean', 'sand', 'lilac'));
`

// 主题完整配置与选择在同一数据库中；不设外键，以保留缺失主题的原选择供修复。
export const themeMigration = `
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
`
