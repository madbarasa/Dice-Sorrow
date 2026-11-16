# 音效资源文件夹

本文件夹包含游戏《骰骨之海》(v1.4.1) 的全部音效资源。

## 文件格式

所有音效统一为 `.ogg` 格式，共 18 个文件。文件路径配置于 `public/config.js` 的 `audio.files`，播放逻辑实现于 `public/game.js` 的 `AudioManager` 类。

## 音效清单

### 背景音乐 (BGM)
- `main-menu.ogg` - 主界面 / 开场界面背景音乐
- `battle.ogg` - 战斗背景音乐
- `victory.ogg` - 胜利背景音乐
- `defeat.ogg` - 失败背景音乐
- `merchant-appear.ogg` - 神秘商人界面背景音乐

### 界面交互音效
- `menu-navigate.ogg` - 菜单导航
- `menu-confirm.ogg` - 菜单确认选择
- `menu-cancel.ogg` - 菜单取消 / 返回
- `interface-close.ogg` - 界面关闭
- `ui-click.ogg` - 通用点击反馈

### 战斗音效
- `dice-roll.ogg` - 骰子投掷
- `dice-reroll.ogg` - 骰子重投
- `dice-freeze.ogg` - 骰子冻结
- `cannon-fire.ogg` - 发射炮弹
- `explosion.ogg` - 炮弹命中爆炸 / 践踏 / 燃烧
- `artifact-unlock.ogg` - 神器解锁 / 装甲骰子生成

### 战利品与环境
- `loot-pickup.ogg` - 获得战利品
- `ocean-waves.ogg` - 海浪环境音

## 播放规则

- BGM 循环播放，按场景切换，切换时带淡入淡出
- 主音量、BGM 音量、SFX 音量三级独立控制
- Web Audio API 为主路径，`file://` 协议或不支持时降级为 HTML5 Audio
- 关键音效（菜单确认 / 取消、掷骰、开火、爆炸、战利品、神器解锁）预加载

## 音效配置

音量与文件路径在 `public/config.js` 的 `audio` 配置项中维护，播放调用在 `public/game.js` 中通过 `playSFX(key)` 与 `playBGM(key)` 完成。新增音效需同时补充文件、config 路径项与播放调用。
