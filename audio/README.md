# 音效资源文件夹

这个文件夹包含游戏《骰骨之海》的所有音效资源文件。

## 文件格式
每个音效都提供两种格式：
- `.ogg` - 主要格式，优先使用
- `.mp3` - 备用格式，当ogg不支持时使用

## 音效分类

### 🎯 背景音乐 (BGM)
- `main-menu.ogg/mp3` - 主界面背景音乐
- `battle.ogg/mp3` - 海战战斗背景音乐
- `victory.ogg/mp3` - 胜利背景音乐
- `defeat.ogg/mp3` - 失败背景音乐

### 🎮 界面交互音效
- `menu-navigate.ogg/mp3` - 菜单上下导航
- `menu-confirm.ogg/mp3` - 菜单确认选择
- `menu-cancel.ogg/mp3` - 菜单取消/返回
- `ui-hover.ogg/mp3` - 按钮悬停
- `interface-open.ogg/mp3` - 界面打开
- `interface-close.ogg/mp3` - 界面关闭

### ⚓ 游戏事件音效
- `thunder.ogg/mp3` - 雷鸣音效
- `victory.ogg/mp3` - 游戏胜利
- `defeat.ogg/mp3` - 游戏失败
- `artifact-unlock.ogg/mp3` - 解锁神器
- `merchant-appear.ogg/mp3` - 商人出现

### 🎲 战斗系统音效
- `dice-roll.ogg/mp3` - 骰子投掷
- `dice-reroll.ogg/mp3` - 骰子重投
- `cannon-fire.ogg/mp3` - 发射炮弹
- `explosion.ogg/mp3` - 炮弹命中爆炸
- `dice-freeze.ogg/mp3` - 骰子冻结
- `loot-pickup.ogg/mp3` - 获得战利品

### 🌊 环境音效
- `ocean-waves.ogg/mp3` - 海浪声
- `wind.ogg/mp3` - 风声//不需要

### 📊 反馈音效
- `positive-feedback.ogg/mp3` - 正面反馈
- `negative-feedback.ogg/mp3` - 负面反馈
- `warning.ogg/mp3` - 警告音效
- `notification.ogg/mp3` - 通知音效

## 注意事项
- 所有文件都是占位符，需要用实际的音效文件替换
- BGM文件设置为循环播放
- 音效文件大小建议控制在合理范围内以优化加载性能
- 支持立体声，建议使用44.1kHz采样率

## 音效配置
音效的播放逻辑和音量控制在 `config.js` 中配置，在 `game.js` 中实现播放逻辑。
