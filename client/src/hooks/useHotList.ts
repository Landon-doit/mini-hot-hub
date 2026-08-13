import { useCallback, useEffect, useState } from 'react';
import type { HotPlatform } from '../types/hot';
// M1 接入后端后移除该 import，改用 api/hot.ts 的 fetchHotAggregate
import hotMock from '../mock/hot.json';

const MOCK_DATA = hotMock as HotPlatform[];

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
        // M1 后替换为：const list = await fetchHotAggregate();
        // （fetchHotAggregate 内部已解析 Object.values(response.data) 并失败回退 mock）
        await new Promise((resolve) => setTimeout(resolve, 500));
        const list: HotPlatform[] = MOCK_DATA;
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