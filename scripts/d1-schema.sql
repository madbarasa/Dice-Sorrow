-- Dice Sorrow D1 schema v1.4.0（幂等，可重复执行）
-- 真实策划数值只存 D1；仓库内 config.js 仅作兜底默认值

CREATE TABLE IF NOT EXISTS game_config (
    config_key   TEXT PRIMARY KEY,
    config_value TEXT NOT NULL,          -- JSON 编码：数字/布尔/数组/字符串
    description  TEXT NOT NULL DEFAULT '',
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS levels (
    id          INTEGER PRIMARY KEY,      -- 关卡序号 1..N（超出后循环使用）
    count_min   INTEGER NOT NULL,
    count_max   INTEGER NOT NULL,
    value_min   INTEGER NOT NULL,
    value_max   INTEGER NOT NULL,
    description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS artifacts (
    id        TEXT PRIMARY KEY,           -- frost/relay/trample/burn/armor
    name      TEXT NOT NULL,
    weight    REAL NOT NULL DEFAULT 100,  -- 预留：出货权重
    enabled   INTEGER NOT NULL DEFAULT 1
);
