// game.js - v1.3.0 (UNIVERSAL ARTIFACT SYSTEM 敌我通用神器机制)

// 音频管理器类
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.bgmGain = null;
        this.sfxGain = null;
        this.currentBGM = null;
        this.currentBGMKey = null; // 记录当前播放的 BGM 键名
        this.audioCache = new Map();
        this.activeSFX = new Set();
        this.initialized = false;
        this.useHTML5Audio = false; // file:// 协议备用方案
        this.html5AudioElements = new Map(); // 缓存 HTML5 Audio 元素
        this.loadingBGM = null; // 正在加载中的 BGM 对象 (HTML5)
    }

    // 初始化音频系统
    async init() {
        try {
            // 延迟初始化音频上下文，直到用户交互
            this.audioContext = null;
            this.initialized = false;
            console.log("Audio system prepared (waiting for user interaction)");

        } catch (e) {
            console.warn("Audio system preparation failed:", e);
        }
    }

    // 在用户第一次交互时激活音频系统
    async activateAudio() {
        if (this.initialized) {
            console.log("Audio system already initialized");
            return;
        }

        console.log("Activating audio system...");

        // 检查配置是否存在
        if (!GAME_CONFIG || !GAME_CONFIG.audio) {
            console.error("Audio configuration not found, using HTML5 fallback");
            this.useHTML5Audio = true;
            this.initialized = true;
            return;
        }

        // 检查是否使用 file:// 协议
        this.useHTML5Audio = (window.location.protocol === 'file:');

        if (this.useHTML5Audio) {
            console.log("Using file:// protocol, falling back to HTML5 Audio");
            this.initialized = true;
            console.log("HTML5 Audio fallback activated");
            return;
        }

        try {
            // 检查浏览器支持
            if (!window.AudioContext && !window.webkitAudioContext) {
                console.warn("Browser does not support Web Audio API, falling back to HTML5 Audio");
                this.useHTML5Audio = true;
                this.initialized = true;
                console.log("HTML5 Audio fallback activated");
                return;
            }

            console.log("Creating AudioContext...");
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            if (!this.audioContext) {
                throw new Error('Failed to create AudioContext');
            }

            console.log("AudioContext created, initial state:", this.audioContext.state);

            // 在某些浏览器中，音频上下文可能被暂停，需要恢复
            if (this.audioContext.state === 'suspended') {
                console.log("AudioContext is suspended, resuming...");
                await this.audioContext.resume();
                console.log("AudioContext resumed, new state:", this.audioContext.state);
            }

            console.log("Creating gain nodes...");
            this.masterGain = this.audioContext.createGain();
            this.bgmGain = this.audioContext.createGain();
            this.sfxGain = this.audioContext.createGain();

            if (!this.masterGain || !this.bgmGain || !this.sfxGain) {
                throw new Error('Failed to create gain nodes');
            }

            console.log("Connecting audio graph...");
            this.masterGain.connect(this.audioContext.destination);
            this.bgmGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);

            // 设置初始音量（带默认值保护）
            const masterVol = GAME_CONFIG.audio.masterVolume || 0.7;
            const bgmVol = GAME_CONFIG.audio.bgmVolume || 0.5;
            const sfxVol = GAME_CONFIG.audio.sfxVolume || 0.8;

            this.setMasterVolume(masterVol);
            this.setBGMVolume(bgmVol);
            this.setSFXVolume(sfxVol);

            this.initialized = true;
            console.log("Audio system activated successfully!");
            console.log("AudioContext state:", this.audioContext.state);
            console.log("Master gain:", this.masterGain.gain.value);
            console.log("SFX gain:", this.sfxGain.gain.value);
            console.log("BGM gain:", this.bgmGain.gain.value);
            console.log("Available audio files:", Object.keys(GAME_CONFIG.audio.files));

            // 预加载关键音频
            if (GAME_CONFIG.audio.preloadCritical) {
                console.log("Preloading critical audio...");
                this.preloadCriticalAudio();
            }

        } catch (e) {
            console.error("Audio system activation failed:", e);
            // 如果 Web Audio API 失败，尝试使用 HTML5 Audio 备用方案
            console.log("Falling back to HTML5 Audio...");
            this.useHTML5Audio = true;
            this.initialized = true;
            console.log("HTML5 Audio fallback activated");
        }
    }

    // 设置主音量
    setMasterVolume(volume) {
        if (this.masterGain && this.masterGain.gain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume || 0.7));
        }
    }

    // 设置背景音乐音量
    setBGMVolume(volume) {
        if (this.bgmGain && this.bgmGain.gain) {
            this.bgmGain.gain.value = Math.max(0, Math.min(1, volume || 0.5));
        }
    }

    // 设置音效音量
    setSFXVolume(volume) {
        if (this.sfxGain && this.sfxGain.gain) {
            this.sfxGain.gain.value = Math.max(0, Math.min(1, volume || 0.8));
        }
    }

    // 加载音频文件
    async loadAudio(url) {
        if (this.audioCache.has(url)) {
            return this.audioCache.get(url);
        }

        // 如果使用 HTML5 Audio 备用方案，不需要加载 AudioBuffer
        if (this.useHTML5Audio) {
            console.log(`Using HTML5 Audio fallback, skipping Web Audio load: ${url}`);
            return null; // 返回 null 表示使用备用方案
        }

        try {
            console.log(`Loading audio: ${url}`);
            const response = await fetch(url);

            if (!response.ok) {
                console.error(`HTTP ${response.status} ${response.statusText}: ${url}`);
                console.error('请检查：');
                console.error('1. 文件是否存在: ' + url);
                console.error('2. HTTP服务器是否正常运行');
                console.error('3. 文件路径是否正确');
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            console.log(`Audio loaded: ${url} (${(arrayBuffer.byteLength / 1024).toFixed(2)} KB)`);

            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            console.log(`Audio decoded: ${url} (${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.sampleRate}Hz)`);

            this.audioCache.set(url, audioBuffer);
            return audioBuffer;
        } catch (e) {
            console.warn(`Failed to load audio: ${url}`, e);
            if (e.message.includes('CORS') || e.message.includes('file://')) {
                console.log('CORS detected, will use HTML5 Audio fallback');
            } else if (e.message.includes('404') || e.message.includes('HTTP 404')) {
                console.error(`❌ 文件不存在: ${url}`);
                console.error('请检查config.js中的文件路径是否正确');
            } else if (e.message.includes('decodeAudioData') || e.message.includes('NotSupportedError')) {
                console.error(`❌ 音频文件格式错误或损坏: ${url}`);
                console.error('请检查音频文件是否完整');
            }
            return null;
        }
    }

    // 播放音效
    async playSFX(audioKey, loop = false) {
        // 如果音频系统未激活，先激活它
        if (!this.initialized) {
            await this.activateAudio();
        }

        if (!this.initialized || !GAME_CONFIG.audio.files[audioKey]) {
            console.warn(`Cannot play SFX ${audioKey}: system not initialized or file not found`);
            return;
        }

        // 使用 HTML5 Audio 备用方案
        if (this.useHTML5Audio) {
            return this.playSFXWithHTML5(audioKey);
        }

        // 确保 AudioContext 处于运行状态
        if (this.audioContext.state === 'suspended') {
            console.log('AudioContext is suspended, attempting to resume...');
            try {
                await this.audioContext.resume();
                console.log('AudioContext resumed, new state:', this.audioContext.state);
            } catch (e) {
                console.warn('Failed to resume AudioContext:', e);
                return;
            }
        }

        // 限制同时播放的音效数量
        if (this.activeSFX.size >= GAME_CONFIG.audio.maxConcurrentSFX) {
            console.warn(`Too many concurrent SFX (${this.activeSFX.size}), skipping ${audioKey}`);
            return;
        }

        try {
            const url = GAME_CONFIG.audio.files[audioKey];
            console.log(`Loading audio for SFX: ${audioKey} from ${url}`);
            const audioBuffer = await this.loadAudio(url);
            if (!audioBuffer) {
                console.warn(`Failed to load audio buffer for ${audioKey}, trying HTML5 fallback`);
                return this.playSFXWithHTML5(audioKey);
            }

            console.log(`Creating AudioBufferSourceNode for ${audioKey}`);
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.loop = loop;
            source.connect(this.sfxGain);

            const sfxId = Symbol(audioKey);
            this.activeSFX.add(sfxId);

            source.onended = () => {
                this.activeSFX.delete(sfxId);
                console.log(`SFX ended: ${audioKey}`);
            };

            console.log(`Starting SFX playback: ${audioKey}`);
            source.start();
            console.log(`SFX playing: ${audioKey}`);

            return source;
        } catch (e) {
            console.warn(`Failed to play SFX: ${audioKey}, trying HTML5 fallback`, e);
            return this.playSFXWithHTML5(audioKey);
        }
    }

    // 播放背景音乐
    async playBGM(audioKey, fadeIn = true) {
        // 防止重复播放相同的背景音乐
        if (this.currentBGMKey === audioKey) {
            return;
        }

        // 强制停止当前正在播放的所有背景音乐逻辑
        this.fadeOutBGM();

        // 如果音频系统未激活，先激活它
        if (!this.initialized) {
            await this.activateAudio();
        }

        if (!this.initialized || !GAME_CONFIG.audio.files[audioKey]) {
            return;
        }

        // 更新当前 BGM 键名
        this.currentBGMKey = audioKey;

        // 使用 HTML5 Audio 备用方案
        if (this.useHTML5Audio) {
            return this.playBGMWithHTML5(audioKey);
        }

        // 确保 AudioContext 处于运行状态
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (e) {
                return;
            }
        }

        try {
            const url = GAME_CONFIG.audio.files[audioKey];
            let audioBuffer = await this.loadAudio(url);

            // 如果主文件加载失败，尝试备用方案
            if (!audioBuffer) {
                const fallbackMap = {
                    'victory': 'battle',
                    'defeat': 'battle',
                    'battle': 'mainMenu',
                    'mainMenu': null
                };

                const fallbackKey = fallbackMap[audioKey];
                if (fallbackKey && GAME_CONFIG.audio.files[fallbackKey]) {
                    const fallbackUrl = GAME_CONFIG.audio.files[fallbackKey];
                    audioBuffer = await this.loadAudio(fallbackUrl);
                    if (!audioBuffer) {
                        return this.playBGMWithHTML5(audioKey);
                    }
                } else {
                    return this.playBGMWithHTML5(audioKey);
                }
            }

            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.loop = GAME_CONFIG.audio.bgmLoop;
            source.connect(this.bgmGain);

            if (fadeIn) {
                const fadeTime = GAME_CONFIG.audio.fadeTime / 1000;
                this.bgmGain.gain.setValueAtTime(0, this.audioContext.currentTime);
                this.bgmGain.gain.linearRampToValueAtTime(GAME_CONFIG.audio.bgmVolume, this.audioContext.currentTime + fadeTime);
            }

            source.start();
            this.currentBGM = source;
        } catch (e) {
            return this.playBGMWithHTML5(audioKey);
        }
    }

    // 停止背景音乐
    stopBGM() {
        this.fadeOutBGM();
    }

    // 停止背景音乐
    fadeOutBGM() {
        // 如果有正在加载中的 BGM，也需要停止它
        if (this.loadingBGM) {
            try {
                this.loadingBGM.pause();
                this.loadingBGM.src = "";
            } catch (e) { }
            this.loadingBGM = null;
        }

        if (!this.currentBGM) {
            this.currentBGMKey = null;
            return;
        }

        const currentBGMToStop = this.currentBGM;
        this.currentBGM = null;
        this.currentBGMKey = null;

        if (this.useHTML5Audio) {
            // HTML5 Audio 模式
            try {
                if (currentBGMToStop.pause) {
                    currentBGMToStop.pause();
                    currentBGMToStop.src = ""; // 彻底释放资源，防止后台继续加载或播放
                }
            } catch (e) { }
        } else {
            // Web Audio API 模式
            if (this.bgmGain) {
                const fadeTime = GAME_CONFIG.audio.fadeTime / 1000;
                this.bgmGain.gain.cancelScheduledValues(this.audioContext.currentTime);
                this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, this.audioContext.currentTime);
                this.bgmGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeTime);

                setTimeout(() => {
                    try {
                        currentBGMToStop.stop();
                    } catch (e) {
                        // 忽略已停止的错误
                    }
                }, GAME_CONFIG.audio.fadeTime);
            }
        }
    }

    // 使用 HTML5 Audio 播放音效（备用方案）
    playSFXWithHTML5(audioKey) {
        try {
            const url = GAME_CONFIG.audio.files[audioKey];
            console.log(`Playing SFX with HTML5 Audio: ${audioKey} from ${url}`);

            const audio = new Audio(url);
            audio.volume = GAME_CONFIG.audio.sfxVolume * GAME_CONFIG.audio.masterVolume;
            audio.preload = 'auto';

            const sfxId = Symbol(audioKey);
            this.activeSFX.add(sfxId);

            audio.onended = () => {
                this.activeSFX.delete(sfxId);
                console.log(`HTML5 SFX ended: ${audioKey}`);
            };

            audio.onerror = (e) => {
                console.warn(`HTML5 SFX failed: ${audioKey}`, e);
                this.activeSFX.delete(sfxId);
            };

            // 播放音频（返回 Promise）
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log(`HTML5 SFX playing: ${audioKey}`);
                }).catch(e => {
                    console.warn(`HTML5 SFX play failed: ${audioKey}`, e);
                    this.activeSFX.delete(sfxId);
                });
            }

            return audio;
        } catch (e) {
            console.warn(`Failed to create HTML5 SFX: ${audioKey}`, e);
            return null;
        }
    }

    // 使用 HTML5 Audio 播放背景音乐（备用方案）
    playBGMWithHTML5(audioKey) {
        try {
            // 防止重复播放相同的背景音乐
            if (this.currentBGM && this.currentBGMKey === audioKey) {
                return this.currentBGM;
            }

            // 停止当前BGM的逻辑已在 playBGM 中处理

            const url = GAME_CONFIG.audio.files[audioKey];
            const audio = new Audio(url);

            // 立即标记为正在加载，这样如果此时调用 stopBGM，可以拦截到它
            this.loadingBGM = audio;

            audio.volume = GAME_CONFIG.audio.bgmVolume * GAME_CONFIG.audio.masterVolume;
            audio.preload = 'auto';
            audio.loop = GAME_CONFIG.audio.bgmLoop;

            // 播放音频
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // 如果在加载期间没有被清空（即没有调用 stopBGM）
                    if (this.loadingBGM === audio) {
                        this.currentBGM = audio;
                        this.currentBGMKey = audioKey;
                        this.loadingBGM = null;
                    } else {
                        // 如果已经被替换或要求停止，则立即停掉这个刚刚加载好的音频
                        audio.pause();
                        audio.src = "";
                    }
                }).catch(e => {
                    console.warn(`HTML5 BGM play failed: ${audioKey}`, e);
                    if (this.loadingBGM === audio) this.loadingBGM = null;
                });
            }

            return audio;
        } catch (e) {
            return null;
        }
    }

    // 停止所有音频
    stopAll() {
        if (this.currentBGM) {
            if (this.useHTML5Audio && this.currentBGM.pause) {
                this.currentBGM.pause();
            } else if (this.currentBGM.stop) {
                this.currentBGM.stop();
            }
            this.currentBGM = null;
        }
        this.activeSFX.clear();
    }

    // 预加载关键音频
    async preloadCriticalAudio() {
        const criticalAudio = [
            'menuConfirm', 'menuCancel', 'diceRoll', 'cannonFire',
            'explosion', 'lootPickup', 'artifactUnlock'
        ];

        for (const key of criticalAudio) {
            if (GAME_CONFIG.audio.files[key]) {
                await this.loadAudio(GAME_CONFIG.audio.files[key]);
            }
        }
    }
}

