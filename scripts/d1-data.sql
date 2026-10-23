-- Dice Sorrow D1 初始配表（幂等：INSERT OR IGNORE，改数值用 UPDATE 或后台）
-- 当前数值与 v1.3.1 config.js 默认值一致；此后调参只改这里，不再进仓库

INSERT OR IGNORE INTO levels (id, count_min, count_max, value_min, value_max, description) VALUES
    (1,  2, 3, 2, 3, '第一关：2个骰子，点数2-3'),
    (2,  2, 3, 1, 4, '第二关'),
    (3,  2, 4, 1, 4, ''),
    (4,  3, 4, 1, 5, ''),
    (5,  3, 5, 1, 6, ''),
    (6,  4, 6, 2, 6, ''),
    (7,  5, 6, 2, 6, ''),
    (8,  5, 7, 3, 6, ''),
    (9,  6, 8, 3, 6, ''),
    (10, 6, 9, 4, 6, ''),
    (11, 5, 8, 4, 6, ''),
    (12, 6, 9, 5, 6, ''),
    (13, 7, 9, 5, 6, '第13关');

INSERT OR IGNORE INTO artifacts (id, name, weight, enabled) VALUES
    ('frost',   '霜冻',   100, 1),
    ('relay',   '中继器', 100, 1),
    ('trample', '爆破者', 100, 1),
    ('burn',    '燃烧弹', 100, 1),
    ('armor',   '装甲弹', 100, 1);

INSERT OR IGNORE INTO game_config (config_key, config_value, description) VALUES
    ('player.ambushChance',              '0.5',        '敌方闪击（先手）概率'),
    ('combat.enemyRerollThreshold',      '0.5',        '敌方AI重掷阈值(点数总和/最大潜力)'),
    ('enemyArtifacts.enabled',           'true',       '敌舰携带神器总开关'),
    ('enemyArtifacts.fromRound',         '2',          '从第几关(索引)起可能携带'),
    ('enemyArtifacts.chanceByRound',     '[0.15,0.5]', '携带概率线性插值 [起始关, 末关]'),
    ('enemyArtifacts.lootStealEnabled',  'true',       '击沉携带神器的敌舰可打捞夺取'),
    ('leviathan.spawnProbability',       '0.005',      'Leviathan 彩蛋生成概率');
