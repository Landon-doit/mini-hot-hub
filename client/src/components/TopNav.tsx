import { useRef, useState, type ReactNode } from 'react';
import ThemeToggle from './ThemeToggle';
import { BRAND } from '../constants/brand';

interface TopNavProps {
  refetch: () => void;
  loading: boolean;
}

const REFRESH_INTERVAL_MS = 30_000;

function NavIcon({ children, className = '' }: { children: ReactNode; className?: string }) {
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
      className={`h-5 w-5 ${className}`}
    >
      {children}
    </svg>
  );
}

function SearchGlyph() {
  return (
    <NavIcon>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </NavIcon>
  );
}

function RefreshGlyph({ spinning }: { spinning: boolean }) {
  return (
    <NavIcon className={spinning ? 'animate-spin' : ''}>
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </NavIcon>
  );
}

function MenuGlyph() {
  return (
    <NavIcon>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </NavIcon>
  );
}

function CloseGlyph() {
  return (
    <NavIcon>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </NavIcon>
  );
}

// 图标按钮基础样式：44px 触摸区 + focus-visible 2px 焦点环
const ICON_BTN =
  'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border bg-card text-muted transition-colors hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

function SearchBox({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <form
      role="search"
      aria-label="搜索热搜"
      onSubmit={(e) => e.preventDefault()}
      className="relative flex items-center"
    >
      <span className="pointer-events-none absolute left-3 text-muted">
        <SearchGlyph />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="搜索热搜…"
        aria-label="搜索关键词"
        autoFocus={autoFocus}
        className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      />
    </form>
  );
}

function TopNav({ refetch, loading }: TopNavProps) {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const lastRefetchAtRef = useRef(0);

  const handleRefresh = () => {
    const now = Date.now();
    // 30s 内重复点击：仅播放旋转动画，不实际请求
    if (now - lastRefetchAtRef.current < REFRESH_INTERVAL_MS) {
      setSpinning(true);
      window.setTimeout(() => setSpinning(false), 600);
      return;
    }
    lastRefetchAtRef.current = now;
    refetch();
  };

  const isSpinning = spinning || loading;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <nav className="mx-auto flex max-w-[1200px] items-center gap-3 p-4" aria-label="主导航">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <img src={BRAND.logo} alt="Timelune" width={44} height={44} className="shrink-0 rounded-md object-contain" />
          <div>
            <h1 className="m-0 text-2xl font-bold leading-none text-brand">{BRAND.name}</h1>
            <span className="text-xs tracking-wide text-muted">{BRAND.nameEn}</span>
          </div>
        </a>

        {/* 桌面搜索框 */}
        <div className="hidden flex-1 md:block">
          <SearchBox value={query} onChange={setQuery} />
        </div>

        {/* 桌面右侧操作区 */}
        <div className="ml-auto hidden items-center gap-2 md:flex">
          <a
            href="#comprehensive"
            className="inline-flex min-h-[44px] items-center rounded-md px-3 text-sm text-muted transition-colors hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            综合热榜
          </a>
          <ThemeToggle />
          <button
            type="button"
            onClick={handleRefresh}
            aria-label="刷新"
            title="刷新"
            className={ICON_BTN}
          >
            <RefreshGlyph spinning={isSpinning} />
          </button>
          <button
            type="button"
            aria-label="登录"
            className="inline-flex min-h-[44px] items-center rounded-md bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            登录
          </button>
        </div>

        {/* 移动端右侧操作区 */}
        <div className="ml-auto flex items-center gap-1 md:hidden">
          <button type="button" onClick={() => setSearchOpen(true)} aria-label="搜索" className={ICON_BTN}>
            <SearchGlyph />
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="菜单"
            aria-expanded={menuOpen}
            className={ICON_BTN}
          >
            {menuOpen ? <CloseGlyph /> : <MenuGlyph />}
          </button>
        </div>
      </nav>

      {/* 移动端下拉菜单 */}
      {menuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="flex flex-col gap-1 p-3">
            <a
              href="#comprehensive"
              onClick={() => setMenuOpen(false)}
              className="inline-flex min-h-[44px] items-center rounded-md px-3 text-sm text-muted transition-colors hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              综合热榜
            </a>
            <div className="flex min-h-[44px] items-center justify-between px-3">
              <span className="text-sm text-muted">主题</span>
              <ThemeToggle />
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-md px-3 text-sm text-muted transition-colors hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <RefreshGlyph spinning={isSpinning} />
              刷新
            </button>
            <button
              type="button"
              className="inline-flex min-h-[44px] items-center rounded-md bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              登录
            </button>
          </div>
        </div>
      )}

      {/* 移动端全屏搜索 */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start bg-background p-4 md:hidden">
          <div className="flex flex-1 items-center gap-2">
            <SearchBox value={query} onChange={setQuery} autoFocus />
            <button type="button" onClick={() => setSearchOpen(false)} aria-label="关闭搜索" className={ICON_BTN}>
              <CloseGlyph />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default TopNav;