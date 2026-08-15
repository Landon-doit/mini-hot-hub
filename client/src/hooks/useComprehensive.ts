import { useQuery } from '@tanstack/react-query';
import type { ComprehensiveItem } from '../types/hot';
import { fetchComprehensive } from '../api/hot';

// 综合热榜缓存 5min（TCD §3.4）
const COMPREHENSIVE_STALE_MS = 5 * 60 * 1000;

export interface UseComprehensiveResult {
  data: ComprehensiveItem[] | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useComprehensive(): UseComprehensiveResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['hot', 'comprehensive'],
    queryFn: fetchComprehensive,
    staleTime: COMPREHENSIVE_STALE_MS,
  });

  return {
    data,
    loading: isLoading,
    error,
    refetch: () => {
      void refetch();
    },
  };
}