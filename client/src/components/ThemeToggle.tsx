import { useAtom } from 'jotai';
import type { ReactNode } from 'react';
import { themeAtom, type ThemeMode } from '../store/theme';

const ORDER: ThemeMode[] = ['dark', 'light', 'system'];

const LABELS: Record<ThemeMode, string> = {
  dark: '深色',
  light: '浅色',
  system: '跟随系统',
};

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5"
    >
      {children}
    </svg>
  );
}

const ICONS: Record<ThemeMode, ReactNode> = {
  dark: (
    <Icon>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </Icon>
  ),
  light: (
    <Icon>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </Icon>
  ),
  system: (
    <Icon>
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </Icon>
  ),
};

function ThemeToggle() {
  const [theme, setTheme] = useAtom(themeAtom);
  const current: ThemeMode = ORDER.includes(theme) ? theme : 'dark';

  const handleClick = () => {
    const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
    setTheme(next);
  };

  return (
    <button
      type="button"
      aria-label="切换主题"
      title={`主题：${LABELS[current]}`}
      onClick={handleClick}
      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border bg-card text-brand transition-colors hover:border-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {ICONS[current]}
    </button>
  );
}

export default ThemeToggle;