// 前后端共享类型（与 TCD §3.1 对齐）

export type Platform =
  | 'weibo'
  | 'zhihu'
  | 'bilibili'
  | 'douyin'
  | 'baidu'
  | 'toutiao';

export interface HotValue {
  raw: number;
  display: string;
  normalized: number;
}

export type HeatLevel = 'normal' | 'hot' | 'explosive';

export interface HotItem {
  id: string;
  platform: Platform;
  rank: number;
  title: string;
  url: string;
  hotValue: HotValue;
  label: string | null;
  heatLevel: HeatLevel;
  categories: string[];
  primaryCategory: string | null;
  description?: string;
  imageUrl?: string;
  isMock: boolean;
  fetchedAt: string;
  updatedAt: string;
}

export interface HotPlatform {
  platform: Platform;
  platformName: string;
  status: 'ok' | 'degraded';
  isMock: boolean;
  items: HotItem[];
  error: string | null;
  updatedAt: string;
}

// 跨平台综合热榜条目（TCD §3.1 / PRD 综合热榜接口）
export interface ComprehensiveItem {
  id: string;
  title: string;
  mergedFrom: Platform[];
  platformCount: number;
  maxRank: number;
  topHotValue: HotValue;
  label: string | null;
  heatLevel: HeatLevel;
  categories: string[];
  primaryCategory: string | null;
  url: string;
  isMock: boolean;
  updatedAt: string;
}
