// server/routes/config-routes.ts - 配表下发接口
// 前端启动时拉取一次；失败时前端走仓库内置兜底值，游戏照常可玩
import { Hono } from 'hono';
import type { AppEnv } from '../index';
import { getLevels, getArtifactPool, getOverrides } from '../services/ConfigService';

const app = new Hono<AppEnv>();

app.get('/bundle', async (c) => {
  const db = c.env.DB;
  const [levels, artifacts, overrides] = await Promise.all([
    getLevels(db),
    getArtifactPool(db),
    getOverrides(db),
  ]);
  return c.json({
    ok: true,
    version: 'v1.4.0',
    levels,
    artifacts,
    overrides,
  });
});

export default app;
