// server/index.ts - Dice Sorrow Worker 入口
// 职责：/api/* 走 Hono 路由；其余请求由 [assets] 静态托管兜底
import { Hono } from 'hono';
import configRoutes from './routes/config-routes';

export type AppEnv = {
  Bindings: {
    DB: D1Database;
    ASSETS: Fetcher;
  };
};

const app = new Hono<AppEnv>();

app.route('/api/config', configRoutes);

app.notFound((c) => c.json({ ok: false, error: 'not found' }, 404));

export default app;
