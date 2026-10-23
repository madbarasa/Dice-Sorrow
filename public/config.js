// config.js - v1.4.0
console.log("Config loaded..."); // Debug 用
const GAME_CONFIG = {
    // 基础游戏配置
    player: {
        diceCount: [3, 3], // 玩家初始骰子数范围 [min, max]
        diceValue: [1, 6], // 每个骰子初始点数范围 [min, max]
        ambushChance: 0.5   // 敌方闪击（先手）的概率 0.5 = 50%
    },

    // 教程关卡配置
    levels: [
        { count: [2, 3], value: [2, 3] }, // 第一关：2个骰子，点数2-3
        { count: [2, 3], value: [1, 4] }, // 第二关
        { count: [2, 4], value: [1, 4] },
        { count: [3, 4], value: [1, 5] },
        { count: [3, 5], value: [1, 6] },
        { count: [4, 6], value: [2, 6] },
        { count: [5, 6], value: [2, 6] },
        { count: [5, 7], value: [3, 6] },
        { count: [6, 8], value: [3, 6] },
        { count: [6, 9], value: [4, 6] },
        { count: [5, 8], value: [4, 6] },
        { count: [6, 9], value: [5, 6] },
        { count: [7, 9], value: [5, 6] } // 第13关
    ],

    // 初始统计数据
    initialStats: {
        total_games_played: 0,
        total_enemies_defeated: 0,
        total_rounds_completed: 0,
        total_damage_dealt: 0,
        total_damage_taken: 0,
        total_dice_rolled: 0,
        total_artifacts_collected: 0
    },

    // 颜色配置
    colors: {
        bg: '#05070a',
        ship_wood: '#5c3a21',
        ship_highlight: '#8b5e34',
        sail: '#f2e8cf',
        sail_shadow: '#4a4e69',
        matrix: '#00ffa2',
        enemy: '#ff2d55',
        sea_deep: '#02050a',
        sea_mid: '#0a1d2e',
        sea_top: '#16334a'
    },

    // 物理与动画参数
    physics: {
        // 船只运动
        shipBobAmplitude: 12,        // 船只上下起伏幅度
        shipDriftAmplitude: 15,      // 船只左右漂移幅度
        shipTiltAmplitude: 0.04,     // 船只倾斜幅度

        // 屏幕震动
        shakeDecay: 0.85,            // 震动衰减系数

        // 时间步长
        timeStep: 0.04,              // 游戏循环时间增量

        // 粒子系统
        particleDecay: 0.02,         // 粒子生命衰减
        smokeSpawnRate: 0.2,         // 冒烟概率 (受损船只)
        fireSpawnRate: 0.1,          // 起火概率 (受损船只)
        foamSpawnRate: 0.02,         // 水沫生成系数

        // 炮弹轨迹
        cannonballArcHeight: 120,    // 炮弹抛物线高度
        cannonballSpeed: 0.03,       // 炮弹飞行速度

        // 爆炸参数
        explosionParticleCount: 40,  // 爆炸粒子数量
        flashParticleSize: 100,      // 闪光粒子大小
        muzzleFlashCount: 20,        // 炮口闪光粒子数

        // 触手动画
        tentacleRiseSpeed: 25,       // 触手升起速度
        tentacleDragSpeed: 3,        // 触手拖拽速度

        // 天气系统
        rainCount: 100,              // 雨滴数量
        rainSpeed: 15,               // 雨滴基础速度
        lightningProbability: 0.002, // 闪电生成概率
        lightningDecay: 0.08,        // 闪电衰减速度
    },

    // 视觉特效参数
    visual: {
        // 星星背景
        starCount: 60,               // 星星数量
        starMinSize: 1,              // 星星最小尺寸
        starMaxSize: 6,              // 星星最大尺寸
        starMinSpeed: 0.02,          // 星星最小移动速度
        starMaxSpeed: 0.1,           // 星星最大移动速度

        // 云层
        cloudCount: 8,               // 云朵数量
        cloudMinSpeed: 0.1,          // 云朵最小移动速度
        cloudMaxSpeed: 0.2,          // 云朵最大移动速度

        // 月亮参数
        moonPulseSpeed: 0.4,         // 月亮脉动速度
        moonGlowRadius: 4,           // 月亮光晕倍数

        // 海浪参数
        waveAmplitude: 15,           // 波浪幅度
        waveSpeed: 20,               // 海浪滚动速度
        sparkleCount: 60,            // 海面波光数量

        // 晕影效果
        vignetteBaseAlpha: 2,      // 基础晕影透明度
        vignetteCriticalExtra: 4,  // 危急状态额外强度
        vignetteBreathSpeed: 2,      // 呼吸灯速度

        // 冲击帧
        impactFrameDuration: 30,     // 冲击帧持续时间(帧)
    },

    // 战斗系统参数
    combat: {
        // 掷骰动画
        rollAnimationFrames: 10,     // 掷骰动画帧数
        rollDisplayDelay: 50,        // 掷骰显示延迟(ms)

        // 炮弹等待
        cannonballWaitTime: 400,     // 炮弹等待时间(ms)
        enemyTurnDelay: 800,         // 敌方回合延迟(ms)
        lootShowDelay: 1000,         // 战利品显示延迟(ms)

        // AI参数
        enemyRerollThreshold: 0.5,   // 敌方重掷阈值(点数总和/最大潜力)

        // 战斗UI
        playerChoiceDelay: 500,      // 玩家选择延迟(ms)
        enemyRollDelay: 1200,        // 敌方掷骰延迟(ms)

        // 敌舰运动
        enemyApproachSpeed: 4,       // 敌舰接近速度
        enemyAmbushRange: 0.75,      // 敌舰伏击范围(屏幕比例)
    },

    // 敌方神器系统（v1.3.0：神器骰子敌我通用）
    // 神器效果归属"攻击方/防守方"角色：霜冻/燃烧/装甲/践踏跟随攻击方，中继器跟随防守方
    enemyArtifacts: {
        enabled: true,
        fromRound: 2,              // 从第3关(索引2)开始敌舰可能携带神器骰子
        chanceByRound: [0.15, 0.5],// 携带概率按关卡线性插值：第3关15% → 第13关50%
        pool: ['frost', 'relay', 'trample', 'burn', 'armor'], // 可用神器池（与玩家侧一致）
        lootStealEnabled: true,    // 击沉携带神器的敌舰后，战利品可能打捞到该神器骰子（神器归玩家所有）
    },

    // UI界面参数
    ui: {
        // HUD位置
        hudMargin: 20,               // HUD边距

        // 战斗显示
        battleDisplayGap: 20,        // 战斗骰子间距

        // 动作栏
        actionBarBottom: 40,         // 动作栏底部边距

        // 战利品
        lootCardSpacing: 15,         // 战利品卡片间距
        lootSelectionCount: 15,      // 战利品选择动画次数
        lootSelectionInterval: 100,  // 战利品选择间隔(ms)
        lootFlyDelay: 500,           // 战利品飞行延迟(ms)
        lootFlyDuration: 800,        // 战利品飞行持续时间(ms)

        // 游戏结束
        gameOverLootFloatDelay: 1000, // 游戏结束残骸漂浮延迟(ms)
        gameOverLootFloatTime: 3.0,  // 残骸漂浮时间(s)
    },

    // 怪物参数 (Leviathan)
    leviathan: {
        spawnProbability: 0.005,     // 生成概率
        moveSpeed: 1.5,               // 移动速度
        cooldownMin: 2000,            // 冷却时间下限
        headPulseSpeed: 3,            // 头部脉动速度
        tentacleWaveSpeed: 2,         // 触手波动速度
        tentacleCount: 6,             // 触手数量
        tentacleWidth: 15,            // 触手宽度
        tentacleSpacing: 60,          // 触手间距
    },

    // 音频系统配置
    audio: {
        masterVolume: 1,            // 主音量 (0-1)
        bgmVolume: 0.8,               // 背景音乐音量 (0-1)
        sfxVolume: 0.5,               // 音效音量 (0-1)

        // 音频文件路径
        files: {
            // 背景音乐
            mainMenu: 'audio/main-menu.ogg',
            battle: 'audio/battle.ogg',
            victory: 'audio/victory.ogg',
            defeat: 'audio/defeat.ogg',

            // 界面音效
            menuNavigate: 'audio/menu-navigate.ogg',
            menuConfirm: 'audio/menu-confirm.ogg',
            menuCancel: 'audio/menu-cancel.ogg',
            interfaceClose: 'audio/interface-close.ogg',

            // 游戏事件
            artifactUnlock: 'audio/artifact-unlock.ogg',
            merchantAppear: 'audio/merchant-appear.ogg',

            // 战斗音效
            diceRoll: 'audio/dice-roll.ogg',
            diceReroll: 'audio/dice-reroll.ogg',
            cannonFire: 'audio/cannon-fire.ogg',
            explosion: 'audio/explosion.ogg',
            diceFreeze: 'audio/dice-freeze.ogg',
            lootPickup: 'audio/loot-pickup.ogg',

            // 环境音效
            oceanWaves: 'audio/ocean-waves.ogg',

            // 反馈音效
            positiveFeedback: 'audio/ui-click.ogg'
        },

        // 音频播放设置
        bgmLoop: true,                // 背景音乐循环播放
        preloadCritical: true,        // 预加载关键音频
        maxConcurrentSFX: 5,          // 最大同时播放音效数量
        fadeTime: 1000,               // 背景音乐淡入淡出时间(ms)
    },

    // 测试控制台设置
    debug: {
        invulnerable: false,   // 玩家无敌模式
        showConsoleOnStart: false, // 启动时是否直接显示调试控制台
        logLevel: 'info'       // 日志级别: 'debug', 'info', 'warn', 'error'
    },

    // UI字体大小配置
    fontSizes: {
        global: "20px",        // 全局基础字体大小
        button: "16px",         // 按钮字体大小
        label: "12px",          // 标签字体大小
        title: "32px",         // 主标题字体大小
        subtitle: "20px",      // 副标题字体大小
        hud: "20px",           // HUD字体大小
        message: "20px"        // 消息文本字体大小
    },

    // UI文本配置
    text: {
        // 游戏标题
        gameTitle: "骰骨之海",
        gameSubtitle: "在黑色海浪的回音中，寻找终结",
        menuStoryMode: "故事模式",
        menuInfiniteMode: "无限模式",
        menuAchievements: "成就与统计",
        menuCompendium: "图鉴",
        menuComingSoon: "开发中...",
        menuBack: "返回",
        statsTotalGamesPrefix: "总航行次数",
        statsTotalEnemiesPrefix: "击败敌舰",
        statsTotalRoundsPrefix: "完成回合",
        statsTotalDamageDealtPrefix: "造成伤害",
        statsTotalDamageTakenPrefix: "受到伤害",
        statsTotalDiceRolledPrefix: "掷骰次数",
        statsTotalArtifactsPrefix: "获得Artifact",

        // 开始界面提示
        startGamePrompt: "按任意按键开始游戏",

        // 主菜单
        menuStartButton: ">>开启航程<<",

        // HUD标签
        hudLocationLabel: "当前位置",
        hudHealthLabel: "船体完整度",
        hudRoundFormat: "第 {current}/{total} 战",

        // 战斗按钮
        buttonFire: "开火",
        buttonReroll: "重新校准",
        buttonConfirmFire: "确认开火",

        // 战利品界面
        lootTitle: "检测到可回收残骸",
        lootStatus: "正在打捞碎片...",
        lootConfirmButton: "整合组件",

        // 游戏结束界面
        gameOverTitle: "舰船沉没",
        gameOverMessage: "关键组件发生灾难性故障",
        tutorialCompleteNote: "⚔ 新手教程已完成——再次进入将直达主界面",
        gameOverButton: "重新初始化系统",

        victoryTitle: "任务完成",
        victoryMessage: "所有海域威胁已肃清",
        victoryButton: "返回母港",

        // 神器骰子说明
        artifactFrostName: "霜冻",
        artifactFrostDescription: "【霜冻】\n在场时：每次攻击前，随机冻结一枚敌方骰子。\n被冻结的骰子无法参与进攻，且会变得极度脆弱——无论点数多高，只要受到1点伤害就会被摧毁。",
        artifactRelayName: "中继器",
        artifactRelayDescription: "【中继器】\n在场时：当对方攻击时，己方可以手动选择哪一枚骰子来承受伤害。\n可以保护重要骰子，或牺牲脆弱骰子来保全主力。",
        artifactTrampleName: "爆破者",
        artifactTrampleDescription: "【爆破者 - 传说品质】\n践踏效果：持有爆破者时，攻击对手骰子溢出的伤害会继续对其他骰子造成伤害。",
        artifactBurnName: "燃烧弹",
        artifactBurnDescription: "【燃烧弹 - 稀有品质】\n在场时：每当攻击敌方骰子并造成伤害后，为所有敌方骰子叠加「燃烧1」。\n燃烧X：在任意一方攻击结算结束后，所有拥有燃烧状态的骰子额外受到 X 点伤害（可叠加）。",
        artifactArmorName: "装甲弹",
        artifactArmorDescription: "【装甲弹 - 史诗品质】\n装甲1：在场时，攻击时每有一个掷出点数为1的骰子，就给我方船只上生成1个装甲骰子（6点）。\n装甲2：每有一个掷出点数为2的骰子，就生成1个装甲骰子（6点）。以此类推。\n装甲骰子不参与进攻，只提供防御强化。",

        // 神秘商人界面
        merchantName: "神秘商人",
        merchantDialogue: "不甘心就这么失败了？还是不甘心这么无趣？看看我从水面上捞起来了什么...下面这三个骰子，哪个是你不小心弄丢的？",
        merchantDialoguePhase2: "看来你已经掌握了一些力量... 在这两个里面再选一个吧。",
        merchantDialoguePhase3: "这是最后的馈赠，带着它去征服这片海域吧。",
        artifactConfirmButton: "选它",

        // 修理工界面 (已回退)
        repairmanName: "奇怪的修理工",
        repairmanTitle: "需要维修吗？",
        repairmanRepair: "修复所有骰子",
        repairmanLeave: "不需要，谢谢",

        // 目标选择界面 (已回退)
        targetSelectionTitle: "选择承受伤害的骰子",
        targetSelectionConfirm: "确认选择",

        // 神器骰子品质标签
        diceQualityArtifact: "神器",

        // 战斗状态消息
        battle: {
            allDiceFrozen: "所有骰子被冻结，无法进攻！",
            enemyAllDiceFrozen: "❄ 骰子被冻结！<br>跳过攻击 ⚡",
            clickDiceToTakeDamage: "🔀 点击要承受伤害的骰子，然后按Enter键确认",
            ambush: "遭遇闪击!"
        },

        // 调试日志文本 (修复崩溃的关键)
        debug: {
            engineReady: "游戏引擎就绪...",
            spawnEnemyCalled: "生成敌人 (第 {round} 关)...",
            roundLimitReached: "达到关卡上限，重新循环关卡配置",
            spawningEnemyForRound: "正在生成第 {round} 关的敌人，配置: {config}",
            enemySpawned: "敌人已生成，骰子数: {count}",
            rerollSourceDice: "重掷源骰子: {dice}",
            newRolls: "新点数: {rolls}",
            playerDefeated: "玩家在第 {round} 关被击败",
            callingShowLoot: "调用 showLoot()",
            playerHpZero: "玩家 HP 为 0，触发失败序列",
            showLootCalled: "showLoot 被调用，敌人初始骰子: {dice}",
            lootCardsCreated: "战利品卡片已创建: {count}",
            selectedLootDice: "已选择战利品骰子: {dice}, 延迟: {delay}ms",
            flyDiceCalled: "flyDice 被调用",
            flyAnimationStart: "飞行动画开始，持续时间: {duration}ms",
            flyAnimationComplete: "飞行动画完成",
            confirmLootCalled: "confirmLoot 被调用，骰子: {dice}",
            diceAdded: "骰子已添加到玩家，当前总数: {count}",
            resetToSailing: "重置状态为 SAILING"
        },

        // 骰子状态描述，未选择骰子时的展示
        dice: {
            unrevealed: "你想要哪个？",
            artifact: "神器"
        },

        // 测试控制台
        debugConsole: {
            title: "🎮 控制台"
        },
    }
};

