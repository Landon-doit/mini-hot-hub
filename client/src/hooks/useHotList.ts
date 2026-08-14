import { useCallback, useEffect, useState } from 'react';
import type { HotPlatform } from '../types/hot';
import { fetchAllHot } from '../api/hot';

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
        // 统一走聚合端点一次拉全 6 平台；后端不可用时 fetchAllHot 内部回退本地 Mock（F4）
        const list = await fetchAllHot();
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