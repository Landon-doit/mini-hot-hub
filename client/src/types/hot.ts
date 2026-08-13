// 平台枚举（与 TCD §3.1 对齐）
export type Platform = 'weibo' | 'zhihu' | 'bilibili' | 'douyin' | 'baidu' | 'toutiao';

// 热度值：raw 原始数值，display 人类可读，normalized 由聚合层统一计算（0-100）
export interface HotValue {
  raw: number;
  display: string;
  normalized: number;
}

export type HeatLevel = 'normal' | 'hot' | 'explosive';

// 单条热搜条目
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

// 单平台聚合结果（首页卡片 / 详情页）
export interface HotPlatform {
  platform: Platform;
  platformName: string;
  status: 'ok' | 'degraded';
  items: HotItem[];
  error: string | null;
}