// 与新库初始化/旧库迁移共用；同名未知结构必须报错，不自动修补。
export const settingsSchema = `
  CREATE TABLE appearance_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    theme TEXT NOT NULL CHECK (theme IN ('system', 'light', 'dark')),
    font_size INTEGER NOT NULL CHECK (font_size BETWEEN 15 AND 22)
  ) STRICT;
  INSERT INTO appearance_settings VALUES (1, 'system', 17);
`
