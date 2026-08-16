import type { ComprehensiveItem, HotPlatform, Platform } from '../types/hot';
import { MOCK_PLATFORMS } from '@shared/mock-data';

const MOCK = MOCK_PLATFORMS;

// dev 下 VITE_API_BASE 为空，走相对路径 + vite proxy；生产分域部署时填真实 API 域名
const BASE = import.meta.env.VITE_API_BASE ?? '';

export interface AggregateResult {
  platforms: HotPlatform[];
  cacheHit: boolean;
}

/**
 * 拉取六大平台聚合热榜（TCD §5.3.1 GET /api/hot/aggregate）。
 * 降级策略：后端不可用或异常时回退本地 Mock，保证开发/联调可用。
 */
export async function fetchAllHot(): Promise<AggregateResult> {
  try {
    const res = await fetch(`${BASE}/api/hot/aggregate`);
    if (!res.ok) {
      return { platforms: MOCK, cacheHit: false };
    }
    const body = await res.json();
    const platforms = Object.values(body.data ?? {}) as HotPlatform[];
    const cacheHit = Boolean(body?.meta?.cacheHit);
    return { platforms, cacheHit };
  } catch {
    return { platforms: MOCK, cacheHit: false };
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

/**
 * 拉取跨平台综合热榜（TCD §5.3.1 GET /api/hot/comprehensive）。
 * 成功返回 body.data.items；失败直接抛错交由 React Query 进入 error 态
 * （综合热榜需中文分词合并，客户端无等价 Mock，不做本地兜底）。
 */
export async function fetchComprehensive(): Promise<ComprehensiveItem[]> {
  const res = await fetch(`${BASE}/api/hot/comprehensive`);
  if (!res.ok) {
    throw new Error(`综合热榜请求失败（HTTP ${res.status}）`);
  }
  const body = await res.json();
  const items = body?.data?.items;
  if (!Array.isArray(items)) {
    throw new Error('综合热榜响应格式异常');
  }
  return items as ComprehensiveItem[];
}