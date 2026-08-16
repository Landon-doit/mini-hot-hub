// 进程内缓存（内存版，满足 M1 mock 阶段）
// 后续替换为 Redis 时保持 getCache / setCache 接口不变，路由层无需改动
const cache = new Map<
  string,
  { value: unknown; expiresAt: number; timer?: NodeJS.Timeout }
>();

function resolveTtl(ttlSec?: number): number {
  const isPositive = (n: number): boolean => Number.isFinite(n) && n > 0;
  // TTL 取值顺序：显式 ttlSec → CACHE_TTL 环境变量 → 600
  if (ttlSec !== undefined && isPositive(ttlSec)) {
    return ttlSec;
  }
  const envTtl = Number(process.env.CACHE_TTL);
  if (isPositive(envTtl)) {
    return envTtl;
  }
  return 600;
}

export function setCache(key: string, data: unknown, ttlSec?: number): void {
  const ttl = resolveTtl(ttlSec);
  const expiresAt = Date.now() + ttl * 1000;

  // 同一 key 已存在旧定时器时先清除，避免旧定时器误删新值
  const existing = cache.get(key);
  if (existing?.timer) {
    clearTimeout(existing.timer);
  }

  const timer = setTimeout(() => {
    const entry = cache.get(key);
    if (entry && entry.expiresAt <= Date.now()) {
      cache.delete(key);
    }
  }, ttl * 1000);

  cache.set(key, { value: data, expiresAt, timer });
}

export function getCache<T = unknown>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) {
    return undefined;
  }
  // 惰性过期兜底：已过期则删除并返回 undefined
  if (entry.expiresAt <= Date.now()) {
    if (entry.timer) {
      clearTimeout(entry.timer);
    }
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
}