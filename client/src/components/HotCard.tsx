import type { HotPlatform } from '../types/hot';
import { formatUpdatedAt, latestUpdatedAt } from '../lib/format';

interface HotCardProps {
  platform: HotPlatform;
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

function HotCard({ platform }: HotCardProps) {
  const degraded = platform.status === 'degraded';
  const updatedAt = latestUpdatedAt(platform.items);

  return (
    <article
      className={`relative flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${
        degraded ? 'opacity-60 grayscale' : ''
      }`}
    >
      {platform.isMock && (
        <span className="absolute right-3 top-3 rounded border border-brand/40 bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-dark dark:border-brand/50 dark:text-brand">
          示例数据
        </span>
      )}

      <header className="mb-3">
        <h3 className="text-xl font-bold text-brand">{platform.platformName}</h3>
      </header>

      <ol className="m-0 flex-1 list-none space-y-1 p-0">
        {platform.items.length === 0 ? (
          <li className="py-2 text-sm text-gray-400 dark:text-gray-500">暂无数据</li>
        ) : (
          platform.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 border-b border-gray-100 py-1.5 last:border-none dark:border-gray-800"
            >
              <span className={rankClass(item.rank)}>{item.rank}</span>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 truncate text-sm text-gray-900 hover:text-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:text-gray-100 dark:hover:text-brand"
              >
                {item.title}
              </a>
              {item.hotValue.display && (
                <span className="shrink-0 text-xs text-brand-dark dark:text-brand">
                  {item.hotValue.display}
                </span>
              )}
            </li>
          ))
        )}
      </ol>

      <footer className="mt-3 border-t border-gray-100 pt-2 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
        {updatedAt && <p className="m-0">{formatUpdatedAt(updatedAt)}</p>}
        {degraded && (
          <p role="alert" className="m-0">
            {platform.error ?? '数据已降级，展示缓存或示例数据'}
          </p>
        )}
      </footer>
    </article>
  );
}

export default HotCard;