// ============ v1.4.0 远程配表（Cloudflare Workers + D1） ============
// 启动时由 game.init() 拉取 /api/config/bundle 并调用本函数合并；
// 失败/超时/本地直开(file://)时静默跳过，仓库内置默认值保证游戏永远可玩。
// 真实调校数值只存在 D1，不进代码仓库。
window.applyRemoteConfig = function (bundle) {
    if (!bundle || typeof bundle !== 'object') return false;

    // 关卡表：整体替换（结构与本地一致：{count:[min,max], value:[min,max]}）
    if (Array.isArray(bundle.levels) && bundle.levels.length > 0) {
        GAME_CONFIG.levels = bundle.levels;
    }

    // 神器池：敌舰可携带池整体替换
    if (Array.isArray(bundle.artifacts) && bundle.artifacts.length > 0) {
        if (GAME_CONFIG.enemyArtifacts && Array.isArray(GAME_CONFIG.enemyArtifacts.pool)) {
            GAME_CONFIG.enemyArtifacts.pool = bundle.artifacts;
        }
    }

    // 点路径覆盖：{"player.ambushChance": 0.5} → GAME_CONFIG.player.ambushChance
    // 只覆盖已存在的键，防止脏数据注入新字段
    if (bundle.overrides && typeof bundle.overrides === 'object') {
        Object.keys(bundle.overrides).forEach((path) => {
            const keys = path.split('.');
            let node = GAME_CONFIG;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!node || typeof node[keys[i]] !== 'object') return;
                node = node[keys[i]];
            }
            const leaf = keys[keys.length - 1];
            if (node && leaf in node) node[leaf] = bundle.overrides[path];
        });
    }
    console.log('[v1.4.0] 远程配表已应用');
    return true;
};