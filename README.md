# 骰骨之海（Dice Sorrow）

一款像素风格的回合制海战游戏。你是一名船长，驾驶一艘由骰子驱动的战舰，在风暴肆虐的海域中航行十三场战斗。骰子既是战舰的血量，也是火力的来源：投出的点数决定伤害，击败敌舰后打捞它的骰子来强化自己。

游戏融合了骰子策略、战利品构建与五种神器能力，敌我双方都可以使用神器，是一场不断成长的海上冒险。

## 玩法简介

- **掷骰开火**：参与进攻的骰子各掷一次，点数总和就是炮击伤害。每回合有一次重新校准的机会。
- **打捞强化**：击败敌舰后从战利品中随机抽取一枚骰子，加入自己的舰队。
- **神器系统**：霜冻、中继器、爆破者、燃烧弹、装甲弹五种神器，敌我通用。
- **十三场战斗**：敌方阵容逐场变强，途中会有闪击、神秘商人和新手教程。

完整的玩法与设定请见 [游戏策划文档](GAME_DESIGN_DOCUMENT.md)。

## 运行

项目使用 Cloudflare Workers 承载，配表数据存放在 D1 数据库中。游戏运行文件位于 `public/` 目录，服务端逻辑位于 `server/`，数据库脚本位于 `scripts/`。

安装依赖：

```bash
npm install
```

本地启动：

```bash
npm run dev
```

部署到 Cloudflare：

```bash
npm run deploy
```

配置数值通过 D1 数据库下发，支持在线调参而无需重新发版；拉取失败或以本地文件方式直接打开时，游戏会自动使用内置的兜底默认值，仍可正常游玩。

## 目录结构

- `public/`：游戏前端文件（页面、脚本、配置、音效）
- `server/`：Worker 服务端与配置接口
- `scripts/`：D1 数据库结构与数据脚本
- `GAME_DESIGN_DOCUMENT.md`：游戏策划文档
- `changelog.txt`：版本更新记录

---

[![](https://img.shields.io/badge/powered_by-dsh-4D6BFE?style=flat-square&logo=deepseek&logoColor=white)](https://github.com/deepseek-ai/deepseek-harness)
