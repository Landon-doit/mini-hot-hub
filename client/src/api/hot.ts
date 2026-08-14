import type { HotPlatform, Platform } from '../types/hot';
import hotMock from '../mock/hot.json';

const MOCK = hotMock as HotPlatform[];

// dev 下 VITE_API_BASE 为空，走相对路径 + vite proxy；生产分域部署时填真实 API 域名
const BASE = import.meta.env.VITE_API_BASE ?? '';

/**
 * 拉取六大平台聚合热榜（TCD §5.3.1 GET /api/hot/aggregate）。
 * 降级策略：后端不可用或异常时回退本地 Mock，保证开发/联调可用。
 */
export async function fetchAllHot(): Promise<HotPlatform[]> {
  try {
    const res = await fetch(`${BASE}/api/hot/aggregate`);
    if (!res.ok) {
      return MOCK;
    }
    const body = await res.json();
    return Object.values(body.data ?? {}) as HotPlatform[];
  } catch {
    return MOCK;
  }
}

/**
 * 拉取单平台热榜（TCD §5.3.1 GET /api/hot/{platform}）。
 * 成功返回 body.data[source]；失败（非 200 / 网络异常 / 字段缺失）回退本地 Mock。
 * 端点未建成的平台自动走 Mock，建成后零改码接入真实数据（对齐降级链 F1→F4）。
 */
export async function fetchHotPlatform(source: Platform): Promise<HotPlatform> {
  try {
    const res = await fetch(`${BASE}/api/hot/${source}`);
    if (!res.ok) {
      return fallback(source);
    }
    const body = await res.json();
    const platform = body?.data?.[source] as HotPlatform | undefined;
    if (!platform || !Array.isArray(platform.items)) {
      return fallback(source);
    }
    return platform;
  } catch {
    return fallback(source);
  }
}

function fallback(source: Platform): HotPlatform {
  const mock = MOCK.find((p) => p.platform === source);
  if (!mock) {
    throw new Error(`未知平台：${source}`);
  }
  return mock;
}