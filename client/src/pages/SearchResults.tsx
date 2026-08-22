import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { HotItem, HotPlatform, SearchResponse, SearchResult } from '../types/hot';
import SearchBar from '../components/SearchBar';
import SiteFooter from '../components/SiteFooter';
import { fetchAllHot } from '../api/hot';
import { highlightTitle } from '../lib/highlight';
import { useSearchIndex } from '../lib/minisearch';
import { BRAND } from '../constants/brand';
import { PLATFORM_COLORS } from '@shared/constants';

const BASE = import.meta.env.VITE_API_BASE ?? '';
const CACHE_LIMIT = 50;
const CACHE_TTL_MS = 5 * 60 * 1000;
const INDEX_WAIT_MS = 1500;

type SearchCacheEntry = {
  results: SearchResult[];
  expiresAt: number;
};

type HotRecommendation = {
  platform: HotPlatform;
  item: HotItem;
};

const resultCache = new Map<string, SearchCacheEntry>();

function getCachedResults(query: string): SearchResult[] | undefined {
  const entry = resultCache.get(query);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    resultCache.delete(query);
    return undefined;
  }

  resultCache.delete(query);
  resultCache.set(query, entry);
  return entry.results;
}

function cacheResults(query: string, results: SearchResult[]): void {
  resultCache.delete(query);
  resultCache.set(query, {
    results,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  while (resultCache.size > CACHE_LIMIT) {
    const oldest = resultCache.keys().next().value;
    if (oldest === undefined) break;
    resultCache.delete(oldest);
  }
}

async function fetchServerResults(query: string): Promise<SearchResult[]> {
  const response = await fetch(
    `${BASE}/api/search?q=${encodeURIComponent(query)}&limit=50`,
  );
  if (!response.ok) {
    throw new Error(`Search request failed with HTTP ${response.status}`);
  }

  const body = (await response.json()) as SearchResponse;
  if (!body.success || !Array.isArray(body.data?.items)) {
    throw new Error('Invalid search response');
  }
  return body.data.items.map((item) => ({
    ...item,
    title: decodeServerTitle(item.title),
  }));
}

function decodeServerTitle(title: string): string {
  return title
    .replace(/<strong>/g, '')
    .replace(/<\/strong>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function getRecommendations(platforms: HotPlatform[]): HotRecommendation[] {
  return platforms.flatMap((platform) =>
    platform.items.slice(0, 5).map((item) => ({ platform, item })),
  );
}

function formatHeat(heat: number): string {
  if (!Number.isFinite(heat)) return '--';
  if (heat >= 100_000_000) return `${(heat / 100_000_000).toFixed(1)}亿`;
  if (heat >= 10_000) return `${(heat / 10_000).toFixed(1)}万`;
  return heat.toLocaleString('zh-CN');
}

function PlatformTag({ platform, name }: { platform: string; name: string }) {
  return (
    <span
      className="shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{
        borderColor: PLATFORM_COLORS[platform] ?? '#888888',
        color: PLATFORM_COLORS[platform] ?? '#888888',
      }}
    >
      {name}
    </span>
  );
}

function SearchResultRow({ result, query }: { result: SearchResult; query: string }) {
  return (
    <li className="border-b border-gray-100 py-4 last:border-none dark:border-gray-800">
      <article className="flex items-start gap-3">
        <PlatformTag platform={result.platform} name={result.platformName} />
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-base font-medium leading-snug">
            <a
              href={result.url}
              target="_blank"
              rel="noreferrer"
              className="text-gray-900 hover:text-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:text-gray-100 dark:hover:text-brand"
            >
              {highlightTitle(result.title, query)}
            </a>
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>热度 {formatHeat(result.heat)}</span>
            {result.isMock && <span className="text-[#D4520A]">示例数据</span>}
          </div>
        </div>
      </article>
    </li>
  );
}

function RecommendationRow({ recommendation }: { recommendation: HotRecommendation }) {
  const { platform, item } = recommendation;
  return (
    <li className="border-b border-gray-100 py-3 last:border-none dark:border-gray-800">
      <article className="flex items-start gap-3">
        <span className="w-6 shrink-0 text-center text-sm text-gray-400">{item.rank}</span>
        <PlatformTag platform={platform.platform} name={platform.platformName} />
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 flex-1 truncate text-sm text-gray-800 hover:text-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:text-gray-200 dark:hover:text-brand"
        >
          {item.title}
        </a>
        <span className="shrink-0 text-xs text-brand-dark dark:text-brand">
          {item.hotValue.display || formatHeat(item.hotValue.raw)}
        </span>
      </article>
    </li>
  );
}

function Recommendations({ items }: { items: HotRecommendation[] }) {
  if (!items.length) return null;
  return (
    <section className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h2 className="m-0 mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">全网热榜</h2>
      <ol className="m-0 list-none p-0">
        {items.map(({ platform, item }) => (
          <RecommendationRow
            key={`${platform.platform}-${item.id}`}
            recommendation={{ platform, item }}
          />
        ))}
      </ol>
    </section>
  );
}

function SearchResults() {
  const [searchParams] = useSearchParams();
  const { ready, loading, search, mount } = useSearchIndex();
  const rawQuery = searchParams.get('q') ?? '';
  const query = rawQuery.trim();
  const validQuery = query.length >= 2 && query.length <= 50;
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [degraded, setDegraded] = useState(false);
  const [recommendations, setRecommendations] = useState<HotRecommendation[]>([]);

  useEffect(() => mount(), [mount]);

  const validationMessage = useMemo(() => {
    if (!query || query.length < 2) return '请输入至少 2 个字符';
    if (query.length > 50) return '搜索关键词不能超过 50 个字符';
    return '';
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    if (!validQuery) {
      setResults([]);
      setStatus('idle');
      setDegraded(false);
      return;
    }

    const cached = getCachedResults(query);
    if (cached !== undefined) {
      setResults(cached);
      setStatus('ready');
      setDegraded(false);
      return;
    }

    setResults([]);
    setStatus('loading');
    setDegraded(false);

    const useServerFallback = async () => {
      try {
        const serverResults = await fetchServerResults(query);
        if (cancelled) return;
        cacheResults(query, serverResults);
        setResults(serverResults);
        setStatus('ready');
      } catch {
        if (cancelled) return;
        setResults([]);
        setStatus('error');
        setDegraded(true);
      }
    };

    if (!ready || loading) {
      const timer = window.setTimeout(() => void useServerFallback(), INDEX_WAIT_MS);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }

    try {
      const clientResults = search(query);
      cacheResults(query, clientResults);
      setResults(clientResults);
      setStatus('ready');
    } catch {
      void useServerFallback();
    }

    return () => {
      cancelled = true;
    };
  }, [loading, query, ready, search, validQuery]);

  useEffect(() => {
    if (!validQuery || (status !== 'ready' && status !== 'error')) {
      setRecommendations([]);
      return;
    }
    if (status === 'ready' && results.length > 0) {
      setRecommendations([]);
      return;
    }

    let cancelled = false;
    void fetchAllHot()
      .then(({ platforms }) => {
        if (!cancelled) setRecommendations(getRecommendations(platforms));
      })
      .catch(() => {
        if (!cancelled) setRecommendations([]);
      });
    return () => {
      cancelled = true;
    };
  }, [results.length, status, validQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="mx-auto flex max-w-[1200px] items-center gap-4 p-4">
          <Link to="/" className="shrink-0 text-lg font-bold text-brand" aria-label="返回首页">
            <img src={BRAND.logo} alt={BRAND.name} width={36} height={36} className="rounded-md object-contain" />
          </Link>
          <div className="min-w-0 flex-1">
            <SearchBar />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-6 py-6">
        {validationMessage ? (
          <p className="m-0 rounded-md border border-border bg-card p-6 text-center text-sm text-muted" role="status">
            {validationMessage}
          </p>
        ) : (
          <>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h1 className="m-0 text-2xl font-semibold text-gray-900 dark:text-gray-100">搜索结果</h1>
                <p className="m-0 mt-1 text-sm text-gray-500 dark:text-gray-400">
                  “{query}”
                  {status === 'ready' && results.length > 0 ? ` · ${results.length} 条` : ''}
                </p>
              </div>
              {loading && status === 'loading' && (
                <span className="text-xs text-gray-500 dark:text-gray-400">正在准备索引…</span>
              )}
            </div>

            {degraded && (
              <div className="mb-4 rounded-md border border-[#D4520A] bg-[#FFF4EE] px-4 py-3 text-sm text-[#D4520A] dark:bg-[#3B2118]" role="alert">
                搜索暂时不可用，正在展示全网热榜
              </div>
            )}

            {status === 'loading' ? (
              <p className="m-0 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted" role="status">
                正在搜索…
              </p>
            ) : status === 'ready' && results.length > 0 ? (
              <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <ol className="m-0 list-none p-0">
                  {results.map((result) => (
                    <SearchResultRow key={`${result.platform}-${result.id}`} result={result} query={query} />
                  ))}
                </ol>
              </section>
            ) : status === 'ready' ? (
              <p className="m-0 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted">
                未找到相关热搜，试试其他关键词
              </p>
            ) : null}

            {(status === 'ready' && results.length === 0) || status === 'error' ? (
              <Recommendations items={recommendations} />
            ) : null}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

export default SearchResults;
