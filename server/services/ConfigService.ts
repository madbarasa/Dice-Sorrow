// server/services/ConfigService.ts - 配表服务：读 D1 + isolate 内存缓存
// 真实调校数值只存在于 D1；仓库内置的是兜底默认值
const CACHE_TTL_MS = 60_000;

type CacheEntry = { data: unknown; expiresAt: number };
const cache = new Map<string, CacheEntry>();

async function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.data as T;
  const data = await loader();
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}

export async function getLevels(db: D1Database) {
  return cached('levels', async () => {
    const { results } = await db
      .prepare('SELECT id, count_min, count_max, value_min, value_max FROM levels ORDER BY id')
      .all<{ id: number; count_min: number; count_max: number; value_min: number; value_max: number }>();
    return (results ?? []).map((r) => ({
      count: [r.count_min, r.count_max],
      value: [r.value_min, r.value_max],
    }));
  });
}

export async function getArtifactPool(db: D1Database) {
  return cached('artifacts', async () => {
    const { results } = await db
      .prepare('SELECT id FROM artifacts WHERE enabled = 1 ORDER BY weight DESC, id')
      .all<{ id: string }>();
    return (results ?? []).map((r) => r.id);
  });
}

export async function getOverrides(db: D1Database) {
  return cached('overrides', async () => {
    const { results } = await db
      .prepare('SELECT config_key, config_value FROM game_config')
      .all<{ config_key: string; config_value: string }>();
    const out: Record<string, unknown> = {};
    for (const row of results ?? []) {
      try {
        out[row.config_key] = JSON.parse(row.config_value);
      } catch {
        out[row.config_key] = row.config_value;
      }
    }
    return out;
  });
}

export function invalidateCache() {
  cache.clear();
}
