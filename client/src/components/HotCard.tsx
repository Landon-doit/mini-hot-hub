import type { HotItem, HotPlatform } from '../types/hot';
import { formatRelativeTime, latestUpdatedAt } from '../lib/format';
import { PLATFORM_COLORS } from '@shared/constants';

interface HotCardProps {
  loading?: boolean;
  error?: string | null;
  data?: HotPlatform;
  cacheHit?: boolean;
  previewCount?: number;
  onRetry?: () => void;
}

function rankClass(rank: number): string {
  if (rank === 1) {
    return 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D4520A] text-sm font-bold text-white';
  }
  if (rank === 2) {
    return 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#D4520A] text-sm font-semibold text-[#D4520A] dark:border-[#FF6B35] dark:text-[#FF6B35]';
  }
  if (rank === 3) {
    return 'w-6 shrink-0 text-center text-sm font-semibold text-[#D4520A] dark:text-[#FF6B35]';
  }
  return 'w-6 shrink-0 text-center text-sm font-normal text-gray-400 dark:text-gray-500';
}

// 热度标签：复用 label/heatLevel 字段，「爆」用强调色、「热」用品牌色
function heatLabel(
  item: HotItem,
): { text: string; className: string } | null {
  if (item.heatLevel === 'normal') return null;
  const text = item.label ?? (item.heatLevel === 'explosive' ? '爆' : '热');
  const className =
    item.heatLevel === 'explosive' ? 'text-accent' : 'text-brand';
  return { text, className };
}

function HotCardSkeleton() {
  return (
    <article className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 h-7 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <ol className="m-0 flex-1 list-none space-y-1 p-0">
        {Array.from({ length: 5 }, (_, i) => (
          <li
            key={i}
            className="flex items-center gap-2 border-b border-gray-100 py-1.5 last:border-none dark:border-gray-800"
          >
            <div className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 flex-1 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-12 shrink-0 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </li>
        ))}
      </ol>
      <div className="mt-3 h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
    </article>
  );
}

function HotCardError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <article className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
      <p className="m-0 text-sm text-gray-500 dark:text-gray-400">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-[44px] rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        点击重试
      </button>
    </article>
  );
}

function HotCardEmpty() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
        className="h-8 w-8 text-gray-300 dark:text-gray-600"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z"
        />
      </svg>
      <p className="m-0 text-sm text-gray-400 dark:text-gray-500">暂无数据</p>
    </div>
  );
}

function HotCard({ loading = false, error = null, data, onRetry, cacheHit, previewCount }: HotCardProps) {
  if (loading) {
    return <HotCardSkeleton />;
  }
  if (error) {
    return <HotCardError message={error} onRetry={onRetry} />;
  }
  if (!data) {
    return <HotCardError message="该内容暂时无法加载" onRetry={onRetry} />;
  }
  if (data.status === 'error') {
    return <HotCardError message={data.error ?? '加载失败'} onRetry={onRetry} />;
  }

  const degraded = data.status === 'degraded';
  const updatedAt = latestUpdatedAt(data.items);
  const isEmpty = data.items.length === 0;
  const platformColor = PLATFORM_COLORS[data.platform] ?? '#888888';
  const shownItems = previewCount ? data.items.slice(0, previewCount) : data.items;

  return (
    <article
      className={`relative flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${
        degraded && !isEmpty ? 'opacity-60 grayscale' : ''
      }`}
    >
      {data.isMock && !isEmpty && (
        <span className="absolute right-3 top-3 rounded border border-brand/40 bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-dark dark:border-brand/50 dark:text-brand">
          示例数据
        </span>
      )}

      <header className="mb-3">
        <h3 className="text-xl font-bold text-brand">{data.platformName}</h3>
      </header>

      {isEmpty ? (
        <HotCardEmpty />
      ) : (
        <ol className="m-0 flex-1 list-none space-y-1 p-0">
          {shownItems.map((item) => {
            const label = heatLabel(item);
            const pct = Math.max(0, Math.min(100, item.hotValue.normalized));
            return (
              <li
                key={item.id}
                className="border-b border-gray-100 py-1.5 last:border-none dark:border-gray-800"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: platformColor }}
                    aria-hidden="true"
                  />
                  <span className={rankClass(item.rank)}>{item.rank}</span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${data.platformName}第${item.rank}名：${item.title}，热度${item.hotValue.display}`}
                    className="flex min-h-[44px] min-w-0 flex-1 items-center text-sm text-gray-900 hover:text-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:text-gray-100 dark:hover:text-brand"
                  >
                    <span className="min-w-0 truncate">{item.title}</span>
                  </a>
                  {label && (
                    <span
                      className={`shrink-0 text-xs font-semibold ${label.className}`}
                    >
                      {label.text}
                    </span>
                  )}
                  {item.hotValue.display && (
                    <span className="shrink-0 text-xs text-brand-dark dark:text-brand">
                      {item.hotValue.display}
                    </span>
                  )}
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {previewCount !== undefined && !isEmpty && (
        <footer className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-2 text-xs dark:border-gray-800">
          <div className="min-w-0 text-gray-500 dark:text-gray-400">
            {updatedAt && (
              <p
                className="m-0"
                title={
                  cacheHit
                    ? '当前展示的是缓存快照，更新时间保持不变属正常现象'
                    : '数据在缓存有效期内不会重新抓取，更新时间保持不变属正常现象'
                }
              >
                更新于 {formatRelativeTime(updatedAt)}
                {cacheHit && (
                  <span className="ml-1 text-[#D4520A]">（缓存）</span>
                )}
              </p>
            )}
            {degraded && (
              <p role="alert" className="m-0">
                {data.error ?? '数据已降级，展示缓存或示例数据'}
              </p>
            )}
          </div>
          <a
            href={`/platform/${data.platform}`}
            aria-label={`查看${data.platformName}完整榜单`}
            className="inline-flex min-h-[44px] shrink-0 items-center text-brand-dark transition-colors hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:text-brand"
          >
            查看更多
          </a>
        </footer>
      )}
    </article>
  );
}

export default HotCard;
