import { atomWithStorage } from 'jotai/utils';

export type ThemeMode = 'dark' | 'light' | 'system';

export const THEME_STORAGE_KEY = 'theme';

// 主题状态：持久化到 localStorage（key = theme），默认深色
export const themeAtom = atomWithStorage<ThemeMode>(THEME_STORAGE_KEY, 'dark');

// 将 'system' 解析为实际亮/暗色
export function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return mode;
}

// 把主题应用到 <html> 的 .dark class
export function applyTheme(mode: ThemeMode): void {
  document.documentElement.classList.toggle('dark', resolveTheme(mode) === 'dark');
}