import { useCallback, useEffect, useState } from 'react';
import type { HotPlatform, Platform } from '../types/hot';
import { fetchHotPlatform } from '../api/hot';

const PLATFORMS: Platform[] = [
  'weibo',
  'zhihu',
  'bilibili',
  'douyin',
  'baidu',
  'toutiao',
];

export interface UseHotListResult {
  loading: boolean;
  error: Error | null;
  data: HotPlatform[] | null;
  refetch: () => void;
}

export function useHotList(): UseHotListResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<HotPlatform[] | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // 逐平台拉取：微博走真实 /api/hot/weibo，未建端点的平台自动回退 Mock。
        // 聚合端点 /api/hot/aggregate 尚未实现，暂不切 fetchAllHot()（省 6 次请求）。
        const list = await Promise.all(PLATFORMS.map(fetchHotPlatform));
        if (!cancelled) {
          setData(list);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('加载失败'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  return { loading, error, data, refetch };
}