import type { HotPlatform } from '../types/hot';
import hotMock from '../mock/hot.json';

const MOCK = hotMock as HotPlatform[];

/**
 * 拉取六大平台聚合热榜（当前以 Mock 兜底，后端就绪后返回真实数据）。
 * 降级策略：后端不可用时回退本地 Mock 数据，保证开发/联调可用。
 */
export async function fetchHotAggregate(): Promise<HotPlatform[]> {
  try {
    const res = await fetch('/api/hot/aggregate');
    if (!res.ok) {
      return MOCK;
    }
    const body = await res.json();
    return Object.values(body.data ?? {}) as HotPlatform[];
  } catch {
    return MOCK;
  }
}