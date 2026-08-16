import { useQuery } from '@tanstack/react-query';
import { fetchHotPlatform } from '../api/hot';
import type { Platform } from '../types/hot';

export function usePlatformDetail(platform: Platform) {
  return useQuery({
    queryKey: ['hot', 'platform', platform],
    queryFn: () => fetchHotPlatform(platform),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}