const game = {
    state: "CINEMATIC_MENU", // 开始界面改为电影般的展示
    round: 0,
    time: 0,
    player: { x: 0, y: 0, dice: [] },
    enemy: null,
    currentRolls: [],
    shake: 0,
    stars: [],
    particles: [],
    floatingTexts: [],
    clouds: [],
    cannonballs: [],
    lootDice: null,
    canReroll: true, // 重掷标记
    gameOverPhase: 0, // 0:None, 1:TentacleRise, 2:DragDown, 3:Debris
    tentacles: [], // 多根触手
    floatingLoot: [],
    leviathan: { active: false, x: 0, y: 0, cooldown: 600 },
    // 冲击帧系统：玩家HP归零时的视觉冲击效果
    impactFrames: 0, // 剩余冲击帧数（0=无冲击）
    impactCanvas: null, // 缓存上一帧的画面用于反转

    // 修理工 & 神器系统
    firstDefeat: true, // 是否是第一次失败
    selectedArtifact: null, // 当前在修理工界面选择的神器ID
    activeArtifact: null,   // 兼容旧代码，暂时保留
    acquiredArtifacts: [], // 已获得的神器列表
    availableArtifacts: ['frost', 'relay', 'trample'], // 剩余可获得的神器列表（暂不包含燃烧弹，后续由商人系统接入）

    // 商人系统：第二次游戏中击败第一个敌人后出现
    gameAttempt: 1, // 第几次游戏尝试
    merchantShown: false, // 是否已经显示过商人

    // 炮筒动画系统
    cannonAnim: { player: 0, enemy: 0 }, // 炮筒伸缩动画状态（0-1之间）

    // 开始界面系统
    cinematicState: "WAITING", // WAITING -> TITLE_EMERGING -> STARTING
    titleY: -100, // 标题上升位置
    audioManager: null, // 音频管理器
    // v0.6.5 视觉特效系统
    // v0.6.5 视觉特效系统
    weather: { rain: [], lightningFlash: 0 },
    lastBob: 0, // 用于计算浪花速度
    // 闪击UI系统
    ambushText: { active: false, life: 0 }, // 闪击文本显示状态
    // 持久化统计数据 (使用配置作为模板)
    stats: { ...GAME_CONFIG.initialStats },
    // 从配置中获取颜色
    get colors() { return GAME_CONFIG.colors; },

    async init() {
        this.canvas = document.getElementById('g');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.resize();
        window.onresize = () => this.resize();
        this.initUIFontSizes();
        this.initUIText();
        this.loadStats(); // 加载统计数据
        this.bindCinematicEvents();
        this.bindEvents();
        this.initStars();
        this.initClouds();
        this.initWeather();
        this.bindMainMenuEvents();

        // 初始化音频系统
        this.audioManager = new AudioManager();
        this.audioManager.init();

        // 在电影界面开始时隐藏HUD
        if (this.state === "CINEMATIC_MENU") {
            document.getElementById('hud').classList.add('hidden');
        }

        this.loop();
        console.log(GAME_CONFIG.text.debug.engineReady);
    },

    // 初始化UI字体大小
    initUIFontSizes() {
        const fontSizes = GAME_CONFIG.fontSizes;
        const root = document.documentElement;

        root.style.setProperty('--font-global', fontSizes.global);
        root.style.setProperty('--font-button', fontSizes.button);
        root.style.setProperty('--font-label', fontSizes.label);
        root.style.setProperty('--font-title', fontSizes.title);
        root.style.setProperty('--font-subtitle', fontSizes.subtitle);
        root.style.setProperty('--font-hud', fontSizes.hud);
        root.style.setProperty('--font-message', fontSizes.message);
    },

    // 初始化UI文本
    initUIText() {
        const text = GAME_CONFIG.text;

        // 开始界面提示
        this.setElementText('start-game-prompt', text.startGamePrompt);

        // 主菜单
        this.setElementText('game-title', text.gameTitle);
        this.setElementText('game-subtitle', text.gameSubtitle);
        this.setElementText('menu-start-btn', text.menuStartButton);

        // HUD
        this.setElementText('hud-location-label', text.hudLocationLabel);
        this.setElementText('hud-health-label', text.hudHealthLabel);

        // 游戏结束界面
        this.setElementText('gameover-title', text.gameOverTitle);
        this.setElementText('gameover-message', text.gameOverMessage);
        this.setElementText('gameover-button', text.gameOverButton);

        // 胜利界面
        this.setElementText('victory-title', text.victoryTitle);
        this.setElementText('victory-message', text.victoryMessage);
        this.setElementText('victory-button', text.victoryButton);

        // 商人界面
        this.setElementText('merchant-name', text.merchantName);
        this.setElementText('merchant-dialogue-text', text.merchantDialogue);

        // 战利品界面
        this.setElementText('loot-title', text.lootTitle);
        this.setElementText('loot-status', text.lootStatus);
        this.setElementText('loot-confirm-btn', text.lootConfirmButton);

        // 战斗按钮
        this.setElementText('btn-fire', text.buttonFire);
        this.setElementText('btn-reroll', text.buttonReroll);
        this.setElementText('btn-keep', text.buttonConfirmFire);

        // 测试控制台
        this.setElementText('debug-console-title', text.debugConsole.title);

        // 处理所有带有data-text-key属性的元素
        this.initDynamicTextElements();
    },

    // 处理带有data-text-key属性的动态文本元素
    initDynamicTextElements() {
        const elements = document.querySelectorAll('[data-text-key]');
        elements.forEach(element => {
            const textKey = element.getAttribute('data-text-key');
            if (textKey) {
                const textValue = this.getNestedTextValue(GAME_CONFIG.text, textKey);
                if (textValue !== undefined) {
                    element.textContent = textValue;
                }
            }
        });
    },

    // 获取嵌套对象中的文本值，支持点号分隔的键名
    getNestedTextValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    },

    // 安全的设置元素文本的辅助函数
    setElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        } else {
            console.warn(`Element with id '${elementId}' not found, skipping text setting`);
        }
    },

    // 更新HP显示：百分比 + 颜色渐变
    updateHpDisplay() {
        const hpElement = document.getElementById('p-hp');
        if (!hpElement || !this.player.maxHp) return;

        const currentHp = this.player.dice.length > 0 ? this.player.dice.reduce((a, b) => a + b.v, 0) : 0;
        const percentage = this.player.maxHp > 0 ? Math.round((currentHp / this.player.maxHp) * 100) : 0;

        // 设置文本
        hpElement.textContent = `${percentage}%`;

        // 计算颜色渐变：从绿色(100%)到红色(0%)
        const color = this.getHpColor(percentage);
        hpElement.style.color = color;

        // 更新神器显示
        this.updateArtifactDisplay();
    },

    // 更新神器显示
    updateArtifactDisplay() {
        const artifactHud = document.getElementById('artifact-hud');
        const artifactContainer = document.getElementById('artifact-container');

        if (!artifactHud || !artifactContainer) return;

        // 清空现有内容
        artifactContainer.innerHTML = '';

        // 收集所有神器骰子
        const artifactDice = [];
        if (this.player && this.player.dice) {
            this.player.dice.forEach(die => {
                if (die.artifactId) {
                    artifactDice.push(die);
                }
            });
        }

        if (artifactDice.length > 0) {
            // 显示神器HUD
            artifactHud.classList.remove('hidden');

            // 按顺序显示所有神器骰子（从左到右）
            artifactDice.forEach(die => {
                if (die.artifactId === 'frost') {
                    const artifactElement = document.createElement('div');
                    artifactElement.className = 'artifact-dice frost';
                    artifactElement.textContent = '❄';
                    artifactElement.title = '霜冻神器：每次攻击随机冻结一枚敌方骰子，使其无法进攻且脆弱（1点伤害即摧毁）';
                    artifactContainer.appendChild(artifactElement);
                } else if (die.artifactId === 'relay') {
                    const artifactElement = document.createElement('div');
                    artifactElement.className = 'artifact-dice relay';
                    artifactElement.textContent = '🔀';
                    artifactElement.title = '中继器：敌方攻击时可手动选择承受伤害的骰子';
                    artifactContainer.appendChild(artifactElement);
                } else if (die.artifactId === 'trample') {
                    const artifactElement = document.createElement('div');
                    artifactElement.className = 'artifact-dice trample';
                    artifactElement.textContent = '💥';
                    artifactElement.title = '爆破者：践踏效果，攻击对手骰子溢出的伤害会继续对其他骰子造成伤害';
                    artifactContainer.appendChild(artifactElement);
                } else if (die.artifactId === 'burn') {
                    const artifactElement = document.createElement('div');
                    artifactElement.className = 'artifact-dice burn';
                    artifactElement.textContent = '🔥';
                    artifactElement.title = '燃烧弹：攻击敌方后，为所有敌方骰子叠加燃烧，使其在之后的攻击结算后持续受到伤害';
                    artifactContainer.appendChild(artifactElement);
                } else if (die.artifactId === 'armor') {
                    const artifactElement = document.createElement('div');
                    artifactElement.className = 'artifact-dice armor';
                    artifactElement.textContent = '🛡️';
                    artifactElement.title = '装甲弹：攻击时每有一个掷出点数为1的骰子，就给我方船只上生成1个装甲骰子（6点，不参与进攻）';
                    artifactContainer.appendChild(artifactElement);
                }
            });
        } else {
            // 隐藏神器HUD
            artifactHud.classList.add('hidden');
        }
    },

    // 根据HP百分比计算颜色（绿色到红色渐变）
    getHpColor(percentage) {
        // 从绿色(0,255,0)渐变到红色(255,0,0)
        const red = Math.round(255 * (1 - percentage / 100));
        const green = Math.round(255 * (percentage / 100));
        return `rgb(${red}, ${green}, 0)`;
    },

    // 获取骰子的显示属性（统一所有UI的骰子显示）
    getDieDisplayProperties(die) {
        const isFrozen = !!die.isFrozen;
        const isArmorDie = !!die.isArmor; // 装甲骰子
        const isFrostArtifact = die.artifactId === 'frost';
        const isRelayArtifact = die.artifactId === 'relay';
        const isTrampleArtifact = die.artifactId === 'trample';
        const isBurnArtifact = die.artifactId === 'burn';
        const isArmorArtifact = die.artifactId === 'armor';

        let dieColor = '#fff';
        let barColor = null; // 连接条颜色
        let showIceEffect = false;

        if (isFrozen) {
            dieColor = '#00ccff'; // 冻结状态：冰蓝色
            barColor = '#00ccff';
            showIceEffect = true;
        } else if (isArmorDie) {
            dieColor = '#ffff00'; // 装甲骰子：亮黄色
            barColor = '#ffff00';
        } else if (isFrostArtifact) {
            dieColor = '#0099ff'; // 霜冻神器：深冰蓝色
            barColor = '#0099ff';
        } else if (isRelayArtifact) {
            dieColor = '#aa00ff'; // 中继器神器：紫色
            barColor = '#aa00ff';
        } else if (isTrampleArtifact) {
            dieColor = '#ff6600'; // 爆破者神器：橙色
            barColor = '#ff6600';
        } else if (isBurnArtifact) {
            dieColor = '#ff9933'; // 燃烧弹神器：橙红色
            barColor = '#ff9933';
        } else if (isArmorArtifact) {
            dieColor = '#ffd700'; // 装甲弹神器：金色
            barColor = '#ffd700';
        }

        return {
            dieColor,
            barColor,
            showIceEffect,
            artifactName: die.name || (
                isArmorDie ? '装甲' :
                    isFrostArtifact ? '霜冻' :
                        isRelayArtifact ? '中继器' :
                            isTrampleArtifact ? '爆破者' :
                                isBurnArtifact ? '燃烧弹' :
                                    isArmorArtifact ? '装甲弹' :
                                        null
            )
        };
    },

    // 音频播放方法（带错误处理，确保不会中断游戏）
    async playSFX(audioKey) {
        try {
            if (this.audioManager) {
                await this.audioManager.playSFX(audioKey);
            }
        } catch (e) {
            console.warn(`Failed to play SFX ${audioKey}:`, e);
            // 不抛出错误，确保游戏继续运行
        }
    },

    async playBGM(audioKey, fadeIn = true) {
        try {
            if (this.audioManager) {
                await this.audioManager.playBGM(audioKey, fadeIn);
            }
        } catch (e) {
            console.warn(`Failed to play BGM ${audioKey}:`, e);
            // 不抛出错误，确保游戏继续运行
        }
    },

    stopBGM() {
        try {
            if (this.audioManager) {
                this.audioManager.fadeOutBGM();
            }
        } catch (e) {
            console.warn('Failed to stop BGM:', e);
            // 不抛出错误，确保游戏继续运行
        }
    },

    // 播放雷鸣音效（标题升起时）
    playThunderSound() {
        // 雷声音效已被移除
    },

    // 开始标题升起动画
    async startTitleEmergence() {
        if (this.cinematicState !== "WAITING") return;
        this.cinematicState = "TITLE_EMERGING";

        // 清理可能存在的旧定时器
        if (this.cinematicTimeouts) {
            this.cinematicTimeouts.forEach(clearTimeout);
        }
        this.cinematicTimeouts = [];

        // 隐藏开始游戏提示
        document.getElementById('start-game-prompt').style.display = 'none';

        // 播放主菜单背景音乐
        this.playBGM('mainMenu');

        // 播放雷鸣音效
        await this.playThunderSound();

        // 添加HTML标题容器
        const titleContainer = document.createElement('div');
        titleContainer.className = 'title-container';
        this.titleContainer = titleContainer;

        const titleElement = document.createElement('div');
        titleElement.className = 'title-emerging';
        titleElement.textContent = GAME_CONFIG.text.gameTitle;

        const subtitleElement = document.createElement('div');
        subtitleElement.className = 'game-subtitle';
        subtitleElement.textContent = GAME_CONFIG.text.gameSubtitle;
        this.titleSubtitle = subtitleElement; // 存储引用以便后续控制

        titleContainer.appendChild(titleElement);
        titleContainer.appendChild(subtitleElement);
        document.getElementById('screen-menu').appendChild(titleContainer);

        // 触发初始升起动画
        this.cinematicTimeouts.push(setTimeout(() => {
            titleContainer.classList.add('show');
            // 1秒后显示副标题
            this.cinematicTimeouts.push(setTimeout(() => {
                subtitleElement.style.opacity = '1';
            }, 1000));
        }, 100));

        // 2秒后显示主菜单
        this.cinematicTimeouts.push(setTimeout(() => {
            if (this.state !== "CINEMATIC_MENU" || this.cinematicState !== "TITLE_EMERGING") return;
            this.showMainMenu();
        }, 3000));
    },

    // 显示主菜单
    showMainMenu() {
        this.state = "MAIN_MENU";
        this.cinematicState = "FINISHED";

        // 标题切换到 Header 状态 (上移、缩放、发光)
        if (this.titleContainer) {
            this.titleContainer.classList.add('header');
        }

        const menuContainer = document.getElementById('main-menu-container');
        if (menuContainer) {
            // 延迟显示按钮，让标题先飞一会儿
            setTimeout(() => {
                menuContainer.classList.add('show');
                // 播放界面打开音效
                this.playSFX('interfaceOpen');
            }, 500);
        }
    },

    // 绑定主菜单事件
    bindMainMenuEvents() {
        document.getElementById('btn-story-mode')?.addEventListener('click', () => {
            this.playSFX('menuConfirm');
            const menuContainer = document.getElementById('main-menu-container');
            menuContainer.classList.remove('show');

            // 延迟一点开始，给按钮动画时间
            setTimeout(() => {
                document.getElementById('screen-menu').classList.add('hidden');
                // 显示HUD
                document.getElementById('hud').classList.remove('hidden');

                // 增加总游戏次数并保存
                this.stats.total_games_played++;
                this.saveStats();

                this.start();
            }, 300);
        });

        const placeholderHandler = () => {
            this.playSFX('menuCancel');
            alert(GAME_CONFIG.text.menuComingSoon);
        };

        document.getElementById('btn-infinite-mode')?.addEventListener('click', placeholderHandler);

        document.getElementById('btn-achievements')?.addEventListener('click', () => {
            this.playSFX('menuConfirm');
            // 更新统计数据展示
            document.getElementById('stat-total-games').textContent = this.stats.total_games_played;
            document.getElementById('stat-total-enemies').textContent = this.stats.total_enemies_defeated;
            document.getElementById('stat-total-rounds').textContent = this.stats.total_rounds_completed;
            document.getElementById('stat-total-damage-dealt').textContent = this.stats.total_damage_dealt;
            document.getElementById('stat-total-damage-taken').textContent = this.stats.total_damage_taken;
            document.getElementById('stat-total-dice-rolled').textContent = this.stats.total_dice_rolled;
            document.getElementById('stat-total-artifacts').textContent = this.stats.total_artifacts_collected;

            // 显示界面
            document.getElementById('screen-stats').classList.remove('hidden');
        });

        document.getElementById('btn-stats-back')?.addEventListener('click', () => {
            this.playSFX('menuCancel');
            document.getElementById('screen-stats').classList.add('hidden');
        });

        document.getElementById('btn-compendium')?.addEventListener('click', placeholderHandler);
    },

    // 更新炮筒动画状态
    updateCannonAnim() {
        // 炮筒动画衰减：每帧减少一定量
        const decayRate = 0.15; // 动画速度，可配置
        if (this.cannonAnim.player > 0) {
            this.cannonAnim.player = Math.max(0, this.cannonAnim.player - decayRate);
        }
        if (this.cannonAnim.enemy > 0) {
            this.cannonAnim.enemy = Math.max(0, this.cannonAnim.enemy - decayRate);
        }
    },

    // 绘制电影般的开始界面
    drawCinematicMenu() {
        // 深邃黑色背景
        this.ctx.fillStyle = '#000510';
        this.ctx.fillRect(0, 0, this.w, this.h);

        // 绘制深邃黑色海浪（先绘制背景层）
        this.drawDeepSeaWaves();

        // 绘制船只剪影
        this.drawShipSilhouettes();

        // 最后绘制月亮（在上方，避免覆盖其他元素）
        this.drawCinematicMoon();
    },

    // 绘制硕大月亮（调整大小避免覆盖船只）
    drawCinematicMoon() {
        const centerX = this.w * 0.75;
        const centerY = this.h * 0.25; // 向上移动，避免覆盖船只区域
        const radius = Math.min(this.w, this.h) * 0.25; // 减小尺寸到25%，避免覆盖下半部分

        // 月亮光晕（减小影响范围）
        const grd = this.ctx.createRadialGradient(centerX, centerY, radius * 0.8, centerX, centerY, radius * 1.2);
        grd.addColorStop(0, 'rgba(100, 80, 140, 0.4)'); // 增加不透明度
        grd.addColorStop(0.7, 'rgba(40, 20, 60, 0.1)');
        grd.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = grd;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius * 1.2, 0, Math.PI * 2);
        this.ctx.fill();

        // 绘制月亮主体
        this.drawDiceMoon(centerX, centerY, radius);
    },

    // 绘制骰子纹理月亮
    drawDiceMoon(centerX, centerY, radius) {
        const pixelSize = Math.max(2, Math.floor(radius / 20));

        // 月亮基础形状
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // 在月亮上绘制骰子点数纹理
        this.ctx.fillStyle = '#2a2a4e';
        const dicePatterns = [
            // 1点
            [{ x: 0, y: 0 }],
            // 2点
            [{ x: -0.3, y: -0.3 }, { x: 0.3, y: 0.3 }],
            // 3点
            [{ x: -0.3, y: -0.3 }, { x: 0, y: 0 }, { x: 0.3, y: 0.3 }],
            // 4点
            [{ x: -0.3, y: -0.3 }, { x: 0.3, y: -0.3 }, { x: -0.3, y: 0.3 }, { x: 0.3, y: 0.3 }],
            // 5点
            [{ x: -0.3, y: -0.3 }, { x: 0.3, y: -0.3 }, { x: 0, y: 0 }, { x: -0.3, y: 0.3 }, { x: 0.3, y: 0.3 }],
            // 6点
            [{ x: -0.3, y: -0.4 }, { x: 0.3, y: -0.4 }, { x: -0.3, y: 0 }, { x: 0.3, y: 0 }, { x: -0.3, y: 0.4 }, { x: 0.3, y: 0.4 }]
        ];

        // 减慢骰子变化速度：每3秒变化一次
        const diceFace = Math.floor((this.time / 3) % 6) + 1;
        const pattern = dicePatterns[diceFace - 1];

        // 绘制骰子点数
        pattern.forEach(dot => {
            const dotX = centerX + dot.x * radius * 0.6;
            const dotY = centerY + dot.y * radius * 0.6;
            const dotSize = radius * 0.08;

            this.ctx.beginPath();
            this.ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // 月亮边缘高光
        this.ctx.strokeStyle = 'rgba(150, 120, 180, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.stroke();
    },

    // 绘制船只剪影
    drawShipSilhouettes() {
        const ships = [
            { x: this.w * 0.3, y: this.h * 0.7, scale: 0.8 },
            { x: this.w * 0.5, y: this.h * 0.75, scale: 1.0 },
            { x: this.w * 0.7, y: this.h * 0.72, scale: 0.9 }
        ];

        ships.forEach(ship => {
            this.ctx.save();
            this.ctx.translate(ship.x, ship.y);
            this.ctx.scale(ship.scale, ship.scale);
            this.drawShipSilhouette();
            this.ctx.restore();
        });
    },

    // 绘制船只剪影（增加可见性）
    drawShipSilhouette() {
        this.ctx.fillStyle = 'rgba(20, 15, 30, 0.8)'; // 使用深紫色而不是纯黑，更有层次感
        const p = 12; // 增大像素尺寸

        // 船体（更粗壮）
        this.ctx.fillRect(-p * 3, 0, p * 6, p * 2);
        this.ctx.fillRect(-p * 4, -p * 0.5, p * 8, p * 1.5);

        // 船帆剪影（更明显）
        this.ctx.fillRect(-p * 2.5, -p * 4, p * 5, p * 3);
        this.ctx.fillRect(-p * 1.5, -p * 6, p * 3, p * 2);

        // 添加船桅
        this.ctx.fillRect(-p * 0.2, -p * 6, p * 0.4, p * 6);
    },

    // 绘制深邃黑色海浪
    drawDeepSeaWaves() {
        // 基础海面（渐变而不是纯色）
        const seaGradient = this.ctx.createLinearGradient(0, this.h * 0.5, 0, this.h);
        seaGradient.addColorStop(0, '#000510');
        seaGradient.addColorStop(0.7, '#000818');
        seaGradient.addColorStop(1, '#000000');
        this.ctx.fillStyle = seaGradient;
        this.ctx.fillRect(0, this.h * 0.5, this.w, this.h * 0.5);

        // 绘制波浪线条
        this.ctx.strokeStyle = 'rgba(30, 40, 80, 0.3)';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const y = this.h * 0.6 + i * 20;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            for (let x = 0; x < this.w; x += 10) {
                const waveY = y + Math.sin((x + this.time * 30) * 0.01 + i) * 8;
                this.ctx.lineTo(x, waveY);
            }
            this.ctx.stroke();
        }

        // 增强月光粼粼效果
        this.ctx.fillStyle = 'rgba(120, 140, 200, 0.15)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 29 + this.time * 15) % this.w;
            const y = this.h * 0.6 + Math.sin(x * 0.008 + this.time * 1.5) * 12 + 60;
            const size = (i % 4 === 0) ? 2 : 1;
            this.ctx.fillRect(x, y, size, size);
        }

        // 添加深海泡沫效果
        this.ctx.fillStyle = 'rgba(60, 80, 120, 0.1)';
        for (let i = 0; i < 20; i++) {
            const x = (i * 47 + this.time * 8) % this.w;
            const y = this.h * 0.8 + Math.sin(x * 0.005 + this.time) * 6;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3 + Math.sin(this.time + i) * 1, 0, Math.PI * 2);
            this.ctx.fill();
        }
    },

    initWeather() {
        this.weather.rain = [];
        const config = GAME_CONFIG.physics;
        for (let i = 0; i < config.rainCount; i++) {
            this.weather.rain.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                v: Math.random() * config.rainSpeed + config.rainSpeed,
                l: Math.random() * 8 + 4
            });
        }
    },

    initStars() {
        this.stars = [];
        const config = GAME_CONFIG.visual;
        for (let i = 0; i < config.starCount; i++) {
            this.stars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight * 0.5,
                s: Math.random() * (config.starMaxSize - config.starMinSize) + config.starMinSize,
                v: Math.random() * (config.starMaxSpeed - config.starMinSpeed) + config.starMinSpeed,
                t: Math.random() * Math.PI * 2
            });
        }
    },

    initClouds() {
        this.clouds = [];
        const config = GAME_CONFIG.visual;
        for (let i = 0; i < config.cloudCount; i++) {
            this.clouds.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight * 0.3,
                s: Math.random() * 0.5 + 0.2,
                vx: Math.random() * (config.cloudMaxSpeed - config.cloudMinSpeed) + config.cloudMinSpeed
            });
        }
    },

    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.clouds.forEach(c => {
            c.x += c.vx;
            if (c.x > this.w + 100) c.x = -100;
            const p = 8 * c.s;
            this.ctx.fillRect(c.x, c.y, p * 8, p * 3);
            this.ctx.fillRect(c.x + p * 2, c.y - p * 2, p * 4, p * 2);
        });
    },

    drawMoon() {
        const cx = this.w * 0.75;
        const cy = this.h * 0.25;
        const r = 180;

        // 1. 初始化缓存 Sprite (如果不存在)
        if (!this.moonCanvas) {
            this.cacheMoonSprite(r);
        }

        // 2. 绘制月之暗面光晕 (Eldritch Glow)
        // 修复：移除 translate，直接在世界坐标绘制，确保渐变位置正确
        const pulse = Math.sin(this.time * GAME_CONFIG.visual.moonPulseSpeed) * 0.1 + 0.9;
        const maxR = r * GAME_CONFIG.visual.moonGlowRadius * pulse;
        const grd = this.ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, maxR);
        grd.addColorStop(0, 'rgba(40, 20, 60, 0.8)'); // 加深核心不透明度
        grd.addColorStop(0.5, 'rgba(25, 10, 40, 0.3)');
        grd.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = grd;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
        this.ctx.fill();

        // 3. 绘制缓存的月亮 Sprite
        if (this.moonCanvas) {
            this.ctx.drawImage(this.moonCanvas, cx - r, cy - r);
        }
    },

    cacheMoonSprite(r) {
        this.moonCanvas = document.createElement('canvas');
        const s = r * 2;
        this.moonCanvas.width = s;
        this.moonCanvas.height = s;
        const mctx = this.moonCanvas.getContext('2d');
        const pixelSize = 4; // 像素化粒度

        // 基础填充
        mctx.fillStyle = '#0b0c12';
        mctx.beginPath(); mctx.arc(r, r, r, 0, Math.PI * 2); mctx.fill();

        // 像素点生成
        for (let y = 0; y < s; y += pixelSize) {
            for (let x = 0; x < s; x += pixelSize) {
                const dx = x - r;
                const dy = y - r;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > r - 1) continue;

                // 基础噪点 (Noise)
                let lightness = Math.random() * 0.1;

                // 巨型陨石坑 (Craters) logic
                const craters = [
                    { x: -0.3 * r, y: -0.2 * r, s: 0.2 * r },
                    { x: 0.4 * r, y: 0.1 * r, s: 0.15 * r },
                    { x: 0.1 * r, y: 0.5 * r, s: 0.22 * r },
                    { x: -0.5 * r, y: 0.3 * r, s: 0.1 * r },
                    { x: 0.2 * r, y: -0.5 * r, s: 0.18 * r },
                    { x: -0.2 * r, y: 0.6 * r, s: 0.08 * r }
                ];

                let isCrater = false;
                let isRim = false;

                craters.forEach(c => {
                    const cdx = dx - c.x;
                    const cdy = dy - c.y;
                    const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
                    if (cdist < c.s) {
                        isCrater = true;
                        // 坑内阴影
                        if (cdist < c.s * 0.8) lightness -= 0.15;
                        // 坑边缘高光
                        else if (cdx < 0 && cdy < 0) lightness += 0.1;
                    }
                });

                // 球体立体感 (Spherical Shading)
                // 光源假设在左上 (-1, -1)
                const nx = dx / r; const ny = dy / r;
                const shade = (nx * -0.5 + ny * -0.5); // -1 ~ 1
                lightness += shade * 0.1;

                // 边缘发光 (Rim Light) - 诡异紫光
                if (dist > r * 0.90) {
                    lightness += 0.2;
                    mctx.fillStyle = `rgba(100, 80, 140, ${Math.random() * 0.5 + 0.5})`;
                } else if (isCrater) {
                    mctx.fillStyle = `rgba(10, 10, 16, 1)`; // 坑底深黑
                    if (lightness > 0) mctx.fillStyle = `rgba(30, 25, 35, 1)`;
                } else {
                    // 月球表面颜色
                    const baseV = 15 + lightness * 50;
                    mctx.fillStyle = `rgb(${baseV}, ${baseV}, ${baseV + 10})`;
                }

                mctx.fillRect(x, y, pixelSize, pixelSize);
            }
        }
    },

    spawnParticle(x, y, color, speed = 5, size = 4) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * speed,
                vy: (Math.random() - 0.5) * speed,
                life: 1.0,
                color,
                size: Math.random() * size + 1
            });
        }
    },

    spawnFloatingText(text, x, y, color) {
        this.floatingTexts.push({
            text, x, y, color,
            life: 1.0,
            vy: -1
        });
    },

    spawnMuzzleFlash(x, y, isEnemy) {
        const physics = GAME_CONFIG.physics;
        for (let i = 0; i < physics.muzzleFlashCount; i++) {
            this.particles.push({
                x, y,
                vx: (isEnemy ? -1 : 1) * (Math.random() * 15 + 5),
                vy: (Math.random() - 0.5) * 10,
                life: 1.0,
                color: (Math.random() > 0.5 ? '#ffcc00' : '#ff3300'),
                size: Math.random() * 8 + 4
            });
        }
    },

    spawnCannonball(sx, sy, tx, ty, damage, color, side, arcHeight = 150, targetIndex = null) {
        this.cannonballs.push({
            x: sx, y: sy,
            sx, sy, // 起始点
            tx, ty, // 结束点
            progress: 0, // 0 到 1 的飞行进度
            arcHeight, // 抛物线高度
            damage,
            color,
            side,
            life: 1.0,
            trail: [],
            targetIndex // 指定要攻击的骰子索引，如果为null则使用默认逻辑
        });
    },

    spawnExplosion(x, y, color) {
        this.shake = 50;
        const physics = GAME_CONFIG.physics;
        for (let i = 0; i < physics.explosionParticleCount; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                life: 1.0,
                color: color,
                size: Math.random() * 10 + 5
            });
        }
        // 增加一个巨大的瞬间光效粒子
        this.particles.push({
            x, y, vx: 0, vy: 0, life: 0.5, color: '#fff', size: physics.flashParticleSize, isFlash: true
        });
    },

    updateLeviathan() {
        const leviathan = GAME_CONFIG.leviathan;
        if (!this.leviathan.active) {
            this.leviathan.cooldown--;
            if (this.leviathan.cooldown <= 0 && Math.random() < leviathan.spawnProbability) {
                this.leviathan.active = true;
                this.leviathan.x = -800;
                this.leviathan.y = this.h - 150;
                this.leviathan.cooldown = leviathan.cooldownMin; // Reset
            }
        } else {
            this.leviathan.x += leviathan.moveSpeed; // Configurable move speed
            if (this.leviathan.x > this.w + 800) {
                this.leviathan.active = false;
            }
        }
    },

    drawLeviathan() {
        if (!this.leviathan.active) return;
        this.ctx.save();
        this.ctx.translate(this.leviathan.x, this.leviathan.y);
        this.ctx.fillStyle = 'rgba(0, 5, 10, 0.4)'; // Deep shadow

        // 1. Head (Amorphous Cthulhu Shape)
        this.ctx.beginPath();
        // Draw a pulsating bulbous head
        for (let i = 0; i < Math.PI * 2; i += 0.2) {
            const r = 200 + Math.sin(i * 3 + this.time) * 15 + Math.cos(i * 7) * 10;
            const px = Math.cos(i) * r * 1.5; // Elongated
            const py = Math.sin(i) * r;
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.fill();

        // 2. Tentacles (Trailing behind)
        const leviathan = GAME_CONFIG.leviathan;
        this.ctx.strokeStyle = 'rgba(0, 5, 12, 0.3)';
        this.ctx.lineWidth = leviathan.tentacleWidth;
        for (let t = 0; t < leviathan.tentacleCount; t++) {
            this.ctx.beginPath();
            const startY = (t - 2.5) * leviathan.tentacleSpacing;
            this.ctx.moveTo(-200, startY);

            for (let k = 0; k < 800; k += 50) {
                const wave = Math.sin(k * 0.01 + this.time * leviathan.tentacleWaveSpeed + t) * (30 + k * 0.05);
                this.ctx.lineTo(-200 - k, startY + wave);
            }
            this.ctx.stroke();
        }

        this.ctx.restore();
    },

    resize() {
        this.w = this.canvas.width = window.innerWidth;
        this.h = this.canvas.height = window.innerHeight;
        this.player.x = this.w * 0.28;
        // 修正：将船只垂直中心设置在海面深度 (h - 140)
        this.player.y = this.h - 140;
    },

    rand(range) {
        if (!range || range.length < 2) return 1;
        return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
    },

    // 停止并清理电影序幕
    stopCinematic() {
        if (this.cinematicTimeouts) {
            this.cinematicTimeouts.forEach(clearTimeout);
            this.cinematicTimeouts = [];
        }
        document.getElementById('screen-menu').classList.add('hidden');
        this.cinematicState = "FINISHED";
    },

    start() {
        if (typeof GAME_CONFIG === 'undefined') return;

        // 确保停止并清理电影序幕逻辑
        this.stopCinematic();

        this.state = "SAILING";
        this.round = 0;

        // 重置玩家和敌人的位置（修复沉船动画后位置未重置的bug）
        this.player.x = this.w * 0.28;
        this.player.y = this.h - 140;

        const pConf = GAME_CONFIG.player;
        this.player.dice = [];
        const count = this.rand(pConf.diceCount);
        for (let i = 0; i < count; i++) {
            this.player.dice.push({ v: this.rand(pConf.diceValue) });
        }

        // 加载已获得的神器
        if (this.acquiredArtifacts && this.acquiredArtifacts.length > 0) {
            this.acquiredArtifacts.forEach(artifactId => {
                if (artifactId === 'frost') {
                    this.player.dice.push(this.createFrostDie());
                } else if (artifactId === 'relay') {
                    this.player.dice.push(this.createRelayDie());
                } else if (artifactId === 'trample') {
                    this.player.dice.push(this.createTrampleDie());
                }
            });
        }

        // 记录玩家的初始HP（最大耐久度）
        this.player.maxHp = this.player.dice.reduce((a, b) => a + b.v, 0);

        // 更新神器HUD显示
        this.updateArtifactDisplay();

        // 播放战斗背景音乐
        this.playBGM('battle');

        this.spawnEnemy();
    },

    // 按ID创建神器骰子（v1.3.0 敌我通用，供敌舰生成与调试台共用）
    createArtifactDieById(id) {
        switch (id) {
            case 'frost': return this.createFrostDie();
            case 'relay': return this.createRelayDie();
            case 'trample': return this.createTrampleDie();
            case 'burn': return this.createBurnDie();
            case 'armor': return this.createArmorDie();
            default: return null;
        }
    },

    // 敌舰神器授予（v1.3.0 敌我通用神器机制）：
    // 依据 GAME_CONFIG.enemyArtifacts 配置，按关卡线性插值概率决定本关敌舰是否携带神器骰子。
    // 携带时从神器池随机抽取一枚，替换敌舰的一枚普通骰子（保持关卡数量/点数配置不变），返回神器ID。
    maybeGrantEnemyArtifact(dice) {
        const cfg = GAME_CONFIG.enemyArtifacts;
        if (!cfg || !cfg.enabled) return null;
        if (this.round < cfg.fromRound) return null;
        if (!Array.isArray(dice) || dice.length === 0) return null;

        // 携带概率插值：chanceByRound = [fromRound时概率, 第13关时概率]
        const [fromChance, toChance] = cfg.chanceByRound;
        const span = Math.max(1, 12 - cfg.fromRound);
        const t = Math.min(1, Math.max(0, (this.round - cfg.fromRound) / span));
        const chance = fromChance + (toChance - fromChance) * t;
        if (Math.random() >= chance) return null;

        const id = cfg.pool[Math.floor(Math.random() * cfg.pool.length)];
        const artifactDie = this.createArtifactDieById(id);
        if (!artifactDie) return null;
        const replaceIdx = Math.floor(Math.random() * dice.length);
        dice.splice(replaceIdx, 1, artifactDie);
        return id;
    },

    spawnEnemy() {
        console.log(GAME_CONFIG.text.debug.spawnEnemyCalled.replace('{round}', this.round));
        if (this.round >= 13) {
            console.log(GAME_CONFIG.text.debug.roundLimitReached);
            this.endGame("win");
            return;
        }
        const eConf = GAME_CONFIG.levels[this.round];
        console.log(GAME_CONFIG.text.debug.spawningEnemyForRound.replace('{round}', this.round).replace('{config}', JSON.stringify(eConf)));
        const dice = [];
        const count = this.rand(eConf.count);
        for (let i = 0; i < count; i++) { dice.push({ v: this.rand(eConf.value) }); }
        // v1.3.0 敌我通用神器：本关敌舰可能携带一枚神器骰子
        const grantedArtifact = this.maybeGrantEnemyArtifact(dice);
        if (grantedArtifact) {
            console.log(`[v1.3.0] 第${this.round + 1}关敌舰携带神器: ${grantedArtifact}`);
        }
        this.enemy = {
            x: this.w + 400,
            dice: dice,
            initialDice: JSON.parse(JSON.stringify(dice)),
            shake: 0, dead: false
        };
        const roundDisplay = GAME_CONFIG.text.hudRoundFormat
            .replace('{current}', this.round + 1)
            .replace('{total}', '13');
        document.getElementById('hud-round-display').innerHTML = roundDisplay;
        console.log(GAME_CONFIG.text.debug.enemySpawned.replace('{count}', dice.length));
    },

    // 开始界面键盘事件
    bindCinematicEvents() {
        document.addEventListener('keydown', async (e) => {
            if (this.state === "CINEMATIC_MENU" && this.cinematicState === "WAITING") {
                await this.startTitleEmergence();
            }
        });
    },

    bindEvents() {
        document.getElementById('btn-fire').onclick = () => {
            this.playSFX('menuConfirm'); // 播放确认音效
            document.getElementById('btn-fire').classList.add('hidden');
            this.rollSequence("player");
        };
        document.getElementById('btn-keep').onclick = () => {
            this.playSFX('menuConfirm'); // 播放确认音效
            this.resolveDamage("player");
        };
        document.getElementById('btn-reroll').onclick = () => {
            if (!this.canReroll) return;
            this.canReroll = false; // 消耗重掷机会

            // 播放重掷音效
            this.playSFX('diceReroll');

            document.getElementById('btn-reroll').classList.add('hidden');
            document.getElementById('btn-keep').classList.add('hidden');
            this.state = "PLAYER_TURN";
            this.rollSequence("player");
        };

        // 添加鼠标点击事件监听器，用于目标选择
        this.canvas.addEventListener('click', (e) => {
            if (this.targetSelectionDamage !== undefined && this.diceClickAreas) {
                const rect = this.canvas.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;

                // 检查点击是否在某个骰子区域内
                for (const area of this.diceClickAreas) {
                    if (clickX >= area.x - area.width / 2 &&
                        clickX <= area.x + area.width / 2 &&
                        clickY >= area.y - area.height / 2 &&
                        clickY <= area.y + area.height / 2) {

                        // 找到了点击的骰子
                        this.selectedTargetIndex = area.index;
                        this.playSFX('menuNavigate'); // 播放选择音效

                        // 清除之前的点击区域（下次绘制时会重新创建）
                        this.diceClickAreas = null;

                        console.log(`Selected target dice: ${area.index}`);
                        break;
                    }
                }
            }
        });

        // 初始化测试控制台
        if (GAME_CONFIG.debug.consoleEnabled) {
            this.initDebugConsole();
        }

        // 恢复目标选择确认按钮绑定（防止因缺少元素或绑定而导致的潜在逻辑中断）
        const targetConfirm = document.getElementById('target-selection-confirm');
        if (targetConfirm) {
            targetConfirm.onclick = () => {
                this.playSFX('menuConfirm');
                if (this.selectedTargetIndex !== undefined) {
                    this.confirmTargetSelection(this.targetSelectionDamage, this.targetSelectionColor, this.targetSelectionSide);
                }
            };
        }

        // 恢复修理工确认按钮绑定
        const repairConfirm = document.getElementById('repairman-confirm');
        if (repairConfirm) {
            repairConfirm.onclick = () => {
                this.playSFX('menuConfirm');
            };
        }
    },

    rollSequence(side) {
        // 记录掷骰动作次数 (按动作计，不计次数内的骰子数)
        this.stats.total_dice_rolled++;

        // 被冻结的骰子和装甲骰子都无法参与进攻
        const rawSource = (side === "player") ? this.player.dice : this.enemy.dice;
        const sourceDice = rawSource.filter(d => !d.isFrozen && !d.isArmor);
        const color = (side === "player") ? this.colors.matrix : this.colors.enemy;
        const display = document.getElementById('battle-display');
        display.innerHTML = '';

        // 播放骰子投掷音效
        this.playSFX('diceRoll');

        // 如果没有可以攻击的骰子（全部被冻结），跳过这一轮，交换进攻权
        if (sourceDice.length === 0) {
            console.log(`${side} has no available dice to attack (all frozen), skipping turn`);
            // 显示提示信息
            display.innerHTML = `<div style="color: #ff6600; text-align: center; font-size: 20px;">${GAME_CONFIG.text.battle.allDiceFrozen}</div>`;

            // 延迟后让对方进攻
            setTimeout(() => {
                display.innerHTML = '';
                if (side === "player") {
                    this.doEnemyTurn();
                } else {
                    // 如果是敌方无法进攻，让玩家继续
                    this.state = "PLAYER_TURN";
                    this.canReroll = true;
                    document.getElementById('action-bar').classList.remove('hidden');
                    document.getElementById('btn-fire').classList.remove('hidden');
                }
            }, 500);
            return;
        }

        const rollCount = GAME_CONFIG.combat.rollAnimationFrames;
        let currentIter = 0;

        const doRoll = () => {
            display.innerHTML = '';
            // Debug Log: 检查骰子源数据和生成的新点数
            console.log(GAME_CONFIG.text.debug.rerollSourceDice.replace('{dice}', JSON.stringify(sourceDice)));
            this.currentRolls = sourceDice.map(d => Math.floor(Math.random() * d.v) + 1);
            console.log(GAME_CONFIG.text.debug.newRolls.replace('{rolls}', this.currentRolls));

            this.currentRolls.forEach(val => {
                const container = document.createElement('div');
                container.style.width = '120px';
                const c = document.createElement('canvas');
                c.width = c.height = 120;
                const dctx = c.getContext('2d');
                dctx.imageSmoothingEnabled = false;
                this.drawPixelDie(dctx, 60, 60, val, 100, color, true);
                container.appendChild(c);
                display.appendChild(container);
            });

            if (currentIter++ < rollCount) {
                setTimeout(doRoll, GAME_CONFIG.combat.rollDisplayDelay);
            } else {
                // 掷骰结束，等待玩家确认
                if (side === "player" && this.state !== "PLAYER_CHOICE") {
                    this.state = "PLAYER_CHOICE";
                    setTimeout(() => {
                        const rr = document.getElementById('btn-reroll');
                        const kp = document.getElementById('btn-keep');
                        if (rr && this.canReroll) rr.classList.remove('hidden'); // 只有有重掷机会才显示
                        if (kp) kp.classList.remove('hidden');
                    }, GAME_CONFIG.combat.playerChoiceDelay);
                }
            }
        };

        doRoll();
    },

    fireCannonballs(side, targetIndex = null) {
        const source = (side === "player") ? this.player : this.enemy;
        const target = (side === "player") ? this.enemy : this.player;
        const color = (side === "player") ? this.colors.matrix : this.colors.enemy;
        const totalDmg = this.currentRolls.reduce((a, b) => a + b, 0);

        // 霜冻神器：将在resolveDamage中处理（在受击特效之后）

        // 计算目标骰子的屏幕坐标
        // 如果指定了targetIndex（中继器情况），使用指定的索引；否则使用最前排骰子
        const actualTargetIndex = targetIndex !== null ? targetIndex : target.dice.length - 1;
        const col = Math.floor(actualTargetIndex / 3), row = actualTargetIndex % 3;
        const dieX = target.x + (side === "player" ? 80 - col * 60 : -80 + col * 60);
        const dieY = this.player.y - 20 - (row * 60);

        // 播放炮火音效
        this.playSFX('cannonFire');

        // 巨型开火闪光
        this.spawnMuzzleFlash(source.x + (side === "player" ? 100 : -100), this.player.y, side === "enemy");
        this.shake = 30;

        // 触发电画：炮筒往前伸出
        this.cannonAnim[side] = 1.0; // 动画开始

        // 发射一颗弧线炮弹，命中对方的最前排骰子
        this.spawnCannonball(
            source.x + (side === "player" ? 100 : -100), this.player.y,
            dieX, dieY,
            totalDmg, color, side, GAME_CONFIG.physics.cannonballArcHeight + Math.random() * 60,
            targetIndex
        );
    },

    async resolveDamage(side) {
        if (side === "player") {
            document.getElementById('btn-reroll').classList.add('hidden');
            document.getElementById('btn-keep').classList.add('hidden');
        }
        document.getElementById('battle-display').innerHTML = '';

        // 中继器神器（防守方效果，v1.3.0 敌我通用）：
        // - 敌方攻击且玩家持有中继器 → 玩家手动选择承受伤害的骰子
        // - 玩家攻击且敌方持有中继器 → 敌方AI自动选择承受伤害的骰子
        const defenderSide = this.getOpposite(side);
        const defenderUnit = this.getUnit(defenderSide);
        if (this.hasRelayArtifact(defenderSide) && defenderUnit.dice.length > 1) {
            const color = side === "player" ? this.colors.matrix : this.colors.enemy;
            const totalDmg = this.currentRolls.reduce((a, b) => a + b, 0);
            if (side === "enemy") {
                // 玩家中继器：显示目标选择界面
                this.showTargetSelection(totalDmg, color, side);
                return; // 等待玩家选择，不继续执行伤害结算
            }
            // 敌方中继器：AI 自动选择最优承伤骰子，直接按指定索引发射
            const aiIndex = this.pickEnemyRelayTarget(totalDmg);
            this.logToDebugConsole(`🔀 敌方中继器启动：AI 将伤害导向第 ${aiIndex + 1} 号骰子`);
            this.spawnFloatingText('中继器！', this.enemy.x, this.enemy.y - 140, '#00ccff');
            this.fireCannonballs(side, aiIndex);
        } else {
            // 确认后发射炮弹
            this.fireCannonballs(side);
        }

        // 等待炮弹落地 (轮询检查)
        const waitForProjectiles = () => {
            return new Promise(resolve => {
                const check = () => {
                    if (this.cannonballs.length === 0) resolve();
                    else setTimeout(check, 100);
                };
                // 延迟一帧确保炮弹已生成
                setTimeout(check, 50);
            });
        };
        await waitForProjectiles();
        await new Promise(r => setTimeout(r, GAME_CONFIG.combat.cannonballWaitTime));

        // 攻击方神器结算（v1.3.0 敌我通用）：燃烧弹 / 装甲弹 / 霜冻，效果跟随攻击方
        const attackerHasBurn = this.hasBurnArtifact(side);
        const attackerHasArmor = this.hasArmorArtifact(side);
        const attackerHasFrost = this.hasFrostArtifact(side);

        // 燃烧弹神器：攻击并造成伤害后，为防守方所有骰子叠加燃烧1层
        if (attackerHasBurn) {
            this.applyBurnStacksToAll(defenderUnit, 1);
        }

        // 装甲弹神器：攻击时，根据本次掷出的骰子点数为攻击方生成装甲骰子
        if (attackerHasArmor) {
            const armorDie = this.getUnit(side).dice.find(d => d.artifactId === 'armor');
            if (armorDie) {
                const armorLevel = armorDie.armorLevel || 1; // 默认装甲1
                this.applyArmorEffect(armorLevel, this.currentRolls, side);
            }
        }

        // 霜冻神器：攻击并造成伤害后，随机冻结一枚防守方的骰子
        if (attackerHasFrost) {
            setTimeout(() => this.applyFrostFreeze(side), 500); // 延迟显示冰封效果
        }

        // 燃烧效果：在每次攻击结束后结算燃烧伤害
        this.applyBurnDamage();

        if (side === "player") {
            if (this.enemy.dice.length === 0) {
                console.log(GAME_CONFIG.text.debug.playerDefeated.replace('{round}', this.round + 1));
                this.round++;
                this.stats.total_enemies_defeated++;
                this.stats.total_rounds_completed++;
                this.saveStats();
                this.enemy.dead = true;
                setTimeout(() => {
                    console.log(GAME_CONFIG.text.debug.callingShowLoot);
                    this.showLoot();
                }, GAME_CONFIG.combat.lootShowDelay);
            } else setTimeout(() => this.doEnemyTurn(), GAME_CONFIG.combat.enemyTurnDelay);
        } else {
            // 敌方在自身攻击或燃烧结算后可能因为自伤而沉没，此时应直接进入打捞阶段
            if (!this.enemy || !this.enemy.dice || this.enemy.dice.length === 0) {
                console.log("Enemy dice empty after enemy attack - triggering win sequence");
                this.round++;
                if (this.enemy) this.enemy.dead = true;
                setTimeout(() => {
                    this.showLoot();
                }, GAME_CONFIG.combat.lootShowDelay);
            } else if (this.player.dice.length === 0) {
                console.log(GAME_CONFIG.text.debug.playerHpZero);
                this.impactFrames = GAME_CONFIG.visual.impactFrameDuration; // 玩家HP归零时触发冲击帧
                this.startGameOverSequence();
            } else {
                this.state = "PLAYER_TURN";
                this.canReroll = true; // 新回合重置重掷机会
                document.getElementById('action-bar').classList.remove('hidden');
                document.getElementById('btn-fire').classList.remove('hidden');
            }
        }
    },

    showLoot() {
        console.log(GAME_CONFIG.text.debug.showLootCalled.replace('{dice}', JSON.stringify(this.enemy?.initialDice)));

        // 检查是否应该显示神秘商人
        // 必须是第二次尝试（gameAttempt >= 2）
        // 触发点：
        // 1. Round 1 (打完第1关后，剩余2个神器)
        // 2. Round 4 (打完第4关后，剩余1个神器)
        if (this.gameAttempt >= 2) {
            // 注意：这里我们依靠 availableArtifacts 的数量来防止重复触发
            // 只有当玩家刚好打完对应关卡，且对应的神器尚未被选走时才触发
            if (this.round === 1 && this.availableArtifacts.length === 2) {
                this.showMerchant();
                return;
            }
            if (this.round === 4 && this.availableArtifacts.length === 1) {
                this.showMerchant();
                return;
            }
        }

        this.state = "LOOT";
        const container = document.getElementById('loot-container');
        if (!container) {
            console.error("loot-container not found!");
            return;
        }
        container.innerHTML = '';
        const cards = [];
        if (!this.enemy || !this.enemy.initialDice || this.enemy.initialDice.length === 0) {
            console.error("No enemy or no initialDice for loot!");
            return;
        }
        this.enemy.initialDice.forEach((die) => {
            const card = document.createElement('div');
            card.className = 'loot-card';
            const c = document.createElement('canvas');
            c.width = c.height = 80;
            const dctx = c.getContext('2d');
            // v1.3.0 敌我通用：神器骰子按神器配色渲染，并标注名称提示可打捞夺取
            const props = this.getDieDisplayProperties(die);
            this.drawPixelDie(dctx, 40, 40, die.v, 70, (props.dieColor && props.dieColor !== '#fff') ? props.dieColor : this.colors.matrix, false);
            card.appendChild(c);
            if (die.artifactId) {
                const textKey = { frost: 'artifactFrostName', relay: 'artifactRelayName', trample: 'artifactTrampleName', burn: 'artifactBurnName', armor: 'artifactArmorName' }[die.artifactId];
                const label = document.createElement('div');
                label.className = 'loot-artifact-label';
                label.textContent = (textKey && GAME_CONFIG.text[textKey]) || die.name || die.artifactId;
                card.appendChild(label);
            }
            container.appendChild(card);
            cards.push(card);
        });
        // 界面打开音效已被移除
        document.getElementById('screen-loot').classList.remove('hidden');
        document.getElementById('action-bar').classList.add('hidden');
        console.log(GAME_CONFIG.text.debug.lootCardsCreated.replace('{count}', cards.length));
        let count = 0;
        const ui = GAME_CONFIG.ui;
        const interval = setInterval(() => {
            cards.forEach(c => c.classList.remove('selected'));
            cards[Math.floor(Math.random() * cards.length)].classList.add('selected');
            if (++count > ui.lootSelectionCount) {
                clearInterval(interval);
                const finalIdx = Math.floor(Math.random() * cards.length);
                cards.forEach(c => c.classList.remove('selected'));
                cards[finalIdx].classList.add('selected');
                this.lootDice = this.enemy.initialDice[finalIdx];
                console.log(GAME_CONFIG.text.debug.selectedLootDice.replace('{dice}', JSON.stringify(this.lootDice)).replace('{delay}', ui.lootFlyDelay));
                setTimeout(() => this.flyDice(cards[finalIdx]), ui.lootFlyDelay);
            }
        }, ui.lootSelectionInterval);
    },

    flyDice(sourceCard) {
        console.log(GAME_CONFIG.text.debug.flyDiceCalled);
        const rect = sourceCard.getBoundingClientRect();
        const flyer = sourceCard.cloneNode(true);
        flyer.classList.add('flying');
        flyer.style.left = rect.left + 'px';
        flyer.style.top = rect.top + 'px';
        document.body.appendChild(flyer);
        requestAnimationFrame(() => {
            flyer.style.left = this.player.x + 'px';
            flyer.style.top = (this.player.y - 120) + 'px';
            flyer.style.opacity = '0';
            flyer.style.transform = 'scale(0.2) rotate(1080deg)';
            const ui = GAME_CONFIG.ui;
            console.log(GAME_CONFIG.text.debug.flyAnimationStart.replace('{duration}', ui.lootFlyDuration));
            setTimeout(() => {
                flyer.remove();
                console.log(GAME_CONFIG.text.debug.flyAnimationComplete);
                this.confirmLoot();
                this.shake = 20;
            }, ui.lootFlyDuration);
        });
    },

    confirmLoot() {
        console.log(GAME_CONFIG.text.debug.confirmLootCalled.replace('{dice}', JSON.stringify(this.lootDice)));
        if (this.lootDice) {
            // v1.3.0 敌我通用神器：打捞的骰子若为神器骰/装甲骰，保留其特性归玩家所有（可夺取敌舰神器）
            const stealAllowed = GAME_CONFIG.enemyArtifacts && GAME_CONFIG.enemyArtifacts.lootStealEnabled;
            const salvaged = {
                v: this.lootDice.v,
                artifactId: stealAllowed ? (this.lootDice.artifactId || null) : null,
                name: this.lootDice.name || null,
                isFrozen: false,
                isFragile: false,
                isArmor: !!this.lootDice.isArmor,
                armorLevel: this.lootDice.armorLevel || 1
            };
            this.player.dice.push(salvaged);
            // 更新最大HP
            this.player.maxHp += this.lootDice.v;
            if (salvaged.artifactId) {
                this.spawnFloatingText(`打捞神器：${salvaged.name || salvaged.artifactId}`, this.player.x, this.player.y - 160, '#00ccff');
                this.logToDebugConsole(`⛏️ 战利品打捞到神器骰子：${salvaged.name || salvaged.artifactId}（已归玩家所有）`);
            }
            this.lootDice = null;
            this.updateArtifactDisplay();

            // 播放获得战利品音效
            this.playSFX('lootPickup');

            console.log(GAME_CONFIG.text.debug.diceAdded.replace('{count}', this.player.dice.length));
        }
        this.playSFX('interfaceClose'); // 播放界面关闭音效
        document.getElementById('screen-loot').classList.add('hidden');
        this.enemy = null;
        this.state = "SAILING";
        console.log(GAME_CONFIG.text.debug.resetToSailing);

        this.spawnEnemy();
    },

    doEnemyTurn() {
        // 安全检查：如果敌方骰子全部被摧毁，不应执行此逻辑
        // 这种情况可能发生在最后一枚骰子是冻结状态被摧毁时，resolveDamage未能及时捕获
        if (!this.enemy || !this.enemy.dice || this.enemy.dice.length === 0) {
            console.log("doEnemyTurn called but enemy dice empty - triggering win sequence");
            this.round++;
            this.stats.total_enemies_defeated++;
            this.stats.total_rounds_completed++;
            this.saveStats();
            this.enemy.dead = true;
            setTimeout(() => {
                this.showLoot();
            }, GAME_CONFIG.combat.lootShowDelay);
            return;
        }

        // 检查敌方是否有可用的骰子（未冻结的）
        const activeDice = this.enemy.dice.filter(d => !d.isFrozen);

        if (activeDice.length === 0) {
            // 所有敌方骰子都被冻结，跳过敌方攻击，直接进入玩家回合
            console.log("All enemy dice are frozen, skipping enemy turn");

            // 播放正面反馈音效
            this.playSFX('positiveFeedback'); // 使用ui-click.ogg

            // 显示跳过提示
            const display = document.getElementById('battle-display');
            display.innerHTML = `<div style="color: #00ccff; text-align: center; font-size: 24px; font-weight: bold;">${GAME_CONFIG.text.battle.enemyAllDiceFrozen}</div>`;

            // 短暂延迟后进入玩家回合
            setTimeout(() => {
                display.innerHTML = '';
                this.state = "PLAYER_TURN";
                this.canReroll = true;
                document.getElementById('action-bar').classList.remove('hidden');
                document.getElementById('btn-fire').classList.remove('hidden');
                console.log("Player turn started after enemy skip");
            }, 2000);

            return;
        }

        this.state = "ENEMY_TURN";
        this.rollSequence("enemy");
        setTimeout(() => {
            // 重新计算当前可用的骰子（可能有新的冻结状态；装甲骰不参与进攻，需排除）
            const currentActiveDice = this.enemy.dice.filter(d => !d.isFrozen && !d.isArmor);
            const sum = this.currentRolls.reduce((a, b) => a + b, 0);
            const total = currentActiveDice.reduce((a, b) => a + b.v, 0);

            if (sum < total * GAME_CONFIG.combat.enemyRerollThreshold) {
                // 重掷：重新生成掷骰结果
                this.playSFX('diceReroll'); // 播放重掷音效
                this.rollSequence("enemy");
                setTimeout(() => this.resolveDamage("enemy"), 1000);
            } else {
                // 不重掷：但需要重新计算currentRolls，只包含当前未冻结的骰子
                this.currentRolls = currentActiveDice.map(d => Math.floor(Math.random() * d.v) + 1);
                this.resolveDamage("enemy");
            }
        }, GAME_CONFIG.combat.enemyRollDelay);
    },

    endGame(result) {
        this.state = result === "win" ? "WIN" : "GAMEOVER";

        if (result === "win") {
            // 播放胜利背景音乐
            this.playBGM('victory');
            document.getElementById('screen-win').classList.remove('hidden');
        } else {
            // 第一次失败：显示修理工界面（现在改为显示神秘商人界面）
            if (this.firstDefeat) {
                this.firstDefeat = false; // 标记已经不是第一次失败了
                this.gameAttempt++; // 增加游戏尝试次数

                // 播放失败背景音乐
                this.playBGM('defeat');

                // 显示神秘商人界面
                this.showMerchant();
            } else {
                // 非第一次失败：显示普通游戏结束界面
                this.gameAttempt++; // 增加游戏尝试次数

                // 播放失败背景音乐
                this.playBGM('defeat');

                document.getElementById('screen-gameover').classList.remove('hidden');
            }
        }
    },

    startGameOverSequence() {
        this.state = "GAME_OVER_SEQ";
        this.gameOverPhase = 1;
        this.gameOverTime = 0;
        // 初始化 4 根触手：一根拖走玩家，一根拖走敌方，两根抓空
        const px = this.player.x;
        const ex = this.enemy ? this.enemy.x : this.player.x + 300;
        const mid = (px + ex) / 2;
        this.tentacles = [
            { x: px, y: this.h, target: 'player' },
            { x: ex, y: this.h, target: 'enemy' },
            { x: mid - 180, y: this.h, target: 'none' },
            { x: mid + 180, y: this.h, target: 'none' }
        ];

        // 生成漂浮残骸
        this.floatingLoot = [];
        for (let i = 0; i < 3; i++) {
            this.floatingLoot.push({
                x: this.player.x + (Math.random() - 0.5) * 120,
                y: this.h - 130,
                v: Math.floor(Math.random() * 6) + 1,
                phase: Math.random() * Math.PI * 2
            });
        }
    },

    updateGameOverSequence() {
        this.gameOverTime += 0.04;

        const physics = GAME_CONFIG.physics;
        if (this.gameOverPhase === 1) { // 触手升起
            // 所有触手一起从深海升起
            this.tentacles.forEach(t => t.y -= physics.tentacleRiseSpeed);
            const playerTentacle = this.tentacles.find(t => t.target === 'player');
            if (playerTentacle && playerTentacle.y <= this.player.y + 40) {
                this.gameOverPhase = 2;
                this.shake = 30;
                this.spawnExplosion(this.player.x, this.player.y, '#3a0815');
            }
        }
        else if (this.gameOverPhase === 2) { // 拖拽下潜
            this.player.y += physics.tentacleDragSpeed;
            // 舰船与所有触手一起被拖入深海
            this.tentacles.forEach(t => t.y += physics.tentacleDragSpeed);
            this.shake = 5;
            if (this.player.y > this.h + 150) {
                this.gameOverPhase = 3;
                this.gameOverTime = 0;
            }
        }
        else if (this.gameOverPhase === 3) { // 漂浮
            if (this.gameOverTime > GAME_CONFIG.ui.gameOverLootFloatTime) this.endGame("fail");
        }
    },

    drawGameOverTentacle() {
        if (this.gameOverPhase >= 3) return;
        const ctx = this.ctx;
        this.tentacles.forEach(t => {
            const x = t.x;
            const y = t.y;

            ctx.fillStyle = '#2b1d38'; // 深紫黑
            ctx.strokeStyle = '#6a4c93'; // 亮紫

            const width = 60;
            // 绘制多节触手
            for (let i = 0; i < 20; i++) {
                const h = i * 30;
                const wave = Math.sin(this.time * 8 + i * 0.4 + (t.target === 'none' ? i : 0)) * 20;
                const drawY = y + h;
                const drawX = x + wave - width / 2;

                ctx.lineWidth = 4;
                ctx.fillRect(drawX, drawY, width - i * 2, 32);
                ctx.strokeRect(drawX, drawY, width - i * 2, 32);
            }
            // 缠绕爪：仅对抓到目标的触手绘制，其余两根抓空
            if (this.gameOverPhase === 2 && t.target !== 'none') {
                ctx.fillStyle = '#6a4c93';
                ctx.fillRect(x - 40, y - 20, 80, 20);
            }
        });
    },

    drawFloatingLoot() {
        if (this.gameOverPhase !== 3) return;
        this.floatingLoot.forEach(d => {
            const bob = Math.sin(this.time * 2 + d.phase) * 8;
            this.drawPixelDie(this.ctx, d.x, d.y + bob, d.v, 30, '#00ffa2', true);
            this.ctx.fillStyle = 'rgba(0, 255, 162, 0.2)';
            this.ctx.beginPath();
            this.ctx.ellipse(d.x, d.y + bob + 25, 15, 4, 0, 0, Math.PI * 2);
            this.ctx.fill();
        });
    },

    drawPixelDie(ctx, x, y, val, size, color, highContrast = true) {
        const p = Math.max(1, Math.floor(size / 10));
        ctx.fillStyle = "#000";
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
        ctx.strokeStyle = color;
        ctx.lineWidth = p;
        if (highContrast) { ctx.shadowBlur = 15; ctx.shadowColor = color; }
        ctx.strokeRect(x - size / 2 + p / 2, y - size / 2 + p / 2, size - p, size - p);
        ctx.shadowBlur = 0;
        ctx.fillStyle = highContrast ? "#fff" : color;
        const dot = (dx, dy) => {
            const ds = p * 1.8;
            ctx.fillRect(x + dx * p * 2.8 - ds / 2, y + dy * p * 2.8 - ds / 2, ds, ds);
        };
        if (val % 2 === 1) dot(0, 0);
        if (val > 1) { dot(-1, -1); dot(1, 1); }
        if (val > 3) { dot(1, -1); dot(-1, 1); }
        if (val === 6) { dot(-1, 0); dot(1, 0); }
    },

    // 绘制45°俯视等距视角伪3D骰子（会旋转）
    drawIsometricDice(ctx, x, y, size, rotation = 0) {
        const p = Math.max(1, Math.floor(size / 12));
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        // 等距视角参数（标准等距投影）
        const cubeSize = size * 0.5;
        const isoAngle = Math.PI / 6; // 30度
        const isoCos = Math.cos(isoAngle); // ≈0.866
        const isoSin = Math.sin(isoAngle); // 0.5
        const depth = cubeSize * 0.4;

        // 等距视角变换：将3D坐标转换为2D等距坐标
        const isoTransform = (x3d, y3d, z3d) => {
            return {
                x: (x3d - y3d) * isoCos,
                y: (x3d + y3d) * isoSin - z3d
            };
        };

        // 定义骰子的8个顶点（3D坐标）
        const s = cubeSize / 2;
        const vertices3D = [
            { x: -s, y: -s, z: s },   // 0: 左上前
            { x: s, y: -s, z: s },    // 1: 右上前
            { x: s, y: s, z: s },     // 2: 右下前
            { x: -s, y: s, z: s },    // 3: 左下前
            { x: -s, y: -s, z: -s },  // 4: 左上后
            { x: s, y: -s, z: -s },   // 5: 右上后
            { x: s, y: s, z: -s },    // 6: 右下后
            { x: -s, y: s, z: -s }    // 7: 左下后
        ];

        // 转换为等距坐标
        const vertices = vertices3D.map(v => isoTransform(v.x, v.y, v.z));

        // 绘制底部投影（暗色，偏移）
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.moveTo(vertices[4].x + 2, vertices[4].y + depth + 3);
        ctx.lineTo(vertices[5].x + 2, vertices[5].y + depth + 3);
        ctx.lineTo(vertices[6].x + 2, vertices[6].y + depth + 3);
        ctx.lineTo(vertices[7].x + 2, vertices[7].y + depth + 3);
        ctx.closePath();
        ctx.fill();

        // 绘制左侧面（最暗 #222）
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.moveTo(vertices[3].x, vertices[3].y); // 左下前
        ctx.lineTo(vertices[0].x, vertices[0].y); // 左上前
        ctx.lineTo(vertices[4].x, vertices[4].y); // 左上后
        ctx.lineTo(vertices[7].x, vertices[7].y); // 左下后
        ctx.closePath();
        ctx.fill();

        // 绘制右侧面（中等亮度 #666）
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.moveTo(vertices[1].x, vertices[1].y); // 右上前
        ctx.lineTo(vertices[2].x, vertices[2].y); // 右下前
        ctx.lineTo(vertices[6].x, vertices[6].y); // 右下后
        ctx.lineTo(vertices[5].x, vertices[5].y); // 右上后
        ctx.closePath();
        ctx.fill();

        // 绘制顶面（最亮 #fff）
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y); // 左上前
        ctx.lineTo(vertices[1].x, vertices[1].y); // 右上前
        ctx.lineTo(vertices[5].x, vertices[5].y); // 右上后
        ctx.lineTo(vertices[4].x, vertices[4].y); // 左上后
        ctx.closePath();
        ctx.fill();

        // 绘制高对比度发光边框（像素风格）
        ctx.strokeStyle = '#000';
        ctx.lineWidth = p * 2.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#fff';
        // 顶面边框
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        ctx.lineTo(vertices[1].x, vertices[1].y);
        ctx.lineTo(vertices[5].x, vertices[5].y);
        ctx.lineTo(vertices[4].x, vertices[4].y);
        ctx.closePath();
        ctx.stroke();
        // 左侧面边框
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        ctx.lineTo(vertices[3].x, vertices[3].y);
        ctx.stroke();
        // 右侧面边框
        ctx.beginPath();
        ctx.moveTo(vertices[1].x, vertices[1].y);
        ctx.lineTo(vertices[2].x, vertices[2].y);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 绘制透视点数（在顶面上，符合等距视角变形）
        ctx.fillStyle = '#000';
        const dotSize = p * 1.8;
        const dotSpacing = cubeSize * 0.25;

        // 顶面5点布局（等距视角变形）
        // 中心点
        const centerDot = isoTransform(0, 0, s);
        ctx.fillRect(centerDot.x - dotSize / 2, centerDot.y - dotSize / 2, dotSize, dotSize);

        // 四个角点（在顶面上）
        const cornerDots3D = [
            { x: -dotSpacing, y: -dotSpacing, z: s }, // 左上
            { x: dotSpacing, y: -dotSpacing, z: s },  // 右上
            { x: dotSpacing, y: dotSpacing, z: s },   // 右下
            { x: -dotSpacing, y: dotSpacing, z: s }  // 左下
        ];

        cornerDots3D.forEach(dot3D => {
            const dot = isoTransform(dot3D.x, dot3D.y, dot3D.z);
            // 点数在等距视角下保持圆形（不需要额外变形，因为等距变换已经处理了）
            ctx.fillRect(dot.x - dotSize / 2, dot.y - dotSize / 2, dotSize, dotSize);
        });

        ctx.restore();
    },


    // 神器骰子：霜冻
    createFrostDie() {
        return {
            v: 6,
            artifactId: 'frost',
            name: GAME_CONFIG.text.artifactFrostName,
            isFrozen: false,
            isFragile: false
        };
    },

    // 创建中继器神器骰子
    createRelayDie() {
        return {
            v: 6,
            artifactId: 'relay',
            name: GAME_CONFIG.text.artifactRelayName,
            isFrozen: false,
            isFragile: false
        };
    },

    // 创建爆破者神器骰子（践踏效果）
    createTrampleDie() {
        return {
            v: 6,
            artifactId: 'trample',
            name: '爆破者',
            isFrozen: false,
            isFragile: false
        };
    },

    // 创建燃烧弹神器骰子
    createBurnDie() {
        return {
            v: 6,
            artifactId: 'burn',
            name: GAME_CONFIG.text.artifactBurnName,
            isFrozen: false,
            isFragile: false,
            burnStacks: 0 // 燃烧层数
        };
    },

    // 创建装甲弹神器骰子
    createArmorDie() {
        return {
            v: 6,
            artifactId: 'armor',
            name: GAME_CONFIG.text.artifactArmorName,
            isFrozen: false,
            isFragile: false,
            armorLevel: 1 // 装甲等级，默认1
        };
    },

    // ===== 阵营通用辅助（v1.3.0 敌我通用神器机制） =====
    // side: "player" | "enemy"，返回对应阵营单位对象
    getUnit(side) {
        return side === "player" ? this.player : this.enemy;
    },

    // 返回对方阵营 side
    getOpposite(side) {
        return side === "player" ? "enemy" : "player";
    },

    // 判断指定阵营是否持有某神器骰子（默认查询玩家，向后兼容旧调用）
    unitHasArtifact(side, artifactId) {
        const unit = this.getUnit(side);
        return !!(unit && unit.dice && unit.dice.some(d => d.artifactId === artifactId));
    },

    hasFrostArtifact(side = "player") {
        return this.unitHasArtifact(side, 'frost');
    },

    hasRelayArtifact(side = "player") {
        return this.unitHasArtifact(side, 'relay');
    },

    hasTrampleArtifact(side = "player") {
        return this.unitHasArtifact(side, 'trample');
    },

    // 是否持有燃烧弹神器
    hasBurnArtifact(side = "player") {
        return this.unitHasArtifact(side, 'burn');
    },

    // 是否持有装甲弹神器
    hasArmorArtifact(side = "player") {
        return this.unitHasArtifact(side, 'armor');
    },

    // 践踏效果：溢出伤害继续对其他骰子造成伤害
    // attackerSide: 践踏发起方（用于统计归口；v1.3.0 敌我通用）
    applyTrampleEffect(target, remainingDamage, color, attackerSide = "player") {
        // 找到下一个可攻击的骰子（从后往前，模拟最前排）
        let nextTargetIndex = target.dice.length - 1;

        if (nextTargetIndex < 0) {
            // 没有更多骰子了
            return;
        }

        const nextDie = target.dice[nextTargetIndex];
        const effectiveHp = nextDie.isFragile ? 1 : nextDie.v;
        const isFatal = effectiveHp <= remainingDamage;

        // 计算下一个骰子的坐标用于特效
        const col = Math.floor(nextTargetIndex / 3), row = nextTargetIndex % 3;
        const dieX = target.x + (target === this.enemy ? 80 - col * 60 : -80 + col * 60);
        const dieY = this.player.y - 20 - (row * 60);

        // 统计归口：践踏目标为敌方时计入"造成伤害"，反之计入"受到伤害"
        const addStat = (amount) => {
            if (attackerSide === "player") {
                this.stats.total_damage_dealt += amount;
            } else {
                this.stats.total_damage_taken += amount;
            }
        };

        if (isFatal) {
            // 践踏伤害摧毁了这个骰子
            target.dice.splice(nextTargetIndex, 1);
            this.spawnExplosion(dieX, dieY, color);
            this.spawnFloatingText(`践踏 -${remainingDamage}`, dieX, dieY - 50, '#ff6600');
            addStat(effectiveHp);

            // 递归处理剩余伤害
            const newRemainingDamage = remainingDamage - effectiveHp;
            if (newRemainingDamage > 0) {
                setTimeout(() => this.applyTrampleEffect(target, newRemainingDamage, color, attackerSide), 200);
            }
        } else {
            // 应用伤害
            let dealt = Math.min(nextDie.v, remainingDamage);
            nextDie.v -= dealt;
            addStat(dealt);

            if (nextDie.v <= 0) {
                // 如果骰子被摧毁，也记录为击杀
                target.dice.splice(nextTargetIndex, 1);
            }
            this.spawnExplosion(dieX, dieY, color);
            this.spawnFloatingText(`践踏 -${remainingDamage}`, dieX, dieY - 50, '#ff6600');
        }

        // 播放践踏音效（复用爆炸音效）
        this.playSFX('explosion');
    },

    // 燃烧弹效果：为目标所有骰子叠加燃烧层数
    applyBurnStacksToAll(target, amount) {
        if (!target || !target.dice || target.dice.length === 0) return;
        target.dice.forEach(die => {
            die.burnStacks = (die.burnStacks || 0) + amount;
        });
    },

    // 燃烧伤害结算：对所有拥有燃烧层数的骰子造成对应伤害
    applyBurnDamage() {
        const applyForSide = (unit, isEnemy) => {
            if (!unit || !unit.dice || unit.dice.length === 0) return;
            const color = isEnemy ? this.colors.enemy : this.colors.matrix;

            for (let i = unit.dice.length - 1; i >= 0; i--) {
                const die = unit.dice[i];
                const stacks = die.burnStacks || 0;
                if (stacks <= 0) continue;

                const damage = stacks;
                const effectiveHp = die.isFragile ? 1 : die.v;

                const col = Math.floor(i / 3), row = i % 3;
                const dieX = unit.x + (unit === this.enemy ? 80 - col * 60 : -80 + col * 60);
                const dieY = this.player.y - 20 - (row * 60);

                if (effectiveHp <= damage) {
                    unit.dice.splice(i, 1);
                    if (isEnemy) {
                        this.stats.total_damage_dealt += effectiveHp;
                    } else {
                        this.stats.total_damage_taken += effectiveHp;
                    }
                } else {
                    die.v -= damage;
                    if (isEnemy) {
                        this.stats.total_damage_dealt += damage;
                    } else {
                        this.stats.total_damage_taken += damage;
                    }
                }

                this.spawnExplosion(dieX, dieY, color);
                this.spawnFloatingText(`燃烧 -${damage}`, dieX, dieY - 50, '#ff9933');
                this.playSFX('explosion');
            }
        };

        // 目前燃烧主要用于敌方骰子，但这里同时支持双方，便于以后扩展
        applyForSide(this.enemy, true);
        applyForSide(this.player, false);
    },

    // 装甲弹效果：攻击时，根据掷出的骰子点数生成新骰子
    // side: 装甲骰子的归属方（即持有装甲弹神器的攻击方；v1.3.0 敌我通用）
    applyArmorEffect(armorLevel, rolledDice, side = "player") {
        const unit = this.getUnit(side);
        if (!unit || !unit.dice || !rolledDice) return;

        // 统计本次掷出的骰子中点数为armorLevel的骰子数量
        const matchingRollsCount = rolledDice.filter(roll => roll === armorLevel).length;

        if (matchingRollsCount > 0) {
            // 为每个匹配的掷出点数生成一个点数为6的装甲骰子
            for (let i = 0; i < matchingRollsCount; i++) {
                const newDie = {
                    v: 6,
                    artifactId: null,
                    name: null,
                    isFrozen: false,
                    isFragile: false,
                    isArmor: true // 标记为装甲骰子，不参与进攻
                };
                unit.dice.push(newDie);
                this.spawnFloatingText(`装甲 +6`, unit.x + (Math.random() - 0.5) * 100, unit.y - 100, '#ffd700');
            }
            this.playSFX('artifactUnlock'); // 使用解锁音效表示新骰子生成
        }
    },

    // 霜冻效果：持有霜冻神器的攻击方，在每次攻击前冻结一枚防守方的骰子
    // side: 攻击方阵营，霜冻作用于其对方（v1.3.0 敌我通用）
    applyFrostFreeze(side = "player") {
        const defender = this.getUnit(this.getOpposite(side));
        if (!defender || !defender.dice || defender.dice.length === 0) return;
        const candidates = defender.dice.filter(d => !d.isFrozen);
        if (candidates.length === 0) return;
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        if (target.isFrozen) {
            // 如果已经被冻结，则触发更深的效果（变为脆弱）
            target.isFragile = true;
            this.logToDebugConsole(side === "player"
                ? '❄️ 寒流侵袭：敌方骰子变得脆弱！'
                : '❄️ 寒流侵袭：我方骰子变得脆弱！');
        } else {
            target.isFrozen = true;
            this.logToDebugConsole(side === "player"
                ? '❄️ 霜冻爆发：一枚敌方骰子被冰封！'
                : '❄️ 霜冻爆发：一枚我方骰子被敌方冰封！');
        }

        // 播放骰子冻结音效
        this.playSFX('diceFreeze');
    },

    // 敌方中继器 AI 选靶（v1.3.0 敌我通用）：
    // 策略：1) 有能完全吸收且存活的骰子时，优先装甲骰，其次点数最低者（保护高攻击力骰子）
    //       2) 全员都会被摧毁时，导向有效HP最低的骰子，减少总HP损失
    pickEnemyRelayTarget(damage) {
        const dice = this.enemy.dice;
        const eff = (d) => d.isFragile ? 1 : d.v;
        const indices = dice.map((_, i) => i);

        const survivors = indices.filter(i => eff(dice[i]) > damage);
        if (survivors.length > 0) {
            const armorIdx = survivors.find(i => dice[i].isArmor);
            if (armorIdx !== undefined) return armorIdx;
            survivors.sort((a, b) => dice[a].v - dice[b].v);
            return survivors[0];
        }

        indices.sort((a, b) => eff(dice[a]) - eff(dice[b]));
        return indices[0];
    },

    // 绘制像素风格神秘人形象（用于修理工头像）
    drawMysteryPerson(ctx, x, y, size, color = "#00ccff") {
        const p = Math.max(1, Math.floor(size / 16));
        ctx.fillStyle = color;

        // 身体比例
        const headSize = size * 0.25;
        const bodyWidth = size * 0.3;
        const bodyHeight = size * 0.35;
        const armWidth = size * 0.15;
        const armHeight = size * 0.25;
        const legWidth = size * 0.12;
        const legHeight = size * 0.2;

        // 绘制头部（圆形）
        ctx.beginPath();
        ctx.arc(x, y - size * 0.35, headSize, 0, Math.PI * 2);
        ctx.fill();

        // 绘制帽子/兜帽
        ctx.fillStyle = '#333';
        ctx.fillRect(x - headSize * 0.8, y - size * 0.35 - headSize * 0.8, headSize * 1.6, headSize * 0.6);
        ctx.fillRect(x - headSize * 0.6, y - size * 0.35 - headSize * 0.6, headSize * 1.2, headSize * 0.4);

        // 绘制眼睛（神秘的）
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(x - headSize * 0.3, y - size * 0.35 - headSize * 0.1, headSize * 0.2, headSize * 0.15);
        ctx.fillRect(x + headSize * 0.1, y - size * 0.35 - headSize * 0.1, headSize * 0.2, headSize * 0.15);

        // 绘制身体
        ctx.fillStyle = '#666';
        ctx.fillRect(x - bodyWidth / 2, y - size * 0.1, bodyWidth, bodyHeight);

        // 绘制手臂
        ctx.fillStyle = '#555';
        // 左臂
        ctx.fillRect(x - bodyWidth / 2 - armWidth, y - size * 0.05, armWidth, armHeight);
        // 右臂
        ctx.fillRect(x + bodyWidth / 2, y - size * 0.05, armWidth, armHeight);

        // 绘制腿部
        ctx.fillStyle = '#444';
        // 左腿
        ctx.fillRect(x - bodyWidth / 4 - legWidth / 2, y + bodyHeight - size * 0.1, legWidth, legHeight);
        // 右腿
        ctx.fillRect(x + bodyWidth / 4 - legWidth / 2, y + bodyHeight - size * 0.1, legWidth, legHeight);

        // 绘制神秘光环效果
        ctx.strokeStyle = color;
        ctx.lineWidth = p * 2;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(x, y - size * 0.35, headSize * 1.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    },

    drawPixelShip(x, y, isEnemy, shake = 0, tilt = 0) {
        const p = 12;
        this.ctx.save();
        this.ctx.translate(x + (Math.random() * shake - shake / 2), y);
        this.ctx.rotate(tilt);
        if (isEnemy) this.ctx.scale(-1, 1);

        // 获取炮筒动画状态
        const cannonState = isEnemy ? this.cannonAnim.enemy : this.cannonAnim.player;

        const colors = isEnemy ?
            { hull: '#3a0815', highlight: '#7a0a1a', sail: '#5c0610', glow: '#ff0033' } :
            { hull: this.colors.ship_wood, highlight: this.colors.ship_highlight, sail: this.colors.sail, glow: '#00ffa2' };

        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(-p * 6, p * 1, p * 12, p * 2);
        this.ctx.fillStyle = colors.hull;
        this.ctx.fillRect(-p * 5, 0, p * 10, p * 2);
        this.ctx.fillRect(-p * 6, -p * 1, p * 12, p * 1.5);
        this.ctx.fillStyle = colors.highlight;
        for (let i = -5; i < 5; i += 2) this.ctx.fillRect(i * p, 0, p / 3, p * 1.5);

        // 大炮筒 (Cannon Barrel) - 支持伸缩动画
        this.ctx.fillStyle = '#1a1a1a';
        const cannonExtend = cannonState * p * 1.5; // 动画时往前伸出1.5个单位
        const cannonX = p * 4 + (isEnemy ? -cannonExtend : cannonExtend); // 敌人船只方向相反
        this.ctx.fillRect(cannonX, -p * 0.3, p * 3, p * 0.6); // 炮管
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(p * 3.5, -p * 0.5, p * 1, p); // 炮底座

        this.ctx.fillStyle = '#1a0d08';
        this.ctx.fillRect(-p / 2, -p * 6.5, p, p * 6.5);
        this.ctx.fillRect(-p * 3.5, -p * 5, p / 2, p * 5);
        this.ctx.fillStyle = colors.sail;
        this.ctx.fillRect(-p * 4.5, -p * 6, p * 4, p * 4.5);
        this.ctx.fillStyle = 'rgba(0,0,0,0.15)';
        this.ctx.fillRect(-p * 4.5, -p * 3.5, p * 4, p);
        this.ctx.fillStyle = this.colors.sail_shadow;
        this.ctx.fillRect(-p * 1, -p * 6, p * 0.5, p * 4.5);
        this.ctx.fillStyle = colors.sail;
        this.ctx.fillRect(p * 1, -p * 4.5, p * 2.5, p * 3);
        this.ctx.fillStyle = colors.glow;
        this.ctx.shadowBlur = 20; this.ctx.shadowColor = colors.glow;
        this.ctx.fillRect(-p * 5.5, 0, p / 2, p / 2);
        this.ctx.fillRect(p * 4.5, 0, p / 2, p / 2);
        this.ctx.restore();
    },

    drawSea() {
        const m = 80;
        this.ctx.fillStyle = this.colors.sea_deep;
        this.ctx.fillRect(0, this.h - 250, this.w, 250);

        // 动态全局光照：炮弹照亮海面
        this.cannonballs.forEach(c => {
            if (c.y > this.h - 300) {
                const grd = this.ctx.createRadialGradient(c.x, this.h - 150, 0, c.x, this.h - 150, 150);
                // 简化颜色解析
                let glowColor = 'rgba(0,255,162,0.3)'; // 默认玩家绿色
                if (c.side === 'enemy') glowColor = 'rgba(255,45,85,0.3)';
                grd.addColorStop(0, glowColor);
                grd.addColorStop(1, 'rgba(0,0,0,0)');
                this.ctx.fillStyle = grd;
                this.ctx.fillRect(c.x - 150, this.h - 250, 300, 150);
            }
        });

        // DRAW LEVIATHAN SHADOW (Before mid-layer waves)
        this.drawLeviathan();

        const drawLayer = (yo, hScale, clr, speed) => {
            const localOffset = (this.time * speed) % m;
            this.ctx.fillStyle = clr;
            for (let x = -localOffset; x < this.w + m; x += m) {
                const h = Math.sin(x * 0.005 + this.time * 2) * GAME_CONFIG.visual.waveAmplitude * hScale;
                this.ctx.fillRect(x, this.h - yo + h, m + 1, yo);
            }
        };
        drawLayer(180, 1.2, this.colors.sea_mid, GAME_CONFIG.visual.waveSpeed);

        // 水面反射系统：船只倒影
        if (this.enemy) {
            const bob = Math.sin(this.time * 2) * 12;
            const drift = Math.cos(this.time * 0.8) * 15;
            const reflectOffset = Math.sin(this.time * 3) * 8; // 波浪错位

            this.ctx.save();
            this.ctx.globalAlpha = 0.25;
            this.ctx.translate(0, (this.player.y + 50) * 2); // 移动到反射位置
            this.ctx.scale(1, -0.4); // 垂直镜像 + 压缩

            // 绘制玩家船只倒影
            this.drawPixelShip(this.player.x + drift + reflectOffset, this.player.y + bob, false, 0, 0);
            // 绘制敌人船只倒影
            this.drawPixelShip(this.enemy.x - drift - reflectOffset, this.player.y + bob, true, 0, 0);

            this.ctx.restore();
        }

        drawLayer(100, 0.8, this.colors.sea_top, 40);

        // 海面波光 (Sparkles)
        this.ctx.fillStyle = "#fff";
        for (let i = 0; i < GAME_CONFIG.visual.sparkleCount; i++) { // 海面波光数量
            const rx = (i * 137 + this.time * 15) % this.w; // 伪随机分布
            const by = (i * 53) % 200; // 深度分布
            const h = Math.sin(rx * 0.005 + this.time * 2) * GAME_CONFIG.visual.waveAmplitude * 1.0; // 跟随海浪
            const ry = this.h - 220 + by + h;

            if (ry < this.h) {
                const blink = Math.sin(this.time * 3 + i * 13) * 0.5 + 0.5;
                this.ctx.globalAlpha = blink * 0.3; // 降低不透明度，更柔和
                const s = (i % 3 === 0) ? 2 : 1;
                this.ctx.fillRect(rx, ry, s, s);
            }
        }
        this.ctx.globalAlpha = 1;
    },

    // 天气系统：斜雨 + 闪电
    updateWeather() {
        // 斜雨更新
        this.weather.rain.forEach(r => {
            r.y += r.v;
            r.x -= r.v * 0.3;
            if (r.y > this.h) { r.y = -10; r.x = Math.random() * (this.w + 200); }
        });
        // 随机闪电
        const physics = GAME_CONFIG.physics;
        if (Math.random() < physics.lightningProbability) this.weather.lightningFlash = 1.0;
        if (this.weather.lightningFlash > 0) this.weather.lightningFlash -= physics.lightningDecay;
    },

    drawWeather() {
        // 斜雨
        this.ctx.strokeStyle = 'rgba(150, 180, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.weather.rain.forEach(r => {
            this.ctx.moveTo(r.x, r.y);
            this.ctx.lineTo(r.x - r.l * 0.3, r.y + r.l);
        });
        this.ctx.stroke();

        // 闪电闪白
        if (this.weather.lightningFlash > 0) {
            this.ctx.fillStyle = `rgba(200, 200, 255, ${this.weather.lightningFlash * 0.6})`;
            this.ctx.fillRect(0, 0, this.w, this.h);
        }
    },

    // 屏幕暗红晕影 + 危险呼吸灯效果（UI 四角压迫感）
    drawVignette() {
        const ctx = this.ctx;
        const w = this.w, h = this.h;
        if (!w || !h) return;

        // 基础暗红晕影（大幅提高可见度）
        const visual = GAME_CONFIG.visual;
        let baseAlpha = visual.vignetteBaseAlpha;
        let pulseExtra = 0;

        // 当玩家只剩 1 枚骰子时，叠加呼吸灯闪烁（不在 GAME_OVER 动画期间）
        const isCritical = this.player && this.player.dice && this.player.dice.length === 1 && this.state !== "GAME_OVER_SEQ";
        if (isCritical) {
            const t = this.time || 0;
            // 呼吸：在 [0, 1] 之间缓慢起伏
            const breath = Math.sin(t * visual.vignetteBreathSpeed) * 0.5 + 0.5;
            pulseExtra = breath * visual.vignetteCriticalExtra; // 额外提升暗红强度
        }

        const alpha = baseAlpha + pulseExtra;
        if (alpha <= 0) return;

        const cx = w / 2;
        const cy = h / 2;
        const maxR = Math.sqrt(w * w + h * h);

        ctx.save();
        ctx.globalCompositeOperation = 'multiply'; // 改回multiply，但用更高的alpha
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
        grd.addColorStop(0, 'rgba(0,0,0,0)'); // 中心完全透明
        grd.addColorStop(0.6, `rgba(200, 20, 20, ${alpha * 0.5})`); // 中间红色更明显
        grd.addColorStop(1, `rgba(200, 20, 20, ${alpha})`); // 四角最大红色
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    },

    loop() {
        this.time += GAME_CONFIG.physics.timeStep;

        // 开始界面特殊处理
        if (this.state === "CINEMATIC_MENU") {
            this.drawCinematicMenu();

            requestAnimationFrame(() => this.loop());
            return;
        }

        // 如果处于非菜单状态，确保电影序幕已停止
        if (this.cinematicState !== "FINISHED" && this.cinematicState !== "WAITING") {
            this.stopCinematic();
        }

        // 如果神秘商人界面正在显示，更新骰子动画
        if (this.state === "MERCHANT") {
            this.drawMerchantDice();
        }

        // 冲击帧处理：颜色反转维持半秒
        if (this.impactFrames > 0) {
            this.impactFrames--;

            if (this.impactFrames === 29) {
                // 第一帧：缓存当前画面用于反转
                if (!this.impactCanvas) {
                    this.impactCanvas = document.createElement('canvas');
                    this.impactCanvas.width = this.w;
                    this.impactCanvas.height = this.h;
                }
                const impactCtx = this.impactCanvas.getContext('2d');
                impactCtx.drawImage(this.canvas, 0, 0);
            }
            // impactFrames = 28到0时：正常绘制 + 反转叠加
        }

        // 更新炮筒动画
        this.updateCannonAnim();

        // 播放环境音效（间隔性）
        if (Math.random() < 0.005) { // 0.5% 概率每帧
            this.playSFX('oceanWaves');
        }
        if (Math.random() < 0.003) { // 0.3% 概率每帧
            // 风声音效已被移除
        }

        if (this.state === "GAME_OVER_SEQ") this.updateGameOverSequence();

        this.updateWeather();
        this.updateLeviathan();

        // 屏幕色散特效 (高震屏时)
        const doChromatic = this.shake > 40;

        // 巨兽低频颤动
        let tremorY = 0;
        if (this.leviathan.active) {
            tremorY = Math.sin(this.time * 6) * 2; // Low freq tremor
        }

        this.ctx.save();
        // 应用全局震动（屏幕震动效果）
        const shakeX = this.shake > 0 ? (Math.random() * this.shake - this.shake / 2) : 0;
        const shakeY = this.shake > 0 ? (Math.random() * this.shake - this.shake / 2) : 0;
        this.ctx.translate(shakeX, tremorY + shakeY); // Apply tremor and shake globally

        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.w, this.h);
        this.stars.forEach(s => {
            s.y += s.v; if (s.y > this.h) s.y = 0;
            const blink = 0.4 + Math.sin(this.time * 3 + s.t) * 0.5;
            this.ctx.fillStyle = `rgba(255,255,255,${blink})`;
            this.ctx.fillRect(s.x, s.y, s.s, s.s);
        });

        this.drawMoon();
        this.drawClouds();

        // 1. 绘制海面背景 (最底层)
        this.drawSea();

        // 2. 绘制船只 (海面之上)
        if (this.enemy) {
            if (this.state === "SAILING" && this.enemy.x > this.w * GAME_CONFIG.combat.enemyAmbushRange) {
                this.enemy.x -= GAME_CONFIG.combat.enemyApproachSpeed;
            } else if (this.state === "SAILING") {
                const ambush = GAME_CONFIG.player.ambushChance || 0.5;
                if (this.round > 0 && Math.random() < ambush) {
                    // 检查敌方是否有可用的骰子（未冻结的）
                    const activeEnemyDice = this.enemy.dice.filter(d => !d.isFrozen);
                    if (activeEnemyDice.length > 0) {
                        // 触发闪击UI：显示巨大的红色 "AMBUSH!" 弹幕及强烈的画面震动
                        this.ambushText.active = true;
                        this.ambushText.life = 1.0; // 初始生命值
                        this.shake = 80; // 强烈的画面震动

                        // 先展示闪击文字，再稍后进入敌方掷骰流程
                        this.state = "AMBUSH";
                        setTimeout(() => {
                            if (this.state === "AMBUSH") {
                                this.doEnemyTurn();
                            }
                        }, 1000);
                    } else {
                        // 敌方所有骰子都被冻结，跳过伏击，直接进入玩家回合
                        console.log("All enemy dice are frozen, skipping ambush");
                        this.state = "PLAYER_TURN";
                        document.getElementById('action-bar').classList.remove('hidden');
                        document.getElementById('btn-fire').classList.remove('hidden');
                    }
                } else {
                    this.state = "PLAYER_TURN";
                    document.getElementById('action-bar').classList.remove('hidden');
                    document.getElementById('btn-fire').classList.remove('hidden');
                }
            }
            // 物理参数：波浪起伏(bob)，水平漂移(drift)，海洋扭矩(tilt)
            const physics = GAME_CONFIG.physics;
            const bob = Math.sin(this.time * 2) * physics.shipBobAmplitude;
            const drift = Math.cos(this.time * 0.8) * physics.shipDriftAmplitude;
            const tilt = Math.sin(this.time * 1.5) * physics.shipTiltAmplitude;

            this.drawPixelShip(this.player.x + drift, this.player.y + bob, false, this.shake, tilt);
            this.drawPixelShip(this.enemy.x - drift, this.player.y + bob, true, this.enemy.shake, -tilt);

            // 水线白沫
            const bobSpeed = Math.abs(Math.cos(this.time * 2) * GAME_CONFIG.physics.shipBobAmplitude);
            if (Math.random() < bobSpeed * GAME_CONFIG.physics.foamSpawnRate) this.spawnParticle(this.player.x + drift + (Math.random() - 0.5) * 100, this.player.y + bob + 30, '#fff', 1, 3);
            if (Math.random() < bobSpeed * GAME_CONFIG.physics.foamSpawnRate) this.spawnParticle(this.enemy.x - drift + (Math.random() - 0.5) * 100, this.player.y + bob + 30, '#fff', 1, 3);

            // 受损冒烟
            if (this.player.dice.length < 3) {
                if (Math.random() < physics.smokeSpawnRate) this.spawnParticle(this.player.x + drift, this.player.y + bob - 40, '#333', 2, 8);
                if (Math.random() < physics.fireSpawnRate) this.spawnParticle(this.player.x + drift, this.player.y + bob - 20, '#ff3300', 5, 3);
            }
            if (this.enemy.dice.length < this.enemy.initialDice.length) {
                if (Math.random() < physics.smokeSpawnRate) this.spawnParticle(this.enemy.x - drift, this.player.y + bob - 40, '#333', 2, 8);
                if (Math.random() < physics.fireSpawnRate) this.spawnParticle(this.enemy.x - drift, this.player.y + bob - 20, '#ff3300', 5, 3);
            }

            // 在目标选择模式下，让玩家骰子可以被点击（中继器神器：敌方攻击时选择承受伤害的骰子）
            const isTargetSelectionModeForPlayer = (this.targetSelectionDamage !== undefined && this.targetSelectionSide === "enemy");
            this.drawShipDice(this.player.x + drift, this.player.y + bob, this.player.dice, this.colors.matrix, tilt, isTargetSelectionModeForPlayer);

            this.drawShipDice(this.enemy.x - drift, this.player.y + bob, this.enemy.dice, this.colors.enemy, -tilt);

            // v1.3.0 敌我通用神器：敌舰持有的神器图标（绘制在敌舰骰子上方，提示玩家其携带的神器）
            const enemyArtifactDice = this.enemy.dice.filter(d => d.artifactId);
            if (enemyArtifactDice.length > 0 && this.state !== "CINEMATIC_MENU") {
                const icons = { frost: '❄', relay: '🔗', trample: '💥', burn: '🔥', armor: '🛡️' };
                const startX = this.enemy.x - ((enemyArtifactDice.length - 1) * 22) / 2;
                this.ctx.font = '20px serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                enemyArtifactDice.forEach((die, i) => {
                    const iconX = startX + i * 22;
                    const iconY = this.player.y + bob - 150 + Math.sin(Date.now() / 300 + i) * 3;
                    // 背景徽章
                    this.ctx.fillStyle = 'rgba(10, 10, 20, 0.75)';
                    this.ctx.beginPath();
                    this.ctx.arc(iconX, iconY, 13, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#ff4d6d';
                    this.ctx.lineWidth = 1.5;
                    this.ctx.stroke();
                    this.ctx.fillText(icons[die.artifactId] || '?', iconX, iconY + 1);
                });
                this.ctx.lineWidth = 1;
            }
        }

        // 3. 绘制粒子 (烟雾/白沫在船只之上)
        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(p => {
            p.x += (p.vx || 0); p.y += (p.vy || 0); p.life -= GAME_CONFIG.physics.particleDecay;
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            if (p.isFlash) {
                this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.size * (1 - p.life), 0, Math.PI * 2); this.ctx.fill();
            } else {
                this.ctx.fillRect(p.x, p.y, p.size, p.size);
            }
        });

        // 绘制游戏结束动画
        if (this.state === "GAME_OVER_SEQ") {
            this.drawGameOverTentacle();
            this.drawFloatingLoot();
        }

        this.ctx.globalAlpha = 1;

        // 4. 绘制炮弹 (最高层级，覆盖一切)
        this.cannonballs = this.cannonballs.filter(c => c.life > 0);
        this.cannonballs.forEach(c => {
            c.progress += GAME_CONFIG.physics.cannonballSpeed;
            if (c.progress >= 1) {
                c.life = 0;

                // 对于中继器神器（玩家防守时），伤害已经在confirmTargetSelection中手动应用了
                // 这里只播放视觉效果，不重复应用伤害
                // 注：敌方中继器（玩家攻击时）不走此分支——AI 选定目标索引后由下方正常流程结算
                const isRelayDamage = (c.side === "enemy" && c.targetIndex !== null && this.hasRelayArtifact("player"));

                if (!isRelayDamage) {
                    // 正常情况：炮弹命中时应用伤害
                    const target = (c.side === "player") ? this.enemy : this.player;
                    if (target && target.dice.length > 0) {
                        // 使用指定的目标骰子索引，或者默认使用最后一个骰子
                        const dieIndex = c.targetIndex !== null ? c.targetIndex : target.dice.length - 1;
                        let targetDie = target.dice[dieIndex];
                        // 如果该骰子被霜冻冻结且变得脆弱，则视为只有1点耐久
                        const effectiveHp = targetDie.isFragile ? 1 : targetDie.v;
                        const isFatal = effectiveHp <= c.damage; // 致命一击判定

                        let remainingDamage = 0; // 溢出伤害，用于践踏效果

                        if (isFatal) {
                            // 计算溢出伤害 = 总伤害 - 骰子实际耐久
                            remainingDamage = c.damage - effectiveHp;

                            // 记录统计 (记录实际消减的血量)
                            if (c.side === "player") this.stats.total_damage_dealt += effectiveHp;
                            else this.stats.total_damage_taken += effectiveHp;

                            // 如果是致命一击，从数组中移除指定的骰子
                            target.dice.splice(dieIndex, 1);
                        } else {
                            targetDie.v -= c.damage;

                            // 记录统计
                            if (c.side === "player") this.stats.total_damage_dealt += c.damage;
                            else this.stats.total_damage_taken += c.damage;
                        }

                        target.shake = 30;
                        this.spawnExplosion(c.tx, c.ty, c.color);
                        this.spawnFloatingText(`-${c.damage}`, c.tx, c.ty - 50, '#ff3366');

                        // 播放爆炸音效
                        this.playSFX('explosion');

                        // 践踏效果：如果攻击方持有爆破者神器且有溢出伤害，则继续对防守方其他骰子造成伤害
                        // v1.3.0 敌我通用：践踏跟随攻击方生效（玩家或敌方均可触发）
                        if (remainingDamage > 0 && this.hasTrampleArtifact(c.side)) {
                            this.applyTrampleEffect(target, remainingDamage, c.color, c.side);
                        }

                        // 霜冻神器：在玩家攻击并造成伤害后，随机冻结一枚敌方骰子
                        // 移除此处的多余调用，统一在 resolveDamage 中处理
                    }
                } else {
                    // 中继器情况：只播放视觉效果，伤害已在confirmTargetSelection中应用
                    const target = (c.side === "player") ? this.enemy : this.player;
                    target.shake = 30;
                    this.spawnExplosion(c.tx, c.ty, c.color);
                    this.spawnFloatingText(`-${c.damage}`, c.tx, c.ty - 50, '#ff3366');
                    this.playSFX('explosion');

                    // 移除此处的多余调用，统一在 resolveDamage 中处理
                }
            } else {
                const t = c.progress;
                c.x = c.sx + (c.tx - c.sx) * t;
                c.y = c.sy + (c.ty - c.sy) * t - c.arcHeight * Math.sin(Math.PI * t);
                c.trail.push({ x: c.x, y: c.y });
                if (c.trail.length > 15) c.trail.shift();
            }
            c.trail.forEach((pt, i) => {
                this.ctx.globalAlpha = i / c.trail.length * 0.7;
                this.ctx.fillStyle = c.color;
                this.ctx.fillRect(pt.x - 8, pt.y - 8, 16, 16);
            });
            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = '#fff';
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = c.color;
            this.ctx.beginPath();
            this.ctx.arc(c.x, c.y, 12, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });

        // 5. 绘制天气 (雨层)
        this.drawWeather();

        // 6. 叠加屏幕暗红晕影（含危急呼吸灯），制造 UI 四角压迫感
        this.drawVignette();

        // 7. 冲击帧颜色反转效果（impactFrames>0时持续反转）
        if (this.impactFrames > 0 && this.impactCanvas) {
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'difference'; // 颜色完全反转
            this.ctx.drawImage(this.impactCanvas, 0, 0);
            this.ctx.restore();
            if (this.impactFrames === 0) {
                this.impactCanvas = null; // 最后清理缓存，结束冲击帧
            }
        }

        this.ctx.restore(); // Restore tremor transform

        // -------------------------------------------------

        // 色散故障特效
        if (doChromatic) {
            this.ctx.globalCompositeOperation = 'lighter';
            this.ctx.globalAlpha = 0.15;
            this.ctx.drawImage(this.canvas, -3, 0);
            this.ctx.drawImage(this.canvas, 3, 0);
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.globalAlpha = 1;
        }

        // 8. 绘制闪击文本（巨大的红色 "AMBUSH!" 弹幕）
        if (this.ambushText.active && this.ambushText.life > 0) {
            this.ctx.save();
            const centerX = this.w / 2;
            const centerY = this.h / 2;
            const fontSize = 120 * this.ambushText.life; // 根据生命值缩放，从120px逐渐缩小
            const alpha = this.ambushText.life; // 透明度随生命值衰减

            this.ctx.globalAlpha = alpha;
            this.ctx.font = `bold ${fontSize}px 'Zpix', 'Press Start 2P', 'Courier New', monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // 绘制多层阴影效果，增强视觉冲击
            this.ctx.shadowBlur = 30;
            this.ctx.shadowColor = '#ff0000';
            this.ctx.fillStyle = '#ff3366';
            this.ctx.fillText(GAME_CONFIG.text.battle.ambush, centerX, centerY);

            // 绘制外发光效果
            this.ctx.shadowBlur = 50;
            this.ctx.shadowColor = '#ff0000';
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 4;
            this.ctx.strokeText(GAME_CONFIG.text.battle.ambush, centerX, centerY);

            this.ctx.shadowBlur = 0;
            this.ctx.globalAlpha = 1;
            this.ctx.restore();

            // 更新生命值，逐渐淡出
            this.ambushText.life -= 0.02; // 约50帧后完全消失
            if (this.ambushText.life <= 0) {
                this.ambushText.active = false;
                this.ambushText.life = 0;
            }
        }

        if (this.shake > 0) this.shake *= GAME_CONFIG.physics.shakeDecay;
        if (this.enemy && this.enemy.shake > 0) this.enemy.shake *= GAME_CONFIG.physics.shakeDecay;

        // 更新HP显示：百分比 + 颜色渐变
        this.updateHpDisplay();

        requestAnimationFrame(() => this.loop());
    },

    drawShipDice(x, y, diceArr, clr, tilt = 0, isTargetSelection = false) {
        diceArr.forEach((d, i) => {
            const col = Math.floor(i / 3), row = i % 3;
            const dx = (clr === this.colors.enemy ? 80 - col * 60 : -80 + col * 60);
            const dy = -20 - (row * 60);

            // 计算骰子的世界坐标（用于点击检测）
            const dieWorldX = x + dx;
            const dieWorldY = y + dy;

            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(tilt);
            this.ctx.translate(dx, dy);

            // 使用统一的方法获取骰子显示属性
            const props = this.getDieDisplayProperties(d);

            // 在目标选择模式下，如果这是被选中的骰子，添加选择效果
            if (isTargetSelection && this.selectedTargetIndex === i) {
                // 绘制选择边框
                this.ctx.strokeStyle = '#ffaa00';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(-30, -30, 60, 60);
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(-28, -28, 56, 56);
            }

            // 在目标选择模式下，所有骰子都显示可点击的提示
            if (isTargetSelection) {
                // 绘制半透明的点击提示
                this.ctx.fillStyle = 'rgba(170, 0, 255, 0.1)';
                this.ctx.fillRect(-25, -25, 50, 50);
            }

            this.drawPixelDie(this.ctx, 0, 0, d.v, 50, props.dieColor, true);

            // 船身连接条，根据骰子状态选择颜色
            this.ctx.fillStyle = props.barColor || clr; // 使用神器颜色或默认敌我颜色
            this.ctx.fillRect(-25, -25, 50, 6);

            // 如果骰子被冻结，添加冰封碎片特效
            if (props.showIceEffect) {
                this.drawIceShardEffect(0, 0, 50);
            }

            this.ctx.restore();

            // 在目标选择模式下，存储骰子位置信息用于点击检测（装甲骰子不参与）
            if (isTargetSelection && !d.isArmor) {
                if (!this.diceClickAreas) {
                    this.diceClickAreas = [];
                }
                this.diceClickAreas[i] = {
                    x: dieWorldX,
                    y: dieWorldY,
                    width: 50,
                    height: 50,
                    index: i
                };
            }
        });
    },

    // 绘制冰封碎片特效
    drawIceShardEffect(x, y, size) {
        const p = Math.max(1, Math.floor(size / 20));
        this.ctx.save();
        this.ctx.translate(x, y);

        // 冰晶碎片参数
        const shardCount = 8;
        const shardLength = size * 0.15;
        const shardWidth = p * 2;

        // 绘制冰晶碎片
        for (let i = 0; i < shardCount; i++) {
            const angle = (i / shardCount) * Math.PI * 2 + this.time * 0.02; // 缓慢旋转
            const distance = size * 0.35;
            const shardX = Math.cos(angle) * distance;
            const shardY = Math.sin(angle) * distance;

            this.ctx.save();
            this.ctx.translate(shardX, shardY);
            this.ctx.rotate(angle + Math.PI / 4); // 旋转45度

            // 绘制冰晶碎片主体
            this.ctx.fillStyle = '#ffffff';
            this.ctx.globalAlpha = 0.8 + Math.sin(this.time * 0.05 + i) * 0.2; // 闪烁效果

            // 主干
            this.ctx.fillRect(-shardWidth / 2, -shardLength / 2, shardWidth, shardLength);

            // 分支
            this.ctx.fillRect(-shardWidth / 2, -shardLength / 4, shardLength / 3, shardWidth);
            this.ctx.fillRect(-shardWidth / 2, shardLength / 4 - shardWidth / 2, shardLength / 3, shardWidth);

            this.ctx.restore();
        }

        // 添加冰霜光晕
        const glowRadius = size * 0.6;
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
        gradient.addColorStop(0, 'rgba(0, 204, 255, 0)');
        gradient.addColorStop(0.7, 'rgba(0, 204, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 204, 255, 0.3)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    },

    // 显示目标选择界面（中继器神器效果）
    showTargetSelection(damage, color, side) {
        // 不再显示弹窗界面，而是让船体上的骰子可以被点击
        this.targetSelectionDamage = damage;
        this.targetSelectionColor = color;
        this.targetSelectionSide = side;
        this.selectedTargetIndex = undefined;

        // 播放界面打开音效
        this.playSFX('interfaceOpen');

        // 显示提示信息
        const display = document.getElementById('battle-display');
        if (side === "enemy") {
            // 中继器：敌方攻击玩家，选择承受伤害的骰子
            display.innerHTML = `<div style="color: #aa00ff; text-align: center; font-size: 20px; font-weight: bold;">${GAME_CONFIG.text.battle.clickDiceToTakeDamage}</div>`;
        } else {
            // 其他情况（如果有的话）
            display.innerHTML = `<div style="color: #aa00ff; text-align: center; font-size: 20px; font-weight: bold;">${GAME_CONFIG.text.battle.clickDiceToTakeDamage}</div>`;
        }

        // 设置全局确认键监听器
        this.targetSelectionConfirmHandler = (e) => {
            if (e.key === 'Enter' || e.key === ' ') { // Enter 或 空格键确认
                e.preventDefault();
                if (this.selectedTargetIndex !== undefined) {
                    this.playSFX('menuConfirm');
                    this.confirmTargetSelection(damage, color, side);
                }
            } else if (e.key === 'Escape') { // ESC 键取消
                e.preventDefault();
                this.cancelTargetSelection();
            }
        };
        document.addEventListener('keydown', this.targetSelectionConfirmHandler);

        console.log('Target selection mode activated - click dice on ship, then press Enter to confirm');
    },

    // 清理目标选择状态
    cleanupTargetSelection() {
        // 移除事件监听器
        if (this.targetSelectionConfirmHandler) {
            document.removeEventListener('keydown', this.targetSelectionConfirmHandler);
            this.targetSelectionConfirmHandler = null;
        }

        // 清理状态变量
        this.targetSelectionDamage = undefined;
        this.targetSelectionColor = undefined;
        this.targetSelectionSide = undefined;
        this.selectedTargetIndex = undefined;
        this.diceClickAreas = null;

        // 清除显示
        const display = document.getElementById('battle-display');
        display.innerHTML = '';

        this.playSFX('interfaceClose');
    },

    // 加载统计数据
    loadStats() {
        try {
            const saved = localStorage.getItem('DICE_SORROW_STATS');
            if (saved) {
                const parsed = JSON.parse(saved);
                // 确保即使存档中缺少新字段，也能被初始化为 0
                this.stats = { ...this.stats, ...parsed };
                console.log('Stats loaded:', this.stats);
            }
        } catch (e) {
            console.error('Failed to load stats:', e);
        }
    },

    // 保存统计数据
    saveStats() {
        try {
            localStorage.setItem('DICE_SORROW_STATS', JSON.stringify(this.stats));
        } catch (e) {
            console.error('Failed to save stats:', e);
        }
    },

    // 初始化测试控制台
    initDebugConsole() {
        const consoleEl = document.getElementById('debug-console');
        if (!consoleEl) return;

        // 显示控制台快捷键
        document.addEventListener('keydown', (e) => {
            if (e.key === '`' || e.key === '~' || e.key === 'F12') { // 反引号键或F12切换控制台
                e.preventDefault();
                this.toggleDebugConsole();
            }
        });

        // 绑定控制台按钮事件
        this.bindDebugConsoleEvents();

        // 根据配置决定是否启动时显示
        if (GAME_CONFIG.debug.showConsoleOnStart) {
            consoleEl.classList.remove('hidden');
        }
    },

    // 切换控制台显示
    toggleDebugConsole() {
        const consoleEl = document.getElementById('debug-console');
        if (consoleEl.classList.contains('hidden')) {
            consoleEl.classList.remove('hidden');
            this.logToDebugConsole('🎮 测试控制台已打开\n按 ` 或 F12 键切换显示');
        } else {
            consoleEl.classList.add('hidden');
        }
    },

    // 绑定控制台按钮事件
    bindDebugConsoleEvents() {
        // 骰子操作
        document.getElementById('btn-add-dice')?.addEventListener('click', () => {
            this.player.dice.push(this.createRandomDie());
            this.logToDebugConsole('✅ 添加了1个随机骰子');
        });

        document.getElementById('btn-remove-dice')?.addEventListener('click', () => {
            if (this.player.dice.length > 0) {
                this.player.dice.pop();
                this.logToDebugConsole('✅ 移除了1个骰子');
            } else {
                this.logToDebugConsole('❌ 没有可移除的骰子');
            }
        });

        document.getElementById('btn-freeze-dice')?.addEventListener('click', () => {
            this.enemy.dice.forEach(d => d.isFrozen = true);
            this.logToDebugConsole('✅ 冻结了所有敌方骰子');
        });

        document.getElementById('btn-clear-freeze')?.addEventListener('click', () => {
            [...this.player.dice, ...this.enemy.dice].forEach(d => d.isFrozen = false);
            this.logToDebugConsole('✅ 解除了所有冻结');
        });

        // 神器测试
        document.getElementById('btn-add-frost')?.addEventListener('click', () => {
            this.player.dice.push(this.createFrostDie());
            this.stats.total_artifacts_collected++;
            this.saveStats();
            this.updateArtifactDisplay();
            this.logToDebugConsole('✅ 获得了霜冻神器');
        });

        document.getElementById('btn-add-relay')?.addEventListener('click', () => {
            this.player.dice.push(this.createRelayDie());
            this.stats.total_artifacts_collected++;
            this.saveStats();
            this.updateArtifactDisplay();
            this.logToDebugConsole('✅ 获得了中继器神器');
        });

        document.getElementById('btn-add-trample')?.addEventListener('click', () => {
            this.player.dice.push(this.createTrampleDie());
            this.stats.total_artifacts_collected++;
            this.saveStats();
            this.updateArtifactDisplay();
            this.logToDebugConsole('✅ 获得了爆破者神器');
        });

        document.getElementById('btn-add-burn')?.addEventListener('click', () => {
            this.player.dice.push(this.createBurnDie());
            this.stats.total_artifacts_collected++;
            this.saveStats();
            this.updateArtifactDisplay();
            this.logToDebugConsole('✅ 获得了燃烧弹神器');
        });

        document.getElementById('btn-add-armor')?.addEventListener('click', () => {
            this.player.dice.push(this.createArmorDie());
            this.stats.total_artifacts_collected++;
            this.saveStats();
            this.updateArtifactDisplay();
            this.logToDebugConsole('✅ 获得了装甲弹神器');
        });

        document.getElementById('btn-clear-artifacts')?.addEventListener('click', () => {
            this.player.dice = this.player.dice.filter(d => !d.artifactId);
            this.activeArtifact = null;
            this.updateArtifactDisplay();
            this.logToDebugConsole('✅ 移除了所有神器');
        });

        // 战斗控制
        document.getElementById('btn-force-enemy-turn')?.addEventListener('click', () => {
            if (this.state === "PLAYER_TURN") {
                this.doEnemyTurn();
                this.logToDebugConsole('✅ 强制进入敌方回合');
            } else {
                this.logToDebugConsole('❌ 当前不是玩家回合');
            }
        });

        document.getElementById('btn-force-player-turn')?.addEventListener('click', () => {
            this.state = "PLAYER_TURN";
            this.canReroll = true;
            document.getElementById('action-bar').classList.remove('hidden');
            document.getElementById('btn-fire').classList.remove('hidden');
            this.logToDebugConsole('✅ 强制进入玩家回合');
        });

        document.getElementById('btn-instant-win')?.addEventListener('click', () => {
            this.enemy.dice = [];
            this.showLoot();
            this.logToDebugConsole('✅ 立即获胜');
        });

        document.getElementById('btn-instant-lose')?.addEventListener('click', () => {
            this.player.dice = [];
            this.startGameOverSequence();
            this.logToDebugConsole('✅ 立即失败');
        });

        // 统计数据控制
        document.getElementById('btn-reset-stats')?.addEventListener('click', () => {
            if (confirm('确定要重置所有统计数据吗？此操作不可逆。')) {
                this.stats = { ...GAME_CONFIG.initialStats }; // 假设 GAME_CONFIG.initialStats 包含初始统计数据
                this.saveStats();
                this.logToDebugConsole('✅ 统计数据已重置');
            }
        });

        // 关闭按钮
        document.getElementById('debug-close-btn')?.addEventListener('click', () => {
            this.toggleDebugConsole();
        });

        // 命令执行
        document.getElementById('debug-execute-btn')?.addEventListener('click', () => {
            this.executeDebugCommand();
        });

        document.getElementById('debug-command-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.executeDebugCommand();
            }
        });
    },

    // 记录到控制台输出
    logToDebugConsole(message) {
        const outputEl = document.getElementById('debug-output');
        if (outputEl) {
            const timestamp = new Date().toLocaleTimeString();
            outputEl.textContent += `[${timestamp}] ${message}\n`;
            outputEl.scrollTop = outputEl.scrollHeight;
        }
        console.log(message);
    },

    // 执行控制台命令
    executeDebugCommand() {
        const inputEl = document.getElementById('debug-command-input');
        if (!inputEl) return;

        const command = inputEl.value.trim();
        if (!command) return;

        inputEl.value = '';

        try {
            const result = this.evalDebugCommand(command);
            this.logToDebugConsole(`> ${command}`);
            if (result !== undefined) {
                this.logToDebugConsole(`< ${result}`);
            }
        } catch (e) {
            this.logToDebugConsole(`❌ 命令执行失败: ${e.message}`);
        }
    },

    // 评估控制台命令
    evalDebugCommand(command) {
        // 基础命令
        if (command === 'help') {
            return `可用命令:\nhelp - 显示帮助\nclear - 清空输出\nstatus - 显示游戏状态\ndice - 显示骰子信息\nartifacts - 显示神器信息\n\n快捷添加神器（玩家侧）:\n输入由数字组成的ID串，例如 12345\n1=霜冻  2=中继器  3=爆破者  4=燃烧弹  5=装甲弹\n\n快捷添加神器（敌方侧，v1.3.0 敌我通用）:\n输入 e 开头的ID串，例如 e24\ne1=霜冻  e2=中继器  e3=爆破者  e4=燃烧弹  e5=装甲弹\ne0 = 清空敌方神器`;
        }

        if (command === 'clear') {
            const outputEl = document.getElementById('debug-output');
            if (outputEl) outputEl.textContent = '';
            return '控制台已清空';
        }

        if (command === 'status') {
            return `游戏状态: ${this.state}\n玩家骰子: ${this.player.dice.length}\n敌方骰子: ${this.enemy.dice.length}\n当前回合: ${this.round}`;
        }

        if (command === 'dice') {
            let result = '玩家骰子:\n';
            this.player.dice.forEach((d, i) => {
                const burnInfo = d.burnStacks ? `(燃烧${d.burnStacks})` : '';
                const armorInfo = d.isArmor ? '(装甲)' : '';
                result += `  ${i}: ${d.v} ${d.isFrozen ? '(冻结)' : ''} ${armorInfo} ${burnInfo} ${d.artifactId ? `(${d.artifactId})` : ''}\n`;
            });
            result += '敌方骰子:\n';
            this.enemy.dice.forEach((d, i) => {
                const burnInfo = d.burnStacks ? `(燃烧${d.burnStacks})` : '';
                const armorInfo = d.isArmor ? '(装甲)' : '';
                result += `  ${i}: ${d.v} ${d.isFrozen ? '(冻结)' : ''} ${armorInfo} ${burnInfo} ${d.artifactId ? `(${d.artifactId})` : ''}\n`;
            });
            return result;
        }

        if (command === 'artifacts') {
            const artifacts = this.player.dice.filter(d => d.artifactId).map(d => d.name).join(', ');
            const enemyArtifacts = (this.enemy && this.enemy.dice) ? this.enemy.dice.filter(d => d.artifactId).map(d => d.name).join(', ') : '';
            return `持有神器: ${artifacts || '无'}\n敌方神器: ${enemyArtifacts || '无'}\n激活神器: ${this.activeArtifact?.id || '无'}`;
        }

        // v1.3.0 敌我通用神器：快捷给敌方添加神器（例如 e24 = 中继器 + 燃烧弹；e0 = 清空）
        if (/^e\d+$/.test(command)) {
            if (command === 'e0') {
                let removed = 0;
                if (this.enemy && this.enemy.dice) {
                    this.enemy.dice = this.enemy.dice.filter(d => !d.artifactId);
                    removed = 1;
                }
                return '已清空敌方神器骰子';
            }
            if (!this.enemy || !this.enemy.dice) return '敌方尚未生成，请先进入战斗';
            const added = [];
            for (const ch of command.slice(1)) {
                const map = { '1': 'frost', '2': 'relay', '3': 'trample', '4': 'burn', '5': 'armor' };
                const die = this.createArtifactDieById(map[ch]);
                if (die) {
                    this.enemy.dice.push(die);
                    added.push(die.name || map[ch]);
                }
            }
            return added.length > 0
                ? `已为敌方添加神器: ${added.join(', ')}（效果遵循敌我通用规则）`
                : '输入的数字中没有对应的神器ID';
        }

        // 纯数字命令：按位添加对应ID的神器骰子
        if (/^[0-9]+$/.test(command)) {
            const added = [];
            for (const ch of command) {
                if (ch === '1') {
                    this.player.dice.push(this.createFrostDie());
                    added.push(GAME_CONFIG.text.artifactFrostName || '霜冻');
                } else if (ch === '2') {
                    this.player.dice.push(this.createRelayDie());
                    added.push(GAME_CONFIG.text.artifactRelayName || '中继器');
                } else if (ch === '3') {
                    this.player.dice.push(this.createTrampleDie());
                    added.push(GAME_CONFIG.text.artifactTrampleName || '爆破者');
                } else if (ch === '4') {
                    this.player.dice.push(this.createBurnDie());
                    added.push(GAME_CONFIG.text.artifactBurnName || '燃烧弹');
                } else if (ch === '5') {
                    this.player.dice.push(this.createArmorDie());
                    added.push(GAME_CONFIG.text.artifactArmorName || '装甲弹');
                }
            }

            this.updateArtifactDisplay();
            this.updateHpDisplay();

            return added.length > 0
                ? `已根据ID添加神器: ${added.join(', ')}`
                : '输入的数字中没有对应的神器ID';
        }

        // 尝试作为JavaScript代码执行
        return eval(command);
    },

    // 创建随机骰子（用于测试）
    createRandomDie() {
        return {
            v: Math.floor(Math.random() * 6) + 1,
            artifactId: null,
            name: null,
            isFrozen: false,
            isFragile: false
        };
    },

    // 取消目标选择
    cancelTargetSelection() {
        console.log('Target selection cancelled');
        this.cleanupTargetSelection();

        // 返回到玩家回合
        this.state = "PLAYER_TURN";
        this.canReroll = true;
        document.getElementById('action-bar').classList.remove('hidden');
        document.getElementById('btn-fire').classList.remove('hidden');
    },

    // 确认目标选择并执行伤害
    confirmTargetSelection(damage, color, side) {
        // 对于中继器神器（敌方攻击玩家），先发射炮弹，然后应用伤害到选择的骰子
        if (side === "enemy") {
            const selectedIndex = this.selectedTargetIndex;
            const targetDie = this.player.dice[selectedIndex];

            // 清理目标选择状态
            this.cleanupTargetSelection();

            // 先发射炮弹动画，指定目标骰子索引（中继器效果）
            this.fireCannonballs(side, selectedIndex);

            // 等待炮弹落地 (轮询检查)
            const waitForProjectiles = () => {
                return new Promise(resolve => {
                    const check = () => {
                        if (this.cannonballs.length === 0) resolve();
                        else setTimeout(check, 100);
                    };
                    // 延迟一帧确保炮弹已生成
                    setTimeout(check, 50);
                });
            };

            // 异步处理炮弹动画和伤害应用
            (async () => {
                await waitForProjectiles();
                await new Promise(r => setTimeout(r, GAME_CONFIG.combat.cannonballWaitTime));

                // 计算选中骰子的屏幕坐标
                const col = Math.floor(selectedIndex / 3), row = selectedIndex % 3;
                const dieX = this.player.x + (-80 + col * 60); // 玩家船骰子坐标
                const dieY = this.player.y - 20 - (row * 60);

                // 应用伤害到选择的骰子
                const effectiveHp = targetDie.isFragile ? 1 : targetDie.v;
                if (effectiveHp <= damage) {
                    // 骰子被摧毁
                    this.player.dice.splice(selectedIndex, 1);
                    this.stats.total_damage_taken += effectiveHp;
                } else {
                    targetDie.v -= damage;
                    this.stats.total_damage_taken += damage;
                }

                // 播放命中特效
                this.spawnExplosion(dieX, dieY, color);
                this.spawnFloatingText(`-${damage}`, dieX, dieY - 50, '#ff3366');
                this.playSFX('explosion');

                // 敌方攻击结束后也需要结算燃烧伤害
                this.applyBurnDamage();

                // 如果敌方在燃烧结算后已经没有骰子了，直接进入打捞阶段
                if (!this.enemy || !this.enemy.dice || this.enemy.dice.length === 0) {
                    console.log("Enemy dice empty after ambush attack - triggering win sequence");
                    this.round++;
                    this.stats.total_enemies_defeated++;
                    this.stats.total_rounds_completed++;
                    this.saveStats();
                    if (this.enemy) this.enemy.dead = true;
                    setTimeout(() => {
                        this.showLoot();
                    }, GAME_CONFIG.combat.lootShowDelay);
                    return;
                }

                // 移除霜冻神器效果触发：寒霜骰子不应在敌方攻击时触发冻结

                // 检查玩家是否失败
                if (this.player.dice.length === 0) {
                    this.impactFrames = GAME_CONFIG.visual.impactFrameDuration;
                    this.startGameOverSequence();
                } else {
                    // 进入玩家回合
                    this.state = "PLAYER_TURN";
                    this.canReroll = true;
                    document.getElementById('action-bar').classList.remove('hidden');
                    document.getElementById('btn-fire').classList.remove('hidden');
                }
            })();

            return;
        }

        // 其他情况（如果有的话）的处理
        const target = (side === "player") ? this.enemy : this.player;
        const selectedIndex = this.selectedTargetIndex;

        // 清理目标选择状态
        this.cleanupTargetSelection();

        // 计算选中骰子的屏幕坐标
        const col = Math.floor(selectedIndex / 3), row = selectedIndex % 3;
        const dieX = target.x + (side === "player" ? 80 - col * 60 : -80 + col * 60);
        const dieY = this.player.y - 20 - (row * 60);

        // 执行正常的炮弹发射流程
        this.spawnMuzzleFlash((side === "player" ? this.player : this.enemy).x +
            (side === "player" ? 100 : -100), this.player.y, side === "enemy");
        this.shake = 30;

        this.cannonAnim[side] = 1.0;

        this.spawnCannonball(
            (side === "player" ? this.player : this.enemy).x + (side === "player" ? 100 : -100),
            this.player.y, dieX, dieY, damage, color, side,
            GAME_CONFIG.physics.cannonballArcHeight + Math.random() * 60,
            selectedIndex
        );

        // 清理选择状态
        this.selectedTargetIndex = undefined;
    },

    // 显示神秘商人界面
    showMerchant() {
        if (this.state === "MERCHANT") return; // 重入守卫
        this.state = "MERCHANT";
        this.merchantShown = true;

        // 循环播放商人背景音乐
        this.playBGM('merchantAppear');

        // 绘制商人头像
        const avatarCanvas = document.getElementById('merchant-avatar-canvas');
        if (avatarCanvas) {
            const ctx = avatarCanvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, avatarCanvas.width, avatarCanvas.height);
            this.drawMysteryPerson(ctx, 40, 40, 70, '#aa00ff');
        }

        // 设置对话文本
        const textEl = document.getElementById('merchant-dialogue-text');
        if (textEl) {
            // 根据剩余神器数量决定对话阶段
            // 初始: 3个可用 (修理工阶段)
            // 第一轮: 2个可用
            // 第三轮: 1个可用
            const count = this.availableArtifacts.length;
            if (count === 3) {
                textEl.textContent = GAME_CONFIG.text.merchantDialogue;
            } else if (count === 2) {
                textEl.textContent = GAME_CONFIG.text.merchantDialoguePhase2;
            } else {
                textEl.textContent = GAME_CONFIG.text.merchantDialoguePhase3;
            }
        }

        // 渲染选择区域
        this.renderMerchantSelection();

        // 显示界面
        document.getElementById('screen-merchant').classList.remove('hidden');

        // 隐藏确认按钮，直到做出选择
        const confirmBtn = document.getElementById('merchant-confirm-btn');
        if (confirmBtn) {
            confirmBtn.classList.add('hidden');
            confirmBtn.onclick = () => {
                this.playSFX('menuConfirm');
                this.confirmMerchantSelection();
            };
        }
    },

    renderMerchantSelection() {
        const container = document.getElementById('merchant-selection-area');
        if (!container) return;

        container.innerHTML = '';
        this.selectedMerchantArtifactId = null; // 重置选择
        this.merchantDiceAnimators = []; // 重置动画列表

        // 更新描述区域
        const descEl = document.getElementById('merchant-artifact-description');
        if (descEl) descEl.textContent = GAME_CONFIG.text.dice.unrevealed;

        this.availableArtifacts.forEach((artifactId, index) => {
            const card = document.createElement('div');
            card.className = 'quality-dice'; // 复用 existing class for styling if possible, or use new one
            // 为了保持样式一致，我们手动设置样式，模拟 loot-card 但更大
            card.style.cssText = "display: flex; flex-direction: column; align-items: center; margin: 10px; cursor: pointer; border: 3px solid transparent; padding: 20px; background: rgba(0,0,0,0.5); width: 120px; height: 160px; justify-content: center; border-radius: 10px; transition: all 0.2s;";

            // 绘制骰子
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 100;
            canvas.style.width = '100px';
            canvas.style.height = '100px';
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;

            let color = '#fff';
            let name = artifactId;

            // 根据ID设置颜色和名称
            if (artifactId === 'frost') {
                color = '#00ccff';
                name = GAME_CONFIG.text.artifactFrostName;
            } else if (artifactId === 'relay') {
                color = '#aa00ff'; // 紫色
                name = GAME_CONFIG.text.artifactRelayName;
            } else if (artifactId === 'trample') {
                color = '#ff6600'; // 橙色
                name = GAME_CONFIG.text.artifactTrampleName;
            }

            // 添加到动画列表
            this.merchantDiceAnimators.push({
                ctx: ctx,
                color: color,
                phase: index * (Math.PI * 2 / 3) // 错开旋转相位
            });

            card.appendChild(canvas);

            // 添加标签
            const label = document.createElement('div');
            label.textContent = name;
            label.style.color = color;
            label.style.marginTop = '15px';
            label.style.fontFamily = 'var(--pixel-font)';
            label.style.fontSize = 'var(--font-label)';
            label.style.fontWeight = 'bold';
            label.style.textShadow = `0 0 5px ${color}`;
            card.appendChild(label);

            // 点击事件
            card.onclick = () => {
                this.playSFX('menuNavigate');

                // 移除其他卡片的选中状态
                Array.from(container.children).forEach(c => {
                    c.style.borderColor = 'transparent';
                    c.style.background = 'rgba(0,0,0,0.5)';
                    c.style.transform = 'scale(1.0)';
                });
                card.style.borderColor = color;
                card.style.background = `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.2)`;
                card.style.transform = 'scale(1.1)';

                this.selectedMerchantArtifactId = artifactId;

                // 更新描述
                if (descEl) {
                    if (artifactId === 'frost') descEl.textContent = GAME_CONFIG.text.artifactFrostDescription;
                    else if (artifactId === 'relay') descEl.textContent = GAME_CONFIG.text.artifactRelayDescription;
                    else if (artifactId === 'trample') descEl.textContent = GAME_CONFIG.text.artifactTrampleDescription;
                }

                // 显示确认按钮
                const btn = document.getElementById('merchant-confirm-btn');
                if (btn) btn.classList.remove('hidden');
            };

            container.appendChild(card);
        });
    },

    // 绘制神秘商人界面的动态骰子
    drawMerchantDice() {
        if (!this.merchantDiceAnimators) return;

        this.merchantDiceAnimators.forEach(anim => {
            const { ctx, color, phase } = anim;
            ctx.clearRect(0, 0, 100, 100);

            // 旋转动画
            const rotation = (this.time + phase) * 0.5;
            this.drawIsometricDice(ctx, 50, 50, 40, rotation); // 使用 drawIsometricDice 绘制基础形状

            // 叠加颜色滤镜效果 (简单的覆盖一层半透明色)
            ctx.save();
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.3;
            ctx.fillRect(0, 0, 100, 100);
            ctx.restore();
        });
    },

    confirmMerchantSelection() {
        if (!this.selectedMerchantArtifactId) return;

        const id = this.selectedMerchantArtifactId;

        // 从可用池中移除
        const index = this.availableArtifacts.indexOf(id);
        if (index > -1) {
            this.availableArtifacts.splice(index, 1);
        }

        // 加入已获取列表
        // 修复：直接存入字符串ID，而不是对象，以便 start() 函数能正确识别
        this.acquiredArtifacts.push(id);

        // 实际创建骰子并加入玩家队伍
        if (id === 'frost') {
            this.player.dice.push(this.createFrostDie());
            this.stats.total_artifacts_collected++;
        } else if (id === 'relay') {
            this.player.dice.push(this.createRelayDie());
            this.stats.total_artifacts_collected++;
        } else if (id === 'trample') {
            this.player.dice.push(this.createTrampleDie());
            this.stats.total_artifacts_collected++;
        }
        this.saveStats();

        // 播放音效和更新UI
        this.playSFX('artifactUnlock');
        this.playSFX('interfaceClose');

        // 停止商人背景音乐
        this.stopBGM();

        document.getElementById('screen-merchant').classList.add('hidden');

        this.updateArtifactDisplay(); // 需要确保这个方法支持多神器
        this.updateHpDisplay();

        // 逻辑分支：如果是初始选择（3选1），则开始新游戏；如果是后续选择，则继续流程
        // 我们通过 availableArtifacts 的数量来反推当前是哪个阶段
        // 刚选完1个：
        // 剩2个 -> 说明是初始3选1结束 -> start()
        // 剩1个 -> 说明是第1轮2选1结束 -> showLoot()
        // 剩0个 -> 说明是第3轮1选1结束 -> showLoot()

        const remaining = this.availableArtifacts.length;
        if (remaining === 2) {
            // 初始选择结束，开始游戏
            this.start();
        } else {
            // 恢复战斗背景音乐
            this.playBGM('battle');

            // 游戏中途选择结束，继续战利品流程
            this.showLoot();
        }
    },
};

window.onload = async () => await game.init();