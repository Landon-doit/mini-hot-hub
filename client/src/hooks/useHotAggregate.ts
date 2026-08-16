import { useQuery } from '@tanstack/react-query';
import type { HotPlatform } from '../types/hot';
import { fetchAllHot } from '../api/hot';

// 首页聚合缓存 5min（TCD §3.4，取六平台最短 TTL）
const AGGREGATE_STALE_MS = 5 * 60 * 1000;

export interface UseHotAggregateResult {
  data: HotPlatform[] | undefined;
  cacheHit: boolean;
  loading: boolean;
  fetching: boolean;
  refetch: () => void;
}

export function useHotAggregate(): UseHotAggregateResult {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['hot', 'aggregate'],
    queryFn: fetchAllHot,
    staleTime: AGGREGATE_STALE_MS,
  });

  return {
    data: data?.platforms,
    cacheHit: data?.cacheHit ?? false,
    loading: isLoading,
    fetching: isFetching,
    refetch: () => {
      void refetch();
    },
  };
}