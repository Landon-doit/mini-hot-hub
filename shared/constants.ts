import type { Platform } from './types';

// 平台 → 品牌色映射（前后端共享，用于平台色点等展示场景）
export const PLATFORM_COLORS: Readonly<Record<string, string>> = {
  weibo: '#E6162D', // 微博红
  zhihu: '#0066FF', // 知乎蓝
  bilibili: '#FB7299', // B站粉
  douyin: '#25F4EE', // 抖音青
  baidu: '#2932E1', // 百度蓝
  toutiao: '#FE2C55', // 头条红
};

// 平台 → 中文名映射（用于共现平台 chips 等展示场景）
export const PLATFORM_NAMES: Readonly<Record<string, string>> = {
  weibo: '微博',
  zhihu: '知乎',
  bilibili: 'B站',
  douyin: '抖音',
  baidu: '百度',
  toutiao: '今日头条',
};

// 全平台枚举（单一来源：前端白名单、后端路由校验均复用，新增平台只改此处）
export const ALL_PLATFORMS: Platform[] = [
  'weibo',
  'zhihu',
  'bilibili',
  'douyin',
  'baidu',
  'toutiao',
];

export const CACHE_TTL_SECONDS = 600;
export const CONTACT_EMAIL = 'contact@timelune.app';
