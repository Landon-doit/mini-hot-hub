import ErrorBoundary from './ErrorBoundary';
import { useComprehensive } from '../hooks/useComprehensive';
import type { ComprehensiveItem } from '../types/hot';
import { PLATFORM_COLORS, PLATFORM_NAMES } from '@shared/constants';

const FALLBACK_MESSAGE = '综合热榜暂时无法加载';

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

function heatPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function ComprehensiveItemRow({
  item,
  rank,
}: {
  item: ComprehensiveItem;
  rank: number;
}) {
  const explosive = item.platformCount >= 3;
  const pct = heatPercent(item.topHotValue.normalized);

  return (
    <li className="border-b border-gray-100 py-3 last:border-none dark:border-gray-800">
      <article className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className={rankClass(rank)}>{rank}</span>
          <h3 className="m-0 min-w-0 flex-1 text-base font-medium leading-snug">
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="text-gray-900 hover:text-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:text-gray-100 dark:hover:text-brand"
            >
              <span className="line-clamp-2">{item.title}</span>
            </a>
          </h3>
          {explosive && (
            <span className="shrink-0 rounded bg-accent px-1.5 py-0.5 text-xs font-bold text-[#1a1a2e]">
              爆
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pl-8">
          {item.mergedFrom.map((platform) => (
            <span
              key={platform}
              className="rounded-full border border-gray-200 px-2 py-0.5 text-xs font-medium dark:border-gray-700"
              style={{ color: PLATFORM_COLORS[platform] ?? '#888888' }}
            >
              {PLATFORM_NAMES[platform]}
            </span>
          ))}
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {item.platformCount} 平台
          </span>
        </div>

        <div className="flex items-center gap-2 pl-8">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${pct}%` }}
            />
          </div>
          {item.topHotValue.display && (
            <span className="shrink-0 text-xs text-brand-dark dark:text-brand">
              {item.topHotValue.display}
            </span>
          )}
        </div>
      </article>
    </li>
  );
}

function ComprehensiveBoardSkeleton() {
  return (
    <ol className="m-0 list-none space-y-1 p-0">
      {Array.from({ length: 6 }, (_, i) => (
        <li
          key={i}
          className="border-b border-gray-100 py-3 last:border-none dark:border-gray-800"
        >
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 flex-1 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="mt-2 flex gap-1.5 pl-8">
            <div className="h-5 w-12 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-5 w-12 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
        </li>
      ))}
    </ol>
  );
}

function ComprehensiveBoardError({ onRetry }: { onRetry: () => void }) {
  return (
    <article
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900"
    >
      <p className="m-0 text-sm text-gray-500 dark:text-gray-400">
        {FALLBACK_MESSAGE}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-[44px] rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        重试
      </button>
    </article>
  );
}

function ComprehensiveBoard() {
  const { data, loading, error, refetch } = useComprehensive();
  const items = data ?? [];

  return (
    <ErrorBoundary message={FALLBACK_MESSAGE} onRetry={refetch}>
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="m-0 mb-3 text-xl font-semibold text-gray-900 dark:text-gray-100">
          综合热榜
        </h2>

        {loading ? (
          <ComprehensiveBoardSkeleton />
        ) : error ? (
          <ComprehensiveBoardError onRetry={refetch} />
        ) : items.length === 0 ? (
          <p className="m-0 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
            暂无数据
          </p>
        ) : (
          <ol className="m-0 list-none p-0">
            {items.map((item, index) => (
              <ComprehensiveItemRow key={item.id} item={item} rank={index + 1} />
            ))}
          </ol>
        )}
      </section>
    </ErrorBoundary>
  );
}

export default ComprehensiveBoard;